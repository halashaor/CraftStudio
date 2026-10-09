import test from 'node:test';
import assert from 'node:assert/strict';
import { ProposalReviewUI } from '../src/ui/proposal-review-ui.js';
test('human proposal review uses the versioned shared API and preserves review on rejection', async () => {
  const nodes = new Map(),
    calls = [],
    notices = [];
  const $ = (id) => {
    if (!nodes.has(id)) nodes.set(id, {});
    return nodes.get(id);
  };
  const summary = {
    workspaceId: 'current',
    revision: 7,
    preview: true,
    proposal: {
      id: 'proposal-7',
      changes: { add: 1, replace: 0, remove: 0, terrain: 0, total: 1 },
    },
    add: 50,
    replace: 0,
    remove: 0,
    earth: 0,
    water: 0,
  };
  let allowed = false;
  const ui = new ProposalReviewUI({
    $,
    getSummary: () => summary,
    request: async (request) => {
      calls.push(request);
      return allowed ? { ok: true } : { ok: false, error: { message: 'Protected terrain' } };
    },
    policy: () => ({ allowTerrain: false }),
    task: (run) => run(),
    notice: (message) => notices.push(message),
  });
  ui.update(summary);
  assert.match($('preview-info').textContent, /本次提案：新增 1/);
  await assert.rejects(ui.finish('proposal.commit'), /Protected terrain/);
  assert.equal($('preview-banner').hidden, false);
  assert.deepEqual(notices, []);
  assert.deepEqual(calls[0], {
    method: 'proposal.commit',
    params: {
      workspaceId: 'current',
      expectedRevision: 7,
      proposalId: 'proposal-7',
      policy: { allowTerrain: false },
    },
  });
  allowed = true;
  await ui.finish('proposal.cancel');
  assert.equal(calls[1].method, 'proposal.cancel');
  assert.equal(calls[1].params.policy, undefined);
  assert.match(notices[0], /返回当前设计/);
  summary.proposal = null;
  await assert.rejects(ui.finish('proposal.commit'), /没有待审阅/);
  assert.equal(calls.length, 2);
});
