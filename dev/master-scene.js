// MASTER SCENE (Great Pyramid) — hand-tuned reference for all 7 Cat Utopia wonder scenes.
// Composition rules it demonstrates: one horizon line (HZ=50); far layer's bottom = HZ;
// every object's base sits on ground rows (>= HZ) with a contact/cast shadow to the right;
// light from upper-left (sun/moon at 22,13): lit left faces, shaded right faces;
// no dark outlines on scenery (only the cats are outlined, so they pop);
// ground in 3 depth bands with dither seams; sparse speckles; night = palette swap only.
window.drawMasterScene = function(night){
const W=160,H=80,HZ=50; const c=document.createElement('canvas'); c.width=W;c.height=H; const g=c.getContext('2d');
const px=(x,y,col)=>{if(x<0||y<0||x>=W||y>=H)return; g.fillStyle=col; g.fillRect(x|0,y|0,1,1);};
const hash=(x,y)=>{let h=(x*374761393+y*668265263)^0x5bd1e995; h=(h^(h>>>13))*1274126177; return ((h^(h>>>16))>>>0)/4294967295;};
const D={sky:['#7EC4E6','#94D0EC','#ACDCF0','#C6E7F1','#E2F1EA'], sun:'#FFE58A', sunC:'#FFF6C8', cloud:'#FFFFFF', cloudS:'#DDEFF6',
 far:'#E9CF98', farHi:'#F3DFB2', g1:'#E6C283', g2:'#DFB46E', g3:'#D6A85E', speck:'#C8964F', speckHi:'#F0D6A0', shadow:'#C4914C',
 pyLit:'#F3DCA2', pyMid:'#E3C387', pyShade:'#C99B5C', pyCourse:'#D9B777', trunk:'#8A5A34', trunkHi:'#A8713F', leaf:'#5DA84E', leafHi:'#7CC262', leafDk:'#3F7F38'};
const N={sky:['#141A3A','#1A2248','#222B57','#2C3563','#3A3F6A'], sun:'#E9ECFF', sunC:'#FFFFFF', cloud:'#3B4574', cloudS:'#2E3762',
 far:'#4A4466', farHi:'#5A5378', g1:'#4E4760', g2:'#473F57', g3:'#40384F', speck:'#352E43', speckHi:'#5C5470', shadow:'#2F2940',
 pyLit:'#7A7090', pyMid:'#655C7C', pyShade:'#4A4262', pyCourse:'#5E5577', trunk:'#3A2E3A', trunkHi:'#4A3A48', leaf:'#2F4A45', leafHi:'#3D5E55', leafDk:'#233833'};
const P=night?N:D;
// 1 sky: 5 bands with 1-row checker dither between bands
const bands=[0,12,24,34,43,HZ];
for(let b=0;b<5;b++) for(let y=bands[b];y<bands[b+1];y++) for(let x=0;x<W;x++){ let col=P.sky[b]; if(y===bands[b+1]-1 && b<4 && (x+y)%2===0) col=P.sky[b+1]; px(x,y,col);}
if(night) for(let i=0;i<40;i++){const x=(hash(i,7)*W)|0,y=(hash(i,9)*40)|0; px(x,y,hash(i,3)>.7?'#FFFFFF':'#AEB6E8');}
// 2 sun / moon upper-left (the light source)
const sx=22,sy=13; for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++){const d=x*x+y*y; if(d<=36){ if(night && (x+2)*(x+2)+(y-1)*(y-1)<=20) continue; px(sx+x,sy+y, d<=12?P.sunC:P.sun);}}
// 3 clouds: rounded blobs, flat shaded bottom
const cloud=(cx,cy,w)=>{ for(let x=0;x<w;x++){ const t=Math.sin(Math.PI*x/(w-1)); const top=Math.round(3-3*t) + (x%5===2?-1:0); for(let y=top;y<=4;y++) px(cx+x,cy+y, y===4?P.cloudS:P.cloud);} };
cloud(58,10,18); cloud(112,18,13);
// 4 far layer: smooth ridge whose bottom is exactly the horizon
for(let x=0;x<W;x++){ const r=Math.round(HZ-4-2.2*Math.sin(x/17)-1.6*Math.sin(x/7.3+1)); for(let y=r;y<HZ;y++) px(x,y, y===r?P.farHi:P.far); }
// 5 ground: 3 depth bands, dither seams, speckles denser in front
for(let y=HZ;y<H;y++) for(let x=0;x<W;x++){ let col = y<58?P.g1: y<68?P.g2:P.g3; if((y===57||y===67)&&(x+y)%2===0) col = y===57?P.g2:P.g3; const dens = y<58?.006:y<68?.015:.03; const h=hash(x,y); if(h<dens) col=P.speck; else if(h>1-dens*.6) col=P.speckHi; px(x,y,col); }
for(let i=0;i<14;i++){ const x=(hash(i,21)*150)|0, y=62+((hash(i,22)*16)|0), w=3+((hash(i,23)*4)|0); for(let k=0;k<w;k++) px(x+k,y,P.speckHi); }
// 6 wonder: base ON the ground, lit left face / shaded right face, masonry courses, cast shadow right
const pyramid=(cx,baseY,h)=>{ const apex=baseY-h;
  const bw=Math.round(h*1.05); for(let y=baseY-1;y<=baseY+1;y++){ for(let x=cx+Math.round((y-apex)*1.05)-1; x<=cx+bw+Math.round(h*0.45)-(y-baseY+1)*3; x++) px(x,y,P.shadow);}
  for(let y=apex;y<=baseY;y++){ const hw=Math.round((y-apex)*1.05); for(let x=cx-hw;x<=cx+hw;x++){ let col = x<cx?P.pyLit: x===cx?P.pyMid: P.pyShade; if(x<cx && (y-apex)%3===0 && y>apex+1) col=P.pyCourse; if(x<cx && x===cx-hw) col=P.pyMid; px(x,y,col);} }
};
pyramid(52,54,17);   // farther = base slightly higher, but still on the ground
pyramid(98,58,33);
// 7 prop: planted on the ground with a contact shadow
const palm=(bx,by)=>{ for(let x=-4;x<=4;x++) px(bx+x+1,by+1,P.shadow); for(let i=0;i<18;i++){ const x=bx+Math.round(Math.sin(i/9)*3), y=by-i; px(x,y,i%3===0?P.trunk:P.trunkHi); px(x+1,y,P.trunk);} const tx=bx+Math.round(Math.sin(17/9)*3), ty=by-18;
  const frond=(dx,dy,len)=>{ for(let k=1;k<=len;k++){ const x=tx+Math.round(dx*k), y=ty+Math.round(dy*k+0.08*k*k); px(x,y,P.leaf); px(x,y+1,P.leafDk); if(k<len-1) px(x,y-1,P.leafHi);} };
  frond(1,-0.35,8); frond(-1,-0.35,8); frond(0.9,0.25,7); frond(-0.9,0.25,7); frond(0.3,-0.9,4); };
palm(22,64);
// 8 foreground pebbles (drawn behind the cats)
for(let i=0;i<10;i++){ const x=(hash(i,31)*156)|0, y=70+((hash(i,32)*8)|0); px(x,y,P.speck); px(x+1,y,P.speck); px(x,y-1,P.speckHi); }
return c; };
