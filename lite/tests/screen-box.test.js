import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../web/vendor/three.module.js';
import {
  screenBoxSelection,
  screenBoxMatches,
  screenObjectMatches,
  visibleCell,
} from '../src/selection/screen-box.js';
import { nearestScreenNode } from '../src/sketch/sketch-node-drag.js';
import { drawingPoints } from '../src/sketch/sketch-drawing.js';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
const make = () =>
  new Site({
    ...emptyProject(),
    size: [16, 16, 16],
    palette: [{ Name: 'minecraft:oak_planks' }],
    blocks: [
      { pos: [1, 1, 1], state: 0 },
      { pos: [1, 1, 3], state: 0 },
    ],
  });
function options(depth = 'visible') {
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
  camera.position.set(1.5, 1.5, 10);
  camera.lookAt(1.5, 1.5, 0);
  camera.updateMatrixWorld();
  const m = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  return {
    matrix: m.toArray(),
    inverse: m.clone().invert().toArray(),
    viewport: [600, 600],
    box: { min: [0, 0], max: [600, 600] },
    crossing: true,
    depth,
  };
}
test('screen rectangle selects front cells by default and includes rear cells only in through mode', () => {
  const site = make();
  assert.deepEqual(screenBoxSelection(site, options()).members, [[1, 1, 3]]);
  assert.equal(screenBoxSelection(site, options('through')).members.length, 2);
  assert.equal(site.summary().changes, 0);
  assert.equal(site.undo.length, 0);
});
test('hidden collections and display filters are excluded from both selection and occlusion', () => {
  const site = make();
  site.design.collections = [
    { id: 'parent', name: 'Parent', hidden: true },
    { id: 'child', name: 'Child', parentId: 'parent' },
  ];
  site.design.objects = [
    {
      id: 'front',
      name: 'Front',
      collectionId: 'child',
      cells: [coordKey(1, 1, 3)],
      min: [1, 1, 3],
      max: [1, 1, 3],
    },
  ];
  assert.deepEqual(screenBoxSelection(site, options()).members, [[1, 1, 1]]);
  assert.equal(screenBoxSelection(site, { ...options(), showExisting: false }), null);
});
test('window selection requires full bounds; crossing selects touched cells without endpoint terrain projection', () => {
  const points = [
      [10, 10, 0],
      [20, 20, 0],
    ],
    box = { min: [15, 15], max: [25, 25] };
  assert.equal(screenBoxMatches(points, box, true), true);
  assert.equal(screenBoxMatches(points, box, false), false);
  const site = make();
  assert.equal(
    screenBoxSelection(site, { ...options('through'), box: { min: [590, 590], max: [600, 600] } }),
    null,
  );
});
test('perspective ray traversal works from outside the scene and empty diagonal ties terminate', () => {
  assert.equal(
    visibleCell([-3, 1.5, 1.5], [1.5, 1.5, 1.5], [1, 1, 1], (p) => p[0] === 0),
    false,
  );
  assert.equal(
    visibleCell([-3, 1.5, 1.5], [1.5, 1.5, 1.5], [1, 1, 1], () => false),
    true,
  );
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(1.5, 1.5, 10);
  camera.lookAt(1.5, 1.5, 0);
  camera.updateMatrixWorld();
  const m = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  assert.deepEqual(
    screenBoxSelection(make(), {
      ...options(),
      matrix: m.toArray(),
      inverse: m.clone().invert().toArray(),
    }).members,
    [[1, 1, 3]],
  );
});
test('screen picking finds small node centers within a pixel tolerance and ignores off-camera nodes', () => {
  const nodes = [{ id: 1 }, { id: 2 }, { id: 3 }],
    positions = new Map([
      [1, [20, 20, 0]],
      [2, [30, 30, 0]],
      [3, [21, 21, 2]],
    ]);
  assert.equal(
    nearestScreenNode(nodes, { pointer: [23, 22], project: (n) => positions.get(n.id) }).id,
    1,
  );
  assert.equal(
    nearestScreenNode(nodes, { pointer: [100, 100], project: (n) => positions.get(n.id) }),
    null,
  );
});
test('surface-picked spatial Bezier retains actual endpoint elevation while explicit planar drawing still locks its plane', () => {
  const spatial = drawingPoints('bezier', [[12, 3, 7]], [24, 8, 19], 'xz', null, true);
  assert.deepEqual(spatial.at(-1), [24, 8, 19]);
  assert.ok(spatial[1][1] > 3);
  assert.equal(drawingPoints('bezier', [[12, 3, 7]], [24, 8, 19], 'xz').at(-1)[1], 3);
});

test('object box picking uses exact member cells, not empty holes in a large bounding box', () => {
  const object = {
      min: [0, 0, 0],
      max: [10, 0, 0],
      cells: [
        [0, 0, 0],
        [10, 0, 0],
      ],
    },
    project = (p) => [p[0], p[1], 0];
  assert.equal(screenObjectMatches(object, { project, box: { min: [5, 0], max: [6, 1] } }), false);
  assert.equal(screenObjectMatches(object, { project, box: { min: [0.5, 0], max: [2, 1] } }), true);
  assert.equal(
    screenObjectMatches(object, { project, box: { min: [0.5, 0], max: [2, 1] }, crossing: false }),
    false,
  );
});
