import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineStore } from '../../local-engine/store.mjs';
import { createEngineService } from '../../local-engine/service.mjs';
import { encodeWire, decodeWire } from '../src/runtime/engine-wire.js';
import { WorkerSession } from '../src/runtime/worker-session.js';
import { RemoteEngineWorker } from '../src/runtime/remote-worker.js';
import { emptyProject, importNBT } from '../src/minecraft/codec.js';
const token = 'synthetic-service-test-token';
test('planning API retries survive new RPC envelopes and reconnect with the original typed acknowledgement', async () => {
  const s = await setup();
  try {
    let lease = await s.rpc({ operation: 'open', key: 'planning-replay' }),
      sequence = 0;
    const call = async (data) =>
      (await s.rpc({ operation: 'call', lease: lease.lease, id: ++sequence, action: 'api', data }))
        .value;
    const head = await call({ method: 'workspace.describe' });
    const prepare = {
      id: 'prepare-api',
      method: 'proposal.prepare',
      params: {
        workspaceId: head.workspaceId,
        expectedRevision: head.revision,
        operations: [{ type: 'set', pos: [2, 1, 2], state: { Name: 'example:detail' } }],
      },
    };
    const first = await call(prepare);
    assert.ok(first.ok);
    assert.deepEqual(await call(prepare), first);
    const commit = {
      id: 'commit-api',
      method: 'proposal.commit',
      params: {
        workspaceId: head.workspaceId,
        expectedRevision: head.revision,
        proposalId: first.value.id,
      },
    };
    const result = await call(commit);
    assert.ok(result.ok);
    assert.deepEqual(await call(commit), result);
    await s.rpc({ operation: 'close', lease: lease.lease });
    lease = await s.rpc({ operation: 'open', key: 'planning-replay' });
    assert.deepEqual(await call(commit), result);
    assert.equal((await call({ method: 'workspace.describe' })).value.history.undo, 1);
    assert.equal((await call(prepare)).error.code, 'REVISION_CONFLICT');
  } finally {
    await s.close();
  }
});
async function setup() {
  const store = new EngineStore(':memory:'),
    service = await createEngineService({
      store,
      token,
      allowedOrigins: ['http://localhost:18910'],
    });
  const rpc = async (body) => {
    const r = await fetch(service.url + '/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-craftstudio-engine', 'X-CraftStudio-Token': token },
      body: encodeWire(body),
    });
    return decodeWire(await r.arrayBuffer());
  };
  return {
    store,
    service,
    rpc,
    close: async () => {
      await service.close();
      store.close();
    },
  };
}
test('authenticated shared leases use one controller and repeated RPC cannot mutate twice', async () => {
  const s = await setup();
  try {
    let r = await fetch(s.service.url + '/rpc', {
      method: 'POST',
      body: encodeWire({ operation: 'open' }),
    });
    assert.equal(r.status, 403);
    r = await fetch(s.service.url + '/rpc', {
      method: 'POST',
      headers: { 'X-CraftStudio-Token': token, Origin: 'https://untrusted.example' },
      body: encodeWire({ operation: 'open' }),
    });
    assert.equal(r.status, 400);
    const a = await s.rpc({ operation: 'open', key: 'shared' }),
      b = await s.rpc({ operation: 'open', key: 'shared' });
    const d = (
        await s.rpc({
          operation: 'call',
          lease: a.lease,
          id: 1,
          action: 'api',
          data: { method: 'workspace.describe' },
        })
      ).value,
      request = {
        operation: 'call',
        lease: a.lease,
        id: 2,
        action: 'api',
        data: {
          method: 'edit.apply',
          params: {
            expectedRevision: d.revision,
            operations: [{ type: 'set', pos: [2, 1, 2], state: { Name: 'minecraft:bricks' } }],
          },
        },
      };
    const edited = await s.rpc(request);
    assert.ok(edited.value.ok);
    assert.deepEqual(await s.rpc(request), edited);
    const shared = (
      await s.rpc({
        operation: 'call',
        lease: b.lease,
        id: 1,
        action: 'api',
        data: { method: 'workspace.describe' },
      })
    ).value;
    assert.equal(shared.revision, edited.value.revision);
    assert.equal(shared.value.history.undo, 1);
    await s.rpc({ operation: 'close', lease: a.lease });
    assert.ok((await s.rpc({ operation: 'call', lease: b.lease, id: 2, action: 'summary' })).value);
    await s.rpc({ operation: 'close', lease: b.lease });
    const c = await s.rpc({ operation: 'open', key: 'shared' });
    assert.equal(
      (
        await s.rpc({
          operation: 'call',
          lease: c.lease,
          id: 1,
          action: 'api',
          data: { method: 'workspace.describe' },
        })
      ).value.value.history.undo,
      1,
    );
  } finally {
    await s.close();
  }
});
test('browser Worker adapter retains typed meshes and staged replacement over actual HTTP', async () => {
  const s = await setup(),
    session = new WorkerSession(() => new RemoteEngineWorker({ url: s.service.url, token }));
  try {
    const p = emptyProject();
    p.size = [8, 8, 8];
    p.palette = [{ Name: 'minecraft:stone' }];
    p.blocks = [{ pos: [2, 1, 2], state: 0 }];
    await session.call('import', {
      name: 'fixture.json',
      bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
    });
    const mesh = await session.call('meshChunks', {
      mode: 'after',
      cut: 4095,
      plants: true,
      showGround: true,
      showExisting: true,
    });
    assert.ok(mesh.chunks[0].buckets[0].positions instanceof Float32Array);
    const before = await session.call('api', { method: 'workspace.describe' });
    await assert.rejects(
      session.call('import', {
        name: 'bad.json',
        bytes: new TextEncoder().encode('broken').buffer,
      }),
    );
    assert.equal(
      (await session.call('api', { method: 'workspace.describe' })).workspaceId,
      before.workspaceId,
    );
    const nbt = await session.call('export', { kind: 'full' });
    assert.ok(nbt instanceof Uint8Array);
    assert.equal(importNBT(nbt, 'export').blocks.length, 1);
  } finally {
    session.dispose(session.active);
    await s.close();
  }
});
test('response loss retries the exact transport request and acknowledged IDs cannot execute again', async () => {
  const s = await setup();
  let drop = false;
  const worker = new RemoteEngineWorker({
      url: s.service.url,
      token,
      fetcher: async (...args) => {
        const response = await fetch(...args);
        if (drop) {
          drop = false;
          await response.arrayBuffer();
          throw Error('simulated response loss');
        }
        return response;
      },
    }),
    session = new WorkerSession(() => worker);
  try {
    const d = await session.call('api', { method: 'workspace.describe' });
    drop = true;
    assert.ok(
      (
        await session.call('api', {
          method: 'edit.apply',
          params: {
            expectedRevision: d.revision,
            operations: [{ type: 'set', pos: [2, 1, 2], state: { Name: 'minecraft:stone' } }],
          },
        })
      ).ok,
    );
    assert.equal(
      (await session.call('api', { method: 'workspace.describe' })).value.history.undo,
      1,
    );
    const old = { operation: 'call', lease: worker.session.lease, id: 2, action: 'summary' };
    assert.ok((await s.rpc(old)).error);
  } finally {
    session.dispose(session.active);
    await s.close();
  }
});
test('legacy clients receive a legacy reply without changing the session protocol', async () => {
  const s = await setup();
  try {
    const response = await fetch(s.service.url + '/rpc', {
        method: 'POST',
        headers: { 'X-CraftStudio-Token': token },
        body: encodeWire({ operation: 'open' }, { version: 1 }),
      }),
      bytes = new Uint8Array(await response.arrayBuffer());
    assert.equal(bytes[0], 31);
    assert.equal(decodeWire(bytes).protocol, 'craftstudio-engine-wire/1');
  } finally {
    await s.close();
  }
});
test(
  'closing the last HTTP lease cancels an unconfirmed import and preserves its committed head',
  { timeout: 5000 },
  async () => {
    const store = new EngineStore(':memory:');
    let block = false,
      entered;
    const reached = new Promise((r) => (entered = r)),
      service = await createEngineService({
        store,
        token,
        controllerOptions: {
          beforeCommit: () => {
            if (block) {
              entered();
              return new Promise(() => {});
            }
          },
        },
      });
    const rpc = async (body) =>
      decodeWire(
        await (
          await fetch(service.url + '/rpc', {
            method: 'POST',
            headers: { 'X-CraftStudio-Token': token },
            body: encodeWire(body),
          })
        ).arrayBuffer(),
      );
    try {
      const lease = await rpc({ operation: 'open', key: 'cancel-test' }),
        before = store.load('cancel-test').head;
      block = true;
      const p = emptyProject();
      p.name = 'Unconfirmed import';
      const pending = rpc({
        operation: 'call',
        lease: lease.lease,
        id: 1,
        action: 'import',
        data: { name: 'fixture.json', bytes: new TextEncoder().encode(JSON.stringify(p)).buffer },
      });
      await reached;
      assert.equal(
        (await rpc({ operation: 'close', lease: lease.lease, cancelReplacements: true })).closed,
        true,
      );
      assert.ok((await pending).error);
      assert.equal(store.load('cancel-test').head.workspaceId, before.workspaceId);
      assert.equal(store.load('cancel-test').head.site.title, before.site.title);
    } finally {
      await service.close();
      store.close();
    }
  },
);
test('heartbeats retain an observed scene, abandoned leases expire and reopening preserves committed data', async () => {
  const store = new EngineStore(':memory:');
  let now = 0;
  const service = await createEngineService({
    store,
    token,
    clock: () => now,
    leaseTimeoutMs: 1000,
    sweepIntervalMs: 0,
  });
  const rpc = async (body) =>
    decodeWire(
      await (
        await fetch(service.url + '/rpc', {
          method: 'POST',
          headers: { 'X-CraftStudio-Token': token },
          body: encodeWire(body),
        })
      ).arrayBuffer(),
    );
  try {
    const a = await rpc({ operation: 'open', key: 'idle' }),
      b = await rpc({ operation: 'open', key: 'idle' });
    const d = (
      await rpc({
        operation: 'call',
        lease: a.lease,
        id: 1,
        action: 'api',
        data: { method: 'workspace.describe' },
      })
    ).value;
    assert.ok(
      (
        await rpc({
          operation: 'call',
          lease: a.lease,
          id: 2,
          action: 'api',
          data: {
            method: 'edit.apply',
            params: {
              expectedRevision: d.revision,
              operations: [{ type: 'set', pos: [2, 1, 2], state: { Name: 'minecraft:bricks' } }],
            },
          },
        })
      ).value.ok,
    );
    now = 900;
    assert.equal((await rpc({ operation: 'heartbeat', lease: a.lease })).alive, true);
    now = 1100;
    assert.equal(await service.sweep(), 1);
    assert.deepEqual(service.stats(), { owners: 1, leases: 1, busy: 0 });
    assert.ok((await rpc({ operation: 'call', lease: b.lease, id: 1, action: 'summary' })).error);
    now = 2000;
    assert.equal(await service.sweep(), 1);
    assert.deepEqual(service.stats(), { owners: 0, leases: 0, busy: 0 });
    const reopened = await rpc({ operation: 'open', key: 'idle' });
    assert.equal(
      (
        await rpc({
          operation: 'call',
          lease: reopened.lease,
          id: 1,
          action: 'api',
          data: { method: 'scene.getBlocks', params: { positions: [[2, 1, 2]] } },
        })
      ).value.value[0].state.Name,
      'minecraft:bricks',
    );
  } finally {
    await service.close();
    store.close();
  }
});
test('idle sweep does not reclaim an accepted in-flight edit', { timeout: 5000 }, async () => {
  const store = new EngineStore(':memory:');
  let now = 0,
    block = false,
    entered,
    release;
  const reached = new Promise((r) => (entered = r)),
    service = await createEngineService({
      store,
      token,
      clock: () => now,
      leaseTimeoutMs: 1000,
      sweepIntervalMs: 0,
      controllerOptions: {
        beforeCommit: () => {
          if (block) {
            entered();
            return new Promise((r) => (release = r));
          }
        },
      },
    });
  const rpc = async (body) =>
    decodeWire(
      await (
        await fetch(service.url + '/rpc', {
          method: 'POST',
          headers: { 'X-CraftStudio-Token': token },
          body: encodeWire(body),
        })
      ).arrayBuffer(),
    );
  try {
    const lease = await rpc({ operation: 'open' }),
      d = (
        await rpc({
          operation: 'call',
          lease: lease.lease,
          id: 1,
          action: 'api',
          data: { method: 'workspace.describe' },
        })
      ).value;
    block = true;
    const pending = rpc({
      operation: 'call',
      lease: lease.lease,
      id: 2,
      action: 'api',
      data: {
        method: 'edit.apply',
        params: {
          expectedRevision: d.revision,
          operations: [{ type: 'set', pos: [2, 1, 2], state: { Name: 'minecraft:stone' } }],
        },
      },
    });
    await reached;
    now = 5000;
    assert.equal(await service.sweep(), 0);
    assert.equal(service.stats().busy, 1);
    release();
    assert.ok((await pending).value.ok);
    assert.equal(await service.sweep(), 0);
    now = 6100;
    assert.equal(await service.sweep(), 1);
    assert.equal(store.load(lease.key).head.revision, d.revision + 1);
  } finally {
    await service.close();
    store.close();
  }
});
test('remote adapter heartbeat renews its lease and termination clears its timer', async () => {
  const s = await setup(),
    worker = new RemoteEngineWorker({ url: s.service.url, token });
  try {
    await worker.ready;
    assert.ok(worker.heartbeatTimer);
    assert.equal((await worker.heartbeat()).alive, true);
    worker.terminate();
    assert.equal(await worker.heartbeat(), undefined);
  } finally {
    worker.terminate();
    await s.close();
  }
});
test('large envelopes use bounded upload requests and complete as the original RPC', async () => {
  const s = await setup();
  let largest = 0,
    slices = 0;
  const factory = () =>
      new RemoteEngineWorker({
        url: s.service.url,
        token,
        uploadThreshold: 256,
        uploadChunkBytes: 128,
        fetcher: async (url, options) => {
          largest = Math.max(largest, options.body.length);
          const body = decodeWire(options.body);
          if (body.operation === 'uploadChunk') slices++;
          return fetch(url, options);
        },
      }),
    session = new WorkerSession(factory);
  try {
    const p = emptyProject();
    p.name = 'Large '.repeat(100);
    const result = await session.call('import', {
      name: 'fixture.json',
      bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
    });
    assert.equal(result.name, p.name);
    assert.ok(slices > 1);
    assert.ok(largest < 1024);
    const d = await session.call('api', { method: 'workspace.describe' });
    assert.ok(d.ok);
  } finally {
    session.dispose(session.active);
    await s.close();
  }
});
test('chunk and completion response loss retry without creating a second imported scene', async () => {
  const s = await setup();
  let lostChunk = false,
    lostCall = false;
  const workers = [],
    factory = () => {
      const worker = new RemoteEngineWorker({
        url: s.service.url,
        token,
        uploadThreshold: 256,
        uploadChunkBytes: 128,
        fetcher: async (url, options) => {
          const body = decodeWire(options.body),
            response = await fetch(url, options);
          if (body.operation === 'uploadChunk' && !lostChunk) {
            lostChunk = true;
            await response.arrayBuffer();
            throw Error('chunk reply lost');
          }
          if (body.operation === 'uploadedCall' && !lostCall) {
            lostCall = true;
            await response.arrayBuffer();
            throw Error('completion reply lost');
          }
          return response;
        },
      });
      workers.push(worker);
      return worker;
    },
    session = new WorkerSession(factory);
  try {
    const p = emptyProject();
    p.name = 'Uploaded '.repeat(100);
    await session.call('import', {
      name: 'fixture.json',
      bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
    });
    assert.equal(s.store.load(workers.at(-1).session.key).sequence, 2);
    assert.equal(lostChunk && lostCall, true);
  } finally {
    session.dispose(session.active);
    await s.close();
  }
});

