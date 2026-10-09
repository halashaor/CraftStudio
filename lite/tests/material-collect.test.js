import test from 'node:test';
import assert from 'node:assert/strict';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { DesignAPI } from '../src/api/design-api.js';
const slab = { Name: 'minecraft:oak_slab', Properties: { type: 'bottom', waterlogged: 'false' } },
  stair = {
    Name: 'minecraft:oak_stairs',
    Properties: { facing: 'east', half: 'top', shape: 'outer_left', waterlogged: 'false' },
  };
test('material collection is readonly and keeps exact shapes within object members', () => {
  const site = new Site({
    ...emptyProject(),
    size: [8, 8, 8],
    palette: [slab, stair, { Name: 'minecraft:dirt' }],
    blocks: [
      { pos: [1, 1, 1], state: 0 },
      { pos: [2, 1, 1], state: 1 },
      { pos: [2, 0, 1], state: 2 },
    ],
  });
  site.design.objects = [
    {
      id: 'part',
      name: 'Part',
      min: [1, 1, 1],
      max: [2, 1, 1],
      cells: [coordKey(1, 1, 1), coordKey(2, 1, 1)],
    },
  ];
  const api = new DesignAPI({ getSite: () => site, resources: () => null }),
    before = site.pack(),
    result = api.execute({
      method: 'materials.collect',
      params: {
        min: [1, 0, 1],
        max: [2, 1, 1],
        members: [
          [1, 1, 1],
          [2, 1, 1],
        ],
        expectedRevision: 0,
        workspaceId: api.workspaceId,
      },
    });
  assert.ok(result.ok);
  assert.equal(result.revision, 0);
  assert.equal(result.value.blockCount, 2);
  assert.deepEqual(
    new Set(result.value.states.map((v) => JSON.stringify(v.state))),
    new Set([JSON.stringify(slab), JSON.stringify(stair)]),
  );
  assert.deepEqual(site.pack(), before);
  assert.equal(
    api.execute({ method: 'materials.collect', params: { expectedRevision: 1 } }).ok,
    false,
  );
});
test('world material collection needs a known origin and localizes members', () => {
  const site = new Site({
    ...emptyProject(),
    size: [8, 8, 8],
    origin: [100, 64, 200],
    metadata: { originConfirmed: true },
    palette: [slab],
    blocks: [{ pos: [1, 1, 1], state: 0 }],
  });
  site.originConfirmed = true;
  const api = new DesignAPI({ getSite: () => site, resources: () => null });
  const result = api.execute({
    method: 'materials.collect',
    params: { space: 'world', min: [101, 65, 201], max: [101, 65, 201], members: [[101, 65, 201]] },
  });
  assert.ok(result.ok, result.error?.message);
  assert.equal(result.value.blockCount, 1);
  assert.deepEqual(result.value.states[0].state, slab);
});

import { EngineWorkspace } from '../../local-engine/workspace.mjs';
test('shared worker exposes the readonly collection contract with counts and full states', async () => {
  const engine = new EngineWorkspace();
  try {
    const p = {
      ...emptyProject(),
      size: [8, 8, 8],
      palette: [slab, stair],
      blocks: [
        { pos: [1, 1, 1], state: 0 },
        { pos: [2, 1, 1], state: 0 },
        { pos: [3, 1, 1], state: 1 },
      ],
    };
    await engine.call('import', {
      name: 'materials.json',
      bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
    });
    const d = await engine.call('api', { method: 'workspace.describe' });
    assert.ok(d.value.methods.includes('materials.collect'));
    const before = await engine.call('summary'),
      result = await engine.call('api', {
        method: 'materials.collect',
        params: {
          min: [1, 1, 1],
          max: [3, 1, 1],
          expectedRevision: d.revision,
          workspaceId: d.workspaceId,
        },
      });
    assert.ok(result.ok, result.error?.message);
    assert.equal(result.value.blockCount, 3);
    assert.equal(result.value.states[0].count, 2);
    assert.deepEqual(result.value.states[0].state, slab);
    assert.deepEqual(await engine.call('summary'), before);
  } finally {
    await engine.close();
  }
});

test('collection merges equivalent palette indices instead of duplicating full states', () => {
  const site = new Site({
    ...emptyProject(),
    size: [4, 4, 4],
    palette: [slab],
    blocks: [
      { pos: [1, 1, 1], state: 0 },
      { pos: [2, 1, 1], state: 0 },
    ],
  });
  site.palette.push(structuredClone(slab));
  site.cells.get(coordKey(2, 1, 1)).state = site.palette.length - 1;
  const api = new DesignAPI({ getSite: () => site, resources: () => null }),
    result = api.execute({
      method: 'materials.collect',
      params: { min: [1, 1, 1], max: [2, 1, 1], all: true },
    });
  assert.ok(result.ok);
  assert.equal(result.value.states.length, 1);
  assert.equal(result.value.states[0].count, 2);
  assert.deepEqual(result.value.states[0].state, slab);
});
