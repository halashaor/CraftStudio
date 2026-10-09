import { selectionPredicate } from '../selection/selection-mask.js';
import { componentCell, sameComponentCell } from '../components/component-state.js';
import { composeInstancePose } from '../components/instance-transform.js';
import { coordKey, Site } from '../core/site.js';
const block = (Name, Properties) => ({
  Name: Name.includes(':') ? Name : 'minecraft:' + Name,
  ...(Properties ? { Properties } : {}),
});
export const defaultDesign = () => ({
  objects: [],
  prefabs: [],
  animations: {},
  cameras: [],
  lighting: 'day',
});
export function design(site) {
  return site.design || (site.design = defaultDesign());
}
function* selectionCandidates(site, min, max) {
  const inside = (b) => b.pos.every((n, a) => n >= min[a] && n <= max[a]);
  if (!site.baseChunks) {
    for (const b of site.cells.values()) if (inside(b)) yield b;
    for (const b of site.overlay.values())
      if (!site.cells.has(coordKey(...b.pos)) && inside(b)) yield b;
    return;
  }
  for (const key of new Set([...site.baseChunks.keys(), ...site.overlayChunks.keys()])) {
    const start = key.split(',').map((n) => Number(n) * 16);
    if (start.some((n, a) => n > max[a] || n + 15 < min[a])) continue;
    for (const b of site.baseChunks.get(key)?.values() || []) if (inside(b)) yield b;
    for (const b of site.overlayChunks.get(key)?.values() || [])
      if (!site.cells.has(coordKey(...b.pos)) && inside(b)) yield b;
  }
}
function selectionContext(site, min, max, { all = false, keys = null, regions = null } = {}) {
  if (
    min?.length !== 3 ||
    max?.length !== 3 ||
    [...min, ...max].some((n) => !Number.isInteger(n)) ||
    min.some((n, a) => n < 0 || n > max[a]) ||
    max.some((n) => n >= 4096)
  )
    throw Error('请选择有效的整数范围');
  const matches = regions ? selectionPredicate({ min, max, regions }) : null;
  const object =
    !all &&
    !regions &&
    site.design?.objects.find(
      (o) => o.min.every((n, a) => n === min[a]) && o.max.every((n, a) => n === max[a]),
    );
  const members = keys
    ? new Set(keys.map((p) => (Array.isArray(p) ? coordKey(...p) : p)))
    : object?.cells
      ? new Set(object.cells)
      : null;
  return {
    object,
    accepts: (b) =>
      (!matches || matches(b.pos)) &&
      (members ? members.has(coordKey(...b.pos)) : !object || site.overlay.has(coordKey(...b.pos))),
  };
}
function* matchingSelectionCells(site, min, max, context) {
  for (const candidate of selectionCandidates(site, min, max)) {
    const b = site.at(candidate.pos);
    if (b && context.accepts(b)) yield b;
  }
}
export function* selectionCellValues(site, min, max, options = {}) {
  yield* matchingSelectionCells(site, min, max, selectionContext(site, min, max, options));
}
export function selectionCells(site, min, max, options = {}) {
  const context = selectionContext(site, min, max, options),
    cells = [...matchingSelectionCells(site, min, max, context)];
  cells.sort((a, b) => a.pos[1] - b.pos[1] || a.pos[2] - b.pos[2] || a.pos[0] - b.pos[0]);
  return { cells, object: context.object };
}
export function selection(site, min, max, { all = false, keys = null, regions = null } = {}) {
  const { cells, object } = selectionCells(site, min, max, { all, keys, regions }),
    blocks = cells.map((b) => ({
      pos: b.pos.map((n, a) => n - min[a]),
      state: structuredClone(site.palette[b.state]),
      ...(b.nbt ? { nbt: structuredClone(b.nbt) } : {}),
    }));
  const animation =
    object && site.design.animations[object.id]
      ? structuredClone(site.design.animations[object.id])
      : null;
  if (animation)
    for (const k of ['center', 'min', 'max'])
      if (animation[k]) animation[k] = animation[k].map((n, a) => n - min[a]);
  return {
    schema: 'craftstudio-prefab/1',
    name: '选区构件',
    size: max.map((n, a) => n - min[a] + 1),
    blocks,
    ...(animation ? { animation } : {}),
  };
}
export function rotateState(state, turn = 0, mirror = false) {
  const s = structuredClone(state),
    p = s.Properties;
  if (!p) return s;
  const directions = ['north', 'east', 'south', 'west'];
  for (const key of ['facing', 'horizontal_facing'])
    if (directions.includes(p[key])) {
      let i = directions.indexOf(p[key]);
      if (mirror) i = (4 - i) % 4;
      p[key] = directions[(i + turn + 4) % 4];
    }
  if (turn % 2 && ['x', 'z'].includes(p.axis)) p.axis = p.axis === 'x' ? 'z' : 'x';
  if (p.rotation !== undefined)
    p.rotation = String(((mirror ? -Number(p.rotation) : Number(p.rotation)) + turn * 4 + 16) % 16);
  if (mirror) {
    if (p.hinge) p.hinge = p.hinge === 'left' ? 'right' : 'left';
    if (p.shape) p.shape = p.shape.replace(/left|right/g, (v) => (v === 'left' ? 'right' : 'left'));
  }
  const edges = {};
  for (const d of directions)
    if (d in p) {
      let i = directions.indexOf(d);
      if (mirror) i = (4 - i) % 4;
      edges[directions[(i + turn + 4) % 4]] = p[d];
      delete p[d];
    }
  Object.assign(p, edges);
  return s;
}
export function insertOperations(
  prefab,
  at,
  { turn = 0, mirror = false, count = 1, step = [0, 0, 0] } = {},
) {
  if (prefab.schema !== 'craftstudio-prefab/1' || !prefab.blocks?.length)
    throw Error('构件没有方块');
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 100 ||
    prefab.blocks.length * count > 1000000
  )
    throw Error('阵列数量过大');
  turn = ((turn % 4) + 4) % 4;
  return Array.from({ length: count }, (_, i) =>
    prefab.blocks.map((b) => {
      let [x, y, z] = b.pos;
      let [w, , l] = prefab.size;
      if (mirror) x = w - 1 - x;
      for (let t = 0; t < turn; t++) {
        [x, z] = [l - 1 - z, x];
        [w, l] = [l, w];
      }
      return {
        type: 'set',
        pos: [x, y, z].map((n, a) => n + at[a] + step[a] * i),
        state: rotateState(b.state, turn, mirror),
        ...(b.nbt ? { nbt: b.nbt } : {}),
        reason: '构件 ' + prefab.name,
      };
    }),
  ).flat();
}
export function builder(
  kind,
  {
    at = [0, 0, 0],
    width = 11,
    depth = 9,
    height = 5,
    state = block('stone_bricks'),
    roof = block('dark_oak_planks'),
    name = kind,
  } = {},
) {
  for (const n of [...at, width, depth, height])
    if (!Number.isInteger(n)) throw Error('建筑参数需要整数');
  if (width < 3 || depth < 3 || height < 1 || width > 100 || depth > 100 || height > 100)
    throw Error('建筑尺寸不合适');
  const cells = new Map(),
    put = (x, y, z, s = state) => cells.set(coordKey(x, y, z), { pos: [x, y, z], state: s });
  if (kind === 'wall')
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) put(x, y, 0);
  else if (kind === 'stairs' || kind === 'path')
    for (let z = 0; z < depth; z++)
      for (let x = 0; x < width; x++)
        put(
          x,
          kind === 'stairs' ? z : 0,
          z,
          kind === 'stairs'
            ? block('stone_brick_stairs', {
                facing: 'south',
                half: 'bottom',
                shape: 'straight',
                waterlogged: 'false',
              })
            : state,
        );
  else if (kind === 'arch') {
    const radius = (width - 1) / 2;
    for (let x = 0; x < width; x++) {
      const y = Math.round(height + Math.sqrt(Math.max(0, radius * radius - (x - radius) ** 2)));
      put(x, y, 0);
    }
    for (const x of [0, width - 1]) for (let y = 0; y <= height; y++) put(x, y, 0);
  } else if (kind === 'roof')
    for (let z = 0; z < depth; z++)
      for (let x = 0; x < width; x++) put(x, Math.min(x, width - 1 - x), z, roof);
  else if (kind === 'house' || kind === 'windmill') {
    for (let x = 0; x < width; x++)
      for (let z = 0; z < depth; z++) put(x, 0, z, block('spruce_planks'));
    for (let y = 1; y <= height; y++)
      for (let x = 0; x < width; x++)
        for (let z = 0; z < depth; z++)
          if (x === 0 || z === 0 || x === width - 1 || z === depth - 1) {
            const corner = (x === 0 || x === width - 1) && (z === 0 || z === depth - 1),
              window = !corner && y >= 2 && y <= 3 && (x % 4 === 2 || z % 4 === 2);
            put(
              x,
              y,
              z,
              corner
                ? block('stripped_spruce_log', { axis: 'y' })
                : window
                  ? block('glass_pane', {
                      north: 'false',
                      east: 'true',
                      south: 'false',
                      west: 'true',
                      waterlogged: 'false',
                    })
                  : state,
            );
          }
    const door = Math.floor(width / 2);
    for (let y = 1; y <= 2; y++)
      put(
        door,
        y,
        0,
        block('spruce_door', {
          facing: 'north',
          half: y === 1 ? 'lower' : 'upper',
          hinge: 'left',
          open: 'false',
          powered: 'false',
        }),
      );
    for (let z = 0; z < depth; z++)
      for (let x = 0; x < width; x++)
        put(
          x,
          height + 1 + Math.min(x, width - 1 - x),
          z,
          x === Math.floor(width / 2)
            ? roof
            : block(roof.Name.replace('_planks', '_stairs'), {
                facing: x < width / 2 ? 'east' : 'west',
                half: 'bottom',
                shape: 'straight',
                waterlogged: 'false',
              }),
        );
    for (const z of [0, depth - 1])
      for (let x = 1; x < width - 1; x++)
        for (let y = height + 1; y < height + 1 + Math.min(x, width - 1 - x); y++)
          put(
            x,
            y,
            z,
            x === Math.floor(width / 2) ? block('stripped_spruce_log', { axis: 'y' }) : state,
          );
    for (let z = 0; z < depth; z++)
      put(
        Math.floor(width / 2),
        height + 1 + Math.floor(width / 2),
        z,
        block('dark_oak_slab', { type: 'bottom', waterlogged: 'false' }),
      );
    for (let x = 1; x < width - 1; x++) {
      put(x, 1, 1, block('spruce_slab', { type: 'bottom', waterlogged: 'false' }));
    }
    put(1, 1, depth - 2, block('crafting_table'));
    put(2, 1, depth - 2, block('barrel', { facing: 'up', open: 'false' }));
    put(width - 2, 1, depth - 2, block('lantern', { hanging: 'false', waterlogged: 'false' }));
    if (kind === 'windmill') {
      const cx = Math.floor(width / 2),
        cy = height + 4;
      for (let d = -4; d <= 4; d++) {
        put(cx + d, cy, depth, block('create:white_sail', { facing: 'south' }));
        put(cx, cy + d, depth, block('create:white_sail', { facing: 'south' }));
      }
      put(cx, cy, depth, block('create:windmill_bearing', { facing: 'south' }));
    }
  } else throw Error('不支持生成器 ' + kind);
  const blocks = [...cells.values()],
    size = [0, 1, 2].map((a) => Math.max(...blocks.map((b) => b.pos[a])) + 1),
    prefab = { schema: 'craftstudio-prefab/1', name, size, blocks };
  return {
    prefab,
    operations: insertOperations(prefab, at),
    min: at,
    max: at.map((n, a) => n + size[a] - 1),
  };
}
export function findSite(site, width, depth, avoid = []) {
  let best = null;
  for (let z = 2; z < site.base.size[2] - depth - 2; z += 2)
    for (let x = 2; x < site.base.size[0] - width - 2; x += 2) {
      if (
        avoid.some(
          (r) =>
            x < r.max[0] + 3 &&
            x + width > r.min[0] - 3 &&
            z < r.max[2] + 3 &&
            z + depth > r.min[2] - 3,
        )
      )
        continue;
      let low = 4095,
        high = 0,
        top = 0,
        valid = true;
      for (let dx = 0; dx < width; dx++)
        for (let dz = 0; dz < depth; dz++) {
          const c = site.column(x + dx, z + dz);
          if (c.ground === null || c.water !== null || c.top > c.ground + 1) {
            valid = false;
            break;
          }
          low = Math.min(low, c.ground);
          high = Math.max(high, c.ground);
          top = Math.max(top, c.top);
        }
      if (!valid || high - low > 7) continue;
      const score = (high - low) * 10 + high * 0.1;
      if (!best || score < best.score) best = { at: [x, top + 2, z], score, ground: [low, high] };
    }
  if (!best) throw Error('没有找到保留地形和植被的完整空地，请手动选址');
  return best;
}
export function buildOnSite(site, kind, params, policy) {
  const plan = builder(kind, params);
  let operations = plan.operations;
  if (kind === 'house' || kind === 'windmill') {
    const platform = site.platform(
      [plan.min[0], plan.min[2]],
      [plan.min[0] + params.width - 1, plan.min[2] + params.depth - 1],
      plan.min[1],
      block('stone_bricks'),
      4,
    );
    const supports = platform.operations.slice(1).filter((op) => {
      for (let y = op.min[1]; y <= op.max[1]; y++)
        if (site.at([op.min[0], y, op.min[2]], true)) return false;
      return true;
    });
    if (supports.length < 4) throw Error('可落地支柱不足，请调整选址');
    operations = [platform.operations[0], ...supports, ...operations];
  }
  if (kind === 'house' || kind === 'windmill') {
    const x = plan.min[0] + Math.floor(params.width / 2);
    for (let i = 1; i <= 8; i++) {
      const z = plan.min[2] - i,
        y = plan.min[1] - i + 1;
      if (z < 0 || y < 0) break;
      const c = site.column(x, z);
      if (c.ground === null || y <= c.ground || site.at([x, y, z], true)) break;
      operations.push({
        type: 'set',
        pos: [x, y, z],
        state: block('stone_brick_stairs', {
          facing: 'south',
          half: 'bottom',
          shape: 'straight',
          waterlogged: 'false',
        }),
        reason: '入口顺坡台阶',
      });
      if (c.ground + 1 < y)
        for (let sy = c.ground + 1; sy < y; sy++)
          if (!site.at([x, sy, z], true))
            operations.push({
              type: 'set',
              pos: [x, sy, z],
              state: block('stone_bricks'),
              reason: '入口支撑',
            });
    }
  }
  if (kind === 'windmill') {
    const x0 = plan.min[0] + params.width,
      z0 = plan.min[2] + 2,
      y = plan.min[1];
    let clear = true;
    for (let x = x0; x < x0 + 4; x++)
      for (let z = z0; z < z0 + params.depth - 4; z++) {
        const c = site.column(x, z);
        if (c.ground === null || c.water !== null || c.top >= y) clear = false;
      }
    if (clear)
      for (let x = x0; x < x0 + 4; x++)
        for (let z = z0; z < z0 + params.depth - 4; z++) {
          operations.push({
            type: 'set',
            pos: [x, y, z],
            state: block('spruce_planks'),
            reason: '庭院露台',
          });
          if (x === x0 + 3 || z === z0 || z === z0 + params.depth - 5)
            operations.push({
              type: 'set',
              pos: [x, y + 1, z],
              state: block('spruce_fence'),
              reason: '庭院栏杆',
            });
          if (x === x0 + 3 && (z === z0 || z === z0 + params.depth - 5)) {
            const c = site.column(x, z);
            for (let sy = c.ground + 1; sy < y; sy++)
              if (!site.at([x, sy, z], true))
                operations.push({
                  type: 'set',
                  pos: [x, sy, z],
                  state: block('stone_bricks'),
                  reason: '庭院支柱',
                });
          }
        }
  }
  const previous = structuredClone(design(site));
  site.operations(operations, policy);
  const object = {
    id: crypto.randomUUID(),
    name: params.name || kind,
    min: plan.min.map((n, a) =>
      Math.min(n, ...operations.map((o) => o.pos?.[a] ?? o.min?.[a] ?? n)),
    ),
    max: plan.max.map((n, a) =>
      Math.max(n, ...operations.map((o) => o.pos?.[a] ?? o.max?.[a] ?? n)),
    ),
    kind,
    cells: site.changedPositions.map((p) => coordKey(...p)),
    hidden: false,
    locked: false,
  };
  design(site).objects.push(object);
  if (site.undo.length) site.undo.at(-1).design = previous;
  if (kind === 'windmill')
    design(site).animations[object.id] = {
      type: 'rotate',
      axis: 'z',
      rpm: 12,
      center: [
        plan.min[0] + Math.floor(params.width / 2) + 0.5,
        plan.min[1] + params.height + 4 + 0.5,
        plan.min[2] + params.depth + 0.5,
      ],
      min: [plan.min[0], plan.min[1] + params.height, plan.min[2] + params.depth],
      max: plan.max,
    };
  return object;
}
export function transformSelection(
  site,
  {
    min,
    max,
    at,
    move = false,
    turn = 0,
    mirror = false,
    count = 1,
    step = [0, 0, 0],
    members = null,
    regions = null,
  },
  policy,
) {
  const prefab = selection(site, min, max, { keys: members, regions });
  if (prefab.blocks.some((b) => b.nbt) && (turn || mirror))
    throw Error('带方块实体的结构请使用原生蓝图，避免转向损坏关联数据');
  turn = ((turn % 4) + 4) % 4;
  const ops = insertOperations(prefab, at, { turn, mirror, count, step });
  if (move)
    ops.unshift(
      ...prefab.blocks.map((b) => {
        const pos = b.pos.map((n, a) => n + min[a]);
        return { type: 'erase', min: pos, max: pos, reason: '移动原选区' };
      }),
    );
  const previous = structuredClone(design(site)),
    keys = new Set(prefab.blocks.map((b) => coordKey(...b.pos.map((n, a) => n + min[a])))),
    objects = design(site).objects.filter((o) =>
      o.cells?.length
        ? o.cells.every((k) => keys.has(k))
        : o.min.every((n, a) => n === min[a]) && o.max.every((n, a) => n === max[a]),
    );
  const componentManual = new Map(
      objects.flatMap((o) =>
        (o.componentRecords || []).map((r) => [
          coordKey(...r.pos),
          r.manual || !sameComponentCell(componentCell(site, r.pos), r.after),
        ]),
      ),
    ),
    componentBefore = new Map(
      ops
        .filter((o) => o.type === 'set')
        .map((op) => {
          const b = site.at(op.pos);
          return [
            coordKey(...op.pos),
            move && keys.has(coordKey(...op.pos))
              ? null
              : b
                ? {
                    state: structuredClone(site.palette[b.state]),
                    nbt: structuredClone(b.nbt || null),
                  }
                : null,
          ];
        }),
    );
  site.operations(ops, policy);
  if (site.undo.length) site.undo.at(-1).design = previous;
  for (const object of objects) {
    const original = previous.objects.find((o) => o.id === object.id);
    for (let i = 0; i < count; i++) {
      const offset = at.map((n, a) => n + step[a] * i),
        point = (p, cell = true) => {
          let [x, y, z] = p.map((n, a) => n - min[a]),
            [w, , l] = prefab.size;
          if (mirror) x = w - (cell ? 1 : 0) - x;
          for (let t = 0; t < turn; t++) {
            [x, z] = [l - (cell ? 1 : 0) - z, x];
            [w, l] = [l, w];
          }
          return [x, y, z].map((n, a) => n + offset[a]);
        };
      const clone =
        move && i === 0
          ? object
          : {
              ...structuredClone(original),
              id: crypto.randomUUID(),
              name: object.name + ' · 副本',
            };
      const sourceCells =
          original.cells || prefab.blocks.map((b) => coordKey(...b.pos.map((n, a) => n + min[a]))),
        positions = sourceCells.map((k) =>
          point([k % 4096, Math.floor(k / 16777216), Math.floor(k / 4096) % 4096]),
        );
      clone.cells = positions.map((p) => coordKey(...p));
      clone.min = [0, 1, 2].map((a) => Math.min(...positions.map((p) => p[a])));
      clone.max = [0, 1, 2].map((a) => Math.max(...positions.map((p) => p[a])));
      if (move && i === 0 && original.instancePose) {
        clone.instancePose = composeInstancePose(
          original.instancePose,
          (p) => point(p),
          turn,
          mirror,
        );
        clone.instanceTransform = {
          turn: clone.instancePose.turn,
          mirror: clone.instancePose.mirror,
        };
        clone.componentRecords = (original.componentRecords || []).map((r) => {
          const pos = point(r.pos),
            b = site.at(pos);
          return {
            ...r,
            pos,
            manual: !!componentManual.get(coordKey(...r.pos)),
            before: componentBefore.get(coordKey(...pos)) || null,
            after: b
              ? {
                  state: structuredClone(site.palette[b.state]),
                  nbt: structuredClone(b.nbt || null),
                }
              : null,
          };
        });
      } else if (!move) {
        for (const key of [
          'instanceOf',
          'instanceTransform',
          'instancePose',
          'componentRecords',
          'componentRevision',
        ])
          delete clone[key];
      }
      if (!(move && i === 0)) design(site).objects.push(clone);
      const animation = previous.animations[original.id];
      if (animation) {
        const copy = structuredClone(animation);
        if (copy.center) copy.center = point(copy.center, false);
        if (copy.min && copy.max) {
          const corners = [point(copy.min), point(copy.max)];
          copy.min = [0, 1, 2].map((a) => Math.min(...corners.map((p) => p[a])));
          copy.max = [0, 1, 2].map((a) => Math.max(...corners.map((p) => p[a])));
        }
        if (turn % 2 && ['x', 'z'].includes(copy.axis)) copy.axis = copy.axis === 'x' ? 'z' : 'x';
        design(site).animations[clone.id] = copy;
      }
    }
  }
  return ops.length;
}
export function cropProject(site, min, max) {
  const p = site.project(),
    prefab = selection(site, min, max, { all: true });
  return {
    ...p,
    name: site.title + ' · 裁切',
    size: prefab.size,
    origin: site.origin.map((n, a) => n + min[a]),
    palette: site.palette,
    blocks: prefab.blocks.map((b) => ({ ...b, state: site.state(b.state) })),
    entities: [],
    metadata: { ...p.metadata, design: defaultDesign(), crop: { min, max, entitiesOmitted: true } },
    warnings: [...(p.warnings || []), '裁切保留方块实体；区域实体须用完整区域蓝图保留'],
  };
}
export function semantic(site, operations) {
  return operations.flatMap((op) => {
    if (op.type === 'build') return builder(op.kind, op.params).operations;
    if (op.type === 'insertPrefab') {
      const p = design(site).prefabs.find((p) => p.id === op.id);
      if (!p) throw Error('AI 指定的构件不存在');
      return insertOperations(p, op.at, op);
    }
    if (op.type === 'restyle') {
      const o = design(site).objects.find((o) => o.id === op.id);
      if (!o) throw Error('AI 指定的对象不存在');
      return selection(site, o.min, o.max)
        .blocks.filter((b) => b.state.Name === op.from)
        .map((b) => ({
          type: 'set',
          pos: b.pos.map((n, a) => n + o.min[a]),
          state: op.state,
          reason: 'AI 局部换材',
        }));
    }
    return [op];
  });
}

