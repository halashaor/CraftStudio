import test from 'node:test';
import assert from 'node:assert/strict';
import { Site, coordKey, coords } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { designerPlan } from '../src/modeling/designer.js';
import { transformSelection } from '../src/modeling/studio.js';
import { instancePoint } from '../src/components/instance-transform.js';
function setup() {
  const s = new Site(emptyProject()),
    points = [
      [5, 3, 5],
      [6, 3, 5],
      [5, 4, 5],
    ];
  s.operations(
    points.map((pos, i) => ({
      type: 'set',
      pos,
      state:
        i === 0
          ? { Name: 'minecraft:oak_log', Properties: { axis: 'x' } }
          : { Name: 'minecraft:oak_planks' },
    })),
    {},
  );
  s.design.objects = [
    {
      id: 'window',
      name: '窗组件',
      min: [5, 3, 5],
      max: [6, 4, 5],
      cells: points.map((p) => coordKey(...p)),
    },
  ];
  apply(
    s,
    designerPlan(s, { operation: 'instance', objectIds: ['window'], count: 3, step: [8, 0, 0] }),
  );
  return s;
}
function apply(s, p) {
  const before = structuredClone(s.design);
  s.operations(p.operations, { allowExisting: true, allowTerrain: true });
  if (!p.operations.length) {
    s.undo.push({ overlay: s.overlay, size: [...s.size], design: before });
    s.redo = [];
  }
  s.design = p.design;
}
test('any quarter-turned/mirrored instance can publish canonical definition and keeps anchors', () => {
  for (const turn of [0, 1, 2, 3])
    for (const mirror of [false, true]) {
      const s = setup(),
        o = s.design.objects[1];
      transformSelection(
        s,
        { min: o.min, max: o.max, at: o.min, move: true, turn, mirror, members: o.cells },
        {},
      );
      const source = s.design.objects.find((v) => v.id === o.id),
        at = instancePoint([0, 0, 0], source.instancePose),
        anchors = s.design.objects.map((v) => v.instancePose.origin);
      s.operations([{ type: 'set', pos: at, state: { Name: 'minecraft:glass' } }], {});
      const before = s.pack(),
        p = designerPlan(s, { operation: 'syncInstances', objectIds: [o.id] });
      assert.deepEqual(s.pack(), before);
      apply(s, p);
      assert.equal(s.design.componentDefinitions[0].revision, 1);
      assert.deepEqual(
        s.design.objects.map((v) => v.instancePose.origin),
        anchors,
      );
      for (const v of s.design.objects)
        assert.equal(
          s.palette[s.at(instancePoint([0, 0, 0], v.instancePose)).state].Name,
          'minecraft:glass',
        );
      s.restore('undo');
      assert.deepEqual(s.design, before.design);
    }
});
test('other-instance overrides and holes survive definition updates; making one unique breaks the link', () => {
  const s = setup(),
    source = s.design.objects[0],
    other = s.design.objects[1];
  s.operations(
    [
      { type: 'set', pos: source.min, state: { Name: 'minecraft:glass' } },
      { type: 'set', pos: other.min, state: { Name: 'minecraft:gold_block' } },
      { type: 'set', pos: [other.min[0] + 1, other.min[1], other.min[2]], state: null },
    ],
    {},
  );
  apply(s, designerPlan(s, { operation: 'syncInstances', objectIds: [source.id] }));
  assert.equal(s.palette[s.at(other.min).state].Name, 'minecraft:gold_block');
  assert.equal(s.at([other.min[0] + 1, other.min[1], other.min[2]]), null);
  apply(s, designerPlan(s, { operation: 'detachInstance', objectIds: [other.id] }));
  s.operations([{ type: 'set', pos: source.min, state: { Name: 'minecraft:stone_bricks' } }], {});
  apply(s, designerPlan(s, { operation: 'syncInstances', objectIds: [source.id] }));
  assert.equal(s.palette[s.at(other.min).state].Name, 'minecraft:gold_block');
});
test('expanding source range updates dimensions without moving placements and rejects unrelated collisions', () => {
  const s = setup();
  s.operations([{ type: 'set', pos: [7, 3, 5], state: { Name: 'minecraft:glass' } }], {});
  const p = designerPlan(s, {
    operation: 'syncInstances',
    objectIds: ['window'],
    expandSource: true,
    selection: { min: [5, 3, 5], max: [7, 4, 5] },
  });
  apply(s, p);
  assert.ok(s.at([15, 3, 5]));
  assert.ok(s.at([23, 3, 5]));
  const reopened = Site.unpack(JSON.parse(JSON.stringify(s.pack())));
  assert.deepEqual(reopened.design.componentDefinitions, s.design.componentDefinitions);
  reopened.operations(
    [
      { type: 'set', pos: [24, 3, 5], state: { Name: 'minecraft:gold_block' } },
      { type: 'set', pos: [8, 3, 5], state: { Name: 'minecraft:glass' } },
    ],
    {},
  );
  assert.throws(
    () =>
      designerPlan(reopened, {
        operation: 'syncInstances',
        objectIds: ['window'],
        expandSource: true,
        selection: { min: [5, 3, 5], max: [8, 4, 5] },
      }),
    /其他内容/,
  );
});
test('ordinary copies are independent and locks block atomic definition updates', () => {
  const s = setup(),
    o = s.design.objects[0];
  transformSelection(
    s,
    { min: o.min, max: o.max, at: [30, 3, 5], move: false, members: o.cells },
    {},
  );
  assert.equal(s.design.objects.at(-1).instanceOf, undefined);
  s.design.objects[1].locked = true;
  const before = s.pack();
  assert.throws(
    () => designerPlan(s, { operation: 'syncInstances', objectIds: ['window'] }),
    /锁定/,
  );
  assert.deepEqual(s.pack(), before);
});

