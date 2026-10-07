import {stateKey} from './codec.js';
import {readPaletteDocument,paletteDocument} from './material-palettes.js';
export function materialPalettesUI({$,host,task,getState,useState,stateLabel,download}){
 const panel=document.createElement('details');panel.id='asset-project-palettes';panel.innerHTML='<summary>工程配色方案</summary><label>当前方案<select id="asset-project-palette"></select></label><label>方案名称<input id="asset-project-palette-name" placeholder="例如：石木住宅、樱木庭院"></label><div class="row"><button id="asset-project-palette-create">新建方案</button><button id="asset-project-palette-rename">改名</button></div><div class="row"><button id="asset-project-palette-add">加入当前形态</button><button id="asset-project-palette-delete">删除方案</button></div><div id="asset-project-palette-states"></div><p class="small">方案随工程保存。选择或删除方案不改建筑，完整素材库始终可用。</p>';host.querySelector('.asset-filters').after(panel);
 const transfer=document.createElement('details');transfer.innerHTML='<summary>跨工程复用</summary><button id="asset-project-palette-export">导出当前方案</button><label>读取方案文件<input type="file" id="asset-project-palette-import" accept=".craftpalette.json,.json"></label><label>导入名称<input id="asset-project-palette-import-name"></label><p id="asset-project-palette-import-preview" class="small">读取后先预览，不改变工程。</p><div id="asset-project-palette-import-states"></div><button id="asset-project-palette-import-confirm" disabled>导入为新方案</button>';panel.append(transfer);
 let summary=null,workspace=null,pending=null;
 function clearImport(){pending=null;$('asset-project-palette-import').value='';$('asset-project-palette-import-name').value='';$('asset-project-palette-import-preview').textContent='读取后先预览，不改变工程。';$('asset-project-palette-import-states').replaceChildren();$('asset-project-palette-import-confirm').disabled=true;}
 const current=()=>summary?.design.materialPalettes?.find(p=>p.id===$('asset-project-palette').value);
 async function mutate(method,params){const result=await window.CraftStudio.request({method,params:{workspaceId:summary.workspaceId,expectedRevision:summary.revision,...params}});if(!result.ok)throw Error(result.error.message);return result.value;}
 function update(s){
  if(!s)return;const changed=workspace!==s.workspaceId;if(changed)clearImport();summary=s;workspace=s.workspaceId;
  const select=$('asset-project-palette'),old=changed?'':select.value;select.replaceChildren(new Option('请选择方案',''),...(s.design.materialPalettes||[]).map(p=>new Option(p.name+' · '+p.states.length,p.id)));select.value=Array.from(select.options).some(o=>o.value===old)?old:'';
  const palette=current();for(const id of ['rename','add','delete','export'])$('asset-project-palette-'+id).disabled=!palette;
  $('asset-project-palette-states').replaceChildren(...(palette?.states||[]).map(state=>{
   const row=document.createElement('div');row.className='row';const choose=document.createElement('button');choose.textContent=stateLabel(state);choose.title=state.Name;choose.dataset.paletteState=stateKey(state);choose.onclick=()=>useState(structuredClone(state));
   const remove=document.createElement('button');remove.textContent='移出';remove.setAttribute('aria-label','移出 '+stateLabel(state));remove.onclick=()=>task(async()=>{const p=current();if(!p)return;await mutate('palettes.put',{palette:{...p,states:p.states.filter(v=>stateKey(v)!==stateKey(state))}});});row.append(choose,remove);return row;
  }));
 }
 $('asset-project-palette').onchange=()=>{const p=current();$('asset-project-palette-name').value=p?.name||'';update(summary);};
 $('asset-project-palette-create').onclick=()=>task(async()=>{const result=await mutate('palettes.put',{palette:{name:$('asset-project-palette-name').value,states:[]}});$('asset-project-palette').value=result.id;update(summary);});
 $('asset-project-palette-rename').onclick=()=>task(async()=>{const p=current();if(p)await mutate('palettes.put',{palette:{...p,name:$('asset-project-palette-name').value}});});
 $('asset-project-palette-add').onclick=()=>task(async()=>{const p=current(),state=getState();if(!p||!state)throw Error('先选择方案和方块形态');await mutate('palettes.put',{palette:{...p,states:[...p.states,state]}});});
 $('asset-project-palette-delete').onclick=()=>task(async()=>{const p=current();if(p)await mutate('palettes.remove',{id:p.id});});
 $('asset-project-palette-export').onclick=()=>{const p=current();if(p)download(JSON.stringify(paletteDocument(p),null,2),p.name+'.craftpalette.json','application/json');};
 $('asset-project-palette-import').onchange=()=>task(async()=>{
  const file=$('asset-project-palette-import').files[0],importWorkspace=workspace;pending=null;$('asset-project-palette-import-name').value='';$('asset-project-palette-import-confirm').disabled=true;if(!file)return;
  $('asset-project-palette-import-states').replaceChildren();$('asset-project-palette-import-preview').textContent='正在读取方案…';
  try{const parsed=readPaletteDocument(JSON.parse(await file.text()));if(workspace!==importWorkspace)throw Error('工程已切换，请重新读取方案文件');pending=parsed;}catch(error){$('asset-project-palette-import-preview').textContent='文件无效，工程未改变。';throw error;}
  $('asset-project-palette-import-name').value=pending.name;
  $('asset-project-palette-import-preview').textContent=pending.name+' · '+pending.states.length+' 个完整方块形态；确认前不改变工程。同名时请修改导入名称。';
  $('asset-project-palette-import-states').replaceChildren(...pending.states.map(state=>{const label=document.createElement('p');label.className='small';label.textContent=stateLabel(state);return label;}));
  $('asset-project-palette-import-confirm').disabled=false;
 });
 $('asset-project-palette-import-confirm').onclick=()=>task(async()=>{if(!pending)return;const result=await mutate('palettes.put',{palette:{name:$('asset-project-palette-import-name').value,states:pending.states}});clearImport();$('asset-project-palette').value=result.id;update(summary);});
 return{update};
}
