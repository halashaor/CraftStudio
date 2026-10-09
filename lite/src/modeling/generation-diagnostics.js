// Read-only relationship diagnostics. Geometry validation remains in generators.
export function diagnoseGeneration(design, objects) {
  const records = new Map((design?.objects || []).map((o) => [o.id, o]));
  const byId = new Map(objects.map((o) => [o.id, o])),
    producers = new Map(),
    parents = new Map(),
    children = new Map();
  const issue = (o, value) => o.issues.push(value);
  for (const o of objects) {
    const record = records.get(o.id);
    if (o.detached || !record?.guideId) continue;
    // Geometry uses its own sketch as source, rather than producing that sketch.
    if (record.generation?.type === 'geometry') continue;
    if (!producers.has(record.guideId)) producers.set(record.guideId, []);
    producers.get(record.guideId).push(o.id);
  }
  for (const o of objects) {
    parents.set(o.id, new Set());
    children.set(o.id, new Set());
  }
  for (const o of objects)
    if (!o.detached)
      for (const source of o.sources) {
        const ids = producers.get(source.id) || [];
        if (ids.length > 1)
          issue(o, {
            severity: 'error',
            code: 'AMBIGUOUS_OUTPUT',
            sourceId: source.id,
            objectIds: ids,
            message: '来源辅助线由多个对象生成，请修复来源关系',
          });
        for (const id of ids) {
          parents.get(o.id).add(id);
          children.get(id).add(o.id);
        }
      }
  // Iterative DFS identifies actual cycle members without recursion depth limits.
  const color = new Map(),
    active = [],
    positions = new Map(),
    cycles = new Set();
  for (const o of objects) {
    if (color.has(o.id)) continue;
    const stack = [{ id: o.id, edges: [...parents.get(o.id)], index: 0 }];
    color.set(o.id, 1);
    positions.set(o.id, active.length);
    active.push(o.id);
    while (stack.length) {
      const frame = stack.at(-1);
      if (frame.index === frame.edges.length) {
        color.set(frame.id, 2);
        positions.delete(frame.id);
        active.pop();
        stack.pop();
        continue;
      }
      const id = frame.edges[frame.index++];
      if (color.get(id) === 1) {
        for (let i = positions.get(id); i < active.length; i++) cycles.add(active[i]);
      } else if (!color.has(id)) {
        color.set(id, 1);
        positions.set(id, active.length);
        active.push(id);
        stack.push({ id, edges: [...parents.get(id)], index: 0 });
      }
    }
  }
  for (const id of cycles)
    issue(byId.get(id), {
      severity: 'error',
      code: 'DEPENDENCY_CYCLE',
      message: '生成来源存在循环，请修复或断开循环关系',
    });
  const rank = (o) => (o.issues.some((i) => i.severity === 'error') ? 2 : o.issues.length ? 1 : 0);
  const levels = new Map(objects.map((o) => [o.id, rank(o)])),
    queue = objects.filter((o) => levels.get(o.id)).map((o) => o.id);
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    for (const child of children.get(id))
      if (levels.get(child) < levels.get(id)) {
        levels.set(child, levels.get(id));
        queue.push(child);
      }
  }
  for (const o of objects) {
    for (const id of parents.get(o.id))
      if (id !== o.id && levels.get(id)) {
        const upstream = byId.get(id),
          error = levels.get(id) === 2;
        issue(o, {
          severity: error ? 'error' : 'warning',
          code: error ? 'UPSTREAM_ERROR' : 'UPSTREAM_OUTDATED',
          objectId: id,
          objectName: upstream.name,
          message:
            '上游对象「' + (upstream.name || id) + '」' + (error ? '存在来源问题' : '待更新'),
        });
      }
    o.status = o.detached
      ? 'detached'
      : levels.get(o.id) === 2
        ? 'error'
        : levels.get(o.id)
          ? 'warning'
          : 'ready';
  }
}
