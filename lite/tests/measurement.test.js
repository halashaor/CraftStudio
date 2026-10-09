import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentMetrics } from '../src/measurement/measurement.js';
import { DesignAPI } from '../src/api/design-api.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
test('spatial measurements preserve fractional levels and signed rise, including vertical/zero segments', () => {
  const m = segmentMetrics([
    [1, 0.5, 1],
    [4, 4.5, 1],
  ]);
  assert.equal(m.distance, 5);
  assert.equal(m.horizontal, 3);
  assert.equal(m.rise, 4);
  assert.equal(m.manhattan, 7);
  assert.equal(
    segmentMetrics([
      [0, 4, 0],
      [0, 0.5, 0],
    ]).slopePercent,
    null,
  );
  assert.equal(
    segmentMetrics([
      [0, 4, 0],
      [0, 0.5, 0],
    ]).pitchDegrees,
    -90,
  );
  assert.equal(
    segmentMetrics([
      [0, 0, 0],
      [0, 0, 0],
    ]).distance,
    0,
  );
  assert.throws(() =>
    segmentMetrics([
      [0, 0, 0],
      [NaN, 0, 0],
    ]),
  );
});
test('measurement metadata supports world coordinates, revision guards, one undo and portable restore without voxel edits', () => {
  const site = new Site({
      ...emptyProject(),
      origin: [-40, 64, 70],
      metadata: { originConfirmed: true },
    }),
    api = new DesignAPI({ getSite: () => site });
  const r = api.execute({
    method: 'measurements.put',
    params: {
      expectedRevision: 0,
      space: 'world',
      measurement: {
        name: 'Platform',
        points: [
          [-39, 64.5, 71],
          [-36, 68.5, 71],
        ],
      },
    },
  });
  assert.ok(r.ok, r.error?.message);
  assert.equal(site.overlay.size, 0);
  assert.equal(site.undo.length, 1);
  assert.deepEqual(r.value.measurement.points, [
    [1, 0.5, 1],
    [4, 4.5, 1],
  ]);
  assert.equal(
    api.execute({ method: 'measurements.list', params: { space: 'world' } }).value.items[0].metrics
      .distance,
    5,
  );
  assert.equal(
    api.execute({
      method: 'measurements.put',
      params: {
        expectedRevision: 0,
        measurement: {
          name: 'stale',
          points: [
            [0, 0, 0],
            [1, 1, 1],
          ],
        },
      },
    }).ok,
    false,
  );
  const restored = Site.unpack(JSON.parse(JSON.stringify(site.pack())));
  assert.deepEqual(restored.design.measurements, site.design.measurements);
  api.execute({
    method: 'measurements.remove',
    params: { expectedRevision: 1, id: r.value.measurement.id },
  });
  assert.equal(site.design.measurements.length, 0);
  api.execute({ method: 'history.undo', params: { expectedRevision: 2 } });
  assert.equal(site.design.measurements.length, 1);
  api.execute({ method: 'history.undo', params: { expectedRevision: 3 } });
  assert.equal(site.design.measurements, undefined);
});
