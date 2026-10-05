import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

const $ = id => document.getElementById(id);
let token, instance, current, revision=0, preview=null, catalogue, selectedState={Name:'minecraft:stone_bricks'}, selectedBlock=null;
let mode='orbit', searchOffset=0, renderEpoch=0, renderModels=[], modelIssues=[], pointerStart;
let activeLibrary=null, libraryOffset=0, libraryFormDirty=false;
const modelCache=new Map(), materialCache=new Map(), geometryCache=new Map();
const host=$('scene');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}
catch(error){$('status').textContent='WebGL 初始化失败：'+error.message;throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(0x131c25);host.appendChild(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(42,1,.1,20000);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.12;controls.maxPolarAngle=Math.PI*.92;
camera.position.set(32,25,35);controls.target.set(9,4,7);
scene.add(new THREE.HemisphereLight(0xc2e1fa,0x697978,2.2));
const sun=new THREE.DirectionalLight(0xffe1bb,2.5);sun.position.set(40,70,25);scene.add(sun);
const grid=new THREE.GridHelper(256,256,0x487162,0x243741);grid.position.set(.5,-.02,.5);scene.add(grid);
const axes=new THREE.AxesHelper(5);scene.add(axes);
const group=new THREE.Group();scene.add(group);
const selectBox=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02,1.02,1.02)),new THREE.LineBasicMaterial({color:0x9bffcb}));selectBox.visible=false;scene.add(selectBox);
const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});

