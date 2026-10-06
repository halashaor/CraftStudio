const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite),distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
export function pathMidpoint(points){const lengths=points.slice(1).map((p,i)=>distance(p,points[i])),total=lengths.reduce((a,b)=>a+b,0);if(!total)return[...points[0]];let remaining=total/2;for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i])return points[i].map((n,a)=>n+(points[i+1][a]-n)*remaining/lengths[i]);remaining-=lengths[i];}return[...points.at(-1)];}
export function guideSnapTargets(guides,{excludeId=null}={}){
 const targets=[];
 for(const g of guides){
  if(g.hidden||g.id===excludeId)continue;
  const add=(kind,point)=>{if(!valid(point)||targets.some(t=>t.guideId===g.id&&t.kind===kind&&distance(t.point,point)<1e-8))return;targets.push({kind,point:[...point],guideId:g.id,name:g.name||'辅助线'});};
  for(const path of g.paths?.length?g.paths:[g.points]){
   if(!Array.isArray(path)||path.length<2||!path.every(valid))continue;
   add('endpoint',path[0]);add('endpoint',path.at(-1));
   if(g.recipe?.kind!=='rectangle')add('midpoint',pathMidpoint(path));
   if(['polygon','polyline'].includes(g.recipe?.kind))for(const point of g.recipe.points||[])add('endpoint',point);
   if(g.recipe?.kind==='polyline'){const p=g.recipe.points||[];for(let i=0;i<p.length-1;i++)add('midpoint',p[i].map((n,a)=>(n+p[i+1][a])/2));if(g.recipe.closed&&p.length>2)add('midpoint',p.at(-1).map((n,a)=>(n+p[0][a])/2));}
   if(g.recipe?.kind==='rectangle'){
    const corners=[path[0]];
    for(let i=1;i<path.length-1;i++){
     const a=path[i].map((n,k)=>n-path[i-1][k]),b=path[i+1].map((n,k)=>n-path[i][k]),length=Math.hypot(...a)*Math.hypot(...b);
     if(length&&a.reduce((n,v,k)=>n+v*b[k],0)/length<.5){add('endpoint',path[i]);corners.push(path[i]);}
    }
    if(corners.length>=3){
     for(let i=0;i<corners.length;i++)add('midpoint',corners[i].map((n,a)=>(n+corners[(i+1)%corners.length][a])/2));
     add('center',[0,1,2].map(a=>corners.reduce((n,p)=>n+p[a],0)/corners.length));
    }else add('midpoint',pathMidpoint(path));
   }
  }
  if(['circle','ellipse','arc'].includes(g.recipe?.kind))add('center',g.recipe.points?.[0]);
 }
 return targets;
}
export function nearestScreenSnap(targets,{pointer,project,radius=12,plane=null,kinds=['endpoint','midpoint','center']}){let best=null,bestDistance=radius;const priority={endpoint:0,midpoint:1,center:2};for(const target of targets){if(!kinds.includes(target.kind))continue;if(plane&&Math.abs(target.point.reduce((n,v,a)=>n+(v-plane.origin[a])*plane.normal[a],0))>1e-4)continue;const p=project(target.point);if(!p||p.some(n=>!Number.isFinite(n))||p[2]<-1||p[2]>1)continue;const d=Math.hypot(p[0]-pointer[0],p[1]-pointer[1]);if(d<bestDistance||best&&Math.abs(d-bestDistance)<1e-6&&priority[target.kind]<priority[best.kind]){bestDistance=d;best=target;}}return best?{...best,point:[...best.point],pixelDistance:bestDistance}:null;}
