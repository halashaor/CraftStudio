import { Vector3 } from '../../../web/vendor/three.module.js';
export function reviewLook(direction, up, dx, dy, sensitivity = 0.003) {
  if (
    ![direction, up].every((p) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite)) ||
    ![dx, dy, sensitivity].every(Number.isFinite)
  )
    throw Error('观察方向或鼠标位移无效');
  const axis = new Vector3(...up).normalize(),
    forward = new Vector3(...direction).normalize();
  if (!axis.lengthSq() || !forward.lengthSq()) throw Error('观察方向不能为空');
  forward.applyAxisAngle(axis, -dx * sensitivity);
  const pitch = Math.asin(Math.max(-1, Math.min(1, forward.dot(axis)))),
    target = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, pitch - dy * sensitivity)),
    right = new Vector3().crossVectors(forward, axis).normalize();
  if (right.lengthSq()) forward.applyAxisAngle(right, target - pitch);
  return forward.normalize().toArray();
}
