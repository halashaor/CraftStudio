import test from 'node:test';
import assert from 'node:assert/strict';
import { pointPlacement } from '../src/sketch/placement-mode.js';
test('point placement uses one consistent mode for surface paths, explicit planes and locked/custom frames', () => {
  const surface = { kind: 'bezier', pickSurface: true, workplane: null, planeLock: false };
  assert.equal(pointPlacement(surface), 'surface');
  assert.equal(pointPlacement({ ...surface, pickSurface: false }), 'plane');
  assert.equal(pointPlacement({ ...surface, workplane: {} }), 'plane');
  assert.equal(pointPlacement({ ...surface, planeLock: true }), 'plane');
  assert.equal(pointPlacement({ ...surface, kind: 'rectangle' }), 'plane');
});