function notify(text,error=false){$('toast').textContent=text;$('toast').style.background=error?'#493028':'#273b36';$('toast').hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').hidden=true,error?9000:4500);$('status').textContent=text;}
async function api(path,body,retry=true){const res=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json','X-CraftStudio-Token':token},body:JSON.stringify(body)}:{});const data=await res.json();if(!res.ok){if(body&&retry&&data.error?.includes('令牌无效')){const bootstrap=await api('/api/bootstrap');token=bootstrap.token;return api(path,body,false);}throw new Error(data.error||'请求失败');}return data;}
async function task(action){$('busy').hidden=false;try{return await action();}catch(e){notify(e.message,true);}finally{$('busy').hidden=true;}}
function coords(id){const out=$(id).value.trim().split(/[\s,，]+/).map(Number);if(out.length!==3||out.some(v=>!Number.isInteger(v)))throw new Error('请输入三个整数坐标，以空格分隔');return out;}
function button(text,action,className='file-item'){const b=document.createElement('button');b.className=className;b.textContent=text;b.onclick=()=>task(action);return b;}
function setMode(value){mode=value;for(const k of ['orbit','place','erase'])$(k).classList.toggle('active',k===value);renderer.domElement.style.cursor=value==='orbit'?'grab':'crosshair';}

function material(key,tint=false){
 const cacheKey=key+'|'+tint;
 if(materialCache.has(cacheKey))return materialCache.get(cacheKey);
 const options={color:key?0xffffff:0xdb67d3,side:THREE.DoubleSide,alphaTest:.1};
 if(tint)options.color=0x91b963;
 if(key){const texture=new THREE.TextureLoader().load('/api/resource?instance='+encodeURIComponent(instance)+'&key='+encodeURIComponent(key),t=>{if(t.image.height>t.image.width){const ratio=t.image.width/t.image.height;t.repeat.y=ratio;t.offset.y=1-ratio;}});texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;options.map=texture;if(/glass|ice|water/.test(key)){options.transparent=true;options.opacity=.72;options.depthWrite=false;}}
 const result=new THREE.MeshLambertMaterial(options);materialCache.set(cacheKey,result);return result;
}

function defaultUV(direction,f,t){const [x0,y0,z0]=f,[x1,y1,z1]=t;switch(direction){case'down':return[x0,16-z1,x1,16-z0];case'up':return[x0,z0,x1,z1];case'north':return[16-x1,16-y1,16-x0,16-y0];case'south':return[x0,16-y1,x1,16-y0];case'west':return[z0,16-y1,z1,16-y0];default:return[16-z1,16-y1,16-z0,16-y0];}}
function shape(model){
 const key=JSON.stringify(model);
 if(geometryCache.has(key))return geometryCache.get(key);
 const positions=[],normals=[],uvs=[],mats=[],groups=[];
 const parts=model.missing?[{elements:[{from:[0,0,0],to:[16,16,16],faces:Object.fromEntries(['east','west','up','down','south','north'].map(d=>[d,{texture:null}]))}]}]:model.parts;
 for(const part of parts){
  const variant=new THREE.Matrix4().makeTranslation(.5,.5,.5).multiply(new THREE.Matrix4().makeRotationY(-THREE.MathUtils.degToRad(part.y||0))).multiply(new THREE.Matrix4().makeRotationX(-THREE.MathUtils.degToRad(part.x||0))).multiply(new THREE.Matrix4().makeTranslation(-.5,-.5,-.5));
  for(const e of part.elements){
   const [x0,y0,z0]=e.from.map(v=>v/16),[x1,y1,z1]=e.to.map(v=>v/16);
   const faces={east:[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],west:[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],up:[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],down:[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],south:[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],north:[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]]};
   const element=new THREE.Matrix4();
   if(e.rotation){const r=e.rotation,o=r.origin.map(v=>v/16),axis=r.axis;const rot=new THREE.Matrix4()['makeRotation'+axis.toUpperCase()](THREE.MathUtils.degToRad(r.angle));const scale=new THREE.Vector3(1,1,1);if(r.rescale){for(const a of ['x','y','z'])if(a!==axis)scale[a]=1/Math.cos(THREE.MathUtils.degToRad(r.angle));}element.makeTranslation(...o).multiply(rot).multiply(new THREE.Matrix4().makeScale(scale.x,scale.y,scale.z)).multiply(new THREE.Matrix4().makeTranslation(...o.map(v=>-v)));}
   const transform=variant.clone().multiply(element);
   for(const [direction,face] of Object.entries(e.faces||{})){
    if(!faces[direction])continue;
    const verts=faces[direction].map(v=>new THREE.Vector3(...v).applyMatrix4(transform));
    const normal=new THREE.Vector3().subVectors(verts[1],verts[0]).cross(new THREE.Vector3().subVectors(verts[2],verts[0])).normalize();
    const uv=(face.uv||defaultUV(direction,e.from,e.to)).map(v=>v/16),[u0,v0,u1,v1]=uv;
    const rawUV=[[u0,1-v1],[u1,1-v1],[u1,1-v0],[u0,1-v0]],turn=(face.rotation||0)/90;
    const m=material(face.texture,face.tintindex!==undefined);let mi=mats.indexOf(m);if(mi<0){mi=mats.length;mats.push(m);}
    const start=positions.length/3;
    for(const i of [0,1,2,0,2,3]){positions.push(...verts[i].toArray());normals.push(...normal.toArray());uvs.push(...rawUV[(i+turn)%4]);}
    groups.push({start,count:6,materialIndex:mi});
   }
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));for(const g of groups)geometry.addGroup(g.start,g.count,g.materialIndex);geometry.computeBoundingSphere();
 const result={geometry,materials:mats};geometryCache.set(key,result);return result;
}

function rebuild(p){
 for(const mesh of [...group.children]){group.remove(mesh);mesh.dispose();}
 const layer=Number($('slice').value),buckets=new Map();
 for(const b of p.blocks){if(b.pos[1]>layer)continue;if(!buckets.has(b.state))buckets.set(b.state,[]);buckets.get(b.state).push(b);}
 const matrix=new THREE.Matrix4();
 for(const [state,blocks]of buckets){const model=renderModels[state];if(!model)continue;const asset=shape(model);if(!asset.geometry.attributes.position.count)continue;const mesh=new THREE.InstancedMesh(asset.geometry,asset.materials,blocks.length);blocks.forEach((b,i)=>{matrix.makeTranslation(...b.pos);mesh.setMatrixAt(i,matrix);});mesh.userData.blocks=blocks;mesh.computeBoundingSphere();group.add(mesh);}
 selectBox.visible=false;selectedBlock=null;
 $('slice-value').textContent=layer>=p.size[1]-1?'全部':`Y ≤ ${layer}`;
 $('project-title').textContent=p.name;
 $('project-meta').textContent=`${p.size.join(' × ')} 格 · ${p.blocks.length.toLocaleString()} 方块 · ${preview?'AI 方案':'实时结构'}`;
 $('render-status').textContent=`${group.children.length} 组实例 · ${renderModels.filter(m=>m.missing).length} 种占位模型`;
 $('scene').dataset.blocks=String(p.blocks.length);$('scene').dataset.meshes=String(group.children.length);
}
async function showProject(p,fit=true){
 const epoch=++renderEpoch;
 const keys=p.palette.map(s=>instance+'|'+JSON.stringify(s));
 const missing=p.palette.filter((s,i)=>!modelCache.has(keys[i]));
 if(missing.length){const data=await api('/api/models',{instance,states:missing});data.models.forEach((m,i)=>modelCache.set(instance+'|'+JSON.stringify(missing[i]),m));}
 if(epoch!==renderEpoch)return;
 renderModels=keys.map(key=>modelCache.get(key));
 const oldMax=Number($('slice').max),oldValue=Number($('slice').value);$('slice').max=String(p.size[1]-1);$('slice').value=String(fit||oldValue>=oldMax?p.size[1]-1:Math.min(oldValue,p.size[1]-1));
 rebuild(p);if(fit)fitScene(p);
 modelIssues=renderModels.flatMap(m=>m.issues.map(issue=>m.id+'：'+issue));
 const issues=[...(catalogue?.summary.warnings||[]),...(p.warnings||[]),...new Set(modelIssues)];
 $('issues').replaceChildren(...issues.map(text=>{const d=document.createElement('div');d.className='issue';d.textContent=text;return d;}));$('issue-count').textContent=issues.length?`(${issues.length})`:'无警告';
}
function fitScene(p=preview||current){const [w,h,d]=p.size;const center=new THREE.Vector3(w/2,h/2,d/2);controls.target.copy(center);const distance=Math.max(w,h,d)*1.8+5;camera.position.copy(center).add(new THREE.Vector3(distance*.75,distance*.58,distance*.85));camera.near=.1;camera.far=Math.max(20000,distance*20);camera.updateProjectionMatrix();controls.update();grid.position.set(Math.floor(w/2)+.5,-.02,Math.floor(d/2)+.5);}
async function update(data,fit=false){const changed=(activeLibrary?.id||null)!==(data.library?.id||null);activeLibrary=data.library||null;current=data.project;revision=data.revision;if(changed||!libraryFormDirty){$('library-title').value=activeLibrary?.title||current.name;$('library-description').value=activeLibrary?.description||'';$('library-tags').value=(activeLibrary?.tags||[]).join(', ');$('save-kind').value=activeLibrary?.kind||'project';libraryFormDirty=false;}$('library-current').textContent=activeLibrary?`本地工程 · 已保存 ${activeLibrary.head} 个版本 · 当前编辑自动保存`:'当前编辑自动保存；点击保存加入工程库';preview=null;$('preview-banner').hidden=true;$('undo').disabled=!data.undo;$('redo').disabled=!data.redo;$('material-total').textContent=`${data.materials.length} 种`;$('materials').replaceChildren(...data.materials.map(item=>{const d=document.createElement('div');d.className='material-row';const name=document.createElement('span'),count=document.createElement('span');name.textContent=item.id;count.textContent=item.count.toLocaleString();d.append(name,count);return d;}));await showProject(current,fit);}

async function selectMaterial(state,label){selectedState=state;$('selected-id').textContent=state.Name;$('selected-name').textContent=label||state.Name.split(':')[1];const {models:[m]}=await api('/api/models',{instance,states:[state]});selectedState=m.state;$('model-source').textContent='模型来源：'+m.source+(m.missing?' · 占位模型':'');$('state-fields').replaceChildren();for(const [key,value] of Object.entries(selectedState.Properties||{})){const l=document.createElement('label');l.textContent=key;const input=document.createElement('input');input.value=value;input.onchange=()=>selectedState.Properties[key]=input.value;l.appendChild(input);$('state-fields').appendChild(l);}document.querySelectorAll('.block-item').forEach(el=>el.classList.toggle('selected',el.dataset.id===state.Name));}
async function search(){const data=await api('/api/blocks?instance='+encodeURIComponent(instance)+'&q='+encodeURIComponent($('search').value)+'&offset='+searchOffset);$('block-list').replaceChildren(...data.items.map(item=>{const b=button('',()=>selectMaterial({Name:item.id},item.label),'block-item');b.dataset.id=item.id;b.classList.toggle('selected',item.id===selectedState.Name);const swatch=document.createElement('span');swatch.className='swatch';swatch.textContent=item.source==='create'?'⚙':'◇';const text=document.createElement('span'),name=document.createElement('strong'),small=document.createElement('small');name.textContent=item.label;small.textContent=item.id;text.append(name,small);b.append(swatch,text);return b;}));$('page-info').textContent=`${data.total?searchOffset+1:0}–${Math.min(searchOffset+100,data.total)} / ${data.total}`;$('prev').disabled=searchOffset===0;$('next').disabled=searchOffset+100>=data.total;}
async function loadInstance(){instance=$('instance').value;catalogue=await api('/api/catalogue?instance='+encodeURIComponent(instance));$('block-count').textContent=catalogue.summary.blocks.toLocaleString()+' 方块';$('environment').textContent=catalogue.summary.sources+' 个资源来源';$('packs').textContent='生效材质包：'+(catalogue.summary.packs.join('、')||'原版 / Mod 默认');$('asset-status').textContent=`${catalogue.summary.resources.toLocaleString()} 资源 · ${catalogue.summary.fingerprint}`;searchOffset=0;await search();$('file-list').replaceChildren(...catalogue.schematics.map(file=>button(file.name+' · '+Math.round(file.bytes/1024)+' KB',async()=>{await update(await api('/api/import',{instance,path:file.path,revision}),true);notify('已导入 '+file.name);})));$('world').replaceChildren(...catalogue.worlds.map(world=>{const o=document.createElement('option');o.value=world.id;o.textContent=world.id;return o;}));worldDimensions();geometryCache.forEach(a=>a.geometry.dispose());geometryCache.clear();materialCache.forEach(m=>{m.map?.dispose();m.dispose();});materialCache.clear();await showProject(current,true);await selectMaterial(selectedState);notify('实例已载入：'+instance);}
function worldDimensions(){const world=catalogue?.worlds.find(w=>w.id===$('world').value);$('dimension').replaceChildren(...(world?.dimensions||[]).map(d=>{const o=document.createElement('option');o.value=d;o.textContent=d;return o;}));}
async function openLibrary(id,version){const data=await api('/api/library/open',{id,version,revision});const desired=data.project.metadata?.instance;if(desired&&desired!==instance&&[...$('instance').options].some(o=>o.value===desired)){current=data.project;revision=data.revision;$('instance').value=desired;await loadInstance();}libraryFormDirty=false;await update(data,true);notify('已从本地工程库打开'+(data.draftRestored?' · 已恢复编辑草稿':version?' · v'+version:''));}
function kindLabel(kind){return {project:'工程',blueprint:'蓝图',component:'构件'}[kind]||kind;}
async function projectList(){const filter=$('library-filter').value;const params=new URLSearchParams({q:$('library-search').value,kind:$('library-kind').value,offset:String(libraryOffset),favorite:filter==='favorite'?'1':'0',deleted:filter==='trash'?'1':'0'});const data=await api('/api/library?'+params);const cards=data.items.map(item=>{const card=document.createElement('article');card.className='project-card';if(item.id===activeLibrary?.id)card.classList.add('current');const title=document.createElement('strong');title.textContent=item.title;const info=document.createElement('small');info.textContent=`${kindLabel(item.kind)} · ${item.block_count.toLocaleString()} 方块 · v${item.head}`;const date=document.createElement('small');date.textContent=new Date(item.updated_at).toLocaleString();card.append(title,info,date);if(item.tags.length){const tags=document.createElement('div');tags.className='project-tags';tags.textContent=item.tags.map(t=>'#'+t).join(' ');card.append(tags);}if(item.description){const desc=document.createElement('p');desc.textContent=item.description;card.append(desc);}const row=document.createElement('div');row.className='project-actions';if(item.deleted_at){row.append(button('恢复',async()=>{await api('/api/library/restore',{id:item.id});await projectList();notify('工程已恢复');},''));}else{row.append(button('打开',()=>openLibrary(item.id),'primary'),button(item.favorite?'★':'☆',async()=>{const result=await api('/api/library/metadata',{id:item.id,changes:{favorite:!item.favorite}});if(activeLibrary?.id===item.id)activeLibrary=result.item;await projectList();},''),button('移入回收站',async()=>{const result=await api('/api/library/trash',{id:item.id});await update(result.snapshot,false);await projectList();notify('已移入回收站，工程与版本均可恢复');},''));const versions=document.createElement('details');versions.className='project-versions';const summary=document.createElement('summary');summary.textContent='版本记录';versions.append(summary);versions.ontoggle=async()=>{if(!versions.open||versions.dataset.loaded)return;try{const history=await api('/api/library/versions?id='+encodeURIComponent(item.id));for(const v of history){const b=button(`v${v.number} · ${v.note||new Date(v.created_at).toLocaleString()}`,()=>openLibrary(item.id,v.number),'version-item');versions.append(b);}versions.dataset.loaded='1';}catch(error){notify(error.message,true);}};card.append(versions);}card.append(row);return card;});$('project-list').replaceChildren(...cards);if(!cards.length){const empty=document.createElement('p');empty.className='muted';empty.textContent=filter==='trash'?'回收站为空':'没有匹配的工程。点击右上角保存，把当前建筑加入本地库。';$('project-list').append(empty);}$('library-page').textContent=`${data.total?libraryOffset+1:0}–${Math.min(libraryOffset+60,data.total)} / ${data.total}`;$('library-prev').disabled=libraryOffset===0;$('library-next').disabled=libraryOffset+60>=data.total;const stats=await api('/api/library/stats');$('database-info').textContent=`SQLite · ${stats.projects} 个工程 · ${stats.versions} 个版本 · ${stats.blocks.toLocaleString()} 条素材索引`;}
async function saveLibrary(saveAs=false){if(preview)throw new Error('请先采用 AI 方案再保存');const name=$('library-title').value.trim()||current.name;const data=await api('/api/save',{name,instance,revision,saveAs,head:!saveAs&&activeLibrary?activeLibrary.head:undefined,description:$('library-description').value,tags:$('library-tags').value.split(/[,，]/).map(t=>t.trim()).filter(Boolean),kind:$('save-kind').value,note:$('version-note').value});libraryFormDirty=false;await update(data.snapshot,false);$('version-note').value='';if(!$('left-projects').hidden)await projectList();notify(data.warning||`已保存到本地工程库：${data.name} · v${data.library.head}`);}

document.querySelectorAll('[data-left]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-left]').forEach(x=>x.classList.toggle('active',x===b));for(const k of ['blocks','files','worlds','projects'])$('left-'+k).hidden=k!==b.dataset.left;if(b.dataset.left==='projects')task(projectList);});
document.querySelectorAll('[data-right]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-right]').forEach(x=>x.classList.toggle('active',x===b));for(const k of ['design','ai','bridge'])$('right-'+k).hidden=k!==b.dataset.right;});
$('instance').onchange=()=>task(loadInstance);$('world').onchange=worldDimensions;
$('search').oninput=()=>{clearTimeout(search.timer);search.timer=setTimeout(()=>{searchOffset=0;task(search);},300);};
$('prev').onclick=()=>task(async()=>{searchOffset=Math.max(0,searchOffset-100);await search();});$('next').onclick=()=>task(async()=>{searchOffset+=100;await search();});
for(const k of ['orbit','place','erase'])$(k).onclick=()=>setMode(k);
$('fit').onclick=()=>fitScene();$('top').onclick=()=>{const p=preview||current;controls.target.set(p.size[0]/2,0,p.size[2]/2);camera.position.set(p.size[0]/2,.1+Math.max(...p.size)*2,p.size[2]/2+.01);controls.update();};$('grid').onclick=()=>{grid.visible=!grid.visible;axes.visible=grid.visible;$('grid').classList.toggle('active',grid.visible);};
$('slice').oninput=()=>rebuild(preview||current);
for(const k of ['undo','redo'])$(k).onclick=()=>task(async()=>update(await api('/api/'+k,{})));
$('rotate').onclick=()=>task(async()=>update(await api('/api/rotate',{revision}),true));
$('generate').onclick=()=>task(async()=>{await update(await api('/api/generate',{instance,revision,params:{width:Number($('width').value),length:Number($('length').value),height:Number($('height').value),wall:selectedState.Name}}),true);notify('参数化工坊已生成，可直接编辑');});
async function edit(operations){if(preview)throw new Error('请先采用 AI 方案或返回当前工程');await update(await api('/api/edit',{instance,revision,operations}));}
$('fill').onclick=()=>task(()=>edit([{type:'fill',min:coords('edit-min'),max:coords('edit-max'),state:selectedState}]));
$('clear-region').onclick=()=>task(()=>edit([{type:'erase',min:coords('edit-min'),max:coords('edit-max')}]));
$('replace-material').onclick=()=>task(async()=>{if(!selectedBlock)throw new Error('先点选一个需要替换的方块');const from=current.palette[selectedBlock.state].Name;await edit([{type:'replace',from,state:selectedState}]);notify('已替换 '+from);});
$('save').onclick=()=>task(()=>saveLibrary());
$('save-library').onclick=()=>task(()=>saveLibrary());$('save-copy').onclick=()=>task(()=>saveLibrary(true));
for(const field of ['library-title','library-description','library-tags','save-kind'])$(field).oninput=()=>libraryFormDirty=true;
$('export-project').onclick=()=>task(async()=>{if(preview)throw new Error('请先采用方案');const blob=new Blob([JSON.stringify(current)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=current.name+'.craft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);notify('完整工程 JSON 已导出，可再次导入');});
$('export').onclick=()=>task(async()=>{if(preview)throw new Error('请先采用方案再导出');const res=await fetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json','X-CraftStudio-Token':token},body:JSON.stringify({name:current.name})});if(!res.ok)throw new Error((await res.json()).error);const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=current.name.replaceAll(':','_')+'.nbt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);notify('NBT 已导出，同时保存在 CraftStudio/exports');});
$('read-world').onclick=()=>task(async()=>{if(!$('world').value)throw new Error('当前实例没有存档');await update(await api('/api/world',{instance,world:$('world').value,dimension:$('dimension').value,min:coords('world-min'),max:coords('world-max'),revision}),true);notify('存档区域已读入 3D 场景');});
$('refresh-projects').onclick=()=>task(projectList);
$('library-search').oninput=()=>{clearTimeout(projectList.timer);projectList.timer=setTimeout(()=>{libraryOffset=0;task(projectList);},300);};
for(const field of ['library-kind','library-filter'])$(field).onchange=()=>task(async()=>{libraryOffset=0;await projectList();});
$('library-prev').onclick=()=>task(async()=>{libraryOffset=Math.max(0,libraryOffset-60);await projectList();});$('library-next').onclick=()=>task(async()=>{libraryOffset+=60;await projectList();});
$('database-backup').onclick=()=>task(async()=>{const data=await api('/api/library/backup',{});notify('数据库已备份：'+data.file);});
$('upload').onchange=()=>task(async()=>{const file=$('upload').files[0];if(!file)return;const bytes=new Uint8Array(await file.arrayBuffer());if(file.name.endsWith('.json'))await update(await api('/api/import',{instance,revision,project:JSON.parse(new TextDecoder().decode(bytes))}),true);else{let str='';for(let i=0;i<bytes.length;i+=32768)str+=String.fromCharCode(...bytes.subarray(i,i+32768));await update(await api('/api/import',{instance,revision,name:file.name,data:btoa(str)}),true);}notify('已导入 '+file.name);$('upload').value='';});

renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,button:e.button};});
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||pointerStart.button!==0||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(group.children,false)[0];if(hit){const b=hit.object.userData.blocks[hit.instanceId];selectedBlock=b;selectBox.visible=true;selectBox.position.set(...b.pos.map(v=>v+.5));const state=(preview||current).palette[b.state];$('selected-details').textContent=JSON.stringify({pos:b.pos,state,blockEntity:!!b.nbt},null,2);$('selection-status').textContent=b.pos.join(', ')+' · '+state.Name;$('edit-min').value=b.pos.join(' ');$('edit-max').value=b.pos.join(' ');if(mode==='erase')task(()=>edit([{type:'erase',min:b.pos,max:b.pos}]));if(mode==='place'){const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);const dominant=[0,1,2].reduce((best,a)=>Math.abs(n.getComponent(a))>Math.abs(n.getComponent(best))?a:best,0);const pos=b.pos.map((v,a)=>v+(a===dominant?Math.sign(n.getComponent(a)):0));if(pos.some(v=>v<0)){notify('不能放置到工程负坐标',true);return;}task(()=>edit([{type:'set',pos,state:selectedState}]));}}else if(mode==='place'){const point=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point)){const pos=[Math.floor(point.x),0,Math.floor(point.z)];if(pos[0]>=0&&pos[2]>=0)task(()=>edit([{type:'set',pos,state:selectedState}]));}}});
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.ctrlKey&&e.key.toLowerCase()==='z'){e.preventDefault();$('undo').click();}if(e.ctrlKey&&e.key.toLowerCase()==='y'){e.preventDefault();$('redo').click();}if(e.key.toLowerCase()==='f')fitScene();});

