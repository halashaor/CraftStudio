import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectSelectionBinding } from '../src/selection/object-selection-binding.js';
import { selectionPredicate } from '../src/selection/selection-mask.js';
const object = (id, x, flags = {}) => ({
  id,
  min: [x, 1, 1],
  max: [x, 1, 1],
  cells: [[x, 1, 1]],
  ...flags,
});
const summary = (revision, objects, collections = []) => ({
  workspaceId: 'world',
  revision,
  design: { objects, collections },
});
function bind(binding, candidates, ids, members) {
  binding.bind({
    workspaceId: 'world',
    revision: 1,
    ids,
    candidates,
    selection: { min: [1, 1, 1], max: [5, 1, 1], members },
  });
}
test('complete object references follow moves and unchanged metadata does not rebuild a selection', () => {
  const binding = new ObjectSelectionBinding(),
    a = object('a', 1);
  binding.bind({
    workspaceId: 'world',
    revision: 1,
    ids: ['a'],
    candidates: [a],
    selection: { min: a.min, max: a.max, members: a.cells },
  });
  const moved = object('a', 10, { locked: true });
  const result = binding.update(summary(2, [moved]));
  assert.deepEqual(result.ids, ['a']);
  assert.deepEqual(result.selection.min, [10, 1, 1]);
  assert.equal(selectionPredicate(result.selection)([10, 1, 1]), true);
  assert.equal(selectionPredicate(result.selection)([1, 1, 1]), false);
  assert.equal(binding.matches(result.selection), true);
  assert.equal(
    binding.matches({
      ...result.selection,
      members: [
        [10, 1, 1],
        [11, 1, 1],
      ],
    }),
    false,
  );
  assert.equal(binding.update(summary(3, [{ ...moved, name: 'Renamed' }])), null);
  assert.equal(binding.update({ ...summary(4, [moved]), workspaceId: 'other' }), null);
  assert.deepEqual(binding.ids, []);
});
test('equal cell counts and bounds still detect a changed exact membership', () => {
  const binding = new ObjectSelectionBinding(),
    a = {
      id: 'a',
      min: [1, 1, 1],
      max: [3, 1, 1],
      cells: [
        [1, 1, 1],
        [3, 1, 1],
      ],
    };
  binding.bind({
    workspaceId: 'world',
    revision: 1,
    ids: ['a'],
    candidates: [a],
    selection: { min: a.min, max: a.max, members: a.cells },
  });
  const result = binding.update(
    summary(2, [
      {
        ...a,
        cells: [
          [1, 1, 1],
          [2, 1, 1],
        ],
      },
    ]),
  );
  const contains = selectionPredicate(result.selection);
  assert.equal(contains([2, 1, 1]), true);
  assert.equal(contains([3, 1, 1]), false);
  assert.deepEqual(a.cells, [
    [1, 1, 1],
    [3, 1, 1],
  ]);
});
test('partial mixed masks stay fixed while full overlapping or subtracted objects can follow', () => {
  const binding = new ObjectSelectionBinding(),
    a = {
      ...object('a', 1),
      max: [2, 1, 1],
      cells: [
        [1, 1, 1],
        [2, 1, 1],
      ],
    },
    b = object('b', 5);
  bind(
    binding,
    [a, b],
    ['b'],
    [
      [1, 1, 1],
      [5, 1, 1],
    ],
  );
  assert.equal(binding.update(summary(2, [a, object('b', 10)])), null);
  bind(binding, [a, b], ['b'], [[5, 1, 1]]);
  assert.deepEqual(binding.update(summary(2, [a, object('b', 10)])).selection.min, [10, 1, 1]);
  const overlap = object('small', 1);
  bind(binding, [a, overlap], ['small'], [[1, 1, 1]]);
  assert.deepEqual(binding.update(summary(2, [a, object('small', 8)])).ids, ['small']);
});
test('hidden collections and removed objects drop from active identity selection without resurrecting', () => {
  const binding = new ObjectSelectionBinding(),
    a = object('a', 1, { collectionId: 'hide' }),
    b = object('b', 5);
  bind(binding, [a, b], ['a', 'b'], [...a.cells, ...b.cells]);
  const result = binding.update(summary(2, [a, b], [{ id: 'hide', hidden: true }]));
  assert.deepEqual(result.ids, ['b']);
  assert.deepEqual(result.selection.min, b.min);
  assert.deepEqual(binding.update(summary(3, [])), { ids: [], selection: null });
  assert.equal(binding.update(summary(4, [a, b])), null);
});
