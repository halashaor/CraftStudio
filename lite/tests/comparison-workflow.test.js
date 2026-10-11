import test from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync, strFromU8 } from 'fflate';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { EngineController } from '../../local-engine/controller.mjs';
import { EngineStore } from '../../local-engine/store.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
import { PageRequests } from '../src/api/page-requests.js';

async function setup(t) {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const blank = (name = '坡地方案比较') => ({
    name: 'fixture.json',
    bytes: new TextEncoder().encode(JSON.stringify({ ...emptyProject(), name, size: [32, 24, 32] }))
      .buffer,
  });
  await engine.call('import', blank());
  const head = () => engine.call('api', { method: 'workspace.describe' });
  const message = async (method, params = {}, id) => {
    const current = await head();
    return {
      ...(id === undefined ? {} : { id }),
      method,
      params: { workspaceId: current.workspaceId, expectedRevision: current.revision, ...params },
    };
  };
  const request = async (method, params = {}, id) => {
    const result = await engine.call('api', await message(method, params, id));
    assert.equal(result.ok, true, result.error?.message);
    return result;
  };
  const compare = async (operation, slot) => {
    const current = await head();
    return engine.call('comparison', {
      operation,
      slot,
      workspaceId: current.workspaceId,
      expectedRevision: current.revision,
    });
  };
  const place = (x, name = 'minecraft:oak_planks', id) =>
    request(
      'edit.apply',
      { operations: [{ type: 'set', pos: [x, 2, 2], state: { Name: name } }] },
      id,
    );
  return { engine, blank, head, message, request, compare, place };
}

const guide = (y) => ({
  type: 'geometry',
  config: {
    kind: 'line',
    plane: 'xz',
    points: [
      [2, y, 5],
      [8, y, 5],
    ],
    state: { Name: 'minecraft:stone' },
    guidesOnly: true,
  },
});

test('A/B display snapshots while API reads and draft persistence retain the current design and undo chain', async (t) => {
  const { engine, head, request, compare, place } = await setup(t);
  async function addGuide(y) {
    const prepared = await request('construction.prepare', guide(y));
    await request('construction.commit', { id: prepared.value.id, name: '辅助线 ' + y });
  }
  await place(2);
  await request('objects.put', { object: { id: 'roof', name: '屋面 A', cells: [[2, 2, 2]] } });
  await addGuide(3);
  const aHead = await head();
  await compare('capture', 'a');
  await place(6);
  await request('objects.rename', { names: [{ id: 'roof', name: '屋面 B' }] });
  await addGuide(5);
  await request('comparison.capture', { slot: 'b' });
  await addGuide(7);
  await request('objects.rename', { names: [{ id: 'roof', name: '当前屋面' }] });
  await place(10, 'minecraft:glass');
  const before = await head(),
    original = await engine.call('package'),
    originalMesh = await engine.call('mesh');
  const a = await compare('show', 'a');
  assert.equal(a.preview, false);
  assert.equal(a.comparison.active, 'a');
  assert.equal(a.comparison.slots[0].capturedRevision, aHead.revision);
  assert.equal(a.add, 1);
  assert.equal(a.design.guides.length, 1);
  assert.equal(a.design.objects[0].name, '屋面 A');
  assert.equal((await engine.call('inspect', { pos: [10, 2, 2] })).after, null);
  const aMesh = await engine.call('mesh');
  assert.ok(aMesh.triangles > 0);
  assert.ok(aMesh.triangles < originalMesh.triangles);
  assert.equal((await head()).value.name, before.value.name);
  assert.deepEqual((await head()).value.history, before.value.history);
  assert.equal((await request('objects.list')).value[0].name, '当前屋面');
  assert.equal(
    (await request('scene.getBlocks', { positions: [[10, 2, 2]] })).value[0].state.Name,
    'minecraft:glass',
  );
  const context = await engine.call('context', { prompt: '继续调整当前屋面' });
  assert.deepEqual(context.palette, original.site.palette);
  assert.equal(context.objects[0].name, '当前屋面');
  const draft = await engine.call('draft'),
    saved = JSON.parse(strFromU8(gunzipSync(draft.payload)));
  assert.equal(saved.site.overlay.length, 3);
  assert.equal(saved.site.design.guides.length, 3);
  assert.equal(saved.site.design.objects[0].name, '当前屋面');
  assert.equal(saved.site.history.undo.length, before.value.history.undo);
  assert.equal(saved.site.comparison, undefined);
  const b = (await request('comparison.show', { slot: 'b' })).value;
  assert.equal(b.add, 2);
  assert.equal(b.design.guides.length, 2);
  assert.equal(b.design.objects[0].name, '屋面 B');
  const bMesh = await engine.call('mesh');
  assert.ok(bMesh.triangles > aMesh.triangles);
  assert.ok(bMesh.triangles < originalMesh.triangles);
  const ended = await compare('end');
  assert.equal(ended.comparison.active, null);
  assert.equal(ended.add, 3);
  assert.equal(ended.design.guides.length, 3);
  assert.equal(ended.design.objects[0].name, '当前屋面');
  assert.equal(ended.workspaceId, before.workspaceId);
  assert.equal(ended.revision, before.revision);
  assert.deepEqual((await head()).value.history, before.value.history);
  const after = await engine.call('package');
  assert.deepEqual(after.site, original.site);
  assert.deepEqual(after.assets, original.assets);
  assert.equal((await engine.call('mesh')).triangles, originalMesh.triangles);
  await request('history.undo');
  assert.equal(
    (await request('scene.getBlocks', { positions: [[10, 2, 2]] })).value[0].state,
    null,
  );
  await request('history.redo');
  assert.deepEqual((await engine.call('package')).site, original.site);
});

