import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync, strToU8, strFromU8, zipSync } from 'fflate';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { EngineController } from '../../local-engine/controller.mjs';
import { EngineStore } from '../../local-engine/store.mjs';
import { Site } from '../src/core/site.js';
import { emptyProject, stateKey, tag } from '../src/minecraft/codec.js';
import { fallback, Resources } from '../src/materials/resources.js';

const texture = 'assets/minecraft/textures/block/stone.png';
const source = {
  projectId: 'other-saved-project',
  version: 3,
  name: '另一片坡地',
  time: '2026-10-10T09:30:00Z',
  note: '坡顶屋面',
};
const options = {
  mode: 'after',
  cut: 4095,
  plants: true,
  showGround: true,
  showExisting: true,
  enabled: true,
};
const encode = (pkg) => gzipSync(strToU8(JSON.stringify(pkg)));
function fixture(name, origin, image, x) {
  const states = [{ Name: 'minecraft:stone' }, { Name: 'create:shaft', Properties: { axis: 'y' } }];
  const site = new Site({
    ...emptyProject(name),
    size: [24, 24, 24],
    origin,
    metadata: { originConfirmed: true, sourceHash: 'source-' + name },
    palette: states,
    blocks: [
      { pos: [x, 2, 2], state: 0 },
      { pos: [x + 2, 2, 2], state: 1, nbt: tag(10, { Speed: tag(5, 16) }) },
    ],
  });
  const models = Object.fromEntries(
    states.map((state) => {
      const model = fallback(state);
      model.missing = false;
      model.issues = [];
      for (const part of model.parts)
        for (const element of part.elements)
          for (const face of Object.values(element.faces)) face.texture = texture;
      return [stateKey(state), model];
    }),
  );
  return {
    liteSchema: 1,
    site: site.pack(),
    assets: {
      models,
      images: { color: image },
      textures: { [texture]: { image: 'color', tile: null } },
    },
  };
}
async function setup(t) {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const current = fixture('当前坡地', [100, 40, -20], 'data:image/png;base64,current', 2);
  const history = fixture(source.name, [-800, 60, 900], 'data:image/png;base64,history', 8);
  await engine.call('load', { package: current });
  const guard = async () => {
    const head = await engine.call('api', { method: 'workspace.describe' });
    return { workspaceId: head.workspaceId, expectedRevision: head.revision };
  };
  const compare = async (operation, extras = {}) =>
    engine.call('comparison', { ...extras, operation, ...(await guard()) });
  const api = async (method, params = {}) => {
    const result = await engine.call('api', { method, params: { ...params, ...(await guard()) } });
    assert.equal(result.ok, true, result.error?.message);
    return result;
  };
  return { engine, current, history, guard, compare, api };
}

