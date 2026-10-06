import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {Site,coordKey} from '../lite/src/site.js';
import {stateKey} from '../lite/src/codec.js';
import {VoxelOverlayMap} from '../lite/src/voxel-overlay-map.js';
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const encode=value=>gzipSync(JSON.stringify(value),{level:1,mtime:0});
export const decode=bytes=>JSON.parse(gunzipSync(bytes).toString('utf8'));
export function references(head){
 if(head?.schema!=='craftstudio-engine-checkpoint/1'||typeof head.workspaceId!=='string'||!head.workspaceId||!Number.isSafeInteger(head.revision)||head.revision<0)throw Error('Invalid engine checkpoint');
 const ids=[head.base,head.assets];for(const row of head.archives)ids.push(row.id);
 for(const frame of [head,...head.undo,...head.redo])for(const [bucket,id]of frame.overlay){if(!Number.isInteger(bucket)||bucket<0||bucket>0xffffff)throw Error('Invalid overlay bucket');ids.push(id);}
 if(ids.some(id=>typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id)))throw Error('Invalid checkpoint blob reference');return[...new Set(ids)];
}
export class EngineCheckpoint{
 constructor(){this.memo=new WeakMap();this.resourceStamp=null;this.resourceRecord=null;}
 capture({site,api,resources,libraryResources,baseKey},data={}){
  const known=new Set(data.known||[]),blobs=new Map();
  const blob=bytes=>{const id=digest(bytes);if(!known.has(id))blobs.set(id,{id,bytes});return id;};
  const memo=(object,make)=>{let record=this.memo.get(object);if(!record){const bytes=make();record={id:digest(bytes),bytes};this.memo.set(object,record);}if(!known.has(record.id))blobs.set(record.id,record);return record.id;};
  const overlay=value=>{value.owned.clear();return[...value.chunks].map(([bucket,root])=>[bucket,memo(root,()=>encode([...root]))]);};
  const frame=value=>({overlay:overlay(value.overlay),size:[...value.size],design:structuredClone(value.design)});
  const archiveNames=new Set(libraryResources.map(file=>file.name)),covered=!resources.files.size||libraryResources.length>0&&resources.sources.every(source=>archiveNames.has(source.name));
  const stamp=[api.workspaceId,resources.version,...(covered?[]:[resources.partialVersion,site.palette.length])].join(':');
  if(stamp!==this.resourceStamp||this.resourceRecord?.owner!==resources){this.resourceStamp=stamp;this.resourceRecord={owner:resources,bytes:encode(covered?resources.saved:resources.bundle(site.palette))};this.resourceRecord.id=digest(this.resourceRecord.bytes);}
  const assets=blob(this.resourceRecord.bytes),archives=libraryResources.map(file=>({name:file.name,id:memo(file.bytes,()=>Buffer.from(new Uint8Array(file.bytes)))}));
  const receipts=[...api.receipts].filter(([,record])=>{const method=JSON.parse(record.fingerprint).method;return!method.startsWith('transaction.')||method==='transaction.commit';});
  const head={schema:'craftstudio-engine-checkpoint/1',base:memo(site.base,()=>encode(site.base)),baseKey,workspaceId:api.workspaceId,revision:api.revision,site:{...site.packHeader(),size:[...site.size]},overlay:overlay(site.overlay),undo:site.undo.map(frame),redo:site.redo.map(frame),assets,archives,receipts};
  references(head);return{head,blobs:[...blobs.values()]};
 }
 restore({head,blobs}){
  const records=new Map(blobs.map(b=>[b.id,b.bytes]));for(const id of references(head))if(!records.has(id)||digest(records.get(id))!==id)throw Error('Missing or corrupt engine blob');
  const site=new Site(decode(records.get(head.base))),header=head.site;
  site.palette=structuredClone(header.palette);site.states=new Map(site.palette.map((s,i)=>[stateKey(s),i]));
  const roots=new Map(),overlay=refs=>{const value=new VoxelOverlayMap();for(const [bucket,id]of refs){let cached=roots.get(id),root=cached?.root;if(cached&&cached.bucket!==bucket)throw Error('Invalid chunk grouping');if(!root){const entries=decode(records.get(id)),checked=new VoxelOverlayMap();for(const [key,b]of entries){if(!Array.isArray(b.pos)||b.pos.length!==3||b.pos.some(n=>!Number.isInteger(n)||n<0||n>=4096)||coordKey(...b.pos)!==key||!Number.isInteger(b.state)||b.state< -1||b.state>=site.palette.length)throw Error('Invalid checkpoint cell');checked.set(key,b);}if(checked.chunks.size!==1||!checked.chunks.has(bucket))throw Error('Invalid chunk grouping');root=checked.chunks.get(bucket);roots.set(id,{root,bucket});this.memo.set(root,{id,bytes:records.get(id)});}if(value.chunks.has(bucket))throw Error('Duplicate chunk grouping');value.chunks.set(bucket,root);value.count+=root.size;}return value;};
  Object.assign(site,{title:header.title,origin:structuredClone(header.origin),originConfirmed:header.originConfirmed,protected:structuredClone(header.protected),sourceHash:header.sourceHash,design:structuredClone(header.design),size:[...header.size]});
  site.overlay=overlay(head.overlay);site.track(new VoxelOverlayMap(),site.overlay);site.undo=head.undo.map(v=>({...v,overlay:overlay(v.overlay),design:structuredClone(v.design)}));site.redo=head.redo.map(v=>({...v,overlay:overlay(v.overlay),design:structuredClone(v.design)}));site.endStroke();
  this.memo.set(site.base,{id:head.base,bytes:records.get(head.base)});
  return{site,workspaceId:head.workspaceId,revision:head.revision,baseKey:head.baseKey,receipts:structuredClone(head.receipts),assets:decode(records.get(head.assets)),files:head.archives.map(file=>({name:file.name,bytes:new Uint8Array(records.get(file.id)).buffer}))};
 }
}
