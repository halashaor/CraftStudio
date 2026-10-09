// Routes a material choice to the operation that requested it, or back to the brush.
export class MaterialPicker {
  constructor({ $, openShelf }) {
    this.$ = $;
    this.openShelf = openShelf;
    this.receiver = null;
    this.observer = new MutationObserver((records) => {
      const receiver = this.receiver;
      if (!receiver) return;
      const closed = records.some(
        ({ target, attributeName, oldValue }) =>
          target === receiver.node &&
          ((attributeName === 'hidden' && (oldValue === null || target.hidden)) ||
            (attributeName === 'open' && !target.open)),
      );
      if (closed) this.clear();
    });
  }
  observe(node, attribute) {
    this.observer.observe(node, {
      attributes: true,
      attributeFilter: [attribute],
      attributeOldValue: true,
    });
  }
  request(callback, owner, node, label) {
    this.receiver = { callback, active: () => owner.isActive() && !node.hidden, node, label };
    this.openShelf();
    this.heading();
  }
  choose(state, name) {
    if (!this.receiver) return false;
    if (!this.receiver.active()) {
      this.clear();
      return false;
    }
    this.receiver.callback(state, name);
    return true;
  }
  clear() {
    this.receiver = null;
    this.heading();
  }
  heading() {
    const heading = this.$('workspace-shelf')?.querySelector('.workspace-shelf-header > strong');
    if (heading)
      heading.textContent = this.receiver ? '选择素材 · ' + this.receiver.label : '素材与构件';
  }
}
