import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
test('saved auxiliary curve materializes once, keeps its identity and source editing, and undoes as one step', async () => {
  const engine = new EngineWorkspace();
  try {
    await engine.call('import', {
      name: 'blank.json',
      bytes: new TextEncoder().encode(JSON.stringify({ ...emptyProject(), size: [32, 20, 32] }))
        .buffer,
    });
    const config = {
      kind: 'bezier',
      plane: 'xz',
      points: [
        [3, 4, 3],
        [4, 4, 5],
        [7, 6, 5],
        [9, 6, 3],
      ],
      width: 1,
      state: { Name: 'minecraft:oak_planks' },
      voxel: 'cube',
      surface: 'bottom',
      terrain: 'none',
      guidesOnly: true,
    };
    const guide = await engine.call('prepareConstruction', { type: 'geometry', config });
    await engine.call('commitConstruction', { id: guide.id, name: 'Saved curve' });
    let summary = await engine.call('summary');
    const id = summary.design.guides[0].id;
    assert.equal(summary.design.objects.length, 0);
    assert.equal(summary.changes, 0);
    const generate = { ...config, editGuideId: id, guidesOnly: false, materializeGuide: true };
    const cancelled = await engine.call('prepareConstruction', {
      type: 'geometry',
      config: generate,
    });
    assert.ok(cancelled.counts.place > 0);
    await engine.call('cancelConstruction', { id: cancelled.id });
    assert.equal((await engine.call('summary')).changes, 0);
    const preview = await engine.call('prepareConstruction', {
      type: 'geometry',
      config: generate,
    });
    await engine.call('commitConstruction', { id: preview.id, name: 'Along curve' });
    summary = await engine.call('summary');
    assert.equal(summary.design.guides.length, 1);
    assert.equal(summary.design.guides[0].id, id);
    assert.equal(summary.design.objects.length, 1);
    assert.equal(summary.design.objects[0].guideId, id);
    assert.ok(summary.design.objects[0].generation.sources.includes(id));
    assert.equal(summary.design.objects[0].recipe.materializeGuide, undefined);
    const objectId = summary.design.objects[0].id,
      updated = {
        ...generate,
        materializeGuide: false,
        points: config.points.map((p, i) => (i === 1 ? [p[0], p[1] + 2, p[2]] : p)),
      };
    const edit = await engine.call('prepareConstruction', { type: 'geometry', config: updated });
    await engine.call('commitConstruction', { id: edit.id, name: 'Edit curve' });
    assert.equal((await engine.call('summary')).design.objects[0].id, objectId);
    await engine.call('undo');
    await engine.call('undo');
    summary = await engine.call('summary');
    assert.equal(summary.design.guides.length, 1);
    assert.equal(summary.design.objects.length, 0);
    assert.equal(summary.changes, 0);
  } finally {
    await engine.close();
  }
});
