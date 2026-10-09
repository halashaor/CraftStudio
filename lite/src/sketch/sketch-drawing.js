import { validateFrame, sketchLocal, sketchWorld } from './workplane.js';
export function drawingPoints(kind, anchors, cursor, plane = 'xz', frame = null, spatial = false) {
  if (frame) {
    const f = validateFrame(frame);
    return drawingPoints(
      kind,
      anchors.map((p) => sketchLocal(p, f)),
      sketchLocal(cursor, f),
      'xz',
    ).map((p) => sketchWorld(p, f));
  }
  const [a, b, n] = { xz: [0, 2, 1], xy: [0, 1, 2], yz: [2, 1, 0] }[plane],
    start = anchors[0] || cursor,
    end = [...cursor];
  if (!spatial) end[n] = start[n];
  if (kind === 'bezier') {
    const dx = end[a] - start[a],
      dy = end[b] - start[b];
    return [
      start,
      ...[1 / 3, 2 / 3].map((t) => {
        const p = start.map((v, i) => v + (end[i] - v) * t);
        p[a] -= dy * 0.25;
        p[b] += dx * 0.25;
        return p;
      }),
      end,
    ].map((p) => [...p]);
  }
  if (kind === 'polygon' || kind === 'polyline' || kind === 'spline')
    return [...anchors, end].map((p) => [...p]);
  if (kind === 'arc') return [start, anchors[1] || end, end].map((p) => [...p]);
  if (kind === 'box') {
    end[n] += 6;
    return [[...start], end];
  }
  return [[...start], end];
}
