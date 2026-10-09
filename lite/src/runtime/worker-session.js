const readMethods = new Set([
  'workspace.describe',
  'scene.readRegion',
  'scene.getBlocks',
  'terrain.readColumns',
  'materials.search',
  'views.list',
  'generation.links',
  'objects.list',
  'workplanes.list',
  'workplanes.atCurve',
  'measurements.list',
  'design.inspect',
]);
const writes = new Set([
  'rename',
  'preview',
  'platform',
  'reference',
  'cancel',
  'prepareConstruction',
  'edit',
  'brush',
  'beginStroke',
  'studio',
  'origin',
  'protect',
  'unprotect',
  'accept',
  'commitConstruction',
  'detachGeneration',
  'resources',
  'resourceLibrary',
]);
export class WorkerSession {
  constructor(
    factory,
    {
      resources = () => [],
      status = () => {},
      beforeSwap = async () => {},
      timings = () => false,
      onTiming = () => {},
    } = {},
  ) {
    this.factory = factory;
    this.resources = resources;
    this.status = status;
    this.beforeSwap = beforeSwap;
    this.timings = timings;
    this.onTiming = onTiming;
    this.sequence = 0;
    this.staging = null;
    this.active = this.slot();
  }
  slot() {
    const worker = this.factory(),
      pending = new Map(),
      slot = { worker, pending };
    worker.onmessage = (e) => {
      if (e.data.progress) {
        if (this.staging?.slot === slot) this.status(e.data.progress);
        return;
      }
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.performance) this.onTiming(p.action, e.data.performance);
      e.data.error ? p.reject(Error(e.data.error)) : p.resolve(e.data.value);
    };
    worker.onerror = (e) => {
      for (const p of pending.values()) p.reject(Error(e.message || '文件解析 Worker 失败'));
      pending.clear();
    };
    return slot;
  }
  send(slot, action, data, transfers = []) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      slot.pending.set(id, { resolve, reject, action });
      slot.worker.postMessage(
        { id, action, data, ...(this.timings() ? { trace: true } : {}) },
        transfers,
      );
    });
  }
  dispose(slot, message = '工作场景已切换') {
    slot.worker.terminate();
    for (const p of slot.pending.values()) p.reject(Error(message));
    slot.pending.clear();
  }
  call(action, data = {}, transfers = [], options = {}) {
    if (
      action === 'resume' ||
      action === 'load' ||
      (action === 'import' && !/\.html?$/i.test(data.name || ''))
    )
      return this.replace(action, data, transfers, options);
    if (
      this.staging &&
      (writes.has(action) || (action === 'api' && !readMethods.has(data.method)))
    ) {
      if (action === 'api')
        return Promise.resolve({
          schema: 'craftstudio-design/1',
          id: data.id ?? null,
          ok: false,
          error: { code: 'IMPORT_ACTIVE', message: '正在打开新场景，请完成或取消后继续编辑' },
        });
      return Promise.reject(Error('正在打开新场景，请完成或取消后继续编辑'));
    }
    return this.send(this.active, action, data, transfers);
  }
  async replace(action, data, transfers, { validateSwap = async () => {} } = {}) {
    if (this.staging) throw Error('已有文件正在打开');
    const slot = this.slot(),
      stage = { slot, cancelled: false };
    this.staging = stage;
    this.status('正在准备资源');
    try {
      const files = this.resources();
      if (files.length) await this.send(slot, 'resourceLibrary', { files });
      if (stage.cancelled) throw Error('已取消打开文件，原设计保留');
      this.status('正在解析文件与建立索引');
      const result = await this.send(slot, action, data, transfers);
      if (stage.cancelled) throw Error('已取消打开文件，原设计保留');
      this.status('正在保留当前设计');
      await this.beforeSwap(slot, validateSwap);
      await validateSwap();
      if (stage.cancelled) throw Error('已取消打开文件，原设计保留');
      const old = this.active;
      this.active = slot;
      this.staging = null;
      this.status(null);
      this.dispose(old);
      return result;
    } catch (e) {
      if (this.staging === stage) this.staging = null;
      this.dispose(slot);
      this.status(null);
      throw e;
    }
  }
  cancel() {
    if (!this.staging) return false;
    this.staging.cancelled = true;
    this.dispose(this.staging.slot, '已取消打开文件，原设计保留');
    return true;
  }
  get loading() {
    return !!this.staging;
  }
}
