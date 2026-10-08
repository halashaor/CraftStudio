import {validateFrame,dot,sub} from './workplane.js';
export function axisConstraint({choice='free',plane='xz',locked=false,frame=null}={}){
 if(!['free','X','Y','Z','XY','XZ','YZ'].includes(choice))throw Error('Invalid movement axes');
 const local=!!frame&&locked,basis=local?(()=>{const f=validateFrame(frame);return[f.u,f.v,f.normal];})():[[1,0,0],[0,1,0],[0,0,1]],normal=local?2:({xz:1,xy:2,yz:0})[plane];
 const axes=['X','Y','Z'].filter((name,index)=>(choice==='free'||choice.includes(name))&&(!locked||index!==normal));
 return{axes,basis,space:local?'local':'world',labels:local?['U (X)','V (Y)','法线 (Z)']:['X','Y','Z']};
}
export function constrainAxisMove(start,point,constraint){const delta=sub(point,start);return start.map((value,index)=>value+constraint.axes.reduce((sum,name)=>sum+dot(delta,constraint.basis['XYZ'.indexOf(name)])*constraint.basis['XYZ'.indexOf(name)][index],0));}
export function reachableSnap(start,point,constraint){return Math.hypot(...constrainAxisMove(start,point,constraint).map((n,a)=>n-point[a]))<=1e-4;}
