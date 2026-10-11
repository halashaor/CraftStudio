import { previewPresentation } from '../modeling/preview-presentation.js';
export const surfacePathKinds = new Set(['bezier', 'spline', 'polyline', 'line']);
export function pointPlacement({ kind, pickSurface, workplane, planeLock }) {
  return surfacePathKinds.has(kind) && pickSurface && !workplane && !planeLock
    ? 'surface'
    : 'plane';
}
export function sketchPhase({
  drawing,
  guidesOnly,
  previewState,
  previewOutput,
  canConfirm = true,
}) {
  if (drawing) return { id: 'drawing', label: '画轮廓' };
  const preview = previewPresentation({
    state: previewState,
    canConfirm,
    referenceOnly: previewOutput ? previewOutput === 'reference' : guidesOnly,
    output: previewOutput,
  });
  if (preview.id !== 'ready') return preview;
  if (previewOutput === 'linked') return { id: 'blocks', label: '轮廓与建筑联动' };
  if (previewOutput === 'reference' || (!previewOutput && guidesOnly))
    return { id: 'nodes', label: '调节点' };
  return { id: 'blocks', label: '方块预览' };
}
