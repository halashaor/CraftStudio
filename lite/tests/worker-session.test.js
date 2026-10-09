import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkerSession } from '../src/runtime/worker-session.js';
function setup() {
  const workers = [],
    factory = () => {
      const worker = {
        terminated: false,
        requests: [],
        postMessage(r) {
          this.requests.push(r);
        },
        terminate() {
          this.terminated = true;
        },
        reply(value) {
          const r = this.requests.shift();
          this.onmessage({ data: { id: r.id, value } });
        },
        fail(message) {
          const r = this.requests.shift();
          this.onmessage({ data: { id: r.id, error: message } });
        },
      };
      workers.push(worker);
      return worker;
    };
  return { workers, session: new WorkerSession(factory) };
}
test('cancelled replacement retains active worker and rejects candidate work', async () => {
  const { workers, session } = setup(),
    old = session.active;
  const importing = session.call('import', { name: 'new.nbt', bytes: new ArrayBuffer(1) });
  assert.equal(session.loading, true);
  const blocked = await session.call('api', { method: 'edit.apply' });
  assert.equal(blocked.error.code, 'IMPORT_ACTIVE');
  assert.equal(session.cancel(), true);
  await assert.rejects(importing, /取消/);
  assert.equal(session.active, old);
  assert.equal(workers[0].terminated, false);
  assert.equal(workers[1].terminated, true);
});
test('successful replacement swaps only after parsing and preserving original; failure never swaps', async () => {
  const { workers, session } = setup(),
    old = session.active;
  let saved = 0;
  session.beforeSwap = async () => saved++;
  let promise = session.call('import', { name: 'new.nbt' });
  assert.equal(session.active, old);
  workers[1].reply({ name: 'new' });
  assert.equal((await promise).name, 'new');
  assert.equal(saved, 1);
  assert.equal(workers[0].terminated, true);
  const active = session.active;
  promise = session.call('import', { name: 'bad.nbt' });
  workers[2].fail('bad format');
  await assert.rejects(promise, /bad format/);
  assert.equal(session.active, active);
  assert.equal(active.worker.terminated, false);
});
test('HTML reference imports stay in the current project flow', async () => {
  const { workers, session } = setup();
  const promise = session.call('import', { name: 'reference.html' });
  assert.equal(workers.length, 1);
  assert.equal(session.loading, false);
  workers[0].reply({ preview: true });
  assert.ok((await promise).preview);
});

test('scope conflicts discovered after parsing never swap the active scene', async () => {
  const { workers, session } = setup(),
    old = session.active;
  let checked = false;
  const opening = session.call('import', { name: 'new.nbt' }, [], {
    validateSwap: async () => {
      checked = true;
      throw Error('IMPORT_CONFLICT');
    },
  });
  workers[1].reply({ name: 'new' });
  await assert.rejects(opening, /IMPORT_CONFLICT/);
  assert.equal(checked, true);
  assert.equal(session.active, old);
  assert.equal(workers[0].terminated, false);
  assert.equal(workers[1].terminated, true);
});
