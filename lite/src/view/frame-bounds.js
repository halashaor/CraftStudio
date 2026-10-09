const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0),
  sub = (a, b) => a.map((v, i) => v - b[i]),
  cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  unit = (a) => {
    const n = Math.hypot(...a);
    if (n < 1e-10) throw Error('视图方向无效');
    return a.map((v) => v / n);
  };
// Voxel bounds include outer cell faces; continuous bounds use exact guide/mesh coordinates.
export function frameBounds(view, { min, max, continuous = false }, aspect = 1, padding = 1.15) {
  if (
    ![min, max, view.position, view.target].every(
      (a) => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite),
    ) ||
    min.some((n, i) => n > max[i]) ||
    !Number.isFinite(aspect) ||
    aspect <= 0 ||
    !Number.isFinite(padding) ||
    padding < 1
  )
    throw Error('需要有效的选择范围和视口尺寸');
  const outer = max.map((n) => n + (continuous ? 0 : 1));
  const forward = unit(sub(view.target, view.position)),
    up = unit(view.up || [0, 1, 0]),
    right = unit(cross(forward, up)),
    vertical = unit(cross(right, forward)),
    target = min.map((n, i) => (n + outer[i]) / 2),
    zoom = view.zoom ?? 1,
    fov = view.fov ?? 45;
  if (!Number.isFinite(zoom) || zoom <= 0 || !Number.isFinite(fov) || fov <= 0 || fov >= 180)
    throw Error('视图缩放无效');
  const corners = [];
  for (const x of [min[0], outer[0]])
    for (const y of [min[1], outer[1]])
      for (const z of [min[2], outer[2]]) {
        const p = sub([x, y, z], target);
        corners.push([dot(p, right), dot(p, vertical), dot(p, forward)]);
      }
  let distance = Math.max(6, ...corners.map((p) => 1 - p[2])),
    viewHeight;
  if (view.projection === 'orthographic') {
    viewHeight = Math.max(
      1,
      ...corners.map((p) => 2 * Math.max(Math.abs(p[1]), Math.abs(p[0]) / aspect) * padding * zoom),
    );
    distance = Math.max(distance, Math.hypot(...sub(view.position, view.target)));
  } else {
    const tangent = Math.tan((fov * Math.PI) / 360) / zoom;
    distance = Math.max(
      distance,
      ...corners.map(
        (p) => (Math.max(Math.abs(p[1]), Math.abs(p[0]) / aspect) * padding) / tangent - p[2],
      ),
    );
  }
  return {
    ...view,
    target,
    position: target.map((n, i) => n - forward[i] * distance),
    ...(viewHeight !== undefined ? { viewHeight } : {}),
  };
}

export function pointBounds(points) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  let count = 0;
  for (const point of points) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], point[axis]);
      max[axis] = Math.max(max[axis], point[axis]);
    }
    count++;
  }
  return count ? { min, max, continuous: true } : null;
}
