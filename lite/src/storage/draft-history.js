import { VoxelOverlayMap } from '../core/voxel-overlay-map.js';
const key = (p) => p[0] + 4096 * (p[2] + 4096 * p[1]);
const bucket = (k) =>
  ((k >>> 4) & 255) | (((k >>> 16) & 255) << 8) | (Math.floor(k / 268435456) << 16);
export function captureDraftHistory(site) {
  const chunks = [],
    designs = [],
    chunkIds = new WeakMap(),
    designIds = new Map();
  const frame = (f) => {
    const roots = f.overlay instanceof VoxelOverlayMap ? f.overlay : new VoxelOverlayMap(f.overlay),
      ids = [];
    for (const [id, root] of roots.chunks) {
      let index = chunkIds.get(root);
      if (index === undefined) {
        index = chunks.length;
        chunkIds.set(root, index);
        chunks.push({
          bucket: id,
          blocks: [...root.values()].map((b) => ({
            ...b,
            state: b.state < 0 ? null : site.palette[b.state],
          })),
        });
      }
      ids.push(index);
    }
    const design = JSON.stringify(f.design ?? site.design);
    let index = designIds.get(design);
    if (index === undefined) {
      index = designs.length;
      designIds.set(design, index);
      designs.push(JSON.parse(design));
    }
    return { chunks: ids, size: [...f.size], design: index };
  };
  const undo = site.undo.map(frame),
    redo = site.redo.map(frame);
  return { schema: 'craftstudio-draft-history/1', chunks, designs, undo, redo };
}
export function restoreDraftHistory(site, value) {
  if (value === undefined) return;
  const invalid = () => {
    throw Error('草稿撤销历史损坏，请从正式工程版本恢复');
  };
  if (
    value?.schema !== 'craftstudio-draft-history/1' ||
    !['chunks', 'designs', 'undo', 'redo'].every((k) => Array.isArray(value[k]))
  )
    invalid();
  const roots = value.chunks.map((chunk) => {
    if (
      !Number.isInteger(chunk.bucket) ||
      chunk.bucket < 0 ||
      chunk.bucket > 0xffffff ||
      !Array.isArray(chunk.blocks)
    )
      invalid();
    const root = new Map();
    for (const b of chunk.blocks) {
      if (
        !Array.isArray(b.pos) ||
        b.pos.length !== 3 ||
        b.pos.some((n) => !Number.isInteger(n) || n < 0 || n > 4095)
      )
        invalid();
      const id = key(b.pos);
      if (bucket(id) !== chunk.bucket || root.has(id)) invalid();
      if (
        b.state !== null &&
        (!b.state ||
          !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(b.state.Name || '') ||
          (b.state.Properties !== undefined &&
            (!b.state.Properties ||
              typeof b.state.Properties !== 'object' ||
              Array.isArray(b.state.Properties) ||
              Object.values(b.state.Properties).some((v) => typeof v !== 'string'))))
      )
        invalid();
      root.set(id, { ...structuredClone(b), state: b.state === null ? -1 : site.state(b.state) });
    }
    return { bucket: chunk.bucket, root };
  });
  const frames = (list) =>
    list.map((f) => {
      if (
        !Array.isArray(f.size) ||
        f.size.length !== 3 ||
        f.size.some((n) => !Number.isInteger(n) || n < 1 || n > 4096) ||
        !Array.isArray(f.chunks) ||
        !Number.isInteger(f.design) ||
        f.design < 0 ||
        f.design >= value.designs.length ||
        !value.designs[f.design] ||
        Array.isArray(value.designs[f.design]) ||
        !Array.isArray(value.designs[f.design].objects)
      )
        invalid();
      const overlay = new VoxelOverlayMap();
      for (const id of f.chunks) {
        if (!Number.isInteger(id) || !roots[id]) invalid();
        const chunk = roots[id];
        if (overlay.chunks.has(chunk.bucket)) invalid();
        overlay.chunks.set(chunk.bucket, chunk.root);
        overlay.count += chunk.root.size;
      }
      return { overlay, size: [...f.size], design: structuredClone(value.designs[f.design]) };
    });
  const undo = frames(value.undo),
    redo = frames(value.redo);
  site.undo = undo;
  site.redo = redo;
}
