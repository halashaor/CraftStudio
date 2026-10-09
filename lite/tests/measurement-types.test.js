import test from 'node:test';
import assert from 'node:assert/strict';
import { measurementMetrics } from '../src/measurement/measurement.js';
import { DesignAPI } from '../src/api/design-api.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
test('spatial angle keeps its middle vertex and rejects collapsed arms', () => {
  assert.equal(
    measurementMetrics(
      [
        [1, 1, 1],
        [1, 1, 5],
        [1, 5, 5],
      ],
      'angle',
    ).angleDegrees,
    90,
  );
  assert.equal(
    measurementMetrics(
      [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
      ],
      'angle',
    ).angleDegrees,
    180,
  );
  assert.throws(() =>
    measurementMetrics(
      [
        [0, 0, 0],
        [0, 0, 0],
        [2, 0, 0],
      ],
      'angle',
    ),
  );
  assert.throws(() =>
    measurementMetrics(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      'angle',
    ),
  );
});
test('polyline reports accumulated length separately from chord and elevation', () => {
  const m = measurementMetrics(
    [
      [0, 0.5, 0],
      [3, 4.5, 0],
      [3, 4.5, 4],
      [3, 2.5, 4],
    ],
    'path',
  );
  assert.equal(m.totalLength, 11);
  assert.equal(m.chordLength, Math.sqrt(29));
  assert.equal(m.ascent, 4);
  assert.equal(m.descent, 2);
  assert.equal(m.rise, 2);
  assert.equal(m.segmentCount, 3);
});
test('typed metadata is portable, world-translatable and atomic without voxel edits', () => {
  const s = new Site({
      ...emptyProject(),
      origin: [-40, 64, 70],
      metadata: { originConfirmed: true },
    }),
    api = new DesignAPI({ getSite: () => s }),
    r = api.execute({
      method: 'measurements.put',
      params: {
        expectedRevision: 0,
        space: 'world',
        measurement: {
          name: 'Corner',
          kind: 'angle',
          points: [
            [-40, 64, 70],
            [-39, 64, 70],
            [-39, 65, 70],
          ],
        },
      },
    });
  assert.ok(r.ok);
  assert.equal(r.value.metrics.angleDegrees, 90);
  assert.equal(s.overlay.size, 0);
  assert.equal(
    api.execute({ method: 'measurements.list', params: { space: 'world' } }).value.items[0]
      .points[1][0],
    -39,
  );
  assert.equal(Site.unpack(s.pack()).design.measurements[0].kind, 'angle');
  assert.equal(
    api.execute({
      method: 'measurements.put',
      params: {
        expectedRevision: 1,
        measurement: {
          name: 'bad',
          kind: 'angle',
          points: [
            [0, 0, 0],
            [0, 0, 0],
            [1, 1, 1],
          ],
        },
      },
    }).ok,
    false,
  );
  assert.equal(s.design.measurements.length, 1);
  assert.ok(api.execute({ method: 'history.undo', params: { expectedRevision: 1 } }).ok);
  assert.equal(s.design.measurements, undefined);
});
