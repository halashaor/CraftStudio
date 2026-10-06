# Local engine host prototype

This is the first executable step toward local backend-owned editing. It runs the **existing** `lite/src/worker.js` in an isolated Node worker instead of reimplementing geometry, import/export or DesignAPI. One persistent `EngineWorkspace` owns one scene. Calls reuse the existing action/data protocol and structured-clone transfer boundary; binary meshes and NBT keep their typed arrays. A small adapter provides `self.postMessage`, Node Web Crypto and the message receiver. There is no per-command thread spawn.

Use Node 22+ with `npm install` already completed in `lite`. `EngineWorkspace.call(action, data, transfers)` returns a result or rejects a worker/transport failure; `close()` rejects pending calls and terminates the worker. Separate workspaces are isolated; the shared engine serializes requests and enforces its existing revision/transaction/idempotence rules. This is not an HTTP service, launcher feature or new public UI mode yet.

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

Current limitations: each Node workspace still holds the full canonical scene in RAM. Python SQLite storage remains a checkpoint/export system; no browser has switched to this host. Durable history, transport, packaging/runtime discovery, authority handoff and voxel working sets remain unimplemented. A prototype passing tests is not the completed architecture.

The official [Node worker-thread documentation](https://nodejs.org/api/worker_threads.html) describes CPU work and binary buffer transfer. The choice here isolates the existing CPU engine and its scene while sharing operation semantics; storage/network I/O belongs in the future controller.

中文：这是可执行的本地引擎宿主原型，复用现有 Worker 与自由设计接口，不另写一套规则。真实区域、原版/Create 资源、精确方块/实体标签、事务、撤销与重读已验证；尚未连接 Python 服务、SQLite 提交或前端，也未移除浏览器完整场景。迁移必须逐步通过持久化、传输、生命周期和工作集验收。
