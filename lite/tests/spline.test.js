import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleFigure, geometryPlan } from '../src/modeling/construction.js';
import { sampleSpline, splinePoint } from '../src/sketch/spline.js';
import { closedProfiles } from '../src/sketch/sketch-profiles.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
test('spatial interpolated curves pass through more than eight waypoints without mutating inputs', () => {
  const points = Array.from({ length: 12 }, (_, i) => [
      4 + i * 2,
      3 + Math.sin(i),
      8 + Math.cos(i) * 3,
    ]),
    before = structuredClone(points),
    samples = sampleFigure({ kind: 'spline', points });
  for (const p of points) assert.ok(samples.some((q) => q.every((n, a) => n === p[a])));
  assert.ok(samples.every((p) => p.every(Number.isFinite)));
  assert.deepEqual(points, before);
  const moved = structuredClone(points);
  moved[5][1] += 2;
  const next = sampleFigure({ kind: 'spline', points: moved });
  const end = samples.findIndex((p) => p.every((n, a) => n === points[3][a]));
  assert.deepEqual(next.slice(0, end + 1), samples.slice(0, end + 1));
});
test('closed interpolation produces a usable planar profile and handles repeated endpoints', () => {
  const points = [
      [4, 2, 4],
      [12, 2, 4],
      [12, 2, 12],
      [4, 2, 12],
    ],
    samples = sampleSpline([...points, points[0]], { closed: true });
  assert.deepEqual(samples[0], samples.at(-1));
  for (const p of points) assert.ok(samples.some((q) => q.every((n, a) => n === p[a])));
  assert.equal(
    closedProfiles([
      { id: 'loop', points: samples, recipe: { kind: 'spline', points, closed: true } },
    ]).length,
    1,
  );
  assert.throws(() => sampleSpline([points[0], points[0]]), /不同/);
  assert.throws(() => sampleSpline(points.slice(0, 2), { closed: true }), /三个/);
});
test('interpolated paths reuse slab fitting while nonplanar fills reject instead of flattening', () => {
  const site = new Site(emptyProject()),
    state = { Name: 'minecraft:stone_bricks' },
    config = {
      kind: 'spline',
      points: [
        [4, 2.5, 4],
        [9, 2.5, 7],
        [14, 2.5, 4],
      ],
      plane: 'xz',
      state,
      voxel: 'smart',
      surface: 'top',
      roles: {
        slab: { Name: 'minecraft:stone_brick_slab' },
        stairs: { Name: 'minecraft:stone_brick_stairs' },
      },
    },
    before = site.pack();
  const plan = geometryPlan(site, config);
  assert.ok(plan.operations.some((op) => op.state.Name.endsWith('_slab')));
  assert.deepEqual(site.pack(), before);
  assert.throws(
    () =>
      geometryPlan(site, {
        ...config,
        closed: true,
        fill: true,
        points: [
          [4, 2, 4],
          [12, 4, 4],
          [12, 2, 12],
          [4, 2, 12],
        ],
      }),
    /平面/,
  );
});

import { EngineWorkspace } from '../../local-engine/workspace.mjs';
test('saved interpolated profiles can drive extrusion through the shared API and reopen portably', async () => {
  const engine = new EngineWorkspace(),
    reopened = new EngineWorkspace();
  try {
    const initial = await engine.call('api', { method: 'workspace.describe' }),
      config = {
        kind: 'spline',
        points: [
          [4, 2, 4],
          [12, 2, 4],
          [12, 2, 12],
          [4, 2, 12],
        ],
        closed: true,
        guidesOnly: true,
        state: { Name: 'minecraft:stone_bricks' },
        plane: 'xz',
      };
    let prepare = await engine.call('api', {
      method: 'construction.prepare',
      params: { expectedRevision: initial.revision, type: 'geometry', config },
    });
    assert.ok(prepare.ok, prepare.error?.message);
    assert.equal(
      (await engine.call('api', { method: 'workspace.describe' })).revision,
      initial.revision,
    );
    let commit = await engine.call('api', {
      method: 'construction.commit',
      params: { id: prepare.value.id, expectedRevision: initial.revision },
    });
    assert.ok(commit.ok, commit.error?.message);
    const guide = (await engine.call('summary')).design.guides[0];
    prepare = await engine.call('api', {
      method: 'construction.prepare',
      params: {
        type: 'feature',
        config: {
          operation: 'extrude',
          profileIds: [guide.id],
          depth: 3,
          state: { Name: 'minecraft:stone_bricks' },
        },
        expectedRevision: commit.revision,
      },
    });
    assert.ok(prepare.ok, prepare.error?.message);
    assert.ok(prepare.value.counts.place > 0);
    commit = await engine.call('api', {
      method: 'construction.commit',
      params: { id: prepare.value.id, expectedRevision: commit.revision },
    });
    assert.ok(commit.ok, commit.error?.message);
    const summary = await engine.call('summary'),
      bytes = await engine.call('compressed', { title: 'Interpolated profile' });
    await reopened.call('import', { name: 'curve.craftlite', bytes: bytes.buffer });
    const restored = await reopened.call('summary');
    assert.equal(restored.add, summary.add);
    assert.deepEqual(
      restored.design.guides.find((g) => g.id === guide.id).recipe.points,
      config.points,
    );
    await engine.call('api', {
      method: 'history.undo',
      params: { expectedRevision: commit.revision },
    });
    assert.equal((await engine.call('summary')).add, 0);
    assert.equal((await engine.call('summary')).design.guides[0].id, guide.id);
  } finally {
    await engine.close();
    await reopened.close();
  }
});

import { CatmullRomCurve3, Vector3 } from '../../web/vendor/three.module.js';
test('compact evaluator agrees with the pinned reference in open closed and repeated-point cases', () => {
  for (const closed of [false, true])
    for (const points of [
      [
        [4, 2, 4],
        [6, 8, 9],
        [11, 3, 10],
        [19, 6, 4],
      ],
      [
        [2, 2, 2],
        [2, 2, 2],
        [8, 4, 5],
        [8, 4, 5],
      ],
    ]) {
      const curve = new CatmullRomCurve3(
        points.map((p) => new Vector3(...p)),
        closed,
        'centripetal',
      );
      for (let i = 0; i <= 100; i++) {
        const expected = curve.getPoint(i / 100).toArray(),
          actual = splinePoint(points, closed, i / 100);
        actual.forEach((n, a) => assert.ok(Math.abs(n - expected[a]) < 1e-9));
      }
    }
});

test('two-waypoint interpolation stays on the straight spatial segment', () => {
  const points = [
      [2, 3, 4],
      [10, 7, 12],
    ],
    samples = sampleSpline(points);
  for (const p of samples) {
    const t = (p[0] - 2) / 8;
    assert.ok(t >= 0 && t <= 1);
    assert.ok(Math.abs(p[1] - (3 + 4 * t)) < 1e-9);
    assert.ok(Math.abs(p[2] - (4 + 8 * t)) < 1e-9);
  }
});

test('invalid interpolation sampling density cannot silently create an unsampled path', () =>
  assert.throws(
    () =>
      sampleFigure({
        kind: 'spline',
        points: [
          [2, 2, 2],
          [8, 2, 8],
        ],
        sampleDensity: NaN,
      }),
    /采样密度/,
  ));
