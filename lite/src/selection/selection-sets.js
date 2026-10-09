import { selectionPredicate } from './selection-mask.js';
import { objectHidden } from '../components/collections.js';
import { objectLocked } from '../components/object-protection.js';
const find = (site, id) => {
  const set = (site.design.selectionSets || []).find((set) => set.id === id);
  if (!set) throw Error('命名选择已不存在');
  return set;
};
export function listSelectionSets(site) {
  return (site.design.selectionSets || []).map((set) => ({
    id: set.id,
    name: set.name,
    kind: set.kind,
    ...(set.kind === 'objects'
      ? { objectCount: set.objectIds.length }
      : { min: [...set.selection.min], max: [...set.selection.max] }),
  }));
}
export function resolveSelectionSet(site, id) {
  const set = find(site, id);
  if (set.kind === 'region')
    return { id, name: set.name, kind: set.kind, selection: structuredClone(set.selection) };
  const objects = new Map(site.design.objects.map((object) => [object.id, object])),
    objectIds = [],
    hiddenObjectIds = [],
    missingObjectIds = [],
    lockedObjectIds = [];
  for (const id of set.objectIds) {
    const object = objects.get(id);
    if (!object) {
      missingObjectIds.push(id);
      continue;
    }
    if (objectHidden(site.design, object)) {
      hiddenObjectIds.push(id);
      continue;
    }
    objectIds.push(id);
    if (objectLocked(site.design, object)) lockedObjectIds.push(id);
  }
  return {
    id,
    name: set.name,
    kind: set.kind,
    objectIds,
    hiddenObjectIds,
    missingObjectIds,
    lockedObjectIds,
  };
}
export function selectionSetMutation(site, method, params) {
  const list = site.design.selectionSets || [];
  if (method === 'selectionSets.remove') {
    find(site, params.id);
    site.design.selectionSets = list.filter((set) => set.id !== params.id);
    return { id: params.id, removed: true };
  }
  const input = params.selectionSet;
  if (!input || typeof input.name !== 'string' || !input.name.trim())
    throw Error('请填写命名选择的名称');
  if (input.objectIds !== undefined && input.selection)
    throw Error('对象引用与固定区域请选择一种保存方式');
  const id = input.id ?? crypto.randomUUID();
  if (typeof id !== 'string' || !id) throw Error('命名选择需要文字 id');
  let value = { id, name: input.name.trim() };
  if (input.objectIds !== undefined) {
    if (!Array.isArray(input.objectIds) || !input.objectIds.length)
      throw Error('请选择需要保存的对象');
    const known = new Set(site.design.objects.map((object) => object.id));
    if (input.objectIds.some((id) => !known.has(id))) throw Error('选择中的对象已不存在');
    value = { ...value, kind: 'objects', objectIds: [...new Set(input.objectIds)] };
  } else if (input.selection) {
    const selection = structuredClone(input.selection),
      { min, max } = selection;
    if (
      !Array.isArray(min) ||
      !Array.isArray(max) ||
      min.length !== 3 ||
      max.length !== 3 ||
      min.some((n, axis) => !Number.isSafeInteger(n) || n < 0 || n > max[axis]) ||
      max.some((n) => !Number.isSafeInteger(n) || n >= 4096)
    )
      throw Error('固定区域需要有效的局部 min/max XYZ');
    selectionPredicate(selection);
    value = { ...value, kind: 'region', selection };
  } else value = { ...find(site, id), name: value.name };
  site.design.selectionSets = list.some((set) => set.id === id)
    ? list.map((set) => (set.id === id ? value : set))
    : [...list, value];
  return { id, name: value.name, kind: value.kind };
}
