import { datapackArchive } from './datapack-export.js';
import { Site } from '../core/site.js';
import { strToU8 } from 'fflate';
import { changeCSV, csvRows, safeStem } from './delivery-package.js';

export class ProjectExporter {
  constructor({ library, call, baselineRequest, context, selection, refresh }) {
    Object.assign(this, { library, call, baselineRequest, context, selection, refresh });
  }
  capture(title) {
    const current = this.context();
    if (!current.summary) throw Error('工作台还在准备，请稍后导出');
    return {
      title: title || current.title || current.summary.name,
      guard: {
        workspaceId: current.summary.workspaceId,
        expectedRevision: current.summary.revision,
      },
    };
  }
  async checkpoint(format, title, guard = {}) {
    const result = await this.baselineRequest({
      method: 'scene.exportStoredProject',
      params: { format, title, ...guard },
    });
    if (!result.ok) throw Error(result.error.message);
    return result.value;
  }
  async projectBytes(title, context = {}) {
    const { preserveTitle = false, ...guard } = context;
    await this.library.open();
    return this.library.desktop?.capabilities?.includes('checkpoint-export/1')
      ? (await this.checkpoint('craftlite', title, guard)).bytes
      : this.call('compressed', { title, preserveTitle, ...guard });
  }
  async compatibilityJSON(title, guard = {}) {
    const pkg = await this.call('package', { title, ...guard });
    const project = Site.unpack(pkg.site).project();
    return JSON.stringify(project);
  }
  async blueprint(kind, selection, guard = {}, { includeEntities = false } = {}) {
    if (includeEntities && !['selection', 'full'].includes(kind))
      throw Error('局部实体仅支持选区范围；完整场景始终保留全部实体');
    if (kind === 'selection') {
      selection ||= this.selection();
      if (!selection) throw Error('请先选择要导出的建筑、方块或区域');
    }
    if (kind !== 'full') return this.call('export', { kind, selection, includeEntities, ...guard });
    const { summary } = this.context(),
      origin = [...summary.origin],
      size = [...summary.size],
      known = summary.originConfirmed;
    const value = this.library.desktop?.capabilities?.includes('checkpoint-export/1')
      ? await this.checkpoint('nbt', undefined, guard)
      : await this.call('export', { kind, ...guard });
    return {
      bytes: value.bytes || value,
      offsetLocal: [0, 0, 0],
      offsetWorld: known ? origin : null,
      size,
      entities: summary.entities,
      entitySelection: 'all',
    };
  }
  async delivery({
    kind = 'additions',
    title,
    selection,
    includeProject = false,
    includeEntities = false,
  } = {}) {
    const snapshot = this.capture(title);
    if (kind === 'selection') selection = structuredClone(selection || this.selection());
    const blueprint = await this.blueprint(kind, selection, snapshot.guard, { includeEntities });
    const report = await this.call('deliveryReport', { kind, selection, ...snapshot.guard });
    const projectBytes = includeProject
      ? await this.projectBytes(snapshot.title, { ...snapshot.guard, preserveTitle: true })
      : null;
    const bytes = await this.call('deliveryArchive', {
      title: snapshot.title,
      kind,
      blueprint,
      report,
      projectBytes,
      ...snapshot.guard,
    });
    return {
      bytes,
      filename: safeStem(snapshot.title) + '.' + kind + '.zip',
      entities: blueprint.entities,
      entityWarnings: blueprint.entityWarnings,
    };
  }
  async datapack({
    kind = 'additions',
    title,
    selection,
    target = '1.21.1',
    placement = 'relative',
  } = {}) {
    const snapshot = this.capture(title);
    const blueprint = await this.blueprint(kind, selection, snapshot.guard);
    const result = datapackArchive({ blueprint, title: snapshot.title, kind, target, placement });
    return { ...result, filename: safeStem(snapshot.title) + '.' + kind + '.datapack.zip' };
  }
  async changeTable() {
    const { summary } = this.context();
    return changeCSV(await this.call('diff'), summary);
  }
  async terrainTable() {
    const map = await this.call('heightmap');
    return csvRows([map.columns, ...map.rows]);
  }
  async export({
    format = 'nbt',
    kind = 'full',
    title,
    selection,
    includeProject = false,
    includeEntities = false,
    preserveTitle = false,
    target,
    placement,
  } = {}) {
    if (format === 'datapack') {
      if (includeEntities) throw Error('数据包仅导出方块和方块实体；场景实体请使用 NBT 交付');
      return (await this.datapack({ kind, title, selection, target, placement })).bytes;
    }
    const snapshot = this.capture(title);
    if (format === 'delivery')
      return (await this.delivery({ kind, title, selection, includeProject, includeEntities }))
        .bytes;
    if (format === 'craftlite') {
      const bytes = await this.projectBytes(snapshot.title, { ...snapshot.guard, preserveTitle });
      this.refresh(await this.call('summary'));
      return bytes;
    }
    if (format === 'json')
      return strToU8(
        await this.compatibilityJSON(snapshot.title, { ...snapshot.guard, preserveTitle }),
      );
    if (format === 'schem') return this.call('sponge', snapshot.guard);
    if (format === 'nbt' && ['full', 'additions', 'patch', 'selection'].includes(kind)) {
      const value = await this.blueprint(kind, selection, snapshot.guard, { includeEntities });
      return kind === 'full' ? value.bytes : value;
    }
    throw Error('不支持的导出格式或范围');
  }
}
