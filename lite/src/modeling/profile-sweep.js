import { boundaryFitter } from './voxel-fit.js';
import { curveFrames } from '../sketch/plane-library.js';
import { profileFrame, validateFrame, dot, sub, fromPlane } from '../sketch/workplane.js';
const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  unit = (a) => {
    const l = Math.hypot(...a);
    return a.map((n) => n / l);
  };
const inside = (x, y, p) => {
  let yes = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a = p[i],
      b = p[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
      yes = !yes;
  }
  return yes;
};
function edgeDistance(x, y, p) {
  let best = Infinity;
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy));
  }
  return best;
}
export function prepareProfileSweep(
  path,
  points,
  reference = null,
  { profilePlacement = 'asDrawn', anchorStation = null } = {},
) {
  if (!['asDrawn', 'center'].includes(profilePlacement)) throw Error('未知截面定位方式');
  const f = profileFrame(points, 'auto', reference),
    origin = reference
      ? validateFrame(reference).origin
      : points.reduce((o, p) => o.map((n, a) => n + p[a] / points.length), [0, 0, 0]),
    data = curveFrames(path);
  let anchor = null,
    best = Infinity;
  for (const s of data.segments) {
    const t = Math.max(0, Math.min(s.length, dot(sub(origin, s.a), s.normal))),
      p = s.a.map((n, a) => n + s.normal[a] * t),
      d = Math.hypot(...sub(origin, p));
    if (d < best) {
      best = d;
      anchor = { point: p, frame: s.frame, distance: s.start + t };
    }
  }
  if (anchorStation !== null) {
    if (!Number.isFinite(anchorStation) || anchorStation < 0 || anchorStation > 1)
      throw Error('截面位置比例需要 0–1');
    const distance = anchorStation * data.totalLength,
      s = data.segments.find((s) => distance <= s.start + s.length) || data.segments.at(-1),
      t = Math.max(0, Math.min(s.length, distance - s.start));
    anchor = { point: s.a.map((n, a) => n + s.normal[a] * t), frame: s.frame, distance };
  }
  const k = cross(f.normal, anchor.frame.normal),
    c = Math.max(-1, Math.min(1, dot(f.normal, anchor.frame.normal)));
  let alignedU = f.u;
  if (c > -1 + 1e-8 && Math.hypot(...k) > 1e-8) {
    const ku = cross(k, f.u),
      kku = cross(k, ku);
    alignedU = f.u.map((n, a) => n + ku[a] + kku[a] / (1 + c));
  }
  const roll = Math.atan2(dot(alignedU, anchor.frame.v), dot(alignedU, anchor.frame.u)),
    cos = Math.cos(roll),
    sin = Math.sin(roll),
    offset =
      profilePlacement === 'center'
        ? points.reduce((o, p) => o.map((n, a) => n + p[a] / points.length), [0, 0, 0])
        : anchor.point;
  let poly = points
    .map((p) => [dot(sub(p, offset), f.u), dot(sub(p, offset), f.v)])
    .filter((p, i, a) => !i || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 1e-8);
  if (poly.length > 1 && Math.hypot(...poly[0].map((n, a) => n - poly.at(-1)[a])) < 1e-8)
    poly.pop();
  if (poly.length < 3) throw Error('截面需要有效闭合轮廓');
  const warnings = [];
  if (Math.abs(c) < 0.999) warnings.push('截面已按尺寸刚性对齐至路径切线；检查横向偏移');
  const closed = Math.hypot(...sub(path[0], path.at(-1))) < 1e-6;
  if (closed) warnings.push('闭合轨道请检查截面接缝；当前按分段方块体积合并');
  const joins = (a, b, n) => {
    const v = a.map((x, i) => x + b[i]);
    if (Math.hypot(...v) < 1e-6 || dot(unit(v), n) < 0.2) {
      warnings.push('路径含急折返，接头按分段合并，请检查自交');
      return n;
    }
    return unit(v);
  };
  const segments = data.segments.map((s, i, all) => {
    const frame = {
        ...s.frame,
        u: s.frame.u.map((n, a) => n * cos + s.frame.v[a] * sin),
        v: s.frame.v.map((n, a) => n * cos - s.frame.u[a] * sin),
      },
      prev = all[i - 1] || (closed ? all.at(-1) : null),
      next = all[i + 1] || (closed ? all[0] : null),
      startNormal = prev ? joins(prev.normal, s.normal, s.normal) : s.normal,
      endNormal = next ? joins(s.normal, next.normal, s.normal) : s.normal;
    const rings = [[], []];
    for (const p of poly) {
      const lateral = frame.u.map((n, a) => n * p[0] + frame.v[a] * p[1]),
        start = -dot(lateral, startNormal) / dot(s.normal, startNormal),
        end = s.length - dot(lateral, endNormal) / dot(s.normal, endNormal);
      rings[0].push(s.a.map((n, a) => n + lateral[a] + s.normal[a] * start));
      rings[1].push(s.a.map((n, a) => n + lateral[a] + s.normal[a] * end));
    }
    return { ...s, frame, startNormal, endNormal, rings };
  });
  return {
    segments,
    poly,
    warnings: [...new Set(warnings)],
    closed,
    totalLength: data.totalLength,
    anchorStation: anchor.distance / data.totalLength,
  };
}
export function sweepContains(plan, s, p, config = {}) {
  const q = sub(p, s.a),
    da = dot(q, s.startNormal),
    db = -dot(sub(p, s.b), s.endNormal);
  if (da < -1e-8 || db < -1e-8) return false;
  const ratio = da / (da + db || 1),
    distance = s.start + s.length * Math.max(0, Math.min(1, ratio)),
    frame = plan.frameAt ? plan.frameAt(s, distance) : s.frame,
    u = dot(q, frame.u),
    v = dot(q, frame.v),
    poly = plan.polyAt ? plan.polyAt(distance) : plan.poly;
  if (!inside(u, v, poly)) return false;
  const thickness = Number(config.thickness ?? 1),
    along = s.start + Math.max(0, Math.min(s.length, dot(q, s.normal))),
    cap =
      !plan.closed &&
      config.caps !== false &&
      (along < thickness || plan.totalLength - along < thickness);
  return !config.hollow || cap || edgeDistance(u, v, poly) <= thickness;
}
export function profileSweepOperations(plan, config, put) {
  let visited = 0;
  if (config.sweepOverlap !== undefined && !['merge', 'stop'].includes(config.sweepOverlap))
    throw Error('相交处理需要 merge 或 stop');
  const smart = config.voxel === 'smart' && !config.cut,
    cells = new Map(),
    roles = { full: 0, slab: 0, stairs: 0 },
    owners = new Map(),
    overlaps = new Map(),
    radius = Math.max(
      ...plan.poly.map((p) => Math.hypot(...p)),
      ...(plan.stations || []).flatMap((t) =>
        (plan.polyAt ? plan.polyAt(t * plan.totalLength) : plan.poly).map((p) => Math.hypot(...p)),
      ),
    );
  const separation = Math.max(2, radius * 2 + 1);
  const own = (pos, s) => {
    const key = pos.join(','),
      distance =
        s.start +
        Math.max(
          0,
          Math.min(
            s.length,
            dot(
              sub(
                pos.map((n) => n + 0.5),
                s.a,
              ),
              s.normal,
            ),
          ),
        ),
      old = owners.get(key) || [];
    if (
      old.some((d) => {
        const gap = Math.abs(distance - d);
        return (plan.closed ? Math.min(gap, plan.totalLength - gap) : gap) > separation;
      })
    )
      overlaps.set(key, pos);
    old.push(distance);
    owners.set(key, old);
  };
  for (const s of plan.segments) {
    const points = s.rings.flat(),
      min = s.bounds?.min || [0, 1, 2].map((a) => Math.floor(Math.min(...points.map((p) => p[a])))),
      max = s.bounds?.max || [0, 1, 2].map((a) => Math.ceil(Math.max(...points.map((p) => p[a]))));
    visited += max.reduce((n, v, a) => n * (v - min[a]), 1);
    if (visited > 2000000) throw Error('扫掠体积过大，请分段');
    for (let x = min[0]; x < max[0]; x++)
      for (let y = min[1]; y < max[1]; y++)
        for (let z = min[2]; z < max[2]; z++) {
          const pos = [x, y, z],
            center = sweepContains(
              plan,
              s,
              pos.map((n) => n + 0.5),
              config,
            );
          if (center) own(pos, s);
          if (!smart) {
            if (center) put(pos);
            continue;
          }
          let mask = 0;
          for (let dy = 0; dy < 2; dy++)
            for (let dz = 0; dz < 2; dz++)
              for (let dx = 0; dx < 2; dx++)
                if (
                  sweepContains(
                    plan,
                    s,
                    [x + 0.25 + dx * 0.5, y + 0.25 + dy * 0.5, z + 0.25 + dz * 0.5],
                    config,
                  )
                )
                  mask |= 1 << (dx + 2 * dz + 4 * dy);
          if (mask || center) {
            const key = pos.join(','),
              old = cells.get(key);
            cells.set(key, { pos, mask: mask | (old?.mask || 0), center: center || old?.center });
          }
        }
  }
  const fitCell = smart
    ? boundaryFitter(config.state || { Name: 'minecraft:stone_bricks' }, config)
    : null;
  let fallback = 0,
    skipped = 0;
  for (const c of cells.values()) {
    const fit = fitCell(c.mask, c.center);
    if (fit) {
      put(c.pos, fit.state);
      roles[fit.role]++;
      if (fit.fallback) fallback++;
    } else if (c.mask) skipped++;
  }
  if (smart) {
    if (skipped) plan.warnings.push(`有 ${skipped} 格薄边界不能用可用变体表达，未额外填成方块`);
    if (fallback) plan.warnings.push(`边界有 ${fallback} 格不能用现有半砖/楼梯表达，保留主体方块`);
    plan.warnings.push('边界按半格采样拟合；请检查薄壁与空腔');
  }
  plan.overlap = {
    allPositions: [...overlaps.values()],
    count: overlaps.size,
    positions: [...overlaps.values()].slice(0, 256),
    mode: config.sweepOverlap || 'merge',
    separation,
  };
  if (overlaps.size) {
    plan.warnings.push(`相隔较远的轨道片段在 ${overlaps.size} 格位置重叠；请检查空腔与接头`);
    if (config.sweepOverlap === 'stop')
      plan.blocked = {
        code: 'SWEEP_SELF_OVERLAP',
        message: '检测到扫掠自重叠；调整路径或明确选择合并相交体积',
      };
  }
  return { usedRoles: roles, fallback };
}

