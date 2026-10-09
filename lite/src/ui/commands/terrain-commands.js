export function registerTerrainCommands({ add, $, workspace, selectionReason }) {
  for (const [mode, label, aliases] of [
    ['flatten', '局部整平', 'flatten terrain'],
    ['smooth', '平滑地形', 'smooth terrain'],
    ['slope', '连续坡道', 'slope ramp'],
  ])
    add(
      'terrain-' + mode,
      label,
      '场地',
      () => {
        workspace.selectCategory('site');
        $('terrain-operation').value = mode;
        $('cad-terrain').click();
      },
      aliases,
      selectionReason,
    );
}
