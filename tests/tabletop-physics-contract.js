'use strict';
const assert=require('assert'),P=require('../src/tabletop-physics.js');
for(const [w,h] of [[820,235],[369,650],[640,192]]){
  const zones=P.territories(w,h,{'p1:close':12});assert.equal(zones.length,6);
  for(const z of zones)assert(z.x>=0&&z.y>=0&&z.x+z.width<=w+.01&&z.y+z.height<=h+.01);
  assert(zones.find(z=>z.pid==='p1'&&z.row==='close').width>zones.find(z=>z.pid==='p1'&&z.row==='siege').width);
  for(const n of [1,2,12,24]){
    const pack=P.pack(n,zones[3].width-10,zones[3].height-29);assert.equal(pack.positions.length,n);
    for(const p of pack.positions)assert(p.x>=0&&p.y>=0&&p.x+pack.width<=zones[3].width-10+.01&&p.y+pack.height<=zones[3].height-29+.01);
  }
}
assert.deepEqual(P.territories(NaN,20),[]);assert.equal(P.pack(0,100,80).positions.length,0);
for(const args of [[2,NaN,80],[Infinity,100,80],[2,100,Infinity],[2,-1,80]])assert.equal(P.pack(...args).positions.length,0);
const tiny=P.pack(3,1,2);for(const p of tiny.positions)assert(p.x>=0&&p.y>=0&&p.x+tiny.width<=1&&p.y+tiny.height<=2);
const make=(iid,x,zone='p1:close')=>({iid,zoneKey:zone,x,y:2,width:45,height:80,railWidth:240,railHeight:88,vx:0,vy:0,lift:0});
const held=make('a',100),neighbor=make('b',102),other=make('c',101,'p2:close');
const result=P.step([held,neighbor,other],1/60,'a');assert(result.contacts>0);assert.equal(held.x,100);assert(neighbor.x>102);assert(neighbor.userPlaced);assert(neighbor.lift>0);assert.equal(other.x,101);
const wallHeld={...make('wall-held',53),y:73,width:77,height:144,railWidth:130,railHeight:290};
const wallNeighbor={...wallHeld,iid:'wall-neighbor'};
P.step([wallHeld,wallNeighbor],1/60,'wall-held');
assert.equal(wallHeld.x,53);assert.equal(wallHeld.y,73);
assert(wallNeighbor.y>73,'contact at a horizontal wall must use available vertical space');
const free=make('free',80);free.vx=110;free.vy=-60;
for(let i=0;i<80;i++)P.step([free],1/60);
assert.equal(free.vx,0);assert.equal(free.vy,0);assert(free.x>80&&free.x+free.width<=240);assert(free.y>=0);
const collision=[make('one',100),make('two',100)];for(let i=0;i<90;i++)P.step(collision,1/60);
assert(Math.abs(collision[0].x-collision[1].x)>=19);const before=JSON.stringify(collision);P.step(collision,1/60);assert.equal(JSON.stringify(collision),before,'settled contact must remain idle');
const card={x:50,y:30,width:40,height:80,angle:12};assert(P.pointInside({x:70,y:70},card));assert(!P.pointInside({x:20,y:5},card));
console.log('tabletop-physics-contract: adaptive territories, sparse/dense bounds, pinned local contact, decay, idle and rotated hit regions passed');
