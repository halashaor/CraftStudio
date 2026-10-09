import test from 'node:test';
import assert from 'node:assert/strict';
import { CollectionHierarchy, collectionFlag } from '../src/components/collection-hierarchy.js';
import { objectHidden } from '../src/components/collections.js';
import { ObjectProtection, objectLocked } from '../src/components/object-protection.js';
import { SceneBrowser } from '../src/ui/scene-browser.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { DesignAPI } from '../src/api/design-api.js';
function fixture() {
  const site = new Site({
    ...emptyProject('Nested house'),
    size: [16, 16, 16],
    palette: [{ Name: 'minecraft:oak_planks' }],
    blocks: [
      { pos: [1, 1, 1], state: 0 },
      { pos: [3, 1, 1], state: 0 },
    ],
  });
  const api = new DesignAPI({ getSite: () => site });
  const call = (method, params = {}) =>
    api.execute({ method, params: { expectedRevision: api.revision, ...params } });
  for (const [id, x] of [
    ['door', 1],
    ['lamp', 3],
  ])
    assert.ok(call('objects.put', { object: { id, name: id, cells: [[x, 1, 1]] } }).ok);
  for (const collection of [
    { id: 'house', name: 'House' },
    { id: 'floor', name: 'Floor', parentId: 'house' },
    { id: 'windows', name: 'Windows', parentId: 'floor' },
    { id: 'garden', name: 'Garden' },
  ])
    assert.ok(call('collections.put', { collection }).ok);
  assert.ok(
    call('collections.put', { collection: { id: 'windows', name: 'Windows' }, objectIds: ['door'] })
      .ok,
  );
  assert.ok(
    call('collections.put', { collection: { id: 'floor', name: 'Floor' }, objectIds: ['lamp'] }).ok,
  );
  return { site, api, call };
}
test('nested collection browse/search and counts include descendants without changing direct membership', () => {
  const { site, call } = fixture();
  const list = call('collections.list').value;
  assert.deepEqual(list.find((c) => c.id === 'house').objectIds, []);
  assert.deepEqual(list.find((c) => c.id === 'house').descendantObjectIds, ['door', 'lamp']);
  assert.equal(list.find((c) => c.id === 'windows').path, 'House / Floor / Windows');
  const browser = new SceneBrowser(site.design);
  assert.deepEqual([...browser.filter({ collection: 'group:house' }).objectIds], ['door', 'lamp']);
  assert.deepEqual([...browser.filter({ query: 'House Windows' }).objectIds], ['door']);
  assert.equal(browser.filter({ collection: 'group:garden' }).objectIds.size, 0);
});
test('ancestor hiding and locking preserve child flags and exact member holes', () => {
  const { site, call } = fixture();
  assert.ok(
    call('collections.put', {
      collection: { id: 'house', name: 'House', hidden: true, locked: true },
    }).ok,
  );
  const door = site.design.objects.find((o) => o.id === 'door');
  assert.ok(objectHidden(site.design, door));
  assert.ok(objectLocked(site.design, door));
  assert.equal(site.design.collections.find((c) => c.id === 'windows').hidden, false);
  const protection = new ObjectProtection(site.design);
  assert.equal(protection.at([1, 1, 1]).id, 'door');
  assert.equal(protection.at([2, 1, 1]), null);
  assert.equal(
    new SceneBrowser(site.design).filter({ collection: 'group:house' }).selectableObjectIds.size,
    0,
  );
  const revision = call('workspace.describe').revision;
  assert.equal(
    call('edit.apply', {
      operations: [{ type: 'set', pos: [1, 1, 1], state: { Name: 'minecraft:glass' } }],
      policy: { allowExisting: true, allowTerrain: true },
    }).ok,
    false,
  );
  assert.equal(call('workspace.describe').revision, revision);
  assert.ok(
    call('collections.put', {
      collection: { id: 'house', name: 'House', hidden: false, locked: false },
    }).ok,
  );
  assert.equal(objectHidden(site.design, door), false);
  assert.equal(objectLocked(site.design, door), false);
});
test('reparenting preserves blocks, rejects cycles atomically, and undo restores hierarchy', () => {
  const { site, call } = fixture();
  const before = site.project().blocks;
  for (const parentId of ['windows', 'house', 'missing', 23]) {
    const revision = call('workspace.describe').revision;
    assert.equal(
      call('collections.put', { collection: { id: 'house', name: 'House', parentId } }).ok,
      false,
    );
    assert.equal(call('workspace.describe').revision, revision);
  }
  assert.ok(
    call('collections.put', { collection: { id: 'floor', name: 'Floor', parentId: 'garden' } }).ok,
  );
  assert.deepEqual(site.project().blocks, before);
  assert.equal(
    new SceneBrowser(site.design).filter({ collection: 'group:house' }).objectIds.size,
    0,
  );
  assert.ok(call('history.undo').ok);
  assert.equal(site.design.collections.find((c) => c.id === 'floor').parentId, 'house');
  assert.ok(
    call('collections.put', { collection: { id: 'floor', name: 'Floor', parentId: null } }).ok,
  );
  assert.equal(site.design.collections.find((c) => c.id === 'floor').parentId, undefined);
});
test('unlinking a nested collection lifts its children and direct objects one level; undo and project reopening retain the tree', () => {
  const { site, call } = fixture();
  assert.ok(call('collections.remove', { id: 'floor' }).ok);
  assert.equal(site.design.collections.find((c) => c.id === 'windows').parentId, 'house');
  assert.equal(site.design.objects.find((o) => o.id === 'lamp').collectionId, 'house');
  assert.equal(site.design.objects.find((o) => o.id === 'door').collectionId, 'windows');
  assert.equal(site.at([1, 1, 1]).state, 0);
  assert.ok(call('history.undo').ok);
  const restored = new Site(site.project());
  assert.equal(restored.design.collections.find((c) => c.id === 'windows').parentId, 'floor');
  assert.deepEqual(
    new CollectionHierarchy(restored.design.collections)
      .rows()
      .map((r) => [r.collection.id, r.depth]),
    [
      ['house', 0],
      ['floor', 1],
      ['windows', 2],
      ['garden', 0],
    ],
  );
});
test('nested collection edits participate in transactions without leaking uncommitted visibility', () => {
  const { site, call } = fixture();
  const transactionId = call('transaction.begin').value.transactionId;
  assert.ok(
    call('collections.put', {
      transactionId,
      collection: { id: 'house', name: 'House', hidden: true },
    }).ok,
  );
  assert.equal(objectHidden(site.design, site.design.objects[0]), false);
  assert.equal(
    call('collections.list', { transactionId }).value.find((c) => c.id === 'windows')
      .effectiveHidden,
    true,
  );
  assert.ok(call('transaction.commit', { transactionId }).ok);
  assert.equal(objectHidden(site.design, site.design.objects[0]), true);
});
test('malformed imported cycles remain bounded and visible for repair', () => {
  const collections = [
    { id: 'a', name: 'A', parentId: 'b' },
    { id: 'b', name: 'B', parentId: 'a', hidden: true },
  ];
  const tree = new CollectionHierarchy(collections);
  assert.equal(tree.rows().length, 2);
  assert.equal(tree.ancestors('a').length, 2);
  assert.equal(collectionFlag({ collections }, 'a', 'hidden'), true);
  assert.equal(collectionFlag({ collections }, 'a', 'locked'), false);
  assert.throws(() => tree.validateParent('new', 'a'), /自己|子集合/);
  tree.validateParent('a', null);
});
