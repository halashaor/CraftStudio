import { gunzipSync, strFromU8 } from 'fflate';
export class BaselineChunkSource {
  constructor(library, { maxCachedChunks = 32 } = {}) {
    if (!Number.isSafeInteger(maxCachedChunks) || maxCachedChunks < 0)
      throw Error('区块缓存数量需要非负整数');
    this.library = library;
    this.maxCachedChunks = maxCachedChunks;
    this.cache = new Map();
    this.manifest = null;
  }
  async open(baseKey, baseline) {
    this.manifest = await this.library.baselineManifest(baseKey, baseline);
    this.cache.clear();
    return this.manifest;
  }
  async read(keys) {
    if (!Array.isArray(keys) || keys.some((k) => typeof k !== 'string'))
      throw Error('需要区块键数组');
    if (!this.manifest) throw Error('先打开基线索引');
    const manifest = this.manifest;
    const missing = [...new Set(keys)].filter((k) => !this.cache.has(k));
    let fetched = new Map();
    if (missing.length) {
      for (let start = 0; start < missing.length; start += 128) {
        const result = await this.library.baselineChunks(
          this.manifest.baseKey,
          missing.slice(start, start + 128),
        );
        if (this.manifest !== manifest || result.sourceHash !== manifest.sourceHash)
          throw Error('基线版本已变化，请重新打开索引');
        for (const item of result.items) {
          const entry = {
            ...item,
            blocksData: item.bytes ? JSON.parse(strFromU8(gunzipSync(item.bytes))) : null,
          };
          delete entry.bytes;
          fetched.set(item.key, entry);
        }
      }
    }
    const result = keys.map((key) => {
      const entry = fetched.get(key) || this.cache.get(key);
      if (!entry) throw Error('区块响应不完整');
      this.cache.delete(key);
      this.cache.set(key, entry);
      while (this.cache.size > this.maxCachedChunks)
        this.cache.delete(this.cache.keys().next().value);
      return entry;
    });
    return result;
  }
  close() {
    this.cache.clear();
    this.manifest = null;
  }
}
