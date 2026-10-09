import { closedProfiles } from '../../sketch/sketch-profiles.js';
export function registerModelingCommands({
  add,
  invoke,
  $,
  workspace,
  designer,
  construction,
  busyReason,
  selectionReason,
  getSummary,
}) {
  add(
    'precise-rectangle',
    '精确矩形沿路径生成',
    '建模',
    () => {
      workspace.selectCategory('model');
      $('feature-operation').value = 'sweep';
      $('feature-sweep-mode').value = 'rectangle-fit';
      construction.open('feature', { operation: 'sweep' });
    },
    '半砖步道 薄梁 半格截面 rectangle precise rail',
    () =>
      busyReason() ||
      (!(getSummary()?.design.guides || []).some((g) => g.points?.length >= 2)
        ? '请先绘制并保存一条路径'
        : ''),
  );
  add('feature', '建模工具', '建模', invoke('cad-feature', 'model'), 'feature modelling');
  const profileReason = (count) =>
    busyReason() ||
    (closedProfiles(getSummary()?.design.guides || []).length < count
      ? count === 1
        ? '请先绘制并保存闭合轮廓'
        : '放样需要至少两个已保存的闭合轮廓'
      : '');
  for (const [op, label, aliases] of [
    ['extrude', '拉伸', 'extrude extrusion'],
    ['loft', '截面放样', 'loft'],
    ['sweep', '沿路径生成', 'sweep path'],
  ])
    add(
      'feature-' + op,
      label,
      '建模',
      () => {
        workspace.selectCategory('model');
        $('feature-operation').value = op;
        $('cad-feature').click();
      },
      aliases,
      () =>
        op === 'sweep'
          ? busyReason() ||
            (!(getSummary()?.design.guides || []).length ? '请先绘制并保存路径' : '')
          : profileReason(op === 'loft' ? 2 : 1),
    );
  const aliases = {
    array: 'array duplicate repeat',
    pathArray: 'path array',
    radialArray: 'radial array',
    align: 'align',
    distribute: 'distribute',
    mirror: 'mirror',
    offset: 'offset profile',
    updateOffset: 'rebuild offset source 更新偏移 来源',
    pushpull: 'push pull',
    boolean: 'boolean union subtract',
    editFeature: 'edit feature',
    paint: 'paint material recolor 换材质 配色',
    instance: 'linked instance',
    syncInstances: 'update component',
    makeUniqueInstance: 'make unique',
    detachInstance: 'detach',
    inspect: 'inspect dimensions',
  };
  for (const option of $('designer-operation').options)
    add(
      'designer-' + option.value,
      option.textContent,
      '排列 / 编辑',
      () => {
        workspace.selectCategory('model');
        designer.open(option.value);
      },
      aliases[option.value] || '',
      option.value === 'updateOffset'
        ? () =>
            busyReason() ||
            (!(getSummary()?.design.guides || []).some((g) => g.provenance?.kind === 'offset')
              ? '没有带来源记录的偏移轮廓'
              : '')
        : option.value === 'offset'
          ? () =>
              busyReason() ||
              (!(getSummary()?.design.guides || []).some((g) => closedProfiles([g]).length)
                ? '请先保存一个闭合且共面的轮廓'
                : '')
          : selectionReason,
    );
}
