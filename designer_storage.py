"""Portable designer snapshots in the same local SQLite database as legacy projects."""
from chunk_storage import setup as setup_chunks, manifest as chunk_manifest, read_chunks, checkpoint, workspace_head, workspace_chunks
import copy
from contextlib import contextmanager
import json
import sqlite3
import uuid
import zlib
from datetime import datetime, timezone
from pathlib import Path

class DesignerLibrary:
    STORES = ('projects', 'versions', 'sessions', 'bases')
    def __init__(self, path):
        self.path = Path(path)
        with self.connection() as conn:
            conn.execute('CREATE TABLE IF NOT EXISTS designer_records (store TEXT NOT NULL, key TEXT NOT NULL, payload BLOB NOT NULL, PRIMARY KEY(store,key))');setup_chunks(conn)
    @contextmanager
    def connection(self):
        conn = sqlite3.connect(self.path, timeout=15)
        conn.execute('PRAGMA busy_timeout=15000')
        try:
            with conn: yield conn
        finally: conn.close()
    @staticmethod
    def key(store, row):
        return json.dumps([row['projectId'], row['number']], separators=(',', ':')) if store == 'versions' else row['id']
    def get(self, conn, store, key):
        row = conn.execute('SELECT payload FROM designer_records WHERE store=? AND key=?', (store, key)).fetchone()
        return json.loads(zlib.decompress(row[0])) if row else None
    def rows(self, conn, store):
        return [json.loads(zlib.decompress(row[0])) for row in conn.execute('SELECT payload FROM designer_records WHERE store=?', (store,))]
    def put(self, conn, store, row):
        conn.execute('INSERT OR REPLACE INTO designer_records VALUES (?,?,?)', (store, self.key(store,row), zlib.compress(json.dumps(row,ensure_ascii=False,separators=(',',':')).encode(),1)))
    @staticmethod
    def timestamp():
        return datetime.now(timezone.utc).isoformat(timespec='milliseconds')
    def call(self, method, args):
        with self.connection() as conn:
            conn.execute('BEGIN' if method in ('baselineChunks','workspaceHead','workspaceChunks') else 'BEGIN IMMEDIATE')
            result = self.execute(conn, method, args)
            return result
    def execute(self, conn, method, args):
        if method == 'baselineManifest':
            if len(args)>1 and args[1] is not None:
                old=self.get(conn,'bases',args[0]);data=args[1]
                if not isinstance(data,dict) or not isinstance(data.get('$bytes'),str):raise ValueError('基线需要便携二进制数据')
                if old and old.get('bytes')!=data:raise ValueError('基线键已存在且内容不同')
                if not old:self.put(conn,'bases',{'id':args[0],'bytes':data})
            return chunk_manifest(conn,args[0],lambda key:self.get(conn,'bases',key))
        if method == 'baselineChunks':return read_chunks(conn,args[0],args[1])
        if method == 'workspaceHead':
            head=workspace_head(conn,args[0])
            if head and len(args)>1 and args[1]:head.pop('snapshot',None)
            return head
        if method == 'workspaceCheckpoint':return checkpoint(conn,args[0],args[1])
        if method == 'workspaceChunks':return workspace_chunks(conn,args[0],args[1],args[2])
        if method == 'preference':
            key = 'prefs:' + str(args[0]); old = self.get(conn,'sessions',key)
            if len(args)<2: return old.get('data') if old else None
            self.put(conn,'sessions',{'id':key,'data':args[1],'updatedAt':self.timestamp()}); return args[1]
        if method == 'save':
            data, info = args; identifier = info.get('id') or str(uuid.uuid4()); old = self.get(conn,'projects',identifier)
            if old and 'head' in info and old['head'] != info['head']: raise ValueError('工程版本已更新，请重新打开后保存')
            if not isinstance(data,dict) or not isinstance(data.get('$bytes'),str): raise ValueError('工程需要完整的便携文件数据')
            version = (old or {}).get('head',0)+1; time = self.timestamp()
            item = dict(id=identifier,title=info['title'],description=info.get('description',''),tags=info.get('tags',[]),kind=info.get('kind','project'),favorite=(old or {}).get('favorite',False),createdAt=(old or {}).get('createdAt',time),updatedAt=time,head=version,blocks=info.get('blocks',0),size=info.get('size',[1,1,1]),deleted=False)
            self.put(conn,'projects',item); self.put(conn,'versions',dict(projectId=identifier,number=version,time=time,note=info.get('note',''),bytes=data)); return item
        if method == 'list':
            q = args[0] if args else {}; text=q.get('query','').lower()
            items=[p for p in self.rows(conn,'projects') if bool(p.get('deleted'))==bool(q.get('deleted')) and (not q.get('kind') or p['kind']==q['kind']) and (not q.get('favorite') or p['favorite']) and text in (p['title']+' '+p['description']+' '+' '.join(p['tags'])).lower()]
            return sorted(items,key=lambda p:(p['favorite'],p['updatedAt']),reverse=True)
        if method == 'get':
            identifier=args[0]; item=self.get(conn,'projects',identifier)
            if not item or item['deleted']: raise ValueError('工程不存在或在回收站')
            version=args[1] if len(args)>1 and args[1] else item['head']; entry=self.get(conn,'versions',json.dumps([identifier,version],separators=(',',':')))
            if not entry: raise ValueError('版本不存在')
            return dict(item=item,entry=entry)
        if method == 'versions':
            return sorted([{k:v for k,v in row.items() if k!='bytes'} for row in self.rows(conn,'versions') if row['projectId']==args[0]],key=lambda p:p['number'],reverse=True)
        if method == 'update':
            item=self.get(conn,'projects',args[0]); changes=args[1]
            if not item: raise ValueError('工程不存在')
            for key in ('favorite','deleted','title','tags','description'):
                if key in changes: item[key]=changes[key]
            item['updatedAt']=self.timestamp(); self.put(conn,'projects',item); return item
        if method == 'draft':
            data=args[0]; identifier=args[1] if len(args)>1 else None
            for key, payload in [(data['baseKey'],data['baseline']),(data.get('assetKey'),data.get('assetBytes'))]:
                if key and not self.get(conn,'bases',key): self.put(conn,'bases',dict(id=key,bytes=payload))
            row=dict(id='active',baseKey=data['baseKey'],assetKey=data.get('assetKey'),bytes=data['payload'],projectId=identifier,updatedAt=self.timestamp());self.put(conn,'sessions',row)
            if identifier: self.put(conn,'sessions',dict(row,id='draft:'+identifier))
            return None
        if method == 'resume':
            row=self.get(conn,'sessions',args[0] if args else 'active')
            if not row:return None
            base=self.get(conn,'bases',row['baseKey']); assets=self.get(conn,'bases',row['assetKey']) if row.get('assetKey') else None
            if not base or row.get('assetKey') and not assets: raise ValueError('草稿缺少原始场地或资源附件')
            return dict(row,baseline=base['bytes'],assetBytes=assets['bytes'] if assets else None)
        if method == 'backup': return dict(schema='craftstudio-lite-library/1',**{key:self.rows(conn,key) for key in self.STORES})
        if method == 'restore':
            backup=copy.deepcopy(args[0])
            if backup.get('schema')!='craftstudio-lite-library/1' or not isinstance(backup.get('projects'),list) or not isinstance(backup.get('versions'),list):raise ValueError('无效工程库备份')
            ids={p.get('id') for p in backup['projects']}
            if len(ids)!=len(backup['projects']) or any(not isinstance(p.get('title'),str) for p in backup['projects']) or any(v.get('projectId') not in ids or type(v.get('number')) is not int or not isinstance(v.get('bytes',{}).get('$bytes'),str) for v in backup['versions']):raise ValueError('备份记录不完整')
            mapping={}
            for p in backup['projects']:
                old=p['id'];exists=self.get(conn,'projects',old);p['id']=str(uuid.uuid4()) if exists else old;mapping[old]=p['id']
                if exists:p['title']+=' · 导入副本'
                self.put(conn,'projects',p)
            for row in backup['versions']:row['projectId']=mapping[row['projectId']];self.put(conn,'versions',row)
            for row in backup.get('bases',[]):
                if not self.get(conn,'bases',row['id']):self.put(conn,'bases',row)
            for row in backup.get('sessions',[]):
                if row['id'].startswith('prefs:'):
                    if not self.get(conn,'sessions',row['id']):self.put(conn,'sessions',row)
                elif row['id']!='active' and row.get('projectId') in mapping:
                    row['projectId']=mapping[row['projectId']];row['id']='draft:'+row['projectId'];self.put(conn,'sessions',row)
            return dict(mapping=mapping)
        raise ValueError('未知工程库操作')
