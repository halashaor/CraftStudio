// Library reads never swap the working document. The engine validates and displays a separate snapshot.
export class SavedVersionReview {
  constructor({ library, call, getSummary, beforeReview, refresh, render, opened }) {
    Object.assign(this, { library, call, getSummary, beforeReview, refresh, render, opened });
  }
  async preview(projectId, version) {
    this.beforeReview();
    const head = this.getSummary();
    const { item, entry } = await this.library.get(projectId, version);
    const bytes = entry.bytes.slice();
    const source = {
      projectId: item.id,
      version: entry.number,
      name: item.title,
      time: entry.time,
      note: entry.note || '',
    };
    this.beforeReview();
    const result = await this.call(
      'comparison',
      {
        operation: 'load',
        bytes,
        source,
        workspaceId: head.workspaceId,
        expectedRevision: head.revision,
      },
      [bytes.buffer],
    );
    this.refresh(result);
    await this.render();
    this.opened(source);
    return source;
  }
}
