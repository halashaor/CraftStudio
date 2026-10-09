import { CollectionHierarchy, collectionFlag } from './collection-hierarchy.js';
import { coordKey } from '../core/coordinates.js';
export const objectHidden = (design, object) =>
  !!object.hidden || collectionFlag(design, object.collectionId, 'hidden');
export function hiddenObjectContains(design, object, position) {
  if (!objectHidden(design, object)) return false;
  if (object.cells?.length) {
    const key = coordKey(...position),
      text = position.join(',');
    return object.cells.some((cell) =>
      typeof cell === 'number'
        ? cell === key
        : Array.isArray(cell)
          ? cell.every((n, a) => n === position[a])
          : cell === text,
    );
  }
  return position.every((n, a) => n >= object.min[a] && n <= object.max[a]);
}
export function listedCollections(site) {
  const hierarchy = new CollectionHierarchy(site.design.collections);
  return hierarchy.collections.map((c) => ({
    ...c,
    objectIds: site.design.objects.filter((o) => o.collectionId === c.id).map((o) => o.id),
    descendantObjectIds: site.design.objects
      .filter((o) => hierarchy.contains(c.id, o.collectionId))
      .map((o) => o.id),
    effectiveHidden: hierarchy.flag(c.id, 'hidden'),
    effectiveLocked: hierarchy.flag(c.id, 'locked'),
    path: hierarchy.path(c.id),
  }));
}
export function collectionMutation(site, method, p) {
  const list = site.design.collections || (site.design.collections = []);
  if (method === 'collections.remove') {
    const index = list.findIndex((c) => c.id === p.id);
    if (index < 0) throw Error('集合已不存在');
    const parentId = list[index].parentId;
    list.splice(index, 1);
    for (const collection of list)
      if (collection.parentId === p.id) {
        if (parentId) collection.parentId = parentId;
        else delete collection.parentId;
      }
    for (const object of site.design.objects)
      if (object.collectionId === p.id) {
        if (parentId) object.collectionId = parentId;
        else delete object.collectionId;
      }
    return { id: p.id, removed: true };
  }
  const value = p.collection;
  if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 128)
    throw Error('请为集合填写 1–128 字名称');
  if (value.hidden !== undefined && typeof value.hidden !== 'boolean')
    throw Error('集合显示状态无效');
  if (value.locked !== undefined && typeof value.locked !== 'boolean')
    throw Error('集合锁定状态无效');
  const id = value.id || crypto.randomUUID();
  if (typeof id !== 'string' || !id || id.length > 128) throw Error('集合编号无效');
  for (const ids of [p.objectIds, p.removeObjectIds])
    if (
      ids !== undefined &&
      (!Array.isArray(ids) || ids.some((id) => !site.design.objects.some((o) => o.id === id)))
    )
      throw Error('集合中的对象已变化');
  if (p.objectIds?.some((id) => p.removeObjectIds?.includes(id)))
    throw Error('同一对象不能同时归入和移出集合');
  const index = list.findIndex((c) => c.id === id),
    old = index < 0 ? {} : list[index],
    record = { ...old, id, name: value.name.trim(), hidden: value.hidden ?? old.hidden ?? false };
  if (value.locked !== undefined || old.locked !== undefined)
    record.locked = value.locked ?? old.locked;
  const parentId = value.parentId === undefined ? old.parentId : value.parentId;
  new CollectionHierarchy(list).validateParent(id, parentId);
  if (parentId) record.parentId = parentId;
  else delete record.parentId;
  if (index < 0) list.push(record);
  else list[index] = record;
  if (p.objectIds)
    for (const objectId of p.objectIds)
      site.design.objects.find((o) => o.id === objectId).collectionId = id;
  if (p.removeObjectIds)
    for (const object of site.design.objects)
      if (object.collectionId === id && p.removeObjectIds.includes(object.id))
        delete object.collectionId;
  return {
    ...record,
    objectIds: site.design.objects.filter((o) => o.collectionId === id).map((o) => o.id),
  };
}
