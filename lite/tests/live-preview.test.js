import test from 'node:test';
import assert from 'node:assert/strict';
import { latestPreview } from '../src/runtime/live-preview.js';
const tick = () => new Promise((r) => setTimeout(r, 15));
test('continuous edits start work before input stops and keep only the latest pending state', async () => {
  let state = 0,
    running = 0,
    peak = 0;
  const started = [],
    applied = [],
    resolve = [];
  const preview = latestPreview({
    delay: 1,
    run: () => {
      const value = state;
      started.push(value);
      peak = Math.max(peak, ++running);
      return new Promise((r) =>
        resolve.push(() => {
          running--;
          r(value);
        }),
      );
    },
    apply: (r) => applied.push(r),
  });
  state = 1;
  preview.request();
  await tick();
  assert.deepEqual(started, [1]);
  for (let i = 2; i <= 20; i++) {
    state = i;
    preview.request();
  }
  assert.equal(started.length, 1);
  resolve.shift()();
  await tick();
  assert.deepEqual(started, [1, 20]);
  assert.deepEqual(applied, []);
  resolve.shift()();
  await tick();
  assert.deepEqual(applied, [20]);
  assert.equal(peak, 1);
  preview.dispose();
});
test('cancel discards an in-flight result and later requests still work', async () => {
  let finish;
  const applied = [];
  const p = latestPreview({
    run: () => new Promise((r) => (finish = r)),
    apply: (r) => applied.push(r),
  });
  p.request(true);
  p.cancel();
  finish(1);
  await tick();
  assert.deepEqual(applied, []);
  p.request(true);
  finish(2);
  await tick();
  assert.deepEqual(applied, [2]);
  p.dispose();
});
