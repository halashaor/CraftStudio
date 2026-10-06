"""Derived immutable baseline chunks; portable baselines remain authoritative."""
import base64
import gzip
import hashlib
import json
import re

def setup(conn):
    conn.execute('CREATE TABLE IF NOT EXISTS designer_chunk_manifests (base_key TEXT PRIMARY KEY, source_hash TEXT NOT NULL, header BLOB NOT NULL)')
    conn.execute('CREATE TABLE IF NOT EXISTS designer_chunk_workspaces (workspace_id TEXT PRIMARY KEY, base_key TEXT NOT NULL, revision INTEGER NOT NULL, digest TEXT NOT NULL, header BLOB NOT NULL)')
    conn.execute('CREATE TABLE IF NOT EXISTS designer_overlay_chunks (workspace_id TEXT NOT NULL, chunk_key TEXT NOT NULL, digest TEXT NOT NULL, payload BLOB NOT NULL, PRIMARY KEY(workspace_id,chunk_key))')
    conn.execute('CREATE TABLE IF NOT EXISTS designer_baseline_chunks (base_key TEXT NOT NULL, chunk_key TEXT NOT NULL, block_count INTEGER NOT NULL, payload BLOB NOT NULL, PRIMARY KEY(base_key,chunk_key))')

def encode(value):
    return gzip.compress(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode('utf-8',errors='backslashreplace'),compresslevel=1,mtime=0)

