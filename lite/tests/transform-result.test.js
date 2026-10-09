import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { pastePrefab } from '../src/modeling/studio.js';
import { confirmedSelection } from '../src/selection/transform-result.js';
test('paste then move selects actual placement only, even after undo history reaches its limit', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const project = {
    ...emptyProject(),
    size: [80, 8, 32],
    palette: [{ Name: 'minecraft:oak_planks' }, { Name: 'minecraft:glass' }],
    blocks: [
      { pos: [1, 1, 1], state: 0 },
      { pos: [2, 1, 1], state: 0 },
      { pos: [10, 1, 1], state: 1 },
    ],
  };
  await engine.call('import', {
    name: 'fixture.json',
    bytes: new TextEncoder().encode(JSON.stringify(project)).buffer,
  });
  const rpc = async (method, params = {}) => {
    const head = await engine.call('api', { method: 'workspace.describe' });
    return engine.call('api', {
      method,
      params: { workspaceId: head.workspaceId, expectedRevision: head.revision, ...params },
    });
  };
  for (let i = 0; i < 30; i++)
    assert.ok(
      (
        await rpc('edit.apply', {
          operations: [{ type: 'set', pos: [20 + i, 1, 20], state: { Name: 'minecraft:stone' } }],
        })
      ).ok,
    );
  assert.equal((await engine.call('summary')).undo, 30);
  const prefab = await engine.call('copySelection', { min: [1, 1, 1], max: [2, 1, 1] });
  let head = await rpc('workspace.describe');
  const receipt = await engine.call('studio', {
    command: 'paste',
    prefab,
    at: [10, 1, 1],
    overlap: 'empty',
    workspaceId: head.workspaceId,
    expectedRevision: head.revision,
  });
  const selected = confirmedSelection({ mode: 'paste' }, {}, receipt);
  assert.deepEqual(selected.members, [coordKey(11, 1, 1)]);
  assert.deepEqual(selected.min, [11, 1, 1]);
  head = await rpc('workspace.describe');
  await engine.call('studio', {
    command: 'transform',
    ...selected,
    at: [12, 1, 1],
    move: true,
    workspaceId: head.workspaceId,
    expectedRevision: head.revision,
  });
  let blocks = (
    await rpc('scene.getBlocks', {
      positions: [
        [10, 1, 1],
        [11, 1, 1],
        [12, 1, 1],
      ],
    })
  ).value;
  assert.equal(blocks[0].state.Name, 'minecraft:glass');
  assert.equal(blocks[1].state, null);
  assert.equal(blocks[2].state.Name, 'minecraft:oak_planks');
  assert.deepEqual(
    (await rpc('objects.list')).value.find((object) => object.name.includes('粘贴')).min,
    [12, 1, 1],
  );
  await rpc('history.undo');
  await rpc('history.redo');
  assert.deepEqual(
    (await rpc('objects.list')).value.find((object) => object.name.includes('粘贴')).min,
    [12, 1, 1],
  );
  assert.ok((await rpc('history.undo')).ok);
  blocks = (
    await rpc('scene.getBlocks', {
      positions: [
        [10, 1, 1],
        [11, 1, 1],
        [12, 1, 1],
      ],
    })
  ).value;
  assert.equal(blocks[0].state.Name, 'minecraft:glass');
  assert.equal(blocks[1].state.Name, 'minecraft:oak_planks');
  assert.equal(blocks[2].state, null);
  assert.ok((await rpc('history.undo')).ok);
  assert.equal((await rpc('scene.getBlocks', { positions: [[11, 1, 1]] })).value[0].state, null);
});
test('paste membership excludes protection skips and identical no-op cells', () => {
  const site = new Site({
    ...emptyProject(),
    size: [32, 8, 32],
    palette: [{ Name: 'minecraft:glass' }],
    blocks: [{ pos: [10, 1, 1], state: 0 }],
  });
  const prefab = {
    schema: 'craftstudio-prefab/1',
    name: 'Two blocks',
    size: [3, 1, 1],
    palette: [{ Name: 'minecraft:oak_planks' }, { Name: 'minecraft:glass' }],
    blocks: [
      { pos: [0, 0, 0], state: { Name: 'minecraft:glass' } },
      { pos: [1, 0, 0], state: { Name: 'minecraft:oak_planks' } },
      { pos: [2, 0, 0], state: { Name: 'minecraft:oak_planks' } },
    ],
  };
  site.design.objects.push({
    id: 'locked',
    name: 'Locked',
    locked: true,
    min: [11, 1, 1],
    max: [11, 1, 1],
    cells: [coordKey(11, 1, 1)],
  });
  assert.equal(
    pastePrefab(
      site,
      prefab,
      [10, 1, 1],
      { overlap: 'overwrite' },
      { skipLocked: true, allowExisting: true },
    ),
    1,
  );
  assert.deepEqual(site.design.objects.at(-1).cells, [coordKey(12, 1, 1)]);
});
test('normal copy/move selection keeps transformed exact members and quarter-turn extents', () => {
  const selection = confirmedSelection(
    {
      mode: 'copy',
      size: [3, 2, 2],
      relativeMembers: [
        [0, 0, 0],
        [2, 1, 1],
      ],
    },
    { turn: 1, at: [10, 4, 20], extent: [2, 2, 3] },
    {},
  );
  assert.deepEqual(selection, {
    min: [10, 4, 20],
    max: [11, 5, 22],
    members: [
      [11, 4, 20],
      [10, 5, 22],
    ],
  });
});

test('confirming a modeled feature at the history limit still undoes in one step', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const rpc = async (method, params = {}) => {
    const head = await engine.call('api', { method: 'workspace.describe' });
    return engine.call('api', {
      method,
      params: { workspaceId: head.workspaceId, expectedRevision: head.revision, ...params },
    });
  };
  for (let i = 0; i < 30; i++)
    assert.ok(
      (
        await rpc('edit.apply', {
          operations: [{ type: 'set', pos: [20 + i, 1, 20], state: { Name: 'minecraft:stone' } }],
        })
      ).ok,
    );
  const draft = await engine.call('prepareConstruction', {
    type: 'geometry',
    config: {
      kind: 'box',
      points: [
        [5, 1, 5],
        [5, 1, 5],
      ],
      fill: true,
      width: 1,
      height: 1,
      state: { Name: 'minecraft:oak_planks' },
      guidesOnly: false,
    },
    policy: {},
  });
  await engine.call('commitConstruction', { id: draft.id, policy: {} });
  assert.equal(
    (await rpc('scene.getBlocks', { positions: [[5, 1, 5]] })).value[0].state.Name,
    'minecraft:oak_planks',
  );
  assert.ok((await rpc('history.undo')).ok);
  assert.equal((await rpc('scene.getBlocks', { positions: [[5, 1, 5]] })).value[0].state, null);
  assert.ok((await rpc('history.redo')).ok);
  assert.equal(
    (await rpc('scene.getBlocks', { positions: [[5, 1, 5]] })).value[0].state.Name,
    'minecraft:oak_planks',
  );
});
