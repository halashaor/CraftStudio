# Local engine prototype

Developer API for running the shared `lite/src/worker.js` engine in isolated Node workers. This prototype is not enabled in the application UI or Python HTTP service.

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

A worker still holds the full scene in RAM. Direct EngineWorkspace calls require manual checkpoints. EngineController wraps calls with persist-before-acknowledgement; it is not enabled in the application service. HTTP transport, runtime packaging and UI handoff are not enabled. This module does not change Lite or the current local designer's storage behavior.

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

Imports and resource changes run in a candidate workspace and swap only after storage succeeds. Invalid imports keep the live scene and uncommitted transactions. Pending strokes/proposals block replacement; pending transactions/construction also block resource replacement. A successful scene import ends old transient operations. `engineCapture`/`engineRestore` cannot bypass the controller. `close()` stops accepting requests and drains already accepted calls.

`sequence` is the storage checkpoint sequence. Independent controllers retain their own in-memory snapshots; SQLite version checks prevent overwriting another committed writer. This is not a collaborative owner/lease service or automatic cross-client refresh.

Explicit file verification is available:

```sh
node local-engine/verify-controller.mjs --nbt=/path/region.nbt --database=/path/test.sqlite --vanilla=/path/client.jar --create=/path/create.jar --report=/path/report.json
```

Inputs and reports remain local. No HTTP transport, runtime discovery, UI handoff or browser working-set eviction is enabled yet. The Python service still uses the existing designer path.

中文补充：EngineController 串行处理请求，编辑检查点提交后才确认；失败恢复最后落盘状态。新文件和资源先在候选宿主处理，保存成功才替换；关闭会处理完已接受请求。它尚未接入界面或 HTTP 服务，不提供多客户端租约和自动刷新。
