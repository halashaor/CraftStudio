import test from 'node:test';import assert from 'node:assert/strict';
import {EngineWorkspace} from '../../local-engine/workspace.mjs';import {emptyProject} from '../src/codec.js';
test('surrounding context changes rendering without widening local bounds or changing the project',async()=>{
 const engine=new EngineWorkspace();const mesh=()=>engine.call('meshChunks',{mode:'after',cut:4095,plants:true,showGround:true,showExisting:true});const count=result=>result.chunks.flatMap(c=>c.buckets).reduce((n,b)=>n+b.positions.length,0);
 try{
  const p={...emptyProject(),size:[24,8,24],palette:[{Name:'minecraft:stone'}],blocks:[{pos:[2,1,2],state:0},{pos:[18,1,18],state:0}]};await engine.call('import',{name:'context.json',bytes:new TextEncoder().encode(JSON.stringify(p)).buffer});
  const d=await engine.call('api',{method:'workspace.describe'});await engine.call('api',{method:'objects.put',params:{expectedRevision:d.revision,object:{id:'part',name:'Part',cells:[[2,1,2]]}}});
  const before=await engine.call('summary');await engine.call('viewIsolation',{push:true,objectIds:['part'],includeNew:true});const isolated=await engine.call('summary'),hidden=count(await mesh());
  await engine.call('viewIsolation',{contextVisible:true});const context=await engine.call('summary');assert.equal(context.view.contextVisible,true);assert.deepEqual(context.view.editBounds,isolated.view.editBounds);assert.ok(count(await mesh())>hidden);
  await engine.call('viewIsolation',{push:true,objectIds:['part'],includeNew:true});assert.equal((await engine.call('summary')).view.contextVisible,false);await engine.call('viewIsolation',{pop:true});assert.equal((await engine.call('summary')).view.contextVisible,true);
  await engine.call('viewIsolation',{contextVisible:false});assert.equal(count(await mesh()),hidden);await engine.call('viewIsolation',{clear:true});const after=await engine.call('summary');assert.equal(after.view.isolated,false);assert.equal(after.revision,before.revision);assert.deepEqual(after.design,before.design);assert.equal(after.sourceBlocks,before.sourceBlocks);
  await assert.rejects(engine.call('viewIsolation',{contextVisible:true}),/局部视图/);
 }finally{await engine.close();}
});
