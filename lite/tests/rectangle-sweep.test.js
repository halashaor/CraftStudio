import test from 'node:test';
import assert from 'node:assert/strict';
import { featurePlan } from '../src/modeling/features.js';
import { Site } from '../src/core/site.js';
import { emptyProject, exportNBT, importNBT } from '../src/minecraft/codec.js';
const state = { Name: 'minecraft:stone_bricks' },
  roles = {
    slab: { Name: 'minecraft:stone_brick_slab' },
    stairs: { Name: 'minecraft:stone_brick_stairs' },
  };
test('precise half-height rectangle sweeps produce native slab states without mutating inputs', () => {
  const site = new Site(emptyProject()),
    config = {
      operation: 'sweep',
      sweepMode: 'rectangle-fit',
      path: [
        [4, 2, 6.5],
        [10, 2, 6.5],
      ],
      width: 1,
      height: 0.5,
      voxel: 'smart',
      state,
      roles,
    },
    before = site.pack(),
    plan = featurePlan(site, config);
  assert.equal(plan.operations.length, 6);
  assert.ok(
    plan.operations.every(
      (o) => o.state.Name.endsWith('_slab') && o.state.Properties.type === 'bottom',
    ),
  );
  assert.deepEqual(site.pack(), before);
  site.operations(plan.operations, {});
  const decoded = importNBT(exportNBT(site.project()), 'slabs.nbt');
  assert.ok(decoded.blocks.every((b) => decoded.palette[b.state].Properties.type === 'bottom'));
});
test('legacy quick rectangle semantics remain full-block and precise dimensions reject invalid values', () => {
  const site = new Site(emptyProject()),
    base = {
      operation: 'sweep',
      sweepMode: 'rectangle',
      path: [
        [4, 2, 6.5],
        [10, 2, 6.5],
      ],
      width: 1,
      height: 1,
      voxel: 'smart',
      state,
      roles,
    };
  assert.ok(featurePlan(site, base).operations.every((o) => o.state.Name === state.Name));
  for (const height of [0.25, NaN, Infinity, 65])
    assert.throws(() => featurePlan(site, { ...base, sweepMode: 'rectangle-fit', height }), /宽高/);
});

import { EngineWorkspace } from '../../local-engine/workspace.mjs';
test('precise rectangle recipes retain slab properties through shared API undo and portable reopen', async () => {
  const engine = new EngineWorkspace(),
    other = new EngineWorkspace();
  try {
    const d = await engine.call('api', { method: 'workspace.describe' }),
      config = {
        operation: 'sweep',
        sweepMode: 'rectangle-fit',
        path: [
          [4, 2, 6.5],
          [10, 2, 6.5],
        ],
        width: 1,
        height: 0.5,
        voxel: 'smart',
        state,
        roles,
      };
    const prep = await engine.call('api', {
      method: 'construction.prepare',
      params: { type: 'feature', config, expectedRevision: d.revision },
    });
    assert.ok(prep.ok, prep.error?.message);
    const done = await engine.call('api', {
      method: 'construction.commit',
      params: { id: prep.value.id, expectedRevision: d.revision },
    });
    assert.ok(done.ok, done.error?.message);
    const bytes = await engine.call('compressed', { title: 'Thin rectangle' });
    await other.call('import', { name: 'thin.craftlite', bytes: bytes.buffer });
    const read = await other.call('api', { method: 'scene.readRegion' });
    assert.equal(read.value.blocks.length, 6);
    assert.ok(read.value.blocks.every((b) => b.state.Properties.type === 'bottom'));
    assert.equal((await other.call('summary')).design.objects[0].recipe.sweepMode, 'rectangle-fit');
    await engine.call('api', {
      method: 'history.undo',
      params: { expectedRevision: done.revision },
    });
    assert.equal((await engine.call('summary')).add, 0);
  } finally {
    await engine.close();
    await other.close();
  }
});
test('precise rectangle follows spatial bends and emits finite lattice operations', () => {
  const plan = featurePlan(new Site(emptyProject()), {
    operation: 'sweep',
    sweepMode: 'rectangle-fit',
    path: [
      [4, 2, 6.5],
      [10, 4, 6.5],
      [16, 4, 10.5],
    ],
    width: 1,
    height: 0.5,
    voxel: 'smart',
    state,
    roles,
  });
  assert.ok(plan.operations.length > 0);
  assert.ok(plan.operations.every((o) => o.pos.every((n) => Number.isInteger(n) && n >= 0)));
  assert.equal(plan.guideGroups.length, 3);
});
