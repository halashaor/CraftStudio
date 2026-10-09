import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { Site } from '../src/core/site.js';
import { emptyProject, tag, importNBT } from '../src/minecraft/codec.js';
import { cropBlueprint } from '../src/minecraft/blueprint.js';
import { cropStructureEntities } from '../src/minecraft/structure-entities.js';
import { ProjectExporter } from '../src/storage/project-export.js';
import { unzipSync, strFromU8 } from 'fflate';
const entity = (pos) =>
  tag(10, {
    pos: tag(9, [6, pos]),
    blockPos: tag(9, [3, pos.map(Math.floor)]),
    nbt: tag(10, {
      id: tag(8, 'minecraft:armor_stand'),
      seed: tag(4, '9223372036854775807'),
      unknown: tag(10, { text: tag(8, 'keep exact') }),
    }),
  });
const project = () => ({
  ...emptyProject('Entity scene'),
  size: [12, 12, 12],
  origin: [100, 64, -50],
  metadata: { originConfirmed: true },
  palette: [{ Name: 'minecraft:stone' }],
  blocks: [{ pos: [3, 2, 4], state: 0 }],
  entities: [
    entity([3.25, 2, 4.75]),
    entity([8, 2, 4]),
    tag(10, { opaque: tag(8, 'unknown location') }),
  ],
});
test('entity wrappers are cropped and rebased while opaque typed NBT and original stay intact', () => {
  const entities = project().entities,
    before = structuredClone(entities);
  const result = cropStructureEntities(entities, [3, 2, 4], [7, 5, 8]);
  assert.equal(result.entities.length, 1);
  assert.equal(result.unlocated, 1);
  assert.deepEqual(result.entities[0].v.pos.v, [6, [0.25, 0, 0.75]]);
  assert.deepEqual(result.entities[0].v.blockPos.v, [3, [0, 0, 0]]);
  assert.deepEqual(result.entities[0].v.nbt, entities[0].v.nbt);
  assert.deepEqual(entities, before);
});
test('partial blueprints remain blocks-only by default and allow explicitly requested entity-only regions', () => {
  const site = new Site(project()),
    bounds = { min: [3, 2, 4], max: [7, 5, 8] };
  assert.equal(cropBlueprint(site, site.cells.values(), bounds).project.entities.length, 0);
  const selected = cropBlueprint(site, [], bounds, { includeEntities: true });
  assert.equal(selected.project.blocks.length, 0);
  assert.equal(selected.entities, 1);
  assert.equal(selected.entityWarnings.length, 1);
  assert.throws(
    () => cropBlueprint(site, [], { min: [9, 9, 9], max: [10, 10, 10] }, { includeEntities: true }),
    /没有可导出/,
  );
});
test('real NBT and delivery archive preserve cropped entities, offsets and omission report', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  await engine.call('import', {
    name: 'entities.json',
    bytes: new TextEncoder().encode(JSON.stringify(project())).buffer,
  });
  const call = (action, data) => engine.call(action, data),
    head = await call('api', { method: 'workspace.describe' });
  const selection = { min: [3, 2, 4], max: [7, 5, 8], members: [[3, 2, 4]] };
  const exporter = new ProjectExporter({
    library: { open: async () => {} },
    call,
    context: () => ({
      summary: {
        ...head.value,
        workspaceId: head.workspaceId,
        revision: head.revision,
        origin: [100, 64, -50],
        size: [12, 12, 12],
        originConfirmed: true,
      },
    }),
    selection: () => selection,
    refresh: () => {},
  });
  const bytes = await exporter.export({
    format: 'delivery',
    kind: 'selection',
    includeEntities: true,
  });
  const files = unzipSync(bytes),
    manifest = JSON.parse(strFromU8(files['manifest.json']));
  const loaded = importNBT(files['blueprint.nbt'], 'cropped');
  assert.equal(loaded.entities.length, 1);
  assert.deepEqual(loaded.entities[0].v.pos.v[1], [0.25, 0, 0.75]);
  assert.equal(loaded.entities[0].v.nbt.v.seed.v, '9223372036854775807');
  assert.deepEqual(manifest.placement.worldOffset, [103, 66, -46]);
  assert.equal(manifest.entities, 1);
  assert.equal(manifest.entitySelection, 'bounds');
  assert.equal(manifest.entityWarnings.length, 1);
  const without = await exporter.export({ format: 'nbt', kind: 'selection' });
  assert.equal(importNBT(without.bytes, 'default').entities.length, 0);
  const original = await call('package');
  assert.equal(original.site.base.entities.length, 3);
  await assert.rejects(
    exporter.export({ format: 'nbt', kind: 'additions', includeEntities: true }),
    /仅支持选区/,
  );
});
