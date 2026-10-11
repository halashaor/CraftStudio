// Crossed cells distinguish blocked candidates from the plain overlap outline.
export class PreviewIssueView {
  constructor(THREE, scene, requestRender) {
    this.THREE = THREE;
    this.scene = scene;
    this.requestRender = requestRender;
    this.node = null;
  }
  clear() {
    if (!this.node) return;
    this.scene.remove(this.node);
    this.node.geometry.dispose();
    this.node.material.dispose();
    this.node = null;
    this.requestRender();
  }
  draw(positions) {
    this.clear();
    if (!positions.length) return;
    const T = this.THREE,
      cube = new T.BoxGeometry(1.04, 1.04, 1.04),
      edges = new T.EdgesGeometry(cube),
      vertices = Array.from(edges.getAttribute('position').array);
    // One camera-facing cross stays legible without crisscrossing every face.
    const facing = new Array(vertices.length / 3).fill(0);
    vertices.push(-0.28, -0.28, 0, 0.28, 0.28, 0, -0.28, 0.28, 0, 0.28, -0.28, 0);
    facing.push(1, 1, 1, 1);
    edges.dispose();
    cube.dispose();
    const geometry = new T.InstancedBufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('facing', new T.Float32BufferAttribute(facing, 1));
    geometry.setAttribute(
      'offset',
      new T.InstancedBufferAttribute(
        new Float32Array(positions.flatMap((p) => p.map((n) => n + 0.5))),
        3,
      ),
    );
    geometry.instanceCount = positions.length;
    const material = new T.ShaderMaterial({
      vertexShader:
        'attribute vec3 offset; attribute float facing; void main(){vec4 p=modelViewMatrix*vec4(offset,1.0); p+=mix(modelViewMatrix*vec4(position,0.0),vec4(position,0.0),facing);gl_Position=projectionMatrix*p;}',
      fragmentShader: 'void main(){gl_FragColor=vec4(1.0,.43,.43,1.0);}',
      depthTest: false,
      depthWrite: false,
    });
    this.node = new T.LineSegments(geometry, material);
    this.node.name = 'preview-protection-conflicts';
    this.node.frustumCulled = false;
    this.node.renderOrder = 16;
    this.scene.add(this.node);
    this.requestRender();
  }
}
