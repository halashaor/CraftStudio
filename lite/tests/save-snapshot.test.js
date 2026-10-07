import test from 'node:test';import assert from 'node:assert/strict';import {EngineWorkspace} from '../../local-engine/workspace.mjs';import {emptyProject} from '../src/codec.js';import {gunzipSync,strFromU8} from 'fflate';
test('guarded portable save captures one revision and refuses a stale request before changing its title',async()=>{
 const e=new EngineWorkspace();try{
  await e.call('import',{name:'save.json',bytes:new TextEncoder().encode(JSON.stringify({...emptyProject('Before'),size:[8,8,8]})).buffer});
  const d=await e.call('api',{method:'workspace.describe'}),context={workspaceId:d.workspaceId,expectedRevision:d.revision};
  const bytes=await e.call('compressed',{...context,title:'Frozen'}),pkg=JSON.parse(strFromU8(gunzipSync(bytes)));assert.equal(pkg.site.title,'Frozen');
  assert.ok((await e.call('api',{method:'edit.apply',params:{expectedRevision:d.revision,operations:[{type:'set',pos:[12,1,1],state:{Name:'minecraft:glass'}}]}})).ok);
  await assert.rejects(e.call('compressed',{...context,title:'Stale'}),/场景已经更新/);
  assert.equal((await e.call('summary')).name,'Frozen');assert.equal((await e.call('summary')).add,1);
 }finally{await e.close();}
});
