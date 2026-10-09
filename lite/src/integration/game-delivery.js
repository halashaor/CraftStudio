// A checked delivery is a frozen handoff from the visible design to the game.
export class GameDelivery {
  constructor({ call, request, options, changed }) {
    Object.assign(this, { call, request, options, changed });
    this.prepared = null;
  }
  clear() {
    this.prepared = null;
    this.changed(null);
  }
  async head() {
    return this.call('api', { method: 'workspace.describe' });
  }
  async prepare() {
    this.clear();
    const options = structuredClone(this.options());
    if (!['additions', 'patch', 'full', 'selection'].includes(options.kind))
      throw Error('请选择施工范围');
    if (options.kind === 'selection' && !options.selection) throw Error('请先选择建筑、方块或区域');
    if (
      !Array.isArray(options.origin) ||
      options.origin.length !== 3 ||
      options.origin.some((n) => !Number.isSafeInteger(n))
    )
      throw Error('目标原点需要整数 XYZ 坐标');
    const source = await this.head();
    const packed = await this.call('bridgeProject', {
      kind: options.kind,
      selection: options.selection,
      workspaceId: source.workspaceId,
      expectedRevision: source.revision,
    });
    if (!packed.project.blocks.length) throw Error('当前施工范围没有方块或改动');
    const validation = await this.request('validate', { project: packed.project });
    if (!validation.ok) throw Error((validation.errors || ['方块兼容性检查未通过']).join('；'));
    const current = await this.head();
    if (
      current.workspaceId !== source.workspaceId ||
      current.revision !== source.revision ||
      JSON.stringify(options) !== JSON.stringify(this.options())
    )
      throw Error('设计或施工位置已变化，请重新准备');
    const origin = options.origin.map((value, axis) => value + packed.offsetLocal[axis]);
    this.prepared = {
      source: {
        workspaceId: source.workspaceId,
        revision: source.revision,
        name: source.value.name,
      },
      options,
      project: packed.project,
      origin,
      max: origin.map((value, axis) => value + packed.project.size[axis] - 1),
      blocks: packed.project.blocks.length,
      validation,
    };
    this.changed(this.prepared);
    return this.prepared;
  }
  async build() {
    const prepared = this.prepared;
    if (!prepared) throw Error('请先准备并检查施工内容');
    const head = await this.head();
    if (
      head.workspaceId !== prepared.source.workspaceId ||
      head.revision !== prepared.source.revision ||
      JSON.stringify(prepared.options) !== JSON.stringify(this.options())
    ) {
      this.clear();
      throw Error('设计、选区或目标已变化，请重新准备');
    }
    // Consume the checked payload once; a transport failure does not prove no blocks were placed.
    this.clear();
    return this.request('apply', {
      project: prepared.project,
      origin: prepared.origin,
      dimension: prepared.options.dimension,
      overwrite: prepared.options.overwrite,
    });
  }
}
