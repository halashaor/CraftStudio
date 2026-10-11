import { diagnoseGeneration } from './generation-diagnostics.js';
import { offsetSourceStatuses } from './guide-provenance.js';
import { generationSourceRefs, resolveGenerationSource } from './generation-source.js';
export function generationLinks(design) {
  const guides = new Map((design?.guides || []).map((g) => [g.id, g])),
    offsets = offsetSourceStatuses(guides),
    objects = (design?.objects || [])
      .filter((o) => o.generation || generationSourceRefs(o).length)
      .map((o) => ({
        id: o.id,
        name: o.name,
        detached: !!o.generation?.detached,
        outdated: !!o.generation?.outdated,
        sources: generationSourceRefs(o).map(({ kind, id }) => {
          const g = resolveGenerationSource(design, { kind, id });
          return {
            kind,
            id,
            name: g?.name || '参照已失效',
            missing: !g,
            editable: kind === 'mesh' ? !!g : !!g?.recipe?.kind && Array.isArray(g.recipe.points),
            revision: g?.revision ?? 0,
            ...(kind === 'guide' && g?.provenance?.kind === 'offset'
              ? { offset: offsets.get(id) }
              : {}),
          };
        }),
      }));
  for (const object of objects) {
    object.issues = object.detached
      ? []
      : [
          ...object.sources
            .filter((source) => source.missing)
            .map((source) => ({
              severity: 'error',
              code: 'MISSING_SOURCE',
              sourceId: source.id,
              sourceKind: source.kind,
              message: '来源参照已失效',
            })),
          ...object.sources
            .filter((source) => source.offset?.outdated)
            .map((source) => ({
              severity: source.offset.errorCode ? 'error' : 'warning',
              code: source.offset.errorCode || 'OFFSET_OUTDATED',
              sourceId: source.id,
              message: '偏移来源「' + source.name + '」：' + (source.offset.reason || '轮廓待重建'),
            })),
          ...(object.outdated
            ? [{ severity: 'warning', code: 'OUTDATED', message: '来源已变化，结果待更新' }]
            : []),
        ];
    object.status = object.issues.some((issue) => issue.severity === 'error')
      ? 'error'
      : object.issues.length
        ? 'warning'
        : object.detached
          ? 'detached'
          : 'ready';
  }
  diagnoseGeneration(design, objects);
  const dependents = new Map([...guides.keys()].map((id) => [id, []]));
  for (const o of objects)
    for (const source of o.sources)
      if (source.kind === 'guide')
        dependents.get(source.id)?.push({ id: o.id, name: o.name, outdated: o.outdated });
  return {
    objects,
    guides: [...guides.values()].map((g) => ({
      id: g.id,
      name: g.name,
      dependents: dependents.get(g.id),
      ...(g.provenance?.kind === 'offset' ? { source: offsets.get(g.id) } : {}),
    })),
    meshes: (design?.meshSources || []).map((source) => ({
      id: source.id,
      name: source.name,
      dependents: objects
        .filter((object) =>
          object.sources.some((ref) => ref.kind === 'mesh' && ref.id === source.id),
        )
        .map((object) => ({ id: object.id, name: object.name, outdated: object.outdated })),
    })),
  };
}
