import {
  guideSnapTargets,
  guideSnapSegments,
  nearbyIntersections,
  nearestScreenSnap,
} from './object-snaps.js';
import { snapSourceHighlight } from './snap-source-highlight.js';

export class SketchSnapController {
  constructor({
    THREE,
    $,
    scene,
    renderer,
    getCamera,
    guideRoot,
    panel,
    getEditingGuideId,
    requestRender,
  }) {
    Object.assign(this, {
      THREE,
      $,
      renderer,
      getCamera,
      guideRoot,
      panel,
      getEditingGuideId,
      requestRender,
    });
    this.targets = [];
    this.segments = [];
    this.sourceHighlight = snapSourceHighlight();
    this.feedback = document.createElement('p');
    this.feedback.id = 'sketch-snap-feedback';
    this.feedback.className = 'small';
    $('sketch-geometry-snap').title =
      '鼠标附近的端点、中点、中心和真实三维交点；按住 Ctrl 暂停辅助线吸附';
    $('sketch-geometry-snap-label').textContent = '辅助线端点 / 中点 / 中心 / 交点吸附';
    $('construction-report').before(this.feedback);
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x55dfdc, depthTest: false }),
    );
    this.marker.visible = false;
    scene.add(this.marker);
  }

  setGuides(guides) {
    this.clear();
    this.targets = guideSnapTargets(guides);
    this.segments = guideSnapSegments(guides);
  }

  highlightSources(ids) {
    this.sourceHighlight.set(this.guideRoot.children, ids);
    this.requestRender();
  }

  clear() {
    this.show(null);
  }

  show(target) {
    const ids = target ? target.sourceIds || [target.guideId] : [];
    this.sourceHighlight.set(this.guideRoot.children, ids);
    this.panel.dataset.snapSources = ids.filter(Boolean).join(',');
    this.marker.visible = !!target;
    if (target) this.marker.position.set(...target.point);
    this.feedback.textContent = target
      ? `${{ endpoint: '端点', midpoint: '中点', center: '中心', intersection: '交点' }[target.kind]} · ${target.name}`
      : '';
    this.requestRender();
  }

  snap(event, { plane = null, accept = () => true } = {}) {
    if (!this.guideRoot.visible || !this.$('sketch-geometry-snap').checked || event.ctrlKey) {
      this.clear();
      return null;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    const camera = this.getCamera();
    const editingId = this.getEditingGuideId();
    const options = {
      pointer: [event.clientX, event.clientY],
      plane,
      project: (point) => {
        const projected = new this.THREE.Vector3(...point).project(camera);
        return [
          rect.left + ((projected.x + 1) * rect.width) / 2,
          rect.top + ((1 - projected.y) * rect.height) / 2,
          projected.z,
        ];
      },
    };
    const candidates = [
      ...this.targets.filter((target) => target.guideId !== editingId),
      ...nearbyIntersections(this.segments, { ...options, excludeId: editingId }),
    ].filter((target) => accept(target.point));
    const target = nearestScreenSnap(candidates, options);
    this.show(target);
    return target?.point || null;
  }
}
