import test from 'node:test';
import assert from 'node:assert/strict';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { DesignAPI } from '../src/api/design-api.js';
import { objectHidden, hiddenObjectContains } from '../src/components/collections.js';
function setup() {
  const site = new Site({
    ...emptyProject(),
    size: [16, 16, 16],
    palette: [{ Name: 'minecraft:stone' }],
    blocks: [{ pos: [1, 1, 1], state: 0 }],
  });
  const api = new DesignAPI({ getSite: () => site });
  const call = (method, params = {}) =>
    api.execute({ method, params: { expectedRevision: api.revision, ...params } });
  for (const [id, hidden] of [
    ['a', false],
    ['b', true],
  ])
    assert.equal(
      call('objects.put', { object: { id, name: id, cells: [[1, 1, 1]], hidden } }).ok,
      true,
    );
  return { site, api, call };
}
test('sparse hidden objects do not hide decorations in holes of their bounding box', () => {
  const design = { collections: [{ id: 'g', hidden: true }] },
    object = { collectionId: 'g', cells: ['1,1,1', '3,1,1'], min: [1, 1, 1], max: [3, 1, 1] };
  assert.equal(hiddenObjectContains(design, object, [1, 1, 1]), true);
  assert.equal(hiddenObjectContains(design, object, [2, 1, 1]), false);
  assert.equal(hiddenObjectContains(design, object, [4, 1, 1]), false);
});
test('hidden decoration membership accepts canonical encoded cells and retains legacy coordinate forms', () => {
  const design = { collections: [{ id: 'g', hidden: true }] },
    record = (cells) => ({ collectionId: 'g', cells, min: [1, 1, 1], max: [3, 1, 1] });
  for (const cells of [
    [coordKey(1, 1, 1), coordKey(3, 1, 1)],
    [
      [1, 1, 1],
      [3, 1, 1],
    ],
    ['1,1,1', '3,1,1'],
  ]) {
    assert.equal(hiddenObjectContains(design, record(cells), [1, 1, 1]), true);
    assert.equal(hiddenObjectContains(design, record(cells), [2, 1, 1]), false);
  }
  const { site } = setup();
  assert.equal(typeof site.design.objects[0].cells[0], 'number');
  assert.equal(hiddenObjectContains(site.design, site.design.objects[1], [1, 1, 1]), true);
  assert.equal(hiddenObjectContains(site.design, site.design.objects[0], [1, 1, 1]), false);
});
test('moving selected members out preserves geometry, other collections and undo', () => {
  const { site, api, call } = setup();
  call('collections.put', { collection: { id: 'g', name: 'Group' }, objectIds: ['a'] });
  call('collections.put', { collection: { id: 'other', name: 'Other' }, objectIds: ['b'] });
  const revision = api.revision;
  assert.equal(
    call('collections.put', {
      collection: { id: 'g', name: 'Group' },
      removeObjectIds: ['a', 'missing'],
    }).ok,
    false,
  );
  assert.equal(api.revision, revision);
  assert.equal(
    call('collections.put', {
      collection: { id: 'g', name: 'Group' },
      objectIds: ['a'],
      removeObjectIds: ['a'],
    }).ok,
    false,
  );
  assert.equal(
    call('collections.put', { collection: { id: 'g', name: 'Group' }, removeObjectIds: ['a', 'b'] })
      .ok,
    true,
  );
  assert.equal(site.design.objects[0].collectionId, undefined);
  assert.equal(site.design.objects[1].collectionId, 'other');
  assert.equal(site.at([1, 1, 1]).state, 0);
  assert.equal(call('history.undo').ok, true);
  assert.equal(site.design.objects[0].collectionId, 'g');
});
test('collection visibility preserves individual visibility and undo restores membership', () => {
  const { site, call } = setup();
  assert.equal(
    call('collections.put', { collection: { id: 'house', name: ' House ' }, objectIds: ['a', 'b'] })
      .ok,
    true,
  );
  assert.equal(
    call('collections.put', { collection: { id: 'house', name: 'House', hidden: true } }).ok,
    true,
  );
  assert.deepEqual(
    site.design.objects.map((o) => objectHidden(site.design, o)),
    [true, true],
  );
  assert.equal(
    call('collections.put', { collection: { id: 'house', name: 'House', hidden: false } }).ok,
    true,
  );
  assert.deepEqual(
    site.design.objects.map((o) => objectHidden(site.design, o)),
    [false, true],
  );
  const restored = new Site(site.project());
  assert.equal(restored.design.collections[0].name, 'House');
  assert.equal(restored.design.objects[0].collectionId, 'house');
  assert.equal(call('collections.remove', { id: 'house' }).ok, true);
  assert.equal(site.design.objects.length, 2);
  assert.equal(site.at([1, 1, 1]).state, 0);
  assert.ok(site.design.objects.every((o) => !o.collectionId));
  assert.equal(call('history.undo').ok, true);
  assert.ok(site.design.objects.every((o) => o.collectionId === 'house'));
});
test('collection mutation is atomic, revision guarded and transaction isolated', () => {
  const { site, api, call } = setup();
  const before = JSON.stringify(site.design),
    revision = api.revision;
  assert.equal(
    call('collections.put', { collection: { id: 'bad', name: 'Bad' }, objectIds: ['a', 'missing'] })
      .ok,
    false,
  );
  assert.equal(JSON.stringify(site.design), before);
  assert.equal(api.revision, revision);
  assert.equal(
    call('collections.put', { expectedRevision: revision - 1, collection: { name: 'Stale' } }).ok,
    false,
  );
  const transactionId = call('transaction.begin').value.transactionId;
  assert.equal(
    call('collections.put', {
      transactionId,
      collection: { id: 'staged', name: 'Staged' },
      objectIds: ['a'],
    }).ok,
    true,
  );
  assert.equal(call('collections.list').value.length, 0);
  assert.deepEqual(call('collections.list', { transactionId }).value[0].objectIds, ['a']);
  assert.equal(call('transaction.commit', { transactionId }).ok, true);
  assert.equal(site.design.objects[0].collectionId, 'staged');
  assert.equal(call('collections.list', { expectedRevision: revision }).ok, false);
  assert.equal(
    call('objects.put', {
      object: { id: 'c', name: 'c', cells: [[2, 1, 1]], collectionId: 'missing' },
    }).ok,
    false,
  );
});
