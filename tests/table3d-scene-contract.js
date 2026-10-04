'use strict';
// Shared painted-pixel oracles for the GPU integration gate. These deliberately
// reject blank/unchanged output; renderer flags alone cannot satisfy the gate.
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const fs=require('node:fs'),path=require('node:path');

function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
function decodePNG(input){
  const b=Buffer.from(input),signature=Buffer.from([137,80,78,71,13,10,26,10]);
  assert(b.subarray(0,8).equals(signature),'paint capture is not PNG');
  let offset=8,width=0,height=0,channels=0;const chunks=[];
  while(offset<b.length){
    const length=b.readUInt32BE(offset),type=b.toString('ascii',offset+4,offset+8),data=b.subarray(offset+8,offset+8+length);offset+=length+12;
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      assert.equal(data[8],8,'paint oracle requires an 8-bit screenshot');
      assert([2,6].includes(data[9]),'paint oracle requires RGB/RGBA screenshot');
      assert.equal(data[12],0,'interlaced screenshot is unsupported');channels=data[9]===6?4:3;
    }else if(type==='IDAT')chunks.push(data);else if(type==='IEND')break;
  }
  assert(width>0&&height>0&&channels&&chunks.length,'PNG lacks painted bounds');
  const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*channels,decoded=Buffer.alloc(stride*height);
  assert.equal(raw.length,(stride+1)*height,'PNG scanline count disagrees with dimensions');
  let source=0;
  for(let y=0;y<height;y++){
    const filter=raw[source++];assert(filter<=4,'invalid PNG scanline filter');
    for(let x=0;x<stride;x++){
      const a=x>=channels?decoded[y*stride+x-channels]:0,before=y?decoded[(y-1)*stride+x]:0,c=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;
      const predictor=filter===0?0:filter===1?a:filter===2?before:filter===3?Math.floor((a+before)/2):paeth(a,before,c);
      decoded[y*stride+x]=(raw[source++]+predictor)&255;
    }
  }
  const pixels=new Uint8Array(width*height*4);
  for(let i=0;i<width*height;i++){pixels[i*4]=decoded[i*channels];pixels[i*4+1]=decoded[i*channels+1];pixels[i*4+2]=decoded[i*channels+2];pixels[i*4+3]=channels===4?decoded[i*channels+3]:255;}
  return {width,height,pixels};
}
function regionBounds(image,rect){
  return {left:Math.max(0,Math.floor(rect?.x||0)),top:Math.max(0,Math.floor(rect?.y||0)),right:Math.min(image.width,Math.ceil((rect?.x||0)+(rect?.width??image.width))),bottom:Math.min(image.height,Math.ceil((rect?.y||0)+(rect?.height??image.height)))};
}
function pixelSummary(image,rect){
  const r=regionBounds(image,rect),colors=new Set();let count=0,visible=0,sum=0,sumSquared=0;
  for(let y=r.top;y<r.bottom;y++)for(let x=r.left;x<r.right;x++){
    const i=(y*image.width+x)*4,lum=(image.pixels[i]*.2126+image.pixels[i+1]*.7152+image.pixels[i+2]*.0722);count++;
    if(image.pixels[i+3]>8){visible++;sum+=lum;sumSquared+=lum*lum;colors.add((image.pixels[i]>>3)*1024+(image.pixels[i+1]>>3)*32+(image.pixels[i+2]>>3));}
  }
  const mean=visible?sum/visible:0;
  return {count,visible,visibleRatio:count?visible/count:0,mean,variance:visible?sumSquared/visible-mean*mean:0,colors:colors.size};
}
function pixelDifference(before,after,rect,exclude=[]){
  assert.equal(before.width,after.width,'pixel pair width changed');assert.equal(before.height,after.height,'pixel pair height changed');
  const r=regionBounds(before,rect);let count=0,changed=0,sum=0,brightened=0,darkened=0,xSum=0,ySum=0;
  for(let y=r.top;y<r.bottom;y++)for(let x=r.left;x<r.right;x++){
    if(exclude.some(e=>x>=e.x&&x<e.x+e.width&&y>=e.y&&y<e.y+e.height))continue;
    const i=(y*before.width+x)*4;if(before.pixels[i+3]<8||after.pixels[i+3]<8)continue;count++;
    const dr=after.pixels[i]-before.pixels[i],dg=after.pixels[i+1]-before.pixels[i+1],db=after.pixels[i+2]-before.pixels[i+2],delta=(Math.abs(dr)+Math.abs(dg)+Math.abs(db))/3;
    sum+=delta;if(delta>=3){changed++;xSum+=x;ySum+=y;const lum=dr*.2126+dg*.7152+db*.0722;if(lum>2)brightened++;if(lum< -2)darkened++;}
  }
  return {count,changed,changedRatio:count?changed/count:0,meanDelta:count?sum/count:0,brightened,darkened,centroid:changed?{x:xSum/changed,y:ySum/changed}:null};
}
function assertPainted(image){const summary=pixelSummary(image);assert(summary.visibleRatio>.95,'GPU canvas is mostly transparent');assert(summary.colors>24&&summary.variance>12,'GPU canvas is blank or flat');return summary;}
function assertChangedPixels(before,after,rect,options={}){
  const result=pixelDifference(before,after,rect,options.exclude||[]);
  assert(result.changed>=(options.minimumPixels??24)&&result.meanDelta>=(options.minimumMeanDelta??.03),'claimed light/shadow did not change painted pixels: '+JSON.stringify(result));return result;
}
module.exports={decodePNG,pixelSummary,pixelDifference,assertPainted,assertChangedPixels};