export function sweepSurfacePositions(plan) {
  const out = [];
  for (const s of plan.segments) {
    const [a, b] = s.rings;
    for (let j = 0; j < a.length; j++) {
      const k = (j + 1) % a.length;
      out.push(...a[j], ...a[k], ...b[k], ...a[j], ...b[k], ...b[j]);
    }
  }
  return new Float32Array(out);
}

function resamplePolygon(poly, count = 64) {
  const lengths = poly.map((p, i) =>
      Math.hypot(...p.map((n, a) => n - poly[(i + 1) % poly.length][a])),
    ),
    total = lengths.reduce((a, b) => a + b, 0);
  if (!total) throw Error('截面没有有效周长');
  return Array.from({ length: count }, (_, i) => {
    let d = (total * i) / count,
      j = 0;
    while (j < lengths.length - 1 && d > lengths[j]) d -= lengths[j++];
    const t = d / (lengths[j] || 1);
    return poly[j].map((n, a) => n + (poly[(j + 1) % poly.length][a] - n) * t);
  });
}
function matchPolygon(a, b) {
  const center = (p) => [0, 1].map((i) => p.reduce((n, q) => n + q[i], 0) / p.length),
    ca = center(a),
    cb = center(b),
    scale = (p, c) =>
      Math.sqrt(p.reduce((n, q) => n + (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2, 0) / p.length) || 1,
    sa = scale(a, ca),
    sb = scale(b, cb);
  let best = b,
    score = Infinity;
  for (const reverse of [false, true])
    for (let shift = 0; shift < b.length; shift++) {
      const p = b.map((_, i) => b[(reverse ? b.length - 1 - i + shift : i + shift) % b.length]),
        cost = p.reduce(
          (n, q, i) =>
            n +
            ((q[0] - cb[0]) / sb - (a[i][0] - ca[0]) / sa) ** 2 +
            ((q[1] - cb[1]) / sb - (a[i][1] - ca[1]) / sa) ** 2,
          0,
        );
      if (cost < score) {
        score = cost;
        best = p;
      }
    }
  return best;
}
export function prepareVariableSweep(path, sections, references = [], config = {}) {
  if (config.seamMode !== undefined && !['auto', 'manual'].includes(config.seamMode))
    throw Error('请选择自动或手动截面起点匹配');
  if (!sections.length) throw Error('请选择闭合截面');
  if (sections.length === 1)
    return prepareProfileSweep(path, sections[0], references[0], {
      ...config,
      anchorStation: config.profileStations?.[0] ?? null,
    });
  const plans = sections.map((p, i) =>
      prepareProfileSweep(path, p, references[i], {
        ...config,
        anchorStation: config.profileStations?.[i] ?? null,
      }),
    ),
    base = plans[0],
    stations = config.profileStations
      ? config.profileStations.map((n, i) => n ?? plans[i]?.anchorStation)
      : plans.map((p) => p.anchorStation);
  if (
    stations.length !== sections.length ||
    stations.some((t) => !Number.isFinite(t) || t < 0 || t > 1)
  )
    throw Error('截面位置比例需要与截面数量一致，范围为 0–1');
  const count = config.profileSamples ?? 64;
  if (!Number.isInteger(count) || count < 8 || count > 4096)
    throw Error('截面匹配采样数需要 8–4096');
  const entries = plans
    .map((plan, i) => {
      const distance = stations[i] * base.totalLength,
        at = base.segments.find((s) => distance <= s.start + s.length) || base.segments.at(-1),
        own = plan.segments.find((s) => distance <= s.start + s.length) || plan.segments.at(-1),
        c = dot(own.frame.u, at.frame.u),
        sn = dot(own.frame.u, at.frame.v);
      return {
        distance,
        poly: shiftPolygon(
          resamplePolygon(
            plan.poly.map((p) => [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]),
            count,
          ),
          config.profileSeams?.[i],
        ),
      };
    })
    .sort((a, b) => a.distance - b.distance);
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].distance - entries[i - 1].distance < 1e-4)
      throw Error('多个截面位于同一轨道位置，请沿路径移开或指定 profileStations');
    if (config.seamMode !== 'manual')
      entries[i].poly = matchPolygon(entries[i - 1].poly, entries[i].poly);
  }
  const polyAt = (distance) => {
    if (distance <= entries[0].distance) return entries[0].poly;
    if (distance >= entries.at(-1).distance) return entries.at(-1).poly;
    const b = entries.find((e) => distance <= e.distance),
      a = entries[entries.indexOf(b) - 1];
    let t = (distance - a.distance) / (b.distance - a.distance);
    if (config.smooth) t = t * t * (3 - 2 * t);
    return a.poly.map((p, i) => p.map((n, j) => n + (b.poly[i][j] - n) * t));
  };
  const segments = [];
  for (const s of base.segments) {
    const divisions = Math.max(1, Math.ceil(s.length)),
      cuts = [
        s.start,
        s.start + s.length,
        ...entries
          .map((e) => e.distance)
          .filter((d) => d > s.start + 1e-8 && d < s.start + s.length - 1e-8),
        ...Array.from(
          { length: divisions - 1 },
          (_, i) => s.start + (s.length * (i + 1)) / divisions,
        ),
      ]
        .sort((a, b) => a - b)
        .filter((d, i, a) => !i || d - a[i - 1] > 1e-8);
    for (let i = 0; i < cuts.length - 1; i++) {
      const start = cuts[i],
        end = cuts[i + 1],
        a = s.a.map((n, j) => n + s.normal[j] * (start - s.start)),
        b = s.a.map((n, j) => n + s.normal[j] * (end - s.start)),
        startNormal = i === 0 ? s.startNormal : s.normal,
        endNormal = i === cuts.length - 2 ? s.endNormal : s.normal,
        rings = [[], []];
      for (const [idx, distance, normal, origin] of [
        [0, start, startNormal, a],
        [1, end, endNormal, b],
      ])
        for (const p of polyAt(distance)) {
          const q = s.frame.u.map((n, j) => n * p[0] + s.frame.v[j] * p[1]),
            t = -dot(q, normal) / dot(s.normal, normal);
          rings[idx].push(origin.map((n, j) => n + q[j] + s.normal[j] * t));
        }
      segments.push({
        ...s,
        a,
        b,
        start,
        length: end - start,
        frame: { ...s.frame, origin: a },
        startNormal,
        endNormal,
        rings,
      });
    }
  }
  return {
    ...base,
    segments,
    poly: entries[0].poly,
    polyAt,
    stations: entries.map((e) => e.distance / base.totalLength),
    warnings: [
      ...new Set(plans.flatMap((p) => p.warnings)),
      '多截面按轨道位置排序并匹配闭合起点；检查不相似轮廓的过渡与自交',
    ],
  };
}

function shiftPolygon(poly, seam) {
  if (!seam) return poly;
  const shift = seam.shift ?? 0;
  if (!Number.isFinite(shift) || shift < 0 || shift > 1) throw Error('截面起点比例需要 0–1');
  const offset = Math.round(shift * poly.length) % poly.length;
  return poly.map(
    (_, i) => poly[(seam.reverse ? poly.length - 1 - i + offset : i + offset) % poly.length],
  );
}
