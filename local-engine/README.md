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

A worker still holds the full scene in RAM. SQLite commits are manual: edits are not automatically persisted before being acknowledged. HTTP transport, runtime packaging and UI handoff are not enabled. This module does not change Lite or the current local designer's storage behavior.

中文：本模块为开发者使用的本地引擎原型，提供独立工作线程、检查点与手动 SQLite 保存/恢复。尚未接入当前界面或 Python 服务；文件、资源和验证结果仅在本机使用。
