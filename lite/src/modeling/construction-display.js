import { coordKey } from '../core/coordinates.js';

// A render-only mask owned by the current prepared operation. Never changes the Site.
export class ConstructionDisplay {
  constructor() {
    this.id = null;
  }
  set(draft, { id, visible = true }, context) {
    if (
      visible &&
      (!draft ||
        draft.id !== id ||
        draft.revision !== context.revision ||
        draft.workspaceId !== context.workspaceId ||
        !draft.replacementMask)
    )
      throw Error('形态预览已失效，请重新生成');
    const before = this.id;
    if (visible) this.id = id;
    else if (this.id === id) this.id = null;
    return { changed: before !== this.id };
  }
  clear(id) {
    if (this.id === id) this.id = null;
  }
  mask(draft, context) {
    return draft?.id === this.id &&
      draft.revision === context.revision &&
      draft.workspaceId === context.workspaceId
      ? draft.replacementMask
      : null;
  }
}
export function replacementMask(operations) {
  if (!operations.length) return null;
  const cells = [...new Set(operations.map((op) => coordKey(...op.pos)))],
    keys = new Set(cells);
  return {
    cells,
    keys,
    min: [0, 1, 2].map((a) => operations.reduce((v, op) => Math.min(v, op.pos[a]), Infinity)),
    max: [0, 1, 2].map((a) => operations.reduce((v, op) => Math.max(v, op.pos[a]), -Infinity)),
  };
}
