import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../web/vendor/three.module.js';
import { CreateSceneView } from '../src/rendering/create-scene-view.js';
function fixture() {
  const view = new CreateSceneView({
    group: new THREE.Group(),
    textures: new Map(),
    materials: new Map(),
    makeTexture: async () => {},
  });
  const bucket = {
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
    colors: new Float32Array(9).fill(1),
    uv: new Float32Array(6),
    texture: 'wood',
    alpha: 'opaque',
  };
  const instance = {
    id: 'shaft',
    model: 'shaft',
    position: [2, 3, 4],
    axis: 'y',
    rpm: 10,
    owner: [2, 3, 4],
  };
  const data = {
    reset: true,
    textures: {},
    definitions: { shaft: { buckets: [bucket] } },
    instances: [instance],
    overrides: {},
  };
  return { view, data, instance };
}
const options = { cut: 15, height: 16 };
test('Create view rotates cached model geometry without rebuilding or losing pick ownership', async () => {
  const { view, data } = fixture();
  await view.sync(data, options);
  const node = view.objects.get('shaft').node,
    geometry = node.children[0].geometry;
  view.time = 1;
  assert.equal(view.update(), true);
  assert.ok(Math.abs(node.rotation.y - Math.PI / 3) < 1e-9);
  assert.deepEqual(node.children[0].userData.owner, [2, 3, 4]);
  assert.deepEqual(view.pinnedTextureKeys, ['wood']);
  await view.sync({ ...data, reset: false, definitions: {} }, options);
  assert.equal(view.objects.get('shaft').node, node);
  assert.equal(node.children[0].geometry, geometry);
});
test('unknown Create speed is stationary unless preview fallback is enabled', async () => {
  const { view, data, instance } = fixture();
  instance.rpm = null;
  await view.sync(data, options);
  view.time = 1;
  assert.equal(view.update(), false);
  assert.equal(view.update({ demo: true, rpmFallback: 15 }), true);
  assert.ok(Math.abs(view.objects.get('shaft').node.rotation.y - Math.PI / 2) < 1e-9);
});
test('Create view reports failed optional textures and updates clipping and translation', async () => {
  const { view, data } = fixture();
  view.makeTexture = async () => {
    throw Error('bad image');
  };
  data.textures = { broken: {} };
  data.overrides = { shaft: { type: 'translate', rpm: 16, period: 4, travel: [0, 8, 0] } };
  assert.deepEqual(await view.sync(data, { cut: 4, height: 16 }), ['纹理读取失败：broken']);
  assert.equal(view.clip.constant, 5);
  view.time = 2;
  assert.equal(view.update(), true);
  assert.deepEqual(view.objects.get('shaft').node.position.toArray(), [2, 11, 4]);
});
test('Create scene reset releases model geometry and generated belt resources', async () => {
  const { view, data } = fixture();
  data.overrides = {
    shaft: { type: 'belt', rpm: 16, min: [0, 0, 0], max: [3, 0, 1], center: [2, 0, 1] },
  };
  await view.sync(data, options);
  let disposed = 0;
  const node = view.objects.get('shaft').node;
  node.children[0].geometry.addEventListener('dispose', () => disposed++);
  for (const stripe of node.children.slice(1)) {
    stripe.geometry.addEventListener('dispose', () => disposed++);
    stripe.material.addEventListener('dispose', () => disposed++);
  }
  await view.sync(
    { reset: true, textures: {}, definitions: {}, instances: [], overrides: {} },
    options,
  );
  assert.equal(disposed, 21);
  assert.equal(view.group.children.length, 0);
  assert.equal(view.models.size, 0);
  assert.equal(view.objects.size, 0);
  assert.equal(view.time, 0);
});
