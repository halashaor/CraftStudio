import { previewPresentation } from '../modeling/preview-presentation.js';

// One shared visual language, driven by each tool's existing preview/commit state.
export class PreviewStateUI {
  constructor({ panel, apply, report }) {
    Object.assign(this, { panel, apply });
    this.element = document.createElement('div');
    this.element.className = 'preview-state';
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-atomic', 'true');
    this.element.innerHTML =
      '<span class="preview-state-symbol" aria-hidden="true"></span><span><strong></strong><small></small></span>';
    report.before(this.element);
    const observer = new MutationObserver(() => this.update());
    observer.observe(panel, {
      attributes: true,
      attributeFilter: ['hidden', 'inert', 'data-preview-state'],
    });
    observer.observe(apply, { attributes: true, attributeFilter: ['disabled', 'hidden'] });
    panel.addEventListener('change', () => this.update());
    this.update();
  }
  update() {
    const presentation = previewPresentation({
      state: this.panel.dataset.previewState,
      canConfirm: !this.apply.disabled,
      referenceOnly: this.panel.dataset.previewOutput === 'reference',
      output: this.panel.dataset.previewOutput,
      committing: this.panel.inert,
    });
    this.element.hidden = this.apply.hidden;
    const key = JSON.stringify(presentation);
    if (this.key === key) return;
    this.key = key;
    const { id, tone, symbol, label, detail } = presentation;
    this.element.dataset.state = id;
    this.element.dataset.tone = tone;
    this.element.querySelector('.preview-state-symbol').textContent = symbol;
    this.element.querySelector('strong').textContent = label;
    this.element.querySelector('small').textContent = detail;
    this.apply.dataset.previewReady = String(id === 'ready');
    this.apply.dataset.previewTone = tone;
  }
}
