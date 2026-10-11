(()=>{var le=Uint8Array,Ve=Uint16Array,$r=Int32Array,_i=new le([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),bi=new le([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Wr=new le([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),So=function(r,e){for(var t=new Ve(31),n=0;n<31;++n)t[n]=e+=1<<r[n-1];for(var i=new $r(t[30]),n=1;n<30;++n)for(var s=t[n];s<t[n+1];++s)i[s]=s-t[n]<<5|n;return{b:t,r:i}},Eo=So(_i,2),Ao=Eo.b,Xr=Eo.r;Ao[28]=258,Xr[258]=28;var To=So(bi,0),Fc=To.b,xo=To.r,qr=new Ve(32768);for(te=0;te<32768;++te)gt=(te&43690)>>1|(te&21845)<<1,gt=(gt&52428)>>2|(gt&13107)<<2,gt=(gt&61680)>>4|(gt&3855)<<4,qr[te]=((gt&65280)>>8|(gt&255)<<8)>>1;var gt,te,ct=function(r,e,t){for(var n=r.length,i=0,s=new Ve(e);i<n;++i)r[i]&&++s[r[i]-1];var o=new Ve(e);for(i=1;i<e;++i)o[i]=o[i-1]+s[i-1]<<1;var a;if(t){a=new Ve(1<<e);var c=15-e;for(i=0;i<n;++i)if(r[i])for(var l=i<<4|r[i],u=e-r[i],h=o[r[i]-1]++<<u,d=h|(1<<u)-1;h<=d;++h)a[qr[h]>>c]=l}else for(a=new Ve(n),i=0;i<n;++i)r[i]&&(a[i]=qr[o[r[i]-1]++]>>15-r[i]);return a},Rt=new le(288);for(te=0;te<144;++te)Rt[te]=8;var te;for(te=144;te<256;++te)Rt[te]=9;var te;for(te=256;te<280;++te)Rt[te]=7;var te;for(te=280;te<288;++te)Rt[te]=8;var te,Xn=new le(32);for(te=0;te<32;++te)Xn[te]=5;var te,zc=ct(Rt,9,0),Bc=ct(Rt,9,1),Vc=ct(Xn,5,0),Hc=ct(Xn,5,1),Br=function(r){for(var e=r[0],t=1;t<r.length;++t)r[t]>e&&(e=r[t]);return e},Je=function(r,e,t){var n=e/8|0;return(r[n]|r[n+1]<<8)>>(e&7)&t},Vr=function(r,e){var t=e/8|0;return(r[t]|r[t+1]<<8|r[t+2]<<16)>>(e&7)},Zr=function(r){return(r+7)/8|0},qn=function(r,e,t){return(e==null||e<0)&&(e=0),(t==null||t>r.length)&&(t=r.length),new le(r.subarray(e,t))};var Gc=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],ge=function(r,e,t){var n=new Error(e||Gc[r]);if(n.code=r,Error.captureStackTrace&&Error.captureStackTrace(n,ge),!t)throw n;return n},Kr=function(r,e,t,n){var i=r.length,s=n?n.length:0;if(!i||e.f&&!e.l)return t||new le(0);var o=!t,a=o||e.i!=2,c=e.i;o&&(t=new le(i*3));var l=function(be){var ae=t.length;if(be>ae){var ve=new le(Math.max(ae*2,be));ve.set(t),t=ve}},u=e.f||0,h=e.p||0,d=e.b||0,f=e.l,p=e.d,m=e.m,g=e.n,y=i*8;do{if(!f){u=Je(r,h,1);var b=Je(r,h+1,3);if(h+=3,b)if(b==1)f=Bc,p=Hc,m=9,g=5;else if(b==2){var x=Je(r,h,31)+257,E=Je(r,h+10,15)+4,w=x+Je(r,h+5,31)+1;h+=14;for(var S=new le(w),T=new le(19),C=0;C<E;++C)T[Wr[C]]=Je(r,h+C*3,7);h+=E*3;for(var P=Br(T),A=(1<<P)-1,I=ct(T,P,1),C=0;C<w;){var N=I[Je(r,h,A)];h+=N&15;var _=N>>4;if(_<16)S[C++]=_;else{var D=0,U=0;for(_==16?(U=3+Je(r,h,3),h+=2,D=S[C-1]):_==17?(U=3+Je(r,h,7),h+=3):_==18&&(U=11+Je(r,h,127),h+=7);U--;)S[C++]=D}}var F=S.subarray(0,x),z=S.subarray(x);m=Br(F),g=Br(z),f=ct(F,m,1),p=ct(z,g,1)}else ge(1);else{var _=Zr(h)+4,v=r[_-4]|r[_-3]<<8,M=_+v;if(M>i){c&&ge(0);break}a&&l(d+v),t.set(r.subarray(_,M),d),e.b=d+=v,e.p=h=M*8,e.f=u;continue}if(h>y){c&&ge(0);break}}a&&l(d+131072);for(var G=(1<<m)-1,W=(1<<g)-1,K=h;;K=h){var D=f[Vr(r,h)&G],q=D>>4;if(h+=D&15,h>y){c&&ge(0);break}if(D||ge(2),q<256)t[d++]=q;else if(q==256){K=h,f=null;break}else{var pe=q-254;if(q>264){var C=q-257,ee=_i[C];pe=Je(r,h,(1<<ee)-1)+Ao[C],h+=ee}var oe=p[Vr(r,h)&W],Pe=oe>>4;oe||ge(3),h+=oe&15;var z=Fc[Pe];if(Pe>3){var ee=bi[Pe];z+=Vr(r,h)&(1<<ee)-1,h+=ee}if(h>y){c&&ge(0);break}a&&l(d+131072);var Ye=d+pe;if(d<z){var Ee=s-z,Ne=Math.min(z,Ye);for(Ee+d<0&&ge(3);d<Ne;++d)t[d]=n[Ee+d]}for(;d<Ye;++d)t[d]=t[d-z]}}e.l=f,e.p=K,e.b=d,e.f=u,f&&(u=1,e.m=m,e.d=p,e.n=g)}while(!u);return d!=t.length&&o?qn(t,0,d):t.subarray(0,d)},yt=function(r,e,t){t<<=e&7;var n=e/8|0;r[n]|=t,r[n+1]|=t>>8},Gn=function(r,e,t){t<<=e&7;var n=e/8|0;r[n]|=t,r[n+1]|=t>>8,r[n+2]|=t>>16},Hr=function(r,e){for(var t=[],n=0;n<r.length;++n)r[n]&&t.push({s:n,f:r[n]});var i=t.length,s=t.slice();if(!i)return{t:Io,l:0};if(i==1){var o=new le(t[0].s+1);return o[t[0].s]=1,{t:o,l:1}}t.sort(function(M,x){return M.f-x.f}),t.push({s:-1,f:25001});var a=t[0],c=t[1],l=0,u=1,h=2;for(t[0]={s:-1,f:a.f+c.f,l:a,r:c};u!=i-1;)a=t[t[l].f<t[h].f?l++:h++],c=t[l!=u&&t[l].f<t[h].f?l++:h++],t[u++]={s:-1,f:a.f+c.f,l:a,r:c};for(var d=s[0].s,n=1;n<i;++n)s[n].s>d&&(d=s[n].s);var f=new Ve(d+1),p=Yr(t[u-1],f,0);if(p>e){var n=0,m=0,g=p-e,y=1<<g;for(s.sort(function(x,E){return f[E.s]-f[x.s]||x.f-E.f});n<i;++n){var b=s[n].s;if(f[b]>e)m+=y-(1<<p-f[b]),f[b]=e;else break}for(m>>=g;m>0;){var _=s[n].s;f[_]<e?m-=1<<e-f[_]++-1:++n}for(;n>=0&&m;--n){var v=s[n].s;f[v]==e&&(--f[v],++m)}p=e}return{t:new le(f),l:p}},Yr=function(r,e,t){return r.s==-1?Math.max(Yr(r.l,e,t+1),Yr(r.r,e,t+1)):e[r.s]=t},_o=function(r){for(var e=r.length;e&&!r[--e];);for(var t=new Ve(++e),n=0,i=r[0],s=1,o=function(c){t[n++]=c},a=1;a<=e;++a)if(r[a]==i&&a!=e)++s;else{if(!i&&s>2){for(;s>138;s-=138)o(32754);s>2&&(o(s>10?s-11<<5|28690:s-3<<5|12305),s=0)}else if(s>3){for(o(i),--s;s>6;s-=6)o(8304);s>2&&(o(s-3<<5|8208),s=0)}for(;s--;)o(i);s=1,i=r[a]}return{c:t.subarray(0,n),n:e}},Wn=function(r,e){for(var t=0,n=0;n<e.length;++n)t+=r[n]*e[n];return t},Co=function(r,e,t){var n=t.length,i=Zr(e+2);r[i]=n&255,r[i+1]=n>>8,r[i+2]=r[i]^255,r[i+3]=r[i+1]^255;for(var s=0;s<n;++s)r[i+s+4]=t[s];return(i+4+n)*8},bo=function(r,e,t,n,i,s,o,a,c,l,u){yt(e,u++,t),++i[256];for(var h=Hr(i,15),d=h.t,f=h.l,p=Hr(s,15),m=p.t,g=p.l,y=_o(d),b=y.c,_=y.n,v=_o(m),M=v.c,x=v.n,E=new Ve(19),w=0;w<b.length;++w)++E[b[w]&31];for(var w=0;w<M.length;++w)++E[M[w]&31];for(var S=Hr(E,7),T=S.t,C=S.l,P=19;P>4&&!T[Wr[P-1]];--P);var A=l+5<<3,I=Wn(i,Rt)+Wn(s,Xn)+o,N=Wn(i,d)+Wn(s,m)+o+14+3*P+Wn(E,T)+2*E[16]+3*E[17]+7*E[18];if(c>=0&&A<=I&&A<=N)return Co(e,u,r.subarray(c,c+l));var D,U,F,z;if(yt(e,u,1+(N<I)),u+=2,N<I){D=ct(d,f,0),U=d,F=ct(m,g,0),z=m;var G=ct(T,C,0);yt(e,u,_-257),yt(e,u+5,x-1),yt(e,u+10,P-4),u+=14;for(var w=0;w<P;++w)yt(e,u+3*w,T[Wr[w]]);u+=3*P;for(var W=[b,M],K=0;K<2;++K)for(var q=W[K],w=0;w<q.length;++w){var pe=q[w]&31;yt(e,u,G[pe]),u+=T[pe],pe>15&&(yt(e,u,q[w]>>5&127),u+=q[w]>>12)}}else D=zc,U=Rt,F=Vc,z=Xn;for(var w=0;w<a;++w){var ee=n[w];if(ee>255){var pe=ee>>18&31;Gn(e,u,D[pe+257]),u+=U[pe+257],pe>7&&(yt(e,u,ee>>23&31),u+=_i[pe]);var oe=ee&31;Gn(e,u,F[oe]),u+=z[oe],oe>3&&(Gn(e,u,ee>>5&8191),u+=bi[oe])}else Gn(e,u,D[ee]),u+=U[ee]}return Gn(e,u,D[256]),u+U[256]},Wc=new $r([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),Io=new le(0),Xc=function(r,e,t,n,i,s){var o=s.z||r.length,a=new le(n+o+5*(1+Math.ceil(o/7e3))+i),c=a.subarray(n,a.length-i),l=s.l,u=(s.r||0)&7;if(e){u&&(c[0]=s.r>>3);for(var h=Wc[e-1],d=h>>13,f=h&8191,p=(1<<t)-1,m=s.p||new Ve(32768),g=s.h||new Ve(p+1),y=Math.ceil(t/3),b=2*y,_=function(mt){return(r[mt]^r[mt+1]<<y^r[mt+2]<<b)&p},v=new $r(25e3),M=new Ve(288),x=new Ve(32),E=0,w=0,S=s.i||0,T=0,C=s.w||0,P=0;S+2<o;++S){var A=_(S),I=S&32767,N=g[A];if(m[I]=N,g[A]=I,C<=S){var D=o-S;if((E>7e3||T>24576)&&(D>423||!l)){u=bo(r,c,0,v,M,x,w,T,P,S-P,u),T=E=w=0,P=S;for(var U=0;U<286;++U)M[U]=0;for(var U=0;U<30;++U)x[U]=0}var F=2,z=0,G=f,W=I-N&32767;if(D>2&&A==_(S-W))for(var K=Math.min(d,D)-1,q=Math.min(32767,S),pe=Math.min(258,D);W<=q&&--G&&I!=N;){if(r[S+F]==r[S+F-W]){for(var ee=0;ee<pe&&r[S+ee]==r[S+ee-W];++ee);if(ee>F){if(F=ee,z=W,ee>K)break;for(var oe=Math.min(W,ee-2),Pe=0,U=0;U<oe;++U){var Ye=S-W+U&32767,Ee=m[Ye],Ne=Ye-Ee&32767;Ne>Pe&&(Pe=Ne,N=Ye)}}}I=N,N=m[I],W+=I-N&32767}if(z){v[T++]=268435456|Xr[F]<<18|xo[z];var be=Xr[F]&31,ae=xo[z]&31;w+=_i[be]+bi[ae],++M[257+be],++x[ae],C=S+F,++E}else v[T++]=r[S],++M[r[S]]}}for(S=Math.max(S,C);S<o;++S)v[T++]=r[S],++M[r[S]];u=bo(r,c,l,v,M,x,w,T,P,S-P,u),l||(s.r=u&7|c[u/8|0]<<3,u-=7,s.h=g,s.p=m,s.i=S,s.w=C)}else{for(var S=s.w||0;S<o+l;S+=65535){var ve=S+65535;ve>=o&&(c[u/8|0]=l,ve=o),u=Co(c,u+1,r.subarray(S,ve))}s.i=o}return qn(a,0,n+Zr(u)+i)},qc=function(){for(var r=new Int32Array(256),e=0;e<256;++e){for(var t=e,n=9;--n;)t=(t&1&&-306674912)^t>>>1;r[e]=t}return r}(),Ro=function(){var r=-1;return{p:function(e){for(var t=r,n=0;n<e.length;++n)t=qc[t&255^e[n]]^t>>>8;r=t},d:function(){return~r}}};var Po=function(r,e,t,n,i){if(!i&&(i={l:1},e.dictionary)){var s=e.dictionary.subarray(-32768),o=new le(s.length+r.length);o.set(s),o.set(r,s.length),r=o,i.w=s.length}return Xc(r,e.level==null?6:e.level,e.mem==null?i.l?Math.ceil(Math.max(8,Math.min(13,Math.log(r.length)))*1.5):20:12+e.mem,t,n,i)},No=function(r,e){var t={};for(var n in r)t[n]=r[n];for(var n in e)t[n]=e[n];return t};var lt=function(r,e){return r[e]|r[e+1]<<8},$e=function(r,e){return(r[e]|r[e+1]<<8|r[e+2]<<16|r[e+3]<<24)>>>0},Gr=function(r,e){return $e(r,e)+$e(r,e+4)*4294967296},me=function(r,e,t){for(;t;++e)r[e]=t,t>>>=8},Yc=function(r,e){var t=e.filename;if(r[0]=31,r[1]=139,r[2]=8,r[8]=e.level<2?4:e.level==9?2:0,r[9]=3,e.mtime!=0&&me(r,4,Math.floor(new Date(e.mtime||Date.now())/1e3)),t){r[3]=8;for(var n=0;n<=t.length;++n)r[n+10]=t.charCodeAt(n)}},jc=function(r){(r[0]!=31||r[1]!=139||r[2]!=8)&&ge(6,"invalid gzip data");var e=r[3],t=10;e&4&&(t+=(r[10]|r[11]<<8)+2);for(var n=(e>>3&1)+(e>>4&1);n>0;n-=!r[t++]);return t+(e&2)},Jc=function(r){var e=r.length;return(r[e-4]|r[e-3]<<8|r[e-2]<<16|r[e-1]<<24)>>>0},$c=function(r){return 10+(r.filename?r.filename.length+1:0)};var Zc=function(r,e){return((r[0]&15)!=8||r[0]>>4>7||(r[0]<<8|r[1])%31)&&ge(6,"invalid zlib data"),(r[1]>>5&1)==+!e&&ge(6,"invalid zlib data: "+(r[1]&32?"need":"unexpected")+" dictionary"),(r[1]>>3&4)+2};function Kc(r,e){return Po(r,e||{},0,0)}function Qc(r,e){return Kr(r,{i:2},e&&e.out,e&&e.dictionary)}function vt(r,e){e||(e={});var t=Ro(),n=r.length;t.p(r);var i=Po(r,e,$c(e),8),s=i.length;return Yc(i,e),me(i,s-8,t.d()),me(i,s-4,n),i}function Ze(r,e){var t=jc(r);return t+8>r.length&&ge(6,"invalid gzip data"),Kr(r.subarray(t,-8),{i:2},e&&e.out||new le(Jc(r)),e&&e.dictionary)}function Do(r,e){return Kr(r.subarray(Zc(r,e&&e.dictionary),-4),{i:2},e&&e.out,e&&e.dictionary)}var Lo=function(r,e,t,n){for(var i in r){var s=r[i],o=e+i,a=n;Array.isArray(s)&&(a=No(n,s[1]),s=s[0]),s instanceof le?t[o]=[s,a]:(t[o+="/"]=[new le(0),a],Lo(s,o,t,n))}},Mo=typeof TextEncoder<"u"&&new TextEncoder,jr=typeof TextDecoder<"u"&&new TextDecoder,eu=0;try{jr.decode(Io,{stream:!0}),eu=1}catch{}var tu=function(r){for(var e="",t=0;;){var n=r[t++],i=(n>127)+(n>223)+(n>239);if(t+i>r.length)return{s:e,r:qn(r,t-1)};i?i==3?(n=((n&15)<<18|(r[t++]&63)<<12|(r[t++]&63)<<6|r[t++]&63)-65536,e+=String.fromCharCode(55296|n>>10,56320|n&1023)):i&1?e+=String.fromCharCode((n&31)<<6|r[t++]&63):e+=String.fromCharCode((n&15)<<12|(r[t++]&63)<<6|r[t++]&63):e+=String.fromCharCode(n)}};function Ae(r,e){if(e){for(var t=new le(r.length),n=0;n<r.length;++n)t[n]=r.charCodeAt(n);return t}if(Mo)return Mo.encode(r);for(var i=r.length,s=new le(r.length+(r.length>>1)),o=0,a=function(u){s[o++]=u},n=0;n<i;++n){if(o+5>s.length){var c=new le(o+8+(i-n<<1));c.set(s),s=c}var l=r.charCodeAt(n);l<128||e?a(l):l<2048?(a(192|l>>6),a(128|l&63)):l>55295&&l<57344?(l=65536+(l&1047552)|r.charCodeAt(++n)&1023,a(240|l>>18),a(128|l>>12&63),a(128|l>>6&63),a(128|l&63)):(a(224|l>>12),a(128|l>>6&63),a(128|l&63))}return qn(s,0,o)}function He(r,e){if(e){for(var t="",n=0;n<r.length;n+=16384)t+=String.fromCharCode.apply(null,r.subarray(n,n+16384));return t}else{if(jr)return jr.decode(r);var i=tu(r),s=i.s,t=i.r;return t.length&&ge(8),s}}var nu=function(r,e){return e+30+lt(r,e+26)+lt(r,e+28)},iu=function(r,e,t){var n=lt(r,e+28),i=He(r.subarray(e+46,e+46+n),!(lt(r,e+8)&2048)),s=e+46+n,o=$e(r,e+20),a=t&&o==4294967295?ru(r,s):[o,$e(r,e+24),$e(r,e+42)],c=a[0],l=a[1],u=a[2];return[lt(r,e+10),c,l,i,s+lt(r,e+30)+lt(r,e+32),u]},ru=function(r,e){for(;lt(r,e)!=1;e+=4+lt(r,e+2));return[Gr(r,e+12),Gr(r,e+4),Gr(r,e+20)]},Jr=function(r){var e=0;if(r)for(var t in r){var n=r[t].length;n>65535&&ge(9),e+=n+4}return e},wo=function(r,e,t,n,i,s,o,a){var c=n.length,l=t.extra,u=a&&a.length,h=Jr(l);me(r,e,o!=null?33639248:67324752),e+=4,o!=null&&(r[e++]=20,r[e++]=t.os),r[e]=20,e+=2,r[e++]=t.flag<<1|(s<0&&8),r[e++]=i&&8,r[e++]=t.compression&255,r[e++]=t.compression>>8;var d=new Date(t.mtime==null?Date.now():t.mtime),f=d.getFullYear()-1980;if((f<0||f>119)&&ge(10),me(r,e,f<<25|d.getMonth()+1<<21|d.getDate()<<16|d.getHours()<<11|d.getMinutes()<<5|d.getSeconds()>>1),e+=4,s!=-1&&(me(r,e,t.crc),me(r,e+4,s<0?-s-2:s),me(r,e+8,t.size)),me(r,e+12,c),me(r,e+14,h),e+=16,o!=null&&(me(r,e,u),me(r,e+6,t.attrs),me(r,e+10,o),e+=14),r.set(n,e),e+=c,h)for(var p in l){var m=l[p],g=m.length;me(r,e,+p),me(r,e+2,g),r.set(m,e+4),e+=4+g}return u&&(r.set(a,e),e+=u),e},su=function(r,e,t,n,i){me(r,e,101010256),me(r,e+8,t),me(r,e+10,t),me(r,e+12,n),me(r,e+16,i)};function Mi(r,e){e||(e={});var t={},n=[];Lo(r,"",t,e);var i=0,s=0;for(var o in t){var a=t[o],c=a[0],l=a[1],u=l.level==0?0:8,h=Ae(o),d=h.length,f=l.comment,p=f&&Ae(f),m=p&&p.length,g=Jr(l.extra);d>65535&&ge(11);var y=u?Kc(c,l):c,b=y.length,_=Ro();_.p(c),n.push(No(l,{size:c.length,crc:_.d(),c:y,f:h,m:p,u:d!=o.length||p&&f.length!=m,o:i,compression:u})),i+=30+d+g+b,s+=76+2*(d+g)+(m||0)+b}for(var v=new le(s+22),M=i,x=s-i,E=0;E<n.length;++E){var h=n[E];wo(v,h.o,h,h.f,h.u,h.c.length);var w=30+h.f.length+Jr(h.extra);v.set(h.c,h.o+w),wo(v,i,h,h.f,h.u,h.c.length,h.o,h.m),i+=16+w+(h.m?h.m.length:0)}return su(v,i,n.length,x,M),v}function pn(r,e){for(var t={},n=r.length-22;$e(r,n)!=101010256;--n)(!n||r.length-n>65558)&&ge(13);var i=lt(r,n+8);if(!i)return{};var s=$e(r,n+16),o=s==4294967295||i==65535;if(o){var a=$e(r,n-12);o=$e(r,a)==101075792,o&&(i=$e(r,a+32),s=$e(r,a+48))}for(var c=e&&e.filter,l=0;l<i;++l){var u=iu(r,s,o),h=u[0],d=u[1],f=u[2],p=u[3],m=u[4],g=u[5],y=nu(r,g);s=m,(!c||c({name:p,size:d,originalSize:f,compression:h}))&&(h?h==8?t[p]=Qc(r.subarray(y,y+d),{out:new le(f)}):ge(14,"unknown compression type "+h):t[p]=qn(r,y,y+d))}return t}var Jt=class{constructor(e=[]){this.collections=e,this.byId=new Map(e.map(t=>[t.id,t]))}ancestors(e){let t=[],n=new Set;for(let i=this.byId.get(e);i&&!n.has(i.id);i=this.byId.get(i.parentId))n.add(i.id),t.push(i);return t.reverse()}contains(e,t){return this.ancestors(t).some(n=>n.id===e)}path(e){return this.ancestors(e).map(t=>t.name).join(" / ")}flag(e,t){return this.ancestors(e).some(n=>n[t])}validateParent(e,t){if(t==null)return;if(typeof t!="string"||!this.byId.has(t))throw Error("\u4E0A\u7EA7\u96C6\u5408\u5DF2\u4E0D\u5B58\u5728");let n=new Set([e]);for(let i=this.byId.get(t);i;i=this.byId.get(i.parentId)){if(n.has(i.id))throw Error("\u96C6\u5408\u4E0D\u80FD\u5F52\u5165\u81EA\u5DF1\u6216\u81EA\u5DF1\u7684\u5B50\u96C6\u5408");n.add(i.id)}}rows(){let e=new Map,t=[];for(let s of this.collections)!s.parentId||!this.byId.has(s.parentId)?t.push(s):(e.has(s.parentId)||e.set(s.parentId,[]),e.get(s.parentId).push(s));let n=[],i=new Set;for(let s of[...t,...this.collections]){let o=[{collection:s,depth:0}];for(;o.length;){let a=o.pop();if(!i.has(a.collection.id)){i.add(a.collection.id),n.push(a);for(let c of[...e.get(a.collection.id)||[]].reverse())o.push({collection:c,depth:a.depth+1})}}}return n}};function wi(r,e,t){let n=new Set;for(;e&&!n.has(e);){n.add(e);let i=r.collections?.find(s=>s.id===e);if(!i)return!1;if(i[t])return!0;e=i.parentId}return!1}var L=(r,e,t)=>r+4096*(t+4096*e),Z=r=>[r%4096,Math.floor(r/16777216),Math.floor(r/4096)%4096],Pt=r=>r.map(e=>Math.floor(e/16)).join(",");var ut=(r,e)=>!!e.locked||wi(r,e.collectionId,"locked"),ou=r=>typeof r=="number"?r:L(...Array.isArray(r)?r:r.split(",").map(Number)),Qr=new WeakMap;function au(r){return Qr.has(r)||Qr.set(r,new Set(r.map(ou))),Qr.get(r)}var $t=class{constructor(e){let t=new Jt(e.collections),n=new Set(t.collections.filter(i=>t.flag(i.id,"locked")).map(i=>i.id));this.entries=(e.objects||[]).filter(i=>i.locked||n.has(i.collectionId)).map(i=>({object:i,members:Array.isArray(i.cells)?au(i.cells):null}))}at(e){let t=L(...e);for(let{object:n,members:i}of this.entries)if(i?i.has(t):e.every((s,o)=>s>=n.min[o]&&s<=n.max[o]))return n;return null}};var Uo="\u5F53\u524D\u53EA\u8F6C\u6362 OBJ \u51E0\u4F55\uFF1B\u6750\u8D28\u3001\u8D34\u56FE\u548C\u6CD5\u7EBF\u672A\u8F6C\u6362\uFF0C\u539F\u6587\u4EF6\u53EF\u4FDD\u7559\u5728\u5DE5\u7A0B\u4E2D",Nt=(r,e,t)=>(e[0]-r[0])*(t[1]-r[1])-(e[1]-r[1])*(t[0]-r[0]),ko=(r,e)=>r.every((t,n)=>t===e[n]);function lu(r){let e=r.filter((t,n)=>!n||!ko(t,r[n-1]));if(e.length>1&&ko(e[0],e.at(-1))&&e.pop(),e.length<3)throw Error("\u9762\u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u4E0D\u540C\u7684\u9876\u70B9");return e}function cu(r){let e=r.map(c=>c.map((l,u)=>l-r[0][u])),t=Math.max(...e.flat().map(Math.abs)),n=[0,0,0];if(!t)throw Error("\u9762\u6CA1\u6709\u9762\u79EF");for(let c=0;c<e.length;c++){let l=e[c],u=e[(c+1)%e.length];n[0]+=(l[1]-u[1])*(l[2]+u[2]),n[1]+=(l[2]-u[2])*(l[0]+u[0]),n[2]+=(l[0]-u[0])*(l[1]+u[1])}let i=Math.hypot(...n),s=t*t*1e-12;if(i<=s)throw Error("\u9762\u6CA1\u6709\u9762\u79EF\u6216\u5B58\u5728\u81EA\u4EA4");if(e.some(c=>Math.abs(c.reduce((l,u,h)=>l+u*n[h],0))>i*t*1e-7))throw Error("\u9762\u4E0D\u5171\u9762\uFF0C\u8BF7\u5148\u5728\u5EFA\u6A21\u8F6F\u4EF6\u4E2D\u4E09\u89D2\u5316");let o=n.reduce((c,l,u)=>Math.abs(l)>Math.abs(n[c])?u:c,0),a=[0,1,2].filter(c=>c!==o);return{projected:e.map(c=>a.map(l=>c[l])),tolerance:s}}function uu(r,e,t,n,i){let s=Nt(r,e,t),o=Nt(r,e,n),a=Nt(t,n,r),c=Nt(t,n,e),l=(u,h,d)=>d.every((f,p)=>f>=Math.min(u[p],h[p])&&f<=Math.max(u[p],h[p]));return s*o<0&&a*c<0||Math.abs(s)<=i&&l(r,e,t)||Math.abs(o)<=i&&l(r,e,n)||Math.abs(a)<=i&&l(t,n,r)||Math.abs(c)<=i&&l(t,n,e)}function hu(r){let e=lu(r),{projected:t,tolerance:n}=cu(e),i=0,s=()=>{if(++i>2e7)throw Error("\u5355\u9762\u4E09\u89D2\u5316\u8D85\u8FC7 20,000,000 \u6B21\u8BA1\u7B97\u9884\u7B97\uFF0C\u8BF7\u5148\u5728\u5EFA\u6A21\u8F6F\u4EF6\u4E2D\u4E09\u89D2\u5316")};for(let u=0;u<t.length;u++)for(let h=u+1;h<t.length;h++)if(!(h===u+1||u===0&&h===t.length-1)&&(s(),uu(t[u],t[(u+1)%t.length],t[h],t[(h+1)%t.length],n)))throw Error("\u9762\u5B58\u5728\u81EA\u4EA4\u6216\u91CD\u590D\u8FB9");let o=t.map((u,h)=>h),a=[],c=o.reduce((u,h,d)=>{let f=o[(d+1)%o.length];return u+t[h][0]*t[f][1]-t[f][0]*t[h][1]},0),l=Math.sign(c);if(Math.abs(c)<=n)throw Error("\u9762\u6CA1\u6709\u9762\u79EF");for(;o.length>3;){let u=-1;for(let h=0;h<o.length;h++){let d=o[(h+o.length-1)%o.length],f=o[h],p=o[(h+1)%o.length];if(!(l*Nt(t[d],t[f],t[p])<=n)&&!o.some(m=>(s(),m!==d&&m!==f&&m!==p&&l*Nt(t[d],t[f],t[m])>=-n&&l*Nt(t[f],t[p],t[m])>=-n&&l*Nt(t[p],t[d],t[m])>=-n))){a.push([d,f,p]),u=h;break}}if(u<0)throw Error("\u9762\u65E0\u6CD5\u4E09\u89D2\u5316\uFF0C\u8BF7\u68C0\u67E5\u81EA\u4EA4\u4E0E\u9000\u5316\u8FB9");o.splice(u,1)}return a.push(o),a.map(u=>u.map(h=>e[h]))}function fu(r){let e=new Map;for(let i of r){let s=i.map(o=>o.join(","));for(let o=0;o<3;o++){let a=s[o],c=s[(o+1)%3],l=a<c?a+":"+c:c+":"+a;e.set(l,(e.get(l)||0)+1)}}let t=0,n=0;for(let i of e.values())i===1&&t++,i>2&&n++;return{closed:t===0&&n===0,boundaryEdges:t,nonManifoldEdges:n}}function es(r){if(typeof r!="string")throw Error("\u9700\u8981 OBJ \u6587\u4EF6\u6587\u672C");let e=[],t=[],n=new Set;for(let[o,a]of r.split(/\r?\n/).entries()){let c=a.split("#")[0].trim();if(!c)continue;let[l,...u]=c.split(/\s+/),h=d=>{throw Error(`OBJ \u7B2C ${o+1} \u884C\uFF1A${d}`)};if(l==="v"){let d=u.slice(0,3).map(Number);(d.length!==3||d.some(f=>!Number.isFinite(f)))&&h("\u9876\u70B9\u5750\u6807\u65E0\u6548"),[3,4,6,7].includes(u.length)||h("\u9876\u70B9\u9700\u8981 XYZ \u5750\u6807"),u.length===4&&Number(u[3])!==1&&h("\u9F50\u6B21\u9876\u70B9\u8BF7\u5148\u8F6C\u6362\u4E3A\u666E\u901A XYZ \u5750\u6807"),u.length>=6&&n.add("OBJ \u9876\u70B9\u989C\u8272\u5C1A\u672A\u8F6C\u6362\uFF1B\u5F53\u524D\u53EA\u8BFB\u53D6\u51E0\u4F55"),e.push(d)}else if(l==="f"){u.length<3&&h("\u9762\u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u9876\u70B9"),u.length>4096&&h("\u5355\u4E2A\u9762\u8D85\u8FC7 4096 \u4E2A\u9876\u70B9\u7684\u4E09\u89D2\u5316\u8BA1\u7B97\u9884\u7B97\uFF0C\u8BF7\u5148\u4E09\u89D2\u5316");let d=u.map(p=>{let m=p.split("/");(m.length>3||!/^-?[1-9]\d*$/.test(m[0])||m.slice(1).some(b=>b!==""&&!/^-?[1-9]\d*$/.test(b)))&&h("\u9762\u7D22\u5F15\u65E0\u6548"),m.length>1&&n.add(Uo);let g=Number(m[0]),y=e[g<0?e.length+g:g-1];return y||h("\u9762\u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u9876\u70B9"),y}),f;try{f=hu(d)}catch(p){h(p.message)}t.length+f.length>1e6&&h("\u7F51\u683C\u8D85\u8FC7 1000000 \u4E2A\u4E09\u89D2\u9762\u7684\u8BA1\u7B97\u9884\u7B97\uFF0C\u8BF7\u62C6\u5206\u6A21\u578B");for(let p of f)t.push(p)}else["mtllib","usemtl","vt","vn"].includes(l)?n.add(Uo):["l","p","curv","curv2","surf"].includes(l)?h("\u9700\u8981\u591A\u8FB9\u5F62\u7F51\u683C\uFF0C\u4E0D\u8BFB\u53D6\u7EBF\u3001\u70B9\u6216\u53C2\u6570\u66F2\u9762"):["o","g","s"].includes(l)||n.add(`\u672A\u8BFB\u53D6 OBJ \u6307\u4EE4 ${l}\uFF1B\u4EC5\u8F6C\u6362\u591A\u8FB9\u5F62\u51E0\u4F55`)}if(!t.length)throw Error("OBJ \u6CA1\u6709\u6709\u6548\u7684\u591A\u8FB9\u5F62\u9762");let i=[1/0,1/0,1/0],s=[-1/0,-1/0,-1/0];for(let o of t)for(let a of o)a.forEach((c,l)=>{i[l]=Math.min(i[l],c),s[l]=Math.max(s[l],c)});return{triangles:t,bounds:{min:i,max:s},warnings:[...n],topology:fu(t)}}var da="170";var Oo=0,Fo=1,zo=2,Bo=3,Vo=4,Ho=5,Go=6,Wo=7;var pa=300;var Xo=1e3,Si=1001,qo=1002;var du=1006;var pu=1008;var mu=1009;var gu=1023;var Di=2300,gs=2301,ts=2302,Yo=2400,jo=2401,Jo=2402;var ma="",tt="srgb",ga="srgb-linear",ya="linear",ys="srgb";var Ei=2e3,$o=2001,Li=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let s=i.indexOf(t);s!==-1&&i.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let i=n.slice(0);for(let s=0,o=i.length;s<o;s++)i[s].call(this,e);e.target=null}}},Te=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Op=Math.PI/180,Fp=180/Math.PI;function Ps(){let r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Te[r&255]+Te[r>>8&255]+Te[r>>16&255]+Te[r>>24&255]+"-"+Te[e&255]+Te[e>>8&255]+"-"+Te[e>>16&15|64]+Te[e>>24&255]+"-"+Te[t&63|128]+Te[t>>8&255]+"-"+Te[t>>16&255]+Te[t>>24&255]+Te[n&255]+Te[n>>8&255]+Te[n>>16&255]+Te[n>>24&255]).toLowerCase()}function ke(r,e,t){return Math.max(e,Math.min(t,r))}function yu(r,e){return(r%e+e)%e}function ns(r,e,t){return(1-t)*r+t*e}var ht=class r{constructor(e=0,t=0){r.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*n-o*i+e.x,this.y=s*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Y=class r{constructor(e,t,n,i,s,o,a,c,l){r.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,o,a,c,l)}set(e,t,n,i,s,o,a,c,l){let u=this.elements;return u[0]=e,u[1]=i,u[2]=a,u[3]=t,u[4]=s,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,s=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],d=n[2],f=n[5],p=n[8],m=i[0],g=i[3],y=i[6],b=i[1],_=i[4],v=i[7],M=i[2],x=i[5],E=i[8];return s[0]=o*m+a*b+c*M,s[3]=o*g+a*_+c*x,s[6]=o*y+a*v+c*E,s[1]=l*m+u*b+h*M,s[4]=l*g+u*_+h*x,s[7]=l*y+u*v+h*E,s[2]=d*m+f*b+p*M,s[5]=d*g+f*_+p*x,s[8]=d*y+f*v+p*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-n*s*u+n*a*c+i*s*l-i*o*c}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,d=a*c-u*s,f=l*s-o*c,p=t*h+n*d+i*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=h*m,e[1]=(i*l-u*n)*m,e[2]=(a*n-i*o)*m,e[3]=d*m,e[4]=(u*t-i*c)*m,e[5]=(i*s-a*t)*m,e[6]=f*m,e[7]=(n*c-l*t)*m,e[8]=(o*t-n*s)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,s,o,a){let c=Math.cos(s),l=Math.sin(s);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-i*l,i*c,-i*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(is.makeScale(e,t)),this}rotate(e){return this.premultiply(is.makeRotation(-e)),this}translate(e,t){return this.premultiply(is.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},is=new Y;function Zo(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}var je={enabled:!0,workingColorSpace:ga,spaces:{},convert:function(r,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===ys&&(r.r=wt(r.r),r.g=wt(r.g),r.b=wt(r.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(r.applyMatrix3(this.spaces[e].toXYZ),r.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===ys&&(r.r=En(r.r),r.g=En(r.g),r.b=En(r.b))),r},fromWorkingColorSpace:function(r,e){return this.convert(r,this.workingColorSpace,e)},toWorkingColorSpace:function(r,e){return this.convert(r,e,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===ma?ya:this.spaces[r].transfer},getLuminanceCoefficients:function(r,e=this.workingColorSpace){return r.fromArray(this.spaces[e].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,e,t){return r.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}};function wt(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function En(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}var Ko=[.64,.33,.3,.6,.15,.06],Qo=[.2126,.7152,.0722],ea=[.3127,.329],ta=new Y().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),na=new Y().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);je.define({[ga]:{primaries:Ko,whitePoint:ea,transfer:ya,toXYZ:ta,fromXYZ:na,luminanceCoefficients:Qo,workingColorSpaceConfig:{unpackColorSpace:tt},outputColorSpaceConfig:{drawingBufferColorSpace:tt}},[tt]:{primaries:Ko,whitePoint:ea,transfer:ys,toXYZ:ta,fromXYZ:na,luminanceCoefficients:Qo,outputColorSpaceConfig:{drawingBufferColorSpace:tt}}});var mn,vs=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{mn===void 0&&(mn=Zo("canvas")),mn.width=e.width,mn.height=e.height;let n=mn.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=mn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Zo("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),s=i.data;for(let o=0;o<s.length;o++)s[o]=wt(s[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(wt(t[n]/255)*255):t[n]=wt(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},vu=0,xs=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:vu++}),this.uuid=Ps(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?s.push(rs(i[o].image)):s.push(rs(i[o]))}else s=rs(i);n.url=s}return t||(e.images[this.uuid]=n),n}};function rs(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?vs.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var xu=0,Jn=class r extends Li{constructor(e=r.DEFAULT_IMAGE,t=r.DEFAULT_MAPPING,n=Si,i=Si,s=du,o=pu,a=gu,c=mu,l=r.DEFAULT_ANISOTROPY,u=ma){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:xu++}),this.uuid=Ps(),this.name="",this.source=new xs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new ht(0,0),this.repeat=new ht(1,1),this.center=new ht(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Y,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==pa)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Xo:e.x=e.x-Math.floor(e.x);break;case Si:e.x=e.x<0?0:1;break;case qo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Xo:e.y=e.y-Math.floor(e.y);break;case Si:e.y=e.y<0?0:1;break;case qo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Jn.DEFAULT_IMAGE=null;Jn.DEFAULT_MAPPING=pa;Jn.DEFAULT_ANISOTROPY=1;var $n=class r{constructor(e=0,t=0,n=0,i=1){r.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*s,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*s,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*s,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,s,c=e.elements,l=c[0],u=c[4],h=c[8],d=c[1],f=c[5],p=c[9],m=c[2],g=c[6],y=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-m)<.01&&Math.abs(p-g)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+m)<.1&&Math.abs(p+g)<.1&&Math.abs(l+f+y-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let _=(l+1)/2,v=(f+1)/2,M=(y+1)/2,x=(u+d)/4,E=(h+m)/4,w=(p+g)/4;return _>v&&_>M?_<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(_),i=x/n,s=E/n):v>M?v<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(v),n=x/i,s=w/i):M<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(M),n=E/s,i=w/s),this.set(n,i,s,t),this}let b=Math.sqrt((g-p)*(g-p)+(h-m)*(h-m)+(d-u)*(d-u));return Math.abs(b)<.001&&(b=1),this.x=(g-p)/b,this.y=(h-m)/b,this.z=(d-u)/b,this.w=Math.acos((l+f+y-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var Ot=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,s,o,a){let c=n[i+0],l=n[i+1],u=n[i+2],h=n[i+3],d=s[o+0],f=s[o+1],p=s[o+2],m=s[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=d,e[t+1]=f,e[t+2]=p,e[t+3]=m;return}if(h!==m||c!==d||l!==f||u!==p){let g=1-a,y=c*d+l*f+u*p+h*m,b=y>=0?1:-1,_=1-y*y;if(_>Number.EPSILON){let M=Math.sqrt(_),x=Math.atan2(M,y*b);g=Math.sin(g*x)/M,a=Math.sin(a*x)/M}let v=a*b;if(c=c*g+d*v,l=l*g+f*v,u=u*g+p*v,h=h*g+m*v,g===1-a){let M=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=M,l*=M,u*=M,h*=M}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,s,o){let a=n[i],c=n[i+1],l=n[i+2],u=n[i+3],h=s[o],d=s[o+1],f=s[o+2],p=s[o+3];return e[t]=a*p+u*h+c*f-l*d,e[t+1]=c*p+u*d+l*h-a*f,e[t+2]=l*p+u*f+a*d-c*h,e[t+3]=u*p-a*h-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,s=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(i/2),h=a(s/2),d=c(n/2),f=c(i/2),p=c(s/2);switch(o){case"XYZ":this._x=d*u*h+l*f*p,this._y=l*f*h-d*u*p,this._z=l*u*p+d*f*h,this._w=l*u*h-d*f*p;break;case"YXZ":this._x=d*u*h+l*f*p,this._y=l*f*h-d*u*p,this._z=l*u*p-d*f*h,this._w=l*u*h+d*f*p;break;case"ZXY":this._x=d*u*h-l*f*p,this._y=l*f*h+d*u*p,this._z=l*u*p+d*f*h,this._w=l*u*h-d*f*p;break;case"ZYX":this._x=d*u*h-l*f*p,this._y=l*f*h+d*u*p,this._z=l*u*p-d*f*h,this._w=l*u*h+d*f*p;break;case"YZX":this._x=d*u*h+l*f*p,this._y=l*f*h+d*u*p,this._z=l*u*p-d*f*h,this._w=l*u*h-d*f*p;break;case"XZY":this._x=d*u*h-l*f*p,this._y=l*f*h-d*u*p,this._z=l*u*p+d*f*h,this._w=l*u*h+d*f*p;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],s=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],d=n+a+h;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-c)*f,this._y=(s-l)*f,this._z=(o-i)*f}else if(n>a&&n>h){let f=2*Math.sqrt(1+n-a-h);this._w=(u-c)/f,this._x=.25*f,this._y=(i+o)/f,this._z=(s+l)/f}else if(a>h){let f=2*Math.sqrt(1+a-n-h);this._w=(s-l)/f,this._x=(i+o)/f,this._y=.25*f,this._z=(c+u)/f}else{let f=2*Math.sqrt(1+h-n-a);this._w=(o-i)/f,this._x=(s+l)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ke(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,s=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+o*a+i*l-s*c,this._y=i*u+o*c+s*a-n*l,this._z=s*u+o*l+n*c-i*a,this._w=o*u-n*a-i*c-s*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,s=this._z,o=this._w,a=o*e._w+n*e._x+i*e._y+s*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=s,this;let c=1-a*a;if(c<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*i+t*this._y,this._z=f*s+t*this._z,this.normalize(),this}let l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-t)*u)/l,d=Math.sin(t*u)/l;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=i*h+this._y*d,this._z=s*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},k=class r{constructor(e=0,t=0,n=0){r.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ia.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ia.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*i,this.y=s[1]*t+s[4]*n+s[7]*i,this.z=s[2]*t+s[5]*n+s[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,s=e.elements,o=1/(s[3]*t+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*i+s[12])*o,this.y=(s[1]*t+s[5]*n+s[9]*i+s[13])*o,this.z=(s[2]*t+s[6]*n+s[10]*i+s[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,s=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*i-a*n),u=2*(a*t-s*i),h=2*(s*n-o*t);return this.x=t+c*l+o*h-a*u,this.y=n+c*u+a*l-s*h,this.z=i+c*h+s*u-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i,this.y=s[1]*t+s[5]*n+s[9]*i,this.z=s[2]*t+s[6]*n+s[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,s=e.z,o=t.x,a=t.y,c=t.z;return this.x=i*c-s*a,this.y=s*o-n*c,this.z=n*a-i*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ss.copy(this).projectOnVector(e),this.sub(ss)}reflect(e){return this.sub(ss.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ss=new k,ia=new Ot,Zn=class{constructor(e=new k(1/0,1/0,1/0),t=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Ke.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Ke.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Ke.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Ke):Ke.fromBufferAttribute(s,o),Ke.applyMatrix4(e.matrixWorld),this.expandByPoint(Ke);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ai.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ai.copy(n.boundingBox)),Ai.applyMatrix4(e.matrixWorld),this.union(Ai)}let i=e.children;for(let s=0,o=i.length;s<o;s++)this.expandByObject(i[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ke),Ke.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Yn),Ti.subVectors(this.max,Yn),gn.subVectors(e.a,Yn),yn.subVectors(e.b,Yn),vn.subVectors(e.c,Yn),Dt.subVectors(yn,gn),Lt.subVectors(vn,yn),Zt.subVectors(gn,vn);let t=[0,-Dt.z,Dt.y,0,-Lt.z,Lt.y,0,-Zt.z,Zt.y,Dt.z,0,-Dt.x,Lt.z,0,-Lt.x,Zt.z,0,-Zt.x,-Dt.y,Dt.x,0,-Lt.y,Lt.x,0,-Zt.y,Zt.x,0];return!os(t,gn,yn,vn,Ti)||(t=[1,0,0,0,1,0,0,0,1],!os(t,gn,yn,vn,Ti))?!1:(Ci.crossVectors(Dt,Lt),t=[Ci.x,Ci.y,Ci.z],os(t,gn,yn,vn,Ti))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ke).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ke).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(xt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),xt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),xt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),xt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),xt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),xt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),xt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),xt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(xt),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},xt=[new k,new k,new k,new k,new k,new k,new k,new k],Ke=new k,Ai=new Zn,gn=new k,yn=new k,vn=new k,Dt=new k,Lt=new k,Zt=new k,Yn=new k,Ti=new k,Ci=new k,Kt=new k;function os(r,e,t,n,i){for(let s=0,o=r.length-3;s<=o;s+=3){Kt.fromArray(r,s);let a=i.x*Math.abs(Kt.x)+i.y*Math.abs(Kt.y)+i.z*Math.abs(Kt.z),c=e.dot(Kt),l=t.dot(Kt),u=n.dot(Kt);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var We=class r{constructor(e,t,n,i,s,o,a,c,l,u,h,d,f,p,m,g){r.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,o,a,c,l,u,h,d,f,p,m,g)}set(e,t,n,i,s,o,a,c,l,u,h,d,f,p,m,g){let y=this.elements;return y[0]=e,y[4]=t,y[8]=n,y[12]=i,y[1]=s,y[5]=o,y[9]=a,y[13]=c,y[2]=l,y[6]=u,y[10]=h,y[14]=d,y[3]=f,y[7]=p,y[11]=m,y[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new r().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/xn.setFromMatrixColumn(e,0).length(),s=1/xn.setFromMatrixColumn(e,1).length(),o=1/xn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,s=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(i),l=Math.sin(i),u=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){let d=o*u,f=o*h,p=a*u,m=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=f+p*l,t[5]=d-m*l,t[9]=-a*c,t[2]=m-d*l,t[6]=p+f*l,t[10]=o*c}else if(e.order==="YXZ"){let d=c*u,f=c*h,p=l*u,m=l*h;t[0]=d+m*a,t[4]=p*a-f,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=f*a-p,t[6]=m+d*a,t[10]=o*c}else if(e.order==="ZXY"){let d=c*u,f=c*h,p=l*u,m=l*h;t[0]=d-m*a,t[4]=-o*h,t[8]=p+f*a,t[1]=f+p*a,t[5]=o*u,t[9]=m-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let d=o*u,f=o*h,p=a*u,m=a*h;t[0]=c*u,t[4]=p*l-f,t[8]=d*l+m,t[1]=c*h,t[5]=m*l+d,t[9]=f*l-p,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*l,p=a*c,m=a*l;t[0]=c*u,t[4]=m-d*h,t[8]=p*h+f,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=f*h+p,t[10]=d-m*h}else if(e.order==="XZY"){let d=o*c,f=o*l,p=a*c,m=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=d*h+m,t[5]=o*u,t[9]=f*h-p,t[2]=p*h-f,t[6]=a*u,t[10]=m*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(_u,e,bu)}lookAt(e,t,n){let i=this.elements;return Ge.subVectors(e,t),Ge.lengthSq()===0&&(Ge.z=1),Ge.normalize(),Ut.crossVectors(n,Ge),Ut.lengthSq()===0&&(Math.abs(n.z)===1?Ge.x+=1e-4:Ge.z+=1e-4,Ge.normalize(),Ut.crossVectors(n,Ge)),Ut.normalize(),Ii.crossVectors(Ge,Ut),i[0]=Ut.x,i[4]=Ii.x,i[8]=Ge.x,i[1]=Ut.y,i[5]=Ii.y,i[9]=Ge.y,i[2]=Ut.z,i[6]=Ii.z,i[10]=Ge.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,s=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],d=n[9],f=n[13],p=n[2],m=n[6],g=n[10],y=n[14],b=n[3],_=n[7],v=n[11],M=n[15],x=i[0],E=i[4],w=i[8],S=i[12],T=i[1],C=i[5],P=i[9],A=i[13],I=i[2],N=i[6],D=i[10],U=i[14],F=i[3],z=i[7],G=i[11],W=i[15];return s[0]=o*x+a*T+c*I+l*F,s[4]=o*E+a*C+c*N+l*z,s[8]=o*w+a*P+c*D+l*G,s[12]=o*S+a*A+c*U+l*W,s[1]=u*x+h*T+d*I+f*F,s[5]=u*E+h*C+d*N+f*z,s[9]=u*w+h*P+d*D+f*G,s[13]=u*S+h*A+d*U+f*W,s[2]=p*x+m*T+g*I+y*F,s[6]=p*E+m*C+g*N+y*z,s[10]=p*w+m*P+g*D+y*G,s[14]=p*S+m*A+g*U+y*W,s[3]=b*x+_*T+v*I+M*F,s[7]=b*E+_*C+v*N+M*z,s[11]=b*w+_*P+v*D+M*G,s[15]=b*S+_*A+v*U+M*W,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],s=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],d=e[10],f=e[14],p=e[3],m=e[7],g=e[11],y=e[15];return p*(+s*c*h-i*l*h-s*a*d+n*l*d+i*a*f-n*c*f)+m*(+t*c*f-t*l*d+s*o*d-i*o*f+i*l*u-s*c*u)+g*(+t*l*h-t*a*f-s*o*h+n*o*f+s*a*u-n*l*u)+y*(-i*a*u-t*c*h+t*a*d+i*o*h-n*o*d+n*c*u)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],d=e[10],f=e[11],p=e[12],m=e[13],g=e[14],y=e[15],b=h*g*l-m*d*l+m*c*f-a*g*f-h*c*y+a*d*y,_=p*d*l-u*g*l-p*c*f+o*g*f+u*c*y-o*d*y,v=u*m*l-p*h*l+p*a*f-o*m*f-u*a*y+o*h*y,M=p*h*c-u*m*c-p*a*d+o*m*d+u*a*g-o*h*g,x=t*b+n*_+i*v+s*M;if(x===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let E=1/x;return e[0]=b*E,e[1]=(m*d*s-h*g*s-m*i*f+n*g*f+h*i*y-n*d*y)*E,e[2]=(a*g*s-m*c*s+m*i*l-n*g*l-a*i*y+n*c*y)*E,e[3]=(h*c*s-a*d*s-h*i*l+n*d*l+a*i*f-n*c*f)*E,e[4]=_*E,e[5]=(u*g*s-p*d*s+p*i*f-t*g*f-u*i*y+t*d*y)*E,e[6]=(p*c*s-o*g*s-p*i*l+t*g*l+o*i*y-t*c*y)*E,e[7]=(o*d*s-u*c*s+u*i*l-t*d*l-o*i*f+t*c*f)*E,e[8]=v*E,e[9]=(p*h*s-u*m*s-p*n*f+t*m*f+u*n*y-t*h*y)*E,e[10]=(o*m*s-p*a*s+p*n*l-t*m*l-o*n*y+t*a*y)*E,e[11]=(u*a*s-o*h*s-u*n*l+t*h*l+o*n*f-t*a*f)*E,e[12]=M*E,e[13]=(u*m*i-p*h*i+p*n*d-t*m*d-u*n*g+t*h*g)*E,e[14]=(p*a*i-o*m*i-p*n*c+t*m*c+o*n*g-t*a*g)*E,e[15]=(o*h*i-u*a*i+u*n*c-t*h*c-o*n*d+t*a*d)*E,this}scale(e){let t=this.elements,n=e.x,i=e.y,s=e.z;return t[0]*=n,t[4]*=i,t[8]*=s,t[1]*=n,t[5]*=i,t[9]*=s,t[2]*=n,t[6]*=i,t[10]*=s,t[3]*=n,t[7]*=i,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),s=1-n,o=e.x,a=e.y,c=e.z,l=s*o,u=s*a;return this.set(l*o+n,l*a-i*c,l*c+i*a,0,l*a+i*c,u*a+n,u*c-i*o,0,l*c-i*a,u*c+i*o,s*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,s,o){return this.set(1,n,s,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,s=t._x,o=t._y,a=t._z,c=t._w,l=s+s,u=o+o,h=a+a,d=s*l,f=s*u,p=s*h,m=o*u,g=o*h,y=a*h,b=c*l,_=c*u,v=c*h,M=n.x,x=n.y,E=n.z;return i[0]=(1-(m+y))*M,i[1]=(f+v)*M,i[2]=(p-_)*M,i[3]=0,i[4]=(f-v)*x,i[5]=(1-(d+y))*x,i[6]=(g+b)*x,i[7]=0,i[8]=(p+_)*E,i[9]=(g-b)*E,i[10]=(1-(d+m))*E,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,s=xn.set(i[0],i[1],i[2]).length(),o=xn.set(i[4],i[5],i[6]).length(),a=xn.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),e.x=i[12],e.y=i[13],e.z=i[14],Qe.copy(this);let l=1/s,u=1/o,h=1/a;return Qe.elements[0]*=l,Qe.elements[1]*=l,Qe.elements[2]*=l,Qe.elements[4]*=u,Qe.elements[5]*=u,Qe.elements[6]*=u,Qe.elements[8]*=h,Qe.elements[9]*=h,Qe.elements[10]*=h,t.setFromRotationMatrix(Qe),n.x=s,n.y=o,n.z=a,this}makePerspective(e,t,n,i,s,o,a=Ei){let c=this.elements,l=2*s/(t-e),u=2*s/(n-i),h=(t+e)/(t-e),d=(n+i)/(n-i),f,p;if(a===Ei)f=-(o+s)/(o-s),p=-2*o*s/(o-s);else if(a===$o)f=-o/(o-s),p=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=f,c[14]=p,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,s,o,a=Ei){let c=this.elements,l=1/(t-e),u=1/(n-i),h=1/(o-s),d=(t+e)*l,f=(n+i)*u,p,m;if(a===Ei)p=(o+s)*h,m=-2*h;else if(a===$o)p=s*h,m=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-d,c[1]=0,c[5]=2*u,c[9]=0,c[13]=-f,c[2]=0,c[6]=0,c[10]=m,c[14]=-p,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},xn=new k,Qe=new We,_u=new k(0,0,0),bu=new k(1,1,1),Ut=new k,Ii=new k,Ge=new k,ra=new We,sa=new Ot,An=class r{constructor(e=0,t=0,n=0,i=r.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,s=i[0],o=i[4],a=i[8],c=i[1],l=i[5],u=i[9],h=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(ke(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ke(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(ke(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-ke(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ke(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ra.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ra,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return sa.setFromEuler(this),this.setFromQuaternion(sa,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};An.DEFAULT_ORDER="XYZ";var _s=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Mu=0,oa=new k,_n=new Ot,_t=new We,Ri=new k,jn=new k,wu=new k,Su=new Ot,aa=new k(1,0,0),la=new k(0,1,0),ca=new k(0,0,1),ua={type:"added"},Eu={type:"removed"},bn={type:"childadded",child:null},as={type:"childremoved",child:null},Kn=class r extends Li{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Mu++}),this.uuid=Ps(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=r.DEFAULT_UP.clone();let e=new k,t=new An,n=new Ot,i=new k(1,1,1);function s(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new We},normalMatrix:{value:new Y}}),this.matrix=new We,this.matrixWorld=new We,this.matrixAutoUpdate=r.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=r.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new _s,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return _n.setFromAxisAngle(e,t),this.quaternion.multiply(_n),this}rotateOnWorldAxis(e,t){return _n.setFromAxisAngle(e,t),this.quaternion.premultiply(_n),this}rotateX(e){return this.rotateOnAxis(aa,e)}rotateY(e){return this.rotateOnAxis(la,e)}rotateZ(e){return this.rotateOnAxis(ca,e)}translateOnAxis(e,t){return oa.copy(e).applyQuaternion(this.quaternion),this.position.add(oa.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(aa,e)}translateY(e){return this.translateOnAxis(la,e)}translateZ(e){return this.translateOnAxis(ca,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(_t.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ri.copy(e):Ri.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),jn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?_t.lookAt(jn,Ri,this.up):_t.lookAt(Ri,jn,this.up),this.quaternion.setFromRotationMatrix(_t),i&&(_t.extractRotation(i.matrixWorld),_n.setFromRotationMatrix(_t),this.quaternion.premultiply(_n.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ua),bn.child=e,this.dispatchEvent(bn),bn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Eu),as.child=e,this.dispatchEvent(as),as.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),_t.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),_t.multiply(e.parent.matrixWorld)),e.applyMatrix4(_t),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ua),bn.child=e,this.dispatchEvent(bn),bn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(jn,e,wu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(jn,Su,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){let h=c[l];s(e.shapes,h)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(e.materials,this.material[c]));i.material=a}else i.material=s(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];i.animations.push(s(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),f=o(e.animations),p=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=i,n;function o(a){let c=[];for(let l in a){let u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};Kn.DEFAULT_UP=new k(0,1,0);Kn.DEFAULT_MATRIX_AUTO_UPDATE=!0;Kn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var et=new k,bt=new k,ls=new k,Mt=new k,Mn=new k,wn=new k,ha=new k,cs=new k,us=new k,hs=new k,fs=new $n,ds=new $n,ps=new $n,Ui=class r{constructor(e=new k,t=new k,n=new k){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),et.subVectors(e,t),i.cross(et);let s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(e,t,n,i,s){et.subVectors(i,t),bt.subVectors(n,t),ls.subVectors(e,t);let o=et.dot(et),a=et.dot(bt),c=et.dot(ls),l=bt.dot(bt),u=bt.dot(ls),h=o*l-a*a;if(h===0)return s.set(0,0,0),null;let d=1/h,f=(l*c-a*u)*d,p=(o*u-a*c)*d;return s.set(1-f-p,p,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Mt)===null?!1:Mt.x>=0&&Mt.y>=0&&Mt.x+Mt.y<=1}static getInterpolation(e,t,n,i,s,o,a,c){return this.getBarycoord(e,t,n,i,Mt)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Mt.x),c.addScaledVector(o,Mt.y),c.addScaledVector(a,Mt.z),c)}static getInterpolatedAttribute(e,t,n,i,s,o){return fs.setScalar(0),ds.setScalar(0),ps.setScalar(0),fs.fromBufferAttribute(e,t),ds.fromBufferAttribute(e,n),ps.fromBufferAttribute(e,i),o.setScalar(0),o.addScaledVector(fs,s.x),o.addScaledVector(ds,s.y),o.addScaledVector(ps,s.z),o}static isFrontFacing(e,t,n,i){return et.subVectors(n,t),bt.subVectors(e,t),et.cross(bt).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return et.subVectors(this.c,this.b),bt.subVectors(this.a,this.b),et.cross(bt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return r.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return r.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,s){return r.getInterpolation(e,this.a,this.b,this.c,t,n,i,s)}containsPoint(e){return r.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return r.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,s=this.c,o,a;Mn.subVectors(i,n),wn.subVectors(s,n),cs.subVectors(e,n);let c=Mn.dot(cs),l=wn.dot(cs);if(c<=0&&l<=0)return t.copy(n);us.subVectors(e,i);let u=Mn.dot(us),h=wn.dot(us);if(u>=0&&h<=u)return t.copy(i);let d=c*h-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(n).addScaledVector(Mn,o);hs.subVectors(e,s);let f=Mn.dot(hs),p=wn.dot(hs);if(p>=0&&f<=p)return t.copy(s);let m=f*l-c*p;if(m<=0&&l>=0&&p<=0)return a=l/(l-p),t.copy(n).addScaledVector(wn,a);let g=u*p-f*h;if(g<=0&&h-u>=0&&f-p>=0)return ha.subVectors(s,i),a=(h-u)/(h-u+(f-p)),t.copy(i).addScaledVector(ha,a);let y=1/(g+m+d);return o=m*y,a=d*y,t.copy(n).addScaledVector(Mn,o).addScaledVector(wn,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},va={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},kt={h:0,s:0,l:0},Pi={h:0,s:0,l:0};function ms(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}var Me=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=tt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,je.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=je.workingColorSpace){return this.r=e,this.g=t,this.b=n,je.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=je.workingColorSpace){if(e=yu(e,1),t=ke(t,0,1),n=ke(n,0,1),t===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+t):n+t-n*t,o=2*n-s;this.r=ms(o,s,e+1/3),this.g=ms(o,s,e),this.b=ms(o,s,e-1/3)}return je.toWorkingColorSpace(this,i),this}setStyle(e,t=tt){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=i[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=tt){let n=va[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=wt(e.r),this.g=wt(e.g),this.b=wt(e.b),this}copyLinearToSRGB(e){return this.r=En(e.r),this.g=En(e.g),this.b=En(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=tt){return je.fromWorkingColorSpace(Ce.copy(this),e),Math.round(ke(Ce.r*255,0,255))*65536+Math.round(ke(Ce.g*255,0,255))*256+Math.round(ke(Ce.b*255,0,255))}getHexString(e=tt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=je.workingColorSpace){je.fromWorkingColorSpace(Ce.copy(this),t);let n=Ce.r,i=Ce.g,s=Ce.b,o=Math.max(n,i,s),a=Math.min(n,i,s),c,l,u=(a+o)/2;if(a===o)c=0,l=0;else{let h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(i-s)/h+(i<s?6:0);break;case i:c=(s-n)/h+2;break;case s:c=(n-i)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=je.workingColorSpace){return je.fromWorkingColorSpace(Ce.copy(this),t),e.r=Ce.r,e.g=Ce.g,e.b=Ce.b,e}getStyle(e=tt){je.fromWorkingColorSpace(Ce.copy(this),e);let t=Ce.r,n=Ce.g,i=Ce.b;return e!==tt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(kt),this.setHSL(kt.h+e,kt.s+t,kt.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(kt),e.getHSL(Pi);let n=ns(kt.h,Pi.h,t),i=ns(kt.s,Pi.s,t),s=ns(kt.l,Pi.l,t);return this.setHSL(n,i,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*i,this.g=s[1]*t+s[4]*n+s[7]*i,this.b=s[2]*t+s[5]*n+s[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ce=new Me;Me.NAMES=va;function Au(r){let e={};for(let t in r){e[t]={};for(let n in r[t]){let i=r[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Ue(r){let e={};for(let t=0;t<r.length;t++){let n=Au(r[t]);for(let i in n)e[i]=n[i]}return e}var Tu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Cu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Iu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ru=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Pu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Nu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Du=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Lu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Uu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ku=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ou=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Fu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,zu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Bu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Vu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Hu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Gu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Wu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Xu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,qu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Yu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,ju=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Ju=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,$u=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Zu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Ku=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Qu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,eh=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,th=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,nh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ih="gl_FragColor = linearToOutputTexel( gl_FragColor );",rh=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,sh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,oh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,ah=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,lh=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ch=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,uh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,hh=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,dh=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ph=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,mh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,gh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,yh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,vh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,xh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,_h=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,bh=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Mh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,wh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Sh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Eh=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ah=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Th=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Ch=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ih=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Rh=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ph=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Nh=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Dh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Lh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Uh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,kh=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Oh=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Fh=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,zh=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Bh=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Vh=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Hh=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Gh=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Wh=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Xh=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,qh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Yh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jh=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Jh=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,$h=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Zh=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Kh=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Qh=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,ef=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,tf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,nf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,rf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,sf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,of=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,af=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,lf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,cf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,uf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,hf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,ff=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,df=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,pf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,mf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,gf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,yf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,vf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,xf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,_f=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,bf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Mf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,wf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Sf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ef=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Af=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Tf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Cf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,If=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Nf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Df=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Lf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Uf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,kf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Of=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Ff=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Bf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Vf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Hf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Wf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,qf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,jf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Jf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$f=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Kf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Qf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ed=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,td=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,nd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,id=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,rd=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sd=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,od=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,j={alphahash_fragment:Tu,alphahash_pars_fragment:Cu,alphamap_fragment:Iu,alphamap_pars_fragment:Ru,alphatest_fragment:Pu,alphatest_pars_fragment:Nu,aomap_fragment:Du,aomap_pars_fragment:Lu,batching_pars_vertex:Uu,batching_vertex:ku,begin_vertex:Ou,beginnormal_vertex:Fu,bsdfs:zu,iridescence_fragment:Bu,bumpmap_pars_fragment:Vu,clipping_planes_fragment:Hu,clipping_planes_pars_fragment:Gu,clipping_planes_pars_vertex:Wu,clipping_planes_vertex:Xu,color_fragment:qu,color_pars_fragment:Yu,color_pars_vertex:ju,color_vertex:Ju,common:$u,cube_uv_reflection_fragment:Zu,defaultnormal_vertex:Ku,displacementmap_pars_vertex:Qu,displacementmap_vertex:eh,emissivemap_fragment:th,emissivemap_pars_fragment:nh,colorspace_fragment:ih,colorspace_pars_fragment:rh,envmap_fragment:sh,envmap_common_pars_fragment:oh,envmap_pars_fragment:ah,envmap_pars_vertex:lh,envmap_physical_pars_fragment:xh,envmap_vertex:ch,fog_vertex:uh,fog_pars_vertex:hh,fog_fragment:fh,fog_pars_fragment:dh,gradientmap_pars_fragment:ph,lightmap_pars_fragment:mh,lights_lambert_fragment:gh,lights_lambert_pars_fragment:yh,lights_pars_begin:vh,lights_toon_fragment:_h,lights_toon_pars_fragment:bh,lights_phong_fragment:Mh,lights_phong_pars_fragment:wh,lights_physical_fragment:Sh,lights_physical_pars_fragment:Eh,lights_fragment_begin:Ah,lights_fragment_maps:Th,lights_fragment_end:Ch,logdepthbuf_fragment:Ih,logdepthbuf_pars_fragment:Rh,logdepthbuf_pars_vertex:Ph,logdepthbuf_vertex:Nh,map_fragment:Dh,map_pars_fragment:Lh,map_particle_fragment:Uh,map_particle_pars_fragment:kh,metalnessmap_fragment:Oh,metalnessmap_pars_fragment:Fh,morphinstance_vertex:zh,morphcolor_vertex:Bh,morphnormal_vertex:Vh,morphtarget_pars_vertex:Hh,morphtarget_vertex:Gh,normal_fragment_begin:Wh,normal_fragment_maps:Xh,normal_pars_fragment:qh,normal_pars_vertex:Yh,normal_vertex:jh,normalmap_pars_fragment:Jh,clearcoat_normal_fragment_begin:$h,clearcoat_normal_fragment_maps:Zh,clearcoat_pars_fragment:Kh,iridescence_pars_fragment:Qh,opaque_fragment:ef,packing:tf,premultiplied_alpha_fragment:nf,project_vertex:rf,dithering_fragment:sf,dithering_pars_fragment:of,roughnessmap_fragment:af,roughnessmap_pars_fragment:lf,shadowmap_pars_fragment:cf,shadowmap_pars_vertex:uf,shadowmap_vertex:hf,shadowmask_pars_fragment:ff,skinbase_vertex:df,skinning_pars_vertex:pf,skinning_vertex:mf,skinnormal_vertex:gf,specularmap_fragment:yf,specularmap_pars_fragment:vf,tonemapping_fragment:xf,tonemapping_pars_fragment:_f,transmission_fragment:bf,transmission_pars_fragment:Mf,uv_pars_fragment:wf,uv_pars_vertex:Sf,uv_vertex:Ef,worldpos_vertex:Af,background_vert:Tf,background_frag:Cf,backgroundCube_vert:If,backgroundCube_frag:Rf,cube_vert:Pf,cube_frag:Nf,depth_vert:Df,depth_frag:Lf,distanceRGBA_vert:Uf,distanceRGBA_frag:kf,equirect_vert:Of,equirect_frag:Ff,linedashed_vert:zf,linedashed_frag:Bf,meshbasic_vert:Vf,meshbasic_frag:Hf,meshlambert_vert:Gf,meshlambert_frag:Wf,meshmatcap_vert:Xf,meshmatcap_frag:qf,meshnormal_vert:Yf,meshnormal_frag:jf,meshphong_vert:Jf,meshphong_frag:$f,meshphysical_vert:Zf,meshphysical_frag:Kf,meshtoon_vert:Qf,meshtoon_frag:ed,points_vert:td,points_frag:nd,shadow_vert:id,shadow_frag:rd,sprite_vert:sd,sprite_frag:od},O={common:{diffuse:{value:new Me(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Y},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Y}},envmap:{envMap:{value:null},envMapRotation:{value:new Y},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Y}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Y}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Y},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Y},normalScale:{value:new ht(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Y},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Y}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Y}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Y}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Me(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Me(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0},uvTransform:{value:new Y}},sprite:{diffuse:{value:new Me(16777215)},opacity:{value:1},center:{value:new ht(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Y},alphaMap:{value:null},alphaMapTransform:{value:new Y},alphaTest:{value:0}}},fa={basic:{uniforms:Ue([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.fog]),vertexShader:j.meshbasic_vert,fragmentShader:j.meshbasic_frag},lambert:{uniforms:Ue([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.fog,O.lights,{emissive:{value:new Me(0)}}]),vertexShader:j.meshlambert_vert,fragmentShader:j.meshlambert_frag},phong:{uniforms:Ue([O.common,O.specularmap,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.fog,O.lights,{emissive:{value:new Me(0)},specular:{value:new Me(1118481)},shininess:{value:30}}]),vertexShader:j.meshphong_vert,fragmentShader:j.meshphong_frag},standard:{uniforms:Ue([O.common,O.envmap,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.roughnessmap,O.metalnessmap,O.fog,O.lights,{emissive:{value:new Me(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:j.meshphysical_vert,fragmentShader:j.meshphysical_frag},toon:{uniforms:Ue([O.common,O.aomap,O.lightmap,O.emissivemap,O.bumpmap,O.normalmap,O.displacementmap,O.gradientmap,O.fog,O.lights,{emissive:{value:new Me(0)}}]),vertexShader:j.meshtoon_vert,fragmentShader:j.meshtoon_frag},matcap:{uniforms:Ue([O.common,O.bumpmap,O.normalmap,O.displacementmap,O.fog,{matcap:{value:null}}]),vertexShader:j.meshmatcap_vert,fragmentShader:j.meshmatcap_frag},points:{uniforms:Ue([O.points,O.fog]),vertexShader:j.points_vert,fragmentShader:j.points_frag},dashed:{uniforms:Ue([O.common,O.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:j.linedashed_vert,fragmentShader:j.linedashed_frag},depth:{uniforms:Ue([O.common,O.displacementmap]),vertexShader:j.depth_vert,fragmentShader:j.depth_frag},normal:{uniforms:Ue([O.common,O.bumpmap,O.normalmap,O.displacementmap,{opacity:{value:1}}]),vertexShader:j.meshnormal_vert,fragmentShader:j.meshnormal_frag},sprite:{uniforms:Ue([O.sprite,O.fog]),vertexShader:j.sprite_vert,fragmentShader:j.sprite_frag},background:{uniforms:{uvTransform:{value:new Y},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:j.background_vert,fragmentShader:j.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Y}},vertexShader:j.backgroundCube_vert,fragmentShader:j.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:j.cube_vert,fragmentShader:j.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:j.equirect_vert,fragmentShader:j.equirect_frag},distanceRGBA:{uniforms:Ue([O.common,O.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:j.distanceRGBA_vert,fragmentShader:j.distanceRGBA_frag},shadow:{uniforms:Ue([O.lights,O.fog,{color:{value:new Me(0)},opacity:{value:1}}]),vertexShader:j.shadow_vert,fragmentShader:j.shadow_frag}};fa.physical={uniforms:Ue([fa.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Y},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Y},clearcoatNormalScale:{value:new ht(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Y},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Y},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Y},sheen:{value:0},sheenColor:{value:new Me(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Y},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Y},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Y},transmissionSamplerSize:{value:new ht},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Y},attenuationDistance:{value:0},attenuationColor:{value:new Me(0)},specularColor:{value:new Me(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Y},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Y},anisotropyVector:{value:new ht},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Y}}]),vertexShader:j.meshphysical_vert,fragmentShader:j.meshphysical_frag};var Qt=(1+Math.sqrt(5))/2,Sn=1/Qt,zp=[new k(-Qt,Sn,0),new k(Qt,Sn,0),new k(-Sn,0,Qt),new k(Sn,0,Qt),new k(0,Qt,-Sn),new k(0,Qt,Sn),new k(-1,1,-1),new k(1,1,-1),new k(-1,1,1),new k(1,1,1)];var Bp=new Float32Array(16),Vp=new Float32Array(9),Hp=new Float32Array(4);var Gp={[Oo]:Fo,[zo]:Go,[Vo]:Wo,[Bo]:Ho,[Fo]:Oo,[Go]:zo,[Wo]:Vo,[Ho]:Bo};function Ni(r,e,t){return!r||!t&&r.constructor===e?r:typeof e.BYTES_PER_ELEMENT=="number"?new e(r):Array.prototype.slice.call(r)}function ad(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}var Tn=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],s=t[n-1];n:{e:{let o;t:{i:if(!(e<i)){for(let a=n+2;;){if(i===void 0){if(e<s)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(s=i,i=t[++n],e<i)break e}o=t.length;break t}if(!(e>=s)){let a=t[1];e<a&&(n=2,s=a);for(let c=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(i=s,s=t[--n-1],e>=s)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(i=t[n],s=t[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=e*i;for(let o=0;o!==i;++o)t[o]=n[s+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},bs=class extends Tn{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Yo,endingEnd:Yo}}intervalChanged_(e,t,n){let i=this.parameterPositions,s=e-2,o=e+1,a=i[s],c=i[o];if(a===void 0)switch(this.getSettings_().endingStart){case jo:s=e,a=2*t-n;break;case Jo:s=i.length-2,a=t+i[s]-i[s+1];break;default:s=e,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case jo:o=e,c=2*n-t;break;case Jo:o=1,c=n+i[1]-i[0];break;default:o=e-1,c=t}let l=(n-t)*.5,u=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-n),this._offsetPrev=s*u,this._offsetNext=o*u}interpolate_(e,t,n,i){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(i-t),m=p*p,g=m*p,y=-d*g+2*d*m-d*p,b=(1+d)*g+(-1.5-2*d)*m+(-.5+d)*p+1,_=(-1-f)*g+(1.5+f)*m+.5*p,v=f*g-f*m;for(let M=0;M!==a;++M)s[M]=y*o[u+M]+b*o[l+M]+_*o[c+M]+v*o[h+M];return s}},Ms=class extends Tn{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=(n-t)/(i-t),h=1-u;for(let d=0;d!==a;++d)s[d]=o[l+d]*h+o[c+d]*u;return s}},ws=class extends Tn{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},nt=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Ni(t,this.TimeBufferType),this.values=Ni(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Ni(e.times,Array),values:Ni(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ws(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ms(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new bs(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Di:t=this.InterpolantFactoryMethodDiscrete;break;case gs:t=this.InterpolantFactoryMethodLinear;break;case ts:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Di;case this.InterpolantFactoryMethodLinear:return gs;case this.InterpolantFactoryMethodSmooth:return ts}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,s=0,o=i-1;for(;s!==i&&n[s]<e;)++s;for(;o!==-1&&n[o]>t;)--o;if(++o,s!==0||o!==i){s>=o&&(o=Math.max(o,1),s=o-1);let a=this.getValueSize();this.times=n.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,s=n.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==s;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(i!==void 0&&ad(i))for(let a=0,c=i.length;a!==c;++a){let l=i[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===ts,s=e.length-1,o=1;for(let a=1;a<s;++a){let c=!1,l=e[a],u=e[a+1];if(l!==u&&(a!==1||l!==e[0]))if(i)c=!0;else{let h=a*n,d=h-n,f=h+n;for(let p=0;p!==n;++p){let m=t[h+p];if(m!==t[d+p]||m!==t[f+p]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let h=a*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[h+f]}++o}}if(s>0){e[o]=e[s];for(let a=s*n,c=o*n,l=0;l!==n;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};nt.prototype.TimeBufferType=Float32Array;nt.prototype.ValueBufferType=Float32Array;nt.prototype.DefaultInterpolation=gs;var en=class extends nt{constructor(e,t,n){super(e,t,n)}};en.prototype.ValueTypeName="bool";en.prototype.ValueBufferType=Array;en.prototype.DefaultInterpolation=Di;en.prototype.InterpolantFactoryMethodLinear=void 0;en.prototype.InterpolantFactoryMethodSmooth=void 0;var Ss=class extends nt{};Ss.prototype.ValueTypeName="color";var Es=class extends nt{};Es.prototype.ValueTypeName="number";var As=class extends Tn{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-t)/(i-t),l=e*a;for(let u=l+a;l!==u;l+=4)Ot.slerpFlat(s,0,o,l-a,o,l,c);return s}},ki=class extends nt{InterpolantFactoryMethodLinear(e){return new As(this.times,this.values,this.getValueSize(),e)}};ki.prototype.ValueTypeName="quaternion";ki.prototype.InterpolantFactoryMethodSmooth=void 0;var tn=class extends nt{constructor(e,t,n){super(e,t,n)}};tn.prototype.ValueTypeName="string";tn.prototype.ValueBufferType=Array;tn.prototype.DefaultInterpolation=Di;tn.prototype.InterpolantFactoryMethodLinear=void 0;tn.prototype.InterpolantFactoryMethodSmooth=void 0;var Ts=class extends nt{};Ts.prototype.ValueTypeName="vector";var Cs=class{constructor(e,t,n){let i=this,s=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(u){a++,s===!1&&i.onStart!==void 0&&i.onStart(u,o,a),s=!0},this.itemEnd=function(u){o++,i.onProgress!==void 0&&i.onProgress(u,o,a),o===a&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){let h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=l.length;h<d;h+=2){let f=l[h],p=l[h+1];if(f.global&&(f.lastIndex=0),f.test(u))return p}return null}}},ld=new Cs,Is=class{constructor(e){this.manager=e!==void 0?e:ld,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,s){n.load(e,i,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Is.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ns="\\[\\]\\.:\\/",cd=new RegExp("["+Ns+"]","g"),Ds="[^"+Ns+"]",ud="[^"+Ns.replace("\\.","")+"]",hd=/((?:WC+[\/:])*)/.source.replace("WC",Ds),fd=/(WCOD+)?/.source.replace("WCOD",ud),dd=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ds),pd=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ds),md=new RegExp("^"+hd+fd+dd+pd+"$"),gd=["material","materials","bones","map"],Rs=class{constructor(e,t,n){let i=n||ce.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},ce=class r{constructor(e,t,n){this.path=t,this.parsedPath=n||r.parseTrackName(t),this.node=r.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new r.Composite(e,t,n):new r(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(cd,"")}static parseTrackName(e){let t=md.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let s=n.nodeName.substring(i+1);gd.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(s){for(let o=0;o<s.length;o++){let a=s[o];if(a.name===t||a.uuid===t)return a;let c=n(a.children);if(c)return c}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,s=t.propertyIndex;if(e||(e=r.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===l){l=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[i];if(o===void 0){let l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+i+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ce.Composite=Rs;ce.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ce.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ce.prototype.GetterByBindingType=[ce.prototype._getValue_direct,ce.prototype._getValue_array,ce.prototype._getValue_arrayElement,ce.prototype._getValue_toArray];ce.prototype.SetterByBindingTypeAndVersioning=[[ce.prototype._setValue_direct,ce.prototype._setValue_direct_setNeedsUpdate,ce.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_array,ce.prototype._setValue_array_setNeedsUpdate,ce.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_arrayElement,ce.prototype._setValue_arrayElement_setNeedsUpdate,ce.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_fromArray,ce.prototype._setValue_fromArray_setNeedsUpdate,ce.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Wp=new Float32Array(1);typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:da}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=da);function St(r={},e={}){let t={};for(let[n,i]of Object.entries({position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]})){let s=r[n]??e[n]??i;if(!Array.isArray(s)||s.length!==3||s.some(o=>typeof o!="number"||!Number.isFinite(o)))throw Error(`\u6A21\u578B ${n} \u9700\u8981\u4E09\u4E2A\u6709\u9650\u6570\u503C`);if(n==="scale"&&s.some(o=>o===0))throw Error("\u6A21\u578B\u7F29\u653E\u4E0D\u80FD\u4E3A\u96F6");t[n]=[...s]}return t}function xa(r){return[(r.min[0]+r.max[0])/2,r.min[1],(r.min[2]+r.max[2])/2]}function yd(r){let{position:e,rotation:t,scale:n}=St(r),i=new We().makeTranslation(...e);if(i.multiply(new We().makeRotationFromEuler(new An(...t.map(s=>s*Math.PI/180),"XYZ"))),i.multiply(new We().makeScale(...n)),i.elements.some(s=>!Number.isFinite(s)))throw Error("\u6A21\u578B\u53D8\u6362\u8D85\u51FA\u53EF\u8BA1\u7B97\u5750\u6807\u8303\u56F4");return[...i.elements]}function _a(r){let e=xa(r.bounds),t=new Float32Array(r.triangles.length*9),n=0;for(let i of r.triangles)for(let s of i)for(let o=0;o<3;o++)t[n++]=s[o]-e[o];return t}function ba(r,e){let t=new We().fromArray(yd(e)),n=new k(...xa(r.bounds)),i=new k;return r.triangles.map(s=>s.map(o=>i.fromArray(o).sub(n).applyMatrix4(t).toArray()))}var ft=({kind:r="guide",id:e})=>JSON.stringify([r,e]);function nn(r,{kind:e="guide",id:t}){return(e==="mesh"?r.meshSources:e==="guide"?r.guides:[])?.find(i=>i.id===t)}function Ma(r,e=!1){let t=[];for(let n of r.filter(i=>typeof i=="string"&&i)){if(!n.startsWith("loop:")){t.push({kind:"guide",id:n});continue}let i;try{i=JSON.parse(n.slice(5))}catch{if(e)throw Error("\u95ED\u5408\u7EBF\u6846\u6765\u6E90\u65E0\u6548")}if(!Array.isArray(i)||i.some(s=>typeof s!="string"||!s)){if(e)throw Error("\u95ED\u5408\u7EBF\u6846\u6765\u6E90\u65E0\u6548");t.push({kind:"guide",id:n})}else t.push(...i.map(s=>({kind:"guide",id:s})))}return t}var Ls=r=>[...new Map(r.map(e=>[ft(e),e])).values()];function Us(r,e,t){if(r==="mesh"){if(typeof e.sourceId!="string"||!e.sourceId)throw Error("\u8BF7\u9009\u62E9\u6A21\u578B\u6765\u6E90");return[{kind:"mesh",id:e.sourceId}]}return Ls(Ma(r==="geometry"?[t]:e.operation==="sweep"?[e.pathId,...e.sweepMode==="profile"?e.profileIds||[]:[]]:e.profileIds||[],!0))}function Ft(r){return r.generation?.detached?[]:r.generation?.sourceRefs?Ls(r.generation.sourceRefs.map(({kind:e,id:t})=>({kind:e,id:t}))):r.generation?.type==="mesh"?[{kind:"mesh",id:r.meshSourceId||r.recipe?.sourceId}]:Ls(Ma(r.generation?.sources||[...r.recipe?.profileIds||[],...r.recipe?.pathId?[r.recipe.pathId]:[],...r.generation?.type==="geometry"&&r.guideId?[r.guideId]:[]]))}function Oi(r,e){return Object.fromEntries(e.map(t=>[t.kind==="mesh"?"mesh:"+t.id:t.id,nn(r,t)?.revision||0]))}var Qn=new Map;function zt(r){return(r.meshSources||[]).map(({objText:e,...t})=>structuredClone(t))}function ks(r,e){let t=r.meshSources?.find(n=>n.id===e);if(!t)throw Error("\u6A21\u578B\u6765\u6E90\u5DF2\u4E0D\u5B58\u5728");return t}function Cn(r,e){return structuredClone(ks(r,e))}function Sa(r,e,t){return Qn.set(r,{objText:e,parsed:t}),Qn.size>8&&Qn.delete(Qn.keys().next().value),t}function ei(r,e){let t=ks(r,e),n=Qn.get(t.sourceKey);return n?.objText===t.objText?n.parsed:Sa(t.sourceKey,t.objText,es(t.objText))}function wa(r,e){return r.objects.filter(t=>Ft(t).some(n=>n.kind==="mesh"&&n.id===e))}function Fi(r,e,t){let n=r.design.meshSources||[];if(e==="meshes.remove"){let f=ks(r.design,t.id);if(wa(r.design,f.id).length)throw Error("\u6A21\u578B\u4ECD\u6709\u5173\u8054\u751F\u6210\u7ED3\u679C\uFF0C\u8BF7\u5148\u72EC\u7ACB\u5316\u6216\u79FB\u9664\u7ED3\u679C");return r.design.meshSources=n.filter(p=>p.id!==f.id),{id:f.id,removed:!0}}let i=t.source;if(!i||typeof i!="object")throw Error("\u9700\u8981\u6A21\u578B\u6765\u6E90 source");let s=i.id||crypto.randomUUID();if(typeof s!="string"||!s||s.length>128)throw Error("\u6A21\u578B\u6765\u6E90\u7F16\u53F7\u65E0\u6548");let o=n.find(f=>f.id===s),a=i.name??o?.name,c=i.objText??o?.objText;if(typeof a!="string"||!a.trim()||a.trim().length>128)throw Error("\u6A21\u578B\u540D\u79F0\u5E94\u4E3A 1\u2013128 \u5B57");if(i.hidden!==void 0&&typeof i.hidden!="boolean")throw Error("\u6A21\u578B\u663E\u793A\u72B6\u6001\u65E0\u6548");let l=St(i.transform,o?.transform),u=!o||c!==o.objText,h=u?es(c):ei(r.design,s),d={id:s,name:a.trim(),format:"obj",objText:c,revision:u?(o?.revision||0)+1:o.revision,sourceKey:u?crypto.randomUUID():o.sourceKey,bounds:structuredClone(h.bounds),triangleCount:h.triangles.length,warnings:[...h.warnings],topology:structuredClone(h.topology),transform:l,hidden:i.hidden??o?.hidden??!1};if(Sa(d.sourceKey,c,h),r.design.meshSources=o?n.map(f=>f.id===s?d:f):[...n,d],u&&o){let f=new Set(wa(r.design,s).map(p=>p.id));r.design.objects=r.design.objects.map(p=>f.has(p.id)?{...p,generation:{...p.generation,outdated:!0}}:p)}return zt({meshSources:[d]})[0]}var zi=r=>r>>>4&255|(r>>>16&255)<<8|Math.floor(r/268435456)<<16,it=class r{constructor(e){if(this.chunks=new Map,this.owned=new Set,this.count=0,e instanceof r)this.chunks=new Map(e.chunks),this.count=e.count,e.owned.clear();else if(e)for(let[t,n]of e)this.set(t,n)}get size(){return this.count}has(e){return this.chunks.get(zi(e))?.has(e)||!1}get(e){return this.chunks.get(zi(e))?.get(e)}writable(e){return this.owned.has(e)||(this.chunks.set(e,new Map(this.chunks.get(e)||[])),this.owned.add(e)),this.chunks.get(e)}set(e,t){let n=zi(e),i=this.writable(n);return i.has(e)||this.count++,i.set(e,t),this}delete(e){let t=zi(e);if(!this.chunks.get(t)?.has(e))return!1;let n=this.writable(t);return n.delete(e),this.count--,n.size||(this.chunks.delete(t),this.owned.delete(t)),!0}clear(){this.chunks.clear(),this.owned.clear(),this.count=0}*entries(){for(let e of this.chunks.values())yield*e}*keys(){for(let[e]of this.entries())yield e}*values(){for(let[,e]of this.entries())yield e}[Symbol.iterator](){return this.entries()}forEach(e,t){for(let[n,i]of this)e.call(t,i,n,this)}};var vd=r=>r[0]+4096*(r[2]+4096*r[1]),xd=r=>r>>>4&255|(r>>>16&255)<<8|Math.floor(r/268435456)<<16;function Os(r){let e=[],t=[],n=new WeakMap,i=new Map,s=c=>{let l=c.overlay instanceof it?c.overlay:new it(c.overlay),u=[];for(let[f,p]of l.chunks){let m=n.get(p);m===void 0&&(m=e.length,n.set(p,m),e.push({bucket:f,blocks:[...p.values()].map(g=>({...g,state:g.state<0?null:r.palette[g.state]}))})),u.push(m)}let h=JSON.stringify(c.design??r.design),d=i.get(h);return d===void 0&&(d=t.length,i.set(h,d),t.push(JSON.parse(h))),{chunks:u,size:[...c.size],design:d}},o=r.undo.map(s),a=r.redo.map(s);return{schema:"craftstudio-draft-history/1",chunks:e,designs:t,undo:o,redo:a}}function Ea(r,e){if(e===void 0)return;let t=()=>{throw Error("\u8349\u7A3F\u64A4\u9500\u5386\u53F2\u635F\u574F\uFF0C\u8BF7\u4ECE\u6B63\u5F0F\u5DE5\u7A0B\u7248\u672C\u6062\u590D")};(e?.schema!=="craftstudio-draft-history/1"||!["chunks","designs","undo","redo"].every(a=>Array.isArray(e[a])))&&t();let n=e.chunks.map(a=>{(!Number.isInteger(a.bucket)||a.bucket<0||a.bucket>16777215||!Array.isArray(a.blocks))&&t();let c=new Map;for(let l of a.blocks){(!Array.isArray(l.pos)||l.pos.length!==3||l.pos.some(h=>!Number.isInteger(h)||h<0||h>4095))&&t();let u=vd(l.pos);(xd(u)!==a.bucket||c.has(u))&&t(),l.state!==null&&(!l.state||!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(l.state.Name||"")||l.state.Properties!==void 0&&(!l.state.Properties||typeof l.state.Properties!="object"||Array.isArray(l.state.Properties)||Object.values(l.state.Properties).some(h=>typeof h!="string")))&&t(),c.set(u,{...structuredClone(l),state:l.state===null?-1:r.state(l.state)})}return{bucket:a.bucket,root:c}}),i=a=>a.map(c=>{(!Array.isArray(c.size)||c.size.length!==3||c.size.some(u=>!Number.isInteger(u)||u<1||u>4096)||!Array.isArray(c.chunks)||!Number.isInteger(c.design)||c.design<0||c.design>=e.designs.length||!e.designs[c.design]||Array.isArray(e.designs[c.design])||!Array.isArray(e.designs[c.design].objects))&&t();let l=new it;for(let u of c.chunks){(!Number.isInteger(u)||!n[u])&&t();let h=n[u];l.chunks.has(h.bucket)&&t(),l.chunks.set(h.bucket,h.root),l.count+=h.root.size}return{overlay:l,size:[...c.size],design:structuredClone(e.designs[c.design])}}),s=i(e.undo),o=i(e.redo);r.undo=s,r.redo=o}var X=(r,e)=>({t:r,v:e}),V=r=>r.Name+"["+Object.entries(r.Properties||{}).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>e+"="+t).join(",")+"]";function Ie(r){return r.t===10?Object.fromEntries(Object.entries(r.v).map(([e,t])=>[e,Ie(t)])):r.t===9?r.v[1].map(e=>Ie(X(r.v[0],e))):r.v}function _d(r){let e=[];for(let t=0;t<r.length;t++){let n=r.charCodeAt(t);n&&n<128?e.push(n):n<2048?e.push(192|n>>6,128|n&63):e.push(224|n>>12,128|n>>6&63,128|n&63)}return Uint8Array.from(e)}function bd(r){let e="";for(let t=0;t<r.length;){let n=r[t++];if(n<128)e+=String.fromCharCode(n);else if((n&224)===192)e+=String.fromCharCode((n&31)<<6|r[t++]&63);else if((n&240)===224)e+=String.fromCharCode((n&15)<<12|(r[t++]&63)<<6|r[t++]&63);else if((n&248)===240){let i=(n&7)<<18|(r[t++]&63)<<12|(r[t++]&63)<<6|r[t++]&63;e+=String.fromCodePoint(i)}else throw Error("\u65E0\u6548 NBT \u5B57\u7B26\u7F16\u7801")}return e}function Ta(r){let e=r instanceof Uint8Array?r:new Uint8Array(r);e[0]===31&&e[1]===139&&(e=Ze(e));let t=new DataView(e.buffer,e.byteOffset,e.byteLength),n=0;function i(l){if(n+l>e.length)throw Error("NBT \u6587\u4EF6\u622A\u65AD");let u=e.subarray(n,n+l);return n+=l,u}function s(l){let u={1:["getInt8",1],2:["getInt16",2],3:["getInt32",4],4:["getBigInt64",8],5:["getFloat32",4],6:["getFloat64",8]},[h,d]=u[l];if(n+d>e.length)throw Error("NBT \u6587\u4EF6\u622A\u65AD");let f=t[h](n,!1);return n+=d,l===4?f.toString():f}function o(){if(n+2>e.length)throw Error("NBT \u5B57\u7B26\u4E32\u622A\u65AD");let l=t.getUint16(n,!1);return n+=2,bd(i(l))}function a(l,u=0){if(u>512)throw Error("NBT \u5D4C\u5957\u8FC7\u6DF1");if(l>=1&&l<=6)return s(l);if(l===8)return o();if(l===10){let h={};for(;;){let d=i(1)[0];if(d===0)return h;let f=o();Object.defineProperty(h,f,{value:X(d,a(d,u+1)),enumerable:!0,configurable:!0,writable:!0})}}if(l===9){let h=i(1)[0],d=s(3);if(d<0||d>e.length||h===0&&d)throw Error("\u65E0\u6548 NBT \u5217\u8868");let f=[];for(let p=0;p<d;p++)f.push(a(h,u+1));return[h,f]}if([7,11,12].includes(l)){let h=s(3);if(h<0||h>e.length)throw Error("\u65E0\u6548 NBT \u6570\u7EC4");return l===7?Array.from(i(h)):Array.from({length:h},()=>s(l===11?3:4))}throw Error("\u4E0D\u652F\u6301\u7684 NBT \u7C7B\u578B "+l)}let c=i(1)[0];if(o(),c!==10)throw Error("NBT \u6839\u8282\u70B9\u5FC5\u987B\u4E3A Compound");return X(c,a(c))}function zs(r,e=!0){let t=new Uint8Array(65536),n=0,i=new DataView(t.buffer),s=new Map;function o(d){if(n+d>t.length){let f=new Uint8Array(Math.max(t.length*2,n+d));f.set(t),t=f,i=new DataView(t.buffer)}}function a(d){o(d.length),t.set(d,n),n+=d.length}function c(d,f){let p={1:["setInt8",1],2:["setInt16",2],3:["setInt32",4],4:["setBigInt64",8],5:["setFloat32",4],6:["setFloat64",8]},[m,g]=p[d];o(g),i[m](n,d===4?BigInt(f):f,!1),n+=g}function l(d){let f=s.get(d);if(!f){if(f=_d(d),f.length>65535)throw Error("NBT \u5B57\u7B26\u4E32\u8FC7\u957F");s.size<1e4&&s.set(d,f)}o(2),i.setUint16(n,f.length,!1),n+=2,a(f)}function u(d){let f=d.v;if(d.t>=1&&d.t<=6){c(d.t,f);return}if(d.t===8){l(f);return}if(d.t===10){for(let[p,m]of Object.entries(f))a(Uint8Array.of(m.t)),l(p),u(m);a(Uint8Array.of(0));return}if(d.t===9){a(Uint8Array.of(f[0])),c(3,f[1].length);for(let p of f[1])u(X(f[0],p));return}if([7,11,12].includes(d.t)){if(c(3,f.length),d.t===7)a(Uint8Array.from(f));else for(let p of f)c(d.t===11?3:4,p);return}throw Error("\u65E0\u6548 NBT \u7C7B\u578B")}a(Uint8Array.of(r.t)),l(""),u(r);let h=t.slice(0,n);return e?vt(h,{mtime:0}):h}var ti=new Set(["minecraft:air","minecraft:cave_air","minecraft:void_air"]);function Aa(r){r.sort((t,n)=>t-n);let e=[];for(let t of r){let n=e.at(-1);n&&n[0]+n[1]===t?n[1]++:e.push([t,1])}return e}function Bs(r,e="eraseRuns"){let[t,,n]=r.size;return(r[e]||[]).flatMap(([i,s])=>Array.from({length:s},(o,a)=>{let c=i+a;return[c%t,Math.floor(c/(t*n)),Math.floor(c/t)%n]}))}function Oe(r="\u65B0\u573A\u5730"){return{schema:1,name:r,size:[1,1,1],origin:[0,0,0],dataVersion:3955,palette:[],blocks:[],entities:[],metadata:{},warnings:[]}}function Fs(r){return Ie(X(10,r))}function Ca(r,e,t,n=!1){let i=r.map(c=>BigInt.asUintN(64,BigInt(c))),s=(1n<<BigInt(e))-1n,o=Math.floor(64/e);if(!i.length)return new Uint32Array(t);let a=new Uint32Array(t);for(let c=0;c<t;c++){let l=c*e,u=Math.floor(n?c/o:l/64),h=n?c%o*e:l%64;if(u>=i.length)throw Error("\u65B9\u5757\u4F4D\u6570\u7EC4\u622A\u65AD");let d=i[u]>>BigInt(h);!n&&h+e>64&&(d|=i[u+1]<<BigInt(64-h)),a[c]=Number(d&s)}return a}function ni(r,e){let t=Ta(r),n=t.v,i=Oe(e);if(n.blocks&&(n.palette||n.palettes)){i.size=Ie(n.size),i.dataVersion=n.DataVersion?.v||0;let o=n.palette||X(9,n.palettes.v[1][0]);i.palette=o.v[1].map(Fs);let a=[],c=[],[l,,u]=i.size;for(let h of n.blocks.v[1]){let d=h.state.v;if(!i.palette[d])throw Error("\u65B9\u5757\u8C03\u8272\u677F\u7D22\u5F15\u8D8A\u754C");let f=Ie(h.pos),p=f[0]+l*(f[2]+u*f[1]);if(i.palette[d].Name==="minecraft:structure_void"){a.push(p);continue}if(ti.has(i.palette[d].Name)){c.push(p);continue}let m={pos:Ie(h.pos),state:d};h.nbt&&(m.nbt=h.nbt),i.blocks.push(m)}return i.entities=(n.entities?.v[1]||[]).map(h=>X(10,h)),i.metadata.nativeExtra=Object.fromEntries(Object.entries(n).filter(([h])=>!["blocks","palette","size","entities","DataVersion"].includes(h))),i.metadata.sourceFormat="structure",(a.length||c.length)&&(i.metadata.placementMask={schema:"craftstudio-placement-mask/1",size:[...i.size],skipCount:a.length,eraseCount:c.length,skipRuns:Aa(a),eraseRuns:Aa(c)}),n.palettes&&i.warnings.push("\u591A\u8C03\u8272\u677F\u7ED3\u6784\u4F7F\u7528\u7B2C\u4E00\u7EC4\uFF1B\u5BFC\u51FA\u4F1A\u91C7\u7528\u8FD9\u4E00\u7EC4\u3002"),i}if(n.Regions){let o=new Map;i.dataVersion=n.MinecraftDataVersion?.v||0;for(let a of Object.values(n.Regions.v)){let c=a.v,l=c.BlockStatePalette.v[1].map(Fs),u=Ie(c.Size),h=Ie(c.Position),d=["x","y","z"].map(y=>u[y]),f=d.map(Math.abs),p=["x","y","z"].map((y,b)=>h[y]+Math.min(0,d[b]+1)),m=Ca(c.BlockStates.v,Math.max(2,Math.ceil(Math.log2(l.length))),f[0]*f[1]*f[2]),g=new Map((c.TileEntities?.v[1]||[]).map(y=>{let b=Ie(X(10,y));return[[b.x,b.y,b.z].join(","),X(10,y)]}));for(let y=0;y<m.length;y++){let b=l[m[y]];if(!b)throw Error("Litematica \u8C03\u8272\u677F\u7D22\u5F15\u8D8A\u754C");if(ti.has(b.Name))continue;let _=V(b);o.has(_)||(o.set(_,i.palette.length),i.palette.push(b));let v=[y%f[0],Math.floor(y/(f[0]*f[2])),Math.floor(y/f[0])%f[2]],M={pos:v.map((x,E)=>x+p[E]),state:o.get(_)};g.has(v.join(","))&&(M.nbt=g.get(v.join(","))),i.blocks.push(M)}}return Md(i),i.metadata.sourceFormat="litematic",i.warnings.push("Litematica\uFF1A\u4FDD\u7559\u65B9\u5757\u53CA\u65B9\u5757\u5B9E\u4F53\uFF1B\u5B9E\u4F53\u3001\u8BA1\u5212\u523B\u548C\u591A\u533A\u57DF\u4FE1\u606F\u6CA1\u6709\u8F6C\u6362\u6210\u539F\u7248 NBT\u3002"),i}n.Schematic&&(t=n.Schematic,n=t.v);let s=n.Blocks?.v||n;if(s.Palette&&(s.Data||s.BlockData)){let o=Ie(s.Palette);i.size=[n.Width.v,n.Height.v,n.Length.v],i.dataVersion=n.DataVersion?.v||0,i.palette=Array.from({length:Math.max(...Object.values(o))+1},()=>({Name:"minecraft:air"}));for(let[p,m]of Object.entries(o)){let g=p.match(/^([^[]+)(?:\[(.*)\])?$/);i.palette[m]={Name:g[1]},g[2]&&(i.palette[m].Properties=Object.fromEntries(g[2].split(",").map(y=>y.split("="))))}let a=[],c=0,l=0;for(let p of(s.Data||s.BlockData).v)if(p&=255,c|=(p&127)<<l,p&128){if(l+=7,l>28)throw Error("\u65E0\u6548 Sponge VarInt")}else a.push(c>>>0),c=l=0;let[u,h,d]=i.size;if(a.length!==u*h*d)throw Error("Sponge \u65B9\u5757\u6570\u91CF\u4E0E\u5C3A\u5BF8\u4E0D\u7B26");let f=new Map;for(let p of s.BlockEntities?.v[1]||[]){let m=Ie(p.Pos),g=p.Data||X(10,Object.fromEntries(Object.entries(p).filter(([y])=>!["Pos","Id"].includes(y))));g.v.id=X(8,p.Id?.v||""),f.set(m.join(","),g)}for(let p=0;p<a.length;p++){let m=a[p];if(!i.palette[m])throw Error("Sponge \u8C03\u8272\u677F\u7D22\u5F15\u8D8A\u754C");if(ti.has(i.palette[m].Name))continue;let g=[p%u,Math.floor(p/(u*d)),Math.floor(p/u)%d],y={pos:g,state:m};f.has(g.join(","))&&(y.nbt=f.get(g.join(","))),i.blocks.push(y)}return i.metadata.sourceFormat="schem",i.warnings.push("Sponge\uFF1A\u4FDD\u7559\u65B9\u5757\u53CA\u65B9\u5757\u5B9E\u4F53\uFF1B\u5B9E\u4F53\u548C\u751F\u7269\u7FA4\u7CFB\u672A\u8F6C\u6362\u3002"),i}throw Error("\u6CA1\u6709\u8BC6\u522B\u5230\u7ED3\u6784\uFF1B\u652F\u6301 Create/\u539F\u7248 NBT\u3001Sponge schem \u548C Litematica\u3002")}function Md(r){if(!r.blocks.length)return;let e=[0,1,2].map(n=>Math.min(...r.blocks.slice(0,1).map(i=>i.pos[n]))),t=[...e];for(let n of r.blocks)for(let i=0;i<3;i++)e[i]=Math.min(e[i],n.pos[i]),t[i]=Math.max(t[i],n.pos[i]);for(let n of r.blocks)n.pos=n.pos.map((i,s)=>i-e[s]);r.size=t.map((n,i)=>n-e[i]+1),r.origin=e}function Vs(r,e=r.blocks,t=r.size){let n=[...r.palette],i=r.metadata?.placementMask;if(i&&i.size.every((c,l)=>c===t[l])&&e===r.blocks){let c=new Set(e.map(u=>u.pos.join(","))),l=[];for(let[u,h]of[["skipRuns","minecraft:structure_void"],["eraseRuns","minecraft:air"]]){let d=n.findIndex(f=>f.Name===h);d<0&&(d=n.length,n.push({Name:h}));for(let f of Bs(i,u))c.has(f.join(","))||l.push({pos:f,state:d})}e=[...e,...l]}let s=n.map(c=>{let l={Name:X(8,c.Name)};return c.Properties&&(l.Properties=X(10,Object.fromEntries(Object.entries(c.Properties).map(([u,h])=>[u,X(8,String(h))])))),l}),o=e.map(c=>{let l={pos:X(9,[3,c.pos]),state:X(3,c.state)};return c.nbt&&(l.nbt=c.nbt),l}),a={...r.metadata?.nativeExtra};return delete a.palettes,zs(X(10,{...a,DataVersion:X(3,r.dataVersion),size:X(9,[3,t]),palette:X(9,[10,s]),blocks:X(9,[10,o]),entities:X(9,[10,(r.entities||[]).map(c=>c.v)])}))}function Bi(r){let e=typeof r=="string"&&r.match(/r\.(-?\d+)\.(-?\d+)\.mca$/i);if(!e)throw Error("MCA \u6587\u4EF6\u540D\u9700\u8981 r.X.Z.mca");let t=[+e[1],+e[2]];if(t.some(n=>!Number.isSafeInteger(n)))throw Error("MCA \u6587\u4EF6\u5750\u6807\u65E0\u6548");return t}function Vi(r,e,t,n){if(r.length<8192)throw Error("MCA \u6587\u4EF6\u5934\u622A\u65AD");let[i,s]=Bi(e),o=new DataView(r.buffer,r.byteOffset,r.byteLength),a=Oe(e),c=new Map;if(t.some((h,d)=>h>n[d]))throw Error("\u533A\u57DF\u8D77\u70B9\u4E0D\u80FD\u5927\u4E8E\u7EC8\u70B9");if(t[0]<i*512||n[0]>=i*512+512||t[2]<s*512||n[2]>=s*512+512)throw Error("\u9009\u62E9\u7684\u5750\u6807\u8D85\u51FA\u8FD9\u4E2A MCA \u6587\u4EF6\uFF1B\u4E00\u6B21\u53EA\u8BFB\u53D6\u5F53\u524D\u6587\u4EF6\u4E2D\u7684\u9009\u533A");a.size=n.map((h,d)=>h-t[d]+1),a.origin=t,a.metadata.originConfirmed=!0,a.metadata.missingChunks=0;let l=new Set,u=new Set;for(let h=Math.floor(t[2]/16);h<=Math.floor(n[2]/16);h++)for(let d=Math.floor(t[0]/16);d<=Math.floor(n[0]/16);d++){let f=o.getUint32(((d&31)+(h&31)*32)*4,!1),p=(f>>>8)*4096;if(!p){a.metadata.missingChunks++;continue}if(p+5>r.length)throw Error("MCA \u533A\u5757\u8BB0\u5F55\u622A\u65AD");let m=o.getUint32(p,!1),g=r[p+4];if(m<1||p+4+m>r.length||m+4>(f&255)*4096)throw Error("MCA \u533A\u5757\u957F\u5EA6\u6216\u8BB0\u5F55\u622A\u65AD");if(g&128)throw Error("\u8BE5\u533A\u5757\u4F7F\u7528\u5916\u7F6E MCC\uFF0C\u8BF7\u6539\u7528\u542B\u5730\u5F62\u7684\u533A\u57DF NBT");let y=r.subarray(p+5,p+4+m);if(g===2)y=Do(y);else if(g!==1&&g!==3)throw Error("\u5C1A\u672A\u652F\u6301\u8BE5\u533A\u5757\u538B\u7F29\u683C\u5F0F");let b=Ta(y).v,_=b.Level?.v||b;if(a.dataVersion=b.DataVersion?.v||0,l.add(a.dataVersion),_.xPos&&_.xPos.v!==d||_.zPos&&_.zPos.v!==h)throw Error("MCA \u533A\u5757\u5750\u6807\u4E0E\u6587\u4EF6\u540D\u4E0D\u4E00\u81F4");let v=new Map((_.block_entities||_.TileEntities)?.v[1]?.map(M=>{let x=Ie(X(10,M));return[[x.x,x.y,x.z].join(","),X(10,M)]})||[]);for(let M of(_.sections||_.Sections)?.v[1]||[]){let x=M.Y.v*16;if(x+15<t[1])continue;let E=M.block_states?.v,w=E?.palette||M.Palette;if(!w){if(M.Blocks)throw Error("\u8BE5\u533A\u57DF\u4F7F\u7528 1.12 \u6216\u66F4\u65E9\u7684\u6570\u503C\u65B9\u5757 ID\uFF0C\u8BF7\u5148\u5728 Minecraft \u4E2D\u5347\u7EA7\u526F\u672C\u518D\u5BFC\u5165");continue}let S=w.v[1].map(Fs),T=E?.data||M.BlockStates,C=Math.max(4,Math.ceil(Math.log2(S.length))),P=a.dataVersion>=2529,A=Math.ceil(P?4096/Math.floor(64/C):4096*C/64);if(!S.length||S.length>1&&(!T||T.v.length!==A))throw Error("MCA \u65B9\u5757\u72B6\u6001\u6570\u7EC4\u6216\u8C03\u8272\u677F\u4E0D\u5B8C\u6574");if(S.length===1&&ti.has(S[0].Name))continue;let I=S.length===1?new Uint16Array(4096):Ca(T?.v||[],Math.max(4,Math.ceil(Math.log2(S.length))),4096,a.dataVersion>=2529);for(let N=0;N<4096;N++){let D=[d*16+N%16,x+Math.floor(N/256),h*16+Math.floor(N/16)%16];if(D[0]<t[0]||D[0]>n[0]||D[2]<t[2]||D[2]>n[2]||D[1]<t[1])continue;let U=S[I[N]];if(!U)throw Error("MCA \u65B9\u5757\u72B6\u6001\u8C03\u8272\u677F\u7D22\u5F15\u65E0\u6548");if(ti.has(U.Name))continue;if(D[1]>n[1]){u.add(D[0]-t[0]+4096*(D[2]-t[2]));continue}let F=V(U);c.has(F)||(c.set(F,a.palette.length),a.palette.push(U));let z={pos:D.map((G,W)=>G-t[W]),state:c.get(F)};v.has(D.join(","))&&(z.nbt=v.get(D.join(","))),a.blocks.push(z)}}}return a.metadata.sourceFormat="mca",a.metadata.dataVersions=[...l].sort((h,d)=>h-d),a.metadata.clippedSurfaceColumns=[...u],u.size&&a.warnings.push(u.size+" \u5217\u4E0A\u65B9\u4ECD\u6709\u65B9\u5757\uFF1B\u5730\u8868\u4E0A\u4E0B\u6587\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u63D0\u9AD8\u4E16\u754C\u7EC8\u70B9 Y \u540E\u7528\u4E8E\u81EA\u52A8\u8D34\u5730\u8BBE\u8BA1\u3002"),a.dataVersion=l.size===1?a.metadata.dataVersions[0]:0,a.metadata.missingChunks&&a.warnings.push(a.metadata.missingChunks+" \u4E2A\u533A\u5757\u7F3A\u5931\u6216\u5C1A\u672A\u751F\u6210\uFF0C\u672A\u8865\u9020\u5730\u5F62\u3002"),l.size>1&&a.warnings.push("\u9009\u533A\u542B\u591A\u4E2A DataVersion\uFF0C\u6574\u4F53\u7248\u672C\u8BB0\u4E3A\u672A\u77E5\uFF1B\u4FDD\u7559\u539F\u72B6\u6001\u4E0E NBT\uFF0C\u4E0D\u81EA\u52A8\u5347\u7EA7\u3002"),a.warnings.push("MCA\uFF1A\u53EA\u8BFB\u5F53\u524D\u6587\u4EF6\u7684\u6240\u9009\u533A\u57DF\uFF1B\u4FDD\u7559\u65B9\u5757\u53CA\u65B9\u5757\u5B9E\u4F53\uFF0C\u4E0D\u8F6C\u6362\u5B9E\u4F53\u3001\u5149\u7167\u548C\u8BA1\u5212\u523B\u3002"),a}function De(r){return/:(water|lava)$/.test(r)?"water":/:(stone|andesite|diorite|granite|dirt|coarse_dirt|rooted_dirt|grass_block|gravel|sand|red_sand|clay|deepslate|tuff|calcite|mud|moss_block|snow_block|bedrock|netherrack|end_stone)$/.test(r)||/_ore$/.test(r)?"ground":/leaves|sapling|short_grass|tall_grass|pink_petals|flower|fern|vine/.test(r)?"plant":"building"}function wd(r){if(r.schema!==1||!Array.isArray(r.palette)||!Array.isArray(r.blocks)||r.size?.length!==3||r.size.some(t=>!Number.isInteger(t)||t<1||t>4096))throw Error("\u5DE5\u7A0B\u7ED3\u6784\u6216\u5C3A\u5BF8\u65E0\u6548");let e=new Set;for(let t of r.palette)if(typeof t.Name!="string"||!t.Name.includes(":"))throw Error("\u9700\u8981 namespace:\u65B9\u5757ID");for(let t of r.blocks){if(t.pos.length!==3||t.pos.some((i,s)=>!Number.isInteger(i)||i<0||i>=r.size[s])||!r.palette[t.state])throw Error("\u65B9\u5757\u5750\u6807\u6216\u8C03\u8272\u677F\u65E0\u6548");let n=L(...t.pos);if(e.has(n))throw Error("\u5DE5\u7A0B\u5305\u542B\u91CD\u590D\u4F4D\u7F6E");e.add(n)}return r}var Le=class r{constructor(e=Oe()){this.base=wd(e),this.palette=e.palette.map(t=>structuredClone(t)),this.states=new Map(this.palette.map((t,n)=>[V(t),n])),this.cells=new it,this.overlay=new it,this.size=[...e.size],this.origin=[...e.origin],this.originConfirmed=!!e.metadata?.originConfirmed,this.protected=[],this.title=e.name,this.sourceHash=e.metadata?.sourceHash||"",this.undo=[],this.redo=[],this.columns=null,this.clippedSurfaceColumns=new Set(e.metadata?.clippedSurfaceColumns||[]),this.baseChunks=new Map,this.overlayChunks=new Map,this.ownedOverlayChunks=new Set,this.summaryCounts={add:0,remove:0,replace:0,earth:0,water:0,materials:{}},this.changedPositions=[],this.blockEntityCount=0,this.design=structuredClone(e.metadata?.design||{objects:[],prefabs:[],animations:{},cameras:[],lighting:"day"}),this.stroke=!1,this.strokeRecorded=!1,this.lastSkipped=0;for(let t of e.blocks)this.cells.set(L(...t.pos),t),t.nbt&&this.blockEntityCount++;for(let[t,n]of this.cells.chunks)this.baseChunks.set([t&255,t>>>16,t>>>8&255].join(","),n)}beginStroke(){this.stroke=!0,this.strokeRecorded=!1}fork(){let e=Object.create(r.prototype);return Object.assign(e,this),e.palette=[...this.palette],e.states=new Map(this.states),e.overlay=new it(this.overlay),e.overlayChunks=new Map(this.overlayChunks),this.ownedOverlayChunks.clear(),e.ownedOverlayChunks=new Set,e.summaryCounts={...this.summaryCounts,materials:{...this.summaryCounts.materials}},e.size=[...this.size],e.origin=[...this.origin],e.protected=structuredClone(this.protected),e.design=structuredClone(this.design),e.changedPositions=[],e.undo=[],e.redo=[],e.stroke=!1,e.strokeRecorded=!1,e}endStroke(){this.stroke=!1,this.strokeRecorded=!1}track(e,t,n=null){this.changedPositions=[];for(let i of n||new Set([...e.keys(),...t.keys()])){let s=e.get(i),o=t.get(i);if(s?.state===o?.state&&JSON.stringify(s?.nbt||null)===JSON.stringify(o?.nbt||null))continue;let a=o?.pos||s?.pos;if(!a)continue;this.countOverlay(i,s,-1),this.countOverlay(i,o,1),this.changedPositions.push(a);let c=Pt(a);this.ownedOverlayChunks.has(c)||(this.overlayChunks.set(c,new Map(this.overlayChunks.get(c)||[])),this.ownedOverlayChunks.add(c)),o?this.overlayChunks.get(c).set(i,o):(this.overlayChunks.get(c)?.delete(i),this.overlayChunks.get(c)?.size||(this.overlayChunks.delete(c),this.ownedOverlayChunks.delete(c)))}}state(e){let t=V(e);return this.states.has(t)||(this.states.set(t,this.palette.length),this.palette.push(structuredClone(e))),this.states.get(t)}at(e,t=!1){let n=L(...e);if(!t&&this.overlay.has(n)){let i=this.overlay.get(n);return i.state<0?null:i}return this.cells.get(n)||null}allowed(e,t){let n=this.at(e,!0);if(this.protected.some(s=>e.every((o,a)=>o>=s.min[a]&&o<=s.max[a])))throw Error("\u8FD9\u4E2A\u4F4D\u7F6E\u5C5E\u4E8E\u4F60\u9501\u5B9A\u7684\u4FDD\u7559\u533A\uFF1A"+e.join(", "));if(!n)return;let i=De(this.palette[n.state].Name);if((i==="ground"||i==="water")&&!t.allowTerrain)throw Error("\u539F\u5730\u5F62/\u6CB3\u6C34\u4FDD\u6301\u9501\u5B9A\uFF1B\u8BF7\u8C03\u6574\u5EFA\u7B51\u6807\u9AD8\uFF0C\u6216\u660E\u786E\u5F00\u542F\u571F\u65B9\u6539\u52A8\u3002\u4F4D\u7F6E "+e.join(", "));if((i==="building"||i==="plant")&&!t.allowExisting)throw Error("\u539F\u6709\u5EFA\u7B51/\u690D\u88AB\u4FDD\u6301\u9501\u5B9A\uFF1B\u53EF\u53E6\u9009\u7A7A\u5730\uFF0C\u6216\u660E\u786E\u5F00\u542F\u65E2\u6709\u5EFA\u7B51\u6539\u52A8\u3002\u4F4D\u7F6E "+e.join(", "))}operations(e,t={allowTerrain:!1,allowExisting:!1}){let n=this.palette,i=this.states;this.palette=[...this.palette],this.states=new Map(this.states);let s=new it(this.overlay),o=new Map,a=new $t(this.design);this.lastSkipped=0;let c=(l,u,h="\u624B\u5DE5\u7F16\u8F91",d=void 0)=>{if(l.some(v=>!Number.isInteger(v)||v<0||v>=4096))throw Error("\u5DE5\u7A0B\u5C40\u90E8\u5750\u6807\u9700\u4E3A 0\u20134095 \u7684\u6574\u6570");if(u?.Name==="minecraft:structure_void")return;let f=L(...l),p=s.has(f)?s.get(f):this.cells.get(f),m=p?.state>=0?p:null,g=u?.Name&&u.Name!=="minecraft:air"?this.state(u):-1,y=this.at(l,!0);if((m?.state??-1)===g&&(d===void 0||JSON.stringify(m?.nbt||null)===JSON.stringify(d)))return;try{let v=a.at(l);if(v)throw Error("\u5BF9\u8C61\u6216\u96C6\u5408\u5DF2\u9501\u5B9A\uFF1A"+v.name);this.allowed(l,t)}catch(v){if(!t.skipLocked)throw v;this.lastSkipped++;return}let b=d===void 0&&g===y?.state?y.nbt:d,_={pos:[...l],state:g,reason:h,...b?{nbt:structuredClone(b)}:{}};g===(y?.state??-1)&&JSON.stringify(b||null)===JSON.stringify(y?.nbt||null)?s.delete(f):s.set(f,_),o.set(f,_)};try{for(let l of e){if(l.type==="replace"){if(!l.state||!l.from)throw Error("\u66FF\u6362\u64CD\u4F5C\u7F3A\u5C11\u6750\u6599");let f=new Map(this.cells);for(let[p,m]of s)m.state<0?f.delete(p):f.set(p,m);for(let p of f.values())this.palette[p.state].Name===l.from&&c(p.pos,l.state,l.reason,l.nbt);continue}if(!["set","fill","erase"].includes(l.type))throw Error("\u4E0D\u652F\u6301\u64CD\u4F5C "+l.type);let u=l.type==="set"?l.pos:l.min,h=l.type==="set"?l.pos:l.max;if(u?.length!==3||h?.length!==3||u.some((f,p)=>!Number.isInteger(f)||!Number.isInteger(h[p])||f>h[p]))throw Error("\u65E0\u6548\u64CD\u4F5C\u9009\u533A");if(h.reduce((f,p,m)=>f*(p-u[m]+1),1)>1e6)throw Error("\u8BF7\u628A\u8FD9\u6B21\u64CD\u4F5C\u62C6\u6210\u51E0\u4E2A\u8F83\u5C0F\u9009\u533A");for(let f=u[1];f<=h[1];f++)for(let p=u[2];p<=h[2];p++)for(let m=u[0];m<=h[0];m++)c([m,f,p],l.type==="erase"?null:l.state,l.reason,l.nbt)}}catch(l){throw this.palette=n,this.states=i,l}this.track(this.overlay,s,o.keys()),this.changedPositions.length&&((!this.stroke||!this.strokeRecorded)&&(this.undo.push({overlay:this.overlay,size:[...this.size],design:structuredClone(this.design)}),this.undo.length>30&&this.undo.shift(),this.strokeRecorded=!0),this.redo=[]),this.overlay=s;for(let l of o.values())this.size=this.size.map((u,h)=>Math.max(u,l.pos[h]+1));return this.summary()}restore(e){this.endStroke();let t=e==="undo"?this.undo:this.redo,n=e==="undo"?this.redo:this.undo;if(!t.length){this.changedPositions=[];return}n.push({overlay:this.overlay,size:[...this.size],design:structuredClone(this.design)});let i=t.pop();this.track(this.overlay,i.overlay),this.overlay=i.overlay,this.size=i.size,i.design&&(this.design=structuredClone(i.design))}diff(){let e=[];for(let[t,n]of this.overlay){let i=this.cells.get(t),s=i?this.palette[i.state]:null,o=n.state<0?null:this.palette[n.state];e.push({pos:n.pos,before:s,after:o,action:i?n.state<0?"remove":"replace":"add",category:s?De(s.Name):"air",reason:n.reason||"\u7F16\u8F91"})}return e.sort((t,n)=>t.pos[1]-n.pos[1]||t.pos[2]-n.pos[2]||t.pos[0]-n.pos[0])}countOverlay(e,t,n){if(!t)return;let i=this.summaryCounts,s=this.cells.get(e);if(i[s?t.state<0?"remove":"replace":"add"]+=n,s){let o=De(this.palette[s.state].Name);o==="ground"&&(i.earth+=n),o==="water"&&(i.water+=n)}if(t.state>=0){let o=this.palette[t.state].Name;i.materials[o]=(i.materials[o]||0)+n,i.materials[o]||delete i.materials[o]}}summary(){let{add:e,remove:t,replace:n,earth:i,water:s}=this.summaryCounts,o={...this.summaryCounts.materials};return{sourceBlocks:this.cells.size,changes:this.overlay.size,add:e,remove:t,replace:n,earth:i,water:s,size:this.size,sourceSize:this.base.size,origin:this.origin,originConfirmed:this.originConfirmed,palette:this.palette,entities:(this.base.entities||[]).length,blockEntities:this.blockEntityCount,materials:o,design:this.design.meshSources?{...this.design,meshSources:zt(this.design)}:this.design,protected:this.protected,undo:this.undo.length,redo:this.redo.length,skipped:this.lastSkipped,name:this.title,warnings:this.base.warnings||[]}}project(){let e=new Map(this.cells);for(let[t,n]of this.overlay)n.state<0?e.delete(t):e.set(t,{pos:n.pos,state:n.state,...n.nbt?{nbt:n.nbt}:{}});return{...this.baseline?.header||this.base,name:this.title,size:this.size,palette:this.palette,blocks:[...e.values()],origin:this.origin,metadata:{...this.base.metadata,originConfirmed:this.originConfirmed,protected:this.protected,design:this.design}}}packHeader(){return{title:this.title,origin:this.origin,originConfirmed:this.originConfirmed,protected:this.protected,palette:this.palette,sourceHash:this.sourceHash,design:structuredClone(this.design)}}pack(){return{base:this.base,...this.packHeader(),overlay:[...this.overlay.values()].map(e=>({...e,state:e.state<0?null:this.palette[e.state]}))}}static unpack(e){let t=new r(e.base);for(let n of e.palette||[])t.state(n);t.title=e.title||e.base.name,t.origin=e.origin||e.base.origin,t.originConfirmed=!!e.originConfirmed,t.protected=e.protected||[],t.sourceHash=e.sourceHash||"",t.design=structuredClone(e.design||t.design);for(let n of e.overlay||[]){let i={...n,state:n.state?t.state(n.state):-1};t.overlay.set(L(...i.pos),i),t.size=t.size.map((s,o)=>Math.max(s,i.pos[o]+1))}return t.track(new Map,t.overlay),Ea(t,e.history),t}inspect(e){let t=this.at(e,!0),n=this.at(e);return{pos:e,world:this.originConfirmed?e.map((i,s)=>i+this.origin[s]):null,before:t?this.palette[t.state]:null,after:n?this.palette[n.state]:null,nbt:t?.nbt||null,reason:this.overlay.get(L(...e))?.reason||"\u539F\u6709\u4FDD\u7559",column:this.column(e[0],e[2])}}column(e,t){if(this.clippedSurfaceColumns.has(e+4096*t))return{ground:null,water:null,top:null,clipped:!0};if(this.baseline)return this.baseline.column(e,t,this.palette);if(!this.columns){this.columns=new Map;for(let n of this.base.blocks){let i=De(this.palette[n.state].Name),s=n.pos[0]+4096*n.pos[2],o=this.columns.get(s)||{ground:null,water:null,top:null};o.top=Math.max(o.top??-1,n.pos[1]),i==="ground"&&(o.ground=Math.max(o.ground??-1,n.pos[1])),i==="water"&&(o.water=Math.max(o.water??-1,n.pos[1])),this.columns.set(s,o)}}return this.columns.get(e+4096*t)||{ground:null,water:null,top:null}}heightmap(e=null,t=1600){let[n,,i]=this.base.size,s=e?[Math.max(0,e[0]-16),Math.max(0,e[2]-16)]:[0,0],o=e?[Math.min(n-1,e[0]+16),Math.min(i-1,e[2]+16)]:[n-1,i-1],a=e?1:Math.max(1,Math.ceil(Math.sqrt(n*i/t))),c=[];for(let l=s[1];l<=o[1];l+=a)for(let u=s[0];u<=o[0];u+=a){let h=this.column(u,l);c.push([u,l,h.ground,h.water,h.top])}return{columns:["local_x","local_z","original_ground_y","original_water_y","original_occupied_top_y"],min:s,max:o,stride:a,rows:c,classification:"\u5730\u9762\u6309\u65B9\u5757\u79CD\u7C7B\u8BC6\u522B\uFF1B\u6700\u9AD8\u5360\u7528\u9AD8\u5EA6\u5305\u542B\u539F\u5EFA\u7B51\u548C\u690D\u7269\uFF1B\u672A\u8BFB\u53D6\u6216\u4E0A\u4E0B\u6587\u622A\u65AD\u7684\u5217\u4FDD\u6301 null"}}platform(e,t,n,i,s=4){if(e.length!==2||t.length!==2||[...e,...t,n,s].some(c=>!Number.isInteger(c))||n<1||s<1||e.some((c,l)=>c<0||c>t[l]))throw Error("\u5E73\u53F0\u5750\u6807\u3001\u6807\u9AD8\u548C\u67F1\u8DDD\u5FC5\u987B\u4E3A\u6709\u6548\u6574\u6570");if((t[0]-e[0]+1)*(t[1]-e[1]+1)>4e4)throw Error("\u5E73\u53F0\u8303\u56F4\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A\u8BBE\u8BA1");let o=[{type:"fill",min:[e[0],n,e[1]],max:[t[0],n,t[1]],state:i,reason:"\u6CBF\u771F\u5B9E\u573A\u5730\u5E03\u7F6E\u5E73\u53F0"}],a=0;for(let c=e[0];c<=t[0];c++)for(let l=e[1];l<=t[1];l++){let u=this.column(c,l);if(u.ground===null)throw Error("\u9009\u533A\u5185\u7F3A\u5C11\u5730\u9762\u6570\u636E\uFF0C\u8BF7\u5BFC\u5165\u66F4\u5B8C\u6574\u7684\u573A\u5730\uFF1B\u4F4D\u7F6E "+c+", "+l);if(u.ground>=n)throw Error("\u5B9E\u9645\u5C71\u5761\u9AD8\u4E8E\u5E73\u53F0\u6807\u9AD8\uFF0C\u5EFA\u8BAE\u62AC\u9AD8\u3001\u7F29\u77ED\u6216\u9519\u4F4D\uFF1B\u4F4D\u7F6E "+c+", "+l)}for(let c=e[0];c<=t[0];c+=s)for(let l=e[1];l<=t[1];l+=s){let u=this.column(c,l);a=Math.max(a,n-u.ground-1),u.ground+1<n&&o.push({type:"fill",min:[c,u.ground+1,l],max:[c,n-1,l],state:i,reason:"\u7ACB\u67F1\u4E0B\u63A2\u81F3\u539F\u6709\u771F\u5B9E\u5730\u9762"})}return{operations:o,deepest:a}}};function Ia(r){let e={},t="";for(let n of r.split(/\r?\n/)){let i=n.trim().split(/\s+/);i[0]==="newmtl"&&(t=i.slice(1).join(" "),e[t]=null),i[0]==="map_Kd"&&t&&(e[t]=i.slice(1).join(" "))}return e}function Ra(r,e,t,n=!1){let i=[],s=[],o=[],a=[],c="",l=(u,h)=>u<0?h+u:u-1;for(let u of r.split(/\r?\n/)){let h=u.trim().split(/\s+/);if(h[0]==="v")i.push(h.slice(1,4).map(Number));else if(h[0]==="vt")s.push(h.slice(1,3).map(Number));else if(h[0]==="vn")o.push(h.slice(1,4).map(Number));else if(h[0]==="usemtl")c=h.slice(1).join(" ");else if(h[0]==="f"){let d=h.slice(1).map(f=>{let p=f.split("/").map(Number),m=i[l(p[0],i.length)];if(!m||m.some(g=>!Number.isFinite(g)))throw Error("OBJ \u9762\u9876\u70B9\u65E0\u6548");return{p:m,uv:p[1]?s[l(p[1],s.length)]:[0,0],n:p[2]?o[l(p[2],o.length)]:null}});for(let f=1;f<d.length-1;f++){let p=[d[0],d[f],d[f+1]];a.push({positions:p.map(m=>m.p),uv:p.map(m=>[m.uv[0],n?1-m.uv[1]:m.uv[1]]),normals:p.every(m=>m.n)?p.map(m=>m.n):null,texture:t(e[c]||c)})}}}return a}function Pa(r){let e=r.Name,t=r.Properties||{},n=()=>Object.fromEntries(["east","west","up","down","north","south"].map(o=>[o,{texture:null}])),i=[{from:[0,0,0],to:[16,16,16],faces:n()}],s=0;if(/_sail$/.test(e)&&(i=[{from:[0,0,7.5],to:[16,16,8.5],faces:n()}],s={north:0,south:180,east:270,west:90}[t.facing]||0),/slab$/.test(e)&&t.type!=="double"&&(i=[{from:[0,t.type==="top"?8:0,0],to:[16,t.type==="top"?16:8,16],faces:n()}]),/stairs$/.test(e)){let o=t.half==="top";i=[{from:[0,o?8:0,0],to:[16,o?16:8,16],faces:n()},{from:[0,o?0:8,8],to:[16,o?8:16,16],faces:n()}],s={north:180,east:270,south:0,west:90}[t.facing]||0}return/_door$/.test(e)&&(i=[{from:[0,0,0],to:[16,16,3],faces:n()}],s=({north:0,east:270,south:180,west:90}[t.facing]||0)+(t.open==="true"?t.hinge==="right"?-90:90:0)),/fence$/.test(e)&&(i=[{from:[6,0,6],to:[10,16,10],faces:n()},{from:[0,5,7],to:[16,8,9],faces:n()},{from:[0,12,7],to:[16,15,9],faces:n()}]),/lantern$/.test(e)&&(i=[{from:[5,1,5],to:[11,10,11],faces:n()},{from:[4,0,4],to:[12,2,12],faces:n()}]),/pane$/.test(e)&&(i=[{from:[7,0,0],to:[9,16,16],faces:n()},{from:[0,0,7],to:[16,16,9],faces:n()}]),/water$/.test(e)&&(i=[{from:[0,0,0],to:[16,15,16],faces:n()}]),/grass|petals|flower|sapling|fern/.test(e)&&!/_block$/.test(e)&&(i=[{from:[4,0,4],to:[12,8,12],faces:n()}]),{id:e,state:r,parts:[{x:0,y:s,elements:i}],issues:["\u7B80\u5316\u65B9\u5757\u6A21\u578B\uFF1B\u9644\u52A0\u5BF9\u5E94\u8D44\u6E90\u6587\u4EF6\u540E\u53EF\u4F7F\u7528\u771F\u5B9E\u9759\u6001\u6A21\u578B\u3002"],missing:!0,full:i.length===1&&i[0].to.join(",")==="16,16,16"&&i[0].from.join(",")==="0,0,0",alpha:/glass|water|ice/.test(e)?"transparent":"opaque"}}var rn=class{constructor(){this.files=new Map,this.cache=new Map,this.sources=[],this.saved={models:{},images:{},textures:{}},this.version=0,this.partialVersion=0,this.summaryCache=null}addZip(e,t){let n=pn(e,{filter:i=>i.name.startsWith("assets/")&&!i.name.endsWith("/")});for(let[i,s]of Object.entries(n))this.files.set(i,s);return this.sources.push({name:t,count:Object.keys(n).length}),this.cache.clear(),this.version++,this.summaryCache=null,this.summary()}json(e){try{let t=this.files.get(e);return t?JSON.parse(new TextDecoder().decode(t)):{}}catch{return{}}}summary(){return this.summaryCache||(this.summaryCache={sources:this.sources,resources:this.files.size,blocks:this.catalogue("").length,embeddedModels:Object.keys(this.saved.models).length})}catalogue(e){let t={};for(let i of["en_us","zh_cn"])for(let s of this.files.keys())s.endsWith("/lang/"+i+".json")&&Object.assign(t,this.json(s));let n=[];for(let i of this.files.keys()){if(!i.includes("/blockstates/")||!i.endsWith(".json"))continue;let s=i.split("/")[1],o=i.split("/blockstates/")[1].slice(0,-5),a=s+":"+o,c=t["block."+s+"."+o.replaceAll("/",".")]||o;(a+" "+c).toLowerCase().includes(e.toLowerCase())&&n.push({id:a,label:c})}return n.sort((i,s)=>i.id.localeCompare(s.id))}resolve(e,t=new Set){if(t.has(e)||t.size>32)return{};t.add(e);let[n,i]=e.includes(":")?e.split(":"):["minecraft",e],s=this.json("assets/"+n+"/models/"+i+".json"),o=s.parent&&!s.parent.startsWith("builtin/")?this.resolve(s.parent,t):{};return{...o,...s,textures:{...o.textures,...s.textures}}}partial(e,t={}){let n="partial:"+e+"|"+JSON.stringify(t);if(this.cache.has(n))return this.cache.get(n);if(this.saved.models[n]&&!this.files.has("assets/"+e.split(":")[0]+"/models/"+e.split(":")[1]+".json")){let u=this.saved.models[n];return this.cache.set(n,u),u.missing||this.partialVersion++,u}let i=this.resolve(e),s=u=>{let h=new Set;for(;u?.startsWith("#");){if(h.has(u))return null;h.add(u),u=i.textures?.[u.slice(1)]}if(!u)return null;let[d,f]=u.includes(":")?u.split(":"):["minecraft",u];return"assets/"+d+"/textures/"+f+".png"},o=(i.elements||[]).map(u=>({...u,faces:Object.fromEntries(Object.entries(u.faces||{}).map(([h,d])=>[h,{...d,texture:s(d.texture)}]))})),a=[],c=[];if(i.loader==="neoforge:obj"&&i.model){let[u,h]=i.model.split(":"),d="assets/"+u+"/"+h,f=this.files.get(d);if(f){let p=new TextDecoder().decode(f),m=d.slice(0,d.lastIndexOf("/")+1),g={};for(let y of p.split(/\r?\n/))if(y.startsWith("mtllib ")){let b=this.files.get(m+y.slice(7).trim());b&&Object.assign(g,Ia(new TextDecoder().decode(b)))}a=Ra(p,g,s,!!i.flip_v)}}i.loader&&i.loader!=="neoforge:obj"&&c.push("\u6B64 partial \u4F7F\u7528\u672A\u9002\u914D\u7684\u81EA\u5B9A\u4E49\u6A21\u578B\u52A0\u8F7D\u5668\uFF1A"+i.loader);let l={id:e,parts:[{x:t.x||0,y:t.y||0,elements:o,triangles:a}],full:!1,alpha:"opaque",missing:!o.length&&!a.length,issues:c};return this.cache.set(n,l),l.missing||this.partialVersion++,l}model(e){let t=V(e);if(this.cache.has(t))return this.cache.get(t);let[n,i]=e.Name.split(":"),s=this.json("assets/"+n+"/blockstates/"+i+".json");if(!Object.keys(s).length){let f=this.saved.models[t]||Pa(e);return this.cache.set(t,f),f}let o={...e.Properties},a=[];!Object.keys(o).length&&s.variants&&Object.assign(o,Object.fromEntries(Object.keys(s.variants)[0].split(",").filter(f=>f.includes("=")).map(f=>f.split("="))));for(let[f,p]of Object.entries(s.variants||{}))if(f.split(",").filter(m=>m.includes("=")).every(m=>{let[g,y]=m.split("=");return y.split("|").includes(o[g])})){a.push(p);break}let c=f=>f?f.OR?f.OR.some(c):f.AND?f.AND.every(c):Object.entries(f).every(([p,m])=>String(m).split("|").includes(o[p])):!0;for(let f of s.multipart||[])c(f.when)&&a.push(f.apply);let l=[],u=[];for(let f of a){Array.isArray(f)&&(f=f[0],u.push("\u52A0\u6743\u6A21\u578B\u4F7F\u7528\u7B2C\u4E00\u7EC4"));let p=this.resolve(f.model);p.loader&&u.push("\u81EA\u5B9A\u4E49\u52A0\u8F7D\u5668 "+p.loader+" \u672A\u6267\u884C");let m=y=>{let b=new Set;for(;y?.startsWith("#");){if(b.has(y))return null;b.add(y),y=p.textures?.[y.slice(1)]}if(!y)return null;let[_,v]=y.includes(":")?y.split(":"):["minecraft",y];return"assets/"+_+"/textures/"+v+".png"},g=(p.elements||[]).map(y=>({...y,faces:Object.fromEntries(Object.entries(y.faces||{}).map(([b,_])=>[b,{..._,texture:m(_.texture)}]))}));l.push({x:f.x||0,y:f.y||0,elements:g}),f.uvlock&&u.push("UV \u9501\u5B9A\u4F7F\u7528\u8FD1\u4F3C\u9884\u89C8")}if(!l.some(f=>f.elements.length)){let f=Pa(e);return f.issues.push(...u),f}let h=l.length===1&&l[0].elements.length===1&&l[0].elements[0].from.join(",")==="0,0,0"&&l[0].elements[0].to.join(",")==="16,16,16",d={id:e.Name,state:e,parts:l,issues:u,missing:!1,full:h,alpha:/glass|water|ice/.test(e.Name)?"transparent":"opaque"};return this.cache.set(t,d),d}addSaved(e){Object.assign(this.saved.models,e.models||{}),Object.assign(this.saved.images,e.images||{}),Object.assign(this.saved.textures,e.textures||{}),this.cache.clear(),this.version++,this.summaryCache=null}texture(e){if(this.files.has(e))return{bytes:this.files.get(e)};let t=this.saved.textures[e];return t?{uri:this.saved.images[t.image],tile:t.tile}:null}bundle(e){for(let s of Object.keys(this.saved.models))if(s.startsWith("partial:")){let o=s.indexOf("|");if(o<0)continue;try{this.partial(s.slice(8,o),JSON.parse(s.slice(o+1)))}catch{}}let t={},n={},i={};for(let s of e)t[V(s)]=this.model(s);for(let[s,o]of this.cache)s.startsWith("partial:")&&!o.missing&&(t[s]=o);for(let s of Object.values(t))for(let o of s.parts){let a=[];for(let c of o.elements||[])for(let l of Object.values(c.faces||{}))l.texture&&a.push(l.texture);for(let c of o.triangles||[])c.texture&&a.push(c.texture);for(let c of a){if(n[c])continue;let l=this.texture(c);if(l)if(l.bytes){let u="";for(let h=0;h<l.bytes.length;h+=32768)u+=String.fromCharCode(...l.bytes.subarray(h,h+32768));i[c]="data:image/png;base64,"+btoa(u),n[c]={image:c}}else{let u=this.saved.textures[c];n[c]=u,i[u.image]=l.uri}}}return{models:t,images:i,textures:n}}};var sn=r=>!!r&&typeof r=="object"&&!Array.isArray(r),Na=r=>Array.isArray(r)&&r.length===3&&r.every(Number.isSafeInteger);function Sd(r,e){if(!Na(r.origin)||!Array.isArray(r.design?.objects)||!r.design.objects.every(sn)||!sn(r.design.animations)||r.design.componentDefinitions!=null&&(!Array.isArray(r.design.componentDefinitions)||r.design.componentDefinitions.some(t=>!sn(t)||!Array.isArray(t.blocks))))throw Error("\u5386\u53F2\u5DE5\u7A0B\u7684\u539F\u70B9\u6216\u8BBE\u8BA1\u5BF9\u8C61\u65E0\u6548");if(!sn(e)||["models","images","textures"].some(t=>e[t]!=null&&!sn(e[t]))||Object.values(e.models||{}).some(t=>!sn(t)||!Array.isArray(t.parts)||t.parts.some(n=>!sn(n)||!Array.isArray(n.elements))))throw Error("\u5386\u53F2\u5DE5\u7A0B\u7684\u6A21\u578B\u6216\u6750\u8D28\u9644\u4EF6\u65E0\u6548")}var Hi=class{constructor(){this.workspaceId=null,this.slots=new Map,this.active=null}sync(e){this.workspaceId!==e&&(this.workspaceId=e,this.slots.clear(),this.active=null)}capture(e,t,{workspaceId:n,revision:i}){if(this.sync(n),this.validateCaptureSlot(e),this.active)throw Error("\u8BF7\u5148\u8FD4\u56DE\u5F53\u524D\u8BBE\u8BA1\uFF0C\u518D\u8BB0\u5F55\u65B9\u6848");let s={slot:e,name:t.title,capturedRevision:i,capturedAt:new Date().toISOString(),site:t.fork()};return this.slots.set(e,s),this.descriptor(s)}load(e,t,n){if(!(e instanceof Uint8Array)&&!(e instanceof ArrayBuffer))throw Error("\u5386\u53F2\u7248\u672C\u9700\u8981\u5B8C\u6574\u5DE5\u7A0B\u5B57\u8282");if(!t||typeof t.projectId!="string"||!t.projectId.trim()||!Number.isSafeInteger(t.version)||t.version<1||typeof t.name!="string"||!t.name.trim()||typeof t.time!="string"||!Number.isFinite(Date.parse(t.time))||typeof t.note!="string")throw Error("\u5386\u53F2\u7248\u672C\u7F3A\u5C11\u6709\u6548\u7684\u5DE5\u7A0B\u3001\u7248\u672C\u3001\u540D\u79F0\u3001\u65F6\u95F4\u6216\u5907\u6CE8");let i=JSON.parse(He(Ze(new Uint8Array(e))));if(i?.liteSchema!==1||!i.site?.base||!Array.isArray(i.site.palette)||!Array.isArray(i.site.overlay))throw Error("\u4E0D\u662F\u5B8C\u6574\u7684 CraftStudio \u5386\u53F2\u5DE5\u7A0B");if(!Na(i.site.base.origin)||i.site.overlay.some(c=>!Array.isArray(c.pos)||c.pos.length!==3||c.pos.some(l=>!Number.isInteger(l)||l<0||l>4095)||c.state!==null&&(typeof c.state?.Name!="string"||!c.state.Name.includes(":"))))throw Error("\u5386\u53F2\u5DE5\u7A0B\u7684\u539F\u70B9\u6216\u6539\u52A8\u65B9\u5757\u65E0\u6548");let s=Le.unpack(i.site),o=new rn;Sd(s,i.assets||{}),o.addSaved(i.assets||{});let a={slot:"history",name:t.name,source:Object.fromEntries(["projectId","version","name","time","note"].map(c=>[c,t[c]])),site:s,resources:o};return this.sync(n),this.slots.set("history",a),this.active="history",this.descriptor(a)}show(e){e!=="history"&&this.validateCaptureSlot(e);let t=this.slots.get(e);if(!t)throw Error(e==="history"?"\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u5386\u53F2\u7248\u672C":"\u8BF7\u5148\u8BB0\u5F55\u65B9\u6848 "+e.toUpperCase());return this.active=e,t.site}end(){this.active=null}get current(){return this.slots.get(this.active)?.site||null}get resources(){return this.slots.get(this.active)?.resources||null}descriptor({site:e,resources:t,...n}){return structuredClone(n)}describe(e){return this.sync(e),{active:this.active,slots:[...this.slots.values()].map(t=>this.descriptor(t))}}validateCaptureSlot(e){if(e!=="a"&&e!=="b")throw Error("\u8BF7\u9009\u62E9\u65B9\u6848 A \u6216 B")}};var Wi=1e6,Xi=2e7,Et=1e-8;function qi(r){let e=[1/0,1/0,1/0],t=[-1/0,-1/0,-1/0];for(let n of r)for(let i=0;i<3;i++)e[i]=Math.min(e[i],n[i]),t[i]=Math.max(t[i],n[i]);return{min:e,max:t}}function Yi(r,e=1){let t=r.min.map(i=>Math.floor(i*e+Et)),n=r.max.map((i,s)=>Math.max(t[s],Math.ceil(i*e-Et)-1));return{min:t,max:n}}function Ed(r,e,t){let n=Yi(r,t),i=Yi(e,t);for(let s=0;s<3;s++)n.min[s]=Math.min(n.min[s],i.max[s]),n.max[s]=Math.min(n.max[s],i.max[s]);return n}function Ad(r,e,t,n,i){let s=new Zn,o=new Ui(new k,new k,new k);for(let a of r){let c=qi(a),l=Ed(c,e,t),u=l.max.reduce((d,f,p)=>d*(f-l.min[p]+1),1);if(i.testedCells+=u,i.testedCells>Xi)throw Error(`\u7F51\u683C\u8868\u9762\u76F8\u4EA4\u8BA1\u7B97\u8D85\u8FC7 ${Xi.toLocaleString("en-US")} \u6B21\u9884\u7B97\uFF0C\u8BF7\u62C6\u5206\u6A21\u578B\u6216\u964D\u4F4E\u5C3A\u5BF8`);o.set(...a.map(d=>new k(...d)));let h=c.min.map((d,f)=>c.max[f]-d>Et?Et/t:0);for(let d=l.min[1];d<=l.max[1];d++)for(let f=l.min[2];f<=l.max[2];f++)for(let p=l.min[0];p<=l.max[0];p++)s.min.set(p/t+h[0],d/t+h[1],f/t+h[2]),s.max.set((p+1)/t-h[0],(d+1)/t-h[1],(f+1)/t-h[2]),s.intersectsTriangle(o)&&n(p,d,f)}}var Gi=(r,e,t)=>(e[0]-r[0])*(t[2]-r[2])-(e[2]-r[2])*(t[0]-r[0]),Td=(r,e)=>e[2]>r[2]||e[2]===r[2]&&e[0]<r[0];function Cd(r,e,t,n){let i=[e,0,t],s=[Gi(r[1],r[2],i),Gi(r[2],r[0],i),Gi(r[0],r[1],i)];for(let o=0;o<3;o++)if(s[o]<-Et*n||Math.abs(s[o])<=Et*n&&!Td(r[(o+1)%3],r[(o+2)%3]))return null;return s.reduce((o,a,c)=>o+a*r[c][1],0)/n}function Id(r,e,t,n,i){let s=Yi(e,t),o=Yi(e);if(o.max.reduce((l,u,h)=>l*(u-o.min[h]+1),1)>Wi)throw Error(`\u5B9E\u5FC3\u8F6C\u6362\u9700\u8981\u91C7\u6837\u7684\u5305\u56F4\u76D2\u8D85\u8FC7 ${Wi.toLocaleString("en-US")} \u683C\u9884\u7B97\uFF0C\u8BF7\u62C6\u5206\u6A21\u578B\u6216\u964D\u4F4E\u5C3A\u5BF8`);let c=new Map;for(let l of r){let u=Gi(l[0],l[1],l[2]);if(Math.abs(u)<=Number.EPSILON)continue;let h=u>0?l:[l[0],l[2],l[1]];u=Math.abs(u);let d=qi(h),f=Math.max(s.min[0],Math.ceil(d.min[0]*t-.5)),p=Math.min(s.max[0],Math.floor(d.max[0]*t-.5)),m=Math.max(s.min[2],Math.ceil(d.min[2]*t-.5)),g=Math.min(s.max[2],Math.floor(d.max[2]*t-.5));if(i.testedCells+=Math.max(0,p-f+1)*Math.max(0,g-m+1),i.testedCells>Xi)throw Error(`\u7F51\u683C\u5C04\u7EBF\u8BA1\u7B97\u8D85\u8FC7 ${Xi.toLocaleString("en-US")} \u6B21\u9884\u7B97\uFF0C\u8BF7\u62C6\u5206\u6A21\u578B\u6216\u964D\u4F4E\u5C3A\u5BF8`);for(let y=m;y<=g;y++)for(let b=f;b<=p;b++){let _=Cd(h,(b+.5)/t,(y+.5)/t,u);if(_===null)continue;let v=b+","+y,M=c.get(v);M?M.heights.push(_):c.set(v,{x:b,z:y,heights:[_]})}}for(let{x:l,z:u,heights:h}of c.values()){if(h.sort((d,f)=>d-f),h.length%2)throw Error("\u7F51\u683C\u5C04\u7EBF\u672A\u6210\u5BF9\u76F8\u4EA4\uFF0C\u8BF7\u68C0\u67E5\u81EA\u4EA4\u3001\u91CD\u53E0\u9762\u6216\u51E0\u4F55\u88C2\u7F1D\uFF1B\u53EF\u6539\u4E3A\u8868\u9762\u8F6C\u6362");for(let d=0;d<h.length;d+=2){if(h[d+1]-h[d]<=Et)continue;let f=Math.max(s.min[1],Math.ceil(h[d]*t-.5-Et)),p=Math.min(s.max[1],Math.floor(h[d+1]*t-.5+Et));for(let m=f;m<=p;m++)n(l,m,u)}}}function Da(r,e,{mode:t="surface",smart:n=!1}={}){if(!["surface","solid"].includes(t))throw Error("\u6A21\u578B\u8F6C\u6362\u65B9\u5F0F\u9700\u8981 surface \u6216 solid");if(t==="solid"&&(!r.topology?.closed||r.topology.nonManifoldEdges))throw Error("\u5B9E\u5FC3\u8F6C\u6362\u9700\u8981\u95ED\u5408\u4E14\u6CA1\u6709\u975E\u6D41\u5F62\u8FB9\u7684\u7F51\u683C\uFF1B\u5F00\u653E\u5C4B\u9762\u8BF7\u4F7F\u7528\u8868\u9762\u8F6C\u6362");let i=ba(r,e),s=qi(i.flat()),o=n?2:1,a=new Map,c=[...r.warnings||[]],l={triangles:i.length,testedCells:0,outputCells:0,subcells:0};if([...s.min,...s.max].some(d=>!Number.isFinite(d)||Math.abs(d)>3e7))throw Error("\u6A21\u578B\u53D8\u6362\u8D85\u51FA \xB130,000,000 \u7684 Minecraft \u5750\u6807\u8303\u56F4");let u=(d,f,p)=>{let m=[d,f,p].map(_=>Math.floor(_/o)),g=m.join(","),y=n?1<<(f-m[1]*2)*4+(p-m[2]*2)*2+d-m[0]*2:255,b=a.get(g);if(b)b.mask|=y;else{if(a.size===Wi)throw Error(`\u7F51\u683C\u8F6C\u6362\u8D85\u8FC7 ${Wi.toLocaleString("en-US")} \u4E2A\u8F93\u51FA\u65B9\u5757\u9884\u7B97\uFF0C\u8BF7\u62C6\u5206\u6A21\u578B\u6216\u964D\u4F4E\u5C3A\u5BF8`);a.set(g,{pos:m,mask:y})}};t==="surface"?Ad(i,s,o,u,l):Id(i,s,o,u,l);let h=[...a.values()];return l.outputCells=h.length,l.subcells=h.reduce((d,{mask:f})=>d+f.toString(2).replaceAll("0","").length,0),h.length||c.push("\u5F53\u524D\u5C3A\u5BF8\u4E0E\u4F4D\u7F6E\u6CA1\u6709\u751F\u6210\u65B9\u5757\uFF1B\u5B9E\u5FC3\u6A21\u5F0F\u6309\u683C\u4E2D\u5FC3\u91C7\u6837\uFF0C\u8584\u5C0F\u7ED3\u6784\u53EF\u4F7F\u7528\u8868\u9762\u6A21\u5F0F\u6216\u534A\u7816/\u697C\u68AF\u7CBE\u5EA6"),t==="surface"&&!r.topology?.closed&&c.push("\u5F00\u653E\u7F51\u683C\u4EC5\u8F6C\u6362\u8868\u9762\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u8865\u9762\u6216\u586B\u6210\u5B9E\u5FC3"),t==="solid"&&c.push("\u5B9E\u5FC3\u6309\u5C04\u7EBF\u5947\u5076\u548C\u683C\u4E2D\u5FC3\u91C7\u6837\uFF1B\u5C0F\u4E8E\u91C7\u6837\u95F4\u8DDD\u7684\u7EC6\u8282\u53EF\u80FD\u6D88\u5931\uFF0C\u8BF7\u68C0\u67E5\u8584\u58C1\u4E0E\u7A7A\u8154"),{cells:h,bounds:h.length?qi(h.map(d=>d.pos)):null,stats:l,warnings:c}}function ji(r,{roles:e={},available:t=[]}={}){let n=new Set(t),i=r.Name,s=i.replace(/_stairs$|_slab$/,"").replace(/_planks$/,"").replace(/bricks$/,"brick"),o=e.slab||(n.has(s+"_slab")?{Name:s+"_slab"}:null),a=e.stairs||(n.has(s+"_stairs")?{Name:s+"_stairs"}:null),c=/_(slab|stairs)$/.test(i)?[s+"s",s,s+"_planks",s+"_block"].find(h=>n.has(h)):i,l=e.full||(c&&c!==i?{Name:c}:r),u={3:"north",12:"south",5:"west",10:"east"};return(h,d)=>{let f=h&15,p=h>>4&15;return h===255?{state:l,role:"full"}:o&&(f===15&&p===0||p===15&&f===0)?{state:{...o,Properties:{...o.Properties,type:f===15?"bottom":"top",waterlogged:"false"}},role:"slab"}:a&&(f===15&&u[p]||p===15&&u[f])?{state:{...a,Properties:{...a.Properties,half:f===15?"bottom":"top",facing:u[f===15?p:f],shape:"straight",waterlogged:"false"}},role:"stairs"}:d?{state:l,role:"full",fallback:h!==255}:null}}function Ji(r,e){if(!r.state||typeof r.state.Name!="string"||!r.state.Name.includes(":"))throw Error("\u8BF7\u5148\u9009\u62E9\u751F\u6210\u65B9\u5757\u7684\u6750\u8D28");return{sourceId:e.id,transform:St(r.transform,e.transform),mode:r.mode||"surface",smart:!!r.smart,state:structuredClone(r.state),roles:structuredClone(r.roles||{})}}function $i(r,e,t=new Set){let n=Cn(r.design,e.sourceId),i=Ji(e,n),s=ei(r.design,n.id),o=Da(s,i.transform,i),a=ji(i.state,{roles:i.roles,available:[...t]}),c={},l=[...s.warnings,...o.warnings];if(o.cells.some(d=>d.pos.some(f=>f<0||f>4095)))throw Error("\u6A21\u578B\u8D85\u51FA\u5F53\u524D\u5DE5\u7A0B\u5C40\u90E8\u8303\u56F4 0\u20134095\uFF0C\u8BF7\u8C03\u6574\u4F4D\u7F6E\u6216\u5C3A\u5BF8");let u=0,h=o.cells.map(({pos:d,mask:f})=>{let p=i.smart?a(f,!0):{state:i.state,role:"full"};return c[p.role]=(c[p.role]||0)+1,p.fallback&&u++,{type:"set",pos:d,state:p.state,reason:"\u6A21\u578B\u8F6C\u65B9\u5757"}});if(u&&l.push(`${u} \u683C\u8FB9\u754C\u65E0\u6CD5\u7528\u5F53\u524D\u534A\u7816/\u697C\u68AF\u8D34\u5408\uFF0C\u5DF2\u7528\u4E3B\u4F53\u65B9\u5757\u4FDD\u7559`),!h.length)throw Error("\u5F53\u524D\u5C3A\u5BF8\u6CA1\u6709\u53EF\u751F\u6210\u7684\u65B9\u5757\uFF0C\u8BF7\u8C03\u6574\u5C3A\u5BF8\u6216\u653E\u7F6E\u4F4D\u7F6E");return{operations:h,guide:[],warnings:l,usedRoles:c,meshStats:{...o.stats,bounds:o.bounds,closed:s.topology.closed,sourceName:n.name,approximated:u}}}function La(r,e){let t=new Map((r?.objects||[]).map(m=>[m.id,m])),n=new Map(e.map(m=>[m.id,m])),i=new Map,s=new Map,o=new Map,a=(m,g)=>m.issues.push(g);for(let m of e){let g=t.get(m.id);if(m.detached||!g?.guideId||["geometry","mesh"].includes(g.generation?.type))continue;let y=ft({kind:"guide",id:g.guideId});i.has(y)||i.set(y,[]),i.get(y).push(m.id)}for(let m of e)s.set(m.id,new Set),o.set(m.id,new Set);for(let m of e)if(!m.detached)for(let g of m.sources){let y=i.get(ft(g))||[];y.length>1&&a(m,{severity:"error",code:"AMBIGUOUS_OUTPUT",sourceId:g.id,objectIds:y,message:"\u6765\u6E90\u8F85\u52A9\u7EBF\u7531\u591A\u4E2A\u5BF9\u8C61\u751F\u6210\uFF0C\u8BF7\u4FEE\u590D\u6765\u6E90\u5173\u7CFB"});for(let b of y)s.get(m.id).add(b),o.get(b).add(m.id)}let c=new Map,l=[],u=new Map,h=new Set;for(let m of e){if(c.has(m.id))continue;let g=[{id:m.id,edges:[...s.get(m.id)],index:0}];for(c.set(m.id,1),u.set(m.id,l.length),l.push(m.id);g.length;){let y=g.at(-1);if(y.index===y.edges.length){c.set(y.id,2),u.delete(y.id),l.pop(),g.pop();continue}let b=y.edges[y.index++];if(c.get(b)===1)for(let _=u.get(b);_<l.length;_++)h.add(l[_]);else c.has(b)||(c.set(b,1),u.set(b,l.length),l.push(b),g.push({id:b,edges:[...s.get(b)],index:0}))}}for(let m of h)a(n.get(m),{severity:"error",code:"DEPENDENCY_CYCLE",message:"\u751F\u6210\u6765\u6E90\u5B58\u5728\u5FAA\u73AF\uFF0C\u8BF7\u4FEE\u590D\u6216\u65AD\u5F00\u5FAA\u73AF\u5173\u7CFB"});let d=m=>m.issues.some(g=>g.severity==="error")?2:m.issues.length?1:0,f=new Map(e.map(m=>[m.id,d(m)])),p=e.filter(m=>f.get(m.id)).map(m=>m.id);for(let m=0;m<p.length;m++){let g=p[m];for(let y of o.get(g))f.get(y)<f.get(g)&&(f.set(y,f.get(g)),p.push(y))}for(let m of e){for(let g of s.get(m.id))if(g!==m.id&&f.get(g)){let y=n.get(g),b=f.get(g)===2;a(m,{severity:b?"error":"warning",code:b?"UPSTREAM_ERROR":"UPSTREAM_OUTDATED",objectId:g,objectName:y.name,message:"\u4E0A\u6E38\u5BF9\u8C61\u300C"+(y.name||g)+"\u300D"+(b?"\u5B58\u5728\u6765\u6E90\u95EE\u9898":"\u5F85\u66F4\u65B0")})}m.status=m.detached?"detached":f.get(m.id)===2?"error":f.get(m.id)?"warning":"ready"}}function Hs(r,e){let t=r instanceof Map?r:new Map(r.map(s=>[s.id,s])),n=new Map;function i(s,o=null){let a=s.provenance,c=t.get(a.guideId),l=n.get(a.guideId);o=o||(c?l?.errorCode:"OFFSET_SOURCE_MISSING")||null;let u=!!l?.outdated,h=!!c&&(a.sourceRevision??0)!==(c.revision??0),d=o==="OFFSET_CYCLE"?"\u504F\u79FB\u6765\u6E90\u5B58\u5728\u5FAA\u73AF\uFF0C\u8BF7\u4FEE\u590D\u6765\u6E90\u8BB0\u5F55":o==="OFFSET_SOURCE_MISSING"?"\u504F\u79FB\u6765\u6E90\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u8F6E\u5ED3":u?"\u4E0A\u4E00\u7EA7\u504F\u79FB\u8F6E\u5ED3\u4ECD\u5F85\u91CD\u5EFA\uFF0C\u8BF7\u5148\u66F4\u65B0\u4E0A\u4E00\u7EA7":"";return{kind:"offset",errorCode:o,independent:!0,guideId:a.guideId,name:c?.name||"\u53C2\u7167\u5DF2\u5931\u6548",missing:!c,distance:a.distance,outdated:h||u||!!o,canRebuild:!o&&!u,reason:d,revision:c?.revision??0}}for(let s of e||t.keys()){if(n.has(s)||t.get(s)?.provenance?.kind!=="offset")continue;let o=[],a=new Map,c=s;for(;t.get(c)?.provenance?.kind==="offset"&&!n.has(c);){if(a.has(c)){for(let l=a.get(c);l<o.length;l++)n.set(o[l],i(t.get(o[l]),"OFFSET_CYCLE"));break}a.set(c,o.length),o.push(c),c=t.get(c).provenance.guideId}for(let l=o.length-1;l>=0;l--)n.has(o[l])||n.set(o[l],i(t.get(o[l])))}return n}function Ua(r,e){return Hs(r,[e]).get(e)||null}function ii(r){let e=new Map((r?.guides||[]).map(s=>[s.id,s])),t=Hs(e),n=(r?.objects||[]).filter(s=>s.generation||Ft(s).length).map(s=>({id:s.id,name:s.name,detached:!!s.generation?.detached,outdated:!!s.generation?.outdated,sources:Ft(s).map(({kind:o,id:a})=>{let c=nn(r,{kind:o,id:a});return{kind:o,id:a,name:c?.name||"\u53C2\u7167\u5DF2\u5931\u6548",missing:!c,editable:o==="mesh"?!!c:!!c?.recipe?.kind&&Array.isArray(c.recipe.points),revision:c?.revision??0,...o==="guide"&&c?.provenance?.kind==="offset"?{offset:t.get(a)}:{}}})}));for(let s of n)s.issues=s.detached?[]:[...s.sources.filter(o=>o.missing).map(o=>({severity:"error",code:"MISSING_SOURCE",sourceId:o.id,sourceKind:o.kind,message:"\u6765\u6E90\u53C2\u7167\u5DF2\u5931\u6548"})),...s.sources.filter(o=>o.offset?.outdated).map(o=>({severity:o.offset.errorCode?"error":"warning",code:o.offset.errorCode||"OFFSET_OUTDATED",sourceId:o.id,message:"\u504F\u79FB\u6765\u6E90\u300C"+o.name+"\u300D\uFF1A"+(o.offset.reason||"\u8F6E\u5ED3\u5F85\u91CD\u5EFA")})),...s.outdated?[{severity:"warning",code:"OUTDATED",message:"\u6765\u6E90\u5DF2\u53D8\u5316\uFF0C\u7ED3\u679C\u5F85\u66F4\u65B0"}]:[]],s.status=s.issues.some(o=>o.severity==="error")?"error":s.issues.length?"warning":s.detached?"detached":"ready";La(r,n);let i=new Map([...e.keys()].map(s=>[s,[]]));for(let s of n)for(let o of s.sources)o.kind==="guide"&&i.get(o.id)?.push({id:s.id,name:s.name,outdated:s.outdated});return{objects:n,guides:[...e.values()].map(s=>({id:s.id,name:s.name,dependents:i.get(s.id),...s.provenance?.kind==="offset"?{source:t.get(s.id)}:{}})),meshes:(r?.meshSources||[]).map(s=>({id:s.id,name:s.name,dependents:n.filter(o=>o.sources.some(a=>a.kind==="mesh"&&a.id===s.id)).map(o=>({id:o.id,name:o.name,outdated:o.outdated}))}))}}function Zi(r,e,t=n=>!!n.generation?.detached){let n=ii(r),i=new Map((r.objects||[]).map(u=>[u.id,u])),s=new Map,o=new Set,a=new Set,c=new Set,l=[ft(typeof e=="string"?{kind:"guide",id:e}:e)];for(let u of n.objects)for(let h of u.sources){let d=ft(h);s.has(d)||s.set(d,[]),s.get(d).push(u.id)}for(;l.length;){let u=l.shift();if(!o.has(u)){o.add(u);for(let h of s.get(u)||[]){let d=i.get(h);if(t(d)){c.add(h);continue}a.has(h)||(a.add(h),d.guideId&&d.generation?.type!=="mesh"&&l.push(ft({kind:"guide",id:d.guideId})))}}}return{objects:Gs(r,[...a].map(u=>i.get(u))),detached:[...c].map(u=>i.get(u))}}function Gs(r,e){let t=new Map(e.map(l=>[l.id,l])),n=new Map(ii(r).objects.map(l=>[l.id,l])),i=new Map,s=new Map(e.map(l=>[l.id,new Set])),o=new Map(e.map(l=>[l.id,0]));for(let l of e)if(l.guideId&&l.generation?.type!=="mesh"){let u=ft({kind:"guide",id:l.guideId});if(i.has(u)&&i.get(u)!==l.id)throw Error("\u591A\u4E2A\u5173\u8054\u7ED3\u679C\u4F7F\u7528\u540C\u4E00\u8F93\u51FA\u8F85\u52A9\u7EBF\uFF0C\u8BF7\u4FEE\u590D\u6765\u6E90\u5173\u7CFB");i.set(u,l.id)}for(let l of e)for(let u of n.get(l.id)?.sources||[]){if(!nn(r,u))throw Error("\u751F\u6210\u53C2\u7167\u5DF2\u5931\u6548\uFF1A"+l.name+"\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u6765\u6E90");let h=i.get(ft(u));h&&h!==l.id&&!s.get(h).has(l.id)&&(s.get(h).add(l.id),o.set(l.id,o.get(l.id)+1))}let a=e.filter(l=>!o.get(l.id)).map(l=>l.id),c=[];for(;a.length;){let l=a.shift();c.push(t.get(l));for(let u of s.get(l))o.set(u,o.get(u)-1),o.get(u)||a.push(u)}if(c.length!==e.length)throw Error("\u751F\u6210\u5173\u7CFB\u5B58\u5728\u5FAA\u73AF\uFF0C\u8BF7\u65AD\u5F00\u5FAA\u73AF\u53C2\u7167\u540E\u66F4\u65B0");return c}function Rd(r,e,t){let n=r.length,i=(n-(e?0:1))*t,s=Math.floor(i),o=i-s;e?s+=s>0?0:(Math.floor(Math.abs(s)/n)+1)*n:o===0&&s===n-1&&(s=n-2,o=1);let a=e||s>0?r[(s-1)%n]:r[0].map((y,b)=>y-r[1][b]+y),c=r[s%n],l=r[(s+1)%n],u=e||s+2<n?r[(s+2)%n]:r.at(-1).map((y,b)=>y-r.at(-2)[b]+y),h=(y,b)=>{let _=y[0]-b[0],v=y[1]-b[1],M=y[2]-b[2];return _*_+v*v+M*M},d=Math.pow(h(a,c),.25),f=Math.pow(h(c,l),.25),p=Math.pow(h(l,u),.25);f<1e-4&&(f=1),d<1e-4&&(d=f),p<1e-4&&(p=f);let m=o*o,g=m*o;return c.map((y,b)=>{let _=a[b],v=l[b],M=u[b],x=((y-_)/d-(v-_)/(d+f)+(v-y)/f)*f,E=((v-y)/f-(M-y)/(f+p)+(M-v)/p)*f;return y+x*o+(-3*y+3*v-2*x-E)*m+(2*y-2*v+x+E)*g})}function ka(r,{closed:e=!1,density:t=8}={}){if(!Number.isFinite(t))throw Error("\u91C7\u6837\u5BC6\u5EA6\u9700\u8981\u6709\u6548\u6570\u5B57");if(!Array.isArray(r)||r.length<2||r.some(c=>!Array.isArray(c)||c.length!==3||c.some(l=>!Number.isFinite(l))))throw Error("\u8D2F\u7A7F\u70B9\u66F2\u7EBF\u9700\u8981\u6709\u6548\u7684\u4E09\u7EF4\u9014\u7ECF\u70B9");let n=(c,l)=>Math.hypot(...c.map((u,h)=>u-l[h])),i=[];for(let c of r)(!i.length||n(c,i.at(-1))>1e-9)&&i.push([...c]);if(e&&i.length>1&&n(i[0],i.at(-1))<1e-9&&i.pop(),i.length<(e?3:2))throw Error(e?"\u95ED\u5408\u66F2\u7EBF\u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u4E0D\u540C\u7684\u70B9":"\u66F2\u7EBF\u81F3\u5C11\u9700\u8981\u4E24\u4E2A\u4E0D\u540C\u7684\u70B9");let s=e?i.length:i.length-1,o=[[...i[0]]],a=Math.max(1,Math.min(8,t));for(let c=0;c<s;c++){let l=i[(c+1)%i.length],u=Math.max(4,Math.ceil(n(i[c],l)*a));if(u>16384)throw Error("\u5355\u6BB5\u8FC7\u957F\uFF0C\u8BF7\u589E\u52A0\u9014\u7ECF\u70B9");if(o.length+u>5e4)throw Error("\u8F85\u52A9\u7EBF\u70B9\u6570\u8FC7\u591A\uFF0C\u8BF7\u5206\u6BB5\u7ED8\u5236");for(let h=1;h<u;h++)o.push(Rd(i,e,(c+h/u)/s));o.push([...l])}return o}var H=(r,e)=>r.reduce((t,n,i)=>t+n*e[i],0),xe=(r,e)=>r.map((t,n)=>t-e[n]),Ki=(r,e)=>[r[1]*e[2]-r[2]*e[1],r[2]*e[0]-r[0]*e[2],r[0]*e[1]-r[1]*e[0]],Qi=r=>{let e=Math.hypot(...r);return r.map(t=>t/e)};function Ws(r,e="auto"){if(!r?.length||r.some(u=>u.length!==3||u.some(h=>!Number.isFinite(h))))throw Error("\u9700\u8981\u6709\u6548\u7684\u8F6E\u5ED3\u70B9");let t=[...r[0]],n={xz:[[1,0,0],[0,0,1],[0,1,0]],xy:[[1,0,0],[0,1,0],[0,0,1]],yz:[[0,0,1],[0,1,0],[1,0,0]]},i=n[e],s=e;if(!i){let u=[0,0,0];for(let d=0;d<r.length;d++){let f=Ki(xe(r[d],t),xe(r[(d+1)%r.length],t));u=u.map((p,m)=>p+f[m])}if(Math.hypot(...u)<1e-8)throw Error("\u8F6E\u5ED3\u6CA1\u6709\u6709\u6548\u9762\u79EF");u=Qi(u);let h=u.reduce((d,f,p)=>Math.abs(f)>Math.abs(u[d])?p:d,0);if(u[h]<0&&(u=u.map(d=>-d)),s=Object.keys(n).find(d=>Math.abs(H(n[d][2],u))>1-1e-10)||"auto",s!=="auto")i=n[s];else{let d=Math.abs(u[0])<.9?[1,0,0]:[0,0,1],f=Qi(xe(d,u.map(m=>m*H(d,u)))),p=Ki(u,f);i=[f,p,u]}}let[o,a,c]=i,l=Math.max(...r.map(u=>Math.abs(H(xe(u,t),c))));if(l>1e-4)throw Error("\u8F6E\u5ED3\u4E0D\u5171\u9762\uFF08\u6700\u5927\u504F\u5DEE "+l.toFixed(3)+" \u683C\uFF09\uFF0C\u8BF7\u8C03\u6574\u63A7\u5236\u70B9\u6216\u9009\u62E9\u6B63\u786E\u5DE5\u4F5C\u5E73\u9762");return{origin:t,u:o,v:a,normal:c,plane:s}}var rt=(r,e)=>[e.u,e.v,e.normal].map(t=>H(xe(r,e.origin),t)),on=(r,e)=>e.origin.map((t,n)=>t+r[0]*e.u[n]+r[1]*e.v[n]+r[2]*e.normal[n]);function Xe(r){if(!r||["origin","u","v","normal"].some(t=>!Array.isArray(r[t])||r[t].length!==3||r[t].some(n=>!Number.isFinite(n))))throw Error("\u5DE5\u4F5C\u5E73\u9762\u5750\u6807\u65E0\u6548");let e=[r.u,r.v,r.normal];if(e.some(t=>Math.abs(Math.hypot(...t)-1)>1e-6)||Math.abs(H(e[0],e[1]))>1e-6||Math.abs(H(e[0],e[2]))>1e-6||Math.abs(H(e[1],e[2]))>1e-6)throw Error("\u5DE5\u4F5C\u5E73\u9762\u8F74\u5FC5\u987B\u6B63\u4EA4\u4E14\u5F52\u4E00");if(Math.abs(H(Ki(r.u,r.v),r.normal)-1)>1e-6)throw Error("\u5DE5\u4F5C\u5E73\u9762\u5FC5\u987B\u4F7F\u7528\u53F3\u624B\u5750\u6807\u7CFB");return structuredClone(r)}function Oa(r,e){if(r?.length!==3||e?.length!==3||[...r,...e].some(i=>!Number.isFinite(i))||Math.hypot(...e)<1e-6)throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u9762");e=Qi(e);let t=Math.abs(e[0])<.9?[1,0,0]:[0,0,1],n=Qi(xe(t,e.map(i=>i*H(t,e))));return{origin:[...r],u:n,v:Ki(e,n),normal:e,plane:"custom"}}function In(r,e="auto",t=null){let n=Ws(r,e);if(e!=="auto"||!t)return n;let i=Xe(t);if(r.some(s=>Math.abs(rt(s,i)[2])>1e-4))throw Error("\u622A\u9762\u504F\u79BB\u4FDD\u5B58\u7684\u5DE5\u4F5C\u5E73\u9762");return{...i,origin:[...r[0]],plane:"auto"}}var dt=(r,e)=>{let t=rt(r,e);return[t[0],t[2],t[1]]},Rn=(r,e)=>on([r[0],r[2],r[1]],e);function Xs(r){if(!Array.isArray(r)||r.length!==2||r.some(a=>!Array.isArray(a)||a.length!==3||a.some((c,l)=>!Number.isFinite(c)||c<0||c>(l===1?4094:4095))))throw Error("\u5761\u9053\u9700\u8981\u4E24\u4E2A\u6709\u6548\u7684\u573A\u5730\u5750\u6807");let[e,t]=r,n=t[0]-e[0],i=t[2]-e[2],s=t[1]-e[1],o=Math.hypot(n,i);if(o<.01)throw Error("\u8D77\u70B9\u4E0E\u7EC8\u70B9\u4E0D\u80FD\u5728\u540C\u4E00\u5730\u9762\u4F4D\u7F6E");return{horizontal:o,rise:s,length:Math.hypot(o,s),percent:s/o*100,angle:Math.atan2(s,o)*180/Math.PI,slopeX:s*n/(o*o),slopeZ:s*i/(o*o)}}function Fa(r,e,t){let n=Xs(r),i=r[0],s=r[1],o=s[0]-i[0],a=s[2]-i[2],c=Math.max(0,Math.min(1,((e-i[0])*(s[0]-i[0])+(t-i[2])*(s[2]-i[2]))/(o*o+a*a)));return i[1]+c*n.rise}var za=r=>r?.min?.length===3&&r?.max?.length===3&&r.min.every((e,t)=>Number.isInteger(e)&&Number.isInteger(r.max[t])&&e>=0&&r.max[t]<4096&&e<=r.max[t]);function Fe(r,{axes:e=[0,1,2]}={}){if(!Array.isArray(e)||!e.length||e.some(s=>![0,1,2].includes(s)))throw Error("\u6295\u5F71\u8F74\u65E0\u6548");let t=s=>L(...s.map((o,a)=>e.includes(a)?o:0));if(!r)return()=>!0;if(r.regions&&!za(r))throw Error("\u7EC4\u5408\u9009\u533A\u9700\u8981\u6709\u6548\u5916\u63A5\u8303\u56F4");let n=r.regions||[{...r,operation:"replace"}];if(!Array.isArray(n)||!n.length)throw Error("\u9009\u533A\u9700\u8981\u81F3\u5C11\u4E00\u4E2A\u533A\u57DF");let i=n.map((s,o)=>{if(!(za(s)||s.members&&s.min===void 0&&s.max===void 0)||!["replace","add","subtract","intersect"].includes(s.operation||"replace"))throw Error("\u9009\u533A\u533A\u57DF\u6216\u7EC4\u5408\u65B9\u5F0F\u65E0\u6548");if(s.members!==void 0&&s.members!==null&&(!Array.isArray(s.members)||s.members.some(a=>Array.isArray(a)?a.length!==3||a.some(c=>!Number.isInteger(c)||c<0||c>=4096):!Number.isInteger(a)||a<0||a>=4096**3)))throw Error("\u9009\u533A\u6210\u5458\u5750\u6807\u65E0\u6548");return{min:[0,0,0],max:[4095,4095,4095],...s,operation:s.operation||"replace",keys:s.members?new Set(s.members.map(a=>t(Array.isArray(a)?a:Z(a)))):null}});return s=>{if(r.min&&r.max&&e.some(a=>s[a]<r.min[a]||s[a]>r.max[a]))return!1;let o=!1;for(let a of i){let c=e.every(l=>s[l]>=a.min[l]&&s[l]<=a.max[l])&&(!a.keys||a.keys.has(t(s)));o=a.operation==="replace"?c:a.operation==="add"?o||c:a.operation==="subtract"?o&&!c:o&&c}return o}}function ri(r,e){let t=e.selectionMode||(e.selection?"volume":"none");if(!["none","volume","footprint"].includes(t))throw Error("\u672A\u77E5\u751F\u6210\u8303\u56F4\u6A21\u5F0F");if(t==="none")return r;if(!e.selection)throw Error("\u8BF7\u5148\u9009\u62E9\u4F5C\u7528\u8303\u56F4\uFF0C\u518D\u751F\u6210\u9884\u89C8");let n=Fe(e.selection,t==="footprint"?{axes:[0,2]}:{}),i=r.operations.filter(l=>n(l.pos)),s=r.operations.length-i.length,o={full:0,slab:0,stairs:0};for(let l of i)l.state&&o[/_stairs$/.test(l.state.Name)?"stairs":/_slab$/.test(l.state.Name)?"slab":"full"]++;let a=r.overlap?{...r.overlap,allPositions:r.overlap.allPositions.filter(l=>n(l))}:null;a&&(a.count=a.allPositions.length,a.positions=a.allPositions.slice(0,256));let c=r.blocked?.code==="SWEEP_SELF_OVERLAP"&&!a?.count?null:r.blocked;return{...r,overlap:a||r.overlap,blocked:c,operations:i,usedRoles:o,scope:{mode:t,filtered:s,accepted:i.length},warnings:[...r.warnings.filter(l=>!a||!l.startsWith("\u76F8\u9694\u8F83\u8FDC\u7684\u8F68\u9053\u7247\u6BB5")),...a?.count?[`\u76F8\u9694\u8F83\u8FDC\u7684\u8F68\u9053\u7247\u6BB5\u5728\u9009\u533A\u5185 ${a.count} \u683C\u4F4D\u7F6E\u91CD\u53E0\uFF1B\u8BF7\u68C0\u67E5\u7A7A\u8154\u4E0E\u63A5\u5934`]:[],...s?[`\u4F5C\u7528\u8303\u56F4\u5916\u7684 ${s} \u683C\u5019\u9009\u6539\u52A8\u5DF2\u6392\u9664`]:[]]}}function Ba(r,e={}){if(!r.supports)return r;let t=new Map;for(let o of r.operations)if(o.reason==="\u81EA\u52A8\u843D\u5730\u652F\u6491"){let a=o.pos[0]+4096*o.pos[2];t.set(a,(t.get(a)||0)+1)}let n=e.selection&&e.selectionMode!=="none"?Fe(e.selection,{axes:[0,2]}):()=>!0,i=r.supports.records.filter(o=>n([o.x,o.deckY,o.z])).map(o=>{let a=t.get(o.x+4096*o.z)||0;return{...o,accepted:a,status:o.status==="grounded"&&a!==o.planned?"clipped":o.status}}),s={requested:i.length,grounded:i.filter(o=>o.status==="grounded").length,missing:i.filter(o=>o.status==="missing").length,blocked:i.filter(o=>o.status==="blocked").length,buried:i.filter(o=>o.status==="buried").length,clipped:i.filter(o=>o.status==="clipped").length};return{...r,supports:{...s,records:i.slice(0,256),truncated:i.length>256},warnings:[...r.warnings,...[["missing","\u7F3A\u5C11\u771F\u5B9E\u5730\u9762"],["blocked","\u6C34\u9762\u6216\u65E2\u6709\u65B9\u5757\u963B\u6321"],["buried","\u5730\u9762\u9AD8\u4E8E\u8BBE\u8BA1\u9762"]].flatMap(([o,a])=>s[o]?[a+"\uFF1A"+s[o]+" \u5217\u672A\u751F\u6210\u5B8C\u6574\u652F\u6491"]:[]),...s.clipped?["\u9009\u533A\u8303\u56F4\u622A\u65AD "+s.clipped+" \u5217\u652F\u6491\uFF0C\u672A\u8BA1\u4E3A\u5B8C\u6574\u843D\u5730"]:[]]}}function Va(r,e={}){if(!r.surfaceFit)return r;let t=e.selection&&e.selectionMode!=="none"?Fe(e.selection,{axes:[0,2]}):()=>!0,n=r.surfaceFit.records.filter(i=>t(i.pos));return{...r,surfaceFit:{skipped:n.length,missing:n.filter(i=>i.reason==="missing").length,water:n.filter(i=>i.reason==="water").length,obstacle:n.filter(i=>i.reason==="obstacle").length,records:n.slice(0,256),truncated:n.length>256}}}var Pd={xz:[0,2,1],xy:[0,1,2],yz:[2,1,0]};function qs(r){if(r.workplane){let c=Xe(r.workplane),l=r.points.map(p=>dt(p,c)),u={...r,workplane:null,plane:"xz",points:l.map(p=>[...p]),referencePoints:r.referencePoints?.map(p=>dt(p,c))};if(r.planeLock&&r.kind!=="box")for(let p of u.points)p[1]=0;let h=qs(u),d=r.points.reduce((p,m)=>m.reduce((g,y)=>Math.max(g,Math.abs(y)),p),Math.max(1,...c.origin.map(Math.abs))),f=32*Number.EPSILON*d;return{...r,points:h.points.map((p,m)=>p.every((g,y)=>Math.abs(g-l[m][y])<=f)?[...r.points[m]]:Rn(p,c))}}let e={...r,points:r.points.map(c=>[...c])},t=e.points,[n,i,s]=Pd[e.plane||"xz"],o=Number(e.snap??.5);if(![0,.5,1].includes(o))throw Error("\u5438\u9644\u7CBE\u5EA6\u5E94\u4E3A\u534A\u683C\u3001\u6574\u683C\u6216\u81EA\u7531");if(o&&!e.snapApplied)for(let c of t)for(let l=0;l<3;l++)c[l]=Math.round(c[l]/o)*o;if(e.planeLock&&e.kind!=="box")for(let c of t)c[s]=t[0][s];let a=e.constraint||"free";if(e.kind==="line"){let c=t[0],l=t.at(-1);if(a==="horizontal"&&(l[i]=c[i]),a==="vertical"&&(l[n]=c[n]),["parallel","perpendicular"].includes(a)){let u=e.referencePoints;if(!u?.length||u.length<2)throw Error("\u8BF7\u9009\u62E9\u4E00\u6761\u53C2\u8003\u76F4\u7EBF");let h=u.at(-1)[n]-u[0][n],d=u.at(-1)[i]-u[0][i],f=Math.hypot(h,d);if(f<1e-6)throw Error("\u53C2\u8003\u7EBF\u6CA1\u6709\u65B9\u5411");a==="perpendicular"&&([h,d]=[-d,h]);let p=Math.hypot(l[n]-c[n],l[i]-c[i]),m=(l[n]-c[n])*h+(l[i]-c[i])*d<0?-1:1;l[n]=c[n]+h/f*p*m,l[i]=c[i]+d/f*p*m}}else if(e.kind==="bezier"&&a==="symmetric"&&t.length===4){let c=t[0].map((l,u)=>(l+t[3][u])/2);t[2]=t[1].map((l,u)=>2*c[u]-l)}else if(a!=="free")throw Error("\u6B64\u7EA6\u675F\u9002\u7528\u4E8E\u76F4\u7EBF\u6216\u56DB\u70B9\u8D1D\u585E\u5C14\u66F2\u7EBF");return e}var Ys={xz:[0,2],xy:[0,1],yz:[2,1]},Ha=(r,e)=>Math.hypot(...r.map((t,n)=>t-e[n]));function Nd(r,e){let t=r.map(n=>[...n]);for(;t.length>1;)t=t.slice(0,-1).map((n,i)=>n.map((s,o)=>s*(1-e)+t[i+1][o]*e));return t[0]}function Wa(r){if(r.workplane){let u=Xe(r.workplane);return Wa({...r,workplane:null,plane:"xz",points:r.points.map(h=>dt(h,u))}).map(h=>Rn(h,u))}let{kind:e="bezier",points:t,plane:n="xz"}=r;if(!Array.isArray(t)||t.length<2||t.some(u=>u.length!==3||u.some(h=>!Number.isFinite(h))))throw Error("\u8BF7\u8BBE\u7F6E\u6709\u6548\u7684\u63A7\u5236\u70B9");let i=Math.max(1,Math.min(8,r.sampleDensity??8)),[s,o]=Ys[n]||Ys.xz,a=[],c=u=>a.push(u),l=(u,h)=>{let d=Math.max(1,Math.ceil(Ha(u,h)*i));if(d>16384)throw Error("\u5355\u6BB5\u8FC7\u957F\uFF0C\u8BF7\u62C6\u5206\u7ED8\u5236");for(let f=0;f<=d;f++)c(u.map((p,m)=>p+(h[m]-p)*f/d))};if(e==="line")l(t[0],t.at(-1));else{if(e==="spline")return ka(t,{closed:r.closed===!0,density:i});if(e==="bezier"){if(t.length<3||t.length>8)throw Error("\u8D1D\u585E\u5C14\u66F2\u7EBF\u9700\u8981 3\u20138 \u4E2A\u63A7\u5236\u70B9");let u=t.slice(1).reduce((d,f,p)=>d+Ha(f,t[p]),0),h=r.sampleCount??Math.min(8192,Math.max(24,Math.ceil(u*i)));if(!Number.isInteger(h)||h<24||h>8192)throw Error("\u8D1D\u585E\u5C14\u91C7\u6837\u6570\u5E94\u4E3A 24\u20138192 \u7684\u6574\u6570");for(let d=0;d<=h;d++)c(Nd(t,d/h))}else if(e==="rectangle"){let u=t[0],h=t[1],d=[u,[...u],[...h],[...u]];d[1][s]=h[s],d[3][o]=h[o];for(let f=0;f<4;f++)l(d[f],d[(f+1)%4])}else if(e==="polyline"){for(let u=0;u<t.length-1;u++)l(t[u],t[u+1]);if(r.closed===!0){if(t.length<3)throw Error("\u95ED\u5408\u6298\u7EBF\u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u9876\u70B9");l(t.at(-1),t[0])}}else if(e==="polygon")for(let u=0;u<t.length;u++)l(t[u],t[(u+1)%t.length]);else if(["circle","ellipse","arc"].includes(e)){let u=t[0],h=Math.hypot(t[1][s]-u[s],t[1][o]-u[o]),d=e==="ellipse"?Math.abs(t[1][s]-u[s]):h,f=e==="ellipse"?Math.abs(t[1][o]-u[o]):h;if(d<.1||f<.1)throw Error("\u534A\u5F84\u8FC7\u5C0F\uFF0C\u8BF7\u62C9\u5F00\u63A7\u5236\u70B9");let p=0,m=2*Math.PI;if(e==="arc"){if(t.length<3)throw Error("\u5706\u5F27\u9700\u8981\u5706\u5FC3\u3001\u8D77\u70B9\u548C\u7EC8\u70B9");for(p=Math.atan2(t[1][o]-u[o],t[1][s]-u[s]),m=Math.atan2(t[2][o]-u[o],t[2][s]-u[s]);m<=p;)m+=2*Math.PI}let g=Math.max(24,Math.ceil((m-p)*Math.max(d,f)*i));if(g>16384)throw Error("\u56FE\u5F62\u8303\u56F4\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A\u7ED8\u5236");for(let y=0;y<=g;y++){let b=p+(m-p)*y/g,_=[...u];_[s]+=d*Math.cos(b),_[o]+=f*Math.sin(b),c(_)}}else if(e==="box"){let u=t[0].map((d,f)=>Math.min(d,t[1][f])),h=t[0].map((d,f)=>Math.max(d,t[1][f]));for(let d=0;d<3;d++)for(let f=0;f<4;f++){let p=[...u],m=[...u];[0,1,2].filter(y=>y!==d).forEach((y,b)=>p[y]=m[y]=f>>b&1?h[y]:u[y]),m[d]=h[d],l(p,m)}}else throw Error("\u672A\u77E5\u56FE\u5F62\u7C7B\u578B")}if(a.length>5e4)throw Error("\u8F85\u52A9\u7EBF\u70B9\u6570\u8FC7\u591A\uFF0C\u8BF7\u7F29\u5C0F\u8303\u56F4\u6216\u5206\u6BB5");return a}var Ga=new WeakMap;function Pn(r){let e=Ga.get(r);if(e?.overlay===r.overlay&&e.palette===r.palette.length)return e.columns;let t=new Map,n=new Map(r.cells);for(let[i,s]of r.overlay)s.state<0?n.delete(i):n.set(i,s);for(let i of n.values()){let s=i.pos[0]+4096*i.pos[2],o=t.get(s)||{ground:null,water:null,top:null,obstacles:[]},a=De(r.palette[i.state].Name);o.top=Math.max(o.top??-1,i.pos[1]),a==="ground"&&(o.ground=Math.max(o.ground??-1,i.pos[1])),a==="water"&&(o.water=Math.max(o.water??-1,i.pos[1])),(a==="building"||a==="plant")&&o.obstacles.push(i),t.set(s,o)}return Ga.set(r,{overlay:r.overlay,palette:r.palette.length,columns:t}),t}function Xa(r,e,t={}){let n=r.Name,i=n.replace(/_stairs$|_slab$/,"").replace(/_planks$/,"").replace(/bricks$/,"brick"),s=n.endsWith("_stairs")||n.endsWith("_slab")?[i+"s",i,i+"_planks"].find(o=>e.has(o)):n;return{full:t.full||{...r,Name:s||n},slab:t.slab||(e.has(i+"_slab")?{Name:i+"_slab"}:n.endsWith("_slab")?r:null),stairs:t.stairs||(e.has(i+"_stairs")?{Name:i+"_stairs"}:n.endsWith("_stairs")?r:null)}}function Dd(r,e,{state:t,available:n,roles:i={},voxel:s="smart",surface:o="top"}={}){let a=Xa(t,n,i),c=Math.round(r[1]*2)/2,l=Math.abs(e[1])/Math.max(.001,Math.hypot(e[0],e[2])),u=a.stairs&&(s==="stairs"||s==="smart"&&l>=.25&&l<=1.05&&Number.isInteger(c)),h=a.slab&&(s==="slab"||s==="smart"&&!u),d=Math.floor(r[0]+1e-8),f=Math.floor(r[2]+1e-8),p,m;if(u){p=o==="bottom"?Math.floor(c):Math.ceil(c)-1;let g=e[1]<0?-1:1,y=e[0]*g,b=e[2]*g,_=Math.abs(y)>Math.abs(b)?y>=0?"east":"west":b>=0?"south":"north";o==="bottom"&&(_={north:"south",south:"north",east:"west",west:"east"}[_]),m={...a.stairs,Properties:{...a.stairs.Properties,facing:_,half:o==="bottom"?"top":"bottom",shape:"straight",waterlogged:"false"}}}else if(h){p=Math.floor(o==="bottom"?c:c-1e-8);let g=o==="bottom"?Number.isInteger(c)?"bottom":"top":Number.isInteger(c)?"top":"bottom";m={...a.slab,Properties:{...a.slab.Properties,type:g,waterlogged:"false"}}}else p=o==="bottom"?Math.round(r[1]):Math.round(r[1])-1,m=a.full;return{pos:[d,p,f],state:m}}function Ld(r,e,t){let n=!1;for(let i=0,s=t.length-1;i<t.length;s=i++){let o=t[i],a=t[s];o[1]>e!=a[1]>e&&r<(a[0]-o[0])*(e-o[1])/(a[1]-o[1])+o[0]&&(n=!n)}return n}function Bt(r,e,t){return Va(Ba(ri(Ud(r,e,t),e),e),e)}function Ud(r,e,t){e={...qs(e),available:t};let n=Wa(e);if(e.guidesOnly&&(!e.terrain||e.terrain==="none"))return{guide:n,operations:[],warnings:[],usedRoles:{}};let i=["surface","supports","grade"].includes(e.terrain)?Pn(r):null,s=new Map,o=new Map,a=[],c={full:0,slab:0,stairs:0},l=Xa(e.state,t,e.roles);e.voxel!=="cube"&&!l.slab&&!l.stairs&&a.push("\u6CA1\u6709\u5339\u914D\u7684\u534A\u7816\u6216\u697C\u68AF\uFF0C\u6682\u7528\u4E3B\u4F53\u65B9\u5757\uFF1B\u53EF\u624B\u52A8\u6307\u5B9A\u66F2\u7EBF\u7D20\u6750");let u=(_,v,M="\u56FE\u5F62\u653E\u7F6E")=>{if(_.some(w=>!Number.isInteger(w)||w<0||w>=4096))throw Error("\u56FE\u5F62\u8D85\u51FA\u5F53\u524D\u573A\u666F\u8FB9\u754C");let x=L(..._),E=s.get(x);E?.state?.Name===v?.Name&&/_slab$/.test(v?.Name)&&E.state.Properties?.type!==v.Properties?.type&&(v={...v,Properties:{...v.Properties,type:"double"}}),s.set(x,{type:"set",pos:_,state:v,reason:M})};e.terrain==="surface"&&(n=n.map(_=>{let v=i.get(Math.floor(_[0])+4096*Math.floor(_[2]));return v?.ground!==null&&v?.ground!==void 0?[_[0],v.ground+(e.surface==="bottom"?1:e.voxel==="cube"?2:1.5)+(e.offset||0),_[2]]:_}));let h=e.workplane?Xe(e.workplane):null,d=h?[0,2]:Ys[e.plane||"xz"];if(!d)throw Error("\u7ED8\u5236\u5E73\u9762\u65E0\u6548\uFF0C\u8BF7\u9009\u62E9\u5DE5\u4F5C\u5E73\u9762");let f=n.map((_,v)=>({p:_,t:n[Math.min(n.length-1,v+1)].map((M,x)=>M-n[Math.max(0,v-1)][x])}));if(e.fill&&e.kind==="spline"&&e.closed){let _=[0,1,2].find(M=>!d.includes(M)),v=h?rt(n[0],h)[2]:n[0][_];if(n.some(M=>Math.abs((h?rt(M,h)[2]:M[_])-v)>1e-6))throw Error("\u586B\u5145\u9700\u8981\u5E73\u9762\u7684\u95ED\u5408\u66F2\u7EBF\uFF1B\u8BF7\u9501\u5B9A\u5DE5\u4F5C\u5E73\u9762\u6216\u53EA\u751F\u6210\u8DEF\u5F84")}if(e.fill&&["polyline","spline"].includes(e.kind)&&!e.closed)throw Error(e.kind==="spline"?"\u5F00\u653E\u66F2\u7EBF\u4E0D\u80FD\u586B\u5145\uFF0C\u8BF7\u95ED\u5408\u8DEF\u5F84\u6216\u53D6\u6D88\u586B\u5145":"\u5F00\u653E\u6298\u7EBF\u4E0D\u80FD\u586B\u5145\uFF0C\u8BF7\u95ED\u5408\u8DEF\u5F84\u6216\u53D6\u6D88\u586B\u5145");if(e.fill&&(["rectangle","circle","ellipse","polygon"].includes(e.kind)||["polyline","spline"].includes(e.kind)&&e.closed)){let[_,v]=d,M=n.map(S=>h?rt(S,h).slice(0,2):[S[_],S[v]]),x=[Math.floor(Math.min(...M.map(S=>S[0]))),Math.floor(Math.min(...M.map(S=>S[1])))],E=[Math.ceil(Math.max(...M.map(S=>S[0]))),Math.ceil(Math.max(...M.map(S=>S[1])))];if((E[0]-x[0])*(E[1]-x[1])>65536)throw Error("\u586B\u5145\u8303\u56F4\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A");f=[];let w=h?.5:1;for(let S=x[0];S<=E[0];S+=w)for(let T=x[1];T<=E[1];T+=w)if(Ld(S+w/2,T+w/2,M)){let C=h?on([S+w/2,T+w/2,rt(n[0],h)[2]],h):[...n[0]];h||(C[_]=S+.5,C[v]=T+.5),f.push({p:C,t:[1,0,0]})}}if(e.kind==="box"&&e.fill&&h){let _=dt(e.points[0],h),v=dt(e.points[1],h),M=_.map((S,T)=>Math.min(S,v[T])),x=_.map((S,T)=>Math.max(S,v[T])),E=[0,1,2].map(S=>Math.floor(Math.min(...n.map(T=>T[S])))),w=[0,1,2].map(S=>Math.ceil(Math.max(...n.map(T=>T[S]))));if(w.reduce((S,T,C)=>S*(T-E[C]+1),1)>25e4)throw Error("\u4F53\u79EF\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A");for(let S=E[0];S<=w[0];S++)for(let T=E[1];T<=w[1];T++)for(let C=E[2];C<=w[2];C++)dt([S+.5,T+.5,C+.5],h).every((A,I)=>A>=M[I]&&A<=x[I])&&u([S,T,C],e.state);return{guide:n,operations:[...s.values()],warnings:a,usedRoles:c}}if(e.kind==="box"&&e.fill){let _=e.points[0].map((M,x)=>Math.floor(Math.min(M,e.points[1][x]))),v=e.points[0].map((M,x)=>Math.floor(Math.max(M,e.points[1][x])));if(v.reduce((M,x,E)=>M*(x-_[E]+1),1)>25e4)throw Error("\u4F53\u79EF\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A");for(let M=_[1];M<=v[1];M++)for(let x=_[0];x<=v[0];x++)for(let E=_[2];E<=v[2];E++)u([x,M,E],e.state);return{guide:n,operations:[...s.values()],warnings:a,usedRoles:c}}let p=(_,v,M,x)=>{let E=_+4096*v;o.has(E)||o.set(E,{pos:[_,Math.floor(M),v],reason:x})},m=Math.max(1,Math.min(16,e.width||1)),g=[],y=null,b=null;for(let _ of f)for(let v=-(m-1)/2;v<=(m-1)/2;v++){let M=_.t,x=[..._.p],E=d[0],w=d[1],S=Math.hypot(M[E],M[w])||1;if(h){let N=H(M,h.u),D=H(M,h.v),U=Math.hypot(N,D)||1;for(let F=0;F<3;F++)x[F]+=(-D*h.u[F]+N*h.v[F])/U*v}else x[E]+=-M[w]/S*v,x[w]+=M[E]/S*v;let T=Math.floor(x[0]),C=Math.floor(x[2]),P=i?.get(T+4096*C);if(e.terrain==="surface"){if(P?.ground===null||!P){a.push("\u7F3A\u5C11\u771F\u5B9E\u5730\u9762\u7684\u5217\u5DF2\u7565\u8FC7"),p(T,C,x[1],"missing");continue}x[1]=P.ground+(e.surface==="bottom"?1:e.voxel==="cube"?2:1.5)+(e.offset||0),e.voxel==="smart"&&e.surface!=="bottom"&&Math.abs(M[1])/Math.max(.01,Math.hypot(M[0],M[2]))>=.25&&(x[1]=Math.ceil(x[1]))}let A=Dd(x,M,e),I=/_stairs$/.test(A.state.Name)?"stairs":/_slab$/.test(A.state.Name)?"slab":"full";c[I]++,u(A.pos,A.state),g.push(A),y&&v===-(m-1)/2&&Math.abs(A.pos[0]-y.pos[0])===1&&Math.abs(A.pos[2]-y.pos[2])===1&&u([A.pos[0],A.pos[1],y.pos[2]],A.state,"\u66F2\u7EBF\u8FDE\u63A5\u8865\u683C"),v===-(m-1)/2&&(y=A)}if(e.terrain==="supports"){let _=Math.max(1,e.spacing||4),v=new Set,M=[],x=new Set,E=0;for(let w of g){let[S,T,C]=w.pos,P=S+4096*C;if(v.has(P)||(v.add(P),E++%_))continue;let A=i.get(P),I={x:S,z:C,deckY:T,groundY:A?.ground??null,planned:0,status:"grounded"};if(M.push(I),A?.ground===null||!A){I.status="missing";continue}if(A.ground>=T){I.status="buried",x.add(P);continue}let N=!1;for(let D=A.ground+1;D<T;D++)if(r.at([S,D,C])){N=!0;break}if(N){I.status="blocked";continue}for(let D=A.ground+1;D<T;D++)u([S,D,C],e.roles?.full||e.state,"\u81EA\u52A8\u843D\u5730\u652F\u6491"),I.planned++}for(let[w,S]of s)x.has(S.pos[0]+4096*S.pos[2])&&s.delete(w);b={records:M}}if(e.terrain==="grade"){let _=[...s.values()],v=new Map(s),M=new Map(_.map(E=>[E.pos[0]+4096*E.pos[2],E.pos[1]-1])),x=new Set;for(let[E,w]of M){let S=E%4096,T=Math.floor(E/4096),C=i.get(E);if(C?.obstacles.some(I=>{let N=v.get(L(...I.pos));return N&&JSON.stringify(r.palette[I.state])!==JSON.stringify(N.state)})){x.add(E),a.push("\u9053\u8DEF\u5019\u9009\u9047\u5230\u5EFA\u7B51\u6216\u690D\u88AB\uFF0C\u6574\u5217\u5DF2\u4FDD\u7559");continue}let A=qa(r,C,S,T,w,e.earthState||{Name:"minecraft:dirt"});A.skipped&&x.add(E);for(let I of A.operations)s.set(L(...I.pos),I);a.push(...A.warnings)}for(let[E,w]of s)x.has(w.pos[0]+4096*w.pos[2])&&s.delete(E);x.size&&a.push("\u9053\u8DEF\u5728 "+x.size+" \u5217\u4FDD\u7559\u6C34\u9762\u3001\u969C\u788D\u6216\u7F3A\u5931\u5730\u9762\uFF0C\u672A\u653E\u7F6E\u6216\u6316\u586B")}if(e.terrain==="surface"){let _=new Set;for(let[v,M]of s){let x=i.get(M.pos[0]+4096*M.pos[2]),E=r.at(M.pos),w=E?De(r.palette[E.state].Name):null;(!x||x.ground===null||x.water!==null&&x.water>=x.ground||E&&["building","plant"].includes(w)&&JSON.stringify(r.palette[E.state])!==JSON.stringify(M.state))&&(s.delete(v),_.add(M.pos[0]+4096*M.pos[2]),p(M.pos[0],M.pos[2],M.pos[1],!x||x.ground===null?"missing":x.water!==null&&x.water>=x.ground?"water":"obstacle"))}_.size&&a.push("\u8D34\u5730\u8DEF\u5F84\u5728 "+_.size+" \u5217\u4FDD\u7559\u6C34\u9762\u3001\u969C\u788D\u6216\u7F3A\u5931\u5730\u9762\uFF0C\u5019\u9009\u65B9\u5757\u5DF2\u7565\u8FC7")}if(["surface","grade","supports"].includes(e.terrain)){c.full=c.slab=c.stairs=0;for(let _ of s.values())_.state&&c[/_stairs$/.test(_.state.Name)?"stairs":/_slab$/.test(_.state.Name)?"slab":"full"]++}if(s.size>25e4)throw Error("\u672C\u6B21\u56FE\u5F62\u8FC7\u5927\uFF0C\u8BF7\u5206\u6BB5\u751F\u6210");return{guide:n,operations:[...s.values()],warnings:[...new Set(a)],usedRoles:c,...b?{supports:b}:{},...e.terrain==="surface"?{surfaceFit:{records:[...o.values()]}}:{}}}function qa(r,e,t,n,i,s){let o=[],a=[];if(e?.ground===null||!e)return{operations:o,skipped:!0,warnings:["\u7F3A\u5C11\u771F\u5B9E\u5730\u9762\u7684\u533A\u57DF\u672A\u5904\u7406"]};if(e.water!==null&&e.water>=Math.min(i,e.ground))return{operations:o,skipped:!0,warnings:["\u6CB3\u6C34\u4E0E\u6C34\u9762\u4FDD\u6301\u4E0D\u53D8"]};let c=Math.min(e.ground+1,i+1),l=Math.max(e.ground,i);if(e.obstacles.some(u=>u.pos[1]>=c&&u.pos[1]<=Math.max(l,e.ground+1)))return{operations:o,skipped:!0,warnings:["\u5EFA\u7B51\u6216\u690D\u88AB\u963B\u6321\u7684\u5217\u5DF2\u4FDD\u7559"]};for(let u=e.ground;u>i;u--){let h=r.at([t,u,n]);h&&De(r.palette[h.state].Name)==="ground"&&o.push({type:"set",pos:[t,u,n],state:null,reason:"\u81EA\u52A8\u6316\u65B9"})}for(let u=e.ground+1;u<=i;u++)o.push({type:"set",pos:[t,u,n],state:s,reason:"\u81EA\u52A8\u586B\u65B9"});return{operations:o,warnings:a}}function Ya(r,e){return ri(kd(r,e),e)}function kd(r,{min:e,max:t,mode:n="flatten",y:i,state:s={Name:"minecraft:dirt"},radius:o=1,slopeX:a=0,slopeZ:c=0,slopePoints:l=null}){if(e.length!==2||t.length!==2||[...e,...t].some(m=>!Number.isInteger(m)||m<0||m>=4096)||e.some((m,g)=>m>t[g])||(t[0]-e[0]+1)*(t[1]-e[1]+1)>65536)throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u5730\u5F62\u8303\u56F4\uFF0C\u8F83\u5927\u8303\u56F4\u8BF7\u5206\u533A");n==="slope"&&l&&Xs(l);let u=Pn(r),h=[],d=[],f=[],p=0;for(let m=e[0];m<=t[0];m++)for(let g=e[1];g<=t[1];g++){let y=u.get(m+4096*g);if(y?.ground===null||!y){f.push("\u65E0\u5730\u9762\u6570\u636E\u7684\u5217\u672A\u5904\u7406");continue}p++;let b=i;if(n==="smooth"){let v=[];for(let M=-o;M<=o;M++)for(let x=-o;x<=o;x++){let E=u.get(m+M+4096*(g+x));E?.ground!==null&&E?.ground!==void 0&&E.water===null&&v.push(E.ground)}v.sort((M,x)=>M-x),b=v.length?v[Math.floor(v.length/2)]:y.ground}if(n==="slope"&&(b=l?Fa(l,m,g):i+(m-e[0])*a+(g-e[1])*c),b=Math.round(b),!Number.isInteger(b)||b<0||b>4094)throw Error("\u76EE\u6807\u9AD8\u5EA6\u8D85\u51FA\u573A\u666F");let _=qa(r,y,m,g,b,s);h.push(..._.operations),f.push(..._.warnings),(m===e[0]||m===t[0]||g===e[1]||g===t[1])&&d.push([m+.5,b+1,g+.5])}if(!p)throw Error("\u9009\u533A\u6CA1\u6709\u771F\u5B9E\u5730\u9762\u6570\u636E\uFF0C\u8BF7\u5148\u5BFC\u5165\u5730\u5F62");if(h.length>25e4)throw Error("\u571F\u65B9\u91CF\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A\u5904\u7406");return{guide:d,operations:h,warnings:[...new Set(f)],usedRoles:{}}}var er=(r,e)=>[r[1]*e[2]-r[2]*e[1],r[2]*e[0]-r[0]*e[2],r[0]*e[1]-r[1]*e[0]],ja=r=>{let e=Math.hypot(...r);return r.map(t=>t/e)};function an(r){if(!Array.isArray(r)||r.length<2||r.some(i=>i?.length!==3||i.some(s=>!Number.isFinite(s))))throw Error("\u9700\u8981\u6709\u6548\u8DEF\u5F84");let e=[],t=0;for(let i=1;i<r.length;i++){let s=xe(r[i],r[i-1]),o=Math.hypot(...s);o>1e-8&&(e.push({a:r[i-1],b:r[i],d:s,length:o,start:t,normal:ja(s)}),t+=o)}if(!e.length)throw Error("\u8DEF\u5F84\u6CA1\u6709\u6709\u6548\u957F\u5EA6");let n=Oa(e[0].a,e[0].normal);for(let i=0;i<e.length;i++){let s=e[i].normal;if(i){let o=er(n.normal,s),a=Math.max(-1,Math.min(1,H(n.normal,s))),c;if(a<-1+1e-8||Math.hypot(...o)<1e-8)c=n.u;else{let l=er(o,n.u),u=er(o,l);c=n.u.map((h,d)=>h+l[d]+u[d]/(1+a))}c=ja(xe(c,s.map(l=>l*H(c,s)))),n={...n,u:c,v:er(s,c),normal:s}}e[i].frame={...n,origin:[...e[i].a]}}return{segments:e,totalLength:t}}function Ja(r,e=.5){if(!Number.isFinite(e)||e<0||e>1)throw Error("\u8DEF\u5F84\u4F4D\u7F6E\u6BD4\u4F8B\u9700\u8981 0\u20131");let t=an(r),n=e*t.totalLength,i=Math.max(0,t.segments.findIndex((c,l)=>n<=c.start+c.length||l===t.segments.length-1)),s=t.segments[i],o=Math.max(0,Math.min(1,(n-s.start)/s.length)),a={...s.frame,origin:s.a.map((c,l)=>c+s.d[l]*o)};return{frame:Xe(a),distance:n,totalLength:t.totalLength,station:e,segment:i}}function $a(r,e,t){let n=r.design.workplanes||[],i=t.id||t.plane?.id;if(e==="workplanes.remove"){if(!n.some(a=>a.id===i))throw Error("\u5E73\u9762\u5DF2\u4E0D\u5B58\u5728");return r.design.workplanes=n.filter(a=>a.id!==i),{removed:i}}let s=structuredClone(t.plane);if(typeof s?.name!="string"||!s.name.trim())throw Error("\u8BF7\u586B\u5199\u5E73\u9762\u540D\u79F0");if(s.source?.mode&&s.source.mode!=="snapshot")throw Error("\u5E73\u9762\u5E93\u5F53\u524D\u4FDD\u5B58\u5FEB\u7167\uFF0C\u81EA\u52A8\u8DDF\u968F\u53C2\u7167\u5C1A\u672A\u652F\u6301");if(s.name=s.name.trim(),s.frame=Xe(s.frame),t.space==="world"){if(!r.originConfirmed)throw Error("\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");s.frame.origin=s.frame.origin.map((a,c)=>a-r.origin[c])}if(n.some(a=>a.name===s.name&&a.id!==i))throw Error("\u540C\u540D\u5E73\u9762\u5DF2\u5B58\u5728\uFF0C\u8BF7\u9009\u62E9\u540E\u66F4\u65B0");if(i&&!n.some(a=>a.id===i))throw Error("\u8981\u66F4\u65B0\u7684\u5E73\u9762\u5DF2\u4E0D\u5B58\u5728");s.id=i||crypto.randomUUID(),s.source=s.source?{...s.source,mode:"snapshot"}:null;let o=n.findIndex(a=>a.id===s.id);return r.design.workplanes=structuredClone(n),o<0?r.design.workplanes.push(s):r.design.workplanes[o]=s,{plane:s}}function Za(r,e="local"){let t=structuredClone(r.design.workplanes||[]);if(e==="world"){if(!r.originConfirmed)throw Error("\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");for(let n of t)n.frame.origin=n.frame.origin.map((i,s)=>i+r.origin[s])}return t}var Od=(r,e)=>{let t=Math.cos(e),n=Math.sin(e);return{...r,u:r.u.map((i,s)=>i*t+r.v[s]*n),v:r.v.map((i,s)=>i*t-r.u[s]*n)}};function js(r,e,t={}){if(!r.closed||t.closeFrame===!1)return r;let n=an([...e,e.find((u,h)=>h>0&&Math.hypot(...u.map((d,f)=>d-e[0][f]))>1e-8)]),i=n.segments[0].frame,s=n.segments.at(-1).frame,o=Math.atan2(H(s.u,i.v),H(s.u,i.u)),a=(u,h)=>Od(u.frame,-o*h/r.totalLength),c=r.polyAt||(()=>r.poly),l=[];for(let u of r.segments){let h=Math.max(1,Math.ceil(u.length),Math.ceil(Math.abs(o)*u.length/r.totalLength/(Math.PI/36)));for(let d=0;d<h;d++){let f=u.start+u.length*d/h,p=u.length/h,m=u.a.map((x,E)=>x+u.normal[E]*(f-u.start)),g=m.map((x,E)=>x+u.normal[E]*p),y={...u,a:m,b:g,start:f,length:p,startNormal:d===0?u.startNormal:u.normal,endNormal:d===h-1?u.endNormal:u.normal};y.rings=[[],[]];for(let[x,E,w,S]of[[0,f,m,y.startNormal],[1,f+p,g,y.endNormal]]){let T=a(y,E);for(let C of c(E)){let P=T.u.map((I,N)=>I*C[0]+T.v[N]*C[1]),A=-H(P,S)/H(y.normal,S);y.rings[x].push(w.map((I,N)=>I+P[N]+y.normal[N]*A))}}let b=Math.max(...[...c(f),...c(f+p)].map(x=>Math.hypot(...x))),_=x=>Math.abs(H(y.normal,x)),v=x=>Math.sqrt(Math.max(0,1-_(x)**2))/_(x),M=b*(1+Math.max(v(y.startNormal),v(y.endNormal)))+1e-6;y.bounds={min:m.map((x,E)=>Math.floor(Math.min(x,g[E])-M)),max:m.map((x,E)=>Math.ceil(Math.max(x,g[E])+M))},l.push(y)}}return{...r,segments:l,frameAt:a,closure:{corrected:!0,residualDegrees:o*180/Math.PI},warnings:r.warnings.filter(u=>!u.includes("\u95ED\u5408\u8F68\u9053\u8BF7\u68C0\u67E5")).concat("\u95ED\u5408\u8F68\u9053\u65B9\u5411\u5DF2\u6821\u6B63\uFF1B\u4E0D\u540C\u9996\u5C3E\u5F62\u72B6\u548C\u81EA\u4EA4\u4ECD\u9700\u68C0\u67E5")}}var Js=(r,e)=>[r[1]*e[2]-r[2]*e[1],r[2]*e[0]-r[0]*e[2],r[0]*e[1]-r[1]*e[0]],Ka=r=>{let e=Math.hypot(...r);return r.map(t=>t/e)},Fd=(r,e,t)=>{let n=!1;for(let i=0,s=t.length-1;i<t.length;s=i++){let o=t[i],a=t[s];o[1]>e!=a[1]>e&&r<(a[0]-o[0])*(e-o[1])/(a[1]-o[1])+o[0]&&(n=!n)}return n};function zd(r,e,t){let n=1/0;for(let i=0;i<t.length;i++){let s=t[i],o=t[(i+1)%t.length],a=o[0]-s[0],c=o[1]-s[1],l=Math.max(0,Math.min(1,((r-s[0])*a+(e-s[1])*c)/(a*a+c*c||1)));n=Math.min(n,Math.hypot(r-s[0]-l*a,e-s[1]-l*c))}return n}function tr(r,e,t=null,{profilePlacement:n="asDrawn",anchorStation:i=null}={}){if(!["asDrawn","center"].includes(n))throw Error("\u672A\u77E5\u622A\u9762\u5B9A\u4F4D\u65B9\u5F0F");let s=In(e,"auto",t),o=t?Xe(t).origin:e.reduce((x,E)=>x.map((w,S)=>w+E[S]/e.length),[0,0,0]),a=an(r),c=null,l=1/0;for(let x of a.segments){let E=Math.max(0,Math.min(x.length,H(xe(o,x.a),x.normal))),w=x.a.map((T,C)=>T+x.normal[C]*E),S=Math.hypot(...xe(o,w));S<l&&(l=S,c={point:w,frame:x.frame,distance:x.start+E})}if(i!==null){if(!Number.isFinite(i)||i<0||i>1)throw Error("\u622A\u9762\u4F4D\u7F6E\u6BD4\u4F8B\u9700\u8981 0\u20131");let x=i*a.totalLength,E=a.segments.find(S=>x<=S.start+S.length)||a.segments.at(-1),w=Math.max(0,Math.min(E.length,x-E.start));c={point:E.a.map((S,T)=>S+E.normal[T]*w),frame:E.frame,distance:x}}let u=Js(s.normal,c.frame.normal),h=Math.max(-1,Math.min(1,H(s.normal,c.frame.normal))),d=s.u;if(h>-1+1e-8&&Math.hypot(...u)>1e-8){let x=Js(u,s.u),E=Js(u,x);d=s.u.map((w,S)=>w+x[S]+E[S]/(1+h))}let f=Math.atan2(H(d,c.frame.v),H(d,c.frame.u)),p=Math.cos(f),m=Math.sin(f),g=n==="center"?e.reduce((x,E)=>x.map((w,S)=>w+E[S]/e.length),[0,0,0]):c.point,y=e.map(x=>[H(xe(x,g),s.u),H(xe(x,g),s.v)]).filter((x,E,w)=>!E||Math.hypot(x[0]-w[E-1][0],x[1]-w[E-1][1])>1e-8);if(y.length>1&&Math.hypot(...y[0].map((x,E)=>x-y.at(-1)[E]))<1e-8&&y.pop(),y.length<3)throw Error("\u622A\u9762\u9700\u8981\u6709\u6548\u95ED\u5408\u8F6E\u5ED3");let b=[];Math.abs(h)<.999&&b.push("\u622A\u9762\u5DF2\u6309\u5C3A\u5BF8\u521A\u6027\u5BF9\u9F50\u81F3\u8DEF\u5F84\u5207\u7EBF\uFF1B\u68C0\u67E5\u6A2A\u5411\u504F\u79FB");let _=Math.hypot(...xe(r[0],r.at(-1)))<1e-6;_&&b.push("\u95ED\u5408\u8F68\u9053\u8BF7\u68C0\u67E5\u622A\u9762\u63A5\u7F1D\uFF1B\u5F53\u524D\u6309\u5206\u6BB5\u65B9\u5757\u4F53\u79EF\u5408\u5E76");let v=(x,E,w)=>{let S=x.map((T,C)=>T+E[C]);return Math.hypot(...S)<1e-6||H(Ka(S),w)<.2?(b.push("\u8DEF\u5F84\u542B\u6025\u6298\u8FD4\uFF0C\u63A5\u5934\u6309\u5206\u6BB5\u5408\u5E76\uFF0C\u8BF7\u68C0\u67E5\u81EA\u4EA4"),w):Ka(S)};return{segments:a.segments.map((x,E,w)=>{let S={...x.frame,u:x.frame.u.map((N,D)=>N*p+x.frame.v[D]*m),v:x.frame.v.map((N,D)=>N*p-x.frame.u[D]*m)},T=w[E-1]||(_?w.at(-1):null),C=w[E+1]||(_?w[0]:null),P=T?v(T.normal,x.normal,x.normal):x.normal,A=C?v(x.normal,C.normal,x.normal):x.normal,I=[[],[]];for(let N of y){let D=S.u.map((z,G)=>z*N[0]+S.v[G]*N[1]),U=-H(D,P)/H(x.normal,P),F=x.length-H(D,A)/H(x.normal,A);I[0].push(x.a.map((z,G)=>z+D[G]+x.normal[G]*U)),I[1].push(x.a.map((z,G)=>z+D[G]+x.normal[G]*F))}return{...x,frame:S,startNormal:P,endNormal:A,rings:I}}),poly:y,warnings:[...new Set(b)],closed:_,totalLength:a.totalLength,anchorStation:c.distance/a.totalLength}}function Qa(r,e,t,n={}){let i=xe(t,e.a),s=H(i,e.startNormal),o=-H(xe(t,e.b),e.endNormal);if(s<-1e-8||o<-1e-8)return!1;let a=s/(s+o||1),c=e.start+e.length*Math.max(0,Math.min(1,a)),l=r.frameAt?r.frameAt(e,c):e.frame,u=H(i,l.u),h=H(i,l.v),d=r.polyAt?r.polyAt(c):r.poly;if(!Fd(u,h,d))return!1;let f=Number(n.thickness??1),p=e.start+Math.max(0,Math.min(e.length,H(i,e.normal))),m=!r.closed&&n.caps!==!1&&(p<f||r.totalLength-p<f);return!n.hollow||m||zd(u,h,d)<=f}function $s(r,e,t){let n=0;if(e.sweepOverlap!==void 0&&!["merge","stop"].includes(e.sweepOverlap))throw Error("\u76F8\u4EA4\u5904\u7406\u9700\u8981 merge \u6216 stop");let i=e.voxel==="smart"&&!e.cut,s=new Map,o={full:0,slab:0,stairs:0},a=new Map,c=new Map,l=Math.max(...r.poly.map(m=>Math.hypot(...m)),...(r.stations||[]).flatMap(m=>(r.polyAt?r.polyAt(m*r.totalLength):r.poly).map(g=>Math.hypot(...g)))),u=Math.max(2,l*2+1),h=(m,g)=>{let y=m.join(","),b=g.start+Math.max(0,Math.min(g.length,H(xe(m.map(v=>v+.5),g.a),g.normal))),_=a.get(y)||[];_.some(v=>{let M=Math.abs(b-v);return(r.closed?Math.min(M,r.totalLength-M):M)>u})&&c.set(y,m),_.push(b),a.set(y,_)};for(let m of r.segments){let g=m.rings.flat(),y=m.bounds?.min||[0,1,2].map(_=>Math.floor(Math.min(...g.map(v=>v[_])))),b=m.bounds?.max||[0,1,2].map(_=>Math.ceil(Math.max(...g.map(v=>v[_]))));if(n+=b.reduce((_,v,M)=>_*(v-y[M]),1),n>2e6)throw Error("\u626B\u63A0\u4F53\u79EF\u8FC7\u5927\uFF0C\u8BF7\u5206\u6BB5");for(let _=y[0];_<b[0];_++)for(let v=y[1];v<b[1];v++)for(let M=y[2];M<b[2];M++){let x=[_,v,M],E=Qa(r,m,x.map(S=>S+.5),e);if(E&&h(x,m),!i){E&&t(x);continue}let w=0;for(let S=0;S<2;S++)for(let T=0;T<2;T++)for(let C=0;C<2;C++)Qa(r,m,[_+.25+C*.5,v+.25+S*.5,M+.25+T*.5],e)&&(w|=1<<C+2*T+4*S);if(w||E){let S=x.join(","),T=s.get(S);s.set(S,{pos:x,mask:w|(T?.mask||0),center:E||T?.center})}}}let d=i?ji(e.state||{Name:"minecraft:stone_bricks"},e):null,f=0,p=0;for(let m of s.values()){let g=d(m.mask,m.center);g?(t(m.pos,g.state),o[g.role]++,g.fallback&&f++):m.mask&&p++}return i&&(p&&r.warnings.push(`\u6709 ${p} \u683C\u8584\u8FB9\u754C\u4E0D\u80FD\u7528\u53EF\u7528\u53D8\u4F53\u8868\u8FBE\uFF0C\u672A\u989D\u5916\u586B\u6210\u65B9\u5757`),f&&r.warnings.push(`\u8FB9\u754C\u6709 ${f} \u683C\u4E0D\u80FD\u7528\u73B0\u6709\u534A\u7816/\u697C\u68AF\u8868\u8FBE\uFF0C\u4FDD\u7559\u4E3B\u4F53\u65B9\u5757`),r.warnings.push("\u8FB9\u754C\u6309\u534A\u683C\u91C7\u6837\u62DF\u5408\uFF1B\u8BF7\u68C0\u67E5\u8584\u58C1\u4E0E\u7A7A\u8154")),r.overlap={allPositions:[...c.values()],count:c.size,positions:[...c.values()].slice(0,256),mode:e.sweepOverlap||"merge",separation:u},c.size&&(r.warnings.push(`\u76F8\u9694\u8F83\u8FDC\u7684\u8F68\u9053\u7247\u6BB5\u5728 ${c.size} \u683C\u4F4D\u7F6E\u91CD\u53E0\uFF1B\u8BF7\u68C0\u67E5\u7A7A\u8154\u4E0E\u63A5\u5934`),e.sweepOverlap==="stop"&&(r.blocked={code:"SWEEP_SELF_OVERLAP",message:"\u68C0\u6D4B\u5230\u626B\u63A0\u81EA\u91CD\u53E0\uFF1B\u8C03\u6574\u8DEF\u5F84\u6216\u660E\u786E\u9009\u62E9\u5408\u5E76\u76F8\u4EA4\u4F53\u79EF"})),{usedRoles:o,fallback:f}}function Bd(r,e=64){let t=r.map((i,s)=>Math.hypot(...i.map((o,a)=>o-r[(s+1)%r.length][a]))),n=t.reduce((i,s)=>i+s,0);if(!n)throw Error("\u622A\u9762\u6CA1\u6709\u6709\u6548\u5468\u957F");return Array.from({length:e},(i,s)=>{let o=n*s/e,a=0;for(;a<t.length-1&&o>t[a];)o-=t[a++];let c=o/(t[a]||1);return r[a].map((l,u)=>l+(r[(a+1)%r.length][u]-l)*c)})}function Vd(r,e){let t=u=>[0,1].map(h=>u.reduce((d,f)=>d+f[h],0)/u.length),n=t(r),i=t(e),s=(u,h)=>Math.sqrt(u.reduce((d,f)=>d+(f[0]-h[0])**2+(f[1]-h[1])**2,0)/u.length)||1,o=s(r,n),a=s(e,i),c=e,l=1/0;for(let u of[!1,!0])for(let h=0;h<e.length;h++){let d=e.map((p,m)=>e[(u?e.length-1-m+h:m+h)%e.length]),f=d.reduce((p,m,g)=>p+((m[0]-i[0])/a-(r[g][0]-n[0])/o)**2+((m[1]-i[1])/a-(r[g][1]-n[1])/o)**2,0);f<l&&(l=f,c=d)}return c}function el(r,e,t=[],n={}){if(n.seamMode!==void 0&&!["auto","manual"].includes(n.seamMode))throw Error("\u8BF7\u9009\u62E9\u81EA\u52A8\u6216\u624B\u52A8\u622A\u9762\u8D77\u70B9\u5339\u914D");if(!e.length)throw Error("\u8BF7\u9009\u62E9\u95ED\u5408\u622A\u9762");if(e.length===1)return tr(r,e[0],t[0],{...n,anchorStation:n.profileStations?.[0]??null});let i=e.map((h,d)=>tr(r,h,t[d],{...n,anchorStation:n.profileStations?.[d]??null})),s=i[0],o=n.profileStations?n.profileStations.map((h,d)=>h??i[d]?.anchorStation):i.map(h=>h.anchorStation);if(o.length!==e.length||o.some(h=>!Number.isFinite(h)||h<0||h>1))throw Error("\u622A\u9762\u4F4D\u7F6E\u6BD4\u4F8B\u9700\u8981\u4E0E\u622A\u9762\u6570\u91CF\u4E00\u81F4\uFF0C\u8303\u56F4\u4E3A 0\u20131");let a=n.profileSamples??64;if(!Number.isInteger(a)||a<8||a>4096)throw Error("\u622A\u9762\u5339\u914D\u91C7\u6837\u6570\u9700\u8981 8\u20134096");let c=i.map((h,d)=>{let f=o[d]*s.totalLength,p=s.segments.find(b=>f<=b.start+b.length)||s.segments.at(-1),m=h.segments.find(b=>f<=b.start+b.length)||h.segments.at(-1),g=H(m.frame.u,p.frame.u),y=H(m.frame.u,p.frame.v);return{distance:f,poly:Hd(Bd(h.poly.map(b=>[b[0]*g-b[1]*y,b[0]*y+b[1]*g]),a),n.profileSeams?.[d])}}).sort((h,d)=>h.distance-d.distance);for(let h=1;h<c.length;h++){if(c[h].distance-c[h-1].distance<1e-4)throw Error("\u591A\u4E2A\u622A\u9762\u4F4D\u4E8E\u540C\u4E00\u8F68\u9053\u4F4D\u7F6E\uFF0C\u8BF7\u6CBF\u8DEF\u5F84\u79FB\u5F00\u6216\u6307\u5B9A profileStations");n.seamMode!=="manual"&&(c[h].poly=Vd(c[h-1].poly,c[h].poly))}let l=h=>{if(h<=c[0].distance)return c[0].poly;if(h>=c.at(-1).distance)return c.at(-1).poly;let d=c.find(m=>h<=m.distance),f=c[c.indexOf(d)-1],p=(h-f.distance)/(d.distance-f.distance);return n.smooth&&(p=p*p*(3-2*p)),f.poly.map((m,g)=>m.map((y,b)=>y+(d.poly[g][b]-y)*p))},u=[];for(let h of s.segments){let d=Math.max(1,Math.ceil(h.length)),f=[h.start,h.start+h.length,...c.map(p=>p.distance).filter(p=>p>h.start+1e-8&&p<h.start+h.length-1e-8),...Array.from({length:d-1},(p,m)=>h.start+h.length*(m+1)/d)].sort((p,m)=>p-m).filter((p,m,g)=>!m||p-g[m-1]>1e-8);for(let p=0;p<f.length-1;p++){let m=f[p],g=f[p+1],y=h.a.map((x,E)=>x+h.normal[E]*(m-h.start)),b=h.a.map((x,E)=>x+h.normal[E]*(g-h.start)),_=p===0?h.startNormal:h.normal,v=p===f.length-2?h.endNormal:h.normal,M=[[],[]];for(let[x,E,w,S]of[[0,m,_,y],[1,g,v,b]])for(let T of l(E)){let C=h.frame.u.map((A,I)=>A*T[0]+h.frame.v[I]*T[1]),P=-H(C,w)/H(h.normal,w);M[x].push(S.map((A,I)=>A+C[I]+h.normal[I]*P))}u.push({...h,a:y,b,start:m,length:g-m,frame:{...h.frame,origin:y},startNormal:_,endNormal:v,rings:M})}}return{...s,segments:u,poly:c[0].poly,polyAt:l,stations:c.map(h=>h.distance/s.totalLength),warnings:[...new Set(i.flatMap(h=>h.warnings)),"\u591A\u622A\u9762\u6309\u8F68\u9053\u4F4D\u7F6E\u6392\u5E8F\u5E76\u5339\u914D\u95ED\u5408\u8D77\u70B9\uFF1B\u68C0\u67E5\u4E0D\u76F8\u4F3C\u8F6E\u5ED3\u7684\u8FC7\u6E21\u4E0E\u81EA\u4EA4"]}}function Hd(r,e){if(!e)return r;let t=e.shift??0;if(!Number.isFinite(t)||t<0||t>1)throw Error("\u622A\u9762\u8D77\u70B9\u6BD4\u4F8B\u9700\u8981 0\u20131");let n=Math.round(t*r.length)%r.length;return r.map((i,s)=>r[(e.reverse?r.length-1-s+n:s+n)%r.length])}var nr=(r,e)=>Math.hypot(...r.map((t,n)=>t-e[n])),ir=1e-4;function Zs(r){try{return Ws(r).plane}catch{return null}}function si(r=[]){let e=[],t=[],n=[],i=o=>{let a=n.findIndex(c=>nr(c.point,o)<=ir);return a<0&&(a=n.length,n.push({point:o,edges:[]})),a};for(let o of r){if(!["line","polyline","bezier","spline","arc","rectangle","circle","ellipse","polygon"].includes(o.recipe?.kind)||o.points?.length<2)continue;let a=o.points.filter((h,d)=>!d||nr(h,o.points[d-1])>ir);if(nr(a[0],a.at(-1))<=ir){let h=Zs(a);h&&e.push({...o,recipe:{...o.recipe,plane:h}});continue}if(["rectangle","circle","ellipse","polygon"].includes(o.recipe.kind)){let h=Zs(a);h&&e.push({...o,recipe:{...o.recipe,plane:h}});continue}let c=i(a[0]),l=i(a.at(-1)),u=t.length;t.push({g:o,points:a,a:c,b:l}),n[c].edges.push(u),n[l].edges.push(u)}let s=new Set;for(let o=0;o<t.length;o++){if(s.has(o))continue;let a=[],c=[o];for(;c.length;){let m=c.pop();if(s.has(m))continue;s.add(m),a.push(m);let g=t[m];c.push(...n[g.a].edges,...n[g.b].edges)}if(a.some(m=>[t[m].a,t[m].b].some(g=>n[g].edges.length!==2)))continue;let l=o,u=t[o].a,h=new Set,d=[];for(;!h.has(l);){h.add(l);let m=t[l],g=m.a===u?m.points:[...m.points].reverse();d.push(...d.length?g.slice(1):g),u=m.a===u?m.b:m.a,l=n[u].edges.find(y=>y!==l)}let f=Zs(d);if(!f||nr(d[0],d.at(-1))>ir)continue;let p=a.map(m=>t[m].g.id).sort();e.push({id:"loop:"+JSON.stringify(p),name:"\u95ED\u5408\u7EBF\u6846\uFF08"+p.length+" \u6BB5\uFF09",points:d,sourceIds:p,recipe:{kind:"polygon",plane:f,...t[o].g.recipe.workplane?{workplane:t[o].g.recipe.workplane}:{}}})}return e}var tl={xz:[0,2,1],xy:[0,1,2],yz:[2,1,0]},nl=(r,e,t)=>{let n=!1;for(let i=0,s=t.length-1;i<t.length;s=i++){let o=t[i],a=t[s];o[1]>e!=a[1]>e&&r<(a[0]-o[0])*(e-o[1])/(a[1]-o[1])+o[0]&&(n=!n)}return n};function il(r,e,t){let n=1/0;for(let i=0;i<t.length;i++){let s=t[i],o=t[(i+1)%t.length],a=o[0]-s[0],c=o[1]-s[1],l=Math.max(0,Math.min(1,((r-s[0])*a+(e-s[1])*c)/(a*a+c*c||1)));n=Math.min(n,Math.hypot(r-s[0]-l*a,e-s[1]-l*c))}return n}function rl(r,e=64){let t=r.map(o=>[...o]);if(t.length>1&&Math.hypot(...t[0].map((o,a)=>o-t.at(-1)[a]))<1e-6&&t.pop(),t.length<3)throw Error("\u622A\u9762\u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u70B9");let n=t.map((o,a)=>Math.hypot(...o.map((c,l)=>c-t[(a+1)%t.length][l]))),i=n.reduce((o,a)=>o+a,0);if(!i)throw Error("\u622A\u9762\u6CA1\u6709\u9762\u79EF");let s=[];for(let o=0;o<e;o++){let a=i*o/e,c=0;for(;c<n.length-1&&a>n[c];)a-=n[c++];let l=a/(n[c]||1);s.push(t[c].map((u,h)=>u+(t[(c+1)%t.length][h]-u)*l))}return s}function sl(r,e,t,n){let i=l=>[t,n].map(u=>l.reduce((h,d)=>h+d[u],0)/l.length),s=i(r),o=i(e),a=null,c=1/0;for(let l of[!1,!0])for(let u=0;u<r.length;u++){let h=e.map((f,p)=>e[(l?e.length-1-p+u:p+u)%e.length]),d=h.reduce((f,p,m)=>f+(p[t]-o[0]-(r[m][t]-s[0]))**2+(p[n]-o[1]-(r[m][n]-s[1]))**2,0);d<c&&(c=d,a=h)}return a}function rr(r,e){return ri(ol(r,e),e)}function ol(r,e){let{operation:t="extrude",plane:n="auto",state:i={Name:"minecraft:stone_bricks"},hollow:s=!1,thickness:o=1,cut:a=!1}=e,[c,l,u]=tl[n]||tl.xz,h=new Map,d=[],f=[];if(!Number.isFinite(+o)||o<.5||o>64)throw Error("\u58C1\u539A\u5E94\u4E3A 0.5\u201364 \u683C");let p=(x,E=i)=>{if(x=x.map(Math.floor),x.some(w=>w<0||w>=4096))throw Error("\u751F\u6210\u7ED3\u679C\u8D85\u51FA\u753B\u5E03\uFF0C\u8BF7\u79FB\u52A8\u8F6E\u5ED3\u6216\u7F29\u5C0F\u8DDD\u79BB");if(h.set(L(...x),{type:"set",pos:x,state:a?null:E,reason:a?"\u8F6E\u5ED3\u5207\u9664":t==="loft"?"\u622A\u9762\u653E\u6837":t==="sweep"?"\u8DEF\u5F84\u626B\u63A0":"\u8F6E\u5ED3\u62C9\u4F38"}),h.size>25e4)throw Error("\u672C\u6B21\u4F53\u79EF\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A\u751F\u6210")},m=si(r.design.guides),g=x=>{let E=m.find(w=>w.id===x);if(!E)throw Error("\u672A\u627E\u5230\u95ED\u5408\u622A\u9762\uFF1A\u8BF7\u8BA9\u7EBF\u6BB5\u7AEF\u70B9\u91CD\u5408\uFF0C\u5E76\u5904\u4E8E\u540C\u4E00\u5DE5\u4F5C\u5E73\u9762");return E.points};if(t==="sweep"&&e.sweepMode!==void 0&&!["profile","rectangle","rectangle-fit"].includes(e.sweepMode))throw Error("\u8BF7\u9009\u62E9\u81EA\u7ED8\u622A\u9762\u6216\u5FEB\u901F\u77E9\u5F62");let y=t==="sweep"&&e.sweepMode!=="profile"?[]:e.profiles?.length?e.profiles.map(x=>x.points||x):e.profileIds?.map(g)||[];if(t==="sweep"){let x=e.path||r.design.guides?.find(S=>S.id===e.pathId)?.points;if(!x?.length)throw Error("\u8BF7\u5148\u7ED8\u5236\u5E76\u9009\u62E9\u4E00\u6761\u8DEF\u5F84");if(e.sweepMode==="rectangle-fit"){let S=Number(e.width??3),T=Number(e.height??3);if(!Number.isFinite(S)||!Number.isFinite(T)||S<.5||T<.5||S>64||T>64||x.length*S*T>1e6)throw Error("\u7CBE\u786E\u77E9\u5F62\u5BBD\u9AD8\u5E94\u4E3A 0.5\u201364 \u683C\uFF0C\u8BF7\u7F29\u5C0F\u5C3A\u5BF8\u6216\u5206\u6BB5\u751F\u6210");let C=an(x).segments[0].frame,P=C.v[1]<0?{...C,u:C.u.map(U=>-U),v:C.v.map(U=>-U)}:C,A=[[-S/2,0,0],[S/2,0,0],[S/2,T,0],[-S/2,T,0]].map(U=>on(U,P)),I=tr(x,A,P,{profilePlacement:"asDrawn",anchorStation:0}),N=js(I,x,e),D=$s(N,e,p);return{operations:[...h.values()],guide:[...x],guideGroups:[x,[...N.segments[0].rings[0],N.segments[0].rings[0][0]],[...N.segments.at(-1).rings[1],N.segments.at(-1).rings[1][0]]],warnings:[...N.warnings,"\u7CBE\u786E\u77E9\u5F62\u6CBF\u8DEF\u5F84\u6CD5\u5411\u626B\u63A0\uFF1B\u5BBD\u5EA6\u5DE6\u53F3\u5C45\u4E2D\uFF0C\u9AD8\u5EA6\u4ECE\u8DEF\u5F84\u5411\u622A\u9762\u4E0A\u65B9\u5EF6\u4F38"],usedRoles:D.usedRoles,closure:N.closure||null,overlap:N.overlap||null,blocked:N.blocked||null,sweep:{segments:N.segments.length,closed:N.closed,profilePoints:4}}}if(e.sweepMode==="profile"){if(!y.length)throw Error("\u8BF7\u9009\u62E9\u95ED\u5408\u622A\u9762\uFF1B\u5148\u5728\u8DEF\u5F84\u4E0A\u7ED8\u5236\u622A\u9762");let S=y.map((A,I)=>m.find(N=>N.id===e.profileIds?.[I])?.recipe.workplane||e.profiles?.[I]?.workplane||e.workplane),T=el(x,y,S,e.profileStations?e:{...e,profileStations:y.map((A,I)=>{let N=m.find(D=>D.id===e.profileIds?.[I])?.recipe.workplaneSource;return N?.kind==="curve-station"&&N.guideId===e.pathId?N.station:null})}),C=js(T,x,e),P=$s(C,e,p);return{operations:[...h.values()],guide:[...x],guideGroups:[x,...C.segments.filter((A,I)=>I===C.segments.length-1||I%Math.max(1,Math.ceil(C.segments.length/7))===0).map(A=>[...A.rings[0],A.rings[0][0]]),[...C.segments.at(-1).rings[1],C.segments.at(-1).rings[1][0]]],warnings:C.warnings,usedRoles:P.usedRoles,closure:C.closure||null,overlap:C.overlap||null,blocked:C.blocked||null,sweep:{segments:C.segments.length,closed:C.closed,profilePoints:C.poly.length}}}let E=Number(e.width??3),w=Number(e.height??3);if(!Number.isFinite(E)||!Number.isFinite(w)||E<1||w<1||E>64||w>64||x.length*E*w>1e6)throw Error("\u8DEF\u5F84\u6216\u622A\u9762\u8FC7\u5927\uFF0C\u8BF7\u7F29\u5C0F\u5BBD\u9AD8\u6216\u5206\u6BB5\u751F\u6210");f.push("\u6CBF\u8DEF\u5F84\u751F\u6210\u4F7F\u7528\u7AD6\u76F4\u77E9\u5F62\u622A\u9762\uFF1B\u5F2F\u9053\u4F1A\u5408\u5E76\u91CD\u53E0\u65B9\u5757");for(let S=0;S<x.length;S++){let T=x[S],C=x[Math.min(S+1,x.length-1)],P=x[Math.max(0,S-1)],A=C.map((D,U)=>D-P[U]),I=Math.hypot(A[0],A[2]),N=I>1e-6?[A[2]/I,0,-A[0]/I]:[1,0,0];d.push(T);for(let D=-E/2;D<=E/2;D+=.5)for(let U=0;U<w;U+=.5)s&&Math.abs(D)<E/2-o&&U>=o&&U<w-o||p(T.map((F,z)=>F+N[z]*D+(z===1?U:0)))}return{operations:[...h.values()],guide:d,warnings:f,usedRoles:{}}}if(!y.length)throw Error("\u672A\u627E\u5230\u95ED\u5408\u622A\u9762\uFF1A\u8BF7\u4FDD\u5B58\u8F6E\u5ED3\uFF0C\u786E\u4FDD\u7EBF\u6BB5\u7AEF\u70B9\u91CD\u5408\u3001\u6CA1\u6709\u5206\u53C9\uFF0C\u5E76\u5904\u4E8E\u540C\u4E00\u5E73\u9762");let b=m.find(x=>x.id===e.profileIds?.[0])?.recipe.workplane||e.workplane,_=In(y[0],n,b);if(n==="auto")return _.plane!=="auto"?ol(r,{...e,plane:_.plane}):Gd(y,e,_,p,h);let v=y.map(x=>rl(x)),M=v[0];if(t==="extrude"){let x=Number(e.depth??8);if(!Number.isFinite(x)||Math.abs(x)<.5)throw Error("\u8BF7\u8F93\u5165\u6709\u6548\u62C9\u4F38\u8DDD\u79BB");let E=M.map(w=>w.map((S,T)=>S+(T===u?x:0)));v=e.symmetric?[M.map(w=>w.map((S,T)=>S-(T===u?x/2:0))),M.map(w=>w.map((S,T)=>S+(T===u?x/2:0)))]:[M,E]}else if(t==="loft"){if(v.length<2)throw Error("\u653E\u6837\u81F3\u5C11\u9700\u8981\u4E24\u4E2A\u622A\u9762");v.sort((x,E)=>x[0][u]-E[0][u]);for(let x=1;x<v.length;x++)v[x]=sl(v[x-1],v[x],c,l)}else throw Error("\u672A\u77E5\u5EFA\u6A21\u64CD\u4F5C");for(let x of v){let E=x[0][u];if(x.some(w=>Math.abs(w[u]-E)>.05))throw Error("\u622A\u9762\u4E0D\u5728\u6240\u9009\u5DE5\u4F5C\u5E73\u9762\u4E0A\uFF0C\u8BF7\u9009\u62E9\u6B63\u786E\u5E73\u9762");d.push(...x,x[0])}for(let x=0;x<v.length-1;x++){let E=v[x],w=v[x+1],S=Math.min(E[0][u],w[0][u]),T=Math.max(E[0][u],w[0][u]);if(T-S<.01)throw Error("\u653E\u6837\u622A\u9762\u9AD8\u5EA6\u76F8\u540C\uFF0C\u8BF7\u79FB\u52A8\u5176\u4E2D\u4E00\u4E2A\u622A\u9762");for(let C=Math.floor(S);C<Math.ceil(T);C++){let P=Math.max(0,Math.min(1,(C+.5-E[0][u])/(w[0][u]-E[0][u])));e.smooth&&(P=P*P*(3-2*P));let A=E.map((D,U)=>[D[c]+(w[U][c]-D[c])*P,D[l]+(w[U][l]-D[l])*P]),I=[0,1].map(D=>Math.floor(Math.min(...A.map(U=>U[D])))),N=[0,1].map(D=>Math.ceil(Math.max(...A.map(U=>U[D]))));if((N[0]-I[0])*(N[1]-I[1])>65536)throw Error("\u622A\u9762\u592A\u5927\uFF0C\u8BF7\u5206\u533A\u751F\u6210");for(let D=I[0];D<N[0];D++)for(let U=I[1];U<N[1];U++)if(nl(D+.5,U+.5,A)){let F=e.caps!==!1&&(C-S<o||T-C-1<o);if(s&&!F&&il(D+.5,U+.5,A)>o)continue;let z=[0,0,0];z[c]=D,z[l]=U,z[u]=C,p(z)}}}return{operations:[...h.values()],guide:d,warnings:f,usedRoles:{}}}function Gd(r,e,t,n,i){let s=e.operation||"extrude",o=Number(e.depth??8),a=Number(e.thickness??1),c=[],l=r.map(h=>{let d=h.map(f=>rt(f,t));if(d.some(f=>Math.abs(f[2]-d[0][2])>1e-4))throw Error("\u653E\u6837\u622A\u9762\u9700\u8981\u4F4D\u4E8E\u76F8\u4E92\u5E73\u884C\u7684\u5E73\u9762");return rl(d)});if(s==="extrude"){if(!Number.isFinite(o)||Math.abs(o)<.5)throw Error("\u8BF7\u8F93\u5165\u6709\u6548\u62C9\u4F38\u8DDD\u79BB");let h=l[0],d=e.symmetric?-o/2:0;l=[h.map(f=>[f[0],f[1],f[2]+d]),h.map(f=>[f[0],f[1],f[2]+d+o])]}else if(s==="loft"){if(l.length<2)throw Error("\u653E\u6837\u81F3\u5C11\u9700\u8981\u4E24\u4E2A\u622A\u9762");l.sort((h,d)=>h[0][2]-d[0][2]);for(let h=1;h<l.length;h++)l[h]=sl(l[h-1],l[h],0,1)}else throw Error("\u672A\u77E5\u5EFA\u6A21\u64CD\u4F5C");let u=0;for(let h of l)c.push(...[...h,h[0]].map(d=>on(d,t)));for(let h=0;h<l.length-1;h++){let d=l[h],f=l[h+1],p=Math.min(d[0][2],f[0][2]),m=Math.max(d[0][2],f[0][2]);if(m-p<.01)throw Error("\u653E\u6837\u622A\u9762\u9AD8\u5EA6\u76F8\u540C\uFF0C\u8BF7\u79FB\u52A8\u5176\u4E2D\u4E00\u4E2A\u622A\u9762");let g=[...d,...f].map(_=>on(_,t)),y=[0,1,2].map(_=>Math.floor(Math.min(...g.map(v=>v[_])))),b=[0,1,2].map(_=>Math.ceil(Math.max(...g.map(v=>v[_]))));if(u+=b.reduce((_,v,M)=>_*(v-y[M]),1),u>2e6)throw Error("\u503E\u659C\u4F53\u79EF\u8FC7\u5927\uFF0C\u8BF7\u5206\u533A\u751F\u6210");for(let _=y[0];_<b[0];_++)for(let v=y[1];v<b[1];v++)for(let M=y[2];M<b[2];M++){let x=rt([_+.5,v+.5,M+.5],t);if(x[2]<p-1e-8||x[2]>=m-1e-8)continue;let E=(x[2]-d[0][2])/(f[0][2]-d[0][2]);e.smooth&&(E=E*E*(3-2*E));let w=d.map((T,C)=>[T[0]+(f[C][0]-T[0])*E,T[1]+(f[C][1]-T[1])*E]);if(!nl(x[0],x[1],w))continue;let S=e.caps!==!1&&(x[2]-p<a||m-x[2]<a);e.hollow&&!S&&il(x[0],x[1],w)>a||n([_,v,M])}}return{operations:[...i.values()],guide:c,warnings:["\u503E\u659C\u4F53\u79EF\u6309\u4E16\u754C\u65B9\u5757\u7F51\u683C\u843D\u683C\uFF1B\u8FB9\u754C\u5448\u9636\u68AF\u72B6"],usedRoles:{}}}var Vt=r=>structuredClone(r);function ln(r,e){let t=r.at(e);return t?{state:Vt(r.palette[t.state]),nbt:Vt(t.nbt||null)}:null}var sr=(r,e)=>!r&&!e||!!r&&!!e&&V(r.state)===V(e.state)&&JSON.stringify(r.nbt||null)===JSON.stringify(e.nbt||null),al=(r,e)=>({type:"set",pos:[...r],state:e?.state||null,nbt:e?.nbt||null,reason:"\u5173\u8054\u751F\u6210\u66F4\u65B0"});function or(r,e){return[...new Map(e.map(t=>[L(...t.pos),t.pos])).values()].map(t=>({pos:[...t],before:ln(r,t)}))}function ll(r,e){return r==="mesh"?{sourceRefs:e}:{sources:e.map(t=>t.id)}}function Ks(r,e,t){if(e!=="mesh")return Vt(t);let n=nn(r,{kind:"mesh",id:t.sourceId});if(!n)throw Error("\u6A21\u578B\u6765\u6E90\u5DF2\u4E0D\u5B58\u5728");return{...Vt(t),transform:St(t.transform,n.transform)}}function cl(r){let e=r.map(t=>t.pos);return{min:[0,1,2].map(t=>e.reduce((n,i)=>Math.min(n,i[t]),1/0)),max:[0,1,2].map(t=>e.reduce((n,i)=>Math.max(n,i[t]),-1/0)),cells:e.map(t=>L(...t))}}function ar(r,e,{type:t,config:n,guideId:i,id:s=crypto.randomUUID(),name:o="\u751F\u6210\u7279\u5F81"}){if(!e.length)return null;let a=e.map(l=>({...l,after:ln(r,l.pos)})),c=Us(t,n,i);return{id:s,name:o,kind:t,...t==="mesh"?{meshSourceId:n.sourceId}:{guideId:i},recipe:Ks(r.design,t,n),...cl(a),generation:{schema:1,type:t,records:a,...ll(t,c),sourceVersions:Oi(r.design,c)}}}function lr(r){if(!r.generation?.records)return!!r.generation?.detached;let e=new Set(r.cells||[]);return r.generation?.detached||r.generation?.records?.some(t=>!e.has(L(...t.pos)))||e.size!==(r.generation?.records?.length||0)}function oi(r,e,{manualStrategy:t="preserve",overrides:n={},available:i=new Set}={}){let s=e.map(g=>{if(!n[g.id])return g;if(!g.generation?.type||!Array.isArray(g.generation.records))throw Error("\u65E7\u7279\u5F81\u7F3A\u5C11\u751F\u6210\u5F52\u5C5E\u5FEB\u7167\uFF1A"+g.name+"\uFF0C\u8BF7\u4FDD\u7559\u65E7\u5BF9\u8C61\u6216\u91CD\u65B0\u751F\u6210");let y=Ks(r.design,g.generation.type,n[g.id]),b=Us(g.generation.type,y,g.guideId);if(g.generation.type==="feature"&&b.some(_=>_.id===g.guideId))throw Error("\u4E0D\u80FD\u628A\u81EA\u8EAB\u8F93\u51FA\u4F5C\u4E3A\u5EFA\u6A21\u6765\u6E90");return{...g,recipe:y,...g.generation.type==="mesh"?{meshSourceId:y.sourceId}:{},generation:{...g.generation,...ll(g.generation.type,b)}}}),o=new Map(s.map(g=>[g.id,g])),a={...r.design,objects:r.design.objects.map(g=>o.get(g.id)||g)};if(e=Gs(a,s),!["preserve","overwrite"].includes(t))throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u624B\u6539\u5904\u7406\u65B9\u5F0F");let c=r.fork(),l=new Set,u=new Set,h=new Set,d=new Map,f=new Set,p=[];c.design.objects=c.design.objects.map(g=>o.has(g.id)?Vt(o.get(g.id)):g);for(let g of[...e].reverse()){if(ut(c.design,g))throw Error("\u5173\u8054\u5BF9\u8C61\u5DF2\u9501\u5B9A\uFF1A"+g.name);if(!g.generation?.records)throw Error("\u65E7\u7279\u5F81\u7F3A\u5C11\u751F\u6210\u5F52\u5C5E\u5FEB\u7167\uFF1A"+g.name+"\u3002\u8BF7\u4FDD\u7559\u65E7\u5BF9\u8C61\uFF0C\u6216\u5148\u91CD\u65B0\u751F\u6210\u5E76\u5EFA\u7ACB\u5173\u8054");if(lr(g))throw Error("\u5BF9\u8C61\u5DF2\u88AB\u76F4\u63A5\u53D8\u6362\u6216\u6539\u53D8\u6210\u5458\uFF1A"+g.name+"\uFF0C\u8BF7\u5148\u65AD\u5F00\u751F\u6210\u5173\u8054");let y=[],b=[];for(let _ of g.generation.records){let v=L(..._.pos);l.add(v);let M=ln(c,_.pos);(_.manual||!sr(M,_.after))&&f.add(v),t==="preserve"&&(_.manual||h.has(v)||!sr(M,_.after))?(h.add(v),b.push({...Vt(_),after:M,manual:!0})):y.push(al(_.pos,_.before))}d.set(g.id,b),c.operations(y,{allowExisting:!0,allowTerrain:!0})}for(let g of e){let y=Ks(c.design,g.generation.type,g.recipe),b=g.generation.type,_=b==="geometry"?Bt(c,y,i):b==="mesh"?$i(c,y,i):rr(c,{...y,available:[...i]}),v=[],M=[];if(_.blocked)throw Error(_.blocked.message);for(let T of new Map(_.operations.map(C=>[L(...C.pos),C])).values()){let C=L(...T.pos);if(l.add(C),t==="preserve"&&h.has(C))continue;let P=ln(c,T.pos),A=T.state?{state:T.state,nbt:T.nbt||null}:null;if(P&&!sr(P,A)&&!u.has(C)&&!g.generation.records.some(I=>L(...I.pos)===C)){M.push(T.pos);continue}v.push(T)}if(M.length)throw Error("\u66F4\u65B0\u5C06\u8986\u76D6\u5176\u4ED6\u5185\u5BB9\uFF1A"+g.name+"\uFF0C\u8BF7\u8C03\u6574\u8349\u56FE\u3002\u4F4D\u7F6E "+M[0].join(", "));let x=or(c,v);v.some(T=>u.has(L(...T.pos)))&&p.push("\u5173\u8054\u751F\u6210\u5BF9\u8C61\u4E4B\u95F4\u5B58\u5728\u91CD\u53E0\uFF0C\u6309\u539F\u5BF9\u8C61\u987A\u5E8F\u91CD\u5EFA");for(let T of v)u.add(L(...T.pos));c.operations(v,{allowExisting:!0,allowTerrain:!0});let E=[...x.map(T=>({...T,after:ln(c,T.pos)})),...d.get(g.id)||[]],w=E.length?{...g,recipe:y,...cl(E),generation:{...g.generation,outdated:!1,records:E,sourceVersions:Oi(c.design,Ft(g))}}:{...g,recipe:y,cells:[],generation:{...g.generation,outdated:!1,records:[],sourceVersions:Oi(c.design,Ft(g))}};c.design.objects=c.design.objects.map(T=>T.id===g.id?w:T);let S=c.design.guides?.find(T=>T.id===g.guideId);S&&b==="feature"&&(S.points=_.guide,S.revision=(S.revision||0)+1,_.guideGroups?S.paths=_.guideGroups:delete S.paths,S.recipe=y),p.push(..._.warnings)}let m=[];for(let g of l){let y=Z(g),b=ln(r,y),_=ln(c,y);sr(b,_)||m.push(al(y,_))}return t==="overwrite"&&f.size&&p.push("\u660E\u786E\u66FF\u6362 "+f.size+" \u5904\u624B\u6539\u6216\u624B\u52A8\u5220\u9664"),h.size&&p.push("\u4FDD\u7559 "+h.size+" \u4E2A\u624B\u6539\u6216\u624B\u52A8\u5220\u9664\u7684\u4F4D\u7F6E"),{operations:m,design:c.design,guide:[],warnings:[...new Set(p)],usedRoles:{},regeneration:{objects:e.length,manual:h.size}}}function cr(r,e,t){let n=r.design.guides.find(d=>d.id===e.editGuideId);if(!n?.recipe?.kind)throw Error("\u8BF7\u9009\u62E9\u53EF\u7F16\u8F91\u7684\u5DF2\u4FDD\u5B58\u8349\u56FE");let i={...Vt(n.recipe),...Vt(e)};delete i.editGuideId,delete i.materializeGuide,delete i.updateDependents,delete i.manualStrategy,e.points&&e.sampleCount===void 0&&JSON.stringify(e.points)!==JSON.stringify(n.recipe.points)&&delete i.sampleCount;let s=Bt(r,{...i,guidesOnly:!0},t),o=r.fork();o.design.guides=o.design.guides.map(d=>d.id===n.id?{...d,recipe:i,points:s.guide,revision:(d.revision||0)+1}:d);let a=Zi(o.design,n.id,lr),c=a.detached,l=a.objects,u=Object.fromEntries(l.filter(d=>d.generation?.type==="geometry"&&d.generation.sources?.includes(n.id)).map(d=>[d.id,i]));o.design.objects=o.design.objects.map(d=>c.some(f=>f.id===d.id)?{...d,kind:"voxel",generation:{...d.generation,detached:!0}}:d);let h={operations:[],design:o.design,guide:s.guide,warnings:[],usedRoles:{},regeneration:{objects:0,manual:0}};if(e.updateDependents!==!1&&l.length?(h=oi(o,l,{manualStrategy:e.manualStrategy||"preserve",overrides:u,available:t}),h.guide=s.guide):l.length&&(o.design.objects=o.design.objects.map(d=>l.some(f=>f.id===d.id)?{...d,generation:{...d.generation,outdated:!0}}:d),h.design=o.design,h.warnings.push(l.length+" \u4E2A\u5173\u8054\u5BF9\u8C61\u4FDD\u6301\u539F\u6837\uFF0C\u7B49\u5F85\u66F4\u65B0")),e.materializeGuide){if(l.some(f=>f.generation?.type==="geometry"))throw Error("\u6B64\u8F85\u52A9\u7EBF\u5DF2\u6709\u65B9\u5757\u7ED3\u679C\uFF0C\u8BF7\u7F16\u8F91\u539F\u751F\u6210\u7ED3\u679C");let d=Bt(o,{...i,guidesOnly:!1},t);h.operations=[...new Map([...h.operations,...d.operations].map(f=>[L(...f.pos),f])).values()],h.materializedStroke={guideId:n.id,recipe:{...i,guidesOnly:!1},operations:d.operations},h.usedRoles=d.usedRoles,h.warnings.push(...d.warnings)}return s.surfaceFit&&(h.surfaceFit=s.surfaceFit),h.warnings=[...new Set([...h.warnings,...s.warnings])],c.length&&h.warnings.push(c.length+" \u4E2A\u5DF2\u72EC\u7ACB\u5316\u5BF9\u8C61\u4FDD\u6301\u539F\u6837"),h}function ul(r,e,t){let n=Cn(r.design,e.sourceId),i;if(e.saveOnly)i={operations:[],guide:[],warnings:n.warnings||[],usedRoles:{},design:structuredClone(r.design)};else if(e.objectId){let s=r.design.objects.find(o=>o.id===e.objectId);if(!s||s.generation?.type!=="mesh"||s.meshSourceId!==n.id)throw Error("\u6B64\u751F\u6210\u7ED3\u679C\u4E0E\u6A21\u578B\u6765\u6E90\u4E0D\u5339\u914D\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");if(s.generation.detached)throw Error("\u6B64\u7ED3\u679C\u5DF2\u72EC\u7ACB\u5316\uFF0C\u53EF\u4ECE\u6A21\u578B\u521B\u5EFA\u65B0\u7684\u7ED3\u679C");i=oi(r,[s],{manualStrategy:e.manualStrategy||"preserve",overrides:{[s.id]:Ji(e,n)},available:t})}else i={...$i(r,e,t),design:structuredClone(r.design),newMeshObject:Ji(e,n)};return Fi({design:i.design},"meshes.put",{source:{id:n.id,...e.saveOnly&&e.sourceName?{name:e.sourceName}:{},transform:St(e.transform,n.transform),hidden:e.saveOnly?!1:e.hideSource!==!1}}),i}var ai="\u6B63\u5728\u53EA\u8BFB\u5BF9\u6BD4\u65B9\u6848\uFF1B\u8BF7\u5148\u8FD4\u56DE\u5F53\u524D\u8BBE\u8BA1\uFF0C\u518D\u7EE7\u7EED\u7F16\u8F91\u6216\u5BFC\u51FA\u3002",Wd=new Set(["comparison","api","summary","mesh","meshChunks","createScene","inspect","meshSourceGeometry","designInspect","search","assetCatalogue","assetPreview","screenBoxSelection","sourceResidency","workspaceAssets","workspaceCheckpoint","baselineReference","draftAttachments","draft","engineCapture","engineMountSource","engineRestore","toolContext","context","import","load","resume","endStroke","cancelConstruction"]),Xd=new Set(["workspace.describe","meshes.list","meshes.read","scene.readRegion","scene.getBlocks","scene.chunkSnapshot","terrain.readColumns","materials.search","materials.collect","transaction.inspect","design.inspect","views.list","generation.links","objects.list","selectionSets.list","selectionSets.resolve","prefabs.list","prefabs.read","workplanes.list","workplanes.atCurve","measurements.list","collections.list","palettes.list"]);function Qs(r){return Wd.has(r)}function hl(r){return r.startsWith("comparison.")||Xd.has(r)}var Ht=(r,e)=>!!e.hidden||wi(r,e.collectionId,"hidden");function fl(r,e,t){if(!Ht(r,e))return!1;if(e.cells?.length){let n=L(...t),i=t.join(",");return e.cells.some(s=>typeof s=="number"?s===n:Array.isArray(s)?s.every((o,a)=>o===t[a]):s===i)}return t.every((n,i)=>n>=e.min[i]&&n<=e.max[i])}function dl(r){let e=new Jt(r.design.collections);return e.collections.map(t=>({...t,objectIds:r.design.objects.filter(n=>n.collectionId===t.id).map(n=>n.id),descendantObjectIds:r.design.objects.filter(n=>e.contains(t.id,n.collectionId)).map(n=>n.id),effectiveHidden:e.flag(t.id,"hidden"),effectiveLocked:e.flag(t.id,"locked"),path:e.path(t.id)}))}function pl(r,e,t){let n=r.design.collections||(r.design.collections=[]);if(e==="collections.remove"){let u=n.findIndex(d=>d.id===t.id);if(u<0)throw Error("\u96C6\u5408\u5DF2\u4E0D\u5B58\u5728");let h=n[u].parentId;n.splice(u,1);for(let d of n)d.parentId===t.id&&(h?d.parentId=h:delete d.parentId);for(let d of r.design.objects)d.collectionId===t.id&&(h?d.collectionId=h:delete d.collectionId);return{id:t.id,removed:!0}}let i=t.collection;if(!i||typeof i.name!="string"||!i.name.trim()||i.name.length>128)throw Error("\u8BF7\u4E3A\u96C6\u5408\u586B\u5199 1\u2013128 \u5B57\u540D\u79F0");if(i.hidden!==void 0&&typeof i.hidden!="boolean")throw Error("\u96C6\u5408\u663E\u793A\u72B6\u6001\u65E0\u6548");if(i.locked!==void 0&&typeof i.locked!="boolean")throw Error("\u96C6\u5408\u9501\u5B9A\u72B6\u6001\u65E0\u6548");let s=i.id||crypto.randomUUID();if(typeof s!="string"||!s||s.length>128)throw Error("\u96C6\u5408\u7F16\u53F7\u65E0\u6548");for(let u of[t.objectIds,t.removeObjectIds])if(u!==void 0&&(!Array.isArray(u)||u.some(h=>!r.design.objects.some(d=>d.id===h))))throw Error("\u96C6\u5408\u4E2D\u7684\u5BF9\u8C61\u5DF2\u53D8\u5316");if(t.objectIds?.some(u=>t.removeObjectIds?.includes(u)))throw Error("\u540C\u4E00\u5BF9\u8C61\u4E0D\u80FD\u540C\u65F6\u5F52\u5165\u548C\u79FB\u51FA\u96C6\u5408");let o=n.findIndex(u=>u.id===s),a=o<0?{}:n[o],c={...a,id:s,name:i.name.trim(),hidden:i.hidden??a.hidden??!1};(i.locked!==void 0||a.locked!==void 0)&&(c.locked=i.locked??a.locked);let l=i.parentId===void 0?a.parentId:i.parentId;if(new Jt(n).validateParent(s,l),l?c.parentId=l:delete c.parentId,o<0?n.push(c):n[o]=c,t.objectIds)for(let u of t.objectIds)r.design.objects.find(h=>h.id===u).collectionId=s;if(t.removeObjectIds)for(let u of r.design.objects)u.collectionId===s&&t.removeObjectIds.includes(u.id)&&delete u.collectionId;return{...c,objectIds:r.design.objects.filter(u=>u.collectionId===s).map(u=>u.id)}}function eo(r,e,t){let[n,i,s]=r,o=e[3]*n+e[7]*i+e[11]*s+e[15];return o<=0?null:[(e[0]*n+e[4]*i+e[8]*s+e[12])/o*t[0]/2+t[0]/2,t[1]/2-(e[1]*n+e[5]*i+e[9]*s+e[13])/o*t[1]/2,(e[2]*n+e[6]*i+e[10]*s+e[14])/o]}function qd(r,e,t,n){let i=n[3]*r+n[7]*e+n[11]*t+n[15];return[0,1,2].map(s=>(n[s]*r+n[4+s]*e+n[8+s]*t+n[12+s])/i)}function ml(r,e,t=!0){let n=r.filter(Boolean);if(!n.length||n.every(o=>o[2]<-1)||n.every(o=>o[2]>1))return!1;let i=[0,1].map(o=>Math.min(...n.map(a=>a[o]))),s=[0,1].map(o=>Math.max(...n.map(a=>a[o])));return t?i.every((o,a)=>o<=e.max[a])&&s.every((o,a)=>o>=e.min[a]):n.length===r.length&&i.every((o,a)=>o>=e.min[a])&&s.every((o,a)=>o<=e.max[a])}function Yd(r,e,t,n){let i=r.map(Math.floor),s=e.map((l,u)=>l-r[u]),o=s.map(Math.sign),a=s.map(l=>l?1/Math.abs(l):1/0),c=s.map((l,u)=>l?((l>0?i[u]+1:i[u])-r[u])/l:1/0);for(;;){if(i.every((u,h)=>u===t[h]))return!0;if(n(i))return!1;let l=c.reduce((u,h,d)=>h<c[u]?d:u,0);if(c[l]>1)return!1;i[l]+=o[l],c[l]+=a[l]}}function gl(r,{matrix:e,inverse:t,viewport:n,box:i,crossing:s=!0,depth:o="visible",mode:a="after",cut:c=4095,plants:l=!0,showGround:u=!0,showExisting:h=!0,isolateKeys:d=null}){if(![e,t].every(v=>Array.isArray(v)&&v.length===16&&v.every(Number.isFinite))||!Array.isArray(n)||n.length!==2||n.some(v=>!Number.isFinite(v)||v<=0)||!i?.min||!i?.max||[...i.min,...i.max].some(v=>!Number.isFinite(v))||!["visible","through"].includes(o))throw Error("\u5C4F\u5E55\u6846\u9009\u53C2\u6570\u65E0\u6548");let f=new Set,p=[];if(a!=="before")for(let v of r.design.objects.filter(M=>Ht(r.design,M)))if(v.cells)for(let M of v.cells)f.add(typeof M=="number"?M:L(...Array.isArray(M)?M:M.split(",").map(Number)));else p.push(v);let m=new Map,g=c>=r.size[1]-1?4095:c,y=v=>{if(v.some(T=>T<0||T>=4096)||v[1]>g)return null;let M=L(...v);if(d&&!d.has(M)||f.has(M)||p.some(T=>v.every((C,P)=>C>=T.min[P]&&C<=T.max[P])))return null;let x=r.overlay.get(M),E=r.cells.get(M),w=a==="before"?E:a==="removed"?x&&E:x?x.state<0?a==="diff"?E:null:x:E;if(!w||w.state<0)return null;if(!m.has(w.state)){let T=r.palette[w.state].Name;m.set(w.state,{plant:/leaves|sapling|grass(?!_block)|petals|flower|fern|vine/.test(T),ground:/:(stone|andesite|diorite|granite|dirt|grass_block|gravel|sand|clay|deepslate|tuff|bedrock|water)$/.test(T)||/_ore$/.test(T)})}let S=m.get(w.state);return!l&&S.plant||!u&&S.ground||!h&&!S.plant&&!S.ground&&E&&!x?null:w};function*b(){let v=new Set([...r.baseChunks.keys(),...r.overlayChunks.keys()]);for(let M of v){let x=M.split(",").map(Number).map(C=>C*16),E=x.map(C=>C+16),w=[];for(let C of[x[0],E[0]])for(let P of[x[1],E[1]])for(let A of[x[2],E[2]])w.push(eo([C,P,A],e,n));if(!w.some(C=>!C||C[2]<-1)&&!ml(w,i,!0))continue;let S=r.baseChunks.get(M)||new Map,T=r.overlayChunks.get(M)||new Map;for(let[C,P]of S)yield T.get(C)||P;for(let[C,P]of T)S.has(C)||(yield P)}}let _=[];for(let v of b()){let M=y(v.pos);if(!M)continue;let x=M.pos,E=r.palette[M.state],w=[...x],S=x.map(A=>A+1);/_slab$/.test(E.Name)&&(E.Properties?.type==="top"?w[1]+=.5:E.Properties?.type!=="double"&&(S[1]-=.5));let T=w.map((A,I)=>(A+S[I])/2),C=eo(T,e,n);if(!C||C[2]<-1||C[2]>1)continue;let P=[];for(let A of[w[0],S[0]])for(let I of[w[1],S[1]])for(let N of[w[2],S[2]])P.push(eo([A,I,N],e,n));if(ml(P,i,s)){if(o==="visible"){let A=qd(C[0]/n[0]*2-1,1-C[1]/n[1]*2,-1,t);if(!x.every((N,D)=>N===Math.floor(A[D]))&&[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].every(N=>y(x.map((D,U)=>D+N[U])))||!Yd(A,T,x,N=>!!y(N)))continue}_.push([...x])}}return _.length?{min:[0,1,2].map(v=>_.reduce((M,x)=>Math.min(M,x[v]),1/0)),max:[0,1,2].map(v=>_.reduce((M,x)=>Math.max(M,x[v]),-1/0)),members:_}:null}function ur(r,e){throw Object.assign(Error(e),{code:r})}function hr(r,e){(!r||typeof r!="object"||Array.isArray(r))&&ur("INVALID_REQUEST","\u8BF7\u6C42\u9700\u8981 JSON \u5BF9\u8C61"),r.schema&&r.schema!=="craftstudio-design/1"&&ur("UNSUPPORTED_SCHEMA","\u4E0D\u652F\u6301\u7684\u63A5\u53E3\u7248\u672C");let t=r.id,n=t!=null;n&&typeof t!="string"&&!Number.isSafeInteger(t)&&ur("INVALID_REQUEST_ID","\u8BF7\u6C42 ID \u9700\u8981\u5B57\u7B26\u4E32\u6216\u5B89\u5168\u6574\u6570");let i=JSON.stringify({method:r.method,params:r.params||{}},(o,a)=>{if(r.method!=="comparison.load"||!(a instanceof ArrayBuffer)&&!(a instanceof Uint8Array))return a;let c=new Uint8Array(a),l="";for(let u=0;u<c.length;u+=32768)l+=String.fromCharCode(...c.subarray(u,u+32768));return{$binary:btoa(l)}}),s=n?e.get(t):null;return s&&s.fingerprint!==i&&ur("REQUEST_ID_REUSED","\u540C\u4E00\u8BF7\u6C42 ID \u4E0D\u80FD\u7528\u4E8E\u4E0D\u540C\u64CD\u4F5C"),{id:t,hasId:n,fingerprint:i,replay:s?structuredClone(s.result):null}}function fr(r,e,t){e.hasId&&(r.set(e.id,{fingerprint:e.fingerprint,result:structuredClone(t)}),r.size>256&&r.delete(r.keys().next().value))}var to=new Set(["comparison.capture","comparison.load","comparison.show","comparison.end","comparison.inspect","proposal.prepare","proposal.inspect","proposal.commit","proposal.cancel","construction.prepare","construction.commit","construction.cancel","design.inspect","view.isolate"]),jd=new Set(["meshes.put","meshes.remove","views.put","views.remove","measurements.put","measurements.remove","edit.brush","edit.apply","transaction.commit","selection.transform","prefabs.put","prefabs.remove","prefabs.place","history.undo","history.redo","objects.put","objects.rename","selectionSets.put","selectionSets.remove","collections.put","collections.remove","palettes.put","palettes.remove","workplanes.put","workplanes.remove"]),Jd=new Set(["proposal.inspect","design.inspect","comparison.inspect"]);function Nn(r,e){throw Object.assign(Error(e),{code:r})}var dr=class{constructor({api:e,execute:t,summary:n,proposal:i,operations:s,preview:o,comparison:a=()=>null}){Object.assign(this,{api:e,execute:t,summary:n,proposal:i,operations:s,preview:o,comparison:a})}get methods(){return[...to]}async request(e){try{let t=hr(e,this.api.receipts);if(t.replay)return t.replay;let n=e.method,i=e.params||{};if(this.comparison()&&!hl(n)&&Nn("COMPARISON_ACTIVE",ai),!to.has(n))return this.preview()&&jd.has(n)&&Nn("PREVIEW_ACTIVE","\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u9884\u89C8"),this.api.execute(e,t);let s=n.startsWith("comparison.")?await this.execute("comparison",{...i,operation:n.slice(11)}):n.startsWith("proposal.")?await this.proposalRequest(n,i):await this.constructionRequest(n,i),o={schema:"craftstudio-design/1",id:e.id??null,ok:!0,workspaceId:this.api.workspaceId,revision:this.api.revision,value:s};return Jd.has(n)||fr(this.api.receipts,t,o),o}catch(t){let n=typeof e?.method=="string"?e.method:"";return{schema:"craftstudio-design/1",id:e?.id??null,ok:!1,workspaceId:this.api.workspaceId,revision:this.api.revision,error:{code:t.code||(n.startsWith("proposal.")?"PROPOSAL_REJECTED":to.has(n)?"CONSTRUCTION_REJECTED":"EDIT_REJECTED"),message:t.message,details:t.details||{}}}}}async proposalRequest(e,t){if(e==="proposal.prepare"){if(this.api.guard(t),t.space&&t.space!=="local")throw Error("\u63D0\u6848\u4F7F\u7528\u5C40\u90E8\u5750\u6807\uFF1B\u4E16\u754C\u5750\u6807\u53EF\u901A\u8FC7\u81EA\u7531\u7F16\u8F91\u4E8B\u52A1\u8F6C\u6362");return await this.execute("preview",{operations:this.api.operations(this.api.getSite(),t)}),{...this.proposal(),summary:this.summary()}}if(e==="proposal.inspect"){(t.expectedRevision!==void 0||t.workspaceId)&&this.api.guard({...t,expectedRevision:t.expectedRevision??this.api.revision});let n=this.proposal();if(!n)throw(t.proposalId||typeof t.cursor=="string"&&t.cursor.includes("@"))&&Nn("PROPOSAL_CHANGED","\u63D0\u6848\u5DF2\u7ED3\u675F\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6"),Error("\u6CA1\u6709\u5F85\u68C0\u67E5\u7684\u63D0\u6848");let i=t.cursor===void 0?0:Number(t.cursor);if(typeof t.cursor=="string"&&t.cursor.includes("@")){let[a,c,l]=t.cursor.split("@");a!==n.id&&Nn("PROPOSAL_CHANGED","\u63D0\u6848\u5DF2\u88AB\u66FF\u6362\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6"),i=l===void 0&&c!==""?Number(c):NaN}t.proposalId&&t.proposalId!==n.id&&Nn("PROPOSAL_CHANGED","\u63D0\u6848\u5DF2\u88AB\u66FF\u6362\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6");let s=Math.min(2e4,t.limit??1e3);if(!Number.isSafeInteger(i)||i<0||!Number.isInteger(s)||s<1)throw Error("\u63D0\u6848\u5206\u9875\u53C2\u6570\u65E0\u6548");let o=this.operations();return{...n,summary:this.summary(),operations:o.slice(i,i+s),nextCursor:i+s<o.length?n.id+"@"+(i+s):null,total:o.length}}return(!t.proposalId||t.proposalId!==this.proposal()?.id)&&Nn("PROPOSAL_CHANGED","\u63D0\u6848\u5DF2\u88AB\u66FF\u6362\u6216\u7ED3\u675F\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6"),e==="proposal.commit"&&this.api.guard(t),this.execute(e==="proposal.commit"?"accept":"cancel",t)}async constructionRequest(e,t){(t.expectedRevision!==void 0||t.workspaceId)&&this.api.guard({...t,expectedRevision:t.expectedRevision??this.api.revision});let n={"construction.prepare":"prepareConstruction","construction.commit":"commitConstruction","construction.cancel":"cancelConstruction","design.inspect":"designInspect","view.isolate":"viewIsolation"},i=await this.execute(n[e],t);return e==="construction.prepare"&&!t.includeMesh&&(delete i.buckets,delete i.removedBuckets,delete i.textures),i}};var pr=new TextEncoder().encode(`craftstudio-regions/1
`);function $d(r){let{min:e,max:t}=r||{};if(!Array.isArray(e)||!Array.isArray(t)||e.length!==3||t.length!==3||[...e,...t].some(n=>!Number.isSafeInteger(n))||e.some((n,i)=>n>t[i]||t[i]-n>=4096))throw Error("MCA \u533A\u57DF\u9700\u8981\u6709\u6548\u6574\u6570 min/max XYZ\uFF0C\u5355\u8F74\u8303\u56F4\u6700\u591A 4096 \u683C");return{min:[...e],max:[...t]}}function Zd({min:r,max:e}){let t=[];for(let n=Math.floor(r[2]/512);n<=Math.floor(e[2]/512);n++)for(let i=Math.floor(r[0]/512);i<=Math.floor(e[0]/512);i++)t.push([i,n]);return t}function Kd(r,e){let t=new Map;for(let s of r){let[o,a]=Bi(s.name),c=o+","+a;if(t.has(c))throw Error("\u91CD\u590D\u7684 MCA \u533A\u57DF\uFF1A"+s.name+"\uFF1B\u8BF7\u9009\u62E9\u540C\u4E00\u7EF4\u5EA6\u7684\u6587\u4EF6");t.set(c,s)}let n=Zd(e),i=n.filter(([s,o])=>!t.has(s+","+o));if(i.length)throw Error("\u9009\u533A\u8FD8\u9700\u8981\u8FD9\u4E9B MCA \u6587\u4EF6\uFF1A"+i.map(([s,o])=>`r.${s}.${o}.mca`).join("\u3001"));return n.map(([s,o])=>t.get(s+","+o))}function Qd(r,e){let[t,n]=Bi(r);return{min:[Math.max(e.min[0],t*512),e.min[1],Math.max(e.min[2],n*512)],max:[Math.min(e.max[0],t*512+511),e.max[1],Math.min(e.max[2],n*512+511)]}}function ep(r,e,t="\u5B58\u6863\u573A\u5730"){let n=$d(e),i=Kd(r,n),s=Oe(t);s.origin=[...n.min],s.size=n.max.map((l,u)=>l-n.min[u]+1),s.metadata.originConfirmed=!0,s.metadata.sourceFormat="mca",s.metadata.regionFiles=i.map(l=>l.name),s.metadata.missingChunks=0;let o=new Map,a=new Set,c=new Set;for(let l of i){let u=Qd(l.name,n),h=Vi(l.bytes,l.name,u.min,u.max);for(let f of h.metadata.dataVersions||[h.dataVersion])a.add(f);s.metadata.missingChunks+=h.metadata.missingChunks||0;for(let f of h.metadata.clippedSurfaceColumns||[]){let p=f%4096+h.origin[0]-n.min[0],m=Math.floor(f/4096)+h.origin[2]-n.min[2];c.add(p+4096*m)}let d=h.palette.map(f=>{let p=V(f);return o.has(p)||(o.set(p,s.palette.length),s.palette.push(f)),o.get(p)});for(let f of h.blocks)s.blocks.push({...f,pos:f.pos.map((p,m)=>p+h.origin[m]-n.min[m]),state:d[f.state]})}return s.metadata.dataVersions=[...a].sort((l,u)=>l-u),s.metadata.clippedSurfaceColumns=[...c],s.dataVersion=a.size===1?s.metadata.dataVersions[0]:0,s.warnings.push("MCA \u573A\u5730\u9009\u533A\uFF1A\u6309\u4E16\u754C\u5750\u6807\u5408\u5E76 "+i.length+" \u4E2A\u533A\u57DF\u6587\u4EF6\uFF1B\u4FDD\u7559\u65B9\u5757\u548C\u65B9\u5757\u5B9E\u4F53\uFF0C\u4E0D\u5BFC\u5165\u5B9E\u4F53\u3001\u5149\u7167\u3001\u751F\u7269\u7FA4\u7CFB\u6216\u8BA1\u5212\u523B\u3002"),s.metadata.missingChunks&&s.warnings.push(s.metadata.missingChunks+" \u4E2A\u533A\u5757\u7F3A\u5931\u6216\u5C1A\u672A\u751F\u6210\uFF1B\u672A\u8865\u9020\u5730\u5F62\u3002"),c.size&&s.warnings.push(c.size+" \u5217\u4E0A\u65B9\u4ECD\u6709\u65B9\u5757\uFF1B\u5730\u8868\u4E0A\u4E0B\u6587\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u63D0\u9AD8\u4E16\u754C\u7EC8\u70B9 Y \u540E\u7528\u4E8E\u81EA\u52A8\u8D34\u5730\u8BBE\u8BA1\u3002"),a.size>1&&s.warnings.push("\u9009\u533A\u5305\u542B\u4E0D\u540C DataVersion\uFF0C\u6574\u4F53\u7248\u672C\u8BB0\u4E3A\u672A\u77E5\uFF1B\u4FDD\u7559\u539F\u72B6\u6001\u4E0E NBT\uFF0C\u4E0D\u6267\u884C\u6E38\u620F DataFixer \u5347\u7EA7\u3002"),s}function yl(r){if(r.length<pr.length+4||pr.some((a,c)=>r[c]!==a))throw Error("\u65E0\u6548 MCA \u9009\u533A\u8F93\u5165");let e=new DataView(r.buffer,r.byteOffset,r.byteLength),t=e.getUint32(pr.length,!1),n=pr.length+4;if(n+t>r.length)throw Error("MCA \u9009\u533A\u6587\u4EF6\u5934\u622A\u65AD");let i=JSON.parse(new TextDecoder().decode(r.subarray(n,n+t)));if(!Array.isArray(i.files)||!i.files.length)throw Error("MCA \u9009\u533A\u6CA1\u6709\u533A\u57DF\u6587\u4EF6");let s=n+t,o=i.files.map(a=>{if(!Number.isSafeInteger(a.length)||a.length<8192||s+a.length>r.length)throw Error("MCA \u9009\u533A\u533A\u57DF\u8BB0\u5F55\u622A\u65AD");let c={name:a.name,bytes:r.subarray(s,s+a.length)};return s+=a.length,c});if(s!==r.length)throw Error("MCA \u9009\u533A\u5B58\u5728\u591A\u4F59\u6570\u636E");return ep(o,i.region,i.name)}function mr(r,e){if(!Array.isArray(e)||!e.length)throw Error("\u91CD\u547D\u540D\u9700\u8981\u975E\u7A7A names \u5217\u8868");let t=new Map(r.design.objects.map(s=>[s.id,s])),n=new Map,i=[];for(let s of e){let o=t.get(s?.id);if(!o||typeof s.name!="string"||!s.name.trim())throw Error("\u91CD\u547D\u540D\u9700\u8981\u73B0\u6709\u5BF9\u8C61 id \u548C\u975E\u7A7A\u540D\u79F0");if(n.has(s.id))throw Error("\u540C\u4E00\u4E2A\u5BF9\u8C61\u4E0D\u80FD\u91CD\u590D\u63D0\u4EA4\u540D\u79F0");let a=s.name.trim();n.set(s.id,a),a!==o.name&&i.push({id:s.id,before:o.name,name:a})}return r.design.objects=r.design.objects.map(s=>n.has(s.id)?{...s,name:n.get(s.id)}:s),{renamed:i.length,names:i}}function Gt(r){if(r?.schema!=="craftstudio-prefab/1"||!Array.isArray(r.blocks)||!r.blocks.length)throw Error("\u6784\u4EF6\u6587\u4EF6\u9700\u8981 craftstudio-prefab/1 \u548C\u975E\u7A7A blocks");if(r.blocks.length>1e6)throw Error("\u6784\u4EF6\u65B9\u5757\u6570\u91CF\u8FC7\u5927\uFF0C\u8BF7\u62C6\u5206\u6784\u4EF6");if(!Array.isArray(r.size)||r.size.length!==3||r.size.some(n=>!Number.isSafeInteger(n)||n<1||n>4096))throw Error("\u6784\u4EF6 size \u9700\u8981 1\u20134096 \u7684\u6574\u6570 XYZ \u5C3A\u5BF8");let e=new Set,t=r.blocks.map((n,i)=>{if(!Array.isArray(n?.pos)||n.pos.length!==3||n.pos.some((a,c)=>!Number.isSafeInteger(a)||a<0||a>=r.size[c]))throw Error("\u6784\u4EF6\u7B2C "+(i+1)+" \u4E2A\u65B9\u5757\u4F4D\u7F6E\u8D85\u51FA size");let s=L(...n.pos);if(e.has(s))throw Error("\u6784\u4EF6\u5305\u542B\u91CD\u590D\u65B9\u5757\u4F4D\u7F6E\uFF1A"+n.pos.join(", "));e.add(s);let o=Number.isInteger(n.state)&&Array.isArray(r.palette)?r.palette[n.state]:n.state;if(typeof o?.Name!="string"||!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(o.Name))throw Error("\u6784\u4EF6\u7B2C "+(i+1)+" \u4E2A\u65B9\u5757\u7F3A\u5C11\u6709\u6548\u72B6\u6001\uFF1B\u9700\u8981 Name \u6216\u6709\u6548 palette \u7D22\u5F15");if(o.Properties!==void 0&&(!o.Properties||typeof o.Properties!="object"||Array.isArray(o.Properties)||Object.values(o.Properties).some(a=>typeof a!="string")))throw Error("\u6784\u4EF6\u65B9\u5757 Properties \u9700\u8981\u5B57\u7B26\u4E32\u5C5E\u6027\u503C");return o===n.state?n:{...n,state:o}});return{...r,blocks:t}}var gr=r=>Array.isArray(r.tags)?r.tags.filter(e=>typeof e=="string"):[];function vl(r,{query:e="",category:t="",sort:n="recent"}={}){let i=e.trim().toLowerCase().split(/\s+/).filter(Boolean),s=r.filter(o=>{let a=gr(o),c=[o.name,...a,o.size.join("\xD7"),o.size.join("x")].join(" ").toLowerCase();return(!t||a.includes(t))&&i.every(l=>c.includes(l))});return n==="name"?s.sort((o,a)=>(o.name||"").localeCompare(a.name||"","zh-CN")):s.reverse()}var li=(r,e)=>{let t=r.at(e);return t?{state:structuredClone(r.palette[t.state]),nbt:structuredClone(t.nbt||null)}:null},yr=(r,e)=>!r&&!e||!!r&&!!e&&V(r.state)===V(e.state)&&JSON.stringify(r.nbt||null)===JSON.stringify(e.nbt||null);function xl(r,e=0,t=!1){let[n,i,s]=r;t&&(n=-n);for(let o=0;o<(e%4+4)%4;o++)[n,s]=[-s,n];return[n,i,s]}function cn(r,e){return xl(r,e.turn,e.mirror).map((t,n)=>t+e.origin[n])}function no(r,e){let t=xl(r.map((n,i)=>n-e.origin[i]),4-(e.turn||0),!1);return e.mirror&&(t[0]=-t[0]),t}function ci(r,e,t=0,n=!1){let[i,s,o]=[0,0,0],[a,,c]=r;n&&(i=a-1);for(let l=0;l<(t%4+4)%4;l++)[i,o]=[c-1-o,i],[a,c]=[c,a];return{origin:[i,s,o].map((l,u)=>l+e[u]),turn:(t%4+4)%4,mirror:!!n}}function Dn(r,e,t=0,n=!1){return{origin:e(r.origin),turn:((t+(n?-(r.turn||0):r.turn||0))%4+4)%4,mirror:!!n!=!!r.mirror}}var he=(r,e)=>({Name:r.includes(":")?r:"minecraft:"+r,...e?{Properties:e}:{}}),_l=()=>({objects:[],prefabs:[],animations:{},cameras:[],lighting:"day"});function ye(r){return r.design||(r.design=_l())}function*tp(r,e,t){let n=i=>i.pos.every((s,o)=>s>=e[o]&&s<=t[o]);if(!r.baseChunks){for(let i of r.cells.values())n(i)&&(yield i);for(let i of r.overlay.values())!r.cells.has(L(...i.pos))&&n(i)&&(yield i);return}for(let i of new Set([...r.baseChunks.keys(),...r.overlayChunks.keys()]))if(!i.split(",").map(o=>Number(o)*16).some((o,a)=>o>t[a]||o+15<e[a])){for(let o of r.baseChunks.get(i)?.values()||[])n(o)&&(yield o);for(let o of r.overlayChunks.get(i)?.values()||[])!r.cells.has(L(...o.pos))&&n(o)&&(yield o)}}function bl(r,e,t,{all:n=!1,keys:i=null,regions:s=null}={}){if(e?.length!==3||t?.length!==3||[...e,...t].some(l=>!Number.isInteger(l))||e.some((l,u)=>l<0||l>t[u])||t.some(l=>l>=4096))throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u6574\u6570\u8303\u56F4");let o=s?Fe({min:e,max:t,regions:s}):null,a=!n&&!s&&r.design?.objects.find(l=>l.min.every((u,h)=>u===e[h])&&l.max.every((u,h)=>u===t[h])),c=i?new Set(i.map(l=>Array.isArray(l)?L(...l):l)):a?.cells?new Set(a.cells):null;return{object:a,accepts:l=>(!o||o(l.pos))&&(c?c.has(L(...l.pos)):!a||r.overlay.has(L(...l.pos)))}}function*Ml(r,e,t,n){for(let i of tp(r,e,t)){let s=r.at(i.pos);s&&n.accepts(s)&&(yield s)}}function*Ln(r,e,t,n={}){yield*Ml(r,e,t,bl(r,e,t,n))}function io(r,e,t,n={}){let i=bl(r,e,t,n),s=[...Ml(r,e,t,i)];return s.sort((o,a)=>o.pos[1]-a.pos[1]||o.pos[2]-a.pos[2]||o.pos[0]-a.pos[0]),{cells:s,object:i.object}}function _e(r,e,t,{all:n=!1,keys:i=null,regions:s=null}={}){let{cells:o,object:a}=io(r,e,t,{all:n,keys:i,regions:s}),c=o.map(u=>({pos:u.pos.map((h,d)=>h-e[d]),state:structuredClone(r.palette[u.state]),...u.nbt?{nbt:structuredClone(u.nbt)}:{}})),l=a&&r.design.animations[a.id]?structuredClone(r.design.animations[a.id]):null;if(l)for(let u of["center","min","max"])l[u]&&(l[u]=l[u].map((h,d)=>h-e[d]));return{schema:"craftstudio-prefab/1",name:"\u9009\u533A\u6784\u4EF6",size:t.map((u,h)=>u-e[h]+1),blocks:c,...l?{animation:l}:{}}}function Wt(r,e=0,t=!1){let n=structuredClone(r),i=n.Properties;if(!i)return n;let s=["north","east","south","west"];for(let a of["facing","horizontal_facing"])if(s.includes(i[a])){let c=s.indexOf(i[a]);t&&(c=(4-c)%4),i[a]=s[(c+e+4)%4]}e%2&&["x","z"].includes(i.axis)&&(i.axis=i.axis==="x"?"z":"x"),i.rotation!==void 0&&(i.rotation=String(((t?-Number(i.rotation):Number(i.rotation))+e*4+16)%16)),t&&(i.hinge&&(i.hinge=i.hinge==="left"?"right":"left"),i.shape&&(i.shape=i.shape.replace(/left|right/g,a=>a==="left"?"right":"left")));let o={};for(let a of s)if(a in i){let c=s.indexOf(a);t&&(c=(4-c)%4),o[s[(c+e+4)%4]]=i[a],delete i[a]}return Object.assign(i,o),n}function pt(r,e,{turn:t=0,mirror:n=!1,count:i=1,step:s=[0,0,0]}={}){if(r=Gt(r),!Number.isInteger(i)||i<1||i>100||r.blocks.length*i>1e6)throw Error("\u9635\u5217\u6570\u91CF\u8FC7\u5927");return t=(t%4+4)%4,Array.from({length:i},(o,a)=>r.blocks.map(c=>{let[l,u,h]=c.pos,[d,,f]=r.size;n&&(l=d-1-l);for(let p=0;p<t;p++)[l,h]=[f-1-h,l],[d,f]=[f,d];return{type:"set",pos:[l,u,h].map((p,m)=>p+e[m]+s[m]*a),state:Wt(c.state,t,n),...c.nbt?{nbt:c.nbt}:{},reason:"\u6784\u4EF6 "+r.name}})).flat()}function wl(r,{at:e=[0,0,0],width:t=11,depth:n=9,height:i=5,state:s=he("stone_bricks"),roof:o=he("dark_oak_planks"),name:a=r}={}){for(let f of[...e,t,n,i])if(!Number.isInteger(f))throw Error("\u5EFA\u7B51\u53C2\u6570\u9700\u8981\u6574\u6570");if(t<3||n<3||i<1||t>100||n>100||i>100)throw Error("\u5EFA\u7B51\u5C3A\u5BF8\u4E0D\u5408\u9002");let c=new Map,l=(f,p,m,g=s)=>c.set(L(f,p,m),{pos:[f,p,m],state:g});if(r==="wall")for(let f=0;f<t;f++)for(let p=0;p<i;p++)l(f,p,0);else if(r==="stairs"||r==="path")for(let f=0;f<n;f++)for(let p=0;p<t;p++)l(p,r==="stairs"?f:0,f,r==="stairs"?he("stone_brick_stairs",{facing:"south",half:"bottom",shape:"straight",waterlogged:"false"}):s);else if(r==="arch"){let f=(t-1)/2;for(let p=0;p<t;p++){let m=Math.round(i+Math.sqrt(Math.max(0,f*f-(p-f)**2)));l(p,m,0)}for(let p of[0,t-1])for(let m=0;m<=i;m++)l(p,m,0)}else if(r==="roof")for(let f=0;f<n;f++)for(let p=0;p<t;p++)l(p,Math.min(p,t-1-p),f,o);else if(r==="house"||r==="windmill"){for(let p=0;p<t;p++)for(let m=0;m<n;m++)l(p,0,m,he("spruce_planks"));for(let p=1;p<=i;p++)for(let m=0;m<t;m++)for(let g=0;g<n;g++)if(m===0||g===0||m===t-1||g===n-1){let y=(m===0||m===t-1)&&(g===0||g===n-1),b=!y&&p>=2&&p<=3&&(m%4===2||g%4===2);l(m,p,g,y?he("stripped_spruce_log",{axis:"y"}):b?he("glass_pane",{north:"false",east:"true",south:"false",west:"true",waterlogged:"false"}):s)}let f=Math.floor(t/2);for(let p=1;p<=2;p++)l(f,p,0,he("spruce_door",{facing:"north",half:p===1?"lower":"upper",hinge:"left",open:"false",powered:"false"}));for(let p=0;p<n;p++)for(let m=0;m<t;m++)l(m,i+1+Math.min(m,t-1-m),p,m===Math.floor(t/2)?o:he(o.Name.replace("_planks","_stairs"),{facing:m<t/2?"east":"west",half:"bottom",shape:"straight",waterlogged:"false"}));for(let p of[0,n-1])for(let m=1;m<t-1;m++)for(let g=i+1;g<i+1+Math.min(m,t-1-m);g++)l(m,g,p,m===Math.floor(t/2)?he("stripped_spruce_log",{axis:"y"}):s);for(let p=0;p<n;p++)l(Math.floor(t/2),i+1+Math.floor(t/2),p,he("dark_oak_slab",{type:"bottom",waterlogged:"false"}));for(let p=1;p<t-1;p++)l(p,1,1,he("spruce_slab",{type:"bottom",waterlogged:"false"}));if(l(1,1,n-2,he("crafting_table")),l(2,1,n-2,he("barrel",{facing:"up",open:"false"})),l(t-2,1,n-2,he("lantern",{hanging:"false",waterlogged:"false"})),r==="windmill"){let p=Math.floor(t/2),m=i+4;for(let g=-4;g<=4;g++)l(p+g,m,n,he("create:white_sail",{facing:"south"})),l(p,m+g,n,he("create:white_sail",{facing:"south"}));l(p,m,n,he("create:windmill_bearing",{facing:"south"}))}}else throw Error("\u4E0D\u652F\u6301\u751F\u6210\u5668 "+r);let u=[...c.values()],h=[0,1,2].map(f=>Math.max(...u.map(p=>p.pos[f]))+1),d={schema:"craftstudio-prefab/1",name:a,size:h,blocks:u};return{prefab:d,operations:pt(d,e),min:e,max:e.map((f,p)=>f+h[p]-1)}}function Sl(r,e,t,n=[]){let i=null;for(let s=2;s<r.base.size[2]-t-2;s+=2)for(let o=2;o<r.base.size[0]-e-2;o+=2){if(n.some(d=>o<d.max[0]+3&&o+e>d.min[0]-3&&s<d.max[2]+3&&s+t>d.min[2]-3))continue;let a=4095,c=0,l=0,u=!0;for(let d=0;d<e;d++)for(let f=0;f<t;f++){let p=r.column(o+d,s+f);if(p.ground===null||p.water!==null||p.top>p.ground+1){u=!1;break}a=Math.min(a,p.ground),c=Math.max(c,p.ground),l=Math.max(l,p.top)}if(!u||c-a>7)continue;let h=(c-a)*10+c*.1;(!i||h<i.score)&&(i={at:[o,l+2,s],score:h,ground:[a,c]})}if(!i)throw Error("\u6CA1\u6709\u627E\u5230\u4FDD\u7559\u5730\u5F62\u548C\u690D\u88AB\u7684\u5B8C\u6574\u7A7A\u5730\uFF0C\u8BF7\u624B\u52A8\u9009\u5740");return i}function vr(r,e,t,n){let i=wl(e,t),s=i.operations;if(e==="house"||e==="windmill"){let c=r.platform([i.min[0],i.min[2]],[i.min[0]+t.width-1,i.min[2]+t.depth-1],i.min[1],he("stone_bricks"),4),l=c.operations.slice(1).filter(u=>{for(let h=u.min[1];h<=u.max[1];h++)if(r.at([u.min[0],h,u.min[2]],!0))return!1;return!0});if(l.length<4)throw Error("\u53EF\u843D\u5730\u652F\u67F1\u4E0D\u8DB3\uFF0C\u8BF7\u8C03\u6574\u9009\u5740");s=[c.operations[0],...l,...s]}if(e==="house"||e==="windmill"){let c=i.min[0]+Math.floor(t.width/2);for(let l=1;l<=8;l++){let u=i.min[2]-l,h=i.min[1]-l+1;if(u<0||h<0)break;let d=r.column(c,u);if(d.ground===null||h<=d.ground||r.at([c,h,u],!0))break;if(s.push({type:"set",pos:[c,h,u],state:he("stone_brick_stairs",{facing:"south",half:"bottom",shape:"straight",waterlogged:"false"}),reason:"\u5165\u53E3\u987A\u5761\u53F0\u9636"}),d.ground+1<h)for(let f=d.ground+1;f<h;f++)r.at([c,f,u],!0)||s.push({type:"set",pos:[c,f,u],state:he("stone_bricks"),reason:"\u5165\u53E3\u652F\u6491"})}}if(e==="windmill"){let c=i.min[0]+t.width,l=i.min[2]+2,u=i.min[1],h=!0;for(let d=c;d<c+4;d++)for(let f=l;f<l+t.depth-4;f++){let p=r.column(d,f);(p.ground===null||p.water!==null||p.top>=u)&&(h=!1)}if(h){for(let d=c;d<c+4;d++)for(let f=l;f<l+t.depth-4;f++)if(s.push({type:"set",pos:[d,u,f],state:he("spruce_planks"),reason:"\u5EAD\u9662\u9732\u53F0"}),(d===c+3||f===l||f===l+t.depth-5)&&s.push({type:"set",pos:[d,u+1,f],state:he("spruce_fence"),reason:"\u5EAD\u9662\u680F\u6746"}),d===c+3&&(f===l||f===l+t.depth-5)){let p=r.column(d,f);for(let m=p.ground+1;m<u;m++)r.at([d,m,f],!0)||s.push({type:"set",pos:[d,m,f],state:he("stone_bricks"),reason:"\u5EAD\u9662\u652F\u67F1"})}}}let o=structuredClone(ye(r));r.operations(s,n);let a={id:crypto.randomUUID(),name:t.name||e,min:i.min.map((c,l)=>Math.min(c,...s.map(u=>u.pos?.[l]??u.min?.[l]??c))),max:i.max.map((c,l)=>Math.max(c,...s.map(u=>u.pos?.[l]??u.max?.[l]??c))),kind:e,cells:r.changedPositions.map(c=>L(...c)),hidden:!1,locked:!1};return ye(r).objects.push(a),r.undo.length&&(r.undo.at(-1).design=o),e==="windmill"&&(ye(r).animations[a.id]={type:"rotate",axis:"z",rpm:12,center:[i.min[0]+Math.floor(t.width/2)+.5,i.min[1]+t.height+4+.5,i.min[2]+t.depth+.5],min:[i.min[0],i.min[1]+t.height,i.min[2]+t.depth],max:i.max}),a}function xr(r,{min:e,max:t,at:n,move:i=!1,turn:s=0,mirror:o=!1,count:a=1,step:c=[0,0,0],members:l=null,regions:u=null},h){let d=_e(r,e,t,{keys:l,regions:u});if(d.blocks.some(_=>_.nbt)&&(s||o))throw Error("\u5E26\u65B9\u5757\u5B9E\u4F53\u7684\u7ED3\u6784\u8BF7\u4F7F\u7528\u539F\u751F\u84DD\u56FE\uFF0C\u907F\u514D\u8F6C\u5411\u635F\u574F\u5173\u8054\u6570\u636E");s=(s%4+4)%4;let f=pt(d,n,{turn:s,mirror:o,count:a,step:c});i&&f.unshift(...d.blocks.map(_=>{let v=_.pos.map((M,x)=>M+e[x]);return{type:"erase",min:v,max:v,reason:"\u79FB\u52A8\u539F\u9009\u533A"}}));let p=structuredClone(ye(r)),m=new Set(d.blocks.map(_=>L(..._.pos.map((v,M)=>v+e[M])))),g=ye(r).objects.filter(_=>_.cells?.length?_.cells.every(v=>m.has(v)):_.min.every((v,M)=>v===e[M])&&_.max.every((v,M)=>v===t[M])),y=new Map(g.flatMap(_=>(_.componentRecords||[]).map(v=>[L(...v.pos),v.manual||!yr(li(r,v.pos),v.after)]))),b=new Map(f.filter(_=>_.type==="set").map(_=>{let v=r.at(_.pos);return[L(..._.pos),i&&m.has(L(..._.pos))?null:v?{state:structuredClone(r.palette[v.state]),nbt:structuredClone(v.nbt||null)}:null]}));r.operations(f,h),r.undo.length&&(r.undo.at(-1).design=p);for(let _ of g){let v=p.objects.find(M=>M.id===_.id);for(let M=0;M<a;M++){let x=n.map((P,A)=>P+c[A]*M),E=(P,A=!0)=>{let[I,N,D]=P.map((z,G)=>z-e[G]),[U,,F]=d.size;o&&(I=U-(A?1:0)-I);for(let z=0;z<s;z++)[I,D]=[F-(A?1:0)-D,I],[U,F]=[F,U];return[I,N,D].map((z,G)=>z+x[G])},w=i&&M===0?_:{...structuredClone(v),id:crypto.randomUUID(),name:_.name+" \xB7 \u526F\u672C"},S=v.cells||d.blocks.map(P=>L(...P.pos.map((A,I)=>A+e[I]))),T=S.map(P=>E([P%4096,Math.floor(P/16777216),Math.floor(P/4096)%4096]));if(w.cells=T.map(P=>L(...P)),w.min=[0,1,2].map(P=>Math.min(...T.map(A=>A[P]))),w.max=[0,1,2].map(P=>Math.max(...T.map(A=>A[P]))),i&&M===0&&v.instancePose)w.instancePose=Dn(v.instancePose,P=>E(P),s,o),w.instanceTransform={turn:w.instancePose.turn,mirror:w.instancePose.mirror},w.componentRecords=(v.componentRecords||[]).map(P=>{let A=E(P.pos),I=r.at(A);return{...P,pos:A,manual:!!y.get(L(...P.pos)),before:b.get(L(...A))||null,after:I?{state:structuredClone(r.palette[I.state]),nbt:structuredClone(I.nbt||null)}:null}});else if(!i)for(let P of["instanceOf","instanceTransform","instancePose","componentRecords","componentRevision"])delete w[P];i&&M===0||ye(r).objects.push(w);let C=p.animations[v.id];if(C){let P=structuredClone(C);if(P.center&&(P.center=E(P.center,!1)),P.min&&P.max){let A=[E(P.min),E(P.max)];P.min=[0,1,2].map(I=>Math.min(...A.map(N=>N[I]))),P.max=[0,1,2].map(I=>Math.max(...A.map(N=>N[I])))}s%2&&["x","z"].includes(P.axis)&&(P.axis=P.axis==="x"?"z":"x"),ye(r).animations[w.id]=P}}}return f.length}function El(r,e,t){let n=r.project(),i=_e(r,e,t,{all:!0});return{...n,name:r.title+" \xB7 \u88C1\u5207",size:i.size,origin:r.origin.map((s,o)=>s+e[o]),palette:r.palette,blocks:i.blocks.map(s=>({...s,state:r.state(s.state)})),entities:[],metadata:{...n.metadata,design:_l(),crop:{min:e,max:t,entitiesOmitted:!0}},warnings:[...n.warnings||[],"\u88C1\u5207\u4FDD\u7559\u65B9\u5757\u5B9E\u4F53\uFF1B\u533A\u57DF\u5B9E\u4F53\u987B\u7528\u5B8C\u6574\u533A\u57DF\u84DD\u56FE\u4FDD\u7559"]}}function Al(r,e){return e.flatMap(t=>{if(t.type==="build")return wl(t.kind,t.params).operations;if(t.type==="insertPrefab"){let n=ye(r).prefabs.find(i=>i.id===t.id);if(!n)throw Error("AI \u6307\u5B9A\u7684\u6784\u4EF6\u4E0D\u5B58\u5728");return pt(n,t.at,t)}if(t.type==="restyle"){let n=ye(r).objects.find(i=>i.id===t.id);if(!n)throw Error("AI \u6307\u5B9A\u7684\u5BF9\u8C61\u4E0D\u5B58\u5728");return _e(r,n.min,n.max).blocks.filter(i=>i.state.Name===t.from).map(i=>({type:"set",pos:i.pos.map((s,o)=>s+n.min[o]),state:t.state,reason:"AI \u5C40\u90E8\u6362\u6750"}))}return[t]})}function _r(r,e,t,n={},i={}){let s=pt(e,t,n),o=structuredClone(ye(r));r.operations(s,i),r.undo.length&&(r.undo.at(-1).design=o);let a=(n.turn||0)%4,c=!!n.mirror,l=a%2?[e.size[2],e.size[1],e.size[0]]:e.size;for(let u=0;u<(n.count||1);u++){let h=t.map((f,p)=>f+(n.step?.[p]||0)*u),d={id:crypto.randomUUID(),name:e.name||"\u6784\u4EF6",min:h,max:h.map((f,p)=>f+l[p]-1),cells:pt(e,h,{turn:a,mirror:c}).map(f=>L(...f.pos)),kind:"prefab"};if(ye(r).objects.push(d),e.animation){let f=structuredClone(e.animation),p=(m,g=!1)=>{let[y,b,_]=m,[v,,M]=e.size;c&&(y=v-(g?1:0)-y);for(let x=0;x<a;x++)[y,_]=[M-(g?1:0)-_,y],[v,M]=[M,v];return[y,b,_].map((x,E)=>x+h[E])};if(f.center&&(f.center=p(f.center)),f.min&&f.max){let m=[p(f.min,!0),p(f.max,!0)];f.min=[0,1,2].map(g=>Math.min(...m.map(y=>y[g]))),f.max=[0,1,2].map(g=>Math.max(...m.map(y=>y[g])))}a%2&&["x","z"].includes(f.axis)&&(f.axis=f.axis==="x"?"z":"x"),ye(r).animations[d.id]=f}}return s.length}function br(r,e,t,n={},i={}){let s=n.overlap||"empty";if(!["empty","overwrite","replace"].includes(s))throw Error("\u672A\u77E5\u91CD\u53E0\u5904\u7406\u65B9\u5F0F");let o=pt(e,t,n).filter(l=>{let u=!!r.at(l.pos);return s==="empty"?!u:s==="replace"?u:!0});if(e.blocks.some(l=>l.nbt)&&(n.turn||n.mirror))throw Error("\u5E26\u65B9\u5757\u5B9E\u4F53\u7684\u6784\u4EF6\u65CB\u8F6C\u9700\u4F7F\u7528\u539F\u751F\u84DD\u56FE\uFF0C\u5E73\u79FB\u53EF\u4FDD\u7559\u6570\u636E");if(!o.length)throw Error("\u6CA1\u6709\u53EF\u653E\u7F6E\u7684\u4F4D\u7F6E\uFF0C\u8BF7\u79FB\u52A8\u9884\u89C8\u6216\u66F4\u6539\u91CD\u53E0\u65B9\u5F0F");let a=structuredClone(ye(r));if(r.operations(o,{...i,allowExisting:s==="empty"?i.allowExisting:!0}),!r.changedPositions.length)throw Error("\u76EE\u6807\u65B9\u5757\u5DF2\u7ECF\u76F8\u540C\uFF0C\u65E0\u9700\u91CD\u590D\u653E\u7F6E");r.undo.at(-1).design=a;let c=r.changedPositions;return ye(r).objects.push({id:crypto.randomUUID(),name:e.name+" \xB7 \u7C98\u8D34",kind:"prefab",cells:[...new Set(c.map(l=>L(...l)))],min:[0,1,2].map(l=>c.reduce((u,h)=>Math.min(u,h[l]),1/0)),max:[0,1,2].map(l=>c.reduce((u,h)=>Math.max(u,h[l]),-1/0))}),c.length}function Tl(r,{offset:e,cursor:t,limit:n=1e3},i){if(e=e??(t===void 0?0:Number(t)),!Number.isSafeInteger(e)||e<0||!Number.isSafeInteger(n)||n<1||n>i)throw Error("\u6784\u4EF6\u5206\u9875\u9700\u8981\u6709\u6548\u7684 offset/limit");return{items:r.slice(e,e+n),nextCursor:e+n<r.length?String(e+n):null}}function Mr(r,e){let t=(r.design.prefabs||[]).find(n=>n.id===e);if(!t)throw Error("\u6784\u4EF6\u5DF2\u4E0D\u5B58\u5728");return t}var Cl=r=>({id:r.id,name:r.name,size:[...r.size],blockCount:r.blocks.length,tags:gr(r),hasBlockEntities:r.blocks.some(e=>!!e.nbt)});function Il(r,e,t){if(e==="prefabs.list"){let s=vl(r.design.prefabs||[],t),o=Tl(s,t,2e4);return{...o,items:o.items.map(Cl),total:s.length}}let n=Gt(Mr(r,t.id)),i=Tl(n.blocks,t,2e4);return{prefab:structuredClone({...n,blocks:i.items}),totalBlocks:n.blocks.length,nextCursor:i.nextCursor}}function np(r,e={}){let t=r.name===void 0?e.name||"\u65B0\u6784\u4EF6":r.name,n=r.tags===void 0?gr(e):r.tags;if(typeof t!="string"||!t.trim()||!Array.isArray(n)||n.some(i=>typeof i!="string"))throw Error("\u8BF7\u8F93\u5165\u6784\u4EF6\u540D\u79F0\u548C\u6587\u5B57\u5206\u7C7B");return{name:t.trim(),tags:[...new Set(n.map(i=>i.trim()).filter(Boolean))]}}function Un(r,e,t,n={}){let i=r.design.prefabs||[];if(e==="prefabs.remove")return Mr(r,t.id),r.design.prefabs=r.design.prefabs.filter(l=>l.id!==t.id),{id:t.id,removed:!0};if(e==="prefabs.place"){if(!Array.isArray(t.at)||t.at.length!==3||t.at.some(d=>!Number.isSafeInteger(d)))throw Error("\u653E\u7F6E\u9700\u8981\u6574\u6570 XYZ \u5750\u6807 at");let l=Mr(r,t.id),u=br(r,l,t.at,t,n),h=r.design.objects.at(-1);return{id:l.id,objectId:h.id,blocks:u,skipped:l.blocks.length*(t.count??1)-u,protectedSkipped:r.lastSkipped,min:h.min,max:h.max}}let s;if(t.prefab)s=Gt(t.prefab);else if(t.selection){let l=t.selection;s=Gt(_e(r,l.min,l.max,{keys:l.members,regions:l.regions}))}else s=Mr(r,t.id);let o=t.id??s.id??crypto.randomUUID();if(typeof o!="string"||!o)throw Error("\u6784\u4EF6 id \u9700\u8981\u975E\u7A7A\u6587\u5B57");let a=i.find(l=>l.id===o),c={...s,...np(t.prefab||t,a||s),id:o};return r.design.prefabs=i.some(l=>l.id===o)?i.map(l=>l.id===o?c:l):[...i,c],Cl(c)}function Rl(r){return"\uFEFF"+r.map(e=>e.map(t=>'"'+String(t??"").replaceAll('"','""')+'"').join(",")).join(`\r
`)}function ip(r,e){let t=e.originConfirmed?"world_":"local_";return Rl([[t+"x",t+"y",t+"z","action","category","before","after","reason"],...r.map(n=>[...e.originConfirmed?n.pos.map((i,s)=>i+e.origin[s]):n.pos,n.action,n.category,JSON.stringify(n.before),JSON.stringify(n.after),n.reason])])}function Pl(r){let e={};for(let t of r.blocks){let n=r.palette[t.state].Name;n!=="minecraft:air"&&n!=="minecraft:structure_void"&&(e[n]=(e[n]||0)+1)}return e}function Nl(r,{kind:e,selection:t}){if(!["full","selection","additions","patch"].includes(e))throw Error("\u672A\u77E5\u7684\u4EA4\u4ED8\u8303\u56F4");let n=r.diff();if(e==="selection"){if(!t)throw Error("\u8BF7\u5148\u9009\u62E9\u5EFA\u7B51\u6216\u533A\u57DF");let s=Fe(t),o=!t.regions&&r.design.objects.find(l=>l.min.every((u,h)=>u===t.min[h])&&l.max.every((u,h)=>u===t.max[h])),a=t.members||o?.cells,c=a?new Set(a.map(l=>Array.isArray(l)?L(...l):l)):null;n=n.filter(l=>s(l.pos)&&(!c||c.has(L(...l.pos))))}e==="additions"&&(n=n.filter(s=>s.after));let i={};for(let s of n)s.after&&(i[s.after.Name]=(i[s.after.Name]||0)+1);return{source:{name:r.base.name,dataVersion:r.base.dataVersion,sourceHash:r.sourceHash,sourceBlocks:r.cells.size,originConfirmed:r.originConfirmed,worldOrigin:r.originConfirmed?[...r.origin]:null},changedCells:n.length,changesCSV:ip(n,r),materials:i}}function Dl({title:r,kind:e,blueprint:t,report:n,projectBytes:i}){let s=t.materials||n.materials,o=e==="full"?"changed-materials.csv":"materials.csv",a={"blueprint.nbt":t.bytes,"changes.csv":Ae(n.changesCSV),[o]:Ae(Rl([["block","count"],...Object.keys(s).sort().map(l=>[l,s[l]])]))};i&&(a["project.craftlite"]=i);let c={localOffset:t.offsetLocal,worldOffset:t.offsetWorld,containsAir:t.containsAir};return a["placement.json"]=Ae(JSON.stringify(c,null,2)),a["manifest.json"]=Ae(JSON.stringify({schema:"craftstudio-delivery/1",title:r,kind:e,createdAt:new Date().toISOString(),source:n.source,placement:c,size:t.size,records:t.blocks,entities:t.entities??null,entitySelection:t.entitySelection||(e==="full"?"all":"none"),entityWarnings:t.entityWarnings||[],changedCells:n.changedCells,materialsScope:e==="full"?"changed placements":"exported placements",includesEditableProject:!!i,files:[...Object.keys(a),"manifest.json","README.txt"]},null,2)),a["README.txt"]=Ae([r,"blueprint.nbt \u662F Minecraft Java \u7ED3\u6784\u84DD\u56FE\uFF0C\u53EF\u4F9B Create \u7B49\u517C\u5BB9\u5DE5\u5177\u8BFB\u53D6\u3002","\u653E\u7F6E\u53C2\u8003\u70B9\u89C1 placement.json\u3002worldOffset \u4E3A null \u65F6\uFF0C\u53EA\u786E\u5B9A\u5C40\u90E8\u504F\u79FB\uFF0C\u9700\u8981\u5728\u76EE\u6807\u5B58\u6863\u4E2D\u81EA\u884C\u9009\u62E9\u653E\u7F6E\u70B9\u3002",e==="patch"?"\u672C\u5305\u5305\u542B\u660E\u786E\u62C6\u9664\u7A7A\u6C14\uFF1B\u662F\u5426\u6267\u884C\u62C6\u9664\u53D6\u51B3\u4E8E\u6E38\u620F\u5DE5\u5177\u7684\u7C98\u8D34\u7B56\u7565\u3002":"\u672C\u5305\u6309\u6240\u9009\u8303\u56F4\u5BFC\u51FA\uFF1B\u4E0D\u8981\u628A\u672A\u5217\u51FA\u7684\u5B54\u6D1E\u5F53\u6210\u62C6\u9664\u6307\u4EE4\u3002","changes.csv \u53EA\u8BB0\u5F55\u8FD9\u4E2A\u8303\u56F4\u5185\u7684\u672C\u6B21\u53D8\u66F4\u3002","\u573A\u666F\u5B9E\u4F53\uFF1A"+(t.entities??(e==="full"?"\u5B8C\u6574\u573A\u666F\u4FDD\u7559":0))+(t.entitySelection==="bounds"?"\uFF1B\u6309\u9009\u533A\u5916\u63A5\u8303\u56F4\u9009\u53D6\uFF0C\u4E0D\u63A8\u65AD\u5BF9\u8C61\u5F52\u5C5E\u3002":"\u3002"),...t.entityWarnings||[],e==="full"?"changed-materials.csv \u7EDF\u8BA1\u672C\u6B21\u53D8\u66F4\u6240\u9700\u7684\u653E\u7F6E\u6750\u6599\uFF0C\u4E0D\u662F\u6574\u4E2A\u539F\u573A\u5730\u7684\u6750\u6599\u603B\u91CF\u3002":"materials.csv \u7EDF\u8BA1\u6B64\u84DD\u56FE\u7684\u653E\u7F6E\u6750\u6599\uFF0C\u7A7A\u6C14\u4E0D\u8BA1\u5165\u6750\u6599\u3002",i?"project.craftlite \u5305\u542B\u5B8C\u6574\u573A\u5730\u53CA\u53EF\u7F16\u8F91\u8BBE\u8BA1\uFF0C\u5728 CraftStudio \u4E2D\u6253\u5F00\u4EE5\u7EE7\u7EED\u8BBE\u8BA1\u3002":"\u672C\u5305\u672A\u9644\u5E26\u5B8C\u6574\u53EF\u7F16\u8F91\u5DE5\u7A0B\u3002","\u6E38\u620F\u4E2D\u4ECD\u9700\u4F7F\u7528\u5305\u542B\u76F8\u5E94\u65B9\u5757\u7684\u7248\u672C\u4E0E Mod\u3002"].join(`
`)),Mi(a,{level:0})}function Ll(r){let e=new Set(["manifest.json","placement.json","blueprint.nbt","project.craftlite"]),t=pn(r,{filter:s=>e.has(s.name)});if(!t["manifest.json"])throw Error("\u4E0D\u662F CraftStudio \u65BD\u5DE5\u4EA4\u4ED8\u5305\uFF1B\u6750\u8D28\u5305\u8BF7\u4ECE\u8D44\u6E90\u5E93\u5BFC\u5165");let n=JSON.parse(He(t["manifest.json"]));if(n.schema!=="craftstudio-delivery/1")throw Error("\u4E0D\u652F\u6301\u7684\u65BD\u5DE5\u4EA4\u4ED8\u5305\u683C\u5F0F");if(t["project.craftlite"])return{manifest:n,projectBytes:t["project.craftlite"]};if(!t["blueprint.nbt"]||!t["placement.json"])throw Error("\u4EA4\u4ED8\u5305\u7F3A\u5C11\u84DD\u56FE\u6216\u5750\u6807\u8BF4\u660E");let i=JSON.parse(He(t["placement.json"]));if(i.worldOffset!==null&&(!Array.isArray(i.worldOffset)||i.worldOffset.length!==3||!i.worldOffset.every(Number.isSafeInteger)))throw Error("\u4EA4\u4ED8\u5305\u7684\u4E16\u754C\u653E\u7F6E\u5750\u6807\u65E0\u6548");return{manifest:n,placement:i,blueprintBytes:t["blueprint.nbt"]}}function Ul(r,e,t){let n=[],i=0;for(let s of r||[]){let o=s.v?.pos,a=o?.t===9&&o.v?.[0]===6?o.v[1]:null;if(s.t!==10||!Array.isArray(a)||a.length!==3||a.some(u=>!Number.isFinite(u))){i++;continue}if(!a.every((u,h)=>u>=e[h]&&u<t[h]+1))continue;let c=structuredClone(s);c.v.pos.v[1]=a.map((u,h)=>u-e[h]);let l=c.v.blockPos;l?.t===9&&l.v[0]===3&&l.v[1].length===3&&(l.v[1]=l.v[1].map((u,h)=>u-e[h])),n.push(c)}return{entities:n,unlocated:i}}function ro(r,e,t=null,{includeEntities:n=!1}={}){let i=Array.from(e);if(!i.length&&(!t||!n))throw Error("\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u65B9\u5757\u6216\u53D8\u66F4");let s=t?[...t.min]:[1/0,1/0,1/0],o=t?[...t.max]:[-1/0,-1/0,-1/0];if(!t)for(let p of i)for(let m=0;m<3;m++)s[m]=Math.min(s[m],p.pos[m]),o[m]=Math.max(o[m],p.pos[m]);let a=[],c=new Map,l=!1,u=i.map(p=>{let m=p.state<0?{Name:"minecraft:air"}:r.palette[p.state];l||=m.Name==="minecraft:air";let g=V(m);return c.has(g)||(c.set(g,a.length),a.push(structuredClone(m))),{pos:p.pos.map((y,b)=>y-s[b]),state:c.get(g),...p.nbt?{nbt:structuredClone(p.nbt)}:{}}}),h=r.origin.map((p,m)=>p+s[m]),d=n?Ul(r.base.entities,s,o):{entities:[],unlocated:0};if(!i.length&&!d.entities.length)throw Error("\u8303\u56F4\u5185\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u65B9\u5757\u6216\u5B9E\u4F53");let f=d.unlocated?["\u6E90\u5DE5\u7A0B\u6709 "+d.unlocated+" \u4E2A\u5B9E\u4F53\u7F3A\u5C11\u53EF\u8BC6\u522B\u7684\u5C40\u90E8\u4F4D\u7F6E\uFF0C\u672A\u52A0\u5165\u5C40\u90E8\u84DD\u56FE\uFF1B\u5B8C\u6574\u5DE5\u7A0B\u4ECD\u4FDD\u7559\u5B83\u4EEC\u3002"]:[];return{project:{schema:1,name:r.title,dataVersion:r.base.dataVersion,size:o.map((p,m)=>p-s[m]+1),origin:h,palette:a,blocks:u,entities:d.entities,metadata:{},warnings:f},offsetLocal:s,offsetWorld:r.originConfirmed?h:null,containsAir:l,entities:d.entities.length,entitySelection:n?"bounds":"none",entityWarnings:f}}function wr(r,e="additions"){if(!["additions","patch"].includes(e))throw Error("\u672A\u77E5\u7684\u84DD\u56FE\u53D8\u66F4\u8303\u56F4");function*t(){for(let n of r.overlay.values())(e==="patch"||n.state>=0)&&(yield n)}return ro(r,t())}var kl=new Set(["mesh","assetPreview","selectionPreview","prepareConstruction"]);function rp(r,e){let t=[];if(e instanceof Uint8Array)t.push(e.buffer);else if(r==="meshSourceGeometry")t.push(e.positions.buffer);else if(kl.has(r)||r==="meshChunks"||r==="createScene"){let n=kl.has(r)?e.buckets:r==="meshChunks"?e.chunks.flatMap(i=>i.buckets):Object.values(e.definitions).flatMap(i=>i.buckets);r==="assetPreview"&&n.push(...Object.values(e.motions?.definitions||{}).flatMap(i=>i.buckets));for(let i of n)for(let s of[i.positions,i.normals,i.colors,i.uv])s&&t.push(s.buffer)}else e?.bytes instanceof Uint8Array&&t.push(e.bytes.buffer);return r==="selectionPreview"&&ArrayBuffer.isView(e.members)&&t.push(e.members.buffer),t}var Sr=class{constructor({execute:e,postMessage:t,clock:n=()=>performance.now()}){this.execute=e,this.postMessage=t,this.clock=n,this.queue=Promise.resolve()}handle(e){let t=e.trace?this.clock():null;return this.queue=this.queue.then(()=>this.respond(e,t)),this.queue}async respond({id:e,action:t,data:n},i){let s=i===null?null:this.clock();try{let o=await this.execute(t,n||{}),a=s===null?null:{queueWaitMs:s-i,executeMs:this.clock()-s};this.postMessage({id:e,value:o,...a?{performance:a}:{}},rp(t,o))}catch(o){this.postMessage({id:e,error:o.message})}}};var Ol={title:"save-title",tags:"save-tags",kind:"save-kind",note:"save-note"};function Er(r){return r?.schema!=="craftstudio-save-form/1"||!Object.keys(Ol).every(e=>typeof r[e]=="string")?null:{schema:r.schema,...Object.fromEntries(Object.keys(Ol).map(e=>[e,r[e]]))}}function Fl(r){let e=new Uint16Array(r.length*3);for(let t=0;t<r.length;t++){let n=r[t];if(n.length!==3||n.some(i=>!Number.isInteger(i)||i<0||i>4095))throw Error("\u9009\u533A\u65B9\u5757\u5750\u6807\u65E0\u6548");e.set(n,t*3)}return e}function zl(r,e,t,n={}){let{cells:i}=io(r,e,t,n),s=t.map((c,l)=>c-e[l]+1),o=new Le({...Oe(),size:s,palette:[],blocks:[]}),a=[];o.palette=r.palette;for(let c of i){let l=c.pos.map((u,h)=>u-e[h]);a.push(l),o.cells.set(L(...l),{pos:l,state:c.state})}return{site:o,members:a,size:s,count:i.length}}var Ar=class{constructor(){this.previous=null}capture(e,{workspaceId:t,revision:n,baseKey:i,cachedRevision:s,cachedWorkspaceId:o,allowDelta:a=!1}){let c={workspaceId:t,revision:n,baseKey:i};if(s===n&&o===t)return{...c,cached:!0};let l=this.previous,u={...e.packHeader(),size:[...e.size]},h=new Map(e.overlay.chunks),d;if(a&&l?.workspaceId===t&&l.baseKey===i&&l.revision===s&&o===t){let f=[];for(let p of new Set([...l.roots.keys(),...h.keys()]))if(l.roots.get(p)!==h.get(p)){let m=h.get(p),g=m?.keys().next().value??l.roots.get(p).keys().next().value;f.push({key:Pt(Z(g)),blocks:m?[...m.values()].map(y=>({...y,state:y.state<0?null:e.palette[y.state]})):[]})}d={...c,mode:"chunks",baseRevision:l.revision,snapshot:u,chunks:f}}else d={...c,snapshot:{...u,overlay:[...e.overlay.values()].map(f=>({...f,state:f.state<0?null:e.palette[f.state]}))}};return this.previous={...c,roots:h},d}};function Bl(r,e){let t=[];for(let n of new Set([...r.overlay.keys(),...e.overlay.keys()])){let i=Z(n),s=r.at(i),o=e.at(i);(s?V(r.palette[s.state]):null)===(o?V(e.palette[o.state]):null)&&JSON.stringify(s?.nbt||null)===JSON.stringify(o?.nbt||null)||t.push({type:"set",pos:i,state:o?e.palette[o.state]:null,nbt:o?.nbt||null,reason:"AI / \u65B9\u6848\u9884\u89C8"})}return t}function Vl(r,e){let t={add:0,replace:0,remove:0,terrain:0,total:e.length};for(let n of e){let i=r.at(n.pos);n.state===null?t.remove++:i?t.replace++:t.add++,[i?r.palette[i.state].Name:null,n.state?.Name].some(o=>o&&["ground","water"].includes(De(o)))&&t.terrain++}return t}function Hl(r,e,t,n){let i=r.fork();if(i.operations(t,n||{}),i.lastSkipped)throw Error("\u65B9\u6848\u5305\u542B\u88AB\u4FDD\u62A4\u7684\u6539\u52A8\uFF0C\u8BF7\u8C03\u6574\u65B9\u6848\u6216\u653E\u7F6E\u6761\u4EF6\u540E\u91CD\u65B0\u786E\u8BA4");return i.design=structuredClone(e.design),i}function sp(r,e=2){return r.length?{min:[0,1,2].map(t=>Math.max(0,r.reduce((n,i)=>Math.min(n,i.min[t]),1/0)-e)),max:[0,1,2].map(t=>Math.min(4095,r.reduce((n,i)=>Math.max(n,i.max[t]),-1/0)+e))}:null}function Xt(r,{objectIds:e=[],keys:t=[],includeNew:n=!1,padding:i=2,selection:s=null}){let o=new Set,a=r.design.objects.filter(u=>e.includes(u.id)),c=new Set(e.length?a.flatMap(u=>u.cells||[]):t),l=sp(a.length?a:s?[s]:[],i);if(n&&l){let u=new Set(r.design.objects.filter(d=>!e.includes(d.id)&&d.min.every((f,p)=>f<=l.max[p])&&d.max.every((f,p)=>f>=l.min[p])).flatMap(d=>d.cells||[])),h=[];if(r.overlayChunks)for(let d=Math.floor(l.min[0]/16);d<=Math.floor(l.max[0]/16);d++)for(let f=Math.floor(l.min[1]/16);f<=Math.floor(l.max[1]/16);f++)for(let p=Math.floor(l.min[2]/16);p<=Math.floor(l.max[2]/16);p++)for(let m of r.overlayChunks.get([d,f,p].join(","))?.values()||[])h.push(m);else h.push(...r.overlay.values());o=u;for(let d of h)d.state>=0&&!u.has(L(...d.pos))&&d.pos.every((f,p)=>f>=l.min[p]&&f<=l.max[p])&&c.add(L(...d.pos))}return{keys:c,bounds:l,objects:a,excluded:o}}var op=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];function ap(r,e={}){let t=e.selection?Fe(e.selection):null;if(e.selection?.members&&!Array.isArray(e.selection.members))throw Error("\u9009\u533A\u6210\u5458\u9700\u8981\u5750\u6807\u6570\u7EC4");if(e.selection?.members?.some(i=>Array.isArray(i)?i.length!==3||i.some(s=>!Number.isInteger(s)||s<0||s>=4096):!Number.isInteger(i)||i<0||i>=4096**3))throw Error("\u9009\u533A\u6210\u5458\u5750\u6807\u65E0\u6548");let n=e.selection?.members?new Set(e.selection.members.map(i=>Array.isArray(i)?L(...i):i)):null;if(e.selection&&!n&&(!e.selection.min||!e.selection.max||e.selection.min.length!==3||e.selection.max.length!==3||e.selection.min.some((i,s)=>!Number.isInteger(i)||!Number.isInteger(e.selection.max[s])||i<0||e.selection.max[s]>=4096||i>e.selection.max[s])))throw Error("\u8499\u7248\u9009\u533A\u4E0D\u5B8C\u6574");if(e.minY!==void 0&&(!Number.isInteger(e.minY)||e.minY<0||e.minY>4095)||e.maxY!==void 0&&(!Number.isInteger(e.maxY)||e.maxY<0||e.maxY>4095)||e.minY!==void 0&&e.maxY!==void 0&&e.minY>e.maxY)throw Error("\u9AD8\u5EA6\u8499\u7248\u9700\u8981\u6709\u6548\u7684\u5C40\u90E8\u6574\u6570\u8303\u56F4");return i=>{let s=r.at(i),o=s?r.palette[s.state]:null;return!(t&&!t(i)||e.limitBounds&&i.some((a,c)=>a<e.limitBounds.min[c]||a>e.limitBounds.max[c])||e.minY!==void 0&&i[1]<e.minY||e.maxY!==void 0&&i[1]>e.maxY||e.matchName&&o?.Name!==e.matchName||e.emptyOnly&&s||e.surface&&(!s||!op.some(a=>{let c=i.map((u,h)=>u+a[h]);if(c.some(u=>u<0||u>=4096))return!0;let l=r.at(c);return!l||/:(water|lava)$/.test(r.palette[l.state].Name)})))}}var Tr=r=>r.match(/_(fence_gate|trapdoor|door|stairs|slab|fence|wall|pane|carpet)$/)?.[0]||"";function lp(r,e,t,{retainShape:n=!0,preserveProperties:i=!0}={}){let s=e.Name,o=Tr(r.Name);if(n&&!o&&Tr(s)){let l=s.replace(/_(fence_gate|trapdoor|door|stairs|slab|fence|wall|pane|carpet)$/,"");if(s=[l+"s",l,l+"_planks",l+"_block"].find(u=>t.has(u)),!s)return null}if(n&&o&&Tr(s)!==o){let l=s.replace(/_(fence_gate|trapdoor|door|stairs|slab|fence|wall|pane|carpet)$/,"").replace(/_planks$|_block$/,"").replace(/bricks$/,"brick"),u=l+o;if(!t.has(u))return null;s=u}let a=t.get(s)?.choices||{},c={};for(let[l,u]of Object.entries(e.Properties||{}))(!Object.keys(a).length||a[l]?.includes(u))&&(c[l]=u);if(i)for(let[l,u]of Object.entries(r.Properties||{}))(s===r.Name||a[l]?.includes(u)||o&&o===Tr(s)&&!a[l]&&["facing","half","shape","type","waterlogged","north","east","south","west","up","hinge","open","powered"].includes(l))&&(c[l]=u);return{Name:s,...Object.keys(c).length?{Properties:c}:{}}}function kn(r,{points:e,mode:t="draw",state:n,mask:i={},retainShape:s=!0,preserveProperties:o=!0},a=new Map){if(!["draw","paint","erase","place"].includes(t)||!Array.isArray(e)||e.some(d=>d?.length!==3||d.some(f=>!Number.isInteger(f)||f<0||f>=4096)))throw Error("\u65E0\u6548\u5DE5\u5177\u64CD\u4F5C");if(t!=="erase"&&(!n?.Name||!n.Name.includes(":")))throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u76EE\u6807\u6750\u8D28");let c=ap(r,i),l=[],u=new Set,h=0;for(let d of new Map(e.map(f=>[L(...f),f])).values()){if(d?.length!==3||d.some(m=>!Number.isInteger(m)||m<0||m>=4096))throw Error("\u65B9\u5757\u5750\u6807\u9700\u4E3A 0\u20134095 \u7684\u6574\u6570");let f=r.at(d);if(!c(d)||t==="paint"&&(!f||/:(water|lava)$/.test(r.palette[f.state].Name))){h++;continue}let p=t==="erase"?null:n;if(t==="paint"){if(p=lp(r.palette[f.state],n,a,{retainShape:s,preserveProperties:o}),!p){h++,u.add("\u90E8\u5206\u6750\u8D28\u6CA1\u6709\u5BF9\u5E94\u5F62\u6001\uFF0C\u539F\u65B9\u5757\u5DF2\u4FDD\u7559");continue}if(f.nbt&&p.Name!==r.palette[f.state].Name){h++,u.add("\u542B\u65B9\u5757\u5B9E\u4F53\u6570\u636E\u7684\u4F4D\u7F6E\u5DF2\u4FDD\u7559\uFF1B\u8BF7\u4F7F\u7528\u660E\u786E\u66FF\u6362\u64CD\u4F5C");continue}}l.push({type:"set",pos:[...d],state:p,reason:t==="paint"?"\u8868\u9762\u6D82\u6539":t==="erase"?"\u8FDE\u7EED\u64E6\u9664":t==="place"?"\u5355\u70B9\u653E\u7F6E":"\u8FDE\u7EED\u7ED8\u5236",...t==="paint"&&f.nbt?{nbt:f.nbt}:{}})}return{operations:l,filtered:h,warnings:[...u]}}function Gl(r,e){let t=pn(new Uint8Array(r),{filter:o=>/^assets\/[^/]+\//.test(o.name)&&!o.name.endsWith("/")&&!o.name.split("/").includes("..")}),n=Object.keys(t);if(!n.length)throw Error(e+" \u4E2D\u6CA1\u6709\u53EF\u8BFB\u53D6\u7684 assets \u8D44\u6E90");let i=[...new Set(n.map(o=>o.split("/")[1]))],s=/\.zip$/i.test(e)?"pack":i.includes("create")?"create":i.every(o=>o==="minecraft")?"vanilla":"mod";return{name:e,kind:s,namespaces:i,count:n.length,bytes:Mi(t,{level:1})}}function Wl(r,{count:e=3,spacing:t=6,mode:n="spacing",closed:i=!1,follow:s=!1}={}){if(!Array.isArray(r)||r.length<2||r.some(g=>!Array.isArray(g)||g.length!==3||g.some(y=>!Number.isFinite(y))))throw Error("\u8BF7\u63D0\u4F9B\u6709\u6548\u7684\u4E09\u7EF4\u8DEF\u5F84");if(!Number.isInteger(e)||e<1||e>100||!["spacing","count"].includes(n))throw Error("\u8DEF\u5F84\u9635\u5217\u6570\u91CF\u6216\u65B9\u5F0F\u65E0\u6548");if(n==="spacing"&&(!Number.isFinite(t)||t<1||t>1024))throw Error("\u8DEF\u5F84\u95F4\u8DDD\u5E94\u4E3A 1\u20131024 \u683C");let o=(g,y)=>Math.hypot(...g.map((b,_)=>b-y[_])),a=o(r[0],r.at(-1))<1e-8;i=i||a;let c=r.map(g=>[...g]);i&&!a&&c.push([...c[0]]);let l=[],u=0;for(let g=1;g<c.length;g++){let y=o(c[g-1],c[g]);if(!Number.isFinite(y)||!Number.isFinite(u+y))throw Error("\u8DEF\u5F84\u957F\u5EA6\u8D85\u51FA\u53EF\u7528\u8303\u56F4");y&&(l.push({a:c[g-1],b:c[g],start:u,size:y}),u+=y)}if(!u)throw Error("\u8DEF\u5F84\u6CA1\u6709\u6709\u6548\u957F\u5EA6");let h=n==="count"?u/(i?e:Math.max(1,e-1)):t,d=[],f=new Set,p=0,m=0;for(let g=0;g<e;g++){let y=n==="count"&&e===1?0:g*h;if(i?y>=u-1e-8:y>u+1e-8)break;for(;m<l.length-1&&y>l[m].start+l[m].size+1e-8;)m++;let b=l[m],_=Math.min(1,Math.max(0,(y-b.start)/b.size)),v=b.a.map((x,E)=>Math.round(x+(b.b[E]-x)*_)),M=v.join(",");if(f.has(M)){p++;continue}f.add(M),d.push({pos:v,turn:s?(Math.round(Math.atan2(b.b[0]-b.a[0],-(b.b[2]-b.a[2]))/(Math.PI/2))%4+4)%4:0})}return{placements:d,length:u,spacing:h,closed:i,mode:n,duplicates:p,requested:e}}function Xl(r,e={}){if(e.spacingMode&&!["offset","gap"].includes(e.spacingMode))throw Error("\u672A\u77E5\u9635\u5217\u95F4\u8DDD\u65B9\u5F0F");if(e.spacingMode!=="gap"){if(e.step!==void 0&&!Array.isArray(e.step))throw Error("\u9635\u5217\u4F4D\u79FB\u9700\u4E3A XYZ \u6570\u7EC4");let c=(e.step||[6,0,0]).map(Number);if(c.length!==3||c.some(l=>!Number.isInteger(l)||Math.abs(l)>4095)||c.every(l=>l===0))throw Error("\u9635\u5217\u4F4D\u79FB\u9700\u4E3A\u4E09\u4E2A\u6574\u6570\uFF0C\u4E14\u4E0D\u80FD\u5168\u90E8\u4E3A\u96F6");return{mode:"offset",step:c}}let t=["x","y","z"].indexOf(e.axis||"x"),n=Number(e.gap??2),i=Number(e.direction??1);if(t<0||!Number.isFinite(n)||Math.abs(n)>4095||![1,-1].includes(i))throw Error("\u8BF7\u8BBE\u7F6E\u6709\u6548\u65B9\u5411\u548C\u7A7A\u9699");let s=r.max[t]-r.min[t]+1,o=Math.round(s+n);if(o<=0||o>4095)throw Error("\u7A7A\u9699\u4E0E\u6784\u4EF6\u8DE8\u5EA6\u5F62\u6210\u7684\u6B65\u8DDD\u9700\u4E3A 1\u20134095 \u683C");let a=[0,0,0];return a[t]=i*o,{mode:"gap",axis:t,span:s,requestedGap:n,gap:o-s,step:a,snapped:s+n!==o}}var At=r=>structuredClone(r),un=(r,e)=>{let t=r.at(e);return t?{state:At(r.palette[t.state]),nbt:At(t.nbt||null)}:null},Cr=(r,e)=>!r&&!e||!!r&&!!e&&V(r.state)===V(e.state)&&JSON.stringify(r.nbt||null)===JSON.stringify(e.nbt||null),cp=(r,e)=>({type:"set",pos:[...r],state:e?.state||null,nbt:e?.nbt||null,reason:"\u7EC4\u4EF6\u5B9A\u4E49\u66F4\u65B0"});function ql(r){return r.length?{min:[0,1,2].map(e=>r.reduce((t,n)=>Math.min(t,n[e]),1/0)),max:[0,1,2].map(e=>r.reduce((t,n)=>Math.max(t,n[e]),-1/0))}:{}}function Yl(r,e,t,n,i,s,{turn:o=0,mirror:a=!1}={}){if(!t.id)throw Error("\u5148\u5C06\u7EC4\u4EF6\u6E90\u5EFA\u7ACB\u4E3A\u5BF9\u8C61");e.componentDefinitions||=[];let c=r.design.objects.find(f=>f.id===t.id)?.instanceOf||t.instanceOf||t.id,l=e.objects.find(f=>f.id===t.id),u=e.componentDefinitions.find(f=>f.id===c);u||(u={id:c,name:t.name,revision:0,blocks:At(n.blocks)},e.componentDefinitions.push(u),l.instancePose=ci(n.size,t.min,0,!1),l.componentRecords=n.blocks.map(f=>({pos:f.pos.map((p,m)=>p+t.min[m]),before:null,after:{state:At(f.state),nbt:At(f.nbt||null)}}))),l.instanceOf=c,l.instanceTransform||={turn:0,mirror:!1},i.instanceOf=c,i.instanceTransform={turn:o,mirror:a};let h=ci(n.size,s,o,a);i.instancePose=Dn(l.instancePose,f=>cn(f.map((p,m)=>p-t.min[m]),h),o,a),i.instanceTransform={turn:i.instancePose.turn,mirror:i.instancePose.mirror},i.componentRevision=u.revision;let d=new Map(n.blocks.map(f=>[L(...cn(f.pos,h)),f]));i.componentRecords=i.cells.map(f=>{let p=Z(f),m=d.get(f);return{pos:p,before:un(r,p),after:{state:Wt(m.state,o,a),nbt:At(m.nbt||null)}}}),i.generation&&(i.generation={...i.generation,detached:!0})}function jl(r,e,{manualStrategy:t="preserve",expandSelection:n=null}={}){let i=r.design.componentDefinitions?.find(f=>f.id===e.instanceOf);if(!i||!e.instancePose)throw Error("\u65E7\u5173\u8054\u5B9E\u4F8B\u7F3A\u5C11\u7EC4\u4EF6\u5B9A\u4E49\uFF0C\u8BF7\u5148\u5EFA\u7ACB\u65B0\u7684\u5173\u8054\u7EC4\u4EF6");if(!["preserve","overwrite"].includes(t))throw Error("\u624B\u6539\u5904\u7406\u65B9\u5F0F\u65E0\u6548");if(n&&(!n.min||!n.max||n.min.length!==3||n.max.length!==3||n.min.some((f,p)=>!Number.isInteger(f)||!Number.isInteger(n.max[p])||f<0||n.max[p]>=4096||f>n.max[p])||n.max.reduce((f,p,m)=>f*(p-n.min[m]+1),1)>1e6))throw Error("\u7EC4\u4EF6\u7F16\u8F91\u8303\u56F4\u65E0\u6548\u6216\u8FC7\u5927");let s=n?n.members||(()=>{let f=[];for(let p=n.min[0];p<=n.max[0];p++)for(let m=n.min[1];m<=n.max[1];m++)for(let g=n.min[2];g<=n.max[2];g++)f.push(L(p,m,g));return f})():e.cells,o=s.map(f=>{let p=Z(f),m=un(r,p);if(!m)return null;if(m.nbt&&(e.instancePose.turn||e.instancePose.mirror))throw Error("\u5E26\u539F\u751F\u65B9\u5757\u5B9E\u4F53\u6570\u636E\u7684\u65CB\u8F6C\u5B9E\u4F8B\u4E0D\u80FD\u4F5C\u4E3A\u5B9A\u4E49\u6765\u6E90");return{pos:no(p,e.instancePose),state:Wt(Wt(m.state,4-(e.instancePose.turn||0),!1),0,e.instancePose.mirror),...m.nbt?{nbt:m.nbt}:{}}}).filter(Boolean);if(!o.length)throw Error("\u7EC4\u4EF6\u5B9A\u4E49\u6CA1\u6709\u65B9\u5757");let a=At(r.design),c=new Map,l=[],u=a.objects.filter(f=>f.instanceOf===e.instanceOf),h=i.revision+1,d=0;for(let f of u){if(ut(a,f))throw Error("\u5173\u8054\u7EC4\u4EF6\u4E2D\u6709\u9501\u5B9A\u5BF9\u8C61\uFF1A"+f.name);if(!f.instancePose||!f.componentRecords)throw Error("\u5B9E\u4F8B\u7F3A\u5C11\u653E\u7F6E\u8BB0\u5F55\uFF1A"+f.name);if(f.id===e.id){f.cells=s.filter(b=>r.at(Z(b))),Object.assign(f,ql(f.cells.map(Z)));let y=new Map(f.componentRecords.map(b=>[L(...b.pos),b]));f.componentRecords=f.cells.map(b=>({pos:Z(b),before:y.get(b)?.before||null,after:un(r,Z(b))})),f.componentRevision=h;continue}if(o.some(y=>y.nbt)&&(f.instancePose.turn||f.instancePose.mirror))throw Error("\u539F\u751F\u65B9\u5757\u5B9E\u4F53\u7EC4\u4EF6\u7684\u65CB\u8F6C\u9700\u4F7F\u7528\u539F\u751F\u84DD\u56FE");let p=new Map(f.componentRecords.map(y=>[L(...y.pos),y])),m=new Map(o.map(y=>{let b=cn(y.pos,f.instancePose);if(b.some(_=>_<0||_>=4096||!Number.isInteger(_)))throw Error("\u7EC4\u4EF6\u66F4\u65B0\u8D85\u51FA\u753B\u5E03");return[L(...b),{pos:b,after:{state:Wt(y.state,f.instancePose.turn,f.instancePose.mirror),nbt:At(y.nbt||null)}}]})),g=[];for(let y of new Set([...p.keys(),...m.keys()])){let b=p.get(y),_=m.get(y),v=_?.pos||b.pos,M=un(r,v);if(t==="preserve"&&b&&(b.manual||!Cr(M,b.after))){g.push({...b,after:M,manual:!0}),d++;continue}if(!b&&M&&!Cr(M,_?.after))throw Error("\u7EC4\u4EF6\u6269\u5927\u540E\u4F1A\u8986\u76D6\u5176\u4ED6\u5185\u5BB9\uFF1A"+v.join(", "));let x=_?.after||b.before||null,E=b?b.before:M,w=cp(v,x);if(c.has(y)&&!Cr(c.get(y).after,x))throw Error("\u5173\u8054\u7EC4\u4EF6\u66F4\u65B0\u76EE\u6807\u4E92\u76F8\u51B2\u7A81");c.set(y,{operation:w,after:x}),_&&g.push({pos:v,before:E,after:x})}f.componentRecords=g,f.cells=g.map(y=>L(...y.pos)),Object.assign(f,ql(g.map(y=>y.pos))),f.componentRevision=h,f.generation&&(f.generation={...f.generation,detached:!0})}return a.componentDefinitions=a.componentDefinitions.map(f=>f.id===i.id?{...f,blocks:o,revision:h}:f),d&&l.push("\u4FDD\u7559 "+d+" \u4E2A\u5176\u4ED6\u5B9E\u4F8B\u7684\u5C40\u90E8\u624B\u6539\u6216\u5220\u9664"),{operations:[...c.values()].filter(f=>!Cr(un(r,f.operation.pos),f.after)).map(f=>f.operation),design:a,guide:[],warnings:l,usedRoles:{},componentUpdate:{instances:u.length,revision:h,preserved:d}}}function Jl(r,e){if(!e.instanceOf||!e.instancePose)throw Error("\u8BF7\u9009\u62E9\u6709\u7EC4\u4EF6\u5B9A\u4E49\u7684\u5173\u8054\u5B9E\u4F8B");let t=e.cells.map(a=>{let c=Z(a),l=un(r,c);if(!l)return null;if(l.nbt&&(e.instancePose.turn||e.instancePose.mirror))throw Error("\u5E26\u539F\u751F\u65B9\u5757\u5B9E\u4F53\u7684\u65CB\u8F6C\u7EC4\u4EF6\u4E0D\u80FD\u91CD\u65B0\u5B9A\u4E49");return{pos:no(c,e.instancePose),state:Wt(Wt(l.state,4-(e.instancePose.turn||0),!1),0,e.instancePose.mirror),...l.nbt?{nbt:l.nbt}:{}}}).filter(Boolean);if(!t.length)throw Error("\u7EC4\u4EF6\u6CA1\u6709\u65B9\u5757");let n=At(r.design),i=crypto.randomUUID(),s=e.name+" \xB7 \u72EC\u7ACB\u7EC4\u4EF6";n.componentDefinitions||=[],n.componentDefinitions.push({id:i,name:s,revision:0,blocks:t});let o=n.objects.find(a=>a.id===e.id);return o.instanceOf=i,o.componentRevision=0,o.componentRecords=o.cells.map(a=>({pos:Z(a),before:null,after:un(r,Z(a))})),{operations:[],design:n,guide:[],warnings:["\u5DF2\u5EFA\u7ACB\u72EC\u7ACB\u7EC4\u4EF6\u5B9A\u4E49\uFF1B\u539F\u5173\u8054\u7EC4\u4FDD\u6301\u539F\u6837"],usedRoles:{}}}var Tt=r=>({min:[0,1,2].map(e=>r.reduce((t,n)=>Math.min(t,n[e]),1/0)),max:[0,1,2].map(e=>r.reduce((t,n)=>Math.max(t,n[e]),-1/0))}),$l=(r,e,t=-4095,n=4095)=>{if(!Number.isInteger(r)||r<t||r>n)throw Error(e+"\u9700\u8981 "+t+"\u2013"+n+" \u7684\u6574\u6570");return r};function ui(r,e,{allowLocked:t=!1}={}){if(e.objectIds?.length){let c=e.objectIds.map(l=>r.design.objects.find(u=>u.id===l));if(c.some(l=>!l))throw Error("\u9009\u62E9\u5BF9\u8C61\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");if(!t&&c.some(l=>ut(r.design,l)))throw Error("\u9009\u62E9\u5305\u542B\u9501\u5B9A\u5BF9\u8C61");return c}if(!e.selection)throw Error("\u5148\u9009\u62E9\u5BF9\u8C61\u6216\u533A\u57DF");let{min:n,max:i,members:s,regions:o}=e.selection,a=_e(r,n,i,{keys:s,regions:o});if(!a.blocks.length)throw Error("\u9009\u62E9\u6CA1\u6709\u65B9\u5757");return[{id:null,name:"\u9009\u533A",min:n,max:i,cells:a.blocks.map(c=>L(...c.pos.map((l,u)=>l+n[u])))}]}var up=(r,e)=>_e(r,e.min,e.max,{keys:e.cells});function Zl(r,e){let t=e.filter(n=>n.state).map(n=>n.pos);return{...structuredClone(r),...Tt(t),cells:[...new Set(t.map(n=>L(...n)))]}}function hp(r,e){let t=In(r,"auto",e),n=t.u,i=t.v;return[n[1]*i[2]-n[2]*i[1],n[2]*i[0]-n[0]*i[2],n[0]*i[1]-n[1]*i[0]].reduce((o,a,c)=>o+a*t.normal[c],0)<0&&(t.v=t.v.map(o=>-o)),Xe(t)}function fp(r,e,t){let n={xz:[0,2],xy:[0,1],yz:[2,1]}[e],[i,s]=n,o=r.filter((h,d)=>!d||Math.hypot(h[i]-r[d-1][i],h[s]-r[d-1][s])>1e-8).map(h=>[...h]);o.length>1&&Math.hypot(o[0][i]-o.at(-1)[i],o[0][s]-o.at(-1)[s])<1e-8&&o.pop();let a=o.filter((h,d)=>{let f=o[(d+o.length-1)%o.length],p=o[(d+1)%o.length],m=[h[i]-f[i],h[s]-f[s]],g=[p[i]-h[i],p[s]-h[s]],y=Math.hypot(...m)*Math.hypot(...g);return!y||Math.abs(m[0]*g[1]-m[1]*g[0])>1e-9*y||m[0]*g[0]+m[1]*g[1]<=0});if(a.length<3)throw Error("\u8F6E\u5ED3\u6CA1\u6709\u6709\u6548\u9762\u79EF");let c=a.reduce((h,d,f)=>h+d[i]*a[(f+1)%a.length][s]-a[(f+1)%a.length][i]*d[s],0);if(Math.abs(c)<1e-6)throw Error("\u8F6E\u5ED3\u6CA1\u6709\u9762\u79EF");let l=Math.sign(c),u=[];for(let h=0;h<a.length;h++){let d=a[(h+a.length-1)%a.length],f=a[h],p=a[(h+1)%a.length],m=(v,M)=>{let x=M[i]-v[i],E=M[s]-v[s],w=Math.hypot(x,E)||1;return[l*E/w,-l*x/w]},g=m(d,f),y=m(f,p),b=1+g[0]*y[0]+g[1]*y[1];if(b<.02)throw Error("\u8F6E\u5ED3\u542B\u5C16\u9510\u6298\u8FD4\uFF0C\u8BF7\u5206\u6BB5\u504F\u79FB");let _=[...f];if(_[i]+=t*(g[0]+y[0])/b,_[s]+=t*(g[1]+y[1])/b,Math.hypot(_[i]-f[i],_[s]-f[s])>Math.abs(t)*8)throw Error("\u89D2\u70B9\u504F\u79FB\u8FC7\u5927\uFF0C\u8BF7\u51CF\u5C0F\u8DDD\u79BB");u.push(_)}if(t<0){for(let f=0;f<a.length;f++){let p=(f+1)%a.length,m=[a[p][i]-a[f][i],a[p][s]-a[f][s]],g=[u[p][i]-u[f][i],u[p][s]-u[f][s]];if(m[0]*g[0]+m[1]*g[1]<=1e-10*(m[0]*m[0]+m[1]*m[1]))throw Error("\u5411\u5185\u504F\u79FB\u4F7F\u8F6E\u5ED3\u8FB9\u754C\u6D88\u5931\u6216\u53CD\u5411\uFF0C\u8BF7\u51CF\u5C0F\u8DDD\u79BB")}let h=Tt(a),d=Tt(u);if(d.max[i]-d.min[i]>=h.max[i]-h.min[i]||d.max[s]-d.min[s]>=h.max[s]-h.min[s])throw Error("\u5411\u5185\u504F\u79FB\u8D85\u8FC7\u8F6E\u5ED3\u5BBD\u5EA6")}return u}function so(r,e,t=new Set,n=new Map([...t].map(i=>[i,{choices:{}}]))){let i=e.operation,s=structuredClone(r.design),o=[],a=[],c=[],l=null,u=null,h=()=>({operations:c,design:s,guide:a,arraySpacing:l,pathArray:u,warnings:[...new Set(o)],usedRoles:{}}),d=w=>{if(w.pos.some(S=>!Number.isInteger(S)||S<0||S>=4096))throw Error("\u7ED3\u679C\u8D85\u51FA\u753B\u5E03\uFF0C\u8BF7\u8C03\u6574\u95F4\u8DDD\u6216\u4F4D\u7F6E");if(c.push(w),c.length>1e6)throw Error("\u672C\u6B21\u64CD\u4F5C\u8FC7\u5927\uFF0C\u8BF7\u5206\u6279")};if(i==="paint"){let w;if(e.objectIds?.length)w=[...new Set(ui(r,e).flatMap(A=>A.cells))].map(Z);else{if(!e.selection)throw Error("\u8BF7\u5148\u9009\u62E9\u9700\u8981\u6362\u6750\u8D28\u7684\u5BF9\u8C61\u6216\u533A\u57DF");w=Array.from(Ln(r,e.selection.min,e.selection.max,{keys:e.selection.members,regions:e.selection.regions}),A=>A.pos)}if(!w.length)throw Error("\u9009\u62E9\u4E2D\u6CA1\u6709\u53EF\u66FF\u6362\u65B9\u5757");if(e.sourceName&&!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(e.sourceName))throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u6765\u6E90\u6750\u8D28");let S=new Map;for(let A of w){let I=r.at(A);if(I){let N=r.palette[I.state].Name;S.set(N,(S.get(N)||0)+1)}}let T=e.sourceName?w.filter(A=>{let I=r.at(A);return I&&r.palette[I.state].Name===e.sourceName}):w,C=kn(r,{points:T,mode:"paint",state:e.state,retainShape:e.retainShape!==!1,preserveProperties:!0},n),P=C.operations.filter(A=>V(r.palette[r.at(A.pos).state])!==V(A.state));return{operations:P,design:s,guide:[],warnings:C.warnings,usedRoles:{},materialChange:{selected:w.length,matched:T.length,excluded:w.length-T.length,sources:[...S].map(([A,I])=>({Name:A,count:I})),changed:P.length,skipped:C.filtered,unchanged:C.operations.length-P.length}}}if(i==="offset"){let w=r.design.guides?.find(N=>N.id===e.guideId),S=w&&si([w])[0];if(!S)throw Error("\u8BF7\u9009\u62E9\u95ED\u5408\u4E14\u5171\u9762\u7684\u8F6E\u5ED3");let T=Number(e.distance);if(!Number.isFinite(T)||!T||Math.abs(T)>128)throw Error("\u504F\u79FB\u8DDD\u79BB\u5E94\u4E3A\u975E\u96F6\u7684 -128\u2013128 \u683C");let C=hp(S.points,w.recipe.workplane),P=fp(S.points.map(N=>dt(N,C)),"xz",T).map(N=>Rn(N,C)),A={...w.recipe,kind:"polygon",plane:"custom",workplane:C,planeLock:!0,snapApplied:!0,points:P,guidesOnly:!!e.guidesOnly,state:e.state||w.recipe.state,fill:!1},I=Bt(r,A,t);return e.guidesOnly||c.push(...I.operations),a.push(...I.guide),o.push(...I.warnings,"\u590D\u6742\u51F9\u8F6E\u5ED3\u504F\u79FB\u53EF\u80FD\u81EA\u4EA4\uFF0C\u8BF7\u68C0\u67E5\u8F85\u52A9\u7EBF"),s.guides||=[],s.guides.push({id:crypto.randomUUID(),name:"\u504F\u79FB\u8F6E\u5ED3",points:I.guide,recipe:A,provenance:{kind:"offset",guideId:w.id,sourceRevision:w.revision||0,distance:T,independent:!0}}),h()}if(i==="updateOffset"){let w=r.design.guides||[],S=w.find(N=>N.id===e.guideId);if(S?.provenance?.kind!=="offset")throw Error("\u8BE5\u8F6E\u5ED3\u6CA1\u6709\u53EF\u7528\u7684\u504F\u79FB\u6765\u6E90\u8BB0\u5F55");if(e.sourceGuideId!==void 0&&(typeof e.sourceGuideId!="string"||!e.sourceGuideId))throw Error("\u8BF7\u9009\u62E9\u65B0\u7684\u504F\u79FB\u6765\u6E90\u8F6E\u5ED3");let T=e.sourceGuideId===void 0?w:w.map(N=>N.id===S.id?{...N,provenance:{...N.provenance,guideId:e.sourceGuideId}}:N),C=Ua(T,e.guideId);if(!C.canRebuild)throw Error(C.reason);let P=e.distance??C.distance,A=so(r,{operation:"offset",guideId:C.guideId,distance:P,guidesOnly:!0,state:S.recipe.state},t).design.guides.at(-1),I=cr(r,{...A.recipe,editGuideId:S.id,updateDependents:!0,manualStrategy:e.manualStrategy||"preserve"},t);return I.design.guides=I.design.guides.map(N=>N.id===S.id?{...N,provenance:structuredClone(A.provenance)}:N),I.warnings.push("\u6309\u6765\u6E90\u91CD\u65B0\u751F\u6210\u504F\u79FB\u8F6E\u5ED3\uFF1B\u5176\u76F4\u63A5\u8F6E\u5ED3\u7F16\u8F91\u4F1A\u7531\u65B0\u504F\u79FB\u7ED3\u679C\u66FF\u6362"),I}let f=ui(r,e),p=f.map(w=>up(r,w)),m={x:0,y:1,z:2}[e.axis||"x"];if(m===void 0)throw Error("\u65E0\u6548\u65B9\u5411");let g=new Set,y=[],b=w=>{w.id&&(s.objects=s.objects.filter(S=>S.id!==w.id),delete s.animations[w.id])},_=(w,S)=>{for(let T of S.blocks){let C=T.pos.map((P,A)=>P+w.min[A]);g.add(L(...C)),d({type:"set",pos:C,state:null,reason:"\u8BBE\u8BA1\u53D8\u6362\u539F\u4F4D\u7F6E"})}};function v(w,S,T,{turn:C=0,mirror:P=!1,move:A=!1,instance:I=!1}={}){if(S.blocks.some(F=>F.nbt)&&(C||P))throw Error("\u5E26\u65B9\u5757\u5B9E\u4F53\u7684\u7ED3\u6784\u53EF\u5E73\u79FB\uFF0C\u65CB\u8F6C\u955C\u50CF\u8BF7\u7528\u539F\u751F\u84DD\u56FE");let N=pt(S,T,{turn:C,mirror:P}).map(F=>({...F,nbt:F.nbt??null}));y.push(...N);let D=Zl(w,N);if(D.id=A&&w.id?w.id:crypto.randomUUID(),D.name=A?w.name:w.name+" \xB7 \u526F\u672C",I?Yl(r,s,w,S,D,T,{turn:C,mirror:P}):A||(delete D.instanceOf,delete D.instanceTransform,delete D.instancePose,delete D.componentRecords,delete D.componentRevision),A&&w.instancePose){let F=ci(S.size,T,C,P);D.instancePose=Dn(w.instancePose,W=>cn(W.map((K,q)=>K-w.min[q]),F),C,P),D.instanceTransform={turn:D.instancePose.turn,mirror:D.instancePose.mirror};let z=new Map(S.blocks.map(W=>[L(...cn(W.pos,F)),L(...W.pos.map((K,q)=>K+w.min[q]))])),G=new Map((w.componentRecords||[]).map(W=>[L(...W.pos),W]));D.componentRecords=N.map(W=>{let K=z.get(L(...W.pos)),q=G.get(K);return{pos:W.pos,before:w.cells.includes(L(...W.pos))?null:li(r,W.pos),after:{state:W.state,nbt:W.nbt||null},manual:!!q&&(q.manual||!yr(li(r,Z(K)),q.after))}})}A&&w.id&&(s.objects=s.objects.filter(F=>F.id!==w.id)),s.objects.push(D);let U=r.design.animations[w.id];if(U&&A&&!C&&!P){let F=T.map((G,W)=>G-w.min[W]),z=structuredClone(U);for(let G of["min","max","center"])z[G]&&(z[G]=z[G].map((W,K)=>W+F[K]));s.animations[D.id]=z}else A&&U&&(delete s.animations[D.id],o.push("\u88C5\u7F6E\u8FD0\u52A8\u7531 Create \u6570\u636E\u91CD\u65B0\u8BC6\u522B"));return D}if(["align","distribute"].includes(i)){if(f.length<2)throw Error("\u8BF7\u7528 Shift \u9009\u62E9\u81F3\u5C11\u4E24\u4E2A\u5BF9\u8C61");let w=f.map((A,I)=>I).sort((A,I)=>f[A].min[m]-f[I].min[m]),S=e.edge||"min",T=A=>S==="max"?A.max[m]+1:S==="center"?(A.min[m]+A.max[m]+1)/2:A.min[m],C=f[e.reference==="last"?f.length-1:0],P=new Map;if(i==="align")for(let A of w)P.set(A,T(C));else{if(f.length<3)throw Error("\u5747\u5300\u5206\u5E03\u81F3\u5C11\u9700\u8981\u4E09\u4E2A\u5BF9\u8C61");let A=f[w[0]],I=f[w.at(-1)];if(e.distribution==="centers"){let N=T({...A}),D=T({...I});w.forEach((U,F)=>P.set(U,N+(D-N)*F/(w.length-1)))}else{let N=f.reduce((F,z)=>F+z.max[m]-z.min[m]+1,0),D=(I.max[m]+1-A.min[m]-N)/(f.length-1);D<0&&o.push("\u5BF9\u8C61\u8DE8\u5EA6\u4E0D\u8DB3\uFF0C\u4F1A\u5F62\u6210\u91CD\u53E0");let U=A.min[m];for(let F of w)P.set(F,U),U+=f[F].max[m]-f[F].min[m]+1+D}}f.forEach((A,I)=>_(A,p[I])),f.forEach((A,I)=>{let N=i==="distribute"&&e.distribution!=="centers"?A.min[m]:T(A),D=Math.round(P.get(I)-N);P.get(I)-N!==D&&o.push("\u4E2D\u5FC3\u6216\u95F4\u9699\u5DF2\u5438\u9644\u5230\u6574\u6570\u65B9\u5757"),v(A,p[I],A.min.map((U,F)=>U+(F===m?D:0)),{move:!0})})}else if(["array","pathArray","radialArray","mirror","instance"].includes(i)){let w=_e(r,e.selection?.min||Tt(f.flatMap(C=>C.cells.map(Z))).min,e.selection?.max||Tt(f.flatMap(C=>C.cells.map(Z))).max,{keys:f.flatMap(C=>C.cells)}),S={id:f.length===1?f[0].id:null,name:f.length===1?f[0].name:"\u7EC4\u5408\u9009\u533A",...Tt(f.flatMap(C=>C.cells.map(Z)))},T=$l(Number(e.count??3),"\u6570\u91CF",1,100);if(i==="mirror"){if(m===1)throw Error("\u5F53\u524D\u955C\u50CF\u652F\u6301 X / Z\uFF0C\u4FDD\u6301\u95E8\u4E0E\u697C\u68AF\u4E0A\u4E0B\u5173\u7CFB");let C=Number(e.plane??S.max[m]+2);if(!Number.isFinite(C)||!Number.isInteger(C*2))throw Error("\u955C\u50CF\u5E73\u9762\u652F\u6301\u6574\u683C\u6216\u534A\u683C");let P=[...S.min];P[m]=Math.round(2*C-S.max[m]-1),v(S,w,P,{mirror:!0,turn:m===2?2:0})}else if(i==="array"||i==="instance"){if(T<2)throw Error("\u6570\u91CF\u81F3\u5C11\u4E3A 2\uFF08\u5305\u542B\u539F\u4EF6\uFF09");if(i==="instance"&&(f.length!==1||!f[0].id))throw Error("\u5173\u8054\u5B9E\u4F8B\u8BF7\u5148\u5C06\u9009\u533A\u5EFA\u7ACB\u4E3A\u5355\u4E2A\u5BF9\u8C61");l=Xl(S,e);let C=l.step;l.snapped&&o.push("\u7A7A\u9699\u5DF2\u5438\u9644\u5230\u6574\u683C\uFF1B\u5B9E\u9645\u7A7A\u9699 "+l.gap+" \u683C"),l.mode==="gap"&&l.gap<0&&o.push("\u8D1F\u7A7A\u9699\u4F1A\u91CD\u53E0\u6784\u4EF6\u5360\u683C\u8303\u56F4");for(let P=1;P<T;P++)v(S,w,S.min.map((A,I)=>A+C[I]*P),{instance:i==="instance"})}else if(i==="radialArray"){let C=e.center||[S.min[0],S.min[1],S.min[2]],P=Number(e.radius??12),A=Number(e.angle??360);if(C.length!==3||C.some(I=>!Number.isFinite(I))||!Number.isFinite(P)||P<1||P>1024||!Number.isFinite(A)||Math.abs(A)>360)throw Error("\u8BF7\u8BBE\u7F6E\u6709\u6548\u5706\u5FC3\u3001\u534A\u5F84\u548C\u89D2\u5EA6");for(let I=0;I<T;I++){let N=(e.startAngle||0)+A*I/(Math.abs(A)===360?T:Math.max(1,T-1)),D=N*Math.PI/180;v(S,w,[Math.round(C[0]+Math.cos(D)*P),Math.round(C[1]),Math.round(C[2]+Math.sin(D)*P)],{turn:e.follow?((Math.round(N/90)+1)%4+4)%4:0})}e.follow&&o.push("\u65B9\u5757\u671D\u5411\u6309 90\xB0 \u5438\u9644\uFF0C\u5706\u5FC3\u53C2\u6570\u662F\u6784\u4EF6\u653E\u7F6E\u951A\u70B9")}else{let C=r.design.guides?.find(A=>A.id===e.guideId),P=e.path||C?.points;u=Wl(P,{count:T,spacing:Number(e.spacing??6),mode:e.pathSpacingMode||"spacing",closed:e.closedPath??(C?.recipe?.closed===!0||!!C&&si([C]).length>0),follow:!!e.follow});for(let A of u.placements)v(S,w,A.pos,{turn:A.turn});e.follow&&o.push("\u6CBF\u8DEF\u5F84\u671D\u5411\u6309 90\xB0 \u5438\u9644"),u.duplicates&&o.push("\u843D\u5230\u540C\u4E00\u683C\u7684 "+u.duplicates+" \u4E2A\u91CD\u590D\u951A\u70B9\u5DF2\u8DF3\u8FC7"),u.placements.length<T&&o.push("\u8DEF\u5F84\u957F\u5EA6\u6216\u5360\u683C\u5438\u9644\u4F7F\u5B9E\u9645\u526F\u672C\u51CF\u5C11\u5230 "+u.placements.length)}}else if(i==="pushpull"){if(f.length!==1)throw Error("\u63A8\u62C9\u4E00\u6B21\u9009\u62E9\u4E00\u4E2A\u5BF9\u8C61\u6216\u533A\u57DF");let w=f[0],S=p[0],T=$l(Number(e.distance??3),"\u63A8\u62C9\u8DDD\u79BB",-128,128),C=e.face!=="min",P=C?S.size[m]-1:0,A=S.blocks.filter(I=>I.pos[m]===P);if(!T)throw Error("\u8DDD\u79BB\u4E0D\u80FD\u4E3A\u96F6");if(A.some(I=>I.nbt))throw Error("\u8FB9\u754C\u542B\u65B9\u5757\u5B9E\u4F53\uFF0C\u8BF7\u9010\u5757\u8C03\u6574\uFF0C\u907F\u514D\u590D\u5236\u8BBE\u5907\u6570\u636E");if(T>0){for(let N of A)for(let D=1;D<=T;D++){let U=N.pos.map((F,z)=>F+w.min[z]+(z===m?C?D:-D:0));y.push({type:"set",pos:U,state:N.state,reason:"\u8FB9\u754C\u63A8\u62C9"})}let I=Zl(w,[...S.blocks.map(N=>({pos:N.pos.map((D,U)=>D+w.min[U]),state:N.state})),...y]);w.id&&(s.objects=s.objects.filter(N=>N.id!==w.id)),I.id=w.id||crypto.randomUUID(),s.objects.push(I)}else{let I=S.blocks.filter(N=>C?N.pos[m]>P+T:N.pos[m]<-T);for(let N of I)d({type:"set",pos:N.pos.map((D,U)=>D+w.min[U]),state:null,reason:"\u8FB9\u754C\u7F29\u77ED"});o.push("\u7F29\u77ED\u53EA\u79FB\u9664\u9009\u62E9\u5185\u65B9\u5757\uFF0C\u95E8\u7A97\u4E0E\u5176\u4F59\u7EC6\u8282\u4FDD\u6301\u539F\u4F4D\u7F6E")}}else if(i==="boolean"){if(f.length!==2)throw Error("\u5E03\u5C14\u64CD\u4F5C\u9700\u8981\u4E24\u4E2A\u5BF9\u8C61\uFF1A\u5148\u9009\u4E3B\u4F53\uFF0C\u518D Shift \u9009\u5DE5\u5177\u4F53");let[w,S]=f,T=new Set(w.cells),C=new Set(S.cells),P=e.mode||"subtract",A=P==="union"?new Set([...T,...C]):P==="intersect"?new Set([...T].filter(I=>C.has(I))):new Set([...T].filter(I=>!C.has(I)));if(!["union","intersect","subtract"].includes(P))throw Error("\u672A\u77E5\u5E03\u5C14\u64CD\u4F5C");for(let I of T)A.has(I)||d({type:"set",pos:Z(I),state:null,reason:"\u5E03\u5C14 "+P});if(e.consumeTool&&P!=="union")for(let I of C)A.has(I)||d({type:"set",pos:Z(I),state:null,reason:"\u79FB\u9664\u5DE5\u5177\u4F53"});b(w),(P==="union"||e.consumeTool)&&b(S),A.size&&s.objects.push({id:crypto.randomUUID(),name:w.name+" \xB7 \u5E03\u5C14",...Tt([...A].map(Z)),cells:[...A],kind:"boolean"})}else if(i==="makeUniqueInstance"){if(f.length!==1)throw Error("\u8BF7\u9009\u62E9\u4E00\u4EFD\u5B9E\u4F8B");return Jl(r,f[0])}else if(i==="syncInstances"||i==="detachInstance"){if(f.length!==1||!f[0].instanceOf)throw Error("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u5173\u8054\u5B9E\u4F8B");let w=f[0];if(i==="syncInstances")return jl(r,w,{manualStrategy:e.overlap==="overwrite"?"overwrite":"preserve",expandSelection:e.expandSource?e.selection:null});let S=s.objects.find(T=>T.id===w.id);delete S.instanceOf,delete S.instanceTransform,delete S.instancePose,delete S.componentRecords,delete S.componentRevision}else if(i==="editFeature"){if(f.length!==1||f[0].kind!=="feature"||!f[0].recipe)throw Error("\u8BF7\u9009\u62E9\u4E00\u4E2A\u6709\u5EFA\u6A21\u8BB0\u5F55\u7684\u751F\u6210\u5BF9\u8C61");let w=f[0],S={...w.recipe,...e.parameters};e.parameters?.profileIds!==void 0&&delete S.profiles,e.parameters?.pathId!==void 0&&delete S.path;let T=w.guideId?Zi(r.design,w.guideId,lr).objects:[];return oi(r,[w,...T.filter(C=>C.id!==w.id)],{manualStrategy:e.overlap==="overwrite"?"overwrite":"preserve",overrides:{[w.id]:S},available:t})}else throw Error("\u672A\u77E5\u8BBE\u8BA1\u5DE5\u5177");let M=new Set(c.filter(w=>!w.state).map(w=>L(...w.pos))),x=new Map;for(let w of y){let S=L(...w.pos);if(x.has(S)&&o.push("\u751F\u6210\u6784\u4EF6\u4E4B\u95F4\u5B58\u5728\u91CD\u53E0"),r.at(w.pos)&&!M.has(S)&&e.overlap!=="overwrite")throw Error("\u76EE\u6807\u5DF2\u6709\u65B9\u5757\uFF0C\u8BF7\u8C03\u6574\u4F4D\u7F6E\u6216\u9009\u62E9\u8986\u76D6");x.set(S,w)}for(let w of x.values())d(w);let E=new Map;for(let w of c)E.set(L(...w.pos),w.state);return s.objects=s.objects.map(w=>{let S=(w.cells||[]).filter(T=>!E.has(T)||E.get(T));return S.length?{...w,...Tt(S.map(Z)),cells:S}:null}).filter(Boolean),h()}function Kl(r,e){let t=ui(r,e,{allowLocked:!0}),n=[...new Set(t.flatMap(m=>m.cells))],i={},s={},o=[],a=[],c=[],l=0,u=0,h=Pn(r);for(let m of n){let g=r.at(Z(m));if(!g)continue;c.push(g.pos);let y=r.palette[g.state];i[y.Name]=(i[y.Name]||0)+1,(s[g.pos[1]]||={total:0,materials:{}}).total++,s[g.pos[1]].materials[y.Name]=(s[g.pos[1]].materials[y.Name]||0)+1;let b=[g.pos[0],g.pos[1]-1,g.pos[2]];g.pos[1]>0&&!r.at(b)&&(l++,o.length<200&&o.push(g.pos));let _=r.at(g.pos,!0);_&&r.overlay.has(m)&&(u++,a.length<200&&a.push({pos:g.pos,original:r.palette[_.state].Name}))}if(!c.length)throw Error("\u5BF9\u8C61\u4E2D\u5DF2\u6CA1\u6709\u65B9\u5757\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");let d=c,f=Tt(d),p=[];for(let[m,g]of d.map(y=>[y[0],y[2]])){let y=h.get(m+4096*g);y?.ground!==null&&y?.ground!==void 0&&p.push(y.ground)}return{...f,size:f.max.map((m,g)=>m-f.min[g]+1),blockCount:Object.values(i).reduce((m,g)=>m+g,0),materials:i,layers:s,unsupported:o,unsupportedCount:l,collisions:a,collisionsCount:u,terrain:p.length?{min:p.reduce((m,g)=>Math.min(m,g),1/0),max:p.reduce((m,g)=>Math.max(m,g),-1/0)}:null,notes:["\u60AC\u7A7A\u6807\u8BB0\u8868\u793A\u6B63\u4E0B\u65B9\u6CA1\u6709\u65B9\u5757\uFF0C\u6A2A\u6881\u548C\u62F1\u5238\u53EF\u80FD\u6B63\u5E38\uFF1B\u4E0D\u6A21\u62DF\u529B\u5B66","\u78B0\u649E\u5217\u8868\u6307\u539F\u59CB\u573A\u5730\u88AB\u6539\u52A8\u7684\u4F4D\u7F6E\uFF0C\u672A\u77E5\u5730\u9762\u4FDD\u6301\u672A\u77E5"]}}var Ql={terrain:"\u5730\u5F62\u4E0E\u6CB3\u6C34",existing:"\u539F\u5EFA\u7B51\u4E0E\u690D\u88AB",protected:"\u4FDD\u7559\u533A",locked:"\u9501\u5B9A\u5BF9\u8C61\u6216\u96C6\u5408",other:"\u5176\u4ED6\u51B2\u7A81"};function tc(r,e,t){if(t)return"locked";if(r.protected.some(s=>e.every((o,a)=>o>=s.min[a]&&o<=s.max[a])))return"protected";let n=r.at(e,!0);if(!n)return"other";let i=De(r.palette[n.state].Name);return i==="ground"||i==="water"?"terrain":"existing"}function ec(r,e){if(!r)return{min:[...e],max:[...e]};for(let t=0;t<3;t++)r.min[t]=Math.min(r.min[t],e[t]),r.max[t]=Math.max(r.max[t],e[t]);return r}var Ir=class{constructor(){this.count=0,this.bounds=null,this.groups=new Map,this.conflicts=[],this.sampleCount=0}add(e,t,n="other"){let i=this.groups.get(n);i||(i={kind:n,label:Ql[n],count:0,bounds:null,samples:[]},this.groups.set(n,i)),this.count++,this.bounds=ec(this.bounds,e),i.count++,i.bounds=ec(i.bounds,e);let s={pos:[...e],message:t};this.conflicts.length<20&&this.conflicts.push(s),!i.samples.length&&this.sampleCount===200&&([...this.groups.values()].reduce((a,c)=>a.samples.length>=c.samples.length?a:c).samples.pop(),this.sampleCount--),this.sampleCount<200&&(i.samples.push(s),this.sampleCount++)}summary(){return structuredClone({count:this.count,bounds:this.bounds,groups:Object.keys(Ql).filter(e=>this.groups.has(e)).map(e=>this.groups.get(e)),sampleCount:this.sampleCount,truncated:this.sampleCount<this.count})}};var dp={cut:"\u5207\u5236",polished:"\u78E8\u5236",limestone:"\u77F3\u7070\u5CA9",andesite:"\u5B89\u5C71\u5CA9",diorite:"\u95EA\u957F\u5CA9",granite:"\u82B1\u5C97\u5CA9",deepslate:"\u6DF1\u677F\u5CA9",stone:"\u77F3",bricks:"\u7816",brick:"\u7816",slab:"\u53F0\u9636",stairs:"\u697C\u68AF",wall:"\u5899",pillar:"\u67F1",layered:"\u5C42\u7EB9",oak:"\u6A61\u6728",spruce:"\u4E91\u6749",cherry:"\u6A31\u82B1\u6728",dark:"\u6DF1\u8272",planks:"\u6728\u677F",log:"\u539F\u6728",stripped:"\u53BB\u76AE",glass:"\u73BB\u7483",pane:"\u7247",white:"\u767D\u8272",black:"\u9ED1\u8272",red:"\u7EA2\u8272",blue:"\u84DD\u8272",green:"\u7EFF\u8272",concrete:"\u6DF7\u51DD\u571F",terracotta:"\u9676\u74E6",water:"\u6C34",grass:"\u8349",block:"\u65B9\u5757",dirt:"\u6CE5\u571F",leaves:"\u6811\u53F6",gold:"\u91D1",iron:"\u94C1",copper:"\u94DC",sail:"\u98CE\u5E06",shaft:"\u4F20\u52A8\u8F74",cogwheel:"\u9F7F\u8F6E",large:"\u5927\u578B",bearing:"\u8F74\u627F",windmill:"\u98CE\u8F66",lantern:"\u706F\u7B3C",fence:"\u56F4\u680F",door:"\u95E8",sand:"\u6C99",sandstone:"\u7802\u5CA9",tuff:"\u51DD\u7070\u5CA9",calcite:"\u65B9\u89E3\u77F3",moss:"\u82D4\u85D3",veridium:"\u8F89\u7EFF\u5CA9",asurine:"\u7693\u84DD\u5CA9",small:"\u5C0F\u578B",cutout:"\u9542\u7A7A",smooth:"\u5E73\u6ED1",casing:"\u673A\u58F3",barrel:"\u6728\u6876",crafting:"\u5DE5\u4F5C",table:"\u53F0",light:"\u6D45\u8272",gray:"\u7070\u8272",yellow:"\u9EC4\u8272",pink:"\u7C89\u8272",purple:"\u7D2B\u8272"};function pp(r,e){if(e&&/[\u3400-\u9fff]/.test(e))return e;let t=r.split(":").at(-1).split("/").at(-1).split("_").map(n=>dp[n]||n);return t.join(t.every(n=>/[\u3400-\u9fff]/.test(n))?"":" ").replaceAll("\u7816\u7816","\u7816").trim()}function mp(r){let e=r.split(":").at(-1),t=[];for(let[n,i]of[["stone",/stone|brick|andesite|diorite|granite|tuff|calcite|terracotta|asurine|veridium/],["wood",/oak|spruce|birch|cherry|mangrove|jungle|acacia|bamboo|plank|log|wood/],["metal",/iron|gold|copper|metal|steel/],["glass",/glass|pane/],["stairs",/stairs$/],["slab",/slab$/],["pillar",/pillar|wall$|fence$/],["decoration",/lantern|lamp|door|trapdoor|carpet|pot|banner|chain|torch/],["plants",/leaves|flower|grass(?!_block)|sapling|petal|fern|vine|moss/],["mechanical",/shaft|cogwheel|bearing|sail|wheel|belt|piston|gantry|mechanical|casing/],["fluid",/water|lava/]])i.test(e)&&t.push(n);return t}function On(r,e){let t=new Map,n=new Map(e.catalogue("").map(s=>[s.id,s.label])),i=(s,o=!1)=>{if(["minecraft:air","minecraft:cave_air","minecraft:void_air","minecraft:structure_void"].includes(s.Name)||s.Name.startsWith("craftstudio:"))return;let a=t.get(s.Name);if(!a){let c=s.Name,l=c.split(":").at(-1);a={id:c,name:pp(c,n.get(c)),source:c.split(":")[0],tags:mp(c),used:o,states:[],choices:{},color:/white|limestone|calcite|quartz/.test(l)?"light":/dark|black|deepslate/.test(l)?"dark":/red|^bricks$|copper|oak|spruce|birch|wood|plank/.test(l)?"warm":/blue|asurine|water/.test(l)?"blue":/green|veridium|leaves|grass|moss/.test(l)?"green":"neutral"},t.set(c,a)}a.used||=o,a.states.some(c=>JSON.stringify(c.Properties||{})===JSON.stringify(s.Properties||{}))||a.states.push(s);for(let[c,l]of Object.entries(s.Properties||{}))a.choices[c]||=[],a.choices[c].includes(String(l))||a.choices[c].push(String(l))};for(let s of r.palette)i(s,!0);for(let s of e.catalogue(""))i({Name:s.id});for(let s of["minecraft:stone_bricks","minecraft:oak_planks","minecraft:glass","minecraft:stone_brick_stairs","minecraft:stone_brick_slab","minecraft:oak_log","minecraft:lantern","minecraft:water"])i({Name:s});for(let s of t.values()){let o=s.id.split(":")[1],a=/stairs$/.test(o)?{facing:["north","east","south","west"],half:["bottom","top"],shape:["straight","inner_left","inner_right","outer_left","outer_right"],waterlogged:["false","true"]}:/slab$/.test(o)?{type:["bottom","top","double"],waterlogged:["false","true"]}:/log$|pillar$|shaft$/.test(o)?{axis:["y","x","z"]}:{};for(let[l,u]of Object.entries(a))s.choices[l]=[...new Set([...s.choices[l]||[],...u])];let c=e.json("assets/"+s.source+"/blockstates/"+s.id.split(":")[1]+".json");for(let l of Object.keys(c.variants||{}))for(let u of l.split(",")){let[h,d]=u.split("=");if(d){s.choices[h]||=[];for(let f of d.split("|"))s.choices[h].includes(f)||s.choices[h].push(f)}}!Object.keys(s.states[0]?.Properties||{}).length&&Object.keys(s.choices).length&&(s.states[0]={Name:s.id,Properties:Object.fromEntries(Object.entries(s.choices).map(([l,u])=>[l,u[0]]))})}return[...t.values()].sort((s,o)=>Number(o.used)-Number(s.used)||s.name.localeCompare(o.name,"zh-CN"))}var oo=(r,e)=>{let t=(r.design.selectionSets||[]).find(n=>n.id===e);if(!t)throw Error("\u547D\u540D\u9009\u62E9\u5DF2\u4E0D\u5B58\u5728");return t};function nc(r){return(r.design.selectionSets||[]).map(e=>({id:e.id,name:e.name,kind:e.kind,...e.kind==="objects"?{objectCount:e.objectIds.length}:{min:[...e.selection.min],max:[...e.selection.max]}}))}function ic(r,e){let t=oo(r,e);if(t.kind==="region")return{id:e,name:t.name,kind:t.kind,selection:structuredClone(t.selection)};let n=new Map(r.design.objects.map(c=>[c.id,c])),i=[],s=[],o=[],a=[];for(let c of t.objectIds){let l=n.get(c);if(!l){o.push(c);continue}if(Ht(r.design,l)){s.push(c);continue}i.push(c),ut(r.design,l)&&a.push(c)}return{id:e,name:t.name,kind:t.kind,objectIds:i,hiddenObjectIds:s,missingObjectIds:o,lockedObjectIds:a}}function rc(r,e,t){let n=r.design.selectionSets||[];if(e==="selectionSets.remove")return oo(r,t.id),r.design.selectionSets=n.filter(a=>a.id!==t.id),{id:t.id,removed:!0};let i=t.selectionSet;if(!i||typeof i.name!="string"||!i.name.trim())throw Error("\u8BF7\u586B\u5199\u547D\u540D\u9009\u62E9\u7684\u540D\u79F0");if(i.objectIds!==void 0&&i.selection)throw Error("\u5BF9\u8C61\u5F15\u7528\u4E0E\u56FA\u5B9A\u533A\u57DF\u8BF7\u9009\u62E9\u4E00\u79CD\u4FDD\u5B58\u65B9\u5F0F");let s=i.id??crypto.randomUUID();if(typeof s!="string"||!s)throw Error("\u547D\u540D\u9009\u62E9\u9700\u8981\u6587\u5B57 id");let o={id:s,name:i.name.trim()};if(i.objectIds!==void 0){if(!Array.isArray(i.objectIds)||!i.objectIds.length)throw Error("\u8BF7\u9009\u62E9\u9700\u8981\u4FDD\u5B58\u7684\u5BF9\u8C61");let a=new Set(r.design.objects.map(c=>c.id));if(i.objectIds.some(c=>!a.has(c)))throw Error("\u9009\u62E9\u4E2D\u7684\u5BF9\u8C61\u5DF2\u4E0D\u5B58\u5728");o={...o,kind:"objects",objectIds:[...new Set(i.objectIds)]}}else if(i.selection){let a=structuredClone(i.selection),{min:c,max:l}=a;if(!Array.isArray(c)||!Array.isArray(l)||c.length!==3||l.length!==3||c.some((u,h)=>!Number.isSafeInteger(u)||u<0||u>l[h])||l.some(u=>!Number.isSafeInteger(u)||u>=4096))throw Error("\u56FA\u5B9A\u533A\u57DF\u9700\u8981\u6709\u6548\u7684\u5C40\u90E8 min/max XYZ");Fe(a),o={...o,kind:"region",selection:a}}else o={...oo(r,s),name:o.name};return r.design.selectionSets=n.some(a=>a.id===s)?n.map(a=>a.id===s?o:a):[...n,o],{id:s,name:o.name,kind:o.kind}}function sc(r,e,t){let n=r.design.materialPalettes||(r.design.materialPalettes=[]);if(e==="palettes.remove"){let u=n.findIndex(h=>h.id===t.id);if(u<0)throw Error("\u914D\u8272\u65B9\u6848\u5DF2\u4E0D\u5B58\u5728");return n.splice(u,1),{id:t.id,removed:!0}}let i=t.palette;if(!i||typeof i.name!="string"||!i.name.trim()||i.name.trim().length>128)throw Error("\u8BF7\u586B\u5199 1\u2013128 \u5B57\u65B9\u6848\u540D\u79F0");let s=i.id??crypto.randomUUID();if(typeof s!="string"||!s||s.length>128)throw Error("\u65B9\u6848\u7F16\u53F7\u65E0\u6548");if(n.some(u=>u.id!==s&&u.name===i.name.trim()))throw Error("\u5DF2\u6709\u540C\u540D\u65B9\u6848\uFF0C\u8BF7\u9009\u62E9\u5B83\u66F4\u65B0\u6216\u4F7F\u7528\u5176\u4ED6\u540D\u79F0");if(!Array.isArray(i.states))throw Error("\u914D\u8272\u65B9\u6848\u9700\u8981\u5B8C\u6574\u65B9\u5757\u72B6\u6001\u5217\u8868");let o=[],a=new Set;for(let u of i.states){if(!u||!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(u.Name||""))throw Error("\u65B9\u6848\u4E2D\u7684\u65B9\u5757\u6807\u8BC6\u65E0\u6548");if(u.Properties!==void 0&&(!u.Properties||typeof u.Properties!="object"||Array.isArray(u.Properties)||Object.values(u.Properties).some(f=>typeof f!="string")))throw Error("\u65B9\u5757\u72B6\u6001\u5C5E\u6027\u9700\u8981\u5B57\u7B26\u4E32\u503C");let h={Name:u.Name,...u.Properties?{Properties:structuredClone(u.Properties)}:{}},d=V(h);a.has(d)||(a.add(d),o.push(h))}let c={id:s,name:i.name.trim(),states:o},l=n.findIndex(u=>u.id===s);return l<0?n.push(c):n[l]=c,structuredClone(c)}function oc(r){if(!r||typeof r!="object"||Array.isArray(r))throw Error("\u663E\u793A\u8BBE\u7F6E\u65E0\u6548");let{mode:e,cut:t,plants:n,ground:i,existing:s}=r;if(!["after","before","diff","removed"].includes(e)||t!==null&&(!Number.isInteger(t)||t<0)||[n,i,s].some(o=>typeof o!="boolean"))throw Error("\u663E\u793A\u6A21\u5F0F\u3001\u5256\u5207\u5C42\u6216\u663E\u793A\u5F00\u5173\u65E0\u6548");return{mode:e,cut:t,plants:n,ground:i,existing:s}}var ao=r=>Array.isArray(r)&&r.length===3&&r.every(Number.isFinite);function lc(r){if(!ao(r?.position)||!ao(r?.target))throw Error("\u89C6\u89D2\u9700\u8981\u6709\u6548\u4F4D\u7F6E\u548C\u76EE\u6807");let e={...structuredClone(r),projection:r.projection||"perspective",fov:r.fov??45,zoom:r.zoom??1,up:r.up||[0,1,0]};if(!["perspective","orthographic"].includes(e.projection)||!Number.isFinite(e.fov)||e.fov<=0||e.fov>=180||!Number.isFinite(e.zoom)||e.zoom<=0||!ao(e.up)||Math.hypot(...e.up)<1e-8||e.viewHeight!==void 0&&(!Number.isFinite(e.viewHeight)||e.viewHeight<=0))throw Error("\u89C6\u89D2\u6295\u5F71\u3001\u7F29\u653E\u6216\u65B9\u5411\u65E0\u6548");return e.display!==void 0&&(e.display=oc(e.display)),e}function ac(r,e){let t=r.findIndex(i=>i.id===e);if(t>=0)return t;let n=/^legacy-view-(\d+)$/.exec(e||"");return n&&r[+n[1]]&&!r[+n[1]].id?+n[1]:-1}function cc(r,e,t){let n=r.design.cameras||[],i=t.id||t.view?.id;if(e==="views.remove"){let a=ac(n,i);if(a<0)throw Error("\u89C6\u89D2\u5DF2\u4E0D\u5B58\u5728");return r.design.cameras=n.filter((c,l)=>l!==a),{removed:i}}let s=lc(t.view);if(typeof s.name!="string"||!s.name.trim())throw Error("\u8BF7\u586B\u5199\u89C6\u89D2\u540D\u79F0");if(s.name=s.name.trim(),t.space==="world"){if(!r.originConfirmed)throw Error("\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");for(let a of["position","target"])s[a]=s[a].map((c,l)=>c-r.origin[l])}let o=i?ac(n,i):-1;if(i&&o<0)throw Error("\u89C6\u89D2\u5DF2\u4E0D\u5B58\u5728");if(n.some((a,c)=>a.name===s.name&&c!==o))throw Error("\u540C\u540D\u89C6\u89D2\u5DF2\u5B58\u5728\uFF0C\u8BF7\u9009\u62E9\u540E\u66F4\u65B0");return s.id=o>=0&&n[o].id?n[o].id:crypto.randomUUID(),r.design.cameras=structuredClone(n),o<0?r.design.cameras.push(s):r.design.cameras[o]=s,{view:s}}function uc(r,e="local"){if(e==="world"&&!r.originConfirmed)throw Error("\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");return(r.design.cameras||[]).map((t,n)=>{let i=lc(t);if(i.id=t.id||"legacy-view-"+n,e==="world")for(let s of["position","target"])i[s]=i[s].map((o,a)=>o+r.origin[a]);return i})}function lo(r){if(!Array.isArray(r)||r.length!==2||r.some(i=>!Array.isArray(i)||i.length!==3||i.some(s=>!Number.isFinite(s))))throw Error("\u6D4B\u91CF\u9700\u8981\u4E24\u4E2A\u6709\u6548\u7684\u4E09\u7EF4\u5750\u6807");let e=r[1].map((i,s)=>i-r[0][s]),t=Math.hypot(...e),n=Math.hypot(e[0],e[2]);if(!Number.isFinite(t))throw Error("\u6D4B\u91CF\u8DDD\u79BB\u8D85\u51FA\u53EF\u8BA1\u7B97\u8303\u56F4");return{delta:e,distance:t,horizontal:n,rise:e[1],manhattan:e.reduce((i,s)=>i+Math.abs(s),0),slopePercent:n?e[1]/n*100:null,pitchDegrees:Math.atan2(e[1],n)*180/Math.PI}}function co(r,e="distance"){if(e==="distance")return lo(r);if(!["angle","path"].includes(e))throw Error("\u4E0D\u652F\u6301\u7684\u6D4B\u91CF\u7C7B\u578B");if(!Array.isArray(r)||r.length<2||r.some(i=>!Array.isArray(i)||i.length!==3||i.some(s=>!Number.isFinite(s))))throw Error("\u6D4B\u91CF\u9700\u8981\u6709\u6548\u7684\u4E09\u7EF4\u5750\u6807");let t=r.slice(1).map((i,s)=>lo([r[s],i]));if(e==="angle"){if(r.length!==3)throw Error("\u5939\u89D2\u9700\u8981\u4E09\u4E2A\u70B9\uFF0C\u4E2D\u95F4\u70B9\u4E3A\u9876\u70B9");let i=t.map(c=>c.distance);if(i.some(c=>c<1e-8))throw Error("\u89D2\u7684\u4E24\u6761\u8FB9\u4E0D\u80FD\u4E3A\u96F6\u957F\u5EA6");let s=r[0].map((c,l)=>(c-r[1][l])/i[0]),o=r[2].map((c,l)=>(c-r[1][l])/i[1]),a=s.reduce((c,l,u)=>c+l*o[u],0);return{angleDegrees:Math.acos(Math.max(-1,Math.min(1,a)))*180/Math.PI,armLengths:i}}let n=t.reduce((i,s)=>i+s.distance,0);if(!Number.isFinite(n))throw Error("\u6D4B\u91CF\u603B\u957F\u8D85\u51FA\u53EF\u8BA1\u7B97\u8303\u56F4");return{totalLength:n,segmentCount:t.length,segments:t,chordLength:lo([r[0],r.at(-1)]).distance,rise:r.at(-1)[1]-r[0][1],ascent:t.reduce((i,s)=>i+Math.max(0,s.rise),0),descent:t.reduce((i,s)=>i+Math.max(0,-s.rise),0)}}function hc(r,e,t){let n=r.design.measurements||[];if(e==="measurements.remove"){if(!n.some(o=>o.id===t.id))throw Error("\u6D4B\u91CF\u6807\u6CE8\u5DF2\u4E0D\u5B58\u5728");return r.design.measurements=n.filter(o=>o.id!==t.id),{removed:t.id}}let i=structuredClone(t.measurement);if(co(i?.points,i?.kind),typeof i.name!="string"||!i.name.trim())throw Error("\u8BF7\u586B\u5199\u6D4B\u91CF\u540D\u79F0");if(i.name=i.name.trim(),t.space==="world"){if(!r.originConfirmed)throw Error("\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");i.points=i.points.map(o=>o.map((a,c)=>a-r.origin[c]))}if(i.id&&!n.some(o=>o.id===i.id))throw Error("\u6D4B\u91CF\u6807\u6CE8\u5DF2\u4E0D\u5B58\u5728\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");i.id=i.id||crypto.randomUUID();let s=n.findIndex(o=>o.id===i.id);return r.design.measurements=structuredClone(n),s<0?r.design.measurements.push(i):r.design.measurements[s]=i,{measurement:i,metrics:co(i.points,i.kind)}}function fc(r,e="local"){if(e==="world"&&!r.originConfirmed)throw Error("\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");return(r.design.measurements||[]).map(t=>({...structuredClone(t),points:t.points.map(n=>e==="world"?n.map((i,s)=>i+r.origin[s]):[...n]),metrics:co(t.points,t.kind)}))}function Fn(r,e){if(r){for(let t of["min","max"])r[t]&&(r[t]=r[t].map((n,i)=>n-e[i]));if(r.members&&(r.members=r.members.map(t=>{if(!Array.isArray(t))throw Error("\u4E16\u754C\u5750\u6807\u6210\u5458\u9700\u8981 XYZ \u6570\u7EC4");return t.map((n,i)=>n-e[i])})),r.regions)for(let t of r.regions)Fn(t,e)}}var $=(r,e,t={})=>{let n=Error(e);throw n.code=r,n.details=t,n},dc=(r,e,t)=>{if(t)return"block";let n=r.base.metadata?.placementMask;if(!n||e.some((s,o)=>s<0||s>=n.size[o]))return"empty";let i=e[0]+n.size[0]*(e[2]+n.size[2]*e[1]);for(let[s,o]of[["skipRuns","skip"],["eraseRuns","erase"]]){let a=n[s]||[],c=0,l=a.length-1;for(;c<=l;){let u=c+l>>1,[h,d]=a[u];if(i<h)l=u-1;else if(i>=h+d)c=u+1;else return o}}return"empty"},gp=(r,e,t,n)=>!r&&!e||!!r&&!!e&&V(t[r.state])===V(n[e.state])&&JSON.stringify(r.nbt||null)===JSON.stringify(e.nbt||null),Rr=class{constructor({getSite:e,resources:t,onChange:n=()=>{}}){this.getSite=e,this.resources=t,this.onChange=n,this.revision=0,this.workspaceId=crypto.randomUUID(),this.transactions=new Map,this.receipts=new Map}changed(e=!1){this.revision++,e&&(this.workspaceId=crypto.randomUUID(),this.transactions.clear(),this.receipts.clear()),this.onChange()}bounds(e,t){let n=o=>t.space==="world"?o.map((a,c)=>a-e.origin[c]):o;t.space==="world"&&!e.originConfirmed&&$("ORIGIN_UNKNOWN","\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u5750\u6807\u539F\u70B9");let i=n(t.min||[0,0,0]),s=n(t.max||e.size.map(o=>o-1));return(i.length!==3||s.length!==3||[...i,...s].some(o=>!Number.isInteger(o)||o<0||o>=4096)||i.some((o,a)=>o>s[a]))&&$("INVALID_BOUNDS","\u9700\u8981\u6709\u6548\u7684\u6574\u6570\u9009\u533A"),{min:i,max:s}}guard(e){e.expectedRevision!==this.revision&&$("REVISION_CONFLICT","\u573A\u666F\u5DF2\u7ECF\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u540E\u7EE7\u7EED",{expected:e.expectedRevision??null,actual:this.revision}),e.workspaceId&&e.workspaceId!==this.workspaceId&&$("WORKSPACE_CHANGED","\u5DE5\u7A0B\u5DF2\u5207\u6362\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6")}operations(e,t){return Array.isArray(t.operations)||$("INVALID_OPERATIONS","\u9700\u8981 operations \u6570\u7EC4"),t.operations.map(n=>{let i=structuredClone(n);if(i.state&&!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(i.state.Name||"")&&$("INVALID_STATE","\u65B9\u5757 ID \u9700\u8981\u6709\u6548\u7684 namespace:block"),i.nbt&&(i.nbt.t!==10||!i.nbt.v||typeof i.nbt.v!="object")&&$("INVALID_NBT","\u65B9\u5757\u5B9E\u4F53\u9700\u8981\u7C7B\u578B\u5316 Compound NBT"),t.space==="world"){e.originConfirmed||$("ORIGIN_UNKNOWN","\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");for(let s of["pos","min","max"])i[s]&&(i[s]=i[s].map((o,a)=>o-e.origin[a]))}if(i.type==="set"&&i.expect!==void 0){let s=e.at(i.pos),o=s?e.palette[s.state]:null;JSON.stringify(o&&V(o))!==JSON.stringify(i.expect&&V(i.expect))&&$("CELL_CONFLICT","\u76EE\u6807\u65B9\u5757\u4E0E\u8BFB\u53D6\u65F6\u4E0D\u540C",{pos:i.pos,actual:o})}return i})}region(e,t){let{min:n,max:i}=this.bounds(e,t),s=Math.min(2e4,Math.max(1,t.limit||4096)),o=t.cursor===void 0?0:Number(t.cursor);(!Number.isSafeInteger(o)||o<0)&&$("INVALID_CURSOR","\u65E0\u6548\u6E38\u6807");let a=i.map((h,d)=>h-n[d]+1),c=a.reduce((h,d)=>h*d,1),l=o,u=[];if(t.includeAir)for(;l<c&&u.length<s;){let h=[l%a[0],Math.floor(l/(a[0]*a[2])),Math.floor(l/a[0])%a[2]].map((f,p)=>f+n[p]),d=e.at(h);u.push({pos:h,state:d?e.palette[d.state]:null,placement:dc(e,h,d),...d?.nbt?{nbt:d.nbt}:{}}),l++}else{let h=[];for(let d of new Set([...e.baseChunks.keys(),...e.overlayChunks.keys()])){if(d.split(",").map(Number).some((m,g)=>m<Math.floor(n[g]/16)||m>Math.floor(i[g]/16)))continue;let p=new Map(e.baseChunks.get(d)||[]);for(let[m,g]of e.overlayChunks.get(d)||[])g.state<0?p.delete(m):p.set(m,g);for(let m of p.values())m.pos.every((g,y)=>g>=n[y]&&g<=i[y])&&h.push(m)}h.sort((d,f)=>d.pos[1]-f.pos[1]||d.pos[2]-f.pos[2]||d.pos[0]-f.pos[0]);for(let d of h.slice(o,o+s))u.push({pos:d.pos,state:e.palette[d.state],...d.nbt?{nbt:d.nbt}:{}});return l=o+u.length,{min:n,max:i,space:"local",worldOrigin:e.origin,blocks:u,nextCursor:l<h.length?String(l):null,total:h.length,complete:l>=h.length}}return{min:n,max:i,space:"local",worldOrigin:e.origin,blocks:u,nextCursor:l<c?String(l):null,total:c,complete:l>=c}}commit(e){let t=this.getSite(),n=[];for(let i of new Set([...t.overlay.keys(),...e.overlay.keys()])){let s=Z(i),o=t.at(s),a=e.at(s);gp(o,a,t.palette,e.palette)||n.push({type:"set",pos:s,state:a?e.palette[a.state]:null,nbt:a?.nbt||null,reason:"AI \u81EA\u7531\u8BBE\u8BA1\u4E8B\u52A1"})}return t.operations(n,{allowTerrain:!0,allowExisting:!0}),!n.length&&JSON.stringify(t.design)!==JSON.stringify(e.design)&&(t.undo.push({overlay:t.overlay,size:[...t.size],design:structuredClone(t.design)}),t.redo=[]),t.design=structuredClone(e.design),this.changed(),{changed:n.length,summary:t.summary()}}execute(e,t=null){try{let n=t||hr(e,this.receipts);if(n.replay)return n.replay;let{id:i,hasId:s}=n,o=e.params||{},a=e.method,c=this.getSite(),l,u=!1,h=o.transactionId?this.transactions.get(o.transactionId):null;o.transactionId&&!h&&$("TRANSACTION_NOT_FOUND","\u4E8B\u52A1\u4E0D\u5B58\u5728\u6216\u5DF2\u7ED3\u675F");let d=h?.site||c;if(typeof a=="string"&&a.startsWith("workplanes.")&&o.space!==void 0&&!["local","world"].includes(o.space)&&$("INVALID_SPACE","\u5E73\u9762\u5750\u6807\u7A7A\u95F4\u9700\u8981 local \u6216 world"),!h&&o.expectedRevision!==void 0&&["scene.readRegion","scene.getBlocks","terrain.readColumns","materials.collect","objects.list","meshes.list","meshes.read","selectionSets.list","selectionSets.resolve","prefabs.list","prefabs.read","palettes.list","collections.list","workplanes.list","workplanes.atCurve"].includes(a)&&this.guard(o),a==="workspace.describe")l={protocol:"craftstudio-design/1",name:c.title,workspaceId:this.workspaceId,revision:this.revision,history:{undo:c.undo.length,redo:c.redo.length},size:c.size,origin:c.origin,originConfirmed:c.originConfirmed,limits:{localCoordinate:[0,4095],readPage:2e4},methods:["scene.readRegion","scene.getBlocks","terrain.readColumns","materials.search","materials.collect","edit.apply","edit.brush","transaction.begin","transaction.apply","transaction.inspect","transaction.commit","transaction.abort","meshes.list","meshes.read","meshes.put","meshes.remove","measurements.list","measurements.put","measurements.remove","views.list","views.put","views.remove","generation.links","objects.list","selectionSets.list","selectionSets.resolve","selectionSets.put","selectionSets.remove","prefabs.list","prefabs.read","prefabs.put","prefabs.remove","prefabs.place","objects.put","objects.rename","palettes.list","collections.list","collections.put","collections.remove","palettes.put","palettes.remove","workplanes.list","workplanes.atCurve","workplanes.put","workplanes.remove","selection.transform","history.undo","history.redo"],principles:["\u65B9\u5757 ID \u4E0D\u9650\u4E8E\u5DF2\u6709\u8C03\u8272\u677F","\u6240\u6709\u751F\u6210\u5668\u53EF\u7ED5\u8FC7","\u8BFB\u8FD4\u56DE\u7CBE\u786E\u65B9\u5757\uFF1B\u7A7A\u503C\u4E0D\u4EE3\u8868\u672A\u77E5\u5730\u5F62\u662F\u5E73\u5730","\u4E8B\u52A1\u5206\u6279\u63D0\u4EA4\u4E0D\u9650\u5236\u5EFA\u7B51\u89C4\u6A21\uFF1B\u5355\u4E2A\u5750\u6807\u8303\u56F4\u6709\u9650"],motion:"create-native-preview",blueprint:c.base.metadata?.placementMask?{schema:c.base.metadata.placementMask.schema,size:c.base.metadata.placementMask.size,skipCount:c.base.metadata.placementMask.skipCount,eraseCount:c.base.metadata.placementMask.eraseCount}:null};else if(a==="scene.readRegion")l=this.region(d,o);else if(a==="scene.getBlocks")Array.isArray(o.positions)||$("INVALID_POSITIONS","\u9700\u8981 positions \u6570\u7EC4"),o.positions.length>2e4&&$("PAGE_TOO_LARGE","\u8BF7\u5206\u9875\u8BFB\u53D6"),l=o.positions.map(p=>{let m=this.bounds(d,{min:p,max:p,space:o.space}),g=d.at(m.min);return{pos:m.min,state:g?d.palette[g.state]:null,placement:dc(d,m.min,g),...g?.nbt?{nbt:g.nbt}:{}}});else if(a==="terrain.readColumns"){let{min:p,max:m}=this.bounds(d,o),g=Math.min(2e4,o.limit||4096),y=m[0]-p[0]+1,b=y*(m[2]-p[2]+1),_=Number(o.cursor||0),v=[];(!Number.isSafeInteger(_)||_<0||g<1)&&$("INVALID_CURSOR","\u65E0\u6548\u5206\u9875\u53C2\u6570");for(let M=_;M<Math.min(b,_+g);M++){let x=p[0]+M%y,E=p[2]+Math.floor(M/y);v.push({x,z:E,...d.column(x,E)})}l={rows:v,nextCursor:_+v.length<b?String(_+v.length):null,exact:!0,source:"original"}}else if(a==="workplanes.list")l={items:Za(d,o.space),space:o.space||"local"};else if(a==="workplanes.atCurve"){let p=d.design.guides?.find(m=>m.id===o.guideId);p||$("GUIDE_NOT_FOUND","\u8BF7\u9009\u62E9\u5DF2\u4FDD\u5B58\u7684\u8DEF\u5F84"),l={...Ja(p.points,o.station??.5),source:{kind:"curve-station",guideId:p.id,station:o.station??.5,mode:"snapshot"},space:o.space||"local"},o.space==="world"&&(d.originConfirmed||$("ORIGIN_UNKNOWN","\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9"),l.frame.origin=l.frame.origin.map((m,g)=>m+d.origin[g]))}else if(a==="meshes.list")l=zt(d.design);else if(a==="meshes.read")l=Cn(d.design,o.id);else if(a==="measurements.list")l={items:fc(d,o.space),space:o.space||"local"};else if(a==="materials.collect"){o.space!==void 0&&!["local","world"].includes(o.space)&&$("INVALID_SPACE","\u7D20\u6750\u9009\u533A\u9700\u8981 local \u6216 world \u5750\u6807");let p=structuredClone(o);p.space==="world"&&(d.originConfirmed||$("ORIGIN_UNKNOWN","\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u5750\u6807\u539F\u70B9"),Fn(p,d.origin),p.space="local");let m=this.bounds(d,p),g=new Map,y=0;for(let _ of Ln(d,m.min,m.max,{keys:p.members,regions:p.regions,all:!!p.all}))y++,g.set(_.state,(g.get(_.state)||0)+1);let b=new Map;for(let[_,v]of g){let M=d.palette[_],x=V(M),E=b.get(x);E?E.count+=v:b.set(x,{state:structuredClone(M),count:v})}l={blockCount:y,states:[...b.values()].sort((_,v)=>v.count-_.count||V(_.state).localeCompare(V(v.state)))}}else if(a==="materials.search")l={items:this.resources().catalogue(o.query||"").slice(o.offset||0,(o.offset||0)+Math.min(o.limit||100,1e3)),existing:d.palette.filter(p=>p.Name.includes(o.query||"")).slice(0,1e3),restricted:!1};else if(a==="views.list")l={items:uc(d,o.space),space:o.space||"local"};else if(a==="generation.links")l=ii(d.design);else if(a==="palettes.list")l=structuredClone(d.design.materialPalettes||[]);else if(a==="collections.list")l=dl(d);else if(["prefabs.list","prefabs.read"].includes(a))l=Il(d,a,o);else if(a==="selectionSets.list")l=nc(d);else if(a==="selectionSets.resolve")l=ic(d,o.id);else if(a==="objects.list")l=d.design.objects.map(p=>({...p,cells:p.cells?.map(Z),animation:d.design.animations[p.id]||null}));else if(a==="transaction.begin"){this.guard(o);let p=crypto.randomUUID();this.transactions.set(p,{site:c.fork(),baseRevision:this.revision,policy:o.policy||{allowTerrain:!1,allowExisting:!1}}),l={transactionId:p,baseRevision:this.revision}}else if(a==="transaction.abort")h||$("TRANSACTION_REQUIRED","\u9700\u8981\u4E8B\u52A1 ID"),this.transactions.delete(o.transactionId),l={aborted:!0};else if(a==="transaction.inspect")h||$("TRANSACTION_REQUIRED","\u9700\u8981\u4E8B\u52A1 ID"),l={baseRevision:h.baseRevision,summary:d.summary(),changes:d.diff().slice(o.offset||0,(o.offset||0)+Math.min(o.limit||4096,2e4))};else if(a==="transaction.apply")h||$("TRANSACTION_REQUIRED","\u9700\u8981\u4E8B\u52A1 ID"),d.operations(this.operations(d,o),h.policy),l={staged:!0,summary:d.summary()};else if(a==="transaction.commit")h||$("TRANSACTION_REQUIRED","\u9700\u8981\u4E8B\u52A1 ID"),this.guard({...o,expectedRevision:h.baseRevision}),l=this.commit(d),this.transactions.delete(o.transactionId),u=!0;else if(["meshes.put","meshes.remove","views.put","views.remove","measurements.put","measurements.remove","edit.apply","edit.brush","objects.put","objects.rename","selectionSets.put","selectionSets.remove","collections.put","collections.remove","palettes.put","palettes.remove","workplanes.put","workplanes.remove","selection.transform","prefabs.put","prefabs.remove","prefabs.place"].includes(a)){h||this.guard(o);let p=d.fork(),m=h?.policy||o.policy||{allowTerrain:!1,allowExisting:!1};if(a==="edit.brush"){let g=structuredClone(o);if(Array.isArray(g.points)||$("INVALID_OPERATIONS","\u9700\u8981 points \u6570\u7EC4"),g.space==="world"&&(p.originConfirmed||$("ORIGIN_UNKNOWN","\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9"),g.points=g.points.map(b=>b.map((_,v)=>_-p.origin[v])),g.mask)){for(let b of["minY","maxY"])g.mask[b]!==void 0&&(g.mask[b]-=p.origin[1]);g.mask.selection&&Fn(g.mask.selection,p.origin)}Array.isArray(g.points)||$("INVALID_OPERATIONS","\u9700\u8981 points \u6570\u7EC4"),g.state&&this.operations(p,{operations:[{type:"set",pos:g.points[0]||[0,0,0],state:g.state}]});let y=kn(p,g,new Map(On(p,this.resources()).map(b=>[b.id,b])));p.operations(y.operations,m),l={filtered:y.filtered,warnings:y.warnings}}if((a==="palettes.put"||a==="palettes.remove")&&(l=sc(p,a,o)),(a==="meshes.put"||a==="meshes.remove")&&(l=Fi(p,a,o)),(a==="collections.put"||a==="collections.remove")&&(l=pl(p,a,o)),(a==="views.put"||a==="views.remove")&&(l=cc(p,a,o)),(a==="measurements.put"||a==="measurements.remove")&&(l=hc(p,a,o)),(a==="workplanes.put"||a==="workplanes.remove")&&(l=$a(p,a,o)),a==="edit.apply"&&p.operations(this.operations(p,o),m),a==="selection.transform"){let g=structuredClone(o);g.space==="world"&&(p.originConfirmed||$("ORIGIN_UNKNOWN","\u8BF7\u786E\u8BA4\u4E16\u754C\u539F\u70B9"),Fn(g,p.origin),g.at=g.at.map((y,b)=>y-p.origin[b])),xr(p,g,m)}if(["prefabs.put","prefabs.remove","prefabs.place"].includes(a)){let g=structuredClone(o);g.space!==void 0&&!["local","world"].includes(g.space)&&$("INVALID_SPACE","\u5750\u6807\u7A7A\u95F4\u9700\u8981 local \u6216 world"),g.space==="world"&&(g.selection||g.at)&&(p.originConfirmed||$("ORIGIN_UNKNOWN","\u8BF7\u786E\u8BA4\u4E16\u754C\u539F\u70B9"),g.selection&&Fn(g.selection,p.origin),g.at&&(g.at=g.at.map((y,b)=>y-p.origin[b]))),l=Un(p,a,g,m)}if(["selectionSets.put","selectionSets.remove"].includes(a)){let g=structuredClone(o);g.selectionSet?.selection&&g.space==="world"&&(p.originConfirmed||$("ORIGIN_UNKNOWN","\u8BF7\u786E\u8BA4\u4E16\u754C\u539F\u70B9"),Fn(g.selectionSet.selection,p.origin)),l=rc(p,a,g)}if(a==="objects.rename"&&(l=mr(p,o.names)),a==="objects.put"){let g=structuredClone(o.object);(!g?.name||!Array.isArray(g.cells)||!g.cells.length)&&$("INVALID_OBJECT","\u5BF9\u8C61\u9700\u8981\u540D\u79F0\u548C\u4EFB\u610F\u65B9\u5757\u5750\u6807 cells");let y=o.space==="world"?g.cells.map(_=>_.map((v,M)=>v-p.origin[M])):g.cells;o.space==="world"&&!p.originConfirmed&&$("ORIGIN_UNKNOWN","\u8BF7\u786E\u8BA4\u4E16\u754C\u539F\u70B9");for(let _ of y)this.bounds(p,{min:_,max:_});g.collectionId&&!p.design.collections?.some(_=>_.id===g.collectionId)&&$("INVALID_COLLECTION","\u5BF9\u8C61\u96C6\u5408\u5DF2\u4E0D\u5B58\u5728"),g.id=g.id||crypto.randomUUID(),g.min=[0,1,2].map(_=>Math.min(...y.map(v=>v[_]))),g.max=[0,1,2].map(_=>Math.max(...y.map(v=>v[_]))),g.cells=y.map(_=>L(..._));let b=p.design.objects.findIndex(_=>_.id===g.id);b<0?p.design.objects.push(g):p.design.objects[b]=g,o.animation&&$("CREATE_MANAGED_ANIMATION","\u8FD0\u52A8\u7531 Create \u65B9\u5757\u4E0E\u88C5\u7F6E\u6570\u636E\u81EA\u52A8\u51B3\u5B9A\uFF0C\u4E0D\u9700\u8981\u5355\u72EC\u52A8\u753B\u53C2\u6570")}h?(h.site=p,l={...a==="edit.brush"||a==="objects.rename"||a.startsWith("meshes.")||a.startsWith("workplanes.")||a.startsWith("measurements.")||a.startsWith("views.")||a.startsWith("collections.")||a.startsWith("palettes.")||a.startsWith("prefabs.")||a.startsWith("selectionSets.")?l:{},staged:!0,summary:p.summary()}):(l={...this.commit(p),...a==="edit.brush"||a==="objects.rename"||a.startsWith("meshes.")||a.startsWith("workplanes.")||a.startsWith("measurements.")||a.startsWith("views.")||a.startsWith("collections.")||a.startsWith("palettes.")||a.startsWith("prefabs.")||a.startsWith("selectionSets.")?l:{}},u=!0)}else a==="history.undo"||a==="history.redo"?(this.guard(o),c.restore(a.endsWith("undo")?"undo":"redo"),this.changed(),l=c.summary(),u=!0):$("UNKNOWN_METHOD","\u672A\u77E5\u8BBE\u8BA1\u63A5\u53E3",{method:a});let f={schema:"craftstudio-design/1",id:i??null,ok:!0,workspaceId:this.workspaceId,revision:this.revision,value:l};return s&&(u||["transaction.begin","transaction.apply","transaction.abort","meshes.put","meshes.remove","objects.put","collections.put","collections.remove","palettes.put","palettes.remove","workplanes.put","workplanes.remove","selection.transform"].includes(a))&&fr(this.receipts,n,f),f}catch(n){return{schema:"craftstudio-design/1",id:e?.id??null,ok:!1,workspaceId:this.workspaceId,revision:this.revision,error:{code:n.code||"EDIT_REJECTED",message:n.message,details:n.details||{}}}}}};function uo(r,e){let t=[];for(let[n,i]of(r.base.entities||[]).entries()){let s=Ie(i),o=s.nbt||s;if(!["minecraft:item_frame","minecraft:glow_item_frame","minecraft:painting"].includes(o.id))continue;let a=s.pos||o.Pos?.map((g,y)=>g-r.origin[y]);if(!a?.every(Number.isFinite))continue;let c=o.Item?.id||"empty",l={Name:"craftstudio:decoration_"+n},u=Number(o.Facing??o.facing??3),h={2:180,3:0,4:90,5:270}[u]||0,d=Object.fromEntries(["east","west","up","down","north","south"].map(g=>[g,{texture:null}])),f=[{from:[0,0,7],to:[16,16,8],faces:d}],p=!0;if(c!=="empty"){let[g,y]=c.split(":"),b="assets/"+g+"/textures/item/"+y+".png";p=!e.texture(b),f.push({from:[2,2,8],to:[14,14,8.2],faces:{south:{texture:p?null:b}}})}let m={id:l.Name,state:l,parts:[{x:u===0?90:u===1?-90:0,y:h,elements:f}],full:!1,alpha:"opaque",issues:p&&c!=="empty"?["\u5C55\u793A\u6846\u5185\u7269\u54C1\u7F3A\u5C11\u8D34\u56FE\uFF1A"+c]:[]};e.saved.models[V(l)]=m,t.push({id:"decoration:"+n,state:l,position:a.map(g=>g+.5),model:m,axis:null,rpm:0,savedAngle:0,readOnly:!0,blockCount:1,item:c})}return t}function pc(r){let[e,t,n]=r.size;if(e*t*n>32e6)throw Error("Sponge \u9700\u8981\u5305\u542B\u7A7A\u6C14\u7684\u5B8C\u6574\u4F53\u79EF\uFF0C\u8BF7\u5148\u88C1\u5207\u8FC7\u5927\u7684\u533A\u57DF");let i=[{Name:"minecraft:air"},...r.palette.filter(l=>l.Name!=="minecraft:air")],s=new Map(i.map((l,u)=>[V(l),u])),o=new Map(r.blocks.map(l=>[l.pos[0]+e*(l.pos[2]+n*l.pos[1]),l])),a=[],c=[];for(let l=0;l<e*t*n;l++){let u=o.get(l),h=u?s.get(V(r.palette[u.state])):0;do{let d=h&127;h>>>=7,a.push(d|(h?128:0))}while(h);if(u?.nbt){let d=structuredClone(u.nbt);c.push({Pos:X(11,u.pos),Id:X(8,d.v.id?.v||r.palette[u.state].Name),Data:d})}}if(r.entities?.length)throw Error("Sponge \u5BFC\u51FA\u5C1A\u4E0D\u8F6C\u6362\u533A\u57DF\u5B9E\u4F53\uFF0C\u8BF7\u7528\u5B8C\u6574 NBT \u6216\u53EA\u5BFC\u51FA\u65B0\u589E\u5EFA\u7B51");return zs(X(10,{Schematic:X(10,{Version:X(3,3),DataVersion:X(3,r.dataVersion||3955),Width:X(2,e),Height:X(2,t),Length:X(2,n),Offset:X(11,r.origin||[0,0,0]),Blocks:X(10,{Palette:X(10,Object.fromEntries(i.map((l,u)=>[V(l).replace(/\[\]$/,""),X(3,u)]))),Data:X(7,a),BlockEntities:X(9,[10,c])})})}))}var yp={east:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],west:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],up:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],down:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],south:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],north:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]},vp={east:[1,0,0],west:[-1,0,0],up:[0,1,0],down:[0,-1,0],south:[0,0,1],north:[0,0,-1]};function hi(r,e,t,n=[.5,.5,.5]){let i=t*Math.PI/180,s=Math.cos(i),o=Math.sin(i),a=r.map((l,u)=>l-n[u]),c;return e==="y"?c=[a[0]*s+a[2]*o,a[1],-a[0]*o+a[2]*s]:e==="x"?c=[a[0],a[1]*s-a[2]*o,a[1]*o+a[2]*s]:c=[a[0]*s-a[1]*o,a[0]*o+a[1]*s,a[2]],c.map((l,u)=>l+n[u])}function we(r){return[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]}function xp(r){if(/white_concrete|quartz/.test(r))return we(15197659);if(/cherry/.test(r)&&!/leaves/.test(r))return we(13014945);if(/dark_oak/.test(r))return we(6637365);if(/white_sail/.test(r))return we(15197140);if(/black_sail/.test(r))return we(3423035);if(/water/.test(r))return we(6003654);if(/cherry_leaves/.test(r))return we(14198207);if(/leaves|grass|moss/.test(r))return we(8954229);if(/dirt|mud/.test(r))return we(8545100);if(/limestone|calcite|marble|diorite/.test(r))return we(13552050);if(/copper/.test(r))return we(12159845);if(/oak|wood|log|plank/.test(r))return we(10781792);if(/sand/.test(r))return we(13679761);if(/glass|ice/.test(r))return we(11324625);if(/stone|andesite|ore|gravel/.test(r))return we(9738137);let e=0;for(let t of r)e=e*31+t.charCodeAt(0)>>>0;return[.35+(e&127)/500,.35+(e>>8&127)/500,.35+(e>>16&127)/500]}function qe(r,e,{mode:t="after",cut:n=4095,plants:i=!0,showGround:s=!0,showExisting:o=!0,progress:a=4095,chunk:c=null,excludeWholeKinetics:l=!1,hidden:u=[],animated:h=[],isolateKeys:d=null,geometryOnly:f=!1}={}){let p=[...u,...h].map(A=>({...A,members:A.cells?new Set(A.cells):null})),m=A=>p.some(I=>(!I.members||I.members.has(L(...A)))&&A.every((N,D)=>N>=I.min[D]&&N<=I.max[D])),g=c?r.baseChunks.get(c)||new Map:r.cells,y=c?r.overlayChunks.get(c)||new Map:r.overlay,b=t==="before"?g:new Map(g);if(t!=="before")for(let[A,I]of y)I.state<0?b.delete(A):I.pos[1]<=a&&b.set(A,I);let _=t==="removed"||t==="diff"?[...y].filter(([A,I])=>r.cells.has(A)&&(t==="removed"||I.state<0)).map(([A])=>r.cells.get(A)):[],v=A=>{if(A.some(D=>D<0||D>=4096)||d&&!d.has(L(...A)))return null;let I=L(...A);if(t==="before")return r.cells.get(I);let N=r.overlay.get(I);return N&&N.pos[1]<=a?N.state<0?null:N:r.cells.get(I)},M=new Map,x=new Map,E=new Map,w=A=>{if(!E.has(A)){let I=r.palette[A].Name;E.set(A,{name:I,isPlant:/leaves|sapling|grass(?!_block)|petals|flower|fern|vine/.test(I),isGround:/:(stone|andesite|diorite|granite|dirt|grass_block|gravel|sand|clay|deepslate|tuff|bedrock|water)$/.test(I)||/_ore$/.test(I),color:xp(I)})}return E.get(A)},S=A=>(x.has(A)||x.set(A,e.model(r.palette[A])),x.get(A)),T=(A,I=!1)=>{if(d&&!d.has(L(...A.pos))||A.pos[1]>n||t!=="before"&&m(A.pos))return;let{name:N,isPlant:D,isGround:U}=w(A.state);if(!i&&D||!s&&U||!o&&!U&&!D&&r.cells.has(L(...A.pos))&&!r.overlay.has(L(...A.pos)))return;let F=r.overlay.get(L(...A.pos)),z=I?"remove":F?r.cells.has(L(...A.pos))?"replace":"add":"keep";if(t==="removed"&&!I)return;let G=S(A.state),W=t==="diff"||I?we(z==="remove"?13986914:z==="replace"?14858092:z==="add"?6997412:8951694):w(A.state).color;if(!(l&&!I&&["create:shaft","create:cogwheel","create:large_cogwheel","create:large_water_wheel"].includes(N)&&t!=="removed")){for(let K of G.parts)for(let q of K.triangles||[]){let pe=q.positions.map(ae=>{let ve=[...ae];return K.x&&(ve=hi(ve,"x",-K.x)),K.y&&(ve=hi(ve,"y",-K.y)),ve.map((mt,Vn)=>mt+A.pos[Vn])}),ee=pe[1].map((ae,ve)=>ae-pe[0][ve]),oe=pe[2].map((ae,ve)=>ae-pe[0][ve]),Pe=[ee[1]*oe[2]-ee[2]*oe[1],ee[2]*oe[0]-ee[0]*oe[2],ee[0]*oe[1]-ee[1]*oe[0]],Ye=Math.hypot(...Pe)||1;for(let ae=0;ae<3;ae++)Pe[ae]/=Ye;let Ee=t==="diff"||I?null:q.texture,Ne=(Ee||"color")+"|"+(I?"deleted":G.alpha||"opaque");M.has(Ne)||M.set(Ne,{texture:Ee,alpha:I?"deleted":G.alpha||"opaque",positions:[],normals:[],colors:[],uv:[]});let be=M.get(Ne);for(let ae=0;ae<3;ae++)be.positions.push(...pe[ae]),be.normals.push(...Pe),f||(be.colors.push(...Ee?[1,1,1]:W),be.uv.push(...q.uv?.[ae]||[0,0]))}for(let K of G.parts)for(let q of K.elements){let pe=q.from.map(oe=>oe/16),ee=q.to.map(oe=>oe/16);for(let[oe,Pe]of Object.entries(q.faces||{})){let Ye=vp[oe];if(!Ye)continue;if(!I&&/:water$/.test(N)){let ie=A.pos.map((Be,at)=>Be+Ye[at]),se=v(ie);if(se&&r.palette[se.state].Name===N&&ie[1]<=n&&s)continue}if(G.full&&!I&&!K.x&&!K.y&&!q.rotation){let ie=A.pos.map((se,Be)=>se+Ye[Be]);if(ie[1]<=n){let se=v(ie);if(se){let{name:Be,isPlant:at,isGround:Hn}=w(se.state);if((i||!at)&&(s||!Hn)&&(o||at||Hn||r.overlay.has(L(...ie)))&&!m(ie)){let zr=S(se.state);if(zr.full&&zr.alpha==="opaque"||zr.full&&G.alpha==="transparent"&&r.palette[se.state].Name===N)continue}}}}let Ee=yp[oe].map(ie=>ie.map((se,Be)=>se?ee[Be]:pe[Be]));for(let ie=0;ie<4;ie++){let se=Ee[ie];if(q.rotation){let Be=q.rotation.origin.map(at=>at/16);if(q.rotation.rescale){let at=1/Math.cos(q.rotation.angle*Math.PI/180);se=se.map((Hn,xi)=>xi==="xyz".indexOf(q.rotation.axis)?Hn:Be[xi]+(Hn-Be[xi])*at)}se=hi(se,q.rotation.axis,q.rotation.angle,Be)}K.x&&(se=hi(se,"x",-K.x)),K.y&&(se=hi(se,"y",-K.y)),Ee[ie]=se.map((Be,at)=>Be+A.pos[at])}let Ne=Ee[1].map((ie,se)=>ie-Ee[0][se]),be=Ee[2].map((ie,se)=>ie-Ee[0][se]),ae=[Ne[1]*be[2]-Ne[2]*be[1],Ne[2]*be[0]-Ne[0]*be[2],Ne[0]*be[1]-Ne[1]*be[0]],ve=Math.hypot(...ae)||1;for(let ie=0;ie<3;ie++)ae[ie]/=ve;let mt=t==="diff"||I?null:Pe.texture,Vn=(mt||"color")+"|"+(I?"deleted":G.alpha||"opaque");M.has(Vn)||M.set(Vn,{texture:mt,alpha:I?"deleted":G.alpha||"opaque",positions:[],normals:[],colors:[],uv:[]});let vi=M.get(Vn),Dc=Pe.uv||[0,0,16,16],[mo,go,yo,vo]=Dc.map(ie=>ie/16),Lc=[[mo,1-vo],[yo,1-vo],[yo,1-go],[mo,1-go]],Uc=(Pe.rotation||0)/90,kc=Pe.tintindex!==void 0?we(9746808):[1,1,1],Oc=mt?kc:W;for(let ie of[0,1,2,0,2,3])vi.positions.push(...Ee[ie]),vi.normals.push(...ae),f||(vi.colors.push(...Oc),vi.uv.push(...Lc[(ie+Uc)%4]))}}}};if(t!=="removed")for(let A of b.values())T(A);for(let A of _)T(A,!0);let C=[...M.values()].map(A=>({texture:A.texture,alpha:A.alpha,positions:new Float32Array(A.positions),normals:new Float32Array(A.normals),...f?{}:{colors:new Float32Array(A.colors),uv:new Float32Array(A.uv)}})),P=[];for(let[A,I]of x)for(let N of I.issues)P.push(r.palette[A].Name+"\uFF1A"+N);return{buckets:C,issues:[...new Set(P)],triangles:C.reduce((A,I)=>A+I.positions.length/9,0)}}function mc(r,e,t=2){if(!e?.length||!Number.isFinite(t))return!0;let n=r.split(",").map(s=>Number(s)*16-t),i=n.map(s=>s+16+t*2);return e.every(([s,o,a,c])=>s*(s>=0?i[0]:n[0])+o*(o>=0?i[1]:n[1])+a*(a>=0?i[2]:n[2])+c>=0)}function gc(r){let e=2;for(let t of r.parts||[]){for(let n of t.triangles||[])for(let i of n.positions||[])e=Math.max(e,Math.hypot(...i.map(s=>s-.5))+.5);for(let n of t.elements||[]){let i=(n.rotation?.origin||[8,8,8]).map(a=>a/16),s=i.map((a,c)=>Math.max(Math.abs(n.from[c]/16-a),Math.abs(n.to[c]/16-a))),o=n.rotation?.rescale?Math.max(1,Math.abs(1/Math.cos(n.rotation.angle*Math.PI/180))):1;e=Math.max(e,Math.hypot(...s)*o+Math.hypot(...i.map(a=>a-.5))+.5)}}return e}var Pr=class{constructor(){this.site=null,this.resources=null,this.resourceVersion=-1,this.signature="",this.meta=new Map,this.dirty=new Set,this.sentTextures=new Set,this.visibility=[],this.visibilitySignature="",this.resident=new Set,this.deferred=new Set}changed(e){for(let t of e.changedPositions){this.dirty.add(Pt(t));for(let n=0;n<3;n++)for(let i of[-1,1]){let s=[...t];s[n]+=i,s[n]>=0&&s[n]<4096&&this.dirty.add(Pt(s))}}}render(e,t,n={}){if(n.chunkBudget!==void 0&&(!Number.isInteger(n.chunkBudget)||n.chunkBudget<1||n.chunkBudget>4096))throw Error("Invalid mesh chunk budget");if(n.viewFocus!==void 0&&(!Array.isArray(n.viewFocus)||n.viewFocus.length!==3||n.viewFocus.some(v=>!Number.isFinite(v))))throw Error("Invalid mesh view focus");for(let v of n.releasedTextures||[])this.sentTextures.delete(v);let i=performance.now(),s={...n,cut:n.cut>=e.size[1]-1?4095:n.cut},o=JSON.stringify({...s,hidden:void 0,animated:void 0,viewPlanes:void 0,releasedTextures:void 0,chunkBudget:void 0,viewFocus:void 0})+"|"+t.version,a=this.resources!==t||this.resourceVersion!==t.version,c=this.site!==e||a||this.signature!==o,l=[...s.hidden||[],...s.animated||[]],u=JSON.stringify(l);if(u!==this.visibilitySignature&&!c)for(let v of[...this.visibility,...l])for(let M=Math.floor(Math.max(0,v.min[0]-1)/16);M<=Math.floor((v.max[0]+1)/16);M++)for(let x=Math.floor(Math.max(0,v.min[1]-1)/16);x<=Math.floor((v.max[1]+1)/16);x++)for(let E=Math.floor(Math.max(0,v.min[2]-1)/16);E<=Math.floor((v.max[2]+1)/16);E++)this.dirty.add([M,x,E].join(","));this.visibility=l,this.visibilitySignature=u,(c||this.paletteSize!==e.palette.length||s.viewPlanes&&!this.marginResolved)&&(this.paletteSize=e.palette.length,this.viewMargin=s.viewPlanes?Math.max(2,...e.palette.map(v=>gc(t.model(v)))):2,this.marginResolved=!!s.viewPlanes);let h=new Set([...e.baseChunks.keys(),...e.overlayChunks.keys()]),d=new Set([...h].filter(v=>mc(v,s.viewPlanes,this.viewMargin))),f=[...this.resident].filter(v=>!d.has(v));for(let v of f)this.resident.delete(v),this.meta.delete(v);let p=c?new Set(d):new Set([...this.dirty,...this.deferred,...[...d].filter(v=>!this.resident.has(v))]);for(let v of[...p])d.has(v)||(p.delete(v),this.deferred.add(v));c&&(this.meta.clear(),this.sentTextures.clear(),this.resident.clear(),this.deferred.clear());let m=[...p];if(s.viewFocus){let v=M=>M.split(",").reduce((x,E,w)=>x+(Number(E)*16+8-s.viewFocus[w])**2,0);m.sort((M,x)=>v(M)-v(x)||M.localeCompare(x))}let g=Math.max(0,m.length-(s.chunkBudget||m.length));if(s.chunkBudget){for(let v of m.slice(s.chunkBudget))this.deferred.add(v);m=m.slice(0,s.chunkBudget)}for(let v of m)this.deferred.delete(v);let y=[],b={},_=0;for(let v of m){_+=(e.baseChunks.get(v)?.size||0)+(e.overlayChunks.get(v)?.size||0);let M=qe(e,t,{...s,chunk:v});y.push({key:v,buckets:M.buckets,triangles:M.triangles}),this.resident.add(v),this.meta.set(v,{triangles:M.triangles,issues:M.issues});for(let x of M.buckets)x.texture&&!this.sentTextures.has(x.texture)&&(b[x.texture]=t.texture(x.texture),this.sentTextures.add(x.texture))}return this.site=e,this.resources=t,this.resourceVersion=t.version,this.signature=o,this.dirty.clear(),{reset:c,resetTextures:a,chunks:y,evicted:f,textures:b,triangles:[...this.meta.values()].reduce((v,M)=>v+M.triangles,0),issues:[...new Set([...this.meta.values()].flatMap(v=>v.issues))],stats:{pending:g,chunks:y.length,resident:this.resident.size,total:h.size,candidates:_,meshMs:performance.now()-i,...e.baseline?{source:e.baseline.stats()}:{}}}}};var _p={east:{axis:"x",sign:1},west:{axis:"x",sign:-1},up:{axis:"y",sign:1},down:{axis:"y",sign:-1},south:{axis:"z",sign:1},north:{axis:"z",sign:-1}},yc={up:{x:0,y:0},down:{x:180,y:0},north:{x:90,y:0},south:{x:90,y:180},east:{x:90,y:90},west:{x:90,y:270}},bp={south:{x:0,y:0},north:{x:0,y:180},east:{x:0,y:270},west:{x:0,y:90},up:{x:90,y:0},down:{x:270,y:0}},Mp={east:"west",west:"east",up:"down",down:"up",south:"north",north:"south"};function wp(r){let e=BigInt.asUintN(64,BigInt(r));return[Number(BigInt.asIntN(26,e>>38n)),Number(BigInt.asIntN(12,e&4095n)),Number(BigInt.asIntN(26,e>>12n&67108863n))]}function vc(r,e,t,n=!1){return t.reduce((s,o,a)=>s+("xyz"[a]===e?0:o),0)%2===0?22.5:!n&&r.Name.includes("large_cogwheel")?11.25:0}function ho(r){return r?Ie(r):{}}function Sp(r,e,t){let n=ho(r.nbt),i=typeof n.Speed=="number"&&Number.isFinite(n.Speed)?n.Speed:null,s=e.Properties?.facing||"up";return{axis:e.Properties?.axis||_p[s]?.axis||"y",rpm:i,known:i!==null,savedAngle:typeof n.Angle=="number"?n.Angle:0,running:n.Running===void 0?null:!!n.Running,worldPos:r.pos.map((a,c)=>a+t[c]),network:n.Network||null}}var Ep=new Set(["create:shaft","create:cogwheel","create:large_cogwheel","create:large_water_wheel"]),Ap=new Set(["create:mechanical_bearing","create:windmill_bearing","create:clockwork_bearing"]);function Nr(r){return Ep.has(r.Name)?{kind:"whole"}:Ap.has(r.Name)?{kind:"bearing"}:r.Name==="create:water_wheel"?{kind:"waterwheel"}:null}function Tp(r,e){let t=()=>Object.fromEntries(["east","west","up","down","north","south"].map(i=>[i,{texture:null}])),n=e==="shaft"?[[[6,6,8],[10,10,16]]]:e==="bearing"?[[[0,12,0],[16,16,16]]]:[[[6,0,6],[10,16,10]],[[-8,6,6],[24,10,10]],[[6,6,-8],[10,10,24]]];return{id:r.Name,parts:[{x:0,y:0,elements:n.map(([i,s])=>({from:i,to:s,faces:t()}))}],alpha:"opaque",full:!1,missing:!0,issues:["\u6B64\u8FD0\u52A8\u90E8\u4EF6\u4E3A\u7B80\u5316\u51E0\u4F55\uFF1B\u9644\u52A0 Create JAR \u53EF\u8BFB\u53D6\u539F\u7248 partial \u6A21\u578B\u3002"]}}function zn(r,e,t,n,i){let s=r.partial(e,t);if(!s.missing)return s;let o=Tp(n,i);return o.parts[0].x=t.x||0,o.parts[0].y=t.y||0,o}function Cp(r,e){let t={pos:[0,0,0],state:0},s=qe({cells:new Map([[0,t]]),overlay:new Map,palette:[e]},{model:()=>r});for(let o of s.buckets)for(let a=0;a<o.positions.length;a++)o.positions[a]-=.5;return s}function fo(r,{original:e=!1}={}){let t=[],n=[];for(let i=0;i<(r.base.entities||[]).length;i++){let s=ho(r.base.entities[i]),o=s.nbt||{},a=o.Contraption;if(a)try{let c=a.Blocks,l=c?.Palette,u=c?.BlockList;if(!Array.isArray(l)||!Array.isArray(u))throw Error("\u65E7\u7248\u6216\u672A\u77E5 Blocks \u683C\u5F0F");let h=u.map(v=>{if(!l[v.State])throw Error("\u88C5\u7F6E\u8C03\u8272\u677F\u8D8A\u754C");return{pos:wp(v.Pos),state:v.State,nbt:v.Data||null}}),d=s.pos||o.Pos?.map((v,M)=>v-r.origin[M]);if(!d?.every(Number.isFinite))throw Error("\u7F3A\u5C11\u6709\u6548\u5B9E\u4F53\u4F4D\u59FF");let f=typeof o.Axis=="string"?o.Axis.toLowerCase():null,p=o.ControllerRelative,m=Array.isArray(p)?d.map((v,M)=>Math.floor(v)+p[M]):null,g=m?r.at(m,e):null,y=g?ho(g.nbt):{},b=a.Type==="create:bearing",_=typeof y.Speed=="number"?y.Speed:null;b&&y.id==="create:windmill_bearing"&&typeof y.LastGenerated=="number"&&_!==0&&(_=y.LastGenerated),(o.Stalled||a.Stalled||y.Running===0)&&(_=0),t.push({id:"contraption:"+i,type:a.Type,position:d,axis:["x","y","z"].includes(f)?f:null,savedAngle:o.Angle||0,rpm:b?_:null,motion:b?"bearing":"captured-pose",stalled:!!o.Stalled,palette:l,blocks:h,controller:m,index:i,notes:b?[]:["\u4EC5\u6062\u590D\u6355\u83B7\u7684\u4F4D\u59FF\uFF1B\u5E73\u79FB\u3001\u8F66\u53A2\u548C\u8FD0\u52A8\u884C\u4E3A\u9700\u8981\u6E38\u620F\u8FD0\u884C\u65F6\u72B6\u6001\u3002"]})}catch(c){n.push({index:i,id:o.id,reason:c.message})}}return{items:t,unsupported:n}}var fi=class{constructor(){this.site=null,this.resources=null,this.resourceVersion=-1,this.parts=new Map,this.baseParts=new Map,this.geometry=new Map,this.sent=new Set,this.changed=new Set,this.entityCache=null,this.mode=null}invalidate(){this.site=null}changedCells(e){for(let t of e.changedPositions)this.changed.add(L(...t));e.changedPositions.length&&(this.entityCache=null)}render(e,t,{cut:n=4095,mode:i="after",enabled:s=!0,showExisting:o=!0}={}){let a=this.site!==e||this.resources!==t||this.resourceVersion!==t.version,c={},l=[],u=[];a&&(this.parts.clear(),this.baseParts.clear(),this.geometry.clear(),this.sent.clear(),this.entityCache=null),this.mode!==i&&(this.entityCache=null);let h=(p,m,g)=>{this.geometry.has(p)||this.geometry.set(p,Cp(m,g)),this.sent.has(p)||(c[p]=this.geometry.get(p),this.sent.add(p));for(let y of m.issues||[])u.push(g.Name+"\uFF1A"+y)};if(a){for(let[p,m]of e.cells)Nr(e.palette[m.state])&&(this.parts.set(p,m),this.baseParts.set(p,m));for(let[p,m]of e.overlay)m.state>=0&&Nr(e.palette[m.state])?this.parts.set(p,m):this.parts.delete(p)}if(s&&i!=="removed"){for(let m of this.changed){let g=e.at([m%4096,Math.floor(m/16777216),Math.floor(m/4096)%4096]);g&&Nr(e.palette[g.state])?this.parts.set(m,g):this.parts.delete(m)}this.changed.clear();for(let[m,g]of i==="before"?this.baseParts:this.parts){let y=i==="before"?e.cells.get(m):e.at(g.pos);if(!y||y.pos[1]>n||!o&&!e.overlay.has(m))continue;let b=e.palette[y.state],_=Nr(b);if(!_)continue;let v=Sp(y,b,e.origin),M=b.Properties?.axis?{x:b.Properties.axis==="y"?0:90,y:b.Properties.axis==="x"?90:b.Properties.axis==="z"?180:0}:yc[b.Properties?.facing||"up"],x=vc(b,v.axis,v.worldPos),E=(w,S,T=x,C=v.rpm)=>{let P=w+"|"+V(b);h(P,S,b),l.push({id:"block:"+m+":"+w,model:P,owner:y.pos,position:y.pos.map(A=>A+.5),axis:v.axis,rpm:C,savedAngle:T,kind:_.kind,state:b,known:C!==null})};if(_.kind==="whole")b.Name==="create:large_cogwheel"?(E("large-gear",zn(t,"create:block/large_cogwheel_shaftless",M,b,"gear")),E("large-shaft",zn(t,"create:block/cogwheel_shaft",M,b,"shaft"),vc(b,v.axis,v.worldPos,!0))):b.Name==="create:large_water_wheel"?E("large-water-wheel",zn(t,"create:block/large_water_wheel/block",M,b,"wheel")):E("rotor",t.model(b));else if(_.kind==="waterwheel")E("waterwheel",zn(t,"create:block/water_wheel/wheel",M,b,"wheel"));else if(_.kind==="bearing"){let w=b.Properties?.facing||"up";E("bearing-head",zn(t,w==="up"&&b.Name==="create:windmill_bearing"||b.Name==="create:windmill_bearing"?"create:block/bearing/top_wooden":"create:block/bearing/top",yc[w],b,"bearing"),v.savedAngle,v.running===!1?0:v.rpm),E("bearing-shaft",zn(t,"create:block/shaft_half",bp[Mp[w]],b,"shaft"))}}let p=this.entityCache||(this.entityCache=fo(e,{original:i==="before"}));for(let m of p.items){if(m.position[1]>n||!o)continue;let g=m.id+"|"+t.version;if(!this.geometry.has(g)){let y={cells:new Map(m.blocks.map(_=>[L(..._.pos),_])),overlay:new Map,palette:m.palette},b=qe(y,t);for(let _ of b.buckets)for(let v=0;v<_.positions.length;v++)_.positions[v]-=.5;this.geometry.set(g,b)}this.sent.has(g)||(c[g]=this.geometry.get(g),this.sent.add(g)),l.push({id:m.id,model:g,position:m.position.map(y=>y+.5),axis:m.axis,rpm:m.rpm,savedAngle:m.savedAngle,kind:m.motion,readOnly:!0,state:{Name:m.type},blockCount:m.blocks.length,known:m.rpm!==null,controller:m.controller}),u.push(...m.notes)}for(let m of p.unsupported)u.push(m.id+"\uFF1A"+m.reason)}this.site=e,this.resources=t,this.resourceVersion=t.version,this.mode=i;let d=new Set;for(let p of Object.values(c))for(let m of p.buckets)m.texture&&d.add(m.texture);let f=Object.fromEntries([...d].map(p=>[p,t.texture(p)]));return{reset:a,instances:l,definitions:c,textures:f,warnings:[...new Set(u)],stats:{rotatingParts:l.filter(p=>!p.readOnly).length,contraptions:l.filter(p=>p.readOnly).length,knownSpeeds:l.filter(p=>p.known).length,unknownSpeeds:l.filter(p=>!p.known).length}}}};function xc(r){let e=r.match(/<script\b[^>]*\bid=["']scene["'][^>]*>([\s\S]*?)<\/script>/i);if(!e)throw Error("HTML \u6CA1\u6709\u53EF\u8BC6\u522B\u7684 scene \u7ED3\u6784\u6570\u636E\uFF1B\u4E0D\u4F1A\u6267\u884C\u6587\u4EF6\u4E2D\u7684\u811A\u672C\u3002");let t=JSON.parse(e[1]);if(!Array.isArray(t.palette)||!Array.isArray(t.changes)||!t.source_sha256)throw Error("\u4E0D\u662F\u652F\u6301\u7684\u84DD\u56FE\u5BF9\u6BD4 HTML");let n=r.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);return{scene:t,atlas:n?.[0]||null}}function _c(r){let{scene:e,atlas:t}=r,n={models:{},images:{},textures:{}};t&&(n.images.referenceAtlas=t);for(let[i,s]of Object.entries(e.atlas_tiles||{}))t&&(n.textures["reference:"+i]={image:"referenceAtlas",tile:[s[0]/e.atlas_size[0],1-(s[1]+32)/e.atlas_size[1],32/e.atlas_size[0],32/e.atlas_size[1]]});for(let i of e.palette){let s={Name:i.name};Object.keys(i.properties||{}).length&&(s.Properties=i.properties);let o=[];i.texture_exact||o.push("\u53C2\u8003\u6587\u4EF6\u4E2D\u7684\u8D34\u56FE\u4E3A\u8FD1\u4F3C\u66FF\u4EE3"),i.rendered||o.push("\u53C2\u8003\u6587\u4EF6\u6CA1\u6709\u8BE5\u65B9\u5757\u7684\u5B8C\u6574\u6A21\u578B\uFF0C\u4F7F\u7528\u5360\u4F4D\u51E0\u4F55");let a=(i.boxes?.length?i.boxes:[[[0,0,0],[16,16,16]]]).map(([c,l])=>({from:c,to:l,faces:Object.fromEntries(["east","west","north","south","up","down"].map(u=>[u,{texture:t?"reference:"+(u==="up"?i.top:u==="down"?i.bottom:i.texture):null}]))}));n.models[V(s)]={id:s.Name,state:s,parts:[{x:0,y:0,elements:a}],missing:!i.rendered,full:!!i.full,alpha:i.alpha==="water"?"transparent":i.alpha||"opaque",issues:o}}return n}function bc(r,e){let t=r.scene;if(e.sourceHash!==t.source_sha256)throw Error("\u53C2\u8003 HTML \u7684\u539F\u59CB\u6587\u4EF6\u6307\u7EB9\u4E0E\u5F53\u524D\u573A\u5730\u4E0D\u540C\uFF0C\u8BF7\u5148\u5BFC\u5165\u4E0E\u5B83\u914D\u5957\u7684\u533A\u57DF NBT\u3002");let n=t.palette.map(s=>{let o={Name:s.name};return Object.keys(s.properties||{}).length&&(o.Properties=s.properties),o}),i=[];for(let s of t.changes){let o=s.slice(0,3),a=e.at(o,!0),c=s[3]<0?null:n[s[3]];if((a?V(e.palette[a.state]):null)!==(c?V(c):null))throw Error("\u53C2\u8003\u53D8\u66F4\u7684\u4FEE\u6539\u524D\u72B6\u6001\u4E0E\u573A\u5730\u4E0D\u7B26\uFF1A"+o.join(", "));i.push(s[4]<0?{type:"erase",min:o,max:o,reason:s[7]}:{type:"set",pos:o,state:n[s[4]],reason:s[7]})}return i}function Mc(r){let e=new Map,t=0,n=(s,o)=>{if(s?.length!==3||o?.length!==3)return;let a=s.map((l,u)=>l-o[u]);if(a.some(l=>!Number.isFinite(l)||Math.abs(l-Math.round(l))>1e-6))return;let c=a.map(Math.round).join(",");e.set(c,(e.get(c)||0)+1),t++};for(let s of r.entities||[]){let o=s.v.pos?.v[1],a=s.v.nbt?.v.Pos?.v[1];n(a,o)}for(let s of r.blocks){let o=s.nbt?.v;o&&["x","y","z"].every(a=>o[a])&&n([o.x.v,o.y.v,o.z.v],s.pos)}let i=[...e].sort((s,o)=>o[1]-s[1]);return i.length?{origin:i[0][0].split(",").map(Number),votes:i[0][1],total:t,consistent:i[0][1]/t>.95}:null}var Or=[];function Fr(r=Or){let e=new rn;for(let t of r)e.addZip(new Uint8Array(t.bytes),t.name);return e}var Se=new Hi,fe=()=>Se.current||ne||R,kr=()=>Se.resources||J,Dr=null,R=new Le(Oe()),J=new rn,ne=null,st=null,ue=null,re=null,Re=null,It=0,Q=null,ze=[],qt=null,Yt=null,jt=null,ot=crypto.randomUUID(),wc=null,Sc=null,Ec=null,Ac=-1,Tc=-1,Cc=-1,Ct=null,Bn=null;function Lr(){if(Sc!==R||Ec!==J||Ac!==J.version||Tc!==R.palette.length||Cc!==J.partialVersion){let r=[...fo(R).items.flatMap(e=>e.palette),...uo(R,J).map(e=>e.state)];wc=J.bundle([...R.palette,...r]),Sc=R,Ec=J,Ac=J.version,Tc=R.palette.length,Cc=J.partialVersion,Ct=null,Bn=null}return wc}var hn=new Pr,Nc=new Ar,fn=new fi,Ic=null,Rc=-1,po=new Set,Ur=new Map,de=()=>{let r=Se.describe(B.workspaceId);return{revision:B.revision,workspaceId:B.workspaceId,...fe().summary(),design:{...fe().design,meshSources:zt(fe().design),componentDefinitions:fe().design.componentDefinitions?.map(e=>({...e,blocks:void 0,blockCount:e.blocks.length})),objects:fe().design.objects.map(e=>({...e,componentRecords:void 0,componentTrackedCells:e.componentRecords?.length,...e.generation?{generation:{...e.generation,records:void 0,trackedCells:e.generation.records?.length||0}}:{}}))},preview:!!ne,comparison:r,proposal:ue?{...ue}:null,view:{isolated:!!re,contextVisible:!!re&&!!Q?.contextVisible,isolatedCells:re?.size||0,depth:re?ze.length+1:0,objectNames:Re?fe().design.objects.filter(e=>Re.includes(e.id)).map(e=>e.name):[],editBounds:Q?.includeNew?Xt(fe(),Q).bounds:null},resources:kr().summary()}};async function dn(r){if(!self.crypto?.subtle)throw Error("\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u6587\u4EF6 SHA-256 \u6821\u9A8C\uFF0C\u8BF7\u4F7F\u7528\u65B0\u7248 Edge/Chrome");return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",r))).map(e=>e.toString(16).padStart(2,"0")).join("")}async function gi(){jt||(jt=vt(Ae(JSON.stringify(R.base)),{level:1,mtime:0}),ot="baseline:"+await dn(jt))}function di(r){Se.sync(null),Yt=null,self.postMessage({progress:"\u6B63\u5728\u6821\u9A8C\u65B9\u5757\u4E0E\u5EFA\u7ACB\u533A\u5757\u7D22\u5F15"}),re=null,Re=null,Q=null,ze=[],It++,R=new Le(r),J=Fr();let e=Mc(r);return e&&(R.origin=e.origin,R.originConfirmed=e.consistent,R.base.metadata.originEvidence=e),jt=null,ot=R.sourceHash||crypto.randomUUID(),ne=null,st=null,ue=null,de()}function pi(r){if(Se.sync(null),Yt=null,self.postMessage({progress:"\u6B63\u5728\u6062\u590D\u8BBE\u8BA1\u4E0E\u533A\u5757\u7D22\u5F15"}),re=null,Re=null,Q=null,ze=[],It++,r.liteSchema!==1)throw Error("\u672A\u77E5\u8F7B\u91CF\u5DE5\u7A0B\u7248\u672C");return R=Le.unpack(r.site),J=Fr(),J.addSaved(r.assets||{}),jt=null,ot=R.sourceHash||crypto.randomUUID(),ne=null,st=null,ue=null,{...de(),saveForm:Er(r.saveForm||r.site.saveForm)}}var B=new Rr({getSite:()=>R,resources:()=>J,onChange:()=>{hn.changed(R),fn.changedCells(R)}}),Pc=new dr({api:B,execute:yi,summary:de,proposal:()=>ue,operations:()=>st,preview:()=>!!ne,comparison:()=>Se.active});async function mi(r,e){if(Se.sync(B.workspaceId),Se.active&&!Qs(r))throw Error(ai);if(r==="toolContext"){ot?.startsWith("baseline:")||await gi();let s={baseline:ot,header:R.packHeader(),size:R.size,overlay:[...R.overlay].sort(([a],[c])=>a-c)};return{...{workspaceId:B.workspaceId,revision:B.revision},key:await dn(Ae(JSON.stringify(s)))}}if(r==="engineMountSource"&&self.enginePersistence)return self.enginePersistence.mountSource({site:R},e);if(r==="sourceResidency")return R.baseline?.stats()||{mode:"memory",totalBlocks:R.cells.size,residentChunks:R.baseChunks.size};if(r==="engineCapture"&&self.enginePersistence)return self.enginePersistence.capture({site:R,api:B,resources:J,libraryResources:Or,baseKey:ot},e);if(r==="engineRestore"&&self.enginePersistence){Se.sync(null),Yt=null;let s=self.enginePersistence.restore(e);return R=s.site,Or=s.files,J=Fr(),J.addSaved(s.assets),ot=s.baseKey,jt=null,B.workspaceId=s.workspaceId,B.revision=s.revision,B.receipts=new Map(s.receipts),B.transactions.clear(),ne=null,st=null,ue=null,qt=null,re=null,Re=null,Q=null,ze=[],It++,Nc.previous=null,de()}if(r==="undo"&&ne)return yi("cancel",{});if(r==="api"){let s=await Pc.request(e);return s.ok&&e.method==="workspace.describe"&&(s.value.previewActive=!!ne,s.value.comparison=Se.describe(B.workspaceId),s.value.view={isolated:!!re,isolatedCells:re?.size||0,depth:re?ze.length+1:0,editBounds:Q?.includeNew?Xt(R,Q).bounds:null},s.value.proposal=ue?{...ue}:null,s.value.pending={transactionIds:[...B.transactions.keys()],constructionId:qt?.id||null,strokeActive:R.stroke},s.value.methods.push(...Pc.methods)),s}let t=ue,n=R,i=await yi(r,e);return["import","load","resume"].includes(r)&&!(r==="import"&&/\.html?$/i.test(e.name||""))&&await gi(),n!==R&&(re=null,Re=null,Q=null,ze=[],It++),["import","load","resume","edit","undo","redo","origin","protect","unprotect","studio","resources","reference"].includes(r)&&B.changed(n!==R||["import","load","resume"].includes(r)),ue&&ue!==t&&(ue.revision=B.revision,ue.workspaceId=B.workspaceId),i?.sourceBlocks!==void 0&&(i.comparison=Se.describe(B.workspaceId),i.proposal=ue?{...ue}:null,i.revision=B.revision,i.workspaceId=B.workspaceId),i}async function yi(r,e){if(Se.active&&!Qs(r))throw Error(ai);if(r==="comparison"){if(B.guard(e),e.operation==="end")Se.end(),Yt&&({isolatedKeys:re,isolatedIds:Re,isolationContext:Q,isolationStack:ze}=Yt,Yt=null,It++);else if(e.operation!=="inspect"){if(ne||qt||R.stroke||B.transactions.size)throw Error("\u8BF7\u5148\u5B8C\u6210\u6216\u6682\u5B58\u5F53\u524D\u7F16\u8F91\uFF0C\u518D\u6BD4\u8F83\u65B9\u6848");if(e.operation==="capture")Se.capture(e.slot,R,{workspaceId:B.workspaceId,revision:B.revision});else if(e.operation==="show"||e.operation==="load")e.operation==="load"?Se.load(e.bytes,e.source,B.workspaceId):Se.show(e.slot),Yt||(Yt={isolatedKeys:re,isolatedIds:Re,isolationContext:Q,isolationStack:ze},re=Re=Q=null,ze=[],It++);else throw Error("\u672A\u77E5\u65B9\u6848\u6BD4\u8F83\u64CD\u4F5C")}return de()}if(r==="import"){self.postMessage({progress:"\u6B63\u5728\u89E3\u6790\u6587\u4EF6\u7ED3\u6784"});let t=new Uint8Array(e.bytes);if(/\.json$/i.test(e.name)){let i=JSON.parse(new TextDecoder().decode(t));return i.liteSchema?pi(i):di(i)}if(/\.craftlite$/i.test(e.name))return pi(JSON.parse(He(Ze(t))));if(/\.craftregions$/i.test(e.name)){let i=yl(t);return i.metadata.sourceHash=await dn(t),di(i)}if(/\.zip$/i.test(e.name)){let i=Ll(t);if(i.projectBytes)return pi(JSON.parse(He(Ze(i.projectBytes))));let s=ni(i.blueprintBytes,i.manifest.title||e.name);return s.origin=i.placement.worldOffset||[0,0,0],s.metadata.originConfirmed=i.placement.worldOffset!==null,s.metadata.sourceHash=await dn(i.blueprintBytes),s.metadata.delivery={kind:i.manifest.kind,source:i.manifest.source,placement:i.placement},di(s)}if(/\.html?$/i.test(e.name))return mi("reference",{html:new TextDecoder().decode(t)});let n=/\.mca$/i.test(e.name)?Vi(t,e.name,e.min,e.max):ni(t,e.name.replace(/\.[^.]+$/,""));return n.metadata.sourceHash=await dn(t),di(n)}if(r==="resourceArchive")return Gl(e.bytes,e.name);if(r==="resourceLibrary"){"expectedRevision"in e&&B.guard(e);let t=Fr(e.files);return t.addSaved(J.saved),Or=e.files,J=t,B.changed(),de()}if(r==="resources"){for(let t of e.files)J.addZip(new Uint8Array(t.bytes),t.name);return de()}if(r==="assets")return J.addSaved(e.pack),de();if(r==="screenBoxSelection")return B.guard(e),gl(fe(),{...e,isolateKeys:Q?.contextVisible?null:re});if(r==="prepareConstruction"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u63D0\u6848\u9884\u89C8");let t=On(R,J),n=new Set(t.map(y=>y.id)),i=e.type==="mesh"?ul(R,e.config,n):e.type==="terrain"?Ya(R,e.config):e.type==="feature"?rr(R,{...e.config,available:[...n]}):e.type==="designer"?so(R,e.config,n,new Map(t.map(y=>[y.id,y]))):e.config.editGuideId?cr(R,e.config,n):Bt(R,e.config,n),s=new Map,o=new Map,a=[],c=new Map,l={place:0,replace:0,remove:0,cut:0,fill:0},u=new Ir,h=new $t(R.design);e.type==="geometry"&&e.config.guidesOnly&&!e.config.editGuideId&&(i.operations=[]);for(let y of new Map(i.operations.map(b=>[L(...b.pos),b])).values()){let b=L(...y.pos),_=R.at(y.pos);if(JSON.stringify(_?R.palette[_.state]:null)===JSON.stringify(y.state||null)&&(y.nbt===void 0||JSON.stringify(_?.nbt||null)===JSON.stringify(y.nbt||null)))continue;let v=h.at(y.pos);try{if(v)throw Error("\u5BF9\u8C61\u6216\u96C6\u5408\u5DF2\u9501\u5B9A\uFF1A"+v.name);R.allowed(y.pos,e.policy||{})}catch(M){u.add(y.pos,M.message,tc(R,y.pos,v))}if(y.state){let M=JSON.stringify(y.state);c.has(M)||(c.set(M,a.length),a.push(y.state)),s.set(b,{pos:y.pos,state:c.get(M)}),o.delete(b),_?l.replace++:l.place++,De(y.state.Name)==="ground"&&!_&&l.fill++}else if(s.delete(b),_){let M=JSON.stringify(R.palette[_.state]);c.has(M)||(c.set(M,a.length),a.push(R.palette[_.state])),o.set(b,{pos:y.pos,state:c.get(M)}),l.remove++,De(R.palette[_.state].Name)==="ground"&&l.cut++}}let d={cells:s,overlay:new Map,palette:a},f=qe(d,J),p=qe({cells:o,overlay:new Map,palette:a},J),m={};for(let y of f.buckets)y.texture&&(m[y.texture]=J.texture(y.texture));let g=crypto.randomUUID();return qt={id:g,revision:B.revision,workspaceId:B.workspaceId,plan:i,config:e.config,type:e.type},{id:g,revision:B.revision,workspaceId:B.workspaceId,guide:i.guide,guideGroups:i.guideGroups||null,counts:l,regeneration:i.regeneration||null,componentUpdate:i.componentUpdate||null,materialChange:i.materialChange||null,arraySpacing:i.arraySpacing||null,pathArray:i.pathArray?{...i.pathArray,placements:void 0,count:i.pathArray.placements.length}:null,supports:i.supports||null,surfaceFit:i.surfaceFit||null,warnings:i.warnings,usedRoles:i.usedRoles,meshStats:i.meshStats||null,scope:i.scope||null,closure:i.closure||null,overlap:i.overlap?{...i.overlap,allPositions:void 0}:null,blocked:i.blocked||null,conflicts:u.conflicts,conflictSummary:u.summary(),buckets:f.buckets,removedBuckets:p.buckets,textures:m,triangles:f.triangles}}if(r==="cancelConstruction"){let t=qt?.id===e.id;return t&&(qt=null),{cancelled:t}}if(r==="commitConstruction"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u63D0\u6848\u9884\u89C8");let t=qt;if(t?.plan.blocked)throw Error(t.plan.blocked.message);if(!t||t.id!==e.id)throw Error("\u9884\u89C8\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u786E\u8BA4");if(t.revision!==B.revision||t.workspaceId!==B.workspaceId)throw Error("\u573A\u666F\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u9884\u89C8");let n=R.undo.at(-1),i=structuredClone(R.design),s=or(R,t.plan.operations),o=t.plan.materializedStroke?or(R,t.plan.materializedStroke.operations):null;if(R.operations(t.plan.operations,e.policy||{}),R.undo.at(-1)===n&&(R.undo.push({overlay:R.overlay,size:[...R.size],design:i}),R.redo=[]),t.plan.design&&(R.design=structuredClone(t.plan.design)),R.design.guides||=[],t.plan.guide.length&&!t.plan.design&&R.design.guides.push({id:t.id,name:e.name||"\u8F85\u52A9\u56FE\u5F62",points:t.plan.guide,...t.plan.guideGroups?{paths:t.plan.guideGroups}:{},recipe:structuredClone(t.config),revision:0}),!t.plan.design&&["feature","geometry"].includes(t.type)&&!t.config.guidesOnly){let a=ar(R,s,{type:t.type,config:t.config,guideId:t.id,name:e.name||"\u751F\u6210\u7279\u5F81"});a&&R.design.objects.push(a)}if(t.plan.materializedStroke){let a=t.plan.materializedStroke,c=ar(R,o,{type:"geometry",config:a.recipe,guideId:a.guideId,name:e.name||"\u6CBF\u66F2\u7EBF\u65B9\u5757"});c&&R.design.objects.push(c)}if(t.plan.newMeshObject){let a=ar(R,s,{type:"mesh",config:t.plan.newMeshObject,name:e.name||"\u6A21\u578B\u751F\u6210\u7ED3\u679C"});a&&R.design.objects.push(a)}return hn.changed(R),fn.changedCells(R),qt=null,B.changed(),de()}if(r==="detachGeneration"){let t=R.design.objects.find(n=>n.id===e.id);if(!t)throw Error("\u5BF9\u8C61\u4E0D\u5B58\u5728");if(ut(R.design,t))throw Error("\u5BF9\u8C61\u6216\u96C6\u5408\u5DF2\u9501\u5B9A");return R.undo.push({overlay:R.overlay,size:[...R.size],design:structuredClone(R.design)}),R.redo=[],t.generation={...t.generation,detached:!0},t.kind="voxel",B.changed(),de()}if(r==="summary")return de();if(r==="meshSourceGeometry"){(e.expectedRevision!==void 0||e.workspaceId)&&B.guard(e);let t=fe().design,n=ei(t,e.id);return{...zt(t).find(s=>s.id===e.id),coordinateSpace:"source-pivot",positions:_a(n)}}if(r==="viewIsolation"){if(typeof e.contextVisible=="boolean"){if(!Q)throw Error("\u8BF7\u5148\u8FDB\u5165\u5C40\u90E8\u89C6\u56FE");Q.contextVisible=e.contextVisible}else if(e.clear)re=null,Re=null,Q=null,ze=[];else if(e.pop){let t=ze.pop();Q=t||null,Re=t?.objectIds?.length?t.objectIds:null,re=t?Xt(R,t).keys:null}else{let t=ui(R,e,{allowLocked:!0});e.push&&Q&&ze.push(structuredClone(Q)),Q={objectIds:e.objectIds||[],keys:t.flatMap(n=>n.cells),selection:e.selection?{min:e.selection.min,max:e.selection.max}:null,includeNew:!!e.includeNew,contextVisible:!1},Re=Q.objectIds.length?Q.objectIds:null,re=Xt(R,Q).keys}return It++,{isolated:!!re,contextVisible:!!Q?.contextVisible,cells:re?.size||0,depth:re?ze.length+1:0}}if(r==="designInspect")return{...Kl(R,e),revision:B.revision,workspaceId:B.workspaceId};if(r==="constructionSurface"){let t=Fe(e.selection,{axes:[0,2]}),n=Pn(R),i=[];for(let s=e.min[0];s<=e.max[0];s++)for(let o=e.min[1];o<=e.max[1];o++){let a=n.get(s+4096*o);a?.ground!==null&&a?.ground!==void 0&&t([s,a.ground,o])&&i.push(a.ground)}return i.sort((s,o)=>s-o),{median:i.length?i[Math.floor(i.length/2)]:null}}if(r==="rename"){if(typeof e.name!="string"||!e.name.trim())throw Error("\u8BF7\u8F93\u5165\u5DE5\u7A0B\u540D\u79F0");return R.title=e.name.trim(),de()}if(r==="pasteCheck"){let t={place:0,replace:0,skip:0,locked:0},n=new $t(R.design);for(let i of pt(e.prefab,e.at,{turn:e.turn})){let s=!!R.at(i.pos);if(e.overlap==="empty"&&s||e.overlap==="replace"&&!s){t.skip++;continue}s?t.replace++:t.place++;try{if(n.at(i.pos))throw Error("\u9501\u5B9A");R.allowed(i.pos,{...e.policy,allowExisting:e.overlap==="empty"?e.policy?.allowExisting:!0})}catch{t.locked++}}return t}if(r==="copySelection")return e.expectedRevision!==void 0&&B.guard(e),_e(R,e.min,e.max,{keys:e.members,regions:e.regions});if(r==="selectionPreview"){e.expectedRevision!==void 0&&B.guard(e);let t;if(e.prefab){let s=Gt(e.prefab),o=new Le({...Oe(),size:s.size,palette:[],blocks:[]});for(let a of s.blocks){let c=o.state(a.state);o.cells.set(L(...a.pos),{pos:a.pos,state:c})}t={site:o,size:s.size,count:s.blocks.length,members:s.blocks.map(a=>a.pos)}}else t=zl(R,e.min,e.max,{keys:e.members,regions:e.regions});let n=qe(t.site,J,{geometryOnly:!!e.geometryOnly}),i={};for(let s of n.buckets)!e.geometryOnly&&s.texture&&(i[s.texture]=J.texture(s.texture));return{...n,textures:i,revision:B.revision,workspaceId:B.workspaceId,size:t.size,count:t.count,members:e.compactMembers?Fl(t.members):t.members}}if(r==="assetCatalogue")return On(R,J);if(r==="assetPreview"){let t=e.state,n=new Le({...Oe(),palette:[t],blocks:[{pos:[0,0,0],state:0}]}),i=qe(n,J,{excludeWholeKinetics:!0}),s=new fi().render(n,J,{enabled:!0,mode:"after",cut:4095,showExisting:!0}),o={...s.textures};for(let a of i.buckets)a.texture&&(o[a.texture]=J.texture(a.texture));return{...i,motions:s,textures:o,approximate:J.model(t).missing}}if(r==="studio"){if(e.expectedRevision!==void 0&&B.guard(e),ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u9884\u89C8");let t=structuredClone(ye(R)),n=R.overlay,i=R.undo.length,s=ye(R),o=e.policy||{allowTerrain:!1,allowExisting:!1},a=null;if(e.command==="build"&&vr(R,e.kind,e.params,o),e.command==="paste"&&(br(R,e.prefab,e.at,e,o),a={objectId:s.objects.at(-1).id}),e.command==="transform"&&xr(R,e,o),e.command==="prefabImport"&&Un(R,"prefabs.put",{prefab:{...e.prefab,id:crypto.randomUUID()}}),e.command==="prefabMeta"&&Un(R,"prefabs.put",{id:e.id,name:e.name,tags:e.tags}),e.command==="component"){let c=JSON.parse(He(Ze(new Uint8Array(e.bytes)))),l=Le.unpack(c.site),u=_e(l,[0,0,0],l.size.map(h=>h-1),{all:!0});u.name=l.title,_r(R,u,e.at,e,o),J.addSaved(c.assets||{})}if(e.command==="prefab"&&Un(R,"prefabs.put",{selection:{min:e.min,max:e.max,members:e.members,regions:e.regions},name:e.name||"\u65B0\u6784\u4EF6"}),e.command==="insert"){let c=s.prefabs.find(l=>l.id===e.id);if(!c)throw Error("\u627E\u4E0D\u5230\u6784\u4EF6");_r(R,c,e.at,e,o)}if(e.command==="object"){"name"in e&&mr(R,[{id:e.id,name:e.name}]);let c=s.objects.find(l=>l.id===e.id);if(!c)throw Error("\u627E\u4E0D\u5230\u5BF9\u8C61");for(let l of["hidden","locked"])l in e&&(c[l]=e[l])}if(e.command==="deleteSelection"){let c=_e(R,e.min,e.max,{keys:e.members,regions:e.regions}),l=new Set(c.blocks.map(u=>L(...u.pos.map((h,d)=>h+e.min[d]))));R.operations(c.blocks.map(u=>{let h=u.pos.map((d,f)=>d+e.min[f]);return{type:"erase",min:h,max:h,reason:"\u5220\u9664\u9009\u62E9"}}),o),s.objects=s.objects.filter(u=>!u.cells?.length||!u.cells.every(h=>l.has(h)))}if(e.command==="register"){let c=_e(R,e.min,e.max,{keys:e.members,regions:e.regions});s.objects.push({id:crypto.randomUUID(),name:e.name||"\u5BF9\u8C61",min:e.min,max:e.max,cells:c.blocks.map(l=>L(...l.pos.map((u,h)=>u+e.min[h]))),kind:"selection"})}if(e.command==="animation"&&(s.animations[e.id]=e.animation),e.command==="camera"&&s.cameras.push(e.camera),e.command==="lighting"&&(s.lighting=e.value),e.command==="crop"){let c=El(R,e.min,e.max);return di(c)}if(e.command==="merge"){let c=ni(new Uint8Array(e.bytes),e.name);if(c.entities?.length)throw Error("\u5E26\u5B9E\u4F53\u84DD\u56FE\u8BF7\u5355\u72EC\u6253\u5F00\uFF0C\u5408\u5E76\u4E0D\u4F1A\u9690\u5F0F\u4E22\u5F03\u5B9E\u4F53");let l=c.blocks.map(u=>({type:"set",pos:u.pos.map((h,d)=>h+e.at[d]),state:c.palette[u.state],nbt:u.nbt,reason:"\u5408\u5E76 "+e.name}));if(e.applyAir&&c.metadata?.placementMask)for(let u of Bs(c.metadata.placementMask))l.push({type:"erase",min:u.map((h,d)=>h+e.at[d]),max:u.map((h,d)=>h+e.at[d]),reason:"\u84DD\u56FE\u663E\u5F0F\u7A7A\u6C14"});R.operations(l,o)}if(e.command==="demo"){for(let[c,l]of["house","windmill"].entries()){let u=Sl(R,13,11,s.objects);vr(R,l,{at:u.at,width:13,depth:11,height:5,name:c?"\u98CE\u8F66\u5EAD\u9662\u4F4F\u5B85":"\u6CBF\u5761\u77F3\u6728\u4F4F\u5B85",state:{Name:c?"minecraft:white_concrete":"minecraft:stone_bricks"},roof:{Name:c?"minecraft:cherry_planks":"minecraft:dark_oak_planks"}},o)}R.title="\u771F\u5B9E\u573A\u5730 \xB7 \u53CC\u4F4F\u5B85\u8BBE\u8BA1"}return R.overlay===n&&R.undo.length===i&&JSON.stringify(t)!==JSON.stringify(R.design)&&(R.undo.push({overlay:R.overlay,size:[...R.size],design:t}),R.redo=[]),hn.changed(R),fn.changedCells(R),{...de(),...a?{selectionResult:a}:{}}}if(r==="mesh"){let t=fe(),n=kr(),i=qe(t,n,e),s=[...new Set(i.buckets.map(a=>a.texture).filter(Boolean))],o=Object.fromEntries(s.map(a=>[a,n.texture(a)]));return{...i,textures:o}}if(r==="meshChunks")return Q&&(re=Xt(fe(),Q).keys),Re&&(fe().design.objects.filter(n=>Re.includes(n.id)).length?re=Xt(fe(),Q||{objectIds:Re}).keys:(re=null,Re=null,Q=null,ze=[],It++)),hn.render(fe(),kr(),{...e,isolateKeys:Q?.contextVisible?null:re,isolationVersion:It,hidden:fe().design.objects.filter(t=>Ht(fe().design,t)).map(t=>({min:t.min,max:t.max,cells:t.cells})),animated:Object.entries(e.excludeWholeKinetics?fe().design.animations:{}).filter(([t,n])=>n.min&&n.max&&_e(fe(),n.min,n.max).blocks.some(i=>/^create:(windmill_bearing|mechanical_bearing|white_sail|black_sail)$/.test(i.state.Name))).filter(([t,n])=>n.min&&n.max).map(([t,n])=>({min:n.min,max:n.max,cells:fe().design.objects.find(i=>i.id===t)?.cells}))});if(r==="createScene"){let t=fe(),n=kr(),i=fn.render(t,n,e);if((i.reset||Ic!==t||Rc!==n.version)&&(Ic=t,Rc=n.version,po.clear(),Ur.clear()),e.enabled&&e.showExisting!==!1&&e.mode!=="removed")for(let s of uo(t,n)){if(s.position[1]>e.cut)continue;let o="decoration:"+s.id;if(!po.has(o)){let a={cells:new Map([[0,{pos:[0,0,0],state:0}]]),overlay:new Map,palette:[s.state]},c=qe(a,n);for(let l of c.buckets)for(let u=0;u<l.positions.length;u++)l.positions[u]-=.5;i.definitions[o]=c,po.add(o);for(let l of c.buckets)l.texture&&(i.textures[l.texture]=n.texture(l.texture))}i.instances.push({...s,model:o,kind:"decoration"})}if(e.mode!=="before"&&(i.instances=i.instances.filter(s=>!t.design.objects.some(o=>fl(t.design,o,s.owner||s.position.map(Math.floor))))),i.overrides={},i.visuals=[],e.enabled&&e.mode!=="before")for(let[s,o]of Object.entries(t.design.animations)){if(!o.min||!o.max||t.design.objects.some(u=>u.id===s&&Ht(t.design,u))||!_e(t,o.min,o.max).blocks.some(u=>/^create:(windmill_bearing|mechanical_bearing|white_sail|black_sail)$/.test(u.state.Name)))continue;let c="visual:"+s,l=JSON.stringify(o);if(Ur.get(c)?.overlay!==t.overlay||Ur.get(c)?.signature!==l){let u=_e(t,o.min,o.max),h=new Le({...Oe(),size:u.size,palette:[],blocks:[]});for(let f of u.blocks){let p=h.state(f.state);h.cells.set(L(...f.pos),{pos:f.pos,state:p})}let d=qe(h,n);for(let f of d.buckets)for(let p=0;p<f.positions.length;p++)f.positions[p]+=o.min[p%3]-o.center[p%3];i.definitions[c]=d,Ur.set(c,{overlay:t.overlay,signature:l});for(let f of d.buckets)f.texture&&(i.textures[f.texture]=n.texture(f.texture))}i.instances.push({id:s,model:c,position:o.center,axis:o.axis||"y",rpm:16,savedAngle:0,kind:"visual",state:{Name:"craftstudio:visual"},owner:o.min})}return re&&!Q?.contextVisible&&(i.instances=i.instances.filter(s=>re.has(L(...s.owner||s.position.map(Math.floor))))),i}if(r==="inspect")return fe().inspect(e.pos);if(r==="search"){let t=J.catalogue(e.query||""),n=fe().palette.filter(s=>(s.Name+" "+Object.values(s.Properties||{}).join(" ")).toLowerCase().includes((e.query||"").toLowerCase())).map(s=>({id:s.Name,label:s.Name.split(":")[1],state:s})),i=new Map;for(let s of[...n,...t])i.has(s.id)||i.set(s.id,s);return[...i.values()].slice(e.offset||0,(e.offset||0)+80)}if(r==="edit"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u9884\u89C8");return R.operations(e.operations,e.policy),hn.changed(R),fn.changedCells(R),de()}if(r==="brush"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u9884\u89C8");e.mode==="paint"&&!Dr&&(Dr=new Map(On(R,J).map(s=>[s.id,s])));let t=0,n=e;if(Q?.includeNew){let s=Xt(R,Q),o=e.points.filter(a=>{let c=L(...a),l=(!s.bounds||a.every((u,h)=>u>=s.bounds.min[h]&&u<=s.bounds.max[h]))&&!s.excluded.has(c)&&(!R.at(a)||s.keys.has(c));return l||t++,l});n={...e,points:o}}let i=kn(R,n,Dr||new Map);return i.filtered+=t,R.operations(i.operations,e.policy),hn.changed(R),fn.changedCells(R),B.changed(),{...de(),filtered:i.filtered,toolWarnings:i.warnings}}if(r==="beginStroke"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u9884\u89C8");R.beginStroke(),Dr=null;let t=e.anchor?R.at(e.anchor):null;return{from:t?R.palette[t.state].Name:null}}if(r==="endStroke")return R.endStroke(),!0;if(r==="undo"||r==="redo"){if(ne){if(r==="undo")return yi("cancel",{});throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u9884\u89C8")}return st=null,ue=null,R.restore(r),hn.changed(R),fn.changedCells(R),de()}if(r==="origin"){if(e.origin?.length!==3||e.origin.some(t=>!Number.isInteger(t)))throw Error("\u9700\u8981\u4E09\u4E2A\u6574\u6570\u4E16\u754C\u539F\u70B9\u5750\u6807");return R.origin=e.origin,R.originConfirmed=!!e.confirmed,de()}if(r==="protect")return R.protected.push({min:e.min,max:e.max,name:e.name||"\u4FDD\u7559\u533A"}),de();if(r==="unprotect")return R.protected.splice(e.index,1),de();if(r==="preview"){let t=R.fork(),n=[],i=()=>{n.length&&t.operations(n.splice(0),{allowTerrain:!0,allowExisting:!0})};for(let s of e.operations)s.type==="build"?(i(),vr(t,s.kind,s.params,{allowTerrain:!0,allowExisting:!0})):["insertPrefab","restyle"].includes(s.type)?(i(),t.operations(Al(t,[s]),{allowTerrain:!0,allowExisting:!0})):n.push(s);return i(),st=Bl(R,t),ne=t,ue={id:crypto.randomUUID(),revision:B.revision,workspaceId:B.workspaceId,changes:Vl(R,st)},de()}if(r==="reference"){let t=xc(e.html),n=bc(t,R);J.addSaved(_c(t)),R.origin=t.scene.origin,R.originConfirmed=!0,R.base.metadata.originEvidence=t.scene.origin_evidence;let i=await mi("preview",{operations:n});return ne.title=t.scene.title,{...i,name:t.scene.title,reference:{title:t.scene.title,counts:t.scene.change_counts,notes:t.scene.notes,originEvidence:t.scene.origin_evidence,spec:t.scene.spec}}}if(r==="accept"){if(!ne||!st||!ue)throw Error("\u6CA1\u6709\u5F85\u91C7\u7528\u7684\u65B9\u6848");if(e.proposalId&&e.proposalId!==ue.id)throw Error("\u63D0\u6848\u5DF2\u88AB\u66FF\u6362\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6");B.guard({expectedRevision:ue.revision,workspaceId:ue.workspaceId});let t=Hl(R,ne,st,e.policy);return B.commit(t),ne=null,st=null,ue=null,de()}if(r==="cancel"){if(e.proposalId&&e.proposalId!==ue?.id)throw Error("\u63D0\u6848\u5DF2\u88AB\u66FF\u6362\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6");return ne=null,st=null,ue=null,de()}if(r==="platform"){let t=R.platform(e.min,e.max,e.y,e.state,e.spacing);return{...await mi("preview",{operations:t.operations}),platformDepth:t.deepest}}if(r==="diff")return fe().diff();if(r==="heightmap")return R.heightmap(null,1/0);if(r==="buildProject"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u65B9\u6848");if(!R.originConfirmed)throw Error("\u8BF7\u5148\u786E\u8BA4\u4E16\u754C\u539F\u70B9");return wr(R,"patch").project}if(r==="prefabPackage"){let t=_e(R,e.min,e.max,{keys:e.members,regions:e.regions}),n=new Le({...Oe(),name:e.name||t.name,size:t.size});return _r(n,t,[0,0,0],{},{}),vt(Ae(JSON.stringify({liteSchema:1,site:n.pack(),assets:J.bundle(n.palette),savedAt:new Date().toISOString()})),{mtime:0})}if(r==="sponge"){if(e.expectedRevision!==void 0&&B.guard(e),ne)throw Error("\u8BF7\u5148\u91C7\u7528\u9884\u89C8");return pc(wr(R,"additions").project)}if(r==="package"){if(e.expectedRevision!==void 0&&B.guard(e),ne)throw Error("\u8BF7\u5148\u91C7\u7528\u9884\u89C8\u518D\u4FDD\u5B58\u6216\u5BFC\u51FA");e.preserveTitle||(R.title=e.title||R.title);let t=R.pack();return e.preserveTitle&&e.title&&(t.title=e.title),{liteSchema:1,site:t,assets:Lr(),savedAt:new Date().toISOString()}}if(r==="workspaceAssets")return Lr();if(r==="workspaceCheckpoint")return await gi(),Nc.capture(R,{...e,workspaceId:B.workspaceId,revision:B.revision,baseKey:ot});if(r==="baselineReference")return await gi(),{baseKey:ot,...e.cachedKey!==ot?{baseline:jt}:{},revision:B.revision,workspaceId:B.workspaceId};if(r==="draftAttachments"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u63D0\u6848");B.guard(e);let t=Lr();return Ct||(Ct=vt(Ae(JSON.stringify(t)),{level:1,mtime:0}),Bn="assets:"+await dn(Ct)),{workspaceId:B.workspaceId,revision:B.revision,history:Os(R),saveForm:Er(e.saveForm),assetKey:Bn,...e.cachedAssetKey===Bn?{}:{assetBytes:Ct}}}if(r==="draft"){if(ne)throw Error("\u8BF7\u5148\u91C7\u7528\u9884\u89C8");R.title=e.title||R.title,await gi();let t=Lr();Ct||(Ct=vt(Ae(JSON.stringify(t)),{level:1,mtime:0}),Bn="assets:"+await dn(Ct));let{base:n,...i}=R.pack();return i.history=Os(R),{baseKey:ot,baseline:jt,assetKey:Bn,assetBytes:Ct,payload:vt(Ae(JSON.stringify({liteSchema:1,site:i,saveForm:Er(e.saveForm)})),{level:1,mtime:0})}}if(r==="resume"){let t=JSON.parse(He(Ze(new Uint8Array(e.baseline)))),n=JSON.parse(He(Ze(new Uint8Array(e.bytes))));return n.site.base=t,e.assetBytes&&(n.assets=JSON.parse(He(Ze(new Uint8Array(e.assetBytes))))),pi(n)}if(r==="compressed"){let t=await mi("package",e);return vt(Ae(JSON.stringify(t)),{mtime:0})}if(r==="load")return pi(e.package);if(r==="context"){let t=R.summary(),n=R.diff();return{schema:"craftstudio-request/1",comparison:Se.describe(B.workspaceId),interface:B.execute({method:"workspace.describe"}).value,request:e.prompt,site:{name:t.name,size:t.size,worldOrigin:t.origin,originConfirmed:t.originConfirmed,sourceBlocks:t.sourceBlocks,protected:t.protected,sourceHash:R.sourceHash},terrain:R.heightmap(e.focus||null),rules:["\u57FA\u4E8E\u771F\u5B9E\u573A\u5730\uFF0C\u4E0D\u751F\u6210\u53C2\u8003\u5C71\u5761","\u9ED8\u8BA4\u4E0D\u5F97\u6539\u52A8\u539F\u5730\u5F62\u3001\u6CB3\u6C34\u3001\u5DF2\u6709\u5EFA\u7B51\u548C\u4FDD\u7559\u533A","\u6240\u6709\u64CD\u4F5C\u4F7F\u7528\u5C40\u90E8\u6574\u6570\u5750\u6807\uFF1Bterrain \u662F\u539F\u59CB\u6587\u4EF6\u7684\u771F\u5B9E\u9AD8\u5EA6\u6570\u636E\uFF0Cnull \u4E0D\u5F97\u5F53\u4F5C\u5E73\u5730","stride>1 \u7684\u5730\u5F62\u4EC5\u4E3A\u6982\u89C8\uFF0C\u4E0D\u80FD\u63A8\u65AD\u4E2D\u95F4\u683C\u7684\u51C6\u786E\u9AD8\u5EA6","\u8F93\u51FA JSON {operations:[{type:set/fill/erase/replace,...}]}","\u8C03\u8272\u677F\u662F\u5DF2\u6709\u6750\u6599\u53C2\u8003\uFF0C\u4E0D\u9650\u5236\u65B0\u65B9\u5757 ID\uFF1B\u672A\u77E5\u6A21\u578B\u53EF\u4EE5\u540E\u8865","\u751F\u6210\u5668\u90FD\u662F\u53EF\u9009\u5DE5\u5177\uFF0C\u53EF\u76F4\u63A5\u63D0\u4EA4\u4EFB\u610F set/fill/erase \u64CD\u4F5C"],objects:ye(R).objects,prefabs:ye(R).prefabs.map(({blocks:i,...s})=>s),semanticOperations:["build(kind: house/windmill/wall/roof/stairs/arch/path,params:{at,width,depth,height,state,roof})","insertPrefab(id,at,turn,mirror,count,step)","restyle(id,from,state)"],palette:t.palette,changes:n,focus:e.focus?R.inspect(e.focus):null}}if(r==="bridgeProject"){let t=await yi("export",{...e,kind:e.kind||"additions"});return{project:ni(t.bytes||t,"CraftStudio build"),offsetWorld:t.offsetWorld||null,offsetLocal:t.offsetLocal||[0,0,0]}}if(r==="deliveryReport"||r==="deliveryArchive"){if(B.guard(e),ne)throw Error("\u8BF7\u5148\u91C7\u7528\u6216\u53D6\u6D88\u63D0\u6848\u9884\u89C8");return r==="deliveryReport"?Nl(R,e):Dl(e)}if(r==="export"){if(e.includeEntities&&!["selection","full"].includes(e.kind))throw Error("\u5C40\u90E8\u5B9E\u4F53\u4EC5\u652F\u6301\u9009\u533A\u8303\u56F4");if(e.expectedRevision!==void 0&&B.guard(e),ne)throw Error("\u8BF7\u5148\u91C7\u7528\u9884\u89C8");if(e.kind==="full")return Vs(R.project());let t;if(e.kind==="selection"){let{min:s,max:o,members:a,regions:c}=e.selection||{},l=Ln(R,s,o,{keys:a,regions:c});t=ro(R,l,{min:s,max:o},{includeEntities:e.includeEntities})}else t=wr(R,e.kind);let{project:n,...i}=t;return{bytes:Vs(n),...i,size:n.size,blocks:n.blocks.length,materials:Pl(n)}}throw Error("\u672A\u77E5\u524D\u7AEF\u4EFB\u52A1 "+r)}var Ip=new Sr({execute:mi,postMessage:(r,e)=>self.postMessage(r,e)});self.onmessage=r=>Ip.handle(r.data);})();
/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
/*!
The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
