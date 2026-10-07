import test from 'node:test';import assert from 'node:assert/strict';import {EngineWorkspace} from '../../local-engine/workspace.mjs';import {emptyProject} from '../src/codec.js';
import {Site,coordKey} from '../src/site.js';import {selection} from '../src/studio.js';import {selectionPreviewSite,packMemberCoordinates,memberCoordinates} from '../src/selection-preview.js';import {Resources} from '../src/resources.js';import {buildMesh} from '../src/mesh.js';
import {encodeWire,decodeWire} from '../src/engine-wire.js';
test('compact member coordinates retain order, holes and maximum local coordinates',()=>{
 const points=[[0,0,0],[4095,4095,4095],[2,1,3]],packed=packMemberCoordinates(points);
 assert.ok(packed instanceof Uint16Array);assert.deepEqual(Array.from(memberCoordinates(packed)),points);
 assert.deepEqual(Array.from(memberCoordinates(points)),points);
 assert.throws(()=>packMemberCoordinates([[4096,0,0]]),/坐标/);
 assert.throws(()=>Array.from(memberCoordinates(new Uint16Array(2))),/不完整/);
});
test('read-only selection preview matches portable selection geometry and exact masks without cloning state records',()=>{
 const site=new Site({...emptyProject(),size:[16,8,8],palette:[{Name:'minecraft:stone'},{Name:'minecraft:oak_stairs',Properties:{facing:'east',half:'top',shape:'outer_left',waterlogged:'false'}},{Name:'minecraft:oak_slab',Properties:{type:'top',waterlogged:'false'}}],blocks:[{pos:[1,1,1],state:0},{pos:[2,1,1],state:1},{pos:[3,1,1],state:2}]});
 site.operations([{type:'set',pos:[4,1,1],state:{Name:'future_mod:custom'}},{type:'set',pos:[1,1,1],state:null}],{allowTerrain:true});
 const min=[0,0,0],max=[6,4,4],before=structuredClone(site.pack());
 for(const options of [{},{keys:[[2,1,1],[4,1,1]]},{regions:[{min,max,operation:'replace'},{min:[3,1,1],max:[3,1,1],operation:'subtract'}]}]){
  const prefab=selection(site,min,max,options),old=new Site({...emptyProject(),size:prefab.size,palette:[],blocks:[]});for(const b of prefab.blocks)old.cells.set(coordKey(...b.pos),{pos:b.pos,state:old.state(b.state)});
  const view=selectionPreviewSite(site,min,max,options);assert.equal(view.site.palette,site.palette);assert.equal(view.count,prefab.blocks.length);assert.deepEqual(view.members,prefab.blocks.map(b=>b.pos));
  assert.deepEqual(buildMesh(view.site,new Resources()),buildMesh(old,new Resources()));
  const full=buildMesh(view.site,new Resources()),ghost=buildMesh(view.site,new Resources(),{geometryOnly:true});
  assert.equal(ghost.triangles,full.triangles);assert.deepEqual(ghost.issues,full.issues);
  assert.equal(ghost.buckets.length,full.buckets.length);
  for(let i=0;i<full.buckets.length;i++){assert.deepEqual(ghost.buckets[i].positions,full.buckets[i].positions);assert.deepEqual(ghost.buckets[i].normals,full.buckets[i].normals);assert.equal(ghost.buckets[i].colors,undefined);assert.equal(ghost.buckets[i].uv,undefined);}
 }
 assert.deepEqual(site.pack(),before);
 const copied=selection(site,min,max);copied.blocks[0].state.Properties.facing='west';assert.equal(site.palette[1].Properties.facing,'east');
});
test('selection preview and clipboard reads reject changed revision or workspace before returning geometry',async()=>{
 const engine=new EngineWorkspace();try{
  await engine.call('import',{name:'selection.json',bytes:new TextEncoder().encode(JSON.stringify({...emptyProject(),size:[8,8,8],palette:[{Name:'minecraft:stone'}],blocks:[{pos:[1,1,1],state:0}]})).buffer});
  const d=await engine.call('api',{method:'workspace.describe'}),params={min:[0,0,0],max:[3,3,3],expectedRevision:d.revision,workspaceId:d.workspaceId};
  assert.equal((await engine.call('selectionPreview',params)).count,1);
  const ghost=await engine.call('selectionPreview',{...params,geometryOnly:true});assert.equal(ghost.count,1);assert.deepEqual(ghost.textures,{});assert.ok(ghost.buckets.every(b=>b.positions instanceof Float32Array&&b.normals instanceof Float32Array&&!b.colors&&!b.uv));
  const compact=await engine.call('selectionPreview',{...params,geometryOnly:true,compactMembers:true});assert.ok(compact.members instanceof Uint16Array);assert.deepEqual(Array.from(memberCoordinates(compact.members)),ghost.members);
  for(const version of [1,2])assert.deepEqual(decodeWire(encodeWire(compact,{version})),compact);
  assert.equal((await engine.call('copySelection',params)).blocks.length,1);
  assert.ok((await engine.call('api',{method:'edit.apply',params:{expectedRevision:d.revision,operations:[{type:'set',pos:[2,1,1],state:{Name:'minecraft:glass'}}]}})).ok);
  for(const action of ['selectionPreview','copySelection']){
   await assert.rejects(engine.call(action,params),/场景已经更新/);
   await assert.rejects(engine.call(action,{...params,expectedRevision:d.revision+1,workspaceId:'old-workspace'}),/工程已切换/);
  }
  assert.equal((await engine.call('selectionPreview',{...params,expectedRevision:d.revision+1})).count,2);
 }finally{await engine.close();}
});
