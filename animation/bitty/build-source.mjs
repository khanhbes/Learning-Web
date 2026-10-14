/** Deterministic, script-free RML authoring from BytePath's original SVG assets.
 * Only the small SVG grammar used by our checked-in vectors is accepted.
 * Rive's docs/schema are the authority for every type/property emitted here.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { TIMELINES, TRIGGER_TIMELINES } from '../../shared/mascot-motion.mjs';

const project = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(project, '../..');
const palette = { mint: '#76DEC1', green: '#3AA58E', ink: '#243E4B', cream: '#FFF9E9', gold: '#F3CB65', coral: '#F4887E' };
const propIds = ['whiteboard', 'laptop', 'bulb', 'trophy', 'level-badge', 'streak-fire', 'confetti', 'star', 'heart', 'coffee', 'question', 'exclamation'];
const pivots = { shadow: [128,235], tail:[188,184], leg_L:[98,210], leg_R:[157,210], body:[128,216], belly:[128,179], arm_L:[63,153], arm_R:[193,153], ear_L:[76,66], ear_R:[180,66], antenna_stem:[127,47], antenna_tip:[127,47], head:[128,119], pupil_L:[101,104], pupil_R:[155,104] };
const xmlEscape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const n = value => String(Math.round(Number(value) * 1e6) / 1e6);
const color = value => 'FF' + value.replace('#','').toUpperCase();
let serial = 20;
const nextId = () => `0:${++serial}`;
const nodes = new Map();
const paints = new Map();

export function parseSvg(xml) {
  const stack = [];
  let root;
  for (const match of xml.matchAll(/<([^>]+)>/g)) {
    const tag = match[1].trim();
    if (tag.startsWith('?') || tag.startsWith('!')) continue;
    if (tag.startsWith('/')) { stack.pop(); continue; }
    const kind = tag.match(/^[\w:-]+/)?.[0];
    const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
    const element = {kind,attrs,children:[]};
    if (stack.length) stack.at(-1).children.push(element); else root=element;
    if (!tag.endsWith('/')) stack.push(element);
  }
  if (!root || root.kind !== 'svg') throw new Error('Expected standalone SVG');
  return root;
}

export function svgPathToContours(d) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  const contours=[];
  let i=0,command='',x=0,y=0,originX=0,originY=0,current,previous='',lastC,lastQ;
  const read=()=>{ if(i>=tokens.length || /[a-zA-Z]/.test(tokens[i]))throw new Error(`Malformed path ${d}`); return Number(tokens[i++]); };
  const point=(relative)=>[read()+(relative?x:0),read()+(relative?y:0)];
  const ensure=()=>{ if(!current)throw new Error('Path must begin with M'); };
  const line=(px,py)=>{ensure();current.points.push({x:px,y:py});x=px;y=py;};
  const cubic=(c1,c2,end)=>{ensure();current.points.at(-1).out=c1;current.points.push({x:end[0],y:end[1],in:c2});x=end[0];y=end[1];lastC=c2;};
  while(i<tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) command=tokens[i++];
    const upper=command.toUpperCase(), relative=command!==upper;
    if(upper==='M') { const p=point(relative);x=p[0];y=p[1];originX=x;originY=y;current={points:[{x,y}],closed:false};contours.push(current);command=relative?'l':'L'; }
    else if(upper==='L') { const p=point(relative);line(...p); }
    else if(upper==='H') line(read()+(relative?x:0),y);
    else if(upper==='V') line(x,read()+(relative?y:0));
    else if(upper==='C') { const c1=point(relative),c2=point(relative),end=point(relative);cubic(c1,c2,end); }
    else if(upper==='S') { const c1=(previous==='C'||previous==='S')&&lastC?[2*x-lastC[0],2*y-lastC[1]]:[x,y];const c2=point(relative),end=point(relative);cubic(c1,c2,end); }
    else if(upper==='Q'||upper==='T') { const q=upper==='Q'?point(relative):(previous==='Q'||previous==='T')&&lastQ?[2*x-lastQ[0],2*y-lastQ[1]]:[x,y];const end=point(relative);const c1=[x+2/3*(q[0]-x),y+2/3*(q[1]-y)],c2=[end[0]+2/3*(q[0]-end[0]),end[1]+2/3*(q[1]-end[1])];cubic(c1,c2,end);lastQ=q; }
    else if(upper==='Z') { ensure();current.closed=true;const first=current.points[0],last=current.points.at(-1);if(current.points.length>1&&Math.abs(first.x-last.x)<1e-8&&Math.abs(first.y-last.y)<1e-8){first.in=last.in;current.points.pop();}x=originX;y=originY;command=''; }
    else throw new Error(`Unsupported SVG command ${command}`);
    previous=upper;
    if(upper!=='C'&&upper!=='S')lastC=null;
    if(upper!=='Q'&&upper!=='T')lastQ=null;
  }
  return contours;
}

function contourXml(contour) {
  const area=contour.points.reduce((a,p,i)=>{const q=contour.points[(i+1)%contour.points.length];return a+p.x*q.y-q.x*p.y;},0);
  return `<PointsPath id="${nextId()}" name="Path" isClosed="${contour.closed}" isClockwise="${area>=0}">${contour.points.map(p=>{
    const attrs=`x="${n(p.x)}" y="${n(p.y)}" id="${nextId()}"`;
    if(!p.in&&!p.out)return `<StraightVertex ${attrs}/>`;
    const inv=p.in?[p.in[0]-p.x,p.in[1]-p.y]:[0,0],out=p.out?[p.out[0]-p.x,p.out[1]-p.y]:[0,0];
    return `<CubicDetachedVertex ${attrs} inRotation="${n(Math.atan2(inv[1],inv[0]))}" inDistance="${n(Math.hypot(...inv))}" outRotation="${n(Math.atan2(out[1],out[0]))}" outDistance="${n(Math.hypot(...out))}"/>`;
  }).join('')}</PointsPath>`;
}
function paintXml(a,name) {
  let result='';
  if(a.fill!=='none') { const id=nextId();paints.set(`${name}:fill`,id);result+=`<Fill id="${nextId()}" name="Fill"><SolidColor id="${id}" name="Color" colorValue="${color(a.fill||palette.ink)}"/></Fill>`; }
  if(a.stroke) result+=`<Stroke id="${nextId()}" name="Stroke" thickness="${a['stroke-width']||1}" cap="${a['stroke-linecap']||'butt'}" join="${a['stroke-linejoin']||'miter'}"><SolidColor id="${nextId()}" name="Color" colorValue="${color(a.stroke)}"/></Stroke>`;
  return result;
}
function convert(element,namespace='') {
  const a=element.attrs;
  if(['title','desc','defs'].includes(element.kind))return '';
  if(element.kind==='svg')return element.children.map(e=>convert(e,namespace)).reverse().join('');
  const name=namespace+(a.id||element.kind+'_'+serial);
  if(element.kind==='g') {
    const id=nextId();nodes.set(name,id);
    const [px,py]=namespace?[0,0]:(pivots[a.id]||[0,0]);
    const content=element.children.map(e=>convert(e,namespace)).reverse().join('');
    return `<Node id="${id}" name="${name}" x="${px}" y="${py}" opacity="${a.opacity||1}"><Node id="${nextId()}" name="${name}_content" x="${-px}" y="${-py}">${content}</Node></Node>`;
  }
  const id=nextId();nodes.set(name,id);
  let geometry='',x=0,y=0;
  if(element.kind==='path')geometry=svgPathToContours(a.d).map(contourXml).join('');
  else if(element.kind==='ellipse'||element.kind==='circle') { x=Number(a.cx);y=Number(a.cy);geometry=`<Ellipse id="${nextId()}" name="Path" width="${Number(a.rx||a.r)*2}" height="${Number(a.ry||a.r)*2}"/>`; }
  else if(element.kind==='rect'){x=Number(a.x)+Number(a.width)/2;y=Number(a.y)+Number(a.height)/2;geometry=`<Rectangle id="${nextId()}" name="Path" width="${a.width}" height="${a.height}" cornerRadiusTL="${a.rx||0}"/>`;}
  else throw new Error(`Unsupported SVG element ${element.kind}`);
  let shape=`<Shape id="${id}" name="${name}" x="${x}" y="${y}" opacity="${a.opacity||1}">${geometry}${paintXml(a,name)}</Shape>`;
  if(a.transform) {const r=a.transform.match(/^rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)$/);if(!r)throw new Error(`Unsupported transform ${a.transform}`);shape=`<Node id="${nextId()}" name="${name}_rotate" x="${r[2]}" y="${r[3]}" rotation="${n(Number(r[1])*Math.PI/180)}"><Node id="${nextId()}" name="${name}_offset" x="${-Number(r[2])}" y="${-Number(r[3])}">${shape}</Node></Node>`;}
  return shape;
}

function propertiesXml(target,properties,duration=60) {
  const id=typeof target==='string'&&target.startsWith('0:')?target:nodes.get(target);
  if(!id)throw new Error(`Missing key target ${target}`);
  return `<KeyedObject id="${nextId()}" objectId="${id}">${Object.entries(properties).map(([property,data])=>{
    const incoming=Array.isArray(data)?data:[data];
    const values=incoming.every(v=>v===incoming[0])?[incoming[0]]:incoming;
    const keyType=property==='colorValue'?'KeyFrameColor':'KeyFrameDouble';
    return `<KeyedProperty id="${nextId()}" property="${property}">${values.map((value,i)=>{
      const frame=Math.round(duration*i/Math.max(1,values.length-1));
      return `<${keyType} id="${nextId()}" frame="${frame}" value="${property==='colorValue'?value:n(value)}" interpolationType="${property==='colorValue'?'linear':'cubic'}"${property==='colorValue'?'':' interpolatorId="0:9"'}/>`;
    }).join('')}</KeyedProperty>`;
  }).join('')}</KeyedObject>`;
}
const animations=[];
function animation(name,seconds,loop,targets) {
  const id=nextId(),frames=Math.max(1,Math.round(seconds*60));
  animations.push(`<LinearAnimation id="${id}" name="${name}" duration="${frames}" fps="60" loopValue="${loop?'loop':'oneShot'}">${targets.map(([target,properties])=>propertiesXml(target,properties,frames)).join('')}</LinearAnimation>`);
  return id;
}
const radians=values=>values.map(v=>v*Math.PI/180);
function poseFor(state) {
  const jump=height=>({y:[216,222,216-height,218,213,216],scaleX:[1,1.1,.92,1.09,.98,1],scaleY:[1,.9,1.08,.91,1.02,1],rotation:radians([0,-2,2,-1,0,0])});
  let pose={y:[216,214.5,216],scaleX:[1,1.012,1],scaleY:[1,.982,1],rotation:[0,0]};
  if(state==='idle_bored')pose={...pose,rotation:radians([0,-4,3,0]),scaleY:[1,1.025,.98,1]};
  if(state==='idle_sleep')pose={...pose,rotation:radians([5,7,5]),scaleY:[1,.978,1]};
  if(state==='wave_hello')pose=jump(10);
  if(state==='teach_talk')pose={...pose,rotation:radians([0,2,-1,0])};
  if(state==='teach_point')pose={...pose,rotation:radians([0,-3,-3,0])};
  if(state==='teach_think')pose={...pose,rotation:radians([0,-5,-5,0])};
  if(state==='teach_idea')pose=jump(7);
  if(state==='teach_code'||state==='loading')pose={...pose,y:[216,217,216,217,216],rotation:radians([0,1,0,-1,0])};
  if(state==='answer_correct')pose=jump(23);
  if(state==='answer_correct_combo')pose=jump(30);
  if(state==='answer_wrong')pose={y:[216,222,226,226,214,216],rotation:radians([0,-5,13,9,-3,0]),scaleX:[1,1.05,1.13,1.1,.97,1],scaleY:[1,.95,.83,.87,1.03,1]};
  if(state==='answer_almost')pose={...pose,rotation:radians([0,-9,-9,0])};
  if(state==='timer_hurry')pose={...pose,x:[128,126,130,126,130,128],rotation:radians([0,-2,2,-2,2,0])};
  if(state==='lesson_complete')pose={y:[216,221,193,218,201,218,216],scaleX:[1,1.1,.93,1.08,.94,1.06,1],scaleY:[1,.9,1.07,.92,1.06,.94,1],rotation:[0,0]};
  if(state==='perfect_score')pose={y:[216,220,187,187,219,216],rotation:radians([0,-8,0,360,360,360]),scaleX:[1,1.08,.93,1,1.09,1],scaleY:[1,.92,1.07,1,.91,1]};
  if(state==='streak_up')pose=jump(15);
  if(state==='streak_lost')pose={...pose,y:[216,220,220,216,216],rotation:radians([0,5,5,-3,0])};
  if(state==='level_up')pose={y:[216,222,190,190,194,218,216],scaleX:[1,1.1,.94,1.02,1,1.08,1],scaleY:[1,.9,1.06,.99,1,.92,1],rotation:radians([0,-4,3,-3,2,-1,0])};
  if(state==='badge_unlock')pose=jump(12);
  if(state==='xp_gain')pose={...pose,y:[216,212,216],rotation:radians([0,-3,0])};
  if(state==='cheer_encourage')pose={...pose,y:[216,218,206,218,209,216],scaleY:[1,.97,1.03,.97,1.03,1]};
  if(state==='error_404')pose={...pose,rotation:radians([0,-5,5,0])};
  if(state==='offline')pose={...pose,rotation:radians([0,6,6,0])};
  return {x:[128,128],...pose};
}

export async function generateBittySource() {
  serial=20;nodes.clear();paints.clear();animations.length=0;
  const rigSvg=parseSvg(await readFile(path.join(workspace,'public/mascots/bitty/bitty-rig.svg'),'utf8'));
  const tipGroup=rigSvg.children.find(e=>e.attrs.id==='antenna_tip');
  tipGroup.children.forEach((element,index)=>{element.attrs.id=['tip_glow','tip_fill','tip_highlight'][index];});
  const shadow=convert(rigSvg.children.find(e=>e.attrs.id==='shadow'));
  rigSvg.children=rigSvg.children.filter(e=>e.attrs.id!=='shadow');
  // Pupils/eyes remain independent named groups. Rig children reverse into Rive's front-to-back order.
  let rig=convert(rigSvg);
  const rigId=nextId();nodes.set('rig',rigId);
  const comboId=nextId();nodes.set('combo_scale',comboId);
  const offsetId=nextId();nodes.set('rig_offset',offsetId);
  rig=`<Node id="${rigId}" name="rig" x="128" y="216"><Node id="${comboId}" name="combo_scale"><Node id="${offsetId}" name="rig_offset" x="-128" y="-216">${rig}</Node></Node></Node>`;
  // Eye alternatives are imported as vector layers, not bitmap assets.
  let facial='';
  for(const side of ['L','R']) {
    const cx=side==='L'?101:155;
    facial+=convert({kind:'g',attrs:{id:`star_${side}`,opacity:'0'},children:[{kind:'path',attrs:{d:Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?8:17;return`${i?'L':'M'}${cx+Math.cos(a)*r} ${104+Math.sin(a)*r}`;}).join(' ')+'Z',fill:palette.gold},children:[]} ]});
    facial+=convert({kind:'g',attrs:{id:`heart_${side}`,opacity:'0'},children:[{kind:'path',attrs:{d:`M${cx} 119C${cx-5} 115 ${cx-18} 105 ${cx-18} 96C${cx-18} 82 ${cx-5} 83 ${cx} 93C${cx+5} 83 ${cx+18} 82 ${cx+18} 96C${cx+18} 105 ${cx+5} 115 ${cx} 119Z`,fill:palette.coral},children:[]} ]});
    facial+=convert({kind:'g',attrs:{id:`spiral_${side}`,opacity:'0'},children:[{kind:'path',attrs:{d:`M${cx} 104c-6-9-17 1-10 10 8 11 27 0 21-14-6-16-31-10-29 10`,fill:'none',stroke:palette.ink,'stroke-width':'3.5','stroke-linecap':'round'},children:[]} ]});
  }
  rig=rig.replace(/(<Node[^>]+name="rig_offset"[^>]*>)/,`$1${facial}`);
  const placement={'whiteboard':[178,132,78],laptop:[79,167,101],bulb:[192,22,51],trophy:[171,162,65],'level-badge':[169,161,71],'streak-fire':[188,129,60],confetti:[0,0,96],star:[190,70,35],heart:[200,68,40],coffee:[196,171,49],question:[204,34,40],exclamation:[210,24,34]};
  let props='';
  for(const prop of propIds){const svg=parseSvg(await readFile(path.join(workspace,`public/mascots/bitty/props/${prop}.svg`),'utf8'));const[x,y,size]=placement[prop],id=nextId();nodes.set(`prop_${prop}`,id);props+=`<Node id="${id}" name="prop_${prop}" x="${x}" y="${y}" opacity="0"><Node id="${nextId()}" name="${prop}_scale" scaleX="${size/96}" scaleY="${size/96}">${convert(svg,prop+'_')}</Node></Node>`;}
  let particles='';
  for(let i=0;i<14;i++){const id=nextId();nodes.set(`confetti_${i}`,id);particles+=`<Shape id="${id}" name="confetti_${i}" x="128" y="119" opacity="0"><Rectangle id="${nextId()}" width="${i%2?4:6}" height="${i%2?8:4}" cornerRadiusTL="1"/><Fill id="${nextId()}"><SolidColor id="${nextId()}" colorValue="${color([palette.gold,palette.coral,palette.mint][i%3])}"/></Fill></Shape>`;}
  const cable=convert({kind:'g',attrs:{id:'network_cable',opacity:'0'},children:[{kind:'path',attrs:{d:'M53 188q30-26 60 0m30 0q31-26 61 0',stroke:palette.ink,'stroke-width':'5','stroke-linecap':'round',fill:'none'},children:[]},{kind:'rect',attrs:{x:'102',y:'179',width:'13',height:'17',rx:'3',fill:palette.coral},children:[]},{kind:'rect',attrs:{x:'139',y:'179',width:'13',height:'17',rx:'3',fill:palette.coral},children:[]},{kind:'path',attrs:{d:'m124 172-4 9 9 4-5 9',stroke:palette.coral,'stroke-width':'3','stroke-linecap':'round',fill:'none'},children:[]}]});
  const bubble=convert({kind:'g',attrs:{id:'sleep_bubble',opacity:'0'},children:[{kind:'circle',attrs:{cx:'146',cy:'143',r:'9',fill:palette.mint,opacity:'.65'},children:[]}]});
  const states=Object.keys(TIMELINES),mainAnimationIds={},fxAnimationIds={};
  const isCelebrate=s=>['answer_correct','answer_correct_combo','lesson_complete','perfect_score','streak_up','level_up','badge_unlock','cheer_encourage'].includes(s);
  const mouthNames=['closed','open_A','open_E','open_O','smile','sad','wow'];
  for(const state of states){const t=TIMELINES[state],celebrate=isCelebrate(state),worried=state==='answer_wrong'||state==='streak_lost',sleep=state==='idle_sleep',thinking=state==='teach_think';
    const mouth=state==='teach_talk'||sleep||thinking?'closed':worried?'sad':['error_404','offline','idle_bored','timer_hurry'].includes(state)?'wow':'smile';
    const eyeStyle=state==='perfect_score'?'heart':['answer_correct','answer_correct_combo'].includes(state)?'star':state==='answer_wrong'?'spiral':'round';
    const bodyPose=poseFor(state);
    if(state==='perfect_score')bodyPose.y=bodyPose.y.map(value=>value-88);
    const targets=[['rig',bodyPose],['rig_offset',{y:state==='perfect_score'?-128:-216}]];
    for(const side of ['L','R']){
      const wink=state==='answer_almost'&&side==='R',close=sleep||state==='idle_blink'||wink;
      targets.push([`pupil_${side}`,{opacity:state==='answer_wrong'?[1,0,0,1]:close||eyeStyle!=='round'?0:1}],[`eyelid_${side}`,{opacity:close?1:0}]);
      for(const variant of ['star','heart','spiral'])targets.push([`${variant}_${side}`,{opacity:eyeStyle===variant?[0,1,1,variant==='spiral'?0:1]:0}]);
      targets.push([`ear_${side}`,{rotation:radians(sleep?[side==='L'?-12:12,side==='L'?-15:15,side==='L'?-12:12]:celebrate?[0,side==='L'?-12:10,side==='L'?6:-5,0]:[0,side==='L'?-3:3,0])}]);
      let rotation=[0,0];if(side==='R'&&state==='wave_hello')rotation=[0,-140,-105,-145,-105,-132,0];else if(state==='answer_wrong')rotation=side==='R'?[0,-125,-125,0]:[0,125,125,0];else if(celebrate)rotation=side==='R'?[0,-138,-128,0]:[0,138,128,0];else if(state==='teach_code')rotation=side==='R'?[0,-36,-29,-36,0]:[0,30,36,30,0];else if(side==='R'&&thinking)rotation=[0,-103,-103,0];else if(side==='R'&&state==='teach_point')rotation=[0,-88,-88,0];else if(side==='R'&&state==='idle_bored')rotation=[0,-127,-115,-127,0];else if(side==='R'&&state==='teach_talk')rotation=[0,-25,-8,-25,0];
      targets.push([`arm_${side}`,{rotation:radians(rotation)}]);
    }
    for(const variant of mouthNames)targets.push([`mouth_${variant}`,{opacity:variant===mouth?(worried?[1,1,1,0]:1):variant==='smile'&&worried?[0,0,0,1]:0}]);
    targets.push(['tongue',{opacity:mouth==='smile'?1:0}],['tail',{rotation:radians([0,-8,2,0])}],['antenna_stem',{rotation:radians(celebrate?[0,-16,10,-4,0]:[0,-4,3,0])}],['antenna_tip',{rotation:radians(celebrate?[0,-16,10,-4,0]:[0,-4,3,0])}]);
    const emotionTip=state==='answer_wrong'||state==='timer_hurry'?palette.coral:thinking||state==='teach_idea'?palette.gold:sleep||state==='streak_lost'||state==='offline'||state==='error_404'?palette.ink:palette.green;
    for(const paint of ['tip_fill','tip_glow'])targets.push([paints.get(paint+':fill'),{colorValue:state==='answer_wrong'||state==='streak_lost'?[color(emotionTip),color(emotionTip),color(emotionTip),color(palette.green)]:color(emotionTip)}]);
    if(state==='loading')targets.push(['leg_L',{rotation:radians([0,12,-12,0])}],['leg_R',{rotation:radians([0,-12,12,0])}]);else targets.push(['leg_L',{rotation:radians(state==='idle_bored'?[0,0,-9,0,-9,0]:[0,0])}],['leg_R',{rotation:[0,0]}]);
    mainAnimationIds[state]=animation(state,t.duration/1000,t.loop,targets);
    const visible=new Set();if(state==='lesson_complete'||state==='perfect_score')visible.add('trophy');if(state==='teach_code'||state==='loading')visible.add('laptop');if(state==='teach_think')visible.add('question');if(state==='teach_point')visible.add('whiteboard');if(state==='teach_idea')visible.add('bulb');if(state==='level_up'||state==='badge_unlock')visible.add('level-badge');if(state==='streak_up'||state==='answer_correct_combo'||state==='streak_lost')visible.add('streak-fire');if(state==='idle_bored')visible.add('coffee');if(state==='cheer_encourage')visible.add('heart');if(state==='timer_hurry')visible.add('exclamation');if(state==='xp_gain')visible.add('star');if(state==='offline')visible.add('question');
    const fxTargets=propIds.map(p=>[`prop_${p}`,{opacity:visible.has(p)?(state==='streak_lost'?[1,.2,.45]:[0,1,1,1]):0,scaleX:p==='level-badge'&&state==='level_up'?[.2,1,.2,1]:[1,1],scaleY:[1,1]}]);
    if(state==='xp_gain')fxTargets.push(['prop_star',{x:[190,202,222],y:[80,50,24]}]);else fxTargets.push(['prop_star',{x:190,y:70}]);
    fxTargets.push(['network_cable',{opacity:state==='error_404'||state==='offline'?1:0}],['sleep_bubble',{opacity:sleep?.65:0,scaleX:sleep?[1,1.35,1]:1,scaleY:sleep?[1,1.35,1]:1}]);
    for(let i=0;i<14;i++){const active=['lesson_complete','perfect_score','level_up','badge_unlock'].includes(state),angle=-Math.PI+i*Math.PI/13,distance=63+i%4*13;fxTargets.push([`confetti_${i}`,{opacity:active?[0,1,1,0]:0,x:active?[128,128+Math.cos(angle)*distance,128+Math.cos(angle)*distance]:128,y:active?[119,69+Math.sin(angle)*distance,205]:119,rotation:active?[0,i%2?3.6:-3.14]:0}]);}
    fxAnimationIds[state]=animation(`FX_${state}`,t.duration/1000,t.loop,fxTargets);
  }
  const idleFaceId=animation('Face_rest',1,true,[]),visemeIds=mouthNames.slice(0,5).concat('wow').map((mouth,i)=>animation(`Face_viseme_${i}`,1,true,mouthNames.map(v=>[`mouth_${v}`,{opacity:v===mouth?1:0}]).concat([['tongue',{opacity:['smile','open_A','open_E'].includes(mouth)?1:0}]])));
  const lookXIds=[-1,0,1].map(v=>animation(`LookX_${v}`,1,true,['L','R'].map(side=>[`pupil_${side}`,{x:(side==='L'?101:155)+v*4}])));
  const lookYIds=[-1,0,1].map(v=>animation(`LookY_${v}`,1,true,['L','R'].map(side=>[`pupil_${side}`,{y:104+v*5}])));
  const comboPoseIds=[0,3,5,10].map(v=>animation(`Combo_${v}`,1,true,[['combo_scale',{scaleX:1+v*.002,scaleY:1+v*.002}]]));
  const pointPoseIds=[-1,1].map(v=>animation(`Point_${v<0?'left':'right'}`,1,true,[['arm_L',{rotation:v<0?88*Math.PI/180:0}],['arm_R',{rotation:v>0?-88*Math.PI/180:0}],['prop_whiteboard',{x:v<0?0:178}]]));
  const xpPoseIds=[0,999].map(v=>animation(`XP_${v}`,1,true,[['prop_star',{scaleX:.6+v/999*.7,scaleY:.6+v/999*.7}]]));
  const moodPoseIds=[0,1,2,3,4].map(v=>{
    const moodTip=[palette.green,palette.gold,palette.ink,palette.coral,palette.green][v],mouth=v===1?'closed':v===2?'sad':v===3?'wow':'smile';
    const targets=mouthNames.map(m=>[`mouth_${m}`,{opacity:m===mouth?1:0}]);
    targets.push(['tongue',{opacity:mouth==='smile'?1:0}]);
    for(const side of ['L','R']){targets.push([`pupil_${side}`,{opacity:v===3||v===4?0:1}],[`star_${side}`,{opacity:v===4?1:0}],[`spiral_${side}`,{opacity:v===3?1:0}]);}
    for(const paint of ['tip_fill','tip_glow'])targets.push([paints.get(paint+':fill'),{colorValue:color(moodTip)}]);
    return animation(`Mood_${v}`,1,true,targets);
  });
  const thinkLookId=animation('Think_look_up',2.4,true,['L','R'].map(side=>[`pupil_${side}`,{y:99}]));
  const codeEyesId=animation('Code_scan_lines',2,true,['L','R'].map(side=>[`pupil_${side}`,{x:[(side==='L'?101:155)-3,(side==='L'?101:155)+3,(side==='L'?101:155)-3],y:[102,104,106,102]}]));
  const inputs=new Map();const input=(type,name,value)=>{const id=nextId();inputs.set(name,id);return `<StateMachine${type} id="${id}" name="${name}"${value!==undefined?` value="${value}"`:''}/>`;};
  const inputsXml=[...Object.keys(TRIGGER_TIMELINES),'play'].map(name=>input('Trigger',name)).join('')+['isTalking','isThinking','isSleeping','isCoding'].map(name=>input('Bool',name,false)).join('')+['viseme','combo','lookX','lookY','xp','mood','stateIndex','pointDirection'].map(name=>input('Number',name,name==='pointDirection'?1:0)).join('');
  const condition=(kind,name,value,op='equal')=>`<Transition${kind}Condition id="${nextId()}" inputId="${inputs.get(name)}"${kind==='Number'?` value="${value}"`:''}${kind==='Trigger'?'':` opValue="${op}"`}/>`;
  const transition=(destination,conds='',exit=false,actions='')=>`<StateTransition id="${nextId()}" stateToId="${destination}" duration="80"${exit?' enableExitTime="true" exitTimeIsPercetange="true" exitTime="100"':''}>${conds}${actions}</StateTransition>`;
  function timelineLayer(name,ids){const stateIds=Object.fromEntries(states.map(s=>[s,nextId()]));let any='';for(const s of states)any+=transition(stateIds[s],condition('Trigger','play')+condition('Number','stateIndex',states.indexOf(s)));for(const[trigger,s]of Object.entries(TRIGGER_TIMELINES))any+=transition(stateIds[s],condition('Trigger',trigger),false,`<ListenerNumberChange id="${nextId()}" inputId="${inputs.get('stateIndex')}" value="${states.indexOf(s)}"/>`);const base=stateIds.idle_breathe;const idleBooleans={isSleeping:'idle_sleep',isCoding:'teach_code',isThinking:'teach_think',isTalking:'teach_talk'};
    const content=states.map((s,i)=>{let exits='';if(!TIMELINES[s].loop)exits=transition(base,'',true);if(s==='idle_breathe')for(const[b,d]of Object.entries(idleBooleans))exits+=transition(stateIds[d],condition('Bool',b));for(const[b,d]of Object.entries(idleBooleans))if(s===d)exits+=transition(base,condition('Bool',b,undefined,'notEqual')+condition('Number','stateIndex',i,'notEqual'));return`<AnimationState id="${stateIds[s]}" x="${160+i%7*160}" y="${Math.floor(i/7)*140}" animationId="${ids[s]}" reset="true" stateName="${s}">${exits}</AnimationState>`;}).join('');
    return `<StateMachineLayer id="${nextId()}" name="${name}"><AnyState id="${nextId()}" x="0" y="-170">${any}</AnyState><ExitState id="${nextId()}" x="1400" y="-170"/><EntryState id="${nextId()}" x="0" y="0">${transition(base)}</EntryState>${content}</StateMachineLayer>`;
  }
  const faceRest=nextId(),faceTalk=nextId();
  const faceLayer=`<StateMachineLayer id="${nextId()}" name="Face"><AnyState id="${nextId()}" x="0" y="-160"/><ExitState id="${nextId()}" x="600" y="-160"/><EntryState id="${nextId()}" x="0" y="0">${transition(faceRest)}</EntryState><AnimationState id="${faceRest}" x="160" y="0" animationId="${idleFaceId}">${transition(faceTalk,condition('Bool','isTalking'))}</AnimationState><BlendState1DInput id="${faceTalk}" x="380" y="0" inputId="${inputs.get('viseme')}">${visemeIds.map((id,i)=>`<BlendAnimation1D id="${nextId()}" animationId="${id}" value="${i}"/>`).join('')}${transition(faceRest,condition('Bool','isTalking',undefined,'notEqual'))}</BlendState1DInput></StateMachineLayer>`;
  const blendLayer=(name,inputName,ids,values)=>{const blend=nextId();return`<StateMachineLayer id="${nextId()}" name="${name}"><AnyState id="${nextId()}" x="0" y="-160"/><ExitState id="${nextId()}" x="480" y="-160"/><EntryState id="${nextId()}" x="0" y="0">${transition(blend)}</EntryState><BlendState1DInput id="${blend}" x="200" y="0" inputId="${inputs.get(inputName)}">${ids.map((id,i)=>`<BlendAnimation1D id="${nextId()}" animationId="${id}" value="${values[i]}"/>`).join('')}</BlendState1DInput></StateMachineLayer>`;};
  const conditionalBlendLayer=(name,inputName,ids,values,activeIndices)=>{
    const rest=nextId(),blend=nextId(),restAnimation=animation(`${name}_rest`,1,true,[]);
    const enters=activeIndices.map(i=>transition(blend,condition('Number','stateIndex',i))).join(''),exit=transition(rest,activeIndices.map(i=>condition('Number','stateIndex',i,'notEqual')).join(''));
    return`<StateMachineLayer id="${nextId()}" name="${name}"><AnyState id="${nextId()}" x="0" y="-160"/><ExitState id="${nextId()}" x="600" y="-160"/><EntryState id="${nextId()}" x="0" y="0">${transition(rest)}</EntryState><AnimationState id="${rest}" x="160" y="0" animationId="${restAnimation}">${enters}</AnimationState><BlendState1DInput id="${blend}" x="380" y="0" inputId="${inputs.get(inputName)}">${ids.map((id,i)=>`<BlendAnimation1D id="${nextId()}" animationId="${id}" value="${values[i]}"/>`).join('')}${exit}</BlendState1DInput></StateMachineLayer>`;
  };
  const conditionalAnimationLayer=(name,id,index)=>{
    const rest=nextId(),active=nextId(),restId=animation(`${name}_rest`,1,true,[]);
    return `<StateMachineLayer id="${nextId()}" name="${name}"><AnyState id="${nextId()}" x="0" y="-160"/><ExitState id="${nextId()}" x="600" y="-160"/><EntryState id="${nextId()}" x="0" y="0">${transition(rest)}</EntryState><AnimationState id="${rest}" x="160" y="0" animationId="${restId}">${transition(active,condition('Number','stateIndex',index))}</AnimationState><AnimationState id="${active}" x="380" y="0" animationId="${id}" reset="true">${transition(rest,condition('Number','stateIndex',index,'notEqual'))}</AnimationState></StateMachineLayer>`;
  };
  const machine=`<StateMachine id="0:7" name="MascotSM">${inputsXml}${timelineLayer('Body',mainAnimationIds)}${faceLayer}${timelineLayer('FX',fxAnimationIds)}${blendLayer('LookX','lookX',lookXIds,[-1,0,1])}${blendLayer('LookY','lookY',lookYIds,[-1,0,1])}${conditionalBlendLayer('Combo','combo',comboPoseIds,[0,3,5,10],[states.indexOf('answer_correct_combo')])}${conditionalBlendLayer('Point','pointDirection',pointPoseIds,[-1,1],[states.indexOf('teach_point')])}${conditionalBlendLayer('XP','xp',xpPoseIds,[0,999],[states.indexOf('xp_gain')])}${conditionalBlendLayer('Mood','mood',moodPoseIds,[0,1,2,3,4],[0,2])}${conditionalAnimationLayer('ThinkLook',thinkLookId,states.indexOf('teach_think'))}${conditionalAnimationLayer('CodeEyes',codeEyesId,states.indexOf('teach_code'))}</StateMachine>`;
  const scene=`<Rive version="1" kind="fragment"><Artboard id="0:2" name="Bitty" width="360" height="360" styleId="0:5" defaultStateMachineId="0:7"><LayoutComponentStyle id="0:5" name="Artboard Style"/><CubicEaseInterpolator id="0:9" x1=".22" y1="1" x2=".36" y2="1"/><Node id="${nextId()}" name="animation_safe_area" x="52" y="52">${particles}${props}${bubble}${cable}${rig}${shadow}</Node>${machine}${animations.join('')}</Artboard></Rive>\n`;
  await writeFile(path.join(project,'scene.rml'),scene,'utf8');
  const contract={version:1,artboard:'Bitty',stateMachine:'MascotSM',scriptFree:true,artboardSize:[360,360],sourceSize:[256,256],animationPadding:52,palette,states:states.map((state,index)=>({state,index,...TIMELINES[state]})),inputs:{triggers:[...Object.keys(TRIGGER_TIMELINES),'play'],booleans:['isTalking','isThinking','isSleeping','isCoding'],numbers:{viseme:[0,5],combo:[0,10],lookX:[-1,1],lookY:[-1,1],xp:[0,999],mood:[0,4],stateIndex:[0,26],pointDirection:[-1,1]}}};
  await writeFile(path.join(project,'contract.json'),JSON.stringify(contract,null,2)+'\n','utf8');
  return {sceneBytes:Buffer.byteLength(scene),targets:nodes.size,animations:animations.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await generateBittySource()));
