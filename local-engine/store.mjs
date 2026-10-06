import {DatabaseSync} from 'node:sqlite';
import {digest,encode,decode,references} from './checkpoint.mjs';
export class EngineStore{
 constructor(path){this.db=new DatabaseSync(path);this.db.exec('PRAGMA busy_timeout=15000; CREATE TABLE IF NOT EXISTS designer_engine_blobs(id TEXT PRIMARY KEY,payload BLOB NOT NULL); CREATE TABLE IF NOT EXISTS designer_engine_heads(key TEXT PRIMARY KEY,sequence INTEGER NOT NULL,digest TEXT NOT NULL,payload BLOB NOT NULL)');}
 known(){return this.db.prepare('SELECT id FROM designer_engine_blobs').all().map(row=>row.id);}
 commit(key,packet,expectedSequence,{onTiming}={}){
  const observe=event=>{try{onTiming?.(event);}catch{}};
  if(typeof key!=='string'||!key)throw Error('Storage key required');const refs=references(packet.head),bytes=encode(packet.head),hash=digest(bytes);
  let started=performance.now();this.db.exec('BEGIN IMMEDIATE');observe({stage:'lock',ms:performance.now()-started});started=performance.now();try{
   const old=this.db.prepare('SELECT sequence,digest,payload FROM designer_engine_heads WHERE key=?').get(key);
   if(old&&digest(old.payload)!==old.digest)throw Error('Corrupt checkpoint header');
   if(old?.digest===hash){for(const id of refs)if(!this.db.prepare('SELECT id FROM designer_engine_blobs WHERE id=?').get(id))throw Error('Missing checkpoint blob');this.db.exec('ROLLBACK');return{sequence:old.sequence,replayed:true};}
   if(old){const previous=decode(old.payload);if(previous.workspaceId===packet.head.workspaceId&&packet.head.revision<previous.revision)throw Error('Outdated engine revision');}
   if((old?.sequence??null)!==expectedSequence)throw Error('Engine checkpoint version conflict');
   for(const blob of packet.blobs){if(!(blob.bytes instanceof Uint8Array)||digest(blob.bytes)!==blob.id)throw Error('Invalid engine blob digest');this.db.prepare('INSERT OR IGNORE INTO designer_engine_blobs VALUES (?,?)').run(blob.id,blob.bytes);}
   for(const id of refs){if(!this.db.prepare('SELECT id FROM designer_engine_blobs WHERE id=?').get(id))throw Error('Missing checkpoint blob');}
   const sequence=(old?.sequence||0)+1;this.db.prepare('INSERT OR REPLACE INTO designer_engine_heads VALUES (?,?,?,?)').run(key,sequence,hash,bytes);observe({stage:'write',ms:performance.now()-started});started=performance.now();this.db.exec('COMMIT');observe({stage:'commit',ms:performance.now()-started});return{sequence,replayed:false};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 load(key){const row=this.db.prepare('SELECT * FROM designer_engine_heads WHERE key=?').get(key);if(!row)return null;if(digest(row.payload)!==row.digest)throw Error('Corrupt checkpoint header');const head=decode(row.payload),blobs=references(head).map(id=>{const b=this.db.prepare('SELECT payload FROM designer_engine_blobs WHERE id=?').get(id);if(!b||digest(b.payload)!==id)throw Error('Missing or corrupt checkpoint blob');return{id,bytes:b.payload};});return{sequence:row.sequence,head,blobs};}
 close(){this.db.close();}
}
