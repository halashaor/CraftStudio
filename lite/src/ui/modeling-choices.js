// These diagrams explain the operation; they are not previews of the user's geometry.
const path = (d, role = 'line') => `<path class="choice-${role}" d="${d}"/>`;
const dot = (x, y) => `<circle class="choice-node" cx="${x}" cy="${y}" r="2.5"/>`;
export const shapeDiagrams = {
  bezier:
    path('M8 32 22 8 43 40 60 15', 'guide') +
    path('M8 32C22 8 43 40 60 15') +
    dot(8, 32) +
    dot(60, 15),
  spline: path('M8 32Q17 6 28 19T60 15') + dot(8, 32) + dot(28, 19) + dot(60, 15),
  line: path('M10 34 58 12') + dot(10, 34) + dot(58, 12),
  polyline: path('M8 34 23 12 40 33 60 15') + dot(8, 34) + dot(23, 12) + dot(40, 33) + dot(60, 15),
  rectangle: path('M12 12H56V35H12Z') + dot(12, 12),
  circle: '<circle class="choice-line" cx="34" cy="24" r="16"/>',
  ellipse: '<ellipse class="choice-line" cx="34" cy="24" rx="25" ry="12"/>',
  arc: path('M10 34Q34 -6 58 34') + dot(10, 34) + dot(58, 34),
  polygon: path('M12 34 20 12 43 8 59 29 37 39Z') + dot(12, 34),
  box: path('M13 15 35 6 56 15 34 25Z M13 15V34L34 43 56 33V15 M34 25V43'),
};
const operations = {
  extrude:
    path('M10 31 30 23 48 31 28 40Z', 'source') +
    path('M10 15 30 7 48 15 28 24Z M10 15V31 M28 24V40 M48 15V31', 'result') +
    path('M59 35V10m-4 5 4-5 4 5', 'arrow'),
  loft:
    path('M8 36 29 30 52 36 30 43Z', 'source') +
    path('M22 10 31 6 40 10 31 15Z', 'source') +
    path('M8 36 22 10 M52 36 40 10 M30 43 31 15', 'result'),
  sweep:
    path('M8 33 18 28 24 34 14 40Z', 'source') +
    path('M18 34C20 8 43 10 57 20', 'guide') +
    path('M14 28C19 5 43 5 61 15 M24 38C23 16 39 16 53 25 M53 15 61 15 61 25 53 25Z', 'result'),
};
const shell = path('M13 15 35 6 56 15 34 25Z M13 15V34L34 43 56 33V15 M34 25V43', 'result');
const modes = {
  surface: shell + path('M21 20V31L29 35 M41 27V35L49 31', 'guide'),
  solid:
    path('M13 15 35 6 56 15V33L34 43 13 34Z', 'fill') +
    shell +
    path('M20 19V36 M27 22V39 M41 22V40 M49 19V36 M13 24 34 33 56 24', 'result'),
};

export class ModelingChoicesUI {
  constructor($) {
    this.groups = [
      this.mount($('figure-kind'), shapeDiagrams, 'shape', '画什么', {
        bezier: '贝塞尔',
        spline: '贯穿点',
        polyline: '折线',
      }),
      this.mount($('feature-operation'), operations, 'operation', '怎样生成'),
      this.mount($('mesh-model-mode'), modes, 'volume', '怎样填充'),
    ];
    const observer = new MutationObserver(() => this.update());
    for (const id of ['construction-panel', 'mesh-model-panel'])
      observer.observe($(id), {
        attributes: true,
        attributeFilter: [
          'hidden',
          'data-preview-state',
          'data-drawing-points',
          'data-local-history',
        ],
      });
    this.update();
  }
  mount(select, diagrams, kind, caption, names = {}) {
    const label = select.closest('label');
    label.hidden = true;
    const group = document.createElement('section');
    group.className = `modeling-choices modeling-choices-${kind}`;
    group.innerHTML = `<div class="choice-caption">${caption}<span>图示</span></div><div class="choice-grid" role="group" aria-label="${caption}"></div>`;
    label.after(group);
    const buttons = [...select.options].map((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.choice = option.value;
      button.title = option.textContent;
      button.innerHTML = `<svg viewBox="0 0 68 48" aria-hidden="true">${diagrams[option.value]}</svg><span></span>`;
      button.lastChild.textContent = names[option.value] || option.textContent;
      button.onclick = () => {
        if (select.value !== option.value) {
          select.dispatchEvent(new Event('craftstudio-choice-start', { bubbles: true }));
          select.value = option.value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        this.update();
        document.querySelector('#scene canvas')?.focus({ preventScroll: true });
      };
      group.lastChild.append(button);
      return { option, button };
    });
    select.addEventListener('change', () => this.update());
    new MutationObserver(() => this.update()).observe(select, {
      attributes: true,
      subtree: true,
      attributeFilter: ['disabled', 'selected'],
    });
    return { select, buttons };
  }
  update() {
    for (const { select, buttons } of this.groups || [])
      for (const { option, button } of buttons) {
        button.setAttribute('aria-pressed', String(select.value === option.value));
        button.disabled = select.disabled || option.disabled;
      }
  }
}
