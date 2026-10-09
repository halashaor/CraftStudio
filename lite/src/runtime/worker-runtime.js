const meshActions = new Set(['mesh', 'assetPreview', 'selectionPreview', 'prepareConstruction']);

export function responseTransfers(action, value) {
  const transfers = [];
  if (value instanceof Uint8Array) {
    transfers.push(value.buffer);
  } else if (meshActions.has(action) || action === 'meshChunks' || action === 'createScene') {
    const buckets = meshActions.has(action)
      ? value.buckets
      : action === 'meshChunks'
        ? value.chunks.flatMap((chunk) => chunk.buckets)
        : Object.values(value.definitions).flatMap((model) => model.buckets);

    if (action === 'assetPreview') {
      buckets.push(
        ...Object.values(value.motions?.definitions || {}).flatMap((model) => model.buckets),
      );
    }
    for (const bucket of buckets) {
      for (const array of [bucket.positions, bucket.normals, bucket.colors, bucket.uv]) {
        if (array) transfers.push(array.buffer);
      }
    }
  } else if (value?.bytes instanceof Uint8Array) {
    transfers.push(value.bytes.buffer);
  }
  if (action === 'selectionPreview' && ArrayBuffer.isView(value.members)) {
    transfers.push(value.members.buffer);
  }
  return transfers;
}

// One transport boundary owns ordering, timing and error replies.
// Domain handlers keep their own user-input and persistence validation.
export class WorkerRuntime {
  constructor({ execute, postMessage, clock = () => performance.now() }) {
    this.execute = execute;
    this.postMessage = postMessage;
    this.clock = clock;
    this.queue = Promise.resolve();
  }

  handle(message) {
    const received = message.trace ? this.clock() : null;
    this.queue = this.queue.then(() => this.respond(message, received));
    return this.queue;
  }

  async respond({ id, action, data }, received) {
    const started = received === null ? null : this.clock();
    try {
      const value = await this.execute(action, data || {});
      const timing =
        started === null
          ? null
          : {
              queueWaitMs: started - received,
              executeMs: this.clock() - started,
            };
      this.postMessage(
        { id, value, ...(timing ? { performance: timing } : {}) },
        responseTransfers(action, value),
      );
    } catch (error) {
      this.postMessage({ id, error: error.message });
    }
  }
}
