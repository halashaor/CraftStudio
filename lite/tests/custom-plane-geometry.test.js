import test from 'node:test';import assert from 'node:assert/strict';
import {Site} from '../src/site.js';import {emptyProject} from '../src/codec.js';import {geometryPlan} from '../src/construction.js';import {designerPlan} from '../src/designer.js';import {threePointFrame,fromPlane,toPlane} from '../src/workplane.js';
const frame=threePointFrame([[20,20,20],[28,22,20],[20,24,26]]),points=[[0,0,0],[8,0,0],[8,4,0],[0,4,0]].map(p=>fromPlane(p,frame)),state={Name:'minecraft:glass'},available=new Set([state.Name]);
test('custom-plane strokes and fills keep their top-surface anchors within voxel rounding of the drawn plane',()=>{
 const site=new Site(emptyProject()),before=structuredClone(site.pack());
 const config={kind:'polygon',plane:'custom',workplane:frame,planeLock:true,snap:0,points,state,voxel:'cube',guidesOnly:false};
 const narrow=geometryPlan(site,{...config,width:1},available),wide=geometryPlan(site,{...config,width:3},available),filled=geometryPlan(site,{...config,fill:true},available);
 assert.ok(narrow.operations.length>0);assert.ok(wide.operations.length>narrow.operations.length);assert.ok(filled.operations.length>narrow.operations.length);
 for(const result of [narrow,wide,filled]){
  assert.ok(result.operations.every(o=>o.pos.every(Number.isInteger)&&o.state.Name===state.Name));
  assert.ok(result.operations.every(o=>Math.abs(toPlane([o.pos[0]+.5,o.pos[1]+1,o.pos[2]+.5],frame)[2])<=Math.sqrt(3)/2+1e-8));
 }
 assert.deepEqual(site.pack(),before);
});
test('oblique offset can directly place blocks rather than only saving guide geometry',()=>{
 const site=new Site(emptyProject());site.design.guides=[{id:'source',points,recipe:{kind:'polygon',plane:'custom',workplane:frame,points,snap:0,state,guidesOnly:true,voxel:'cube'}}];
 const before=structuredClone(site.pack()),result=designerPlan(site,{operation:'offset',guideId:'source',distance:1,guidesOnly:false,state},available);
 assert.ok(result.operations.length>0);assert.ok(result.operations.every(o=>o.state.Name===state.Name));assert.ok(new Set(result.operations.map(o=>o.pos[1])).size>1);
 assert.deepEqual(site.pack(),before);
});
