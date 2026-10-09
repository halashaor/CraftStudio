import * as THREE from '../../../web/vendor/three.module.js';
export class HoverFeedback {
  constructor(scene) {
    this.group = new THREE.Group();
    this.opacity = 0;
    this.target = null;
    this.key = '';
    this.fill = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x65d8ed,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({
        color: 0x65d8ed,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.fill.renderOrder = 11;
    this.edges.renderOrder = 12;
    this.group.add(this.fill, this.edges);
    this.group.visible = false;
    scene.add(this.group);
  }
  show(target) {
    const key = target ? JSON.stringify([target.min, target.max, target.selected]) : '';
    if (key === this.key) return;
    this.key = key;
    this.target = target;
    if (!target) return;
    const min = target.min,
      max = target.max.map((n) => n + 1);
    this.group.position.set(...min.map((n, a) => (n + max[a]) / 2));
    this.group.scale.set(...min.map((n, a) => max[a] - n + 0.025));
    const color = target.selected ? 0xffd56a : 0x65d8ed;
    this.fill.material.color.setHex(color);
    this.edges.material.color.setHex(color);
  }
  tick(dt, time) {
    const goal = this.target ? 1 : 0,
      before = this.opacity;
    this.opacity += (goal - this.opacity) * (1 - Math.exp(-Math.min(dt, 0.05) * 18));
    if (Math.abs(goal - this.opacity) < 0.005) this.opacity = goal;
    this.group.visible = this.opacity > 0;
    this.fill.material.opacity =
      this.opacity * (this.target?.selected ? 0.13 + 0.025 * Math.sin(time / 300) : 0.08);
    this.edges.material.opacity = this.opacity * 0.95;
    return before !== this.opacity || !!(this.target?.selected && this.opacity > 0);
  }
}