test('selected Blob imports read bounded slices and lost completion replies retain one scene', async () => {
  const s = await setup();
  let chunks = 0,
    lost = false,
    largest = 0;
  const workers = [],
    factory = () => {
      const worker = new RemoteEngineWorker({
        url: s.service.url,
        token,
        uploadChunkBytes: 128,
        fetcher: async (url, options) => {
          const body = decodeWire(options.body);
          largest = Math.max(largest, options.body.length);
          if (body.operation === 'uploadChunk') {
            chunks++;
            assert.ok(body.bytes.length <= 128);
            assert.match(body.sha256, /^[a-f0-9]{64}$/);
          }
          const response = await fetch(url, options);
          if (body.operation === 'uploadedFileCall' && !lost) {
            lost = true;
            await response.arrayBuffer();
            throw Error('lost file completion');
          }
          return response;
        },
      });
      workers.push(worker);
      return worker;
    },
    session = new WorkerSession(factory);
  const original = Blob.prototype.arrayBuffer;
  Blob.prototype.arrayBuffer = function () {
    assert.ok(this.size <= 128, 'Whole-file read is forbidden');
    return original.call(this);
  };
  try {
    const p = emptyProject();
    p.name = 'Sliced '.repeat(100);
    const result = await session.call('import', {
      name: 'fixture.json',
      file: new Blob([JSON.stringify(p)]),
    });
    assert.equal(result.name, p.name);
    assert.ok(chunks > 1);
    assert.ok(largest < 1024);
    assert.ok(lost);
    assert.equal(s.store.load(workers.at(-1).session.key).sequence, 2);
  } finally {
    Blob.prototype.arrayBuffer = original;
    session.dispose(session.active);
    await s.close();
  }
});

