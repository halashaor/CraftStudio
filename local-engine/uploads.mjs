import {mkdtemp,open,readFile,unlink,rmdir} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash,randomUUID} from 'node:crypto';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export class EngineUploads{
 constructor(){this.directory=mkdtemp(join(tmpdir(),'craftstudio-upload-'));this.records=new Map();this.starts=new Map();this.closedLeases=new Set();}
 async begin(lease,{id,size,sha256}){
  if(typeof id!=='string'||!/^[a-z0-9_-]{1,128}$/i.test(id)||!Number.isSafeInteger(size)||size<1||!(/^[a-f0-9]{64}$/).test(sha256||''))throw Error('Invalid upload descriptor');
  if(this.records.has(id)){const r=this.records.get(id);if(r.lease!==lease||r.size!==size||r.sha256!==sha256)throw Error('Upload identifier conflict');return{written:r.written};}
  if(this.closedLeases.has(lease))throw Error('Upload session closed');
  if(this.starts.has(id)){const start=this.starts.get(id);if(start.lease!==lease)throw Error('Upload identifier conflict');await start.task;return this.begin(lease,{id,size,sha256});}
  const task=(async()=>{const path=join(await this.directory,randomUUID()+'.part'),file=await open(path,'wx');if(this.closedLeases.has(lease)){await file.close();await unlink(path);throw Error('Upload session closed');}const record={lease,size,sha256,path,file,written:0,chunks:new Map(),tail:Promise.resolve(),closed:false};this.records.set(id,record);})();
  this.starts.set(id,{lease,task});try{await task;return{written:0};}finally{this.starts.delete(id);}

 }
 get(lease,id){const r=this.records.get(id);if(!r||r.lease!==lease||r.closed)throw Error('Upload is missing or belongs to another session');return r;}
 append(lease,{id,offset,bytes}){const r=this.get(lease,id),next=r.tail.then(async()=>{if(r.closed)throw Error('Upload closed');if(!(bytes instanceof Uint8Array)||!bytes.length||!Number.isSafeInteger(offset)||offset<0||offset+bytes.length>r.size)throw Error('Invalid upload slice');const hash=digest(bytes),previous=r.chunks.get(offset);if(previous){if(previous.size!==bytes.length||previous.hash!==hash)throw Error('Conflicting upload retry');return{written:r.written};}if(offset!==r.written)throw Error('Out-of-order upload slice');let done=0;while(done<bytes.length){const result=await r.file.write(bytes,done,bytes.length-done,offset+done);if(!result.bytesWritten)throw Error('Upload write stalled');done+=result.bytesWritten;}r.chunks.set(offset,{size:bytes.length,hash});r.written+=bytes.length;return{written:r.written};});r.tail=next.catch(()=>{});return next;}
 async finish(lease,id){const r=this.get(lease,id);await r.tail;if(r.written!==r.size)throw Error('Incomplete upload');const bytes=await readFile(r.path);if(bytes.length!==r.size||digest(bytes)!==r.sha256)throw Error('Upload checksum mismatch');return bytes;}
 async discard(lease,id){const r=this.records.get(id);if(!r||r.lease!==lease)return;r.closed=true;await r.tail;await r.file.close();await unlink(r.path).catch(error=>{if(error.code!=='ENOENT')throw error;});this.records.delete(id);}
 async release(lease){this.closedLeases.add(lease);await Promise.all([...this.starts.values()].filter(s=>s.lease===lease).map(s=>s.task.catch(()=>{})));await Promise.all([...this.records].filter(([,r])=>r.lease===lease).map(([id])=>this.discard(lease,id)));}
 async close(){const leases=new Set([...this.records.values(),...this.starts.values()].map(r=>r.lease));await Promise.all([...leases].map(lease=>this.release(lease)));await rmdir(await this.directory);}
}
