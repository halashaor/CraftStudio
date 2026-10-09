import test from 'node:test';
import assert from 'node:assert/strict';
import { TransformRepeat } from '../src/selection/transform-repeat.js';
import { confirmedSelection } from '../src/selection/transform-result.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';

test('repeat stores an operation without geometry and does not cross project boundaries', () => {
  const repeat = new TransformRepeat();
  repeat.record(
    {
      workspaceId: 'one',
      mode: 'copy',
      min: [3, 2, 4],
      size: [3, 2, 2],
      relativeMembers: [[0, 0, 0]],
    },
    { at: [8, 2, 4], turn: 1 },
  );
  const recipe = repeat.read('one');
  assert.deepEqual(recipe, { workspaceId: 'one', mode: 'copy', delta: [5, 0, 0], turn: 1 });
  recipe.delta[0] = 999;
  assert.equal(repeat.read('one').delta[0], 5);
  assert.equal(repeat.read('two'), null);
  repeat.clearFor('two');
  assert.equal(repeat.read('one'), null);
});
test('repeat pose applies the same bounding offset and turn to the current selection size', () => {
  const repeat = new TransformRepeat();
  repeat.record({ workspaceId: 'w', mode: 'copy', min: [3, 2, 4] }, { at: [8, 5, 4], turn: 1 });
  const pose = repeat.pose(repeat.read('w'), [5, 2, 3]);
  assert.deepEqual(pose.extent, [3, 2, 5]);
  assert.deepEqual(pose.offset, [4, 3, 1]);
  assert.equal(pose.angle, -Math.PI / 2);
});
test('repeated copy uses newly selected current geometry rather than a captured old prefab', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const repeat = new TransformRepeat();
  const rpc = async (method, params = {}) => {
    const h = await engine.call('api', { method: 'workspace.describe' });
    return engine.call('api', {
      method,
      params: { workspaceId: h.workspaceId, expectedRevision: h.revision, ...params },
    });
  };
  assert.ok(
    (
      await rpc('edit.apply', {
        operations: [{ type: 'set', pos: [1, 1, 1], state: { Name: 'minecraft:oak_planks' } }],
      })
    ).ok,
  );
  let selected = { min: [1, 1, 1], max: [1, 1, 1], members: [[1, 1, 1]] };
  const copy = async (at) => {
    const head = await rpc('workspace.describe'),
      preview = await engine.call('selectionPreview', {
        ...selected,
        geometryOnly: true,
        compactMembers: true,
      });
    const snapshot = {
      ...selected,
      workspaceId: head.workspaceId,
      mode: 'copy',
      size: preview.size,
      relativeMembers: preview.members,
    };
    const pose = { at, extent: preview.size, turn: 0 };
    const receipt = await engine.call('studio', {
      command: 'transform',
      ...selected,
      at,
      move: false,
      workspaceId: head.workspaceId,
      expectedRevision: head.revision,
    });
    repeat.record(snapshot, pose);
    selected = confirmedSelection(snapshot, pose, receipt);
  };
  await copy([5, 1, 1]);
  assert.ok(
    (
      await rpc('edit.apply', {
        operations: [{ type: 'set', pos: [5, 1, 1], state: { Name: 'minecraft:glass' } }],
      })
    ).ok,
  );
  const recipe = repeat.read((await rpc('workspace.describe')).workspaceId);
  await copy(selected.min.map((value, axis) => value + recipe.delta[axis]));
  const blocks = (
    await rpc('scene.getBlocks', {
      positions: [
        [1, 1, 1],
        [5, 1, 1],
        [9, 1, 1],
      ],
    })
  ).value;
  assert.equal(blocks[0].state.Name, 'minecraft:oak_planks');
  assert.equal(blocks[1].state.Name, 'minecraft:glass');
  assert.equal(blocks[2].state.Name, 'minecraft:glass');
  assert.ok((await rpc('history.undo')).ok);
  assert.equal((await rpc('scene.getBlocks', { positions: [[9, 1, 1]] })).value[0].state, null);
});
