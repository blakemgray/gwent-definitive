// The first 3D proof shares the production screen-plane geometry. These helpers
// never read game state or move cards; one world unit is one CSS pixel.
export function angleDegrees(value){
  const text=String(value||'none').trim();
  if(text==='none')return 0;
  const number=parseFloat(text.split(/\s+/).pop());
  if(!Number.isFinite(number))return 0;
  if(text.endsWith('grad'))return number*.9;
  if(text.endsWith('rad'))return number*180/Math.PI;
  if(text.endsWith('turn'))return number*360;
  return number;
}
export function transform2D(value){
  const text=String(value||'none'),numbers=(text.match(/\(([^)]+)\)/)?.[1]||'').split(',').map(Number);
  const a=numbers[0]??1,b=numbers[1]??0,c=numbers[text.startsWith('matrix3d')?4:2]??0,d=numbers[text.startsWith('matrix3d')?5:3]??1;
  if(text==='none'||numbers.some(number=>!Number.isFinite(number)))return {scaleX:1,scaleY:1,angle:0};
  return {scaleX:Math.hypot(a,b)||1,scaleY:Math.hypot(c,d)||1,angle:Math.atan2(b,a)*180/Math.PI};
}
export function cornersAndBounds({x,y,width,height,angle=0}){
  const cx=x+width/2,cy=y+height/2,radians=angle*Math.PI/180,cos=Math.cos(radians),sin=Math.sin(radians);
  const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([u,v])=>({x:cx+u*width*cos-v*height*sin,y:cy+u*width*sin+v*height*cos}));
  const left=Math.min(...corners.map(point=>point.x)),right=Math.max(...corners.map(point=>point.x));
  const top=Math.min(...corners.map(point=>point.y)),bottom=Math.max(...corners.map(point=>point.y));
  return {x:left,y:top,width:right-left,height:bottom-top,left,right,top,bottom,corners};
}
export function elementGeometry(element,view=window){
  const rect=element.getBoundingClientRect(),style=view.getComputedStyle(element);
  const value=name=>style.getPropertyValue(name),number=name=>parseFloat(value(name))||0;
  let width=number('width')||element.offsetWidth||rect.width,height=number('height')||element.offsetHeight||rect.height;
  if(value('box-sizing')==='content-box'){
    width+=number('padding-left')+number('padding-right')+number('border-left-width')+number('border-right-width');
    height+=number('padding-top')+number('padding-bottom')+number('border-top-width')+number('border-bottom-width');
  }
  const matrix=transform2D(value('transform'));
  const scales=value('scale').split(/\s+/).map(Number),scaleX=Number.isFinite(scales[0])&&scales[0]>0?scales[0]:1;
  const scaleY=Number.isFinite(scales[1])&&scales[1]>0?scales[1]:scaleX;
  width*=matrix.scaleX*scaleX;height*=matrix.scaleY*scaleY;
  const angle=matrix.angle+angleDegrees(value('rotate'));
  return {x:rect.x+rect.width/2-width/2,y:rect.y+rect.height/2-height/2,width,height,angle,
    opacity:Math.max(0,Math.min(1,Number(value('opacity')||1))),visible:value('display')!=='none'&&value('visibility')!=='hidden'&&rect.width>0&&rect.height>0,
    z:parseFloat(value('z-index'))||0,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};
}
export function screenToWorld(point,viewport,height=0){
  return {x:point.x-viewport.x-viewport.width/2,y:height,z:point.y-viewport.y-viewport.height/2};
}
export function worldToScreen(point,viewport){
  return {x:point.x+viewport.x+viewport.width/2,y:point.z+viewport.y+viewport.height/2};
}
export function pointInQuad(point,corners){
  let sign=0;
  for(let index=0;index<corners.length;index++){
    const a=corners[index],b=corners[(index+1)%corners.length],cross=(b.x-a.x)*(point.y-a.y)-(b.y-a.y)*(point.x-a.x);
    if(Math.abs(cross)<1e-7)continue;
    const next=Math.sign(cross);if(sign&&sign!==next)return false;sign=next;
  }
  return true;
}
