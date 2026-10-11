import { meshPlacementMatrix } from './mesh-transform.js';

// Source models are visual references. They never participate in voxel picking or exports.
export class MeshSourceView {
  constructor({ THREE, scene, call, requestRender, notice }) {
    Object.assign(this, { THREE, scene, call, requestRender, notice });
    this.entries = new Map();
    this.geometryCache = new Map();
    this.pending = new Map();
    this.context = null;
    this.descriptors = new Map();
    this.epoch = 0;
  }

  remove(id) {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.scene.remove(entry.mesh);
    entry.mesh.geometry.dispose();
    entry.mesh.material.dispose();
    this.entries.delete(id);
  }

  clear() {
    this.epoch++;
    for (const id of this.entries.keys()) this.remove(id);
    this.pending.clear();
    this.geometryCache.clear();
    this.descriptors.clear();
    this.requestRender();
  }

  update(summary, editingSourceId = null) {
    const context = summary && {
      workspaceId: summary.workspaceId,
      revision: summary.revision,
    };
    if (this.context?.workspaceId !== context?.workspaceId) this.clear();
    this.context = context;
    this.descriptors = new Map(
      (summary?.design?.meshSources || [])
        .filter((source) => !source.hidden && source.id !== editingSourceId)
        .map((source) => [source.id, source]),
    );
    const retainedKeys = new Set(
      (summary?.design?.meshSources || []).map((source) => source.sourceKey),
    );
    for (const key of this.geometryCache.keys())
      if (!retainedKeys.has(key)) this.geometryCache.delete(key);
    for (const [id, entry] of this.entries) {
      const source = this.descriptors.get(id);
      if (!source || source.sourceKey !== entry.key) this.remove(id);
    }
    for (const source of this.descriptors.values()) {
      const entry = this.entries.get(source.id);
      if (entry) this.transform(entry.mesh, source);
      else this.load(source, context);
    }
    this.requestRender();
  }

  transform(mesh, source) {
    mesh.matrix.fromArray(meshPlacementMatrix(source.transform));
    mesh.matrixWorldNeedsUpdate = true;
  }

  async load(source, context) {
    const key = `${source.sourceKey}:${context.revision}`;
    if (this.pending.get(source.id)?.key === key) return;
    const token = { key, epoch: this.epoch };
    this.pending.set(source.id, token);
    try {
      const result =
        this.geometryCache.get(source.sourceKey) ||
        (await this.call('meshSourceGeometry', {
          id: source.id,
          workspaceId: context.workspaceId,
          expectedRevision: context.revision,
        }));
      if (this.pending.get(source.id) !== token || token.epoch !== this.epoch) return;
      const current = this.descriptors.get(source.id);
      if (!current || current.sourceKey !== result.sourceKey) return;
      this.geometryCache.set(source.sourceKey, result);
      const { THREE } = this,
        geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          color: 0xa69abc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        }),
      );
      mesh.matrixAutoUpdate = false;
      mesh.userData.meshSourceId = source.id;
      this.transform(mesh, current);
      this.remove(source.id);
      this.entries.set(source.id, { mesh, key: result.sourceKey });
      this.scene.add(mesh);
      this.requestRender();
    } catch (error) {
      if (
        this.pending.get(source.id) === token &&
        token.epoch === this.epoch &&
        this.descriptors.has(source.id)
      )
        this.notice(`模型参考未显示：${error.message}`, true);
    } finally {
      if (this.pending.get(source.id) === token) this.pending.delete(source.id);
    }
  }
}
