import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject } from '../src/storage/new-project.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';

test('blank project remains empty and keeps its working extent through engine roundtrip', async () => {
  const engine = new EngineWorkspace(),
    other = new EngineWorkspace();
  try {
    const project = newProject({ name: '  Design  ', size: [80, 48, 64] });
    await engine.call('import', {
      name: 'new.json',
      bytes: new TextEncoder().encode(JSON.stringify(project)).buffer,
    });
    const bytes = await engine.call('compressed');
    const restored = await other.call('import', { name: 'saved.craftlite', bytes });
    assert.equal(restored.name, 'Design');
    assert.deepEqual(restored.sourceSize, [80, 48, 64]);
    assert.equal(restored.sourceBlocks, 0);
    assert.equal(restored.changes, 0);
    assert.equal(restored.originConfirmed, false);
  } finally {
    await engine.close();
    await other.close();
  }
});
