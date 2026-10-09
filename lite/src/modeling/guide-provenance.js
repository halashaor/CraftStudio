export function offsetSourceStatuses(guides, ids) {
  const map = guides instanceof Map ? guides : new Map(guides.map((g) => [g.id, g])),
    result = new Map();
  function status(guide, errorCode = null) {
    const p = guide.provenance,
      direct = map.get(p.guideId),
      parent = result.get(p.guideId);
    errorCode = errorCode || (!direct ? 'OFFSET_SOURCE_MISSING' : parent?.errorCode) || null;
    const upstreamOutdated = !!parent?.outdated,
      ownOutdated = !!direct && (p.sourceRevision ?? 0) !== (direct.revision ?? 0);
    const reason =
      errorCode === 'OFFSET_CYCLE'
        ? '偏移来源存在循环，请修复来源记录'
        : errorCode === 'OFFSET_SOURCE_MISSING'
          ? '偏移来源已失效，请重新选择轮廓'
          : upstreamOutdated
            ? '上一级偏移轮廓仍待重建，请先更新上一级'
            : '';
    return {
      kind: 'offset',
      errorCode,
      independent: true,
      guideId: p.guideId,
      name: direct?.name || '参照已失效',
      missing: !direct,
      distance: p.distance,
      outdated: ownOutdated || upstreamOutdated || !!errorCode,
      canRebuild: !errorCode && !upstreamOutdated,
      reason,
      revision: direct?.revision ?? 0,
    };
  }
  for (const id of ids || map.keys()) {
    if (result.has(id) || map.get(id)?.provenance?.kind !== 'offset') continue;
    const path = [],
      positions = new Map();
    let current = id;
    while (map.get(current)?.provenance?.kind === 'offset' && !result.has(current)) {
      if (positions.has(current)) {
        for (let i = positions.get(current); i < path.length; i++)
          result.set(path[i], status(map.get(path[i]), 'OFFSET_CYCLE'));
        break;
      }
      positions.set(current, path.length);
      path.push(current);
      current = map.get(current).provenance.guideId;
    }
    for (let i = path.length - 1; i >= 0; i--)
      if (!result.has(path[i])) result.set(path[i], status(map.get(path[i])));
  }
  return result;
}
export function offsetSourceStatus(guides, id) {
  return offsetSourceStatuses(guides, [id]).get(id) || null;
}
