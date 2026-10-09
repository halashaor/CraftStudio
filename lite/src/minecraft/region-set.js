import { emptyProject, importMCA, mcaCoordinates, stateKey } from './codec.js';

const magic = new TextEncoder().encode('craftstudio-regions/1\n');
export function regionBounds(region) {
  const { min, max } = region || {};
  if (
    !Array.isArray(min) ||
    !Array.isArray(max) ||
    min.length !== 3 ||
    max.length !== 3 ||
    [...min, ...max].some((value) => !Number.isSafeInteger(value)) ||
    min.some((value, axis) => value > max[axis] || max[axis] - value >= 4096)
  )
    throw Error('MCA 区域需要有效整数 min/max XYZ，单轴范围最多 4096 格');
  return { min: [...min], max: [...max] };
}
function requiredRegions({ min, max }) {
  const regions = [];
  for (let z = Math.floor(min[2] / 512); z <= Math.floor(max[2] / 512); z++)
    for (let x = Math.floor(min[0] / 512); x <= Math.floor(max[0] / 512); x++) regions.push([x, z]);
  return regions;
}
function sourceMap(files, region) {
  const sources = new Map();
  for (const file of files) {
    const [x, z] = mcaCoordinates(file.name),
      key = x + ',' + z;
    if (sources.has(key)) throw Error('重复的 MCA 区域：' + file.name + '；请选择同一维度的文件');
    sources.set(key, file);
  }
  const required = requiredRegions(region),
    missing = required.filter(([x, z]) => !sources.has(x + ',' + z));
  if (missing.length)
    throw Error(
      '选区还需要这些 MCA 文件：' + missing.map(([x, z]) => `r.${x}.${z}.mca`).join('、'),
    );
  return required.map(([x, z]) => sources.get(x + ',' + z));
}
function clippedRegion(name, region) {
  const [x, z] = mcaCoordinates(name);
  return {
    min: [Math.max(region.min[0], x * 512), region.min[1], Math.max(region.min[2], z * 512)],
    max: [
      Math.min(region.max[0], x * 512 + 511),
      region.max[1],
      Math.min(region.max[2], z * 512 + 511),
    ],
  };
}
// Read only the header and selected chunk slices; Blob composition avoids full-file JS buffers.
async function selectedChunkFile(file, region) {
  if (file.size < 8192) throw Error(file.name + '：MCA 文件头截断');
  const original = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
  const input = new DataView(original.buffer),
    header = new Uint8Array(8192),
    output = new DataView(header.buffer);
  const bounds = clippedRegion(file.name, region),
    parts = [header];
  let sector = 2;
  for (let z = Math.floor(bounds.min[2] / 16); z <= Math.floor(bounds.max[2] / 16); z++)
    for (let x = Math.floor(bounds.min[0] / 16); x <= Math.floor(bounds.max[0] / 16); x++) {
      const index = (x & 31) + (z & 31) * 32,
        location = input.getUint32(index * 4, false);
      if (!location) continue;
      const start = (location >>> 8) * 4096,
        count = location & 255,
        end = start + count * 4096;
      if (start < 8192 || !count || end > file.size)
        throw Error(file.name + '：区块索引或记录截断');
      output.setUint32(index * 4, (sector << 8) | count, false);
      output.setUint32(4096 + index * 4, input.getUint32(4096 + index * 4, false), false);
      parts.push(file.slice(start, end));
      sector += count;
    }
  return new Blob(parts);
}
export async function prepareRegionFiles(files, requested, name = '存档场地') {
  const region = regionBounds(requested),
    selected = sourceMap(files, region);
  const parts = [],
    entries = [];
  for (const file of selected) {
    const part = await selectedChunkFile(file, region);
    entries.push({ name: file.name, length: part.size });
    parts.push(part);
  }
  const json = new TextEncoder().encode(JSON.stringify({ name, region, files: entries }));
  const prefix = new Uint8Array(magic.length + 4);
  prefix.set(magic);
  new DataView(prefix.buffer).setUint32(magic.length, json.length, false);
  return new File([prefix, json, ...parts], 'selected-area.craftregions', {
    type: 'application/octet-stream',
  });
}
export function importRegionFiles(files, requested, name = '存档场地') {
  const region = regionBounds(requested),
    selected = sourceMap(files, region),
    project = emptyProject(name);
  project.origin = [...region.min];
  project.size = region.max.map((value, axis) => value - region.min[axis] + 1);
  project.metadata.originConfirmed = true;
  project.metadata.sourceFormat = 'mca';
  project.metadata.regionFiles = selected.map((file) => file.name);
  project.metadata.missingChunks = 0;
  const lookup = new Map(),
    versions = new Set(),
    clippedSurface = new Set();
  for (const file of selected) {
    const bounds = clippedRegion(file.name, region),
      part = importMCA(file.bytes, file.name, bounds.min, bounds.max);
    for (const version of part.metadata.dataVersions || [part.dataVersion]) versions.add(version);
    project.metadata.missingChunks += part.metadata.missingChunks || 0;
    for (const key of part.metadata.clippedSurfaceColumns || []) {
      const x = (key % 4096) + part.origin[0] - region.min[0],
        z = Math.floor(key / 4096) + part.origin[2] - region.min[2];
      clippedSurface.add(x + 4096 * z);
    }
    const palette = part.palette.map((state) => {
      const key = stateKey(state);
      if (!lookup.has(key)) {
        lookup.set(key, project.palette.length);
        project.palette.push(state);
      }
      return lookup.get(key);
    });
    for (const block of part.blocks)
      project.blocks.push({
        ...block,
        pos: block.pos.map((value, axis) => value + part.origin[axis] - region.min[axis]),
        state: palette[block.state],
      });
  }
  project.metadata.dataVersions = [...versions].sort((a, b) => a - b);
  project.metadata.clippedSurfaceColumns = [...clippedSurface];
  project.dataVersion = versions.size === 1 ? project.metadata.dataVersions[0] : 0;
  project.warnings.push(
    'MCA 场地选区：按世界坐标合并 ' +
      selected.length +
      ' 个区域文件；保留方块和方块实体，不导入实体、光照、生物群系或计划刻。',
  );
  if (project.metadata.missingChunks)
    project.warnings.push(project.metadata.missingChunks + ' 个区块缺失或尚未生成；未补造地形。');
  if (clippedSurface.size)
    project.warnings.push(
      clippedSurface.size +
        ' 列上方仍有方块；地表上下文不完整，请提高世界终点 Y 后用于自动贴地设计。',
    );
  if (versions.size > 1)
    project.warnings.push(
      '选区包含不同 DataVersion，整体版本记为未知；保留原状态与 NBT，不执行游戏 DataFixer 升级。',
    );
  return project;
}
export function importRegionInput(bytes) {
  if (bytes.length < magic.length + 4 || magic.some((value, index) => bytes[index] !== value))
    throw Error('无效 MCA 选区输入');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    length = view.getUint32(magic.length, false),
    start = magic.length + 4;
  if (start + length > bytes.length) throw Error('MCA 选区文件头截断');
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(start, start + length)));
  if (!Array.isArray(header.files) || !header.files.length) throw Error('MCA 选区没有区域文件');
  let offset = start + length;
  const files = header.files.map((file) => {
    if (
      !Number.isSafeInteger(file.length) ||
      file.length < 8192 ||
      offset + file.length > bytes.length
    )
      throw Error('MCA 选区区域记录截断');
    const value = { name: file.name, bytes: bytes.subarray(offset, offset + file.length) };
    offset += file.length;
    return value;
  });
  if (offset !== bytes.length) throw Error('MCA 选区存在多余数据');
  return importRegionFiles(files, header.region, header.name);
}
