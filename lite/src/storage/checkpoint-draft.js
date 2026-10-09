export class DraftConflict extends Error {}

export class CheckpointDraftWriter {
  constructor({ library, call, baselineRequest, context }) {
    Object.assign(this, { library, call, baselineRequest, context });
    this.assetKey = null;
  }

  async attachments(head, saveForm, cachedAssetKey) {
    try {
      return await this.call('draftAttachments', {
        expectedRevision: head.revision,
        workspaceId: head.workspaceId,
        cachedAssetKey,
        saveForm,
      });
    } catch (error) {
      throw new DraftConflict(error.message);
    }
  }

  async write({ projectId, workspaceId, title, saveForm }) {
    const result = await this.baselineRequest({
      method: 'scene.chunkSnapshot',
      params: { workspaceId },
    });
    if (!result.ok) throw new DraftConflict(result.error.message);
    const head = result.value;
    let cachedAssetKey = this.assetKey;
    // A missing cached attachment gets one complete resend, using the same revision.
    for (let attempt = 0; attempt < 2; attempt++) {
      const attachment = await this.attachments(head, saveForm, cachedAssetKey);
      const current = this.context();
      if (
        (current.active?.id || null) !== projectId ||
        current.summary?.workspaceId !== head.workspaceId
      )
        throw new DraftConflict('工程已切换，等待当前工程草稿同步');
      const data = {
        workspaceId: head.workspaceId,
        revision: head.revision,
        digest: head.digest,
        ...attachment,
        title,
      };
      try {
        await this.library.draftCheckpoint(data, projectId);
      } catch (error) {
        if (!attempt && error.message.includes('资源附件不存在') && !attachment.assetBytes) {
          cachedAssetKey = undefined;
          continue;
        }
        if (attempt || error.message.includes('草稿检查点已变化'))
          throw new DraftConflict(error.message);
        throw error;
      }
      this.assetKey = attachment.assetKey;
      return;
    }
  }
}
