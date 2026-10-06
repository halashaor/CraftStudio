# Local checkpoint export

The full local service advertises `checkpoint-export/1`. The existing project save/download and full NBT download use this capability; standalone Lite and older local services retain Worker file export. Additions, patches and Sponge exports keep their existing paths.

```js
const result = await CraftStudio.request({
  method: 'scene.exportStoredProject',
  params: { format: 'craftlite', expectedRevision: 12 }
});
// result.value.bytes: Uint8Array; result.value.stats: chunk traversal counts
```

Supported formats: `craftlite` and `nbt`. Optional `workspaceId` and `expectedRevision` reject switched or stale scenes. Active previews must be adopted or cancelled first. Optional `title` labels the portable project without modifying the stored checkpoint. Exports pin a SQLite read transaction to the synchronized checkpoint revision.

Portable projects preserve the original baseline, edit delta, design metadata, protected regions and the resolved resource bundle. NBT exports merge current blocks, preserve typed block/entity NBT and unknown native root tags, and reproduce compatible placement masks. NBT does not carry the editable sketch history; retain the portable project for further design.

The exporter traverses 16³ chunks rather than assembling a complete voxel map. NBT uses a counting pass followed by a writing pass because NBT lists declare their length. This is bounded voxel assembly, **not constant-memory end-to-end streaming**: compressed output, metadata and resources remain buffered, first indexing and checkpoint upload still use complete data, and the Worker remains the canonical editing authority. Incremental authority, viewport-only editing and backend generation remain pending.

Verification: database tests cover baseline/delta preservation, deletions, new extents, typed long NBT, mask-only chunks, entities, unknown root tags and stale revisions. A fresh browser against an isolated local database exported and reimported both formats, preserving guides and custom block properties with no page errors. See [evidence](validation/checkpoint-export.json).

本地版保存、下载便携工程和完整 NBT 已接入数据库检查点导出；纯文件 Lite 保留原有导出路径。导出逐区块组装，原始场地、编辑增量、草图、保护区及资源保留在便携工程内，NBT 保留方块状态和类型化数据。当前仍缓存压缩输出，Worker 仍持有完整场景；完整流式编辑尚未完成。
