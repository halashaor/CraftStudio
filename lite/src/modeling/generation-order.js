import { generationLinks } from './generation-links.js';
export function affectedGeneration(design, guideId, isDetached = (o) => !!o.generation?.detached) {
  const links = generationLinks(design),
    byId = new Map((design.objects || []).map((o) => [o.id, o])),
    reverse = new Map(),
    seenGuides = new Set(),
    selected = new Set(),
    detached = new Set(),
    queue = [guideId];
  for (const link of links.objects)
    for (const source of link.sources) {
      if (!reverse.has(source.id)) reverse.set(source.id, []);
      reverse.get(source.id).push(link.id);
    }
  while (queue.length) {
    const id = queue.shift();
    if (seenGuides.has(id)) continue;
    seenGuides.add(id);
    for (const objectId of reverse.get(id) || []) {
      const o = byId.get(objectId);
      if (isDetached(o)) {
        detached.add(objectId);
        continue;
      }
      if (selected.has(objectId)) continue;
      selected.add(objectId);
      if (o.guideId && o.guideId !== id) queue.push(o.guideId);
    }
  }
  return {
    objects: orderedGeneration(
      design,
      [...selected].map((id) => byId.get(id)),
    ),
    detached: [...detached].map((id) => byId.get(id)),
  };
}
export function orderedGeneration(design, objects) {
  const selected = new Map(objects.map((o) => [o.id, o])),
    links = new Map(generationLinks(design).objects.map((o) => [o.id, o])),
    producer = new Map(),
    edges = new Map(objects.map((o) => [o.id, new Set()])),
    indegree = new Map(objects.map((o) => [o.id, 0])),
    guides = new Set((design.guides || []).map((g) => g.id));
  for (const o of objects)
    if (o.guideId) {
      if (producer.has(o.guideId) && producer.get(o.guideId) !== o.id)
        throw Error('多个关联结果使用同一输出辅助线，请修复来源关系');
      producer.set(o.guideId, o.id);
    }
  for (const o of objects)
    for (const source of links.get(o.id)?.sources || []) {
      if (!guides.has(source.id)) throw Error('生成参照已失效：' + o.name + '，请重新选择来源');
      const from = producer.get(source.id);
      if (from && from !== o.id && !edges.get(from).has(o.id)) {
        edges.get(from).add(o.id);
        indegree.set(o.id, indegree.get(o.id) + 1);
      }
    }
  const ready = objects.filter((o) => !indegree.get(o.id)).map((o) => o.id),
    ordered = [];
  while (ready.length) {
    const id = ready.shift();
    ordered.push(selected.get(id));
    for (const next of edges.get(id)) {
      indegree.set(next, indegree.get(next) - 1);
      if (!indegree.get(next)) ready.push(next);
    }
  }
  if (ordered.length !== objects.length) throw Error('生成关系存在循环，请断开循环参照后更新');
  return ordered;
}
