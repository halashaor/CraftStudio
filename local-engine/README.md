# Local engine prototype

Developer API for running the shared `lite/src/worker.js` engine in isolated Node workers. The application can select this backend through the optional Python gateway when explicitly enabled.

Requires Node 22.13+ and the dependencies installed in `lite` with `npm install`.

```js
import {EngineWorkspace} from './workspace.mjs';
const workspace = new EngineWorkspace();
try {
  const result = await workspace.call('api', {method: 'workspace.describe'});
  console.log(result);
} finally {
  await workspace.close();
}
```

`call(action, data, transfers)` uses the existing Worker protocol and preserves typed arrays. Each workspace is isolated and serializes its requests. `close()` rejects pending requests and terminates the worker.

## Checkpoint storage

Node-only `engineCapture` returns an immutable baseline, overlay/history references, metadata, resources and accepted API receipts. Supply `{known: store.known()}` to omit already stored blob bytes. `engineRestore` restores a packet from storage, including undo/redo. Unconfirmed transactions, proposals, isolation and active pointer strokes are cleared.

`EngineStore(path)` provides `commit(key, packet, expectedSequence)`, `load(key)`, `known()` and `close()`. Commit checks hashes, references and version conditions inside a SQLite transaction. Exact head replay is idempotent; loading checks payload integrity. Use an independent database: this store is not connected to the running application's database.

## Tests and explicit file verification

```sh
cd lite
npm test
```

From the repository root, optionally verify files you supply:

```sh
node local-engine/verify.mjs --nbt=/path/region.nbt --vanilla=/path/client.jar --create=/path/create.jar --database=/path/test.sqlite --report=/path/report.json
```

Resource, database and report arguments are optional. Inputs remain local; outputs must not alias an input or each other. Keep reports, test databases and game assets out of version control.

## Current limits

A worker still holds the full scene in RAM. Direct EngineWorkspace calls require manual checkpoints. EngineController wraps calls with persist-before-acknowledgement; it is used by the optional application gateway. HTTP transport, runtime packaging and UI handoff are not enabled. This module does not change Lite or the current local designer's storage behavior.

中文：本模块为开发者使用的本地引擎原型，提供独立工作线程、检查点与手动 SQLite 保存/恢复。尚未接入当前界面或 Python 服务；文件、资源和验证结果仅在本机使用。

## Durable controller API

```js
import {EngineStore} from './store.mjs';
import {EngineController} from './controller.mjs';
const store = new EngineStore('/path/independent.sqlite');
const controller = await EngineController.open({store, key: 'project-id'});
try {
  const description = await controller.call('api', {method: 'workspace.describe'});
  // Use the same Worker actions and guarded DesignAPI requests.
} finally {
  await controller.close();
  store.close();
}
```

Calls are serialized. Canonical edits are acknowledged after their checkpoint transaction succeeds; queued reads wait. Storage failure restores the committed checkpoint or fails closed if recovery is impossible. An uncertain acknowledgement after COMMIT is recovered from storage; retrying a still-cached request ID retains the shared engine's bounded idempotence semantics.

Imports and resource changes run in a candidate workspace and swap only after storage succeeds. Invalid imports keep the live scene and uncommitted transactions. Pending strokes/proposals block replacement; pending transactions/construction also block resource replacement. A successful scene import ends old transient operations. `engineCapture`/`engineRestore` cannot bypass the controller. `close()` stops accepting requests and drains already accepted calls. `close({cancelReplacements:true})` also cancels unconfirmed replacement work; confirmed canonical writes still drain. `cancelReplacement()` cancels only the active uncommitted import/resource candidate and keeps the live scene available.

`sequence` is the storage checkpoint sequence. Independent controllers retain their own in-memory snapshots; SQLite version checks prevent overwriting another committed writer. This is not a collaborative owner/lease service or automatic cross-client refresh.

Explicit file verification is available:

```sh
node local-engine/verify-controller.mjs --nbt=/path/region.nbt --database=/path/test.sqlite --vanilla=/path/client.jar --create=/path/create.jar --report=/path/report.json
```

Inputs and reports remain local. The separate HTTP service and browser adapter are available below, but runtime discovery and opt-in application selection are available; large-file streaming and browser working-set eviction remain incomplete. The default Python configuration retains the existing browser designer path.

中文补充：EngineController 串行处理请求，编辑检查点提交后才确认；失败恢复最后落盘状态。新文件和资源先在候选宿主处理，保存成功才替换；关闭会处理完已接受请求。它尚未接入界面或 HTTP 服务，不提供多客户端租约和自动刷新。

## Authenticated transport and browser adapter

