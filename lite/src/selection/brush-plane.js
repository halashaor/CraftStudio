// A grazing ray cannot reliably position a stroke on its picked face plane.
export function brushPlaneAxis(faceAxis, direction, mode = 'auto') {
  const fixed = { xz: 1, xy: 2, yz: 0 };
  if (Object.hasOwn(fixed, mode)) return fixed[mode];
  if (mode === 'surface') return faceAxis;
  const view = [0, 1, 2].reduce(
    (a, b) => (Math.abs(direction[b]) > Math.abs(direction[a]) ? b : a),
    0,
  );
  return mode === 'view' || Math.abs(direction[faceAxis]) < 0.15 ? view : faceAxis;
}
