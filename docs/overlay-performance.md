# Local edits without copying all edited voxels

The designer's in-memory edit overlay now uses chunked copy-on-write storage. Each edit creates a new map identity, shares untouched chunks and copies touched 16³ chunks. Undo snapshots and forked AI/design candidates retain their previous block records. The renderer's existing map-identity invalidation still works; no in-place mutation is used to hide edits from consumers.

Source indexing and overlay indexing remain distinct. Forks also share untouched index chunks until either branch updates them. Addition/removal/replacement, original ground/water changes and material counts update from the changed keys, rather than scanning the full overlay whenever a summary is requested. Public portable project and NBT formats are unchanged.

This removes repeated full-overlay cloning and full statistics scans from small edit batches. It does **not** make the browser a constant-memory streaming editor: canonical scene data remains in the Worker, chunk roots still need copying, metadata/resources may need other processing, and full exports or selections may still traverse large data sets. SQLite authority and viewport-only editable working sets remain pending.

Benchmark: a synthetic scene with 204,800 existing edited blocks, followed by 40 one-cell batches in one brush stroke. Two local samples reduced the editing-data phase from about 726–851 ms to about 5–6 ms. One hundred summary reads changed from about 330–339 ms to about 0.1 ms. The second run consumed a checksum of returned counts. This is a local Node microbenchmark, not an end-to-end cursor latency, frame-rate, network or file-import measurement. See [measured samples and browser evidence](validation/overlay-performance.json).

Verification includes independent full-scan comparison through randomized edits, original restoration, fork isolation, undo/redo, failed atomic batches and portable reopen; copy-on-write branch/deletion/clear checks; component, brush, proposal, geometry and codec regression tests. A fresh browser imported 204,800 edited voxels, applied a brush edit, read pinned SQLite chunks, exported and reopened a portable project, and undid the edit with no page errors. The existing component test continues to compare every voxel record, rather than the storage object's mutable ownership bookkeeping.

中文：小批量编辑只复制改动区块，未改动数据由当前设计、撤销记录和候选方案共享；统计按变化方块更新。约 20 万编辑方块的浏览器往返流程已验证，便携工程格式不变。上述提速只代表编辑数据阶段，完整分块加载和后端编辑权威仍待推进。
