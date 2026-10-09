import test from 'node:test';
import assert from 'node:assert/strict';
import { featurePlan } from '../src/modeling/features.js';
import { faceFrame, fromPlane } from '../src/sketch/workplane.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
const state = { Name: 'minecraft:stone_bricks' },
  frame = faceFrame([10, 10, 10], [1, 0, 0]),
  square = [
    [-3, -3],
    [3, -3],
    [3, 3],
    [-3, 3],
  ].map((p) => fromPlane([...p, 0], frame)),
  base = {
    operation: 'sweep',
    sweepMode: 'profile',
    path: [
      [10, 10, 10],
      [22, 10, 10],
    ],
    profiles: [square],
    workplane: frame,
    state,
  };
const keys = (plan) => new Set(plan.operations.map((o) => o.pos.join(',')));
test('profile sweep preserves cross-section size, real voids, endpoint caps and cut semantics', () => {
  const s = new Site(emptyProject()),
    before = s.pack(),
    solid = featurePlan(s, base),
    open = featurePlan(s, { ...base, hollow: true, thickness: 1, caps: false }),
    capped = featurePlan(s, { ...base, hollow: true, thickness: 1, caps: true });
  assert.equal(solid.operations.length, 432);
  assert.equal(open.operations.length, 240);
  assert.equal(capped.operations.length, 272);
  assert.ok(keys(solid).has('15,10,10'));
  assert.equal(keys(open).has('15,10,10'), false);
  assert.equal(keys(open).has('10,10,10'), false);
  assert.ok(keys(capped).has('10,10,10'));
  assert.equal(keys(capped).has('15,10,10'), false);
  assert.ok(featurePlan(s, { ...base, cut: true }).operations.every((o) => o.state === null));
  assert.deepEqual(s.pack(), before);
});
test('concave user profiles follow 3D bends and create a connected solid without filling their notch', () => {
  const s = new Site(emptyProject()),
    profile = [
      [-3, -3],
      [3, -3],
      [3, -1],
      [-1, -1],
      [-1, 3],
      [-3, 3],
    ].map((p) => fromPlane([...p, 0], frame)),
    plan = featurePlan(s, {
      ...base,
      path: [
        [10, 10, 10],
        [18, 10, 10],
        [22, 14, 18],
      ],
      profiles: [profile],
    }),
    set = keys(plan);
  assert.ok(set.has('14,12,10'));
  assert.equal(set.has('14,9,11'), false);
  assert.ok(plan.operations.some((o) => o.pos[1] > 12));
  const todo = [plan.operations[0].pos],
    seen = new Set();
  while (todo.length) {
    const p = todo.pop(),
      k = p.join(',');
    if (seen.has(k) || !set.has(k)) continue;
    seen.add(k);
    for (let a = 0; a < 3; a++)
      for (const d of [-1, 1]) {
        const q = [...p];
        q[a] += d;
        todo.push(q);
      }
  }
  assert.equal(seen.size, set.size);
});
test('legacy rectangular sweep retains its behavior and profile mode requires explicit closed section choice', () => {
  const s = new Site(emptyProject()),
    legacy = featurePlan(s, { operation: 'sweep', path: base.path, width: 3, height: 3, state });
  assert.ok(legacy.operations.length);
  assert.ok(legacy.warnings.some((w) => w.includes('矩形')));
  assert.throws(() => featurePlan(s, { ...base, profiles: [] }), /请选择/);
});

test('feature sweeps apply the shared 3D scope and report excluded operations', () => {
  const s = new Site(emptyProject()),
    plan = featurePlan(s, {
      ...base,
      selectionMode: 'volume',
      selection: { min: [10, 7, 7], max: [15, 12, 12] },
    });
  assert.equal(plan.operations.length, 216);
  assert.ok(plan.operations.every((o) => o.pos[0] <= 15));
  assert.equal(plan.scope.filtered, 216);
});
