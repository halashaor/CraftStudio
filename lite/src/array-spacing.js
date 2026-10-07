export function arraySpacing(bounds,config={}){
 if(config.spacingMode&& !['offset','gap'].includes(config.spacingMode))throw Error('未知阵列间距方式');
 if(config.spacingMode!=='gap'){if(config.step!==undefined&&!Array.isArray(config.step))throw Error('阵列位移需为 XYZ 数组');const step=(config.step||[6,0,0]).map(Number);if(step.length!==3||step.some(n=>!Number.isInteger(n)||Math.abs(n)>4095)||step.every(n=>n===0))throw Error('阵列位移需为三个整数，且不能全部为零');return{mode:'offset',step};}
 const axis=['x','y','z'].indexOf(config.axis||'x'),gap=Number(config.gap??2),direction=Number(config.direction??1);if(axis<0||!Number.isFinite(gap)||Math.abs(gap)>4095||![1,-1].includes(direction))throw Error('请设置有效方向和空隙');const span=bounds.max[axis]-bounds.min[axis]+1,distance=Math.round(span+gap);if(distance<=0||distance>4095)throw Error('空隙与构件跨度形成的步距需为 1–4095 格');const step=[0,0,0];step[axis]=direction*distance;return{mode:'gap',axis,span,requestedGap:gap,gap:distance-span,step,snapped:span+gap!==distance};
}
