import {Site,coordKey,coords,terrainType} from '../lite/src/site.js';
const bucket=pos=>Math.floor(pos[0]/16)|(Math.floor(pos[2]/16)<<8)|(Math.floor(pos[1]/16)<<16),key=id=>[id&255,id>>>16,(id>>>8)&255].join(',');
class ChunkIndex{
 constructor(owner,numeric){this.owner=owner;this.numeric=numeric;}
 get size(){return this.owner.rows.size;}
 id(value){if(this.numeric)return Number.isInteger(value)&&value>=0&&value<=0xffffff?value:undefined;if(typeof value!=='string')return undefined;const a=value.split(',').map(Number);return a.length===3&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&a.join(',')===value?bucket(a.map(n=>n*16)):undefined;}
 get(value){return this.owner.get(this.id(value));}has(value){return this.owner.rows.has(this.id(value));}
 *keys(){for(const id of this.owner.rows.keys())yield this.numeric?id:key(id);}
 *entries(){for(const id of this.owner.rows.keys())yield[this.numeric?id:key(id),this.owner.get(id)];}
 *values(){for(const [,chunk]of this.entries())yield chunk;}[Symbol.iterator](){return this.entries();}
}
class SourceCells{
 constructor(owner){this.owner=owner;this.chunks=new ChunkIndex(owner,true);}
 get size(){return this.owner.total;}
 get(k){return this.owner.get(bucket(coords(k)))?.get(k);}has(k){return!!this.get(k);}
 *entries(){for(const chunk of this.chunks.values())yield*chunk;}*keys(){for(const [k]of this.entries())yield k;}*values(){for(const [,b]of this.entries())yield b;}[Symbol.iterator](){return this.entries();}
 forEach(fn,thisArg){for(const [k,b]of this)fn.call(thisArg,b,k,this);}
}
export class LazyBaseline{
 constructor(header,rows,decodeChunk,{maxChunks=64}={}){
  if(!Number.isInteger(maxChunks)||maxChunks<1)throw Error('Invalid source residency limit');this.header=header;this.rows=new Map(rows.map(row=>[row.bucket,row]));this.total=rows.reduce((n,row)=>n+row.count,0);this.decodeChunk=decodeChunk;this.maxChunks=maxChunks;this.cache=new Map();this.columns=new Map();this.xz=new Map();this.reads=0;
  for(const row of rows){const xz=row.bucket&65535;if(!this.xz.has(xz))this.xz.set(xz,[]);this.xz.get(xz).push(row.bucket);}
  this.blockEntities=rows.reduce((n,row)=>{if(row.nbtCount===undefined)row.nbtCount=this.decode(row).filter(([,b])=>b.nbt).length;return n+row.nbtCount;},0);
  this.cells=new SourceCells(this);this.chunks=new ChunkIndex(this,false);
 }
 decode(row){this.reads++;return this.decodeChunk(row);}
 get(id){const row=this.rows.get(id);if(!row)return undefined;if(this.cache.has(id)){const root=this.cache.get(id);this.cache.delete(id);this.cache.set(id,root);return root;}const root=new Map(this.decode(row).map(([,b])=>[coordKey(...b.pos),b]));this.cache.set(id,root);while(this.cache.size>this.maxChunks)this.cache.delete(this.cache.keys().next().value);return root;}
 hydrate(){const blocks=new Array(this.total);for(const row of this.rows.values())for(const [index,b]of this.decode(row)){if(blocks[index])throw Error('Duplicate baseline ordinal');blocks[index]=b;}if(blocks.filter(Boolean).length!==this.total)throw Error('Missing baseline ordinal');return blocks;}
 column(x,z,palette){const columnKey=x+4096*z;if(this.columns.has(columnKey)){const c=this.columns.get(columnKey);this.columns.delete(columnKey);this.columns.set(columnKey,c);return c;}const c={ground:null,water:null,top:null};for(const id of this.xz.get(Math.floor(x/16)|(Math.floor(z/16)<<8))||[])for(const b of this.get(id).values())if(b.pos[0]===x&&b.pos[2]===z){const type=terrainType(palette[b.state].Name);c.top=Math.max(c.top??-1,b.pos[1]);if(type==='ground')c.ground=Math.max(c.ground??-1,b.pos[1]);if(type==='water')c.water=Math.max(c.water??-1,b.pos[1]);}this.columns.set(columnKey,c);while(this.columns.size>256)this.columns.delete(this.columns.keys().next().value);return c;}
 stats(){return{mode:'compressed-chunks',totalChunks:this.rows.size,residentChunks:this.cache.size,maxChunks:this.maxChunks,decodedReads:this.reads,totalBlocks:this.total,residentBlocks:[...this.cache.values()].reduce((n,c)=>n+c.size,0),compressedBytes:[...this.rows.values()].reduce((n,c)=>n+c.bytes.length,0)};}
 attach(site=new Site(this.header)){const base={...this.header};Object.defineProperty(base,'blocks',{enumerable:true,get:()=>this.hydrate()});site.base=base;site.baseline=this;site.cells=this.cells;site.baseChunks=this.chunks;site.blockEntityCount=this.blockEntities;site.columns=null;return site;}
}
