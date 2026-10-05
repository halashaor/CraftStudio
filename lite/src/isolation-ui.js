export function isolationUI({$,call,refresh,render,task,getView,setView,getSelection,getObjectIds,hasSelection,notice,frameSelection}){
 const stack=[],bar=document.createElement('div');bar.id='isolation-bar';bar.hidden=true;bar.innerHTML='<strong id="isolation-label"></strong><span>范围外内容已隐藏；新增区仍保留真实场地检查</span><button id="isolation-exit">退出一层</button><button id="isolation-all">恢复全部</button>';$('scene').before(bar);
 const button=document.createElement('button');button.id='isolation-enter';button.textContent='隔离编辑';button.title='隔离当前对象或选择，退出时恢复相机与上一层显示';document.querySelector('.scene-toolbar .row').prepend(button);
 async function exit(all=false){await call('viewIsolation',all?{clear:true}:{pop:true});const view=all?stack[0]:stack.at(-1);if(all)stack.length=0;else stack.pop();if(view)setView(view);refresh(await call('summary'));await render();}
 button.onclick=()=>task(async()=>{if(!hasSelection())throw Error('先选择要专注编辑的对象或区域');const objectIds=getObjectIds();stack.push(getView());try{await call('viewIsolation',{push:true,objectIds,selection:getSelection(),includeNew:true});refresh(await call('summary'));await render();frameSelection();notice('已进入隔离编辑；可退出恢复上一层视图');}catch(e){stack.pop();throw e;}});
 $('isolation-exit').onclick=()=>task(()=>exit(false));$('isolation-all').onclick=()=>task(()=>exit(true));
 return{update:s=>{const v=s.view||{};bar.hidden=!v.isolated;button.textContent=v.isolated?'继续隔离':'隔离编辑';$('isolation-label').textContent='隔离中 · '+(v.objectNames?.join('、')||'当前选择')+' · '+(v.depth||1)+' 层';if(!v.isolated)stack.length=0;},mask:s=>s?.view?.editBounds||null};
}
