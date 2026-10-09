import test from 'node:test';
import assert from 'node:assert/strict';
import { listedPrefabs } from '../src/components/prefab-catalogue.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
const prefabs = [
  { id: 'first', name: 'Oak window', size: [3, 4, 1], blocks: [{}], tags: ['窗', '木结构'] },
  { id: 'second', name: 'Stone pillar', size: [1, 6, 1], blocks: [{}], tags: ['柱', '石结构'] },
];
test('component browsing filters name, user categories and dimensions without changing library order', () => {
  assert.deepEqual(
    listedPrefabs(prefabs).map((prefab) => prefab.id),
    ['second', 'first'],
  );
  assert.deepEqual(
    listedPrefabs(prefabs, { query: 'oak 木结构' }).map((prefab) => prefab.id),
    ['first'],
  );
  assert.deepEqual(
    listedPrefabs(prefabs, { category: '柱' }).map((prefab) => prefab.id),
    ['second'],
  );
  assert.deepEqual(
    listedPrefabs(prefabs, { query: '3x4x1' }).map((prefab) => prefab.id),
    ['first'],
  );
  assert.deepEqual(
    listedPrefabs(prefabs, { sort: 'name' }).map((prefab) => prefab.id),
    ['first', 'second'],
  );
  assert.deepEqual(
    prefabs.map((prefab) => prefab.id),
    ['first', 'second'],
  );
});
test('names and custom categories survive reopening, undo separately and never change geometry', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  await engine.call('studio', {
    command: 'prefabImport',
    prefab: {
      schema: 'craftstudio-prefab/1',
      name: 'Original',
      size: [1, 1, 1],
      blocks: [{ pos: [0, 0, 0], state: { Name: 'minecraft:oak_planks' } }],
    },
  });
  let head = await engine.call('summary'),
    id = head.design.prefabs[0].id;
  await engine.call('studio', {
    command: 'prefabMeta',
    id,
    name: 'Timber window',
    tags: ['窗', '木结构', '窗'],
    workspaceId: head.workspaceId,
    expectedRevision: head.revision,
  });
  head = await engine.call('summary');
  assert.equal(head.add, 0);
  assert.equal(head.design.prefabs[0].name, 'Timber window');
  assert.deepEqual(head.design.prefabs[0].tags, ['窗', '木结构']);
  await engine.call('api', {
    method: 'history.undo',
    params: { workspaceId: head.workspaceId, expectedRevision: head.revision },
  });
  head = await engine.call('summary');
  assert.equal(head.design.prefabs[0].name, 'Original');
  await engine.call('api', {
    method: 'history.redo',
    params: { workspaceId: head.workspaceId, expectedRevision: head.revision },
  });
  const bytes = await engine.call('compressed');
  await engine.call('import', { name: 'library.craftlite', bytes });
  head = await engine.call('summary');
  assert.deepEqual(head.design.prefabs[0].tags, ['窗', '木结构']);
  assert.equal(head.design.prefabs[0].blocks[0].state.Name, 'minecraft:oak_planks');
  assert.equal(head.add, 0);
});
