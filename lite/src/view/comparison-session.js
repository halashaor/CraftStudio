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
    this.validateSlot(slot);
    if (this.active) throw Error('请先返回当前设计，再记录方案');
    const record = {
      slot,
      name: site.title,
      capturedRevision: revision,
      capturedAt: new Date().toISOString(),
      site: site.fork(),
    };
    this.slots.set(slot, record);
    const { site: snapshot, ...descriptor } = record;
    return descriptor;
  }

  show(slot) {
    this.validateSlot(slot);
    const record = this.slots.get(slot);
    if (!record) throw Error('请先记录方案 ' + slot.toUpperCase());
    this.active = slot;
    return record.site;
  }

  end() {
    this.active = null;
  }

  get current() {
    return this.slots.get(this.active)?.site || null;
  }

  describe(workspaceId) {
    this.sync(workspaceId);
    return {
      active: this.active,
      slots: [...this.slots.values()].map(({ site, ...descriptor }) => descriptor),
    };
  }

  validateSlot(slot) {
    if (slot !== 'a' && slot !== 'b') throw Error('请选择方案 A 或 B');
  }
}