test('formal history displays its own source, origin and resources while current editing and drafts remain untouched', async (t) => {
  const { engine, current, history, guard, compare, api } = await setup(t);
  await api('edit.apply', {
    operations: [{ type: 'set', pos: [3, 4, 5], state: { Name: 'minecraft:glass' } }],
  });
  await api('objects.put', {
    object: {
      id: 'current-house',
      name: '当前屋面',
      cells: [
        [2, 2, 2],
        [4, 2, 2],
      ],
    },
  });
  await compare('capture', { slot: 'a' });
  await engine.call('viewIsolation', { push: true, objectIds: ['current-house'] });
  await engine.call('viewIsolation', { push: true, selection: { min: [2, 2, 2], max: [4, 2, 2] } });
  const original = await engine.call('package'),
    before = await engine.call('summary'),
    head = await guard();
  const shown = await compare('load', { bytes: encode(history), source });
  assert.equal(shown.comparison.active, 'history');
  assert.deepEqual(
    shown.comparison.slots.find((s) => s.slot === 'history'),
    { slot: 'history', name: source.name, source },
  );
  assert.deepEqual(shown.origin, history.site.origin);
  assert.equal(shown.originConfirmed, true);
  assert.equal(shown.view.isolated, false);
  assert.equal(shown.workspaceId, head.workspaceId);
  assert.equal(shown.revision, head.expectedRevision);
  assert.deepEqual((await engine.call('inspect', { pos: [8, 2, 2] })).world, [-792, 62, 902]);
  for (const action of ['mesh', 'meshChunks', 'createScene']) {
    const result = await engine.call(action, options);
    assert.equal(result.textures[texture].uri, history.assets.images.color, action);
    if (action === 'createScene') assert.equal(result.instances[0].rpm, 16);
  }
  assert.equal((await api('workspace.describe')).value.name, '当前坡地');
  assert.equal(
    (await api('scene.getBlocks', { positions: [[3, 4, 5]] })).value[0].state.Name,
    'minecraft:glass',
  );
  const draft = await engine.call('draft');
  const payload = JSON.parse(strFromU8(gunzipSync(draft.payload)));
  assert.equal(payload.site.title, '当前坡地');
  assert.equal(payload.site.sourceHash, current.site.sourceHash);
  assert.deepEqual(payload.site.origin, current.site.origin);
  assert.equal(payload.site.overlay.length, 1);
  const storedAssets = JSON.parse(strFromU8(gunzipSync(draft.assetBytes)));
  assert.ok(Object.values(storedAssets.images).includes(current.assets.images.color));
  assert.ok(!Object.values(storedAssets.images).includes(history.assets.images.color));
  await compare('show', { slot: 'a' });
  assert.equal(
    (await engine.call('mesh', options)).textures[texture].uri,
    current.assets.images.color,
  );
  await compare('show', { slot: 'history' });
  assert.equal(
    (await engine.call('mesh', options)).textures[texture].uri,
    history.assets.images.color,
  );
  const ended = await compare('end');
  assert.deepEqual(ended.view, before.view);
  assert.deepEqual(await guard(), head);
  assert.deepEqual((await engine.call('package')).site, original.site);
  for (const action of ['mesh', 'meshChunks', 'createScene']) {
    const result = await engine.call(action, options);
    assert.equal(result.textures[texture].uri, current.assets.images.color, action);
  }
  await api('history.undo');
  assert.equal((await api('objects.list')).value.length, 0);
});

test('invalid history packages and descriptors keep the already displayed version and original isolation', async (t) => {
  const { engine, history, compare, guard } = await setup(t);
  await engine.call('viewIsolation', { push: true, selection: { min: [2, 2, 2], max: [2, 2, 2] } });
  const view = (await engine.call('summary')).view;
  await compare('load', { bytes: encode(history), source });
  const before = await engine.call('summary'),
    head = await guard();
  const missingPalette = structuredClone(history);
  delete missingPalette.site.palette;
  const invalidBlock = structuredClone(history);
  invalidBlock.site.overlay = [{ pos: [-1, 2, 2], state: { Name: 'minecraft:glass' } }];
  const badSize = structuredClone(history);
  badSize.site.base.size = [0, 1, 1];
  const badDesign = structuredClone(history);
  badDesign.site.design = {};
  const badModels = structuredClone(history);
  badModels.assets.models = { broken: {} };
  const invalid = [
    { bytes: encode(badDesign), source },
    { bytes: encode(badModels), source },
    { bytes: Uint8Array.of(1, 2, 3), source },
    { bytes: encode({ liteSchema: 1 }), source },
    { bytes: encode(missingPalette), source },
    { bytes: encode(invalidBlock), source },
    { bytes: encode(badSize), source },
    { bytes: encode(history), source: { ...source, projectId: '' } },
    { bytes: encode(history), source: { ...source, version: 0 } },
    { bytes: encode(history), source: { ...source, time: 'not a date' } },
    { bytes: encode(history), source: { ...source, note: undefined } },
    { bytes: [], source },
  ];
  for (const input of invalid) {
    await assert.rejects(compare('load', input));
    assert.deepEqual(await engine.call('summary'), before);
    assert.equal(
      (await engine.call('mesh', options)).textures[texture].uri,
      history.assets.images.color,
    );
    assert.deepEqual(await guard(), head);
  }
  assert.deepEqual((await compare('end')).view, view);
  await compare('load', { bytes: encode(history), source });
  await engine.call('import', {
    name: 'new.json',
    bytes: strToU8(JSON.stringify(emptyProject())).buffer,
  });
  assert.deepEqual((await engine.call('summary')).comparison, { active: null, slots: [] });
  await assert.rejects(compare('show', { slot: 'history' }), /选择一个历史版本/);
});

