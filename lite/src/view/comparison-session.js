import { gunzipSync, strFromU8 } from 'fflate';
import { Site } from '../core/site.js';
import { Resources } from '../materials/resources.js';

const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const worldOrigin = (value) =>
  Array.isArray(value) && value.length === 3 && value.every(Number.isSafeInteger);
function validateSnapshot(site, assets) {
  if (
    !worldOrigin(site.origin) ||
    !Array.isArray(site.design?.objects) ||
    !site.design.objects.every(record) ||
    !record(site.design.animations) ||
    (site.design.componentDefinitions != null &&
      (!Array.isArray(site.design.componentDefinitions) ||
        site.design.componentDefinitions.some(
          (definition) => !record(definition) || !Array.isArray(definition.blocks),
        )))
  )
    throw Error('历史工程的原点或设计对象无效');
  if (
    !record(assets) ||
    ['models', 'images', 'textures'].some((key) => assets[key] != null && !record(assets[key])) ||
    Object.values(assets.models || {}).some(
      (model) =>
        !record(model) ||
        !Array.isArray(model.parts) ||
        model.parts.some((part) => !record(part) || !Array.isArray(part.elements)),
    )
  )
    throw Error('历史工程的模型或材质附件无效');
}

// Temporary, workspace-local views. Capturing or displaying never replaces the editable site.
export class ComparisonSession {
  constructor() {
    this.workspaceId = null;
    this.slots = new Map();
    this.active = null;
  }

  sync(workspaceId) {
    if (this.workspaceId === workspaceId) return;
    this.workspaceId = workspaceId;
    this.slots.clear();
    this.active = null;
  }

  capture(slot, site, { workspaceId, revision }) {
    this.sync(workspaceId);
    this.validateCaptureSlot(slot);
    if (this.active) throw Error('请先返回当前设计，再记录方案');
    const record = {
      slot,
      name: site.title,
      capturedRevision: revision,
      capturedAt: new Date().toISOString(),
      site: site.fork(),
    };
    this.slots.set(slot, record);
    return this.descriptor(record);
  }

  load(bytes, source, workspaceId) {
    if (!(bytes instanceof Uint8Array) && !(bytes instanceof ArrayBuffer))
      throw Error('历史版本需要完整工程字节');
    if (
      !source ||
      typeof source.projectId !== 'string' ||
      !source.projectId.trim() ||
      !Number.isSafeInteger(source.version) ||
      source.version < 1 ||
      typeof source.name !== 'string' ||
      !source.name.trim() ||
      typeof source.time !== 'string' ||
      !Number.isFinite(Date.parse(source.time)) ||
      typeof source.note !== 'string'
    )
      throw Error('历史版本缺少有效的工程、版本、名称、时间或备注');
    const pkg = JSON.parse(strFromU8(gunzipSync(new Uint8Array(bytes))));
    if (
      pkg?.liteSchema !== 1 ||
      !pkg.site?.base ||
      !Array.isArray(pkg.site.palette) ||
      !Array.isArray(pkg.site.overlay)
    )
      throw Error('不是完整的 CraftStudio 历史工程');
    if (
      !worldOrigin(pkg.site.base.origin) ||
      pkg.site.overlay.some(
        (block) =>
          !Array.isArray(block.pos) ||
          block.pos.length !== 3 ||
          block.pos.some((value) => !Number.isInteger(value) || value < 0 || value > 4095) ||
          (block.state !== null &&
            (typeof block.state?.Name !== 'string' || !block.state.Name.includes(':'))),
      )
    )
      throw Error('历史工程的原点或改动方块无效');
    const snapshot = Site.unpack(pkg.site),
      resources = new Resources();
    validateSnapshot(snapshot, pkg.assets || {});
    resources.addSaved(pkg.assets || {});
    const record = {
      slot: 'history',
      name: source.name,
      source: Object.fromEntries(
        ['projectId', 'version', 'name', 'time', 'note'].map((key) => [key, source[key]]),
      ),
      site: snapshot,
      resources,
    };
    this.sync(workspaceId);
    this.slots.set('history', record);
    this.active = 'history';
    return this.descriptor(record);
  }

  show(slot) {
    if (slot !== 'history') this.validateCaptureSlot(slot);
    const record = this.slots.get(slot);
    if (!record)
      throw Error(
        slot === 'history' ? '请先选择一个历史版本' : '请先记录方案 ' + slot.toUpperCase(),
      );
    this.active = slot;
    return record.site;
  }

  end() {
    this.active = null;
  }

  get current() {
    return this.slots.get(this.active)?.site || null;
  }

  get resources() {
    return this.slots.get(this.active)?.resources || null;
  }

  descriptor({ site, resources, ...record }) {
    return structuredClone(record);
  }

  describe(workspaceId) {
    this.sync(workspaceId);
    return {
      active: this.active,
      slots: [...this.slots.values()].map((record) => this.descriptor(record)),
    };
  }

  validateCaptureSlot(slot) {
    if (slot !== 'a' && slot !== 'b') throw Error('请选择方案 A 或 B');
  }
}
