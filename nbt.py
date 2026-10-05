"""Lossless typed Java NBT codec (big endian). Only stdlib dependencies."""
import gzip
import io
import struct
from dataclasses import dataclass


@dataclass
class Tag:
    type: int
    value: object


class Reader:
    def __init__(self, data):
        if data[:2] == b'\x1f\x8b':
            data = gzip.decompress(data)
        self.f = io.BytesIO(data)

    def read(self, count):
        out = self.f.read(count)
        if len(out) != count:
            raise ValueError('NBT 文件截断')
        return out

    def number(self, fmt):
        return struct.unpack('>' + fmt, self.read(struct.calcsize(fmt)))[0]

    def string(self):
        raw = self.read(self.number('H')).replace(b'\xc0\x80', b'\0')
        decoded = raw.decode('utf-8', errors='surrogatepass')
        return decoded.encode('utf-16', errors='surrogatepass').decode('utf-16', errors='surrogatepass')

    def payload(self, kind):
        fmts = {1: 'b', 2: 'h', 3: 'i', 4: 'q', 5: 'f', 6: 'd'}
        if kind in fmts:
            return self.number(fmts[kind])
        if kind == 8:
            return self.string()
        if kind in (7, 11, 12):
            n = self.number('i')
            if n < 0:
                raise ValueError('无效 NBT 数组长度')
            if kind == 7:
                return list(self.read(n))
            return [self.number('i' if kind == 11 else 'q') for _ in range(n)]
        if kind == 9:
            sub, count = self.number('B'), self.number('i')
            if count < 0:
                raise ValueError('无效 NBT 列表长度')
            return (sub, [self.payload(sub) for _ in range(count)])
        if kind == 10:
            out = {}
            while True:
                sub = self.number('B')
                if sub == 0:
                    return out
                name = self.string()
                out[name] = Tag(sub, self.payload(sub))
        raise ValueError(f'不支持的 NBT tag {kind}')


def loads(data):
    reader = Reader(data)
    kind = reader.number('B')
    reader.string()
    if kind != 10:
        raise ValueError('NBT 根节点必须为 Compound')
    return Tag(kind, reader.payload(kind))


def plain(tag):
    if isinstance(tag, Tag):
        if tag.type == 9:
            return [plain(Tag(tag.value[0], v)) for v in tag.value[1]]
        return plain(tag.value)
    if isinstance(tag, dict):
        return {k: plain(v) for k, v in tag.items()}
    return tag


def to_json(tag):
    value = tag.value
    if tag.type == 10:
        value = {k: to_json(v) for k, v in value.items()}
    elif tag.type == 9:
        value = [value[0], [to_json(Tag(value[0], v))['v'] for v in value[1]]]
    elif tag.type in (4, 12):
        value = str(value) if tag.type == 4 else [str(v) for v in value]
    return {'t': tag.type, 'v': value}


def from_json(obj):
    kind, value = obj['t'], obj['v']
    if kind == 10:
        value = {k: from_json(v) for k, v in value.items()}
    elif kind == 9:
        sub, items = value
        value = (sub, [from_json({'t': sub, 'v': v}).value for v in items])
    elif kind == 4:
        value = int(value)
    elif kind == 12:
        value = [int(v) for v in value]
    return Tag(kind, value)


def string(value):
    units = value.encode('utf-16-be', errors='surrogatepass')
    raw = ''.join(chr(int.from_bytes(units[i:i+2], 'big')) for i in range(0, len(units), 2)).encode('utf-8', errors='surrogatepass').replace(b'\0', b'\xc0\x80')
    return struct.pack('>H', len(raw)) + raw


def payload(tag):
    kind, value = tag.type, tag.value
    fmts = {1: 'b', 2: 'h', 3: 'i', 4: 'q', 5: 'f', 6: 'd'}
    if kind in fmts:
        return struct.pack('>' + fmts[kind], value)
    if kind == 8:
        return string(value)
    if kind in (7, 11, 12):
        head = struct.pack('>i', len(value))
        if kind == 7:
            return head + bytes(v & 255 for v in value)
        fmt = 'i' if kind == 11 else 'q'
        return head + b''.join(struct.pack('>' + fmt, v) for v in value)
    if kind == 9:
        sub, items = value
        return bytes([sub]) + struct.pack('>i', len(items)) + b''.join(payload(Tag(sub, v)) for v in items)
    if kind == 10:
        return b''.join(bytes([v.type]) + string(k) + payload(v) for k, v in value.items()) + b'\0'
    raise ValueError('无效 NBT tag')


def dumps(tag, compressed=True):
    raw = bytes([tag.type]) + string('') + payload(tag)
    return gzip.compress(raw, mtime=0) if compressed else raw


def compound(value):
    return Tag(10, value)


def intlist(value):
    return Tag(9, (3, list(value)))


def state_tag(state):
    value = {'Name': Tag(8, state['Name'])}
    if state.get('Properties'):
        value['Properties'] = compound({k: Tag(8, str(v)) for k, v in state['Properties'].items()})
    return compound(value)
