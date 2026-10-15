import {motion} from 'motion/react';
import {VisualPlayback,useVisualPlayback} from './VisualPlayback';
import LearningDataView from './LearningDataView';
import type {TeachingFlow} from './types';
export default function TeachingTrace({trace,identity}:{trace:NonNullable<TeachingFlow['trace']>;identity:string}){
  const playback=useVisualPlayback(trace.frames.length,identity),frame=trace.frames[playback.step];
  if(!frame)return null;
  return <section className="teaching-trace" aria-label="Mô phỏng ví dụ đang học" tabIndex={0} onKeyDown={playback.onKeyDown}>
    <p className="teaching-trace-caption" aria-live="polite">{frame.caption}</p>
    {frame.values?.length>0&&<div className="learning-array" role="list" aria-label="Trạng thái các phần tử">{frame.values.map((v:any,i:number)=><motion.div layout={!playback.reduced} role="listitem" key={i} className={'learning-cell '+(frame.active?.includes(i)?'trace-active':'')} animate={{scale:frame.active?.includes(i)&&!playback.reduced?1.06:1}} transition={{duration:playback.reduced?0:.18}}><b>{typeof v==='object'?JSON.stringify(v):String(v)}</b><small>#{i}</small></motion.div>)}</div>}
    <motion.div key={playback.step} initial={playback.reduced?false:{opacity:0}} animate={{opacity:1}} transition={{duration:playback.reduced?0:.15}}><LearningDataView value={frame.state} label="Trạng thái tại bước này" raw={false}/>{frame.memory&&<LearningDataView value={frame.memory} label="Bộ nhớ sau cập nhật" raw={false}/>}</motion.div>
    <label className="visual-timeline">Bước {playback.step+1}/{trace.frames.length}<input type="range" min="0" max={Math.max(0,trace.frames.length-1)} value={playback.step} aria-label="Tiến độ ví dụ đã giải" onChange={e=>playback.go(Number(e.target.value))}/></label>
    <VisualPlayback playback={playback} onChangeData={playback.reset} allowChangeData={false}/><small>{trace.note}</small>
  </section>;
}
