import { curveStation } from '../src/sketch/plane-library.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { featurePlan } from '../src/modeling/features.js';
import { faceFrame, fromPlane } from '../src/sketch/workplane.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
const state = { Name: 'minecraft:stone_bricks' },
  path = [
    [10, 10, 10],
    [30, 10, 10],
  ],
  frame = (x) => faceFrame([x, 10, 10], [1, 0, 0]),
  square = (x, r) =>
    [
      [-r, -r],
      [r, -r],
      [r, r],
      [-r, r],
    ].map((p) => fromPlane([...p, 0], frame(x))),
  config = { operation: 'sweep', sweepMode: 'profile', path, state },
  site = () => new Site(emptyProject()),
  count = (plan, x) => plan.operations.filter((o) => o.pos[0] === x).length;
test('multiple sections taper at their own stations, including reversed selection order and winding', () => {
  const plan = featurePlan(site(), {
    ...config,
    profiles: [
      { points: [...square(30, 3)].reverse(), workplane: frame(30) },
      { points: square(10, 1), workplane: frame(10) },
    ],
  });
  assert.equal(count(plan, 10), 4);
  assert.equal(count(plan, 20), 16);
  assert.equal(count(plan, 29), 36);
  assert.ok(plan.operations.every((o) => o.pos.every(Number.isInteger)));
});
test('intermediate bulges expand bounds even when one straight segment contains all three profiles', () => {
  const plan = featurePlan(site(), {
    ...config,
    profiles: [
      { points: square(10, 1), workplane: frame(10) },
      { points: square(20, 4), workplane: frame(20) },
      { points: square(30, 1), workplane: frame(30) },
    ],
  });
  assert.equal(count(plan, 10), 4);
  assert.equal(count(plan, 20), 64);
  assert.equal(count(plan, 29), 4);
});
test('hollow caps have arc-length thickness across subdivided segments and geometry-only preview stays immutable', () => {
  const s = site(),
    before = s.pack(),
    base = {
      ...config,
      profiles: [
        { points: square(10, 3), workplane: frame(10) },
        { points: square(30, 3), workplane: frame(30) },
      ],
      hollow: true,
      thickness: 2,
      caps: true,
    },
    capped = featurePlan(s, base),
    keys = new Set(capped.operations.map((o) => o.pos.join(',')));
  assert.ok(keys.has('10,10,10'));
  assert.ok(keys.has('11,10,10'));
  assert.equal(keys.has('12,10,10'), false);
  assert.equal(keys.has('20,10,10'), false);
  assert.ok(keys.has('28,10,10'));
  assert.equal(
    new Set(featurePlan(s, { ...base, caps: false }).operations.map((o) => o.pos.join(','))).has(
      '10,10,10',
    ),
    false,
  );
  assert.deepEqual(s.pack(), before);
});
test('coincident profile stations report ambiguity; explicit stations allow spatially reused shapes', () => {
  const profiles = [square(10, 1), square(10, 3)];
  assert.throws(() => featurePlan(site(), { ...config, profiles, workplane: frame(10) }), /同一/);
  assert.ok(
    featurePlan(site(), {
      ...config,
      profiles,
      workplane: frame(10),
      profileStations: [0, 1],
      smooth: true,
    }).operations.length > 0,
  );
});

test('varying sections follow transported frames through a spatial bend', () => {
  const rail = [
      [10, 10, 10],
      [20, 12, 12],
      [30, 18, 24],
    ],
    frames = [curveStation(rail, 0).frame, curveStation(rail, 1).frame],
    profiles = frames.map((f, i) => ({
      workplane: f,
      points: [
        [-1 - i, -1 - i],
        [1 + i, -1 - i],
        [1 + i, 1 + i],
        [-1 - i, 1 + i],
      ].map((p) => fromPlane([...p, 0], f)),
    })),
    plan = featurePlan(site(), { ...config, path: rail, profiles });
  assert.ok(plan.operations.length > 100);
  assert.ok(plan.operations.some((o) => o.pos[1] > 16 && o.pos[2] > 20));
  assert.ok(plan.operations.every((o) => o.pos.every((n) => Number.isInteger(n) && n >= 0)));
});
