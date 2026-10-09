import test from 'node:test';
import assert from 'node:assert/strict';
import { constrainSketch } from '../src/sketch/sketch.js';
import { fromPlane, toPlane } from '../src/sketch/workplane.js';
const frame = {
  origin: [8, 8, 8],
  u: [2 / Math.sqrt(5), -1 / Math.sqrt(5), 0],
  v: [3 / Math.sqrt(70), 6 / Math.sqrt(70), -5 / Math.sqrt(70)],
  normal: [1 / Math.sqrt(14), 2 / Math.sqrt(14), 3 / Math.sqrt(14)],
};
test('repeated unchanged oblique constraints preserve exact input coordinates and snapshot independence', () => {
  const points = [
      [0, 0, 0],
      [4, 4, 0],
      [8, 4, 0],
      [12, 0, 0],
    ].map((p) => fromPlane(p, frame)),
    original = structuredClone(points);
  let c = {
    kind: 'bezier',
    workplane: frame,
    points,
    snap: 0.5,
    snapApplied: true,
    planeLock: true,
  };
  for (let i = 0; i < 100; i++) c = constrainSketch(c);
  assert.deepEqual(c.points, original);
  assert.notEqual(c.points, points);
  c.points[0][0] += 1;
  assert.deepEqual(points, original);
});
test('real normal offsets, dimension constraints and half-grid snapping still modify the requested geometry', () => {
  const config = {
      kind: 'line',
      workplane: frame,
      points: [fromPlane([0, 0, 2], frame), fromPlane([4, 3, 2], frame)],
      snap: 0.5,
      snapApplied: true,
      planeLock: true,
      constraint: 'horizontal',
    },
    r = constrainSketch(config);
  for (const p of r.points) assert.ok(Math.abs(toPlane(p, frame)[2]) < 1e-10);
  assert.ok(Math.abs(toPlane(r.points[1], frame)[1] - toPlane(r.points[0], frame)[1]) < 1e-10);
  assert.notDeepEqual(r.points, config.points);
  const snapped = constrainSketch({
    ...config,
    constraint: 'free',
    planeLock: false,
    snapApplied: false,
    points: [fromPlane([0.2, 0.7, 0], frame), fromPlane([3.8, 2.9, 0], frame)],
  });
  assert.ok(Math.abs(toPlane(snapped.points[0], frame)[0]) < 1e-10);
  assert.ok(Math.abs(toPlane(snapped.points[0], frame)[1] - 0.5) < 1e-10);
});
