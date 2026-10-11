import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from '../../web/vendor/three.module.js';
import { parseMeshOBJ } from '../src/models/mesh-obj.js';
import {
  meshMatrix,
  normalizeMeshTransform,
  transformedMeshBounds,
  transformedTriangles,
} from '../src/models/mesh-transform.js';
import { voxelizeMesh } from '../src/models/mesh-voxel.js';
import { boundaryFitter } from '../src/modeling/voxel-fit.js';

function obj(points, faces) {
  return points
    .map((p) => 'v ' + p.join(' '))
    .concat(faces.map((f) => 'f ' + f.map((i) => i + 1).join(' ')))
    .join('\n');
}

function box(width = 1, height = 1, depth = 1, offset = [0, 0, 0]) {
  const points = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0],
      [0, 0, depth],
      [width, 0, depth],
      [width, height, depth],
      [0, height, depth],
    ].map((p) => p.map((n, a) => n + offset[a])),
    faces = [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [3, 7, 6, 2],
      [0, 4, 7, 3],
      [1, 2, 6, 5],
    ];
  return { points, faces, text: obj(points, faces) };
}

function identity(parsed) {
  return {
    position: [
      (parsed.bounds.min[0] + parsed.bounds.max[0]) / 2,
      parsed.bounds.min[1],
      (parsed.bounds.min[2] + parsed.bounds.max[2]) / 2,
    ],
  };
}

function area(triangle) {
  const [a, b, c] = triangle.map((p) => new Vector3(...p));
  return b.sub(a).cross(c.sub(a)).length() / 2;
}

test('OBJ ear clipping preserves a concave outline, winding, negative indexes and harmless duplicate/collinear boundary vertices', () => {
  const points = [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [2, 1, 0],
      [1, 1, 0],
      [1, 2, 0],
      [0, 2, 0],
    ],
    parsed = parseMeshOBJ(
      points.map((p) => 'v ' + p.join(' ')).join('\n') + '\nf -7 -6 -6 -5 -4 -3 -2 -1 -7',
    );
  assert.equal(
    parsed.triangles.reduce((sum, t) => sum + area(t), 0),
    3,
  );
  assert.deepEqual(parsed.bounds, { min: [0, 0, 0], max: [2, 2, 0] });
  for (const t of parsed.triangles) {
    const center = [0, 1].map((a) => t.reduce((sum, p) => sum + p[a] / 3, 0));
    assert.ok(center[0] <= 1 || center[1] <= 1, 'the concave notch must remain empty');
  }
  const reversed = parseMeshOBJ(obj(points, [[6, 5, 4, 3, 2, 1, 0]]));
  assert.equal(
    reversed.triangles.reduce((sum, t) => sum + area(t), 0),
    3,
  );
  assert.equal(parsed.topology.closed, false);
});

test('OBJ rejects invalid faces with line numbers, including bow ties and non-planar polygons', () => {
  for (const face of ['f 0 2 3', 'f 1 2 20', 'f 1 2', 'f 1/2/3/4 2 3', 'f 1 2 1']) {
    assert.throws(() => parseMeshOBJ('v 0 0 0\nv 1 0 0\nv 1 1 0\n' + face), /第 4 行/);
  }
  assert.throws(
    () =>
      parseMeshOBJ(
        obj(
          [
            [0, 0, 0],
            [2, 2, 0],
            [0, 2, 0],
            [2, 0, 0],
          ],
          [[0, 1, 2, 3]],
        ),
      ),
    /自交/,
  );
  assert.throws(
    () =>
      parseMeshOBJ(
        obj(
          [
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
          ],
          [[0, 1, 2, 3]],
        ),
      ),
    /不共面/,
  );
  assert.throws(() => parseMeshOBJ('v 0 0 0\nv 1 0 0\nv 2 0 0\nf 1 2 3'), /没有面积/);
  assert.throws(() => parseMeshOBJ('v NaN 0 0\nf 1 2 3'), /坐标无效/);
});

