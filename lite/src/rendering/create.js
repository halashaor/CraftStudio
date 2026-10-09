// Create 6.0.8 adapter. Derived rendering rules: commit 5f1b407 (MIT code).
// Official assets stay in the user's selected JAR/resource pack. No game simulation.
import { plain, stateKey } from '../minecraft/codec.js';
import { coordKey } from '../core/site.js';
import { buildMesh } from './mesh.js';
const DIR = {
  east: { axis: 'x', sign: 1 },
  west: { axis: 'x', sign: -1 },
  up: { axis: 'y', sign: 1 },
  down: { axis: 'y', sign: -1 },
  south: { axis: 'z', sign: 1 },
  north: { axis: 'z', sign: -1 },
};
const Y_ORIENT = {
  up: { x: 0, y: 0 },
  down: { x: 180, y: 0 },
  north: { x: 90, y: 0 },
  south: { x: 90, y: 180 },
  east: { x: 90, y: 90 },
  west: { x: 90, y: 270 },
};
const Z_ORIENT = {
  south: { x: 0, y: 0 },
  north: { x: 0, y: 180 },
  east: { x: 0, y: 270 },
  west: { x: 0, y: 90 },
  up: { x: 90, y: 0 },
  down: { x: 270, y: 0 },
};
const OPP = { east: 'west', west: 'east', up: 'down', down: 'up', south: 'north', north: 'south' };
export function unpackBlockPos(value) {
  const n = BigInt.asUintN(64, BigInt(value));
  return [
    Number(BigInt.asIntN(26, n >> 38n)),
    Number(BigInt.asIntN(12, n & 4095n)),
    Number(BigInt.asIntN(26, (n >> 12n) & 67108863n)),
  ];
}
export function rotationOffset(state, axis, worldPos, shaft = false) {
  const sum = worldPos.reduce((n, v, a) => n + ('xyz'[a] === axis ? 0 : v), 0);
  if (sum % 2 === 0) return 22.5;
  return !shaft && state.Name.includes('large_cogwheel') ? 11.25 : 0;
}
export const kineticAngle = (seconds, rpm, offset = 0) => offset + seconds * rpm * 6;
function nbt(tag) {
  return tag ? plain(tag) : {};
}
export function kineticState(block, state, origin) {
  const d = nbt(block.nbt),
    rpm = typeof d.Speed === 'number' && Number.isFinite(d.Speed) ? d.Speed : null,
    facing = state.Properties?.facing || 'up',
    axis = state.Properties?.axis || DIR[facing]?.axis || 'y';
  return {
    axis,
    rpm,
    known: rpm !== null,
    savedAngle: typeof d.Angle === 'number' ? d.Angle : 0,
    running: d.Running === undefined ? null : !!d.Running,
    worldPos: block.pos.map((v, a) => v + origin[a]),
    network: d.Network || null,
  };
}
const WHOLE = new Set([
  'create:shaft',
  'create:cogwheel',
  'create:large_cogwheel',
  'create:large_water_wheel',
]);
const BEARINGS = new Set([
  'create:mechanical_bearing',
  'create:windmill_bearing',
  'create:clockwork_bearing',
]);
export function kineticSpec(state) {
  if (WHOLE.has(state.Name)) return { kind: 'whole' };
  if (BEARINGS.has(state.Name)) return { kind: 'bearing' };
  if (state.Name === 'create:water_wheel') return { kind: 'waterwheel' };
  return null;
}
function simplifiedPartial(state, kind) {
  const face = () =>
    Object.fromEntries(
      ['east', 'west', 'up', 'down', 'north', 'south'].map((d) => [d, { texture: null }]),
    );
  let boxes =
    kind === 'shaft'
      ? [
          [
            [6, 6, 8],
            [10, 10, 16],
          ],
        ]
      : kind === 'bearing'
        ? [
            [
              [0, 12, 0],
              [16, 16, 16],
            ],
          ]
        : [
            [
              [6, 0, 6],
              [10, 16, 10],
            ],
            [
              [-8, 6, 6],
              [24, 10, 10],
            ],
            [
              [6, 6, -8],
              [10, 10, 24],
            ],
          ];
  return {
    id: state.Name,
    parts: [{ x: 0, y: 0, elements: boxes.map(([from, to]) => ({ from, to, faces: face() })) }],
    alpha: 'opaque',
    full: false,
    missing: true,
    issues: ['此运动部件为简化几何；附加 Create JAR 可读取原版 partial 模型。'],
  };
}
function part(resources, name, orientation, state, kind) {
  const model = resources.partial(name, orientation);
  if (!model.missing) return model;
  const fallback = simplifiedPartial(state, kind);
  fallback.parts[0].x = orientation.x || 0;
  fallback.parts[0].y = orientation.y || 0;
  return fallback;
}
function modelGeometry(model, state) {
  const b = { pos: [0, 0, 0], state: 0 },
    fake = { cells: new Map([[0, b]]), overlay: new Map(), palette: [state] };
  const resources = { model: () => model };
  const mesh = buildMesh(fake, resources);
  for (const bucket of mesh.buckets)
    for (let i = 0; i < bucket.positions.length; i++) bucket.positions[i] -= 0.5;
  return mesh;
}
export function capturedContraptions(site, { original = false } = {}) {
  const out = [],
    unsupported = [];
  for (let index = 0; index < (site.base.entities || []).length; index++) {
    const entry = nbt(site.base.entities[index]),
      e = entry.nbt || {},
      c = e.Contraption;
    if (!c) continue;
    try {
      const format = c.Blocks,
        palette = format?.Palette,
        list = format?.BlockList;
      if (!Array.isArray(palette) || !Array.isArray(list)) throw Error('旧版或未知 Blocks 格式');
      const blocks = list.map((row) => {
          if (!palette[row.State]) throw Error('装置调色板越界');
          return { pos: unpackBlockPos(row.Pos), state: row.State, nbt: row.Data || null };
        }),
        pos = entry.pos || e.Pos?.map((v, a) => v - site.origin[a]);
      if (!pos?.every(Number.isFinite)) throw Error('缺少有效实体位姿');
      const axis = typeof e.Axis === 'string' ? e.Axis.toLowerCase() : null,
        relative = e.ControllerRelative,
        controller = Array.isArray(relative)
          ? pos.map((v, a) => Math.floor(v) + relative[a])
          : null,
        controllerBlock = controller ? site.at(controller, original) : null,
        controllerData = controllerBlock ? nbt(controllerBlock.nbt) : {};
      const bearing = c.Type === 'create:bearing';
      let rpm = typeof controllerData.Speed === 'number' ? controllerData.Speed : null;
      if (
        bearing &&
        controllerData.id === 'create:windmill_bearing' &&
        typeof controllerData.LastGenerated === 'number' &&
        rpm !== 0
      )
        rpm = controllerData.LastGenerated;
      if (e.Stalled || c.Stalled || controllerData.Running === 0) rpm = 0;
      out.push({
        id: 'contraption:' + index,
        type: c.Type,
        position: pos,
        axis: ['x', 'y', 'z'].includes(axis) ? axis : null,
        savedAngle: e.Angle || 0,
        rpm: bearing ? rpm : null,
        motion: bearing ? 'bearing' : 'captured-pose',
        stalled: !!e.Stalled,
        palette,
        blocks,
        controller,
        index,
        notes: bearing ? [] : ['仅恢复捕获的位姿；平移、车厢和运动行为需要游戏运行时状态。'],
      });
    } catch (error) {
      unsupported.push({ index, id: e.id, reason: error.message });
    }
  }
  return { items: out, unsupported };
}
export class CreateScene {
  constructor() {
    this.site = null;
    this.resources = null;
    this.resourceVersion = -1;
    this.parts = new Map();
    this.baseParts = new Map();
    this.geometry = new Map();
    this.sent = new Set();
    this.changed = new Set();
    this.entityCache = null;
    this.mode = null;
  }
  invalidate() {
    this.site = null;
  }
  changedCells(site) {
    for (const p of site.changedPositions) this.changed.add(coordKey(...p));
    if (site.changedPositions.length) this.entityCache = null;
  }
  render(
    site,
    resources,
    { cut = 4095, mode = 'after', enabled = true, showExisting = true } = {},
  ) {
    const reset =
      this.site !== site ||
      this.resources !== resources ||
      this.resourceVersion !== resources.version;
    const definitions = {},
      instances = [],
      warnings = [];
    if (reset) {
      this.parts.clear();
      this.baseParts.clear();
      this.geometry.clear();
      this.sent.clear();
      this.entityCache = null;
    }
    if (this.mode !== mode) this.entityCache = null;
    const addModel = (id, model, state) => {
      if (!this.geometry.has(id)) this.geometry.set(id, modelGeometry(model, state));
      if (!this.sent.has(id)) {
        definitions[id] = this.geometry.get(id);
        this.sent.add(id);
      }
      for (const issue of model.issues || []) warnings.push(state.Name + '：' + issue);
    };
    if (reset) {
      for (const [k, b] of site.cells)
        if (kineticSpec(site.palette[b.state])) {
          this.parts.set(k, b);
          this.baseParts.set(k, b);
        }
      for (const [k, b] of site.overlay)
        if (b.state >= 0 && kineticSpec(site.palette[b.state])) this.parts.set(k, b);
        else this.parts.delete(k);
    }
    if (enabled && mode !== 'removed') {
      // Cache the small kinetic set; ordinary painting does not rescan the entire terrain.
      for (const k of this.changed) {
        const b = site.at([k % 4096, Math.floor(k / 16777216), Math.floor(k / 4096) % 4096]);
        if (b && kineticSpec(site.palette[b.state])) this.parts.set(k, b);
        else this.parts.delete(k);
      }
      this.changed.clear();
      for (const [k, base] of mode === 'before' ? this.baseParts : this.parts) {
        const b = mode === 'before' ? site.cells.get(k) : site.at(base.pos);
        if (!b || b.pos[1] > cut || (!showExisting && !site.overlay.has(k))) continue;
        const state = site.palette[b.state],
          spec = kineticSpec(state);
        if (!spec) continue;
        const data = kineticState(b, state, site.origin),
          orientation = state.Properties?.axis
            ? {
                x: state.Properties.axis === 'y' ? 0 : 90,
                y: state.Properties.axis === 'x' ? 90 : state.Properties.axis === 'z' ? 180 : 0,
              }
            : Y_ORIENT[state.Properties?.facing || 'up'];
        const normalOffset = rotationOffset(state, data.axis, data.worldPos);
        const emit = (label, model, savedAngle = normalOffset, rpm = data.rpm) => {
          const key = label + '|' + stateKey(state);
          addModel(key, model, state);
          instances.push({
            id: 'block:' + k + ':' + label,
            model: key,
            owner: b.pos,
            position: b.pos.map((v) => v + 0.5),
            axis: data.axis,
            rpm,
            savedAngle,
            kind: spec.kind,
            state,
            known: rpm !== null,
          });
        };
        if (spec.kind === 'whole') {
          if (state.Name === 'create:large_cogwheel') {
            emit(
              'large-gear',
              part(resources, 'create:block/large_cogwheel_shaftless', orientation, state, 'gear'),
            );
            emit(
              'large-shaft',
              part(resources, 'create:block/cogwheel_shaft', orientation, state, 'shaft'),
              rotationOffset(state, data.axis, data.worldPos, true),
            );
          } else if (state.Name === 'create:large_water_wheel')
            emit(
              'large-water-wheel',
              part(resources, 'create:block/large_water_wheel/block', orientation, state, 'wheel'),
            );
          else emit('rotor', resources.model(state));
        } else if (spec.kind === 'waterwheel')
          emit(
            'waterwheel',
            part(resources, 'create:block/water_wheel/wheel', orientation, state, 'wheel'),
          );
        else if (spec.kind === 'bearing') {
          const face = state.Properties?.facing || 'up';
          emit(
            'bearing-head',
            part(
              resources,
              face === 'up' && state.Name === 'create:windmill_bearing'
                ? 'create:block/bearing/top_wooden'
                : state.Name === 'create:windmill_bearing'
                  ? 'create:block/bearing/top_wooden'
                  : 'create:block/bearing/top',
              Y_ORIENT[face],
              state,
              'bearing',
            ),
            data.savedAngle,
            data.running === false ? 0 : data.rpm,
          );
          emit(
            'bearing-shaft',
            part(resources, 'create:block/shaft_half', Z_ORIENT[OPP[face]], state, 'shaft'),
          );
        }
      }
      const captures =
        this.entityCache ||
        (this.entityCache = capturedContraptions(site, { original: mode === 'before' }));
      for (const c of captures.items) {
        if (c.position[1] > cut || !showExisting) continue;
        const id = c.id + '|' + resources.version;
        if (!this.geometry.has(id)) {
          const fake = {
            cells: new Map(c.blocks.map((b) => [coordKey(...b.pos), b])),
            overlay: new Map(),
            palette: c.palette,
          };
          const mesh = buildMesh(fake, resources);
          for (const bucket of mesh.buckets)
            for (let i = 0; i < bucket.positions.length; i++) bucket.positions[i] -= 0.5;
          this.geometry.set(id, mesh);
        }
        if (!this.sent.has(id)) {
          definitions[id] = this.geometry.get(id);
          this.sent.add(id);
        }
        instances.push({
          id: c.id,
          model: id,
          position: c.position.map((v) => v + 0.5),
          axis: c.axis,
          rpm: c.rpm,
          savedAngle: c.savedAngle,
          kind: c.motion,
          readOnly: true,
          state: { Name: c.type },
          blockCount: c.blocks.length,
          known: c.rpm !== null,
          controller: c.controller,
        });
        warnings.push(...c.notes);
      }
      for (const c of captures.unsupported) warnings.push(c.id + '：' + c.reason);
    }
    this.site = site;
    this.resources = resources;
    this.resourceVersion = resources.version;
    this.mode = mode;
    const textureKeys = new Set();
    for (const g of Object.values(definitions))
      for (const b of g.buckets) if (b.texture) textureKeys.add(b.texture);
    const textures = Object.fromEntries([...textureKeys].map((k) => [k, resources.texture(k)]));
    return {
      reset,
      instances,
      definitions,
      textures,
      warnings: [...new Set(warnings)],
      stats: {
        rotatingParts: instances.filter((i) => !i.readOnly).length,
        contraptions: instances.filter((i) => i.readOnly).length,
        knownSpeeds: instances.filter((i) => i.known).length,
        unknownSpeeds: instances.filter((i) => !i.known).length,
      },
    };
  }
}
