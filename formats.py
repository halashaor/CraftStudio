"""Region, vanilla/Create, Sponge and Litematica import. Typed NBT survives edits."""
import copy
import math
import struct
import zlib
from pathlib import Path
from nbt import Tag, loads, dumps, plain, to_json, from_json, compound, intlist, state_tag

AIR = {'minecraft:air', 'minecraft:cave_air', 'minecraft:void_air'}


def project(name='新建筑'):
    return {'schema': 1, 'name': name, 'size': [1, 1, 1], 'origin': [0, 0, 0], 'dataVersion': 3955,
            'palette': [], 'blocks': [], 'entities': [], 'metadata': {}, 'warnings': []}


def normalize(p):
    if not p['blocks']:
        p['size'] = [1, 1, 1]
        return p
    lo = [min(b['pos'][a] for b in p['blocks']) for a in range(3)]
    hi = [max(b['pos'][a] for b in p['blocks']) for a in range(3)]
    for b in p['blocks']:
        b['pos'] = [b['pos'][a] - lo[a] for a in range(3)]
    # Keep native entity data; vanilla positions move together with the volume.
    for entity in p.get('entities', []):
        tag = from_json(entity)
        for key in ('pos', 'blockPos'):
            if key in tag.value and tag.value[key].type == 9:
                sub, vals = tag.value[key].value
                tag.value[key] = Tag(9, (sub, [vals[a] - lo[a] for a in range(3)]))
        entity.clear()
        entity.update(to_json(tag))
    p['size'] = [hi[a] - lo[a] + 1 for a in range(3)]
    p['origin'] = [p.get('origin', [0, 0, 0])[a] + lo[a] for a in range(3)]
    return p


