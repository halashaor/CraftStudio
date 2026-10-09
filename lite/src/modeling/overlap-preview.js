export function overlapPreview(THREE, scene, requestRender) {
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
    material = new THREE.ShaderMaterial({
      vertexShader:
        'attribute vec3 offset; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position+offset,1.0);}',
      fragmentShader: 'void main(){gl_FragColor=vec4(1.0,.38,.2,1.0);}',
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
  let node = null;
  function clear() {
    if (node) {
      scene.remove(node);
      node.geometry.dispose();
      node = null;
    }
    requestRender();
  }
  function draw(positions) {
    clear();
    if (!positions?.length) return;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', edges.getAttribute('position'));
    g.setAttribute(
      'offset',
      new THREE.InstancedBufferAttribute(
        new Float32Array(positions.flatMap((p) => p.map((n) => n + 0.5))),
        3,
      ),
    );
    g.instanceCount = positions.length;
    node = new THREE.LineSegments(g, material);
    node.frustumCulled = false;
    node.renderOrder = 15;
    scene.add(node);
    requestRender();
  }
  return { draw, clear };
}
