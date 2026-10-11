import controlsMarkup from './views/comparison-controls.html';
import barMarkup from './views/comparison-bar.html';
import { dialogOwnsKeyboard, textEditing } from './keyboard-context.js';

export class ComparisonUI {
  constructor({
    $,
    call,
    task,
    refresh,
    render,
    getSummary,
    beforeReview,
    notice,
    captureSelection,
    restoreSelection,
  }) {
    Object.assign(this, {
      $,
      call,
      task,
      refresh,
      render,
      getSummary,
      beforeReview,
      notice,
      captureSelection,
      restoreSelection,
    });
    this.busy = false;
    this.workspaceId = null;
    this.active = null;
    this.savedSelection = null;
    this.controls = $('studio-comparison');
    this.controls.innerHTML = controlsMarkup;
    this.bar = document.createElement('section');
    this.bar.id = 'comparison-bar';
    this.bar.hidden = true;
    this.bar.innerHTML = barMarkup;
    $('viewport').prepend(this.bar);
    for (const slot of ['a', 'b'])
      $('studio-' + slot).onclick = () => this.operate('capture', slot);
    for (const button of this.buttons())
      button.onclick = () =>
        this.operate(
          button.dataset.comparisonShow === 'current' ? 'end' : 'show',
          button.dataset.comparisonShow,
        );
    window.addEventListener(
      'keydown',
      (event) => {
        if (
          event.key !== 'Escape' ||
          !this.active ||
          event.defaultPrevented ||
          textEditing(event.target) ||
          dialogOwnsKeyboard()
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.operate('end');
      },
      true,
    );
  }
  buttons() {
    return [
      ...this.controls.querySelectorAll('[data-comparison-show]'),
      ...this.bar.querySelectorAll('[data-comparison-show]'),
    ];
  }
  operate(operation, slot) {
    if (this.busy || (operation !== 'end' && !this.beforeReview())) return;
    this.task(async () => {
      this.busy = true;
      this.update(this.getSummary());
      try {
        const head = this.getSummary();
        const result = await this.call('comparison', {
          operation,
          slot,
          workspaceId: head.workspaceId,
          expectedRevision: head.revision,
        });
        this.refresh(result);
        if (operation !== 'capture') await this.render();
        this.notice(
          operation === 'capture'
            ? `已记录当前设计为 ${slot.toUpperCase()}，可修改设计后再记录另一份`
            : operation === 'end'
              ? '已返回当前设计，撤销历史保持不变'
              : `正在只读查看方案 ${slot.toUpperCase()}`,
        );
      } finally {
        this.busy = false;
        this.update(this.getSummary());
      }
    }, '切换方案对比…');
  }
  update(summary) {
    if (!summary) return;
    if (this.workspaceId !== summary.workspaceId) {
      this.savedSelection = null;
      this.active = null;
      this.workspaceId = summary.workspaceId;
    }
    const info = summary.comparison || { active: null, slots: [] };
    if (!this.active && info.active) {
      this.savedSelection = this.captureSelection();
      this.restoreSelection(null);
    }
    if (this.active && !info.active) {
      const selection = this.savedSelection,
        workspace = this.workspaceId;
      queueMicrotask(() => {
        if (this.getSummary()?.workspaceId === workspace && !this.active)
          this.restoreSelection(selection);
      });
      this.savedSelection = null;
    }
    this.active = info.active;
    this.bar.hidden = !info.active;
    this.bar.querySelector('[data-comparison-status]').textContent = info.active
      ? `正在查看方案 ${info.active.toUpperCase()}`
      : '';
    for (const slot of ['a', 'b']) {
      const record = info.slots.find((record) => record.slot === slot);
      this.$('studio-' + slot).disabled = this.busy || !!info.active || summary.preview;
      this.controls.querySelector(`[data-comparison-record="${slot}"]`).textContent = record
        ? `${record.name} · ${new Date(record.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '尚未记录';
    }
    for (const button of this.buttons()) {
      const slot = button.dataset.comparisonShow;
      button.disabled =
        this.busy || (slot !== 'current' && !info.slots.some((record) => record.slot === slot));
      button.setAttribute('aria-pressed', String(slot === (info.active || 'current')));
    }
  }
}
