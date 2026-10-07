import {stateKey} from './codec.js';
export function readPaletteDocument(value){
 if(value?.schema!=='craftstudio-material-palette/1')throw Error('配色方案文件格式无效');
 const p=value.palette,record=paletteMutation({design:{}},'palettes.put',{palette:{name:p?.name,states:p?.states}});
 return{name:record.name,states:record.states};
}
export function paletteDocument(palette){
 const value={schema:'craftstudio-material-palette/1',palette:{name:palette.name,states:palette.states}};
 return{schema:value.schema,palette:readPaletteDocument(value)};
}
export function paletteMutation(site,method,p){
 const list=site.design.materialPalettes||(site.design.materialPalettes=[]);
 if(method==='palettes.remove'){
  const index=list.findIndex(v=>v.id===p.id);if(index<0)throw Error('配色方案已不存在');
  list.splice(index,1);return{id:p.id,removed:true};
 }
 const value=p.palette;
 if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.trim().length>128)throw Error('请填写 1–128 字方案名称');
 const id=value.id??crypto.randomUUID();if(typeof id!=='string'||!id||id.length>128)throw Error('方案编号无效');
 if(list.some(p=>p.id!==id&&p.name===value.name.trim()))throw Error('已有同名方案，请选择它更新或使用其他名称');
 if(!Array.isArray(value.states))throw Error('配色方案需要完整方块状态列表');
 const states=[],seen=new Set();
 for(const state of value.states){
  if(!state||!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(state.Name||''))throw Error('方案中的方块标识无效');
  if(state.Properties!==undefined&&(!state.Properties||typeof state.Properties!=='object'||Array.isArray(state.Properties)||Object.values(state.Properties).some(v=>typeof v!=='string')))throw Error('方块状态属性需要字符串值');
  const clean={Name:state.Name,...(state.Properties?{Properties:structuredClone(state.Properties)}:{})},key=stateKey(clean);
  if(!seen.has(key)){seen.add(key);states.push(clean);}
 }
 const record={id,name:value.name.trim(),states},index=list.findIndex(v=>v.id===id);
 if(index<0)list.push(record);else list[index]=record;
 return structuredClone(record);
}
