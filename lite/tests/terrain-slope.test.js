import test from 'node:test';
import assert from 'node:assert/strict';
import { slopeMetrics, slopeHeight } from '../src/terrain/terrain-slope.js';
import { terrainPlan, surfaceColumns } from '../src/modeling/construction.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
test('endpoint slopes have signed measurements and bounded plateaus in every horizontal direction', () => {
  const p = [
      [2, 1, 2],
      [8, 4, 6],
    ],
    m = slopeMetrics(p);
  assert.equal(m.rise, 3);
  assert.ok(Math.abs(m.horizontal - Math.sqrt(52)) < 1e-10);
  assert.ok(Math.abs(m.length - Math.sqrt(61)) < 1e-10);
  assert.equal(slopeHeight(p, 2, 2), 1);
  assert.equal(slopeHeight(p, 8, 6), 4);
  assert.equal(slopeHeight(p, -100, -100), 1);
  assert.equal(slopeHeight(p, 100, 100), 4);
  assert.ok(Math.abs(slopeHeight(p, 5, 4) - 2.5) < 1e-10);
  assert.ok(slopeMetrics([...p].reverse()).angle < 0);
  assert.equal(slopeHeight([...p].reverse(), 5, 4), slopeHeight(p, 5, 4));
  assert.equal(
    slopeMetrics([
      [0, 0, 0],
      [0, 0, 8],
    ]).percent,
    0,
  );
  assert.throws(
    () =>
      slopeMetrics([
        [1, 1, 1],
        [1, 3, 1],
      ]),
    /同一/,
  );
  assert.throws(
    () =>
      slopeMetrics([
        [1, 1, 1],
        [NaN, 3, 1],
      ]),
    /有效/,
  );
});
test('two-endpoint ramp uses real terrain, clipped scope and one undo without touching water or buildings', () => {
  const p = {
    ...emptyProject(),
    size: [12, 8, 8],
    palette: [
      { Name: 'minecraft:stone' },
      { Name: 'minecraft:water' },
      { Name: 'minecraft:oak_planks' },
    ],
    blocks: [],
  };
  for (let x = 0; x < 10; x++)
    for (let z = 0; z < 4; z++) p.blocks.push({ pos: [x, 0, z], state: 0 });
  p.blocks.push({ pos: [6, 1, 2], state: 1 }, { pos: [7, 1, 2], state: 2 });
  const s = new Site(p),
    before = s.pack(),
    selection = {
      min: [0, 0, 0],
      max: [9, 7, 3],
      regions: [
        { operation: 'replace', min: [0, 0, 0], max: [9, 7, 3] },
        { operation: 'subtract', min: [4, 0, 0], max: [4, 7, 3] },
      ],
    },
    plan = terrainPlan(s, {
      min: [0, 0],
      max: [9, 3],
      mode: 'slope',
      slopePoints: [
        [2, 1, 0],
        [8, 4, 0],
      ],
      selectionMode: 'footprint',
      selection,
    });
  assert.ok(plan.operations.length);
  assert.equal(
    plan.operations.some((o) => o.pos[0] === 4),
    false,
  );
  assert.equal(
    plan.operations.some((o) => o.pos[0] === 6 && o.pos[2] === 2),
    false,
  );
  assert.equal(
    plan.operations.some((o) => o.pos[0] === 7 && o.pos[2] === 2),
    false,
  );
  assert.deepEqual(s.pack(), before);
  s.operations(plan.operations, { allowTerrain: true });
  const cols = surfaceColumns(s);
  assert.equal(cols.get(0).ground, 1);
  assert.equal(cols.get(2).ground, 1);
  assert.equal(cols.get(8).ground, 4);
  assert.equal(cols.get(9).ground, 4);
  assert.equal(cols.get(4).ground, 0);
  s.restore('undo');
  assert.deepEqual(s.pack().overlay, before.overlay);
});
