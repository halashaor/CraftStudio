export function registerViewCommands({
  add,
  invoke,
  $,
  busyReason,
  selectionReason,
  hasOperation,
  measurement,
  operations,
  viewPresets,
  zoomSelection,
  getSummary,
}) {
  for (const [id, label, button, aliases] of [
    ['view-back', '上一视角', 'view-previous', 'previous view 返回视角 看回去'],
    ['view-forward', '下一视角', 'view-next', 'next view 前进视角'],
  ])
    add(
      id,
      label,
      '视图',
      () => $(button).click(),
      aliases,
      () => busyReason() || (!$(button) || $(button).disabled ? '没有可恢复的相机视角' : ''),
    );
  add(
    'space-review',
    '空间浏览',
    '视图',
    () => $('studio-walk').click(),
    '室内浏览 漫游 看内部 fly walk',
    () => busyReason() || (hasOperation() ? '请先确认或取消当前预览' : ''),
  );
  add(
    'measure',
    '测量间距 / 高差',
    '视图',
    () => measurement.open(),
    'ruler measure distance height slope angle polyline length 夹角 折线 总长',
    () => operations.busyReason(),
  );
  add(
    'saved-views',
    '收藏视角',
    '视图',
    () => viewPresets.open(),
    'views bookmark camera',
    () => '',
  );
  add('fit', '总览场景', '视图', invoke('fit'), 'frame fit all', () => '', 'F');
  add('top', '俯视', '视图', invoke('top'), 'top view', () => '');
  add(
    'frame-selection',
    '聚焦选择',
    '视图',
    zoomSelection,
    'frame selected focus zoom',
    selectionReason,
  );
  add(
    'isolate-selection',
    '隔离编辑当前选择',
    '视图',
    invoke('isolation-enter'),
    'local view isolate',
    selectionReason,
  );
  add('exit-isolation', '退出一层隔离', '视图', invoke('isolation-exit'), 'exit local view', () =>
    getSummary()?.view?.isolated ? '' : '当前未隔离',
  );
  add(
    'clear-isolation',
    '恢复全部场景',
    '视图',
    invoke('isolation-all'),
    'global view clear isolation',
    () => (getSummary()?.view?.isolated ? '' : '当前未隔离'),
  );
}
