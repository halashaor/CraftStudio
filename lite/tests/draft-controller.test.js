import test from 'node:test';
import assert from 'node:assert/strict';
import { indexedDB } from 'fake-indexeddb';
import { DraftController } from '../src/storage/draft-controller.js';
import { LocalLibrary } from '../src/storage/library.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject, tag } from '../src/minecraft/codec.js';

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const form = () => ({
  schema: 'craftstudio-save-form/1',
  title: 'Working design',
  tags: '屋顶,庭院',
  kind: 'project',
  note: 'First note',
});

test('one in-flight save keeps later edits dirty and the next persisted draft restores exact content and form', async () => {
  const engine = new EngineWorkspace(),
    restored = new EngineWorkspace(),
    library = new LocalLibrary(indexedDB, 'draft-controller-' + crypto.randomUUID());
  const state = { summary: null, active: null, available: true, blocked: false, remote: false },
    messages = [],
    saveForm = form();
  let captures = 0,
    writes = 0;
  const controller = new DraftController({
    library,
    call: (action, data) => {
      if (action === 'draft') captures++;
      return engine.call(action, data);
    },
    baselineRequest: () => {
      throw Error('unexpected checkpoint path');
    },
    captureForm: () => ({ ...saveForm }),
    context: () => state,
    status: (message) => messages.push(message),
    unavailable: () => {
      state.available = false;
    },
  });
  const edit = async (operation) => {
    const head = await engine.call('api', { method: 'workspace.describe' });
    const result = await engine.call('api', {
      method: 'edit.apply',
      params: { expectedRevision: head.revision, operations: [operation] },
    });
    assert.ok(result.ok, result.error?.message);
    state.summary = await engine.call('summary');
  };
  const entered = deferred(),
    release = deferred(),
    write = library.draft.bind(library);
  library.draft = async (...args) => {
    writes++;
    entered.resolve();
    await release.promise;
    return write(...args);
  };
  try {
    await engine.call('import', {
      name: 'new.json',
      bytes: new TextEncoder().encode(
        JSON.stringify({ ...emptyProject('Working design'), size: [8, 8, 8] }),
      ).buffer,
    });
    const nbt = tag(10, { id: tag(8, 'minecraft:chest'), seed: tag(4, '9223372036854775807') });
    await edit({
      type: 'set',
      pos: [1, 1, 1],
      state: { Name: 'minecraft:chest', Properties: { facing: 'east' } },
      nbt,
    });
    controller.markDirty();
    const first = controller.persist();
    await entered.promise;
    assert.equal(controller.persist(), first);
    saveForm.note = 'Later note';
    const stairs = { Name: 'example:stairs', Properties: { half: 'top', facing: 'south' } };
    await edit({ type: 'set', pos: [2, 1, 1], state: stairs });
    controller.markDirty();
    release.resolve();
    await first;
    assert.equal(captures, 1);
    assert.equal(writes, 1);
    assert.equal(controller.dirty, true);
    const old = await restored.call('resume', await library.resume());
    assert.equal(old.add, 1);
    assert.equal(old.saveForm.note, 'First note');
    await controller.persist();
    assert.equal(controller.dirty, false);
    const latest = await restored.call('resume', await library.resume());
    assert.equal(latest.add, 2);
    assert.equal(latest.saveForm.note, 'Later note');
    const cells = (
      await restored.call('api', {
        method: 'scene.getBlocks',
        params: {
          positions: [
            [1, 1, 1],
            [2, 1, 1],
          ],
        },
      })
    ).value;
    assert.deepEqual(cells[0].nbt, nbt);
    assert.deepEqual(cells[1].state, stairs);
  } finally {
    release.resolve();
    controller.cancelScheduled();
    library.db?.close();
    await engine.close();
    await restored.close();
  }
});

test('a storage failure leaves edits unsaved and reports unavailability', async () => {
  const state = {
      summary: { workspaceId: 'w', name: 'Failure' },
      active: null,
      available: true,
      blocked: false,
    },
    messages = [];
  const controller = new DraftController({
    library: {
      open: async () => {},
      draft: async () => {
        throw Error('write failed');
      },
    },
    call: async () => ({}),
    baselineRequest: async () => {},
    captureForm: form,
    context: () => state,
    status: (message) => messages.push(message),
    unavailable: () => {
      state.available = false;
    },
  });
  try {
    controller.markDirty();
    await controller.persist();
    assert.equal(controller.dirty, true);
    assert.equal(state.available, false);
    assert.match(messages.at(-1), /本地存储不可用.*write failed/);
  } finally {
    controller.cancelScheduled();
  }
});

test('checkpoint drafts resend missing cached assets and distinguish revision conflicts from storage failure', async () => {
  const state = {
      summary: { workspaceId: 'w', revision: 1, name: 'Checkpoint' },
      active: { id: 'p', head: 1 },
      available: true,
      blocked: false,
    },
    messages = [],
    requests = [],
    writes = [];
  let hasAsset = true,
    conflict = false;
  const library = {
    desktop: { capabilities: ['checkpoint-draft/1'] },
    open: async () => {},
    draftCheckpoint: async (data, id) => {
      if (!hasAsset && !data.assetBytes) throw Error('资源附件不存在');
      hasAsset = true;
      writes.push({ data, id });
    },
  };
  const controller = new DraftController({
    library,
    baselineRequest: async () => ({
      ok: true,
      value: { workspaceId: 'w', revision: state.summary.revision, digest: 'digest' },
    }),
    call: async (action, data) => {
      assert.equal(action, 'draftAttachments');
      requests.push(data);
      if (conflict) throw Error('场景已经更新，请重新读取后继续');
      return {
        assetKey: 'assets',
        saveForm: data.saveForm,
        ...(data.cachedAssetKey === 'assets' ? {} : { assetBytes: Uint8Array.of(1, 2, 3) }),
      };
    },
    captureForm: form,
    context: () => state,
    status: (message) => messages.push(message),
    unavailable: () => {
      state.available = false;
    },
  });
  try {
    controller.markDirty();
    await controller.persist();
    hasAsset = false;
    state.summary.revision = 2;
    controller.markDirty();
    await controller.persist();
    assert.equal(controller.dirty, false);
    assert.equal(writes.length, 2);
    assert.equal(requests.length, 3);
    assert.equal(requests[1].cachedAssetKey, 'assets');
    assert.equal(requests[2].cachedAssetKey, undefined);
    assert.equal(requests[2].expectedRevision, 2);
    assert.deepEqual(writes[1].data.assetBytes, Uint8Array.of(1, 2, 3));
    conflict = true;
    controller.markDirty();
    await controller.persist();
    assert.equal(controller.dirty, true);
    assert.equal(state.available, true);
    assert.match(messages.at(-1), /等待重新同步/);
    conflict = false;
    state.summary.revision = 3;
    await controller.persist();
    assert.equal(controller.dirty, false);
    assert.equal(writes.at(-1).data.revision, 3);
  } finally {
    controller.cancelScheduled();
  }
});
