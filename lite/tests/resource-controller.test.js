import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { ResourceLibrary } from '../src/materials/resource-library.js';
import { ResourceController } from '../src/materials/resource-controller.js';

const archive = (name, label) => ({
  name,
  bytes: zipSync({
    'assets/minecraft/lang/en_us.json': strToU8(JSON.stringify({ 'block.minecraft.stone': label })),
    'assets/minecraft/blockstates/stone.json': strToU8(
      JSON.stringify({ variants: { '': { model: 'minecraft:block/stone' } } }),
    ),
    'assets/minecraft/models/block/stone.json': strToU8(
      JSON.stringify({
        elements: [
          {
            from: [0, 0, 0],
            to: [16, 16, 16],
            faces: { up: { texture: 'minecraft:block/stone' } },
          },
        ],
      }),
    ),
  }),
});
async function setup(t) {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const call = (action, data) => engine.call(action, data);
  const storage = {
    value: undefined,
    async preference(key, value) {
      if (value !== undefined) this.value = structuredClone(value);
      return this.value;
    },
  };
  const library = new ResourceLibrary(storage, call),
    events = [];
  const controller = new ResourceController({
    library,
    describe: () => call('api', { method: 'workspace.describe' }),
    refresh: () => events.push('refresh'),
    clearTextures: () => {},
    markDirty: () => events.push('dirty'),
    changed: () => events.push('rows'),
    render: async () => events.push('render'),
  });
  const guard = async () => {
    const head = await controller.snapshot();
    return { workspaceId: head.workspaceId, expectedRevision: head.revision };
  };
  return { engine, call, storage, library, controller, guard, events };
}
test('API resources share names and precedence with the engine without exposing archive bytes', async (t) => {
  const { controller, guard, call, events } = await setup(t);
  const added = await controller.request({
    action: 'add',
    files: [archive('base.jar', 'Base'), archive('override.zip', 'Override')],
    ...(await guard()),
  });
  assert.equal(added.entries.length, 2);
  assert.equal(added.entries[0].bytes, undefined);
  assert.equal(added.precedence, 'last-enabled-wins');
  assert.deepEqual(events, ['refresh', 'dirty', 'rows', 'render']);
  let materials = await call('api', { method: 'materials.search', params: { query: 'stone' } });
  assert.equal(
    materials.value.items.find((item) => item.id === 'minecraft:stone').label,
    'Override',
  );
  await controller.request({
    action: 'configure',
    order: added.entries.map((entry) => entry.id).reverse(),
    ...(await guard()),
  });
  materials = await call('api', { method: 'materials.search', params: { query: 'stone' } });
  assert.equal(materials.value.items.find((item) => item.id === 'minecraft:stone').label, 'Base');
});
test('configuration changes only explicit IDs and rejects incomplete order before saving', async (t) => {
  const { controller, guard, storage } = await setup(t);
  const added = await controller.request({
    action: 'add',
    files: [archive('base.jar', 'Base'), archive('override.zip', 'Override')],
    ...(await guard()),
  });
  const before = structuredClone(storage.value);
  await assert.rejects(
    controller.request({ action: 'configure', order: [added.entries[0].id], ...(await guard()) }),
    /order/,
  );
  assert.deepEqual(storage.value, before);
  const next = await controller.request({
    action: 'configure',
    enabled: { [added.entries[1].id]: false },
    ...(await guard()),
  });
  assert.equal(next.entries[0].enabled, true);
  assert.equal(next.entries[1].enabled, false);
  await assert.rejects(
    controller.request({ action: 'configure', remove: ['unknown'], ...(await guard()) }),
    /未知资源/,
  );
});
test('invalid candidate resources restore cache and preserve live resources and revision', async (t) => {
  const { library, controller, guard, storage, call } = await setup(t);
  await controller.request({
    action: 'add',
    files: [archive('base.jar', 'Base')],
    ...(await guard()),
  });
  const before = structuredClone(storage.value),
    head = await guard();
  await assert.rejects(
    library.save([{ ...library.entries[0], bytes: Uint8Array.of(1, 2, 3) }], head),
  );
  assert.deepEqual(storage.value, before);
  assert.deepEqual(library.entries, before.entries);
  assert.equal((await guard()).expectedRevision, head.expectedRevision);
  assert.equal((await call('summary')).resources.sources[0].name, 'base.jar');
});
test('a scene edit during durable resource write rejects the stale apply and restores cache', async (t) => {
  const { controller, library, guard, storage, call } = await setup(t);
  await controller.request({
    action: 'add',
    files: [archive('base.jar', 'Base')],
    ...(await guard()),
  });
  const before = structuredClone(storage.value),
    scope = await guard(),
    preference = storage.preference.bind(storage);
  let once = true;
  storage.preference = async (key, value) => {
    const result = await preference(key, value);
    if (once && value !== undefined) {
      once = false;
      const edit = await call('api', {
        method: 'edit.apply',
        params: {
          ...scope,
          operations: [{ type: 'set', pos: [1, 2, 1], state: { Name: 'minecraft:stone' } }],
        },
      });
      assert.ok(edit.ok);
    }
    return result;
  };
  await assert.rejects(
    controller.request({
      action: 'configure',
      enabled: { [library.entries[0].id]: false },
      ...scope,
    }),
    /场景已经更新/,
  );
  assert.deepEqual(storage.value, before);
  assert.deepEqual(library.entries, before.entries);
  assert.equal((await call('summary')).resources.sources.length, 1);
});

test('storage failure prevents live changes and mixed invalid additions remain all-or-nothing', async (t) => {
  const { controller, guard, storage, call, library } = await setup(t);
  await controller.request({
    action: 'add',
    files: [archive('base.jar', 'Base')],
    ...(await guard()),
  });
  const before = structuredClone(storage.value),
    scope = await guard();
  await assert.rejects(
    controller.request({
      action: 'add',
      files: [archive('good.zip', 'Override'), { name: 'bad.zip', bytes: Uint8Array.of(1) }],
      ...scope,
    }),
  );
  assert.deepEqual(storage.value, before);
  storage.preference = async () => {
    throw Error('Disk full');
  };
  await assert.rejects(
    controller.request({
      action: 'configure',
      enabled: { [library.entries[0].id]: false },
      ...scope,
    }),
    /Disk full/,
  );
  assert.deepEqual(library.entries, before.entries);
  assert.equal((await guard()).expectedRevision, scope.expectedRevision);
  assert.equal((await call('summary')).resources.sources.length, 1);
});
