// Validate the editable workspace again after asynchronous storage reads and staged parsing.
export class SavedProjectLoader {
  constructor({ library, call }) {
    Object.assign(this, { library, call });
  }
  async open(id, { version, copy = false } = {}) {
    const head = await this.call('api', { method: 'workspace.describe' });
    const validateSwap = async () => {
      const current = await this.call('api', { method: 'workspace.describe' });
      if (current.workspaceId !== head.workspaceId || current.revision !== head.revision)
        throw Error('当前设计在读取期间又有改动，已保留当前设计；请重新打开');
    };
    const data = await this.library.get(id, version);
    const draft = version || copy ? null : await this.library.resume('draft:' + id);
    await validateSwap();
    let summary;
    if (draft) summary = await this.call('resume', draft, [], { validateSwap });
    else {
      const bytes = data.entry.bytes.slice();
      summary = await this.call(
        'import',
        { name: 'stored.craftlite', bytes: bytes.buffer },
        [bytes.buffer],
        { validateSwap },
      );
    }
    return { data, draft, summary };
  }
}
