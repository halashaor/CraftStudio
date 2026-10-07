import {Site,coordKey} from './site.js';
import {emptyProject} from './codec.js';
import {selectionCells} from './studio.js';
export function selectionPreviewSite(site,min,max,options={}){
 const{cells}=selectionCells(site,min,max,options),size=max.map((n,a)=>n-min[a]+1),fake=new Site({...emptyProject(),size,palette:[],blocks:[]}),members=[];
 // Mesh creation is synchronous and read-only; do not clone full state/NBT records.
 fake.palette=site.palette;
 for(const b of cells){const pos=b.pos.map((n,a)=>n-min[a]);members.push(pos);fake.cells.set(coordKey(...pos),{pos,state:b.state});}
 return{site:fake,members,size,count:cells.length};
}
