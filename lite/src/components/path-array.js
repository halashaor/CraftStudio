export function pathArray(
  points,
  { count = 3, spacing = 6, mode = 'spacing', closed = false, follow = false } = {},
) {
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    points.some((p) => !Array.isArray(p) || p.length !== 3 || p.some((n) => !Number.isFinite(n)))
  )
    throw Error('请提供有效的三维路径');
  if (!Number.isInteger(count) || count < 1 || count > 100 || !['spacing', 'count'].includes(mode))
    throw Error('路径阵列数量或方式无效');
  if (mode === 'spacing' && (!Number.isFinite(spacing) || spacing < 1 || spacing > 1024))
    throw Error('路径间距应为 1–1024 格');
  const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i])),
    same = distance(points[0], points.at(-1)) < 1e-8;
  closed = closed || same;
  const path = points.map((p) => [...p]);
  if (closed && !same) path.push([...path[0]]);
  const segments = [];
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    const size = distance(path[i - 1], path[i]);
    if (!Number.isFinite(size) || !Number.isFinite(length + size))
      throw Error('路径长度超出可用范围');
    if (!size) continue;
    segments.push({ a: path[i - 1], b: path[i], start: length, size });
    length += size;
  }
  if (!length) throw Error('路径没有有效长度');
  const step = mode === 'count' ? length / (closed ? count : Math.max(1, count - 1)) : spacing,
    placements = [],
    seen = new Set();
  let duplicates = 0,
    segmentIndex = 0;
  for (let i = 0; i < count; i++) {
    const at = mode === 'count' && count === 1 ? 0 : i * step;
    if (closed ? at >= length - 1e-8 : at > length + 1e-8) break;
    while (
      segmentIndex < segments.length - 1 &&
      at > segments[segmentIndex].start + segments[segmentIndex].size + 1e-8
    )
      segmentIndex++;
    const s = segments[segmentIndex],
      t = Math.min(1, Math.max(0, (at - s.start) / s.size)),
      pos = s.a.map((n, a) => Math.round(n + (s.b[a] - n) * t)),
      key = pos.join(',');
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    placements.push({
      pos,
      turn: follow
        ? ((Math.round(Math.atan2(s.b[0] - s.a[0], -(s.b[2] - s.a[2])) / (Math.PI / 2)) % 4) + 4) %
          4
        : 0,
    });
  }
  return { placements, length, spacing: step, closed, mode, duplicates, requested: count };
}
