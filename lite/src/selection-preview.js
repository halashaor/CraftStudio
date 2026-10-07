import {Site,coordKey} from './site.js';
import {emptyProject} from './codec.js';
import {selectionCells} from './studio.js';
export function packMemberCoordinates(members){
 const data=new Uint16Array(members.length*3);
 for(let i=0;i<members.length;i++){
  const p=members[i];if(p.length!==3||p.some(n=>!Number.isInteger(n)||n<0||n>4095))throw Error('选区方块坐标无效');
  data.set(p,i*3);
 }
 return data;
}
export function* memberCoordinates(members){
 if(ArrayBuffer.isView(members)){if(members.length%3)throw Error('选区坐标数据不完整');for(let i=0;i<members.length;i+=3)yield[members[i],members[i+1],members[i+2]];}
 else yield*members;
}
export function selectionPreviewSite(site,min,max,options={}){
 const{cells}=selectionCells(site,min,max,options),size=max.map((n,a)=>n-min[a]+1),fake=new Site({...emptyProject(),size,palette:[],blocks:[]}),members=[];
 // Mesh creation is synchronous and read-only; do not clone full state/NBT records.
 fake.palette=site.palette;
 for(const b of cells){const pos=b.pos.map((n,a)=>n-min[a]);members.push(pos);fake.cells.set(coordKey(...pos),{pos,state:b.state});}
 return{site:fake,members,size,count:cells.length};
}
