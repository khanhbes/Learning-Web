import { useEffect, useRef } from 'react';
import { useApp } from '../context';
import { useMascot } from './MascotProvider';

/** React to confirmed profile changes; no new reward or attempt API calls. */
export default function MascotSignals(){
  const{state}=useApp(),actor=useMascot();
  const previous=useRef({xp:state.xp,streak:state.streak});
  useEffect(()=>{actor.say('wave',{id:'welcome:session'});},[actor.say]);
  useEffect(()=>{
    const old=previous.current;previous.current={xp:state.xp,streak:state.streak};
    if(state.streak>old.streak)actor.say('streakUp',{id:`streak:${state.today}:${state.streak}`});
    else if(state.streak<old.streak)actor.say('streakLost',{id:`streak-lost:${state.today}`});
    if(state.xp>old.xp)actor.say('xp_gain',{id:`xp:${state.lastReward?.id??state.xp}`,xp:Math.min(999,state.xp-old.xp)});
  },[state.xp,state.streak,state.today,state.lastReward?.id,actor.say]);
  return null;
}
