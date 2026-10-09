import test from 'node:test';
import assert from 'node:assert/strict';
import { closedProfiles } from '../src/sketch/sketch-profiles.js';
import { drawingPoints } from '../src/sketch/sketch-drawing.js';
import { featurePlan } from '../src/modeling/features.js';
const line = (id, a, b) => ({
  id,
  name: id,
  recipe: { kind: 'line', plane: 'xz' },
  points: [a, b],
});
const triangle = [
  line('a', [2, 1, 2], [10, 1, 2]),
  line('b', [6, 1, 10], [10, 1, 2]),
  line('c', [6, 1, 10], [2, 1, 2]),
];
test('independent reversed segments form an extrudable triangle without changing guides', () => {
  const before = structuredClone(triangle),
    profiles = closedProfiles(triangle);
  assert.equal(profiles.length, 1);
  assert.deepEqual(profiles[0].sourceIds, ['a', 'b', 'c']);
  const result = featurePlan(
    { design: { guides: triangle } },
    { profileIds: [profiles[0].id], depth: 4 },
  );
  assert.ok(result.operations.length > 80);
  assert.deepEqual(triangle, before);
  assert.equal(closedProfiles([...triangle].reverse())[0].id, profiles[0].id);
});
test('gaps, branches, collinear and nonplanar segments are not silently filled', () => {
  assert.equal(closedProfiles(triangle.slice(0, 2)).length, 0);
  const gap = structuredClone(triangle);
  gap[2].points[1][0] += 0.1;
  assert.equal(closedProfiles(gap).length, 0);
  const tilted = structuredClone(triangle);
  tilted[1].points[0][1] = 2;
  assert.equal(closedProfiles(tilted).length, 0);
  assert.equal(closedProfiles([...triangle, line('branch', [2, 1, 2], [1, 1, 1])]).length, 0);
  assert.equal(
    closedProfiles([
      line('x', [2, 1, 2], [5, 1, 2]),
      line('y', [5, 1, 2], [8, 1, 2]),
      line('z', [8, 1, 2], [2, 1, 2]),
    ]).length,
    0,
  );
});
test('disjoint loops and closed Bezier are selectable alongside native shapes', () => {
  const second = triangle.map((g) => ({
    ...g,
    id: g.id + '2',
    points: g.points.map((p) => p.map((v, a) => v + (a === 0 ? 20 : 0))),
  }));
  assert.equal(closedProfiles([...triangle, ...second]).length, 2);
  const curve = {
    id: 'curve',
    recipe: { kind: 'bezier' },
    points: [
      [2, 1, 2],
      [5, 1, 2],
      [5, 1, 5],
      [2, 1, 2],
    ],
  };
  assert.equal(closedProfiles([curve]).length, 1);
});
test('click-defined Bezier preserves requested endpoints and work plane', () => {
  const p = drawingPoints('bezier', [[12, 3, 7]], [24, 8, 19], 'xz');
  assert.deepEqual(p[0], [12, 3, 7]);
  assert.deepEqual(p[3], [24, 3, 19]);
  assert.ok(p.every((q) => q[1] === 3));
  assert.notDeepEqual(p[1], [16, 3, 11]);
  assert.deepEqual(drawingPoints('rectangle', [[3, 5, 2]], [7, 9, 20], 'xy'), [
    [3, 5, 2],
    [7, 9, 2],
  ]);
});
