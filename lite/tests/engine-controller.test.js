import test from 'node:test';import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {EngineStore} from '../../local-engine/store.mjs';import {EngineController} from '../../local-engine/controller.mjs';import {EngineWorkspace} from '../../local-engine/workspace.mjs';import {emptyProject} from '../src/codec.js';
const fixture=()=>({name:'fixture.json',bytes:new TextEncoder().encode(JSON.stringify(emptyProject())).buffer});
const read=c=>c.call('api',{method:'workspace.describe'}),cell=c=>c.call('api',{method:'scene.getBlocks',params:{positions:[[2,1,2]]}});
const request=d=>({id:'durable-edit',method:'edit.apply',params:{workspaceId:d.workspaceId,expectedRevision:d.revision,operations:[{type:'set',pos:[2,1,2],state:{Name:'minecraft:bricks'}}]}});
test('mutation acknowledgement and reads wait for the SQLite commit; receipt/undo survive controller reopen',async()=>{
 const store=new EngineStore(':memory:');let release,entered,gate=false,signal=new Promise(r=>entered=r),c=await EngineController.open({store,key:'p',beforeCommit:async()=>{if(gate){entered();await new Promise(r=>release=r);}}});
 try{await c.call('import',fixture());const d=await read(c),edit=request(d);gate=true;let acknowledged=false;const pending=c.call('api',edit).then(r=>{acknowledged=true;return r;});await signal;assert.equal(acknowledged,false);assert.equal(store.load('p').head.revision,d.revision);let readDone=false;const queued=cell(c).then(r=>{readDone=true;return r;});await new Promise(setImmediate);assert.equal(readDone,false);gate=false;release();const result=await pending;assert.ok(result.ok);assert.equal((await queued).value[0].state.Name,'minecraft:bricks');await c.close();c=await EngineController.open({store,key:'p'});assert.deepEqual(await c.call('api',edit),result);assert.equal((await read(c)).value.history.undo,1);const now=await read(c);assert.ok((await c.call('api',{method:'history.undo',params:{expectedRevision:now.revision}})).ok);await c.close();c=await EngineController.open({store,key:'p'});assert.equal((await read(c)).value.history.redo,1);assert.equal((await cell(c)).value[0].state,null);
 }finally{await c.close();store.close();}
});
test('commit failure restores only confirmed state and discards the unacknowledged receipt',async()=>{
 const store=new EngineStore(':memory:');let fail=false;const c=await EngineController.open({store,key:'p',beforeCommit:async()=>{if(fail)throw Error('simulated disk failure');}});
 try{const d=await read(c),edit=request(d);fail=true;await assert.rejects(c.call('api',edit),/not acknowledged/);assert.equal((await cell(c)).value[0].state,null);assert.equal((await read(c)).revision,d.revision);fail=false;const result=await c.call('api',edit);assert.ok(result.ok);assert.equal((await read(c)).value.history.undo,1);}finally{await c.close();store.close();}
});
test('failed staged import keeps scene identity and current transaction; successful import replaces it',async()=>{
 const store=new EngineStore(':memory:'),c=await EngineController.open({store,key:'p'});
 try{const d=await read(c),tx=await c.call('api',{method:'transaction.begin',params:{expectedRevision:d.revision}}),transactionId=tx.value.transactionId;await c.call('api',{method:'transaction.apply',params:{transactionId,operations:request(d).params.operations}});await assert.rejects(c.call('import',{name:'bad.json',bytes:new TextEncoder().encode('broken').buffer}));assert.equal((await read(c)).workspaceId,d.workspaceId);assert.ok((await c.call('api',{method:'transaction.commit',params:{transactionId}})).ok);assert.equal((await cell(c)).value[0].state.Name,'minecraft:bricks');await c.call('import',fixture());assert.notEqual((await read(c)).workspaceId,d.workspaceId);assert.equal((await cell(c)).value[0].state,null);}finally{await c.close();store.close();}
});
test('independent controllers cannot overwrite a newer durable writer',async()=>{
 const store=new EngineStore(':memory:'),first=await EngineController.open({store,key:'p'}),second=await EngineController.open({store,key:'p'});
 try{const d=await read(first);assert.ok((await first.call('api',request(d))).ok);await assert.rejects(second.call('api',{...request(d),id:'other-edit'}),/not acknowledged/);assert.equal((await read(second)).revision,(await read(first)).revision);assert.equal((await cell(second)).value[0].state.Name,'minecraft:bricks');}finally{await Promise.all([first.close(),second.close()]);store.close();}
});
test('lost acknowledgement after COMMIT recovers the committed edit and retry stays idempotent',async()=>{
 const store=new EngineStore(':memory:'),c=await EngineController.open({store,key:'p'}),commit=store.commit.bind(store);let lose=true;
 try{const d=await read(c),edit=request(d);store.commit=(...args)=>{const result=commit(...args);if(lose){lose=false;throw Error('ack lost');}return result;};await assert.rejects(c.call('api',edit),/not acknowledged/);assert.equal((await cell(c)).value[0].state.Name,'minecraft:bricks');const result=await c.call('api',edit);assert.ok(result.ok);assert.equal((await read(c)).value.history.undo,1);assert.equal(c.sequence,2);}finally{await c.close();store.close();}
});
test('staged import commit failure preserves live transactions, while lost COMMIT acknowledgement adopts durable scene',async()=>{
 const store=new EngineStore(':memory:'),c=await EngineController.open({store,key:'p'}),commit=store.commit.bind(store);let mode='before';
 try{const d=await read(c),tx=await c.call('api',{method:'transaction.begin',params:{expectedRevision:d.revision}}),transactionId=tx.value.transactionId;await c.call('api',{method:'transaction.apply',params:{transactionId,operations:request(d).params.operations}});store.commit=(...args)=>{if(mode==='before')throw Error('write failed');const result=commit(...args);if(mode==='after')throw Error('ack lost');return result;};await assert.rejects(c.call('import',fixture()),/write failed/);assert.equal((await read(c)).workspaceId,d.workspaceId);mode='normal';assert.ok((await c.call('api',{method:'transaction.commit',params:{transactionId}})).ok);mode='after';await assert.rejects(c.call('import',fixture()),/ack lost/);assert.notEqual((await read(c)).workspaceId,d.workspaceId);assert.equal((await cell(c)).value[0].state,null);}finally{await c.close();store.close();}
});
test('checkpoint restore cannot bypass controller and close drains accepted operations',async()=>{
 const store=new EngineStore(':memory:'),c=await EngineController.open({store,key:'p'});try{await assert.rejects(c.call('engineRestore',{}),/internal/);const d=await read(c),pending=c.call('api',request(d)),closing=c.close();assert.ok((await pending).ok);await closing;await assert.rejects(read(c),/closed/);assert.equal(store.load('p').head.revision,d.revision+1);}finally{await c.close();store.close();}
});

