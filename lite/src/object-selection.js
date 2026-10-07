export function combineObjectIds(current,incoming,operation='replace'){
 const before=new Set(current),next=new Set(incoming);
 if(operation==='replace')return next;
 if(operation==='add')return new Set([...before,...next]);
 if(operation==='subtract')return new Set([...before].filter(id=>!next.has(id)));
 if(operation==='intersect')return new Set([...before].filter(id=>next.has(id)));
 throw Error('未知对象选择组合');
}
