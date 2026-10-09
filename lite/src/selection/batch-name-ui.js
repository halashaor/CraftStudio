import template from './views/batch-name.html';
import { renamePlan } from './object-naming.js';
export class BatchNameUI {
  constructor({
    $,
    getSummary,
    getObjectIds,
    isOperating,
    call,
    refresh,
    markDirty,
    notice,
    task,
  }) {
    Object.assign(this, {
      $,
      getSummary,
      getObjectIds,
      isOperating,
      call,
      refresh,
      markDirty,
      notice,
      task,
    });
    this.panel = document.createElement('section');
    this.panel.id = 'batch-name-panel';
    this.panel.className = 'inspector-section';
    this.panel.hidden = true;
    this.panel.innerHTML = template;
    $('cad-selection-info').after(this.panel);
    this.source = null;
    this.busy = false;
    this.plan = [];
    for (const id of ['template', 'start', 'digits', 'find', 'replace', 'order'])
      $('batch-name-' + id).oninput = () => this.preview();
    $('batch-name-cancel').onclick = () => this.cancel();
    $('batch-name-apply').onclick = () => task(() => this.apply(), '更新对象名称…');
    this.panel.addEventListener('keydown', (event) => {
      if (event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.cancel();
      }
      if (
        event.key === 'Enter' &&
        event.target.tagName === 'INPUT' &&
        !$('batch-name-apply').disabled
      ) {
        event.preventDefault();
        event.stopPropagation();
        $('batch-name-apply').click();
      }
    });
  }
  cancel() {
    if (this.busy) return;
    const focused = this.panel.contains(document.activeElement);
    this.source = null;
    this.plan = [];
    this.panel.hidden = true;
    if (focused) this.$('cad-object-rename')?.focus({ preventScroll: true });
  }
  open() {
    if (this.busy || this.isOperating()) return this.notice('请先确认或取消当前操作');
    const summary = this.getSummary(),
      ids = new Set(this.getObjectIds()),
      objects = summary.design.objects.filter((object) => ids.has(object.id));
    if (!objects.length) return this.notice('请先在对象树选择需要命名的对象');
    this.source = {
      workspaceId: summary.workspaceId,
      revision: summary.revision,
      objects: objects.map(({ id, name, min }) => ({ id, name, min: [...min] })),
    };
    this.panel.hidden = false;
    this.$('batch-name-count').textContent = '当前选择 ' + objects.length + ' 个对象 · 只改名称';
    this.preview();
    this.panel.scrollIntoView({ block: 'nearest' });
    this.$('batch-name-template').focus();
    this.$('batch-name-template').select();
  }
  preview() {
    if (!this.source) return;
    try {
      this.plan = renamePlan(this.source.objects, {
        template: this.$('batch-name-template').value,
        start: Number(this.$('batch-name-start').value),
        digits: Number(this.$('batch-name-digits').value),
        find: this.$('batch-name-find').value,
        replace: this.$('batch-name-replace').value,
        order: this.$('batch-name-order').value,
      });
      this.$('batch-name-rows').replaceChildren(
        ...this.plan.slice(0, 100).map((entry) => {
          const row = document.createElement('tr');
          for (const value of [entry.before, entry.name]) {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.append(cell);
          }
          return row;
        }),
      );
      const changed = this.plan.filter((entry) => entry.before !== entry.name).length;
      this.$('batch-name-report').textContent =
        '将修改 ' +
        changed +
        ' 个名称' +
        (this.plan.length > 100 ? ' · 仅显示前 100 项' : '') +
        ' · 可一次撤销';
      this.$('batch-name-apply').disabled = !changed;
    } catch (error) {
      this.plan = [];
      this.$('batch-name-rows').replaceChildren();
      this.$('batch-name-report').textContent = error.message;
      this.$('batch-name-apply').disabled = true;
    }
  }
  async apply() {
    if (!this.source || this.busy || this.isOperating()) return;
    const names = this.plan
      .filter((entry) => entry.before !== entry.name)
      .map(({ id, name }) => ({ id, name }));
    if (!names.length) return;
    this.busy = true;
    this.panel.inert = true;
    this.$('batch-name-apply').disabled = true;
    try {
      const result = await this.call('api', {
        method: 'objects.rename',
        params: {
          workspaceId: this.source.workspaceId,
          expectedRevision: this.source.revision,
          names,
        },
      });
      if (!result.ok) throw Error(result.error.message);
      this.refresh(await this.call('summary'));
      this.markDirty();
      this.notice('已更新 ' + result.value.renamed + ' 个对象名称，可一次撤销');
    } finally {
      this.busy = false;
      this.panel.inert = false;
      this.cancel();
    }
  }
  update(summary) {
    if (!this.source || this.busy) return;
    const selected = new Set(this.getObjectIds());
    if (
      summary.workspaceId !== this.source.workspaceId ||
      summary.revision !== this.source.revision ||
      selected.size !== this.source.objects.length ||
      this.source.objects.some((object) => !selected.has(object.id))
    )
      this.cancel();
  }
}
