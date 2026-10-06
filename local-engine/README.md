# Local engine host prototype

This is the first executable step toward local backend-owned editing. It runs the **existing** `lite/src/worker.js` in an isolated Node worker instead of reimplementing geometry, import/export or DesignAPI. One persistent `EngineWorkspace` owns one scene. Calls reuse the existing action/data protocol and structured-clone transfer boundary; binary meshes and NBT keep their typed arrays. A small adapter provides `self.postMessage`, Node Web Crypto and the message receiver. There is no per-command thread spawn.

Use Node 22.13+ (or 24+) with `npm install` already completed in `lite`. `EngineWorkspace.call(action, data, transfers)` returns a result or rejects a worker/transport failure; `close()` rejects pending calls and terminates the worker. Separate workspaces are isolated; the shared engine serializes requests and enforces its existing revision/transaction/idempotence rules. This is not an HTTP service, launcher feature or new public UI mode yet.

Tests run with the ordinary Lite suite. An explicit private-fixture verifier is available:

```sh
node local-engine/verify.mjs --nbt=/path/region.nbt --vanilla=/path/client.jar --create=/path/create.jar --report=/path/report.json
```

The optional resource inputs remain local. It edits only an in-memory verification workspace and writes only the explicitly requested aggregate report; it rejects a report that resolves to an input. It verifies a free unknown-state edit, replay, typed geometry, portable reopen, NBT export, exact source states/block-entity tags/entity tags and undo. Do not publish worlds/JARs/assets/raw coordinates.

Validation used the provided 520,227-block region and two source archives. The shared Node engine preserved every source block state, 716 typed block-entity records and 169 entity records through export; portable reopen and unknown-state/undo checks passed. This is functional evidence, not a Node-vs-browser performance or memory claim. See [aggregate evidence](../docs/validation/local-engine.json).

## Migration gates

1. Define the durable authority/controller: pinned workspace/base/revision, atomic SQLite commit and history ownership, staged imports, crash recovery and resource lifetimes. A mirror checkpoint must not be advertised as canonical editing.
2. Add authenticated transport with binary preservation, bounded/concurrent workspace lifecycle, cancellation, resource reuse and clear capability negotiation. Keep the service disabled until commit/recovery is proven.
3. Adapt the existing staged WorkerSession boundary to choose the local host when supported. Preserve free human/AI APIs, previews, protection, undo, metadata and Create source data. Old/Lite clients retain the browser engine.
4. Replace the browser's full voxel scene with explicit viewport/edit working sets. Unknown/unloaded cells must remain distinct from air; pins and halo reads must support edits/meshing across chunk boundaries.
5. Verify the real import → terrain/sketch → free edits/AI → Create preview → undo → save/reopen → NBT/blueprint chain with resources in local and Lite, crash/conflict cases and actual live-game validation.

Current limitations: each Node workspace still holds the full canonical scene in RAM. Python SQLite storage remains a checkpoint/export system; no browser has switched to this host. Manual durable checkpoint/history restore is now implemented below; the per-edit controller, transport, packaging/runtime discovery, authority handoff and voxel working sets remain unimplemented. A prototype passing tests is not the completed architecture.

The official [Node worker-thread documentation](https://nodejs.org/api/worker_threads.html) describes CPU work and binary buffer transfer. The choice here isolates the existing CPU engine and its scene while sharing operation semantics; storage/network I/O belongs in the future controller.

中文：这是可执行的本地引擎宿主原型，复用现有 Worker 与自由设计接口，不另写一套规则。真实区域、原版/Create 资源、精确方块/实体标签、事务、撤销与重读已验证；尚未连接 Python 服务、SQLite 提交或前端，也未移除浏览器完整场景。迁移必须逐步通过持久化、传输、生命周期和工作集验收。

## Immutable checkpoints and SQLite data layer

`engineCapture` and `engineRestore` are gated by the Node host adapter; they are unavailable to the ordinary browser engine. Capture compresses the immutable baseline separately, hashes overlay chunk roots and records current/undo/redo root references plus frame metadata. Reused roots are not re-encoded; passing known blob IDs omits bytes already stored. Capturing clears write ownership so a captured root cannot later mutate in place. Resource archives and used-model assets are separate blobs; new material/resource use can add an asset blob. Checkpoints preserve workspace/revision and accepted API receipts. In-progress transactions, proposals, isolation and pointer-stroke state are not resumed; confirmed state/history is restored.

`EngineStore` uses separate `designer_engine_*` SQLite tables. Commit uses BEGIN IMMEDIATE, an expected storage sequence, same-workspace revision monotonicity, incoming SHA-256 verification, complete reference checks and one atomic head update. Exact committed-head replay is idempotent. Header and referenced payload hashes are checked when loading. Existing blobs are treated as immutable; commits check existing-reference presence without rereading every baseline/archive. No garbage collection or production controller is enabled yet.

The verifier accepts optional `--database=/path/independent.sqlite` for explicit manual commit/close/reopen/restore and undo/redo validation. Database/report outputs must not alias an input or one another. Use an independent validation database, not the running app database. The real supplied region/resource run retained all source states and typed tags after SQLite and worker restart; undo then restart retained redo, with zero newly emitted blobs after that undo. Storage conflict/missing-reference rollback and corruption detection also passed. See [checkpoint evidence](../docs/validation/engine-checkpoint.json).

These are data-layer commits, not proof that every returned edit is already durable. The next controller must persist before acknowledging a canonical edit, handle commit failure by restoring the committed state, stage imports/resources, negotiate leases and reject stale writers. The current UI still owns a browser Worker scene; Python service/launcher/capabilities are unchanged.

Node's SQLite API was introduced in 22.5 and became available without its experimental flag in 22.13; its runtime status varies by release. This prototype uses only DatabaseSync, prepared statements and explicit SQLite transactions. The current bundled runtime and CI target are verified separately.

中文补充：已实现不可变基线、区块根引用、撤销/重做与请求回执的手动检查点，以及 SQLite 原子写入/重启恢复。原始场地不随小编辑重发，资源单独保存；未确认的临时事务/提案/隔离不恢复。每次编辑先落盘再确认的控制器、HTTP 和前端切换仍未接入。
