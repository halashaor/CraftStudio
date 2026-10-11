import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { meshMutation } from '../src/models/mesh-sources.js';
import { meshGeometryPlan } from '../src/models/mesh-plan.js';
import {
  captureGeneration,
  generatedObject,
  regenerateObjects,
} from '../src/modeling/generation.js';

const state = { Name: 'minecraft:oak_planks' };
const glass = { Name: 'minecraft:glass' };
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

function setup() {
  const site = new Site(emptyProject());
  meshMutation(site, 'meshes.put', {
    source: { id: 'model', name: 'House', objText: cube(), transform: { position: [8, 3, 8] } },
  });
  return site;
}

function build(site, id, transform) {
  const config = { sourceId: 'model', state, mode: 'surface', ...(transform ? { transform } : {}) };
  const plan = meshGeometryPlan(site, config),
    captured = captureGeneration(site, plan.operations);
  site.operations(plan.operations, {});
  const object = generatedObject(site, captured, { type: 'mesh', config, id, name: id });
  site.design.objects.push(object);
  return object;
}

function apply(site, plan) {
  site.operations(plan.operations, {});
  site.design = plan.design;
}

test('one mesh source supports independent saved placements without fabricated sketch outputs', () => {
  const site = setup();
  const a = build(site, 'house-a'),
    b = build(site, 'house-b', { position: [22, 3, 8] });
  assert.equal(a.kind, 'mesh');
  assert.equal(a.guideId, undefined);
  assert.equal(b.guideId, undefined);
  assert.deepEqual(a.generation.sourceRefs, [{ kind: 'mesh', id: 'model' }]);
  assert.equal(a.generation.sourceVersions['mesh:model'], 1);
  meshMutation(site, 'meshes.put', {
    source: { id: 'model', transform: { position: [100, 0, 100] } },
  });
  const recovered = Site.unpack(JSON.parse(JSON.stringify(site.pack())));
  const before = recovered.pack();
  const plan = regenerateObjects(recovered, recovered.design.objects);
  assert.deepEqual(recovered.pack(), before);
  assert.equal(plan.operations.length, 0);
  assert.equal(plan.regeneration.objects, 2);
  assert.deepEqual(
    plan.design.objects.map((o) => o.recipe.transform.position),
    [
      [8, 3, 8],
      [22, 3, 8],
    ],
  );
  assert.equal(plan.design.guides, undefined);
});

test('mesh rebuilds preserve hand edits and hand deletions across geometry changes and reopening', () => {
  let site = setup();
  const object = build(site, 'house');
  const edited = object.generation.records[0].pos,
    removed = object.generation.records[1].pos;
  site.operations(
    [
      { type: 'set', pos: edited, state: glass },
      { type: 'set', pos: removed, state: null },
    ],
    {},
  );
  for (const height of [4, 5]) {
    meshMutation(site, 'meshes.put', { source: { id: 'model', objText: cube(height) } });
    assert.equal(site.design.objects[0].generation.outdated, true);
    const before = site.pack();
    const plan = regenerateObjects(site, site.design.objects);
    assert.equal(plan.regeneration.manual, 2);
    assert.deepEqual(site.pack(), before);
    apply(site, plan);
    assert.equal(site.palette[site.at(edited).state].Name, glass.Name);
    assert.equal(site.at(removed), null);
    assert.equal(site.design.objects[0].id, 'house');
    assert.equal(site.design.objects[0].generation.outdated, false);
    assert.equal(site.design.objects[0].generation.sourceVersions['mesh:model'], height - 2);
    site = Site.unpack(JSON.parse(JSON.stringify(site.pack())));
  }
  const overwritten = regenerateObjects(site, site.design.objects, { manualStrategy: 'overwrite' });
  apply(site, overwritten);
  assert.equal(site.palette[site.at(edited).state].Name, state.Name);
  assert.equal(site.palette[site.at(removed).state].Name, state.Name);
});

test('mesh reconstruction collisions and locked objects leave the original design untouched', () => {
  const site = setup(),
    object = build(site, 'house');
  const config = { ...object.recipe, transform: { position: [30, 4, 30] } };
  const target = meshGeometryPlan(site, config).operations[0].pos;
  site.operations([{ type: 'set', pos: target, state: glass }], {});
  let before = site.pack();
  assert.throws(
    () => regenerateObjects(site, [object], { overrides: { house: config } }),
    /覆盖其他内容/,
  );
  assert.deepEqual(site.pack(), before);
  object.locked = true;
  before = site.pack();
  assert.throws(() => regenerateObjects(site, [object]), /锁定/);
  assert.deepEqual(site.pack(), before);
});
