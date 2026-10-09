import test from 'node:test';
import assert from 'node:assert/strict';
import { DesignAPI } from '../src/api/design-api.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
test('numeric zero write IDs replay once and stay distinct from string IDs', () => {
  const site = new Site(emptyProject()),
    api = new DesignAPI({ getSite: () => site });
  const first = {
    id: 0,
    method: 'edit.apply',
    params: {
      expectedRevision: api.revision,
      operations: [{ type: 'set', pos: [1, 1, 1], state: { Name: 'example:block' } }],
    },
  };
  const result = api.execute(first);
  assert.ok(result.ok);
  assert.deepEqual(api.execute(first), result);
  assert.equal(site.undo.length, 1);
  const changed = {
    ...first,
    params: {
      expectedRevision: api.revision,
      operations: [{ type: 'set', pos: [2, 1, 1], state: { Name: 'minecraft:glass' } }],
    },
  };
  assert.equal(api.execute(changed).error.code, 'REQUEST_ID_REUSED');
  assert.ok(api.execute({ ...changed, id: '0' }).ok);
  assert.equal(site.undo.length, 2);
  assert.deepEqual(api.execute(first), result);
  assert.equal(site.summary().add, 2);
});
