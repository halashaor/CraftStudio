import { Box3, Triangle, Vector3 } from '../../../web/vendor/three.module.js';
import { transformedTriangles } from './mesh-transform.js';

const MAX_CELLS = 1_000_000;
const MAX_TESTS = 20_000_000;
const EPSILON = 1e-8;

function pointBounds(points) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const point of points)
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], point[a]);
      max[a] = Math.max(max[a], point[a]);
    }
  return { min, max };
}

function cellBounds(bounds, resolution = 1) {
  const min = bounds.min.map((n) => Math.floor(n * resolution + EPSILON)),
    max = bounds.max.map((n, a) => Math.max(min[a], Math.ceil(n * resolution - EPSILON) - 1));
  return { min, max };
}

function surfaceRange(bounds, meshBounds, resolution) {
  const range = cellBounds(bounds, resolution),
    outer = cellBounds(meshBounds, resolution);
  for (let a = 0; a < 3; a++) {
    // A face exactly on the outer upper bound belongs to the last interior cell.
    range.min[a] = Math.min(range.min[a], outer.max[a]);
    range.max[a] = Math.min(range.max[a], outer.max[a]);
  }
  return range;
}

function collectSurface(triangles, bounds, resolution, put, stats) {
  const box = new Box3(),
    triangle = new Triangle(new Vector3(), new Vector3(), new Vector3());
  for (const vertices of triangles) {
    const triangleBounds = pointBounds(vertices),
      range = surfaceRange(triangleBounds, bounds, resolution),
      tests = range.max.reduce((n, v, a) => n * (v - range.min[a] + 1), 1);
    stats.testedCells += tests;
    if (stats.testedCells > MAX_TESTS)
      throw Error(
        `网格表面相交计算超过 ${MAX_TESTS.toLocaleString('en-US')} 次预算，请拆分模型或降低尺寸`,
      );
    triangle.set(...vertices.map((p) => new Vector3(...p)));
    // Shrinking non-coplanar axes excludes cells that only touch an edge or vertex.
    const inset = triangleBounds.min.map((n, a) =>
      triangleBounds.max[a] - n > EPSILON ? EPSILON / resolution : 0,
    );
    for (let y = range.min[1]; y <= range.max[1]; y++)
      for (let z = range.min[2]; z <= range.max[2]; z++)
        for (let x = range.min[0]; x <= range.max[0]; x++) {
          box.min.set(
            x / resolution + inset[0],
            y / resolution + inset[1],
            z / resolution + inset[2],
          );
          box.max.set(
            (x + 1) / resolution - inset[0],
            (y + 1) / resolution - inset[1],
            (z + 1) / resolution - inset[2],
          );
          if (box.intersectsTriangle(triangle)) put(x, y, z);
        }
  }
}

const crossXZ = (a, b, p) => (b[0] - a[0]) * (p[2] - a[2]) - (b[2] - a[2]) * (p[0] - a[0]);
const topLeft = (a, b) => b[2] > a[2] || (b[2] === a[2] && b[0] < a[0]);

function rayHeight(vertices, x, z, area) {
  const point = [x, 0, z],
    edges = [
      crossXZ(vertices[1], vertices[2], point),
      crossXZ(vertices[2], vertices[0], point),
      crossXZ(vertices[0], vertices[1], point),
    ];
  for (let i = 0; i < 3; i++) {
    if (edges[i] < -EPSILON * area) return null;
    if (
      Math.abs(edges[i]) <= EPSILON * area &&
      !topLeft(vertices[(i + 1) % 3], vertices[(i + 2) % 3])
    )
      return null;
  }
  return edges.reduce((n, weight, a) => n + weight * vertices[a][1], 0) / area;
}

