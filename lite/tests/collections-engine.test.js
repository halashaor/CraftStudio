import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineStore } from '../../local-engine/store.mjs';
import { EngineController } from '../../local-engine/controller.mjs';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
test('collection visibility, membership and undo survive durable and portable reopen', async () => {
  const store = new EngineStore(':memory:');
  let c = await EngineController.open({ store, key: 'collection' });
  const portable = new EngineWorkspace();
  const call = async (method, params = {}) => {
    const d = await c.call('api', { method: 'workspace.describe' });
    const result = await c.call('api', {
      method,
      params: { expectedRevision: d.revision, ...params },
    });
    assert.ok(result.ok, result.error?.message);
    return result.value;
  };
  try {
    const p = {
      ...emptyProject(),
      size: [8, 8, 8],
      palette: [{ Name: 'minecraft:stone' }],
      blocks: [{ pos: [1, 1, 1], state: 0 }],
    };
    await c.call('import', {
      name: 'collection.json',
      bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
    });
    await call('objects.put', { object: { id: 'part', name: 'Part', cells: [[1, 1, 1]] } });
    await call('collections.put', {
      collection: { id: 'house', name: 'House', hidden: true },
      objectIds: ['part'],
    });
    await c.close();
    c = await EngineController.open({ store, key: 'collection' });
    assert.deepEqual((await call('collections.list'))[0], {
      id: 'house',
      name: 'House',
      hidden: true,
      objectIds: ['part'],
    });
    const mesh = await c.call('meshChunks', {
      mode: 'after',
      cut: 4095,
      plants: true,
      showGround: true,
      showExisting: true,
    });
    assert.equal(
      mesh.chunks.flatMap((c) => c.buckets).reduce((n, b) => n + b.positions.length, 0),
      0,
    );
    const bytes = await c.call('compressed', { title: 'Collection portable' });
    await portable.call('import', { name: 'collection.craftlite', bytes: bytes.buffer });
    assert.equal(
      (await portable.call('api', { method: 'collections.list' })).value[0].hidden,
      true,
    );
    assert.equal(
      (await portable.call('api', { method: 'objects.list' })).value[0].collectionId,
      'house',
    );
    await call('history.undo');
    assert.equal((await call('collections.list')).length, 0);
    await c.close();
    c = await EngineController.open({ store, key: 'collection' });
    assert.equal((await call('collections.list')).length, 0);
    assert.equal(
      (await call('scene.getBlocks', { positions: [[1, 1, 1]] }))[0].state.Name,
      'minecraft:stone',
    );
  } finally {
    await c.close();
    await portable.close();
    store.close();
  }
});
