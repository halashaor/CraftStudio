import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { selectionPredicate } from '../selection/selection-mask.js';
import { coordKey } from '../core/coordinates.js';

export function safeStem(title) {
  let stem = Array.from(String(title).replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_'))
    .slice(0, 100)
    .join('')
    .replace(/[. ]+$/, '');
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) stem = '_' + stem;
  return stem || 'CraftStudio';
}
export function csvRows(rows) {
  return (
    '\ufeff' +
    rows
      .map((row) =>
        row.map((value) => '"' + String(value ?? '').replaceAll('"', '""') + '"').join(','),
      )
      .join('\r\n')
  );
}
export function changeCSV(changes, source) {
  const prefix = source.originConfirmed ? 'world_' : 'local_';
  return csvRows([
    [prefix + 'x', prefix + 'y', prefix + 'z', 'action', 'category', 'before', 'after', 'reason'],
    ...changes.map((change) => [
      ...(source.originConfirmed
        ? change.pos.map((value, axis) => value + source.origin[axis])
        : change.pos),
      change.action,
      change.category,
      JSON.stringify(change.before),
      JSON.stringify(change.after),
      change.reason,
    ]),
  ]);
}
export function materialCounts(project) {
  const counts = {};
  for (const block of project.blocks) {
    const name = project.palette[block.state].Name;
    if (name !== 'minecraft:air' && name !== 'minecraft:structure_void')
      counts[name] = (counts[name] || 0) + 1;
  }
  return counts;
}
export function deliveryReport(site, { kind, selection }) {
  if (!['full', 'selection', 'additions', 'patch'].includes(kind)) throw Error('未知的交付范围');
  let changes = site.diff();
  if (kind === 'selection') {
    if (!selection) throw Error('请先选择建筑或区域');
    const matches = selectionPredicate(selection);
    const object =
      !selection.regions &&
      site.design.objects.find(
        (object) =>
          object.min.every((n, a) => n === selection.min[a]) &&
          object.max.every((n, a) => n === selection.max[a]),
      );
    const raw = selection.members || object?.cells;
    const members = raw
      ? new Set(raw.map((value) => (Array.isArray(value) ? coordKey(...value) : value)))
      : null;
    changes = changes.filter(
      (change) => matches(change.pos) && (!members || members.has(coordKey(...change.pos))),
    );
  }
  if (kind === 'additions') changes = changes.filter((change) => change.after);
  const materials = {};
  for (const change of changes)
    if (change.after) materials[change.after.Name] = (materials[change.after.Name] || 0) + 1;
  return {
    source: {
      name: site.base.name,
      dataVersion: site.base.dataVersion,
      sourceHash: site.sourceHash,
      sourceBlocks: site.cells.size,
      originConfirmed: site.originConfirmed,
      worldOrigin: site.originConfirmed ? [...site.origin] : null,
    },
    changedCells: changes.length,
    changesCSV: changeCSV(changes, site),
    materials,
  };
}
export function deliveryArchive({ title, kind, blueprint, report, projectBytes }) {
  const materials = blueprint.materials || report.materials;
  const materialsFile = kind === 'full' ? 'changed-materials.csv' : 'materials.csv';
  const files = {
    'blueprint.nbt': blueprint.bytes,
    'changes.csv': strToU8(report.changesCSV),
    [materialsFile]: strToU8(
      csvRows([
        ['block', 'count'],
        ...Object.keys(materials)
          .sort()
          .map((name) => [name, materials[name]]),
      ]),
    ),
  };
  if (projectBytes) files['project.craftlite'] = projectBytes;
  const placement = {
    localOffset: blueprint.offsetLocal,
    worldOffset: blueprint.offsetWorld,
    containsAir: blueprint.containsAir,
  };
  files['placement.json'] = strToU8(JSON.stringify(placement, null, 2));
  files['manifest.json'] = strToU8(
    JSON.stringify(
      {
        schema: 'craftstudio-delivery/1',
        title,
        kind,
        createdAt: new Date().toISOString(),
        source: report.source,
        placement,
        size: blueprint.size,
        records: blueprint.blocks,
        entities: blueprint.entities ?? null,
        entitySelection: blueprint.entitySelection || (kind === 'full' ? 'all' : 'none'),
        entityWarnings: blueprint.entityWarnings || [],
        changedCells: report.changedCells,
        materialsScope: kind === 'full' ? 'changed placements' : 'exported placements',
        includesEditableProject: !!projectBytes,
        files: [...Object.keys(files), 'manifest.json', 'README.txt'],
      },
      null,
      2,
    ),
  );
  files['README.txt'] = strToU8(
    [
      title,
      'blueprint.nbt 是 Minecraft Java 结构蓝图，可供 Create 等兼容工具读取。',
      '放置参考点见 placement.json。worldOffset 为 null 时，只确定局部偏移，需要在目标存档中自行选择放置点。',
      kind === 'patch'
        ? '本包包含明确拆除空气；是否执行拆除取决于游戏工具的粘贴策略。'
        : '本包按所选范围导出；不要把未列出的孔洞当成拆除指令。',
      'changes.csv 只记录这个范围内的本次变更。',
      '场景实体：' +
        (blueprint.entities ?? (kind === 'full' ? '完整场景保留' : 0)) +
        (blueprint.entitySelection === 'bounds' ? '；按选区外接范围选取，不推断对象归属。' : '。'),
      ...(blueprint.entityWarnings || []),
      kind === 'full'
        ? 'changed-materials.csv 统计本次变更所需的放置材料，不是整个原场地的材料总量。'
        : 'materials.csv 统计此蓝图的放置材料，空气不计入材料。',
      projectBytes
        ? 'project.craftlite 包含完整场地及可编辑设计，在 CraftStudio 中打开以继续设计。'
        : '本包未附带完整可编辑工程。',
      '游戏中仍需使用包含相应方块的版本与 Mod。',
    ].join('\n'),
  );
  return zipSync(files, { level: 0 });
}

export function readDeliveryArchive(bytes) {
  const names = new Set(['manifest.json', 'placement.json', 'blueprint.nbt', 'project.craftlite']);
  const files = unzipSync(bytes, { filter: (file) => names.has(file.name) });
  if (!files['manifest.json']) throw Error('不是 CraftStudio 施工交付包；材质包请从资源库导入');
  const manifest = JSON.parse(strFromU8(files['manifest.json']));
  if (manifest.schema !== 'craftstudio-delivery/1') throw Error('不支持的施工交付包格式');
  if (files['project.craftlite']) return { manifest, projectBytes: files['project.craftlite'] };
  if (!files['blueprint.nbt'] || !files['placement.json']) throw Error('交付包缺少蓝图或坐标说明');
  const placement = JSON.parse(strFromU8(files['placement.json']));
  if (
    placement.worldOffset !== null &&
    (!Array.isArray(placement.worldOffset) ||
      placement.worldOffset.length !== 3 ||
      !placement.worldOffset.every(Number.isSafeInteger))
  )
    throw Error('交付包的世界放置坐标无效');
  return { manifest, placement, blueprintBytes: files['blueprint.nbt'] };
}