export function insertPrefab(site, p, at, options = {}, policy = {}) {
  const ops = insertOperations(p, at, options),
    previous = structuredClone(design(site));
  site.operations(ops, policy);
  if (site.undo.length) site.undo.at(-1).design = previous;
  const turn = (options.turn || 0) % 4,
    mirror = !!options.mirror,
    size = turn % 2 ? [p.size[2], p.size[1], p.size[0]] : p.size;
  for (let i = 0; i < (options.count || 1); i++) {
    const offset = at.map((n, a) => n + (options.step?.[a] || 0) * i),
      o = {
        id: crypto.randomUUID(),
        name: p.name || '构件',
        min: offset,
        max: offset.map((n, a) => n + size[a] - 1),
        cells: insertOperations(p, offset, { turn, mirror }).map((o) => coordKey(...o.pos)),
        kind: 'prefab',
      };
    design(site).objects.push(o);
    if (p.animation) {
      const a = structuredClone(p.animation),
        point = (pos, cell = false) => {
          let [x, y, z] = pos,
            [w, , l] = p.size;
          if (mirror) x = w - (cell ? 1 : 0) - x;
          for (let t = 0; t < turn; t++) {
            [x, z] = [l - (cell ? 1 : 0) - z, x];
            [w, l] = [l, w];
          }
          return [x, y, z].map((n, k) => n + offset[k]);
        };
      if (a.center) a.center = point(a.center);
      if (a.min && a.max) {
        const ends = [point(a.min, true), point(a.max, true)];
        a.min = [0, 1, 2].map((k) => Math.min(...ends.map((p) => p[k])));
        a.max = [0, 1, 2].map((k) => Math.max(...ends.map((p) => p[k])));
      }
      if (turn % 2 && ['x', 'z'].includes(a.axis)) a.axis = a.axis === 'x' ? 'z' : 'x';
      design(site).animations[o.id] = a;
    }
  }
  return ops.length;
}

