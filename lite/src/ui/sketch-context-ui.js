import markup from './views/sketch-context.html';
import { pointPlacement, sketchPhase, surfacePathKinds } from '../sketch/placement-mode.js';
import { shapeDiagrams } from './modeling-choices.js';
export class SketchContextUI {
  constructor({ $, panel, getState, chooseMode }) {
    Object.assign(this, { $, panel, getState });
    const host = document.createElement('section');
    host.id = 'sketch-context-controls';
    host.innerHTML = markup;
    $('figure-controls').prepend(host);
    host.before($('figure-kind').closest('label'));
    host.append($('sketch-model-handoff'));
    this.host = host;
    this.buttons = [...host.querySelectorAll('[data-placement-mode]')];
    for (const button of this.buttons)
      button.onclick = () => {
        chooseMode(button.dataset.placementMode);
        document.querySelector('#scene canvas')?.focus({ preventScroll: true });
      };
    new MutationObserver(() => this.update()).observe(panel, {
      attributes: true,
      attributeFilter: [
        'hidden',
        'data-preview-state',
        'data-selected-node',
        'data-drawing-points',
      ],
    });
    new MutationObserver(() => this.update()).observe($('construction-apply'), {
      attributes: true,
      attributeFilter: ['disabled'],
    });
  }
  update() {
    const state = this.getState(),
      mode = pointPlacement(state),
      phase = sketchPhase(state);
    this.host.hidden = !state.active || state.type !== 'geometry';
    this.$('sketch-context').dataset.phase = phase.id;
    this.$('sketch-context').dataset.tone =
      phase.tone || (phase.id === 'blocks' ? 'result' : 'source');
    this.$('sketch-phase-name').textContent = phase.label;
    this.$('sketch-context-mode').textContent =
      mode === 'surface'
        ? '取点：鼠标指向的表面'
        : state.workplane
          ? '取点：自定义工作平面'
          : { xz: '水平 XZ', xy: '立面 XY', yz: '立面 YZ' }[state.plane] || '工作平面';
    if (this.kind !== state.kind) {
      this.kind = state.kind;
      this.$('sketch-context').querySelector('.context-diagram').innerHTML =
        shapeDiagrams[state.kind];
    }
    const grid = state.snap ? `吸附 ${state.snap} 格` : '自由坐标';
    this.$('sketch-context-detail').textContent = state.drawing
      ? `${state.pointCount || 0} 个取点 · ${grid}`
      : phase.detail
        ? phase.detail
        : phase.id === 'blocks'
          ? `${state.materialName || '当前素材'} · 宽 ${state.width} 格 · 确认后放置`
          : `${state.kind === 'bezier' ? '○ 端点 · □ 弯曲控制点' : '拖动圆点调整轮廓'} · ${state.planeLock ? '锁定平面' : grid}`;
    this.panel.dataset.pointPlacement = mode;
    for (const button of this.buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.placementMode === mode));
      button.disabled =
        button.dataset.placementMode === 'surface' && !surfacePathKinds.has(state.kind);
      button.title = button.disabled ? '此图形需要在平面上绘制' : '';
    }
    this.$('figure-plane').closest('label').hidden = mode === 'surface';
  }
}