test('OBJ topology welds duplicated positions, reports non-manifold edges, and warns about unconverted materials', () => {
  const source = box(),
    duplicated = source.faces.flatMap((f) => f.map((i) => source.points[i])),
    faces = source.faces.map((_, i) => [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3]),
    parsed = parseMeshOBJ(
      'mtllib house.mtl\nusemtl roof\nvt 0 0\nvn 0 1 0\n' + obj(duplicated, faces),
    );
  assert.deepEqual(parsed.topology, { closed: true, boundaryEdges: 0, nonManifoldEdges: 0 });
  assert.match(parsed.warnings[0], /材质、贴图/);
  const invalid = parseMeshOBJ(source.text + '\nf 1 4 3 2');
  assert.equal(invalid.topology.closed, false);
  assert.ok(invalid.topology.nonManifoldEdges > 0);
});

test('collinear shared edge vertices remain welded when one adjacent face is already triangulated', () => {
  const source = box(),
    points = [...source.points, [0.5, 0, 0]],
    faces = [
      [0, 3, 2, 1, 8],
      source.faces[1],
      [0, 8, 4],
      [8, 5, 4],
      [8, 1, 5],
      ...source.faces.slice(3),
    ],
    parsed = parseMeshOBJ(obj(points, faces));
  assert.deepEqual(parsed.topology, { closed: true, boundaryEdges: 0, nonManifoldEdges: 0 });
  assert.ok(parsed.triangles.every((t) => area(t) > 0));
  assert.deepEqual(voxelizeMesh(parsed, identity(parsed), { mode: 'solid', smart: true }).cells, [
    { pos: [0, 0, 0], mask: 255 },
  ]);
});

test('mesh transformation shares a bottom-centre pivot, world position and column-major matrix with rendering', () => {
  const parsed = parseMeshOBJ(box(4, 3, 2, [5, 6, 7]).text),
    transform = { position: [10, 20, 30], rotation: [0, 0, 90], scale: [-2, 3, 4] },
    matrix = new Matrix4().fromArray(meshMatrix(transform, parsed.bounds)),
    pivot = new Vector3(7, 6, 8).applyMatrix4(matrix).toArray();
  assert.ok(pivot.every((n, i) => Math.abs(n - transform.position[i]) < 1e-10));
  const bounds = transformedMeshBounds(parsed, transform);
  assert.ok(bounds.min.every((n, i) => Math.abs(n - [1, 16, 26][i]) < 1e-10));
  assert.ok(bounds.max.every((n, i) => Math.abs(n - [10, 24, 34][i]) < 1e-10));
  assert.deepEqual(transformedTriangles(parsed, identity(parsed)), parsed.triangles);
  assert.deepEqual(parsed.bounds, { min: [5, 6, 7], max: [9, 9, 9] });
  assert.deepEqual(normalizeMeshTransform({ rotation: [10, 20, 30] }, { position: [1, 2, 3] }), {
    position: [1, 2, 3],
    rotation: [10, 20, 30],
    scale: [1, 1, 1],
  });
  assert.throws(() => normalizeMeshTransform({ scale: [1, 0, 1] }), /不能为零/);
  assert.throws(() => normalizeMeshTransform({ position: [1, Infinity, 3] }), /有限数值/);
});

test('solid and surface conversion do not add exterior layers to an integer-aligned cube', () => {
  const parsed = parseMeshOBJ(box(4, 4, 4).text),
    transform = identity(parsed);
  for (const smart of [false, true]) {
    const solid = voxelizeMesh(parsed, transform, { mode: 'solid', smart }),
      surface = voxelizeMesh(parsed, transform, { mode: 'surface', smart });
    assert.equal(solid.cells.length, 64);
    assert.equal(surface.cells.length, 56);
    assert.deepEqual(solid.bounds, { min: [0, 0, 0], max: [3, 3, 3] });
    assert.deepEqual(surface.bounds, solid.bounds);
    assert.ok(solid.cells.every((c) => c.mask === 255));
    assert.equal(
      surface.cells.some((c) => c.pos.every((n) => n === 1)),
      false,
    );
  }
});

