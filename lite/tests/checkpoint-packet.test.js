import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { CheckpointPackets } from '../src/storage/checkpoint-packet.js';
test('checkpoint packets send changed chunks, explicit undo removals and metadata-only changes', () => {
  const s = new Site({ ...emptyProject(), size: [64, 16, 16] }),
    p = new CheckpointPackets(),
    meta = { workspaceId: 'w', baseKey: 'b', allowDelta: true };
  s.operations([
    { type: 'set', pos: [1, 1, 1], state: { Name: 'minecraft:glass' } },
    { type: 'set', pos: [33, 1, 1], state: { Name: 'minecraft:bricks' } },
  ]);
  assert.equal(p.capture(s, { ...meta, revision: 1 }).snapshot.overlay.length, 2);
  s.operations([{ type: 'set', pos: [2, 1, 1], state: { Name: 'custom:detail' } }]);
  const delta = p.capture(s, { ...meta, revision: 2, cachedRevision: 1, cachedWorkspaceId: 'w' });
  assert.equal(delta.mode, 'chunks');
  assert.equal(delta.baseRevision, 1);
  assert.equal(delta.snapshot.overlay, undefined);
  assert.deepEqual(
    delta.chunks.map((c) => c.key),
    ['0,0,0'],
  );
  assert.equal(delta.chunks[0].blocks.length, 2);
  s.restore('undo');
  const undo = p.capture(s, { ...meta, revision: 3, cachedRevision: 2, cachedWorkspaceId: 'w' });
  assert.equal(undo.chunks[0].blocks.length, 1);
  s.restore('undo');
  const cleared = p.capture(s, { ...meta, revision: 4, cachedRevision: 3, cachedWorkspaceId: 'w' });
  assert.ok(cleared.chunks.every((c) => c.blocks.length === 0));
  s.title = 'new';
  assert.equal(
    p.capture(s, { ...meta, revision: 5, cachedRevision: 4, cachedWorkspaceId: 'w' }).chunks.length,
    0,
  );
});
test('missed base version, different workspace and old service use complete checkpoints', () => {
  const s = new Site(emptyProject()),
    p = new CheckpointPackets(),
    meta = { workspaceId: 'w', baseKey: 'b', allowDelta: true };
  p.capture(s, { ...meta, revision: 1 });
  assert.ok(
    p.capture(s, { ...meta, revision: 3, cachedRevision: 0, cachedWorkspaceId: 'w' }).snapshot
      .overlay,
  );
  assert.ok(
    p.capture(s, { ...meta, revision: 4, cachedRevision: 3, cachedWorkspaceId: 'other' }).snapshot
      .overlay,
  );
  assert.ok(
    p.capture(s, {
      ...meta,
      revision: 5,
      cachedRevision: 4,
      cachedWorkspaceId: 'w',
      allowDelta: false,
    }).snapshot.overlay,
  );
  assert.equal(
    p.capture(s, { ...meta, revision: 5, cachedRevision: 5, cachedWorkspaceId: 'w' }).cached,
    true,
  );
});
