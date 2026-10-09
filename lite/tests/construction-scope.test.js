import test from 'node:test';
import assert from 'node:assert/strict';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { combineSelection, selectionPredicate } from '../src/selection/selection-mask.js';
import { terrainPlan, geometryPlan, surfaceColumns } from '../src/modeling/construction.js';
const materials = new Set([
    'minecraft:stone_bricks',
    'minecraft:stone_brick_slab',
    'minecraft:stone_brick_stairs',
  ]),
  state = { Name: 'minecraft:stone_bricks' };
function land() {
  const p = {
    ...emptyProject(),
    size: [12, 12, 12],
    palette: [
      { Name: 'minecraft:stone' },
      { Name: 'minecraft:water' },
      { Name: 'minecraft:oak_planks' },
    ],
    blocks: [],
  };
  for (let x = 0; x < 7; x++)
    for (let z = 0; z < 5; z++)
      for (let y = 0; y <= x % 3; y++) p.blocks.push({ pos: [x, y, z], state: 0 });
  p.blocks.push({ pos: [5, 4, 4], state: 1 }, { pos: [4, 3, 4], state: 2 });
  return new Site(p);
}
function scope() {
  let r = combineSelection(null, { min: [0, 2, 0], max: [6, 2, 4] });
  return combineSelection(r, { min: [2, 2, 1], max: [3, 2, 2] }, 'subtract');
}
test('terrain footprint masks keep disjoint volumes and holes while ignoring only height', () => {
  const s = land(),
    before = s.pack(),
    selection = scope(),
    plan = terrainPlan(s, {
      min: [0, 0],
      max: [7, 5],
      mode: 'flatten',
      y: 3,
      selectionMode: 'footprint',
      selection,
    });
  const inside = selectionPredicate(selection, { axes: [0, 2] });
  assert.ok(plan.operations.length);
  assert.ok(plan.operations.every((o) => inside(o.pos)));
  assert.ok(plan.operations.some((o) => o.pos[1] !== 2));
  assert.ok(
    !plan.operations.some((o) => o.pos[0] >= 2 && o.pos[0] <= 3 && o.pos[2] >= 1 && o.pos[2] <= 2),
  );
  assert.ok(!plan.operations.some((o) => o.pos[0] === 5 && o.pos[2] === 4));
  assert.ok(!plan.operations.some((o) => o.pos[0] === 4 && o.pos[2] === 4));
  assert.ok(plan.scope.filtered > 0);
  assert.deepEqual(s.pack(), before);
  s.operations(plan.operations, { allowTerrain: true });
  assert.equal(surfaceColumns(s).get(0).ground, 3);
  s.restore('undo');
  assert.deepEqual(s.pack().overlay, before.overlay);
});
test('strict volume masks constrain every fill and cut voxel and give an explicit exclusion report', () => {
  const s = land(),
    selection = scope(),
    plan = terrainPlan(s, {
      min: [0, 0],
      max: [6, 4],
      mode: 'flatten',
      y: 3,
      selectionMode: 'volume',
      selection,
    });
  assert.ok(plan.operations.length);
  assert.ok(plan.operations.every((o) => o.pos[1] === 2));
  assert.ok(plan.warnings.some((w) => w.includes('作用范围外')));
  assert.throws(
    () => terrainPlan(s, { min: [0, 0], max: [1, 1], y: 3, selectionMode: 'footprint' }),
    /选择/,
  );
});
test('path slabs, stairs, supports and earthwork share scope without clipping design guides', () => {
  const s = land(),
    config = {
      kind: 'line',
      points: [
        [0.5, 4, 0.5],
        [6.5, 7, 0.5],
      ],
      plane: 'xz',
      state,
      voxel: 'smart',
      terrain: 'supports',
      spacing: 1,
    },
    selection = { min: [0, 0, 0], max: [1, 10, 0] },
    all = geometryPlan(s, config, materials),
    scoped = geometryPlan(s, { ...config, selectionMode: 'footprint', selection }, materials);
  assert.deepEqual(scoped.guide, all.guide);
  assert.ok(scoped.operations.some((o) => o.reason === '自动落地支撑'));
  assert.ok(scoped.operations.some((o) => /_stairs$|_slab$/.test(o.state.Name)));
  assert.ok(scoped.operations.every((o) => o.pos[0] <= 1 && o.pos[2] === 0));
  assert.ok(scoped.scope.filtered > 0);
  const graded = geometryPlan(
    s,
    { ...config, terrain: 'grade', selectionMode: 'footprint', selection },
    materials,
  );
  assert.ok(graded.operations.every((o) => o.pos[0] <= 1 && o.pos[2] === 0));
});
test('projected exact member operands remain sparse and preserve boolean operation order', () => {
  const r = combineSelection(
      combineSelection(null, {
        min: [0, 1, 0],
        max: [3, 3, 3],
        members: [coordKey(1, 1, 1), coordKey(2, 3, 2)],
      }),
      { min: [1, 3, 1], max: [1, 3, 1], members: [[1, 3, 1]] },
      'subtract',
    ),
    inside = selectionPredicate(r, { axes: [0, 2] });
  assert.equal(inside([1, 0, 1]), false);
  assert.equal(inside([2, 4095, 2]), true);
  assert.equal(inside([3, 0, 3]), false);
});
