import test from 'node:test';
import assert from 'node:assert/strict';
import {textEditing,historyShortcut,nativeSpaceTarget,dialogOwnsKeyboard} from '../src/keyboard-context.js';
test('modal dialogs own keyboard context while docked panels do not',()=>{
 assert.equal(dialogOwnsKeyboard({querySelector:selector=>selector==='dialog:modal'?{}:null}),true);
 assert.equal(dialogOwnsKeyboard({querySelector:()=>null}),false);
 assert.equal(dialogOwnsKeyboard({}),false);
});
test('text editors retain clipboard, deletion and undo while non-text controls allow shortcuts',()=>{
 for(const e of [{tagName:'INPUT',type:'number'},{tagName:'INPUT',type:'search'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{isContentEditable:true},{closest:()=>({getAttribute:()=> 'true'})}])assert.equal(textEditing(e),true);
 for(const e of [{tagName:'BUTTON'},{tagName:'CANVAS'},{tagName:'INPUT',type:'checkbox'},{tagName:'DIV',closest:()=>({getAttribute:()=> 'false'})},null])assert.equal(textEditing(e),false);
});
test('undo and redo use conventional modifier combinations without plain-key fallthrough',()=>{
 const e={key:'z',ctrlKey:true};assert.equal(historyShortcut(e),'undo');assert.equal(historyShortcut({...e,shiftKey:true}),'redo');assert.equal(historyShortcut({...e,ctrlKey:false,metaKey:true}),'undo');assert.equal(historyShortcut({...e,key:'y'}),'redo');assert.equal(historyShortcut({...e,altKey:true}),null);assert.equal(historyShortcut({key:'z'}),null);
});

test('Space activates focused controls while the viewport retains its navigation shortcut',()=>{for(const element of [{tagName:'BUTTON'},{tagName:'INPUT',type:'checkbox'},{tagName:'INPUT',type:'range'},{tagName:'A'},{isContentEditable:true},{tagName:'SPAN',closest:selector=>selector==='[contenteditable]'?null:{tagName:'BUTTON'}}])assert.equal(nativeSpaceTarget(element),true);for(const element of [{tagName:'CANVAS'},{tagName:'DIV',closest:()=>null},null])assert.equal(nativeSpaceTarget(element),false);});
