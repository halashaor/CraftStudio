import { designerPlan } from '../src/modeling/designer.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { geometryPlan } from '../src/modeling/construction.js';
import { featurePlan } from '../src/modeling/features.js';
import { captureGeneration, generatedObject, editSketchPlan } from '../src/modeling/generation.js';
const state = { Name: 'minecraft:oak_planks' },
  recipe = {
    kind: 'rectangle',
    plane: 'xz',
    points: [
      [2, 2, 2],
      [6, 2, 6],
    ],
    state,
    guidesOnly: true,
    planeLock: true,
  },
  available = new Set([state.Name]);
function setup() {
  const s = new Site(emptyProject()),
    g = geometryPlan(s, recipe, available);
  s.design.guides = [{ id: 'profile', name: '截面', points: g.guide, recipe, revision: 0 }];
  const config = { operation: 'extrude', plane: 'auto', profileIds: ['profile'], state, depth: 4 },
    p = featurePlan(s, config),
    captured = captureGeneration(s, p.operations);
  s.operations(p.operations, {});
  s.design.objects.push(
    generatedObject(s, captured, {
      type: 'feature',
      config,
      guideId: 'display',
      id: 'building',
      name: '建筑',
    }),
  );
  s.design.guides.push({ id: 'display', name: '拉伸', points: p.guide, recipe: config });
  return s;
}
test('source sketch edits prepare dependent geometry without mutation, retain IDs, and undo together', () => {
  const s = setup(),
    before = s.pack(),
    plan = editSketchPlan(
      s,
      {
        ...recipe,
        points: [
          [2, 2, 2],
          [8, 2, 6],
        ],
        editGuideId: 'profile',
      },
      available,
    );
  assert.deepEqual(s.pack(), before);
  assert.equal(plan.regeneration.objects, 1);
  assert.ok(plan.operations.length > 0);
  s.operations(plan.operations, {});
  s.design = plan.design;
  assert.equal(s.design.guides.find((g) => g.id === 'profile').revision, 1);
  assert.equal(s.design.objects[0].id, 'building');
  assert.equal(s.design.objects[0].max[0], 7);
  s.restore('undo');
  assert.deepEqual(s.pack().overlay, before.overlay);
  assert.deepEqual(s.design, before.design);
});
test('manual state edits and deletions remain preserved across repeated source rebuilds', () => {
  const s = setup();
  s.operations(
    [
      { type: 'set', pos: [3, 3, 3], state: { Name: 'minecraft:glass' } },
      { type: 'set', pos: [4, 3, 3], state: null },
    ],
    {},
  );
  for (const width of [8, 9]) {
    const plan = editSketchPlan(
      s,
      {
        ...recipe,
        points: [
          [2, 2, 2],
          [width, 2, 6],
        ],
        editGuideId: 'profile',
      },
      available,
    );
    assert.equal(plan.regeneration.manual, 2);
    s.operations(plan.operations, {});
    s.design = plan.design;
    assert.equal(s.palette[s.at([3, 3, 3]).state].Name, 'minecraft:glass');
    assert.equal(s.at([4, 3, 3]), null);
  }
});
test('explicit overwrite can rebuild hand edits and unknown legacy provenance is rejected', () => {
  const s = setup();
  s.operations([{ type: 'set', pos: [3, 3, 3], state: { Name: 'minecraft:glass' } }], {});
  const p = editSketchPlan(
    s,
    { ...recipe, editGuideId: 'profile', manualStrategy: 'overwrite' },
    available,
  );
  s.operations(p.operations, {});
  s.design = p.design;
  assert.equal(s.palette[s.at([3, 3, 3]).state].Name, state.Name);
  delete s.design.objects[0].generation;
  assert.throws(
    () => editSketchPlan(s, { ...recipe, editGuideId: 'profile' }, available),
    /归属快照/,
  );
});
test('source-only editing marks dependencies stale and collisions/locks do not silently replace unrelated content', () => {
  const s = setup(),
    p = editSketchPlan(
      s,
      { ...recipe, editGuideId: 'profile', updateDependents: false },
      available,
    );
  assert.equal(p.operations.length, 0);
  assert.equal(p.design.objects[0].generation.outdated, true);
  s.operations([{ type: 'set', pos: [7, 3, 3], state: { Name: 'minecraft:glass' } }], {});
  assert.throws(
    () =>
      editSketchPlan(
        s,
        {
          ...recipe,
          points: [
            [2, 2, 2],
            [8, 2, 6],
          ],
          editGuideId: 'profile',
        },
        available,
      ),
    /其他内容/,
  );
  s.design.objects[0].locked = true;
  assert.throws(() => editSketchPlan(s, { ...recipe, editGuideId: 'profile' }, available), /锁定/);
});

