import {coordKey,coords} from './site.js';
const validBounds=r=>r?.min?.length===3&&r?.max?.length===3&&r.min.every((n,a)=>Number.isInteger(n)&&Number.isInteger(r.max[a])&&n>=0&&r.max[a]<4096&&n<=r.max[a]);
export function selectionPredicate(selection,{axes=[0,1,2]}={}){
 if(!Array.isArray(axes)||!axes.length||axes.some(a=>![0,1,2].includes(a)))throw Error('投影轴无效');const key=pos=>coordKey(...pos.map((n,a)=>axes.includes(a)?n:0));
 if(!selection)return()=>true;if(selection.regions&&!validBounds(selection))throw Error('组合选区需要有效外接范围');
 const entries=selection.regions||[{...selection,operation:'replace'}];if(!Array.isArray(entries)||!entries.length)throw Error('选区需要至少一个区域');
 const regions=entries.map((r,i)=>{if(!(validBounds(r)||r.members&&r.min===undefined&&r.max===undefined)||!['replace','add','subtract','intersect'].includes(r.operation||'replace'))throw Error('选区区域或组合方式无效');if(r.members!==undefined&&r.members!==null&&(!Array.isArray(r.members)||r.members.some(p=>Array.isArray(p)?p.length!==3||p.some(n=>!Number.isInteger(n)||n<0||n>=4096):!Number.isInteger(p)||p<0||p>=4096**3)))throw Error('选区成员坐标无效');return{min:[0,0,0],max:[4095,4095,4095],...r,operation:r.operation||'replace',keys:r.members?new Set(r.members.map(p=>key(Array.isArray(p)?p:coords(p)))):null};});
 return pos=>{if(selection.min&&selection.max&&axes.some(a=>pos[a]<selection.min[a]||pos[a]>selection.max[a]))return false;let result=false;for(const r of regions){const inside=axes.every(a=>pos[a]>=r.min[a]&&pos[a]<=r.max[a])&&(!r.keys||r.keys.has(key(pos)));result=r.operation==='replace'?inside:r.operation==='add'?result||inside:r.operation==='subtract'?result&&!inside:result&&inside;}return result;};
}
export function combineSelection(current,incoming,operation='replace'){
 selectionPredicate(incoming);if(!['replace','add','subtract','intersect'].includes(operation))throw Error('未知选区组合方式');
 const region={min:[...incoming.min],max:[...incoming.max],...(incoming.members?{members:structuredClone(incoming.members)}:{})};
 if(operation==='replace'||!current&&operation==='add')return{...region,regions:[{...region,operation:'replace'}]};
 if(!current)return{...region,members:[],regions:[{...region,members:[],operation:'replace'}]};
 const regions=structuredClone(current.regions||[{...current,operation:'replace'}]);regions.push({...region,operation});
 const min=current.min.map((n,a)=>operation==='add'?Math.min(n,region.min[a]):n),max=current.max.map((n,a)=>operation==='add'?Math.max(n,region.max[a]):n);
 return{min,max,regions};
}
