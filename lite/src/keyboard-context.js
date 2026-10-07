// Text fields own their native clipboard, deletion and undo shortcuts.
export function dialogOwnsKeyboard(document=globalThis.document){return !!document?.querySelector?.('dialog:modal');}
export function textEditing(element){
 if(!element)return false;
 if(element.isContentEditable)return true;
 const editable=element.closest?.('[contenteditable]');
 if(editable&&['','true','plaintext-only'].includes(editable.getAttribute('contenteditable')))return true;
 const tag=element.tagName?.toUpperCase();
 if(tag==='TEXTAREA'||tag==='SELECT')return true;
 return tag==='INPUT'&&!['checkbox','radio','range','color','file','button','submit','reset'].includes(element.type);
}
export function historyShortcut(event){
 if(!event.ctrlKey&&!event.metaKey||event.altKey)return null;
 const key=event.key.toLowerCase();
 return key==='z'?(event.shiftKey?'redo':'undo'):key==='y'?'redo':null;
}

// Space remains the native activation key for focused controls.
export function nativeSpaceTarget(element){if(textEditing(element))return true;const tag=element?.tagName?.toUpperCase();if(['BUTTON','INPUT','SELECT','TEXTAREA','A'].includes(tag))return true;return !!element?.closest?.('button,input,textarea,select,a[href],[role="button"],[role="checkbox"],[role="radio"],[role="slider"]');}
export const nativeEnterTarget=nativeSpaceTarget;