`createEngineService({database, token, port, allowedOrigins})` from `service.mjs` starts a loopback-only HTTP service. Alternatively supply an existing EngineStore as `store`. A private token of at least 16 characters is required. The returned object provides `url` and async `close()`. The service validates Host, Origin and `X-CraftStudio-Token`; tokens are not returned by discovery.

POST `/rpc` uses `encodeWire`/`decodeWire` from `lite/src/engine-wire.js` with `application/x-craftstudio-engine`. Version 2 uses a CSENGW2 frame: an eight-byte magic, a little-endian metadata length, gzip JSON metadata and raw binary payloads. Typed mesh/file bytes are not Base64 encoded or recompressed. Buffer slices, undefined, large integers and special numeric values remain lossless; object keys cannot collide with binary markers. The decoder accepts version 1 and the service replies in the request version for legacy clients. Raw framing trades compression ratio for less local serialization work.

- `{operation:'open', key?}` returns a lease and storage key. Leases for the same key share one controller.
- `{operation:'call', lease, id, action, data, ack?}` invokes the shared Worker action. IDs are positive integers. Retrying an unacknowledged ID requires the identical encoded envelope and reuses its result. `ack` retires completed replies; retired IDs cannot execute again.
- `{operation:'close', lease, cancelReplacements?}` releases the lease. The last lease drains and closes its controller; SQLite state remains available to reopening the key.

`RemoteEngineWorker({url, token, key?, fetcher?})` from `lite/src/remote-worker.js` exposes the Worker-like `postMessage`, `onmessage` and `terminate` boundary used by WorkerSession. Requests are sent in order; response loss retries the same envelope. Replies preserve mesh/NBT types. Termination suppresses later callbacks and releases the lease with replacement cancellation. The last lease stops an unconfirmed candidate worker; accepted canonical edits still finish their durable commit. With other clients on the same key, releasing one lease does not cancel their shared controller.

This adapter has been exercised in an isolated browser designer, but normal bootstrap selects the remote adapter when the optional Python gateway advertises local-engine/1. The Python gateway launches the service with a private process token and proxies binary messages through its existing authentication. Idle lease cleanup is available; large-file streaming remains integration work. Keep service configuration, tokens, datasets and reports local.

## Python gateway configuration

`engine_gateway.py` discovers an existing compatible Node executable, starts `run-service.mjs` in a hidden process on Windows and forwards authenticated binary calls. Enable with `CRAFTSTUDIO_ENGINE=1`; choose a runtime with `CRAFTSTUDIO_NODE`. Both launcher and backend fingerprints include the engine implementation and shared worker build so an update requires the matching service restart.

The UI persists its active engine key before adopting a staged scene, and its project association after save/open. A confirmed engine scene takes precedence over an older browser/project draft on reload. A normal page unload releases the remote lease; a cached history page keeps its connection. The standalone file Lite never activates this gateway.

The original input fingerprint and serialized baseline identity are distinct. Baseline keys hash the actual stored bytes, preventing a reordered chunk export from colliding with a previous baseline.

## Editing journal isolation and timing

The optional Python gateway uses `data/craftstudio-engine.sqlite3` for committed scene/history records. The existing `craftstudio.sqlite3` remains the project/resource library. This prevents derived baseline/library writes from taking the same SQLite writer lock as an interactive edit. Old engine tables are copied from the legacy database on startup without deleting source data or replacing a destination head that already exists.

Opt-in traced requests return execute/capture/SQLite stage timings through the Worker-like adapter. SQLite timing distinguishes writer-lock acquisition, data writes and COMMIT. Observers cannot change editing success. The normal path does not record these metrics.

This separation does not weaken commit-before-acknowledgement or replace SQLite durability settings. Both databases, process logs and measurement reports remain local. The backend still requires explicit activation while overall remote-path latency and lifecycle work continue.

Cancellation is checked before candidate checkpoint/commit and can interrupt the pre-commit preparation wait. A candidate is marked committed immediately after successful SQLite save; canceling afterwards does not undo that confirmed scene. Default service shutdown remains a drain. Cancellation/close do not delete persisted engine heads or project data.

## Lease liveness and idle reclamation

The service defaults to a ten-minute idle lease timeout and a one-minute sweep. The browser adapter sends a heartbeat at most every thirty seconds and stops it on termination. `heartbeat` renews a lease without touching scene history. Each accepted in-flight RPC protects its lease from sweeping and renews activity when it finishes.

Abandoned idle leases release their owner reference; only the last lease closes the shared controller. Saved SQLite heads and project records are not deleted. Reopening the same key restores the committed scene. A suspended client whose lease expired receives a message to refresh and recover; old requests are not silently replayed under a new lease.

For embedding/tests, `createEngineService` accepts `leaseTimeoutMs`, `sweepIntervalMs` and an injectable `clock`. A zero sweep interval disables automatic sweeping; `sweep()` runs it explicitly and `stats()` returns aggregate owner/lease/busy counts. These developer controls do not expose tokens or project data.

