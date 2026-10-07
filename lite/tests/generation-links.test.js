import test from 'node:test';import assert from 'node:assert/strict';import {generationLinks} from '../src/generation-links.js';import {DesignAPI} from '../src/foundation.js';import {Site} from '../src/site.js';import {emptyProject} from '../src/codec.js';
test('recorded output dependencies propagate problems and stop at detached outputs',()=>{
 const design={guides:[{id:'a'},{id:'b'},{id:'c'}],objects:[
 {id:'first',name:'Roof',guideId:'a',generation:{type:'feature',sources:['missing']}},
 {id:'second',name:'Eaves',guideId:'b',generation:{type:'feature',sources:['a']}},
 {id:'third',name:'Trim',generation:{type:'feature',sources:['b']}},
 {id:'independent',guideId:'c',generation:{type:'feature',sources:['missing'],detached:true}},
 {id:'after-independent',generation:{type:'feature',sources:['c']}}]};
 const before=structuredClone(design),result=generationLinks(design);
 assert.deepEqual(result.objects.map(o=>o.status),['error','error','error','detached','ready']);
 assert.equal(result.objects[2].issues[0].objectId,'second');
 assert.match(result.objects[2].issues[0].message,/Eaves/);
 assert.deepEqual(design,before);
 design.objects[0].generation={type:'feature',sources:[],outdated:true};
 assert.deepEqual(generationLinks(design).objects.slice(0,3).map(o=>o.status),['warning','warning','warning']);
});
test('cycles are distinguished from downstream problems and shared sketch aliases',()=>{
 const design={guides:[{id:'a'},{id:'b'},{id:'sketch'}],objects:[
 {id:'a',guideId:'a',generation:{type:'feature',sources:['b']}},
 {id:'b',guideId:'b',generation:{type:'feature',sources:['a']}},
 {id:'consumer',generation:{type:'feature',sources:['b']}},
 {id:'geometry',guideId:'sketch',generation:{type:'geometry',sources:['sketch']}}]};
 const result=generationLinks(design).objects;
 assert.ok(result.slice(0,2).every(o=>o.issues.some(i=>i.code==='DEPENDENCY_CYCLE')));
 assert.ok(result[2].issues.some(i=>i.code==='UPSTREAM_ERROR'));
 assert.equal(result[2].issues.some(i=>i.code==='DEPENDENCY_CYCLE'),false);
 assert.equal(result[3].status,'ready');
});
test('multiple producers identify ambiguous recorded source ownership',()=>{
 const result=generationLinks({guides:[{id:'output'}],objects:[
 {id:'a',guideId:'output',generation:{type:'feature',sources:[]}},
 {id:'b',guideId:'output',generation:{type:'feature',sources:[]}},
 {id:'consumer',generation:{sources:['output']}}]}).objects[2];
 assert.equal(result.status,'error');
 assert.deepEqual(result.issues.find(i=>i.code==='AMBIGUOUS_OUTPUT').objectIds,['a','b']);
});
test('generation diagnostics distinguish missing sources, outdated results and detached objects',()=>{
 const design={guides:[{id:'source',name:'Roof'}],objects:[
 {id:'missing',generation:{sources:['gone'],outdated:true}},
 {id:'outdated',generation:{sources:['source'],outdated:true}},
 {id:'ready',generation:{sources:['source']}},
 {id:'detached',generation:{sources:['gone'],outdated:true,detached:true}}]};
 const before=structuredClone(design),result=generationLinks(design);
 assert.deepEqual(result.objects.map(o=>o.status),['error','warning','ready','detached']);
 assert.deepEqual(result.objects[0].issues.map(i=>i.code),['MISSING_SOURCE','OUTDATED']);
 assert.equal(result.objects[0].issues[0].sourceId,'gone');
 assert.deepEqual(result.objects[3].issues,[]);
 assert.deepEqual(design,before);
});
test('generation links preserve multiple/loop sources, missing references and detached state without altering design',()=>{const design={guides:[{id:'a',name:'Profile A',recipe:{kind:'line',points:[[0,0,0],[1,0,0]]}},{id:'b',name:'Profile B'}],objects:[{id:'feature',name:'Loft',generation:{sources:['a','loop:["a","b"]','missing'],outdated:true}},{id:'unique',name:'Independent',generation:{sources:['a'],detached:true}}]},before=JSON.stringify(design),links=generationLinks(design);assert.equal(links.objects[0].sources.length,3);assert.equal(links.objects[0].sources[0].editable,true);assert.equal(links.objects[0].sources[2].missing,true);assert.equal(links.objects[1].sources.length,0);assert.equal(links.guides[0].dependents.length,1);assert.equal(JSON.stringify(design),before);});
test('read-only link inspection exposes existing provenance without changing revision or undo',()=>{const site=new Site(emptyProject());site.design.guides=[{id:'g',name:'Source'}];site.design.objects=[{id:'o',name:'Result',generation:{sources:['g']}}];const api=new DesignAPI({getSite:()=>site}),r=api.execute({method:'generation.links'});assert.ok(r.ok);assert.equal(r.value.objects[0].sources[0].id,'g');assert.equal(api.revision,0);assert.equal(site.undo.length,0);});
