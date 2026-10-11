const MAX_TRIANGLES = 1_000_000;
const MAX_FACE_VERTICES = 4096;
const MAX_FACE_TESTS = 20_000_000;
const MATERIAL_WARNING = '当前只转换 OBJ 几何；材质、贴图和法线未转换，原文件可保留在工程中';

const cross2 = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const samePoint = (a, b) => a.every((n, i) => n === b[i]);

function cleanBoundary(points) {
  const boundary = points.filter((point, i) => !i || !samePoint(point, points[i - 1]));
  if (boundary.length > 1 && samePoint(boundary[0], boundary.at(-1))) boundary.pop();
  if (boundary.length < 3) throw Error('面至少需要三个不同的顶点');
  return boundary;
}

function projectFace(points) {
  // Subtract the first vertex so far-away models retain local geometric precision.
  const local = points.map((p) => p.map((n, a) => n - points[0][a])),
    extent = Math.max(...local.flat().map(Math.abs)),
    normal = [0, 0, 0];
  if (!extent) throw Error('面没有面积');
  for (let i = 0; i < local.length; i++) {
    const p = local[i],
      q = local[(i + 1) % local.length];
    normal[0] += (p[1] - q[1]) * (p[2] + q[2]);
    normal[1] += (p[2] - q[2]) * (p[0] + q[0]);
    normal[2] += (p[0] - q[0]) * (p[1] + q[1]);
  }
  const length = Math.hypot(...normal),
    tolerance = extent * extent * 1e-12;
  if (length <= tolerance) throw Error('面没有面积或存在自交');
  if (
    local.some(
      (p) => Math.abs(p.reduce((n, v, a) => n + v * normal[a], 0)) > length * extent * 1e-7,
    )
  )
    throw Error('面不共面，请先在建模软件中三角化');
  const axis = normal.reduce((best, n, a) => (Math.abs(n) > Math.abs(normal[best]) ? a : best), 0),
    axes = [0, 1, 2].filter((a) => a !== axis);
  return { projected: local.map((p) => axes.map((a) => p[a])), tolerance };
}

function segmentsIntersect(a, b, c, d, tolerance) {
  const abC = cross2(a, b, c),
    abD = cross2(a, b, d),
    cdA = cross2(c, d, a),
    cdB = cross2(c, d, b),
    onSegment = (p, q, r) =>
      r.every((n, i) => n >= Math.min(p[i], q[i]) && n <= Math.max(p[i], q[i]));
  return (
    (abC * abD < 0 && cdA * cdB < 0) ||
    (Math.abs(abC) <= tolerance && onSegment(a, b, c)) ||
    (Math.abs(abD) <= tolerance && onSegment(a, b, d)) ||
    (Math.abs(cdA) <= tolerance && onSegment(c, d, a)) ||
    (Math.abs(cdB) <= tolerance && onSegment(c, d, b))
  );
}

function triangulate(face) {
  const points = cleanBoundary(face),
    { projected: p, tolerance } = projectFace(points);
  let tests = 0;
  const spendTest = () => {
    if (++tests > MAX_FACE_TESTS)
      throw Error('单面三角化超过 20,000,000 次计算预算，请先在建模软件中三角化');
  };
  for (let i = 0; i < p.length; i++) {
    for (let j = i + 1; j < p.length; j++) {
      if (j === i + 1 || (i === 0 && j === p.length - 1)) continue;
      spendTest();
      if (segmentsIntersect(p[i], p[(i + 1) % p.length], p[j], p[(j + 1) % p.length], tolerance))
        throw Error('面存在自交或重复边');
    }
  }
  const remaining = p.map((_, i) => i),
    result = [];
  // Keep collinear boundary vertices: adjacent faces may share their split edges.
  // They cannot form ears themselves, and points on an ear boundary block that ear.
  const area = remaining.reduce((sum, a, i) => {
      const b = remaining[(i + 1) % remaining.length];
      return sum + p[a][0] * p[b][1] - p[b][0] * p[a][1];
    }, 0),
    sign = Math.sign(area);
  if (Math.abs(area) <= tolerance) throw Error('面没有面积');
  while (remaining.length > 3) {
    let ear = -1;
    for (let i = 0; i < remaining.length; i++) {
      const a = remaining[(i + remaining.length - 1) % remaining.length],
        b = remaining[i],
        c = remaining[(i + 1) % remaining.length];
      if (sign * cross2(p[a], p[b], p[c]) <= tolerance) continue;
      if (
        remaining.some((k) => {
          spendTest();
          return (
            k !== a &&
            k !== b &&
            k !== c &&
            sign * cross2(p[a], p[b], p[k]) >= -tolerance &&
            sign * cross2(p[b], p[c], p[k]) >= -tolerance &&
            sign * cross2(p[c], p[a], p[k]) >= -tolerance
          );
        })
      )
        continue;
      result.push([a, b, c]);
      ear = i;
      break;
    }
    if (ear < 0) throw Error('面无法三角化，请检查自交与退化边');
    remaining.splice(ear, 1);
  }
  result.push(remaining);
  return result.map((triangle) => triangle.map((i) => points[i]));
}

