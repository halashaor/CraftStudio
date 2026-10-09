// File selection, parsing and scene replacement share one path in both editions.
export class ProjectImporter {
  constructor({ checkpoint, call, remote, region, imported, reference, notice }) {
    Object.assign(this, { checkpoint, call, remote, region, imported, reference, notice });
  }
  async open(file) {
    if (!file) return;
    await this.checkpoint();
    const remote = this.remote();
    const bytes = remote ? null : await file.arrayBuffer();
    const data = { name: file.name, ...(remote ? { file } : { bytes }) };
    if (/\.mca$/i.test(file.name)) Object.assign(data, this.region());
    const result = await this.call('import', data, bytes ? [bytes] : []);
    if (/\.html?$/i.test(file.name)) await this.reference(result);
    else await this.imported(result);
    this.notice('已读取 ' + file.name + '，原始场地作为固定基准。');
    return result;
  }
}