test('comparison blocks every editing entry and exports without losing already acknowledged requests', async (t) => {
  const { engine, head, request, message, compare } = await setup(t);
  const edit = await message(
    'edit.apply',
    {
      operations: [{ type: 'set', pos: [2, 2, 2], state: { Name: 'minecraft:glass' } }],
    },
    'placed-once',
  );
  const edited = await engine.call('api', edit);
  assert.equal(edited.ok, true);
  await compare('capture', 'a');
  await compare('capture', 'b');
  const show = await message('comparison.show', { slot: 'a' }, 'show-a-once'),
    shown = await engine.call('api', show);
  assert.equal(shown.ok, true);
  await compare('show', 'b');
  const before = await head();
  for (const method of [
    'edit.apply',
    'edit.brush',
    'history.undo',
    'history.redo',
    'transaction.begin',
    'transaction.apply',
    'transaction.commit',
    'transaction.abort',
    'selection.transform',
    'objects.put',
    'objects.rename',
    'collections.put',
    'selectionSets.put',
    'views.put',
    'workplanes.put',
    'measurements.put',
    'prefabs.put',
    'prefabs.place',
    'palettes.put',
    'proposal.prepare',
    'proposal.commit',
    'construction.prepare',
    'construction.commit',
  ]) {
    const reply = await engine.call('api', await message(method));
    assert.equal(reply.ok, false, method);
    assert.equal(reply.error.code, 'COMPARISON_ACTIVE', method);
  }
  for (const action of [
    'edit',
    'brush',
    'undo',
    'redo',
    'origin',
    'protect',
    'unprotect',
    'studio',
    'rename',
    'beginStroke',
    'resources',
    'resourceLibrary',
    'prepareConstruction',
    'commitConstruction',
    'detachGeneration',
    'preview',
    'accept',
    'package',
    'compressed',
    'sponge',
    'export',
    'deliveryArchive',
    'deliveryReport',
  ])
    await assert.rejects(engine.call(action), /只读对比/, action);
  await assert.rejects(compare('capture', 'a'), /返回当前设计/);
  assert.deepEqual(await engine.call('api', edit), edited);
  assert.deepEqual(await engine.call('api', show), shown);
  assert.equal((await compare('inspect')).comparison.active, 'b');
  const current = await head();
  assert.equal(current.workspaceId, before.workspaceId);
  assert.equal(current.revision, before.revision);
  assert.deepEqual(current.value.history, before.value.history);
  await request('comparison.end');
  assert.equal(
    (await request('scene.getBlocks', { positions: [[2, 2, 2]] })).value[0].state.Name,
    'minecraft:glass',
  );
  await request('history.undo');
  assert.equal((await request('scene.getBlocks', { positions: [[2, 2, 2]] })).value[0].state, null);
});

