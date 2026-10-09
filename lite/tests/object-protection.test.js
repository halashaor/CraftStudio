import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
import { Site, coordKey } from '../src/core/site.js';
import { designerPlan } from '../src/modeling/designer.js';

const material = { Name: 'minecraft:glass' };
const fixture = () => ({
  ...emptyProject('Two buildings'),
  size: [16, 16, 16],
  palette: [{ Name: 'minecraft:oak_planks' }],
  blocks: [
    { pos: [1, 1, 1], state: 0 },
    { pos: [3, 1, 1], state: 0 },
    { pos: [2, 1, 1], state: 0 },
  ],
  metadata: {
    design: {
      objects: [
        {
          id: 'walls',
          name: 'Hollow walls',
          min: [1, 1, 1],
          max: [3, 1, 1],
          cells: [coordKey(1, 1, 1), coordKey(3, 1, 1)],
          collectionId: 'house',
        },
        {
          id: 'interior',
          name: 'Independent interior',
          min: [2, 1, 1],
          max: [2, 1, 1],
          cells: [coordKey(2, 1, 1)],
        },
      ],
      prefabs: [],
      animations: {},
      cameras: [],
      lighting: 'day',
      collections: [{ id: 'house', name: 'House', locked: true }],
    },
  },
});

test('collection protection is precise, shared by edit/paste/preview/AI, and unlock restores free editing', async () => {
  const e = new EngineWorkspace();
  const rpc = async (method, params = {}) => {
    const d = await e.call('api', { method: 'workspace.describe' });
    return e.call('api', { method, params: { expectedRevision: d.revision, ...params } });
  };
  const policy = { allowTerrain: true, allowExisting: true };
  try {
    await e.call('import', {
      name: 'locks.json',
      bytes: new TextEncoder().encode(JSON.stringify(fixture())).buffer,
    });
    await assert.rejects(
      e.call('edit', { operations: [{ type: 'set', pos: [1, 1, 1], state: material }], policy }),
      /锁定/,
    );
    const blocked = await rpc('edit.apply', {
      operations: [{ type: 'set', pos: [1, 1, 1], state: material }],
      policy,
    });
    assert.equal(blocked.ok, false);
    assert.match(blocked.error.message, /锁定/);
    const prefab = {
      schema: 'craftstudio-prefab/1',
      name: 'one',
      size: [1, 1, 1],
      blocks: [{ pos: [0, 0, 0], state: material }],
    };
    assert.equal((await e.call('pasteCheck', { prefab, at: [1, 1, 1], policy })).locked, 1);
    assert.equal((await e.call('pasteCheck', { prefab, at: [2, 1, 1], policy })).locked, 0);
    const config = {
      kind: 'box',
      points: [
        [1, 1, 1],
        [3, 1, 1],
      ],
      fill: true,
      width: 1,
      height: 1,
      state: material,
      guidesOnly: false,
    };
    const preview = await e.call('prepareConstruction', { type: 'geometry', config, policy });
    assert.equal(preview.conflicts.length, 2);
    await e.call('edit', {
      operations: [{ type: 'set', pos: [2, 1, 1], state: material }],
      policy,
    });
    assert.equal(
      (await rpc('scene.getBlocks', { positions: [[2, 1, 1]] })).value[0].state.Name,
      material.Name,
    );
    assert.equal(
      (
        await e.call('export', {
          kind: 'selection',
          selection: {
            min: [1, 1, 1],
            max: [3, 1, 1],
            members: [
              [1, 1, 1],
              [3, 1, 1],
            ],
          },
        })
      ).bytes instanceof Uint8Array,
      true,
    );
    assert.equal(
      (await rpc('collections.put', { collection: { id: 'house', name: 'House', locked: false } }))
        .ok,
      true,
    );
    await e.call('edit', {
      operations: [{ type: 'set', pos: [1, 1, 1], state: material }],
      policy,
    });
    assert.equal(
      (await rpc('scene.getBlocks', { positions: [[1, 1, 1]] })).value[0].state.Name,
      material.Name,
    );
  } finally {
    await e.close();
  }
});

test('individual locks survive collection unlock and object planning honors inherited locks', () => {
  const site = new Site(fixture());
  assert.throws(
    () =>
      designerPlan(site, { operation: 'array', objectIds: ['walls'], count: 2, step: [4, 0, 0] }),
    /锁定/,
  );
  site.design.objects[0].locked = true;
  site.design.collections[0].locked = false;
  assert.throws(
    () =>
      site.operations([{ type: 'set', pos: [1, 1, 1], state: material }], { allowExisting: true }),
    /锁定/,
  );
  site.operations([{ type: 'set', pos: [2, 1, 1], state: material }], { allowExisting: true });
  assert.equal(site.palette[site.at([2, 1, 1]).state].Name, material.Name);
  const restored = new Site(site.project());
  assert.equal(restored.design.objects[0].locked, true);
  assert.equal(restored.design.collections[0].locked, false);
});
