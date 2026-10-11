import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { EngineController } from '../../local-engine/controller.mjs';
import { EngineStore } from '../../local-engine/store.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
import { coordKey } from '../src/core/site.js';

const state = { Name: 'minecraft:oak_planks' };
const cube = (height = 3) =>
  [
    'v 0 0 0',
    'v 3 0 0',
    `v 3 ${height} 0`,
    `v 0 ${height} 0`,
    'v 0 0 3',
    'v 3 0 3',
    `v 3 ${height} 3`,
    `v 0 ${height} 3`,
    'f 4 3 2 1',
    'f 5 6 7 8',
    'f 1 2 6 5',
    'f 2 3 7 6',
    'f 3 4 8 7',
    'f 4 1 5 8',
  ].join('\n');
const source = (objText = cube()) => ({ id: 'house-mesh', name: 'Imported house', objText });
const config = (position = [8, 3, 8]) => ({
  sourceId: 'house-mesh',
  transform: { position },
  mode: 'surface',
  smart: false,
  state,
  roles: {},
});
const historySource = {
  projectId: 'saved-mesh',
  version: 1,
  name: 'Earlier model',
  time: '2026-10-10T12:00:00Z',
  note: 'Original geometry',
};

function client(getEngine) {
  const head = () => getEngine().call('api', { method: 'workspace.describe' });
  const message = async (method, params = {}, id) => {
    const current = await head();
    return {
      id,
      method,
      params: { workspaceId: current.workspaceId, expectedRevision: current.revision, ...params },
    };
  };
  const request = async (method, params = {}, id) => {
    const result = await getEngine().call('api', await message(method, params, id));
    assert.equal(result.ok, true, result.error?.message);
    return result;
  };
  const build = async (recipe, name) => {
    const prepared = await request('construction.prepare', {
      type: 'mesh',
      config: recipe,
      includeMesh: true,
    });
    assert.equal(prepared.value.conflictSummary.count, 0);
    const committed = await request('construction.commit', {
      id: prepared.value.id,
      name,
      policy: {},
    });
    return { prepared: prepared.value, summary: committed.value };
  };
  return { head, message, request, build };
}

async function worker(t) {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  return { engine, ...client(() => engine) };
}

const packed = async (engine) => (await engine.call('package', { preserveTitle: true })).site;
const noSourceText = (value) => assert.equal(JSON.stringify(value).includes('"objText"'), false);

test('worker mesh placement, conversion, linked editing, duplication and portable reopening form one reversible workflow', async (t) => {
  const { engine, head, request, build } = await worker(t);
  const added = await request('meshes.put', { source: source() });
  noSourceText(added);
  noSourceText(await head());
  noSourceText(await engine.call('summary'));
  const initial = await packed(engine),
    beforePose = await head();
  const placed = await build({ ...config(), saveOnly: true }, 'Source placement');
  assert.equal(placed.summary.add, 0);
  assert.equal(placed.summary.design.objects.length, 0);
  assert.deepEqual(placed.summary.design.meshSources[0].transform.position, [8, 3, 8]);
  assert.equal((await head()).value.history.undo, beforePose.value.history.undo + 1);
  await request('history.undo');
  assert.deepEqual(await packed(engine), initial);
  await request('history.redo');

  const beforeBuild = await packed(engine),
    oldHistory = (await head()).value.history.undo;
  const converted = await build(config(), 'First house');
  assert.ok(converted.prepared.buckets.length);
  assert.ok(converted.summary.add > 0);
  assert.equal((await head()).value.history.undo, oldHistory + 1);
  const first = converted.summary.design.objects[0];
  assert.equal(first.kind, 'mesh');
  assert.equal(first.guideId, undefined);
  assert.equal(converted.summary.design.meshSources[0].hidden, true);
  const built = await packed(engine);
  await request('history.undo');
  const undone = await packed(engine);
  // The material palette is an append-only index; undo restores cells and source state.
  assert.deepEqual(undone.overlay, beforeBuild.overlay);
  assert.deepEqual(undone.design, beforeBuild.design);
  await request('history.redo');
  assert.deepEqual(await packed(engine), built);

  const [edited, removed] = built.design.objects[0].generation.records.map((r) => r.pos);
  await request('edit.apply', {
    operations: [
      { type: 'set', pos: edited, state: { Name: 'minecraft:glass' } },
      { type: 'set', pos: removed, state: null },
    ],
  });
  const rebuild = await build(
    { ...config(), objectId: first.id, transform: { position: [8, 3, 8], scale: [1, 1.5, 1] } },
    'First house edited',
  );
  assert.equal(rebuild.prepared.regeneration.manual, 2);
  const live = (await request('scene.getBlocks', { positions: [edited, removed] })).value;
  assert.equal(live[0].state.Name, 'minecraft:glass');
  assert.equal(live[1].state, null);
  const beforeDuplicate = (await packed(engine)).design.objects[0];
  const duplicate = await build(config([26, 3, 8]), 'Second house');
  assert.equal(duplicate.summary.design.objects.length, 2);
  assert.deepEqual((await packed(engine)).design.objects[0], beforeDuplicate);
  assert.deepEqual(duplicate.summary.design.objects[1].recipe.transform.position, [26, 3, 8]);
  const original = await packed(engine),
    bytes = await engine.call('compressed', { preserveTitle: true });
  const reopened = new EngineWorkspace();
  t.after(() => reopened.close());
  await reopened.call('import', { name: 'mesh-project.craftlite', bytes });
  assert.deepEqual(await packed(reopened), original);
  assert.equal(
    (await reopened.call('api', { method: 'meshes.read', params: { id: 'house-mesh' } })).value
      .objText,
    cube(),
  );
  const reopenedClient = client(() => reopened);
  const rebuilt = await reopenedClient.build(
    {
      ...config([26, 3, 8]),
      objectId: original.design.objects[1].id,
      state: { Name: 'minecraft:stone_bricks' },
    },
    'Second house material',
  );
  assert.equal(rebuilt.summary.design.objects.length, 2);
  assert.deepEqual((await packed(reopened)).design.objects[0], original.design.objects[0]);
});

