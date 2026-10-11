import test from 'node:test';
import assert from 'node:assert/strict';
import { SavedVersionReview } from '../src/storage/saved-version-review.js';

function setup(overrides = {}) {
  const item = { id: 'saved-project', title: '坡地住宅' },
    entry = {
      number: 4,
      time: '2026-10-10T12:00:00Z',
      note: '屋面备选',
      bytes: Uint8Array.of(31, 139, 1, 2),
    },
    events = [];
  let summary = { workspaceId: 'current-document', revision: 7 };
  const result = {
    workspaceId: 'current-document',
    revision: 7,
    comparison: { active: 'history' },
  };
  const review = new SavedVersionReview({
    library: {
      get: async (...args) => {
        events.push(['get', ...args]);
        return { item, entry };
      },
    },
    getSummary: () => summary,
    beforeReview: () => events.push(['beforeReview']),
    call: async (action, data, transfers) => {
      events.push(['call', action, data]);
      structuredClone(data, { transfer: transfers });
      return result;
    },
    refresh: (value) => events.push(['refresh', value]),
    render: async () => events.push(['render']),
    opened: (source) => events.push(['opened', source]),
    ...overrides,
  });
  return {
    review,
    item,
    entry,
    result,
    events,
    setSummary: (value) => {
      summary = value;
    },
  };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('history review transfers a separate byte copy and opens the view only after rendering', async () => {
  const { review, entry, result, events } = setup(),
    original = entry.bytes.slice();
  const source = await review.preview('saved-project', 4);
  assert.deepEqual(source, {
    projectId: 'saved-project',
    version: 4,
    name: '坡地住宅',
    time: entry.time,
    note: '屋面备选',
  });
  const request = events.find(([name]) => name === 'call');
  assert.equal(request[1], 'comparison');
  assert.equal(request[2].operation, 'load');
  assert.equal(request[2].workspaceId, 'current-document');
  assert.equal(request[2].expectedRevision, 7);
  assert.equal(request[2].bytes.byteLength, 0, 'only the copied buffer was transferred');
  assert.deepEqual(entry.bytes, original, 'formal library record stays attached and intact');
  assert.deepEqual(
    events.map(([name]) => name),
    ['beforeReview', 'get', 'beforeReview', 'call', 'refresh', 'render', 'opened'],
  );
  assert.equal(events.find(([name]) => name === 'refresh')[1], result);
});

test('history read retains the starting workspace guard when another document opens while storage is reading', async () => {
  const read = deferred(),
    { review, item, entry, events, setSummary } = setup({ library: { get: () => read.promise } });
  review.call = async (action, data) => {
    events.push(['call', action, data]);
    assert.equal(data.workspaceId, 'current-document');
    assert.equal(data.expectedRevision, 7);
    throw Error('WORKSPACE_CHANGED');
  };
  const pending = review.preview('saved-project', 4);
  setSummary({ workspaceId: 'another-document', revision: 1 });
  read.resolve({ item, entry });
  await assert.rejects(pending, /WORKSPACE_CHANGED/);
  assert.deepEqual(
    events.map(([name]) => name),
    ['beforeReview', 'beforeReview', 'call'],
  );
  assert.equal(entry.bytes.byteLength, 4);
});

test('a pending edit stops history before reading or after an in-flight read, without opening or refreshing', async () => {
  const first = setup({
    beforeReview: () => {
      throw Error('请先暂存');
    },
  });
  await assert.rejects(first.review.preview('saved-project', 4), /请先暂存/);
  assert.deepEqual(first.events, []);
  const read = deferred(),
    second = setup({ library: { get: () => read.promise } });
  let checks = 0;
  second.review.beforeReview = () => {
    if (++checks === 2) throw Error('新编辑尚未确认');
  };
  const pending = second.review.preview('saved-project', 4);
  read.resolve({ item: second.item, entry: second.entry });
  await assert.rejects(pending, /新编辑尚未确认/);
  assert.equal(checks, 2);
  assert.deepEqual(second.events, []);
});

test('storage and engine failures do not refresh or open history; render failure does not announce an opened view', async () => {
  for (const boundary of ['storage', 'engine', 'render']) {
    const { review, events } = setup();
    if (boundary === 'storage')
      review.library.get = async () => {
        throw Error('read failed');
      };
    if (boundary === 'engine')
      review.call = async () => {
        throw Error('parse failed');
      };
    if (boundary === 'render')
      review.render = async () => {
        throw Error('render failed');
      };
    await assert.rejects(review.preview('saved-project', 4), /failed/);
    assert.equal(
      events.some(([name]) => name === 'opened'),
      false,
      boundary,
    );
    if (boundary !== 'render')
      assert.equal(
        events.some(([name]) => name === 'refresh'),
        false,
        boundary,
      );
  }
});