def packed_values(data, bits, count, padded):
    mask = (1 << bits) - 1
    data = [v & ((1 << 64) - 1) for v in data]
    if not data:
        return [0] * count
    out = []
    per = 64 // bits
    for i in range(count):
        bit = i * bits
        word, shift = (i // per, (i % per) * bits) if padded else (bit // 64, bit % 64)
        value = data[word] >> shift
        if not padded and shift + bits > 64:
            value |= data[word + 1] << (64 - shift)
        out.append(value & mask)
    return out


def parse_state(text):
    if '[' not in text:
        return {'Name': text}
    name, props = text.rstrip(']').split('[', 1)
    return {'Name': name, 'Properties': dict(pair.split('=', 1) for pair in props.split(','))}


def import_nbt(raw, name):
    root = loads(raw)
    d = plain(root)
    p = project(name)
    if 'blocks' in d and ('palette' in d or 'palettes' in d):
        p['size'] = d['size']
        p['dataVersion'] = d.get('DataVersion', 0)
        p['palette'] = d.get('palette', d.get('palettes', [[]])[0])
        if 'palettes' in d:
            p['warnings'].append('多调色板结构：目前使用第一组调色板；原始调色板保存在元数据。')
        skips, erasures = [], []
        width, _, length = p['size']
        for original in root.value['blocks'].value[1]:
            block = plain(original)
            kind = p['palette'][block['state']]['Name']
            position = block['pos']
            linear = position[0] + width * (position[2] + length * position[1])
            if kind == 'minecraft:structure_void':
                skips.append(linear)
                continue
            if kind in AIR:
                erasures.append(linear)
                continue
            entry = {'pos': block['pos'], 'state': block['state']}
            if 'nbt' in original:
                entry['nbt'] = to_json(original['nbt'])
            p['blocks'].append(entry)
        entities = root.value.get('entities', Tag(9, (10, [])))
        p['entities'] = [to_json(compound(e)) for e in entities.value[1]]
        p['metadata']['nativeExtra'] = {k: to_json(v) for k, v in root.value.items()
                                        if k not in ('blocks', 'palette', 'size', 'entities', 'DataVersion')}
        p['metadata']['sourceFormat'] = 'structure'
        def runs(values):
            out = []
            for value in sorted(values):
                if out and out[-1][0] + out[-1][1] == value:
                    out[-1][1] += 1
                else:
                    out.append([value, 1])
            return out
        if skips or erasures:
            p['metadata']['placementMask'] = dict(schema='craftstudio-placement-mask/1', size=list(p['size']), skipCount=len(skips), eraseCount=len(erasures), skipRuns=runs(skips), eraseRuns=runs(erasures))
        return p
    if 'Regions' in d:
        p['dataVersion'] = d.get('MinecraftDataVersion', 0)
        lookup = {}
        for region_name, region in d['Regions'].items():
            native = root.value['Regions'].value[region_name].value
            pal = region['BlockStatePalette']
            sizes = [region['Size'][a] for a in ('x', 'y', 'z')]
            dims = [abs(v) for v in sizes]
            offset = [region['Position'][a] + min(0, sizes[i] + 1) for i, a in enumerate(('x', 'y', 'z'))]
            indices = packed_values(region['BlockStates'], max(2, (len(pal) - 1).bit_length()), math.prod(dims), False)
            tile = {}
            for be in native.get('TileEntities', Tag(9, (10, []))).value[1]:
                bd = plain(be)
                tile[(bd['x'], bd['y'], bd['z'])] = to_json(compound(be))
            for i, state in enumerate(indices):
                item = pal[state]
                if item['Name'] in AIR:
                    continue
                key = repr(sorted(item.items()))
                if key not in lookup:
                    lookup[key] = len(p['palette'])
                    p['palette'].append(item)
                local = [i % dims[0], i // (dims[0] * dims[2]), (i // dims[0]) % dims[2]]
                entry = {'pos': [local[a] + offset[a] for a in range(3)], 'state': lookup[key]}
                if tuple(local) in tile:
                    entry['nbt'] = tile[tuple(local)]
                p['blocks'].append(entry)
        p['warnings'].append('Litematica：当前导入方块与方块实体；实体和计划刻信息未转换。')
        p['metadata']['sourceFormat'] = 'litematic'
        return normalize(p)
    if 'Schematic' in d:
        root = root.value['Schematic']
        d = plain(root)
    if 'Palette' in d or 'Blocks' in d and 'Palette' in d['Blocks']:
        section = d.get('Blocks', d)
        native = root.value.get('Blocks', root)
        p['size'] = [d['Width'], d['Height'], d['Length']]
        p['dataVersion'] = d.get('DataVersion', 0)
        mapping = section['Palette']
        p['palette'] = [{'Name': 'minecraft:air'} for _ in range(max(mapping.values()) + 1)]
        for state, index in mapping.items():
            p['palette'][index] = parse_state(state)
        raw_values = section.get('Data', section.get('BlockData', []))
        indices, val, shift = [], 0, 0
        for byte in raw_values:
            byte &= 255
            val |= (byte & 127) << shift
            if byte & 128:
                shift += 7
                if shift > 35:
                    raise ValueError('无效 Sponge VarInt')
            else:
                indices.append(val)
                val, shift = 0, 0
        w, h, length = p['size']
        if len(indices) != w * h * length:
            raise ValueError('Sponge 方块数量与尺寸不符')
        for i, state in enumerate(indices):
            if p['palette'][state]['Name'] not in AIR:
                p['blocks'].append({'pos': [i % w, i // (w * length), (i // w) % length], 'state': state})
        tiles = {}
        for be in native.value.get('BlockEntities', Tag(9, (10, []))).value[1]:
            entry = plain(be)
            if 'Pos' in entry:
                converted = copy.deepcopy(be.get('Data', compound({k: v for k, v in be.items() if k not in ('Pos', 'Id')})))
                converted.value['id'] = Tag(8, entry.get('Id', ''))
                tiles[tuple(entry['Pos'])] = to_json(converted)
        for b in p['blocks']:
            if tuple(b['pos']) in tiles:
                b['nbt'] = tiles[tuple(b['pos'])]
        p['warnings'].append('Sponge：导入方块及方块实体；实体和生物群系未转换。')
        p['metadata']['sourceFormat'] = 'schem'
        return p
    raise ValueError('未识别结构格式；支持原版/Create NBT、Sponge schem、Litematica。')


def export_structure(p):
    blocks = []
    for block in p['blocks']:
        out = {'pos': intlist(block['pos']), 'state': Tag(3, block['state'])}
        if block.get('nbt'):
            out['nbt'] = from_json(block['nbt'])
        blocks.append(out)
    palette = list(p['palette'])
    mask = p.get('metadata', {}).get('placementMask')
    if mask and mask['size'] == p['size']:
        occupied = {tuple(b['pos']) for b in p['blocks']}
        width, _, length = p['size']
        for field, name in [('skipRuns', 'minecraft:structure_void'), ('eraseRuns', 'minecraft:air')]:
            state = next((i for i, s in enumerate(palette) if s['Name'] == name), None)
            if state is None:
                state = len(palette)
                palette.append({'Name': name})
            for start, count in mask.get(field, []):
                for i in range(start, start + count):
                    position = (i % width, i // (width * length), (i // width) % length)
                    if position not in occupied:
                        blocks.append({'pos': intlist(list(position)), 'state': Tag(3, state)})
    root = {k: from_json(v) for k, v in p.get('metadata', {}).get('nativeExtra', {}).items() if k != 'palettes'}
    root.update({'DataVersion': Tag(3, p['dataVersion']), 'size': intlist(p['size']),
                 'palette': Tag(9, (10, [state_tag(s).value for s in palette])),
                 'blocks': Tag(9, (10, blocks)),
                 'entities': Tag(9, (10, [from_json(e).value for e in p.get('entities', [])]))})
    return dumps(compound(root))


def read_chunk(folder, cx, cz):
    path = Path(folder) / f'r.{cx // 32}.{cz // 32}.mca'
    if not path.is_file():
        return None
    with path.open('rb') as stream:
        stream.seek(4 * ((cx % 32) + (cz % 32) * 32))
        location = int.from_bytes(stream.read(4), 'big')
        offset, count = location >> 8, location & 255
        if not offset:
            return None
        stream.seek(offset * 4096)
        length = struct.unpack('>I', stream.read(4))[0]
        compression = stream.read(1)[0]
        if length > count * 4096:
            raise ValueError('损坏的区块记录长度')
        if compression & 128:
            data = (Path(folder) / f'c.{cx}.{cz}.mcc').read_bytes()
            compression &= 127
        else:
            data = stream.read(length - 1)
    if compression == 2:
        data = zlib.decompress(data)
    elif compression not in (1, 3):
        raise ValueError(f'暂不支持区块压缩类型 {compression}')
    return loads(data)


def import_region(folder, lo, hi, name):
    if any(hi[a] < lo[a] for a in range(3)):
        raise ValueError('区域终点必须不小于起点')
    p = project(name)
    p['origin'], p['size'] = lo, [hi[a] - lo[a] + 1 for a in range(3)]
    lookup, missing = {}, 0
    for cz in range(lo[2] // 16, hi[2] // 16 + 1):
        for cx in range(lo[0] // 16, hi[0] // 16 + 1):
            root = read_chunk(folder, cx, cz)
            if root is None:
                missing += 1
                continue
            p['dataVersion'] = plain(root).get('DataVersion', 0)
            native = root.value.get('Level', root).value
            tiles = {}
            for be in native.get('block_entities', native.get('TileEntities', Tag(9, (10, [])))).value[1]:
                bd = plain(be)
                tiles[(bd['x'], bd['y'], bd['z'])] = to_json(compound(be))
            sections = native.get('sections', native.get('Sections', Tag(9, (10, []))))
            for section in sections.value[1]:
                sd = plain(section)
                sy = sd['Y'] * 16
                if sy > hi[1] or sy + 15 < lo[1]:
                    continue
                palette = sd.get('block_states', {}).get('palette', sd.get('Palette'))
                if not palette:
                    continue
                data = sd.get('block_states', {}).get('data', sd.get('BlockStates', []))
                values = packed_values(data, max(4, (len(palette) - 1).bit_length()), 4096, p['dataVersion'] >= 2529)
                for i, state in enumerate(values):
                    pos = [cx * 16 + i % 16, sy + i // 256, cz * 16 + (i // 16) % 16]
                    if not all(lo[a] <= pos[a] <= hi[a] for a in range(3)):
                        continue
                    item = palette[state]
                    if item['Name'] in AIR:
                        continue
                    key = repr(sorted(item.items()))
                    if key not in lookup:
                        lookup[key] = len(p['palette'])
                        p['palette'].append(item)
                    b = {'pos': [pos[a] - lo[a] for a in range(3)], 'state': lookup[key]}
                    if tuple(pos) in tiles:
                        b['nbt'] = tiles[tuple(pos)]
                    p['blocks'].append(b)
    p['warnings'].append('存档区域：读取方块及方块实体；实体、光照、生物群系和计划刻未导入。')
    if missing:
        p['warnings'].append(f'{missing} 个区块不存在，未生成区域保持空白。')
    p['metadata']['sourceFormat'] = 'world'
    return p
