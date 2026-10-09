/*!
The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
// Centripetal evaluator adapted from the pinned three.js r170 CatmullRomCurve3.
export function splinePoint(points, closed, t) {
  const length = points.length,
    p = (length - (closed ? 0 : 1)) * t;
  let index = Math.floor(p),
    weight = p - index;
  if (closed) index += index > 0 ? 0 : (Math.floor(Math.abs(index) / length) + 1) * length;
  else if (weight === 0 && index === length - 1) {
    index = length - 2;
    weight = 1;
  }
  const p0 =
      closed || index > 0
        ? points[(index - 1) % length]
        : points[0].map((n, a) => n - points[1][a] + n),
    p1 = points[index % length],
    p2 = points[(index + 1) % length],
    p3 =
      closed || index + 2 < length
        ? points[(index + 2) % length]
        : points.at(-1).map((n, a) => n - points.at(-2)[a] + n),
    squared = (a, b) => {
      const x = a[0] - b[0],
        y = a[1] - b[1],
        z = a[2] - b[2];
      return x * x + y * y + z * z;
    };
  let dt0 = Math.pow(squared(p0, p1), 0.25),
    dt1 = Math.pow(squared(p1, p2), 0.25),
    dt2 = Math.pow(squared(p2, p3), 0.25);
  if (dt1 < 1e-4) dt1 = 1;
  if (dt0 < 1e-4) dt0 = dt1;
  if (dt2 < 1e-4) dt2 = dt1;
  const weight2 = weight * weight,
    weight3 = weight2 * weight;
  return p1.map((x1, a) => {
    const x0 = p0[a],
      x2 = p2[a],
      x3 = p3[a],
      t1 = ((x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1) * dt1,
      t2 = ((x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2) * dt1;
    return (
      x1 +
      t1 * weight +
      (-3 * x1 + 3 * x2 - 2 * t1 - t2) * weight2 +
      (2 * x1 - 2 * x2 + t1 + t2) * weight3
    );
  });
}
export function sampleSpline(source, { closed = false, density = 8 } = {}) {
  if (!Number.isFinite(density)) throw Error('采样密度需要有效数字');
  if (
    !Array.isArray(source) ||
    source.length < 2 ||
    source.some((p) => !Array.isArray(p) || p.length !== 3 || p.some((n) => !Number.isFinite(n)))
  )
    throw Error('贯穿点曲线需要有效的三维途经点');
  const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i])),
    points = [];
  for (const p of source)
    if (!points.length || distance(p, points.at(-1)) > 1e-9) points.push([...p]);
  if (closed && points.length > 1 && distance(points[0], points.at(-1)) < 1e-9) points.pop();
  if (points.length < (closed ? 3 : 2))
    throw Error(closed ? '闭合曲线至少需要三个不同的点' : '曲线至少需要两个不同的点');
  const segments = closed ? points.length : points.length - 1,
    out = [[...points[0]]],
    rate = Math.max(1, Math.min(8, density));
  for (let i = 0; i < segments; i++) {
    const next = points[(i + 1) % points.length],
      steps = Math.max(4, Math.ceil(distance(points[i], next) * rate));
    if (steps > 16384) throw Error('单段过长，请增加途经点');
    if (out.length + steps > 50000) throw Error('辅助线点数过多，请分段绘制');
    for (let j = 1; j < steps; j++)
      out.push(splinePoint(points, closed, (i + j / steps) / segments));
    out.push([...next]);
  }
  return out;
}
