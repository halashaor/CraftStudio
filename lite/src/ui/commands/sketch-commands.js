export function registerSketchCommands({ add, $, workspace }) {
  for (const [kind, label, aliases] of [
    ['line', '线段', 'line'],
    ['polyline', '连续折线', 'polyline path 折线 路径'],
    ['rectangle', '矩形轮廓', 'rectangle'],
    ['circle', '圆形轮廓', 'circle'],
    ['polygon', '多边形轮廓', 'polygon'],
    ['bezier', '贝塞尔曲线', 'bezier curve 控制曲线'],
    ['spline', '贯穿点曲线', 'spline interpolated curve 插值曲线 平滑路径 长曲线 途经点'],
    ['ellipse', '椭圆轮廓', 'ellipse 椭圆'],
    ['arc', '圆弧', 'arc 拱线 弧线'],
    ['box', '长方体', 'box cuboid 盒子 体积'],
  ])
    add(
      'figure-' + kind,
      label,
      '草图',
      () => {
        workspace.selectCategory('draw');
        $('cad-figure').click();
        $('figure-kind').value = kind;
        $('figure-kind').dispatchEvent(new Event('change'));
      },
      aliases,
    );
}