function meshTopology(triangles) {
  const edges = new Map();
  for (const triangle of triangles) {
    const vertices = triangle.map((p) => p.join(','));
    for (let i = 0; i < 3; i++) {
      const a = vertices[i],
        b = vertices[(i + 1) % 3],
        key = a < b ? a + ':' + b : b + ':' + a;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  let boundaryEdges = 0,
    nonManifoldEdges = 0;
  for (const count of edges.values()) {
    if (count === 1) boundaryEdges++;
    if (count > 2) nonManifoldEdges++;
  }
  return { closed: boundaryEdges === 0 && nonManifoldEdges === 0, boundaryEdges, nonManifoldEdges };
}

export function parseMeshOBJ(text) {
  if (typeof text !== 'string') throw Error('需要 OBJ 文件文本');
  const vertices = [],
    triangles = [],
    warnings = new Set();
  for (const [line, raw] of text.split(/\r?\n/).entries()) {
    const content = raw.split('#')[0].trim();
    if (!content) continue;
    const [kind, ...fields] = content.split(/\s+/);
    const fail = (message) => {
      throw Error(`OBJ 第 ${line + 1} 行：${message}`);
    };
    if (kind === 'v') {
      const point = fields.slice(0, 3).map(Number);
      if (point.length !== 3 || point.some((n) => !Number.isFinite(n))) fail('顶点坐标无效');
      if (![3, 4, 6, 7].includes(fields.length)) fail('顶点需要 XYZ 坐标');
      if (fields.length === 4 && Number(fields[3]) !== 1) fail('齐次顶点请先转换为普通 XYZ 坐标');
      if (fields.length >= 6) warnings.add('OBJ 顶点颜色尚未转换；当前只读取几何');
      vertices.push(point);
    } else if (kind === 'f') {
      if (fields.length < 3) fail('面至少需要三个顶点');
      if (fields.length > MAX_FACE_VERTICES)
        fail(`单个面超过 ${MAX_FACE_VERTICES} 个顶点的三角化计算预算，请先三角化`);
      const points = fields.map((field) => {
        const parts = field.split('/');
        if (
          parts.length > 3 ||
          !/^-?[1-9]\d*$/.test(parts[0]) ||
          parts.slice(1).some((v) => v !== '' && !/^-?[1-9]\d*$/.test(v))
        )
          fail('面索引无效');
        if (parts.length > 1) warnings.add(MATERIAL_WARNING);
        const index = Number(parts[0]),
          point = vertices[index < 0 ? vertices.length + index : index - 1];
        if (!point) fail('面引用了不存在的顶点');
        return point;
      });
      let face;
      try {
        face = triangulate(points);
      } catch (error) {
        fail(error.message);
      }
      if (triangles.length + face.length > MAX_TRIANGLES)
        fail(`网格超过 ${MAX_TRIANGLES} 个三角面的计算预算，请拆分模型`);
      for (const triangle of face) triangles.push(triangle);
    } else if (['mtllib', 'usemtl', 'vt', 'vn'].includes(kind)) {
      warnings.add(MATERIAL_WARNING);
    } else if (['l', 'p', 'curv', 'curv2', 'surf'].includes(kind)) {
      fail('需要多边形网格，不读取线、点或参数曲面');
    } else if (!['o', 'g', 's'].includes(kind)) {
      warnings.add(`未读取 OBJ 指令 ${kind}；仅转换多边形几何`);
    }
  }
  if (!triangles.length) throw Error('OBJ 没有有效的多边形面');
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const triangle of triangles)
    for (const point of triangle)
      point.forEach((n, a) => {
        min[a] = Math.min(min[a], n);
        max[a] = Math.max(max[a], n);
      });
  return {
    triangles,
    bounds: { min, max },
    warnings: [...warnings],
    topology: meshTopology(triangles),
  };
}
