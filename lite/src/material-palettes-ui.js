import {stateKey} from './codec.js';
export function materialPalettesUI({$,host,task,getState,useState,stateLabel}){
 const panel=document.createElement('details');panel.id='asset-project-palettes';panel.innerHTML='<summary>工程配色方案</summary><label>当前方案<select id="asset-project-palette"></select></label><label>方案名称<input id="asset-project-palette-name" placeholder="例如：石木住宅、樱木庭院"></label><div class="row"><button id="asset-project-palette-create">新建方案</button><button id="asset-project-palette-rename">改名</button></div><div class="row"><button id="asset-project-palette-add">加入当前形态</button><button id="asset-project-palette-delete">删除方案</button></div><div id="asset-project-palette-states"></div><p class="small">方案随工程保存。选择或删除方案不改建筑，完整素材库始终可用。</p>';host.querySelector('.asset-filters').after(panel);
 let summary=null,workspace=null;
 const current=()=>summary?.design.materialPalettes?.find(p=>p.id===$('asset-project-palette').value);
 async function mutate(method,params){const result=await window.CraftStudio.request({method,params:{workspaceId:summary.workspaceId,expectedRevision:summary.revision,...params}});if(!result.ok)throw Error(result.error.message);return result.value;}
 function update(s){
  if(!s)return;const changed=workspace!==s.workspaceId;summary=s;workspace=s.workspaceId;
  const select=$('asset-project-palette'),old=changed?'':select.value;select.replaceChildren(new Option('请选择方案',''),...(s.design.materialPalettes||[]).map(p=>new Option(p.name+' · '+p.states.length,p.id)));select.value=Array.from(select.options).some(o=>o.value===old)?old:'';
  const palette=current();for(const id of ['rename','add','delete'])$('asset-project-palette-'+id).disabled=!palette;
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
 return{update};
}