## Chunked RPC uploads

The remote adapter splits call envelopes larger than 8 MiB into 4 MiB upload slices by default. This keeps each authenticated Python proxy request below its single-request limit. The original call ID and encoded envelope remain unchanged when the upload is executed, so slice retries and completion-response retries cannot execute a second import.

Upload operations are lease-bound: `uploadStart` declares ID/size/SHA-256, `uploadChunk` sends ordered bytes at an offset, `uploadedCall` validates and invokes the completed envelope, and `uploadAbort` discards temporary data. Identical slice retries are accepted; conflicting bytes, missing slices, checksum mismatches and cross-lease use are rejected. Temporary filenames are generated server-side. Consumed files are removed; abort, lease release and service close clean pending records.

`RemoteEngineWorker` accepts `uploadThreshold` and `uploadChunkBytes` for embedding/tests and emits upload progress through the existing Worker message channel. Lite's ordinary browser Worker path is unaffected.

This is bounded-request transport, not end-to-end low-memory file parsing. Byte-array calls still materialize the original browser envelope. Selected-file imports use the separate path below. The server assembles either input before handing it to the shared parser/controller. Full streaming input, parser working sets and cleanup after abrupt process termination remain incomplete. Do not treat a large transport test as unlimited world-size support.

## Selected-file imports

When the opt-in local backend is active, the designer passes the selected File/Blob to the adapter. The adapter reads only successive `slice().arrayBuffer()` ranges (4 MiB by default); it does not call the selected file's whole-file `arrayBuffer()` or embed it in a wire envelope. Standalone Lite continues to parse in its browser Worker.

`uploadStart` with `kind: "file"` declares the size. Each `uploadChunk` includes its own SHA-256; the service verifies bytes before writing and rechecks the recorded slices after assembly. `uploadedFileCall` carries the import name/options, original RPC ID and upload ID. The service fingerprints the completed file plus import descriptor; lost replies reuse the same result. Conflicting completion descriptors are rejected. Cancellation discards the staged scene and temporary upload while preserving the current confirmed scene.

This bounds browser input-read memory, not backend parsing memory. Resource-library byte arrays and standalone Lite still use their existing paths. The backend remains opt-in.

## Direct interactive transport

The optional launcher-owned Node service receives an explicit loopback origin list through `CRAFTSTUDIO_ENGINE_ORIGINS`. The launcher advertises its validated `engineEndpoint` after successful startup; the designer uses that endpoint with the same private token instead of forwarding each interactive RPC through Python. The Python endpoint remains a compatibility path. Service Host/Origin/token checks, serialized controllers and persist-before-acknowledgement are unchanged. Standalone Lite stays independent; this backend remains opt-in.

Opt-in traces include controller describe/execute/capture/SQLite stages and browser queue/encode/response-header wait/read/decode timings. The compatibility proxy adds a numeric `Server-Timing` forwarding duration. Same-origin resource timing is included only when a matching entry is available. These figures omit files, coordinates, prompts and tokens; they are diagnostics, not GPU presentation or sustained-FPS measurements.

The browser renderer now evicts unreferenced pooled materials/textures alongside viewport geometry, acknowledges released textures to the mesher for re-entry, and keeps texture references required by cached Create models. This covers graphics residency only. The canonical voxel/parser working set and retained motion geometry still require further scale work.

## Stored original-region queries

Checkpoint version 2 stores a block-free baseline header and independent SHA-256 checked 16×16×16 source chunk blobs. Chunk entries retain original ordinals, states and typed NBT; complete restoration retains original block order. Version 1 checkpoints remain readable and upgrade on the next successful checkpoint capture/commit. Older engine releases cannot read version 2 checkpoints.

Through the authenticated engine RPC `operation: "call"`, use action `storedBaselineManifest` to get the original header, `totalBlocks`, storage `sequence`, workspace/revision and occupied `{bucket,count}` rows. Use `storedBaselineChunks` with `{chunks: [bucket, ...], expectedSequence: sequence}` for at most 128 unique occupied buckets. Bucket encoding is `floor(x/16) | (floor(z/16) << 8) | (floor(y/16) << 16)`. Missing, duplicated, oversized or stale requests fail without returning a partial result. The selected cells keep full-site local coordinates and baseline palette indices. They are original source data; overlays are not merged. An empty requested list means an empty result, not an empty world.

These queries do not replace or modify the live scene. They verify/read only selected source blobs, while the controller queue orders them with committed edits. This is a storage/read boundary: controller startup, native parsing and the canonical editing workspace still hydrate the whole source. Region-scoped canonical editing and view-driven source residency are not implemented by this change.
