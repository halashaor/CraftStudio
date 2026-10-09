import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { geometryPlan } from '../src/modeling/construction.js';
const state = { Name: 'minecraft:stone_bricks' },
  available = new Set([state.Name]);
function fixture() {
  return new Site({
    ...emptyProject(),
    size: [8, 8, 8],
    palette: [
      { Name: 'minecraft:stone' },
      { Name: 'minecraft:water' },
      { Name: 'minecraft:oak_planks' },
    ],
    blocks: [
      { pos: [0, 0, 0], state: 0 },
      { pos: [1, 0, 0], state: 0 },
      { pos: [1, 1, 0], state: 1 },
      { pos: [2, 0, 0], state: 0 },
      { pos: [2, 1, 0], state: 2 },
    ],
  });
}
test('graded roads skip water, road-level buildings and absent ground together with their earthworks', () => {
  const s = fixture(),
    before = s.pack(),
    plan = geometryPlan(
      s,
      {
        kind: 'line',
        plane: 'xz',
        points: [
          [0.5, 2, 0.5],
          [3.5, 2, 0.5],
        ],
        state,
        voxel: 'cube',
        terrain: 'grade',
      },
      available,
    );
  assert.deepEqual(s.pack(), before);
  assert.ok(plan.operations.some((op) => op.pos[0] === 0));
  for (const x of [1, 2, 3]) assert.ok(!plan.operations.some((op) => op.pos[0] === x));
  assert.ok(plan.warnings.some((w) => w.includes('道路在 3 列')));
  s.operations(plan.operations, { allowExisting: true, allowTerrain: true });
  assert.equal(s.palette[s.at([1, 1, 0]).state].Name, 'minecraft:water');
  assert.equal(s.palette[s.at([2, 1, 0]).state].Name, 'minecraft:oak_planks');
  s.restore('undo');
  assert.deepEqual(s.pack().overlay, before.overlay);
});
test('surface roads protect existing water and buildings even when caller permits terrain writes', () => {
  const s = fixture(),
    p = geometryPlan(
      s,
      {
        kind: 'line',
        plane: 'xz',
        points: [
          [0.5, 4, 0.5],
          [3.5, 4, 0.5],
        ],
        state,
        voxel: 'cube',
        terrain: 'surface',
      },
      available,
    );
  assert.ok(p.operations.some((op) => op.pos[0] === 0));
  assert.ok(!p.operations.some((op) => [1, 2, 3].includes(op.pos[0])));
  s.operations(p.operations, { allowExisting: true, allowTerrain: true });
  assert.equal(s.palette[s.at([1, 1, 0]).state].Name, 'minecraft:water');
  assert.equal(s.palette[s.at([2, 1, 0]).state].Name, 'minecraft:oak_planks');
});
test('known underground water below the surface does not block a ground-following path', () => {
  const s = new Site({
    ...emptyProject(),
    size: [4, 8, 4],
    palette: [{ Name: 'minecraft:water' }, { Name: 'minecraft:stone' }],
    blocks: [
      { pos: [1, 0, 1], state: 0 },
      { pos: [1, 3, 1], state: 1 },
    ],
  });
  assert.ok(
    geometryPlan(
      s,
      {
        kind: 'line',
        plane: 'xz',
        points: [
          [1.1, 6, 1.1],
          [1.9, 6, 1.1],
        ],
        state,
        voxel: 'cube',
        terrain: 'surface',
      },
      available,
    ).operations.length > 0,
  );
});

test('surface diagonal connection cells are checked independently of centerline samples', () => {
  const s = new Site({
    ...emptyProject(),
    size: [6, 6, 6],
    palette: [{ Name: 'minecraft:stone' }, { Name: 'minecraft:water' }],
    blocks: [
      ...[
        [0, 0],
        [1, 1],
        [2, 2],
        [1, 0],
        [2, 1],
      ].map(([x, z]) => ({ pos: [x, 0, z], state: 0 })),
      { pos: [1, 1, 0], state: 1 },
    ],
  });
  const plan = geometryPlan(
    s,
    {
      kind: 'line',
      plane: 'xz',
      points: [
        [0.5, 4, 0.5],
        [2.5, 4, 2.5],
      ],
      state,
      voxel: 'cube',
      terrain: 'surface',
    },
    available,
  );
  assert.ok(plan.operations.some((op) => op.pos.join(',') === '1,1,1'));
  assert.ok(!plan.operations.some((op) => op.pos[0] === 1 && op.pos[2] === 0));
  assert.equal(plan.usedRoles.full, plan.operations.filter((op) => op.state).length);
});
