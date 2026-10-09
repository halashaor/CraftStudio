export const surfacePathKinds = new Set(['bezier', 'spline', 'polyline', 'line']);
export function pointPlacement({ kind, pickSurface, workplane, planeLock }) {
  return surfacePathKinds.has(kind) && pickSurface && !workplane && !planeLock
    ? 'surface'
    : 'plane';
}
export function sketchPhase({ drawing, guidesOnly, previewState }) {
  if (drawing) return { id: 'drawing', label: '画轮廓' };
  if (previewState === 'expression') return { id: 'expression', label: '完成数值' };
  if (guidesOnly) return { id: 'nodes', label: '调节点' };
  return { id: 'blocks', label: previewState === 'pending' ? '计算方块' : '方块预览' };
}
