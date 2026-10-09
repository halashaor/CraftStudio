import test from 'node:test';
import assert from 'node:assert/strict';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { DesignAPI } from '../src/api/design-api.js';
import { proposalOperations, acceptedProposal } from '../src/api/proposal.js';
const setup = () =>
  new Site({
    ...emptyProject(),
    size: [20, 20, 20],
    palette: [{ Name: 'minecraft:stone' }],
    blocks: [{ pos: [1, 0, 1], state: 0 }],
  });
test('proposal deletion is null and adopting mixed edits is one undo with design restoration', () => {
  const site = setup(),
    candidate = site.fork();
  candidate.operations(
    [
      { type: 'erase', min: [1, 0, 1], max: [1, 0, 1] },
      {
        type: 'set',
        pos: [3, 1, 3],
        state: { Name: 'custom:stairs', Properties: { half: 'top' } },
      },
    ],
    { allowTerrain: true, allowExisting: true },
  );
  candidate.design.guides = [{ id: 'new' }];
  const ops = proposalOperations(site, candidate);
  assert.equal(ops.find((o) => o.pos[0] === 1).state, null);
  const accepted = acceptedProposal(site, candidate, ops, {
    allowTerrain: true,
    allowExisting: true,
  });
  assert.ok(site.at([1, 0, 1]));
  assert.equal(site.overlay.size, 0);
  const api = new DesignAPI({ getSite: () => site });
  api.commit(accepted);
  assert.equal(site.at([1, 0, 1]), null);
  assert.equal(site.undo.length, 1);
  assert.equal(site.design.guides[0].id, 'new');
  site.restore('undo');
  assert.ok(site.at([1, 0, 1]));
  assert.equal(site.at([3, 1, 3]), null);
  assert.equal(site.design.guides, undefined);
});
test('failed policy acceptance never partially edits the live scene or publishes design', () => {
  const site = setup(),
    candidate = site.fork();
  candidate.operations(
    [
      { type: 'set', pos: [3, 1, 3], state: { Name: 'minecraft:bricks' } },
      { type: 'erase', min: [1, 0, 1], max: [1, 0, 1] },
    ],
    { allowTerrain: true },
  );
  assert.throws(() => acceptedProposal(site, candidate, proposalOperations(site, candidate), {}));
  assert.equal(site.overlay.size, 0);
  assert.equal(site.undo.length, 0);
});
test('typed NBT-only changes survive proposal diff and design-only commits are undoable', () => {
  const site = setup(),
    candidate = site.fork();
  candidate.operations(
    [
      {
        type: 'set',
        pos: [1, 0, 1],
        state: { Name: 'minecraft:stone' },
        nbt: { t: 10, v: { Long: { t: 4, v: '9223372036854775807' } } },
      },
    ],
    { allowTerrain: true },
  );
  assert.equal(proposalOperations(site, candidate)[0].nbt.v.Long.v, '9223372036854775807');
  const api = new DesignAPI({ getSite: () => site });
  const designOnly = site.fork();
  designOnly.design.guides = [{ id: 'guide' }];
  api.commit(acceptedProposal(site, designOnly, [], {}));
  assert.equal(site.undo.length, 1);
  site.restore('undo');
  assert.equal(site.design.guides, undefined);
});
