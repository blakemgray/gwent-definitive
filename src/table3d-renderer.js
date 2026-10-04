import * as THREE from '../vendor/three/three.module.js';
import {GLTFLoader} from '../vendor/three/addons/loaders/GLTFLoader.js';
import {elementGeometry,screenToWorld,pointInQuad} from './table3d-math.js';

const root=window,doc=root.document;
const VERSION='table3d.scene.1';
const enabled=new URL(root.location.href).searchParams.get('table3d')==='1';
const CARD_SELECTOR='#match-screen .hand-card[data-card-iid],#match-screen .unit[data-inspect-board],.dm-drag-proxy,.dm-flight-proxy,.gc-snapshot-ghost,.te-target-actor';
const MAX_TEXTURES=48,DPR_CAP=1.75;
const meshes=new Map(),textures=new Map(),effects=[],effectHistory=[],props=[],importedTextures=new Set(),cpuTimes=[],intervals=[],errors=[];
const assets={wood:{status:'pending',loaded:false},table:{status:'pending',loaded:false}};
let renderer,scene,camera,keyLight,canvas,screen,viewport={x:0,y:0,width:0,height:0},woodTexture,woodSurfaceTexture,environmentTarget,tableModel,fallbackTable;
let observer,startObserver,resizeObserver,raf=0,disposed=false,initialized=false,isReady=false,contextLost=false,shaderFailed=false,status='disabled';
let frameCount=0,lastFrame=0,lastFrameContinuous=false,dirty=true,textureRequests=0,textureFailures=0,textureEvictions=0,effectSequence=0,effectsTriggered=0,effectsCancelled=0,nextMeshToken=0;
let geometryBox,geometryFace,bodyMaterial,latestCandidates=[],lastReason='install',readbackCount=0,gpuBackend=null;
let resolveReady;
const ready=new Promise(resolve=>resolveReady=resolve);
const now=()=>root.performance.now();
const reduced=()=>!!root.GwentMotionTokens?.reduced?.()||!!root.matchMedia('(prefers-reduced-motion: reduce)').matches;
const assetURL=path=>new URL(path,doc.baseURI).href;
const idOf=element=>element.dataset.presentationIid||element.dataset.teActorFor||element.dataset.gcIid||element.dataset.inspectBoard||element.dataset.cardIid||null;
const all=selector=>[...doc.querySelectorAll(selector)];
const noteError=(kind,error)=>{errors.push({kind,message:String(error?.message||error),at:Date.now()});if(errors.length>24)errors.shift();};

