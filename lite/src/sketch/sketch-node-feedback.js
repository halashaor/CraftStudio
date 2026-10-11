// Hover and drag share existing node meshes; only their material, size and cursor change.
export class SketchNodeFeedback {
  constructor({ element, changed }) {
    Object.assign(this, { element, changed });
    this.node = null;
    this.dragging = false;
    this.cursor = null;
    this.previousCursor = '';
  }

  get ownsCursor() {
    return this.cursor !== null && this.element.style.cursor === this.cursor;
  }

  show(node, dragging = false) {
    if (this.node === node && this.dragging === dragging) return;
    if (!node) dragging = false;
    if (node && this.cursor === null) this.previousCursor = this.element.style.cursor;
    if (node) {
      this.cursor = dragging ? 'grabbing' : 'grab';
      this.element.style.cursor = this.cursor;
    } else {
      if (this.ownsCursor) this.element.style.cursor = this.previousCursor;
      this.cursor = null;
    }
    this.node = node;
    this.dragging = dragging;
    this.changed();
  }

  clear() {
    this.show(null);
  }

  appearance(node, selected, endpoint) {
    const hovered = node === this.node,
      dragging = hovered && this.dragging;
    return {
      color: dragging
        ? 0xffd56a
        : selected
          ? 0xffffff
          : hovered
            ? 0x65e5f0
            : endpoint
              ? 0x80cfff
              : 0xf8c480,
      size: dragging ? 8 : selected && hovered ? 9 : selected || hovered ? 7 : 5,
      state: dragging
        ? 'dragging'
        : selected && hovered
          ? 'selected-hover'
          : hovered
            ? 'hover'
            : selected
              ? 'selected'
              : 'idle',
    };
  }
}
