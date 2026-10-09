import { coordKey } from '../src/core/site.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { combineObjectIds, objectsAtCell } from '../src/selection/object-selection.js';
test('object selection combinations retain picking order and preserve their inputs', () => {
  const before = ['second', 'first'];
  assert.deepEqual(
    [...combineObjectIds(before, ['third', 'first'], 'add')],
    ['second', 'first', 'third'],
  );
  assert.deepEqual([...combineObjectIds(before, ['second'], 'subtract')], ['first']);
  assert.deepEqual([...combineObjectIds(before, ['first'], 'intersect')], ['first']);
  assert.deepEqual([...combineObjectIds(before, ['third'])], ['third']);
  assert.deepEqual(before, ['second', 'first']);
  assert.deepEqual([...combineObjectIds(['first'], ['first'], 'subtract')], []);
});
test('scene picking uses exact members, skips hidden collections and orders nested objects by occupied size', () => {
  const record = (id, cells, extra = {}) => ({
    id,
    min: [0, 0, 0],
    max: [9, 9, 9],
    cells,
    ...extra,
  });
  const design = {
    collections: [{ id: 'hidden', hidden: true }],
    objects: [
      record('large', ['1,2,3', '4,5,6']),
      record('hole', ['4,5,6']),
      record('small', [[1, 2, 3]]),
      record('hidden', ['1,2,3'], { hidden: true }),
      record('collection', ['1,2,3'], { collectionId: 'hidden' }),
      record('same-size', [coordKey(1, 2, 3)]),
    ],
  };
  assert.deepEqual(
    objectsAtCell(design, [1, 2, 3]).map((o) => o.id),
    ['small', 'same-size', 'large'],
  );
  assert.deepEqual(objectsAtCell(design, [2, 2, 3]), []);
  assert.deepEqual(objectsAtCell(design, [10, 2, 3]), []);
  assert.equal(design.objects[0].id, 'large');
});
