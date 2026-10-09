// Structure entity wrappers carry local position and block anchor; their NBT stays opaque.
export function cropStructureEntities(entities, min, max) {
  const selected = [];
  let unlocated = 0;
  for (const original of entities || []) {
    const position = original.v?.pos;
    const values = position?.t === 9 && position.v?.[0] === 6 ? position.v[1] : null;
    if (
      original.t !== 10 ||
      !Array.isArray(values) ||
      values.length !== 3 ||
      values.some((value) => !Number.isFinite(value))
    ) {
      unlocated++;
      continue;
    }
    if (!values.every((value, axis) => value >= min[axis] && value < max[axis] + 1)) continue;
    const entity = structuredClone(original);
    entity.v.pos.v[1] = values.map((value, axis) => value - min[axis]);
    const anchor = entity.v.blockPos;
    if (anchor?.t === 9 && anchor.v[0] === 3 && anchor.v[1].length === 3)
      anchor.v[1] = anchor.v[1].map((value, axis) => value - min[axis]);
    selected.push(entity);
  }
  return { entities: selected, unlocated };
}
