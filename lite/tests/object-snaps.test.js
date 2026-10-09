import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pathMidpoint,
  guideSnapTargets,
  nearestScreenSnap,
  segmentIntersection,
  guideSnapSegments,
  nearbyIntersections,
} from '../src/sketch/object-snaps.js';
import { constrainSketch } from '../src/sketch/sketch.js';
test('midpoint follows actual polyline length rather than endpoint average or bounding-box center', () => {
  assert.deepEqual(
    pathMidpoint([
      [0, 0, 0],
      [4, 0, 0],
      [4, 0, 8],
    ]),
    [4, 0, 2],
  );
  const targets = guideSnapTargets([
    {
      id: 'g',
      points: [
        [0, 0, 0],
        [4, 0, 0],
        [4, 0, 8],
      ],
    },
  ]);
  assert.deepEqual(targets.find((t) => t.kind === 'midpoint').point, [4, 0, 2]);
  assert.equal(targets.filter((t) => t.kind === 'center').length, 0);
});
test('screen snapping respects pixel radius, depth, plane and excluded/hidden guides', () => {
  const guides = [
      {
        id: 'a',
        name: 'A',
        points: [
          [1.25, 2, 0],
          [3, 2, 0],
        ],
      },
      {
        id: 'b',
        hidden: true,
        points: [
          [1, 2, 0],
          [2, 2, 0],
        ],
      },
    ],
    targets = guideSnapTargets(guides),
    project = (p) => [p[0] * 10, p[1] * 10, 0];
  assert.equal(nearestScreenSnap(targets, { pointer: [13, 20], project }).point[0], 1.25);
  assert.equal(
    nearestScreenSnap(targets, {
      pointer: [13, 20],
      project,
      plane: { origin: [0, 0, 0], normal: [0, 1, 0] },
    }),
    null,
  );
  assert.equal(nearestScreenSnap(targets, { pointer: [100, 100], project }), null);
  assert.equal(nearestScreenSnap(targets, { pointer: [13, 20], project: () => [13, 20, 2] }), null);
  assert.equal(guideSnapTargets(guides, { excludeId: 'a' }).length, 0);
});
test('circle centers are explicit and UI cursor-snapped/typed positions are not quantized again', () => {
  const targets = guideSnapTargets([
    {
      id: 'circle',
      points: [
        [3, 2, 1],
        [1, 2, 3],
        [3, 2, 1],
      ],
      recipe: {
        kind: 'circle',
        points: [
          [1.25, 2, 1.25],
          [3, 2, 1.25],
        ],
      },
    },
  ]);
  assert.deepEqual(targets.find((t) => t.kind === 'center').point, [1.25, 2, 1.25]);
  const p = [
      [1.25, 2, 1.25],
      [4.125, 2, 1.25],
    ],
    c = constrainSketch({
      kind: 'line',
      plane: 'xz',
      snap: 0.5,
      snapApplied: true,
      points: p,
      constraint: 'free',
    });
  assert.deepEqual(c.points, p);
  assert.notDeepEqual(constrainSketch({ ...c, snapApplied: false }).points, p);
});
test('rectangles expose actual corners, edge midpoints and center rather than one perimeter midpoint', () => {
  const targets = guideSnapTargets([
    {
      id: 'rect',
      recipe: { kind: 'rectangle' },
      points: [
        [0, 2, 0],
        [4, 2, 0],
        [4, 2, 6],
        [0, 2, 6],
        [0, 2, 0],
      ],
    },
  ]);
  assert.equal(targets.filter((t) => t.kind === 'endpoint').length, 4);
  assert.deepEqual(
    targets.filter((t) => t.kind === 'midpoint').map((t) => t.point),
    [
      [2, 2, 0],
      [4, 2, 3],
      [2, 2, 6],
      [0, 2, 3],
    ],
  );
  assert.deepEqual(targets.find((t) => t.kind === 'center').point, [2, 2, 3]);
});
test('intersection snapping distinguishes true spatial crossings from skew, parallel and extended lines', () => {
  assert.deepEqual(segmentIntersection([0, 0, 0], [4, 4, 4], [0, 4, 4], [4, 0, 0]), [2, 2, 2]);
  assert.equal(segmentIntersection([0, 0, 0], [4, 0, 0], [2, 1, -2], [2, 1, 2]), null);
  assert.equal(segmentIntersection([0, 0, 0], [1, 0, 0], [2, 0, -1], [2, 0, 1]), null);
  assert.equal(segmentIntersection([0, 0, 0], [4, 0, 0], [1, 0, 0], [3, 0, 0]), null);
  assert.equal(segmentIntersection([0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 0, 0]), null);
});
test('nearby intersections retain source names and obey workplanes, view depth, hidden guides and endpoint priority', () => {
  const guides = [
      {
        id: 'a',
        name: 'Facade',
        points: [
          [0, 2, 0],
          [6, 2, 0],
        ],
      },
      {
        id: 'b',
        name: 'Axis',
        points: [
          [2, 2, -3],
          [2, 2, 3],
        ],
      },
      {
        id: 'hidden',
        hidden: true,
        points: [
          [1, 2, -3],
          [1, 2, 3],
        ],
      },
    ],
    segments = guideSnapSegments(guides),
    options = { pointer: [20, 0], project: (p) => [p[0] * 10, p[2] * 10, 0] };
  const targets = nearbyIntersections(segments, options);
  assert.equal(targets.length, 1);
  assert.deepEqual(targets[0].point, [2, 2, 0]);
  assert.equal(targets[0].name, 'Facade × Axis');
  assert.deepEqual(targets[0].sourceIds, ['a', 'b']);
  assert.deepEqual(nearbyIntersections(segments, { ...options, excludeId: 'a' }), []);
  assert.deepEqual(nearbyIntersections(segments, { ...options, pointer: [1000, 1000] }), []);
  assert.equal(
    nearestScreenSnap(targets, { ...options, plane: { origin: [0, 0, 0], normal: [0, 1, 0] } }),
    null,
  );
  assert.equal(nearestScreenSnap(targets, { ...options, project: () => [20, 0, 2] }), null);
  assert.equal(
    nearestScreenSnap([...targets, { kind: 'endpoint', point: [2, 2, 0] }], options).kind,
    'endpoint',
  );
  assert.equal(
    nearestScreenSnap([{ kind: 'midpoint', point: [2, 2, 0] }, ...targets], options).kind,
    'intersection',
  );
});
test('spatial bounds retain every actual crossing and workplane prefilter keeps straddling segments', () => {
  const guides = Array.from({ length: 24 }, (_, i) => ({
      id: String(i),
      points: [
        [i % 6, 0, Math.floor(i / 6)],
        [(i * 7) % 9, 0, (i * 3) % 8],
      ],
    })),
    segments = guideSnapSegments(guides),
    options = { pointer: [4, 4], project: (p) => [p[0], p[2], 0], radius: 30 };
  const expected = [];
  for (let i = 0; i < segments.length; i++)
    for (let j = i + 1; j < segments.length; j++) {
      const point = segmentIntersection(segments[i].a, segments[i].b, segments[j].a, segments[j].b);
      if (point) expected.push({ sourceIds: [segments[i].guideId, segments[j].guideId], point });
    }
  assert.deepEqual(
    nearbyIntersections(segments, options).map(({ sourceIds, point }) => ({ sourceIds, point })),
    expected,
  );
  const spatial = guideSnapSegments([
    {
      id: 'through',
      points: [
        [0, -2, 0],
        [0, 2, 0],
      ],
    },
    {
      id: 'across',
      points: [
        [-2, 0, 0],
        [2, 0, 0],
      ],
    },
    {
      id: 'outside',
      points: [
        [-2, 4, 0],
        [2, 4, 0],
      ],
    },
  ]);
  const result = nearbyIntersections(spatial, {
    pointer: [0, 0],
    project: (p) => [p[0], p[1], 0],
    plane: { origin: [0, 0, 0], normal: [0, 1, 0] },
  });
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].point, [0, 0, 0]);
  // Callers supplying plain segments receive the same bounds preflight.
  assert.equal(
    nearbyIntersections(
      spatial.map(({ min, max, ...segment }) => segment),
      { ...options, pointer: [0, 0] },
    ).length,
    1,
  );
});
test('sampled curve joins and closed seams are not self intersections, but nonadjacent crossings remain targets', () => {
  const options = { pointer: [0, 0], project: (p) => [p[0], p[2], 0], radius: 30 };
  assert.deepEqual(
    nearbyIntersections(
      guideSnapSegments([
        {
          id: 'curve',
          points: [
            [-2, 0, 0],
            [0, 0, 1],
            [2, 0, 0],
          ],
        },
      ]),
      options,
    ),
    [],
  );
  assert.deepEqual(
    nearbyIntersections(
      guideSnapSegments([
        {
          id: 'loop',
          points: [
            [-2, 0, -2],
            [2, 0, -2],
            [2, 0, 2],
            [-2, 0, 2],
            [-2, 0, -2],
          ],
        },
      ]),
      options,
    ),
    [],
  );
  const crossed = nearbyIntersections(
    guideSnapSegments([
      {
        id: 'crossed',
        points: [
          [-2, 0, -2],
          [2, 0, 2],
          [-2, 0, 2],
          [2, 0, -2],
        ],
      },
    ]),
    options,
  );
  assert.equal(crossed.length, 1);
  assert.deepEqual(crossed[0].point, [0, 0, 0]);
  const paths = nearbyIntersections(
    guideSnapSegments([
      {
        id: 'parts',
        paths: [
          [
            [-2, 0, 0],
            [2, 0, 0],
          ],
          [
            [0, 0, -2],
            [0, 0, 2],
          ],
        ],
      },
    ]),
    options,
  );
  assert.equal(paths.length, 1);
  assert.deepEqual(paths[0].point, [0, 0, 0]);
});
