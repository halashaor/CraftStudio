import test from 'node:test';
import assert from 'node:assert/strict';
import { readSaveForm } from '../src/storage/save-form.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
import { gunzipSync, strFromU8 } from 'fflate';
const form = {
  schema: 'craftstudio-save-form/1',
  title: 'Draft title',
  tags: '木屋，庭院',
  kind: 'project',
  note: 'Next version note',
};
test('save form accepts only known string fields and treats missing/invalid records as unavailable', () => {
  assert.deepEqual(readSaveForm({ ...form, untrusted: 'ignored' }), form);
  assert.equal(readSaveForm(undefined), null);
  assert.equal(readSaveForm({ ...form, note: { text: 'invalid' } }), null);
});
test('draft restores pending form while formal portable export omits it', async () => {
  const e = new EngineWorkspace(),
    other = new EngineWorkspace();
  try {
    await e.call('import', {
      name: 'form.json',
      bytes: new TextEncoder().encode(JSON.stringify(emptyProject('Form'))).buffer,
    });
    const d = await e.call('draft', { title: 'Draft title', saveForm: form }),
      s = await other.call('resume', {
        baseline: d.baseline,
        bytes: d.payload,
        assetBytes: d.assetBytes,
      });
    assert.deepEqual(s.saveForm, form);
    const pkg = JSON.parse(strFromU8(gunzipSync(await other.call('compressed'))));
    assert.equal(pkg.saveForm, undefined);
    assert.equal(pkg.site.saveForm, undefined);
  } finally {
    await e.close();
    await other.close();
  }
});
