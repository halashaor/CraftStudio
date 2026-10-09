import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import {
  emptyProject,
  importNBT,
  exportNBT,
  readNBT,
  tag,
  stateKey,
} from '../src/minecraft/codec.js';
import { gunzipSync, strFromU8 } from 'fflate';

const snapshot = async (engine) =>
  JSON.parse(strFromU8(gunzipSync(await engine.call('compressed')))).site;
const load = (engine, project) =>
  engine.call('import', {
    name: 'blueprint.json',
    bytes: new TextEncoder().encode(JSON.stringify(project)).buffer,
  });
const edit = async (engine, operations) => {
  const head = await engine.call('api', { method: 'workspace.describe' });
  return engine.call('api', {
    method: 'edit.apply',
    params: {
      expectedRevision: head.revision,
      workspaceId: head.workspaceId,
      operations,
      policy: { allowExisting: true, allowTerrain: true },
    },
  });
};

test('160000-block changes export and game-build preparation share exact bounds without mutating the document', async () => {
  const engine = new EngineWorkspace();
  try {
    await load(engine, {
      ...emptyProject('Large design'),
      size: [100, 40, 100],
      origin: [1000, 64, -500],
      metadata: { originConfirmed: true },
      palette: [{ Name: 'minecraft:oak_planks' }],
      blocks: [{ pos: [1, 0, 1], state: 0 }],
    });
    const result = await edit(engine, [
      { type: 'erase', min: [1, 0, 1], max: [1, 0, 1] },
      {
        type: 'fill',
        min: [10, 2, 10],
        max: [89, 26, 89],
        state: {
          Name: 'minecraft:oak_stairs',
          Properties: { facing: 'east', half: 'top', shape: 'straight', waterlogged: 'false' },
        },
      },
    ]);
    assert.ok(result.ok, result.error?.message);
    const before = await snapshot(engine);
    const additions = await engine.call('export', { kind: 'additions' });
    const added = importNBT(additions.bytes, 'Added');
    assert.equal(added.blocks.length, 160000);
    assert.deepEqual(added.size, [80, 25, 80]);
    assert.deepEqual(additions.offsetWorld, [1010, 66, -490]);
    assert.equal(additions.containsAir, false);
    const patch = await engine.call('export', { kind: 'patch' });
    const patched = importNBT(patch.bytes, 'Patch');
    assert.equal(readNBT(patch.bytes).v.blocks.v[1].length, 160001);
    assert.equal(patched.blocks.length, 160000);
    assert.equal(
      patched.metadata.placementMask.eraseRuns.reduce((n, run) => n + run[1], 0),
      1,
    );
    assert.deepEqual(patch.offsetLocal, [1, 0, 1]);
    assert.deepEqual(patched.size, [89, 27, 89]);
    assert.equal(patch.containsAir, true);
    const build = await engine.call('buildProject');
    assert.deepEqual(build.origin, patch.offsetWorld);
    assert.deepEqual(build.size, patched.size);
    assert.deepEqual(readNBT(exportNBT(build)), readNBT(patch.bytes));
    assert.deepEqual(await snapshot(engine), before);
  } finally {
    await engine.close();
  }
});

test('selection blueprint preserves exact members, states, typed block data and selection anchor', async () => {
  const engine = new EngineWorkspace();
  try {
    const nbt = tag(10, {
      id: tag(8, 'minecraft:chest'),
      CustomName: tag(8, '{"text":"工具"}'),
      seed: tag(4, '9223372036854775807'),
    });
    const palette = [
      { Name: 'minecraft:oak_slab', Properties: { type: 'top', waterlogged: 'false' } },
      {
        Name: 'minecraft:chest',
        Properties: { facing: 'north', type: 'single', waterlogged: 'false' },
      },
      { Name: 'minecraft:glass' },
    ];
    await load(engine, {
      ...emptyProject('Selection'),
      size: [16, 16, 16],
      origin: [500, 60, -20],
      metadata: { originConfirmed: true },
      palette,
      blocks: [
        { pos: [4, 2, 4], state: 0 },
        { pos: [6, 2, 4], state: 1, nbt },
        { pos: [5, 2, 4], state: 2 },
      ],
    });
    const before = await snapshot(engine);
    const result = await engine.call('export', {
      kind: 'selection',
      selection: {
        min: [3, 1, 3],
        max: [8, 4, 7],
        members: [
          [4, 2, 4],
          [6, 2, 4],
        ],
      },
    });
    const restored = importNBT(result.bytes, 'Selected');
    assert.deepEqual(restored.size, [6, 4, 5]);
    assert.deepEqual(result.offsetLocal, [3, 1, 3]);
    assert.deepEqual(result.offsetWorld, [503, 61, -17]);
    assert.equal(restored.blocks.length, 2);
    assert.equal(
      restored.palette.some((s) => s.Name === 'minecraft:glass'),
      false,
    );
    assert.equal(stateKey(restored.palette[restored.blocks[0].state]), stateKey(palette[0]));
    assert.deepEqual(restored.blocks[1].nbt, nbt);
    assert.deepEqual(await snapshot(engine), before);
  } finally {
    await engine.close();
  }
});
