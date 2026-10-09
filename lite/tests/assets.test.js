import test from 'node:test';
import assert from 'node:assert/strict';
import { indexedDB } from 'fake-indexeddb';
import {
  assetPreferences,
  catalogue,
  assetMatches,
  humanName,
  rememberedAssetState,
  rememberAsset,
  assetVariants,
  saveAssetVariant,
  variantState,
} from '../src/materials/asset-catalog.js';
import { Site } from '../src/core/site.js';
import { emptyProject } from '../src/minecraft/codec.js';
import { Resources } from '../src/materials/resources.js';
import { LocalLibrary } from '../src/storage/library.js';
test('catalogue uses selected project resources and lazy shape descriptors, including useful orientations', () => {
  const site = new Site({
      ...emptyProject(),
      palette: [
        {
          Name: 'create:cut_limestone_brick_stairs',
          Properties: { facing: 'north', half: 'bottom' },
        },
      ],
      blocks: [{ pos: [0, 0, 0], state: 0 }],
    }),
    resources = new Resources(),
    items = catalogue(site, resources);
  const stairs = items.find((i) => i.id === 'create:cut_limestone_brick_stairs');
  assert.ok(stairs.tags.includes('stairs'));
  assert.ok(stairs.choices.facing.includes('east'));
  assert.ok(stairs.choices.half.includes('top'));
  assert.equal(resources.files.size, 0);
  assert.ok(items.find((i) => i.id === 'minecraft:glass'));
  assert.equal(humanName('minecraft:stone_bricks'), '石砖');
});
test('one block can belong to multiple user types and parent folders include children', () => {
  const prefs = assetPreferences();
  prefs.categories = [
    { id: 'custom:style', name: '日式' },
    { id: 'custom:wall', name: '外墙', parent: 'custom:style' },
    { id: 'custom:spa', name: '温泉' },
  ];
  prefs.assignments['minecraft:stone_bricks'] = ['custom:wall', 'custom:spa'];
  const item = {
    id: 'minecraft:stone_bricks',
    name: '石砖',
    tags: ['stone'],
    source: 'minecraft',
    used: true,
    color: 'neutral',
  };
  assert.ok(assetMatches(item, { category: 'custom:style' }, prefs));
  assert.ok(assetMatches(item, { category: 'custom:spa' }, prefs));
  assert.ok(assetMatches(item, { category: 'stairs' }, prefs) === false);
  assert.ok(assetMatches(item, { category: 'stone', query: '石' }, prefs));
});
test('asset preferences survive reopen and are included in the existing local library backup', async () => {
  const name = 'assets-' + crypto.randomUUID(),
    library = new LocalLibrary(indexedDB, name),
    prefs = assetPreferences();
  prefs.categories.push({ id: 'custom:spa', name: '温泉外墙' });
  prefs.favorites.push('minecraft:glass');
  await library.preference('asset-library', prefs);
  library.close();
  const reopened = new LocalLibrary(indexedDB, name);
  assert.deepEqual(await reopened.preference('asset-library'), prefs);
  const backup = await reopened.backup();
  const restored = new LocalLibrary(indexedDB, 'assets-restored-' + crypto.randomUUID());
  await restored.restore(backup);
  assert.deepEqual(await restored.preference('asset-library'), prefs);
  reopened.close();
  restored.close();
});

test('recent materials retain independent block-state choices and fall back only for incompatible known properties', () => {
  const prefs = assetPreferences(),
    item = {
      id: 'minecraft:stone_brick_stairs',
      states: [
        { Name: 'minecraft:stone_brick_stairs', Properties: { facing: 'north', half: 'bottom' } },
      ],
      choices: { facing: ['north', 'east'], half: ['bottom', 'top'] },
      tags: ['stairs'],
      source: 'minecraft',
      color: 'neutral',
      name: 'Stairs',
    },
    state = { Name: item.id, Properties: { facing: 'east', half: 'top', custom: 'keep' } };
  rememberAsset(prefs, state);
  state.Properties.half = 'bottom';
  assert.equal(rememberedAssetState(item, prefs).Properties.half, 'top');
  assert.ok(assetMatches(item, { category: 'recent' }, prefs));
  const result = rememberedAssetState(item, prefs);
  result.Properties.facing = 'north';
  assert.equal(prefs.lastStates[item.id].Properties.facing, 'east');
  prefs.lastStates[item.id].Properties.facing = 'removed';
  assert.equal(rememberedAssetState(item, prefs).Properties.facing, 'north');
  assert.equal(rememberedAssetState(item, prefs).Properties.custom, 'keep');
});

test('named material states are independent, updated by identity and kept in library backups', async () => {
  const prefs = assetPreferences(),
    state = { Name: 'minecraft:stone_brick_stairs', Properties: { facing: 'east', half: 'top' } },
    a = saveAssetVariant(prefs, state, 'East upper');
  state.Properties.half = 'bottom';
  const b = saveAssetVariant(prefs, state, 'East lower');
  assert.equal(assetVariants(prefs, state.Name).length, 2);
  assert.equal(a.state.Properties.half, 'top');
  assert.throws(() => saveAssetVariant(prefs, state, 'East upper'), /同名/);
  saveAssetVariant(
    prefs,
    { ...state, Properties: { facing: 'west', half: 'bottom' } },
    'West lower',
    b.id,
  );
  assert.equal(prefs.variants.length, 2);
  const library = new LocalLibrary(indexedDB, 'variants-' + crypto.randomUUID());
  await library.preference('asset-library', prefs);
  const backup = await library.backup(),
    other = new LocalLibrary(indexedDB, 'variants-copy-' + crypto.randomUUID());
  await other.restore(backup);
  assert.deepEqual((await other.preference('asset-library')).variants, prefs.variants);
  const item = { id: state.Name, choices: { facing: ['east'], half: ['top', 'bottom'] } };
  const copied = variantState(item, a);
  copied.Properties.half = 'bottom';
  assert.equal(a.state.Properties.half, 'top');
  assert.throws(
    () =>
      variantState(
        item,
        prefs.variants.find((v) => v.id === b.id),
      ),
    /不兼容/,
  );
  library.close();
  other.close();
});
