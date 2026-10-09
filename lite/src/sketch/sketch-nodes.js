export function editSketchNodes(
  { kind, points, closed = false, constraint = 'free' },
  operation,
  index,
) {
  if (!['polyline', 'polygon', 'bezier', 'spline'].includes(kind))
    throw Error('此图形使用固定控制点，请调整坐标');
  if (!Number.isInteger(index) || index < 0 || index >= points.length)
    throw Error('请先选择一个控制点');
  if (constraint === 'symmetric') throw Error('请先解除四点对称约束，再改变节点数量');
  const result = points.map((p) => [...p]);
  if (operation === 'remove') {
    const minimum = kind === 'bezier' || kind === 'polygon' || closed ? 3 : 2;
    if (points.length <= minimum) throw Error('当前轮廓至少需要 ' + minimum + ' 个控制点');
    result.splice(index, 1);
    return { points: result, index: Math.min(index, result.length - 1) };
  }
  if (operation !== 'insert') throw Error('未知节点操作');
  if (kind === 'bezier' && points.length >= 8) throw Error('贝塞尔曲线最多支持 8 个控制点');
  const next =
    index + 1 < points.length ? points[index + 1] : closed || kind === 'polygon' ? points[0] : null;
  if (!next) throw Error('开放路径末端请使用添加控制点');
  result.splice(
    index + 1,
    0,
    points[index].map((n, a) => (n + next[a]) / 2),
  );
  return { points: result, index: index + 1 };
}

export function elevateBezier(points) {
  if (
    !Array.isArray(points) ||
    points.length < 3 ||
    points.length >= 8 ||
    points.some((p) => p.length !== 3 || p.some((n) => !Number.isFinite(n)))
  )
    throw Error('增阶需要 3–7 个有效控制点');
  const result = [[...points[0]]],
    count = points.length;
  for (let i = 1; i < count; i++) {
    const t = i / count;
    result.push(points[i - 1].map((n, a) => t * n + (1 - t) * points[i][a]));
  }
  result.push([...points.at(-1)]);
  return result;
}
