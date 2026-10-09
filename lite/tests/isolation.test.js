import test from 'node:test';
import assert from 'node:assert/strict';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { isolationKeys } from '../src/view/isolation.js';
import { brushPlan } from '../src/selection/tool-mask.js';
test('isolated object includes nearby new edits while excluding other object members', () => {
  const s = new Site(emptyProject());
  s.operations(
    [
      [2, 1, 2],
      [3, 1, 2],
      [4, 1, 2],
      [30, 1, 30],
    ].map((pos) => ({ type: 'set', pos, state: { Name: 'minecraft:oak_planks' } })),
    {},
  );
  s.design.objects = [
    { id: 'one', name: 'one', min: [2, 1, 2], max: [2, 1, 2], cells: [coordKey(2, 1, 2)] },
    { id: 'other', name: 'other', min: [4, 1, 2], max: [4, 1, 2], cells: [coordKey(4, 1, 2)] },
  ];
  const before = s.pack(),
    result = isolationKeys(s, { objectIds: ['one'], includeNew: true });
  assert.ok(result.keys.has(coordKey(3, 1, 2)));
  assert.ok(!result.keys.has(coordKey(4, 1, 2)));
  assert.ok(!result.keys.has(coordKey(30, 1, 30)));
  assert.deepEqual(s.pack(), before);
  const p = brushPlan(s, {
    mode: 'place',
    points: [
      [3, 2, 2],
      [30, 2, 30],
    ],
    state: { Name: 'minecraft:glass' },
    mask: { limitBounds: result.bounds },
  });
  assert.equal(p.operations.length, 1);
});
test('selection-only isolation has an explicit edit range and follows updated member objects', () => {
  const s = new Site(emptyProject());
  s.operations([{ type: 'set', pos: [2, 1, 2], state: { Name: 'minecraft:oak_planks' } }], {});
  const a = isolationKeys(s, {
    keys: [coordKey(2, 1, 2)],
    selection: { min: [2, 1, 2], max: [2, 1, 2] },
    includeNew: true,
  });
  assert.ok(a.bounds);
  s.design.objects = [{ id: 'one', min: [8, 1, 2], max: [8, 1, 2], cells: [coordKey(8, 1, 2)] }];
  const b = isolationKeys(s, { objectIds: ['one'], includeNew: true });
  assert.equal(b.bounds.min[0], 6);
  assert.ok(b.keys.has(coordKey(8, 1, 2)));
});
