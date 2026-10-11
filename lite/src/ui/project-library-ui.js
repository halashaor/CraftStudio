export class ProjectLibraryUI {
  constructor({ $, library, task, openProject, previewVersion, branchVersion, insertComponent }) {
    Object.assign(this, {
      $,
      library,
      task,
      openProject,
      previewVersion,
      branchVersion,
      insertComponent,
    });
  }
  button(text, action, className) {
    const button = document.createElement('button');
    button.textContent = text;
    if (className) button.className = className;
    button.onclick = () => this.task(action);
    return button;
  }
  async refresh() {
    const filter = this.$('library-filter').value;
    const items = await this.library.list({
      query: this.$('library-query').value,
      favorite: filter === 'favorite',
      kind: filter === 'component' ? 'component' : '',
      deleted: filter === 'trash',
    });
    const host = this.$('library-list');
    host.replaceChildren(...items.map((item) => this.card(item)));
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = '还没有匹配的工程。保存后，可以在这里再次打开。';
      host.append(empty);
    }
  }
  card(item) {
    const card = document.createElement('article'),
      title = document.createElement('h3'),
      meta = document.createElement('p'),
      actions = document.createElement('div');
    card.className = 'library-card';
    card.dataset.projectId = item.id;
    title.textContent = item.title;
    meta.textContent = `${item.tags.map((tag) => '#' + tag).join(' ')} · v${item.head} · ${item.blocks.toLocaleString()} 方块`;
    actions.className = 'row';
    const update = (changes) => async () => {
      await this.library.update(item.id, changes);
      await this.refresh();
    };
    if (item.deleted) actions.append(this.button('恢复', update({ deleted: false })));
    else {
      actions.append(this.button('继续编辑', () => this.openProject(item.id), 'library-open'));
      if (item.kind === 'component')
        actions.append(this.button('插入当前场景', () => this.insertComponent(item)));
      actions.append(
        this.button(item.favorite ? '★' : '☆', update({ favorite: !item.favorite })),
        this.button('移入回收站', update({ deleted: true })),
      );
    }
    card.append(title, meta, actions);
    if (!item.deleted) card.append(this.history(item));
    return card;
  }
  history(item) {
    const details = document.createElement('details'),
      heading = document.createElement('summary'),
      hint = document.createElement('p'),
      list = document.createElement('div');
    details.className = 'library-history';
    heading.textContent = '正式版本';
    hint.className = 'small';
    hint.textContent = '预览只查看；另存方案会建立独立工程，保留当前编辑。';
    details.append(heading, hint, list);
    let loading = false,
      loaded = false;
    details.ontoggle = () => {
      if (!details.open || loading || loaded) return;
      this.task(async () => {
        loading = true;
        try {
          const versions = await this.library.versions(item.id);
          list.replaceChildren(...versions.map((version) => this.version(item, version)));
          loaded = true;
        } finally {
          loading = false;
        }
      });
    };
    return details;
  }
  version(item, version) {
    const row = document.createElement('article'),
      title = document.createElement('strong'),
      time = document.createElement('small'),
      note = document.createElement('p'),
      actions = document.createElement('div');
    row.className = 'library-version';
    row.dataset.version = String(version.number);
    title.textContent = `v${version.number}${version.number === item.head ? ' · 最新正式版本' : ''}`;
    time.textContent = new Date(version.time).toLocaleString();
    note.textContent = version.note || '没有版本备注';
    actions.className = 'row';
    actions.append(
      this.button(
        '只读预览',
        () => this.previewVersion(item.id, version.number),
        'version-preview',
      ),
      this.button(
        '另存为方案',
        () => this.branchVersion(item.id, version.number),
        'version-branch',
      ),
    );
    row.append(title, time, note, actions);
    return row;
  }
}
