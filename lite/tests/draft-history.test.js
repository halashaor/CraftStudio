import test from 'node:test';import assert from 'node:assert/strict';
import {Site} from '../src/site.js';import {emptyProject} from '../src/codec.js';import {captureDraftHistory} from '../src/draft-history.js';import {DesignAPI} from '../src/foundation.js';
test('draft history restores voxel/NBT and metadata edits, undo/redo and independent chunk ownership',()=>{
 const site=new Site({...emptyProject(),size:[64,8,8],palette:[{Name:'minecraft:stone'}],blocks:[{pos:[1,1,1],state:0}]});
 site.operations([{type:'set',pos:[2,1,1],state:{Name:'minecraft:chest'},nbt:{t:10,v:{CustomName:{t:8,v:'Chest'}}}}]);
 site.operations([{type:'set',pos:[33,1,1],state:{Name:'minecraft:oak_slab',Properties:{type:'top'}}}]);
 const api=new DesignAPI({getSite:()=>site});assert.ok(api.execute({method:'palettes.put',params:{expectedRevision:0,palette:{name:'Roof',states:[]}}}).ok);
 site.restore('undo');const history=captureDraftHistory(site),copy=Site.unpack({...site.pack(),history:JSON.parse(JSON.stringify(history))});
 assert.equal(copy.redo.length,1);assert.equal(copy.undo.length,2);copy.restore('redo');assert.equal(copy.design.materialPalettes[0].name,'Roof');
 copy.restore('undo');copy.restore('undo');assert.equal(copy.at([33,1,1]),null);assert.equal(copy.at([2,1,1]).nbt.v.CustomName.v,'Chest');
 copy.operations([{type:'set',pos:[3,1,1],state:{Name:'minecraft:glass'}}]);copy.restore('undo');assert.equal(copy.at([3,1,1]),null);
 copy.restore('undo');assert.equal(copy.at([2,1,1]),null);assert.equal(copy.at([1,1,1]).state,0);
 assert.equal(site.at([33,1,1]).state>=0,true);
});
test('draft history stores shared changed chunks and repeated designs once, excluding baseline blocks',()=>{
 const site=new Site({...emptyProject(),size:[64,8,8],palette:[{Name:'minecraft:stone'}],blocks:[{pos:[1,1,1],state:0}]});
 site.operations([{type:'set',pos:[33,1,1],state:{Name:'minecraft:glass'}}]);
 for(let x=2;x<7;x++)site.operations([{type:'set',pos:[x,1,1],state:{Name:'minecraft:glass'}}]);
 const h=captureDraftHistory(site);assert.equal(h.chunks.filter(c=>c.bucket===2).length,1);assert.equal(h.designs.length,1);
 assert.ok(h.chunks.every(c=>c.blocks.every(b=>b.pos.join(',')!=='1,1,1')));
 assert.deepEqual(Site.unpack(site.pack()).undo,[],'legacy/portable packages have no implicit history');
});
test('invalid draft history fails before a restored site is published',()=>{
 const site=new Site(emptyProject()),history=captureDraftHistory(site);
 assert.throws(()=>Site.unpack({...site.pack(),history:{...history,undo:[{chunks:[99],size:[1,1,1],design:0}]}}),/历史损坏/);
 assert.throws(()=>Site.unpack({...site.pack(),history:{...history,schema:'unknown'}}),/历史损坏/);
});
