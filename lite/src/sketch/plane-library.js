import { validateFrame, faceFrame, dot, sub } from './workplane.js';
const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  unit = (p) => {
    const l = Math.hypot(...p);
    return p.map((n) => n / l);
  };
export function curveFrames(points) {
  if (
    !Array.isArray(points) ||
    points.length < 2 ||
    points.some((p) => p?.length !== 3 || p.some((n) => !Number.isFinite(n)))
  )
    throw Error('需要有效路径');
  const segments = [];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const d = sub(points[i], points[i - 1]),
      length = Math.hypot(...d);
    if (length > 1e-8) {
      segments.push({
        a: points[i - 1],
        b: points[i],
        d,
        length,
        start: totalLength,
        normal: unit(d),
      });
      totalLength += length;
    }
  }
  if (!segments.length) throw Error('路径没有有效长度');
  let frame = faceFrame(segments[0].a, segments[0].normal);
  for (let i = 0; i < segments.length; i++) {
    const next = segments[i].normal;
    if (i) {
      const k = cross(frame.normal, next),
        c = Math.max(-1, Math.min(1, dot(frame.normal, next)));
      let u;
      if (c < -1 + 1e-8 || Math.hypot(...k) < 1e-8) u = frame.u;
      else {
        const ku = cross(k, frame.u),
          kku = cross(k, ku);
        u = frame.u.map((n, a) => n + ku[a] + kku[a] / (1 + c));
      }
      u = unit(
        sub(
          u,
          next.map((n) => n * dot(u, next)),
        ),
      );
      frame = { ...frame, u, v: cross(next, u), normal: next };
    }
    segments[i].frame = { ...frame, origin: [...segments[i].a] };
  }
  return { segments, totalLength };
}
export function curveStation(points, station = 0.5) {
  if (!Number.isFinite(station) || station < 0 || station > 1) throw Error('路径位置比例需要 0–1');
  const data = curveFrames(points),
    distance = station * data.totalLength,
    index = Math.max(
      0,
      data.segments.findIndex(
        (s, i) => distance <= s.start + s.length || i === data.segments.length - 1,
      ),
    ),
    chosen = data.segments[index],
    fraction = Math.max(0, Math.min(1, (distance - chosen.start) / chosen.length)),
    frame = { ...chosen.frame, origin: chosen.a.map((n, a) => n + chosen.d[a] * fraction) };
  return {
    frame: validateFrame(frame),
    distance,
    totalLength: data.totalLength,
    station,
    segment: index,
  };
}

export function planeMutation(site, method, p) {
  const list = site.design.workplanes || [],
    id = p.id || p.plane?.id;
  if (method === 'workplanes.remove') {
    if (!list.some((item) => item.id === id)) throw Error('平面已不存在');
    site.design.workplanes = list.filter((item) => item.id !== id);
    return { removed: id };
  }
  const plane = structuredClone(p.plane);
  if (typeof plane?.name !== 'string' || !plane.name.trim()) throw Error('请填写平面名称');
  if (plane.source?.mode && plane.source.mode !== 'snapshot')
    throw Error('平面库当前保存快照，自动跟随参照尚未支持');
  plane.name = plane.name.trim();
  plane.frame = validateFrame(plane.frame);
  if (p.space === 'world') {
    if (!site.originConfirmed) throw Error('请先确认世界原点');
    plane.frame.origin = plane.frame.origin.map((n, a) => n - site.origin[a]);
  }
  if (list.some((item) => item.name === plane.name && item.id !== id))
    throw Error('同名平面已存在，请选择后更新');
  if (id && !list.some((item) => item.id === id)) throw Error('要更新的平面已不存在');
  plane.id = id || crypto.randomUUID();
  plane.source = plane.source ? { ...plane.source, mode: 'snapshot' } : null;
  const index = list.findIndex((item) => item.id === plane.id);
  site.design.workplanes = structuredClone(list);
  if (index < 0) site.design.workplanes.push(plane);
  else site.design.workplanes[index] = plane;
  return { plane };
}
export function listedPlanes(site, space = 'local') {
  const items = structuredClone(site.design.workplanes || []);
  if (space === 'world') {
    if (!site.originConfirmed) throw Error('请先确认世界原点');
    for (const p of items) p.frame.origin = p.frame.origin.map((n, a) => n + site.origin[a]);
  }
  return items;
}
