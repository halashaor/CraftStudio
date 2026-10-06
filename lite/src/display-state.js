// Observation settings only: never include object transforms or edit scope.
export function normalizeDisplay(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('显示设置无效');
 const {mode,cut,plants,ground,existing}=value;
 if(!['after','before','diff','removed'].includes(mode)||cut!==null&&(!Number.isInteger(cut)||cut<0)||[plants,ground,existing].some(v=>typeof v!=='boolean'))throw Error('显示模式、剖切层或显示开关无效');
 return{mode,cut,plants,ground,existing};
}
export function displayCut(value,max){return value===null?max:Math.min(value,max);}
