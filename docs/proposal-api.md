# Reviewable AI proposals

AI tools can retain unrestricted voxel operations and optionally use a visible review step shared with the human designer. The Worker exposes:

- `proposal.prepare`: `expectedRevision`, optional `workspaceId`, local-coordinate `operations`. Returns proposal `id`, base revision, workspace and preview summary. Does not change scene revision or canonical blocks.
- `proposal.inspect`: optional `cursor` and `limit` (up to 20,000). Returns proposed per-cell operations, total count and next cursor. Deletion uses `state: null`.
- `proposal.commit`: `proposalId`, `expectedRevision`, optional `workspaceId`, `policy`. Requires the same proposal and underlying scene; adoption creates one scene undo step.
- `proposal.cancel`: `proposalId`. Discards the preview without changing scene revision.

```js
const scene = await CraftStudio.request({method: 'workspace.describe'});
const prepared = await CraftStudio.request({
  method: 'proposal.prepare',
  params: {
    expectedRevision: scene.revision,
    operations: [{type: 'set', pos: [12, 5, 8], state: {Name: 'create:andesite_casing'}}]
  }
});
// Inspect the scene in 3D, then adopt the proposal:
const adopted = await CraftStudio.request({
  method: 'proposal.commit',
  params: {proposalId: prepared.value.id, expectedRevision: prepared.revision, policy: {}}
});
```

Check each response's `ok` before using its value. Replacing a proposal changes its ID even if the underlying scene revision stays the same. A changed scene or world origin invalidates adoption. Existing terrain/building protections apply at acceptance; failures leave the canonical scene intact and the proposal available for adjustment or cancellation. Preparation uses the same free voxel and optional semantic generators as the existing AI UI. Proposal coordinates are local; ordinary free-edit transactions continue to support world coordinates.

The visible AI preview supports Enter to adopt, Escape to cancel and Ctrl+Z/the undo button to cancel before touching committed scene history. Text fields keep their native key behavior. Canonical writes through the regular edit/brush/commit APIs are rejected while an AI proposal is active; transaction staging remains separate. Outside that preview, external edits invalidate old direct-transform previews, and the Worker also checks the captured revision/workspace at transform submission.

Tests cover deletion semantics, typed NBT, atomic policy rejection, one-step undo including design metadata, replaced/stale proposal IDs, reference HTML import revisions, blocked brush writes and stale transforms. A fresh isolated browser verifies API-to-visible-preview, keyboard adoption/cancellation, scene undo and external edit invalidation. See [evidence](validation/proposal-api.json).

This capability does not include a new AI model provider, automatic aesthetic evaluation, backend-authoritative streaming edits or live Minecraft game validation. Those remain separate work.

中文：提案准备、检查、采用和取消已通过统一接口连接到 3D 预览。准备和取消不改变场景版本；采用保留真正的删除、类型化 NBT 与设计信息，并可一次撤销。场景版本或提案编号变化时，旧确认请求被拒绝。原有自由编辑接口仍可直接构建任意方块，提案审核是可选流程。