function setReady(value){
  isReady=!!value;
  if(value)doc.documentElement.dataset.table3dReady='true';else delete doc.documentElement.dataset.table3dReady;
  if(canvas)canvas.hidden=!value;
}
function checkReady(){
  if(disposed||contextLost||shaderFailed||!initialized)return false;
  if(assets.table.status==='error'||assets.wood.status==='error'){
    status='fallback';setReady(false);resolveReady(false);return false;
  }
  if(!assets.table.loaded||!assets.wood.loaded){status='loading';return false;}
  // Readiness proves the packaged table and wood passed through the real GPU
  // draw, independently of whether the player has started a match yet.
  updateViewport();renderer.render(scene,camera);
  if(shaderFailed||renderer.getContext().isContextLost()||renderer.info.render.calls<1){status='fallback';setReady(false);resolveReady(false);return false;}
  status='ready';setReady(true);resolveReady(true);return true;
}
function roleOf(element){
  if(element.classList.contains('dm-drag-proxy'))return 'drag';
  if(element.classList.contains('dm-flight-proxy'))return 'flight';
  if(element.classList.contains('te-target-actor'))return 'target';
  if(element.classList.contains('gc-snapshot-ghost'))return 'choreography';
  return element.classList.contains('hand-card')?'hand':'board';
}
function selectCandidates(elements=all(CARD_SELECTOR)){
  const chosen=new Map(),priority={hand:10,board:20,choreography:30,target:40,flight:50,drag:60};
  for(const element of elements){
    const iid=idOf(element),image=element.querySelector('img');
    if(!iid||!image||!element.isConnected)continue;
    const geometry=elementGeometry(element,root),role=roleOf(element),visibility=bodyVisibility(element);
    geometry.visible=geometry.visible&&visibility.visible;geometry.opacity=visibility.opacity;
    if(!geometry.visible||geometry.opacity<.025)continue;
    const candidate={iid,element,image,geometry,role,source:image.currentSrc||image.src||'',priority:priority[role]};
    const prior=chosen.get(iid);
    if(!prior||candidate.priority>prior.priority||(candidate.priority===prior.priority&&geometry.z>=prior.geometry.z))chosen.set(iid,candidate);
  }
  return [...chosen.values()].sort((a,b)=>a.geometry.z-b.geometry.z||a.priority-b.priority);
}
function markDOM(element,paint){if(element.dataset.table3dPaint!==paint)element.dataset.table3dPaint=paint;}
function clearDOMMarks(){for(const element of all('[data-table3d-paint]'))delete element.dataset.table3dPaint;}
function bodyVisibility(element){
  let opacity=1;
  for(let node=element;node&&node!==doc.documentElement;node=node.parentElement){
    const style=root.getComputedStyle(node);opacity*=Number(style.opacity||1);
    if(style.display==='none'||style.visibility==='hidden'||style.contentVisibility==='hidden')return {visible:false,opacity:0};
  }
  return {visible:opacity>=.025,opacity};
}
function textureFor(source){
  if(textures.has(source)){const record=textures.get(source);record.usedAt=frameCount;return record;}
  const record={source,status:'loading',texture:null,width:0,height:0,usedAt:frameCount,error:null};
  textures.set(source,record);textureRequests++;
  const loader=new THREE.TextureLoader();loader.setCrossOrigin('anonymous');
  loader.load(source,texture=>{
    if(disposed||textures.get(source)!==record){texture.dispose();return;}
    const image=texture.image;record.width=image.naturalWidth||image.width;record.height=image.naturalHeight||image.height;
    const scale=Math.min(1,768/Math.max(1,record.height),512/Math.max(1,record.width));
    if(scale<1){
      try{const resized=doc.createElement('canvas');resized.width=Math.max(1,Math.round(record.width*scale));resized.height=Math.max(1,Math.round(record.height*scale));
        resized.getContext('2d').drawImage(image,0,0,resized.width,resized.height);texture.image=resized;texture.needsUpdate=true;
      }catch(error){noteError('texture-resize',error);}
    }
    texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer?.capabilities.getMaxAnisotropy()||1);
    record.texture=texture;record.status='loaded';invalidate('art-loaded');
  },undefined,error=>{if(disposed||textures.get(source)!==record)return;record.status='error';record.error=String(error?.message||'Artwork did not load with CORS permission.');textureFailures++;invalidate('art-error');});
  return record;
}
function createBody(iid){
  const group=new THREE.Group();group.name=`card:${iid}`;
  const edge=new THREE.Mesh(geometryBox,bodyMaterial);edge.castShadow=true;edge.receiveShadow=true;group.add(edge);
  const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,metalness:0,side:THREE.FrontSide,transparent:true,emissive:0xffffff,emissiveIntensity:.12,envMapIntensity:.12});
  material.toneMapped=false;
  const face=new THREE.Mesh(geometryFace,material);face.rotation.x=-Math.PI/2;face.position.y=.64;face.receiveShadow=true;group.add(face);
  scene.add(group);
  const body={iid,meshToken:++nextMeshToken,group,edge,face,material,source:null,record:null,candidate:null,projected:null,worldHeight:0,active:false};meshes.set(iid,body);return body;
}
function retireBody(body){body.group.removeFromParent();body.material.dispose();meshes.delete(body.iid);}
function actorLift(candidate){
  const lift=parseFloat(candidate.element.style.getPropertyValue('--tabletop-lift'))||0;
  if(candidate.role==='drag')return reduced()?1:18;
  // A held board body stays lifted until release. The planar contact solver's
  // transient lift decays each frame and is not the height of a held 3D card.
  if(candidate.element.dataset.tabletopHeld==='true')return reduced()?1:18;
  if(candidate.role==='flight'){
    const animation=candidate.element.getAnimations().find(animation=>animation.playState==='running');
    const timing=animation?.effect?.getComputedTiming(),fraction=Number(timing?.progress);
    return reduced()?1:6+(Number.isFinite(fraction)?Math.sin(Math.PI*fraction)*14:8);
  }
  if(candidate.role==='target')return reduced()?1:9;
  return Math.max(0,lift);
}
function syncBodies(){
  const elements=all(CARD_SELECTOR),knownIids=new Set(elements.map(idOf).filter(Boolean));
  const candidates=selectCandidates(elements),live=new Set(),usedSources=new Set();latestCandidates=candidates;
  // The selected visible embodiment is the only mesh painted for an iid. Every
  // other live DOM copy is marked too, so a clone cannot appear over that mesh.
  candidates.forEach((candidate,index)=>{
    const {iid,geometry}=candidate;live.add(iid);usedSources.add(candidate.source);
    const body=meshes.get(iid)||createBody(iid);body.candidate=candidate;body.active=true;
    if(body.source!==candidate.source){body.source=candidate.source;body.record=textureFor(candidate.source);body.material.map=null;body.material.needsUpdate=true;}
    body.record.usedAt=frameCount;
    const loaded=body.record.status==='loaded';
    body.group.visible=loaded;
    const height=.76+index*.035+actorLift(candidate),center={x:geometry.x+geometry.width/2,y:geometry.y+geometry.height/2},world=screenToWorld(center,viewport,height);
    body.group.position.set(world.x,world.y,world.z);body.group.rotation.y=-geometry.angle*Math.PI/180;body.worldHeight=height;
    body.edge.scale.set(geometry.width,1.2,geometry.height);
    if(!loaded)return;
    const aspect=body.record.width/Math.max(1,body.record.height),faceHeight=Math.min(geometry.height-.5,(geometry.width-.5)/aspect),faceWidth=faceHeight*aspect;
    body.face.scale.set(Math.max(.1,faceWidth),Math.max(.1,faceHeight),1);
    if(body.material.map!==body.record.texture){body.material.map=body.record.texture;body.material.emissiveMap=body.record.texture;body.material.needsUpdate=true;}
    body.material.opacity=geometry.opacity;
  });
  for(const [iid,body] of meshes)if(!live.has(iid)){
    body.group.visible=false;body.active=false;
    if(knownIids.has(iid)||root.GwentPresentationQueue?.busy)usedSources.add(body.source);
    else retireBody(body);
  }
  for(const element of elements){const body=meshes.get(idOf(element));markDOM(element,body?.record?.status==='loaded'?'mesh':'dom');}
  for(const record of [...textures.values()].sort((a,b)=>a.usedAt-b.usedAt))if(textures.size>MAX_TEXTURES&&!usedSources.has(record.source)){
    record.texture?.dispose();textures.delete(record.source);textureEvictions++;
  }
  scene.updateMatrixWorld(true);
  for(const body of meshes.values())body.projected=projectBody(body);
}
function projectBody(body){
  if(!body?.candidate)return null;
  const geometry=body.candidate.geometry,corners=[];
  for(const [x,z] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){
    const point=new THREE.Vector3(x*geometry.width,.64,z*geometry.height).applyMatrix4(body.group.matrixWorld).project(camera);
    corners.push({x:viewport.x+(point.x+1)*viewport.width/2,y:viewport.y+(1-point.y)*viewport.height/2});
  }
  const left=Math.min(...corners.map(point=>point.x)),right=Math.max(...corners.map(point=>point.x)),top=Math.min(...corners.map(point=>point.y)),bottom=Math.max(...corners.map(point=>point.y));
  return {x:left,y:top,width:right-left,height:bottom-top,left,right,top,bottom,corners};
}
function updateViewport(){
  const box=screen.getBoundingClientRect(),changed=Math.abs(box.width-viewport.width)>.1||Math.abs(box.height-viewport.height)>.1;
  viewport={x:box.x,y:box.y,width:Math.max(1,box.width),height:Math.max(1,box.height)};
  if(!changed)return;
  renderer.setPixelRatio(Math.min(DPR_CAP,root.devicePixelRatio||1));renderer.setSize(viewport.width,viewport.height,false);
  camera.left=-viewport.width/2;camera.right=viewport.width/2;camera.top=viewport.height/2;camera.bottom=-viewport.height/2;camera.updateProjectionMatrix();
  const span=Math.max(viewport.width,viewport.height);
  keyLight.position.set(-span*.42,span*.85,-span*.28);
  Object.assign(keyLight.shadow.camera,{left:-span*.8,right:span*.8,top:span*.8,bottom:-span*.8,near:1,far:span*4});keyLight.shadow.camera.updateProjectionMatrix();
  fallbackTable.scale.set(viewport.width*1.05,2,viewport.height*1.05);
  fitTable();fitProps();
}
function fitTable(){
  if(!tableModel||!viewport.width)return;
  const size=tableModel.userData.sourceSize,center=tableModel.userData.sourceCenter;
  const sx=viewport.width/Math.max(.01,size.x),sz=viewport.height/Math.max(.01,size.z),sy=Math.min(sx,sz);
  tableModel.scale.set(sx,sy,sz);tableModel.position.set(-center.x*sx,-1,-center.z*sz);
}
function fitProps(){
  const span=Math.min(viewport.width,viewport.height);
  const rails=all('#match-screen .units').map(rail=>rail.getBoundingClientRect()).filter(box=>box.width>0&&box.height>0);
  const leftRoom=rails.length?Math.max(12,Math.min(...rails.map(box=>box.left))-viewport.x):viewport.width*.08;
  const rightRoom=rails.length?Math.max(12,viewport.x+viewport.width-Math.max(...rails.map(box=>box.right))):viewport.width*.08;
  for(const item of props){
    const requested=item.kind==='tankard'?Math.min(48,span*.115):item.kind==='candle'?Math.min(28,span*.075):Math.min(24,span*.065);
    const diameter=item.kind==='coins'?requested:Math.min(requested,(item.kind==='tankard'?rightRoom:leftRoom)-6);
    const scale=diameter/Math.max(.01,item.size.x,item.size.z);item.group.scale.setScalar(scale);
    item.group.position.set(item.kind==='tankard'?viewport.width/2-rightRoom/2:-viewport.width/2+(item.kind==='coins'?20:leftRoom/2),
      -1,item.kind==='coins'?viewport.height/2-15:-viewport.height/2+viewport.height*(item.kind==='tankard'?.2:.3));
  }
}
function applyWood(){
  if(!woodTexture)return;
  fallbackTable.material.map=woodTexture;fallbackTable.material.needsUpdate=true;
  const apply=model=>model.traverse(node=>{
    if(!node.isMesh)return;
    const materials=Array.isArray(node.material)?node.material:[node.material];
    for(const material of materials)if(material.name==='MAT_Oak_WarmWorn'){
      if(!woodSurfaceTexture){
        const authored=material.map;woodSurfaceTexture=authored?.clone()||woodTexture.clone();woodSurfaceTexture.source=new THREE.Source(woodTexture.image);
        woodSurfaceTexture.colorSpace=THREE.SRGBColorSpace;woodSurfaceTexture.flipY=false;woodSurfaceTexture.rotation=(authored?.rotation||0)+Math.PI/2;
        woodSurfaceTexture.anisotropy=woodTexture.anisotropy;woodSurfaceTexture.needsUpdate=true;
      }
      material.map=woodSurfaceTexture;material.color.set(0xffffff);material.roughness=.91;material.roughnessMap=null;material.metalness=0;material.metalnessMap=null;
      material.normalScale?.set(.075,.075);material.needsUpdate=true;
    }
  });
  if(tableModel)apply(tableModel);for(const item of props)apply(item.group);
}
function loadAssets(){
  new THREE.TextureLoader().load(assetURL('assets/table3d/oak-refined.png'),texture=>{
    if(disposed){texture.dispose();return;}
    woodTexture=texture;texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1,1);texture.center.set(.5,.5);texture.rotation=Math.PI/2;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    assets.wood={status:'loaded',loaded:true};applyWood();checkReady();invalidate('wood-loaded');
  },undefined,error=>{assets.wood={status:'error',loaded:false,error:String(error?.message||'Wood texture did not load.')};noteError('wood',error);checkReady();});
  new GLTFLoader().load(assetURL('assets/table3d/tavern-table.glb'),gltf=>{
    if(disposed)return;
    tableModel=gltf.scene;const remove=[];
    tableModel.traverse(node=>{if(node.isLight||node.isCamera)remove.push(node);if(node.isMesh){node.castShadow=!/^Table(top)?_|^Tabletop_/.test(node.name);node.receiveShadow=true;
      for(const material of Array.isArray(node.material)?node.material:[node.material])for(const value of Object.values(material))if(value?.isTexture)importedTextures.add(value);
    }});remove.forEach(node=>node.removeFromParent());
    for(const [kind,prefix] of [['candle','Candle_'],['tankard','Tankard_'],['coins','Coin_']]){
      const members=[...tableModel.children].filter(node=>node.name.startsWith(prefix));if(!members.length)continue;
      const group=new THREE.Group();group.name=`peripheral:${kind}`;members.forEach(node=>group.attach(node));
      const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
      for(const member of group.children){member.position.x-=center.x;member.position.z-=center.z;}
      scene.add(group);props.push({kind,group,size});
    }
    const box=new THREE.Box3().setFromObject(tableModel);tableModel.userData.sourceSize=box.getSize(new THREE.Vector3());tableModel.userData.sourceCenter=box.getCenter(new THREE.Vector3());
    scene.add(tableModel);fitTable();fitProps();applyWood();fallbackTable.visible=false;assets.table={status:'loaded',loaded:true,embeddedLightsRemoved:remove.filter(node=>node.isLight).length,
      embeddedCamerasRemoved:remove.filter(node=>node.isCamera).length,peripheralPropGroups:props.map(item=>item.kind)};checkReady();invalidate('table-loaded');
  },undefined,error=>{assets.table={status:'error',loaded:false,error:String(error?.message||'Table model did not load.')};noteError('table',error);checkReady();});
}
function createEnvironment(){
  // A tiny static cube provides portable PBR reflections without a network
  // HDRI or an additional light rig. PMREM is generated once, never per frame.
  const images=Array.from({length:6},(_,index)=>{
    const image=doc.createElement('canvas');image.width=image.height=32;const context=image.getContext('2d');
    const gradient=context.createLinearGradient(0,0,0,32);gradient.addColorStop(0,index===2?'#d9cfb9':'#a4a29a');gradient.addColorStop(1,'#443e36');
    context.fillStyle=gradient;context.fillRect(0,0,32,32);
    if(index===1||index===5){context.fillStyle='#dedbd0';context.fillRect(7,3,11,20);}
    return image;
  });
  const cube=new THREE.CubeTexture(images);cube.colorSpace=THREE.SRGBColorSpace;cube.needsUpdate=true;
  const generator=new THREE.PMREMGenerator(renderer);environmentTarget=generator.fromCubemap(cube);scene.environment=environmentTarget.texture;scene.environmentIntensity=.7;
  cube.dispose();generator.dispose();
}
function runningAnimation(){
  return doc.getAnimations().some(animation=>{
    const target=animation.effect?.target,timing=animation.effect?.getComputedTiming();
    return animation.playState==='running'&&timing?.iterations!==Infinity&&target?.matches?.('.hand-card,.unit,.dm-drag-proxy,.dm-flight-proxy,.gc-snapshot-ghost,.te-target-actor');
  });
}
function updateEffects(time){
  for(let index=effects.length-1;index>=0;index--){
    const item=effects[index],progress=Math.max(0,(time-item.started)/item.duration);
    if(progress>=1){finishEffect(item,'complete');continue;}
    const pulse=Math.sin(Math.PI*progress);item.light.intensity=item.intensity*Math.max(.08,pulse);
  }
}
function percentile(values,fraction){if(!values.length)return 0;return [...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*fraction))];}
function recordTiming(values,value){values.push(value);if(values.length>120)values.shift();}
function renderFrame(time){
  raf=0;if(disposed||!initialized||contextLost||shaderFailed||status==='fallback'||doc.hidden||!screen.classList.contains('active'))return;
  const began=now();updateViewport();syncBodies();updateEffects(time);renderer.render(scene,camera);frameCount++;
  if(lastFrameContinuous&&lastFrame)recordTiming(intervals,time-lastFrame);
  lastFrame=time;recordTiming(cpuTimes,now()-began);dirty=false;
  if(!isReady)checkReady();
  const continuous=effects.length>0||runningAnimation()||!!root.GwentTabletopScene?.metrics?.().animating;
  lastFrameContinuous=continuous;
  if(continuous)raf=root.requestAnimationFrame(renderFrame);
}
function invalidate(reason='external'){
  lastReason=reason;dirty=true;
  if(!enabled||disposed||!initialized||contextLost||doc.hidden||raf)return false;
  raf=root.requestAnimationFrame(renderFrame);return true;
}
function sync(){return invalidate('scene-sync');}
function projectCard(iid){return meshes.get(iid)?.projected||null;}
function projectDestination(destination){
  if(destination?.kind==='target')return projectCard(destination.targetIid);
  const escape=value=>root.CSS.escape(String(value));
  let element;
  if(destination?.kind==='row'||destination?.kind==='special')element=doc.querySelector(`#match-screen .lane[data-pid="${escape(destination.playerId)}"][data-row="${escape(destination.row)}"]${destination.kind==='special'?' .special-slot-wrap':''}`);
  else element=screen?.querySelector('.weather');
  const box=element?.getBoundingClientRect();return box?{x:box.x,y:box.y,width:box.width,height:box.height}:null;
}
function pick(point,eligibleIids=null){
  if(!isReady)return null;
  for(const body of [...meshes.values()].filter(body=>body.active).sort((a,b)=>b.worldHeight-a.worldHeight||b.candidate.geometry.z-a.candidate.geometry.z)){
    const candidate=body.candidate;
    if(candidate.role!=='board'&&candidate.role!=='target')continue;
    if(!body.projected||!pointInQuad(point,body.projected.corners))continue;
    // A frontmost ineligible body blocks a covered target; never click through.
    return !eligibleIids||eligibleIids.has(candidate.iid)?candidate.iid:null;
  }
  return null;
}
function toLocal(iid,point){
  const element=meshes.get(iid)?.candidate?.element,rail=element?.closest('.units');
  const box=rail?.getBoundingClientRect();return box?{x:point.x-box.left,y:point.y-box.top}:null;
}
function effect(event,signal=null){
  if(!enabled||disposed||!initialized||contextLost||doc.hidden||signal?.aborted)return false;
  const type=String(event?.type||event?.hook||event?.name||'').toUpperCase();
  const color=type.includes('HORN')?0xffb74f:type.includes('SCORCH')?0xff6337:type.includes('MEDIC')?0x92dc84:type.includes('WEATHER')||type.includes('SPY')?0x91bded:null;
  if(color===null)return false;
  const point=event.iid?projectCard(event.iid):projectDestination({kind:'row',playerId:event.playerId||event.pid||'p1',row:event.row||'close'});
  const center=point?{x:point.x+point.width/2,y:point.y+point.height/2}:{x:viewport.x+viewport.width/2,y:viewport.y+viewport.height*.65};
  const world=screenToWorld(center,viewport,65),light=new THREE.PointLight(color,0,420,1.6);light.position.set(world.x,world.y,world.z);scene.add(light);
  const item={id:++effectSequence,type,light,started:now(),duration:reduced()?260:1450,intensity:1100,signal,abort:null};
  item.abort=()=>{finishEffect(item,'aborted');invalidate('effect-aborted');};signal?.addEventListener('abort',item.abort,{once:true});
  effects.push(item);effectHistory.push({id:item.id,type,transactionId:event.transactionId||null,eventSeq:event.seq??null,started:item.started,duration:item.duration,completedAt:null,reason:null});
  if(effectHistory.length>32)effectHistory.shift();effectsTriggered++;
  while(effects.length>3)finishEffect(effects[0],'capacity');
  invalidate('confirmed-effect');return true;
}
function finishEffect(item,reason){
  const index=effects.indexOf(item);if(index<0)return;
  item.signal?.removeEventListener('abort',item.abort);item.light.removeFromParent();item.light.dispose();effects.splice(index,1);
  const history=effectHistory.find(entry=>entry.id===item.id);if(history){history.completedAt=now();history.reason=reason;}
  if(reason!=='complete')effectsCancelled++;
}
function clearEffects(){for(const item of [...effects])finishEffect(item,'cleared');}
function reset(){clearEffects();for(const body of [...meshes.values()])retireBody(body);latestCandidates=[];clearDOMMarks();invalidate('match-reset');}
function readbackPair({kind='effect',floorOnly=true,includePixels=false}={}){
  if(!isReady||contextLost)return {available:false,reason:status};
  const width=kind==='shadow'?128:64,height=width/2,target=new THREE.WebGLRenderTarget(width,height),withPixels=new Uint8Array(width*height*4),withoutPixels=new Uint8Array(width*height*4);
  const previous=renderer.getRenderTarget(),visibility=effects.map(item=>item.light.visible);
  const shadowFlags=[...meshes.values()].map(body=>({body,value:body.edge.castShadow}));
  try{
    renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,width,height,withPixels);
    if(kind==='shadow')shadowFlags.forEach(({body})=>body.edge.castShadow=false);
    else effects.forEach(item=>item.light.visible=false);
    renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,width,height,withoutPixels);
    const included=[],polygons=[...meshes.values()].filter(body=>body.group.visible&&body.projected).map(body=>body.projected.corners);
    for(let pixel=0;pixel<width*height;pixel++){
      // WebGL readback is bottom-up; convert the sampling cell to screen space.
      const point={x:viewport.x+(pixel%width+.5)*viewport.width/width,y:viewport.y+(height-Math.floor(pixel/width)-.5)*viewport.height/height};
      if(!floorOnly||!polygons.some(corners=>pointInQuad(point,corners)))included.push(pixel*4);
    }
    let absolute=0,changed=0,max=0,darker=0,brighter=0;
    const aggregate=pixels=>{let r=0,g=0,b=0;for(const index of included){r+=pixels[index];g+=pixels[index+1];b+=pixels[index+2];}const divisor=Math.max(1,included.length);return {meanRgb:[r/divisor,g/divisor,b/divisor],meanLuminance:(.2126*r+.7152*g+.0722*b)/divisor};};
    for(const index of included){let pixelChanged=false;for(let channel=0;channel<3;channel++){
      const delta=Math.abs(withPixels[index+channel]-withoutPixels[index+channel]);absolute+=delta;max=Math.max(max,delta);if(delta>1)pixelChanged=true;
    }if(pixelChanged)changed++;
      const signed=.2126*(withPixels[index]-withoutPixels[index])+.7152*(withPixels[index+1]-withoutPixels[index+1])+.0722*(withPixels[index+2]-withoutPixels[index+2]);
      if(signed<-1)darker++;else if(signed>1)brighter++;
    }
    readbackCount++;
    const withValue=aggregate(withPixels),withoutValue=aggregate(withoutPixels),samples=Math.max(1,included.length);
    return {available:true,kind,floorOnly,width,height,sampledPixels:included.length,excludedCardPixels:width*height-included.length,frameNumber:frameCount,activeEffects:effects.map(item=>({id:item.id,type:item.type})),
      withEffects:withValue,withoutEffects:withoutValue,...(kind==='shadow'?{withShadows:withValue,withoutShadows:withoutValue}:{}),
      meanAbsoluteDifference:absolute/(samples*3),changedPixels:changed,changedRatio:changed/samples,maxChannelDifference:max,darkerPixels:darker,brighterPixels:brighter,
      ...(includePixels?{rawPixels:{with:Array.from(withPixels),without:Array.from(withoutPixels),includedOffsets:included}}:{})};
  }catch(error){noteError('readback',error);return {available:false,reason:String(error?.message||error)};}
  finally{effects.forEach((item,index)=>item.light.visible=visibility[index]);shadowFlags.forEach(({body,value})=>body.edge.castShadow=value);
    renderer.setRenderTarget(previous);target.dispose();renderer.render(scene,camera);}
}
function metrics(){
  const timings=values=>({mean:values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0,p95:percentile(values,.95),max:Math.max(0,...values),samples:values.length});
  return {version:VERSION,enabled,ready:isReady,status,fallback:enabled&&!isReady,contextLost,disposed,dpr:renderer?.getPixelRatio()||null,dprCap:DPR_CAP,
    camera:'orthographic-overhead',gpuBackend:gpuBackend&&structuredClone(gpuBackend),viewport:{...viewport},frameCount,renderCalls:renderer?.info.render.calls||0,triangles:renderer?.info.render.triangles||0,
    textureCount:textures.size,gpuTextureCount:renderer?.info.memory.textures||0,textureLimit:MAX_TEXTURES,
    textureBudget:{residentTarget:MAX_TEXTURES,activeCannotEvict:true,activeUnique:[...new Set([...meshes.values()].map(body=>body.source))].length,
      retainedInactive:[...textures.keys()].filter(source=>![...meshes.values()].some(body=>body.source===source)).length},textureRequests,textureFailures,textureEvictions,
    textures:[...textures.values()].map(record=>({source:record.source,status:record.status,width:record.width,height:record.height,error:record.error})),assets:structuredClone(assets),
    cards:[...meshes.values()].map(body=>({iid:body.iid,meshToken:body.meshToken,role:body.candidate?.role,source:body.source,loaded:body.record?.status==='loaded',
      active:body.active,visible:body.group.visible,domFallback:body.active&&!body.group.visible,fallbackIcon:/\/icon\.svg(?:[?#]|$)/.test(body.source||''),worldHeight:body.worldHeight,projected:body.projected,semanticBounds:body.candidate?.geometry.rect})),
    activeEffects:effects.map(item=>({id:item.id,type:item.type,intensity:item.light.intensity,maxIntensity:item.intensity,duration:item.duration,ageMs:Math.max(0,now()-item.started)})),effectHistory:structuredClone(effectHistory),effectsTriggered,effectsCancelled,readbackCount,
    timings:{cpuMs:timings(cpuTimes),frameIntervalMs:timings(intervals)},animating:!!raf,lastReason,errors:[...errors]};
}
function dispose(){
  if(disposed)return;disposed=true;clearEffects();if(raf)root.cancelAnimationFrame(raf);raf=0;observer?.disconnect();startObserver?.disconnect();resizeObserver?.disconnect();resolveReady(false);
  clearDOMMarks();for(const body of [...meshes.values()])retireBody(body);for(const record of textures.values())record.texture?.dispose();textures.clear();
  woodTexture?.dispose();woodSurfaceTexture?.dispose();environmentTarget?.dispose();for(const texture of importedTextures)texture.dispose();importedTextures.clear();
  const disposeModel=model=>model?.traverse(node=>{if(node.isMesh){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});
  disposeModel(tableModel);props.forEach(item=>disposeModel(item.group));props.length=0;
  geometryBox?.dispose();geometryFace?.dispose();bodyMaterial?.dispose();fallbackTable?.material.dispose();renderer?.dispose();canvas?.remove();setReady(false);status='disposed';
}
function initialize(){
  if(!enabled){resolveReady(false);return;}
  try{
    screen=doc.querySelector('#match-screen');if(!screen)throw new Error('Match screen is unavailable.');
    canvas=doc.createElement('canvas');canvas.id='table3d-canvas';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;screen.prepend(canvas);
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    gpuBackend={version:gl.getParameter(gl.VERSION),shadingLanguage:gl.getParameter(gl.SHADING_LANGUAGE_VERSION),vendor:gl.getParameter(debug?.UNMASKED_VENDOR_WEBGL||gl.VENDOR),renderer:gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL||gl.RENDERER),contextAttributes:gl.getContextAttributes()};
    renderer.debug.onShaderError=gl=>{shaderFailed=true;noteError('shader','A table shader failed to compile or link.');status='fallback';setReady(false);resolveReady(false);};
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x271a12);camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10000);
    camera.position.set(0,2000,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);
    const ambient=new THREE.HemisphereLight(0xfff1da,0x302b26,1.1);scene.add(ambient);
    keyLight=new THREE.DirectionalLight(0xffe6c2,1.1);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.bias=-.0002;keyLight.shadow.normalBias=.25;scene.add(keyLight);scene.add(keyLight.target);
    createEnvironment();
    geometryBox=new THREE.BoxGeometry(1,1,1);geometryFace=new THREE.PlaneGeometry(1,1);
    bodyMaterial=new THREE.MeshStandardMaterial({color:0xd8cbb3,roughness:.93,metalness:0});
    fallbackTable=new THREE.Mesh(geometryBox,new THREE.MeshStandardMaterial({color:0x725037,roughness:.86,metalness:0}));fallbackTable.position.y=-2;fallbackTable.receiveShadow=true;scene.add(fallbackTable);
    initialized=true;status='loading';loadAssets();
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;status='contextlost';setReady(false);clearEffects();if(raf)root.cancelAnimationFrame(raf);raf=0;lastFrame=0;lastFrameContinuous=false;});
    canvas.addEventListener('webglcontextrestored',()=>{
      contextLost=false;shaderFailed=false;status='restoring';dirty=true;
      // PMREM is GPU-generated, so its render-target contents must be rebuilt
      // after context loss; unlike image textures it has no CPU image to upload.
      environmentTarget?.dispose();createEnvironment();checkReady();invalidate('context-restored');
    });
    observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList'||record.target===screen||record.target?.matches?.(CARD_SELECTOR.replaceAll('#match-screen ',''))))invalidate('dom-change');
    });
    observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','src','data-current-power','data-tabletop-held']});
    resizeObserver=new ResizeObserver(()=>invalidate('viewport'));resizeObserver.observe(screen);
    // Asset callbacks complete readiness after both packaged assets are loaded.
    updateViewport();renderer.render(scene,camera);checkReady();
    invalidate('initialize');
  }catch(error){status='fallback';noteError('initialize',error);setReady(false);resolveReady(false);}
}
root.GwentTable3D=Object.freeze({version:VERSION,enabled,ready,get isReady(){return isReady;},invalidate,sync,projectCard,projectDestination,pick,toLocal,
  effect,reset,metrics,readbackPair,dispose});
doc.addEventListener('visibilitychange',()=>{if(doc.hidden){clearEffects();if(raf)root.cancelAnimationFrame(raf);raf=0;lastFrameContinuous=false;}else invalidate('visible');});
root.addEventListener('gwent:tabletop-reset',reset);root.addEventListener('pagehide',()=>{clearEffects();if(raf)root.cancelAnimationFrame(raf);raf=0;lastFrame=0;lastFrameContinuous=false;});
root.addEventListener('pageshow',()=>invalidate('pageshow'));
function awaitMatch(){
  if(!enabled||disposed){resolveReady(false);return;}
  // Creating/resizing a WebGL surface under a display:none match screen can
  // leave WebKit's page compositor without its painted layer, despite valid
  // offscreen GPU draws. Create it at the actual visible gameplay entry.
  status='awaiting-match';
  const start=()=>{if(!disposed&&doc.querySelector('#match-screen.active')){startObserver?.disconnect();initialize();return true;}return false;};
  if(start())return;
  startObserver=new MutationObserver(start);
  startObserver.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['class']});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',awaitMatch,{once:true});else awaitMatch();
