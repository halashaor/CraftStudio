import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject, tag } from '../src/minecraft/codec.js';
import { blockStateEditPlan } from '../src/materials/block-state-edit.js';
import { ConstructionDisplay, replacementMask } from '../src/modeling/construction-display.js';
import { ReplacementPreview } from '../src/modeling/replacement-preview.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { responseTransfers } from '../src/runtime/worker-runtime.js';
import { fallbackStateChoices, resourceStateChoices } from '../src/materials/state-choices.js';

const slab = 'minecraft:oak_slab';
const states = [
  { Name: slab, Properties: { type: 'bottom', waterlogged: 'false', custom: 'keep' } },
  { Name: slab, Properties: { type: 'top', waterlogged: 'true', custom: 'keep' } },
  { Name: 'example:machine', Properties: { axis: 'x', mode: 'visual' } },
];
const data = {
  ...emptyProject('Properties'),
  size: [16, 16, 16],
  palette: states,
  blocks: [
    { pos: [2, 2, 2], state: 0 },
    { pos: [6, 2, 2], state: 1 },
    {
      pos: [10, 2, 2],
      state: 2,
      nbt: tag(10, { id: tag(8, 'example:machine'), Counter: tag(4, '9223372036854775806') }),
    },
  ],
};
const descriptors = new Map([
  [slab, { choices: { type: ['bottom', 'top', 'double'], waterlogged: ['false', 'true'] } }],
]);
const positions = data.blocks.map((b) => b.pos);
test('known Create orientations work without textures and multipart conditions contribute observed choices', () => {
  assert.ok(fallbackStateChoices('create:mechanical_bearing').facing.includes('east'));
  assert.deepEqual(fallbackStateChoices('create:cogwheel').axis, ['y', 'x', 'z']);
  assert.deepEqual(fallbackStateChoices('example:machine'), {});
  const choices = resourceStateChoices({
    variants: { 'facing=north': {} },
    multipart: [
      { when: { OR: [{ north: 'true' }, { AND: [{ mode: 'open|closed' }, { north: 'false' }] }] } },
    ],
  });
  assert.deepEqual(choices, {
    facing: ['north'],
    north: ['true', 'false'],
    mode: ['open', 'closed'],
  });
});
test('single-type deltas preserve mixed untouched fields, other types and original data', () => {
  const site = new Site(data),
    before = JSON.stringify(site.project());
  const plan = blockStateEditPlan(
    site,
    positions,
    { sourceName: slab, properties: { type: 'top' } },
    descriptors,
  );
  assert.equal(plan.operations.length, 1);
  assert.equal(plan.stateChange.excluded, 1);
  assert.deepEqual(plan.operations[0].state.Properties, {
    type: 'top',
    waterlogged: 'false',
    custom: 'keep',
  });
  assert.equal(
    plan.stateChange.sources
      .find((g) => g.Name === slab)
      .properties.find((p) => p.key === 'waterlogged').mixed,
    true,
  );
  assert.equal(plan.stateChange.reusableState, null);
  assert.equal(JSON.stringify(site.project()), before);
});
test('uniform results become reusable states; unknown Mod fields and typed NBT survive deltas', () => {
  const site = new Site(data);
  const uniform = blockStateEditPlan(
    site,
    positions,
    { sourceName: slab, properties: { type: 'top', waterlogged: 'false' } },
    descriptors,
  );
  assert.equal(uniform.stateChange.reusableState.Properties.custom, 'keep');
  const mod = blockStateEditPlan(
    site,
    positions,
    { sourceName: 'example:machine', properties: { axis: 'z', new_visual_flag: 'yes' } },
    descriptors,
  );
  assert.equal(mod.operations[0].state.Properties.mode, 'visual');
  assert.deepEqual(mod.operations[0].nbt, data.blocks[2].nbt);
  mod.operations[0].nbt.v.Counter.v = '0';
  assert.equal(site.at([10, 2, 2]).nbt.v.Counter.v, '9223372036854775806');
});
test('a property patch needs an explicit type and string values; unchanged input is inspectable', () => {
  const site = new Site(data);
  assert.equal(blockStateEditPlan(site, positions, {}, descriptors).operations.length, 0);
  assert.throws(
    () => blockStateEditPlan(site, positions, { properties: { type: 'top' } }, descriptors),
    /类型/,
  );
  const missing = blockStateEditPlan(
    site,
    positions,
    { sourceName: 'example:missing', properties: { axis: 'z' } },
    descriptors,
  );
  assert.equal(missing.blocked.code, 'STATE_SOURCE_MISSING');
  assert.equal(missing.operations.length, 0);
  assert.ok(missing.stateChange.sources.some((source) => source.Name === slab));
  assert.throws(
    () =>
      blockStateEditPlan(
        site,
        positions,
        { sourceName: slab, properties: { type: [] } },
        descriptors,
      ),
    /属性/,
  );
});
test('render masking is bound to a prepared ID and scene version and ignores stale clears', () => {
  const display = new ConstructionDisplay(),
    context = { workspaceId: 'a', revision: 3 },
    mask = replacementMask([{ pos: [2, 2, 2] }]),
    draft = { id: 'one', ...context, replacementMask: mask };
  assert.equal(display.set(draft, { id: 'one' }, context).changed, true);
  assert.equal(display.mask(draft, context), mask);
  display.clear('other');
  assert.equal(display.mask(draft, context), mask);
  assert.equal(display.mask(draft, { ...context, revision: 4 }), null);
  assert.throws(() => display.set(draft, { id: 'two' }, context), /失效/);
  display.clear('one');
  assert.equal(display.mask(draft, context), null);
});
test('closing restores geometry even when cancelling the prepared operation already cleared its mask', async () => {
  const calls = [],
    renders = [];
  const preview = new ReplacementPreview({
    call: async (a, d) => {
      calls.push(d);
      return { changed: d.visible };
    },
    render: async () => renders.push('render'),
  });
  await preview.show({ id: 'one', replacesGeometry: true }, true);
  await preview.clear();
  assert.equal(renders.length, 2);
  assert.equal(calls.at(-1).visible, false);
});