test('resource archives are staged and durable; unfinished transactions block replacement',async()=>{
 const store=new EngineStore(':memory:');let c=await EngineController.open({store,key:'p'});try{
  await assert.rejects(c.call('summary',{bad:()=>{}}));const d=await read(c),tx=await c.call('api',{method:'transaction.begin',params:{expectedRevision:d.revision}}),transactionId=tx.value.transactionId;
  await assert.rejects(c.call('resourceLibrary',{files:[]}),/pending/);assert.ok((await c.call('api',{method:'transaction.abort',params:{transactionId}})).ok);
  const bytes=zipSync({'assets/example/blockstates/panel.json':strToU8(JSON.stringify({variants:{'':{model:'example:block/panel'}}})),'assets/example/models/block/panel.json':strToU8(JSON.stringify({parent:'minecraft:block/cube_all',textures:{all:'example:block/panel'}}))});
  await c.call('resourceLibrary',{files:[{name:'example.jar',bytes:bytes.buffer}]});assert.equal(store.load('p').head.archives.length,1);await c.close();c=await EngineController.open({store,key:'p'});assert.ok((await c.call('assetCatalogue')).some(item=>item.id==='example:panel'));
 }finally{await c.close();store.close();}
});

test('recovery allocation failure fails closed instead of exposing an uncommitted edit',async()=>{
 const store=new EngineStore(':memory:');let calls=0,fail=false;const c=await EngineController.open({store,key:'p',factory:()=>{if(calls++)throw Error('cannot allocate recovery worker');return new EngineWorkspace();},beforeCommit:async()=>{if(fail)throw Error('write failed');}});
 try{const d=await read(c);fail=true;await assert.rejects(c.call('api',request(d)),/Cannot recover/);await assert.rejects(read(c),/closed/);assert.equal(store.load('p').head.revision,d.revision);}finally{await c.close();store.close();}
});
