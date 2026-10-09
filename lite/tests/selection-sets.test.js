import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
async function setup(t) {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const rpc = async (method, params = {}) => {
    const h = await engine.call('api', { method: 'workspace.describe' });
    return engine.call('api', {
      method,
      params: { workspaceId: h.workspaceId, expectedRevision: h.revision, ...params },
    });
  };
  return { engine, rpc };
}
test('object references track moves, report hidden/missing members and preserve locked inspection', async (t) => {
  const { engine, rpc } = await setup(t);
  await rpc('edit.apply', {
    operations: [
      { type: 'set', pos: [1, 1, 1], state: { Name: 'minecraft:oak_planks' } },
      { type: 'set', pos: [5, 1, 1], state: { Name: 'minecraft:glass' } },
    ],
  });
  await rpc('objects.put', { object: { id: 'one', name: 'One', cells: [[1, 1, 1]] } });
  await rpc('objects.put', {
    object: { id: 'two', name: 'Two', cells: [[5, 1, 1]], locked: true },
  });
  const put = await rpc('selectionSets.put', {
    selectionSet: { name: 'Windows', objectIds: ['one', 'two'] },
  });
  assert.ok(put.ok, put.error?.message);
  assert.ok(
    (
      await rpc('selection.transform', {
        min: [1, 1, 1],
        max: [1, 1, 1],
        members: [[1, 1, 1]],
        at: [10, 1, 1],
        move: true,
      })
    ).ok,
  );
  let resolved = await rpc('selectionSets.resolve', { id: put.value.id });
  assert.deepEqual(resolved.value.objectIds, ['one', 'two']);
  assert.deepEqual(resolved.value.lockedObjectIds, ['two']);
  assert.equal((await rpc('objects.list')).value[0].min[0], 10);
  await rpc('collections.put', {
    collection: { id: 'hide', name: 'Hidden', hidden: true },
    objectIds: ['one'],
  });
  resolved = await rpc('selectionSets.resolve', { id: put.value.id });
  assert.deepEqual(resolved.value.objectIds, ['two']);
  assert.deepEqual(resolved.value.hiddenObjectIds, ['one']);
  await engine.call('studio', {
    command: 'deleteSelection',
    min: [10, 1, 1],
    max: [10, 1, 1],
    members: [[10, 1, 1]],
    policy: {},
  });
  resolved = await rpc('selectionSets.resolve', { id: put.value.id });
  assert.deepEqual(resolved.value.missingObjectIds, ['one']);
});
test('fixed masks, updates and removals are persisted metadata and never delete geometry', async (t) => {
  const { engine, rpc } = await setup(t);
  await rpc('edit.apply', {
    operations: [{ type: 'set', pos: [2, 2, 2], state: { Name: 'minecraft:glass' } }],
  });
  const selection = { min: [1, 1, 1], max: [4, 4, 4], members: [[2, 2, 2]] };
  const put = await rpc('selectionSets.put', { selectionSet: { name: 'Fixed', selection } });
  assert.ok(put.ok);
  const bytes = await engine.call('compressed');
  await engine.call('import', { name: 'sets.craftlite', bytes });
  assert.deepEqual(
    (await rpc('selectionSets.resolve', { id: put.value.id })).value.selection,
    selection,
  );
  assert.ok((await rpc('selectionSets.remove', { id: put.value.id })).ok);
  assert.equal((await rpc('selectionSets.list')).value.length, 0);
  assert.equal(
    (await rpc('scene.getBlocks', { positions: [[2, 2, 2]] })).value[0].state.Name,
    'minecraft:glass',
  );
  await rpc('history.undo');
  assert.equal((await rpc('selectionSets.list')).value.length, 1);
});
