import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {Site,coordKey} from '../lite/src/site.js';
import {stateKey} from '../lite/src/codec.js';
import {VoxelOverlayMap} from '../lite/src/voxel-overlay-map.js';
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const encode=value=>gzipSync(JSON.stringify(value),{level:1,mtime:0});
export const decode=bytes=>JSON.parse(gunzipSync(bytes).toString('utf8'));
export function references(head){
 if(!['craftstudio-engine-checkpoint/1','craftstudio-engine-checkpoint/2'].includes(head?.schema)||typeof head.workspaceId!=='string'||!head.workspaceId||!Number.isSafeInteger(head.revision)||head.revision<0)throw Error('Invalid engine checkpoint');
 const ids=[head.base,head.assets];if(head.schema==='craftstudio-engine-checkpoint/2'){const seen=new Set();if(!Array.isArray(head.baseChunks))throw Error('Invalid baseline manifest');for(const [bucket,id,count]of head.baseChunks){if(!Number.isInteger(bucket)||bucket<0||bucket>0xffffff||seen.has(bucket)||!Number.isInteger(count)||count<1||count>4096)throw Error('Invalid baseline chunk');seen.add(bucket);ids.push(id);}}for(const row of head.archives)ids.push(row.id);
 for(const frame of [head,...head.undo,...head.redo])for(const [bucket,id]of frame.overlay){if(!Number.isInteger(bucket)||bucket<0||bucket>0xffffff)throw Error('Invalid overlay bucket');ids.push(id);}
 if(ids.some(id=>typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id)))throw Error('Invalid checkpoint blob reference');return[...new Set(ids)];
}
export class EngineCheckpoint{
 constructor(){this.baseMemo=new WeakMap();this.memo=new WeakMap();this.resourceStamp=null;this.resourceRecord=null;}
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
  let baseline=this.baseMemo.get(site.base);if(!baseline){baseline=splitBaseline(site.base);this.baseMemo.set(site.base,baseline);}const base=blob(baseline.header.bytes),baseChunks=baseline.chunks.map(c=>[c.bucket,blob(c.bytes),c.count]);
  const head={schema:'craftstudio-engine-checkpoint/2',base,baseChunks,baseKey,workspaceId:api.workspaceId,revision:api.revision,site:{...site.packHeader(),size:[...site.size]},overlay:overlay(site.overlay),undo:site.undo.map(frame),redo:site.redo.map(frame),assets,archives,receipts};
  references(head);return{head,blobs:[...blobs.values()]};
 }
 restore({head,blobs}){
  const records=new Map(blobs.map(b=>[b.id,b.bytes]));for(const id of references(head))if(!records.has(id)||digest(records.get(id))!==id)throw Error('Missing or corrupt engine blob');
  const site=new Site(restoreBaseline(head,records)),header=head.site;
  site.palette=structuredClone(header.palette);site.states=new Map(site.palette.map((s,i)=>[stateKey(s),i]));
  const roots=new Map(),overlay=refs=>{const value=new VoxelOverlayMap();for(const [bucket,id]of refs){let cached=roots.get(id),root=cached?.root;if(cached&&cached.bucket!==bucket)throw Error('Invalid chunk grouping');if(!root){const entries=decode(records.get(id)),checked=new VoxelOverlayMap();for(const [key,b]of entries){if(!Array.isArray(b.pos)||b.pos.length!==3||b.pos.some(n=>!Number.isInteger(n)||n<0||n>=4096)||coordKey(...b.pos)!==key||!Number.isInteger(b.state)||b.state< -1||b.state>=site.palette.length)throw Error('Invalid checkpoint cell');checked.set(key,b);}if(checked.chunks.size!==1||!checked.chunks.has(bucket))throw Error('Invalid chunk grouping');root=checked.chunks.get(bucket);roots.set(id,{root,bucket});this.memo.set(root,{id,bytes:records.get(id)});}if(value.chunks.has(bucket))throw Error('Duplicate chunk grouping');value.chunks.set(bucket,root);value.count+=root.size;}return value;};
  Object.assign(site,{title:header.title,origin:structuredClone(header.origin),originConfirmed:header.originConfirmed,protected:structuredClone(header.protected),sourceHash:header.sourceHash,design:structuredClone(header.design),size:[...header.size]});
  site.overlay=overlay(head.overlay);site.track(new VoxelOverlayMap(),site.overlay);site.undo=head.undo.map(v=>({...v,overlay:overlay(v.overlay),design:structuredClone(v.design)}));site.redo=head.redo.map(v=>({...v,overlay:overlay(v.overlay),design:structuredClone(v.design)}));site.endStroke();
  if(head.schema==='craftstudio-engine-checkpoint/2')this.baseMemo.set(site.base,{header:{bytes:records.get(head.base)},chunks:head.baseChunks.map(([bucket,id,count])=>({bucket,count,bytes:records.get(id)}))});
  return{site,workspaceId:head.workspaceId,revision:head.revision,baseKey:head.baseKey,receipts:structuredClone(head.receipts),assets:decode(records.get(head.assets)),files:head.archives.map(file=>({name:file.name,bytes:new Uint8Array(records.get(file.id)).buffer}))};
 }
}

export const baselineBucket=pos=>Math.floor(pos[0]/16)|(Math.floor(pos[2]/16)<<8)|(Math.floor(pos[1]/16)<<16);
export function splitBaseline(base){const groups=new Map();base.blocks.forEach((b,index)=>{const bucket=baselineBucket(b.pos);if(!groups.has(bucket))groups.set(bucket,[]);groups.get(bucket).push([index,b]);});return{header:{bytes:encode({...base,blocks:[]})},chunks:[...groups].map(([bucket,entries])=>({bucket,count:entries.length,bytes:encode(entries)}))};}
export function decodeBaselineChunk(bytes,[bucket,id,count],base,total){const entries=decode(bytes),seen=new Set(),positions=new Set();if(!Array.isArray(entries)||entries.length!==count)throw Error('Invalid baseline chunk count');for(const [index,b]of entries){if(!Number.isInteger(index)||index<0||index>=total||seen.has(index)||!Array.isArray(b?.pos)||b.pos.length!==3||b.pos.some((n,a)=>!Number.isInteger(n)||n<0||n>=base.size[a])||baselineBucket(b.pos)!==bucket||!Number.isInteger(b.state)||!base.palette[b.state])throw Error('Invalid baseline chunk cell');const key=coordKey(...b.pos);if(positions.has(key))throw Error('Duplicate baseline position');positions.add(key);seen.add(index);}return entries;}
export function restoreBaseline(head,records){const base=decode(records.get(head.base));if(head.schema==='craftstudio-engine-checkpoint/1')return base;if(!Array.isArray(base.blocks)||base.blocks.length||!Array.isArray(base.palette)||base.size?.length!==3)throw Error('Invalid baseline header');const total=head.baseChunks.reduce((n,c)=>n+c[2],0),blocks=new Array(total);for(const row of head.baseChunks)for(const [index,b]of decodeBaselineChunk(records.get(row[1]),row,base,total)){if(blocks[index])throw Error('Duplicate baseline ordinal');blocks[index]=b;}if(blocks.filter(Boolean).length!==total)throw Error('Missing baseline ordinal');return{...base,blocks};}
