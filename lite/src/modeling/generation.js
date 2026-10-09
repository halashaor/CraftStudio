import { objectLocked } from '../components/object-protection.js';
import { affectedGeneration, orderedGeneration } from './generation-order.js';
import { coordKey, coords } from '../core/site.js';
import { stateKey } from '../minecraft/codec.js';
import { geometryPlan } from './construction.js';
import { featurePlan } from './features.js';
const clone = (v) => structuredClone(v);
export function cellSnapshot(site, pos) {
  const b = site.at(pos);
  return b ? { state: clone(site.palette[b.state]), nbt: clone(b.nbt || null) } : null;
}
const equal = (a, b) =>
  (!a && !b) ||
  (!!a &&
    !!b &&
    stateKey(a.state) === stateKey(b.state) &&
    JSON.stringify(a.nbt || null) === JSON.stringify(b.nbt || null));
const operation = (pos, value) => ({
  type: 'set',
  pos: [...pos],
  state: value?.state || null,
  nbt: value?.nbt || null,
  reason: '关联生成更新',
});
export function captureGeneration(site, operations) {
  return [...new Map(operations.map((o) => [coordKey(...o.pos), o.pos])).values()].map((pos) => ({
    pos: [...pos],
    before: cellSnapshot(site, pos),
  }));
}
function sourceIds(type, config, guideId) {
  const ids =
      type === 'geometry'
        ? [guideId]
        : (config.operation === 'sweep'
            ? [config.pathId, ...(config.sweepMode === 'profile' ? config.profileIds || [] : [])]
            : config.profileIds || []
          ).filter(Boolean),
    out = [];
  for (const id of ids) {
    if (id.startsWith('loop:')) {
      try {
        out.push(...JSON.parse(id.slice(5)));
      } catch {
        throw Error('闭合线框来源无效');
      }
    } else out.push(id);
  }
  return [...new Set(out)];
}
function bounds(records) {
  const p = records.map((r) => r.pos);
  return {
    min: [0, 1, 2].map((a) => p.reduce((v, q) => Math.min(v, q[a]), Infinity)),
    max: [0, 1, 2].map((a) => p.reduce((v, q) => Math.max(v, q[a]), -Infinity)),
    cells: p.map((q) => coordKey(...q)),
  };
}
export function generatedObject(
  site,
  captured,
  { type, config, guideId, id = crypto.randomUUID(), name = '生成特征' },
) {
  if (!captured.length) return null;
  const records = captured.map((r) => ({ ...r, after: cellSnapshot(site, r.pos) })),
    sources = sourceIds(type, config, guideId);
  return {
    id,
    name,
    kind: type === 'geometry' ? 'geometry' : 'feature',
    guideId,
    recipe: clone(config),
    ...bounds(records),
    generation: {
      schema: 1,
      type,
      records,
      sources,
      sourceVersions: Object.fromEntries(
        sources.map((id) => [id, site.design.guides.find((g) => g.id === id)?.revision || 0]),
      ),
    },
  };
}
export function detachedGeneration(object) {
  if (!object.generation?.records) return !!object.generation?.detached;
  const keys = new Set(object.cells || []);
  return (
    object.generation?.detached ||
    object.generation?.records?.some((r) => !keys.has(coordKey(...r.pos))) ||
    keys.size !== (object.generation?.records?.length || 0)
  );
}
export function regenerateObjects(
  site,
  objects,
  { manualStrategy = 'preserve', overrides = {}, available = new Set() } = {},
) {
  const planned = objects.map((o) => {
      if (!overrides[o.id]) return o;
      if (!o.generation?.type || !Array.isArray(o.generation.records))
        throw Error('旧特征缺少生成归属快照：' + o.name + '，请保留旧对象或重新生成');
      const recipe = clone(overrides[o.id]),
        sources = sourceIds(o.generation.type, recipe, o.guideId);
      if (o.generation.type === 'feature' && sources.includes(o.guideId))
        throw Error('不能把自身输出作为建模来源');
      return { ...o, recipe, generation: { ...o.generation, sources } };
    }),
    byId = new Map(planned.map((o) => [o.id, o])),
    design = { ...site.design, objects: site.design.objects.map((o) => byId.get(o.id) || o) };
  objects = orderedGeneration(design, planned);
  if (!['preserve', 'overwrite'].includes(manualStrategy)) throw Error('请选择有效的手改处理方式');
  const working = site.fork(),
    touched = new Set(),
    generatedNow = new Set(),
    manual = new Set(),
    manualRecords = new Map(),
    edited = new Set(),
    warnings = [];
  working.design.objects = working.design.objects.map((o) =>
    byId.has(o.id) ? clone(byId.get(o.id)) : o,
  );
  for (const o of [...objects].reverse()) {
    if (objectLocked(working.design, o)) throw Error('关联对象已锁定：' + o.name);
    if (!o.generation?.records)
      throw Error('旧特征缺少生成归属快照：' + o.name + '。请保留旧对象，或先重新生成并建立关联');
    if (detachedGeneration(o))
      throw Error('对象已被直接变换或改变成员：' + o.name + '，请先断开生成关联');
    const restores = [],
      kept = [];
    for (const r of o.generation.records) {
      const key = coordKey(...r.pos);
      touched.add(key);
      const live = cellSnapshot(working, r.pos);
      if (r.manual || !equal(live, r.after)) edited.add(key);
      if (manualStrategy === 'preserve' && (r.manual || manual.has(key) || !equal(live, r.after))) {
        manual.add(key);
        kept.push({ ...clone(r), after: live, manual: true });
      } else restores.push(operation(r.pos, r.before));
    }
    manualRecords.set(o.id, kept);
    working.operations(restores, { allowExisting: true, allowTerrain: true });
  }
  for (const o of objects) {
    const config = clone(overrides[o.id] || o.recipe),
      type = o.generation.type,
      plan =
        type === 'geometry'
          ? geometryPlan(working, config, available)
          : featurePlan(working, { ...config, available: [...available] }),
      ops = [],
      conflicts = [];
    if (plan.blocked) throw Error(plan.blocked.message);
    for (const op of new Map(plan.operations.map((op) => [coordKey(...op.pos), op])).values()) {
      const key = coordKey(...op.pos);
      touched.add(key);
      if (manualStrategy === 'preserve' && manual.has(key)) continue;
      const current = cellSnapshot(working, op.pos),
        after = op.state ? { state: op.state, nbt: op.nbt || null } : null;
      if (
        current &&
        !equal(current, after) &&
        !generatedNow.has(key) &&
        !o.generation.records.some((r) => coordKey(...r.pos) === key)
      ) {
        conflicts.push(op.pos);
        continue;
      }
      ops.push(op);
    }
    if (conflicts.length)
      throw Error(
        '更新将覆盖其他内容：' + o.name + '，请调整草图。位置 ' + conflicts[0].join(', '),
      );
    const captured = captureGeneration(working, ops);
    if (ops.some((op) => generatedNow.has(coordKey(...op.pos))))
      warnings.push('关联生成对象之间存在重叠，按原对象顺序重建');
    for (const op of ops) generatedNow.add(coordKey(...op.pos));
    working.operations(ops, { allowExisting: true, allowTerrain: true });
    const records = [
      ...captured.map((r) => ({ ...r, after: cellSnapshot(working, r.pos) })),
      ...(manualRecords.get(o.id) || []),
    ];
    const next = records.length
      ? {
          ...o,
          recipe: config,
          ...bounds(records),
          generation: {
            ...o.generation,
            outdated: false,
            records,
            sourceVersions: Object.fromEntries(
              o.generation.sources.map((id) => [
                id,
                working.design.guides.find((g) => g.id === id)?.revision || 0,
              ]),
            ),
          },
        }
      : {
          ...o,
          recipe: config,
          cells: [],
          generation: {
            ...o.generation,
            outdated: false,
            records: [],
            sourceVersions: Object.fromEntries(
              o.generation.sources.map((id) => [
                id,
                working.design.guides.find((g) => g.id === id)?.revision || 0,
              ]),
            ),
          },
        };
    working.design.objects = working.design.objects.map((v) => (v.id === o.id ? next : v));
    const display = working.design.guides.find((g) => g.id === o.guideId);
    if (display && type === 'feature') {
      display.points = plan.guide;
      display.revision = (display.revision || 0) + 1;
      if (plan.guideGroups) display.paths = plan.guideGroups;
      else delete display.paths;
      display.recipe = config;
    }
    warnings.push(...plan.warnings);
  }
  const operations = [];
  for (const key of touched) {
    const pos = coords(key),
      before = cellSnapshot(site, pos),
      after = cellSnapshot(working, pos);
    if (!equal(before, after)) operations.push(operation(pos, after));
  }
  if (manualStrategy === 'overwrite' && edited.size)
    warnings.push('明确替换 ' + edited.size + ' 处手改或手动删除');
  if (manual.size) warnings.push('保留 ' + manual.size + ' 个手改或手动删除的位置');
  return {
    operations,
    design: working.design,
    guide: [],
    warnings: [...new Set(warnings)],
    usedRoles: {},
    regeneration: { objects: objects.length, manual: manual.size },
  };
}
export function editSketchPlan(site, config, available) {
  const source = site.design.guides.find((g) => g.id === config.editGuideId);
  if (!source?.recipe?.kind) throw Error('请选择可编辑的已保存草图');
  const recipe = { ...clone(source.recipe), ...clone(config) };
  delete recipe.editGuideId;
  delete recipe.materializeGuide;
  delete recipe.updateDependents;
  delete recipe.manualStrategy;
  if (
    config.points &&
    config.sampleCount === undefined &&
    JSON.stringify(config.points) !== JSON.stringify(source.recipe.points)
  )
    delete recipe.sampleCount;
  const sketch = geometryPlan(site, { ...recipe, guidesOnly: true }, available),
    working = site.fork();
  working.design.guides = working.design.guides.map((g) =>
    g.id === source.id
      ? { ...g, recipe, points: sketch.guide, revision: (g.revision || 0) + 1 }
      : g,
  );
  const affected = affectedGeneration(working.design, source.id, detachedGeneration),
    detachedObjects = affected.detached,
    objects = affected.objects,
    overrides = Object.fromEntries(
      objects
        .filter(
          (o) => o.generation?.type === 'geometry' && o.generation.sources?.includes(source.id),
        )
        .map((o) => [o.id, recipe]),
    );
  working.design.objects = working.design.objects.map((o) =>
    detachedObjects.some((v) => v.id === o.id)
      ? { ...o, kind: 'voxel', generation: { ...o.generation, detached: true } }
      : o,
  );
  let result = {
    operations: [],
    design: working.design,
    guide: sketch.guide,
    warnings: [],
    usedRoles: {},
    regeneration: { objects: 0, manual: 0 },
  };
  if (config.updateDependents !== false && objects.length) {
    result = regenerateObjects(working, objects, {
      manualStrategy: config.manualStrategy || 'preserve',
      overrides,
      available,
    });
    result.guide = sketch.guide;
  } else if (objects.length) {
    working.design.objects = working.design.objects.map((o) =>
      objects.some((v) => v.id === o.id)
        ? { ...o, generation: { ...o.generation, outdated: true } }
        : o,
    );
    result.design = working.design;
    result.warnings.push(objects.length + ' 个关联对象保持原样，等待更新');
  }
  if (config.materializeGuide) {
    if (objects.some((object) => object.generation?.type === 'geometry'))
      throw Error('此辅助线已有方块结果，请编辑原生成结果');
    const stroke = geometryPlan(working, { ...recipe, guidesOnly: false }, available);
    result.operations = [
      ...new Map(
        [...result.operations, ...stroke.operations].map((operation) => [
          coordKey(...operation.pos),
          operation,
        ]),
      ).values(),
    ];
    result.materializedStroke = {
      guideId: source.id,
      recipe: { ...recipe, guidesOnly: false },
      operations: stroke.operations,
    };
    result.usedRoles = stroke.usedRoles;
    result.warnings.push(...stroke.warnings);
  }
  if (sketch.surfaceFit) result.surfaceFit = sketch.surfaceFit;
  result.warnings = [...new Set([...result.warnings, ...sketch.warnings])];
  if (detachedObjects.length)
    result.warnings.push(detachedObjects.length + ' 个已独立化对象保持原样');
  return result;
}
