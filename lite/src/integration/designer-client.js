import { encodeWire } from '../runtime/engine-wire.js';
import { encodeLocal, detectDesktop } from '../storage/desktop-library.js';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class DesignerClient {
  constructor({ info, page, context, blocked, status, fetcher = globalThis.fetch }) {
    Object.assign(this, { info, page, context, blocked, status, fetcher });
    this.fetcher = (...args) => fetcher(...args);
    this.enabled = false;
    this.runId = 0;
    this.sessionId = null;
    this.heartbeatTimer = null;
    this.pollAbort = null;
    this.workspaceId = null;
    this.serial = 0;
  }
  metadata() {
    const summary = this.context();
    return {
      serial: this.serial,
      title: summary?.name || '工作台',
      workspaceId: summary?.workspaceId,
      revision: summary?.revision,
      sourceBlocks: summary?.sourceBlocks,
      changes: summary?.changes,
    };
  }
  async post(action, body, { signal, keepalive = false } = {}) {
    const response = await this.fetcher(
      (this.info.baseUrl || '') + '/api/desktop/designer/' + action,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CraftStudio-Token': this.info.token },
        body: JSON.stringify(body),
        signal,
        keepalive,
      },
    );
    const result = await response.json();
    if (!response.ok) throw Error(result.error || '工作台连接失败');
    return result;
  }
  update(summary) {
    this.serial++;
    const changed = this.workspaceId !== summary.workspaceId;
    this.workspaceId = summary.workspaceId;
    if (changed && this.enabled && this.sessionId)
      this.heartbeat().catch((error) => this.status(error.message));
  }
  async heartbeat() {
    if (this.enabled && this.sessionId)
      await this.post('heartbeat', { sessionId: this.sessionId, metadata: this.metadata() });
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    const run = ++this.runId;
    clearInterval(this.heartbeatTimer);
    this.pollAbort?.abort();
    if (!enabled) {
      if (this.sessionId)
        this.post('close', { sessionId: this.sessionId }, { keepalive: true }).catch((error) =>
          this.status(error.message),
        );
      this.status('未连接');
      return;
    }
    this.sessionId = null;
    this.heartbeatTimer = setInterval(
      () => this.heartbeat().catch((error) => this.status('连接中断：' + error.message)),
      15000,
    );
    this.loop(run);
  }
  async perform(job) {
    const describing = job.operation === 'request' && job.request.method === 'workspace.describe';
    if (this.blocked() && !describing)
      throw Error('DESIGNER_BUSY: 工作台正在提交操作，请稍后读取状态');
    const head = await this.page.request(
      describing ? job.request : { method: 'workspace.describe' },
    );
    if (describing) return head;
    const workspaceId = head.workspaceId,
      revision = head.revision;
    if (job.operation !== 'request' || job.request.method !== 'workspace.describe') {
      if (workspaceId !== job.workspaceId) throw Error('WORKSPACE_CHANGED: 任务派发后工程已切换');
    }
    if (job.operation === 'request') return this.page.request(job.request);
    if (job.operation === 'save') return this.page.save();
    if (job.operation === 'capture') {
      if (job.options.view) this.page.setView(job.options.view);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return this.page.captureView();
    }
    if (job.operation === 'export') {
      const exported = await this.page.export({ ...job.options, preserveTitle: true });
      const after = await this.page.request({ method: 'workspace.describe' });
      if (workspaceId !== after.workspaceId || revision !== after.revision)
        throw Error('导出期间工程已变化，请重新导出');
      return { exported, source: head.value };
    }
    throw Error('Unknown designer operation');
  }
  async reply(pending, run, outcome) {
    const receipt = await this.post('reply', pending);
    if (this.enabled && this.runId === run) {
      const error = receipt.error || pending.error;
      this.status(error ? '已连接 · 任务未完成：' + error.message : outcome);
    }
  }
  async loop(run) {
    let pending = null,
      outcome = '已连接';
    while (this.enabled && this.runId === run) {
      try {
        if (!this.sessionId) {
          this.status('正在连接当前 3D 工程…');
          const registration = await this.post('register', { metadata: this.metadata() });
          if (!this.enabled || this.runId !== run) {
            await this.post('close', { sessionId: registration.sessionId });
            return;
          }
          this.sessionId = registration.sessionId;
          await this.heartbeat();
          this.status('已连接当前 3D 工程');
        }
        if (pending) {
          await this.reply(pending, run, outcome);
          pending = null;
          continue;
        }
        this.pollAbort = new AbortController();
        const sessionId = this.sessionId;
        const { job } = await this.post('poll', { sessionId }, { signal: this.pollAbort.signal });
        if (!job) continue;
        const label = job.operation === 'request' ? job.request.method : job.operation;
        this.status('AI 正在执行：' + label);
        outcome = '已连接 · 最近完成 ' + label;
        try {
          if (!this.enabled || this.runId !== run) throw Error('连接已关闭，任务未开始');
          const value = await this.perform(job);
          if (value?.ok === false) outcome = '已连接 · 请求未采用：' + value.error.message;
          pending = {
            sessionId,
            jobId: job.jobId,
            wire: encodeLocal(encodeWire(value, { version: 1 })).$bytes,
          };
        } catch (error) {
          pending = { sessionId, jobId: job.jobId, error: { message: error.message } };
        }
        // Finish the receipt even when the user disconnected after execution started.
        await this.reply(pending, run, outcome);
        pending = null;
      } catch (error) {
        if (!this.enabled || this.runId !== run) return;
        this.status('连接中断，正在重连：' + error.message);
        if (/令牌无效|连接已失效|连接已关闭/.test(error.message)) {
          this.sessionId = null;
          pending = null;
          this.info = (await detectDesktop()) || this.info;
        }
        await delay(1000);
      }
    }
  }
}
