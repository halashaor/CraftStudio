import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../web/vendor/three.module.js';
import { MeshSourceView } from '../src/models/mesh-source-view.js';

const triangle = new Float32Array([-1, 0, 0, 1, 0, 0, -1, 2, 0]);
const descriptor = (sourceKey = 'a', position = [4, 5, 6]) => ({
  id: 'model',
  sourceKey,
  bounds: { min: [0, 0, 0], max: [2, 2, 0] },
  transform: { position, rotation: [0, 0, 0], scale: [1, 1, 1] },
  hidden: false,
});
const summary = (source = descriptor(), revision = 0, workspaceId = 'scene') => ({
  workspaceId,
  revision,
  design: { meshSources: source ? [source] : [] },
});
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('reference transform changes and edit hiding reuse source geometry; mesh replacement disposes the previous version', async () => {
  const calls = [],
    scene = new THREE.Scene(),
    errors = [],
    view = new MeshSourceView({
      THREE,
      scene,
      requestRender() {},
      notice: (error) => errors.push(error),
      call: async (_action, params) => {
        calls.push(params);
        return { ...descriptor(params.expectedRevision >= 3 ? 'b' : 'a'), positions: triangle };
      },
    });
  view.update(summary());
  await settle();
  assert.equal(scene.children.length, 1);
  const first = scene.children[0];
  assert.deepEqual(new THREE.Vector3(0, 0, 0).applyMatrix4(first.matrix).toArray(), [4, 5, 6]);
  view.update(summary(descriptor('a', [10, 12, 14]), 1));
  assert.equal(calls.length, 1);
  assert.deepEqual(new THREE.Vector3(0, 0, 0).applyMatrix4(first.matrix).toArray(), [10, 12, 14]);
  let disposed = 0;
  first.geometry.addEventListener('dispose', () => disposed++);
  view.update(summary(descriptor(), 2), 'model');
  assert.equal(scene.children.length, 0);
  assert.equal(disposed, 1);
  view.update(summary(descriptor(), 2));
  await settle();
  assert.equal(calls.length, 1);
  view.update(summary(descriptor('b'), 3));
  await settle();
  assert.equal(calls.length, 2);
  assert.equal(view.entries.get('model').key, 'b');
  view.update(summary(null, 4));
  assert.equal(scene.children.length, 0);
  assert.equal(view.geometryCache.size, 0);
  assert.deepEqual(errors, []);
});

test('late geometry from the previous workspace or comparison cannot reappear', async () => {
  const pending = [],
    scene = new THREE.Scene(),
    errors = [],
    view = new MeshSourceView({
      THREE,
      scene,
      requestRender() {},
      notice: (error) => errors.push(error),
      call: (_action, params) => new Promise((resolve) => pending.push({ params, resolve })),
    });
  view.update(summary());
  view.update(summary(descriptor('history'), 1));
  pending[0].resolve({ ...descriptor(), positions: triangle });
  await settle();
  assert.equal(scene.children.length, 0);
  pending[1].resolve({ ...descriptor('history'), positions: triangle });
  await settle();
  assert.equal(view.entries.get('model').key, 'history');
  view.update(summary(descriptor('new'), 0, 'other-scene'));
  view.update(summary(null, 0, 'empty-scene'));
  pending[2].resolve({ ...descriptor('new'), positions: triangle });
  await settle();
  assert.equal(scene.children.length, 0);
  assert.deepEqual(errors, []);
});
