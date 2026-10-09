import markup from './views/selection-sets.html';
export class SelectionSetsUI {
  constructor({
    $,
    call,
    refresh,
    markDirty,
    task,
    getSummary,
    getObjectIds,
    getSelection,
    selectObjects,
    selectRegion,
    notice,
  }) {
    Object.assign(this, {
      $,
      call,
      refresh,
      markDirty,
      task,
      getSummary,
      getObjectIds,
      getSelection,
      selectObjects,
      selectRegion,
      notice,
    });
    this.panel = document.createElement('details');
    this.panel.id = 'selection-sets-panel';
    this.panel.innerHTML = markup;
    $('cad-collection-controls').append(this.panel);
    $('selection-set-list').onchange = () => {
      const set = this.getSummary().design.selectionSets?.find(
        (set) => set.id === $('selection-set-list').value,
      );
      $('selection-set-name').value = set?.name || '';
      this.controls();
    };
    $('selection-set-save').onclick = () => task(() => this.save(false), '保存命名选择…');
    $('selection-set-update').onclick = () => task(() => this.save(true), '更新命名选择…');
    $('selection-set-remove').onclick = () =>
      task(
        () => this.mutate('selectionSets.remove', { id: $('selection-set-list').value }),
        '移除选择记录…',
      );
    $('selection-set-restore').onclick = () => task(() => this.restore(), '恢复选择…');
    $('selection-set-restore').dataset.sceneShortcuts = 'true';
  }
  async read(method, params) {
    const s = this.getSummary(),
      result = await this.call('api', {
        method,
        params: { workspaceId: s.workspaceId, expectedRevision: s.revision, ...params },
      });
    if (!result.ok) throw Error(result.error.message);
    return result.value;
  }
  async mutate(method, params) {
    const result = await this.read(method, params);
    this.refresh(await this.call('summary'));
    this.markDirty();
    return result;
  }
  async save(replace) {
    const ids = this.getObjectIds(),
      selection = this.getSelection();
    if (!ids.length && !selection) throw Error('请先选择对象或框选区域');
    const value = {
      name: this.$('selection-set-name').value,
      ...(ids.length ? { objectIds: ids } : { selection }),
    };
    if (replace) {
      value.id = this.$('selection-set-list').value;
      if (!value.id) throw Error('先选择要更新的记录');
    }
    const result = await this.mutate('selectionSets.put', { selectionSet: value });
    this.$('selection-set-list').value = result.id;
    this.controls();
    this.notice('命名选择已保存，可一次撤销');
  }
  async restore() {
    const source = this.getSummary();
    const result = await this.read('selectionSets.resolve', {
      id: this.$('selection-set-list').value,
    });
    if (
      this.getSummary().workspaceId !== source.workspaceId ||
      this.getSummary().revision !== source.revision
    )
      throw Error('工程已变化，请重新恢复选择');
    if (result.kind === 'objects') {
      if (result.objectIds.length) this.selectObjects(result.objectIds);
      this.$('selection-set-report').textContent =
        '已恢复 ' +
        result.objectIds.length +
        ' 个对象 · 隐藏 ' +
        result.hiddenObjectIds.length +
        ' · 失效 ' +
        result.missingObjectIds.length;
    } else {
      this.selectRegion(result.selection);
      this.$('selection-set-report').textContent = '已恢复固定区域；它不会跟随对象移动。';
    }
  }
  update(s) {
    if (this.workspaceId !== s.workspaceId) this.$('selection-set-name').value = '';
    const selected = this.workspaceId === s.workspaceId ? this.$('selection-set-list').value : '';
    this.workspaceId = s.workspaceId;
    const sets = s.design.selectionSets || [];
    this.$('selection-set-list').replaceChildren(
      ...[{ id: '', name: '选择记录' }, ...sets].map((set) => {
        const option = document.createElement('option');
        option.value = set.id;
        option.textContent =
          set.name +
          (set.kind === 'objects' ? ' · 对象引用' : set.kind === 'region' ? ' · 固定区域' : '');
        return option;
      }),
    );
    this.$('selection-set-list').value = sets.some((set) => set.id === selected) ? selected : '';
    this.controls();
  }
  controls() {
    for (const action of ['restore', 'remove', 'update'])
      this.$('selection-set-' + action).disabled = !this.$('selection-set-list').value;
  }
}
