const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite),distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const sub=(a,b)=>a.map((n,i)=>n-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const bounds=segment=>({min:segment.a.map((n,i)=>Math.min(n,segment.b[i])),max:segment.a.map((n,i)=>Math.max(n,segment.b[i]))});
export function segmentIntersection(a,b,c,d){
 const u=sub(b,a),v=sub(d,c),w=sub(a,c),aa=dot(u,u),bb=dot(u,v),cc=dot(v,v),dd=dot(u,w),ee=dot(v,w),det=aa*cc-bb*bb;
 if(!aa||!cc||det<=1e-12*aa*cc)return null;
 const t=(bb*ee-cc*dd)/det,s=(aa*ee-bb*dd)/det;
 if(t< -1e-8||t>1+1e-8||s< -1e-8||s>1+1e-8)return null;
 const p=a.map((n,i)=>n+Math.max(0,Math.min(1,t))*u[i]),q=c.map((n,i)=>n+Math.max(0,Math.min(1,s))*v[i]);
 return distance(p,q)<=1e-6?p.map((n,i)=>(n+q[i])/2):null;
}
export function guideSnapSegments(guides){
 return guides.filter(g=>!g.hidden).flatMap(g=>(g.paths?.length?g.paths:[g.points]).flatMap(path=>Array.isArray(path)?path.slice(1).flatMap((point,i)=>valid(point)&&valid(path[i])&&distance(point,path[i])>1e-8?[{a:path[i],b:point,guideId:g.id,name:g.name||'辅助线',...bounds({a:path[i],b:point})}]:[]):[]));
}
export function nearbyIntersections(segments,{pointer,project,radius=12,excludeId=null,plane=null}){
 const near=segments.filter(segment=>{
  if(segment.guideId===excludeId)return false;
  if(plane){const a=dot(sub(segment.a,plane.origin),plane.normal),b=dot(sub(segment.b,plane.origin),plane.normal);if(a>1e-4&&b>1e-4||a< -1e-4&&b< -1e-4)return false;}
  const a=project(segment.a),b=project(segment.b);
  if(!a||!b||[...a,...b].some(n=>!Number.isFinite(n)))return false;
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((pointer[0]-a[0])*dx+(pointer[1]-a[1])*dy)/length)):0;
  return Math.hypot(a[0]+t*dx-pointer[0],a[1]+t*dy-pointer[1])<=radius;
 }).map(segment=>segment.min&&segment.max?segment:{...segment,...bounds(segment)}),targets=[];
 // Only pairs near the cursor are tested, rather than all pairs in the project.
 for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){
  const a=near[i],b=near[j];
  if(a.min.some((n,axis)=>n>b.max[axis]+1e-6||a.max[axis]<b.min[axis]-1e-6))continue;
  const point=segmentIntersection(a.a,a.b,b.a,b.b);
  if(point)targets.push({kind:'intersection',point,guideId:a.guideId,sourceIds:[a.guideId,b.guideId],name:a.guideId===b.guideId?a.name:a.name+' × '+b.name});
 }
 return targets;
}
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
   if(['polygon','polyline','spline'].includes(g.recipe?.kind))for(const point of g.recipe.points||[])add('endpoint',point);
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
export function nearestScreenSnap(targets,{pointer,project,radius=12,plane=null,kinds=['endpoint','intersection','midpoint','center']}){let best=null,bestDistance=radius;const priority={endpoint:0,intersection:1,midpoint:2,center:3};for(const target of targets){if(!kinds.includes(target.kind))continue;if(plane&&Math.abs(target.point.reduce((n,v,a)=>n+(v-plane.origin[a])*plane.normal[a],0))>1e-4)continue;const p=project(target.point);if(!p||p.some(n=>!Number.isFinite(n))||p[2]<-1||p[2]>1)continue;const d=Math.hypot(p[0]-pointer[0],p[1]-pointer[1]);if(d<bestDistance||best&&Math.abs(d-bestDistance)<1e-6&&priority[target.kind]<priority[best.kind]){bestDistance=d;best=target;}}return best?{...best,point:[...best.point],pixelDistance:bestDistance}:null;}
