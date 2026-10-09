import test from 'node:test';
import assert from 'node:assert/strict';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
test('baseline point lookup and chunk iteration share original records including maximum 36-bit keys', () => {
  const blocks = [
      { pos: [0, 0, 0], state: 0 },
      { pos: [4095, 4095, 4095], state: 0 },
      { pos: [16, 272, 32], state: 0 },
    ],
    s = new Site({
      ...emptyProject(),
      size: [4096, 4096, 4096],
      palette: [{ Name: 'minecraft:stone' }],
      blocks,
    });
  assert.equal(s.cells.size, 3);
  assert.equal(s.baseChunks.size, 3);
  for (const b of blocks) {
    const key = coordKey(...b.pos),
      chunk = b.pos.map((n) => Math.floor(n / 16)).join(',');
    assert.equal(s.at(b.pos, true), b);
    assert.equal(s.baseChunks.get(chunk).get(key), b);
  }
  assert.equal(s.baseChunks.get('255,255,255'), s.cells.chunks.get(16777215));
  assert.deepEqual(new Set(s.cells.keys()), new Set(blocks.map((b) => coordKey(...b.pos))));
});
test('edits, forks and undo retain the shared immutable baseline without altering original records', () => {
  const blocks = [
      { pos: [1, 1, 1], state: 0 },
      { pos: [33, 1, 1], state: 0 },
    ],
    s = new Site({
      ...emptyProject(),
      size: [48, 8, 8],
      palette: [{ Name: 'minecraft:stone' }],
      blocks,
    }),
    original = JSON.stringify(s.base),
    child = s.fork();
  child.operations([{ type: 'set', pos: [1, 1, 1], state: { Name: 'minecraft:glass' } }], {
    allowTerrain: true,
  });
  assert.equal(s.palette[s.at([1, 1, 1]).state].Name, 'minecraft:stone');
  assert.equal(child.palette[child.at([1, 1, 1]).state].Name, 'minecraft:glass');
  assert.equal(child.at([1, 1, 1], true), blocks[0]);
  child.restore('undo');
  assert.equal(child.at([1, 1, 1]), blocks[0]);
  assert.equal(JSON.stringify(s.base), original);
  assert.equal(s.cells, child.cells);
});
