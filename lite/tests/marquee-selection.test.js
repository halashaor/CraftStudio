import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../web/vendor/three.module.js';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { screenBoxSelection } from '../src/selection/screen-box.js';
import {
  ScreenSelectionQuery,
  selectionFeedback,
} from '../src/selection/screen-selection-query.js';
import { MarqueeQuery } from '../src/selection/marquee-query.js';
import { combineSelection, knownEmptySelection } from '../src/selection/selection-mask.js';

function fixture() {
  const blocks = [];
  for (let x = 0; x < 8; x++)
    for (let y = 0; y < 3; y++)
      for (let z = 0; z < 7; z++)
        if ((x + y + z) % 3) blocks.push({ pos: [x, y, z], state: x % 2 });
  return new Site({
    ...emptyProject(),
    size: [12, 12, 12],
    palette: [
      { Name: 'minecraft:oak_planks' },
      { Name: 'minecraft:oak_slab', Properties: { type: 'bottom' } },
    ],
    blocks,
  });
}
function options() {
  const camera = new THREE.PerspectiveCamera(48, 1.5, 0.1, 100);
  camera.position.set(12, 11, 14);
  camera.lookAt(3, 1, 3);
  camera.updateMatrixWorld();
  const m = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  return {
    matrix: m.toArray(),
    inverse: m.clone().invert().toArray(),
    viewport: [900, 600],
    box: { min: [0, 0], max: [900, 600] },
    expectedRevision: 0,
  };
}
test('moving cached rectangles match authoritative selection for visibility, crossing, and slabs', () => {
  const site = fixture(),
    query = new ScreenSelectionQuery();
  for (const depth of ['visible', 'through'])
    for (const crossing of [true, false])
      for (let i = 0; i < 8; i++) {
        const p = {
          ...options(),
          depth,
          crossing,
          box: { min: [180 + i * 24, 110 + i * 9], max: [750 - i * 19, 520 - i * 17] },
        };
        assert.deepEqual(query.query(site, p), screenBoxSelection(site, p));
      }
  assert.equal(site.undo.length, 0);
});
test('scene revisions, view filters, isolation, and different scenes invalidate cached answers', () => {
  const site = fixture(),
    query = new ScreenSelectionQuery(),
    p = { ...options(), depth: 'through' };
  const first = query.query(site, p);
  assert.ok(first.members.length);
  site.design.objects = [
    {
      id: 'hidden',
      hidden: true,
      cells: first.members.map((v) => coordKey(...v)),
      min: first.min,
      max: first.max,
    },
  ];
  assert.equal(query.query(site, { ...p, expectedRevision: 1 }), null);
  assert.deepEqual(query.query(fixture(), p), first);
  assert.equal(query.query(fixture(), { ...p, isolateKeys: new Set() }), null);
  assert.equal(query.query(fixture(), { ...p, showExisting: false }), null);
});
test('preview counts affect only relevant selected cells; visual sampling never truncates selection', () => {
  const members = Array.from({ length: 30 }, (_, x) => [x, 0, 0]),
    result = { range: { members } },
    selection = { min: [0, 0, 0], max: [9, 0, 0] };
  for (const [operation, expected] of [
    ['replace', 30],
    ['add', 20],
    ['subtract', 10],
    ['intersect', 10],
  ]) {
    const feedback = selectionFeedback(result, selection, operation, 3);
    assert.equal(feedback.hits, 30);
    assert.equal(feedback.affected, expected);
    assert.equal(feedback.shown, 3);
    assert.equal(feedback.coordinates.length, 9);
  }
  assert.equal(result.range.members.length, 30);
});
test('object preview and final query use identical exact members including holes', () => {
  const site = fixture(),
    query = new ScreenSelectionQuery(),
    p = { ...options(), target: 'objects' };
  site.design.objects = [
    { id: 'two', min: [0, 0, 0], max: [7, 0, 0], cells: [coordKey(0, 0, 0), coordKey(7, 0, 0)] },
  ];
  assert.equal(query.query(site, { ...p, preview: true }).hits, 2);
  assert.equal(query.query(site, p).range.members.length, 2);
  assert.deepEqual(query.query(site, p).objectIds, ['two']);
});

test('subtracting every explicit member clears the result without mistaking unknown box masks for empty', () => {
  const region = {
    min: [0, 0, 0],
    max: [2, 0, 0],
    members: [
      [0, 0, 0],
      [2, 0, 0],
    ],
  };
  assert.equal(knownEmptySelection(combineSelection(region, region, 'subtract')), true);
  assert.equal(
    knownEmptySelection(
      combineSelection(
        region,
        { min: [0, 0, 0], max: [0, 0, 0], members: [[0, 0, 0]] },
        'subtract',
      ),
    ),
    false,
  );
  assert.equal(knownEmptySelection({ min: [0, 0, 0], max: [2, 0, 0] }), false);
});
test('rapid drag queries coalesce to one successor; cancelled old replies never revive selection', async () => {
  const pending = [],
    shown = [];
  const query = new MarqueeQuery({
    run: (input) => new Promise((resolve) => pending.push({ input, resolve })),
    show: (result, input) => shown.push(input),
    fail: (e) => {
      throw e;
    },
  });
  query.update(1);
  query.update(2);
  query.update(3);
  assert.equal(pending.length, 1);
  pending[0].resolve('first');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(
    pending.map((v) => v.input),
    [1, 3],
  );
  query.cancel();
  query.update(4);
  pending[1].resolve('cancelled');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(shown, [1]);
  assert.equal(pending[2].input, 4);
  pending[2].resolve('current');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(shown, [1, 4]);
});