def manifest(conn,base_key,load_base):
    cached=conn.execute('SELECT header FROM designer_chunk_manifests WHERE base_key=?',(base_key,)).fetchone()
    if cached:return json.loads(gzip.decompress(cached[0]))
    row=load_base(base_key)
    if not row:raise ValueError('原始场地基线不存在')
    try:
        raw=base64.b64decode(row['bytes']['$bytes'],validate=True)
        project=json.loads(gzip.decompress(raw))
    except (KeyError,ValueError,TypeError,OSError) as error:raise ValueError('原始场地不是有效的共享设计器基线') from error
    if not isinstance(project,dict) or not isinstance(project.get('blocks'),list) or not isinstance(project.get('palette'),list):raise ValueError('基线缺少方块或调色板')
    size=project.get('size');origin=project.get('origin')
    if not isinstance(size,list) or len(size)!=3 or any(type(n)is not int or n<1 or n>4096 for n in size):raise ValueError('基线尺寸无效')
    if not isinstance(origin,list) or len(origin)!=3 or any(type(n)is not int for n in origin):raise ValueError('基线原点无效')
    grouped={};seen=set()
    for block in project['blocks']:
        pos=block.get('pos') if isinstance(block,dict) else None
        state=block.get('state') if isinstance(block,dict) else None
        if not isinstance(pos,list) or len(pos)!=3 or any(type(n)is not int or n<0 or n>=size[a] for a,n in enumerate(pos)) or type(state)is not int or state<0 or state>=len(project['palette']):raise ValueError('基线方块坐标或状态无效')
        coord=tuple(pos)
        if coord in seen:raise ValueError('基线存在重复方块坐标')
        seen.add(coord);key=','.join(str(n//16) for n in pos);grouped.setdefault(key,[]).append(block)
    descriptors=[];total_bytes=0
    for key,blocks in sorted(grouped.items()):
        data=encode(blocks);total_bytes+=len(data);conn.execute('INSERT INTO designer_baseline_chunks VALUES (?,?,?,?)',(base_key,key,len(blocks),data));descriptors.append({'key':key,'blocks':len(blocks),'bytes':len(data)})
    header={k:v for k,v in project.items() if k!='blocks'}
    result={'schema':'craftstudio-baseline-chunks/1','baseKey':base_key,'sourceHash':hashlib.sha256(raw).hexdigest(),'chunkSize':16,'project':header,'blockCount':len(project['blocks']),'chunks':descriptors,'compressedChunkBytes':total_bytes,'coverage':'baseline-records; consult source masks and warnings; absent records do not invent terrain'}
    conn.execute('INSERT INTO designer_chunk_manifests VALUES (?,?,?)',(base_key,result['sourceHash'],encode(result)))
    return result

def read_chunks(conn,base_key,keys):
    cached=conn.execute('SELECT header,source_hash FROM designer_chunk_manifests WHERE base_key=?',(base_key,)).fetchone()
    if not cached:raise ValueError('请先读取基线区块索引')
    if not isinstance(keys,list) or any(not isinstance(key,str) or not re.fullmatch(r'(?:0|[1-9][0-9]*),(?:0|[1-9][0-9]*),(?:0|[1-9][0-9]*)',key) for key in keys):raise ValueError('区块键需要非负整数 X,Y,Z')
    if len(keys)>128:raise ValueError('一次读取最多 128 个区块，请分批读取')
    header=json.loads(gzip.decompress(cached[0]));size=header['project']['size'];items=[]
    for key in dict.fromkeys(keys):
        chunk=[int(n) for n in key.split(',')]
        if any(n*16>=size[a] for a,n in enumerate(chunk)):
            items.append({'key':key,'status':'outside','blocks':0});continue
        row=conn.execute('SELECT block_count,payload FROM designer_baseline_chunks WHERE base_key=? AND chunk_key=?',(base_key,key)).fetchone()
        items.append({'key':key,'status':'records' if row else 'empty-records','blocks':row[0] if row else 0,'bytes':{'$bytes':base64.b64encode(row[1] if row else encode([])).decode('ascii')}})
    return {'schema':header['schema'],'baseKey':base_key,'sourceHash':cached[1],'items':items,'complete':True,'coverage':header['coverage']}

def workspace_head(conn,workspace_id):
    row=conn.execute('SELECT base_key,revision,digest,header FROM designer_chunk_workspaces WHERE workspace_id=?',(workspace_id,)).fetchone()
    if not row:return None
    return {'workspaceId':workspace_id,'baseKey':row[0],'revision':row[1],'digest':row[2],'snapshot':json.loads(gzip.decompress(row[3]))}

def checkpoint(conn,data,expected):
    identifier=data.get('workspaceId');base_key=data.get('baseKey');revision=data.get('revision');snapshot=data.get('snapshot')
    if not isinstance(identifier,str) or not identifier or type(revision)is not int or revision<0 or not isinstance(snapshot,dict):raise ValueError('区块检查点需要工程标识、版本与增量快照')
    baseline=conn.execute('SELECT header FROM designer_chunk_manifests WHERE base_key=?',(base_key,)).fetchone()
    if not baseline:raise ValueError('先建立原始基线索引')
    size=snapshot.get('size');palette=snapshot.get('palette');overlay=snapshot.get('overlay')
    if not isinstance(size,list) or len(size)!=3 or any(type(n)is not int or n<1 or n>4096 for n in size) or not isinstance(palette,list) or not isinstance(overlay,list):raise ValueError('增量快照尺寸、调色板或方块无效')
    base=json.loads(gzip.decompress(baseline[0]));origin=snapshot.get('origin')
    if not isinstance(origin,list) or len(origin)!=3 or any(type(n)is not int for n in origin):raise ValueError('检查点原点无效')
    if any(size[a]<n for a,n in enumerate(base['project']['size'])):raise ValueError('检查点不能隐藏原始基线范围')
    if any(not isinstance(state,dict) or not isinstance(state.get('Name'),str) for state in palette):raise ValueError('检查点调色板状态无效')
    state_key=lambda state:json.dumps(state,sort_keys=True,separators=(',',':'))
    known={state_key(state) for state in palette}
    if any(state_key(state) not in known for state in base['project']['palette']):raise ValueError('增量调色板缺少原始状态')
    raw=encode(snapshot);digest=hashlib.sha256(raw).hexdigest();old=workspace_head(conn,identifier)
    if old and old['baseKey']!=base_key:raise ValueError('工程标识关联的基线不同')
    if old and old['revision']==revision:
        if old['digest']!=digest:raise ValueError('同一工程版本对应不同内容')
        return {**old,'changedChunks':[],'removedChunks':[],'replayed':True}
    if (old['revision'] if old else None)!=expected:raise ValueError('数据库检查点版本冲突')
    if old and revision<old['revision']:raise ValueError('不能写入过期检查点')
    grouped={};seen=set()
    for block in overlay:
        pos=block.get('pos') if isinstance(block,dict) else None
        if not isinstance(pos,list) or len(pos)!=3 or any(type(n)is not int or n<0 or n>=size[a] for a,n in enumerate(pos)):raise ValueError('增量方块坐标无效')
        if tuple(pos) in seen:raise ValueError('增量方块坐标重复')
        seen.add(tuple(pos))
        if block.get('state') is not None and state_key(block['state']) not in known:raise ValueError('增量状态不在调色板中')
        key=','.join(str(n//16) for n in pos);grouped.setdefault(key,[]).append(block)
    previous={key:digest for key,digest in conn.execute('SELECT chunk_key,digest FROM designer_overlay_chunks WHERE workspace_id=?',(identifier,))};changed=[]
    for key,blocks in grouped.items():
        payload=encode(sorted(blocks,key=lambda b:b['pos']));d=hashlib.sha256(payload).hexdigest()
        if previous.get(key)!=d:
            conn.execute('INSERT OR REPLACE INTO designer_overlay_chunks VALUES (?,?,?,?)',(identifier,key,d,payload));changed.append(key)
    removed=sorted(set(previous)-set(grouped))
    for key in removed:conn.execute('DELETE FROM designer_overlay_chunks WHERE workspace_id=? AND chunk_key=?',(identifier,key))
    header={k:v for k,v in snapshot.items() if k!='overlay'}
    conn.execute('INSERT OR REPLACE INTO designer_chunk_workspaces VALUES (?,?,?,?,?)',(identifier,base_key,revision,digest,encode(header)))
    return {'workspaceId':identifier,'baseKey':base_key,'revision':revision,'digest':digest,'snapshot':header,'changedChunks':changed,'removedChunks':removed,'replayed':False}

def workspace_chunks(conn,workspace_id,keys,expected_revision):
    head=workspace_head(conn,workspace_id)
    if not head:raise ValueError('工程检查点不存在')
    if expected_revision!=head['revision']:raise ValueError('读取版本与检查点不同')
    result=read_chunks(conn,head['baseKey'],keys);palette=head['snapshot']['palette'];state_key=lambda state:json.dumps(state,sort_keys=True,separators=(',',':'));indices={state_key(s):i for i,s in enumerate(palette)}
    baseline=json.loads(gzip.decompress(conn.execute('SELECT header FROM designer_chunk_manifests WHERE base_key=?',(head['baseKey'],)).fetchone()[0]));base_palette=baseline['project']['palette'];size=head['snapshot']['size'];items=[]
    for item in result['items']:
        chunk=[int(n) for n in item['key'].split(',')]
        if any(n*16>=size[a] for a,n in enumerate(chunk)):
            items.append({'key':item['key'],'status':'outside','blocks':0});continue
        blocks=json.loads(gzip.decompress(base64.b64decode(item['bytes']['$bytes']))) if item.get('bytes') else []
        current={tuple(b['pos']):dict(b,state=indices[state_key(base_palette[b['state']])]) for b in blocks}
        row=conn.execute('SELECT payload FROM designer_overlay_chunks WHERE workspace_id=? AND chunk_key=?',(workspace_id,item['key'])).fetchone()
        if row:
            for b in json.loads(gzip.decompress(row[0])):
                pos=tuple(b['pos'])
                if b.get('state') is None:current.pop(pos,None)
                else:current[pos]=dict(b,state=indices[state_key(b['state'])])
        data=sorted(current.values(),key=lambda b:b['pos']);items.append({'key':item['key'],'status':'records' if data else 'empty-records','blocks':len(data),'bytes':{'$bytes':base64.b64encode(encode(data)).decode()}})
    return {'schema':'craftstudio-workspace-chunks/1','workspaceId':workspace_id,'revision':head['revision'],'digest':head['digest'],'baseKey':head['baseKey'],'palette':palette,'size':head['snapshot']['size'],'origin':head['snapshot']['origin'],'items':items,'coverage':result['coverage'],'complete':True}
