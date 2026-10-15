import * as THREE from '../../../web/vendor/three.module.js';
import { CreateSceneView } from './create-scene-view.js';

export async function constructionMotionView(data, textures, clock) {
  if (!data?.instances.length) return null;
  const group = new THREE.Group(),
    materials = new Map();
  const view = new CreateSceneView({
    group,
    textures,
    materials,
    makeTexture: async (key) => textures.get(key),
  });
  await view.sync({ ...data, textures: {} }, { cut: 4095, height: 4096 });
  for (const material of materials.values()) {
    material.transparent = true;
    material.opacity *= 0.95;
    material.depthWrite = false;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -1;
  }
  view.time = clock.time;
  view.update(clock);
  group.userData = { kind: 'blocks', motionView: view };
  return group;
}
