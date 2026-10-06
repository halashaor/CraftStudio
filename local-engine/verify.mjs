import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve} from 'node:path';
import {EngineWorkspace} from './workspace.mjs';
import {importNBT,stateKey} from '../lite/src/codec.js';
import assert from 'node:assert/strict';
const options=Object.fromEntries(process.argv.slice(2).map(arg=>{const at=arg.indexOf('=');if(!arg.startsWith('--')||at<3)throw Error('Use --nbt=PATH [--vanilla=PATH --create=PATH --report=PATH]');return[arg.slice(2,at),arg.slice(at+1)];}));
if(!options.nbt)throw Error('An explicit --nbt input is required');
const canonical=async path=>{const resolved=await realpath(path).catch(()=>resolve(path));return process.platform==='win32'?resolved.toLowerCase():resolved;};
if(options.report){const report=await canonical(options.report);for(const key of ['nbt','vanilla','create'])if(options[key]&&await canonical(options[key])===report)throw Error('Report must not overwrite an input');}
const e=new EngineWorkspace(),reopened=new EngineWorkspace();
try{
 const files=[];for(const key of ['vanilla','create'])if(options[key])files.push({name:key+'.jar',bytes:new Uint8Array(await readFile(options[key])).buffer});
 if(files.length)await e.call('resourceLibrary',{files});
 const started=performance.now(),summary=await e.call('import',{name:'verification.nbt',bytes:new Uint8Array(await readFile(options.nbt)).buffer}),importMs=performance.now()-started;
 const before=await e.call('api',{method:'workspace.describe'}),pos=[summary.size[0]+1,1,summary.size[2]+1];if(pos.some(n=>n>=4096))throw Error('Verification needs one empty position beyond the source bounds');
 const edit={id:'verify-edit',method:'edit.apply',params:{expectedRevision:before.revision,operations:[{type:'set',pos,state:{Name:'craftstudio_verify:unknown_panel',Properties:{variant:'prototype'}}}]}};
 const result=await e.call('api',edit);assert.ok(result.ok,result.error?.message);assert.deepEqual(await e.call('api',edit),result);
 const mesh=await e.call('meshChunks',{mode:'after',cut:4095,plants:true,showGround:true,showExisting:true,viewPlanes:[[1,0,0,0],[-1,0,0,31]]});assert.ok(mesh.chunks.every(c=>c.buckets.every(b=>b.positions instanceof Float32Array)));
 const portable=await e.call('compressed',{title:'Verification'});await reopened.call('import',{name:'reopened.craftlite',bytes:portable.buffer});
 const marker=await reopened.call('api',{method:'scene.getBlocks',params:{positions:[pos]}});assert.equal(marker.value[0].state.Name,'craftstudio_verify:unknown_panel');
 const reopenedSummary=await reopened.call('summary');assert.equal(reopenedSummary.sourceBlocks,summary.sourceBlocks);assert.equal(reopenedSummary.entities,summary.entities);assert.equal(reopenedSummary.blockEntities,summary.blockEntities);
 const output=importNBT(await reopened.call('export',{kind:'full'}),'export.nbt');assert.equal(output.blocks.length,summary.sourceBlocks+1);assert.ok(output.palette.some(s=>s.Name==='craftstudio_verify:unknown_panel'));
 const original=importNBT(new Uint8Array(await readFile(options.nbt)),'source.nbt'),coordinate=p=>p[0]+4096*(p[2]+4096*p[1]),originalStates=original.palette.map(stateKey),outputStates=output.palette.map(stateKey),records=new Map(original.blocks.map(b=>[coordinate(b.pos),b]));let exact=0;for(const b of output.blocks){const previous=records.get(coordinate(b.pos));if(!previous)continue;assert.equal(outputStates[b.state],originalStates[previous.state]);assert.deepEqual(b.nbt,previous.nbt);exact++;}assert.equal(exact,original.blocks.length);assert.deepEqual(output.entities,original.entities);
 assert.ok((await e.call('api',{method:'history.undo',params:{expectedRevision:result.revision}})).ok);assert.equal((await e.call('api',{method:'scene.getBlocks',params:{positions:[pos]}})).value[0].state,null);
 const report={schema:'craftstudio-local-engine-verification/1',sourceBlocks:summary.sourceBlocks,sourceEntities:summary.entities,sourceBlockEntities:summary.blockEntities,resourceArchives:files.length,importMs,typedMeshChunks:mesh.chunks.length,portableBytes:portable.byteLength,unknownStateEditAndReplay:true,portableReopenRetainsCountsAndEdit:true,nbtExportRetainsCountsAndUnknownState:true,undoRestoresSource:true,exactSourceStatesAndBlockEntityTags:true,exactEntityTags:true,scope:'shared engine executes in isolated Node worker; not HTTP/UI/SQLite authority or viewport-only voxel working sets'};
 if(options.report)await writeFile(options.report,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await Promise.all([e.close(),reopened.close()]);}
