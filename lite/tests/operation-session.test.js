import test from 'node:test';
import assert from 'node:assert/strict';
import { OperationSession } from '../src/ui/operation-session.js';

function fixture() {
  const active = new Set(['construction']),
    busy = new Set(),
    notices = [];
  const operations = ['direct', 'construction', 'designer', 'measurement'].map((id) => ({
    id,
    controller: { isBusy: () => busy.has(id) },
    close: () => active.delete(id),
  }));
  return {
    active,
    busy,
    notices,
    session: new OperationSession({
      operations: () => operations,
      notice: (message) => notices.push(message),
    }),
  };
}
test('every submitted task retains ownership when another tool tries to replace it', () => {
  for (const owner of ['direct', 'construction', 'designer', 'measurement']) {
    const { session, active, busy, notices } = fixture();
    active.clear();
    active.add(owner);
    busy.add(owner);
    assert.equal(session.prepare('designer'), false);
    assert.deepEqual([...active], [owner]);
    assert.equal(session.allow(), false);
    assert.ok(notices.every((message) => message.includes('正在提交')));
    busy.delete(owner);
    assert.equal(session.prepare('measurement'), true);
    assert.deepEqual([...active], owner === 'measurement' ? [owner] : []);
  }
});
test('switching a normal preview closes other tools and preserves the destination session', () => {
  const { session, active, notices } = fixture();
  active.add('designer');
  assert.equal(session.prepare('designer'), true);
  assert.deepEqual([...active], ['designer']);
  assert.equal(session.prepare(null), true);
  assert.equal(active.size, 0);
  assert.deepEqual(notices, []);
});
