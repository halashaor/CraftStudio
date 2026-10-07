import test from 'node:test';import assert from 'node:assert/strict';import {combineObjectIds} from '../src/object-selection.js';
test('object selection combinations retain picking order and preserve their inputs',()=>{
 const before=['second','first'];assert.deepEqual([...combineObjectIds(before,['third','first'],'add')],['second','first','third']);
 assert.deepEqual([...combineObjectIds(before,['second'],'subtract')],['first']);
 assert.deepEqual([...combineObjectIds(before,['first'],'intersect')],['first']);
 assert.deepEqual([...combineObjectIds(before,['third'])],['third']);assert.deepEqual(before,['second','first']);
 assert.deepEqual([...combineObjectIds(['first'],['first'],'subtract')],[]);
});