test('make unique creates a separate reusable definition without changing any voxel', () => {
  const s = setup(),
    other = s.design.objects[1],
    before = structuredClone(new Map(s.overlay)),
    family = other.instanceOf;
  apply(s, designerPlan(s, { operation: 'makeUniqueInstance', objectIds: [other.id] }));
  assert.deepEqual(new Map(s.overlay), before);
  const unique = s.design.objects.find((o) => o.id === other.id);
  assert.notEqual(unique.instanceOf, family);
  assert.equal(s.design.componentDefinitions.length, 2);
  s.operations([{ type: 'set', pos: unique.min, state: { Name: 'minecraft:gold_block' } }], {});
  apply(s, designerPlan(s, { operation: 'syncInstances', objectIds: [unique.id] }));
  assert.equal(s.palette[s.at(s.design.objects[0].min).state].Name, 'minecraft:oak_log');
});

test('repeated definition edits keep the original underlay rather than leaving old component pieces', () => {
  const s = setup(),
    source = s.design.objects[0],
    other = s.design.objects[1];
  for (const Name of ['minecraft:glass', 'minecraft:stone_bricks']) {
    s.operations([{ type: 'set', pos: source.min, state: { Name } }], {});
    apply(s, designerPlan(s, { operation: 'syncInstances', objectIds: [source.id] }));
  }
  s.operations([{ type: 'set', pos: source.min, state: null }], {});
  apply(s, designerPlan(s, { operation: 'syncInstances', objectIds: [source.id] }));
  assert.equal(s.at(other.min), null);
});

test('linked copies created from a rotated instance retain the same definition and composed placement', () => {
  const s = setup(),
    source = s.design.objects[1];
  transformSelection(
    s,
    {
      min: source.min,
      max: source.max,
      at: source.min,
      move: true,
      turn: 1,
      mirror: true,
      members: source.cells,
    },
    {},
  );
  apply(
    s,
    designerPlan(s, { operation: 'instance', objectIds: [source.id], count: 2, step: [0, 0, 8] }),
  );
  const copy = s.design.objects.at(-1);
  assert.equal(copy.instanceOf, 'window');
  assert.equal(copy.instancePose.turn, 1);
  assert.equal(copy.instancePose.mirror, true);
  s.operations(
    [
      {
        type: 'set',
        pos: instancePoint([0, 0, 0], source.instancePose),
        state: { Name: 'minecraft:glass' },
      },
    ],
    {},
  );
  apply(s, designerPlan(s, { operation: 'syncInstances', objectIds: [source.id] }));
  assert.equal(
    s.palette[s.at(instancePoint([0, 0, 0], copy.instancePose)).state].Name,
    'minecraft:glass',
  );
});