export function pastePrefab(site, prefab, at, options = {}, policy = {}) {
  if (prefab.blocks.some((b) => b.nbt) && (options.turn || options.mirror))
    throw Error('带方块实体的构件旋转需使用原生蓝图，平移可保留数据');
  const mode = options.overlap || 'empty';
  if (!['empty', 'overwrite', 'replace'].includes(mode)) throw Error('未知重叠处理方式');
  const ops = insertOperations(prefab, at, options).filter((op) => {
    const exists = !!site.at(op.pos);
    return mode === 'empty' ? !exists : mode === 'replace' ? exists : true;
  });
  if (!ops.length) throw Error('没有可放置的位置，请移动预览或更改重叠方式');
  const previous = structuredClone(design(site));
  site.operations(ops, {
    ...policy,
    allowExisting: mode === 'empty' ? policy.allowExisting : true,
  });
  if (!site.changedPositions.length) throw Error('目标方块已经相同，无需重复放置');
  site.undo.at(-1).design = previous;
  const pos = site.changedPositions;
  design(site).objects.push({
    id: crypto.randomUUID(),
    name: prefab.name + ' · 粘贴',
    kind: 'prefab',
    cells: [...new Set(pos.map((p) => coordKey(...p)))],
    min: [0, 1, 2].map((a) => pos.reduce((n, p) => Math.min(n, p[a]), Infinity)),
    max: [0, 1, 2].map((a) => pos.reduce((n, p) => Math.max(n, p[a]), -Infinity)),
  });
  return pos.length;
}
