import { useContext } from 'react';
import { motion } from 'motion/react';
import { useMotionPreference } from './motionPreference';
import { AppContext } from './context';
import Bitty from './bitty/Mascot';
import type { MascotTimeline } from '../shared/mascot-motion.mjs';
// The catalog is shared with the authoritative reward service.
// @ts-ignore JavaScript content module
import { cosmetics } from '../shared/cosmetics.mjs';

export default function Mascot({ size = 160, mood = 'happy', skin, className = '', motionPaused = false }: { size?: number; mood?: string; skin?: string; className?: string; motionPaused?: boolean }) {
  const ctx = useContext(AppContext);
  const id = skin || ctx?.state.profile.skin || 'bitty';
  const item: any = cosmetics.find((c: any) => c.id === id) || cosmetics[0];
  const family = item.family || 'robot';
  const color = item.colors?.body || '#58cc02', accent = item.colors?.accent || '#46a302', light = item.colors?.light || '#e1f8c7';
  const preference = useMotionPreference(), reduced = motionPaused || preference;
  if(item.id==='bitty'){
    const moods:Record<string,MascotTimeline>={happy:'idle_breathe',wave:'wave_hello',celebrate:'lesson_complete',sleep:'idle_sleep',rest:'idle_sleep',thinking:'teach_think',think:'teach_think',explaining:'teach_talk',encouraging:'cheer_encourage',sad:'streak_lost',correct:'answer_correct',wrong:'answer_wrong',offline:'offline',loading:'loading'};
    return <Bitty size={size} state={moods[mood]??'idle_breathe'} className={`byte mascot-bitty ${className}`} motionPaused={reduced} followQueue={size>=90&&!motionPaused}/>;
  }
  const celebrate = mood === 'celebrate', rest = mood === 'sleep' || mood === 'rest', think = mood === 'thinking' || mood === 'think';
  const description = celebrate ? 'đang ăn mừng' : rest ? 'đang nghỉ' : think ? 'đang suy nghĩ' : mood === 'wave' ? 'đang chào bạn' : 'đồng hành cùng bạn';
  const animal = family !== 'robot';
  return <motion.div className={`byte mascot-${family} byte-${mood} ${className}`} style={{ width: size, height: size }}
    animate={reduced || rest ? { y: 0, rotate: 0, scaleX: 1, scaleY: 1 } : { y: celebrate ? [0, 2, -15, 1, -5, 0] : [0, -3, 0], rotate: celebrate ? [0, -3, 4, -2, 0, 0] : 0, scaleX: celebrate ? [1, 1.04, .97, 1.04, 1, 1] : 1, scaleY: celebrate ? [1, .96, 1.03, .96, 1, 1] : 1 }}
    transition={{ duration: reduced ? 0 : celebrate ? 1.15 : 3.4, repeat: reduced || rest ? 0 : celebrate ? 1 : Infinity, ease: 'easeInOut' }}>
    <svg viewBox="0 0 180 180" role="img" aria-label={`${item.name} ${description}`}>
      <ellipse cx="90" cy="166" rx="43" ry="7" fill="#dbe9d3" opacity=".7" />
      {animal ? <>
        {family === 'fox' && <motion.path d="M119 133q47-43 41 3q-3 30-38 15" fill={accent} stroke={accent} strokeWidth="4" animate={reduced ? {} : { rotate: [0, -7, 0] }} style={{ transformOrigin: '123px 145px' }} transition={{ duration: 2.4, repeat: Infinity }} />}
        {family === 'cat' && <motion.path d="M124 138q35 15 27-14" fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" animate={reduced ? {} : { rotate: [0, 9, 0] }} style={{ transformOrigin: '125px 139px' }} transition={{ duration: 2.6, repeat: Infinity }} />}
        <ellipse cx="89" cy="126" rx="39" ry="36" fill={color} />
        <ellipse cx="89" cy="134" rx="24" ry="25" fill={light} />
        <ellipse cx="65" cy="157" rx="16" ry="9" fill={accent} /><ellipse cx="112" cy="157" rx="16" ry="9" fill={accent} />
        <motion.g animate={reduced ? {} : { rotate: mood === 'wave' ? [0, -15, 0] : 0 }} style={{ transformOrigin: '53px 115px' }} transition={{ duration: 1, repeat: mood === 'wave' ? Infinity : 0 }}>
          <ellipse cx="46" cy={celebrate ? 103 : 124} rx="11" ry="20" transform={`rotate(${celebrate ? -40 : 25} 46 ${celebrate ? 103 : 124})`} fill={color} />
        </motion.g>
        <ellipse cx="134" cy={celebrate ? 103 : 124} rx="11" ry="20" transform={`rotate(${celebrate ? 40 : -25} 134 ${celebrate ? 103 : 124})`} fill={color} />
        {family === 'rabbit' ? <motion.g animate={reduced ? {} : { rotate: [0, -3, 0] }} style={{ transformOrigin: '90px 62px' }} transition={{ duration: 2.8, repeat: Infinity }}>
          <ellipse cx="62" cy="36" rx="15" ry="32" transform="rotate(-12 62 36)" fill={color} /><ellipse cx="115" cy="35" rx="15" ry="32" transform="rotate(10 115 35)" fill={color} />
          <ellipse cx="62" cy="34" rx="7" ry="23" transform="rotate(-12 62 34)" fill="#ffc7cf" /><ellipse cx="115" cy="33" rx="7" ry="23" transform="rotate(10 115 33)" fill="#ffc7cf" />
        </motion.g> : family === 'axolotl' ? <g stroke={accent} strokeWidth="9" strokeLinecap="round"><path d="M40 61 21 44m17 32L15 73m27 17L23 106M139 61l20-17m-18 32 24-3m-27 17 19 16" /></g> : <g><path d="M39 64 37 25q30 7 40 32M104 57q11-24 39-32l-2 40" fill={color} /><path d="m46 52 0-14 17 14m52 0 18-14-1 17" fill="#ffc7cf" /></g>}
        <rect x="33" y="45" width="113" height="76" rx={family === 'fox' ? 35 : 39} fill={color} />
        {family === 'fox' && <path d="M37 81q10 39 51 39q43 0 54-39l-36 14-17-12-17 12z" fill={light} />}
        <ellipse cx="50" cy="91" rx="10" ry="6" fill="#ffacbb" opacity=".65" /><ellipse cx="130" cy="91" rx="10" ry="6" fill="#ffacbb" opacity=".65" />
        {rest || celebrate ? <g stroke="#343b3a" strokeWidth="4" fill="none" strokeLinecap="round"><path d={celebrate ? 'M58 79q7-10 14 0m34 0q7-10 14 0' : 'M58 80q7 6 14 0m34 0q7 6 14 0'} /></g> : <motion.g fill="#343b3a" animate={reduced ? { scaleY: 1 } : { scaleY: [1, 1, .08, 1, 1] }} transition={{ duration: 4.2, times: [0,.74,.77,.8,1], repeat: reduced ? 0 : Infinity }} style={{ transformOrigin:'90px 79px' }}><ellipse cx={think ? 66 : 65} cy="79" rx="5" ry="8" /><ellipse cx={think ? 114 : 113} cy="79" rx="5" ry="8" /><circle cx="64" cy="76" r="2" fill="white" /><circle cx="112" cy="76" r="2" fill="white" /></motion.g>}
        <path d="m86 89 4 4 4-4z" fill="#aa636d" /><path d="M90 93v4m0 0q-6 5-10 0m10 0q6 5 10 0" stroke="#6a5155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {family === 'cat' && <path d="M39 88H24m16 8-14 4m115-12h15m-16 8 14 4" stroke={accent} strokeWidth="2" strokeLinecap="round" />}
        {item.variant === 'outfit' && <><path d="M51 111q39 14 77 0l-5 37H57z" fill={accent} /><path d="m65 109 24 15 24-15-24 27z" fill={light} /><circle cx="89" cy="136" r="5" fill="#ffc800" /></>}
        {item.variant === 'rare' && <><path d="m56 49-8-20 25 8 16-20 16 20 25-8-8 20z" fill="#ffc800" /><circle cx="90" cy="36" r="5" fill={accent} /><path d="m136 118 4 9 10 1-8 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#ffc800" /></>}
      </> : <>
        <path d="M61 144v15q0 7 11 7h9v-22m18 0v22h11q9 0 9-7v-15" fill={accent} />
        <rect x="51" y="105" width="78" height="48" rx="21" fill={color} /><rect x="65" y="117" width="50" height="25" rx="8" fill={accent} opacity=".6" />
        <path d="m85 122-8 7 8 7m12-14 8 7-8 7" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path d={celebrate ? 'M49 117Q22 100 24 80M131 117q27-21 26-37' : mood === 'wave' ? 'M49 117q-20 12-17 29M131 117q25-23 18-43' : mood === 'explaining' ? 'M49 117q-20 12-17 29M131 117q28-3 23-26' : 'M49 117q-20 12-17 29M131 117q23 10 19 28'} stroke={accent} strokeWidth="13" strokeLinecap="round" fill="none" animate={reduced || mood !== 'wave' ? {} : { rotate: [0, -6, 0] }} style={{ transformOrigin: '90px 117px' }} transition={{ duration: 1.1, repeat: Infinity }} />
        <path d="M90 34V18" stroke={accent} strokeWidth="6" /><circle cx="90" cy="15" r="8" fill="#ffc800" />
        <rect x="25" y="57" width="16" height="34" rx="8" fill={accent} /><rect x="139" y="57" width="16" height="34" rx="8" fill={accent} />
        <rect x="33" y="32" width="114" height="80" rx="29" fill={color} /><path d="M55 42h44" stroke="white" strokeWidth="8" strokeLinecap="round" opacity=".25" />
        <rect x="44" y="52" width="92" height="47" rx="18" fill="#193b32" />
        {rest || celebrate ? <path d={celebrate ? 'M59 77q7-11 14 0m32 0q7-11 14 0' : 'M59 75h14m32 0h14'} stroke={light} strokeWidth="5" fill="none" strokeLinecap="round" /> : <motion.g fill={light} animate={reduced ? { scaleY: 1 } : { scaleY: [1, 1, .08, 1, 1] }} transition={{ duration: 4.2, times: [0,.74,.77,.8,1], repeat: reduced ? 0 : Infinity }} style={{ transformOrigin:'90px 73px' }}><rect x={think ? 65 : 61} y="65" width="12" height="17" rx="6" /><rect x={think ? 108 : 104} y="65" width="12" height="17" rx="6" /></motion.g>}
        <path d={mood === 'sad' ? 'M83 90q7-7 14 0' : 'M83 86q7 7 14 0'} stroke={light} strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="55" cy="85" rx="5" ry="3" fill="#ffb0a3" /><ellipse cx="125" cy="85" rx="5" ry="3" fill="#ffb0a3" />
        {id === 'scholar' && <><path d="m39 35 51-20 51 20-51 20z" fill="#37465e" /><path d="M141 35v24" stroke="#ffc800" strokeWidth="3" /><circle cx="141" cy="61" r="4" fill="#ffc800" /></>}
        {id === 'algorithm' && <path d="M56 113h68v28H56zm8 5h15m-15 8h40m-40 8h28" stroke={light} strokeWidth="3" fill={accent} />}
        {id === 'scientist' && <><path d="m55 109 34 12 35-12 3 35H53z" fill="#f5f9fc" /><path d="M88 122v26" stroke="#b9d1da" strokeWidth="3" /><path d="m92 126 4 7 4-7" stroke={accent} strokeWidth="2" fill="none" /></>}
        {id === 'rainbow' && <g fill="none" strokeWidth="4"><path d="M62 140q28-36 56 0" stroke="#ff8baa" /><path d="M70 140q20-25 40 0" stroke="#ffc800" /><path d="M78 140q12-14 24 0" stroke="#67dcff" /></g>}
        {['mint','neon','pixel','aurora'].includes(id) && <><path d="M52 112h77v11H52z" fill={light} /><path d="m116 113 13 12-13 8" fill={accent} /><circle cx="90" cy="130" r="5" fill="#ffc800" /></>}
      </>}
      {think && <text x="151" y="31" fill={accent} fontSize="25" fontWeight="900">?</text>}
      {rest && <text x="145" y="42" fill={accent} fontSize="18" fontWeight="900">z</text>}
      {celebrate && <g fill="#ffc800"><path d="m20 30 3 6 6 2-5 4v7l-5-4-6 1 3-6-2-6 6 2z" /><path d="m158 14 3 5 6 1-4 5 1 5-6-2-5 3 1-6-4-4 6-1z" /></g>}
    </svg>
  </motion.div>;
}
