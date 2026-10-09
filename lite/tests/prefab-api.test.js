import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
const definition = {
  schema: 'craftstudio-prefab/1',
  name: 'Mod window',
  size: [3, 1, 1],
  palette: [{ Name: 'other_mod:frame', Properties: { facing: 'north' } }],
  tags: ['窗'],
  blocks: [
    { pos: [0, 0, 0], state: 0, nbt: { t: 10, v: { seed: { t: 4, v: '9223372036854775807' } } } },
    { pos: [1, 0, 0], state: 0 },
    { pos: [2, 0, 0], state: 0 },
  ],
};
async function setup(t) {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const rpc = async (method, params = {}, id) => {
    const head = await engine.call('api', { method: 'workspace.describe' });
    return engine.call('api', {
      id,
      method,
      params: { workspaceId: head.workspaceId, expectedRevision: head.revision, ...params },
    });
  };
  return { engine, rpc };
}
test('prefab API lists metadata, pages normalized states and preserves arbitrary typed data', async (t) => {
  const { rpc } = await setup(t);
  assert.ok((await rpc('workspace.describe')).value.methods.includes('prefabs.place'));
  const put = await rpc('prefabs.put', { prefab: definition });
  assert.ok(put.ok, put.error?.message);
  assert.equal(put.value.blockCount, 3);
  const list = await rpc('prefabs.list', { category: '窗' });
  assert.equal(list.value.items.length, 1);
  assert.equal(list.value.items[0].blocks, undefined);
  const first = await rpc('prefabs.read', { id: put.value.id, limit: 1 });
  assert.equal(first.value.prefab.blocks[0].state.Name, 'other_mod:frame');
  assert.equal(first.value.prefab.blocks[0].nbt.v.seed.v, '9223372036854775807');
  assert.equal(first.value.nextCursor, '1');
  const second = await rpc('prefabs.read', {
    id: put.value.id,
    cursor: first.value.nextCursor,
    limit: 2,
  });
  assert.equal(second.value.prefab.blocks.length, 2);
  assert.equal(second.value.nextCursor, null);
  const replaced = await rpc('prefabs.put', {
    id: put.value.id,
    prefab: { ...definition, name: undefined, tags: undefined },
  });
  assert.equal(replaced.value.name, 'Mod window');
  assert.deepEqual(replaced.value.tags, ['窗']);
});
test('capture uses exact world-space members and placement respects world offset', async (t) => {
  const { engine, rpc } = await setup(t);
  await engine.call('origin', { origin: [100, 64, -50], confirmed: true });
  assert.ok(
    (
      await rpc('edit.apply', {
        operations: [
          { type: 'set', pos: [3, 2, 4], state: { Name: 'minecraft:oak_planks' } },
          { type: 'set', pos: [4, 2, 4], state: { Name: 'minecraft:glass' } },
        ],
      })
    ).ok,
  );
  const captured = await rpc('prefabs.put', {
    name: 'One member',
    space: 'world',
    selection: { min: [103, 66, -46], max: [104, 66, -46], members: [[103, 66, -46]] },
  });
  assert.ok(captured.ok, captured.error?.message);
  assert.equal(captured.value.blockCount, 1);
  const placed = await rpc('prefabs.place', {
    id: captured.value.id,
    space: 'world',
    at: [110, 66, -46],
  });
  assert.ok(placed.ok, placed.error?.message);
  assert.equal(placed.value.blocks, 1);
  const blocks = (
    await rpc('scene.getBlocks', {
      positions: [
        [10, 2, 4],
        [11, 2, 4],
      ],
    })
  ).value;
  assert.equal(blocks[0].state.Name, 'minecraft:oak_planks');
  assert.equal(blocks[1].state, null);
});
test('library put and placement stage together and commit as one replay-safe undo step', async (t) => {
  const { engine, rpc } = await setup(t),
    tx = (await rpc('transaction.begin')).value.transactionId;
  const put = await rpc('prefabs.put', { prefab: definition, transactionId: tx });
  assert.ok(put.ok);
  assert.equal(put.value.staged, true);
  assert.equal((await rpc('prefabs.list')).value.total, 0);
  assert.ok(
    (await rpc('prefabs.place', { id: put.value.id, at: [10, 1, 1], transactionId: tx })).ok,
  );
  assert.equal((await rpc('scene.getBlocks', { positions: [[10, 1, 1]] })).value[0].state, null);
  const head = await rpc('workspace.describe');
  const request = {
    id: 'commit-once',
    method: 'transaction.commit',
    params: { transactionId: tx, workspaceId: head.workspaceId, expectedRevision: head.revision },
  };
  const commit = await engine.call('api', request);
  assert.ok(commit.ok);
  const repeated = await engine.call('api', request);
  assert.equal(repeated.ok, true);
  assert.equal(repeated.revision, commit.revision);
  assert.equal((await rpc('prefabs.list')).value.total, 1);
  assert.ok((await rpc('history.undo')).ok);
  assert.equal((await rpc('prefabs.list')).value.total, 0);
  assert.equal((await rpc('scene.getBlocks', { positions: [[10, 1, 1]] })).value[0].state, null);
});
test('failed imports and locked placement are atomic; removing definitions keeps independent placed blocks', async (t) => {
  const { rpc } = await setup(t);
  const bad = await rpc('prefabs.put', { prefab: { ...definition, palette: [] } });
  assert.equal(bad.ok, false);
  assert.equal((await rpc('prefabs.list')).value.total, 0);
  const put = await rpc('prefabs.put', { prefab: definition });
  assert.ok(
    (
      await rpc('edit.apply', {
        operations: [{ type: 'set', pos: [10, 1, 1], state: { Name: 'minecraft:glass' } }],
      })
    ).ok,
  );
  assert.ok(
    (
      await rpc('objects.put', {
        object: { id: 'locked', name: 'Protected', locked: true, cells: [[10, 1, 1]] },
      })
    ).ok,
  );
  const rejected = await rpc('prefabs.place', {
    id: put.value.id,
    at: [10, 1, 1],
    overlap: 'overwrite',
  });
  assert.equal(rejected.ok, false);
  assert.equal((await rpc('scene.getBlocks', { positions: [[11, 1, 1]] })).value[0].state, null);
  assert.ok((await rpc('prefabs.place', { id: put.value.id, at: [20, 1, 1] })).ok);
  assert.ok((await rpc('prefabs.put', { id: put.value.id, name: 'Renamed', tags: ['结构'] })).ok);
  assert.ok((await rpc('prefabs.remove', { id: put.value.id })).ok);
  assert.equal((await rpc('prefabs.list')).value.total, 0);
  assert.equal(
    (await rpc('scene.getBlocks', { positions: [[20, 1, 1]] })).value[0].state.Name,
    'other_mod:frame',
  );
});
