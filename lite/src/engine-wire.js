import {gzipSync,gunzipSync,strToU8,strFromU8} from 'fflate';
const types={Uint8Array,Uint8ClampedArray,Int8Array,Uint16Array,Int16Array,Uint32Array,Int32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array};
const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);};
function pack(v){
 if(v===undefined)return['u'];if(typeof v==='bigint')return['i',v.toString()];
 if(typeof v==='number'&&(!Number.isFinite(v)||Object.is(v,-0)))return['n',Object.is(v,-0)?'-0':String(v)];
 if(v instanceof ArrayBuffer)return['b','ArrayBuffer',base64(new Uint8Array(v))];
 if(ArrayBuffer.isView(v)){const type=v instanceof DataView?'DataView':v.constructor.name==='Buffer'?'Uint8Array':v.constructor.name;if(type!=='DataView'&&!Object.hasOwn(types,type))throw Error('Unsupported binary type');return['b',type,base64(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))];}
 if(Array.isArray(v))return['a',v.map(pack)];
 if(v&&typeof v==='object')return['o',Object.entries(v).map(([key,value])=>[key,pack(value)])];
 if(v===null||['string','number','boolean'].includes(typeof v))return['v',v];throw Error('Unsupported wire value');
}
function unpack(v){
 if(!Array.isArray(v))throw Error('Invalid wire value');const [kind,value,data]=v;
 if(kind==='u')return undefined;if(kind==='v'){if(value!==null&&!['string','number','boolean'].includes(typeof value))throw Error('Invalid scalar value');return value;}if(kind==='i')return BigInt(value);
 if(kind==='n'){if(!['-0','NaN','Infinity','-Infinity'].includes(value))throw Error('Invalid numeric tag');return value==='-0'?-0:Number(value);}
 if(kind==='a')return value.map(unpack);
 if(kind==='o'){const result={};for(const [key,item]of value){if(typeof key!=='string'||Object.hasOwn(result,key))throw Error('Invalid object key');Object.defineProperty(result,key,{value:unpack(item),enumerable:true,writable:true,configurable:true});}return result;}
 if(kind==='b'){const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));if(value==='ArrayBuffer')return bytes.buffer;if(value==='DataView')return new DataView(bytes.buffer);const Type=types[value];if(!Object.hasOwn(types,value)||bytes.length%Type.BYTES_PER_ELEMENT)throw Error('Invalid binary type/size');return new Type(bytes.buffer);}
 throw Error('Unknown wire tag');
}
export function encodeWire(value){return gzipSync(strToU8(JSON.stringify({schema:'craftstudio-engine-wire/1',value:pack(value)})),{mtime:0});}
export function decodeWire(bytes){const data=JSON.parse(strFromU8(gunzipSync(new Uint8Array(bytes))));if(data.schema!=='craftstudio-engine-wire/1')throw Error('Unsupported engine wire protocol');return unpack(data.value);}
