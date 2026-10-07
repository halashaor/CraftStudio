export class PreviewHistory{
 constructor(){this.clear();}
 clear(){this.undo=[];this.redo=[];}
 record(before,after){if(JSON.stringify(before)===JSON.stringify(after))return false;this.undo.push(structuredClone(before));this.redo=[];return true;}
 step(direction,current){const from=direction==='undo'?this.undo:this.redo,to=direction==='undo'?this.redo:this.undo;if(!from.length)return null;to.push(structuredClone(current));return structuredClone(from.pop());}
}
