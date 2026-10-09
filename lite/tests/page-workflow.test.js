import test from 'node:test';
import assert from 'node:assert/strict';
import { PageRequests } from '../src/api/page-requests.js';
import { ProjectImporter } from '../src/storage/project-import.js';
import { TaskRunner } from '../src/ui/task-runner.js';

test('staging stays invisible, commit marks dirty before rendering, preview stays unsaved', async () => {
  const events = [];
  const page = new PageRequests({
    call: async (action) => {
      events.push(action);
      return { ok: true };
    },
    cancelOperations: () => events.push('cancel'),
    refresh: () => events.push('refresh'),
    markDirty: () => events.push('dirty'),
    render: async () => events.push('render'),
  });
  await page.request({ method: 'edit.apply', params: { transactionId: 'draft' } });
  assert.deepEqual(events, ['api']);
  events.length = 0;
  await page.request({ method: 'transaction.commit', params: { transactionId: 'draft' } });
  assert.deepEqual(events, ['api', 'summary', 'refresh', 'dirty', 'render']);
  events.length = 0;
  await page.request({ method: 'proposal.prepare' });
  assert.deepEqual(events, ['cancel', 'api', 'summary', 'refresh', 'render']);
  page.render = async () => {
    throw Error('GPU unavailable');
  };
  events.length = 0;
  await assert.rejects(page.request({ method: 'history.undo' }), /GPU/);
  assert.ok(events.includes('dirty'));
});

test('stored reads retain their owner and advertise only available capabilities', async () => {
  const page = new PageRequests({
    call: async () => ({ ok: true, value: { methods: [] } }),
    baselineRequest: async () => ({ stored: true }),
    capabilities: () => ['baseline-chunks/1'],
  });
  assert.deepEqual(await page.request({ method: 'scene.readBaselineChunks' }), { stored: true });
  const result = await page.request({ method: 'workspace.describe' });
  assert.deepEqual(result.value.methods, ['scene.baselineManifest', 'scene.readBaselineChunks']);
});

function importer(remote = false) {
  const events = [];
  const instance = new ProjectImporter({
    checkpoint: async () => events.push('checkpoint'),
    remote: () => remote,
    region: () => ({ min: [1, 2, 3], max: [4, 5, 6] }),
    call: async (action, data, transfers) => {
      events.push({ action, data, transfers });
      return { name: data.name };
    },
    imported: async () => events.push('scene'),
    reference: async () => events.push('reference'),
    notice: () => events.push('notice'),
  });
  const file = {
    name: 'terrain.MCA',
    arrayBuffer: async () => {
      events.push('read');
      return new ArrayBuffer(3);
    },
  };
  return { instance, events, file };
}
test('file replacement checkpoints first and preserves selected region coordinates', async () => {
  const { instance, events, file } = importer();
  await instance.open(file);
  assert.deepEqual(events.slice(0, 2), ['checkpoint', 'read']);
  assert.deepEqual(events[2].data.min, [1, 2, 3]);
  assert.equal(events[2].transfers[0], events[2].data.bytes);
  assert.deepEqual(events.slice(3), ['scene', 'notice']);
});
test('remote imports stay streamed and HTML references do not replace terrain', async () => {
  const { instance, events, file } = importer(true);
  file.name = 'concept.HTM';
  await instance.open(file);
  assert.equal(events[1].data.file, file);
  assert.deepEqual(events[1].transfers, []);
  assert.deepEqual(events.slice(2), ['reference', 'notice']);
});
test('failed parsing or checkpoint cannot install a candidate scene', async () => {
  const { instance, events, file } = importer();
  instance.call = async () => {
    throw Error('Invalid NBT');
  };
  await assert.rejects(instance.open(file), /Invalid NBT/);
  assert.deepEqual(events, ['checkpoint', 'read']);
  events.length = 0;
  instance.checkpoint = async () => {
    throw Error('Disk full');
  };
  await assert.rejects(instance.open(file), /Disk full/);
  assert.deepEqual(events, []);
});
test('UI task restores original state after failures and blocks overlapping work', async () => {
  let busy = false,
    finish;
  const events = [];
  const runner = new TaskRunner({
    blocked: () => busy,
    begin: () => {
      busy = true;
      return 'inputs';
    },
    end: (state) => {
      busy = false;
      events.push(state);
    },
    notice: (...args) => events.push(args),
  });
  const pending = runner.run(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    'opening',
  );
  await runner.run(() => {
    throw Error('must not run');
  }, 'overlap');
  assert.equal(events.length, 1);
  finish(42);
  assert.equal(await pending, 42);
  assert.equal(busy, false);
  await runner.run(async () => {
    throw Error('File damaged');
  }, 'opening');
  assert.deepEqual(events.slice(-2), [['File damaged', true], 'inputs']);
  assert.equal(busy, false);
});