test('a failed display refresh can be restored and does not poison the next preview', async () => {
  let fail = true,
    renders = 0;
  const preview = new ReplacementPreview({
    call: async () => ({ changed: false }),
    render: async () => {
      renders++;
      if (fail) throw Error('view failed');
    },
  });
  await assert.rejects(preview.show({ id: 'first', replacesGeometry: true }, true), /view failed/);
  fail = false;
  await preview.clear();
  await preview.show({ id: 'next', replacesGeometry: true }, true);
  assert.equal(renders, 3);
  assert.equal(preview.requested.id, 'next');
});

test('worker prepare, original/result display, commit, undo and portable reload share exact state edits', async () => {
  const engine = new EngineWorkspace();
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    await engine.call('import', { name: 'states.craft.json', bytes: bytes.buffer });
    const head = await engine.call('api', { method: 'workspace.describe' }),
      selection = { min: [0, 0, 0], max: [15, 15, 15], members: positions },
      policy = { allowTerrain: true, allowExisting: true };
    const config = {
      operation: 'blockState',
      selection,
      sourceName: slab,
      properties: { type: 'top' },
    };
    const prepared = await engine.call('prepareConstruction', { type: 'designer', config, policy });
    assert.equal(prepared.stateChange.changed, 1);
    const targetY = prepared.buckets.flatMap((b) =>
      Array.from(b.positions).filter((_, i) => i % 3 === 1),
    );
    assert.equal(Math.min(...targetY), 2.5);
    const at = async () =>
      (await engine.call('api', { method: 'scene.getBlocks', params: { positions } })).value;
    const before = await at();
    const vertices = async () => {
      const mesh = await engine.call('mesh', { mode: 'after', cut: 4095 });
      let count = 0;
      for (const b of mesh.buckets)
        for (let i = 0; i < b.positions.length; i += 3)
          if (b.positions[i] >= 1.99 && b.positions[i] <= 3.01) count++;
      return count;
    };
    assert.ok((await vertices()) > 0);
    await engine.call('constructionDisplay', { id: prepared.id, visible: true });
    assert.equal(await vertices(), 0);
    assert.deepEqual(await at(), before);
    assert.equal(
      (await engine.call('api', { method: 'workspace.describe' })).revision,
      head.revision,
    );
    await engine.call('constructionDisplay', { id: prepared.id, visible: false });
    assert.ok((await vertices()) > 0);
    await engine.call('commitConstruction', { id: prepared.id, policy });
    const changed = await at();
    assert.notDeepEqual(changed, before);
    assert.equal(
      (await engine.call('api', { method: 'workspace.describe' })).value.history.undo,
      head.value.history.undo + 1,
    );
    await engine.call('undo');
    assert.deepEqual(await at(), before);
    await engine.call('redo');
    assert.deepEqual(await at(), changed);
    const saved = await engine.call('compressed');
    await engine.call('import', { name: 'states.craftlite', bytes: saved.buffer });
    assert.deepEqual(await at(), changed);
    const unchanged = await engine.call('prepareConstruction', {
      type: 'designer',
      config,
      policy,
    });
    assert.equal(unchanged.stateChange.changed, 0);
    await assert.rejects(
      engine.call('commitConstruction', { id: unchanged.id, policy }),
      /没有变化/,
    );
    const protectedPlan = await engine.call('prepareConstruction', {
      type: 'designer',
      config: { ...config, properties: { type: 'bottom' } },
      policy: {},
    });
    assert.ok(protectedPlan.conflicts.length);
    await assert.rejects(engine.call('commitConstruction', { id: protectedPlan.id, policy: {} }));
    assert.deepEqual(await at(), changed);
  } finally {
    await engine.close();
  }
});

