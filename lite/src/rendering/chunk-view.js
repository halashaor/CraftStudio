export function chunkInView(key, planes, margin = 2) {
  if (!planes?.length || !Number.isFinite(margin)) return true;
  const min = key.split(',').map((n) => Number(n) * 16 - margin),
    max = min.map((n) => n + 16 + margin * 2);
  return planes.every(
    ([x, y, z, w]) =>
      x * (x >= 0 ? max[0] : min[0]) +
        y * (y >= 0 ? max[1] : min[1]) +
        z * (z >= 0 ? max[2] : min[2]) +
        w >=
      0,
  );
}

// Sphere bounds remain conservative under element and block rotations.
export function modelViewMargin(model) {
  let radius = 2;
  for (const part of model.parts || []) {
    for (const tri of part.triangles || [])
      for (const p of tri.positions || [])
        radius = Math.max(radius, Math.hypot(...p.map((n) => n - 0.5)) + 0.5);
    for (const e of part.elements || []) {
      const origin = (e.rotation?.origin || [8, 8, 8]).map((n) => n / 16),
        far = origin.map((n, a) =>
          Math.max(Math.abs(e.from[a] / 16 - n), Math.abs(e.to[a] / 16 - n)),
        ),
        scale = e.rotation?.rescale
          ? Math.max(1, Math.abs(1 / Math.cos((e.rotation.angle * Math.PI) / 180)))
          : 1;
      radius = Math.max(
        radius,
        Math.hypot(...far) * scale + Math.hypot(...origin.map((n) => n - 0.5)) + 0.5,
      );
    }
  }
  return radius;
}
