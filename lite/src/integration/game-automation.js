import { selectionPredicate } from '../selection/selection-mask.js';
export class GameAutomation {
  constructor({ delivery, describe, connection, target, configure, request, report, importFile }) {
    Object.assign(this, { delivery, describe, connection, target, configure, report, importFile });
    this.bridge = request;
  }
  async status() {
    const head = await this.describe(),
      state = this.connection();
    return {
      workspaceId: head.workspaceId,
      revision: head.revision,
      connectionId: state.connectionId,
      session: structuredClone(state.session),
      jobId: state.jobId,
      target: this.target(),
      prepared: this.delivery.review(),
    };
  }
  async request(input = { action: 'status' }) {
    const action = input.action;
    if (action === 'status') return this.status();
    const state = this.connection();
    if (!state.session?.connected) throw Error('请先在游戏面板连接 Java 游戏');
    if (input.connectionId !== state.connectionId)
      throw Error('GAME_CONNECTION_CHANGED: 游戏连接已变化');
    const controls = state.controls;
    if (!['prepare', 'build', 'read', 'job', 'cancel', 'undo'].includes(action))
      throw Error('未知游戏操作');
    const capability = action === 'prepare' ? 'validate' : action;
    if (!controls[capability]) throw Error('当前游戏连接不允许此操作，请检查权限或正在进行的任务');
    if (['prepare', 'build', 'read', 'undo'].includes(action)) {
      const head = await this.describe();
      if (
        !input.workspaceId ||
        !Number.isSafeInteger(input.expectedRevision) ||
        head.workspaceId !== input.workspaceId ||
        head.revision !== input.expectedRevision
      )
        throw Error('GAME_SOURCE_CHANGED: 当前工程或版本已变化，请重新读取状态');
    }
    if (this.connection().connectionId !== input.connectionId)
      throw Error('GAME_CONNECTION_CHANGED: 游戏连接已变化');
    if (action === 'prepare') {
      this.configure(input.target);
      await this.delivery.prepare();
      return this.delivery.review();
    }
    if (action === 'build') {
      if (typeof input.preparedId !== 'string') throw Error('建造需要准备编号 preparedId');
      const result = await this.delivery.build(input.preparedId);
      this.report(result);
      return result;
    }
    if (action === 'read') {
      this.configure(input.target);
      const target = this.target();
      const result = await this.bridge('read', {
        origin: target.origin,
        dimension: target.dimension,
        size: target.size,
      });
      return this.importFile({
        name: 'game-region.json',
        bytes: new TextEncoder().encode(JSON.stringify(result.project)),
        workspaceId: input.workspaceId,
        expectedRevision: input.expectedRevision,
      });
    }
    if (action === 'undo') this.delivery.clear();
    if (['job', 'cancel'].includes(action) && input.jobId !== state.jobId)
      throw Error('游戏任务编号已变化，请重新读取状态');
    const result = await this.bridge(action, action === 'undo' ? {} : { id: input.jobId });
    this.report(result);
    return result;
  }
}

export function gameTarget(input = {}, current, dimensions) {
  const target = { ...current, ...input };
  for (const [name, positive] of [
    ['origin', false],
    ['size', true],
  ])
    if (
      !Array.isArray(target[name]) ||
      target[name].length !== 3 ||
      target[name].some((value) => !Number.isSafeInteger(value) || (positive && value < 1))
    )
      throw Error('游戏区域需要有效的整数 origin/size XYZ');
  if (
    !['additions', 'patch', 'selection', 'full'].includes(target.kind) ||
    !dimensions.includes(target.dimension) ||
    typeof target.overwrite !== 'boolean'
  )
    throw Error('请选择有效的施工范围、游戏维度和覆盖方式');
  if (input.selection !== undefined) {
    if (target.kind !== 'selection') throw Error('selection 仅用于选区施工范围');
    selectionPredicate(input.selection);
  }
  return target;
}
