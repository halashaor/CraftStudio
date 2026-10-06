import {closedProfiles} from './sketch-profiles.js';
export function guideActions(guides,id,profiles=closedProfiles(guides)){
 const guide=guides.find(g=>g.id===id);
 if(!guide)return{extrude:{reason:'草图已不存在'},sweep:{reason:'草图已不存在'}};
 const matches=profiles.filter(p=>p.id===id||p.sourceIds?.includes(id));
 const extrude=matches.length===1?{profileId:matches[0].id,sourceIds:matches[0].sourceIds||[id]}:{reason:matches.length?'轮廓关联不唯一，请在建模面板选择':'需要闭合且共面的轮廓；可连接多段线围成轮廓'};
 const points=guide.points||[],valid=points.length>=2&&points.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite))&&points.some(p=>Math.hypot(...p.map((v,a)=>v-points[0][a]))>1e-4);
 return{extrude,sweep:valid?{pathId:id}:{reason:'路径需要至少两个不同的有效位置'}};
}
