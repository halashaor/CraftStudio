import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { EngineController } from '../../local-engine/controller.mjs';
import { EngineStore } from '../../local-engine/store.mjs';
const read = (engine) => engine.call('api', { method: 'workspace.describe' });
const operations = (positions) =>
  positions.map((x) => ({ type: 'set', pos: [x, 1, 1], state: { Name: 'minecraft:glass' } }));
const request = async (engine, id, method, params = {}) => {
  const head = await read(engine);
  return {
    id,
    method,
    params: { workspaceId: head.workspaceId, expectedRevision: head.revision, ...params },
  };
};
async function workspace(t) {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  return engine;
}
test('proposal receipts share the edit namespace, distinguish zero IDs and never replace a newer candidate on replay', async (t) => {
  const engine = await workspace(t);
  const edit = await request(engine, 'edit-id', 'edit.apply', { operations: operations([1]) });
  const edited = await engine.call('api', edit);
  assert.ok(edited.ok);
  const first = await request(engine, 0, 'proposal.prepare', { operations: operations([3, 4]) });
  const prepared = await engine.call('api', first);
  assert.ok(prepared.ok);
  assert.deepEqual(await engine.call('api', first), prepared);
  const second = await request(engine, '0', 'proposal.prepare', { operations: operations([8]) });
  const current = await engine.call('api', second);
  assert.notEqual(current.value.id, prepared.value.id);
  assert.deepEqual(await engine.call('api', first), prepared);
  assert.equal(
    (await engine.call('api', { method: 'proposal.inspect' })).value.id,
    current.value.id,
  );
  assert.deepEqual(await engine.call('api', edit), edited);
  assert.equal(
    (await engine.call('api', { ...second, id: 'edit-id' })).error.code,
    'REQUEST_ID_REUSED',
  );
  assert.equal(
    (await engine.call('api', { ...second, id: Infinity })).error.code,
    'INVALID_REQUEST_ID',
  );
  assert.equal(
    (await engine.call('api', { ...second, id: 'schema', schema: 'unsupported' })).error.code,
    'UNSUPPORTED_SCHEMA',
  );
  const commit = await request(engine, 'commit-once', 'proposal.commit', {
    proposalId: current.value.id,
  });
  const accepted = await engine.call('api', commit);
  assert.ok(accepted.ok);
  assert.deepEqual(await engine.call('api', commit), accepted);
  assert.equal((await read(engine)).value.history.undo, 2);
  assert.equal(
    (await engine.call('api', { method: 'scene.getBlocks', params: { positions: [[8, 1, 1]] } }))
      .value[0].state.Name,
    'minecraft:glass',
  );
});
test('proposal pages are bound to their candidate and optional source guards are enforced', async (t) => {
  const engine = await workspace(t);
  const first = await engine.call(
    'api',
    await request(engine, 'first', 'proposal.prepare', { operations: operations([1, 2, 3]) }),
  );
  const page = await engine.call('api', { method: 'proposal.inspect', params: { limit: 1 } });
  assert.match(page.value.nextCursor, new RegExp('^' + first.value.id + '@'));
  const next = await engine.call('api', {
    method: 'proposal.inspect',
    params: { cursor: page.value.nextCursor, limit: 1 },
  });
  assert.deepEqual(next.value.operations[0].pos, [2, 1, 1]);
  await engine.call(
    'api',
    await request(engine, 'second', 'proposal.prepare', { operations: operations([8]) }),
  );
  assert.equal(
    (
      await engine.call('api', {
        method: 'proposal.inspect',
        params: { cursor: page.value.nextCursor },
      })
    ).error.code,
    'PROPOSAL_CHANGED',
  );
  assert.equal(
    (
      await engine.call('api', {
        method: 'proposal.inspect',
        params: { cursor: '1', proposalId: first.value.id },
      })
    ).error.code,
    'PROPOSAL_CHANGED',
  );
  assert.equal(
    (await engine.call('api', { method: 'proposal.inspect', params: { workspaceId: 'other' } }))
      .error.code,
    'WORKSPACE_CHANGED',
  );
  assert.equal(
    (await engine.call('api', { method: 'proposal.inspect', params: { expectedRevision: 999 } }))
      .error.code,
    'REVISION_CONFLICT',
  );
  const current = (await engine.call('api', { method: 'proposal.inspect' })).value;
  assert.equal(
    (await engine.call('api', { method: 'proposal.inspect', params: { cursor: current.id + '@' } }))
      .ok,
    false,
  );
  assert.equal(current.total, 1);
  await engine.call(
    'api',
    await request(engine, 'cancel-current', 'proposal.cancel', { proposalId: current.id }),
  );
  assert.equal(
    (
      await engine.call('api', {
        method: 'proposal.inspect',
        params: { cursor: current.id + '@0' },
      })
    ).error.code,
    'PROPOSAL_CHANGED',
  );
  assert.equal(
    (await engine.call('api', { method: 'proposal.inspect', params: { workspaceId: 'other' } }))
      .error.code,
    'WORKSPACE_CHANGED',
  );
});
const geometry = {
  type: 'geometry',
  config: {
    kind: 'rectangle',
    plane: 'xz',
    points: [
      [2, 2, 2],
      [5, 2, 5],
    ],
    state: { Name: 'minecraft:oak_planks' },
    guidesOnly: true,
  },
};
test('construction preparation, cancellation and commitment replay without reviving ended drafts', async (t) => {
  const engine = await workspace(t);
  const first = await request(engine, 'prepare-first', 'construction.prepare', geometry);
  const prepared = await engine.call('api', first);
  assert.ok(prepared.ok);
  assert.equal(prepared.value.buckets, undefined);
  assert.deepEqual(await engine.call('api', first), prepared);
  const second = await request(engine, 'prepare-second', 'construction.prepare', geometry);
  const current = await engine.call('api', second);
  assert.notEqual(current.value.id, prepared.value.id);
  const cancel = await request(engine, 'cancel-old', 'construction.cancel', {
    id: prepared.value.id,
  });
  assert.equal((await engine.call('api', cancel)).value.cancelled, false);
  assert.equal((await read(engine)).value.pending.constructionId, current.value.id);
  const commit = await request(engine, 'build-once', 'construction.commit', {
    id: current.value.id,
  });
  const done = await engine.call('api', commit);
  assert.ok(done.ok);
  assert.deepEqual(await engine.call('api', commit), done);
  assert.deepEqual(await engine.call('api', second), current);
  assert.equal((await read(engine)).value.pending.constructionId, null);
  assert.equal((await read(engine)).value.history.undo, 1);
});
test('durable proposal acknowledgements survive reopening while candidate receipts do not', async (t) => {
  const store = new EngineStore(':memory:');
  let engine = await EngineController.open({ store, key: 'proposal' });
  t.after(async () => {
    await engine.close();
    store.close();
  });
  const prepare = await request(engine, 'transient-prepare', 'proposal.prepare', {
    operations: operations([4]),
  });
  const prepared = await engine.call('api', prepare);
  const commit = await request(engine, 'durable-commit', 'proposal.commit', {
    proposalId: prepared.value.id,
  });
  const result = await engine.call('api', commit);
  assert.ok(result.ok);
  assert.deepEqual(
    store.load('proposal').head.receipts.map(([id]) => id),
    ['durable-commit'],
  );
  await engine.close();
  engine = await EngineController.open({ store, key: 'proposal' });
  assert.deepEqual(await engine.call('api', commit), result);
  assert.equal((await read(engine)).value.history.undo, 1);
  assert.equal((await read(engine)).value.previewActive, false);
  assert.equal((await engine.call('api', prepare)).error.code, 'REVISION_CONFLICT');
});
test('resource replacement uses actual pending state rather than replayed historical task replies', async (t) => {
  const store = new EngineStore(':memory:');
  const engine = await EngineController.open({ store, key: 'pending' });
  t.after(async () => {
    await engine.close();
    store.close();
  });
  const begin = await request(engine, 'begin-old', 'transaction.begin');
  const tx = await engine.call('api', begin);
  await engine.call('api', {
    id: 'abort-old',
    method: 'transaction.abort',
    params: { transactionId: tx.value.transactionId },
  });
  assert.deepEqual(await engine.call('api', begin), tx);
  assert.deepEqual((await read(engine)).value.pending.transactionIds, []);
  await engine.call('resourceLibrary', { files: [] });
  const first = await engine.call(
    'api',
    await request(engine, 'draft-a', 'construction.prepare', geometry),
  );
  const secondRequest = await request(engine, 'draft-b', 'construction.prepare', geometry);
  const second = await engine.call('api', secondRequest);
  await engine.call(
    'api',
    await request(engine, 'cancel-a', 'construction.cancel', { id: first.value.id }),
  );
  await assert.rejects(engine.call('resourceLibrary', { files: [] }), /pending operation/);
  await engine.call(
    'api',
    await request(engine, 'cancel-b', 'construction.cancel', { id: second.value.id }),
  );
  assert.deepEqual(await engine.call('api', secondRequest), second);
  assert.equal((await read(engine)).value.pending.constructionId, null);
  await engine.call('resourceLibrary', { files: [] });
});

test('legacy inline JSON receipts restore and migrate without losing committed state', async (t) => {
  const engine = await workspace(t),
    recovered = await workspace(t);
  const edit = await request(engine, 'legacy-edit', 'edit.apply', { operations: operations([6]) });
  const result = await engine.call('api', edit);
  const packet = await engine.call('engineCapture');
  packet.head.schema = 'craftstudio-engine-checkpoint/2';
  packet.head.receipts = [
    [
      'legacy-edit',
      { fingerprint: JSON.stringify({ method: edit.method, params: edit.params }), result },
    ],
  ];
  await recovered.call('engineRestore', packet);
  assert.deepEqual(await recovered.call('api', edit), result);
  const migrated = await recovered.call('engineCapture');
  assert.equal(migrated.head.schema, 'craftstudio-engine-checkpoint/3');
  assert.equal(typeof migrated.head.receipts[0][1].resultBlob, 'string');
  assert.equal(migrated.head.receipts[0][1].result, undefined);
  assert.equal((await read(recovered)).value.history.undo, 1);
  assert.equal(
    (await recovered.call('api', { method: 'scene.getBlocks', params: { positions: [[6, 1, 1]] } }))
      .value[0].state.Name,
    'minecraft:glass',
  );
});
