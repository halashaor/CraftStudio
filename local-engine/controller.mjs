import {EngineWorkspace} from './workspace.mjs';
const canonical=new Set(['edit.apply','edit.brush','selection.transform','objects.put','workplanes.put','workplanes.remove','views.put','views.remove','measurements.put','measurements.remove','history.undo','history.redo','transaction.commit','proposal.commit','construction.commit']);
const resourceChanges=new Set(['resourceLibrary','resources','assets']);
const directChanges=new Set(['edit','brush','undo','redo','origin','protect','unprotect','studio','rename','accept','commitConstruction','detachGeneration']);
export class EngineController{
 #engine;#tail=Promise.resolve();#closed=false;#sequence=null;#transactions=new Set();#construction=false;#stroke=false;
 constructor({store,key,factory=()=>new EngineWorkspace(),beforeCommit=async()=>{}}){this.store=store;this.key=key;this.factory=factory;this.beforeCommit=beforeCommit;}
 static async open(options){const c=new EngineController(options);c.#engine=c.factory();try{const packet=c.store.load(c.key);if(packet){await c.#engine.call('engineRestore',packet);c.#sequence=packet.sequence;}else{await c.#engine.call('summary');await c.#save(c.#engine);}return c;}catch(error){await c.#engine.close();throw error;}}
 get sequence(){return this.#sequence;}
 call(action,data={}){
  if(this.#closed)return Promise.reject(Error('Durable workspace is closed'));
  if(['engineCapture','engineRestore'].includes(action))return Promise.reject(Error('Checkpoint commands are controller-internal'));
  let owned;try{owned=structuredClone(data);}catch(error){return Promise.reject(error);}const next=this.#tail.then(()=>this.#run(action,owned));this.#tail=next.catch(()=>{});return next;
 }
 async #save(engine){const packet=await engine.call('engineCapture',{known:this.store.known()});await this.beforeCommit(packet);const result=this.store.commit(this.key,packet,this.#sequence);this.#sequence=result.sequence;return result;}
 async #recover(){
  const old=this.#engine;let next;try{next=this.factory();const packet=this.store.load(this.key);if(!packet)throw Error('Committed workspace is missing');await next.call('engineRestore',packet);this.#engine=next;this.#sequence=packet.sequence;this.#transactions.clear();this.#construction=false;this.#stroke=false;await old.close();}catch(error){this.#closed=true;await Promise.all([old.close(),next?.close()]);throw Error('Cannot recover committed workspace',{cause:error});}
 }
 async #replace(action,data,resource=false){
  const before=await this.#engine.call('api',{method:'workspace.describe'});
  if(this.#stroke||before.value.previewActive||resource&&(this.#transactions.size||this.#construction))throw Error('Finish or cancel the pending operation before replacing scene/resources');
  const candidate=this.factory(),startingSequence=this.#sequence;let attempted=false;try{
   const committed=this.store.load(this.key);
   if(resource)await candidate.call('engineRestore',committed);
   else if(committed.head.archives.length){const blobs=new Map(committed.blobs.map(b=>[b.id,b.bytes]));await candidate.call('resourceLibrary',{files:committed.head.archives.map(f=>({name:f.name,bytes:new Uint8Array(blobs.get(f.id)).buffer}))});}
   const result=await candidate.call(action,data);attempted=true;await this.#save(candidate);
   const old=this.#engine;this.#engine=candidate;this.#transactions.clear();this.#construction=false;this.#stroke=false;await old.close();return result;
  }catch(error){await candidate.close();if(attempted){let latest;try{latest=this.store.load(this.key);}catch(storageError){this.#closed=true;await this.#engine.close();throw Error('Cannot inspect the committed workspace',{cause:storageError});}if(latest?.sequence!==startingSequence)await this.#recover();}throw error;}
 }
 #track(action,data,result){
  if(action==='beginStroke')this.#stroke=true;if(['endStroke','undo','redo'].includes(action)||action==='api'&&['history.undo','history.redo'].includes(data.method)&&result.ok)this.#stroke=false;
  if(action==='prepareConstruction'||action==='api'&&data.method==='construction.prepare'&&result.ok)this.#construction=true;
  if(['cancelConstruction','commitConstruction'].includes(action)||action==='api'&&['construction.cancel','construction.commit'].includes(data.method)&&result.ok)this.#construction=false;
  if(action==='api'&&result.ok){if(data.method==='transaction.begin')this.#transactions.add(result.value.transactionId);if(['transaction.abort','transaction.commit'].includes(data.method))this.#transactions.delete(data.params.transactionId);}
 }
 async #run(action,data){
  if(this.#engine.closed)await this.#recover();
  if(resourceChanges.has(action))return this.#replace(action,data,true);
  if(['load','resume'].includes(action)||action==='import'&&!/\.html?$/i.test(data.name||''))return this.#replace(action,data);
  const before=await this.#engine.call('api',{method:'workspace.describe'});let result;
  try{result=await this.#engine.call(action,data);}catch(error){if(action==='api'||directChanges.has(action)||this.#engine.closed)await this.#recover();throw error;}
  if(action==='api'&&!result.ok)return result;
  this.#track(action,data,result);
  const after=await this.#engine.call('api',{method:'workspace.describe'});
  const dirty=before.revision!==after.revision||before.workspaceId!==after.workspaceId||directChanges.has(action)||action==='api'&&canonical.has(data.method)||['package','compressed','draft'].includes(action)&&!!data.title;
  if(dirty)try{await this.#save(this.#engine);}catch(error){await this.#recover();throw Error('Edit was not acknowledged; restored the committed workspace',{cause:error});}
  return result;
 }
 async close(){this.#closed=true;await this.#tail;await this.#engine.close();}
}
