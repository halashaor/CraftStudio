import test from 'node:test';
import assert from 'node:assert/strict';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';
import {
  ConstructionConflicts,
  constructionConflictKind,
} from '../src/modeling/construction-conflicts.js';
import { Site, coordKey } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';

test('conflict sampling keeps late reasons visible and full bounds beyond the sample limit', () => {
  const conflicts = new ConstructionConflicts();
  assert.deepEqual(conflicts.summary(), {
    count: 0,
    bounds: null,
    groups: [],
    sampleCount: 0,
    truncated: false,
  });
  for (let x = 0; x < 400; x++) conflicts.add([x, 3, 1], 'terrain', 'terrain');
  for (const [index, kind] of ['existing', 'protected', 'locked', 'other'].entries())
    conflicts.add([500 + index, 7, 8], kind, kind);
  const summary = conflicts.summary();
  assert.equal(summary.count, 404);
  assert.equal(conflicts.conflicts.length, 20);
  assert.equal(summary.sampleCount, 200);
  assert.equal(summary.truncated, true);
  assert.deepEqual(summary.bounds, { min: [0, 3, 1], max: [503, 7, 8] });
  assert.equal(
    summary.groups.reduce((n, group) => n + group.samples.length, 0),
    200,
  );
  assert.ok(summary.groups.every((group) => group.samples.length > 0));
  assert.equal(summary.groups[0].count, 400);
  assert.deepEqual(summary.groups[0].bounds, { min: [0, 3, 1], max: [399, 3, 1] });
  summary.bounds.min[0] = -20;
  summary.groups[0].samples[0].pos[0] = -20;
  assert.equal(conflicts.summary().bounds.min[0], 0);
  assert.equal(conflicts.summary().groups[0].samples[0].pos[0], 0);
});

test('conflict classification follows protection precedence without changing source data', () => {
  const site = new Site({
    ...emptyProject(),
    size: [8, 8, 8],
    palette: [{ Name: 'minecraft:water' }, { Name: 'minecraft:oak_planks' }],
    blocks: [
      { pos: [1, 1, 1], state: 0 },
      { pos: [2, 1, 1], state: 1 },
    ],
  });
  assert.equal(constructionConflictKind(site, [1, 1, 1]), 'terrain');
  assert.equal(constructionConflictKind(site, [2, 1, 1]), 'existing');
  assert.equal(constructionConflictKind(site, [3, 1, 1]), 'other');
  site.protected = [{ min: [1, 1, 1], max: [1, 1, 1] }];
  const before = structuredClone(site.pack());
  assert.equal(constructionConflictKind(site, [1, 1, 1]), 'protected');
  assert.equal(constructionConflictKind(site, [1, 1, 1], { name: 'locked' }), 'locked');
  assert.deepEqual(site.pack(), before);
});

test('curve previews count final changed cells once, report all reasons and preserve the scene on rejection', async () => {
  const engine = new EngineWorkspace(),
    material = { Name: 'minecraft:glass' },
    project = {
      ...emptyProject('Conflict preview'),
      size: [262, 4, 4],
      palette: [{ Name: 'minecraft:stone' }, { Name: 'minecraft:oak_planks' }, material],
      blocks: Array.from({ length: 260 }, (_, x) => ({
        pos: [x, 1, 1],
        state: x < 250 ? 0 : x === 259 ? 2 : 1,
      })),
      metadata: {
        design: {
          objects: [
            {
              id: 'locked-wall',
              name: 'Locked wall',
              min: [254, 1, 1],
              max: [255, 1, 1],
              cells: [coordKey(254, 1, 1), coordKey(255, 1, 1)],
              collectionId: 'house',
            },
          ],
          collections: [{ id: 'house', name: 'House', locked: true }],
        },
      },
    },
    config = {
      kind: 'polyline',
      plane: 'xz',
      voxel: 'cube',
      state: material,
      points: [
        [0.5, 2, 1.5],
        [260.5, 2, 1.5],
        [0.5, 2, 1.5],
      ],
    };
  try {
    await engine.call('import', {
      name: 'conflicts.json',
      bytes: new TextEncoder().encode(JSON.stringify(project)).buffer,
    });
    await engine.call('protect', { min: [251, 1, 1], max: [251, 1, 1], name: 'Keep this block' });
    const before = (await engine.call('package', { preserveTitle: true })).site,
      revision = (await engine.call('summary')).revision,
      preview = await engine.call('prepareConstruction', { type: 'geometry', config, policy: {} }),
      summary = preview.conflictSummary;
    assert.equal(preview.conflicts.length, 20);
    assert.equal(summary.count, 259);
    assert.equal(summary.sampleCount, 200);
    assert.equal(summary.truncated, true);
    assert.deepEqual(summary.bounds, { min: [0, 1, 1], max: [258, 1, 1] });
    assert.deepEqual(Object.fromEntries(summary.groups.map((group) => [group.kind, group.count])), {
      terrain: 250,
      existing: 6,
      protected: 1,
      locked: 2,
    });
    assert.ok(summary.groups.every((group) => group.samples.length));
    assert.equal(preview.counts.place, 1);
    assert.equal(preview.counts.replace, 259);
    assert.deepEqual((await engine.call('package', { preserveTitle: true })).site, before);
    await assert.rejects(engine.call('commitConstruction', { id: preview.id, policy: {} }), /地形/);
    assert.deepEqual((await engine.call('package', { preserveTitle: true })).site, before);
    assert.equal((await engine.call('summary')).revision, revision);
    const permitted = await engine.call('prepareConstruction', {
      type: 'geometry',
      config,
      policy: { allowTerrain: true, allowExisting: true },
    });
    assert.equal(permitted.conflictSummary.count, 3);
    assert.equal(permitted.conflictSummary.sampleCount, 3);
    assert.equal(permitted.conflictSummary.truncated, false);
    assert.deepEqual(
      permitted.conflictSummary.groups.map((group) => group.kind),
      ['protected', 'locked'],
    );
    await assert.rejects(
      engine.call('commitConstruction', {
        id: permitted.id,
        policy: { allowTerrain: true, allowExisting: true },
      }),
      /保留区/,
    );
    assert.deepEqual((await engine.call('package', { preserveTitle: true })).site, before);
  } finally {
    await engine.close();
  }
});
