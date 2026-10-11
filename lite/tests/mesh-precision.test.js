import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from '../../web/vendor/three.module.js';
import { parseMeshOBJ } from '../src/models/mesh-obj.js';
import {
  centeredMeshPositions,
  meshPlacementMatrix,
  transformedTriangles,
} from '../src/models/mesh-transform.js';

test('far-from-origin OBJ details survive GPU transfer and match the voxel transform', () => {
  const parsed = parseMeshOBJ(
    'v 1000000000 1000000000 1000000000\nv 1000000002 1000000000 1000000000\nv 1000000000 1000000002 1000000000\nf 1 2 3',
  );
  const positions = centeredMeshPositions(parsed);
  assert.deepEqual([...positions], [-1, 0, 0, 1, 0, 0, -1, 2, 0]);
  const transform = { position: [15, 20, 30], rotation: [17, 33, 61], scale: [-2, 0.5, 3] };
  const matrix = new Matrix4().fromArray(meshPlacementMatrix(transform));
  const expected = transformedTriangles(parsed, transform)[0];
  for (let i = 0; i < 3; i++) {
    const displayed = new Vector3()
      .fromArray(positions, i * 3)
      .applyMatrix4(matrix)
      .toArray();
    assert.ok(Math.hypot(...displayed.map((n, a) => n - expected[i][a])) < 1e-10);
  }
});
