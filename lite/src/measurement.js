export function segmentMetrics(points){
 if(!Array.isArray(points)||points.length!==2||points.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n))))throw Error('测量需要两个有效的三维坐标');
 const delta=points[1].map((n,a)=>n-points[0][a]),distance=Math.hypot(...delta),horizontal=Math.hypot(delta[0],delta[2]);if(!Number.isFinite(distance))throw Error('测量距离超出可计算范围');
 return{delta,distance,horizontal,rise:delta[1],manhattan:delta.reduce((n,v)=>n+Math.abs(v),0),slopePercent:horizontal?delta[1]/horizontal*100:null,pitchDegrees:Math.atan2(delta[1],horizontal)*180/Math.PI};
}
export function measurementMutation(site,method,p){
 const list=site.design.measurements||[];
 if(method==='measurements.remove'){if(!list.some(m=>m.id===p.id))throw Error('测量标注已不存在');site.design.measurements=list.filter(m=>m.id!==p.id);return{removed:p.id};}
 const item=structuredClone(p.measurement);segmentMetrics(item?.points);if(typeof item.name!=='string'||!item.name.trim())throw Error('请填写测量名称');item.name=item.name.trim();
 if(p.space==='world'){if(!site.originConfirmed)throw Error('请先确认世界原点');item.points=item.points.map(pos=>pos.map((n,a)=>n-site.origin[a]));}
 if(item.id&&!list.some(m=>m.id===item.id))throw Error('测量标注已不存在，请重新选择');item.id=item.id||crypto.randomUUID();const index=list.findIndex(m=>m.id===item.id);site.design.measurements=structuredClone(list);if(index<0)site.design.measurements.push(item);else site.design.measurements[index]=item;return{measurement:item,metrics:segmentMetrics(item.points)};
}
export function listedMeasurements(site,space='local'){
 if(space==='world'&&!site.originConfirmed)throw Error('请先确认世界原点');return(site.design.measurements||[]).map(item=>({...structuredClone(item),points:item.points.map(pos=>space==='world'?pos.map((n,a)=>n+site.origin[a]):[...pos]),metrics:segmentMetrics(item.points)}));
}
