export function fallbackStateChoices(id) {
  const name = id.split(':')[1];
  if (['create:mechanical_bearing', 'create:windmill_bearing', 'create:water_wheel'].includes(id))
    return { facing: ['north', 'east', 'south', 'west', 'up', 'down'] };
  if (['create:cogwheel', 'create:large_cogwheel', 'create:large_water_wheel'].includes(id))
    return { axis: ['y', 'x', 'z'] };
  if (/stairs$/.test(name))
    return {
      facing: ['north', 'east', 'south', 'west'],
      half: ['bottom', 'top'],
      shape: ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'],
      waterlogged: ['false', 'true'],
    };
  if (/slab$/.test(name))
    return { type: ['bottom', 'top', 'double'], waterlogged: ['false', 'true'] };
  if (/log$|pillar$|shaft$/.test(name)) return { axis: ['y', 'x', 'z'] };
  return {};
}

// Model predicates describe useful choices, not a complete runtime state schema.
export function resourceStateChoices(raw) {
  const choices = {};
  const add = (key, value) => {
    choices[key] ||= [];
    for (const item of String(value).split('|'))
      if (item && !choices[key].includes(item)) choices[key].push(item);
  };
  for (const variant of Object.keys(raw.variants || {}))
    for (const assignment of variant.split(',')) {
      const [key, value] = assignment.split('=');
      if (value) add(key, value);
    }
  const condition = (when) => {
    for (const [key, value] of Object.entries(when || {})) {
      if (['OR', 'AND'].includes(key) && Array.isArray(value)) value.forEach(condition);
      else if (['string', 'boolean', 'number'].includes(typeof value)) add(key, value);
    }
  };
  for (const part of raw.multipart || []) condition(part.when);
  return choices;
}