test('half-height slabs and sloping wedges produce masks understood by existing slab/stair fitting', () => {
  const slab = parseMeshOBJ(box(1, 0.5, 1).text),
    wedge = parseMeshOBJ(
      obj(
        [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
          [0, 0, 1],
          [1, 0, 1],
          [1, 1, 1],
        ],
        [
          [0, 2, 1],
          [3, 4, 5],
          [0, 1, 4, 3],
          [1, 2, 5, 4],
          [2, 0, 3, 5],
        ],
      ),
    ),
    fit = boundaryFitter(
      { Name: 'minecraft:stone_bricks' },
      { available: ['minecraft:stone_brick_slab', 'minecraft:stone_brick_stairs'] },
    );
  assert.equal(wedge.topology.closed, true);
  for (const mode of ['surface', 'solid']) {
    const slabCell = voxelizeMesh(slab, identity(slab), { mode, smart: true }).cells,
      wedgeCell = voxelizeMesh(wedge, identity(wedge), { mode, smart: true }).cells;
    assert.deepEqual(slabCell, [{ pos: [0, 0, 0], mask: 15 }]);
    assert.deepEqual(wedgeCell, [{ pos: [0, 0, 0], mask: 175 }]);
    assert.equal(fit(slabCell[0].mask, true).state.Properties.type, 'bottom');
    assert.equal(fit(wedgeCell[0].mask, true).state.Properties.facing, 'east');
  }
});

test('open roofs stay surfaces, with no large holes from sparse point sampling', () => {
  const roof = parseMeshOBJ(
    obj(
      [
        [0, 8, 0],
        [128, 8, 0],
        [0, 8, 128],
      ],
      [[0, 1, 2]],
    ),
  );
  assert.throws(() => voxelizeMesh(roof, identity(roof), { mode: 'solid' }), /闭合/);
  const result = voxelizeMesh(roof, identity(roof), { mode: 'surface' }),
    occupied = new Set(result.cells.map((c) => c.pos.join(',')));
  for (let x = 0; x < 120; x++)
    for (let z = 0; z < 120 - x; z++) assert.ok(occupied.has([x, 8, z].join(',')));
  assert.ok(result.cells.every(({ pos }) => pos[1] === 8));
  assert.ok(result.warnings.some((s) => s.includes('不会自动补面')));
  const smart = voxelizeMesh(
    parseMeshOBJ(
      obj(
        [
          [0, 0, 0],
          [1, 0, 0],
          [1, 0, 1],
          [0, 0, 1],
        ],
        [[0, 1, 2, 3]],
      ),
    ),
    { position: [0.5, 3, 0.5] },
    { smart: true },
  );
  assert.deepEqual(smart.cells, [{ pos: [0, 3, 0], mask: 15 }]);
});

test('rotation and negative scale preserve solid occupancy, including half-cell masks at negative positions', () => {
  const parsed = parseMeshOBJ(box(2, 1, 3).text),
    result = voxelizeMesh(
      parsed,
      { position: [-2, -1, -3], rotation: [0, 90, 0], scale: [-1, 1, 1] },
      { mode: 'solid', smart: true },
    );
  assert.equal(result.cells.length, 8);
  assert.deepEqual(result.bounds, { min: [-4, -1, -4], max: [-1, -1, -3] });
  assert.equal(result.stats.subcells, 48);
});

test('ray parity keeps an enclosed cavity empty rather than filling the entire bounding box', () => {
  const outer = box(4, 4, 4),
    inner = box(2, 2, 2, [1, 1, 1]),
    parsed = parseMeshOBJ(
      obj(
        [...outer.points, ...inner.points],
        [...outer.faces, ...inner.faces.map((f) => f.map((i) => i + 8))],
      ),
    ),
    result = voxelizeMesh(parsed, identity(parsed), { mode: 'solid' });
  assert.equal(result.cells.length, 56);
  assert.equal(
    result.cells.some(({ pos }) => pos.every((n) => n === 1 || n === 2)),
    false,
  );
});

test('computation and coordinate limits report an explicit failure without rescaling or partial output', () => {
  const parsed = parseMeshOBJ(box().text);
  assert.throws(
    () => voxelizeMesh(parsed, { scale: [101, 101, 101] }, { mode: 'solid' }),
    /1,000,000 格预算/,
  );
  assert.throws(() => voxelizeMesh(parsed, { position: [30_000_010, 0, 0] }), /坐标范围/);
  const triangle = parseMeshOBJ(
    obj(
      [
        [0, 0, 0],
        [10_000, 0, 0],
        [0, 0, 10_000],
      ],
      [[0, 1, 2]],
    ),
  );
  assert.throws(() => voxelizeMesh(triangle, identity(triangle)), /20,000,000 次预算/);
  assert.throws(() => voxelizeMesh(parsed, {}, { mode: 'unknown' }), /转换方式/);
});
