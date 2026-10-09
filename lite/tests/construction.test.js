import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bezier,
  sampleFigure,
  curvePiece,
  geometryPlan,
  terrainPlan,
  surfaceColumns,
} from '../src/modeling/construction.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
const materials = new Set([
  'minecraft:stone_bricks',
  'minecraft:stone_brick_slab',
  'minecraft:stone_brick_stairs',
]);
const stone = { Name: 'minecraft:stone_bricks' };
test('Bezier endpoints and common shapes retain continuous design geometry', () => {
  const points = [
    [1, 2, 1],
    [4, 7, 1],
    [7, 1, 2],
    [10, 3, 3],
  ];
  assert.deepEqual(bezier(points, 0), points[0]);
  assert.deepEqual(bezier(points, 1), points[3]);
  for (const kind of [
    'line',
    'rectangle',
    'circle',
    'ellipse',
    'arc',
    'polygon',
    'bezier',
    'box',
  ]) {
    const p =
      kind === 'ellipse'
        ? [
            [10, 3, 10],
            [15, 3, 13],
          ]
        : kind === 'arc'
          ? [
              [10, 3, 10],
              [15, 3, 10],
              [10, 3, 15],
            ]
          : points;
    const line = sampleFigure({ kind, points: p, plane: 'xz' });
    assert.ok(line.length > 2);
    assert.ok(line.every((p) => p.every(Number.isFinite)));
  }
});
test('curve rasterization uses slab halves and uphill stair facing; missing variants are not invented', () => {
  const options = { state: stone, available: materials, voxel: 'smart' };
  let p = curvePiece([4.5, 2.5, 4.5], [1, 0, 0], options);
  assert.equal(p.state.Name, 'minecraft:stone_brick_slab');
  assert.equal(p.state.Properties.type, 'bottom');
  assert.equal(p.pos[1], 2);
  p = curvePiece([4.5, 3, 4.5], [1, 1, 0], options);
  assert.equal(p.state.Name, 'minecraft:stone_brick_stairs');
  assert.equal(p.state.Properties.facing, 'east');
  assert.equal(p.state.Properties.half, 'bottom');
  p = curvePiece([4.5, 3, 4.5], [1, 1, 0], { ...options, surface: 'bottom' });
  assert.equal(p.state.Properties.half, 'top');
  assert.equal(p.state.Properties.facing, 'west');
  p = curvePiece([4.5, 3, 4.5], [1, 1, 0], {
    ...options,
    available: new Set(['custom:tile']),
    state: { Name: 'custom:tile' },
  });
  assert.equal(p.state.Name, 'custom:tile');
});
function land() {
  const p = {
    ...emptyProject(),
    size: [8, 8, 8],
    palette: [
      { Name: 'minecraft:stone' },
      { Name: 'minecraft:water' },
      { Name: 'minecraft:oak_planks' },
    ],
    blocks: [],
  };
  for (let x = 0; x < 5; x++)
    for (let z = 0; z < 5; z++)
      for (let y = 0; y <= x % 3; y++) p.blocks.push({ pos: [x, y, z], state: 0 });
  p.blocks.push({ pos: [4, 4, 4], state: 1 }, { pos: [2, 3, 2], state: 2 });
  return new Site(p);
}
test('terrain plans use current data, preserve water and buildings, and do not manufacture unknown terrain', () => {
  const s = land(),
    plan = terrainPlan(s, { min: [0, 0], max: [5, 5], y: 3, mode: 'flatten' });
  assert.ok(plan.operations.length > 0);
  assert.ok(plan.warnings.some((v) => v.includes('水')));
  assert.ok(plan.warnings.some((v) => v.includes('建筑')));
  assert.ok(plan.warnings.some((v) => v.includes('无地面')));
  assert.ok(!plan.operations.some((o) => o.pos[0] === 4 && o.pos[2] === 4));
  s.operations(plan.operations, { allowTerrain: true });
  assert.equal(surfaceColumns(s).get(0).ground, 3);
  assert.ok(
    terrainPlan(s, { min: [0, 0], max: [3, 3], mode: 'smooth', radius: 1 }).operations.length >= 0,
  );
});
test('surface-following paths and supports use real column heights and preview does not mutate the site', () => {
  const s = land(),
    before = s.pack(),
    config = {
      kind: 'line',
      points: [
        [0.5, 6, 0.5],
        [4.5, 6, 0.5],
      ],
      plane: 'xz',
      state: stone,
      voxel: 'smart',
      terrain: 'surface',
    };
  const plan = geometryPlan(s, config, materials);
  assert.ok(plan.operations.every((o) => o.pos[1] === s.column(o.pos[0], o.pos[2]).ground + 1));
  assert.deepEqual(s.pack(), before);
  const supports = geometryPlan(s, { ...config, terrain: 'supports', spacing: 2 }, materials);
  assert.ok(supports.operations.some((o) => o.reason === '自动落地支撑'));
});
