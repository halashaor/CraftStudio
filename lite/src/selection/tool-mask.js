import { selectionPredicate } from './selection-mask.js';
import { coordKey } from '../core/site.js';
const neighbors = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
export function toolMask(site, mask = {}) {
  const selected = mask.selection ? selectionPredicate(mask.selection) : null;
  if (mask.selection?.members && !Array.isArray(mask.selection.members))
    throw Error('选区成员需要坐标数组');
  if (
    mask.selection?.members?.some((p) =>
      Array.isArray(p)
        ? p.length !== 3 || p.some((n) => !Number.isInteger(n) || n < 0 || n >= 4096)
        : !Number.isInteger(p) || p < 0 || p >= 4096 ** 3,
    )
  )
    throw Error('选区成员坐标无效');
  const members = mask.selection?.members
    ? new Set(mask.selection.members.map((p) => (Array.isArray(p) ? coordKey(...p) : p)))
    : null;
  if (
    mask.selection &&
    !members &&
    (!mask.selection.min ||
      !mask.selection.max ||
      mask.selection.min.length !== 3 ||
      mask.selection.max.length !== 3 ||
      mask.selection.min.some(
        (n, a) =>
          !Number.isInteger(n) ||
          !Number.isInteger(mask.selection.max[a]) ||
          n < 0 ||
          mask.selection.max[a] >= 4096 ||
          n > mask.selection.max[a],
      ))
  )
    throw Error('蒙版选区不完整');
  if (
    (mask.minY !== undefined &&
      (!Number.isInteger(mask.minY) || mask.minY < 0 || mask.minY > 4095)) ||
    (mask.maxY !== undefined &&
      (!Number.isInteger(mask.maxY) || mask.maxY < 0 || mask.maxY > 4095)) ||
    (mask.minY !== undefined && mask.maxY !== undefined && mask.minY > mask.maxY)
  )
    throw Error('高度蒙版需要有效的局部整数范围');
  return (pos) => {
    const cell = site.at(pos),
      state = cell ? site.palette[cell.state] : null;
    if (selected && !selected(pos)) return false;
    if (
      mask.limitBounds &&
      pos.some((n, a) => n < mask.limitBounds.min[a] || n > mask.limitBounds.max[a])
    )
      return false;
    if (
      (mask.minY !== undefined && pos[1] < mask.minY) ||
      (mask.maxY !== undefined && pos[1] > mask.maxY)
    )
      return false;
    if (mask.matchName && state?.Name !== mask.matchName) return false;
    if (mask.emptyOnly && cell) return false;
    if (
      mask.surface &&
      (!cell ||
        !neighbors.some((d) => {
          const q = pos.map((n, a) => n + d[a]);
          if (q.some((n) => n < 0 || n >= 4096)) return true;
          const b = site.at(q);
          return !b || /:(water|lava)$/.test(site.palette[b.state].Name);
        }))
    )
      return false;
    return true;
  };
}
const shapeSuffix = (name) =>
  name.match(/_(fence_gate|trapdoor|door|stairs|slab|fence|wall|pane|carpet)$/)?.[0] || '';
export function paintedState(
  before,
  material,
  descriptors,
  { retainShape = true, preserveProperties = true } = {},
) {
  let Name = material.Name;
  const suffix = shapeSuffix(before.Name);
  if (retainShape && !suffix && shapeSuffix(Name)) {
    const stem = Name.replace(
      /_(fence_gate|trapdoor|door|stairs|slab|fence|wall|pane|carpet)$/,
      '',
    );
    Name = [stem + 's', stem, stem + '_planks', stem + '_block'].find((n) => descriptors.has(n));
    if (!Name) return null;
  }
  if (retainShape && suffix && shapeSuffix(Name) !== suffix) {
    const stem = Name.replace(/_(fence_gate|trapdoor|door|stairs|slab|fence|wall|pane|carpet)$/, '')
        .replace(/_planks$|_block$/, '')
        .replace(/bricks$/, 'brick'),
      candidate = stem + suffix;
    if (!descriptors.has(candidate)) return null;
    Name = candidate;
  }
  const choices = descriptors.get(Name)?.choices || {},
    Properties = {};
  for (const [k, v] of Object.entries(material.Properties || {}))
    if (!Object.keys(choices).length || choices[k]?.includes(v)) Properties[k] = v;
  if (preserveProperties)
    for (const [k, v] of Object.entries(before.Properties || {}))
      if (
        Name === before.Name ||
        choices[k]?.includes(v) ||
        (suffix &&
          suffix === shapeSuffix(Name) &&
          !choices[k] &&
          [
            'facing',
            'half',
            'shape',
            'type',
            'waterlogged',
            'north',
            'east',
            'south',
            'west',
            'up',
            'hinge',
            'open',
            'powered',
          ].includes(k))
      )
        Properties[k] = v;
  return { Name, ...(Object.keys(Properties).length ? { Properties } : {}) };
}
export function brushPlan(
  site,
  { points, mode = 'draw', state, mask = {}, retainShape = true, preserveProperties = true },
  descriptors = new Map(),
) {
  if (
    !['draw', 'paint', 'erase', 'place'].includes(mode) ||
    !Array.isArray(points) ||
    points.some((p) => p?.length !== 3 || p.some((n) => !Number.isInteger(n) || n < 0 || n >= 4096))
  )
    throw Error('无效工具操作');
  if (mode !== 'erase' && (!state?.Name || !state.Name.includes(':')))
    throw Error('请选择有效的目标材质');
  const matches = toolMask(site, mask),
    operations = [],
    warnings = new Set();
  let filtered = 0;
  for (const pos of new Map(points.map((p) => [coordKey(...p), p])).values()) {
    if (pos?.length !== 3 || pos.some((n) => !Number.isInteger(n) || n < 0 || n >= 4096))
      throw Error('方块坐标需为 0–4095 的整数');
    const before = site.at(pos);
    if (
      !matches(pos) ||
      (mode === 'paint' && (!before || /:(water|lava)$/.test(site.palette[before.state].Name)))
    ) {
      filtered++;
      continue;
    }
    let target = mode === 'erase' ? null : state;
    if (mode === 'paint') {
      target = paintedState(site.palette[before.state], state, descriptors, {
        retainShape,
        preserveProperties,
      });
      if (!target) {
        filtered++;
        warnings.add('部分材质没有对应形态，原方块已保留');
        continue;
      }
      if (before.nbt && target.Name !== site.palette[before.state].Name) {
        filtered++;
        warnings.add('含方块实体数据的位置已保留；请使用明确替换操作');
        continue;
      }
    }
    operations.push({
      type: 'set',
      pos: [...pos],
      state: target,
      reason:
        mode === 'paint'
          ? '表面涂改'
          : mode === 'erase'
            ? '连续擦除'
            : mode === 'place'
              ? '单点放置'
              : '连续绘制',
      ...(mode === 'paint' && before.nbt ? { nbt: before.nbt } : {}),
    });
  }
  return { operations, filtered, warnings: [...warnings] };
}
