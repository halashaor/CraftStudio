export function segmentMetrics(points){
 if(!Array.isArray(points)||points.length!==2||points.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n))))throw Error('测量需要两个有效的三维坐标');
 const delta=points[1].map((n,a)=>n-points[0][a]),distance=Math.hypot(...delta),horizontal=Math.hypot(delta[0],delta[2]);if(!Number.isFinite(distance))throw Error('测量距离超出可计算范围');
 return{delta,distance,horizontal,rise:delta[1],manhattan:delta.reduce((n,v)=>n+Math.abs(v),0),slopePercent:horizontal?delta[1]/horizontal*100:null,pitchDegrees:Math.atan2(delta[1],horizontal)*180/Math.PI};
}
export function measurementMetrics(points,kind='distance'){
 if(kind==='distance')return segmentMetrics(points);
 if(!['angle','path'].includes(kind))throw Error('不支持的测量类型');
 if(!Array.isArray(points)||points.length<2||points.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n))))throw Error('测量需要有效的三维坐标');
 const segments=points.slice(1).map((p,i)=>segmentMetrics([points[i],p]));
 if(kind==='angle'){
  if(points.length!==3)throw Error('夹角需要三个点，中间点为顶点');
  const lengths=segments.map(s=>s.distance);if(lengths.some(n=>n<1e-8))throw Error('角的两条边不能为零长度');
  const a=points[0].map((n,i)=>(n-points[1][i])/lengths[0]),b=points[2].map((n,i)=>(n-points[1][i])/lengths[1]),dot=a.reduce((v,n,i)=>v+n*b[i],0);
  return{angleDegrees:Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI,armLengths:lengths};
 }
 const totalLength=segments.reduce((n,s)=>n+s.distance,0);if(!Number.isFinite(totalLength))throw Error('测量总长超出可计算范围');
 return{totalLength,segmentCount:segments.length,segments,chordLength:segmentMetrics([points[0],points.at(-1)]).distance,rise:points.at(-1)[1]-points[0][1],ascent:segments.reduce((n,s)=>n+Math.max(0,s.rise),0),descent:segments.reduce((n,s)=>n+Math.max(0,-s.rise),0)};
}
export function measurementMutation(site,method,p){
 const list=site.design.measurements||[];
 if(method==='measurements.remove'){if(!list.some(m=>m.id===p.id))throw Error('测量标注已不存在');site.design.measurements=list.filter(m=>m.id!==p.id);return{removed:p.id};}
 const item=structuredClone(p.measurement);measurementMetrics(item?.points,item?.kind);if(typeof item.name!=='string'||!item.name.trim())throw Error('请填写测量名称');item.name=item.name.trim();
 if(p.space==='world'){if(!site.originConfirmed)throw Error('请先确认世界原点');item.points=item.points.map(pos=>pos.map((n,a)=>n-site.origin[a]));}
 if(item.id&&!list.some(m=>m.id===item.id))throw Error('测量标注已不存在，请重新选择');item.id=item.id||crypto.randomUUID();const index=list.findIndex(m=>m.id===item.id);site.design.measurements=structuredClone(list);if(index<0)site.design.measurements.push(item);else site.design.measurements[index]=item;return{measurement:item,metrics:measurementMetrics(item.points,item.kind)};
}
export function listedMeasurements(site,space='local'){
 if(space==='world'&&!site.originConfirmed)throw Error('请先确认世界原点');return(site.design.measurements||[]).map(item=>({...structuredClone(item),points:item.points.map(pos=>space==='world'?pos.map((n,a)=>n+site.origin[a]):[...pos]),metrics:measurementMetrics(item.points,item.kind)}));
}
