(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.GwentTabletopPhysics=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rows=['close','ranged','siege'];
  function territories(width,height,counts={}){
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return [];
    const gap=8,band=18,half=Math.max(0,(height-band-gap)/2),out=[];
    for(const [pid,y] of [['p2',0],['p1',half+band+gap]]){
      const weights=rows.map(r=>1+Math.min(2,Math.sqrt(Math.max(0,counts[`${pid}:${r}`]||0)))*.22);
      const total=weights.reduce((a,b)=>a+b,0),usable=Math.max(0,width-gap*2);let x=0;
      rows.forEach((row,i)=>{const w=usable*weights[i]/total;out.push({pid,row,x,y,width:w,height:half});x+=w+gap;});
    }
    return out;
  }
  function pack(count,width,height){
    if(!Number.isInteger(count)||count<=0||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return {width:0,height:0,step:0,rowStep:0,positions:[]};
    const rowCount=Math.max(1,Math.ceil(count/Math.max(1,Math.floor(width/24))));
    const cardH=Math.min(height,Math.max(.1,Math.min(196,height-6,(width-2)/(16.1/30.4)+2,height/(1+.42*(rowCount-1)))));
    const cardW=Math.min(width,(cardH-2)*(16.1/30.4)+2);
    const cols=Math.ceil(count/rowCount),step=cols>1?Math.max(0,Math.min(cardW*.87+3,(width-cardW-6)/(cols-1))):0;
    const rowStep=rowCount>1?Math.max(0,(height-cardH-4)/(rowCount-1)):0;
    const positions=Array.from({length:count},(_,i)=>{
      const col=i%cols,line=Math.floor(i/cols),onLine=Math.min(cols,count-line*cols);
      return {x:(width-cardW-(onLine-1)*step)/2+col*step,y:clamp((height-cardH-(rowCount-1)*rowStep)/2+line*rowStep,0,height-cardH),angle:((i*7+3)%9-4)*.42};
    });
    return {width:cardW,height:cardH,step,rowStep,positions};
  }
  function bound(body){
    const x=clamp(body.x,0,Math.max(0,body.railWidth-body.width)),y=clamp(body.y,0,Math.max(0,body.railHeight-body.height));
    if(x!==body.x)body.vx=0;if(y!==body.y)body.vy=0;body.x=x;body.y=y;
  }
  // Deliberate overlap remains. Contact resolves minimum exposure rectangles,
  // without a spring pulling the entire table back into a rigid composition.
  function step(bodies,dt,pinned=null){
    dt=clamp(Number(dt)||0,0,.032);let contacts=0,energy=0;
    for(const b of bodies){
      if(b.iid!==pinned){b.x+=(b.vx||0)*dt;b.y+=(b.vy||0)*dt;const drag=Math.exp(-13*dt);b.vx=(b.vx||0)*drag;b.vy=(b.vy||0)*drag;}
      b.lift=(b.lift||0)*Math.exp(-18*dt);bound(b);
    }
    for(let pass=0;pass<3;pass++)for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j];if(a.zoneKey!==b.zoneKey)continue;
      const dx=(b.x+b.width/2)-(a.x+a.width/2),dy=(b.y+b.height/2)-(a.y+a.height/2);
      const minX=Math.min(a.minX||a.width*.44,b.minX||b.width*.44),minY=Math.min(a.minY||a.height*.38,b.minY||b.height*.38);
      const px=minX-Math.abs(dx),py=minY-Math.abs(dy);if(px<=.15||py<=.15)continue;
      contacts++;const af=a.iid===pinned,bf=b.iid===pinned;
      let axis=px/minX<=py/minY||Math.min(a.railHeight-a.height,b.railHeight-b.height)<minY?'x':'y';
      const room=(body,key,direction)=>direction<0?body[key]:Math.max(0,(key==='x'?body.railWidth-body.width:body.railHeight-body.height)-body[key]);
      const capacity=key=>{const direction=(key==='x'?dx:dy)<0?-1:1;return (af?0:room(a,key,-direction))+(bf?0:room(b,key,direction));};
      // A wall can block the shallowest separation axis. Use the other axis
      // rather than repeatedly pushing a neighbor into a clamped coordinate.
      const alternate=axis==='x'?'y':'x';
      if(capacity(axis)<.15&&capacity(alternate)>.15)axis=alternate;
      const overlap=axis==='x'?px:py,sign=(axis==='x'?dx:dy)<0?-1:1,correction=Math.min(12,overlap)*.62;
      if(!af)a[axis]-=correction*sign*(bf?1:.5);if(!bf)b[axis]+=correction*sign*(af?1:.5);
      if(pinned&&(af||bf)){const neighbor=af?b:a;neighbor.userPlaced=true;neighbor.lift=Math.max(neighbor.lift||0,Math.min(3,overlap*.2));}
      bound(a);bound(b);
    }
    for(const b of bodies){if(Math.abs(b.vx||0)<.8)b.vx=0;if(Math.abs(b.vy||0)<.8)b.vy=0;if((b.lift||0)<.04)b.lift=0;energy+=Math.abs(b.vx||0)+Math.abs(b.vy||0)+(b.lift||0)*12;}
    return {contacts,energy};
  }
  function pointInside(p,body){
    const angle=-(body.angle||0)*Math.PI/180,dx=p.x-(body.x+body.width/2),dy=p.y-(body.y+body.height/2);
    const x=dx*Math.cos(angle)-dy*Math.sin(angle),y=dx*Math.sin(angle)+dy*Math.cos(angle);
    return Math.abs(x)<=body.width/2&&Math.abs(y)<=body.height/2;
  }
  return Object.freeze({version:'tabletop.motion.1',territories,pack,step,bound,pointInside});
});
