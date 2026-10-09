import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrefab } from '../src/components/prefab-format.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject } from '../src/minecraft/codec.js';
const indexed = () => ({
  schema: 'craftstudio-prefab/1',
  name: 'Custom beam',
  size: [2, 1, 1],
  palette: [{ Name: 'other_mod:roof/beam', Properties: { facing: 'east' } }],
  blocks: [
    { pos: [0, 0, 0], state: 0, nbt: { t: 10, v: { seed: { t: 4, v: '9223372036854775807' } } } },
    { pos: [1, 0, 0], state: 0 },
  ],
});
test('palette-indexed prefabs normalize to explicit unknown Mod states without altering source or typed data', () => {
  const source = indexed(),
    before = structuredClone(source),
    parsed = normalizePrefab(source);
  assert.equal(parsed.blocks[0].state.Name, 'other_mod:roof/beam');
  assert.equal(parsed.blocks[0].nbt.v.seed.v, '9223372036854775807');
  assert.deepEqual(source, before);
});
test('missing palette references, invalid dimensions and duplicate coordinates fail at the format boundary', () => {
  const missing = indexed();
  delete missing.palette;
  assert.throws(() => normalizePrefab(missing), /palette/);
  const invalid = indexed();
  invalid.blocks[0].state = 5;
  assert.throws(() => normalizePrefab(invalid), /palette/);
  const duplicate = indexed();
  duplicate.blocks[1].pos = [0, 0, 0];
  assert.throws(() => normalizePrefab(duplicate), /重复/);
  assert.throws(() => normalizePrefab({ ...indexed(), size: [0, 1, 1] }), /size/);
  assert.throws(() => normalizePrefab({ ...indexed(), size: [1, 1, 1] }), /超出/);
});
test('invalid import and overwrite paste cannot delete an existing target or change library/history', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  await engine.call('import', {
    name: 'base.json',
    bytes: new TextEncoder().encode(
      JSON.stringify({
        ...emptyProject(),
        size: [16, 8, 16],
        palette: [{ Name: 'minecraft:glass' }],
        blocks: [{ pos: [10, 1, 1], state: 0 }],
      }),
    ).buffer,
  });
  const before = await engine.call('package'),
    bad = {
      schema: 'craftstudio-prefab/1',
      name: 'Bad',
      size: [1, 1, 1],
      blocks: [{ pos: [0, 0, 0], state: 0 }],
    };
  await assert.rejects(engine.call('studio', { command: 'prefabImport', prefab: bad }), /palette/);
  await assert.rejects(
    engine.call('studio', {
      command: 'paste',
      prefab: bad,
      at: [10, 1, 1],
      overlap: 'overwrite',
      policy: { allowExisting: true },
    }),
    /palette/,
  );
  const after = await engine.call('package');
  assert.deepEqual(after.site, before.site);
  assert.deepEqual(after.assets, before.assets);
  assert.equal((await engine.call('summary')).undo, 0);
});
test('normalized components survive project reopening and insert with typed block entity data', async (t) => {
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  const preview = await engine.call('selectionPreview', { prefab: indexed(), geometryOnly: true });
  assert.equal(preview.count, 2);
  await engine.call('studio', { command: 'prefabImport', prefab: indexed() });
  const pkg = await engine.call('compressed');
  await engine.call('import', { name: 'reopen.craftlite', bytes: pkg });
  const summary = await engine.call('summary'),
    prefab = summary.design.prefabs[0];
  assert.equal(prefab.blocks[0].state.Name, 'other_mod:roof/beam');
  await engine.call('studio', { command: 'insert', id: prefab.id, at: [10, 1, 1], policy: {} });
  const result = await engine.call('api', {
    method: 'scene.getBlocks',
    params: { positions: [[10, 1, 1]] },
  });
  assert.equal(result.value[0].state.Name, 'other_mod:roof/beam');
  assert.equal(result.value[0].nbt.v.seed.v, '9223372036854775807');
});
