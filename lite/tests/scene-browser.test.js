import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneBrowser } from '../src/ui/scene-browser.js';
const guide = (id, name, extra = {}) => ({
  id,
  name,
  revision: 0,
  points: [
    [1, 1, 1],
    [2, 1, 1],
  ],
  recipe: {
    kind: 'line',
    points: [
      [1, 1, 1],
      [2, 1, 1],
    ],
  },
  ...extra,
});
const fixture = () => ({
  collections: [
    { id: 'hall', name: '建筑区' },
    { id: 'garden', name: '庭院' },
  ],
  guides: [
    guide('profile', '地基轮廓'),
    guide('offset', '外墙偏移', {
      provenance: { kind: 'offset', guideId: 'profile', sourceRevision: 0, distance: 1 },
    }),
    guide('path', '花园路径'),
    guide('free', '独立参考线'),
    guide('output', '主馆结果', { recipe: { operation: 'extrude' } }),
  ],
  objects: [
    {
      id: 'main',
      name: '主馆',
      collectionId: 'hall',
      guideId: 'output',
      generation: { type: 'feature', sources: ['offset'] },
    },
    {
      id: 'shed',
      name: '亭子',
      collectionId: 'garden',
      generation: { type: 'feature', sources: ['path'] },
    },
    { id: 'lamp', name: '灯柱' },
  ],
});
const sorted = (set) => [...set].sort();

test('collection browsing includes upstream offset sketches and keeps unrelated free sketches separate', () => {
  const design = fixture(),
    before = structuredClone(design),
    browser = new SceneBrowser(design);
  let result = browser.filter({ collection: 'group:hall' });
  assert.deepEqual(sorted(result.objectIds), ['main']);
  assert.deepEqual(sorted(result.guideIds), ['offset', 'profile']);
  result = browser.filter({ collection: 'group:garden' });
  assert.deepEqual(sorted(result.objectIds), ['shed']);
  assert.deepEqual(sorted(result.guideIds), ['path']);
  result = browser.filter({ collection: 'none' });
  assert.deepEqual(sorted(result.objectIds), ['lamp']);
  assert.deepEqual(sorted(result.guideIds), ['free']);
  assert.deepEqual(design, before);
});

test('semantic search finds buildings by source or collection names, independent sketches, and multiple words', () => {
  const browser = new SceneBrowser(fixture());
  assert.deepEqual(sorted(browser.filter({ query: '地基' }).objectIds), ['main']);
  assert.deepEqual(sorted(browser.filter({ query: '建筑区 主馆' }).guideIds), [
    'offset',
    'profile',
  ]);
  assert.deepEqual(sorted(browser.filter({ query: '独立参考' }).objectIds), []);
  assert.deepEqual(sorted(browser.filter({ query: '独立参考' }).guideIds), ['free']);
  assert.equal(browser.filter({ query: '锁定' }).objectIds.size, 0);
  assert.equal(browser.filter({ query: '主馆', collection: 'group:garden' }).guideIds.size, 0);
  const all = browser.filter();
  assert.equal(all.objectCount, 3);
  assert.equal(all.guideCount, 4);
  assert.equal(all.guideIds.size, 4);
  assert.equal(all.filtered, false);
});

test('source cycles terminate and attention scopes include only affected building sketches', () => {
  const design = {
    guides: [
      guide('a', 'A', { provenance: { kind: 'offset', guideId: 'b' } }),
      guide('b', 'B', { provenance: { kind: 'offset', guideId: 'a' } }),
      guide('ok', 'OK'),
    ],
    objects: [
      { id: 'broken', name: 'Broken', generation: { sources: ['a'] } },
      { id: 'ready', name: 'Ready', generation: { sources: ['ok'] } },
    ],
  };
  const result = new SceneBrowser(design).filter({ attention: true });
  assert.deepEqual(sorted(result.objectIds), ['broken']);
  assert.deepEqual(sorted(result.guideIds), ['a', 'b']);
  assert.equal(result.attentionCount, 1);
});
