import {webcrypto} from 'node:crypto';
import {parentPort} from 'node:worker_threads';
if(!parentPort)throw Error('Engine requires an isolated worker thread');
// Reuse the browser engine's message boundary, not a second implementation.
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
globalThis.self={crypto:globalThis.crypto,postMessage:(message,transfers=[])=>parentPort.postMessage(message,transfers)};
await import('../lite/src/worker.js');
parentPort.on('message',message=>self.onmessage({data:message}));
