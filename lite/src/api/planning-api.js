import { requestReceipt, rememberReceipt } from './request-receipts.js';

const methods = new Set([
  'proposal.prepare',
  'proposal.inspect',
  'proposal.commit',
  'proposal.cancel',
  'construction.prepare',
  'construction.commit',
  'construction.cancel',
  'design.inspect',
  'view.isolate',
]);
const previewWrites = new Set([
  'views.put',
  'views.remove',
  'measurements.put',
  'measurements.remove',
  'edit.brush',
  'edit.apply',
  'transaction.commit',
  'selection.transform',
  'prefabs.put',
  'prefabs.remove',
  'prefabs.place',
  'history.undo',
  'history.redo',
  'objects.put',
  'objects.rename',
  'selectionSets.put',
  'selectionSets.remove',
  'collections.put',
  'collections.remove',
  'palettes.put',
  'palettes.remove',
  'workplanes.put',
  'workplanes.remove',
]);
const readMethods = new Set(['proposal.inspect', 'design.inspect']);
function reject(code, message) {
  throw Object.assign(Error(message), { code });
}

// Planning and ordinary edits share one request namespace and receipt cache.
export class PlanningAPI {
  constructor({ api, execute, summary, proposal, operations, preview }) {
    Object.assign(this, { api, execute, summary, proposal, operations, preview });
  }
  get methods() {
    return [...methods];
  }
  async request(request) {
    try {
      const receipt = requestReceipt(request, this.api.receipts);
      if (receipt.replay) return receipt.replay;
      const method = request.method,
        params = request.params || {};
      if (!methods.has(method)) {
        if (this.preview() && previewWrites.has(method))
          reject('PREVIEW_ACTIVE', '请先采用或取消预览');
        return this.api.execute(request, receipt);
      }
      const value = method.startsWith('proposal.')
        ? await this.proposalRequest(method, params)
        : await this.constructionRequest(method, params);
      const result = {
        schema: 'craftstudio-design/1',
        id: request.id ?? null,
        ok: true,
        workspaceId: this.api.workspaceId,
        revision: this.api.revision,
        value,
      };
      if (!readMethods.has(method)) rememberReceipt(this.api.receipts, receipt, result);
      return result;
    } catch (error) {
      const method = typeof request?.method === 'string' ? request.method : '';
      return {
        schema: 'craftstudio-design/1',
        id: request?.id ?? null,
        ok: false,
        workspaceId: this.api.workspaceId,
        revision: this.api.revision,
        error: {
          code:
            error.code ||
            (method.startsWith('proposal.')
              ? 'PROPOSAL_REJECTED'
              : methods.has(method)
                ? 'CONSTRUCTION_REJECTED'
                : 'EDIT_REJECTED'),
          message: error.message,
          details: error.details || {},
        },
      };
    }
  }
  async proposalRequest(method, params) {
    if (method === 'proposal.prepare') {
      this.api.guard(params);
      if (params.space && params.space !== 'local')
        throw Error('提案使用局部坐标；世界坐标可通过自由编辑事务转换');
      await this.execute('preview', {
        operations: this.api.operations(this.api.getSite(), params),
      });
      return { ...this.proposal(), summary: this.summary() };
    }
    if (method === 'proposal.inspect') {
      if (params.expectedRevision !== undefined || params.workspaceId)
        this.api.guard({
          ...params,
          expectedRevision: params.expectedRevision ?? this.api.revision,
        });
      const current = this.proposal();
      if (!current) {
        if (params.proposalId || (typeof params.cursor === 'string' && params.cursor.includes('@')))
          reject('PROPOSAL_CHANGED', '提案已结束，请重新读取');
        throw Error('没有待检查的提案');
      }
      let start = params.cursor === undefined ? 0 : Number(params.cursor);
      if (typeof params.cursor === 'string' && params.cursor.includes('@')) {
        const [id, offset, extra] = params.cursor.split('@');
        if (id !== current.id) reject('PROPOSAL_CHANGED', '提案已被替换，请重新读取');
        start = extra === undefined && offset !== '' ? Number(offset) : NaN;
      }
      if (params.proposalId && params.proposalId !== current.id)
        reject('PROPOSAL_CHANGED', '提案已被替换，请重新读取');
      const limit = Math.min(20000, params.limit ?? 1000);
      if (!Number.isSafeInteger(start) || start < 0 || !Number.isInteger(limit) || limit < 1)
        throw Error('提案分页参数无效');
      const operations = this.operations();
      return {
        ...current,
        summary: this.summary(),
        operations: operations.slice(start, start + limit),
        nextCursor: start + limit < operations.length ? current.id + '@' + (start + limit) : null,
        total: operations.length,
      };
    }
    if (!params.proposalId || params.proposalId !== this.proposal()?.id)
      reject('PROPOSAL_CHANGED', '提案已被替换或结束，请重新读取');
    if (method === 'proposal.commit') this.api.guard(params);
    return this.execute(method === 'proposal.commit' ? 'accept' : 'cancel', params);
  }
  async constructionRequest(method, params) {
    if (params.expectedRevision !== undefined || params.workspaceId)
      this.api.guard({ ...params, expectedRevision: params.expectedRevision ?? this.api.revision });
    const actions = {
      'construction.prepare': 'prepareConstruction',
      'construction.commit': 'commitConstruction',
      'construction.cancel': 'cancelConstruction',
      'design.inspect': 'designInspect',
      'view.isolate': 'viewIsolation',
    };
    const value = await this.execute(actions[method], params);
    if (method === 'construction.prepare' && !params.includeMesh) {
      delete value.buckets;
      delete value.removedBuckets;
      delete value.textures;
    }
    return value;
  }
}
