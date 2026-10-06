import test from 'node:test';
import assert from 'node:assert/strict';
import {Site} from '../src/site.js';
import {emptyProject} from '../src/codec.js';
import {DesignAPI} from '../src/foundation.js';
import {normalizeDisplay,displayCut} from '../src/display-state.js';
const display={mode:'diff',cut:3,plants:false,ground:true,existing:false};
test('display snapshots survive portable storage and undo without voxel edits',()=>{
 const s=new Site(emptyProject()),api=new DesignAPI({getSite:()=>s});
 const r=api.execute({method:'views.put',params:{expectedRevision:0,view:{name:'Section',position:[8,8,8],target:[0,0,0],display}}});
 assert.ok(r.ok,r.error?.message);assert.deepEqual(Site.unpack(s.pack()).design.cameras[0].display,display);assert.equal(s.overlay.size,0);
 const invalid=api.execute({method:'views.put',params:{expectedRevision:1,view:{...r.value.view,display:{...display,cut:-1}}}});assert.equal(invalid.ok,false);assert.deepEqual(s.design.cameras[0].display,display);
 assert.ok(api.execute({method:'history.undo',params:{expectedRevision:1}}).ok);assert.equal(s.design.cameras.length,0);
});
test('all layers is portable across scene heights; malformed display settings reject',()=>{
 assert.equal(displayCut(null,23),23);assert.equal(displayCut(30,12),12);assert.equal(displayCut(3,12),3);
 for(const patch of [{mode:'bad'},{cut:1.5},{plants:1},{cut:undefined}])assert.throws(()=>normalizeDisplay({...display,...patch}));
 assert.deepEqual(normalizeDisplay({...display,extra:'ignored'}),display);
});
