import { EngineStore } from '../../local-engine/store.mjs';
import { EngineController } from '../../local-engine/controller.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { ProjectExporter } from '../src/storage/project-export.js';
import { emptyProject, importNBT, readNBT, tag } from '../src/minecraft/codec.js';
import { unzipSync, strFromU8, gunzipSync } from 'fflate';
import { csvRows, safeStem } from '../src/storage/delivery-package.js';

async function setup(known = true) {
  const engine = new EngineWorkspace();
  const p = {
    ...emptyProject('Original design'),
    size: [16, 12, 16],
    origin: [100, 64, -50],
    metadata: { originConfirmed: known },
    palette: [{ Name: 'minecraft:grass_block' }, { Name: 'minecraft:chest' }],
    blocks: [
      { pos: [4, 0, 4], state: 0 },
      {
        pos: [5, 1, 5],
        state: 1,
        nbt: tag(10, { id: tag(8, 'minecraft:chest'), seed: tag(4, '9223372036854775807') }),
      },
    ],
  };
  await engine.call('import', {
    name: 'site.json',
    bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
  });
  const rpc = async (method, params = {}) => {
    const head = await engine.call('api', { method: 'workspace.describe' });
    const result = await engine.call('api', {
      method,
      params: { expectedRevision: head.revision, ...params },
    });
    assert.ok(result.ok, result.error?.message);
    return result.value;
  };
  await rpc('edit.apply', {
    policy: { allowTerrain: true },
    operations: [
      { type: 'erase', min: [4, 0, 4], max: [4, 0, 4] },
      {
        type: 'set',
        pos: [4, 2, 4],
        state: { Name: 'example:stairs', Properties: { half: 'top', facing: 'east' } },
      },
      {
        type: 'set',
        pos: [6, 2, 4],
        state: { Name: 'minecraft:oak_slab', Properties: { type: 'top', waterlogged: 'false' } },
      },
      { type: 'set', pos: [5, 2, 4], state: { Name: 'minecraft:glass' } },
      { type: 'set', pos: [9, 3, 9], state: { Name: 'minecraft:oak_planks' } },
    ],
  });
  let summary = await engine.call('summary');
  const selection = {
    min: [4, 2, 4],
    max: [6, 2, 4],
    members: [
      [4, 2, 4],
      [6, 2, 4],
    ],
  };
  const exporter = new ProjectExporter({
    library: { open: async () => {} },
    call: (action, data) => engine.call(action, data),
    baselineRequest: () => {
      throw Error('unexpected backend path');
    },
    context: () => ({ summary, title: '屋顶方案/版本1' }),
    selection: () => selection,
    refresh: (value) => {
      summary = value;
    },
  });
  return {
    engine,
    exporter,
    rpc,
    selection,
    update: async () => {
      summary = await engine.call('summary');
    },
  };
}

test('delivery archives keep the selected blueprint, report, materials and editable project consistent without changing the scene', async () => {
  const { engine, exporter } = await setup();
  try {
    const before = await engine.call('summary');
    const result = await exporter.delivery({ kind: 'selection', includeProject: true });
    assert.equal(result.filename, '屋顶方案_版本1.selection.zip');
    const files = unzipSync(result.bytes),
      manifest = JSON.parse(strFromU8(files['manifest.json'])),
      placement = JSON.parse(strFromU8(files['placement.json']));
    assert.deepEqual(placement.localOffset, [4, 2, 4]);
    assert.deepEqual(placement.worldOffset, [104, 66, -46]);
    const project = importNBT(files['blueprint.nbt'], 'Selected');
    assert.equal(project.blocks.length, 2);
    assert.equal(
      project.palette.some((state) => state.Name === 'minecraft:glass'),
      false,
    );
    const changes = strFromU8(files['changes.csv']);
    assert.deepEqual(Array.from(files['changes.csv'].slice(0, 3)), [239, 187, 191]);
    assert.ok(changes.includes('example:stairs'));
    assert.equal(changes.includes('minecraft:glass'), false);
    assert.equal(changes.includes('minecraft:oak_planks'), false);
    const materials = strFromU8(files['materials.csv']);
    assert.ok(materials.includes('oak_slab'));
    assert.equal(materials.includes('grass_block'), false);
    assert.equal(manifest.records, 2);
    assert.equal(manifest.changedCells, 2);
    assert.equal(manifest.includesEditableProject, true);
    const editable = JSON.parse(strFromU8(gunzipSync(files['project.craftlite'])));
    assert.equal(editable.site.title, '屋顶方案/版本1');
    assert.equal(editable.site.base.blocks[1].nbt.v.seed.v, '9223372036854775807');
    assert.deepEqual(await engine.call('summary'), before);
    const restored = new EngineWorkspace();
    try {
      const summary = await restored.call('import', { name: 'editable.zip', bytes: result.bytes });
      assert.equal(summary.name, '屋顶方案/版本1');
      assert.equal(summary.changes, 5);
      assert.deepEqual(summary.origin, [100, 64, -50]);
    } finally {
      await restored.close();
    }
  } finally {
    await engine.close();
  }
});

