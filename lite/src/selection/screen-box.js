import { coordKey, coords } from '../core/coordinates.js';
import { objectHidden } from '../components/collections.js';

export function projectScreen(point, matrix, viewport) {
  const [x, y, z] = point,
    w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  if (w <= 0) return null;
  return [
    (((matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w) * viewport[0]) / 2 +
      viewport[0] / 2,
    viewport[1] / 2 -
      (((matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w) * viewport[1]) / 2,
    (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) / w,
  ];
}
function unproject(x, y, z, m) {
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  return [0, 1, 2].map((a) => (m[a] * x + m[4 + a] * y + m[8 + a] * z + m[12 + a]) / w);
}
export function screenBoxMatches(points, box, crossing = true) {
  const p = points.filter(Boolean);
  if (!p.length || p.every((v) => v[2] < -1) || p.every((v) => v[2] > 1)) return false;
  const min = [0, 1].map((a) => Math.min(...p.map((v) => v[a]))),
    max = [0, 1].map((a) => Math.max(...p.map((v) => v[a])));
  return crossing
    ? min.every((v, a) => v <= box.max[a]) && max.every((v, a) => v >= box.min[a])
    : p.length === points.length &&
        min.every((v, a) => v >= box.min[a]) &&
        max.every((v, a) => v <= box.max[a]);
}
export function screenObjectMatches(object, { project, box, crossing = true }) {
  const cells = object.cells?.length
    ? object.cells.map((cell) =>
        typeof cell === 'number'
          ? coords(cell)
          : Array.isArray(cell)
            ? cell
            : cell.split(',').map(Number),
      )
    : null;
  const matches = (lo, hi) => {
    const points = [];
    for (const x of [lo[0], hi[0]])
      for (const y of [lo[1], hi[1]])
        for (const z of [lo[2], hi[2]]) points.push(project([x, y, z]));
    return screenBoxMatches(points, box, crossing);
  };
  if (!cells)
    return matches(
      object.min,
      object.max.map((n) => n + 1),
    );
  return crossing
    ? cells.some((pos) =>
        matches(
          pos,
          pos.map((n) => n + 1),
        ),
      )
    : cells.every((pos) =>
        matches(
          pos,
          pos.map((n) => n + 1),
        ),
      );
}
// Ray traversal tests cell occlusion, independent of triangle count and screen resolution.
export function visibleCell(start, end, target, occupied) {
  const cell = start.map(Math.floor),
    direction = end.map((v, a) => v - start[a]),
    step = direction.map(Math.sign);
  const delta = direction.map((v) => (v ? 1 / Math.abs(v) : Infinity)),
    next = direction.map((v, a) =>
      v ? ((v > 0 ? cell[a] + 1 : cell[a]) - start[a]) / v : Infinity,
    );
  while (true) {
    if (cell.every((v, a) => v === target[a])) return true;
    if (occupied(cell)) return false;
    const axis = next.reduce((best, v, a) => (v < next[best] ? a : best), 0);
    if (next[axis] > 1) return false;
    cell[axis] += step[axis];
    next[axis] += delta[axis];
  }
}
export function screenBoxSelection(
  site,
  {
    matrix,
    inverse,
    viewport,
    box,
    crossing = true,
    depth = 'visible',
    mode = 'after',
    cut = 4095,
    plants = true,
    showGround = true,
    showExisting = true,
    isolateKeys = null,
  },
) {
  if (
    ![matrix, inverse].every(
      (m) => Array.isArray(m) && m.length === 16 && m.every(Number.isFinite),
    ) ||
    !Array.isArray(viewport) ||
    viewport.length !== 2 ||
    viewport.some((n) => !Number.isFinite(n) || n <= 0) ||
    !box?.min ||
    !box?.max ||
    [...box.min, ...box.max].some((n) => !Number.isFinite(n)) ||
    !['visible', 'through'].includes(depth)
  )
    throw Error('屏幕框选参数无效');
  const hidden = new Set(),
    ranges = [];
  if (mode !== 'before')
    for (const object of site.design.objects.filter((o) => objectHidden(site.design, o))) {
      if (object.cells)
        for (const value of object.cells)
          hidden.add(
            typeof value === 'number'
              ? value
              : coordKey(...(Array.isArray(value) ? value : value.split(',').map(Number))),
          );
      else ranges.push(object);
    }
  const traits = new Map(),
    limit = cut >= site.size[1] - 1 ? 4095 : cut;
  const display = (pos) => {
    if (pos.some((n) => n < 0 || n >= 4096) || pos[1] > limit) return null;
    const key = coordKey(...pos);
    if (
      (isolateKeys && !isolateKeys.has(key)) ||
      hidden.has(key) ||
      ranges.some((o) => pos.every((n, a) => n >= o.min[a] && n <= o.max[a]))
    )
      return null;
    const overlay = site.overlay.get(key),
      base = site.cells.get(key);
    const block =
      mode === 'before'
        ? base
        : mode === 'removed'
          ? overlay && base
          : overlay
            ? overlay.state < 0
              ? mode === 'diff'
                ? base
                : null
              : overlay
            : base;
    if (!block || block.state < 0) return null;
    if (!traits.has(block.state)) {
      const name = site.palette[block.state].Name;
      traits.set(block.state, {
        plant: /leaves|sapling|grass(?!_block)|petals|flower|fern|vine/.test(name),
        ground:
          /:(stone|andesite|diorite|granite|dirt|grass_block|gravel|sand|clay|deepslate|tuff|bedrock|water)$/.test(
            name,
          ) || /_ore$/.test(name),
      });
    }
    const trait = traits.get(block.state);
    return (!plants && trait.plant) ||
      (!showGround && trait.ground) ||
      (!showExisting && !trait.plant && !trait.ground && base && !overlay)
      ? null
      : block;
  };
  function* candidates() {
    const chunks = new Set([...site.baseChunks.keys(), ...site.overlayChunks.keys()]);
    for (const key of chunks) {
      const min = key
          .split(',')
          .map(Number)
          .map((n) => n * 16),
        max = min.map((n) => n + 16),
        corners = [];
      for (const x of [min[0], max[0]])
        for (const y of [min[1], max[1]])
          for (const z of [min[2], max[2]])
            corners.push(projectScreen([x, y, z], matrix, viewport));
      if (!corners.some((p) => !p || p[2] < -1) && !screenBoxMatches(corners, box, true)) continue;
      const original = site.baseChunks.get(key) || new Map(),
        overlay = site.overlayChunks.get(key) || new Map();
      for (const [id, block] of original) yield overlay.get(id) || block;
      for (const [id, block] of overlay) if (!original.has(id)) yield block;
    }
  }
  const members = [];
  for (const raw of candidates()) {
    const block = display(raw.pos);
    if (!block) continue;
    const pos = block.pos,
      state = site.palette[block.state],
      lo = [...pos],
      hi = pos.map((v) => v + 1);
    if (/_slab$/.test(state.Name)) {
      if (state.Properties?.type === 'top') lo[1] += 0.5;
      else if (state.Properties?.type !== 'double') hi[1] -= 0.5;
    }
    const center = lo.map((v, a) => (v + hi[a]) / 2),
      projected = projectScreen(center, matrix, viewport);
    if (!projected || projected[2] < -1 || projected[2] > 1) continue;
    const corners = [];
    for (const x of [lo[0], hi[0]])
      for (const y of [lo[1], hi[1]])
        for (const z of [lo[2], hi[2]]) corners.push(projectScreen([x, y, z], matrix, viewport));
    if (!screenBoxMatches(corners, box, crossing)) continue;
    if (depth === 'visible') {
      const start = unproject(
        (projected[0] / viewport[0]) * 2 - 1,
        1 - (projected[1] / viewport[1]) * 2,
        -1,
        inverse,
      );
      const startsInside = pos.every((n, a) => n === Math.floor(start[a]));
      if (
        !startsInside &&
        [
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
          [0, 0, 1],
          [0, 0, -1],
        ].every((offset) => display(pos.map((n, a) => n + offset[a])))
      )
        continue;
      if (!visibleCell(start, center, pos, (p) => !!display(p))) continue;
    }
    members.push([...pos]);
  }
  if (!members.length) return null;
  return {
    min: [0, 1, 2].map((a) => members.reduce((v, p) => Math.min(v, p[a]), Infinity)),
    max: [0, 1, 2].map((a) => members.reduce((v, p) => Math.max(v, p[a]), -Infinity)),
    members,
  };
}
