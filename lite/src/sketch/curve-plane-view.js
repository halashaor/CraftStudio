import { fromPlane } from './workplane.js';
export function curvePlaneView(THREE, scene, requestRender) {
  const root = new THREE.Group();
  scene.add(root);
  function clear() {
    for (const n of [...root.children]) {
      root.remove(n);
      n.geometry.dispose();
      n.material.dispose();
    }
    requestRender();
  }
  function draw(frame) {
    clear();
    if (!frame) return;
    const pts = [
      [-1.5, -1.5, 0],
      [1.5, -1.5, 0],
      [1.5, 1.5, 0],
      [-1.5, 1.5, 0],
      [-1.5, -1.5, 0],
    ].map((p) => new THREE.Vector3(...fromPlane(p, frame)));
    root.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xffce7f, depthTest: false }),
      ),
    );
    const a = new THREE.Vector3(...frame.origin),
      b = new THREE.Vector3(...frame.origin.map((n, i) => n + frame.normal[i] * 2));
    root.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([a, b]),
        new THREE.LineBasicMaterial({ color: 0xffce7f, depthTest: false }),
      ),
    );
    requestRender();
  }
  return { clear, draw };
}
