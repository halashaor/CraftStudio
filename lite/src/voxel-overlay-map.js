// Map-shaped, chunked copy-on-write storage. Each branch owns only touched chunks.
const bucket=key=>((key>>>4)&255)|(((key>>>16)&255)<<8)|(Math.floor(key/268435456)<<16);
export class VoxelOverlayMap{
 constructor(source){this.chunks=new Map();this.owned=new Set();this.count=0;if(source instanceof VoxelOverlayMap){this.chunks=new Map(source.chunks);this.count=source.count;source.owned.clear();}else if(source)for(const [key,value]of source)this.set(key,value);}
 get size(){return this.count;}
 has(key){return this.chunks.get(bucket(key))?.has(key)||false;}
 get(key){return this.chunks.get(bucket(key))?.get(key);}
 writable(id){if(!this.owned.has(id)){this.chunks.set(id,new Map(this.chunks.get(id)||[]));this.owned.add(id);}return this.chunks.get(id);}
 set(key,value){const id=bucket(key),chunk=this.writable(id);if(!chunk.has(key))this.count++;chunk.set(key,value);return this;}
 delete(key){const id=bucket(key);if(!this.chunks.get(id)?.has(key))return false;const chunk=this.writable(id);chunk.delete(key);this.count--;if(!chunk.size){this.chunks.delete(id);this.owned.delete(id);}return true;}
 clear(){this.chunks.clear();this.owned.clear();this.count=0;}
 *entries(){for(const chunk of this.chunks.values())yield*chunk;}
 *keys(){for(const [key]of this.entries())yield key;}
 *values(){for(const [,value]of this.entries())yield value;}
 [Symbol.iterator](){return this.entries();}
 forEach(callback,thisArg){for(const [key,value]of this)callback.call(thisArg,value,key,this);}
}
