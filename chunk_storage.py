"""Derived immutable baseline chunks; portable baselines remain authoritative."""
import base64
import gzip
import hashlib
import json
import re

def setup(conn):
    conn.execute('CREATE TABLE IF NOT EXISTS designer_chunk_manifests (base_key TEXT PRIMARY KEY, source_hash TEXT NOT NULL, header BLOB NOT NULL)')
    conn.execute('CREATE TABLE IF NOT EXISTS designer_baseline_chunks (base_key TEXT NOT NULL, chunk_key TEXT NOT NULL, block_count INTEGER NOT NULL, payload BLOB NOT NULL, PRIMARY KEY(base_key,chunk_key))')

def encode(value):
    return gzip.compress(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode('utf-8'),compresslevel=1,mtime=0)

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
