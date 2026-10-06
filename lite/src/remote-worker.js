import {encodeWire,decodeWire} from './engine-wire.js';
export class RemoteEngineWorker{
 constructor({url,token,key,endpoint,fetcher=globalThis.fetch}){
  this.url=url;this.endpoint=endpoint||url+'/rpc';this.token=token;this.fetcher=(...args)=>fetcher(...args);this.terminated=false;this.tail=Promise.resolve();this.ack=[];
  this.ready=this.request({operation:'open',...(key?{key}:{})}).then(session=>{this.session=session;return session;});this.ready.catch(()=>{});
 }
 async request(body,{keepalive=false}={}){const bytes=encodeWire(body);let error;for(let i=0;i<2;i++)try{const response=await this.fetcher(this.endpoint,{method:'POST',headers:{'Content-Type':'application/x-craftstudio-engine','X-CraftStudio-Token':this.token},body:bytes,keepalive}),value=response.headers?.get('Content-Type')?.includes('application/json')?await response.json():decodeWire(await response.arrayBuffer());if(!response.ok||value.error){const e=Error(value.error||'Engine transport failed');e.replyReceived=true;throw e;}return value;}catch(e){if(e.replyReceived)throw e;error=e;}throw error;}

 postMessage(message){
  if(this.terminated)return;const owned=structuredClone(message);
  const next=this.tail.then(async()=>{const session=await this.ready;if(this.terminated)return;const ack=this.ack.splice(0),response=await this.request({operation:'call',lease:session.lease,id:owned.id,action:owned.action,data:owned.data,ack});if(this.terminated)return;this.ack.push(owned.id);this.onmessage?.({data:{id:owned.id,value:response.value}});});
  this.tail=next.catch(error=>{if(!this.terminated){if(error.replyReceived)this.ack.push(owned.id);this.onmessage?.({data:{id:owned.id,error:error.message}});}});
 }
 terminate(){if(this.terminated)return;this.terminated=true;this.ready.then(session=>this.request({operation:'close',lease:session.lease},{keepalive:true})).catch(()=>{});}
}
