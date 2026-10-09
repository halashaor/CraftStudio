import { coordKey } from '../src/core/coordinates.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameDelivery } from '../src/integration/game-delivery.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';

function setup() {
  const head = { workspaceId: 'w', revision: 2, value: { name: 'House' } };
  const options = {
    connection: 0,
    kind: 'selection',
    selection: { min: [3, 2, 4], max: [7, 5, 8], members: [coordKey(3, 2, 4)] },
    origin: [100, 64, -50],
    dimension: 'minecraft:overworld',
    overwrite: false,
  };
  const calls = [],
    sent = [];
  const delivery = new GameDelivery({
    call: async (action, data) => {
      calls.push({ action, data });
      return action === 'api'
        ? structuredClone(head)
        : {
            project: { size: [5, 4, 5], blocks: [{ pos: [0, 0, 0], state: 0 }] },
            offsetLocal: [3, 2, 4],
          };
    },
    request: async (action, payload) => {
      sent.push({ action, payload });
      return action === 'validate'
        ? { ok: true, mode: 'native' }
        : { id: 'job', status: 'building' };
    },
    options: () => options,
    changed: () => {},
  });
  return { delivery, head, options, calls, sent };
}
test('checked selection preserves source scope and offset; build sends the exact prepared payload once', async () => {
  const { delivery, calls, sent } = setup();
  const prepared = await delivery.prepare();
  assert.deepEqual(calls[1].data.selection.members, [coordKey(3, 2, 4)]);
  assert.equal(calls[1].data.expectedRevision, 2);
  assert.deepEqual(prepared.origin, [103, 66, -46]);
  assert.deepEqual(prepared.max, [107, 69, -42]);
  await delivery.build();
  assert.equal(sent[0].payload.project, sent[1].payload.project);
  assert.deepEqual(sent[1].payload.origin, prepared.origin);
  assert.equal(delivery.prepared, null);
  await assert.rejects(delivery.build(), /先准备/);
});
test('changed design, selected members or world target require a new preparation', async () => {
  for (const change of [
    ({ options }) => options.connection++,
    ({ head }) => head.revision++,
    ({ head }) => (head.workspaceId = 'other'),
    ({ options }) => options.origin[0]++,
    ({ options }) => options.selection.members.push(coordKey(4, 2, 4)),
  ]) {
    const state = setup();
    await state.delivery.prepare();
    change(state);
    await assert.rejects(state.delivery.build(), /重新准备/);
    assert.equal(state.sent.length, 1);
  }
});
test('failed validation and target changes during validation never make a buildable plan', async () => {
  const { delivery, options } = setup();
  delivery.request = async () => ({ ok: false, errors: ['Unknown state'] });
  await assert.rejects(delivery.prepare(), /Unknown state/);
  assert.equal(delivery.prepared, null);
  delivery.request = async () => {
    options.origin[0]++;
    return { ok: true };
  };
  await assert.rejects(delivery.prepare(), /重新准备/);
  assert.equal(delivery.prepared, null);
});
test('uncertain apply is consumed and cannot be accidentally repeated', async () => {
  const { delivery } = setup();
  await delivery.prepare();
  delivery.request = async () => {
    throw Error('Connection lost');
  };
  await assert.rejects(delivery.build(), /Connection lost/);
  assert.equal(delivery.prepared, null);
  await assert.rejects(delivery.build(), /先准备/);
});
test('real shared engine prepares exact selected members and rejects stale source revision', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  let head = await engine.call('api', { method: 'workspace.describe' });
  await engine.call('api', {
    method: 'edit.apply',
    params: {
      expectedRevision: head.revision,
      operations: [
        {
          type: 'set',
          pos: [3, 2, 4],
          state: { Name: 'minecraft:stone_slab', Properties: { type: 'top' } },
        },
        { type: 'set', pos: [4, 2, 4], state: { Name: 'minecraft:glass' } },
      ],
    },
  });
  head = await engine.call('api', { method: 'workspace.describe' });
  const result = await engine.call('bridgeProject', {
    kind: 'selection',
    selection: { min: [3, 2, 4], max: [4, 2, 4], members: [coordKey(3, 2, 4)] },
    workspaceId: head.workspaceId,
    expectedRevision: head.revision,
  });
  assert.equal(result.project.blocks.length, 1);
  assert.equal(result.project.palette[result.project.blocks[0].state].Name, 'minecraft:stone_slab');
  assert.equal(result.project.palette[result.project.blocks[0].state].Properties.type, 'top');
  assert.deepEqual(result.offsetLocal, [3, 2, 4]);
  await assert.rejects(
    engine.call('bridgeProject', {
      kind: 'full',
      workspaceId: 'old',
      expectedRevision: head.revision,
    }),
    /工程已切换/,
  );
});
