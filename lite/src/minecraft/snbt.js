// Minecraft's pre-1.21 quoted SNBT accepts quote/backslash escapes, not JSON control escapes.
function quote(value) {
  if (/[\x00-\x1f]/.test(value))
    throw Error('NBT 字符串包含命令无法表达的控制字符，请使用 NBT 蓝图交付');
  return '"' + value.replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"';
}
export function snbt(tag) {
  const { t, v } = tag;
  if (t === 8) return quote(v);
  if (t === 10)
    return (
      '{' +
      Object.entries(v)
        .map(([key, value]) => quote(key) + ':' + snbt(value))
        .join(',') +
      '}'
    );
  if (t === 9) return '[' + v[1].map((value) => snbt({ t: v[0], v: value })).join(',') + ']';
  if (t === 7)
    return (
      '[B;' + Array.from(v, (value) => (value > 127 ? value - 256 : value) + 'b').join(',') + ']'
    );
  if (t === 11) return '[I;' + v.join(',') + ']';
  if (t === 12) return '[L;' + v.map((value) => value + 'L').join(',') + ']';
  if (t === 4) return v + 'L';
  if (t >= 1 && t <= 6 && Number.isFinite(v))
    return (Object.is(v, -0) ? '-0' : String(v)) + { 1: 'b', 2: 's', 3: '', 5: 'f', 6: 'd' }[t];
  throw Error('NBT 数值不能转换为命令，请使用 NBT 蓝图交付');
}
export function commandBlock(state, nbt) {
  if (!/^[a-z0-9_.-]+:[a-z0-9_/.-]+$/.test(state.Name))
    throw Error('方块名称不能用于 Java 命令：' + state.Name);
  const properties = Object.entries(state.Properties || {}).sort(([a], [b]) => a.localeCompare(b));
  if (
    properties.some(
      ([key, value]) =>
        !/^[A-Za-z0-9_.+-]+$/.test(key) || !/^[A-Za-z0-9_.+-]+$/.test(String(value)),
    )
  )
    throw Error('方块属性不能用于 Java 命令');
  let block =
    state.Name +
    (properties.length
      ? '[' + properties.map(([key, value]) => key + '=' + value).join(',') + ']'
      : '');
  if (nbt) {
    if (nbt.t !== 10) throw Error('方块实体需要 Compound NBT');
    block += snbt({
      t: 10,
      v: Object.fromEntries(
        Object.entries(nbt.v).filter(([key]) => !['x', 'y', 'z'].includes(key)),
      ),
    });
  }
  return block;
}
