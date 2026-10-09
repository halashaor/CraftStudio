export class ProposalReviewUI {
  constructor({ $, getSummary, request, policy, task, notice }) {
    Object.assign(this, { $, getSummary, request, policy, task, notice });
    $('accept').onclick = () => task(() => this.finish('proposal.commit'), '采用提案…');
    $('cancel').onclick = () => task(() => this.finish('proposal.cancel'), '返回当前设计…');
  }
  update(summary) {
    this.$('preview-banner').hidden = !summary.preview;
    const changes = summary.proposal?.changes;
    this.$('preview-info').textContent = changes
      ? `本次提案：新增 ${changes.add.toLocaleString()} · 替换 ${changes.replace.toLocaleString()} · 拆除 ${changes.remove.toLocaleString()} · 涉及地形/水 ${changes.terrain.toLocaleString()}`
      : `预览方案总计：新增 ${summary.add.toLocaleString()} · 替换 ${summary.replace.toLocaleString()} · 拆除 ${summary.remove.toLocaleString()} · 地形/水改动 ${(summary.earth + summary.water).toLocaleString()}`;
  }
  async finish(method) {
    const source = this.getSummary();
    if (!source.proposal) throw Error('当前没有待审阅的提案');
    const result = await this.request({
      method,
      params: {
        workspaceId: source.workspaceId,
        expectedRevision: source.revision,
        proposalId: source.proposal.id,
        ...(method === 'proposal.commit' ? { policy: this.policy() } : {}),
      },
    });
    if (!result.ok) throw Error(result.error.message);
    this.notice(method === 'proposal.commit' ? '方案已采用，可一次撤销。' : '已返回当前设计。');
  }
}
