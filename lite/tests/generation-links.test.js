import test from 'node:test';import assert from 'node:assert/strict';import {generationLinks} from '../src/generation-links.js';import {DesignAPI} from '../src/foundation.js';import {Site} from '../src/site.js';import {emptyProject} from '../src/codec.js';
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
