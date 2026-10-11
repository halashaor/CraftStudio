import { Euler, Matrix4, Vector3 } from '../../../web/vendor/three.module.js';

export function normalizeMeshTransform(value = {}, fallback = {}) {
  const transform = {};
  for (const [key, initial] of Object.entries({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  })) {
    const tuple = value[key] ?? fallback[key] ?? initial;
    if (
      !Array.isArray(tuple) ||
      tuple.length !== 3 ||
      tuple.some((n) => typeof n !== 'number' || !Number.isFinite(n))
    )
      throw Error(`模型 ${key} 需要三个有限数值`);
    if (key === 'scale' && tuple.some((n) => n === 0)) throw Error('模型缩放不能为零');
    transform[key] = [...tuple];
  }
  return transform;
}

export function meshPivot(bounds) {
  return [(bounds.min[0] + bounds.max[0]) / 2, bounds.min[1], (bounds.min[2] + bounds.max[2]) / 2];
}

export function meshPlacementMatrix(transform) {
  const { position, rotation, scale } = normalizeMeshTransform(transform),
    matrix = new Matrix4().makeTranslation(...position);
  matrix.multiply(
    new Matrix4().makeRotationFromEuler(
      new Euler(...rotation.map((n) => (n * Math.PI) / 180), 'XYZ'),
    ),
  );
  matrix.multiply(new Matrix4().makeScale(...scale));
  if (matrix.elements.some((n) => !Number.isFinite(n))) throw Error('模型变换超出可计算坐标范围');
  return [...matrix.elements];
}

export function meshMatrix(transform, bounds) {
  return new Matrix4()
    .fromArray(meshPlacementMatrix(transform))
    .multiply(new Matrix4().makeTranslation(...meshPivot(bounds).map((n) => -n)))
    .toArray();
}

// Center in double precision before creating GPU floats; large OBJ origins otherwise erase small details.
export function centeredMeshPositions(parsed) {
  const pivot = meshPivot(parsed.bounds),
    positions = new Float32Array(parsed.triangles.length * 9);
  let index = 0;
  for (const triangle of parsed.triangles)
    for (const point of triangle)
      for (let axis = 0; axis < 3; axis++) positions[index++] = point[axis] - pivot[axis];
  return positions;
}

export function transformedTriangles(parsed, transform) {
  const matrix = new Matrix4().fromArray(meshPlacementMatrix(transform)),
    pivot = new Vector3(...meshPivot(parsed.bounds)),
    point = new Vector3();
  return parsed.triangles.map((triangle) =>
    triangle.map((p) => point.fromArray(p).sub(pivot).applyMatrix4(matrix).toArray()),
  );
}

export function transformedMeshBounds(parsed, transform) {
  const matrix = new Matrix4().fromArray(meshPlacementMatrix(transform)),
    pivot = new Vector3(...meshPivot(parsed.bounds)),
    point = new Vector3(),
    min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const triangle of parsed.triangles)
    for (const vertex of triangle) {
      point
        .fromArray(vertex)
        .sub(pivot)
        .applyMatrix4(matrix)
        .toArray()
        .forEach((n, a) => {
          min[a] = Math.min(min[a], n);
          max[a] = Math.max(max[a], n);
        });
    }
  return { min, max };
}
