// Pairs changed geometry with hiding its old cells; the canonical Site is untouched.
export class ReplacementPreview {
  constructor({ call, render, status = () => {} }) {
    Object.assign(this, { call, render, status });
    this.requested = null;
    this.version = 0;
    this.pending = Promise.resolve();
    this.failed = false;
    this.needsRestore = false;
  }
  show(draft, visible) {
    if (!draft?.replacesGeometry) return this.clear();
    const next = { id: draft.id, visible };
    if (this.requested?.id === next.id && this.requested.visible === visible && !this.failed)
      return this.pending;
    this.requested = next;
    this.failed = false;
    if (visible) this.needsRestore = true;
    const version = ++this.version;
    this.status('updating');
    this.pending = (async () => {
      try {
        const result = await this.call('constructionDisplay', next);
        if (version !== this.version) return;
        if (result.changed || this.needsRestore) await this.render();
        if (version === this.version) {
          this.needsRestore = visible;
          this.status(visible ? 'after' : 'before');
        }
      } catch (error) {
        if (version === this.version) {
          this.failed = true;
          throw error;
        }
      }
    })();
    return this.pending;
  }
  clear() {
    const old = this.requested;
    if (!old || (!old.visible && !this.failed)) return this.pending;
    this.requested = { id: old.id, visible: false };
    this.failed = false;
    const version = ++this.version;
    this.status('updating');
    this.pending = (async () => {
      try {
        const result = await this.call('constructionDisplay', { id: old.id, visible: false });
        if (version !== this.version) return;
        if (result.changed || this.needsRestore) await this.render();
        if (version === this.version) {
          this.requested = null;
          this.needsRestore = false;
          this.status('before');
        }
      } catch (error) {
        if (version === this.version) {
          this.failed = true;
          throw error;
        }
      }
    })();
    return this.pending;
  }
}
