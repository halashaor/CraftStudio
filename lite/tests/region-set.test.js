import test from 'node:test';
import assert from 'node:assert/strict';
import {
  importRegionFiles,
  prepareRegionFiles,
  importRegionInput,
} from '../src/minecraft/region-set.js';
import { importMCA, exportNBT, importNBT, stateKey } from '../src/minecraft/codec.js';
import { makeMca, boundaryMcaFiles } from './fixtures/mca.js';
import { ProjectImporter } from '../src/storage/project-import.js';
import { WorkerSession } from '../src/runtime/worker-session.js';
import { RemoteEngineWorker } from '../src/runtime/remote-worker.js';
import { EngineStore } from '../../local-engine/store.mjs';
import { createEngineService } from '../../local-engine/service.mjs';
import { Site } from '../src/core/site.js';
import { EngineWorkspace } from '../../local-engine/workspace.mjs';

const region = { min: [511, 0, 0], max: [512, 1, 0] };

test('a vertical crop never promotes an underground cut face into a known terrain surface', async (t) => {
  const files = [
    makeMca('r.0.0.mca', [
      { x: 0, z: 0, sections: [{ y: 0, state: { Name: 'minecraft:stone' } }] },
    ]),
  ];
  const low = importRegionFiles(files, { min: [0, 0, 0], max: [0, 1, 0] }),
    site = new Site(low);
  assert.deepEqual(low.metadata.clippedSurfaceColumns, [0]);
  assert.equal(site.column(0, 0).ground, null);
  assert.equal(site.column(0, 0).clipped, true);
  assert.throws(
    () => site.platform([0, 0], [0, 0], 5, { Name: 'minecraft:oak_planks' }),
    /缺少地面/,
  );
  const complete = new Site(importRegionFiles(files, { min: [0, 0, 0], max: [0, 15, 0] }));
  assert.equal(complete.column(0, 0).ground, 15);
  const engine = new EngineWorkspace();
  t.after(() => engine.close());
  await engine.call('import', {
    name: 'clipped.json',
    bytes: new TextEncoder().encode(JSON.stringify(low)).buffer,
  });
  const compressed = await engine.call('compressed');
  await engine.call('import', { name: 'clipped.craftlite', bytes: compressed });
  const columns = await engine.call('api', {
    method: 'terrain.readColumns',
    params: { min: [0, 0, 0], max: [0, 0, 0] },
  });
  assert.ok(columns.ok, columns.error?.message);
  assert.equal(columns.value.rows[0].ground, null);
  assert.equal(columns.value.rows[0].clipped, true);
});
test('world-coordinate regions merge across a file boundary with exact states and typed block entities', () => {
  const project = importRegionFiles(boundaryMcaFiles(), region, 'Site');
  assert.deepEqual(project.origin, region.min);
  assert.deepEqual(project.size, [2, 2, 1]);
  assert.equal(project.blocks.length, 4);
  assert.equal(
    project.palette[project.blocks.find((b) => b.pos.join(',') === '1,1,0').state].Properties.half,
    'top',
  );
  assert.equal(project.blocks.find((b) => b.nbt).nbt.v.Long.v, '9223372036854775807');
  const exported = importNBT(exportNBT(project), 'Site');
  assert.equal(exported.blocks.length, 4);
  assert.equal(exported.blocks.find((b) => b.nbt).nbt.v.Long.v, '9223372036854775807');
  assert.deepEqual(project.metadata.regionFiles, ['r.0.0.mca', 'r.1.0.mca']);
  assert.deepEqual(project.metadata.clippedSurfaceColumns, [0, 1]);
  assert.equal(project.metadata.missingChunks, 0);
});
test('negative world coordinates and negative section heights retain one common local origin', () => {
  const sections = [
    { y: -1, state: { Name: 'minecraft:stone' } },
    { y: 0, state: { Name: 'minecraft:glass' } },
  ];
  const files = [
    makeMca('r.-1.0.mca', [{ x: -1, z: 0, sections }]),
    makeMca('r.0.0.mca', [{ x: 0, z: 0, sections }]),
  ];
  const project = importRegionFiles(files, { min: [-1, -1, 0], max: [0, 0, 0] });
  assert.deepEqual(project.origin, [-1, -1, 0]);
  assert.deepEqual(project.size, [2, 2, 1]);
  assert.equal(project.blocks.length, 4);
  assert.ok(
    project.blocks
      .filter((b) => b.pos[1] === 0)
      .every((b) => project.palette[b.state].Name === 'minecraft:stone'),
  );
});
test('missing files and duplicate coordinates reject while unused selected files are not read', async () => {
  const files = boundaryMcaFiles();
  assert.throws(() => importRegionFiles([files[0]], region), /r\.1\.0\.mca/);
  assert.throws(() => importRegionFiles([files[0], files[0]], region), /重复/);
  const project = importRegionFiles(
    [...files, { name: 'r.99.99.mca', bytes: new Uint8Array(0) }],
    region,
  );
  assert.equal(project.blocks.length, 4);
  assert.equal(project.metadata.regionFiles.length, 2);
});
test('selected file packing reads headers and selected chunk slices without whole-file buffers', async () => {
  const entries = boundaryMcaFiles(),
    files = entries.map((entry) => new File([entry.bytes], entry.name)),
    reads = [];
  for (const file of files) {
    const slice = file.slice.bind(file);
    file.arrayBuffer = () => {
      throw Error('Whole file buffered');
    };
    file.slice = (start, end) => {
      reads.push([file.name, start, end]);
      return slice(start, end);
    };
  }
  const packed = await prepareRegionFiles([...files, new File([], 'r.99.99.mca')], region, 'Site');
  assert.ok(packed.size < entries.reduce((n, entry) => n + entry.bytes.length, 0));
  assert.ok(reads.some(([name, start]) => name === 'r.0.0.mca' && start === 12288));
  assert.equal(
    reads.some(([name, start]) => name === 'r.0.0.mca' && start === 8192),
    false,
  );
  assert.deepEqual(
    importRegionInput(new Uint8Array(await packed.arrayBuffer())),
    importRegionFiles(entries, region, 'Site'),
  );
});
test('malformed state arrays and truncated records fail instead of inventing terrain', async () => {
  const file = makeMca('r.0.0.mca', [
    {
      x: 0,
      z: 0,
      sections: [
        { y: 0, palette: [{ Name: 'minecraft:stone' }, { Name: 'minecraft:glass' }], data: [] },
      ],
    },
  ]);
  assert.throws(() => importMCA(file.bytes, file.name, [0, 0, 0], [0, 0, 0]), /不完整/);
  const truncated = new File([file.bytes.subarray(0, 8192)], file.name);
  await assert.rejects(prepareRegionFiles([truncated], { min: [0, 0, 0], max: [0, 0, 0] }), /截断/);
  const wrong = makeMca('r.0.0.mca', [{ x: 1, z: 0 }]);
  new DataView(wrong.bytes.buffer).setUint32(0, (2 << 8) | 1, false);
  assert.throws(() => importMCA(wrong.bytes, wrong.name, [0, 0, 0], [0, 0, 0]), /坐标/);
});
test('absent chunks are reported and mixed source versions remain unknown without conversion', () => {
  const missing = importRegionFiles([{ name: 'r.0.0.mca', bytes: new Uint8Array(8192) }], {
    min: [0, 0, 0],
    max: [0, 0, 0],
  });
  assert.equal(missing.metadata.missingChunks, 1);
  assert.equal(missing.blocks.length, 0);
  assert.equal(missing.dataVersion, 0);
  const files = [
    makeMca('r.0.0.mca', [{ x: 31, z: 0, version: 2730 }]),
    makeMca('r.1.0.mca', [{ x: 32, z: 0, version: 3955 }]),
  ];
  const mixed = importRegionFiles(files, region);
  assert.equal(mixed.dataVersion, 0);
  assert.deepEqual(mixed.metadata.dataVersions, [2730, 3955]);
  assert.match(mixed.warnings.join(' '), /不同 DataVersion/);
});
test('multiple explicit MCA inputs stream through actual HTTP and failed candidates retain the active scene', async (t) => {
  const store = new EngineStore(':memory:'),
    service = await createEngineService({ store, token: 'synthetic-region-set-token' });
  const session = new WorkerSession(
    () => new RemoteEngineWorker({ url: service.url, token: 'synthetic-region-set-token' }),
  );
  t.after(async () => {
    session.active.worker.terminate();
    await service.close();
    store.close();
  });
  let imports = 0;
  const call = (...args) => session.call(...args),
    describe = () => call('api', { method: 'workspace.describe' });
  const importer = new ProjectImporter({
    call,
    describe,
    checkpoint: async () => {},
    remote: () => true,
    region: () => region,
    imported: async () => imports++,
    notice: () => {},
  });
  const head = await describe(),
    input = {
      name: 'Boundary site',
      files: boundaryMcaFiles(),
      region,
      workspaceId: head.workspaceId,
      expectedRevision: head.revision,
    };
  const receipt = await importer.openInput(input);
  assert.notEqual(receipt.workspaceId, head.workspaceId);
  assert.equal(receipt.sourceBlocks, 4);
  assert.equal(imports, 1);
  const current = await describe(),
    before = (await call('api', { method: 'scene.readRegion' })).value;
  await assert.rejects(
    importer.openInput({
      ...input,
      files: [input.files[0]],
      workspaceId: current.workspaceId,
      expectedRevision: current.revision,
    }),
    /r\.1\.0/,
  );
  const bad = boundaryMcaFiles();
  bad[1].bytes[8197] = 0;
  await assert.rejects(
    importer.openInput({
      ...input,
      files: bad,
      workspaceId: current.workspaceId,
      expectedRevision: current.revision,
    }),
  );
  assert.equal((await describe()).workspaceId, current.workspaceId);
  assert.deepEqual((await call('api', { method: 'scene.readRegion' })).value, before);
  assert.ok(before.blocks.some((block) => stateKey(block.state).includes('example:stairs')));
});
