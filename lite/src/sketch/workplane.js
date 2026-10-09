export const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
export const sub = (a, b) => a.map((n, i) => n - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a) => {
  const length = Math.hypot(...a);
  return a.map((n) => n / length);
};
export function workplane(points, choice = 'auto') {
  if (!points?.length || points.some((p) => p.length !== 3 || p.some((n) => !Number.isFinite(n))))
    throw Error('需要有效的轮廓点');
  const origin = [...points[0]],
    axes = {
      xz: [
        [1, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
      ],
      xy: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      yz: [
        [0, 0, 1],
        [0, 1, 0],
        [1, 0, 0],
      ],
    };
  let basis = axes[choice],
    plane = choice;
  if (!basis) {
    let normal = [0, 0, 0];
    for (let i = 0; i < points.length; i++) {
      const c = cross(sub(points[i], origin), sub(points[(i + 1) % points.length], origin));
      normal = normal.map((n, a) => n + c[a]);
    }
    if (Math.hypot(...normal) < 1e-8) throw Error('轮廓没有有效面积');
    normal = unit(normal);
    const dominant = normal.reduce((a, n, i) => (Math.abs(n) > Math.abs(normal[a]) ? i : a), 0);
    if (normal[dominant] < 0) normal = normal.map((n) => -n);
    plane = Object.keys(axes).find((k) => Math.abs(dot(axes[k][2], normal)) > 1 - 1e-10) || 'auto';
    if (plane !== 'auto') basis = axes[plane];
    else {
      const reference = Math.abs(normal[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1],
        u = unit(
          sub(
            reference,
            normal.map((n) => n * dot(reference, normal)),
          ),
        ),
        v = cross(normal, u);
      basis = [u, v, normal];
    }
  }
  const [u, v, normal] = basis,
    maxError = Math.max(...points.map((p) => Math.abs(dot(sub(p, origin), normal))));
  if (maxError > 1e-4)
    throw Error(
      '轮廓不共面（最大偏差 ' + maxError.toFixed(3) + ' 格），请调整控制点或选择正确工作平面',
    );
  return { origin, u, v, normal, plane };
}
export const toPlane = (p, f) => [f.u, f.v, f.normal].map((axis) => dot(sub(p, f.origin), axis));
export const fromPlane = (p, f) =>
  f.origin.map((n, a) => n + p[0] * f.u[a] + p[1] * f.v[a] + p[2] * f.normal[a]);

export function validateFrame(frame) {
  if (
    !frame ||
    ['origin', 'u', 'v', 'normal'].some(
      (k) =>
        !Array.isArray(frame[k]) ||
        frame[k].length !== 3 ||
        frame[k].some((n) => !Number.isFinite(n)),
    )
  )
    throw Error('工作平面坐标无效');
  const axes = [frame.u, frame.v, frame.normal];
  if (
    axes.some((a) => Math.abs(Math.hypot(...a) - 1) > 1e-6) ||
    Math.abs(dot(axes[0], axes[1])) > 1e-6 ||
    Math.abs(dot(axes[0], axes[2])) > 1e-6 ||
    Math.abs(dot(axes[1], axes[2])) > 1e-6
  )
    throw Error('工作平面轴必须正交且归一');
  if (Math.abs(dot(cross(frame.u, frame.v), frame.normal) - 1) > 1e-6)
    throw Error('工作平面必须使用右手坐标系');
  return structuredClone(frame);
}
export function threePointFrame(points) {
  if (
    points?.length !== 3 ||
    points.some((p) => p.length !== 3 || p.some((n) => !Number.isFinite(n)))
  )
    throw Error('请选择三个有效点');
  const a = sub(points[1], points[0]),
    b = sub(points[2], points[0]),
    c = cross(a, b);
  if (Math.hypot(...a) < 1e-6 || Math.hypot(...c) < 1e-6)
    throw Error('三点不能重复或共线，请重新选择第三点');
  const u = unit(a),
    normal = unit(c);
  return { origin: [...points[0]], u, v: cross(normal, u), normal, plane: 'custom' };
}
export function faceFrame(origin, normal) {
  if (
    origin?.length !== 3 ||
    normal?.length !== 3 ||
    [...origin, ...normal].some((n) => !Number.isFinite(n)) ||
    Math.hypot(...normal) < 1e-6
  )
    throw Error('请选择有效的面');
  normal = unit(normal);
  const reference = Math.abs(normal[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1],
    u = unit(
      sub(
        reference,
        normal.map((n) => n * dot(reference, normal)),
      ),
    );
  return { origin: [...origin], u, v: cross(normal, u), normal, plane: 'custom' };
}
export function profileFrame(points, choice = 'auto', reference = null) {
  const checked = workplane(points, choice);
  if (choice !== 'auto' || !reference) return checked;
  const f = validateFrame(reference);
  if (points.some((p) => Math.abs(toPlane(p, f)[2]) > 1e-4)) throw Error('截面偏离保存的工作平面');
  return { ...f, origin: [...points[0]], plane: 'auto' };
}
export const sketchLocal = (p, f) => {
  const q = toPlane(p, f);
  return [q[0], q[2], q[1]];
};
export const sketchWorld = (p, f) => fromPlane([p[0], p[2], p[1]], f);