test('Create property previews include moving partial models while the canonical state stays unchanged', async () => {
  const engine = new EngineWorkspace();
  try {
    const project = {
      ...emptyProject(),
      size: [8, 8, 8],
      palette: [{ Name: 'create:mechanical_bearing', Properties: { facing: 'up' } }],
      blocks: [
        {
          pos: [3, 3, 3],
          state: 0,
          nbt: tag(10, {
            id: tag(8, 'create:mechanical_bearing'),
            Speed: tag(5, 16),
            Running: tag(1, 1),
          }),
        },
      ],
    };
    const bytes = new TextEncoder().encode(JSON.stringify(project));
    await engine.call('import', { name: 'bearing.craft.json', bytes: bytes.buffer });
    const preview = await engine.call('prepareConstruction', {
      type: 'designer',
      policy: { allowExisting: true },
      config: {
        operation: 'blockState',
        selection: { min: [3, 3, 3], max: [3, 3, 3] },
        sourceName: 'create:mechanical_bearing',
        properties: { facing: 'east' },
      },
    });
    assert.ok(preview.motions.instances.length >= 2);
    assert.ok(preview.motions.instances.every((v) => v.axis === 'x' && v.rpm === 16));
    const count = preview.buckets.length;
    const transfers = responseTransfers('prepareConstruction', preview);
    assert.ok(transfers.length > 0);
    assert.equal(preview.buckets.length, count);
    await engine.call('constructionDisplay', { id: preview.id, visible: true });
    assert.equal(
      (await engine.call('createScene', { enabled: true, cut: 4095 })).instances.filter(
        (v) => v.owner,
      ).length,
      0,
    );
    const current = await engine.call('api', {
      method: 'scene.getBlocks',
      params: { positions: [[3, 3, 3]] },
    });
    assert.equal(current.value[0].state.Properties.facing, 'up');
    await engine.call('cancelConstruction', { id: preview.id });
    assert.ok(
      (await engine.call('createScene', { enabled: true, cut: 4095 })).instances.length >= 2,
    );
    const head = await engine.call('api', { method: 'workspace.describe' });
    const compact = await engine.call('api', {
      method: 'construction.prepare',
      params: {
        workspaceId: head.workspaceId,
        expectedRevision: head.revision,
        type: 'designer',
        config: {
          operation: 'blockState',
          selection: { min: [3, 3, 3], max: [3, 3, 3] },
          sourceName: 'create:mechanical_bearing',
          properties: { facing: 'east' },
        },
        policy: { allowExisting: true },
      },
    });
    assert.equal(compact.ok, true);
    assert.equal(compact.value.stateChange.changed, 1);
    assert.equal(compact.value.motions, undefined);
    assert.equal(compact.value.buckets, undefined);
  } finally {
    await engine.close();
  }
});