test('opening a different workspace clears comparison snapshots and rejects old workspace messages', async (t) => {
  const { engine, blank, head, request, compare, message, place } = await setup(t);
  await place(2);
  await compare('capture', 'a');
  const oldMessage = await message('comparison.show', { slot: 'a' });
  await compare('show', 'a');
  const old = await head();
  await engine.call('import', blank('新的工程'));
  const current = await head();
  assert.notEqual(current.workspaceId, old.workspaceId);
  assert.equal(current.value.name, '新的工程');
  assert.deepEqual(current.value.comparison, { active: null, slots: [] });
  const stale = await engine.call('api', oldMessage);
  assert.equal(stale.ok, false);
  assert.ok(['WORKSPACE_CHANGED', 'REVISION_CONFLICT'].includes(stale.error.code));
  await assert.rejects(compare('show', 'a'), /先记录方案 A/);
  assert.equal((await request('scene.getBlocks', { positions: [[2, 2, 2]] })).value[0].state, null);
  assert.equal((await engine.call('package')).site.title, '新的工程');
});

test('unconfirmed construction, proposals, strokes and transactions must finish before recording or viewing comparisons', async (t) => {
  const { engine, head, request, compare } = await setup(t);
  await compare('capture', 'a');
  const construction = await request('construction.prepare', guide(3));
  await assert.rejects(compare('capture', 'b'), /完成或暂存当前编辑/);
  await assert.rejects(compare('show', 'a'), /完成或暂存当前编辑/);
  assert.equal((await head()).value.pending.constructionId, construction.value.id);
  await request('construction.cancel', { id: construction.value.id });
  const proposal = await request('proposal.prepare', {
    operations: [{ type: 'set', pos: [8, 2, 2], state: { Name: 'minecraft:glass' } }],
  });
  const blocked = await engine.call('api', {
    method: 'comparison.capture',
    params: { slot: 'b', workspaceId: proposal.workspaceId, expectedRevision: proposal.revision },
  });
  assert.equal(blocked.ok, false);
  assert.match(blocked.error.message, /完成或暂存当前编辑/);
  assert.equal((await head()).value.proposal.id, proposal.value.id);
  await request('proposal.cancel', { proposalId: proposal.value.id });
  const tx = await request('transaction.begin');
  await assert.rejects(compare('capture', 'b'), /完成或暂存当前编辑/);
  await request('transaction.abort', { transactionId: tx.value.transactionId });
  await engine.call('beginStroke');
  await assert.rejects(compare('capture', 'b'), /完成或暂存当前编辑/);
  await engine.call('endStroke');
  await compare('capture', 'b');
  const state = await compare('inspect');
  assert.equal(state.comparison.slots.length, 2);
  assert.equal(state.changes, 0);
  assert.equal(state.design.guides?.length || 0, 0);
});

test('temporary comparison acknowledgements are excluded from durable receipts when the current design is saved', async (t) => {
  const store = new EngineStore(':memory:');
  let engine = await EngineController.open({ store, key: 'comparison' });
  t.after(async () => {
    await engine.close();
    store.close();
  });
  async function send(id, method, params = {}) {
    const head = await engine.call('api', { method: 'workspace.describe' }),
      message = {
        id,
        method,
        params: { workspaceId: head.workspaceId, expectedRevision: head.revision, ...params },
      },
      result = await engine.call('api', message);
    assert.equal(result.ok, true, result.error?.message);
    return { message, result };
  }
  const operations = (x) => [{ type: 'set', pos: [x, 2, 2], state: { Name: 'minecraft:glass' } }];
  const first = await send('edit-first', 'edit.apply', { operations: operations(2) });
  await send('remember-a', 'comparison.capture', { slot: 'a' });
  const show = await send('show-a', 'comparison.show', { slot: 'a' });
  await send('return-current', 'comparison.end');
  await send('edit-last', 'edit.apply', { operations: operations(6) });
  assert.deepEqual(
    store.load('comparison').head.receipts.map(([id]) => id),
    ['edit-first', 'edit-last'],
  );
  await engine.close();
  engine = await EngineController.open({ store, key: 'comparison' });
  const head = await engine.call('api', { method: 'workspace.describe' });
  assert.deepEqual(head.value.comparison, { active: null, slots: [] });
  assert.deepEqual(await engine.call('api', first.message), first.result);
  assert.equal((await engine.call('api', show.message)).ok, false);
  assert.equal(head.value.history.undo, 2);
});

