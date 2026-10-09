// One resource workflow for the library panel and connected automation.
export class ResourceController {
  constructor({ library, describe, refresh, clearTextures, markDirty, render, changed }) {
    Object.assign(this, { library, describe, refresh, clearTextures, markDirty, render, changed });
  }
  async updated(summary) {
    this.refresh(summary);
    this.clearTextures();
    this.markDirty();
    this.changed();
    await this.render();
    return summary;
  }
  async add(files, guard) {
    return this.updated(await this.library.add(files, guard));
  }
  async save(entries, guard) {
    return this.updated(await this.library.save(entries, guard));
  }
  async snapshot() {
    const head = await this.describe();
    return {
      workspaceId: head.workspaceId,
      revision: head.revision,
      entries: this.library.entries.map(({ bytes, ...entry }) => entry),
      precedence: 'last-enabled-wins',
    };
  }
  async request(input = { action: 'list' }) {
    if (input.action === 'list') return this.snapshot();
    const guard = { workspaceId: input.workspaceId, expectedRevision: input.expectedRevision };
    if (!guard.workspaceId || !Number.isSafeInteger(guard.expectedRevision))
      throw Error('资源修改需要 workspaceId 和 expectedRevision');
    const head = await this.describe();
    if (head.workspaceId !== guard.workspaceId || head.revision !== guard.expectedRevision)
      throw Error('RESOURCE_CONFLICT: 工作台已变化，请重新读取资源列表');
    if (input.action === 'add') {
      if (!Array.isArray(input.files) || !input.files.length) throw Error('请选择资源文件');
      const files = input.files.map((file) => {
        if (typeof file.name !== 'string' || !/\.(jar|zip)$/i.test(file.name))
          throw Error('资源文件需要 JAR 或 ZIP 文件名');
        const bytes =
          typeof file.dataBase64 === 'string'
            ? Uint8Array.from(atob(file.dataBase64), (c) => c.charCodeAt(0))
            : file.bytes;
        if (!(bytes instanceof Uint8Array) && !(bytes instanceof ArrayBuffer))
          throw Error('资源文件需要 bytes 或 dataBase64');
        return { name: file.name, bytes };
      });
      await this.add(files, guard);
    } else if (input.action === 'configure') {
      await this.save(this.configured(input), guard);
    } else throw Error('资源操作需要 list、add 或 configure');
    return this.snapshot();
  }
  configured({ order, enabled = {}, remove = [] }) {
    const known = new Set(this.library.entries.map((entry) => entry.id));
    for (const id of [...Object.keys(enabled), ...remove, ...(order || [])])
      if (!known.has(id)) throw Error('未知资源 ID：' + id);
    if (Object.values(enabled).some((value) => typeof value !== 'boolean'))
      throw Error('enabled 值需要 true 或 false');
    let entries = this.library.entries
      .filter((entry) => !remove.includes(entry.id))
      .map((entry) => (entry.id in enabled ? { ...entry, enabled: enabled[entry.id] } : entry));
    if (order) {
      const byId = new Map(entries.map((entry) => [entry.id, entry]));
      if (
        order.length !== entries.length ||
        new Set(order).size !== entries.length ||
        order.some((id) => !byId.has(id))
      )
        throw Error('order 需要恰好列出保留的每个资源 ID');
      entries = order.map((id) => byId.get(id));
    }
    return entries;
  }
}
