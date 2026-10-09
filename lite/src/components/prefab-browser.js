import template from './views/prefab-browser.html';
import { listedPrefabs, prefabTags } from './prefab-catalogue.js';

export class PrefabBrowser {
  constructor({ root, place, exportFile, importFile, create, save }) {
    Object.assign(this, { root, place, exportFile, save });
    root.innerHTML = template;
    this.prefabs = [];
    this.selected = null;
    this.workspaceId = null;
    this.signature = '';
    this.$ = (id) => root.querySelector('#' + id);
    for (const id of ['prefab-search', 'prefab-category', 'prefab-sort'])
      this.$(id).oninput = () => this.render();
    this.$('prefab-import').onclick = importFile;
    this.$('prefab-create').onclick = create;
    this.$('prefab-place').onclick = () => {
      const prefab = this.current();
      if (prefab) this.place(prefab);
    };
    this.$('prefab-export').onclick = () => {
      const prefab = this.current();
      if (prefab) this.exportFile(prefab);
    };
    this.$('prefab-save-metadata').onclick = () => {
      const prefab = this.current();
      if (!prefab) return;
      this.save({
        id: prefab.id,
        name: this.$('prefab-name').value,
        tags: this.$('prefab-edit-tags')
          .value.split(/[,，、]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    };
  }
  current() {
    return this.prefabs.find((prefab) => prefab.id === this.selected);
  }
  update(prefabs, workspaceId) {
    if (this.workspaceId !== workspaceId) {
      this.selected = null;
      this.$('prefab-search').value = '';
      this.$('prefab-category').value = '';
      this.workspaceId = workspaceId;
    }
    this.prefabs = prefabs;
    const signature = JSON.stringify([
      workspaceId,
      prefabs.map((prefab) => [
        prefab.id,
        prefab.name,
        prefab.size,
        prefab.blocks.length,
        prefabTags(prefab),
      ]),
    ]);
    if (signature === this.signature) return;
    this.signature = signature;
    const category = this.$('prefab-category').value;
    const tags = [...new Set(prefabs.flatMap(prefabTags))].sort((a, b) =>
      a.localeCompare(b, 'zh-CN'),
    );
    this.$('prefab-category').replaceChildren(
      ...['', ...tags].map((tag) => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag || '所有分类';
        return option;
      }),
    );
    this.$('prefab-category').value = tags.includes(category) ? category : '';
    this.render();
  }
  render() {
    const shown = listedPrefabs(this.prefabs, {
      query: this.$('prefab-search').value,
      category: this.$('prefab-category').value,
      sort: this.$('prefab-sort').value,
    });
    if (!shown.some((prefab) => prefab.id === this.selected)) this.selected = shown[0]?.id || null;
    this.$('prefab-count').textContent =
      '当前工程 · ' + shown.length + ' / ' + this.prefabs.length + ' 个构件';
    this.$('prefab-list').replaceChildren(
      ...shown.map((prefab) => {
        const button = document.createElement('button');
        button.className = 'full';
        button.dataset.prefabId = prefab.id;
        button.draggable = true;
        button.setAttribute('aria-pressed', String(prefab.id === this.selected));
        button.textContent =
          (prefab.name || '未命名构件') +
          ' · ' +
          prefab.size.join('×') +
          ' · ' +
          prefab.blocks.length +
          ' 格';
        button.ondragstart = (event) =>
          event.dataTransfer.setData('application/craftstudio-prefab', prefab.id);
        button.onclick = () => {
          this.selected = prefab.id;
          this.detailId = null;
          this.render();
          [...this.$('prefab-list').children]
            .find((button) => button.dataset.prefabId === prefab.id)
            ?.focus({ preventScroll: true });
        };
        return button;
      }),
    );
    this.$('prefab-empty').hidden = shown.length > 0;
    this.$('prefab-empty').textContent = shown.length
      ? ''
      : this.prefabs.length
        ? '没有匹配的构件，可清空搜索或更换分类。'
        : '当前工程还没有构件。可导入文件，或选择建筑后创建。';
    const selected = this.current();
    this.$('prefab-detail').hidden = !selected;
    if (!selected) return;
    if (this.detailId !== selected.id) this.$('prefab-detail').scrollTop = 0;
    this.detailId = selected.id;
    this.$('prefab-title').textContent = selected.name || '未命名构件';
    this.$('prefab-size').textContent =
      '尺寸 ' + selected.size.join(' × ') + ' · ' + selected.blocks.length + ' 个方块';
    this.$('prefab-tags').textContent = prefabTags(selected).join(' / ') || '尚未分类';
    this.$('prefab-name').value = selected.name || '';
    this.$('prefab-edit-tags').value = prefabTags(selected).join('，');
  }
}
