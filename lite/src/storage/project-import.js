// File selection, parsing and scene replacement share one path in both editions.
export class ProjectImporter {
  constructor({ checkpoint, call, remote, region, imported, reference, notice, describe }) {
    Object.assign(this, {
      checkpoint,
      call,
      remote,
      region,
      imported,
      reference,
      notice,
      describe,
    });
  }
  async validate(guard) {
    if (!guard) return;
    const head = await this.describe();
    if (head.workspaceId !== guard.workspaceId || head.revision !== guard.expectedRevision)
      throw Error('IMPORT_CONFLICT: 工程或版本已变化，请重新读取工作台后导入');
  }
  async openInput(input) {
    const { name, workspaceId, expectedRevision, region } = input;
    if (!name || !workspaceId || !Number.isSafeInteger(expectedRevision))
      throw Error('导入需要文件名、workspaceId 和 expectedRevision');
    if (/\.html?$/i.test(name)) throw Error('此接口用于打开场地和工程文件；参考 HTML 请从界面导入');
    if (/\.mca$/i.test(name) && !region)
      throw Error('读取区域文件需要明确的 region.min/max XYZ 范围');
    if (
      region &&
      (!Array.isArray(region.min) ||
        !Array.isArray(region.max) ||
        region.min.length !== 3 ||
        region.max.length !== 3 ||
        [...region.min, ...region.max].some((value) => !Number.isSafeInteger(value)) ||
        region.min.some((value, axis) => value > region.max[axis]))
    )
      throw Error('区域需要有效的整数 min/max XYZ 坐标');
    let bytes = input.bytes;
    if (typeof input.dataBase64 === 'string')
      bytes = Uint8Array.from(atob(input.dataBase64), (character) => character.charCodeAt(0));
    if (!(bytes instanceof ArrayBuffer) && !(bytes instanceof Uint8Array))
      throw Error('导入需要 bytes 字节数据或 dataBase64');
    const file = new File([bytes], name);
    const result = await this.open(file, { guard: { workspaceId, expectedRevision }, region });
    return {
      workspaceId: result.workspaceId,
      revision: result.revision,
      name: result.name,
      sourceBlocks: result.sourceBlocks,
      size: result.size,
    };
  }
  async open(file, { guard, region } = {}) {
    if (!file) return;
    await this.validate(guard);
    await this.checkpoint();
    const remote = this.remote();
    const bytes = remote ? null : await file.arrayBuffer();
    const data = { name: file.name, ...(remote ? { file } : { bytes }) };
    if (/\.mca$/i.test(file.name)) Object.assign(data, region || this.region());
    await this.validate(guard);
    const result = await this.call('import', data, bytes ? [bytes] : [], {
      validateSwap: () => this.validate(guard),
    });
    if (/\.html?$/i.test(file.name)) await this.reference(result);
    else await this.imported(result);
    this.notice('已读取 ' + file.name + '，原始场地作为固定基准。');
    return result;
  }
}