test('mesh source replacement and comparison use typed provenance and the correct displayed geometry', async (t) => {
  const { engine, head, request, message, build } = await worker(t);
  await request('meshes.put', { source: source() });
  const first = await build(config(), 'House');
  const oldBytes = await engine.call('compressed', { preserveTitle: true });
  await request('comparison.capture', { slot: 'a' });
  const oldGeometry = await engine.call('meshSourceGeometry', { id: 'house-mesh' });
  noSourceText(oldGeometry);
  assert.equal(oldGeometry.bounds.max[1], 3);
  await request('meshes.put', { source: { id: 'house-mesh', objText: cube(5) } });
  let links = (await request('generation.links')).value;
  assert.equal(links.objects[0].sources[0].kind, 'mesh');
  assert.equal(links.objects[0].sources[0].revision, 2);
  assert.equal(links.objects[0].outdated, true);
  const live = await packed(engine),
    before = await head();
  for (const open of [
    () => request('comparison.show', { slot: 'a' }),
    () => request('comparison.load', { bytes: oldBytes, source: historySource }),
  ]) {
    await open();
    assert.equal((await engine.call('meshSourceGeometry', { id: 'house-mesh' })).bounds.max[1], 3);
    assert.equal((await request('meshes.read', { id: 'house-mesh' })).value.objText, cube(5));
    noSourceText(await head());
    noSourceText(await engine.call('summary'));
    for (const method of [
      'meshes.put',
      'meshes.remove',
      'construction.prepare',
      'construction.commit',
    ]) {
      const result = await engine.call('api', await message(method));
      assert.equal(result.ok, false);
      assert.equal(result.error.code, 'COMPARISON_ACTIVE', method);
    }
    await request('comparison.end');
    assert.deepEqual(await packed(engine), live);
    assert.deepEqual((await head()).value.history, before.value.history);
  }
  const oldObject = first.summary.design.objects[0];
  await build({ ...oldObject.recipe, objectId: oldObject.id }, 'Updated geometry');
  links = (await request('generation.links')).value;
  assert.equal(links.objects[0].outdated, false);
  assert.equal(
    (await packed(engine)).design.objects[0].generation.sourceVersions['mesh:house-mesh'],
    2,
  );
});

