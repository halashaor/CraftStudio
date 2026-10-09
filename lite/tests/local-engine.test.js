import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import { emptyProject, importNBT } from '../src/minecraft/codec.js';
const importProject = (engine, p = emptyProject()) =>
  engine.call('import', {
    name: 'fixture.craft.json',
    bytes: new TextEncoder().encode(JSON.stringify(p)).buffer,
  });
test('server-hosted shared engine edits unknown states, guards/replays transactions and exports typed geometry', async () => {
  const e = new EngineWorkspace();
  try {
    await importProject(e);
    const call = (request) => e.call('api', request),
      initial = await call({ method: 'workspace.describe' });
    const edit = {
      id: 'edit-once',
      method: 'edit.apply',
      params: {
        expectedRevision: initial.revision,
        operations: [
          {
            type: 'set',
            pos: [4, 2, 4],
            state: { Name: 'example:custom_stairs', Properties: { facing: 'east', half: 'top' } },
          },
        ],
      },
    };
    const result = await call(edit);
    assert.ok(result.ok, result.error?.message);
    assert.deepEqual(await call(edit), result);
    assert.equal(
      (
        await call({
          method: 'edit.apply',
          params: { expectedRevision: initial.revision, operations: [] },
        })
      ).ok,
      false,
    );
    const mesh = await e.call('meshChunks', {
      mode: 'after',
      cut: 4095,
      plants: true,
      showGround: true,
      showExisting: true,
    });
    assert.ok(
      mesh.chunks.some((c) =>
        c.buckets.some((b) => b.positions instanceof Float32Array && b.positions.length),
      ),
    );
    const nbt = await e.call('export', { kind: 'full' });
    assert.ok(nbt instanceof Uint8Array);
    const p = importNBT(nbt, 'export.nbt');
    assert.ok(
      p.palette.some((s) => s.Name === 'example:custom_stairs' && s.Properties.half === 'top'),
    );
    assert.ok(
      (await call({ method: 'history.undo', params: { expectedRevision: result.revision } })).ok,
    );
    assert.equal(
      (await call({ method: 'scene.getBlocks', params: { positions: [[4, 2, 4]] } })).value[0]
        .state,
      null,
    );
    await e.call('import', { name: 'digest.nbt', bytes: nbt.buffer });
    assert.equal(
      (await call({ method: 'scene.getBlocks', params: { positions: [[4, 2, 4]] } })).value[0].state
        .Name,
      'example:custom_stairs',
    );
  } finally {
    await e.close();
  }
});
test('workspace isolation, metadata and typed block entities survive portable reopen in a different server worker', async () => {
  const first = new EngineWorkspace(),
    second = new EngineWorkspace();
  try {
    const p = emptyProject();
    p.size = [8, 8, 8];
    p.palette = [
      {
        Name: 'minecraft:chest',
        Properties: { facing: 'west', type: 'single', waterlogged: 'false' },
      },
    ];
    p.blocks = [
      {
        pos: [2, 1, 2],
        state: 0,
        nbt: {
          type: 10,
          value: {
            id: { type: 8, value: 'minecraft:chest' },
            CustomName: { type: 8, value: '{"text":"Fixture"}' },
          },
        },
      },
    ];
    await Promise.all([importProject(first, p), importProject(second)]);
    const describe = await first.call('api', { method: 'workspace.describe' }),
      annotation = await first.call('api', {
        method: 'measurements.put',
        params: {
          expectedRevision: describe.revision,
          measurement: {
            name: 'Roof angle',
            kind: 'angle',
            points: [
              [2, 1, 2],
              [3, 1, 2],
              [3, 2, 2],
            ],
          },
        },
      });
    assert.ok(annotation.ok, annotation.error?.message);
    assert.equal(
      (await second.call('api', { method: 'scene.getBlocks', params: { positions: [[2, 1, 2]] } }))
        .value[0].state,
      null,
    );
    const before = await first.call('api', {
        method: 'scene.getBlocks',
        params: { positions: [[2, 1, 2]] },
      }),
      bytes = await first.call('compressed', { title: 'portable' });
    await second.call('import', { name: 'reopened.craftlite', bytes: bytes.buffer });
    assert.deepEqual(
      (await second.call('api', { method: 'scene.getBlocks', params: { positions: [[2, 1, 2]] } }))
        .value,
      before.value,
    );
    assert.equal(
      (await second.call('api', { method: 'measurements.list' })).value.items[0].metrics
        .angleDegrees,
      90,
    );
    assert.notEqual(
      (await second.call('api', { method: 'workspace.describe' })).workspaceId,
      describe.workspaceId,
    );
  } finally {
    await Promise.all([first.close(), second.close()]);
  }
});
test('parallel requests share revision order; closing rejects further calls', async () => {
  const e = new EngineWorkspace();
  try {
    await importProject(e);
    const initial = await e.call('api', { method: 'workspace.describe' }),
      results = await Promise.all(
        [1, 2].map((x) =>
          e.call('api', {
            method: 'edit.apply',
            params: {
              expectedRevision: initial.revision,
              operations: [{ type: 'set', pos: [x, 1, 1], state: { Name: 'minecraft:stone' } }],
            },
          }),
        ),
      );
    assert.equal(results.filter((r) => r.ok).length, 1);
    assert.equal(results.filter((r) => !r.ok).length, 1);
  } finally {
    await e.close();
  }
  await assert.rejects(e.call('summary'), /closed/);
});
test('multi-batch server transaction stays staged, commits once and rolls back as one history step', async () => {
  const e = new EngineWorkspace();
  try {
    await importProject(e);
    const call = (r) => e.call('api', r),
      d = await call({ method: 'workspace.describe' }),
      start = await call({ method: 'transaction.begin', params: { expectedRevision: d.revision } }),
      transactionId = start.value.transactionId;
    for (const x of [3, 4])
      assert.ok(
        (
          await call({
            method: 'transaction.apply',
            params: {
              transactionId,
              operations: [{ type: 'set', pos: [x, 2, 2], state: { Name: 'minecraft:bricks' } }],
            },
          })
        ).ok,
      );
    assert.equal(
      (await call({ method: 'scene.getBlocks', params: { positions: [[3, 2, 2]] } })).value[0]
        .state,
      null,
    );
    assert.equal(
      (await call({ method: 'scene.getBlocks', params: { transactionId, positions: [[3, 2, 2]] } }))
        .value[0].state.Name,
      'minecraft:bricks',
    );
    const committed = await call({ method: 'transaction.commit', params: { transactionId } });
    assert.ok(committed.ok);
    assert.equal((await call({ method: 'workspace.describe' })).value.history.undo, 1);
    assert.ok(
      (await call({ method: 'history.undo', params: { expectedRevision: committed.revision } })).ok,
    );
    assert.equal(
      (await call({ method: 'scene.getBlocks', params: { positions: [[4, 2, 2]] } })).value[0]
        .state,
      null,
    );
  } finally {
    await e.close();
  }
});
test('transport clone failures leave the worker usable and shutdown rejects pending calls', async () => {
  const e = new EngineWorkspace();
  await assert.rejects(e.call('summary', { bad: () => {} }));
  assert.equal(e.pending.size, 0);
  await e.call('summary');
  const pending = e.call('summary'),
    rejected = assert.rejects(pending, /closed/);
  await e.close();
  await rejected;
  assert.equal(e.pending.size, 0);
});
