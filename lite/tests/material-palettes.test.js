import test from 'node:test';import assert from 'node:assert/strict';
import {DesignAPI} from '../src/foundation.js';import {Site} from '../src/site.js';import {emptyProject} from '../src/codec.js';
import {EngineStore} from '../../local-engine/store.mjs';import {EngineController} from '../../local-engine/controller.mjs';import {EngineWorkspace} from '../../local-engine/workspace.mjs';
import {readPaletteDocument,paletteDocument} from '../src/material-palettes.js';
test('portable material scheme carries only reviewed name and full states, never identity or archives',()=>{
 const state={Name:'future_mod:stairs',Properties:{facing:'east',half:'top',shape:'outer_left'}};
 const doc=paletteDocument({id:'source-project-id',name:'Roof',states:[state],resources:'private',origin:[1,2,3]});
 assert.deepEqual(doc,{schema:'craftstudio-material-palette/1',palette:{name:'Roof',states:[state]}});
 const imported=readPaletteDocument({...doc,palette:{...doc.palette,id:'overwrite-id'}});
 assert.equal(imported.id,undefined);assert.deepEqual(imported.states,[state]);
 assert.throws(()=>readPaletteDocument({...doc,schema:'wrong'}),/格式/);
 assert.throws(()=>readPaletteDocument({...doc,palette:{name:'Invalid',states:[{Name:'bad'}]}}),/标识/);
});
const setup=()=>{const site=new Site({...emptyProject(),size:[8,8,8],palette:[{Name:'minecraft:stone'}],blocks:[{pos:[1,1,1],state:0}]});const api=new DesignAPI({getSite:()=>site});const call=(method,params={})=>api.execute({method,params:{expectedRevision:api.revision,...params}});return{site,api,call};};
test('material schemes preserve exact variants, deduplicate states and undo without editing blocks',()=>{
 const{site,call}=setup(),bottom={Name:'minecraft:oak_slab',Properties:{type:'bottom',waterlogged:'false'}},top={...bottom,Properties:{type:'top',waterlogged:'false'}};
 const result=call('palettes.put',{palette:{id:'scheme',name:'Wood',states:[bottom,top,{Name:bottom.Name,Properties:{waterlogged:'false',type:'bottom'}},{Name:'future_mod:sculpture',Properties:{variant:'new'}}]}});
 assert.equal(result.ok,true);assert.equal(result.value.states.length,3);assert.equal(site.overlay.size,0);
 assert.equal(call('palettes.put',{palette:{name:'Wood',states:[]}}).ok,false);
 assert.deepEqual(new Site(site.project()).design.materialPalettes[0].states,result.value.states);
 assert.equal(call('palettes.remove',{id:'scheme'}).ok,true);assert.equal(site.at([1,1,1]).state,0);
 assert.equal(call('history.undo').ok,true);assert.deepEqual(call('palettes.list').value[0].states,result.value.states);
});
test('material scheme metadata and undo survive durable engine and portable reopen',async()=>{
 const store=new EngineStore(':memory:');let c=await EngineController.open({store,key:'palettes'});const other=new EngineWorkspace();
 try{
  const d=await c.call('api',{method:'workspace.describe'}),states=[{Name:'minecraft:oak_stairs',Properties:{facing:'east',half:'top',shape:'outer_left',waterlogged:'false'}}];
  assert.equal((await c.call('api',{method:'palettes.put',params:{expectedRevision:d.revision,palette:{id:'p',name:'House',states}}})).ok,true);
  await c.close();c=await EngineController.open({store,key:'palettes'});
  assert.deepEqual((await c.call('api',{method:'palettes.list'})).value[0].states,states);
  const bytes=await c.call('compressed',{title:'Schemes'});await other.call('import',{name:'schemes.craftlite',bytes:bytes.buffer});
  assert.deepEqual((await other.call('api',{method:'palettes.list'})).value[0].states,states);
  const now=await c.call('api',{method:'workspace.describe'});assert.equal((await c.call('api',{method:'history.undo',params:{expectedRevision:now.revision}})).ok,true);
  await c.close();c=await EngineController.open({store,key:'palettes'});assert.deepEqual((await c.call('api',{method:'palettes.list'})).value,[]);
 }finally{await c.close();await other.close();store.close();}
});
test('material scheme writes are atomic, guarded and transaction isolated',()=>{
 const{site,api,call}=setup(),revision=api.revision;
 assert.equal(call('palettes.put',{palette:{name:'Invalid',states:[{Name:'minecraft:stone'},{Name:'invalid'}]}}).ok,false);
 assert.equal(api.revision,revision);assert.equal(site.design.materialPalettes,undefined);
 assert.equal(call('palettes.put',{palette:{name:'Invalid',states:[{Name:'minecraft:stone',Properties:{variant:42}}]}}).ok,false);
 const tx=call('transaction.begin').value.transactionId;
 assert.equal(call('palettes.put',{transactionId:tx,palette:{name:'Stage',states:[]}}).ok,true);
 assert.equal(call('palettes.list').value.length,0);assert.equal(call('palettes.list',{transactionId:tx}).value.length,1);
 assert.equal(call('transaction.commit',{transactionId:tx}).ok,true);
 assert.equal(call('palettes.list',{expectedRevision:revision}).ok,false);
 assert.ok(call('workspace.describe').value.methods.includes('palettes.list'));
 // A palette is a browsing preference, never an edit whitelist.
 assert.equal(call('edit.apply',{operations:[{type:'set',pos:[2,1,1],state:{Name:'other_mod:free_build'}}]}).ok,true);
});
