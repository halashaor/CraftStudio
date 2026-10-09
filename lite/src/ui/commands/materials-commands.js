export function registerMaterialsCommands({ add, $, dock, busyReason, selectionReason }) {
  add(
    'prefab-library',
    '浏览工程构件库',
    '素材',
    () => dock('components'),
    'prefab components library 构件库 窗 门 柱 收藏建筑',
    () => '',
  );
  add(
    'prefab-import',
    '导入构件文件',
    '素材',
    () => {
      dock('components');
      $('studio-prefab-file').click();
    },
    'import prefab craftprefab 构件文件',
    busyReason,
  );
  add(
    'material-palettes',
    '工程配色方案',
    '素材',
    () => {
      dock('assets');
      const panel = $('asset-project-palettes');
      panel.open = true;
      panel.scrollIntoView({ block: 'nearest' });
    },
    'palette 配色 收藏素材 材料组合',
  );
  add(
    'palette-collect',
    '从选区收集配色素材',
    '素材',
    () => {
      dock('assets');
      $('asset-project-palettes').open = true;
      $('asset-project-palette-collect').click();
    },
    'collect materials 收集素材 保存选区材质',
    () =>
      selectionReason() ||
      (!$('asset-project-palette').value ? '请先打开工程配色方案并选择一个方案' : ''),
  );
  add(
    'materials',
    '素材库',
    '素材',
    () => dock('assets'),
    'materials blocks palette',
    () => '',
    'Ctrl+F',
  );
}
