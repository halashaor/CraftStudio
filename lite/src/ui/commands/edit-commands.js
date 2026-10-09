export function registerEditCommands({
  add,
  invoke,
  chooseTool,
  direct,
  repeatTransform,
  repeatReason,
  objectNames,
  busyReason,
  selectionReason,
  hasOperation,
  hasNamedSelection,
  $,
}) {
  for (const [id, label, aliases] of [
    ['inspect', '选择', 'select selection'],
    ['place', '放置方块', 'place block'],
    ['paint', '画笔', 'brush paint draw'],
    ['erase', '擦除', 'erase delete'],
    ['sample', '取材', 'eyedropper sample'],
  ])
    add(id, label, '编辑', () => chooseTool(id), aliases);
  for (const [id, label, target, key, aliases] of [
    ['move', '移动选择', 'cad-move-direct', 'M', 'move translate 挪动 移位置 抬高 降低 升高'],
    ['rotate', '旋转选择', 'cad-rotate-direct', 'R', 'rotate'],
    ['copy', '复制选择', 'cad-copy-direct', 'C', 'copy duplicate 拷贝 副本 重复'],
  ])
    add(id, label, '编辑', invoke(target, 'edit'), aliases, selectionReason, key);
  add(
    'repeat-transform',
    '重复上次变换 · 预览',
    '编辑',
    repeatTransform,
    'repeat last transform 再复制一次 再移动一次 重复位移 重复旋转',
    repeatReason,
    'Shift+R',
  );
  add(
    'selection-sets',
    '常用命名选择',
    '编辑',
    () => {
      $('selection-sets-panel').open = true;
      $('selection-sets-panel').scrollIntoView({ block: 'nearest' });
    },
    'named selection sets 常用选择 保存选择 恢复选择',
    () => '',
  );
  add(
    'paste',
    '粘贴预览',
    '编辑',
    invoke('cad-paste-direct', 'edit'),
    'paste clipboard',
    () => busyReason() || (!direct.hasClipboard() ? '请先用 Ctrl+C 复制选择' : ''),
    'Ctrl+V',
  );
  add(
    'object-rename',
    '重命名对象',
    '编辑',
    () => objectNames.begin(),
    'rename name F2 改名字 命名',
    () =>
      busyReason() ||
      (hasOperation() ? '请先确认或取消当前预览' : !hasNamedSelection() ? '请先选择对象' : ''),
    'F2',
  );
  add(
    'object-batch-rename',
    '批量命名对象',
    '编辑',
    () => objectNames.beginBatch(),
    'batch rename name 编号 批量重命名 前缀 后缀 文字替换',
    () => selectionReason() || (!hasNamedSelection() ? '请先选择对象' : ''),
    'Ctrl+F2',
  );
}
