import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAutomation, gameTarget } from '../src/integration/game-automation.js';
import { GameDelivery } from '../src/integration/game-delivery.js';
import { bridgeControls, bridgeJobRunning } from '../src/integration/game-session.js';
function setup() {
  const head = { workspaceId: 'workspace', revision: 2, value: { name: 'Design' } };
  const state = {
    connectionId: 4,
    session: {
      connected: true,
      writable: true,
      busy: false,
      capabilities: ['read', 'validate', 'apply', 'job', 'cancel', 'undo'],
    },
    jobId: null,
  };
  let target = {
    origin: [100, 64, -50],
    size: [8, 8, 8],
    kind: 'additions',
    dimension: 'minecraft:overworld',
    overwrite: false,
  };
  const calls = [];
  const request = async (action, payload) => {
    calls.push({ action, payload });
    return action === 'validate'
      ? { ok: true, mode: 'mock' }
      : action === 'read'
        ? { project: { name: 'Game region' } }
        : action === 'apply'
          ? { id: 'job-one', status: 'building' }
          : { id: state.jobId, status: 'completed' };
  };
  const delivery = new GameDelivery({
    call: async (action) =>
      action === 'api'
        ? head
        : {
            project: { size: [2, 2, 2], blocks: [{ pos: [0, 0, 0], state: 0 }] },
            offsetLocal: [3, 2, 4],
          },
    request,
    options: () => ({ ...target, connection: state.connectionId }),
    changed: () => {},
  });
  const imported = [];
  const api = new GameAutomation({
    delivery,
    describe: async () => head,
    connection: () => ({ ...state, controls: bridgeControls(state.session, state.jobId) }),
    target: () => target,
    configure: (input) => {
      target = gameTarget(input, target, ['minecraft:overworld']);
      delivery.clear();
    },
    request,
    report: (result) => {
      state.jobId = result.id;
      state.session.busy = bridgeJobRunning(result.status);
    },
    importFile: async (input) => {
      imported.push(input);
      return { workspaceId: 'new' };
    },
  });
  const guard = { connectionId: 4, workspaceId: 'workspace', expectedRevision: 2 };
  return { api, delivery, state, head, calls, imported, guard };
}
test('prepare returns a review ID; build requires that ID and reuses the visible checked payload once', async () => {
  const { api, delivery, calls, guard } = setup();
  const review = await api.request({
    action: 'prepare',
    ...guard,
    target: { origin: [200, 70, -40] },
  });
  assert.equal(typeof review.id, 'string');
  assert.equal(review.project, undefined);
  assert.deepEqual(review.origin, [203, 72, -36]);
  await assert.rejects(api.request({ action: 'build', ...guard, preparedId: 'other' }), /被替换/);
  assert.equal(delivery.review().id, review.id);
  await api.request({ action: 'build', ...guard, preparedId: review.id });
  assert.equal(calls[0].payload.project, calls[1].payload.project);
  assert.deepEqual(calls[1].payload.origin, review.origin);
  assert.equal((await api.status()).jobId, 'job-one');
  assert.equal(delivery.review(), null);
  await assert.rejects(api.request({ action: 'build', ...guard, preparedId: review.id }));
  assert.equal(calls.filter((call) => call.action === 'apply').length, 1);
});
test('game operations reject stale connection, changed source and unsupported permissions before writes', async () => {
  const { api, state, head, calls, guard } = setup();
  await assert.rejects(
    api.request({ action: 'prepare', ...guard, connectionId: 3 }),
    /GAME_CONNECTION_CHANGED/,
  );
  head.revision++;
  await assert.rejects(api.request({ action: 'prepare', ...guard }), /GAME_SOURCE_CHANGED/);
  head.revision--;
  api.describe = async () => {
    state.connectionId++;
    return head;
  };
  await assert.rejects(api.request({ action: 'prepare', ...guard }), /GAME_CONNECTION_CHANGED/);
  assert.deepEqual(calls, []);
});
test('progress and cancel stay attached to the known game job and connection', async () => {
  const { api, calls, guard, state } = setup();
  const review = await api.request({ action: 'prepare', ...guard });
  await api.request({ action: 'build', ...guard, preparedId: review.id });
  await assert.rejects(
    api.request({ action: 'cancel', connectionId: 4, jobId: 'different' }),
    /编号已变化/,
  );
  await api.request({ action: 'job', connectionId: 4, jobId: 'job-one' });
  assert.equal(state.session.busy, false);
  assert.equal(calls.at(-1).action, 'job');
});
test('reading imports into the same guarded page path and status exposes no credentials', async () => {
  const { api, imported, guard } = setup();
  const status = await api.status();
  assert.equal(JSON.stringify(status).includes('token'), false);
  await api.request({
    action: 'read',
    ...guard,
    target: { origin: [100, 64, 100], size: [12, 8, 12] },
  });
  assert.equal(imported.length, 1);
  assert.equal(imported[0].workspaceId, 'workspace');
  assert.equal(imported[0].expectedRevision, 2);
  assert.equal(JSON.parse(new TextDecoder().decode(imported[0].bytes)).name, 'Game region');
});
test('target validation preserves negative world coordinates and accepts explicit exact selections', () => {
  const current = {
    origin: [0, 64, 0],
    size: [32, 32, 32],
    kind: 'additions',
    dimension: 'minecraft:overworld',
    overwrite: false,
  };
  assert.deepEqual(
    gameTarget({ origin: [-200, 64, -100] }, current, [current.dimension]).origin,
    [-200, 64, -100],
  );
  assert.throws(
    () => gameTarget({ size: [-1, 2, 3] }, current, [current.dimension]),
    /origin\/size/,
  );
  assert.throws(
    () => gameTarget({ dimension: 'other:missing' }, current, [current.dimension]),
    /维度/,
  );
  const selection = { min: [1, 2, 3], max: [4, 5, 6], members: [[1, 2, 3]] };
  assert.deepEqual(
    gameTarget({ kind: 'selection', selection }, current, [current.dimension]).selection,
    selection,
  );
});
