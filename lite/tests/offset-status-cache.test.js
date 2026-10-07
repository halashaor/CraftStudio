import test from 'node:test';
import assert from 'node:assert/strict';
import {offsetSourceStatus,offsetSourceStatuses} from '../src/guide-provenance.js';
test('shared offset ancestry respects parent-first rebuild ordering independent of input order',()=>{
 const guides=[{id:'leaf',provenance:{kind:'offset',guideId:'parent',sourceRevision:0}},
 {id:'parent',revision:0,provenance:{kind:'offset',guideId:'base',sourceRevision:1}},
 {id:'base',revision:2}];
 const before=structuredClone(guides),statuses=offsetSourceStatuses(guides);
 assert.equal(statuses.get('parent').canRebuild,true);
 assert.equal(statuses.get('leaf').canRebuild,false);
 assert.match(statuses.get('leaf').reason,/上一级/);
 assert.deepEqual(offsetSourceStatus(guides,'leaf'),statuses.get('leaf'));
 assert.deepEqual(guides,before);
 guides[1].provenance.sourceRevision=2;
 assert.equal(offsetSourceStatuses(guides).get('leaf').outdated,false);
});
test('deep offset chains are inspected iteratively and shared missing ancestry propagates',()=>{
 const count=12000,guides=Array.from({length:count},(_,i)=>({id:String(i),provenance:{kind:'offset',guideId:i?String(i-1):'missing'}}));
 const result=offsetSourceStatuses(guides);
 assert.equal(result.size,count);
 assert.equal(result.get(String(count-1)).errorCode,'OFFSET_SOURCE_MISSING');
 assert.equal(result.get(String(count-1)).missing,false);
 assert.equal(result.get('0').missing,true);
});
test('cycle members and branches all retain cycle reasons without mutating records',()=>{
 const guides=[{id:'branch',provenance:{kind:'offset',guideId:'a'}},{id:'a',provenance:{kind:'offset',guideId:'b'}},{id:'b',provenance:{kind:'offset',guideId:'a'}}];
 const result=offsetSourceStatuses(guides);
 assert.ok([...result.values()].every(s=>s.errorCode==='OFFSET_CYCLE'&&!s.canRebuild));
 assert.equal(offsetSourceStatus(guides,'unknown'),null);
});