test('history API load replays exact byte content and rejects changed payloads under the same request ID', async (t) => {
  const { engine, history, guard } = await setup(t),
    bytes = encode(history);
  const message = {
    id: 'history-once',
    method: 'comparison.load',
    params: { bytes: bytes.buffer, source, ...(await guard()) },
  };
  const loaded = await engine.call('api', message);
  assert.equal(loaded.ok, true, loaded.error?.message);
  assert.equal(loaded.value.comparison.active, 'history');
  assert.deepEqual(
    await engine.call('api', {
      ...message,
      params: { ...message.params, bytes: new Uint8Array(bytes) },
    }),
    loaded,
  );
  const changed = structuredClone(history);
  changed.site.title = 'changed';
  const rejected = await engine.call('api', {
    ...message,
    params: { ...message.params, bytes: encode(changed).buffer },
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, 'REQUEST_ID_REUSED');
  for (const action of ['edit', 'package', 'compressed', 'export'])
    await assert.rejects(engine.call(action), /只读对比/);
  const mutation = await engine.call('api', {
    method: 'edit.apply',
    params: { operations: [], ...(await guard()) },
  });
  assert.equal(mutation.error.code, 'COMPARISON_ACTIVE');
});

test('durable engine retains the current workspace, not loaded history or its temporary receipt', async (t) => {
  const store = new EngineStore(':memory:');
  let engine = await EngineController.open({ store, key: 'history' });
  t.after(async () => {
    await engine.close();
    store.close();
  });
  const current = fixture('当前坡地', [100, 40, -20], 'data:image/png;base64,current', 2);
  await engine.call('load', { package: current });
  const history = fixture(source.name, [-800, 60, 900], 'data:image/png;base64,history', 8);
  const head = await engine.call('api', { method: 'workspace.describe' });
  const loaded = await engine.call('api', {
    id: 'load-history',
    method: 'comparison.load',
    params: {
      bytes: encode(history),
      source,
      workspaceId: head.workspaceId,
      expectedRevision: head.revision,
    },
  });
  assert.equal(loaded.ok, true, loaded.error?.message);
  await engine.call('draft', { title: '当前坡地' });
  assert.ok(!store.load('history').head.receipts.some(([id]) => id === 'load-history'));
  await engine.close();
  engine = await EngineController.open({ store, key: 'history' });
  const restored = await engine.call('summary');
  assert.equal(restored.name, '当前坡地');
  assert.deepEqual(restored.origin, current.site.origin);
  assert.deepEqual(restored.comparison, { active: null, slots: [] });
  assert.equal(
    (await engine.call('mesh', options)).textures[texture].uri,
    current.assets.images.color,
  );
});

test('history accepts triangle-only OBJ models produced by the resource decoder and saved bundle', async (t) => {
  const { engine, compare } = await setup(t),
    resources = new Resources();
  resources.addZip(
    zipSync({
      'assets/custom/models/block/sculpture.json': strToU8(
        JSON.stringify({
          loader: 'neoforge:obj',
          model: 'custom:models/sculpture.obj',
          textures: { finish: 'custom:block/sculpture' },
        }),
      ),
      'assets/custom/models/sculpture.obj': strToU8(
        'mtllib sculpture.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nvt 0 0\nvt 1 0\nvt 0 1\nusemtl surface\nf 1/1 2/2 3/3',
      ),
      'assets/custom/models/sculpture.mtl': strToU8('newmtl surface\nmap_Kd #finish'),
      'assets/custom/textures/block/sculpture.png': Uint8Array.of(137, 80, 78, 71),
    }),
    'OBJ fixture.zip',
  );
  const model = resources.partial('custom:block/sculpture'),
    state = { Name: 'custom:sculpture' };
  assert.deepEqual(model.parts[0].elements, []);
  assert.equal(model.parts[0].triangles.length, 1);
  const site = new Site({
      ...emptyProject('三角网格'),
      palette: [state],
      blocks: [{ pos: [0, 0, 0], state: 0 }],
    }),
    assets = resources.bundle([]);
  assets.models[stateKey(state)] = model;
  await compare('load', { source, bytes: encode({ liteSchema: 1, site: site.pack(), assets }) });
  const mesh = await engine.call('mesh', options);
  assert.equal(mesh.triangles, 1);
  assert.equal(mesh.buckets[0].positions.length, 9);
  assert.equal(
    mesh.textures['assets/custom/textures/block/sculpture.png'].uri,
    'data:image/png;base64,iVBORw==',
  );
});
