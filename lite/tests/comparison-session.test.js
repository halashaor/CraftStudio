import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { DesignAPI } from '../src/api/design-api.js';
import { ComparisonSession } from '../src/view/comparison-session.js';

function setup() {
  const site = new Site({ ...emptyProject(), name: '山坡住宅', size: [32, 32, 32] }),
    api = new DesignAPI({ getSite: () => site }),
    comparison = new ComparisonSession();
  const request = (method, params = {}) => {
    const result = api.execute({
      method,
      params: { ...params, workspaceId: api.workspaceId, expectedRevision: api.revision },
    });
    assert.equal(result.ok, true, result.error?.message);
    return result;
  };
  const place = (pos, name) =>
    request('edit.apply', { operations: [{ type: 'set', pos, state: { Name: name } }] });
  const capture = (slot) =>
    comparison.capture(slot, site, { workspaceId: api.workspaceId, revision: api.revision });
  return { site, api, comparison, request, place, capture };
}

test('comparison snapshots retain their blocks and objects as the current design changes and undoes', () => {
  const { site, api, comparison, request, place, capture } = setup();
  place([1, 2, 3], 'minecraft:stone');
  request('objects.put', { object: { id: 'roof', name: '原屋面', cells: [[1, 2, 3]] } });
  const capturedRevision = api.revision;
  capture('a');
  place([1, 2, 3], 'minecraft:oak_planks');
  place([2, 2, 3], 'minecraft:glass');
  request('objects.rename', { names: [{ id: 'roof', name: '新屋面' }] });
  capture('b');
  const a = comparison.show('a'),
    b = comparison.show('b');
  assert.equal(a.palette[a.at([1, 2, 3]).state].Name, 'minecraft:stone');
  assert.equal(a.at([2, 2, 3]), null);
  assert.equal(a.design.objects[0].name, '原屋面');
  assert.equal(b.palette[b.at([1, 2, 3]).state].Name, 'minecraft:oak_planks');
  assert.equal(b.design.objects[0].name, '新屋面');
  comparison.end();
  request('history.undo');
  request('history.undo');
  assert.equal(site.at([2, 2, 3]), null);
  assert.equal(site.design.objects[0].name, '原屋面');
  assert.equal(b.palette[b.at([2, 2, 3]).state].Name, 'minecraft:glass');
  assert.equal(b.design.objects[0].name, '新屋面');
  assert.equal(comparison.describe(api.workspaceId).slots[0].capturedRevision, capturedRevision);
});

test('recording and switching comparisons preserve the working identity, history and API receipts', () => {
  const { site, api, comparison, place, capture } = setup();
  place([1, 1, 1], 'minecraft:stone');
  capture('a');
  place([2, 1, 1], 'minecraft:glass');
  const history = site.undo,
    redo = site.redo,
    receipts = api.receipts,
    revision = api.revision,
    workspaceId = api.workspaceId,
    original = structuredClone(site.pack());
  capture('b');
  const description = comparison.describe(workspaceId);
  assert.deepEqual(
    description.slots.map((record) => record.slot),
    ['a', 'b'],
  );
  assert.equal(description.slots[0].name, '山坡住宅');
  assert.ok(Number.isFinite(Date.parse(description.slots[0].capturedAt)));
  description.slots[0].name = '外部显示名称';
  for (const slot of ['a', 'b', 'a']) {
    const view = comparison.show(slot);
    assert.equal(comparison.current, view);
    assert.notEqual(view, site);
    assert.equal(comparison.describe(workspaceId).active, slot);
  }
  comparison.end();
  assert.equal(comparison.current, null);
  assert.equal(site.undo, history);
  assert.equal(site.undo.length, 2);
  assert.equal(site.redo, redo);
  assert.equal(api.receipts, receipts);
  assert.equal(api.workspaceId, workspaceId);
  assert.equal(api.revision, revision);
  assert.deepEqual(site.pack(), original);
  assert.equal(comparison.describe(workspaceId).slots[0].name, '山坡住宅');
});

test('workspace changes discard old comparisons before another design can display them', () => {
  const { site, api, comparison, capture } = setup();
  capture('a');
  comparison.show('a');
  assert.deepEqual(comparison.describe('other-workspace'), { active: null, slots: [] });
  assert.equal(comparison.current, null);
  assert.throws(() => comparison.show('a'), /先记录方案 A/);
  comparison.capture('b', site, { workspaceId: 'other-workspace', revision: 0 });
  comparison.sync('other-workspace');
  assert.equal(comparison.describe('other-workspace').slots.length, 1);
  comparison.sync(api.workspaceId);
  assert.deepEqual(comparison.describe(api.workspaceId), { active: null, slots: [] });
});

test('unrecorded or invalid slots and captures during review leave the chosen snapshot intact', () => {
  const { site, api, comparison, capture } = setup();
  assert.throws(() => comparison.show('b'), /先记录方案 B/);
  assert.throws(() => capture('c'), /方案 A 或 B/);
  capture('a');
  const a = comparison.show('a');
  assert.throws(() => comparison.show('b'), /先记录方案 B/);
  assert.throws(() => comparison.show('c'), /方案 A 或 B/);
  assert.throws(() => capture('a'), /返回当前设计/);
  assert.throws(() => capture('b'), /返回当前设计/);
  assert.equal(comparison.current, a);
  assert.equal(comparison.describe(api.workspaceId).slots.length, 1);
  comparison.end();
  site.title = '另一版住宅';
  capture('a');
  assert.equal(comparison.describe(api.workspaceId).slots[0].name, '另一版住宅');
});