test('model previews preserve unknown materials and reject terrain, protected regions and locked collections atomically', async (t) => {
  const { engine, request, message, build } = await worker(t);
  await request('meshes.put', { source: source() });
  await build(config(), 'Cell fixture');
  const positions = (await packed(engine)).overlay.slice(0, 4).map((b) => b.pos);
  const project = {
    ...emptyProject('Protected terrain'),
    size: [40, 16, 40],
    palette: [{ Name: 'minecraft:stone' }, { Name: 'minecraft:oak_planks' }],
    blocks: positions.map((pos, index) => ({ pos, state: index === 1 ? 1 : 0 })),
    metadata: {
      design: {
        objects: [
          {
            id: 'locked',
            name: 'Locked wall',
            min: positions[3],
            max: positions[3],
            cells: [coordKey(...positions[3])],
            collectionId: 'keep',
          },
        ],
        collections: [{ id: 'keep', name: 'Protected house', locked: true }],
        animations: {},
      },
    },
  };
  await engine.call('import', {
    name: 'protected.json',
    bytes: new TextEncoder().encode(JSON.stringify(project)),
  });
  await engine.call('protect', { min: positions[2], max: positions[2], name: 'Keep slope' });
  await request('meshes.put', { source: source() });
  const custom = { ...config(), smart: true, state: { Name: 'other_mod:unknown_detail' } };
  const before = await packed(engine);
  const preview = await request('construction.prepare', {
    type: 'mesh',
    config: custom,
    includeMesh: true,
    policy: {},
  });
  assert.deepEqual(
    preview.value.conflictSummary.groups.map((group) => group.kind),
    ['terrain', 'existing', 'protected', 'locked'],
  );
  assert.ok(preview.value.buckets.length);
  const rejected = await engine.call(
    'api',
    await message('construction.commit', { id: preview.value.id, policy: {} }),
  );
  assert.equal(rejected.ok, false);
  assert.deepEqual(await packed(engine), before);
  const permissive = await request('construction.prepare', {
    type: 'mesh',
    config: custom,
    policy: { allowTerrain: true, allowExisting: true },
  });
  assert.deepEqual(
    permissive.value.conflictSummary.groups.map((group) => group.kind),
    ['protected', 'locked'],
  );
  assert.equal(
    (
      await engine.call(
        'api',
        await message('construction.commit', {
          id: permissive.value.id,
          policy: { allowTerrain: true, allowExisting: true },
        }),
      )
    ).ok,
    false,
  );
  assert.deepEqual(await packed(engine), before);
  const clear = await build(
    { ...custom, transform: { position: [26, 3, 26], scale: [0.7, 0.7, 0.7] } },
    'Custom model',
  );
  assert.ok(clear.prepared.warnings.some((warning) => warning.includes('主体方块')));
  const after = await packed(engine);
  assert.deepEqual(after.base, before.base);
  assert.ok(after.overlay.length);
  assert.ok(after.overlay.every((block) => block.state.Name === 'other_mod:unknown_detail'));
});

test('mesh metadata, original OBJ text, generated provenance and acknowledgement replay survive SQLite reopen', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'craftstudio-mesh-workflow-'));
  const database = join(folder, 'workspace.sqlite');
  let store = new EngineStore(database),
    engine = await EngineController.open({ store, key: 'mesh' });
  t.after(async () => {
    await engine.close();
    store.close();
    await rm(folder, { recursive: true, force: true });
  });
  const { head, request, message, build } = client(() => engine);
  const put = await message('meshes.put', { source: source() }, 'durable-mesh-source');
  const receipt = await engine.call('api', put);
  assert.equal(receipt.ok, true, receipt.error?.message);
  const restart = async () => {
    await engine.close();
    store.close();
    store = new EngineStore(database);
    engine = await EngineController.open({ store, key: 'mesh' });
  };
  await restart();
  assert.deepEqual(await engine.call('api', put), receipt);
  assert.equal((await request('meshes.read', { id: 'house-mesh' })).value.objText, cube());
  assert.equal((await head()).value.history.undo, 1);
  await build({ ...config(), saveOnly: true }, 'Pose');
  await build(config(), 'Durable house');
  const before = await packed(engine),
    previous = await head();
  await restart();
  assert.deepEqual(await packed(engine), before);
  assert.equal((await request('meshes.read', { id: 'house-mesh' })).value.objText, cube());
  assert.deepEqual((await head()).value.history, previous.value.history);
  noSourceText(await head());
  noSourceText(await engine.call('summary'));
  const object = before.design.objects[0];
  await request('history.undo');
  assert.equal((await engine.call('summary')).design.objects.length, 0);
  assert.equal((await request('meshes.read', { id: 'house-mesh' })).value.objText, cube());
  await restart();
  await request('history.redo');
  assert.deepEqual(await packed(engine), before);
  await build(
    { ...object.recipe, objectId: object.id, state: { Name: 'minecraft:stone_bricks' } },
    'Rebuilt after restart',
  );
  const final = await packed(engine);
  await restart();
  assert.deepEqual(await packed(engine), final);
  assert.equal((await request('generation.links')).value.objects[0].sources[0].kind, 'mesh');
});