test('page comparison requests render fresh display state without dirtying the design or cancelling edits', async () => {
  const summaries = [],
    calls = [],
    result = { ok: true, value: { comparison: { active: 'a', slots: [] } } },
    live = { workspaceId: 'same-workspace', revision: 4, comparison: { active: 'b', slots: [] } };
  let dirty = 0,
    rendered = 0,
    cancelled = 0,
    checked = 0,
    reply = result;
  const page = new PageRequests({
    call: async (action, request) => {
      calls.push([action, request?.method]);
      return action === 'summary' ? live : reply;
    },
    baselineRequest: () => {
      throw Error('比较不读取持久化API');
    },
    capabilities: () => [],
    beforeComparison: () => checked++,
    cancelOperations: () => cancelled++,
    refresh: (summary) => summaries.push(summary),
    markDirty: () => dirty++,
    render: async () => rendered++,
  });
  for (const method of ['comparison.capture', 'comparison.show', 'comparison.end'])
    assert.equal(await page.request({ method, params: { slot: 'a' } }), result);
  assert.deepEqual(summaries, [live, live, live]);
  assert.equal(rendered, 3);
  assert.equal(checked, 2);
  assert.equal(cancelled, 0);
  assert.equal(dirty, 0);
  await page.request({ method: 'comparison.inspect' });
  assert.equal(rendered, 3);
  reply = { ok: false, error: { message: '请先暂存草图' } };
  await page.request({ method: 'comparison.show', params: { slot: 'a' } });
  assert.equal(rendered, 3);
  assert.equal(dirty, 0);
  assert.equal(calls.filter(([action]) => action === 'summary').length, 3);
  const count = calls.length;
  page.beforeComparison = () => {
    throw Error('未确认草图');
  };
  await assert.rejects(
    page.request({ method: 'comparison.show', params: { slot: 'a' } }),
    /未确认草图/,
  );
  assert.equal(calls.length, count);
  assert.equal(cancelled, 0);
  assert.equal(dirty, 0);
});

test('comparison shows the full scene then restores the exact nested isolation and its parent', async (t) => {
  const { engine, request, compare, place, head } = await setup(t);
  const mesh = () =>
    engine.call('meshChunks', {
      mode: 'after',
      cut: 4095,
      plants: true,
      showGround: true,
      showExisting: true,
    });
  const positions = (value) =>
    value.chunks.flatMap((chunk) =>
      chunk.buckets.flatMap((bucket) => Array.from(bucket.positions)),
    );
  await place(2);
  await place(6);
  await place(10);
  await request('objects.put', {
    object: {
      id: 'house',
      name: '住宅',
      cells: [
        [2, 2, 2],
        [6, 2, 2],
      ],
    },
  });
  await request('objects.put', { object: { id: 'window', name: '窗', cells: [[2, 2, 2]] } });
  await compare('capture', 'a');
  await compare('capture', 'b');
  await engine.call('viewIsolation', { push: true, objectIds: ['house'] });
  await engine.call('viewIsolation', { contextVisible: true });
  const parent = (await engine.call('summary')).view;
  await engine.call('viewIsolation', { push: true, objectIds: ['window'] });
  const before = await engine.call('summary'),
    isolatedPositions = positions(await mesh()),
    current = await head();
  assert.equal(before.view.depth, 2);
  assert.equal(before.view.isolatedCells, 1);
  assert.ok(isolatedPositions.length > 0);
  for (const slot of ['a', 'b']) {
    const shown = await compare('show', slot);
    assert.equal(shown.view.isolated, false);
    assert.equal(shown.view.depth, 0);
    assert.ok(positions(await mesh()).length > isolatedPositions.length);
  }
  const restored = await compare('end');
  assert.deepEqual(restored.view, before.view);
  assert.deepEqual(positions(await mesh()), isolatedPositions);
  assert.equal(restored.workspaceId, current.workspaceId);
  assert.equal(restored.revision, current.revision);
  await engine.call('viewIsolation', { pop: true });
  assert.deepEqual((await engine.call('summary')).view, parent);
  assert.equal(parent.depth, 1);
  assert.equal(parent.isolatedCells, 2);
  assert.equal(parent.contextVisible, true);
  await engine.call('viewIsolation', { pop: true });
  assert.equal((await engine.call('summary')).view.isolated, false);
});
