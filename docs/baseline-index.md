# Share immutable baseline indexing

Original point lookup and per-chunk iteration now reference the same chunk maps, instead of keeping a full global Map plus another indexed Map entry for every original voxel. The existing map-shaped lookup interface remains available; baseline data is shared across candidate forks, while edited overlays and undo snapshots remain isolated. Original records and portable formats are unchanged.

Chunk keys are derived from the fixed 4096-coordinate encoding, including coordinates that require 36-bit point keys. Tests cover the maximum coordinate on each axis, mixed chunk axes, full iteration, shared record identity, fork edits and undo without changing the original baseline.

One local Node sample on the supplied 520,227-block file, after parsing the project and with explicit GC:

| Measurement | Previous index | Shared index |
|---|---:|---:|
| Constructor/index time | 213.377 ms | 102.075 ms |
| Retained heap increment | 30,886,704 bytes | 16,228,448 bytes |
| Five complete point-lookup passes | 162.597 ms | 170.866 ms |
| Lookup checksum | 78,724,065 | 78,724,065 |

This is a single-process local sample of constructor/index retention and point lookup. The parsed source was already resident. It is not total browser memory, source decompression time, GPU memory or frame rate. Lookup timing did not improve in this sample, so the change is justified by lower retained indexing memory and construction cost, not a claim that every stage became faster.

Real-file regression: 167 tests passed with zero skipped, including original terrain/entities, reference consistency, NBT roundtrip and Create model/assembly data. A fresh isolated browser imported the supplied original NBT, checked exact sample cells and the baseline manifest, then exported through the SQLite backend. Every exported block state/NBT record, entity and native extra was compared against the original, with no page errors. Only aggregate evidence is published; source files and extracted resources remain private. See [evidence](validation/baseline-index.json).

Read-only environment inspection found no running Minecraft Java process/bridge listener at validation time; a bridge JAR exists in the target instance. Live game placement therefore remains unverified. This update does not launch or modify the game/world.

The designer still loads the complete canonical baseline into the Worker. Streaming import, viewport-only editable working sets and backend editing authority remain required future work.

中文：原始方块的点查询与区块索引共用记录，减少重复 Map 索引；候选方案仍共享不可变基线，编辑增量独立。真实区域和完整后端导出已逐格验证。测量只覆盖 Node 索引阶段，查询耗时未宣称改善；完整按视口加载和游戏内放置仍未完成。
