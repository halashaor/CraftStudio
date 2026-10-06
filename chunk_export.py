"""Chunk-by-chunk checkpoint export; no complete voxel dictionary is assembled."""
import base64,gzip,io,json,struct
from chunk_storage import workspace_head
from nbt import Tag,payload,string,from_json,intlist,state_tag

def text(value):return json.dumps(value,ensure_ascii=False,separators=(',',':')).encode('utf-8',errors='backslashreplace')
def decode(blob):return json.loads(gzip.decompress(blob))
def base_header(conn,key):
 row=conn.execute('SELECT header FROM designer_chunk_manifests WHERE base_key=?',(key,)).fetchone()
 if not row:raise ValueError('基线索引不存在')
 return decode(row[0])['project']
def merged(conn,head,header,key,indices):
 row=conn.execute('SELECT payload FROM designer_baseline_chunks WHERE base_key=? AND chunk_key=?',(head['baseKey'],key)).fetchone();current={}
 if row:
  for b in decode(row[0]):current[tuple(b['pos'])]=dict(b,state=indices[json.dumps(header['palette'][b['state']],sort_keys=True,separators=(',',':'))])
 row=conn.execute('SELECT payload FROM designer_overlay_chunks WHERE workspace_id=? AND chunk_key=?',(head['workspaceId'],key)).fetchone()
 if row:
  for b in decode(row[0]):
   pos=tuple(b['pos'])
   if b.get('state') is None:current.pop(pos,None)
   else:current[pos]=dict(b,state=indices[json.dumps(b['state'],sort_keys=True,separators=(',',':'))])
 return current

def export_workspace(conn,identifier,revision,format='craftlite',assets=None,title=None):
 head=workspace_head(conn,identifier)
 if not head or head['revision']!=revision:raise ValueError('导出检查点版本不一致')
 if format not in ('craftlite','nbt'):raise ValueError('当前检查点导出支持 craftlite / nbt')
 header=base_header(conn,head['baseKey']);snapshot=dict(head['snapshot']);out=io.BytesIO();stats={'baselineChunks':0,'overlayChunks':0,'blocks':0,'maxChunkRecords':0}
 if title:snapshot['title']=title
 with gzip.GzipFile(fileobj=out,mode='wb',compresslevel=1,mtime=0) as stream:
  if format=='craftlite':
   stream.write(b'{"liteSchema":1,"site":{"base":');stream.write(text(header)[:-1]+b',"blocks":[');first=True
   for payload_blob, in conn.execute('SELECT payload FROM designer_baseline_chunks WHERE base_key=? ORDER BY chunk_key',(head['baseKey'],)):
    blocks=decode(payload_blob);stats['baselineChunks']+=1;stats['blocks']+=len(blocks);stats['maxChunkRecords']=max(stats['maxChunkRecords'],len(blocks))
    for b in blocks:
     if not first:stream.write(b',')
     first=False;stream.write(text(b))
   stream.write(b']},');stream.write(text(snapshot)[1:-1]);stream.write(b',"overlay":[');first=True
   for payload_blob, in conn.execute('SELECT payload FROM designer_overlay_chunks WHERE workspace_id=? ORDER BY chunk_key',(identifier,)):
    blocks=decode(payload_blob);stats['overlayChunks']+=1;stats['maxChunkRecords']=max(stats['maxChunkRecords'],len(blocks))
    for b in blocks:
     if not first:stream.write(b',')
     first=False;stream.write(text(b))
   stream.write(b']},"assets":');stream.write(text(assets or {}));stream.write(b'}')
  else:
   palette=list(snapshot['palette']);indices={json.dumps(s,sort_keys=True,separators=(',',':')):i for i,s in enumerate(palette)};size=snapshot['size'];mask=header.get('metadata',{}).get('placementMask');mask=mask if mask and mask.get('size')==size else None
   def lookup_mask(index,runs):
    lo,hi=0,len(runs)-1
    while lo<=hi:
     mid=(lo+hi)//2;start,count=runs[mid]
     if index<start:hi=mid-1
     elif index>=start+count:lo=mid+1
     else:return True
    return False
   marker_indices={}
   if mask:
    for field,name in [('skipRuns','minecraft:structure_void'),('eraseRuns','minecraft:air')]:
     index=next((i for i,s in enumerate(palette) if s['Name']==name),None)
     if index is None:index=len(palette);palette.append({'Name':name})
     marker_indices[field]=index
   def keys():
    if mask:
     for x in range((size[0]+15)//16):
      for y in range((size[1]+15)//16):
       for z in range((size[2]+15)//16):yield f'{x},{y},{z}'
    else:
     for key, in conn.execute('SELECT chunk_key FROM designer_baseline_chunks WHERE base_key=? UNION SELECT chunk_key FROM designer_overlay_chunks WHERE workspace_id=? ORDER BY chunk_key',(head['baseKey'],identifier)):yield key
   def rows(key):
    current=merged(conn,head,header,key,indices)
    if mask:
     cx,cy,cz=[int(n)*16 for n in key.split(',')];w,_,l=size
     for y in range(cy,min(cy+16,size[1])):
      for z in range(cz,min(cz+16,size[2])):
       for x in range(cx,min(cx+16,size[0])):
        pos=(x,y,z)
        if pos in current:continue
        index=x+w*(z+l*y)
        for field in ('skipRuns','eraseRuns'):
         if lookup_mask(index,mask.get(field,[])):current[pos]={'pos':list(pos),'state':marker_indices[field]}
    return list(current.values())
   total=0;stats['visitedChunks']=0
   stats['baselineChunks']=conn.execute('SELECT COUNT(*) FROM designer_baseline_chunks WHERE base_key=?',(head['baseKey'],)).fetchone()[0]
   stats['overlayChunks']=conn.execute('SELECT COUNT(*) FROM designer_overlay_chunks WHERE workspace_id=?',(identifier,)).fetchone()[0]
   for key in keys():
    blocks=rows(key);total+=len(blocks);stats['maxChunkRecords']=max(stats['maxChunkRecords'],len(blocks));stats['visitedChunks']+=1
   stats['blocks']=total;stream.write(bytes([10])+string(''))
   extra=header.get('metadata',{}).get('nativeExtra',{})
   for key,value in extra.items():
    if key in ('palettes','DataVersion','size','palette','blocks','entities'):continue
    tag=from_json(value);stream.write(bytes([tag.type])+string(key)+payload(tag))
   for key,tag in [('DataVersion',Tag(3,header.get('dataVersion',3955))),('size',intlist(size)),('palette',Tag(9,(10,[state_tag(s).value for s in palette])))]:stream.write(bytes([tag.type])+string(key)+payload(tag))
   stream.write(bytes([9])+string('blocks')+bytes([10])+struct.pack('>i',total))
   for key in keys():
    for b in rows(key):
     obj={'pos':intlist(b['pos']),'state':Tag(3,b['state'])}
     if b.get('nbt'):obj['nbt']=from_json(b['nbt'])
     stream.write(payload(Tag(10,obj)))
   entities=[from_json(e).value for e in header.get('entities',[])];stream.write(bytes([9])+string('entities')+payload(Tag(9,(10,entities)))+b'\0')
 return {'format':format,'workspaceId':identifier,'revision':revision,'digest':head['digest'],'bytes':{'$bytes':base64.b64encode(out.getvalue()).decode()},'stats':stats}
