import {gzipSync,gunzipSync,strToU8,strFromU8} from 'fflate';
const types={Uint8Array,Uint8ClampedArray,Int8Array,Uint16Array,Int16Array,Uint32Array,Int32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array};
const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);};
function pack(v,binaries=null){
 if(v===undefined)return['u'];if(typeof v==='bigint')return['i',v.toString()];
 if(typeof v==='number'&&(!Number.isFinite(v)||Object.is(v,-0)))return['n',Object.is(v,-0)?'-0':String(v)];
 const binary=(type,bytes)=>{if(!binaries)return['b',type,base64(bytes)];const index=binaries.length;binaries.push(bytes);return['b',type,index];};
 if(v instanceof ArrayBuffer)return binary('ArrayBuffer',new Uint8Array(v));
 if(ArrayBuffer.isView(v)){const type=v instanceof DataView?'DataView':v.constructor.name==='Buffer'?'Uint8Array':v.constructor.name;if(type!=='DataView'&&!Object.hasOwn(types,type))throw Error('Unsupported binary type');return binary(type,new Uint8Array(v.buffer,v.byteOffset,v.byteLength));}
 if(Array.isArray(v))return['a',v.map(item=>pack(item,binaries))];
 if(v&&typeof v==='object')return['o',Object.entries(v).map(([key,value])=>[key,pack(value,binaries)])];
 if(v===null||['string','number','boolean'].includes(typeof v))return['v',v];throw Error('Unsupported wire value');
}
function unpack(v,binaries=null){
 if(!Array.isArray(v))throw Error('Invalid wire value');const [kind,value,data]=v;
 if(kind==='u')return undefined;if(kind==='v'){if(value!==null&&!['string','number','boolean'].includes(typeof value))throw Error('Invalid scalar value');return value;}if(kind==='i')return BigInt(value);
 if(kind==='n'){if(!['-0','NaN','Infinity','-Infinity'].includes(value))throw Error('Invalid numeric tag');return value==='-0'?-0:Number(value);}
 if(kind==='a')return value.map(item=>unpack(item,binaries));
 if(kind==='o'){const result={};for(const [key,item]of value){if(typeof key!=='string'||Object.hasOwn(result,key))throw Error('Invalid object key');Object.defineProperty(result,key,{value:unpack(item,binaries),enumerable:true,writable:true,configurable:true});}return result;}
 if(kind==='b'){if(binaries&&(!Number.isInteger(data)||data<0||data>=binaries.length))throw Error('Invalid binary reference');const bytes=binaries?binaries[data].slice():Uint8Array.from(atob(data),c=>c.charCodeAt(0));if(value==='ArrayBuffer')return bytes.buffer;if(value==='DataView')return new DataView(bytes.buffer);const Type=types[value];if(!Object.hasOwn(types,value)||bytes.length%Type.BYTES_PER_ELEMENT)throw Error('Invalid binary type/size');return new Type(bytes.buffer);}
 throw Error('Unknown wire tag');
}
const magic=Uint8Array.of(67,83,69,78,71,87,50,0);
export const wireVersion=input=>{const bytes=input instanceof Uint8Array?input:new Uint8Array(input);return magic.every((n,i)=>bytes[i]===n)?2:1;};
export function encodeWire(value,{version=2}={}){
 if(version===1)return gzipSync(strToU8(JSON.stringify({schema:'craftstudio-engine-wire/1',value:pack(value)})),{mtime:0});
 if(version!==2)throw Error('Unsupported wire version');
 const binaries=[],packed=pack(value,binaries),metadata=gzipSync(strToU8(JSON.stringify({schema:'craftstudio-engine-wire/2',lengths:binaries.map(b=>b.length),value:packed})),{mtime:0}),output=new Uint8Array(12+metadata.length+binaries.reduce((n,b)=>n+b.length,0));
 output.set(magic);new DataView(output.buffer).setUint32(8,metadata.length,true);output.set(metadata,12);let at=12+metadata.length;for(const b of binaries){output.set(b,at);at+=b.length;}return output;
}
export function decodeWire(input){
 const bytes=new Uint8Array(input);
 if(!magic.every((n,i)=>bytes[i]===n)){const data=JSON.parse(strFromU8(gunzipSync(bytes)));if(data.schema!=='craftstudio-engine-wire/1')throw Error('Unsupported engine wire protocol');return unpack(data.value);}
 if(bytes.length<12)throw Error('Truncated wire header');const size=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(8,true);if(size>bytes.length-12)throw Error('Truncated wire metadata');
 const data=JSON.parse(strFromU8(gunzipSync(bytes.subarray(12,12+size))));if(data.schema!=='craftstudio-engine-wire/2'||!Array.isArray(data.lengths))throw Error('Unsupported engine wire protocol');let at=12+size;const binaries=data.lengths.map(length=>{if(!Number.isSafeInteger(length)||length<0||length>bytes.length-at)throw Error('Truncated binary payload');const b=bytes.subarray(at,at+length);at+=length;return b;});if(at!==bytes.length)throw Error('Unexpected wire suffix');return unpack(data.value,binaries);
}
