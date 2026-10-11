// Source identities are typed: a mesh and a sketch can legitimately share an ID.
export const generationSourceKey = ({ kind = 'guide', id }) => JSON.stringify([kind, id]);

export function resolveGenerationSource(design, { kind = 'guide', id }) {
  const sources = kind === 'mesh' ? design.meshSources : kind === 'guide' ? design.guides : [];
  return sources?.find((source) => source.id === id);
}

function guideReferences(ids, strict = false) {
  const result = [];
  for (const id of ids.filter((id) => typeof id === 'string' && id)) {
    if (!id.startsWith('loop:')) {
      result.push({ kind: 'guide', id });
      continue;
    }
    let loop;
    try {
      loop = JSON.parse(id.slice(5));
    } catch {
      if (strict) throw Error('闭合线框来源无效');
    }
    if (!Array.isArray(loop) || loop.some((part) => typeof part !== 'string' || !part)) {
      if (strict) throw Error('闭合线框来源无效');
      // Keep the bad reference visible in read-only diagnostics.
      result.push({ kind: 'guide', id });
    } else result.push(...loop.map((id) => ({ kind: 'guide', id })));
  }
  return result;
}

const unique = (references) => [
  ...new Map(references.map((source) => [generationSourceKey(source), source])).values(),
];

export function recipeSourceRefs(type, config, guideId) {
  if (type === 'mesh') {
    if (typeof config.sourceId !== 'string' || !config.sourceId) throw Error('请选择模型来源');
    return [{ kind: 'mesh', id: config.sourceId }];
  }
  return unique(
    guideReferences(
      type === 'geometry'
        ? [guideId]
        : config.operation === 'sweep'
          ? [config.pathId, ...(config.sweepMode === 'profile' ? config.profileIds || [] : [])]
          : config.profileIds || [],
      true,
    ),
  );
}

export function generationSourceRefs(object) {
  if (object.generation?.detached) return [];
  if (object.generation?.sourceRefs)
    return unique(object.generation.sourceRefs.map(({ kind, id }) => ({ kind, id })));
  if (object.generation?.type === 'mesh')
    return [{ kind: 'mesh', id: object.meshSourceId || object.recipe?.sourceId }];
  return unique(
    guideReferences(
      object.generation?.sources || [
        ...(object.recipe?.profileIds || []),
        ...(object.recipe?.pathId ? [object.recipe.pathId] : []),
        ...(object.generation?.type === 'geometry' && object.guideId ? [object.guideId] : []),
      ],
    ),
  );
}

export function generationSourceVersions(design, references) {
  return Object.fromEntries(
    references.map((source) => [
      source.kind === 'mesh' ? 'mesh:' + source.id : source.id,
      resolveGenerationSource(design, source)?.revision || 0,
    ]),
  );
}
