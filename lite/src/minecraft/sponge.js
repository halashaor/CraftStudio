import { tag, writeNBT, stateKey } from './codec.js';
export function exportSponge(p) {
  const [w, h, l] = p.size;
  if (w * h * l > 32000000) throw Error('Sponge 需要包含空气的完整体积，请先裁切过大的区域');
  const palette = [
      { Name: 'minecraft:air' },
      ...p.palette.filter((s) => s.Name !== 'minecraft:air'),
    ],
    ids = new Map(palette.map((s, i) => [stateKey(s), i])),
    cells = new Map(p.blocks.map((b) => [b.pos[0] + w * (b.pos[2] + l * b.pos[1]), b])),
    bytes = [],
    entities = [];
  for (let i = 0; i < w * h * l; i++) {
    const b = cells.get(i);
    let id = b ? ids.get(stateKey(p.palette[b.state])) : 0;
    do {
      const part = id & 127;
      id >>>= 7;
      bytes.push(part | (id ? 128 : 0));
    } while (id);
    if (b?.nbt) {
      const raw = structuredClone(b.nbt);
      entities.push({
        Pos: tag(11, b.pos),
        Id: tag(8, raw.v.id?.v || p.palette[b.state].Name),
        Data: raw,
      });
    }
  }
  if (p.entities?.length) throw Error('Sponge 导出尚不转换区域实体，请用完整 NBT 或只导出新增建筑');
  return writeNBT(
    tag(10, {
      Schematic: tag(10, {
        Version: tag(3, 3),
        DataVersion: tag(3, p.dataVersion || 3955),
        Width: tag(2, w),
        Height: tag(2, h),
        Length: tag(2, l),
        Offset: tag(11, p.origin || [0, 0, 0]),
        Blocks: tag(10, {
          Palette: tag(
            10,
            Object.fromEntries(
              palette.map((s, i) => [stateKey(s).replace(/\[\]$/, ''), tag(3, i)]),
            ),
          ),
          Data: tag(7, bytes),
          BlockEntities: tag(9, [10, entities]),
        }),
      }),
    }),
  );
}