test('patch packages retain explicit demolition air and full packages provide the source placement anchor', async () => {
  const { engine, exporter } = await setup();
  try {
    let files = unzipSync((await exporter.delivery({ kind: 'patch' })).bytes);
    let manifest = JSON.parse(strFromU8(files['manifest.json']));
    assert.equal(manifest.placement.containsAir, true);
    assert.equal(readNBT(files['blueprint.nbt']).v.blocks.v[1].length, 5);
    assert.equal(files['project.craftlite'], undefined);
    files = unzipSync((await exporter.delivery({ kind: 'full' })).bytes);
    manifest = JSON.parse(strFromU8(files['manifest.json']));
    assert.deepEqual(manifest.placement.worldOffset, [100, 64, -50]);
    assert.deepEqual(manifest.size, [16, 12, 16]);
    assert.ok(files['changed-materials.csv']);
    assert.equal(manifest.materialsScope, 'changed placements');
    assert.equal(importNBT(files['blueprint.nbt'], 'Full').blocks.length, 5);
    const portable = await exporter.delivery({ kind: 'selection' });
    const restored = new EngineWorkspace();
    try {
      const summary = await restored.call('import', {
        name: 'selected.zip',
        bytes: portable.bytes,
      });
      assert.equal(summary.sourceBlocks, 2);
      assert.deepEqual(summary.origin, [104, 66, -46]);
      assert.equal(summary.originConfirmed, true);
    } finally {
      await restored.close();
    }
  } finally {
    await engine.close();
  }
});

test('an edit between package stages rejects a mixed-version archive', async () => {
  const { engine, exporter, rpc } = await setup();
  try {
    const call = exporter.call;
    let changed = false;
    exporter.call = async (action, data) => {
      const value = await call(action, data);
      if (action === 'deliveryReport' && !changed) {
        changed = true;
        await rpc('edit.apply', {
          operations: [{ type: 'set', pos: [10, 3, 10], state: { Name: 'minecraft:glass' } }],
        });
      }
      return value;
    };
    await assert.rejects(exporter.delivery({ kind: 'additions' }), /场景已经更新/);
  } finally {
    await engine.close();
  }
});

test('CSV and archive names handle actual Unicode, delimiters and Windows filenames', () => {
  assert.equal(csvRows([['x'], ['a,b']]).charCodeAt(0), 65279);
  assert.ok(csvRows([['x'], ['a,b']]).includes('\r\n'));
  assert.equal(safeStem('Minecraft'), 'Minecraft');
  assert.equal(safeStem('CON'), '_CON');
  assert.equal(safeStem('../屋顶:甲'), '.._屋顶_甲');
});

test('an unconfirmed origin stays unknown when a blueprint package is reopened', async () => {
  const { engine, exporter } = await setup(false),
    restored = new EngineWorkspace();
  try {
    const result = await exporter.delivery({ kind: 'selection' });
    const files = unzipSync(result.bytes);
    assert.equal(JSON.parse(strFromU8(files['placement.json'])).worldOffset, null);
    const summary = await restored.call('import', { name: 'unknown.zip', bytes: result.bytes });
    assert.equal(summary.originConfirmed, false);
    assert.deepEqual(summary.origin, [0, 0, 0]);
  } finally {
    await engine.close();
    await restored.close();
  }
});

test('read-only packed titles preserve durable scene names and draft renaming still commits', async () => {
  const store = new EngineStore(':memory:');
  let controller = await EngineController.open({ store, key: 'delivery-title' });
  try {
    await controller.call('import', {
      name: 'original.json',
      bytes: new TextEncoder().encode(JSON.stringify(emptyProject('Original'))).buffer,
    });
    await controller.call('compressed', { title: 'Exported copy', preserveTitle: true });
    assert.equal((await controller.call('summary')).name, 'Original');
    await controller.close();
    controller = await EngineController.open({ store, key: 'delivery-title' });
    assert.equal((await controller.call('summary')).name, 'Original');
    await controller.call('draft', { title: 'Working draft', preserveTitle: true });
    await controller.close();
    controller = await EngineController.open({ store, key: 'delivery-title' });
    assert.equal((await controller.call('summary')).name, 'Working draft');
  } finally {
    await controller.close();
    store.close();
  }
});