function collectSolid(triangles, bounds, resolution, put, stats) {
  const range = cellBounds(bounds, resolution),
    blockRange = cellBounds(bounds),
    blockVolume = blockRange.max.reduce((n, v, a) => n * (v - blockRange.min[a] + 1), 1);
  if (blockVolume > MAX_CELLS)
    throw Error(
      `实心转换需要采样的包围盒超过 ${MAX_CELLS.toLocaleString('en-US')} 格预算，请拆分模型或降低尺寸`,
    );
  const columns = new Map();
  for (const original of triangles) {
    let area = crossXZ(original[0], original[1], original[2]);
    if (Math.abs(area) <= Number.EPSILON) continue;
    const vertices = area > 0 ? original : [original[0], original[2], original[1]];
    area = Math.abs(area);
    const triangleBounds = pointBounds(vertices),
      minX = Math.max(range.min[0], Math.ceil(triangleBounds.min[0] * resolution - 0.5)),
      maxX = Math.min(range.max[0], Math.floor(triangleBounds.max[0] * resolution - 0.5)),
      minZ = Math.max(range.min[2], Math.ceil(triangleBounds.min[2] * resolution - 0.5)),
      maxZ = Math.min(range.max[2], Math.floor(triangleBounds.max[2] * resolution - 0.5));
    stats.testedCells += Math.max(0, maxX - minX + 1) * Math.max(0, maxZ - minZ + 1);
    if (stats.testedCells > MAX_TESTS)
      throw Error(
        `网格射线计算超过 ${MAX_TESTS.toLocaleString('en-US')} 次预算，请拆分模型或降低尺寸`,
      );
    for (let z = minZ; z <= maxZ; z++)
      for (let x = minX; x <= maxX; x++) {
        const height = rayHeight(vertices, (x + 0.5) / resolution, (z + 0.5) / resolution, area);
        if (height === null) continue;
        const key = x + ',' + z,
          column = columns.get(key);
        if (column) column.heights.push(height);
        else columns.set(key, { x, z, heights: [height] });
      }
  }
  for (const { x, z, heights } of columns.values()) {
    heights.sort((a, b) => a - b);
    if (heights.length % 2)
      throw Error('网格射线未成对相交，请检查自交、重叠面或几何裂缝；可改为表面转换');
    for (let i = 0; i < heights.length; i += 2) {
      if (heights[i + 1] - heights[i] <= EPSILON) continue;
      const minY = Math.max(range.min[1], Math.ceil(heights[i] * resolution - 0.5 - EPSILON)),
        maxY = Math.min(range.max[1], Math.floor(heights[i + 1] * resolution - 0.5 + EPSILON));
      for (let y = minY; y <= maxY; y++) put(x, y, z);
    }
  }
}

export function voxelizeMesh(parsed, transform, { mode = 'surface', smart = false } = {}) {
  if (!['surface', 'solid'].includes(mode)) throw Error('模型转换方式需要 surface 或 solid');
  if (mode === 'solid' && (!parsed.topology?.closed || parsed.topology.nonManifoldEdges))
    throw Error('实心转换需要闭合且没有非流形边的网格；开放屋面请使用表面转换');
  const triangles = transformedTriangles(parsed, transform),
    bounds = pointBounds(triangles.flat()),
    resolution = smart ? 2 : 1,
    cells = new Map(),
    warnings = [...(parsed.warnings || [])],
    stats = { triangles: triangles.length, testedCells: 0, outputCells: 0, subcells: 0 };
  if ([...bounds.min, ...bounds.max].some((n) => !Number.isFinite(n) || Math.abs(n) > 30_000_000))
    throw Error('模型变换超出 ±30,000,000 的 Minecraft 坐标范围');
  const put = (x, y, z) => {
    const pos = [x, y, z].map((n) => Math.floor(n / resolution)),
      key = pos.join(','),
      bit = smart ? 1 << ((y - pos[1] * 2) * 4 + (z - pos[2] * 2) * 2 + x - pos[0] * 2) : 255,
      cell = cells.get(key);
    if (cell) cell.mask |= bit;
    else {
      if (cells.size === MAX_CELLS)
        throw Error(
          `网格转换超过 ${MAX_CELLS.toLocaleString('en-US')} 个输出方块预算，请拆分模型或降低尺寸`,
        );
      cells.set(key, { pos, mask: bit });
    }
  };
  if (mode === 'surface') collectSurface(triangles, bounds, resolution, put, stats);
  else collectSolid(triangles, bounds, resolution, put, stats);
  const result = [...cells.values()];
  stats.outputCells = result.length;
  stats.subcells = result.reduce(
    (sum, { mask }) => sum + mask.toString(2).replaceAll('0', '').length,
    0,
  );
  if (!result.length)
    warnings.push(
      '当前尺寸与位置没有生成方块；实心模式按格中心采样，薄小结构可使用表面模式或半砖/楼梯精度',
    );
  if (mode === 'surface' && !parsed.topology?.closed)
    warnings.push('开放网格仅转换表面，不会自动补面或填成实心');
  if (mode === 'solid')
    warnings.push('实心按射线奇偶和格中心采样；小于采样间距的细节可能消失，请检查薄壁与空腔');
  return {
    cells: result,
    bounds: result.length ? pointBounds(result.map((cell) => cell.pos)) : null,
    stats,
    warnings,
  };
}