test('cancelling a selected-file slice upload preserves the active scene', async () => {
  const s = await setup();
  let seen, unblock;
  const reached = new Promise((r) => (seen = r)),
    gate = new Promise((r) => (unblock = r));
  const session = new WorkerSession(
    () =>
      new RemoteEngineWorker({
        url: s.service.url,
        token,
        uploadChunkBytes: 128,
        fetcher: async (url, options) => {
          if (decodeWire(options.body).operation === 'uploadChunk') {
            seen();
            await gate;
          }
          return fetch(url, options);
        },
      }),
  );
  try {
    const before = await session.call('api', { method: 'workspace.describe' });
    const pending = session.call('import', {
      name: 'fixture.json',
      file: new Blob([JSON.stringify(emptyProject())]),
    });
    const rejected = assert.rejects(pending, /取消/);
    await reached;
    assert.equal(session.cancel(), true);
    unblock();
    await rejected;
    assert.equal(
      (await session.call('api', { method: 'workspace.describe' })).workspaceId,
      before.workspaceId,
    );
  } finally {
    unblock();
    session.dispose(session.active);
    await s.close();
  }
});

test('file completion retries reject changed names and options', async () => {
  const s = await setup(),
    worker = new RemoteEngineWorker({ url: s.service.url, token, uploadChunkBytes: 128 });
  let completion;
  const original = worker.fetcher;
  worker.fetcher = (url, options) => {
    const body = decodeWire(options.body);
    if (body.operation === 'uploadedFileCall') completion = body;
    return original(url, options);
  };
  try {
    const session = await worker.ready;
    const value = await worker.uploadFile(
      {
        operation: 'call',
        lease: session.lease,
        id: 1,
        action: 'import',
        data: { name: 'fixture.json' },
      },
      new Blob([JSON.stringify(emptyProject())]),
    );
    assert.ok(value.value);
    assert.deepEqual(await worker.request(completion), value);
    await assert.rejects(
      worker.request({ ...completion, data: { name: 'different.json' } }),
      /descriptor conflict/,
    );
    await assert.rejects(
      worker.request({
        operation: 'uploadedCall',
        lease: session.lease,
        upload: completion.upload,
      }),
      /descriptor conflict/,
    );
  } finally {
    worker.terminate();
    await s.close();
  }
});

