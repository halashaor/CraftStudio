import test from 'node:test';
import assert from 'node:assert/strict';
import { SavedProjectLoader } from '../src/storage/saved-project-loader.js';

test('saved-project opening preserves edits made while reading the library or parsing a staged document', async () => {
  for (const phase of ['storage', 'parse']) {
    let revision = 1,
      switched = false,
      imported = false;
    const loader = new SavedProjectLoader({
      library: {
        async get() {
          if (phase === 'storage') revision++;
          return { entry: { bytes: new Uint8Array([1, 2]) } };
        },
      },
      call: async (action, data, transfers, options) => {
        if (action === 'api') return { workspaceId: 'editable', revision };
        imported = true;
        revision++;
        await options.validateSwap();
        switched = true;
      },
    });
    await assert.rejects(loader.open('saved', { version: 1, copy: true }), /读取期间又有改动/);
    assert.equal(switched, false);
    assert.equal(imported, phase === 'parse');
  }
});

test('continue editing restores drafts, while a history copy stages independent formal bytes', async () => {
  const entry = { bytes: new Uint8Array([1, 2, 3]) },
    calls = [];
  let resumes = 0;
  const loader = new SavedProjectLoader({
    library: {
      get: async () => ({ entry }),
      resume: async () => {
        resumes++;
        return { payload: 'latest draft' };
      },
    },
    call: async (action, data, transfers, options) => {
      if (action === 'api') return { workspaceId: 'editable', revision: 4 };
      await options.validateSwap();
      if (action === 'import') {
        assert.notEqual(data.bytes, entry.bytes.buffer);
        structuredClone(data, { transfer: transfers });
      }
      calls.push(action);
      return { workspaceId: 'loaded' };
    },
  });
  assert.ok((await loader.open('saved')).draft);
  assert.equal((await loader.open('saved', { version: 1, copy: true })).draft, null);
  assert.deepEqual(calls, ['resume', 'import']);
  assert.equal(resumes, 1);
  assert.deepEqual([...entry.bytes], [1, 2, 3]);
});
