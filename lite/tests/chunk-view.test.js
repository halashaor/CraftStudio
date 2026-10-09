import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { Resources } from '../src/materials/resources.js';
import { ChunkMesher } from '../src/rendering/chunk-mesh.js';
import { chunkInView, modelViewMargin } from '../src/rendering/chunk-view.js';
const left = [
    [1, 0, 0, 0],
    [-1, 0, 0, 15],
  ],
  right = [
    [1, 0, 0, -48],
    [-1, 0, 0, 80],
  ];
function scene() {
  const p = emptyProject();
  p.size = [80, 4, 4];
  p.palette = [{ Name: 'minecraft:oak_planks' }];
  p.blocks = [
    { pos: [2, 1, 2], state: 0 },
    { pos: [50, 1, 2], state: 0 },
  ];
  return new Site(p);
}
test('view-driven meshing evicts geometry and loads the new view without mutating data', () => {
  const s = scene(),
    before = s.pack(),
    m = new ChunkMesher(),
    r = new Resources(),
    a = m.render(s, r, { viewPlanes: left });
  assert.equal(a.chunks.length, 1);
  assert.equal(a.stats.resident, 1);
  const b = m.render(s, r, { viewPlanes: right });
  assert.equal(b.reset, false);
  assert.ok(b.evicted.includes('0,0,0'));
  assert.ok(b.chunks.some((c) => c.key === '3,0,0'));
  assert.deepEqual(s.pack(), before);
  const all = m.render(s, r, {});
  assert.equal(all.stats.resident, 2);
});
test('off-view edits remain canonical and are rebuilt when their chunks become visible', () => {
  const s = scene(),
    m = new ChunkMesher(),
    r = new Resources();
  m.render(s, r, { viewPlanes: left });
  s.operations([{ type: 'set', pos: [51, 1, 2], state: { Name: 'minecraft:glass' } }], {});
  m.changed(s);
  assert.equal(m.render(s, r, { viewPlanes: left }).chunks.length, 0);
  const result = m.render(s, r, { viewPlanes: right });
  assert.ok(result.chunks.some((c) => c.key === '3,0,0'));
  assert.equal(s.palette[s.at([51, 1, 2]).state].Name, 'minecraft:glass');
  assert.equal(m.render(s, r, { viewPlanes: right }).chunks.length, 0);
});
test('chunk bounds use conservative plane intersection', () => {
  assert.equal(chunkInView('0,0,0', left), true);
  assert.equal(chunkInView('3,0,0', left), false);
  assert.equal(chunkInView('1,0,0', [[-1, 0, 0, 16]]), true);
});

test('oversized resource models crossing a chunk edge are kept visible', () => {
  const margin = modelViewMargin({
    parts: [
      {
        elements: [
          {
            from: [-800, 0, 0],
            to: [16, 16, 16],
            rotation: { origin: [8, 8, 8], axis: 'y', angle: 45, rescale: true },
          },
        ],
      },
    ],
  });
  assert.ok(margin > 50);
  assert.equal(chunkInView('3,0,0', left, margin), true);
  assert.equal(chunkInView('3,0,0', left, Infinity), true);
});

test('released texture acknowledgements resend on re-entry without resetting unrelated resident geometry', () => {
  const s = scene(),
    before = s.pack(),
    r = new Resources();
  for (const name of ['oak_planks']) {
    const files = {
      ['assets/minecraft/blockstates/' + name + '.json']: {
        variants: { '': { model: 'minecraft:block/' + name } },
      },
      ['assets/minecraft/models/block/' + name + '.json']: {
        textures: { all: 'minecraft:block/' + name },
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: Object.fromEntries(
              ['east', 'west', 'up', 'down', 'north', 'south'].map((f) => [f, { texture: '#all' }]),
            ),
          },
        ],
      },
    };
    for (const [key, value] of Object.entries(files))
      r.files.set(key, new TextEncoder().encode(JSON.stringify(value)));
    r.files.set('assets/minecraft/textures/block/' + name + '.png', new Uint8Array([1]));
  }
  const m = new ChunkMesher(),
    first = m.render(s, r, { viewPlanes: left }),
    texture = Object.keys(first.textures)[0];
  assert.ok(texture);
  m.render(s, r, { viewPlanes: right });
  const stable = m.render(s, r, { viewPlanes: right, releasedTextures: [texture] });
  assert.equal(stable.reset, false);
  assert.equal(stable.chunks.length, 0);
  const back = m.render(s, r, { viewPlanes: left });
  assert.ok(back.textures[texture]);
  assert.equal(back.stats.resident, 1);
  assert.deepEqual(s.pack(), before);
});

test('progressive batches prioritize focus, converge to identical complete meshes and retain source data', () => {
  const p = emptyProject();
  p.size = [160, 4, 4];
  p.palette = [{ Name: 'minecraft:oak_planks' }];
  p.blocks = Array.from({ length: 10 }, (_, i) => ({ pos: [i * 16 + 2, 1, 2], state: 0 }));
  const s = new Site(p),
    before = s.pack(),
    resources = new Resources(),
    complete = new ChunkMesher().render(s, resources, {}),
    mesher = new ChunkMesher(),
    seen = new Map();
  let r = mesher.render(s, resources, { chunkBudget: 2, viewFocus: [154, 1, 2] });
  assert.deepEqual(
    r.chunks.map((c) => c.key),
    ['9,0,0', '8,0,0'],
  );
  assert.equal(r.stats.pending, 8);
  let batches = 0;
  while (true) {
    assert.ok(r.chunks.length <= 2);
    for (const c of r.chunks) seen.set(c.key, c);
    batches++;
    if (!r.stats.pending) break;
    r = mesher.render(s, resources, { chunkBudget: 2, viewFocus: [154, 1, 2] });
    assert.equal(r.reset, false);
  }
  assert.equal(batches, 5);
  assert.equal(seen.size, 10);
  for (const c of complete.chunks) assert.deepEqual(seen.get(c.key), c);
  assert.equal(r.triangles, complete.triangles);
  assert.deepEqual(s.pack(), before);
});
test('changing view or editing during progressive loading discards obsolete pending chunks and rebuilds actual changes', () => {
  const s = scene(),
    r = new Resources(),
    m = new ChunkMesher();
  let result = m.render(s, r, { chunkBudget: 1, viewFocus: [2, 1, 2] });
  assert.equal(result.stats.pending, 1);
  assert.equal(result.chunks[0].key, '0,0,0');
  result = m.render(s, r, { chunkBudget: 1, viewPlanes: right, viewFocus: [50, 1, 2] });
  assert.equal(result.reset, false);
  assert.deepEqual(result.evicted, ['0,0,0']);
  assert.equal(result.stats.pending, 0);
  assert.equal(result.chunks[0].key, '3,0,0');
  s.operations([{ type: 'set', pos: [51, 1, 2], state: { Name: 'minecraft:glass' } }], {});
  m.changed(s);
  result = m.render(s, r, { chunkBudget: 1, viewPlanes: right });
  assert.equal(result.chunks[0].key, '3,0,0');
  assert.equal(s.palette[s.at([51, 1, 2]).state].Name, 'minecraft:glass');
  assert.throws(() => m.render(s, r, { chunkBudget: 0 }), /budget/);
  assert.throws(() => m.render(s, r, { viewFocus: [NaN, 0, 0] }), /focus/);
});
