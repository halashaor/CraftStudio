import test from 'node:test';
import assert from 'node:assert/strict';
import {Site} from '../src/site.js';
import {emptyProject} from '../src/codec.js';
import {DesignAPI} from '../src/foundation.js';
import {objectHidden,hiddenObjectContains} from '../src/collections.js';
function setup(){
 const site=new Site({...emptyProject(),size:[16,16,16],palette:[{Name:'minecraft:stone'}],blocks:[{pos:[1,1,1],state:0}]});
 const api=new DesignAPI({getSite:()=>site});
 const call=(method,params={})=>api.execute({method,params:{expectedRevision:api.revision,...params}});
 for(const [id,hidden] of [['a',false],['b',true]])assert.equal(call('objects.put',{object:{id,name:id,cells:[[1,1,1]],hidden}}).ok,true);
 return{site,api,call};
}
test('sparse hidden objects do not hide decorations in holes of their bounding box',()=>{
 const design={collections:[{id:'g',hidden:true}]},object={collectionId:'g',cells:['1,1,1','3,1,1'],min:[1,1,1],max:[3,1,1]};
 assert.equal(hiddenObjectContains(design,object,[1,1,1]),true);
 assert.equal(hiddenObjectContains(design,object,[2,1,1]),false);
 assert.equal(hiddenObjectContains(design,object,[4,1,1]),false);
});
test('collection visibility preserves individual visibility and undo restores membership',()=>{
 const{site,call}=setup();
 assert.equal(call('collections.put',{collection:{id:'house',name:' House '},objectIds:['a','b']}).ok,true);
 assert.equal(call('collections.put',{collection:{id:'house',name:'House',hidden:true}}).ok,true);
 assert.deepEqual(site.design.objects.map(o=>objectHidden(site.design,o)),[true,true]);
 assert.equal(call('collections.put',{collection:{id:'house',name:'House',hidden:false}}).ok,true);
 assert.deepEqual(site.design.objects.map(o=>objectHidden(site.design,o)),[false,true]);
 const restored=new Site(site.project());
 assert.equal(restored.design.collections[0].name,'House');
 assert.equal(restored.design.objects[0].collectionId,'house');
 assert.equal(call('collections.remove',{id:'house'}).ok,true);
 assert.equal(site.design.objects.length,2);
 assert.equal(site.at([1,1,1]).state,0);
 assert.ok(site.design.objects.every(o=>!o.collectionId));
 assert.equal(call('history.undo').ok,true);
 assert.ok(site.design.objects.every(o=>o.collectionId==='house'));
});
test('collection mutation is atomic, revision guarded and transaction isolated',()=>{
 const{site,api,call}=setup();
 const before=JSON.stringify(site.design),revision=api.revision;
 assert.equal(call('collections.put',{collection:{id:'bad',name:'Bad'},objectIds:['a','missing']}).ok,false);
 assert.equal(JSON.stringify(site.design),before);
 assert.equal(api.revision,revision);
 assert.equal(call('collections.put',{expectedRevision:revision-1,collection:{name:'Stale'}}).ok,false);
 const transactionId=call('transaction.begin').value.transactionId;
 assert.equal(call('collections.put',{transactionId,collection:{id:'staged',name:'Staged'},objectIds:['a']}).ok,true);
 assert.equal(call('collections.list').value.length,0);
 assert.deepEqual(call('collections.list',{transactionId}).value[0].objectIds,['a']);
 assert.equal(call('transaction.commit',{transactionId}).ok,true);
 assert.equal(site.design.objects[0].collectionId,'staged');
 assert.equal(call('collections.list',{expectedRevision:revision}).ok,false);
 assert.equal(call('objects.put',{object:{id:'c',name:'c',cells:[[2,1,1]],collectionId:'missing'}}).ok,false);
});
