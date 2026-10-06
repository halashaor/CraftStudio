import {coords,chunkKey} from './site.js';
export class CheckpointPackets{
 constructor(){this.previous=null;}
 capture(site,{workspaceId,revision,baseKey,cachedRevision,cachedWorkspaceId,allowDelta=false}){
  const meta={workspaceId,revision,baseKey};
  if(cachedRevision===revision&&cachedWorkspaceId===workspaceId)return{...meta,cached:true};
  const old=this.previous,header={...site.packHeader(),size:[...site.size]},roots=new Map(site.overlay.chunks);
  let packet;
  if(allowDelta&&old?.workspaceId===workspaceId&&old.baseKey===baseKey&&old.revision===cachedRevision&&cachedWorkspaceId===workspaceId){
   const chunks=[];for(const id of new Set([...old.roots.keys(),...roots.keys()]))if(old.roots.get(id)!==roots.get(id)){const map=roots.get(id),reference=map?.keys().next().value??old.roots.get(id).keys().next().value;chunks.push({key:chunkKey(coords(reference)),blocks:map?[...map.values()].map(b=>({...b,state:b.state<0?null:site.palette[b.state]})):[]});}
   packet={...meta,mode:'chunks',baseRevision:old.revision,snapshot:header,chunks};
  }else packet={...meta,snapshot:{...header,overlay:[...site.overlay.values()].map(b=>({...b,state:b.state<0?null:site.palette[b.state]}))}};
  this.previous={...meta,roots};return packet;
 }
}
