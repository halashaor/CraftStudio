import { EngineUploads } from './uploads.mjs';
import { createServer } from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { EngineStore } from './store.mjs';
import { EngineController } from './controller.mjs';
import { encodeWire, decodeWire, wireVersion } from '../lite/src/runtime/engine-wire.js';
export async function createEngineService({
  database,
  token,
  port = 0,
  allowedOrigins = [],
  store: providedStore,
  controllerOptions = {},
  leaseTimeoutMs = 600000,
  sweepIntervalMs = 60000,
  clock = () => Date.now(),
}) {
  if (typeof token !== 'string' || token.length < 16)
    throw Error('A private service token is required');
  if (
    !Number.isFinite(leaseTimeoutMs) ||
    leaseTimeoutMs <= 0 ||
    !Number.isFinite(sweepIntervalMs) ||
    sweepIntervalMs < 0
  )
    throw Error('Invalid lease timing');
  const store = providedStore || new EngineStore(database),
    owners = new Map(),
    leases = new Map(),
    uploads = new EngineUploads();
  let stopping = false;
  const release = async (id, cancelReplacements = false) => {
    const lease = leases.get(id);
    if (!lease) return false;
    leases.delete(id);
    await uploads.release(id);
    lease.owner.clients--;
    if (!lease.owner.clients) {
      const owner = lease.owner;
      owner.closing = owner.controller
        .then((c) => c.close({ cancelReplacements }))
        .finally(() => {
          if (owners.get(lease.key) === owner) owners.delete(lease.key);
        });
      await owner.closing;
    }
    return true;
  };
  const sweep = async () => {
    let expired = 0;
    for (const [id, lease] of [...leases])
      if (!lease.busy && clock() - lease.lastSeen >= leaseTimeoutMs) {
        await release(id, true);
        expired++;
      }
    return expired;
  };
  const timer =
    sweepIntervalMs > 0 ? setInterval(() => sweep().catch(() => {}), sweepIntervalMs) : null;
  timer?.unref();
  const reply = (response, value, status = 200) => {
    const bytes = encodeWire(value, { version: response.engineWireVersion || 1 });
    response.writeHead(status, {
      'Content-Type': 'application/x-craftstudio-engine',
      'Content-Length': bytes.length,
      'Cache-Control': 'no-store',
    });
    response.end(bytes);
  };
  const server = createServer(async (req, res) => {
    try {
      const address = server.address(),
        hosts = ['127.0.0.1:' + address.port, 'localhost:' + address.port],
        origin = req.headers.origin;
      if (
        !hosts.includes(req.headers.host) ||
        (origin && !allowedOrigins.includes(origin) && origin !== 'http://' + req.headers.host)
      )
        throw Error('Untrusted host/origin');
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type,X-CraftStudio-Token',
        });
        res.end();
        return;
      }
      if (req.headers['x-craftstudio-token'] !== token) {
        reply(res, { error: 'Invalid service token' }, 403);
        return;
      }
      if (req.method !== 'POST' || req.url !== '/rpc') {
        reply(res, { error: 'Unknown endpoint' }, 404);
        return;
      }
      if (stopping) throw Error('Service is stopping');
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      let raw = Buffer.concat(chunks);
      res.engineWireVersion = wireVersion(raw);
      let body = decodeWire(raw);
      if (body.operation === 'open') {
        const key = body.key || 'workspace:' + randomUUID();
        if (typeof key !== 'string' || !key || key.length > 256)
          throw Error('Invalid workspace key');
        if (owners.get(key)?.closing) await owners.get(key).closing;
        if (!owners.has(key)) {
          const owner = {
            clients: 0,
            restored: !!store.db
              .prepare('SELECT key FROM designer_engine_heads WHERE key=?')
              .get(key),
            controller: EngineController.open({ ...controllerOptions, store, key }),
          };
          owners.set(key, owner);
          owner.controller.catch(() => {
            if (owners.get(key) === owner) owners.delete(key);
          });
        }
        const restored =
          !!body.key &&
          !!store.db.prepare('SELECT key FROM designer_engine_heads WHERE key=?').get(key);
        const owner = owners.get(key);
        await owner.controller;
        const lease = randomUUID();
        owner.clients++;
        leases.set(lease, {
          key,
          owner,
          requests: new Map(),
          retired: 0,
          busy: 0,
          lastSeen: clock(),
          uploadCalls: new Map(),
          uploadDescriptors: new Map(),
        });
        reply(res, {
          lease,
          key,
          restored,
          leaseTimeoutMs,
          protocol: 'craftstudio-engine-wire/' + res.engineWireVersion,
        });
        return;
      }
      const lease = leases.get(body.lease);
      if (!lease) throw Error('本地计算会话已释放，请刷新恢复最后确认的场景');
      lease.lastSeen = clock();
      if (body.operation === 'heartbeat') {
        reply(res, { alive: true });
        return;
      }
      if (body.operation === 'close') {
        await release(body.lease, !!body.cancelReplacements);
        reply(res, { closed: true });
        return;
      }
      if (['uploadStart', 'uploadChunk', 'uploadAbort'].includes(body.operation)) {
        lease.busy++;
        try {
          const value =
            body.operation === 'uploadStart'
              ? await uploads.begin(body.lease, body)
              : body.operation === 'uploadChunk'
                ? await uploads.append(body.lease, body)
                : await uploads.discard(body.lease, body.upload);
          reply(res, value || { discarded: true });
        } finally {
          lease.busy--;
          lease.lastSeen = clock();
        }
        return;
      }
      let upload, uploadDescriptor;
      if (body.operation === 'uploadedCall' || body.operation === 'uploadedFileCall') {
        upload = body.upload;
        uploadDescriptor =
          body.operation === 'uploadedFileCall'
            ? createHash('sha256').update(raw).digest('hex')
            : null;
        const bound = lease.uploadCalls.get(upload);
        if (bound) {
          if (lease.uploadDescriptors.get(upload) !== uploadDescriptor)
            throw Error('Upload completion descriptor conflict');
          const request = lease.requests.get(bound);
          if (!request) throw Error('Upload call already acknowledged');
          reply(res, await request.promise);
          return;
        }
        lease.busy++;
        try {
          raw = await uploads.finish(body.lease, upload);
        } finally {
          lease.busy--;
          lease.lastSeen = clock();
        }
        if (body.operation === 'uploadedFileCall') {
          if (
            uploads.get(body.lease, upload).kind !== 'file' ||
            body.action !== 'import' ||
            !body.data ||
            typeof body.data.name !== 'string'
          )
            throw Error('Invalid uploaded file call');
          const fileBytes = raw;
          raw = encodeWire({
            ...body,
            fileSha256: createHash('sha256').update(fileBytes).digest('hex'),
          });
          body = { ...body, operation: 'call', data: { ...body.data, bytes: fileBytes } };
        } else {
          const inner = decodeWire(raw);
          if (inner.operation !== 'call' || inner.lease !== body.lease)
            throw Error('Upload envelope session mismatch');
          body = inner;
        }
      }
      if (
        body.operation !== 'call' ||
        !Number.isSafeInteger(body.id) ||
        body.id < 1 ||
        typeof body.action !== 'string'
      )
        throw Error('Invalid RPC request');
      for (const id of body.ack || []) {
        if (Number.isSafeInteger(id) && id > 0) {
          lease.requests.delete(id);
          for (const [upload, requestId] of lease.uploadCalls)
            if (requestId === id) {
              lease.uploadCalls.delete(upload);
              lease.uploadDescriptors.delete(upload);
            }
          lease.retired = Math.max(lease.retired, id);
        }
      }
      const fingerprint = createHash('sha256').update(raw).digest('hex');
      let request = lease.requests.get(body.id);
      if (request && request.fingerprint !== fingerprint)
        throw Error('RPC id reused with different envelope');
      if (!request) {
        if (body.id <= lease.retired) throw Error('RPC was already acknowledged');
        lease.busy++;
        const stages = [],
          promise = lease.owner.controller
            .then((c) =>
              c.call(body.action, body.data, {
                onTiming: body.trace ? (stage) => stages.push(stage) : undefined,
              }),
            )
            .then(
              (value) => ({ value, ...(body.trace ? { performance: { stages } } : {}) }),
              (error) => ({ error: error.message }),
            )
            .finally(() => {
              lease.busy--;
              lease.lastSeen = clock();
            });
        request = { fingerprint, promise };
        lease.requests.set(body.id, request);
      }
      if (upload) {
        lease.uploadCalls.set(upload, body.id);
        lease.uploadDescriptors.set(upload, uploadDescriptor);
        await uploads.discard(body.lease, upload);
      }
      reply(res, await request.promise);
    } catch (error) {
      if (!res.headersSent) reply(res, { error: error.message }, 400);
      else res.destroy();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return {
    url: 'http://127.0.0.1:' + server.address().port,
    sweep,
    stats: () => ({
      owners: owners.size,
      leases: leases.size,
      busy: [...leases.values()].reduce((n, l) => n + l.busy, 0),
    }),
    async close() {
      stopping = true;
      if (timer) clearInterval(timer);
      await new Promise((resolve) => server.close(resolve));
      await Promise.all(
        [...owners.values()].map(async (owner) => {
          try {
            await (await owner.controller).close();
          } catch {}
        }),
      );
      leases.clear();
      owners.clear();
      await uploads.close();
      if (!providedStore) store.close();
    },
  };
}
