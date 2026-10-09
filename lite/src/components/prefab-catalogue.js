export const prefabTags = (prefab) =>
  Array.isArray(prefab.tags) ? prefab.tags.filter((tag) => typeof tag === 'string') : [];
export function listedPrefabs(prefabs, { query = '', category = '', sort = 'recent' } = {}) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = prefabs.filter((prefab) => {
    const tags = prefabTags(prefab);
    const text = [prefab.name, ...tags, prefab.size.join('×'), prefab.size.join('x')]
      .join(' ')
      .toLowerCase();
    return (!category || tags.includes(category)) && terms.every((term) => text.includes(term));
  });
  return sort === 'name'
    ? result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
    : result.reverse();
}
