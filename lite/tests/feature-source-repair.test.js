import { faceFrame, fromPlane } from '../src/sketch/workplane.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { geometryPlan } from '../src/modeling/construction.js';
import { featurePlan } from '../src/modeling/features.js';
import { designerPlan } from '../src/modeling/designer.js';
import { generatedObject, captureGeneration, editSketchPlan } from '../src/modeling/generation.js';
const state = { Name: 'minecraft:stone_bricks' },
  available = new Set([state.Name, 'minecraft:glass']);
function guide(id, points) {
  const recipe = {
    kind: 'polyline',
    points,
    closed: true,
    plane: 'xz',
    state,
    guidesOnly: true,
    snap: 0,
  };
  return {
    id,
    name: id,
    points: geometryPlan(new Site(emptyProject()), recipe, available).guide,
    recipe,
    revision: 0,
  };
}
function add(s, id, display, config) {
  const p = featurePlan(s, config),
    captured = captureGeneration(s, p.operations);
  s.operations(p.operations, {});
  s.design.objects.push(
    generatedObject(s, captured, { id, name: id, type: 'feature', config, guideId: display }),
  );
  s.design.guides.push({
    id: display,
    name: display,
    points: p.guide,
    recipe: config,
    revision: 0,
  });
}
function apply(s, p) {
  const old = structuredClone(s.design),
    n = s.undo.length;
  s.operations(p.operations, {});
  if (s.undo.length === n) s.undo.push({ overlay: s.overlay, size: s.size, design: old });
  s.design = p.design;
}
test('profile replacement repairs a missing input, updates provenance and keeps manual state with one undo', () => {
  const s = new Site(emptyProject());
  s.design.guides = [
    guide('old', [
      [4, 4, 4],
      [8, 4, 4],
      [8, 4, 8],
      [4, 4, 8],
    ]),
    guide('new', [
      [4, 4, 4],
      [12, 4, 4],
      [12, 4, 8],
      [4, 4, 8],
    ]),
  ];
  add(s, 'building', 'display', { operation: 'extrude', profileIds: ['old'], depth: 2, state });
  s.operations([{ type: 'set', pos: [5, 4, 5], state: { Name: 'minecraft:glass' } }], {});
  s.design.guides = s.design.guides.filter((g) => g.id !== 'old');
  const before = s.pack(),
    plan = designerPlan(
      s,
      { operation: 'editFeature', objectIds: ['building'], parameters: { profileIds: ['new'] } },
      available,
    );
  assert.deepEqual(s.pack(), before);
  apply(s, plan);
  assert.deepEqual(s.design.objects[0].generation.sources, ['new']);
  assert.equal(s.design.objects[0].id, 'building');
  assert.equal(s.palette[s.at([11, 4, 5]).state].Name, state.Name);
  assert.equal(s.palette[s.at([5, 4, 5]).state].Name, 'minecraft:glass');
  s.restore('undo');
  assert.deepEqual(s.design, before.design);
  assert.deepEqual(s.pack().overlay, before.overlay);
});
test('path replacement retains downstream references and rejects self/descendant cycles', () => {
  const s = new Site(emptyProject()),
    recipe = {
      kind: 'line',
      plane: 'xz',
      points: [
        [4, 4, 4],
        [8, 4, 4],
      ],
      state,
      guidesOnly: true,
      snap: 0,
    };
  s.design.guides = [
    { id: 'a', name: 'a', recipe, points: geometryPlan(s, recipe, available).guide, revision: 0 },
    {
      id: 'b',
      name: 'b',
      recipe: {
        ...recipe,
        points: [
          [4, 4, 4],
          [12, 4, 4],
        ],
      },
      points: geometryPlan(
        s,
        {
          ...recipe,
          points: [
            [4, 4, 4],
            [12, 4, 4],
          ],
        },
        available,
      ).guide,
      revision: 0,
    },
  ];
  add(s, 'first', 'out-first', {
    operation: 'sweep',
    sweepMode: 'rectangle',
    pathId: 'a',
    width: 1,
    height: 1,
    state,
  });
  add(s, 'second', 'out-second', {
    operation: 'sweep',
    sweepMode: 'rectangle',
    pathId: 'out-first',
    width: 3,
    height: 1,
    state,
  });
  s.design.guides = s.design.guides.filter((g) => g.id !== 'a');
  const before = s.pack();
  for (const pathId of ['out-first', 'out-second'])
    assert.throws(
      () =>
        designerPlan(
          s,
          { operation: 'editFeature', objectIds: ['first'], parameters: { pathId } },
          available,
        ),
      /自身|循环/,
    );
  const plan = designerPlan(
    s,
    { operation: 'editFeature', objectIds: ['first'], parameters: { pathId: 'b' } },
    available,
  );
  assert.equal(plan.regeneration.objects, 2);
  assert.deepEqual(s.pack(), before);
  apply(s, plan);
  assert.deepEqual(s.design.objects.find((o) => o.id === 'first').generation.sources, ['b']);
  assert.equal(s.palette[s.at([11, 4, 4]).state].Name, state.Name);
});

test('custom profile sweeps record both path and section, so editing the section rebuilds the sweep', () => {
  const s = new Site(emptyProject()),
    frame = faceFrame([10, 10, 10], [1, 0, 0]),
    points = [
      [-3, -3],
      [3, -3],
      [3, 3],
      [-3, 3],
    ].map((p) => fromPlane([...p, 0], frame)),
    section = {
      kind: 'polygon',
      plane: 'custom',
      workplane: frame,
      points,
      state,
      guidesOnly: true,
      snap: 0,
    },
    path = {
      kind: 'line',
      plane: 'xz',
      points: [
        [10, 10, 10],
        [22, 10, 10],
      ],
      state,
      guidesOnly: true,
      snap: 0,
    };
  s.design.guides = [
    {
      id: 'section',
      name: 'Section',
      points: geometryPlan(s, section, available).guide,
      recipe: section,
      revision: 0,
    },
    {
      id: 'path',
      name: 'Path',
      points: geometryPlan(s, path, available).guide,
      recipe: path,
      revision: 0,
    },
  ];
  add(s, 'sweep', 'display', {
    operation: 'sweep',
    sweepMode: 'profile',
    pathId: 'path',
    profileIds: ['section'],
    state,
  });
  assert.deepEqual(new Set(s.design.objects[0].generation.sources), new Set(['path', 'section']));
  const before = s.pack(),
    expanded = {
      ...section,
      points: [
        [-4, -4],
        [4, -4],
        [4, 4],
        [-4, 4],
      ].map((p) => fromPlane([...p, 0], frame)),
      editGuideId: 'section',
    },
    plan = editSketchPlan(s, expanded, available);
  assert.deepEqual(s.pack(), before);
  assert.equal(plan.regeneration.objects, 1);
  apply(s, plan);
  assert.equal(s.palette[s.at([15, 13, 10]).state].Name, state.Name);
});
