import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync, strToU8 } from 'fflate';
import { BaselineChunkSource } from '../src/storage/baseline-chunks.js';
test('chunk source fetches requested chunks, retains bounded LRU and distinguishes absent/outside data', async () => {
  const calls = [],
    library = {
      baselineManifest: async (key) => ({
        baseKey: key,
        sourceHash: 'immutable',
        chunks: [],
        coverage: 'records',
      }),
      baselineChunks: async (base, keys) => {
        calls.push(keys);
        return {
          sourceHash: 'immutable',
          items: keys.map((key) => ({
            key,
            status: key === 'outside' ? 'outside' : 'records',
            bytes:
              key === 'outside'
                ? undefined
                : gzipSync(strToU8(JSON.stringify([{ pos: [1, 2, 3], state: 0 }]))),
          })),
        };
      },
    },
    source = new BaselineChunkSource(library, { maxCachedChunks: 1 });
  await source.open('base');
  const a = await source.read(['a']);
  assert.equal(a[0].blocksData.length, 1);
  await source.read(['a']);
  assert.equal(calls.length, 1);
  await source.read(['b']);
  assert.equal(source.cache.size, 1);
  const outside = await source.read(['outside']);
  assert.equal(outside[0].blocksData, null);
  assert.equal(outside[0].status, 'outside');
  await source.read(['a']);
  assert.equal(calls.length, 4);
  source.close();
  assert.equal(source.cache.size, 0);
});
test('chunk reads reject mismatched baseline hashes', async () => {
  const source = new BaselineChunkSource({
    baselineManifest: async () => ({ baseKey: 'base', sourceHash: 'a' }),
    baselineChunks: async () => ({ sourceHash: 'b', items: [] }),
  });
  await source.open('base');
  await assert.rejects(() => source.read(['0,0,0']), /版本/);
});

test('invalid negative cache size is rejected rather than looping eviction', () => {
  assert.throws(() => new BaselineChunkSource({}, { maxCachedChunks: -1 }), /非负/);
});
