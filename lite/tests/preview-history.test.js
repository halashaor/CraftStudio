import test from 'node:test';
import assert from 'node:assert/strict';
import { PreviewHistory } from '../src/runtime/preview-history.js';
test('preview undo and redo retain independent states and discard a replaced branch', () => {
  const history = new PreviewHistory(),
    zero = { position: [0, 0, 0], turn: 0 },
    moved = { position: [3, 0, 0], turn: 0 },
    rotated = { position: [3, 0, 0], turn: 1 };
  assert.equal(history.record(zero, zero), false);
  assert.equal(history.step('undo', zero), null);
  history.record(zero, moved);
  history.record(moved, rotated);
  const before = history.step('undo', rotated);
  assert.deepEqual(before, moved);
  before.position[0] = 99;
  assert.deepEqual(history.step('redo', moved), rotated);
  assert.deepEqual(history.step('undo', rotated), moved);
  history.record(moved, { position: [5, 0, 0], turn: 0 });
  assert.equal(history.redo.length, 0);
  assert.deepEqual(history.step('undo', { position: [5, 0, 0], turn: 0 }), moved);
  history.clear();
  assert.equal(history.undo.length, 0);
  assert.equal(history.redo.length, 0);
});
