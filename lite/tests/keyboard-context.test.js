import test from 'node:test';
import assert from 'node:assert/strict';
import {textEditing,historyShortcut} from '../src/keyboard-context.js';
test('text editors retain clipboard, deletion and undo while non-text controls allow shortcuts',()=>{
 for(const e of [{tagName:'INPUT',type:'number'},{tagName:'INPUT',type:'search'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{isContentEditable:true},{closest:()=>({getAttribute:()=> 'true'})}])assert.equal(textEditing(e),true);
 for(const e of [{tagName:'BUTTON'},{tagName:'CANVAS'},{tagName:'INPUT',type:'checkbox'},{tagName:'DIV',closest:()=>({getAttribute:()=> 'false'})},null])assert.equal(textEditing(e),false);
});
test('undo and redo use conventional modifier combinations without plain-key fallthrough',()=>{
 const e={key:'z',ctrlKey:true};assert.equal(historyShortcut(e),'undo');assert.equal(historyShortcut({...e,shiftKey:true}),'redo');assert.equal(historyShortcut({...e,ctrlKey:false,metaKey:true}),'undo');assert.equal(historyShortcut({...e,key:'y'}),'redo');assert.equal(historyShortcut({...e,altKey:true}),null);assert.equal(historyShortcut({key:'z'}),null);
});
