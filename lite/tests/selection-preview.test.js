import test from 'node:test';import assert from 'node:assert/strict';import {EngineWorkspace} from '../../local-engine/workspace.mjs';import {emptyProject} from '../src/codec.js';
test('selection preview and clipboard reads reject changed revision or workspace before returning geometry',async()=>{
 const engine=new EngineWorkspace();try{
  await engine.call('import',{name:'selection.json',bytes:new TextEncoder().encode(JSON.stringify({...emptyProject(),size:[8,8,8],palette:[{Name:'minecraft:stone'}],blocks:[{pos:[1,1,1],state:0}]})).buffer});
  const d=await engine.call('api',{method:'workspace.describe'}),params={min:[0,0,0],max:[3,3,3],expectedRevision:d.revision,workspaceId:d.workspaceId};
  assert.equal((await engine.call('selectionPreview',params)).count,1);
  assert.equal((await engine.call('copySelection',params)).blocks.length,1);
  assert.ok((await engine.call('api',{method:'edit.apply',params:{expectedRevision:d.revision,operations:[{type:'set',pos:[2,1,1],state:{Name:'minecraft:glass'}}]}})).ok);
  for(const action of ['selectionPreview','copySelection']){
   await assert.rejects(engine.call(action,params),/场景已经更新/);
   await assert.rejects(engine.call(action,{...params,expectedRevision:d.revision+1,workspaceId:'old-workspace'}),/工程已切换/);
  }
  assert.equal((await engine.call('selectionPreview',{...params,expectedRevision:d.revision+1})).count,2);
 }finally{await engine.close();}
});
