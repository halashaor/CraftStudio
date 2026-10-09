import { zipSync, strToU8 } from 'fflate';
import { readNBT, plain } from '../minecraft/codec.js';
import { commandBlock } from '../minecraft/snbt.js';

export const datapackTargets = Object.freeze({
  '1.20.1': { packFormat: 15, directory: 'functions', label: 'Java 1.20–1.20.1' },
  '1.21.1': { packFormat: 48, directory: 'function', label: 'Java 1.21–1.21.1' },
});
const stageSize = 8192;
export function datapackArchive({
  blueprint,
  title,
  kind,
  target = '1.21.1',
  placement = 'relative',
  namespace = 'craftstudio_' + crypto.randomUUID().replaceAll('-', '').slice(0, 12),
}) {
  const profile = datapackTargets[target];
  if (!profile) throw Error('请选择支持的数据包目标版本');
  if (!['relative', 'world'].includes(placement)) throw Error('请选择自选位置或原存档坐标');
  if (placement === 'world' && !blueprint.offsetWorld)
    throw Error('世界原点未确认，请选择自选位置，或先确认工程原点');
  if (!/^[a-z0-9_.-]+$/.test(namespace)) throw Error('数据包命名空间无效');
  const root = readNBT(blueprint.bytes).v,
    palette = root.palette.v[1].map((value) => plain({ t: 10, v: value }));
  const records = root.blocks.v[1].filter(
    (block) => palette[block.state.v].Name !== 'minecraft:structure_void',
  );
  records.sort((a, b) => {
    const p = plain(a.pos),
      q = plain(b.pos);
    return p[1] - q[1] || p[2] - q[2] || p[0] - q[0];
  });
  if (!records.length) throw Error('所选交付范围没有方块或明确拆除记录');
  const files = {
      'pack.mcmeta': strToU8(
        JSON.stringify(
          { pack: { pack_format: profile.packFormat, description: 'CraftStudio: ' + title } },
          null,
          2,
        ),
      ),
    },
    stages = [];
  let removals = 0,
    blockEntities = 0;
  let commands = [],
    stageRecords = 0;
  const flush = () => {
    if (!commands.length) return;
    const id = 'part_' + String(stages.length + 1).padStart(4, '0');
    files[`data/${namespace}/${profile.directory}/${id}.mcfunction`] = strToU8(
      commands.join('\n') + '\n',
    );
    stages.push({ id: namespace + ':' + id, records: stageRecords, commands: commands.length });
    commands = [];
    stageRecords = 0;
  };
  for (const block of records) {
    const state = palette[block.state.v],
      pos = plain(block.pos);
    if (['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air'].includes(state.Name))
      removals++;
    const coordinates = pos
      .map((value, axis) =>
        placement === 'world' ? String(value + blueprint.offsetWorld[axis]) : '~' + value,
      )
      .join(' ');
    const placementCommand =
      'setblock ' + coordinates + ' ' + commandBlock(state, block.nbt) + ' replace';
    // Initialize block entities even when the target already has the same block state.
    const recordCommands = block.nbt
      ? ['setblock ' + coordinates + ' minecraft:air replace', placementCommand]
      : [placementCommand];
    if (commands.length + recordCommands.length > stageSize) flush();
    commands.push(...recordCommands);
    stageRecords++;
    if (block.nbt) blockEntities++;
  }
  flush();
  const entityCount = root.entities?.v[1].length || 0;
  const manifest = {
    schema: 'craftstudio-datapack/1',
    title,
    kind,
    target,
    packFormat: profile.packFormat,
    namespace,
    placement,
    localOffset: blueprint.offsetLocal,
    worldOffset: blueprint.offsetWorld,
    size: plain(root.size),
    records: records.length,
    removals,
    blockEntities,
    commands: stages.reduce((count, stage) => count + stage.commands, 0),
    omittedEntities: entityCount,
    sourceDataVersion: root.DataVersion?.v || 0,
    stages,
  };
  files['craftstudio-manifest.json'] = strToU8(JSON.stringify(manifest, null, 2));
  const known = blueprint.offsetWorld;
  const run = (stage) =>
    placement === 'world'
      ? '/function ' + stage.id
      : '/execute positioned ' +
        (known ? known.join(' ') : '<X> <Y> <Z>') +
        ' run function ' +
        stage.id;
  files['README.txt'] = strToU8(
    [
      title,
      profile.label,
      '',
      '将这个 ZIP 原样放到目标世界 datapacks 文件夹，进入世界执行 /reload。需要游戏中的命令权限。',
      'Put this ZIP in the target world datapacks folder, then run /reload. Command permission is required.',
      placement === 'world'
        ? '本包按原存档绝对坐标施工。'
        : '本包使用相对坐标。下方 X Y Z 是蓝图最小角的放置点，所有分段必须使用同一放置点和维度。',
      placement === 'world'
        ? 'This pack places blocks at their original absolute world coordinates.'
        : 'Relative placement: X Y Z is the blueprint minimum corner; use the same anchor and dimension for every stage.',
      '依次执行以下分段；每段最多 ' + stageSize + ' 条放置命令，不更改游戏规则，不自动运行。',
      'Run the stages below in order. Each contains at most ' +
        stageSize +
        ' setblock commands; no gamerules or automatic load/tick execution.',
      ...stages.map(run),
      '',
      '只操作列出的方块；跳过结构空位，明确空气记录执行拆除。方块实体 NBT 保留，场景实体不生成。',
      '方块实体先清空该格再还原，覆盖容器现有内容。 / Block-entity cells are cleared before restoring their saved data, replacing existing contents.',
      'Only listed cells are changed. Structure voids are skipped; explicit air erases. Block-entity NBT is included; scene entities are not spawned.',
      '游戏会执行正常邻居更新和重力；门、植物、沙子、红石等可能依赖场地状态。所有目标区块须已加载；逐段检查游戏反馈。',
      'Normal neighbor updates and gravity apply. Doors, plants, sand and redstone can depend on site state. Target chunks must be loaded; check game feedback after each stage.',
      '目标游戏必须具有相应方块与 Mod。目标版本只决定数据包目录与元数据，不升级方块实体格式。',
      'The target game must provide the blocks/mods. The target profile selects directory/metadata only; block-entity data is not upgraded.',
      '施工范围、坐标和数量见 craftstudio-manifest.json。尚未通过本项目真实游戏施工验收。',
      'See craftstudio-manifest.json for scope/coordinates/counts. Live game construction is not verified by this exporter.',
    ].join('\n'),
  );
  return { bytes: zipSync(files, { level: 0 }), manifest };
}
