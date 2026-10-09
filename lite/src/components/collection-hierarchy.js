// A collection is scene organization, not a transform parent.
export class CollectionHierarchy {
  constructor(collections = []) {
    this.collections = collections;
    this.byId = new Map(collections.map((collection) => [collection.id, collection]));
  }
  ancestors(id) {
    const path = [],
      seen = new Set();
    for (
      let collection = this.byId.get(id);
      collection && !seen.has(collection.id);
      collection = this.byId.get(collection.parentId)
    ) {
      seen.add(collection.id);
      path.push(collection);
    }
    return path.reverse();
  }
  contains(parentId, collectionId) {
    return this.ancestors(collectionId).some((collection) => collection.id === parentId);
  }
  path(id) {
    return this.ancestors(id)
      .map((collection) => collection.name)
      .join(' / ');
  }
  flag(id, flag) {
    return this.ancestors(id).some((collection) => collection[flag]);
  }
  validateParent(id, parentId) {
    if (parentId === null || parentId === undefined) return;
    if (typeof parentId !== 'string' || !this.byId.has(parentId)) throw Error('上级集合已不存在');
    const seen = new Set([id]);
    for (
      let collection = this.byId.get(parentId);
      collection;
      collection = this.byId.get(collection.parentId)
    ) {
      if (seen.has(collection.id)) throw Error('集合不能归入自己或自己的子集合');
      seen.add(collection.id);
    }
  }
  rows() {
    const children = new Map(),
      roots = [];
    for (const collection of this.collections) {
      if (!collection.parentId || !this.byId.has(collection.parentId)) roots.push(collection);
      else {
        if (!children.has(collection.parentId)) children.set(collection.parentId, []);
        children.get(collection.parentId).push(collection);
      }
    }
    const result = [],
      seen = new Set();
    // The second pass keeps malformed imported cycles visible for repair.
    for (const root of [...roots, ...this.collections]) {
      const stack = [{ collection: root, depth: 0 }];
      while (stack.length) {
        const row = stack.pop();
        if (seen.has(row.collection.id)) continue;
        seen.add(row.collection.id);
        result.push(row);
        for (const collection of [...(children.get(row.collection.id) || [])].reverse())
          stack.push({ collection, depth: row.depth + 1 });
      }
    }
    return result;
  }
}
// Hot single-object checks do not allocate a complete hierarchy index.
export function collectionFlag(design, id, flag) {
  const seen = new Set();
  while (id && !seen.has(id)) {
    seen.add(id);
    const collection = design.collections?.find((item) => item.id === id);
    if (!collection) return false;
    if (collection[flag]) return true;
    id = collection.parentId;
  }
  return false;
}
