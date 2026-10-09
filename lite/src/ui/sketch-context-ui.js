import markup from './views/sketch-context.html';
import { pointPlacement, sketchPhase, surfacePathKinds } from '../sketch/placement-mode.js';
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
  }
  update() {
    const state = this.getState(),
      mode = pointPlacement(state),
      phase = sketchPhase(state);
    this.host.hidden = !state.active || state.type !== 'geometry';
    this.$('sketch-context').dataset.phase = phase.id;
    this.$('sketch-phase-name').textContent = phase.label;
    this.$('sketch-context-mode').textContent =
      mode === 'surface'
        ? '取点：鼠标指向的表面'
        : state.workplane
          ? '取点：自定义工作平面'
          : { xz: '水平 XZ', xy: '立面 XY', yz: '立面 YZ' }[state.plane] || '工作平面';
    const curves = {
      line: 'M10 28L61 13',
      polyline: 'M10 28L24 9L43 29L61 13',
      polygon: 'M12 30L28 5L60 29Z',
      rectangle: 'M12 8H58V33H12Z',
      circle: 'M13 21a21 15 0 1 0 42 0a21 15 0 1 0 -42 0',
      ellipse: 'M10 21a25 11 0 1 0 50 0a25 11 0 1 0 -50 0',
      box: 'M12 15L36 5L59 14L35 25Z M12 15V31L35 40L59 29V14 M35 25V40',
    };
    this.$('sketch-context')
      .querySelector('.context-curve')
      .setAttribute('d', curves[state.kind] || 'M10 28C24 5 48 35 61 13');
    this.$('sketch-context').querySelector('.context-controls').style.display =
      state.kind === 'bezier' ? '' : 'none';
    this.$('sketch-context').querySelector('.context-handles').style.display = [
      'bezier',
      'line',
      'polyline',
      'spline',
    ].includes(state.kind)
      ? ''
      : 'none';
    for (const rect of this.$('sketch-context').querySelectorAll('.context-handles rect'))
      rect.style.display = state.kind === 'bezier' ? '' : 'none';
    const grid = state.snap ? `吸附 ${state.snap} 格` : '自由坐标';
    this.$('sketch-context-detail').textContent = state.drawing
      ? grid
      : phase.id === 'blocks'
        ? `${state.materialName || '当前素材'} · 宽 ${state.width} 格 · 确认后放置`
        : `${state.kind === 'bezier' ? '圆点定端点，方点调弯曲' : '拖动圆点调整轮廓'} · ${state.planeLock ? '锁定平面' : grid}`;
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
