import { mcaCoordinates } from '../minecraft/codec.js';

// File choice precedes region settings; this stays in the existing File panel.
export class RegionImportUI {
  constructor({ $, importer, describe, task, showSettings }) {
    Object.assign(this, { $, importer, describe, task, showSettings });
    this.files = null;
    this.guard = null;
    $('mca-read').onclick = () => task(() => this.read(), '读取所选真实场地范围…');
    $('mca-clear').onclick = () => this.clear();
  }
  async read() {
    const files = this.files;
    if (!files || !this.guard) throw Error('请先选择 MCA 区域文件');
    this.$('mca-report').hidden = false;
    this.$('mca-report').textContent = '正在读取所选范围…';
    try {
      const result = await this.importer.openFiles(files, { guard: this.guard });
      if (this.files === files) this.clear();
      return result;
    } catch (error) {
      if (error.message.startsWith('IMPORT_CONFLICT:'))
        error.message = '当前设计有新修改，请重新选择文件后读取。';
      if (this.files === files) this.$('mca-report').textContent = error.message;
      throw error;
    }
  }
  async stage(files) {
    const selected = Array.from(files),
      coordinates = selected.map((file) => mcaCoordinates(file.name));
    const keys = coordinates.map((value) => value.join(','));
    if (new Set(keys).size !== keys.length) throw Error('重复的 MCA 区域；请选择同一维度的文件');
    this.files = selected;
    this.guard = null;
    this.$('mca-report').hidden = true;
    this.$('mca-read').disabled = true;
    const head = await this.describe();
    if (this.files !== selected) return;
    this.guard = { workspaceId: head.workspaceId, expectedRevision: head.revision };
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const [x, z] of coordinates) {
      minX = Math.min(minX, x * 512);
      maxX = Math.max(maxX, x * 512 + 511);
      minZ = Math.min(minZ, z * 512);
      maxZ = Math.max(maxZ, z * 512 + 511);
    }
    this.$('mca-selected').textContent =
      `已选 ${selected.length} 个区域文件 · 文件覆盖 X ${minX}～${maxX}，Z ${minZ}～${maxZ}。请确认世界 XYZ 范围后读取。`;
    this.$('mca-selected').title = selected.map((file) => file.name).join('\n');
    this.$('mca-options').open = true;
    this.$('mca-read').disabled = false;
    this.showSettings();
    this.$('mca-options').scrollIntoView({ block: 'nearest' });
  }
  clear() {
    this.files = null;
    this.guard = null;
    this.$('mca-read').disabled = true;
    this.$('mca-selected').textContent =
      '先选择同一维度的一个或多个 MCA 文件，再设置世界坐标范围。';
    this.$('mca-selected').title = '';
    this.$('mca-report').hidden = true;
    this.$('mca-report').textContent = '';
  }
}
