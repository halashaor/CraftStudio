import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
test('serialized baseline identity does not reuse a raw source hash after reordered materialization', async () => {
  const e = new EngineWorkspace();
  try {
    const p = emptyProject();
    p.size = [8, 8, 8];
    p.palette = [{ Name: 'minecraft:stone' }];
    p.blocks = [
      { pos: [2, 1, 2], state: 0 },
      { pos: [3, 1, 2], state: 0 },
    ];
    p.metadata.sourceHash = 'synthetic-same-input';
    await e.call('import', {
      name: 'first.json',
      bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
    });
    const first = await e.call('baselineReference');
    p.blocks.reverse();
    await e.call('import', {
      name: 'second.json',
      bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
    });
    const second = await e.call('baselineReference');
    assert.notEqual(first.baseKey, second.baseKey);
    assert.ok(first.baseKey.startsWith('baseline:'));
    assert.equal(
      (await e.call('baselineReference', { cachedKey: second.baseKey })).baseline,
      undefined,
    );
    assert.equal((await e.call('workspaceCheckpoint')).baseKey, second.baseKey);
  } finally {
    await e.close();
  }
});
