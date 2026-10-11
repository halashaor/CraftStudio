export class MeshSourceBrowser {
  constructor({
    host,
    call,
    task,
    refresh,
    render,
    markDirty,
    notice,
    open,
    getSummary,
    busyReason,
  }) {
    Object.assign(this, {
      host,
      call,
      task,
      refresh,
      render,
      markDirty,
      notice,
      open,
      getSummary,
      busyReason,
    });
    this.host.className = 'mesh-source-browser';
    this.rows = new Map();
  }
  async mutate(method, params, guard) {
    const reason = this.busyReason();
    if (reason) throw Error(reason);
    const head = guard || this.getSummary();
    const result = await this.call('api', {
      method,
      params: { ...params, workspaceId: head.workspaceId, expectedRevision: head.revision },
    });
    if (!result.ok) throw Error(result.error.message);
    this.refresh(await this.call('summary'));
    this.markDirty();
    await this.render();
  }
  update(summary) {
    if (this.workspace !== summary.workspaceId) {
      this.rows.clear();
      this.host.replaceChildren();
      this.workspace = summary.workspaceId;
    }
    const sources = summary.design.meshSources || [];
    this.host.hidden = !sources.length;
    for (const [id, row] of this.rows)
      if (!sources.some((source) => source.id === id)) {
        row.remove();
        this.rows.delete(id);
      }
    if (!sources.length) return;
    let heading = this.host.querySelector('h3');
    if (!heading) {
      heading = document.createElement('h3');
      heading.textContent = '模型来源 · 非方块';
      this.host.prepend(heading);
    }
    for (const source of sources) {
      let row = this.rows.get(source.id);
      if (!row) {
        row = document.createElement('div');
        row.className = 'mesh-source-row';
        row.dataset.meshSourceId = source.id;
        const name = document.createElement('button'),
          toggle = document.createElement('button'),
          replace = document.createElement('button'),
          remove = document.createElement('button'),
          input = document.createElement('input');
        name.className = 'mesh-source-open';
        name.onclick = () => this.open({ sourceId: source.id });
        toggle.className = 'mesh-source-visibility';
        toggle.onclick = () =>
          this.task(() => {
            const current = this.getSummary().design.meshSources.find(
              (item) => item.id === source.id,
            );
            return this.mutate('meshes.put', {
              source: { id: source.id, hidden: !current.hidden },
            });
          });
        replace.textContent = '替换几何';
        replace.className = 'mesh-source-replace';
        input.type = 'file';
        input.accept = '.obj';
        input.hidden = true;
        let guard;
        replace.onclick = () => {
          guard = this.getSummary();
          input.click();
        };
        input.onchange = () => {
          const file = input.files[0];
          input.value = '';
          if (file)
            this.task(async () => {
              await this.mutate(
                'meshes.put',
                { source: { id: source.id, objText: await file.text() } },
                guard,
              );
              this.notice('已替换模型来源；关联方块可从对象来源中预览重建');
            });
        };
        remove.textContent = '移除';
        remove.className = 'mesh-source-remove';
        remove.onclick = () => this.task(() => this.mutate('meshes.remove', { id: source.id }));
        row.append(name, toggle, replace, remove, input);
        this.rows.set(source.id, row);
        this.host.append(row);
      }
      row.querySelector('.mesh-source-open').textContent = source.name;
      row.querySelector('.mesh-source-visibility').textContent = source.hidden
        ? '显示参考'
        : '隐藏参考';
      const linked = summary.design.objects.some(
        (object) => object.meshSourceId === source.id && !object.generation?.detached,
      );
      const remove = row.querySelector('.mesh-source-remove');
      remove.disabled = linked || !!summary.comparison?.active;
      remove.title = linked ? '请先独立化或移除关联方块结果' : '仅移除模型来源';
      for (const selector of [
        '.mesh-source-open',
        '.mesh-source-visibility',
        '.mesh-source-replace',
      ])
        row.querySelector(selector).disabled = !!summary.comparison?.active || summary.preview;
    }
  }
}
