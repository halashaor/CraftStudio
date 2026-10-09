// File selection, parsing and scene replacement share one path in both editions.
import { prepareRegionFiles, regionBounds } from '../minecraft/region-set.js';
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
    if ((!name && !input.files) || !workspaceId || !Number.isSafeInteger(expectedRevision))
      throw Error('导入需要文件名、workspaceId 和 expectedRevision');
    if (input.files) {
      if (!Array.isArray(input.files) || !input.files.length || !region)
        throw Error('多个 MCA 文件需要 files 列表和 region.min/max XYZ 范围');
      const files = input.files.map((file) => this.fileInput(file));
      const result = await this.openFiles(files, {
        guard: { workspaceId, expectedRevision },
        region,
        name: name || '存档场地',
      });
      return this.receipt(result);
    }
    if (/\.html?$/i.test(name)) throw Error('此接口用于打开场地和工程文件；参考 HTML 请从界面导入');
    if (/\.mca$/i.test(name) && !region)
      throw Error('读取区域文件需要明确的 region.min/max XYZ 范围');
    if (region) regionBounds(region);
    const file = this.fileInput(input);
    const result = await this.open(file, { guard: { workspaceId, expectedRevision }, region });
    return this.receipt(result);
  }
  fileInput(input) {
    if (!input.name) throw Error('导入文件需要名称');
    let bytes = input.bytes;
    if (typeof input.dataBase64 === 'string')
      bytes = Uint8Array.from(atob(input.dataBase64), (character) => character.charCodeAt(0));
    if (!(bytes instanceof ArrayBuffer) && !(bytes instanceof Uint8Array))
      throw Error('导入需要 bytes 字节数据或 dataBase64');
    return new File([bytes], input.name);
  }
  receipt(result) {
    return {
      workspaceId: result.workspaceId,
      revision: result.revision,
      name: result.name,
      sourceBlocks: result.sourceBlocks,
      size: result.size,
    };
  }
  async openFiles(files, { guard, region, name = '存档场地' } = {}) {
    files = Array.from(files);
    if (!files.length) return;
    if (files.length === 1 && !/\.mca$/i.test(files[0].name))
      return this.open(files[0], { guard, region });
    if (files.some((file) => !/\.mca$/i.test(file.name)))
      throw Error('一次选择多个文件时请只选择同一维度的 MCA；其他蓝图请分别打开或合并');
    await this.validate(guard);
    const bounds = regionBounds(region || this.region());
    const file = await prepareRegionFiles(files, bounds, name);
    return this.open(file, { guard, displayName: 'MCA 场地选区' });
  }
  async open(file, { guard, region, displayName } = {}) {
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
    this.notice('已读取 ' + (displayName || file.name) + '，原始场地作为固定基准。');
    return result;
  }
}