function encoded(width,height,pixels,type=6,filter=0){
  const channels=type===6?4:3,stride=width*channels,scan=Buffer.alloc((stride+1)*height);
  for(let y=0;y<height;y++){
    scan[y*(stride+1)]=filter;
    for(let x=0;x<stride;x++){
      const at=y*stride+x,current=pixels[at],left=x>=channels?pixels[at-channels]:0,up=y?pixels[at-stride]:0,upLeft=y&&x>=channels?pixels[at-stride-channels]:0;
      const predictor=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,upLeft);scan[y*(stride+1)+1+x]=(current-predictor)&255;
    }
  }
  const chunk=(name,data)=>{const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(name,4);data.copy(b,8);return b;};
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=type;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}
async function geometryContract(){
  // Import the exact production module, rather than duplicate its equations.
  // A data-module keeps this compatible with the repository's CommonJS tests.
  const source=fs.readFileSync(path.join(__dirname,'../src/table3d-math.js'),'utf8');
  const M=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const near=(a,b,message)=>assert(Math.abs(a-b)<1e-7,message||`${a} differs from ${b}`);
  for(const [value,expected] of [['none',0],['17deg',17],['.5turn',180],[Math.PI+'rad',180],['100grad',90]])near(M.angleDegrees(value),expected,'CSS angle unit '+value);
  assert.deepEqual(M.transform2D('none'),{scaleX:1,scaleY:1,angle:0});
  const rotation=M.transform2D('matrix(0, 2, -3, 0, 21, 9)');near(rotation.scaleX,2);near(rotation.scaleY,3);near(rotation.angle,90);
  const matrix3=M.transform2D('matrix3d(0,2,0,0,-3,0,0,0,0,0,1,0,21,9,0,1)');assert.deepEqual(matrix3,rotation);
  for(const viewport of [{x:9,y:17,width:852,height:393},{x:4,y:21,width:393,height:852}])for(const point of [{x:20,y:30},{x:viewport.x+viewport.width*.7,y:viewport.y+viewport.height*.3}]){
    const world=M.screenToWorld(point,viewport,19),screen=M.worldToScreen(world,viewport);near(world.y,19);near(screen.x,point.x,'screen/world table-plane x did not round trip');near(screen.y,point.y,'screen/world table-plane y did not round trip');
  }
  const quad=M.cornersAndBounds({x:100,y:50,width:30,height:60,angle:41});assert.equal(quad.corners.length,4);
  assert(M.pointInQuad({x:115,y:80},quad.corners),'mesh center is not pickable');assert(!M.pointInQuad({x:quad.x+1,y:quad.y+1},quad.corners),'ray proxy picked empty corner inside rotated bounding box');
  assert(!M.pointInQuad({x:1000,y:1000},quad.corners));
  const css={'width':'20px','height':'40px','box-sizing':'content-box','padding-left':'2px','padding-right':'2px','padding-top':'2px','padding-bottom':'2px','border-left-width':'1px','border-right-width':'1px','border-top-width':'1px','border-bottom-width':'1px','transform':'matrix(2,0,0,3,0,0)','scale':'2 1.5','rotate':'30deg','opacity':'.5','display':'block','visibility':'visible','z-index':'24'};
  const element={getBoundingClientRect:()=>({x:10,y:20,width:230,height:300}),offsetWidth:20,offsetHeight:40};
  const view={getComputedStyle:()=>({getPropertyValue:name=>css[name]||''})},geometry=M.elementGeometry(element,view);near(geometry.width,104);near(geometry.height,207);near(geometry.x,73);near(geometry.y,66.5);near(geometry.angle,30);near(geometry.opacity,.5);assert(geometry.visible);assert.equal(geometry.z,24);
  css.visibility='hidden';assert.equal(M.elementGeometry(element,view).visible,false,'hidden continuity embodiment still became a visible body');
  const P=require('../src/tabletop-physics.js');assert.equal(typeof P.tableTerritories,'function');
  function assertDepth(zones,width,height){
    assert.equal(zones.length,6);assert.deepEqual(zones.map(z=>`${z.pid}:${z.row}`),['p2:siege','p2:ranged','p2:close','p1:close','p1:ranged','p1:siege']);
    for(const z of zones){near(z.x,0);near(z.width,width);assert(z.height>0&&z.y>=0&&z.y+z.height<=height+1e-7,'semantic formation escaped the table');}
    for(let i=1;i<zones.length;i++)assert(zones[i].y>=zones[i-1].y+zones[i-1].height-1e-7,'front-to-back semantic groups overlap');
  }
  for(const [w,h] of [[852,246],[393,658],[1,1]]){
    const counts=Object.freeze({'p1:close':12,'p2:siege':2}),zones=P.tableTerritories(w,h,counts);assertDepth(zones,w,h);
    const occupied=zones.find(z=>z.pid==='p1'&&z.row==='close'),empty=zones.find(z=>z.pid==='p1'&&z.row==='ranged');assert(occupied.height>empty.height,'unused formations still reserve equal row depth');
    assertDepth(P.tableTerritories(w,h,{}),w,h);
  }
  for(const dimensions of [[0,100],[-1,100],[100,NaN],[Infinity,100]])assert.deepEqual(P.tableTerritories(...dimensions),[]);
  assert.throws(()=>assertDepth(P.territories(852,246,{'p1:close':12}),852,246),'old side-by-side formation control must fail new front-to-back depth oracle');
}
function moduleAndInstallContract(){
  const root=path.resolve(__dirname,'..'),worker=fs.readFileSync(path.join(root,'sw.js'),'utf8'),seen=new Set();
  function visit(file){
    const relative=path.relative(root,file).split(path.sep).join('/');
    assert(fs.existsSync(file),'missing ES module dependency: '+relative);if(seen.has(file))return;seen.add(file);
    assert(worker.includes(`'./${relative}'`),'offline shell omits transitive ES module: '+relative);
    const source=fs.readFileSync(file,'utf8');
    for(const match of source.matchAll(/\b(?:import|export)\s+(?:[^;]*?\bfrom\s*)?(['"])(\.{1,2}\/[^'"]+)\1/g))visit(path.resolve(path.dirname(file),match[2]));
  }
  visit(path.join(root,'src/table3d-renderer.js'));
  const m=JSON.parse(fs.readFileSync(path.join(root,'manifest-table3d.webmanifest'),'utf8'));
  for(const base of ['https://example.test/','https://example.test/gwent-definitive/']){
    const manifestURL=new URL('manifest-table3d.webmanifest',base),launch=new URL(m.start_url,manifestURL);assert.equal(launch.searchParams.get('table3d'),'1');assert.equal(new URL(m.id,manifestURL).href,launch.href);assert(launch.href.startsWith(new URL(m.scope,manifestURL).href));
  }
  assert.equal(m.orientation,'any');assert.equal(m.display,'standalone');
  return seen.size;
}
async function run(){
  for(const type of [2,6])for(const filter of [0,1,2,3,4]){
    const channels=type===6?4:3,p=Uint8Array.from({length:7*5*channels},(_,i)=>i%channels===3?255:(i*37+13)%256),decoded=decodePNG(encoded(7,5,p,type,filter));
    for(let i=0;i<35;i++)for(let c=0;c<channels;c++)assert.equal(decoded.pixels[i*4+c],p[i*channels+c],`PNG filter ${filter}/type ${type}`);
  }
  const blank={width:20,height:20,pixels:new Uint8Array(1600)},flat={...blank,pixels:Uint8Array.from({length:1600},(_,i)=>i%4===3?255:100)};
  assert.throws(()=>assertPainted(blank),/transparent/);assert.throws(()=>assertPainted(flat),/blank or flat/);
  assert.throws(()=>assertChangedPixels(flat,flat),/did not change/,'unchanged renderer flags must not pass a paint oracle');
  const painted={...flat,pixels:flat.pixels.slice()};for(let y=3;y<9;y++)for(let x=2;x<7;x++)for(let c=0;c<3;c++)painted.pixels[(y*20+x)*4+c]=150;
  const delta=assertChangedPixels(flat,painted);assert.equal(delta.changed,30);assert.equal(delta.brightened,30);assert.equal(delta.darkened,0);
  assert.throws(()=>assertChangedPixels(flat,painted,null,{exclude:[{x:2,y:3,width:5,height:6}]}),/did not change/,'excluded card-face movement must not count as floor shadow');
  const subset=pixelDifference(flat,painted,{x:2,y:3,width:2,height:2});assert.equal(subset.changed,4);
  await geometryContract();
  const modules=moduleAndInstallContract();
  console.log(`table3d-scene-contract: exact projection/box/angle module, depth territories, ${modules} offline modules, mode-preserving manifest, PNG filters and known-bad geometry/blank/unchanged controls passed`);
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