test('parameter edits use the same preservation rules and overlapping dependents restore in layer order', () => {
  const s = setup(),
    config = { ...s.design.objects[0].recipe, state: { Name: 'minecraft:stone_bricks' } },
    p = featurePlan(s, config),
    captured = captureGeneration(s, p.operations);
  s.operations(p.operations, {});
  s.design.objects.push(
    generatedObject(s, captured, {
      type: 'feature',
      config,
      guideId: 'display2',
      id: 'layer2',
      name: '第二层',
    }),
  );
  const plan = editSketchPlan(
    s,
    {
      ...recipe,
      points: [
        [2, 2, 2],
        [8, 2, 6],
      ],
      editGuideId: 'profile',
    },
    available,
  );
  assert.equal(plan.regeneration.objects, 2);
  s.operations(plan.operations, {});
  s.design = plan.design;
  assert.equal(s.palette[s.at([7, 3, 3]).state].Name, 'minecraft:stone_bricks');
  s.operations([{ type: 'set', pos: [3, 3, 3], state: { Name: 'minecraft:glass' } }], {});
  const direct = designerPlan(
    s,
    { operation: 'editFeature', objectIds: ['layer2'], parameters: { depth: 5 } },
    available,
  );
  s.operations(direct.operations, {});
  s.design = direct.design;
  assert.equal(s.palette[s.at([3, 3, 3]).state].Name, 'minecraft:glass');
});
test('manually moved generated objects become independent rather than blocking source edits', () => {
  const s = setup();
  s.design.objects[0].cells = s.design.objects[0].cells.map((k) => k + 20);
  const p = editSketchPlan(s, { ...recipe, editGuideId: 'profile' }, available);
  assert.equal(p.operations.length, 0);
  assert.equal(p.design.objects[0].generation.detached, true);
  assert.equal(p.design.objects[0].kind, 'voxel');
});
test('source edits rebuild a two-stage generated path chain atomically and preserve manual overrides', () => {
  const s = new Site(emptyProject()),
    line = {
      kind: 'line',
      plane: 'xz',
      points: [
        [2, 4, 2],
        [6, 4, 2],
      ],
      state,
      guidesOnly: true,
      snap: 0,
    };
  s.design.guides = [
    {
      id: 'path',
      name: 'Path',
      points: geometryPlan(s, line, available).guide,
      recipe: line,
      revision: 0,
    },
  ];
  const add = (id, display, path, width, material) => {
    const config = { operation: 'sweep', pathId: path, width, height: 2, state: material },
      plan = featurePlan(s, config),
      captured = captureGeneration(s, plan.operations);
    s.operations(plan.operations, {});
    s.design.objects.push(
      generatedObject(s, captured, { type: 'feature', config, guideId: display, id, name: id }),
    );
    s.design.guides.push({
      id: display,
      name: display,
      points: plan.guide,
      recipe: config,
      revision: 0,
    });
  };
  add('first', 'display-first', 'path', 1, state);
  add('second', 'display-second', 'display-first', 3, { Name: 'minecraft:stone_bricks' });
  s.operations([{ type: 'set', pos: [4, 4, 2], state: { Name: 'minecraft:glass' } }], {});
  const before = s.pack(),
    plan = editSketchPlan(
      s,
      {
        ...line,
        points: [
          [2, 4, 2],
          [9, 4, 2],
        ],
        editGuideId: 'path',
      },
      available,
    );
  assert.equal(plan.regeneration.objects, 2);
  assert.deepEqual(s.pack(), before);
  s.operations(plan.operations, {});
  s.design = plan.design;
  assert.equal(s.palette[s.at([8, 4, 2]).state].Name, 'minecraft:stone_bricks');
  assert.equal(s.palette[s.at([4, 4, 2]).state].Name, 'minecraft:glass');
  assert.equal(s.design.guides.find((g) => g.id === 'display-first').revision, 1);
  assert.equal(
    s.design.objects.find((o) => o.id === 'second').generation.sourceVersions['display-first'],
    1,
  );
  s.restore('undo');
  assert.deepEqual(s.pack().overlay, before.overlay);
  assert.deepEqual(s.design, before.design);
  const parameter = designerPlan(
    s,
    { operation: 'editFeature', objectIds: ['first'], parameters: { height: 3 } },
    available,
  );
  assert.equal(parameter.regeneration.objects, 2);
  s.operations(parameter.operations, {});
  s.design = parameter.design;
  assert.equal(s.palette[s.at([4, 6, 2]).state].Name, state.Name);
  s.restore('undo');
  const stale = editSketchPlan(
    s,
    { ...line, editGuideId: 'path', updateDependents: false },
    available,
  );
  assert.ok(stale.design.objects.every((o) => o.generation.outdated));
});
