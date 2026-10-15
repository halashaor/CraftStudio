export class MarqueePreviewView {
  constructor({ THREE, scene, requestRender }) {
    this.requestRender = requestRender;
    const box = new THREE.BoxGeometry(1.025, 1.025, 1.025),
      edges = new THREE.EdgesGeometry(box);
    box.dispose();
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.setAttribute('position', edges.getAttribute('position'));
    this.geometry.setAttribute(
      'offset',
      new THREE.InstancedBufferAttribute(new Float32Array(12000 * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    this.geometry.instanceCount = 0;
    this.material = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color() }, opacity: { value: 0.9 } },
      vertexShader:
        'attribute vec3 offset; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position+offset+vec3(0.5),1.0);}',
      fragmentShader:
        'uniform vec3 color; uniform float opacity; void main(){gl_FragColor=vec4(color,opacity);}',
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const edgesNode = new THREE.LineSegments(this.geometry, this.material);
    this.edges = edgesNode;
    edgesNode.frustumCulled = false;
    edgesNode.renderOrder = 13;
    this.pointGeometry = new THREE.InstancedBufferGeometry();
    this.pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    this.pointGeometry.setAttribute('offset', this.geometry.getAttribute('offset'));
    this.pointGeometry.instanceCount = 0;
    this.pointMaterial = new THREE.ShaderMaterial({
      uniforms: { color: this.material.uniforms.color, opacity: { value: 0.18 } },
      vertexShader:
        'attribute vec3 offset; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(offset+vec3(0.5),1.0);gl_PointSize=3.0;}',
      fragmentShader:
        'uniform vec3 color; uniform float opacity; void main(){if(length(gl_PointCoord-vec2(0.5))>0.5)discard;gl_FragColor=vec4(color,opacity);}',
      transparent: true,
      depthTest: true,
      depthFunc: THREE.GreaterDepth,
      depthWrite: false,
    });
    this.hiddenPoints = new THREE.Points(this.pointGeometry, this.pointMaterial);
    this.hiddenPoints.frustumCulled = false;
    this.hiddenPoints.renderOrder = 12;
    this.node = new THREE.Group();
    this.node.add(edgesNode, this.hiddenPoints);
    this.node.visible = false;
    scene.add(this.node);
  }
  show(result, operation, pending, through) {
    this.geometry.getAttribute('offset').array.set(result.coordinates);
    this.geometry.getAttribute('offset').needsUpdate = true;
    this.geometry.instanceCount = result.shown;
    this.pointGeometry.instanceCount = result.shown;
    this.large = result.affected > 2048;
    this.edges.visible = !this.large;
    this.hiddenPoints.visible = through || this.large;
    this.pointMaterial.depthTest = !this.large;
    this.material.uniforms.color.value.setHex(
      { replace: 0x75d9ee, add: 0x7dd5a0, subtract: 0xf38b85, intersect: 0xc6a5f3 }[operation],
    );
    this.node.visible = result.shown > 0;
    this.pending(pending);
  }
  pending(value) {
    this.material.uniforms.opacity.value = value ? 0.28 : 0.9;
    this.pointMaterial.uniforms.opacity.value = value ? 0.06 : this.large ? 0.38 : 0.18;
    this.requestRender();
  }
  clear() {
    this.node.visible = false;
    this.geometry.instanceCount = 0;
    this.requestRender();
  }
}
