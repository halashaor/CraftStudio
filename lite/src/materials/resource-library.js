import { unzipSync, zipSync } from 'fflate';
export function resourceArchive(bytes, name) {
  const files = unzipSync(new Uint8Array(bytes), {
    filter: (f) =>
      /^assets\/[^/]+\//.test(f.name) && !f.name.endsWith('/') && !f.name.split('/').includes('..'),
  });
  const keys = Object.keys(files);
  if (!keys.length) throw Error(name + ' 中没有可读取的 assets 资源');
  const namespaces = [...new Set(keys.map((k) => k.split('/')[1]))],
    kind = /\.zip$/i.test(name)
      ? 'pack'
      : namespaces.includes('create')
        ? 'create'
        : namespaces.every((n) => n === 'minecraft')
          ? 'vanilla'
          : 'mod';
  return { name, kind, namespaces, count: keys.length, bytes: zipSync(files, { level: 1 }) };
}
export class ResourceLibrary {
  constructor(storage, call) {
    this.storage = storage;
    this.call = call;
    this.entries = [];
  }
  async load() {
    const stored = await this.storage.preference('resource-library');
    this.entries = stored?.schema === 1 ? stored.entries || [] : [];
    return this.entries;
  }
  async apply(entries = this.entries, guard = {}) {
    return this.call('resourceLibrary', {
      ...guard,
      files: entries
        .filter((e) => e.enabled !== false)
        .map((e) => ({ name: e.name, bytes: e.bytes.slice().buffer })),
    });
  }
  async save(entries, guard = {}) {
    await this.storage.preference('resource-library', { schema: 1, entries });
    let result;
    try {
      result = await this.apply(entries, guard);
    } catch (error) {
      await this.storage.preference('resource-library', { schema: 1, entries: this.entries });
      throw error;
    }
    this.entries = entries;
    return result;
  }
  async add(files, guard = {}) {
    const parsed = [];
    for (const f of files) parsed.push(await this.call('resourceArchive', f));
    const baseKinds = new Set(
      parsed.filter((p) => ['vanilla', 'create'].includes(p.kind)).map((p) => p.kind),
    );
    const entries = this.entries.map((e) => (baseKinds.has(e.kind) ? { ...e, enabled: false } : e));
    for (const p of parsed) {
      const i = entries.findIndex((e) => e.name === p.name && e.kind === p.kind),
        row = { ...p, id: i < 0 ? crypto.randomUUID() : entries[i].id, enabled: true };
      if (i < 0) {
        const rank = { vanilla: 0, create: 1, mod: 2, pack: 3 },
          at = entries.findIndex((e) => rank[e.kind] > rank[row.kind]);
        entries.splice(at < 0 ? entries.length : at, 0, row);
      } else entries[i] = row;
    }
    return this.save(entries, guard);
  }
}
