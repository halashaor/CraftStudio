import test from 'node:test';
import assert from 'node:assert/strict';
import { renamePlan } from '../src/selection/object-naming.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
test('name preview supports literal replacement, stable spatial numbering and nonrecursive tokens', () => {
  const objects = [
      { id: 'right', name: '窗.{n}', min: [8, 1, 0] },
      { id: 'left', name: '窗.左', min: [3, 1, 0] },
    ],
    before = structuredClone(objects);
  const plan = renamePlan(objects, {
    template: '房_{name}_{n}',
    find: '.',
    replace: '-',
    order: 'x',
    start: 3,
    digits: 2,
  });
  assert.deepEqual(
    plan.map((entry) => entry.name),
    ['房_窗-左_03', '房_窗-{n}_04'],
  );
  assert.deepEqual(objects, before);
  assert.throws(() => renamePlan(objects, { template: '' }), /不能为空/);
  assert.throws(() => renamePlan(objects, { start: -1 }), /有效/);
});
test('bulk naming is atomic, changes no geometry and is one-step undoable with metadata locks intact', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const rpc = async (method, params = {}) => {
    const head = await engine.call('api', { method: 'workspace.describe' });
    return engine.call('api', {
      method,
      params: { workspaceId: head.workspaceId, expectedRevision: head.revision, ...params },
    });
  };
  assert.ok(
    (
      await rpc('edit.apply', {
        operations: [
          { type: 'set', pos: [1, 1, 1], state: { Name: 'minecraft:oak_planks' } },
          { type: 'set', pos: [5, 1, 1], state: { Name: 'minecraft:glass' } },
        ],
      })
    ).ok,
  );
  for (const [id, pos] of [
    ['one', [1, 1, 1]],
    ['two', [5, 1, 1]],
  ])
    assert.ok(
      (
        await rpc('objects.put', {
          object: { id, name: 'Duplicate', cells: [pos], locked: id === 'two' },
        })
      ).ok,
    );
  const original = (await rpc('objects.list')).value,
    beforeBlocks = (
      await rpc('scene.getBlocks', {
        positions: [
          [1, 1, 1],
          [5, 1, 1],
        ],
      })
    ).value;
  assert.equal(
    (
      await rpc('objects.rename', {
        names: [
          { id: 'one', name: 'Wrong partial' },
          { id: 'missing', name: 'Bad' },
        ],
      })
    ).ok,
    false,
  );
  assert.deepEqual((await rpc('objects.list')).value, original);
  const renamed = await rpc('objects.rename', {
    names: [
      { id: 'one', name: '窗_01' },
      { id: 'two', name: '窗_02' },
    ],
  });
  assert.ok(renamed.ok);
  assert.equal(renamed.value.renamed, 2);
  assert.deepEqual(
    (
      await rpc('scene.getBlocks', {
        positions: [
          [1, 1, 1],
          [5, 1, 1],
        ],
      })
    ).value,
    beforeBlocks,
  );
  assert.equal((await rpc('objects.list')).value[1].locked, true);
  assert.ok((await rpc('history.undo')).ok);
  assert.deepEqual((await rpc('objects.list')).value, original);
  assert.ok((await rpc('history.redo')).ok);
  assert.deepEqual(
    (await rpc('objects.list')).value.map((object) => object.name),
    ['窗_01', '窗_02'],
  );
  const tx = (await rpc('transaction.begin')).value.transactionId;
  assert.ok(
    (await rpc('objects.rename', { transactionId: tx, names: [{ id: 'one', name: 'Staged' }] })).ok,
  );
  assert.equal((await rpc('objects.list')).value[0].name, '窗_01');
  assert.ok((await rpc('transaction.commit', { transactionId: tx })).ok);
  assert.equal((await rpc('objects.list')).value[0].name, 'Staged');
});
