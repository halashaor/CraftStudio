const storedMethods = new Set([
  'scene.baselineManifest',
  'scene.readBaselineChunks',
  'scene.chunkSnapshot',
  'scene.readStoredChunks',
  'scene.exportStoredProject',
]);
const sceneChanges = new Set([
  'view.isolate',
  'construction.commit',
  'proposal.commit',
  'views.put',
  'views.remove',
  'measurements.put',
  'measurements.remove',
  'edit.apply',
  'edit.brush',
  'transaction.commit',
  'selection.transform',
  'objects.put',
  'objects.rename',
  'prefabs.put',
  'prefabs.remove',
  'prefabs.place',
  'collections.put',
  'collections.remove',
  'palettes.put',
  'palettes.remove',
  'workplanes.put',
  'workplanes.remove',
  'history.undo',
  'history.redo',
]);
const previewChanges = new Set(['proposal.prepare', 'proposal.cancel']);
const storedCapabilities = [
  ['baseline-chunks/1', ['scene.baselineManifest', 'scene.readBaselineChunks']],
  ['workspace-chunks/1', ['scene.chunkSnapshot', 'scene.readStoredChunks']],
  ['checkpoint-export/1', ['scene.exportStoredProject']],
];

// Adapt shared engine requests to the visible page; the engine owns scene validation.
export class PageRequests {
  constructor({
    call,
    baselineRequest,
    cancelOperations,
    capabilities,
    refresh,
    markDirty,
    render,
  }) {
    Object.assign(this, {
      call,
      baselineRequest,
      cancelOperations,
      capabilities,
      refresh,
      markDirty,
      render,
    });
  }
  async request(request) {
    const method = request?.method;
    if (method === 'proposal.prepare') this.cancelOperations();
    if (storedMethods.has(method)) return this.baselineRequest(request);
    const result = await this.call('api', request);
    if (!result.ok) return result;
    const changesScene =
      sceneChanges.has(method) &&
      (!request.params?.transactionId || method === 'transaction.commit');
    if (changesScene || previewChanges.has(method)) {
      this.refresh(await this.call('summary'));
      if (changesScene) this.markDirty();
      if (!['prefabs.put', 'prefabs.remove', 'objects.rename'].includes(method))
        await this.render();
    }
    if (method === 'workspace.describe') {
      const capabilities = this.capabilities();
      for (const [capability, methods] of storedCapabilities) {
        if (capabilities.includes(capability)) result.value.methods.push(...methods);
      }
    }
    return result;
  }
}
