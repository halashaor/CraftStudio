import test from 'node:test';
import assert from 'node:assert/strict';
import { featurePlan } from '../src/modeling/features.js';
import { faceFrame, fromPlane } from '../src/sketch/workplane.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
const path = [
    [10, 10, 10],
    [30, 10, 10],
    [30, 10, 30],
    [20, 10, 30],
    [20, 10, 5],
  ],
  f = faceFrame(path[0], [1, 0, 0]),
  profile = [
    [-2, -2],
    [2, -2],
    [2, 2],
    [-2, 2],
  ].map((p) => fromPlane([...p, 0], f)),
  base = {
    operation: 'sweep',
    sweepMode: 'profile',
    path,
    profiles: [profile],
    workplane: f,
    state: { Name: 'minecraft:stone_bricks' },
  };
test('distant rail intersections report voxel locations and stop/merge share the same geometry', () => {
  const s = new Site(emptyProject()),
    before = s.pack(),
    merged = featurePlan(s, { ...base, sweepOverlap: 'merge' }),
    stopped = featurePlan(s, { ...base, sweepOverlap: 'stop' });
  assert.ok(merged.overlap.count > 0);
  assert.ok(
    merged.overlap.positions.some((p) => p[0] >= 18 && p[0] <= 21 && p[2] >= 8 && p[2] <= 11),
  );
  assert.equal(merged.blocked, null);
  assert.equal(stopped.blocked.code, 'SWEEP_SELF_OVERLAP');
  assert.deepEqual(stopped.operations, merged.operations);
  assert.deepEqual(s.pack(), before);
});
test('ordinary bends are not distant self-overlap and clipping can remove all reported intersections', () => {
  const s = new Site(emptyProject()),
    bend = featurePlan(s, {
      ...base,
      path: [
        [10, 10, 10],
        [30, 10, 10],
        [30, 10, 30],
      ],
    });
  assert.equal(bend.overlap.count, 0);
  const scoped = featurePlan(s, {
    ...base,
    sweepOverlap: 'stop',
    selectionMode: 'volume',
    selection: { min: [10, 8, 8], max: [12, 11, 11] },
  });
  assert.equal(scoped.overlap.count, 0);
  assert.equal(scoped.blocked, null);
});
