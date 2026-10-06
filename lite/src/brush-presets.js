export const brushFields=['brush-mode','brush-plane','brush-size','brush-shape','brush-retain-shape','brush-preserve-props','brush-in-selection','brush-surface','brush-match-picked','brush-empty','brush-min-y','brush-max-y'];
const defaults={'brush-mode':'draw','brush-plane':'auto','brush-size':'1','brush-shape':'square','brush-retain-shape':true,'brush-preserve-props':true,'brush-in-selection':false,'brush-surface':false,'brush-match-picked':false,'brush-empty':true,'brush-min-y':'','brush-max-y':''};
export function normalizePreset(p){
 if(typeof p?.name!=='string'||!p.name.trim()||p.name.length>120||!p.values||typeof p.values!=='object')throw Error('画笔预设名称或设置无效');
 const values={...defaults};
 for(const key of brushFields){if(!(key in p.values))continue;const value=p.values[key];if(typeof defaults[key]==='boolean'){if(typeof value!=='boolean')throw Error('画笔条件必须是开关');}else if(typeof value!=='string')throw Error('画笔设置格式无效');values[key]=value;}
 if(!['auto','surface','view','xz','xy','yz'].includes(values['brush-plane']))throw Error('绘制平面无效');
 if(!['draw','paint'].includes(values['brush-mode'])||!['1','3','5','7','9'].includes(values['brush-size'])||!['square','circle'].includes(values['brush-shape']))throw Error('画笔用途、大小或形状无效');
 for(const key of ['brush-min-y','brush-max-y'])if(values[key]!==''&&(!/^\d+$/.test(values[key])||Number(values[key])>4095))throw Error('画笔高度须在 0–4095 之间');
 if(values['brush-min-y']!==''&&values['brush-max-y']!==''&&+values['brush-min-y']>+values['brush-max-y'])throw Error('画笔高度下限不能大于上限');
 return{name:p.name.trim(),values};
}
export function importPresets(document,current=[]){
 if(document?.schema!=='craftstudio-brush-presets/1'||!Array.isArray(document.presets)||document.presets.length>500)throw Error('不是支持的画笔预设文件');
 const incoming=document.presets.map(normalizePreset),result=current.map(normalizePreset),names=new Set(result.map(p=>p.name));
 for(const preset of incoming){const base=preset.name;let n=2;while(names.has(preset.name))preset.name=`${base.slice(0,110)} (${n++})`;names.add(preset.name);result.push(preset);}
 return result;
}
