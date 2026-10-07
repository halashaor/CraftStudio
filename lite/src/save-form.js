const fields={title:'save-title',tags:'save-tags',kind:'save-kind',note:'save-note'};
export function readSaveForm(value){
 if(value?.schema!=='craftstudio-save-form/1'||!Object.keys(fields).every(k=>typeof value[k]==='string'))return null;
 return{schema:value.schema,...Object.fromEntries(Object.keys(fields).map(k=>[k,value[k]]))};
}
export function captureSaveForm($){return{schema:'craftstudio-save-form/1',...Object.fromEntries(Object.entries(fields).map(([k,id])=>[k,$(id).value]))};}
export function restoreSaveForm($,value){const form=readSaveForm(value);if(!form)return false;for(const[k,id]of Object.entries(fields)){const input=$(id);if(k==='kind'&&!Array.from(input.options).some(o=>o.value===form[k]))input.add(new Option('未识别类型 · '+form[k],form[k]));input.value=form[k];}return true;}
