export const comparisonMessage = '正在只读对比方案；请先返回当前设计，再继续编辑或导出。';

// Reads for rendering and canonical draft persistence remain available during review.
const actions = new Set([
  'comparison',
  'api',
  'summary',
  'mesh',
  'meshChunks',
  'createScene',
  'inspect',
  'meshSourceGeometry',
  'designInspect',
  'search',
  'assetCatalogue',
  'assetPreview',
  'screenBoxSelection',
  'sourceResidency',
  'workspaceAssets',
  'workspaceCheckpoint',
  'baselineReference',
  'draftAttachments',
  'draft',
  'engineCapture',
  'engineMountSource',
  'engineRestore',
  'toolContext',
  'context',
  'import',
  'load',
  'resume',
  'endStroke',
  'cancelConstruction',
]);
const methods = new Set([
  'workspace.describe',
  'meshes.list',
  'meshes.read',
  'scene.readRegion',
  'scene.getBlocks',
  'scene.chunkSnapshot',
  'terrain.readColumns',
  'materials.search',
  'materials.collect',
  'transaction.inspect',
  'design.inspect',
  'views.list',
  'generation.links',
  'objects.list',
  'selectionSets.list',
  'selectionSets.resolve',
  'prefabs.list',
  'prefabs.read',
  'workplanes.list',
  'workplanes.atCurve',
  'measurements.list',
  'collections.list',
  'palettes.list',
]);
export function comparisonActionAllowed(action) {
  return actions.has(action);
}
export function comparisonMethodAllowed(method) {
  return method.startsWith('comparison.') || methods.has(method);
}
