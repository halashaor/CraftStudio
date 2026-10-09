import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkerRuntime, responseTransfers } from '../src/runtime/worker-runtime.js';

test('worker transport serializes commands and keeps responding after a domain failure', async () => {
  const order = [],
    replies = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const runtime = new WorkerRuntime({
    execute: async (action) => {
      order.push(action);
      if (action === 'first') await gate;
      if (action === 'fail') throw Error('invalid operation');
      return action;
    },
    postMessage: (message) => replies.push(message),
  });
  runtime.handle({ id: 1, action: 'first', trace: true });
  runtime.handle({ id: 2, action: 'fail' });
  const done = runtime.handle({ id: 3, action: 'last' });
  await Promise.resolve();
  assert.deepEqual(order, ['first']);
  release();
  await done;
  assert.deepEqual(order, ['first', 'fail', 'last']);
  assert.deepEqual(
    replies.map((r) => r.id),
    [1, 2, 3],
  );
  assert.equal(replies[1].error, 'invalid operation');
  assert.equal(replies[2].value, 'last');
  assert.ok(replies[0].performance.executeMs >= 0);
  assert.equal(replies[2].performance, undefined);
});

test('geometry, animated previews and selection members preserve their transferable buffers', () => {
  const bucket = { positions: new Float32Array(3), normals: new Float32Array(3) };
  const motion = { positions: new Float32Array(3) };
  const members = new Uint32Array(3);
  assert.deepEqual(responseTransfers('selectionPreview', { buckets: [bucket], members }), [
    bucket.positions.buffer,
    bucket.normals.buffer,
    members.buffer,
  ]);
  assert.deepEqual(
    responseTransfers('assetPreview', {
      buckets: [bucket],
      motions: { definitions: { rotor: { buckets: [motion] } } },
    }),
    [bucket.positions.buffer, bucket.normals.buffer, motion.positions.buffer],
  );
  const bytes = new Uint8Array(4);
  assert.deepEqual(responseTransfers('export', { bytes }), [bytes.buffer]);
});