$('ai-plan').onclick=()=>task(async()=>{if(!$('ai-endpoint').value||!$('ai-model').value||!$('ai-prompt').value)throw new Error('请填写接口地址、模型与设计需求');let image;if($('ai-image').checked){renderer.render(scene,camera);const c=document.createElement('canvas');c.width=768;c.height=Math.round(768*renderer.domElement.height/renderer.domElement.width);c.getContext('2d').drawImage(renderer.domElement,0,0,c.width,c.height);image=c.toDataURL('image/jpeg',.8);}const result=await api('/api/ai/plan',{instance,endpoint:$('ai-endpoint').value,model:$('ai-model').value,key:$('ai-key').value,prompt:$('ai-prompt').value,materialQuery:$('ai-material').value,image});preview=result.project;$('ai-result').textContent=result.summary+'\n'+result.operations.length+' 个结构操作';$('preview-banner').hidden=false;await showProject(preview,false);notify('AI 方案已在 3D 场景中预览');});
$('accept-ai').onclick=()=>task(async()=>{await update(await api('/api/ai/apply',{}));notify('AI 方案已采用，可继续手工编辑');});$('cancel-ai').onclick=()=>task(async()=>{preview=null;$('preview-banner').hidden=true;await showProject(current,false);});
async function bridge(action,payload={}){const result=await api('/api/bridge/'+action,{port:Number($('bridge-port').value),token:$('bridge-token').value,revision,payload});$('bridge-result').textContent=JSON.stringify(result,null,2);return result;}
async function followJob(job){if(!job.id)return;while(['queued','building'].includes(job.status)){await new Promise(resolve=>setTimeout(resolve,700));job=await bridge('job',{id:job.id});}if(job.status!=='completed')throw new Error(job.error||'建造验证未通过，请检查游戏与备份');notify('建造已完成，回读方块状态 '+job.verifiedStates+' 个；请在游戏中检查机器运行');}
$('bridge-health').onclick=()=>task(async()=>{const result=await bridge('health');$('bridge-status').textContent=result.status||'已连接';});
$('bridge-read').onclick=()=>task(async()=>{const origin=coords('bridge-origin'),size=coords('bridge-size');const result=await bridge('read',{dimension:$('bridge-dimension').value,origin,size});if(result.project)await update(result,true);notify('游戏区域已载入');});
$('bridge-build').onclick=()=>task(async()=>{if(preview)throw new Error('请先采用方案');await followJob(await bridge('apply',{dimension:$('bridge-dimension').value,origin:coords('bridge-origin'),overwrite:$('bridge-overwrite').checked}));});
$('bridge-undo').onclick=()=>task(async()=>followJob(await bridge('undo')));

await task(async()=>{const data=await api('/api/bootstrap');token=data.token;current=data.project.project;revision=data.project.revision;$('instance').replaceChildren(...data.instances.map(i=>{const o=document.createElement('option');o.value=i.id;o.textContent=i.id+' · '+i.loader;return o;}));const preferred=data.instances.find(i=>i.mods)||data.instances[0];if(!preferred)throw new Error('没有找到 Minecraft 实例');$('instance').value=preferred.id;await loadInstance();await update(data.project,true);});
let polling=false;
setInterval(async()=>{if(polling||!$('busy').hidden||!current)return;polling=true;try{const data=await api('/api/project');if(data.revision!==revision){if(preview)notify('外部 AI 已更新工程，旧预览已清除');await update(data,false);}}catch(error){$('status').textContent='本地服务连接中断，请重新启动工作台';}finally{polling=false;}},1500);
