export function constructionOutput({ type, guidesOnly, counts = {}, regeneration }) {
  if (regeneration?.objects > 0) return 'linked';
  return type === 'geometry' && guidesOnly && !counts.place && !counts.replace && !counts.remove
    ? 'reference'
    : 'blocks';
}

export function previewPresentation({
  state,
  canConfirm,
  drawing,
  referenceOnly,
  output,
  committing,
}) {
  if (committing || state === 'applying')
    return {
      id: 'applying',
      tone: 'working',
      symbol: '…',
      label: '正在确认',
      detail: '完成后可一次撤销',
    };
  if (state === 'state-input')
    return {
      id: 'idle',
      tone: 'source',
      symbol: '◇',
      label: '选择要修改的属性',
      detail: '没有待提交改动；其余属性保持原值',
    };
  if (drawing || ['drawing', 'slope-drawing'].includes(state))
    return {
      id: 'drawing',
      tone: 'source',
      symbol: '◇',
      label: '正在取点',
      detail: '轮廓跟随鼠标，尚未改动场地',
    };
  if (['expression', 'pending-expression'].includes(state))
    return {
      id: 'expression',
      tone: 'attention',
      symbol: '!',
      label: '数值还未完成',
      detail: '完成输入后继续预览',
    };
  if (state === 'live')
    return {
      id: 'live',
      tone: 'working',
      symbol: '↔',
      label: '实时形状预览',
      detail: referenceOnly ? '正在校准轮廓' : '正在校准实际方块',
    };
  if (['pending', 'recomputing', 'loading'].includes(state))
    return {
      id: 'pending',
      tone: 'working',
      symbol: '…',
      label: '正在校准预览',
      detail: '尚未改动场地',
    };
  if (state === 'stale')
    return {
      id: 'stale',
      tone: 'attention',
      symbol: '↻',
      label: '预览需要更新',
      detail: '场景已变化，请重新预览',
    };
  if (state === 'invalid' || (state === 'ready' && !canConfirm))
    return {
      id: 'blocked',
      tone: 'attention',
      symbol: '!',
      label: '需要调整',
      detail: '查看下方原因，场地保持不变',
    };
  if (state === 'ready')
    return {
      id: 'ready',
      tone: referenceOnly ? 'source' : 'result',
      symbol: referenceOnly ? '◇' : '✓',
      label:
        output === 'linked' ? '轮廓与建筑可更新' : referenceOnly ? '轮廓可以保存' : '方块可以确认',
      detail: referenceOnly ? '保存轮廓，或沿线生成方块' : '当前仍是预览，确认后写入工程',
    };
  return {
    id: 'idle',
    tone: 'source',
    symbol: '◇',
    label: '等待设计输入',
    detail: '先选择轮廓、范围或模型',
  };
}