test('opt-in adapter traces transport and controller stages without recording request data', async () => {
  const s = await setup(),
    worker = new RemoteEngineWorker({ url: s.service.url, token });
  try {
    const session = await worker.ready,
      r = await worker.request({
        operation: 'call',
        lease: session.lease,
        id: 1,
        action: 'summary',
        trace: true,
      }),
      names = r.performance.stages.map((s) => s.stage);
    for (const name of [
      'describe-before',
      'execute',
      'describe-after',
      'transport-encode',
      'transport-headers',
      'transport-read',
      'transport-decode',
    ])
      assert.ok(names.includes(name));
    for (const stage of r.performance.stages) {
      assert.ok(Number.isFinite(stage.ms) && stage.ms >= 0);
      assert.ok(Object.keys(stage).every((key) => ['stage', 'ms', 'bytes', 'blobs'].includes(key)));
    }
    const plain = await worker.request({
      operation: 'call',
      lease: session.lease,
      id: 2,
      action: 'summary',
    });
    assert.equal(plain.performance, undefined);
  } finally {
    worker.terminate();
    await s.close();
  }
});

test('authenticated stored baseline reads are sequence guarded and preserve the live edited scene', async () => {
  const s = await setup();
  try {
    const opened = await s.rpc({ operation: 'open', key: 'baseline-read' }),
      lease = opened.lease;
    let id = 0;
    const call = (action, data = {}) => s.rpc({ operation: 'call', lease, id: ++id, action, data });
    const project = {
      ...emptyProject(),
      size: [32, 4, 4],
      palette: [{ Name: 'minecraft:stone' }],
      blocks: [
        { pos: [1, 1, 1], state: 0 },
        { pos: [17, 1, 1], state: 0 },
      ],
    };
    assert.ok(
      (
        await call('import', {
          name: 'source.json',
          bytes: new TextEncoder().encode(JSON.stringify(project)).buffer,
        })
      ).value,
    );
    const manifest = (await call('storedBaselineManifest')).value;
    assert.equal(manifest.totalBlocks, 2);
    const part = (
      await call('storedBaselineChunks', { chunks: [0], expectedSequence: manifest.sequence })
    ).value;
    assert.equal(part.chunks[0].blocks.length, 1);
    assert.equal(part.chunks[0].blocks[0].pos[0], 1);
    assert.match(
      (await call('storedBaselineChunks', { chunks: [0], expectedSequence: manifest.sequence + 1 }))
        .error,
      /conflict/,
    );
    assert.equal((await call('summary')).value.sourceBlocks, 2);
  } finally {
    await s.close();
  }
});
