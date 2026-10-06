# Autosave from immutable checkpoint references

The full local service advertises `checkpoint-draft/1`. Local autosave first synchronizes the current checkpoint, then asks the Worker for resource attachments tagged with the same revision/workspace. It captures immutable references to the stored chunk contents, rather than recompressing and posting the whole edit overlay from the Worker on every autosave.

`draftCheckpoint` checks the source revision and digest in the same SQLite transaction as saving the draft. Chunk content is stored by digest in `designer_draft_blobs`; per-session references are indexed in `designer_draft_refs`. Unchanged content is reused. Collection removes unreferenced content while retaining every active/named-project draft. The live workspace can continue changing without mutating a previously saved draft. Resource attachment bytes are reused after a successful save unless their content key changes.

`resume` materializes chunk references into the existing compressed draft format and returns the original baseline and resource attachments. Library backup also materializes portable sessions; internal SQL references are not exported. Both local and Lite restore an imported active draft only when none already exists, and never overwrite an existing active draft. Before UI backup import, the current edited design is checkpointed. Older compressed drafts and standalone Lite storage remain supported.

Pending autosave work is shared through one promise. Import/switch operations wait for it instead of returning immediately and racing the save. Scene/version changes during preparation are retried without falsely disabling storage. Formal preservation before import uses the existing backend project exporter when available.

Validation:

- SQLite tests cover immutable saved content after live edits, chunk deduplication/collection across project drafts, atomic stale capture including attachment rollback, portable backup restore, preservation of existing active drafts, missing-content recovery and surrogate text fidelity.
- Lite IndexedDB tests verify portable active draft restoration and non-overwrite behavior.
- A fresh browser imported 204,800 edited blocks, autosaved, changed a cell, synchronized the live checkpoint, verified the older saved draft remained frozen, then autosaved and reloaded the latest state. Typed long NBT, guides and resource attachments survived.
- A delayed autosave request verified that importing another scene waits, preserves the old design and does not attach the new scene to the old project.

In the synthetic scene, the first draft-confirmation request was 789 bytes (including its small generated resource bundle) and the later request was 298 bytes. These figures **exclude preceding checkpoint synchronization, initial baseline transfer, and larger real resource packs**. They do not measure end-to-end cursor latency. See [evidence](validation/checkpoint-autosave.json).

Remaining work: initial full data loading, backend editing authority and viewport-only working sets. Metadata headers, immutable blob copying/checksums, export buffers, and resume/backup materialization still have costs; this does not claim constant-memory streaming throughout the application.

中文：本地自动保存复用已同步的区块检查点，以不可变内容引用保留草稿；相同区块与资源附件复用，后续编辑不修改旧草稿。恢复与工程库备份逐区块组装为兼容便携格式，旧草稿和纯文件 Lite 保留。导入会等待正在进行的保存，并先保留当前设计；备份恢复不会覆盖已有当前草稿。
