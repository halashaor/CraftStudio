import {coordKey,coords} from './site.js';
import {stateKey} from './codec.js';
import {rotateState} from './studio.js';
import {instancePose,instancePoint,canonicalPoint,composeInstancePose} from './instance-transform.js';
const clone=v=>structuredClone(v);
const value=(site,pos)=>{const b=site.at(pos);return b?{state:clone(site.palette[b.state]),nbt:clone(b.nbt||null)}:null;};
const same=(a,b)=>!a&&!b||!!a&&!!b&&stateKey(a.state)===stateKey(b.state)&&JSON.stringify(a.nbt||null)===JSON.stringify(b.nbt||null);
const op=(pos,v)=>({type:'set',pos:[...pos],state:v?.state||null,nbt:v?.nbt||null,reason:'组件定义更新'});
function box(points){if(!points.length)return{};return{min:[0,1,2].map(a=>points.reduce((n,p)=>Math.min(n,p[a]),Infinity)),max:[0,1,2].map(a=>points.reduce((n,p)=>Math.max(n,p[a]),-Infinity))};}
export function registerLinkedInstance(site,design,original,prefab,cloneObject,at,{turn=0,mirror=false}={}){
 if(!original.id)throw Error('先将组件源建立为对象');design.componentDefinitions||=[];
 const family=site.design.objects.find(o=>o.id===original.id)?.instanceOf||original.instanceOf||original.id,root=design.objects.find(o=>o.id===original.id);let definition=design.componentDefinitions.find(d=>d.id===family);
 if(!definition){definition={id:family,name:original.name,revision:0,blocks:clone(prefab.blocks)};design.componentDefinitions.push(definition);root.instancePose=instancePose(prefab.size,original.min,0,false);root.componentRecords=prefab.blocks.map(b=>({pos:b.pos.map((n,a)=>n+original.min[a]),before:null,after:{state:clone(b.state),nbt:clone(b.nbt||null)}}));}
 root.instanceOf=family;root.instanceTransform||={turn:0,mirror:false};cloneObject.instanceOf=family;cloneObject.instanceTransform={turn,mirror};const outer=instancePose(prefab.size,at,turn,mirror);cloneObject.instancePose=composeInstancePose(root.instancePose,p=>instancePoint(p.map((n,a)=>n-original.min[a]),outer),turn,mirror);cloneObject.instanceTransform={turn:cloneObject.instancePose.turn,mirror:cloneObject.instancePose.mirror};cloneObject.componentRevision=definition.revision;
 const targetBlocks=new Map(prefab.blocks.map(b=>[coordKey(...instancePoint(b.pos,outer)),b]));cloneObject.componentRecords=cloneObject.cells.map(k=>{const pos=coords(k),block=targetBlocks.get(k);return{pos,before:value(site,pos),after:{state:rotateState(block.state,turn,mirror),nbt:clone(block.nbt||null)}};});
 if(cloneObject.generation)cloneObject.generation={...cloneObject.generation,detached:true};
}
export function componentUpdatePlan(site,source,{manualStrategy='preserve',expandSelection=null}={}){
 const definition=site.design.componentDefinitions?.find(d=>d.id===source.instanceOf);if(!definition||!source.instancePose)throw Error('旧关联实例缺少组件定义，请先建立新的关联组件');
 if(!['preserve','overwrite'].includes(manualStrategy))throw Error('手改处理方式无效');
 if(expandSelection&&(!expandSelection.min||!expandSelection.max||expandSelection.min.length!==3||expandSelection.max.length!==3||expandSelection.min.some((n,a)=>!Number.isInteger(n)||!Number.isInteger(expandSelection.max[a])||n<0||expandSelection.max[a]>=4096||n>expandSelection.max[a])||expandSelection.max.reduce((v,n,a)=>v*(n-expandSelection.min[a]+1),1)>1000000))throw Error('组件编辑范围无效或过大');const keys=expandSelection?expandSelection.members||(()=>{const k=[];for(let x=expandSelection.min[0];x<=expandSelection.max[0];x++)for(let y=expandSelection.min[1];y<=expandSelection.max[1];y++)for(let z=expandSelection.min[2];z<=expandSelection.max[2];z++)k.push(coordKey(x,y,z));return k;})():source.cells;
 const blocks=keys.map(k=>{const pos=coords(k),v=value(site,pos);if(!v)return null;if(v.nbt&&((source.instancePose.turn||0)||source.instancePose.mirror))throw Error('带原生方块实体数据的旋转实例不能作为定义来源');return{pos:canonicalPoint(pos,source.instancePose),state:rotateState(rotateState(v.state,4-(source.instancePose.turn||0),false),0,source.instancePose.mirror),...(v.nbt?{nbt:v.nbt}:{})};}).filter(Boolean);
 if(!blocks.length)throw Error('组件定义没有方块');const design=clone(site.design),touched=new Map(),warnings=[],siblings=design.objects.filter(o=>o.instanceOf===source.instanceOf),revision=definition.revision+1;let kept=0;
 for(const object of siblings){if(object.locked)throw Error('关联组件中有锁定对象：'+object.name);if(!object.instancePose||!object.componentRecords)throw Error('实例缺少放置记录：'+object.name);
  if(object.id===source.id){object.cells=keys.filter(k=>site.at(coords(k)));Object.assign(object,box(object.cells.map(coords)));const oldSourceRecords=new Map(object.componentRecords.map(r=>[coordKey(...r.pos),r]));object.componentRecords=object.cells.map(k=>({pos:coords(k),before:oldSourceRecords.get(k)?.before||null,after:value(site,coords(k))}));object.componentRevision=revision;continue;}
  if(blocks.some(b=>b.nbt)&&((object.instancePose.turn||0)||object.instancePose.mirror))throw Error('原生方块实体组件的旋转需使用原生蓝图');
  const old=new Map(object.componentRecords.map(r=>[coordKey(...r.pos),r])),desired=new Map(blocks.map(b=>{const pos=instancePoint(b.pos,object.instancePose);if(pos.some(n=>n<0||n>=4096||!Number.isInteger(n)))throw Error('组件更新超出画布');return[coordKey(...pos),{pos,after:{state:rotateState(b.state,object.instancePose.turn,object.instancePose.mirror),nbt:clone(b.nbt||null)}}];})),records=[];
  for(const key of new Set([...old.keys(),...desired.keys()])){const prev=old.get(key),next=desired.get(key),pos=next?.pos||prev.pos,live=value(site,pos);
   if(manualStrategy==='preserve'&&prev&&(prev.manual||!same(live,prev.after))){records.push({...prev,after:live,manual:true});kept++;continue;}
   if(!prev&&live&&!same(live,next?.after))throw Error('组件扩大后会覆盖其他内容：'+pos.join(', '));
   const after=next?.after||prev.before||null,before=prev?prev.before:live;
   const request=op(pos,after);if(touched.has(key)&&!same(touched.get(key).after,after))throw Error('关联组件更新目标互相冲突');touched.set(key,{operation:request,after});
   if(next)records.push({pos,before,after});
  }
  object.componentRecords=records;object.cells=records.map(r=>coordKey(...r.pos));Object.assign(object,box(records.map(r=>r.pos)));object.componentRevision=revision;if(object.generation)object.generation={...object.generation,detached:true};
 }
 design.componentDefinitions=design.componentDefinitions.map(d=>d.id===definition.id?{...d,blocks,revision}:d);if(kept)warnings.push('保留 '+kept+' 个其他实例的局部手改或删除');
 return{operations:[...touched.values()].filter(r=>!same(value(site,r.operation.pos),r.after)).map(r=>r.operation),design,guide:[],warnings,usedRoles:{},componentUpdate:{instances:siblings.length,revision,preserved:kept}};
}

export function makeUniqueComponentPlan(site,source){
 if(!source.instanceOf||!source.instancePose)throw Error('请选择有组件定义的关联实例');
 const blocks=source.cells.map(k=>{const pos=coords(k),v=value(site,pos);if(!v)return null;if(v.nbt&&((source.instancePose.turn||0)||source.instancePose.mirror))throw Error('带原生方块实体的旋转组件不能重新定义');return{pos:canonicalPoint(pos,source.instancePose),state:rotateState(rotateState(v.state,4-(source.instancePose.turn||0),false),0,source.instancePose.mirror),...(v.nbt?{nbt:v.nbt}:{})};}).filter(Boolean);
 if(!blocks.length)throw Error('组件没有方块');const design=clone(site.design),id=crypto.randomUUID(),name=source.name+' · 独立组件';design.componentDefinitions||=[];design.componentDefinitions.push({id,name,revision:0,blocks});const object=design.objects.find(o=>o.id===source.id);object.instanceOf=id;object.componentRevision=0;object.componentRecords=object.cells.map(k=>({pos:coords(k),before:null,after:value(site,coords(k))}));
 return{operations:[],design,guide:[],warnings:['已建立独立组件定义；原关联组保持原样'],usedRoles:{}};
}
