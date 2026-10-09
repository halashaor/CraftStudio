import { coordKey } from '../core/site.js';
export function isolationBounds(objects, padding = 2) {
  if (!objects.length) return null;
  return {
    min: [0, 1, 2].map((a) =>
      Math.max(0, objects.reduce((n, o) => Math.min(n, o.min[a]), Infinity) - padding),
    ),
    max: [0, 1, 2].map((a) =>
      Math.min(4095, objects.reduce((n, o) => Math.max(n, o.max[a]), -Infinity) + padding),
    ),
  };
}
export function isolationKeys(
  site,
  { objectIds = [], keys = [], includeNew = false, padding = 2, selection = null },
) {
  let excluded = new Set();
  const objects = site.design.objects.filter((o) => objectIds.includes(o.id)),
    selected = new Set(objectIds.length ? objects.flatMap((o) => o.cells || []) : keys),
    bounds = isolationBounds(objects.length ? objects : selection ? [selection] : [], padding);
  if (includeNew && bounds) {
    const others = new Set(
        site.design.objects
          .filter(
            (o) =>
              !objectIds.includes(o.id) &&
              o.min.every((n, a) => n <= bounds.max[a]) &&
              o.max.every((n, a) => n >= bounds.min[a]),
          )
          .flatMap((o) => o.cells || []),
      ),
      candidates = [];
    if (site.overlayChunks) {
      for (let x = Math.floor(bounds.min[0] / 16); x <= Math.floor(bounds.max[0] / 16); x++)
        for (let y = Math.floor(bounds.min[1] / 16); y <= Math.floor(bounds.max[1] / 16); y++)
          for (let z = Math.floor(bounds.min[2] / 16); z <= Math.floor(bounds.max[2] / 16); z++)
            for (const b of site.overlayChunks.get([x, y, z].join(','))?.values() || [])
              candidates.push(b);
    } else candidates.push(...site.overlay.values());
    excluded = others;
    for (const b of candidates)
      if (
        b.state >= 0 &&
        !others.has(coordKey(...b.pos)) &&
        b.pos.every((n, a) => n >= bounds.min[a] && n <= bounds.max[a])
      )
        selected.add(coordKey(...b.pos));
  }
  return { keys: selected, bounds, objects, excluded };
}
