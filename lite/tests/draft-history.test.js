import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { captureDraftHistory } from '../src/storage/draft-history.js';
import { DesignAPI } from '../src/api/design-api.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
test('draft resume keeps state-table ordering and tool-intent binding after unused states and redo', async () => {
  const e = new EngineWorkspace(),
    other = new EngineWorkspace();
  try {
    await e.call('import', {
      name: 'order.json',
      bytes: new TextEncoder().encode(JSON.stringify({ ...emptyProject('Order'), size: [8, 8, 8] }))
        .buffer,
    });
    const call = async (method, params = {}) => {
      const d = await e.call('api', { method: 'workspace.describe' });
      return e.call('api', { method, params: { expectedRevision: d.revision, ...params } });
    };
    for (const [pos, state] of [
      [[2, 1, 1], { Name: 'minecraft:glass' }],
      [[3, 1, 1], { Name: 'minecraft:bricks' }],
      [[2, 1, 1], null],
    ])
      assert.ok((await call('edit.apply', { operations: [{ type: 'set', pos, state }] })).ok);
    assert.ok((await call('history.undo')).ok);
    assert.ok((await call('history.undo')).ok);
    const before = await e.call('toolContext'),
      palette = (await e.call('summary')).palette,
      draft = await e.call('draft');
    await other.call('resume', {
      baseline: draft.baseline,
      bytes: draft.payload,
      assetBytes: draft.assetBytes,
    });
    assert.deepEqual((await other.call('summary')).palette, palette);
    assert.equal((await other.call('toolContext')).key, before.key);
    assert.deepEqual((await other.call('api', { method: 'workspace.describe' })).value.history, {
      undo: 1,
      redo: 2,
    });
    const d = await other.call('api', { method: 'workspace.describe' });
    assert.ok(
      (
        await other.call('api', {
          method: 'history.redo',
          params: { expectedRevision: d.revision },
        })
      ).ok,
    );
    assert.equal(
      (await other.call('api', { method: 'scene.getBlocks', params: { positions: [[3, 1, 1]] } }))
        .value[0].state.Name,
      'minecraft:bricks',
    );
  } finally {
    await e.close();
    await other.close();
  }
});
test('draft history restores voxel/NBT and metadata edits, undo/redo and independent chunk ownership', () => {
  const site = new Site({
    ...emptyProject(),
    size: [64, 8, 8],
    palette: [{ Name: 'minecraft:stone' }],
    blocks: [{ pos: [1, 1, 1], state: 0 }],
  });
  site.operations([
    {
      type: 'set',
      pos: [2, 1, 1],
      state: { Name: 'minecraft:chest' },
      nbt: { t: 10, v: { CustomName: { t: 8, v: 'Chest' } } },
    },
  ]);
  site.operations([
    {
      type: 'set',
      pos: [33, 1, 1],
      state: { Name: 'minecraft:oak_slab', Properties: { type: 'top' } },
    },
  ]);
  const api = new DesignAPI({ getSite: () => site });
  assert.ok(
    api.execute({
      method: 'palettes.put',
      params: { expectedRevision: 0, palette: { name: 'Roof', states: [] } },
    }).ok,
  );
  site.restore('undo');
  const history = captureDraftHistory(site),
    copy = Site.unpack({ ...site.pack(), history: JSON.parse(JSON.stringify(history)) });
  assert.equal(copy.redo.length, 1);
  assert.equal(copy.undo.length, 2);
  copy.restore('redo');
  assert.equal(copy.design.materialPalettes[0].name, 'Roof');
  copy.restore('undo');
  copy.restore('undo');
  assert.equal(copy.at([33, 1, 1]), null);
  assert.equal(copy.at([2, 1, 1]).nbt.v.CustomName.v, 'Chest');
  copy.operations([{ type: 'set', pos: [3, 1, 1], state: { Name: 'minecraft:glass' } }]);
  copy.restore('undo');
  assert.equal(copy.at([3, 1, 1]), null);
  copy.restore('undo');
  assert.equal(copy.at([2, 1, 1]), null);
  assert.equal(copy.at([1, 1, 1]).state, 0);
  assert.equal(site.at([33, 1, 1]).state >= 0, true);
});
test('draft history stores shared changed chunks and repeated designs once, excluding baseline blocks', () => {
  const site = new Site({
    ...emptyProject(),
    size: [64, 8, 8],
    palette: [{ Name: 'minecraft:stone' }],
    blocks: [{ pos: [1, 1, 1], state: 0 }],
  });
  site.operations([{ type: 'set', pos: [33, 1, 1], state: { Name: 'minecraft:glass' } }]);
  for (let x = 2; x < 7; x++)
    site.operations([{ type: 'set', pos: [x, 1, 1], state: { Name: 'minecraft:glass' } }]);
  const h = captureDraftHistory(site);
  assert.equal(h.chunks.filter((c) => c.bucket === 2).length, 1);
  assert.equal(h.designs.length, 1);
  assert.ok(h.chunks.every((c) => c.blocks.every((b) => b.pos.join(',') !== '1,1,1')));
  assert.deepEqual(
    Site.unpack(site.pack()).undo,
    [],
    'legacy/portable packages have no implicit history',
  );
});
test('invalid draft history fails before a restored site is published', () => {
  const site = new Site(emptyProject()),
    history = captureDraftHistory(site);
  assert.throws(
    () =>
      Site.unpack({
        ...site.pack(),
        history: { ...history, undo: [{ chunks: [99], size: [1, 1, 1], design: 0 }] },
      }),
    /历史损坏/,
  );
  assert.throws(
    () => Site.unpack({ ...site.pack(), history: { ...history, schema: 'unknown' } }),
    /历史损坏/,
  );
});
