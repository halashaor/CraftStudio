import test from 'node:test';
import assert from 'node:assert/strict';
import { VoxelOverlayMap } from '../src/core/voxel-overlay-map.js';
import { coordKey } from '../src/core/site.js';
test('both branches remain isolated across touched/untouched chunks, deletion, reinsertion and clear', () => {
  const a = new VoxelOverlayMap([
      [coordKey(1, 2, 3), 'a'],
      [coordKey(33, 2, 3), 'b'],
    ]),
    b = new VoxelOverlayMap(a);
  assert.equal(a.chunks.get(0), b.chunks.get(0));
  b.set(coordKey(1, 2, 3), 'new');
  assert.equal(a.get(coordKey(1, 2, 3)), 'a');
  assert.equal(b.get(coordKey(1, 2, 3)), 'new');
  a.set(coordKey(33, 2, 3), 'old-branch');
  assert.equal(b.get(coordKey(33, 2, 3)), 'b');
  b.delete(coordKey(33, 2, 3));
  assert.equal(b.size, 1);
  assert.equal(a.size, 2);
  assert.equal(b.delete(coordKey(33, 2, 3)), false);
  b.set(coordKey(33, 2, 3), 'again');
  assert.deepEqual(
    new Map(b),
    new Map([
      [coordKey(1, 2, 3), 'new'],
      [coordKey(33, 2, 3), 'again'],
    ]),
  );
  b.clear();
  assert.equal(b.size, 0);
  assert.equal(a.size, 2);
});
test('a one-cell edit copies its chunk while preserving another chunk and an undo snapshot', () => {
  const initial = new VoxelOverlayMap();
  for (let x = 0; x < 32; x++) initial.set(coordKey(x, 0, 0), x);
  const next = new VoxelOverlayMap(initial);
  next.set(coordKey(0, 0, 0), 100);
  assert.notEqual(next.chunks.get(0), initial.chunks.get(0));
  assert.equal(next.chunks.get(1), initial.chunks.get(1));
  assert.equal(initial.get(0), 0);
  const restored = new VoxelOverlayMap(initial);
  restored.set(coordKey(31, 0, 0), 999);
  assert.equal(initial.get(coordKey(31, 0, 0)), 31);
  assert.equal(next.get(coordKey(31, 0, 0)), 31);
});
