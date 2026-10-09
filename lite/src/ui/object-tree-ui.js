export class ObjectTreeUI {
  constructor({ host, onSelect, onFrame, onChange, onEditGuide, onEditFeature, onDetach }) {
    Object.assign(this, {
      host,
      onSelect,
      onFrame,
      onChange,
      onEditGuide,
      onEditFeature,
      onDetach,
    });
    this.rows = new Map();
    this.expandedSources = new Set();
    this.workspaceId = null;
  }
  createRow(id) {
    const row = document.createElement('div');
    row.className = 'row tree-object';
    row.dataset.objectId = id;
    const name = document.createElement('button');
    name.dataset.sceneShortcuts = 'true';
    name.onclick = (event) => this.onSelect(id, event);
    name.ondblclick = () => this.onFrame();
    const visibility = document.createElement('button');
    visibility.onclick = () => this.onChange(id, 'hidden', !this.objects.get(id).hidden);
    const lock = document.createElement('button');
    lock.onclick = () => this.onChange(id, 'locked', !this.objects.get(id).locked);
    row.append(name, visibility, lock);
    return row;
  }
  update(summary, links, selectedIds) {
    if (this.workspaceId !== summary.workspaceId) {
      this.rows.clear();
      this.expandedSources.clear();
      this.host.replaceChildren();
      this.workspaceId = summary.workspaceId;
    }
    const design = summary.design;
    this.objects = new Map(design.objects.map((object) => [object.id, object]));
    const relations = new Map(links.objects.map((relation) => [relation.id, relation]));
    const definitions = new Map(
      (design.componentDefinitions || []).map((definition) => [definition.id, definition]),
    );
    const instances = new Map();
    for (const object of design.objects)
      if (object.instanceOf)
        instances.set(object.instanceOf, (instances.get(object.instanceOf) || 0) + 1);
    for (const [id, row] of this.rows)
      if (!this.objects.has(id)) {
        row.remove();
        this.rows.delete(id);
        this.expandedSources.delete(id);
      }
    design.objects.forEach((object, position) => {
      let row = this.rows.get(object.id);
      if (!row) {
        row = this.createRow(object.id);
        this.rows.set(object.id, row);
      }
      if (this.host.children[position] !== row)
        this.host.insertBefore(row, this.host.children[position] || null);
      row.classList.toggle('selected', selectedIds.has(object.id));
      const [name, visibility, lock] = row.querySelectorAll(':scope > button');
      name.textContent = object.name + (object.generation?.outdated ? ' · 待更新' : '');
      this.toggle(visibility, object.hidden ? '显示' : '隐藏', object.hidden ? '◎' : '◉', '对象');
      this.toggle(lock, object.locked ? '解锁' : '锁定', object.locked ? '◆' : '◇', '对象');
      this.sources(row, object, relations.get(object.id));
      this.component(row, object, definitions, instances);
      this.detach(row, object);
    });
  }
  toggle(button, label, symbol, noun) {
    button.dataset.label = label;
    button.title = label;
    button.setAttribute('aria-label', label + noun);
    button.textContent = symbol;
  }
  sources(row, object, relation) {
    const key = JSON.stringify([relation || null, object.generation?.type || null]);
    const previous = row.querySelector('.generation-sources');
    if (previous?.dataset.relationKey === key) return;
    previous?.remove();
    if (!relation) return;
    const details = document.createElement('details');
    details.className = 'generation-sources';
    details.dataset.relationKey = key;
    details.open = this.expandedSources.has(object.id);
    details.ontoggle = () => {
      if (!details.isConnected) return;
      if (details.open) this.expandedSources.add(object.id);
      else this.expandedSources.delete(object.id);
    };
    const title = document.createElement('summary');
    title.textContent = relation.detached
      ? '已独立化'
      : relation.sources.some((source) => source.missing)
        ? '来源参照已失效'
        : (relation.outdated ? '待更新 · ' : '') + '源草图 · ' + relation.sources.length;
    details.append(title);
    for (const issue of relation.issues || []) {
      const message = document.createElement('p');
      message.className = 'small';
      message.dataset.generationIssue = issue.code;
      message.textContent = issue.message;
      details.append(message);
    }
    for (const source of relation.sources) {
      const button = document.createElement('button');
      button.textContent =
        source.name + ' · ' + (source.editable ? '编辑源草图' : source.missing ? '已失效' : '参照');
      button.dataset.sourceGuideId = source.id;
      button.disabled = !source.editable;
      button.onclick = () => this.onEditGuide(source.id);
      details.append(button);
    }
    if (object.generation?.type === 'feature') {
      const repair = document.createElement('button');
      repair.textContent = '修复 / 更换建模来源';
      repair.dataset.featureSourceObject = object.id;
      repair.onclick = () => this.onEditFeature(object.id);
      details.append(repair);
    }
    row.append(details);
  }
  component(row, object, definitions, instances) {
    let badge = row.querySelector('.component-badge');
    if (!object.instanceOf) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('small');
      badge.className = 'component-badge';
      row.append(badge);
    }
    badge.textContent =
      '关联 · ' +
      (definitions.get(object.instanceOf)?.name || '组件') +
      ' · ' +
      instances.get(object.instanceOf) +
      ' 份';
  }
  detach(row, object) {
    let button = row.querySelector('.generation-detach');
    if (!object.generation || object.generation.detached) {
      button?.remove();
      return;
    }
    if (button) return;
    button = document.createElement('button');
    button.className = 'generation-detach';
    button.textContent = '独立化';
    button.title = '保留方块并断开后续草图更新';
    button.onclick = () => this.onDetach(object.id);
    row.append(button);
  }
}
