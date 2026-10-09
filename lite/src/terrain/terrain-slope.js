export function slopeMetrics(points) {
  if (
    !Array.isArray(points) ||
    points.length !== 2 ||
    points.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 3 ||
        p.some((n, a) => !Number.isFinite(n) || n < 0 || n > (a === 1 ? 4094 : 4095)),
    )
  )
    throw Error('坡道需要两个有效的场地坐标');
  const [a, b] = points,
    dx = b[0] - a[0],
    dz = b[2] - a[2],
    rise = b[1] - a[1],
    horizontal = Math.hypot(dx, dz);
  if (horizontal < 0.01) throw Error('起点与终点不能在同一地面位置');
  return {
    horizontal,
    rise,
    length: Math.hypot(horizontal, rise),
    percent: (rise / horizontal) * 100,
    angle: (Math.atan2(rise, horizontal) * 180) / Math.PI,
    slopeX: (rise * dx) / (horizontal * horizontal),
    slopeZ: (rise * dz) / (horizontal * horizontal),
  };
}
export function slopeHeight(points, x, z) {
  const m = slopeMetrics(points),
    a = points[0],
    b = points[1],
    dx = b[0] - a[0],
    dz = b[2] - a[2],
    t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (z - a[2]) * (b[2] - a[2])) / (dx * dx + dz * dz)),
    );
  return a[1] + t * m.rise;
}
