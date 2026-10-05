export function instanceVector(point,turn=0,mirror=false){let[x,y,z]=point;if(mirror)x=-x;for(let i=0;i<((turn%4)+4)%4;i++)[x,z]=[-z,x];return[x,y,z];}
export function instancePoint(point,pose){return instanceVector(point,pose.turn,pose.mirror).map((n,a)=>n+pose.origin[a]);}
export function canonicalPoint(point,pose){const p=instanceVector(point.map((n,a)=>n-pose.origin[a]),4-(pose.turn||0),false);if(pose.mirror)p[0]=-p[0];return p;}
export function instancePose(size,at,turn=0,mirror=false){let[x,y,z]=[0,0,0],[w,,l]=size;if(mirror)x=w-1;for(let i=0;i<((turn%4)+4)%4;i++){[x,z]=[l-1-z,x];[w,l]=[l,w];}return{origin:[x,y,z].map((n,a)=>n+at[a]),turn:((turn%4)+4)%4,mirror:!!mirror};}
export function composeInstancePose(pose,mapPoint,turn=0,mirror=false){return{origin:mapPoint(pose.origin),turn:((turn+(mirror?-(pose.turn||0):pose.turn||0))%4+4)%4,mirror:!!mirror!==!!pose.mirror};}
