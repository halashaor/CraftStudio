import * as THREE from '../../../web/vendor/three.module.js';

// Render-only Create state. Game motion descriptors remain owned by the shared engine.
export class CreateSceneView {
  constructor({ group, textures, materials, makeTexture }) {
    Object.assign(this, { group, textures, materials, makeTexture });
    this.models = new Map();
    this.objects = new Map();
    this.overrides = {};
    this.time = 0;
    this.clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 4096);
  }
  get pinnedTextureKeys() {
    return [...this.models.values()].flatMap((model) =>
      model.map((item) => item.bucket.texture).filter(Boolean),
    );
  }
  removeObject(object) {
    this.group.remove(object.node);
    for (const child of object.node.children) {
      if (child.userData.beltIndex === undefined) continue;
      child.geometry.dispose();
      child.material.dispose();
    }
  }
  material(b) {
    const key = (b.texture || 'color') + '|' + b.alpha;
    if (!this.materials.has(key)) {
      const transparent = b.alpha === 'transparent';
      this.materials.set(
        key,
        new THREE.MeshLambertMaterial({
          map: this.textures.get(b.texture) || null,
          vertexColors: true,
          side: THREE.DoubleSide,
          alphaTest: 0.1,
          transparent,
          opacity: transparent ? 0.76 : 1,
          depthWrite: !transparent,
        }),
      );
    }
    const m = this.materials.get(key);
    m.clippingPlanes = [this.clip];
    return m;
  }
  async sync(data, { cut, height }) {
    this.overrides = data.overrides || {};
    this.clip.constant = cut >= height - 1 ? 4096 : cut + 1;
    if (data.reset) {
      for (const model of this.models.values()) for (const item of model) item.geometry.dispose();
      this.models.clear();
      for (const object of this.objects.values()) this.removeObject(object);
      this.objects.clear();
      this.time = 0;
    }
    const textureEntries = Object.entries(data.textures);
    const loaded = await Promise.allSettled(
      textureEntries.map(([key, info]) => this.makeTexture(key, info)),
    );
    const failedTextures = loaded.flatMap((result, index) =>
      result.status === 'rejected' ? ['纹理读取失败：' + textureEntries[index][0]] : [],
    );
    const changedModels = new Set(Object.keys(data.definitions));
    for (const [id, model] of Object.entries(data.definitions)) {
      for (const old of this.models.get(id) || []) old.geometry.dispose();
      const items = model.buckets.map((b) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(b.normals, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(b.colors, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(b.uv, 2));
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        return { geometry, bucket: b };
      });
      this.models.set(id, items);
    }
    const live = new Set();
    for (const d of data.instances) {
      live.add(d.id);
      let object = this.objects.get(d.id);
      const motionKey = JSON.stringify(this.overrides[d.id] || {});
      if (
        !object ||
        object.motionKey !== motionKey ||
        object.model !== d.model ||
        changedModels.has(d.model)
      ) {
        if (object) this.removeObject(object);
        const node = new THREE.Group();
        for (const item of this.models.get(d.model) || []) {
          const mesh = new THREE.Mesh(item.geometry, this.material(item.bucket));
          mesh.userData = { owner: d.owner, readOnly: !!d.readOnly, motion: d };
          node.add(mesh);
        }
        if (this.overrides[d.id]?.type === 'belt') {
          const a = this.overrides[d.id],
            width = a.max[0] - a.min[0] + 1,
            depth = a.max[2] - a.min[2] + 1;
          for (let i = 0; i < 10; i++) {
            const stripe = new THREE.Mesh(
              new THREE.BoxGeometry(0.08, 0.025, depth * 0.85),
              new THREE.MeshLambertMaterial({ color: 0xd4bb80 }),
            );
            stripe.userData.beltIndex = i;
            stripe.position.set(
              -width / 2 + (i / 10) * width,
              a.max[1] + 1 - a.center[1] + 0.03,
              0,
            );
            stripe.userData.owner = d.owner;
            node.add(stripe);
          }
        }
        object = { node, model: d.model, descriptor: d, motionKey };
        this.objects.set(d.id, object);
        this.group.add(node);
      }
      object.descriptor = d;
      object.node.position.set(...d.position);
      for (const child of object.node.children) child.userData.motion = d;
    }
    for (const [id, object] of this.objects)
      if (!live.has(id)) {
        this.removeObject(object);
        this.objects.delete(id);
      }
    return failedTextures;
  }
  update({ demo = false, rpmFallback = 0 } = {}) {
    let moving = false;
    for (const { node, descriptor: d } of this.objects.values()) {
      const a = this.overrides[d.id],
        rpm = a?.rpm ?? (d.rpm === null ? (demo ? rpmFallback : 0) : d.rpm);
      node.position.set(...d.position);
      node.rotation.set(0, 0, 0);
      const axis = a?.axis || d.axis;
      if (axis) {
        node.rotation[axis] =
          (((d.savedAngle || 0) +
            (a?.type === 'swing'
              ? Math.sin((this.time * 2 * Math.PI) / (a.period || 6)) * 45
              : this.time * rpm * 6)) *
            Math.PI) /
          180;
        if (rpm) moving = true;
      }
      if (a && ['translate', 'path', 'belt'].includes(a.type)) {
        node.rotation.set(0, 0, 0);
        const t = ((this.time / (a.period || 6)) * rpm) / 16,
          factor = ((t % 1) + 1) % 1;
        if (a.type === 'path' && a.route?.length > 1) {
          const v = factor * a.route.length,
            i = Math.floor(v),
            from = new THREE.Vector3(...a.route[i]),
            to = new THREE.Vector3(...a.route[(i + 1) % a.route.length]);
          node.position.add(from.lerp(to, v - i));
        } else if (a.type === 'translate')
          node.position.add(
            new THREE.Vector3(...(a.travel || [0, 5, 0])).multiplyScalar(
              (1 - Math.cos(t * 2 * Math.PI)) / 2,
            ),
          );
        else if (a.type === 'belt') {
          const width = a.max?.[0] - a.min?.[0] + 1 || 1;
          for (const child of node.children)
            if (child.userData.beltIndex !== undefined)
              child.position.x =
                -width / 2 + ((child.userData.beltIndex / 10 + factor) % 1) * width;
        }
        if (rpm) moving = true;
      }
    }
    return moving;
  }
}
