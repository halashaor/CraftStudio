import { normalizePrefab } from './prefab-format.js';
import { listedPrefabs, prefabTags } from './prefab-catalogue.js';
import { selection, pastePrefab } from '../modeling/studio.js';

function page(list, { offset, cursor, limit = 1000 }, maximum) {
  offset = offset ?? (cursor === undefined ? 0 : Number(cursor));
  if (
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > maximum
  )
    throw Error('构件分页需要有效的 offset/limit');
  return {
    items: list.slice(offset, offset + limit),
    nextCursor: offset + limit < list.length ? String(offset + limit) : null,
  };
}
function find(site, id) {
  const prefab = (site.design.prefabs || []).find((prefab) => prefab.id === id);
  if (!prefab) throw Error('构件已不存在');
  return prefab;
}
const description = (prefab) => ({
  id: prefab.id,
  name: prefab.name,
  size: [...prefab.size],
  blockCount: prefab.blocks.length,
  tags: prefabTags(prefab),
  hasBlockEntities: prefab.blocks.some((block) => !!block.nbt),
});
export function readPrefabs(site, method, params) {
  if (method === 'prefabs.list') {
    const entries = listedPrefabs(site.design.prefabs || [], params),
      result = page(entries, params, 20000);
    return { ...result, items: result.items.map(description), total: entries.length };
  }
  const prefab = normalizePrefab(find(site, params.id)),
    result = page(prefab.blocks, params, 20000);
  return {
    prefab: structuredClone({ ...prefab, blocks: result.items }),
    totalBlocks: prefab.blocks.length,
    nextCursor: result.nextCursor,
  };
}
function metadata(input, current = {}) {
  const name = input.name === undefined ? current.name || '新构件' : input.name,
    tags = input.tags === undefined ? prefabTags(current) : input.tags;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    !Array.isArray(tags) ||
    tags.some((tag) => typeof tag !== 'string')
  )
    throw Error('请输入构件名称和文字分类');
  return { name: name.trim(), tags: [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))] };
}
export function mutatePrefab(site, method, params, policy = {}) {
  const list = site.design.prefabs || [];
  if (method === 'prefabs.remove') {
    find(site, params.id);
    site.design.prefabs = site.design.prefabs.filter((prefab) => prefab.id !== params.id);
    return { id: params.id, removed: true };
  }
  if (method === 'prefabs.place') {
    if (
      !Array.isArray(params.at) ||
      params.at.length !== 3 ||
      params.at.some((value) => !Number.isSafeInteger(value))
    )
      throw Error('放置需要整数 XYZ 坐标 at');
    const prefab = find(site, params.id),
      blocks = pastePrefab(site, prefab, params.at, params, policy),
      object = site.design.objects.at(-1);
    return {
      id: prefab.id,
      objectId: object.id,
      blocks,
      skipped: prefab.blocks.length * (params.count ?? 1) - blocks,
      protectedSkipped: site.lastSkipped,
      min: object.min,
      max: object.max,
    };
  }
  let prefab;
  if (params.prefab) prefab = normalizePrefab(params.prefab);
  else if (params.selection) {
    const chosen = params.selection;
    prefab = normalizePrefab(
      selection(site, chosen.min, chosen.max, { keys: chosen.members, regions: chosen.regions }),
    );
  } else prefab = find(site, params.id);
  const id = params.id ?? prefab.id ?? crypto.randomUUID();
  if (typeof id !== 'string' || !id) throw Error('构件 id 需要非空文字');
  const existing = list.find((prefab) => prefab.id === id);
  const value = { ...prefab, ...metadata(params.prefab || params, existing || prefab), id };
  site.design.prefabs = list.some((prefab) => prefab.id === id)
    ? list.map((prefab) => (prefab.id === id ? value : prefab))
    : [...list, value];
  return description(value);
}
