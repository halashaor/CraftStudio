export function renamePlan(
  objects,
  {
    template = '{name}_{n}',
    start = 1,
    digits = 2,
    find = '',
    replace = '',
    order = 'created',
  } = {},
) {
  if (
    typeof template !== 'string' ||
    typeof find !== 'string' ||
    typeof replace !== 'string' ||
    !Number.isSafeInteger(start) ||
    start < 0 ||
    !Number.isSafeInteger(start + objects.length - 1) ||
    !Number.isInteger(digits) ||
    digits < 1 ||
    digits > 12
  )
    throw Error('请输入有效的名称模板、起始编号和位数');
  const ordered = [...objects];
  if (order === 'name')
    ordered.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'));
  else if (['x', 'y', 'z'].includes(order)) {
    const axis = { x: 0, y: 1, z: 2 }[order];
    ordered.sort((a, b) => a.min[axis] - b.min[axis]);
  } else if (order !== 'created') throw Error('请选择有效的编号顺序');
  return ordered.map((object, index) => {
    const before = String(object.name ?? '对象'),
      base = find ? before.split(find).join(replace) : before;
    const name = template
      .replace(/\{(name|n)\}/g, (_, token) =>
        token === 'name' ? base : String(start + index).padStart(digits, '0'),
      )
      .trim();
    if (!name) throw Error('结果名称不能为空');
    return { id: object.id, before, name };
  });
}
export function renameObjects(site, entries) {
  if (!Array.isArray(entries) || !entries.length) throw Error('重命名需要非空 names 列表');
  const objects = new Map(site.design.objects.map((object) => [object.id, object])),
    planned = new Map(),
    names = [];
  for (const entry of entries) {
    const object = objects.get(entry?.id);
    if (!object || typeof entry.name !== 'string' || !entry.name.trim())
      throw Error('重命名需要现有对象 id 和非空名称');
    if (planned.has(entry.id)) throw Error('同一个对象不能重复提交名称');
    const name = entry.name.trim();
    planned.set(entry.id, name);
    if (name !== object.name) names.push({ id: entry.id, before: object.name, name });
  }
  site.design.objects = site.design.objects.map((object) =>
    planned.has(object.id) ? { ...object, name: planned.get(object.id) } : object,
  );
  return { renamed: names.length, names };
}
