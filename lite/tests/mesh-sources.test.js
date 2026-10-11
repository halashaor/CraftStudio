import test from 'node:test';
import assert from 'node:assert/strict';
import { DesignAPI } from '../src/api/design-api.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { getParsedMesh, meshMutation } from '../src/models/mesh-sources.js';
import { generationLinks } from '../src/modeling/generation-links.js';
import { affectedGeneration, orderedGeneration } from '../src/modeling/generation-order.js';

const triangle = 'v 0 0 0\nv 2 0 0\nv 0 2 0\nf 1 2 3';
const source = { id: 'roof', name: 'Roof model', objText: triangle };

function setup() {
  const site = new Site(emptyProject()),
    api = new DesignAPI({ getSite: () => site });
  const rpc = (method, params = {}, id) =>
    api.execute({
      id,
      method,
      params: { workspaceId: api.workspaceId, expectedRevision: api.revision, ...params },
    });
  return { site, api, rpc };
}

test('mesh source metadata is lightweight and mutable independently of generated result poses', () => {
  const { site, rpc } = setup();
  const created = rpc('meshes.put', { source });
  assert.ok(created.ok, created.error?.message);
  assert.equal(created.value.revision, 1);
  assert.equal(created.value.objText, undefined);
  assert.equal(created.value.summary.design.meshSources[0].objText, undefined);
  const parsed = getParsedMesh(site.design, 'roof');
  site.design.objects.push({
    id: 'instance',
    meshSourceId: 'roof',
    recipe: { sourceId: 'roof', transform: { position: [6, 4, 8] } },
    generation: { type: 'mesh', sourceRefs: [{ kind: 'mesh', id: 'roof' }] },
  });
  const moved = rpc('meshes.put', {
    source: {
      id: 'roof',
      name: 'Moved reference',
      hidden: true,
      transform: { position: [30, 2, 10] },
    },
  });
  assert.ok(moved.ok, moved.error?.message);
  assert.equal(moved.value.revision, 1);
  assert.equal(moved.value.sourceKey, created.value.sourceKey);
  assert.equal(getParsedMesh(site.design, 'roof'), parsed);
  assert.equal(site.design.objects[0].generation.outdated, undefined);
  assert.deepEqual(site.design.objects[0].recipe.transform.position, [6, 4, 8]);
  const read = rpc('meshes.read', { id: 'roof' });
  assert.equal(read.value.objText, triangle);
  read.value.transform.position[0] = -1;
  assert.equal(site.design.meshSources[0].transform.position[0], 30);
  const listed = rpc('meshes.list');
  assert.equal(listed.value[0].objText, undefined);
});

test('invalid source updates are atomic and stale source reads use revision guards', () => {
  const { site, api, rpc } = setup();
  assert.ok(rpc('meshes.put', { source }).ok);
  const before = site.pack(),
    revision = api.revision,
    history = site.undo.length;
  const bad = rpc('meshes.put', { source: { id: 'roof', objText: 'v 1 0 0\nf 1 2 3' } });
  assert.equal(bad.ok, false);
  assert.deepEqual(site.pack(), before);
  assert.equal(api.revision, revision);
  assert.equal(site.undo.length, history);
  assert.equal(
    rpc('meshes.read', { id: 'roof', expectedRevision: revision - 1 }).error.code,
    'REVISION_CONFLICT',
  );
  assert.equal(
    rpc('meshes.put', { source: { id: 'roof', transform: { scale: [0, 1, 1] } } }).ok,
    false,
  );
  assert.deepEqual(site.pack(), before);
});

