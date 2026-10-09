import test from 'node:test';
import assert from 'node:assert/strict';
import { DesignerClient } from '../src/integration/designer-client.js';
const setup = (revision = 3) => {
  const calls = [];
  const head = { workspaceId: 'current', revision, value: { origin: [0, 0, 0] } };
  const page = {
    request: async (request) => {
      calls.push(request);
      return head;
    },
    save: async () => ({ version: 2 }),
    export: async (options) => {
      calls.push(options);
      return Uint8Array.of(1, 2);
    },
  };
  const client = new DesignerClient({
    info: {},
    page,
    context: () => ({}),
    blocked: () => false,
    status: () => {},
  });
  return { client, page, calls, head };
};

test('file import forwards explicit input to the visible page and returns its new workspace', async () => {
  const { client, page, calls } = setup();
  const options = {
    name: 'site.nbt',
    dataBase64: 'AA==',
    workspaceId: 'current',
    expectedRevision: 3,
  };
  page.importFile = async (input) => {
    calls.push(input);
    return { workspaceId: 'new', revision: 0 };
  };
  const result = await client.perform({ operation: 'import', workspaceId: 'current', options });
  assert.equal(result.workspaceId, 'new');
  assert.equal(calls.at(-1), options);
});
test('queued writes never follow a user into another workspace', async () => {
  const { client, calls } = setup();
  await assert.rejects(
    client.perform({
      operation: 'request',
      workspaceId: 'old',
      request: { method: 'edit.apply' },
      options: {},
    }),
    /WORKSPACE_CHANGED/,
  );
  assert.equal(calls.length, 1);
  const result = await client.perform({
    operation: 'request',
    workspaceId: 'old',
    request: { id: 'read', method: 'workspace.describe' },
    options: {},
  });
  assert.equal(result.workspaceId, 'current');
  assert.equal(calls.at(-1).id, 'read');
});
test('busy writes fail before editing while workspace discovery remains available', async () => {
  const { client, calls } = setup();
  client.blocked = () => true;
  await assert.rejects(
    client.perform({ operation: 'save', workspaceId: 'current', options: {} }),
    /DESIGNER_BUSY/,
  );
  assert.equal(calls.length, 0);
  assert.equal(
    (
      await client.perform({
        operation: 'request',
        request: { method: 'workspace.describe' },
        options: {},
      })
    ).revision,
    3,
  );
});
test('exports keep titles read-only and refuse changed metadata between capture and result', async () => {
  const { client, page, calls, head } = setup();
  let result = await client.perform({
    operation: 'export',
    workspaceId: 'current',
    options: { format: 'delivery' },
  });
  assert.deepEqual(result.exported, Uint8Array.of(1, 2));
  assert.equal(calls[1].preserveTitle, true);
  page.export = async () => {
    head.revision++;
    return Uint8Array.of(3);
  };
  await assert.rejects(
    client.perform({ operation: 'export', workspaceId: 'current', options: {} }),
    /导出期间工程已变化/,
  );
});

test('browser fetch is called without binding it to the client instance', async () => {
  const client = new DesignerClient({
    info: { token: 'test' },
    page: {},
    context: () => ({}),
    blocked: () => false,
    status: () => {},
    fetcher,
  });
  async function fetcher(url, options) {
    assert.equal(this, undefined);
    assert.ok(url.endsWith('/heartbeat'));
    assert.equal(options.method, 'POST');
    return { ok: true, json: async () => ({ connected: true }) };
  }
  client.info = { token: 'test' };
  assert.equal((await client.post('heartbeat', { sessionId: 'test' })).connected, true);
});
