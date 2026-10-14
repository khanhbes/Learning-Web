'use client';

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { TIMELINES } from '../../shared/mascot-motion.mjs';
import type { MascotTimeline } from '../../shared/mascot-motion.mjs';
import BittySvg, { BITTY_LABELS } from './BittySvg';
import { useMascot } from './MascotProvider';
import { useMotionPreference } from '../motionPreference';
import { BITTY_RIVE } from './rive-config';
import RiveBoundary from './RiveBoundary';
import './bitty-runtime.css';

const RiveArtwork=lazy(()=>import('./RiveMascot'));
let riveFile:Promise<ArrayBuffer>|null=null;
function loadFile(){
  riveFile??=(async()=>{
    const response=await fetch(BITTY_RIVE.src,{signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Rive asset unavailable');
    const bytes=await response.arrayBuffer();
    if(bytes.byteLength>BITTY_RIVE.maxBytes||String.fromCharCode(...new Uint8Array(bytes).slice(0,4))!=='RIVE')throw Error('Invalid Bitty binary');
    return bytes;
  })().catch(error=>{riveFile=null;throw error;});
  return riveFile;
}
export interface MascotProps {
  state?:MascotTimeline;
  size?:number;
  lookAt?:{x:number;y:number};
  onComplete?:()=>void;
  className?:string;
  viseme?:number;combo?:number;xp?:number;mood?:number;
  motionPaused?:boolean;
  renderer?:'auto'|'svg'|'rive';
  eventKey?:string|number;
  pointDirection?:'left'|'right';
  /** Legacy scene moods yield to a confirmed queued event. */
  followQueue?:boolean;
}
export default function Mascot({state:requested,size=160,lookAt,onComplete,className='',viseme,combo,xp,mood,motionPaused=false,renderer='auto',eventKey,pointDirection='right',followQueue=false}:MascotProps){
  const actor=useMascot(),reduced=useMotionPreference();
  // A result panel retains its confirmed celebration after the queue drains.
  // Returning to its legacy mood would replay a second celebration.
  const held=useRef<{state:MascotTimeline;id:string}|null>(null);
  if(requested!=='lesson_complete')held.current=null;
  if(followQueue&&requested==='lesson_complete'&&actor.active&&['lesson_complete','perfect_score','level_up','badge_unlock'].includes(actor.state))held.current={state:actor.state,id:actor.active.id};
  const queued=followQueue&&actor.active&&(!held.current||['lesson_complete','perfect_score','level_up','badge_unlock'].includes(actor.state));
  const state=queued?actor.state:held.current?.state??requested??actor.state;
  const key=String(eventKey??(requested&&!followQueue?state:queued?actor.active?.id:held.current?.id??state));
  const paused=reduced||motionPaused||actor.motionPaused;
  const inputs={...actor.inputs,...(viseme!==undefined?{viseme}:{}),...(combo!==undefined?{combo}:{}),...(xp!==undefined?{xp}:{}),...(mood!==undefined?{mood}:{}),...(lookAt?{lookX:Math.max(-1,Math.min(1,lookAt.x)),lookY:Math.max(-1,Math.min(1,lookAt.y))}:{})};
  const [buffer,setBuffer]=useState<ArrayBuffer|null>(null),[failed,setFailed]=useState(false),[ready,setReady]=useState(false),[visible,setVisible]=useState(true);
  const host=useRef<HTMLDivElement>(null);
  const wantRive=BITTY_RIVE.enabled&&renderer!=='svg'&&!reduced&&size>=90;
  useEffect(()=>{setFailed(false);setReady(false);if(!wantRive)return;let live=true;loadFile().then(value=>{if(live)setBuffer(value);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[wantRive]);
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting??true));
    if(host.current)observer.observe(host.current);return()=>observer.disconnect();
  },[]);
  const callback=useRef(onComplete);callback.current=onComplete;
  const completion=useRef({key:'',remaining:0,done:false});
  const completionKey=`${key}:${state}`;
  const hasCallback=!!onComplete;
  useEffect(()=>{
    if(completion.current.key!==completionKey)completion.current={key:completionKey,remaining:TIMELINES[state].duration,done:false};
    const pending=completion.current;
    if(!hasCallback||TIMELINES[state].loop||pending.done||!visible||(paused&&!reduced))return;
    if(reduced)pending.remaining=Math.min(pending.remaining,120);
    const started=performance.now();
    const timer=window.setTimeout(()=>{pending.done=true;callback.current?.();},pending.remaining);
    return()=>{clearTimeout(timer);pending.remaining=Math.max(0,pending.remaining-(performance.now()-started));};
  },[completionKey,state,hasCallback,reduced,paused,visible]);
  const loaded=useCallback(()=>setReady(true),[]),failure=useCallback(()=>{setFailed(true);setReady(false);},[]);
  const fallback=<BittySvg key={key} state={state} size={size} lookAt={{x:inputs.lookX,y:inputs.lookY}} viseme={inputs.viseme} combo={inputs.combo} xp={inputs.xp} mood={inputs.mood} motionPaused={paused||!visible||(ready&&!failed&&wantRive)} pointDirection={pointDirection}/>;
  return <div ref={host} className={`bitty-runtime ${className}`} style={{width:size,height:size}} data-state={state} data-renderer={wantRive&&!failed&&ready?'rive':'svg'}>
    <div className={wantRive&&!failed&&ready?'bitty-fallback-hidden':''}>{fallback}</div>
    {wantRive&&!failed&&buffer&&<div className={`bitty-rive-layer ${ready?'ready':''}`}><RiveBoundary onFailure={failure}><Suspense fallback={null}><RiveArtwork buffer={buffer} state={state} inputs={inputs} eventKey={key} paused={paused||!visible} onReady={loaded} onFailure={failure} pointDirection={pointDirection}/></Suspense></RiveBoundary></div>}
    {wantRive&&!failed&&ready&&<span className="bitty-runtime-label" role="img" aria-label={BITTY_LABELS[state]}/>}
  </div>;
}
export {Mascot};
