import test from 'node:test';
import assert from 'node:assert/strict';
import { workplane, toPlane, fromPlane, dot, sub } from '../src/sketch/workplane.js';
import { closedProfiles } from '../src/sketch/sketch-profiles.js';
import { featurePlan } from '../src/modeling/features.js';
const p = [
    [8, 8, 8],
    [20, 12, 10],
    [16, 18, 20],
    [4, 14, 18],
  ],
  site = {
    design: {
      guides: [{ id: 'inclined', name: '倾斜截面', recipe: { kind: 'polygon' }, points: p }],
    },
  };
test('arbitrary plane recognition is independent of winding and roundtrips coordinates', () => {
  const f = workplane(p),
    reverse = workplane([...p].reverse());
  assert.equal(f.plane, 'auto');
  assert.ok(dot(f.normal, reverse.normal) > 0.999999);
  assert.ok(Math.abs(dot(f.u, f.normal)) < 1e-10);
  for (const q of p) {
    assert.ok(Math.abs(toPlane(q, f)[2]) < 1e-10);
    const world = fromPlane(toPlane(q, f), f);
    assert.ok(Math.hypot(...sub(q, world)) < 1e-10);
  }
  assert.equal(closedProfiles(site.design.guides).length, 1);
});
test('oblique extrusion samples world voxels within positive, negative and symmetric depth', () => {
  const f = workplane(p);
  for (const [depth, symmetric] of [
    [4, false],
    [-4, false],
    [4, true],
    [-4, true],
  ]) {
    const result = featurePlan(site, { profileIds: ['inclined'], depth, symmetric }),
      values = result.operations.map(
        (o) =>
          toPlane(
            o.pos.map((n) => n + 0.5),
            f,
          )[2],
      ),
      lo = symmetric ? -2 : Math.min(0, depth),
      hi = symmetric ? 2 : Math.max(0, depth);
    assert.ok(values.length > 100);
    assert.ok(values.every((n) => n >= lo - 1e-8 && n < hi + 1e-8));
    assert.equal(
      new Set(result.operations.map((o) => o.pos.join(','))).size,
      result.operations.length,
    );
  }
});
test('oblique hollow, cut and parallel-section loft retain their semantics', () => {
  const full = featurePlan(site, { profileIds: ['inclined'], depth: 6 }),
    hollow = featurePlan(site, { profileIds: ['inclined'], depth: 6, hollow: true, caps: false });
  assert.ok(hollow.operations.length < full.operations.length);
  assert.ok(
    featurePlan(site, { profileIds: ['inclined'], depth: 4, cut: true }).operations.every(
      (o) => o.state === null,
    ),
  );
  const f = workplane(p),
    next = p.map((q) => q.map((n, a) => n + f.normal[a] * 6));
  assert.ok(featurePlan(site, { operation: 'loft', profiles: [p, next] }).operations.length > 100);
});
test('noncoplanar and zero-area outlines are rejected rather than flattened', () => {
  const nonplanar = p.map((q) => [...q]);
  nonplanar[3][1] += 1;
  assert.throws(() => workplane(nonplanar), /不共面/);
  assert.throws(() => featurePlan(site, { profiles: [nonplanar] }), /不共面/);
  assert.equal(
    closedProfiles([{ id: 'bad', recipe: { kind: 'polygon' }, points: nonplanar }]).length,
    0,
  );
  assert.throws(
    () =>
      workplane([
        [1, 1, 1],
        [2, 2, 2],
        [3, 3, 3],
      ]),
    /面积/,
  );
});
