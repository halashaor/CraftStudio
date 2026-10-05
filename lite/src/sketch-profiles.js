import {workplane} from './workplane.js';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const tolerance=1e-4;
function planeOf(points){try{return workplane(points).plane;}catch{return null;}}
// Resolve source sketches on demand. Never weld a visible gap or alter saved guides.
export function closedProfiles(guides=[]){
 const result=[],edges=[],vertices=[];
 const vertex=p=>{let i=vertices.findIndex(v=>distance(v.point,p)<=tolerance);if(i<0){i=vertices.length;vertices.push({point:p,edges:[]});}return i;};
 for(const g of guides){
  if(!['line','bezier','arc','rectangle','circle','ellipse','polygon'].includes(g.recipe?.kind)||g.points?.length<2)continue;
  const points=g.points.filter((p,i)=>!i||distance(p,g.points[i-1])>tolerance);
  if(distance(points[0],points.at(-1))<=tolerance){const plane=planeOf(points);if(plane)result.push({...g,recipe:{...g.recipe,plane}});continue;}
  if(['rectangle','circle','ellipse','polygon'].includes(g.recipe.kind)){const plane=planeOf(points);if(plane)result.push({...g,recipe:{...g.recipe,plane}});continue;}
  const a=vertex(points[0]),b=vertex(points.at(-1)),i=edges.length;edges.push({g,points,a,b});vertices[a].edges.push(i);vertices[b].edges.push(i);
 }
 const seen=new Set();
 for(let start=0;start<edges.length;start++){
  if(seen.has(start))continue;
  const component=[],queue=[start];while(queue.length){const i=queue.pop();if(seen.has(i))continue;seen.add(i);component.push(i);const e=edges[i];queue.push(...vertices[e.a].edges,...vertices[e.b].edges);}
  if(component.some(i=>[edges[i].a,edges[i].b].some(v=>vertices[v].edges.length!==2)))continue;
  let index=start,at=edges[start].a;const used=new Set(),points=[];
  while(!used.has(index)){used.add(index);const e=edges[index],segment=e.a===at?e.points:[...e.points].reverse();points.push(...(points.length?segment.slice(1):segment));at=e.a===at?e.b:e.a;index=vertices[at].edges.find(i=>i!==index);}
  const plane=planeOf(points);if(!plane||distance(points[0],points.at(-1))>tolerance)continue;
  const sourceIds=component.map(i=>edges[i].g.id).sort();
  result.push({id:'loop:'+JSON.stringify(sourceIds),name:'闭合线框（'+sourceIds.length+' 段）',points,sourceIds,recipe:{kind:'polygon',plane,...(edges[start].g.recipe.workplane?{workplane:edges[start].g.recipe.workplane}:{})}});
 }
 return result;
}
