import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { EngineStore } from '../../local-engine/store.mjs';
import { EngineController } from '../../local-engine/controller.mjs';
import { encode, digest, baselineBucket } from '../../local-engine/checkpoint.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
const fixture = () => ({
  ...emptyProject('split baseline'),
  size: [80, 10, 10],
  palette: [{ Name: 'minecraft:stone' }, { Name: 'custom:machine' }],
  blocks: [
    { pos: [50, 2, 1], state: 1, nbt: { id: 'custom:machine', typed: { type: 4, value: [1, 2] } } },
    { pos: [2, 1, 1], state: 0 },
    { pos: [51, 3, 1], state: 1 },
  ],
});
test('baseline chunks read only requested blobs, preserve original states/tags, and reject stale or incomplete requests', async () => {
  const store = new EngineStore(':memory:'),
    e = new EngineWorkspace();
  try {
    await e.call('import', {
      name: 'source.json',
      bytes: new TextEncoder().encode(JSON.stringify(fixture())).buffer,
    });
    const packet = await e.call('engineCapture');
    assert.equal(packet.head.schema, 'craftstudio-engine-checkpoint/3');
    store.commit('p', packet, null);
    const manifest = store.baseline('p');
    assert.equal(manifest.totalBlocks, 3);
    assert.deepEqual(manifest.header.blocks, []);
    assert.equal(manifest.chunks.length, 2);
    const left = baselineBucket([2, 1, 1]),
      right = baselineBucket([50, 2, 1]),
      rightRow = packet.head.baseChunks.find((c) => c[0] === right),
      original = packet.blobs.find((b) => b.id === rightRow[1]).bytes;
    store.db
      .prepare('UPDATE designer_engine_blobs SET payload=? WHERE id=?')
      .run(new Uint8Array([1]), rightRow[1]);
    assert.deepEqual(
      store.baseline('p', { chunks: [left], expectedSequence: 1 }).chunks[0].blocks,
      [fixture().blocks[1]],
    );
    assert.throws(() => store.baseline('p', { chunks: [right] }), /corrupt/);
    assert.throws(() => store.load('p'), /corrupt/);
    assert.throws(() => store.baseline('p', { chunks: [left, left] }), /unique/);
    assert.throws(() => store.baseline('p', { chunks: [left], expectedSequence: 2 }), /conflict/);
    assert.throws(() => store.baseline('p', { chunks: [100] }), /Unknown/);
    assert.throws(
      () => store.baseline('p', { chunks: Array.from({ length: 129 }, (_, i) => i) }),
      /128/,
    );
    store.db
      .prepare('UPDATE designer_engine_blobs SET payload=? WHERE id=?')
      .run(original, rightRow[1]);
    assert.deepEqual(store.baseline('p', { chunks: [right] }).chunks[0].blocks, [
      fixture().blocks[0],
      fixture().blocks[2],
    ]);
    const restored = new EngineWorkspace();
    try {
      await restored.call('engineRestore', store.load('p'));
      const data = await restored.call('package');
      assert.deepEqual(data.site.base.blocks, fixture().blocks);
    } finally {
      await restored.close();
    }
  } finally {
    await e.close();
    store.close();
  }
});
test('legacy single-blob checkpoints restore and upgrade to split baseline storage on the next capture', async () => {
  const store = new EngineStore(':memory:'),
    e = new EngineWorkspace(),
    restored = new EngineWorkspace();
  try {
    await e.call('import', {
      name: 'legacy.json',
      bytes: new TextEncoder().encode(JSON.stringify(fixture())).buffer,
    });
    const packet = await e.call('engineCapture'),
      bytes = encode(fixture()),
      id = digest(bytes);
    packet.head.schema = 'craftstudio-engine-checkpoint/1';
    packet.head.base = id;
    delete packet.head.baseChunks;
    packet.blobs.push({ id, bytes });
    store.commit('p', packet, null);
    assert.throws(() => store.baseline('p'), /legacy/);
    await restored.call('engineRestore', store.load('p'));
    const upgraded = await restored.call('engineCapture', { known: store.known() });
    store.commit('p', upgraded, 1);
    assert.equal(upgraded.head.schema, 'craftstudio-engine-checkpoint/3');
    assert.equal(store.baseline('p').totalBlocks, 3);
    assert.deepEqual((await restored.call('package')).site.base.blocks, fixture().blocks);
  } finally {
    await e.close();
    await restored.close();
    store.close();
  }
});
test('controller exposes sequence-guarded original chunks without replacing or editing the live scene', async () => {
  const store = new EngineStore(':memory:');
  let c = await EngineController.open({ store, key: 'p' });
  try {
    await c.call('import', {
      name: 'source.json',
      bytes: new TextEncoder().encode(JSON.stringify(fixture())).buffer,
    });
    let d = await c.call('api', { method: 'workspace.describe' });
    await c.call('api', {
      method: 'edit.apply',
      params: {
        expectedRevision: d.revision,
        operations: [{ type: 'set', pos: [2, 1, 1], state: { Name: 'minecraft:glass' } }],
        policy: { allowTerrain: true },
      },
    });
    await assert.rejects(c.call('storedBaselineChunks'), /required/);
    const manifest = await c.call('storedBaselineManifest'),
      r = await c.call('storedBaselineChunks', {
        expectedSequence: manifest.sequence,
        chunks: [baselineBucket([2, 1, 1])],
      });
    assert.equal(r.chunks[0].blocks[0].state, 0);
    assert.equal(
      (await c.call('api', { method: 'scene.getBlocks', params: { positions: [[2, 1, 1]] } }))
        .value[0].state.Name,
      'minecraft:glass',
    );
    assert.equal(c.sequence, manifest.sequence);
    await c.close();
    c = await EngineController.open({ store, key: 'p' });
    assert.equal((await c.call('storedBaselineManifest')).totalBlocks, 3);
    assert.equal(
      (await c.call('api', { method: 'scene.getBlocks', params: { positions: [[50, 2, 1]] } }))
        .value[0].state.Name,
      'custom:machine',
    );
  } finally {
    await c.close();
    store.close();
  }
});
