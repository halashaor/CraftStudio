import {createServer} from 'node:http';import {randomUUID,createHash} from 'node:crypto';
import {EngineStore} from './store.mjs';import {EngineController} from './controller.mjs';import {encodeWire,decodeWire,wireVersion} from '../lite/src/engine-wire.js';
export async function createEngineService({database,token,port=0,allowedOrigins=[],store:providedStore,controllerOptions={}}){
 if(typeof token!=='string'||token.length<16)throw Error('A private service token is required');
 const store=providedStore||new EngineStore(database),owners=new Map(),leases=new Map();let stopping=false;
 const reply=(response,value,status=200)=>{const bytes=encodeWire(value,{version:response.engineWireVersion||1});response.writeHead(status,{'Content-Type':'application/x-craftstudio-engine','Content-Length':bytes.length,'Cache-Control':'no-store'});response.end(bytes);};
 const server=createServer(async(req,res)=>{try{
  const address=server.address(),hosts=['127.0.0.1:'+address.port,'localhost:'+address.port],origin=req.headers.origin;
  if(!hosts.includes(req.headers.host)||origin&&!allowedOrigins.includes(origin)&&origin!=='http://'+req.headers.host)throw Error('Untrusted host/origin');
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type,X-CraftStudio-Token'});res.end();return;}
  if(req.headers['x-craftstudio-token']!==token){reply(res,{error:'Invalid service token'},403);return;}
  if(req.method!=='POST'||req.url!=='/rpc'){reply(res,{error:'Unknown endpoint'},404);return;}
  if(stopping)throw Error('Service is stopping');const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks);res.engineWireVersion=wireVersion(raw);const body=decodeWire(raw);
  if(body.operation==='open'){
   const key=body.key||'workspace:'+randomUUID();if(typeof key!=='string'||!key||key.length>256)throw Error('Invalid workspace key');
   if(owners.get(key)?.closing)await owners.get(key).closing;
   if(!owners.has(key)){const owner={clients:0,restored:!!store.db.prepare('SELECT key FROM designer_engine_heads WHERE key=?').get(key),controller:EngineController.open({...controllerOptions,store,key})};owners.set(key,owner);owner.controller.catch(()=>{if(owners.get(key)===owner)owners.delete(key);});}
   const restored=!!body.key&&!!store.db.prepare('SELECT key FROM designer_engine_heads WHERE key=?').get(key);const owner=owners.get(key);await owner.controller;const lease=randomUUID();owner.clients++;leases.set(lease,{key,owner,requests:new Map(),retired:0});reply(res,{lease,key,restored,protocol:'craftstudio-engine-wire/'+res.engineWireVersion});return;
  }
  const lease=leases.get(body.lease);if(!lease)throw Error('Engine lease is missing');
  if(body.operation==='close'){leases.delete(body.lease);lease.owner.clients--;if(!lease.owner.clients){const owner=lease.owner;owner.closing=owner.controller.then(c=>c.close({cancelReplacements:!!body.cancelReplacements})).finally(()=>{if(owners.get(lease.key)===owner)owners.delete(lease.key);});await owner.closing;}reply(res,{closed:true});return;}
  if(body.operation!=='call'||!Number.isSafeInteger(body.id)||body.id<1||typeof body.action!=='string')throw Error('Invalid RPC request');
  for(const id of body.ack||[]){if(Number.isSafeInteger(id)&&id>0){lease.requests.delete(id);lease.retired=Math.max(lease.retired,id);}}
  const fingerprint=createHash('sha256').update(raw).digest('hex');let request=lease.requests.get(body.id);
  if(request&&request.fingerprint!==fingerprint)throw Error('RPC id reused with different envelope');
  if(!request){if(body.id<=lease.retired)throw Error('RPC was already acknowledged');const stages=[],promise=lease.owner.controller.then(c=>c.call(body.action,body.data,{onTiming:body.trace?stage=>stages.push(stage):undefined})).then(value=>({value,...(body.trace?{performance:{stages}}:{})}),error=>({error:error.message}));request={fingerprint,promise};lease.requests.set(body.id,request);}
  reply(res,await request.promise);
 }catch(error){if(!res.headersSent)reply(res,{error:error.message},400);else res.destroy();}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return{url:'http://127.0.0.1:'+server.address().port,async close(){stopping=true;await new Promise(resolve=>server.close(resolve));await Promise.all([...owners.values()].map(async owner=>{try{await(await owner.controller).close();}catch{}}));leases.clear();owners.clear();if(!providedStore)store.close();}};
}
