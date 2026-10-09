import test from 'node:test';
import assert from 'node:assert/strict';
import { Site, terrainType } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
function fullScan(s) {
  const result = { add: 0, remove: 0, replace: 0, earth: 0, water: 0, materials: {} };
  for (const [key, b] of s.overlay) {
    const before = s.cells.get(key);
    result[!before ? 'add' : b.state < 0 ? 'remove' : 'replace']++;
    if (before) {
      const t = terrainType(s.palette[before.state].Name);
      if (t === 'ground') result.earth++;
      if (t === 'water') result.water++;
    }
    if (b.state >= 0) {
      const name = s.palette[b.state].Name;
      result.materials[name] = (result.materials[name] || 0) + 1;
    }
  }
  return result;
}
function check(s) {
  const summary = s.summary(),
    expected = fullScan(s);
  for (const key of Object.keys(expected)) assert.deepEqual(summary[key], expected[key]);
  summary.materials['custom:tampered'] = 100;
  assert.equal(s.summary().materials['custom:tampered'], undefined);
}
test('incremental counts match full scans through edits, original restoration, forks, undo/redo and reopen', () => {
  const s = new Site({
    ...emptyProject(),
    size: [64, 20, 64],
    palette: [
      { Name: 'minecraft:stone' },
      { Name: 'minecraft:water' },
      { Name: 'minecraft:oak_planks' },
    ],
    blocks: Array.from({ length: 60 }, (_, x) => ({ pos: [x, 0, 0], state: x % 3 })),
  });
  const policy = { allowTerrain: true, allowExisting: true };
  let seed = 13;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  for (let n = 0; n < 120; n++) {
    const x = random() % 64,
      y = random() % 3;
    s.operations(
      [
        {
          type: 'set',
          pos: [x, y, 0],
          state:
            n % 4 === 0 ? null : { Name: n % 3 === 0 ? 'minecraft:glass' : 'minecraft:gold_block' },
        },
      ],
      policy,
    );
    check(s);
    if (n % 10 === 0) {
      const child = s.fork();
      child.operations(
        [{ type: 'set', pos: [33, 4, 33], state: { Name: 'custom:fixture' } }],
        policy,
      );
      check(child);
      check(s);
      s.restore('undo');
      check(s);
      s.restore('redo');
      check(s);
    }
  }
  for (const block of s.base.blocks)
    s.operations([{ type: 'set', pos: block.pos, state: s.palette[block.state] }], policy);
  check(s);
  const reopened = Site.unpack(JSON.parse(JSON.stringify(s.pack())));
  check(reopened);
  assert.deepEqual(reopened.summary().materials, s.summary().materials);
});
test('continuous batches stay one undo and failed batches leave statistics and cells unchanged', () => {
  const s = new Site(emptyProject());
  s.beginStroke();
  for (let x = 0; x < 40; x++)
    s.operations([{ type: 'set', pos: [x, 2, 0], state: { Name: 'minecraft:glass' } }]);
  s.endStroke();
  assert.equal(s.undo.length, 1);
  check(s);
  const before = s.pack();
  assert.throws(() =>
    s.operations([
      { type: 'set', pos: [1, 3, 1], state: { Name: 'custom:new' } },
      { type: 'set', pos: [-1, 0, 0], state: { Name: 'minecraft:stone' } },
    ]),
  );
  assert.deepEqual(s.pack(), before);
  check(s);
  s.restore('undo');
  assert.equal(s.summary().add, 0);
  s.restore('redo');
  assert.equal(s.summary().add, 40);
  check(s);
});
