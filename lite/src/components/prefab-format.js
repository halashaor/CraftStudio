import { coordKey } from '../core/coordinates.js';

// Normalize file/API data once per operation before generating any scene writes.
export function normalizePrefab(prefab) {
  if (
    prefab?.schema !== 'craftstudio-prefab/1' ||
    !Array.isArray(prefab.blocks) ||
    !prefab.blocks.length
  )
    throw Error('构件文件需要 craftstudio-prefab/1 和非空 blocks');
  if (prefab.blocks.length > 1000000) throw Error('构件方块数量过大，请拆分构件');
  if (
    !Array.isArray(prefab.size) ||
    prefab.size.length !== 3 ||
    prefab.size.some((value) => !Number.isSafeInteger(value) || value < 1 || value > 4096)
  )
    throw Error('构件 size 需要 1–4096 的整数 XYZ 尺寸');
  const seen = new Set();
  const blocks = prefab.blocks.map((block, index) => {
    if (
      !Array.isArray(block?.pos) ||
      block.pos.length !== 3 ||
      block.pos.some(
        (value, axis) => !Number.isSafeInteger(value) || value < 0 || value >= prefab.size[axis],
      )
    )
      throw Error('构件第 ' + (index + 1) + ' 个方块位置超出 size');
    const key = coordKey(...block.pos);
    if (seen.has(key)) throw Error('构件包含重复方块位置：' + block.pos.join(', '));
    seen.add(key);
    const state =
      Number.isInteger(block.state) && Array.isArray(prefab.palette)
        ? prefab.palette[block.state]
        : block.state;
    if (typeof state?.Name !== 'string' || !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(state.Name))
      throw Error('构件第 ' + (index + 1) + ' 个方块缺少有效状态；需要 Name 或有效 palette 索引');
    if (
      state.Properties !== undefined &&
      (!state.Properties ||
        typeof state.Properties !== 'object' ||
        Array.isArray(state.Properties) ||
        Object.values(state.Properties).some((value) => typeof value !== 'string'))
    )
      throw Error('构件方块 Properties 需要字符串属性值');
    return state === block.state ? block : { ...block, state };
  });
  return { ...prefab, blocks };
}
