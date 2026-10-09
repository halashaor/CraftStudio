import { stateKey } from './codec.js';
import { cropStructureEntities } from './structure-entities.js';

export function cropBlueprint(site, cells, bounds = null, { includeEntities = false } = {}) {
  const records = Array.from(cells);
  if (!records.length && (!bounds || !includeEntities)) throw Error('没有可导出的方块或变更');
  const min = bounds ? [...bounds.min] : [Infinity, Infinity, Infinity];
  const max = bounds ? [...bounds.max] : [-Infinity, -Infinity, -Infinity];
  if (!bounds)
    for (const block of records) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], block.pos[axis]);
        max[axis] = Math.max(max[axis], block.pos[axis]);
      }
    }
  const palette = [],
    states = new Map();
  let containsAir = false;
  const blocks = records.map((block) => {
    const state = block.state < 0 ? { Name: 'minecraft:air' } : site.palette[block.state];
    containsAir ||= state.Name === 'minecraft:air';
    const key = stateKey(state);
    if (!states.has(key)) {
      states.set(key, palette.length);
      palette.push(structuredClone(state));
    }
    return {
      pos: block.pos.map((value, axis) => value - min[axis]),
      state: states.get(key),
      ...(block.nbt ? { nbt: structuredClone(block.nbt) } : {}),
    };
  });
  const origin = site.origin.map((value, axis) => value + min[axis]);
  const selected = includeEntities
    ? cropStructureEntities(site.base.entities, min, max)
    : { entities: [], unlocated: 0 };
  if (!records.length && !selected.entities.length) throw Error('范围内没有可导出的方块或实体');
  const entityWarnings = selected.unlocated
    ? [
        '源工程有 ' +
          selected.unlocated +
          ' 个实体缺少可识别的局部位置，未加入局部蓝图；完整工程仍保留它们。',
      ]
    : [];
  return {
    project: {
      schema: 1,
      name: site.title,
      dataVersion: site.base.dataVersion,
      size: max.map((value, axis) => value - min[axis] + 1),
      origin,
      palette,
      blocks,
      entities: selected.entities,
      metadata: {},
      warnings: entityWarnings,
    },
    offsetLocal: min,
    offsetWorld: site.originConfirmed ? origin : null,
    containsAir,
    entities: selected.entities.length,
    entitySelection: includeEntities ? 'bounds' : 'none',
    entityWarnings,
  };
}

export function changeBlueprint(site, kind = 'additions') {
  if (!['additions', 'patch'].includes(kind)) throw Error('未知的蓝图变更范围');
  function* changes() {
    for (const block of site.overlay.values()) {
      if (kind === 'patch' || block.state >= 0) yield block;
    }
  }
  return cropBlueprint(site, changes());
}
