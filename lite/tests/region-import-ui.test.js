import test from 'node:test';
import assert from 'node:assert/strict';
import { RegionImportUI } from '../src/ui/region-import-ui.js';
function setup(describe = async () => ({ workspaceId: 'site', revision: 4 })) {
  const nodes = new Map(),
    calls = [],
    $ = (id) => {
      if (!nodes.has(id)) nodes.set(id, { scrollIntoView() {} });
      return nodes.get(id);
    };
  const importer = {
    openFiles: async (files, options) => {
      calls.push({ files, options });
      return { workspaceId: 'new' };
    },
  };
  const ui = new RegionImportUI({
    $,
    importer,
    describe,
    task: (run) => run(),
    showSettings: () => calls.push('settings'),
  });
  return { ui, $, calls, importer };
}
test('MCA file staging waits for explicit range reading and pins the visible workspace', async () => {
  const { ui, $, calls } = setup(),
    files = [{ name: 'r.0.0.mca' }, { name: 'r.1.0.mca' }];
  await ui.stage(files);
  assert.deepEqual(calls, ['settings']);
  assert.equal($('mca-read').disabled, false);
  assert.equal($('mca-options').open, true);
  assert.match($('mca-selected').textContent, /已选 2/);
  assert.match($('mca-selected').textContent, /1023/);
  await $('mca-read').onclick();
  assert.deepEqual(calls[1].options, { guard: { workspaceId: 'site', expectedRevision: 4 } });
  assert.deepEqual(calls[1].files, files);
  assert.equal($('mca-read').disabled, true);
});
test('late staging replies cannot reopen cleared or newer file selections', async () => {
  const pending = [];
  const { ui, $ } = setup(() => new Promise((resolve) => pending.push(resolve)));
  const first = ui.stage([{ name: 'r.0.0.mca' }]);
  const second = ui.stage([{ name: 'r.1.0.mca' }]);
  pending[1]({ workspaceId: 'latest', revision: 2 });
  await second;
  pending[0]({ workspaceId: 'old', revision: 1 });
  await first;
  assert.equal(ui.guard.workspaceId, 'latest');
  assert.match($('mca-selected').textContent, /512/);
  const third = ui.stage([{ name: 'r.2.0.mca' }]);
  ui.clear();
  pending[2]({ workspaceId: 'late', revision: 3 });
  await third;
  assert.equal($('mca-read').disabled, true);
  assert.equal(ui.files, null);
});
test('read failures stay inline and retain the selection for correction without replacing the scene', async () => {
  const { ui, $, importer } = setup();
  await ui.stage([{ name: 'r.0.0.mca' }]);
  importer.openFiles = async () => {
    throw Error('缺少 r.1.0.mca');
  };
  await assert.rejects(ui.read(), /缺少/);
  assert.match($('mca-report').textContent, /r\.1\.0/);
  assert.ok(ui.files);
  importer.openFiles = async () => {
    throw Error('IMPORT_CONFLICT: changed');
  };
  await assert.rejects(ui.read(), /当前设计有新修改/);
  assert.equal($('mca-read').disabled, false);
  await assert.rejects(ui.stage([{ name: 'r.0.0.mca' }, { name: 'r.0.0.mca' }]), /重复/);
});
