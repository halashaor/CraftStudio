import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { datapackArchive } from '../src/storage/datapack-export.js';
import { snbt, commandBlock } from '../src/minecraft/snbt.js';
import { emptyProject, exportNBT, tag } from '../src/minecraft/codec.js';
function fixture() {
  const project = {
    ...emptyProject('House'),
    size: [3, 2, 1],
    palette: [
      { Name: 'minecraft:oak_stairs', Properties: { facing: 'east', half: 'top' } },
      { Name: 'minecraft:chest' },
      { Name: 'minecraft:air' },
      { Name: 'minecraft:structure_void' },
    ],
    blocks: [
      {
        pos: [2, 1, 0],
        state: 1,
        nbt: tag(10, {
          id: tag(8, 'minecraft:chest'),
          x: tag(3, 502),
          y: tag(3, 65),
          z: tag(3, -20),
          LootTableSeed: tag(4, '9223372036854775807'),
          CustomName: tag(8, '{"text":"House"}'),
        }),
      },
      { pos: [0, 0, 0], state: 0 },
      { pos: [1, 0, 0], state: 3 },
      { pos: [2, 0, 0], state: 2 },
    ],
  };
  return { bytes: exportNBT(project), offsetLocal: [4, 2, 1], offsetWorld: [500, 64, -20] };
}
const build = (options = {}) =>
  datapackArchive({
    blueprint: fixture(),
    title: 'House',
    kind: 'selection',
    namespace: 'craftstudio_test',
    ...options,
  });
const functions = (bytes) =>
  Object.entries(unzipSync(bytes)).filter(([name]) => name.endsWith('.mcfunction'));
test('SNBT preserves native tags, exact long values, signed byte arrays and escaped strings', () => {
  assert.equal(
    snbt(
      tag(10, {
        byte: tag(1, -1),
        short: tag(2, 8),
        int: tag(3, 12),
        long: tag(4, '-9223372036854775808'),
        float: tag(5, 1.5),
        double: tag(6, 2),
        bytes: tag(7, [0, 127, 128, 255]),
        ints: tag(11, [1, -2]),
        longs: tag(12, ['9223372036854775807']),
        list: tag(9, [8, ['a"b', 'c\\d']]),
      }),
    ),
    '{"byte":-1b,"short":8s,"int":12,"long":-9223372036854775808L,"float":1.5f,"double":2d,"bytes":[B;0b,127b,-128b,-1b],"ints":[I;1,-2],"longs":[L;9223372036854775807L],"list":["a\\"b","c\\\\d"]}',
  );
  assert.throws(() => snbt(tag(8, 'line\nnext')), /控制字符/);
  assert.throws(() => snbt(tag(6, NaN)), /数值/);
  assert.throws(() => commandBlock({ Name: 'minecraft:stone\nsay injected' }), /名称/);
  assert.throws(
    () => commandBlock({ Name: 'minecraft:stone', Properties: { a: 'x] run say bad' } }),
    /属性/,
  );
});
test('datapack keeps exact positions/state/NBT, skips void holes, and includes only explicit air erasures', () => {
  const { bytes, manifest } = build({ placement: 'world' }),
    files = unzipSync(bytes),
    commands = strFromU8(functions(bytes)[0][1]);
  assert.equal(manifest.records, 3);
  assert.equal(manifest.removals, 1);
  assert.equal(manifest.blockEntities, 1);
  assert.match(
    commands,
    /setblock 500 64 -20 minecraft:oak_stairs\[facing=east,half=top\] replace/,
  );
  assert.match(commands, /setblock 502 64 -20 minecraft:air replace/);
  assert.equal(commands.includes('501 64 -20'), false);
  assert.match(commands, /setblock 502 65 -20 minecraft:chest/);
  assert.match(commands, /"LootTableSeed":9223372036854775807L/);
  assert.equal(commands.includes('"x":'), false);
  assert.equal(commands.includes('structure_void'), false);
  assert.equal(
    Object.keys(files).some((name) => name.includes('/tags/')),
    false,
  );
});
test('target profile selects actual plural/singular directory and pack format; relative placement has no invented world origin', () => {
  for (const [target, directory, format] of [
    ['1.20.1', 'functions', 15],
    ['1.21.1', 'function', 48],
  ]) {
    const { bytes, manifest } = build({ target, blueprint: { ...fixture(), offsetWorld: null } }),
      files = unzipSync(bytes);
    assert.equal(JSON.parse(strFromU8(files['pack.mcmeta'])).pack.pack_format, format);
    assert.ok(functions(bytes)[0][0].includes('/' + directory + '/'));
    assert.match(strFromU8(functions(bytes)[0][1]), /setblock ~0 ~0 ~0/);
    assert.equal(manifest.worldOffset, null);
    assert.match(strFromU8(files['README.txt']), /<X> <Y> <Z>/);
  }
  assert.throws(
    () => build({ placement: 'world', blueprint: { ...fixture(), offsetWorld: null } }),
    /原点未确认/,
  );
  assert.throws(() => build({ target: 'unsupported' }), /目标版本/);
});
test('large exports split into independent stages with each record exactly once, without gamerules or auto-run hooks', () => {
  const count = 17000,
    p = {
      ...emptyProject(),
      size: [200, 85, 1],
      palette: [{ Name: 'minecraft:stone' }],
      blocks: Array.from({ length: count }, (_, i) => ({
        pos: [i % 200, Math.floor(i / 200), 0],
        state: 0,
      })),
    };
  const { bytes, manifest } = build({
    blueprint: { bytes: exportNBT(p), offsetLocal: [0, 0, 0], offsetWorld: null },
  });
  assert.equal(manifest.stages.length, 3);
  assert.deepEqual(
    manifest.stages.map((stage) => stage.records),
    [8192, 8192, 616],
  );
  const commands = functions(bytes).flatMap(([, data]) => strFromU8(data).trim().split('\n'));
  assert.equal(commands.length, count);
  assert.equal(new Set(commands).size, count);
  assert.equal(
    commands.some((line) => /gamerule|^function /.test(line)),
    false,
  );
});

test('block-entity initialization stays with its placement within the command budget', () => {
  const count = 4200,
    p = {
      ...emptyProject(),
      size: [100, 42, 1],
      palette: [{ Name: 'minecraft:chest' }],
      blocks: Array.from({ length: count }, (_, i) => ({
        pos: [i % 100, Math.floor(i / 100), 0],
        state: 0,
        nbt: tag(10, { id: tag(8, 'minecraft:chest'), seed: tag(4, '9223372036854775807') }),
      })),
    };
  const { bytes, manifest } = build({
    blueprint: { bytes: exportNBT(p), offsetLocal: [0, 0, 0], offsetWorld: null },
  });
  assert.deepEqual(
    manifest.stages.map((stage) => stage.commands),
    [8192, 208],
  );
  assert.equal(manifest.commands, 8400);
  assert.equal(manifest.records, count);
  assert.equal(manifest.removals, 0);
  for (const [, data] of functions(bytes)) {
    const lines = strFromU8(data).trim().split('\n');
    assert.ok(lines.length <= 8192);
    for (let i = 0; i < lines.length; i += 2) {
      assert.match(lines[i], /minecraft:air replace$/);
      assert.match(lines[i + 1], /minecraft:chest/);
      assert.deepEqual(lines[i].split(' ').slice(1, 4), lines[i + 1].split(' ').slice(1, 4));
    }
  }
});
