import { stateKey } from '../minecraft/codec.js';

// Edits are deltas within one selected block type; unrelated state and NBT remain intact.
export function blockStateEditPlan(site, positions, config, descriptors) {
  const patch = config.properties || {};
  if (
    typeof patch !== 'object' ||
    Array.isArray(patch) ||
    Object.entries(patch).some(([key, value]) => !key || typeof value !== 'string' || !value)
  )
    throw Error('方块属性需要名称和值');
  const groups = new Map();
  for (const pos of positions) {
    const cell = site.at(pos);
    if (!cell) continue;
    const state = site.palette[cell.state];
    if (!groups.has(state.Name))
      groups.set(state.Name, { Name: state.Name, cells: [], values: new Map() });
    const group = groups.get(state.Name);
    group.cells.push(cell);
    for (const [key, value] of Object.entries(state.Properties || {})) {
      if (!group.values.has(key)) group.values.set(key, new Map());
      const counts = group.values.get(key);
      counts.set(String(value), (counts.get(String(value)) || 0) + 1);
    }
  }
  if (!groups.size) throw Error('选择中没有方块');
  const sources = [...groups.values()]
    .map((group) => {
      const choices = descriptors.get(group.Name)?.choices || {};
      return {
        Name: group.Name,
        count: group.cells.length,
        properties: [...new Set([...Object.keys(choices), ...group.values.keys()])]
          .sort()
          .map((key) => {
            const counts = group.values.get(key) || new Map(),
              values = [...counts.keys()].sort(),
              missing = group.cells.length - [...counts.values()].reduce((a, b) => a + b, 0);
            return {
              key,
              values,
              missing,
              mixed: values.length > 1 || (values.length > 0 && missing > 0),
              choices: [...new Set([...(choices[key] || []), ...values])].map(String),
            };
          }),
      };
    })
    .sort((a, b) => b.count - a.count || a.Name.localeCompare(b.Name));
  const sourceName =
      config.sourceName || sources.find((v) => v.properties.length)?.Name || sources[0].Name,
    group = groups.get(sourceName),
    operations = [];
  if (Object.keys(patch).length && !config.sourceName) throw Error('请先选择要修改的方块类型');
  const chosenCells = group?.cells || [];
  let reusableState = null,
    reusableKey = null,
    uniform = true,
    nbtPreserved = 0;
  const updated = new Map(),
    hasPatch = Object.keys(patch).length > 0;
  for (const cell of chosenCells) {
    if (!updated.has(cell.state)) {
      const before = site.palette[cell.state];
      const after = hasPatch
        ? { ...structuredClone(before), Properties: { ...before.Properties, ...patch } }
        : before;
      updated.set(cell.state, { after, key: stateKey(after), previousKey: stateKey(before) });
    }
    const { after, key, previousKey } = updated.get(cell.state);
    if (reusableKey === null) {
      reusableKey = key;
      reusableState = after;
    } else if (key !== reusableKey) uniform = false;
    if (key === previousKey) continue;
    if (cell.nbt) nbtPreserved++;
    operations.push({
      type: 'set',
      pos: [...cell.pos],
      state: after,
      ...(cell.nbt ? { nbt: structuredClone(cell.nbt) } : {}),
      reason: '修改方块属性',
    });
    if (operations.length > 1000000) throw Error('本次修改过大，请分批选择');
  }
  const selected = sources.reduce((sum, v) => sum + v.count, 0);
  return {
    operations,
    guide: [],
    warnings: [],
    usedRoles: {},
    blocked: group
      ? null
      : { code: 'STATE_SOURCE_MISSING', message: '这类方块已不在当前选区，请重新选择类型' },
    stateChange: {
      sources,
      sourceName,
      selected,
      matched: chosenCells.length,
      changed: operations.length,
      unchanged: chosenCells.length - operations.length,
      excluded: selected - chosenCells.length,
      nbtPreserved,
      reusableState: uniform ? structuredClone(reusableState) : null,
    },
  };
}
