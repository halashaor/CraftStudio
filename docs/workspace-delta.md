# Synchronize changed checkpoint chunks

The local service advertises `workspace-delta/1`. After an initial complete checkpoint, the Worker compares its immutable chunk roots with the last transmitted roots. A matching client base receives only changed chunks, with empty chunk lists explicitly clearing obsolete overlay records. Metadata-only changes retain a complete header and send no voxel chunks. Lite's portable file flow is unchanged.

`workspaceCheckpoint` accepts the existing complete snapshot or a chunk packet:

```json
{
  "workspaceId": "workspace-id",
  "baseKey": "immutable-base-id",
  "revision": 12,
  "mode": "chunks",
  "baseRevision": 11,
  "snapshot": {"size": [48, 16, 48], "origin": [0, 64, 0], "palette": []},
  "chunks": [{"key": "1,0,1", "blocks": []}]
}
```

The example clears one overlay chunk; a real header must include every baseline/retained state in the palette and the design metadata to preserve. Chunk records use state objects and typed NBT, matching the portable overlay format.

SQLite validates chunk membership, duplicates, bounds, states, immutable baseline identity, expected stored revision and delta base revision before changing rows. Bounds or palette shrink also validates retained records when necessary. The surrounding transaction writes the changed chunk payloads, removals and header together. A deterministic header/chunk digest permits replay and complete-vs-chunk equivalence; legacy snapshot digests replay without rewriting original records and upgrade on a later checkpoint.

The page negotiates service capability. Missing/mismatched base versions or lost cached checkpoints trigger a complete snapshot retry with baseline revalidation. Different content at the same revision and stale revisions remain rejected. The current-chunk cache invalidates only affected chunks unless palette or extent changes require clearing it.

Measured outgoing requests on a synthetic 204,800-edit browser scene:

| Update | Records sent | Request bytes |
|---|---:|---:|
| Initial checkpoint | 204,800 | 12,006,846 |
| One edited cell | 2,048 in one chunk | 116,781 |
| Undo that cell | 2,048 in one chunk | 116,753 |
| Save a named workplane | 0 | 672 |

This measures request payload size, not round-trip latency or frame rate. Portable export/reopen and cache-loss recovery were also verified. See [evidence](validation/workspace-delta.json).

Worker remains the canonical editing authority. Initial indexing and checkpoints still require complete data; metadata headers and compressed exports are buffered; autosave formats and backend-authoritative/viewport-only editing remain separate work. Derived SQLite checkpoints do not replace portable project/version backups.

中文：首次检查点后，只同步变化区块，撤销以空列表明确清除增量区块，纯元数据变化不重发方块。版本不匹配或缓存丢失时，页面通过完整快照和基线复核恢复；相同版本的不同内容或过期版本仍拒绝写入。此功能降低本地同步传输量，不等于完成后端编辑权威或完整流式加载。
