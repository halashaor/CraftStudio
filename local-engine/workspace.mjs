import { Worker } from 'node:worker_threads';
export class EngineWorkspace {
  constructor({ onProgress = () => {} } = {}) {
    this.sequence = 0;
    this.pending = new Map();
    this.closed = false;
    this.onProgress = onProgress;
    this.worker = new Worker(new URL('./worker.mjs', import.meta.url));
    this.worker.on('message', (message) => {
      if (message.progress) {
        this.onProgress(message.progress);
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      message.error ? pending.reject(Error(message.error)) : pending.resolve(message.value);
    });
    this.worker.on('error', (error) => this.fail(error));
    this.worker.on('exit', (code) => {
      if (!this.closed) this.fail(Error('Local engine exited (' + code + ')'));
    });
  }
  fail(error) {
    this.closed = true;
    for (const p of this.pending.values()) p.reject(error);
    this.pending.clear();
  }
  call(action, data = {}, transfers = []) {
    if (this.closed) return Promise.reject(Error('Local engine workspace is closed'));
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      this.pending.set(id, { resolve, reject });
      try {
        this.worker.postMessage({ id, action, data }, transfers);
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }
  async close() {
    this.fail(Error('Local engine workspace closed'));
    await this.worker.terminate();
  }
}
