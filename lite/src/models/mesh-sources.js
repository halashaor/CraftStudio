import { parseMeshOBJ } from './mesh-obj.js';
import { normalizeMeshTransform } from './mesh-transform.js';
import { generationSourceRefs } from '../modeling/generation-source.js';

const parsedSources = new Map();

export function meshDescriptors(design) {
  return (design.meshSources || []).map(({ objText, ...descriptor }) =>
    structuredClone(descriptor),
  );
}

function sourceById(design, id) {
  const source = design.meshSources?.find((source) => source.id === id);
  if (!source) throw Error('模型来源已不存在');
  return source;
}

export function readMesh(design, id) {
  return structuredClone(sourceById(design, id));
}

function rememberParsed(sourceKey, objText, parsed) {
  parsedSources.set(sourceKey, { objText, parsed });
  if (parsedSources.size > 8) parsedSources.delete(parsedSources.keys().next().value);
  return parsed;
}

export function getParsedMesh(design, id) {
  const source = sourceById(design, id),
    cached = parsedSources.get(source.sourceKey);
  if (cached?.objText === source.objText) return cached.parsed;
  return rememberParsed(source.sourceKey, source.objText, parseMeshOBJ(source.objText));
}

function meshDependents(design, id) {
  return design.objects.filter((object) =>
    generationSourceRefs(object).some((source) => source.kind === 'mesh' && source.id === id),
  );
}

export function meshMutation(site, method, params) {
  const list = site.design.meshSources || [];
  if (method === 'meshes.remove') {
    const source = sourceById(site.design, params.id);
    if (meshDependents(site.design, source.id).length)
      throw Error('模型仍有关联生成结果，请先独立化或移除结果');
    site.design.meshSources = list.filter((item) => item.id !== source.id);
    return { id: source.id, removed: true };
  }
  const value = params.source;
  if (!value || typeof value !== 'object') throw Error('需要模型来源 source');
  const id = value.id || crypto.randomUUID();
  if (typeof id !== 'string' || !id || id.length > 128) throw Error('模型来源编号无效');
  const old = list.find((source) => source.id === id),
    name = value.name ?? old?.name,
    objText = value.objText ?? old?.objText;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 128)
    throw Error('模型名称应为 1–128 字');
  if (value.hidden !== undefined && typeof value.hidden !== 'boolean')
    throw Error('模型显示状态无效');
  const transform = normalizeMeshTransform(value.transform, old?.transform),
    geometryChanged = !old || objText !== old.objText,
    parsed = geometryChanged ? parseMeshOBJ(objText) : getParsedMesh(site.design, id),
    source = {
      id,
      name: name.trim(),
      format: 'obj',
      objText,
      revision: geometryChanged ? (old?.revision || 0) + 1 : old.revision,
      sourceKey: geometryChanged ? crypto.randomUUID() : old.sourceKey,
      bounds: structuredClone(parsed.bounds),
      triangleCount: parsed.triangles.length,
      warnings: [...parsed.warnings],
      topology: structuredClone(parsed.topology),
      transform,
      hidden: value.hidden ?? old?.hidden ?? false,
    };
  rememberParsed(source.sourceKey, objText, parsed);
  site.design.meshSources = old
    ? list.map((item) => (item.id === id ? source : item))
    : [...list, source];
  if (geometryChanged && old) {
    const dependents = new Set(meshDependents(site.design, id).map((object) => object.id));
    site.design.objects = site.design.objects.map((object) =>
      dependents.has(object.id)
        ? { ...object, generation: { ...object.generation, outdated: true } }
        : object,
    );
  }
  return meshDescriptors({ meshSources: [source] })[0];
}
