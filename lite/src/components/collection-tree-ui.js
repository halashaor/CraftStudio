import { CollectionHierarchy } from './collection-hierarchy.js';

// Fixed sidebar tree; expanding and browsing do not mutate scene geometry.
export class CollectionTreeUI {
  constructor({ host, onSelect }) {
    Object.assign(this, { host, onSelect });
    this.expanded = new Set();
    this.known = new Set();
    this.workspaceId = null;
    this.signature = '';
  }
  update(summary, selectedId) {
    if (this.workspaceId !== summary.workspaceId) {
      this.expanded.clear();
      this.known.clear();
      this.signature = '';
      this.workspaceId = summary.workspaceId;
    }
    const design = summary.design;
    const signature = JSON.stringify([
      design.collections,
      design.objects.map((object) => [object.id, object.collectionId]),
      selectedId,
    ]);
    if (signature === this.signature) return;
    this.signature = signature;
    const hierarchy = new CollectionHierarchy(design.collections),
      containers = new Map(),
      fragment = document.createDocumentFragment();
    for (const { collection } of hierarchy.rows()) {
      const details = document.createElement('details'),
        title = document.createElement('summary'),
        button = document.createElement('button'),
        children = document.createElement('div');
      details.dataset.collectionId = collection.id;
      details.className = 'collection-tree-item';
      if (!this.known.has(collection.id)) {
        this.known.add(collection.id);
        this.expanded.add(collection.id);
      }
      details.open = this.expanded.has(collection.id);
      details.ontoggle = () => {
        if (!details.isConnected) return;
        if (details.open) this.expanded.add(collection.id);
        else this.expanded.delete(collection.id);
      };
      const members = design.objects.filter((object) =>
        hierarchy.contains(collection.id, object.collectionId),
      ).length;
      button.textContent = collection.name + ' · ' + members;
      button.dataset.collectionBrowse = collection.id;
      button.setAttribute('aria-current', String(selectedId === collection.id));
      button.title =
        hierarchy.path(collection.id) +
        (hierarchy.flag(collection.id, 'hidden') ? ' · 已隐藏' : '') +
        (hierarchy.flag(collection.id, 'locked') ? ' · 已锁定' : '');
      button.onclick = (event) => {
        event.preventDefault();
        this.onSelect(collection.id);
      };
      title.append(button);
      details.append(title, children);
      (containers.get(collection.parentId) || fragment).append(details);
      containers.set(collection.id, children);
    }
    this.host.replaceChildren(fragment);
    this.host.hidden = !hierarchy.collections.length;
  }
}
