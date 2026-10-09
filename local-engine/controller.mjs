import { EngineWorkspace } from './workspace.mjs';
const canonical = new Set([
  'edit.apply',
  'edit.brush',
  'selection.transform',
  'objects.put',
  'collections.put',
  'collections.remove',
  'palettes.put',
  'palettes.remove',
  'workplanes.put',
  'workplanes.remove',
  'views.put',
  'views.remove',
  'measurements.put',
  'measurements.remove',
  'history.undo',
  'history.redo',
  'transaction.commit',
  'proposal.commit',
  'construction.commit',
]);
const resourceChanges = new Set(['resourceLibrary', 'resources', 'assets']);
const directChanges = new Set([
  'edit',
  'brush',
  'undo',
  'redo',
  'origin',
  'protect',
  'unprotect',
  'studio',
  'rename',
  'accept',
  'commitConstruction',
  'detachGeneration',
]);
export class EngineController {
  #engine;
  #tail = Promise.resolve();
  #closed = false;
  #sequence = null;
  #replacement = null;
  #cancelOnClose = false;
  constructor({
    store,
    key,
    factory = () => new EngineWorkspace(),
    beforeCommit = async () => {},
  }) {
    this.store = store;
    this.key = key;
    this.factory = factory;
    this.beforeCommit = beforeCommit;
  }
  static async open(options) {
    const c = new EngineController(options);
    c.#engine = c.factory();
    try {
      const packet = c.store.load(c.key, { lazySource: true });
      if (packet) {
        await c.#engine.call('engineRestore', packet);
        c.#sequence = packet.sequence;
      } else {
        await c.#engine.call('summary');
        await c.#save(c.#engine);
      }
      return c;
    } catch (error) {
      await c.#engine.close();
      throw error;
    }
  }
  get sequence() {
    return this.#sequence;
  }
  call(action, data = {}, { onTiming } = {}) {
    if (this.#closed) return Promise.reject(Error('Durable workspace is closed'));
    if (['engineCapture', 'engineRestore', 'engineMountSource'].includes(action))
      return Promise.reject(Error('Checkpoint commands are controller-internal'));
    let owned;
    try {
      owned = structuredClone(data);
    } catch (error) {
      return Promise.reject(error);
    }
    const observe = onTiming
      ? (stage) => {
          try {
            onTiming(stage);
          } catch {}
        }
      : undefined;
    const next = this.#tail.then(() => this.#run(action, owned, observe));
    this.#tail = next.catch(() => {});
    return next;
  }
  async #save(engine, onTiming, replacement) {
    let started = performance.now();
    const packet = await engine.call('engineCapture', { known: this.store.known() });
    onTiming?.({
      stage: 'capture',
      ms: performance.now() - started,
      blobs: packet.blobs.length,
      bytes: packet.blobs.reduce((n, b) => n + b.bytes.length, 0),
    });
    if (replacement?.cancelled) throw Error('Replacement cancelled');
    if (replacement) {
      const proceed = await Promise.race([
        Promise.resolve()
          .then(() => this.beforeCommit(packet))
          .then(() => true),
        replacement.signal.then(() => false),
      ]);
      if (!proceed || replacement.cancelled) throw Error('Replacement cancelled');
    } else await this.beforeCommit(packet);
    started = performance.now();
    const result = this.store.commit(this.key, packet, this.#sequence, {
      onTiming: onTiming
        ? (stage) => onTiming({ ...stage, stage: 'sqlite-' + stage.stage })
        : undefined,
    });
    this.#sequence = result.sequence;
    onTiming?.({ stage: 'sqlite', ms: performance.now() - started });
    if (this.store.path) {
      started = performance.now();
      await engine.call('engineMountSource', { database: this.store.path });
      onTiming?.({ stage: 'source-mount', ms: performance.now() - started });
    }
    return result;
  }
  async #recover() {
    const old = this.#engine;
    let next;
    try {
      next = this.factory();
      const packet = this.store.load(this.key, { lazySource: true });
      if (!packet) throw Error('Committed workspace is missing');
      await next.call('engineRestore', packet);
      this.#engine = next;
      this.#sequence = packet.sequence;
      await old.close();
    } catch (error) {
      this.#closed = true;
      await Promise.all([old.close(), next?.close()]);
      throw Error('Cannot recover committed workspace', { cause: error });
    }
  }
  async #replace(action, data, resource = false) {
    if (this.#cancelOnClose) throw Error('Replacement cancelled');
    const before = await this.#engine.call('api', { method: 'workspace.describe' });
    const pending = before.value.pending;
    if (
      pending.strokeActive ||
      before.value.previewActive ||
      (resource && (pending.transactionIds.length || pending.constructionId))
    )
      throw Error('Finish or cancel the pending operation before replacing scene/resources');
    const candidate = this.factory(),
      startingSequence = this.#sequence,
      replacement = { candidate, cancelled: false, committed: false };
    replacement.signal = new Promise((resolve) => (replacement.resolve = resolve));
    this.#replacement = replacement;
    let attempted = false;
    try {
      const committed = this.store.load(this.key, { lazySource: true });
      if (resource) await candidate.call('engineRestore', committed);
      else if (committed.head.archives.length) {
        const blobs = new Map(committed.blobs.map((b) => [b.id, b.bytes]));
        await candidate.call('resourceLibrary', {
          files: committed.head.archives.map((f) => ({
            name: f.name,
            bytes: new Uint8Array(blobs.get(f.id)).buffer,
          })),
        });
      }
      const result = await candidate.call(action, data);
      attempted = true;
      await this.#save(candidate, undefined, replacement);
      replacement.committed = true;
      const old = this.#engine;
      this.#engine = candidate;
      await old.close();
      return result;
    } catch (error) {
      await candidate.close();
      if (attempted) {
        let latest;
        try {
          latest = this.store.load(this.key, { lazySource: true });
        } catch (storageError) {
          this.#closed = true;
          await this.#engine.close();
          throw Error('Cannot inspect the committed workspace', { cause: storageError });
        }
        if (latest?.sequence !== startingSequence) await this.#recover();
      }
      throw error;
    } finally {
      if (this.#replacement === replacement) this.#replacement = null;
    }
  }
  async #run(action, data, onTiming) {
    if (action === 'storedBaselineChunks' && !Array.isArray(data.chunks))
      throw Error('Baseline chunk buckets required');
    if (['storedBaselineManifest', 'storedBaselineChunks'].includes(action))
      return this.store.baseline(
        this.key,
        action === 'storedBaselineManifest'
          ? { expectedSequence: data.expectedSequence }
          : { chunks: data.chunks, expectedSequence: data.expectedSequence },
      );
    if (this.#engine.closed) await this.#recover();
    if (resourceChanges.has(action)) return this.#replace(action, data, true);
    if (
      ['load', 'resume'].includes(action) ||
      (action === 'import' && !/\.html?$/i.test(data.name || ''))
    )
      return this.#replace(action, data);
    const inspectStart = performance.now(),
      before = await this.#engine.call('api', { method: 'workspace.describe' });
    onTiming?.({ stage: 'describe-before', ms: performance.now() - inspectStart });
    let result;
    const started = performance.now();
    try {
      result = await this.#engine.call(action, data);
    } catch (error) {
      if (action === 'api' || directChanges.has(action) || this.#engine.closed)
        await this.#recover();
      throw error;
    }
    onTiming?.({ stage: 'execute', ms: performance.now() - started });
    if (action === 'api' && !result.ok) return result;
    const inspectAfter = performance.now(),
      after = await this.#engine.call('api', { method: 'workspace.describe' });
    onTiming?.({ stage: 'describe-after', ms: performance.now() - inspectAfter });
    const dirty =
      before.revision !== after.revision ||
      before.workspaceId !== after.workspaceId ||
      directChanges.has(action) ||
      (action === 'api' && canonical.has(data.method)) ||
      (['package', 'compressed', 'draft'].includes(action) &&
        !!data.title &&
        (action === 'draft' || !data.preserveTitle));
    if (dirty)
      try {
        await this.#save(this.#engine, onTiming);
      } catch (error) {
        await this.#recover();
        throw Error('Edit was not acknowledged; restored the committed workspace', {
          cause: error,
        });
      }
    return result;
  }
  cancelReplacement() {
    const replacement = this.#replacement;
    if (!replacement || replacement.cancelled || replacement.committed) return false;
    replacement.cancelled = true;
    replacement.resolve();
    replacement.candidate.close().catch(() => {});
    return true;
  }
  async close({ cancelReplacements = false } = {}) {
    this.#closed = true;
    if (cancelReplacements) {
      this.#cancelOnClose = true;
      this.cancelReplacement();
    }
    await this.#tail;
    await this.#engine.close();
  }
}