test('source writes stage and replay with one committed undo step; saved projects retain geometry', () => {
  const { site, api, rpc } = setup();
  const transactionId = rpc('transaction.begin').value.transactionId;
  const request = {
    id: 'source-once',
    method: 'meshes.put',
    params: { transactionId, source },
  };
  const staged = api.execute(request);
  assert.ok(staged.ok, staged.error?.message);
  assert.equal(staged.value.staged, true);
  assert.equal(staged.value.id, 'roof');
  assert.deepEqual(api.execute(request), staged);
  assert.deepEqual(rpc('meshes.list').value, []);
  assert.equal(rpc('meshes.read', { transactionId, id: 'roof' }).value.objText, triangle);
  assert.ok(rpc('transaction.commit', { transactionId }).ok);
  assert.equal(site.undo.length, 1);
  const recovered = Site.unpack(JSON.parse(JSON.stringify(site.pack())));
  assert.equal(recovered.design.meshSources[0].objText, triangle);
  assert.deepEqual(
    getParsedMesh(recovered.design, 'roof').triangles,
    getParsedMesh(site.design, 'roof').triangles,
  );
  assert.ok(rpc('history.undo').ok);
  assert.deepEqual(rpc('meshes.list').value, []);
  assert.ok(rpc('history.redo').ok);
  assert.equal(rpc('meshes.read', { id: 'roof' }).value.objText, triangle);
});

test('mesh and guide sources with the same ID remain distinct in mutation and graph diagnostics', () => {
  const { site, rpc } = setup();
  assert.ok(rpc('meshes.put', { source }).ok);
  site.design.guides = [{ id: 'roof', name: 'Unrelated sketch', revision: 8 }];
  site.design.objects = [
    {
      id: 'mesh-a',
      name: 'Mesh A',
      generation: {
        type: 'mesh',
        sourceRefs: [{ kind: 'mesh', id: 'roof' }],
        sourceVersions: { 'mesh:roof': 1 },
      },
    },
    {
      id: 'mesh-b',
      name: 'Mesh B',
      generation: { type: 'mesh', sourceRefs: [{ kind: 'mesh', id: 'roof' }] },
    },
    { id: 'sketch', name: 'Sketch result', generation: { type: 'feature', sources: ['roof'] } },
  ];
  assert.deepEqual(
    affectedGeneration(site.design, 'roof').objects.map((o) => o.id),
    ['sketch'],
  );
  assert.deepEqual(
    affectedGeneration(site.design, { kind: 'mesh', id: 'roof' }).objects.map((o) => o.id),
    ['mesh-a', 'mesh-b'],
  );
  const replaced = rpc('meshes.put', {
    source: { id: 'roof', objText: triangle.replace('2 0 0', '3 0 0') },
  });
  assert.ok(replaced.ok, replaced.error?.message);
  assert.equal(replaced.value.revision, 2);
  assert.deepEqual(
    site.design.objects.map((o) => !!o.generation.outdated),
    [true, true, false],
  );
  const links = generationLinks(site.design);
  assert.equal(links.objects[0].sources[0].kind, 'mesh');
  assert.equal(links.objects[0].sources[0].name, 'Roof model');
  assert.equal(links.objects[2].sources[0].name, 'Unrelated sketch');
  assert.deepEqual(
    links.guides[0].dependents.map((o) => o.id),
    ['sketch'],
  );
  assert.deepEqual(
    links.meshes[0].dependents.map((o) => o.id),
    ['mesh-a', 'mesh-b'],
  );
  assert.equal(rpc('meshes.remove', { id: 'roof' }).ok, false);
  for (const object of site.design.objects.slice(0, 2)) object.generation.detached = true;
  assert.ok(rpc('meshes.remove', { id: 'roof' }).ok);
  assert.equal(site.design.guides.length, 1);
  assert.equal(generationLinks(site.design).objects[2].status, 'ready');
  site.design.objects[0].generation.detached = false;
  assert.equal(generationLinks(site.design).objects[0].status, 'error');
  assert.throws(() => orderedGeneration(site.design, [site.design.objects[0]]), /失效/);
});

test('cache checks source text as well as imported source keys', () => {
  const { site } = setup();
  meshMutation(site, 'meshes.put', { source });
  const parsed = getParsedMesh(site.design, 'roof');
  const recovered = Site.unpack(site.pack());
  recovered.design.meshSources[0].objText = triangle.replace('2 0 0', '5 0 0');
  const changed = getParsedMesh(recovered.design, 'roof');
  assert.notEqual(changed, parsed);
  assert.equal(changed.bounds.max[0], 5);
  assert.equal(getParsedMesh(site.design, 'roof').bounds.max[0], 2);
});
