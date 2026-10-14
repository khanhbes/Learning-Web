'use client';

import { useEffect, useRef } from 'react';
import { useRive, RuntimeLoader, Layout, Fit, Alignment, Rive } from '@rive-app/react-canvas';
import riveWasm from '@rive-app/canvas/rive.wasm?url';
import fallbackWasm from '@rive-app/canvas/rive_fallback.wasm?url';
import { BITTY_RIVE } from './rive-config';
import type { MascotInputs, MascotTimeline } from '../../shared/mascot-motion.mjs';

// Runtime and WASM come from the same locked package; no runtime CDN request.
RuntimeLoader.setWasmUrl(riveWasm);
RuntimeLoader.setWasmFallbackUrl(fallbackWasm);
Rive.suppressDeprecationWarnings = ['state-machine-inputs'];

export interface RiveMascotProps {
  buffer: ArrayBuffer;
  state: MascotTimeline;
  inputs: MascotInputs;
  eventKey: string;
  paused: boolean;
  onReady: () => void;
  onFailure: () => void;
  pointDirection?: 'left' | 'right';
}
export default function RiveMascot({buffer,state,inputs,eventKey,paused,onReady,onFailure,pointDirection='right'}:RiveMascotProps) {
  const lastAction=useRef('');
  const {rive,RiveComponent}=useRive({
    buffer,artboard:BITTY_RIVE.artboard,stateMachine:BITTY_RIVE.stateMachine,
    autoplay:true,layout:new Layout({fit:Fit.Contain,alignment:Alignment.Center}),
    onLoadError:onFailure,
  },{shouldUseIntersectionObserver:true,useDevicePixelRatio:true});
  useEffect(()=>{
    if(!rive)return;
    const list=rive.stateMachineInputs(BITTY_RIVE.stateMachine);
    const index=list?.find(i=>i.name==='stateIndex'),play=list?.find(i=>i.name==='play');
    if(!index||!play||BITTY_RIVE.timelines.some(id=>!rive.animationNames.includes(id))){onFailure();return;}
    rive.resizeDrawingSurfaceToCanvas();onReady();
  },[rive,onFailure,onReady]);
  useEffect(()=>{
    if(!rive)return;
    const list=rive.stateMachineInputs(BITTY_RIVE.stateMachine);
    if(!list)return;
    const effective={...inputs,isTalking:inputs.isTalking||state==='teach_talk',isCoding:inputs.isCoding||state==='teach_code',isThinking:inputs.isThinking||state==='teach_think',isSleeping:inputs.isSleeping||state==='idle_sleep'};
    for(const[name,value]of Object.entries(effective)){
      const input=list.find(i=>i.name===name);
      if(input)input.value=value;
    }
    const pointing=list.find(i=>i.name==='pointDirection');if(pointing)pointing.value=pointDirection==='left'?-1:1;
    const index=list.find(i=>i.name==='stateIndex');
    if(index)index.value=BITTY_RIVE.timelines.indexOf(state);
    if(lastAction.current!==eventKey){list.find(i=>i.name==='play')?.fire();lastAction.current=eventKey;}
    if(paused)rive.stopRendering();else rive.startRendering();
  },[rive,state,inputs,eventKey,paused,pointDirection]);
  return <RiveComponent className="bitty-rive-canvas" aria-hidden="true" tabIndex={-1}/>;
}
