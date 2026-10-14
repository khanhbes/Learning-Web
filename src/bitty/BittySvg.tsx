import { useEffect, useId, useRef, useState } from 'react';
import { motion, type TargetAndTransition } from 'motion/react';
import { useMotionPreference } from '../motionPreference';
// @ts-ignore Shared browser/backend motion contract.
import { TIMELINES } from '../../shared/mascot-motion.mjs';
import './bitty-art.css';

export type BittyState =
  | 'idle_breathe' | 'idle_blink' | 'idle_look' | 'idle_bored' | 'idle_sleep'
  | 'wave_hello' | 'teach_talk' | 'teach_point' | 'teach_think' | 'teach_idea' | 'teach_code'
  | 'answer_correct' | 'answer_correct_combo' | 'answer_wrong' | 'answer_almost' | 'timer_hurry'
  | 'lesson_complete' | 'perfect_score' | 'streak_up' | 'streak_lost' | 'level_up' | 'badge_unlock' | 'xp_gain'
  | 'cheer_encourage' | 'loading' | 'error_404' | 'offline';

export interface BittySvgProps {
  state?: BittyState;
  size?: number;
  lookAt?: { x: number; y: number };
  viseme?: number;
  combo?: number;
  xp?: number;
  mood?: number;
  motionPaused?: boolean;
  className?: string;
  pointDirection?: 'left' | 'right';
  /** Standalone artwork only. The application queue owns its own completion. */
  onComplete?: () => void;
}

const palette = { mint: '#76DEC1', green: '#3AA58E', ink: '#243E4B', cream: '#FFF9E9', gold: '#F3CB65', coral: '#F4887E' };
const cubicOut = [0.22, 1, 0.36, 1] as const;
export const BITTY_LABELS: Record<BittyState, string> = {
  idle_breathe: 'Bitty đang thở nhẹ và đồng hành cùng bạn', idle_blink: 'Bitty chớp mắt', idle_look: 'Bitty nhìn theo hoạt động của bạn', idle_bored: 'Bitty ngáp và gõ chân chờ bạn', idle_sleep: 'Bitty ngủ gật',
  wave_hello: 'Bitty vẫy tay chào', teach_talk: 'Bitty đang giải thích', teach_point: 'Bitty chỉ vào bài học', teach_think: 'Bitty chống cằm suy nghĩ', teach_idea: 'Bitty tìm ra một ý tưởng', teach_code: 'Bitty gõ code trên laptop',
  answer_correct: 'Bitty nhảy mừng câu trả lời đúng', answer_correct_combo: 'Bitty ăn mừng chuỗi câu trả lời đúng', answer_wrong: 'Bitty hơi choáng, rồi đứng dậy động viên bạn thử lại', answer_almost: 'Bitty nháy mắt: bạn gần đúng rồi', timer_hurry: 'Bitty chú ý đến đồng hồ',
  lesson_complete: 'Bitty nhận cúp hoàn thành buổi học', perfect_score: 'Bitty ăn mừng kết quả hoàn hảo', streak_up: 'Bitty nâng ngọn lửa streak', streak_lost: 'Bitty cất ngọn lửa và động viên bạn bắt đầu lại', level_up: 'Bitty bay lên đón cấp độ mới', badge_unlock: 'Bitty mở huy hiệu mới', xp_gain: 'Bitty gửi XP về thanh tiến độ',
  cheer_encourage: 'Bitty cổ vũ: mình thử lại cùng nhau', loading: 'Bitty đang chạy và chờ tải', error_404: 'Bitty tìm đường bị mất với sợi cáp đứt', offline: 'Bitty kiểm tra dây mạng khi mất kết nối',
};
const labels = BITTY_LABELS;
const clamp = (value: number, low: number, high: number) => Number.isFinite(value) ? Math.max(low, Math.min(high, value)) : low > 0 ? low : 0;
const celebrations = new Set<BittyState>(['answer_correct', 'answer_correct_combo', 'lesson_complete', 'perfect_score', 'streak_up', 'level_up', 'badge_unlock', 'xp_gain', 'cheer_encourage']);

function bodyAnimation(state: BittyState, combo: number): TargetAndTransition {
  const jump = (height: number) => ({ y: [0, 5, -height, 2, -3, 0], scaleX: [1, 1.1, .92, 1.09, .98, 1], scaleY: [1, .9, 1.08, .91, 1.02, 1], rotate: [0, -2, 2, -1, 0, 0] });
  switch (state) {
    case 'idle_breathe': case 'idle_blink': case 'idle_look': return { y: [0, -1.5, 0], scaleX: [1, 1.012, 1], scaleY: [1, .982, 1] };
    case 'idle_bored': return { y: [0, -2, 1, 0], rotate: [0, -4, 3, 0], scaleY: [1, 1.025, .98, 1] };
    case 'idle_sleep': return { y: [0, 2, 0], rotate: [5, 7, 5], scaleY: [1, .978, 1] };
    case 'wave_hello': return jump(10);
    case 'teach_talk': return { y: [0, -2, 0], rotate: [0, 2, -1, 0] };
    case 'teach_point': return { x: [0, -3, -3, 0], rotate: [0, -3, -3, 0] };
    case 'teach_think': return { rotate: [0, -5, -5, 0], y: [0, -1, 0, 0] };
    case 'teach_idea': return jump(7);
    case 'teach_code': return { y: [0, 1, 0, 1, 0], rotate: [0, 1, 0, -1, 0] };
    case 'answer_correct': return jump(23);
    case 'answer_correct_combo': return jump(23 + clamp(combo, 0, 10) * 1.1);
    case 'answer_wrong': return { y: [0, 6, 10, 10, -2, 0], rotate: [0, -5, 13, 9, -3, 0], scaleX: [1, 1.05, 1.13, 1.1, .97, 1], scaleY: [1, .95, .83, .87, 1.03, 1] };
    case 'answer_almost': return { rotate: [0, -9, -9, 0], y: [0, -2, -2, 0] };
    case 'timer_hurry': return { x: [0, -2, 2, -2, 2, 0], rotate: [0, -2, 2, -2, 2, 0] };
    case 'lesson_complete': return { y: [0, 5, -23, 2, -15, 2, 0], scaleX: [1, 1.1, .93, 1.08, .94, 1.06, 1], scaleY: [1, .9, 1.07, .92, 1.06, .94, 1] };
    case 'perfect_score': return { y: [0, 4, -29, -29, 3, 0], rotate: [0, -8, 0, 360, 360, 360], scaleX: [1, 1.08, .93, 1, 1.09, 1], scaleY: [1, .92, 1.07, 1, .91, 1] };
    case 'streak_up': return { ...jump(15), rotate: [0, -3, 4, -2, 0, 0] };
    case 'streak_lost': return { y: [0, 4, 4, 0, 0], rotate: [0, 5, 5, -3, 0], scaleY: [1, .97, .97, 1.02, 1] };
    case 'level_up': return { y: [0, 6, -26, -26, -22, 2, 0], scaleX: [1, 1.1, .94, 1.02, 1, 1.08, 1], scaleY: [1, .9, 1.06, .99, 1, .92, 1], rotate: [0, -4, 3, -3, 2, -1, 0] };
    case 'badge_unlock': return jump(12);
    case 'xp_gain': return { y: [0, -4, 0], rotate: [0, -3, 0] };
    case 'cheer_encourage': return { y: [0, 2, -10, 2, -7, 0], scaleY: [1, .97, 1.03, .97, 1.03, 1] };
    case 'loading': return { y: [0, -3, 0, -3, 0], rotate: [0, -3, 0, 3, 0] };
    case 'error_404': return { rotate: [0, -5, 5, 0], x: [0, -2, 2, 0] };
    case 'offline': return { rotate: [0, 6, 6, 0], y: [0, 1, 1, 0] };
  }
}

function starPath(cx: number, cy: number, outer = 17, inner = 8) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? outer : inner;
    return `${i ? 'L' : 'M'}${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(' ') + 'Z';
}
const heartPath = (cx: number, cy: number) => `M${cx} ${cy + 17}C${cx - 5} ${cy + 13} ${cx - 18} ${cy + 3} ${cx - 18} ${cy - 6}C${cx - 18} ${cy - 20} ${cx - 5} ${cy - 19} ${cx} ${cy - 9}C${cx + 5} ${cy - 19} ${cx + 18} ${cy - 20} ${cx + 18} ${cy - 6}C${cx + 18} ${cy + 3} ${cx + 5} ${cy + 13} ${cx} ${cy + 17}Z`;

/** Original vector artwork. Award logic and animation queue live outside it. */
export default function BittySvg({ state = 'idle_breathe', size = 160, lookAt = { x: 0, y: 0 }, viseme = 0, combo = 0, xp = 0, mood = 0, motionPaused = false, className = '', pointDirection = 'right', onComplete }: BittySvgProps) {
  const preference = useMotionPreference();
  const paused = preference || motionPaused;
  const [blink, setBlink] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const completed = useRef(false);
  const instance = useId().replace(/:/g, '');
  const timeline = TIMELINES[state] || TIMELINES.idle_breathe;
  const duration = timeline.duration / 1000;
  const loop = timeline.loop;
  const ambientMood = state.startsWith('idle_') || state === 'teach_talk' || state === 'teach_point';
  const celebrate = celebrations.has(state) || ambientMood && mood === 4;
  const sleepy = state === 'idle_sleep';
  const worried = (state === 'answer_wrong' || state === 'streak_lost') && !recovered || ambientMood && mood === 2;
  const confused = state === 'error_404' || state === 'offline';
  const thinking = state === 'teach_think' || ambientMood && mood === 1;
  const eyes = state === 'perfect_score' ? 'heart' : state === 'answer_correct' || state === 'answer_correct_combo' || ambientMood && mood === 4 ? 'star' : state === 'answer_wrong' && !recovered || ambientMood && mood === 3 ? 'spiral' : sleepy || state === 'idle_blink' ? 'closed' : state === 'answer_almost' ? 'wink' : 'round';
  const mouth = state === 'teach_talk' ? ['closed', 'open_A', 'open_E', 'open_O', 'smile', 'wow'][Math.round(clamp(viseme, 0, 5))] : worried ? 'sad' : confused || state === 'idle_bored' || state === 'timer_hurry' || ambientMood && mood === 3 ? 'wow' : sleepy || thinking ? 'closed' : 'smile';
  const eyeX = paused ? 0 : thinking ? 2 : clamp(lookAt.x, -1, 1) * 4;
  const eyeY = paused ? 0 : thinking ? -5 : clamp(lookAt.y, -1, 1) * 5;
  const tip = state === 'answer_wrong' && !recovered || state === 'timer_hurry' || ambientMood && mood === 3 ? palette.coral : thinking || state === 'teach_idea' ? palette.gold : sleepy || worried || confused ? palette.ink : palette.green;
  const direction = pointDirection === 'left' ? -1 : 1;
  const staticPose = state === 'answer_almost' || thinking ? { rotate: -5 } : sleepy ? { rotate: 5 } : { rotate: 0 };
  const armRaised = celebrate || state === 'wave_hello' || state === 'teach_idea';
  const armRight = state === 'wave_hello' ? [0, -140, -105, -145, -105, -132, 0] : state === 'idle_bored' ? [0, -127, -115, -127, 0] : state === 'teach_point' && direction > 0 ? [0, -88, -88, 0] : state === 'teach_code' ? [0, -36, -29, -36, -29, 0] : state === 'answer_wrong' ? [0, -125, -125, 0] : thinking ? [0, -103, -103, 0] : armRaised ? [0, -138, -128, 0] : state === 'teach_talk' ? [0, -25, -8, -25, 0] : [0, 0];
  const armLeft = state === 'teach_point' && direction < 0 ? [0, 88, 88, 0] : state === 'teach_code' ? [0, 30, 36, 30, 36, 0] : state === 'answer_wrong' ? [0, 125, 125, 0] : celebrate ? [0, 138, 128, 0] : state === 'teach_talk' ? [0, 5, 18, 5, 0] : [0, 0];

  useEffect(() => { completed.current = false; }, [state]);
  useEffect(() => {
    setRecovered(false);
    if (paused || (state !== 'answer_wrong' && state !== 'streak_lost')) return;
    const timer = setTimeout(() => setRecovered(true), timeline.duration * .72);
    return () => clearTimeout(timer);
  }, [state, paused, timeline.duration]);
  useEffect(() => {
    setBlink(false);
    if (paused || sleepy || eyes !== 'round') return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (disposed) return;
        setBlink(true);
        timer = setTimeout(() => { if (!disposed) { setBlink(false); schedule(); } }, 160);
      }, state === 'idle_blink' ? 2100 : 2000 + Math.random() * 3000);
    };
    schedule();
    return () => { disposed = true; clearTimeout(timer); };
  }, [paused, sleepy, eyes, state]);

  const transition = { duration: paused ? 0 : duration, repeat: !paused && loop ? Infinity : 0, ease: 'easeInOut' as const };
  const secondary = { ...transition, delay: paused ? 0 : .075 };
  const complete = () => {
    if (!loop && !completed.current) { completed.current = true; onComplete?.(); }
  };
  const prop = (id: string, x: number, y: number, width: number, extra: TargetAndTransition = {}) => <motion.g key={id} className="bitty-prop" initial={paused ? false : { opacity: 0, scale: .72 }} animate={paused ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [0.72, 1.08, 1], ...extra }} transition={{ duration: paused ? 0 : .55, ease: cubicOut }} style={{ transformOrigin: `${x + width / 2}px ${y + width / 2}px` }}><image href={`/mascots/bitty/props/${id}.svg`} x={x} y={y} width={width} height={width} /></motion.g>;

  return <div className={`bitty-art ${className}`} style={{ width: size, height: size }} data-bitty-state={state} data-motion-paused={paused ? 'true' : 'false'}>
    <svg viewBox="-52 -52 360 360" role="img" aria-label={labels[state]} className="bitty-vector">
      <defs>
        <clipPath id={`${instance}-eye-L`}><ellipse cx="101" cy="104" rx="17" ry="22" /></clipPath>
        <clipPath id={`${instance}-eye-R`}><ellipse cx="155" cy="104" rx="17" ry="22" /></clipPath>
      </defs>
      <motion.g data-layer="shadow" animate={paused ? { scaleX: 1, opacity: .13 } : celebrate ? { scaleX: [1, 1.08, .7, 1.06, 1], opacity: [.13, .16, .06, .16, .13] } : { scaleX: [1, .97, 1], opacity: .13 }} transition={transition} style={{ transformOrigin: '128px 235px' }}><ellipse cx="128" cy="235" rx="63" ry="10" fill={palette.ink} /></motion.g>
      {state === 'level_up' && <motion.g className="bitty-rays" initial={false} animate={paused ? { rotate: 0, opacity: .2 } : { rotate: [0, 28], opacity: [.08, .24, .16] }} transition={{ duration: paused ? 0 : duration, ease: 'easeOut' }} style={{ transformOrigin: '128px 123px' }}>{Array.from({ length: 10 }, (_, i) => <path key={i} d="M123 38 119 7 137 7 133 38Z" fill={palette.gold} transform={`rotate(${i * 36} 128 123)`} />)}</motion.g>}
      <motion.g key={state} className="bitty-rig" data-layer="rig" animate={paused ? { x: 0, y: 0, scaleX: 1, scaleY: 1, ...staticPose } : bodyAnimation(state, combo)} transition={transition} style={{ transformOrigin: state === 'perfect_score' ? '128px 128px' : '128px 216px' }} onAnimationComplete={complete}>
        <motion.g data-layer="tail" animate={paused ? { rotate: 0 } : { rotate: worried ? [0, 12, 5, 0] : [0, -8, 2, 0] }} transition={secondary} style={{ transformOrigin: '188px 184px' }}><path d="M184 184c32 13 43-2 37-22" fill="none" stroke={palette.green} strokeWidth="19" strokeLinecap="round" /><path d="M221 162q-4-8-10-8" fill="none" stroke={palette.cream} strokeWidth="10" strokeLinecap="round" /></motion.g>
        <motion.g data-layer="leg_L" animate={paused ? { rotate: 0 } : state === 'loading' ? { rotate: [0, 12, -12, 0] } : state === 'idle_bored' ? { rotate: [0, 0, -9, 0, -9, 0] } : { rotate: [0, 0] }} transition={transition} style={{ transformOrigin: '98px 210px' }}><path d="M78 202v21c0 9 8 12 23 12h12v-35" fill={palette.green} /><path d="M85 225h19" stroke={palette.mint} strokeWidth="4" strokeLinecap="round" /></motion.g>
        <motion.g data-layer="leg_R" animate={paused ? { rotate: 0 } : state === 'loading' ? { rotate: [0, -12, 12, 0] } : { rotate: [0, 0] }} transition={transition} style={{ transformOrigin: '157px 210px' }}><path d="M143 200v35h14c16 0 22-5 22-13v-20" fill={palette.green} /><path d="M151 225h19" stroke={palette.mint} strokeWidth="4" strokeLinecap="round" /></motion.g>
        <g data-layer="body"><path d="M62 118c-9 23-13 41-9 61 7 35 34 47 75 47s70-16 77-47c5-21-1-43-10-61Z" fill={palette.mint} /></g>
        <g data-layer="belly"><ellipse cx="128" cy="179" rx="42" ry="32" fill={palette.cream} /><path d="m113 176-9 7 9 7m30-14 9 7-9 7" fill="none" stroke={palette.green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="128" cy="183" r="3" fill={palette.gold} /></g>
        <motion.g data-layer="arm_L" animate={paused ? { rotate: celebrate ? 115 : 0 } : { rotate: armLeft }} transition={transition} style={{ transformOrigin: '63px 153px' }}><path d="M62 151c-17 3-25 20-21 30 4 10 15 9 20 1l9-20" fill={palette.green} /><path d="M47 176q3 5 7 2" fill="none" stroke={palette.mint} strokeWidth="3" strokeLinecap="round" /></motion.g>
        <motion.g data-layer="arm_R" animate={paused ? { rotate: celebrate || state === 'wave_hello' ? -115 : thinking ? -95 : 0 } : { rotate: armRight }} transition={transition} style={{ transformOrigin: '193px 153px' }}><path d="M194 151c17 3 25 20 21 30-4 10-15 9-20 1l-9-20" fill={palette.green} /><path d="M202 178q4 2 7-2" fill="none" stroke={palette.mint} strokeWidth="3" strokeLinecap="round" /></motion.g>
        <motion.g data-layer="ear_L" animate={paused ? { rotate: worried ? -12 : 0 } : { rotate: sleepy ? [-12, -15, -12] : celebrate ? [0, -12, 6, -3, 0] : [0, -3, 1, 0] }} transition={secondary} style={{ transformOrigin: '76px 66px' }}><path d="M61 80C45 60 45 35 52 28c8-6 34 12 46 28Z" fill={palette.green} /><path d="M61 61q-8-14-6-21 15 5 23 15Z" fill={palette.coral} /></motion.g>
        <motion.g data-layer="ear_R" animate={paused ? { rotate: worried ? 12 : 0 } : { rotate: sleepy ? [12, 15, 12] : celebrate ? [0, 10, -5, 3, 0] : [0, 3, -1, 0] }} transition={{ ...secondary, delay: paused ? 0 : .11 }} style={{ transformOrigin: '180px 66px' }}><path d="M158 56c12-16 37-34 46-28 7 7 7 32-9 52Z" fill={palette.green} /><path d="M177 55q9-10 23-15 2 8-6 21Z" fill={palette.coral} /></motion.g>
        <motion.g data-layer="antenna" animate={paused ? { rotate: 0 } : { rotate: state === 'loading' ? [0, 20, -20, 0] : celebrate ? [0, -16, 10, -4, 0] : [0, -4, 3, 0] }} transition={{ ...secondary, delay: paused ? 0 : .12 }} style={{ transformOrigin: '127px 47px' }}><g data-layer="antenna_stem"><path d="M127 48c-6-15-2-24 5-30" fill="none" stroke={palette.ink} strokeWidth="5" strokeLinecap="round" /></g><g data-layer="antenna_tip"><circle cx="133" cy="18" r="13" fill={tip} opacity=".2" /><circle cx="133" cy="18" r="8" fill={tip} /><circle cx="131" cy="15" r="3" fill={palette.cream} /></g></motion.g>
        <g data-layer="head"><ellipse cx="128" cy="106" rx="79" ry="66" fill={palette.mint} /><path d="M69 86c10-25 41-37 72-32" fill="none" stroke={palette.cream} strokeWidth="7" strokeLinecap="round" opacity=".42" /><path d="M70 93c7-21 32-29 58-29s52 8 59 29c6 20 3 41-13 53-12 9-30 14-46 14s-35-5-46-14c-16-12-19-33-12-53Z" fill={palette.cream} />
          {[['L', 101], ['R', 155]].map(([side, center]) => {
            const x = Number(center);
            const closed = eyes === 'closed' || eyes === 'wink' && side === 'R' || blink;
            return <g key={side} data-layer={`eye_${side}`}>
              <ellipse cx={x} cy="104" rx="17" ry="22" fill={palette.cream} />
              {closed ? <g data-layer={`eyelid_${side}`}><path d={`M${x - 11} 106q11 ${eyes === 'wink' ? -8 : 9} 22 0`} fill="none" stroke={palette.ink} strokeWidth="4" strokeLinecap="round" /></g> : eyes === 'star' ? <g data-layer={`pupil_${side}`}><path d={starPath(x, 104)} fill={palette.gold} /><path d={`M${x - 3} 92v5`} stroke={palette.cream} strokeWidth="3" strokeLinecap="round" /></g> : eyes === 'heart' ? <g data-layer={`pupil_${side}`}><path d={heartPath(x, 102)} fill={palette.coral} /></g> : eyes === 'spiral' ? <g data-layer={`pupil_${side}`}><path d={`M${x} 104c-6-9-17 1-10 10 8 11 27 0 21-14-6-16-31-10-29 10`} fill="none" stroke={palette.ink} strokeWidth="3.5" strokeLinecap="round" /></g> : <g clipPath={`url(#${instance}-eye-${side})`}><motion.g data-layer={`pupil_${side}`} animate={{ x: eyeX, y: eyeY }} transition={{ duration: paused ? 0 : .14, ease: 'easeOut' }}><ellipse cx={x} cy="104" rx="12" ry={worried ? 14 : 18} fill={palette.ink} /><circle cx={x - 3} cy="98" r="4" fill={palette.cream} /><circle cx={x + 5} cy="110" r="2" fill={palette.cream} /></motion.g></g>}
              <g data-layer={`eyebrow_${side}`}><path d={worried ? `M${x - 10} ${side === 'L' ? 82 : 76}q10 ${side === 'L' ? -8 : 8} 19 0` : thinking && side === 'R' ? `M${x - 10} 76q10-9 19-3` : `M${x - 10} 78q10-5 19 0`} fill="none" stroke={palette.green} strokeWidth="4" strokeLinecap="round" /></g>
            </g>;
          })}
          <g data-layer="cheek_L"><ellipse cx="81" cy="128" rx="10" ry="6" fill={palette.coral} opacity=".68" /></g><g data-layer="cheek_R"><ellipse cx="175" cy="128" rx="10" ry="6" fill={palette.coral} opacity=".68" /></g>
          <g data-layer={`mouth_${mouth}`}>
            {mouth === 'closed' ? <path d="M119 137q9 5 18 0" fill="none" stroke={palette.ink} strokeWidth="4" strokeLinecap="round" /> : mouth === 'sad' ? <path d="M117 145q11-13 22 0" fill="none" stroke={palette.ink} strokeWidth="4" strokeLinecap="round" /> : mouth === 'open_E' ? <><rect x="112" y="131" width="32" height="17" rx="8" fill={palette.ink} /><path d="M124 132h8v6h-8Z" fill={palette.cream} /></> : mouth === 'open_O' ? <ellipse cx="128" cy="140" rx="9" ry="12" fill={palette.ink} /> : mouth === 'open_A' || mouth === 'wow' ? <><ellipse cx="128" cy="140" rx={mouth === 'open_A' ? 13 : 12} ry="15" fill={palette.ink} /><path d="M124 126h8v7h-8Z" fill={palette.cream} /></> : <><path d="M111 132q17 6 34 0c-1 16-9 23-17 23s-16-7-17-23Z" fill={palette.ink} /><path d="M124 135h8v7h-8Z" fill={palette.cream} /></>}
          </g>
          {(mouth === 'smile' || mouth === 'open_A' || mouth === 'open_E') && <g data-layer="tongue"><path d={mouth === 'open_E' ? 'M120 143q8-5 16 0v3h-16Z' : 'M118 149q10-10 20 0c-3 5-6 6-10 6s-7-1-10-6Z'} fill={palette.coral} /></g>}
          {state === 'timer_hurry' && <motion.path d="M184 78q-8 10-8 15c0 8 13 8 13 0q0-5-5-15Z" fill={palette.mint} animate={paused ? { y: 0 } : { y: [0, 8, 0] }} transition={transition} />}
          {sleepy && <motion.circle cx="146" cy="143" r="9" fill={palette.mint} opacity=".6" stroke={palette.cream} strokeWidth="2" animate={paused ? { scale: 1 } : { scale: [1, 1.35, 1] }} transition={transition} style={{ transformOrigin: '146px 143px' }} />}
        </g>
      </motion.g>
      {(state === 'lesson_complete' || state === 'perfect_score') && prop('trophy', 171, 162, 65)}
      {(state === 'teach_code' || state === 'loading') && prop('laptop', 79, 167, 101)}
      {state === 'teach_think' && prop('question', 204, 34, 40)}
      {state === 'teach_point' && prop('whiteboard', direction > 0 ? 178 : 0, 132, 78)}
      {state === 'teach_idea' && prop('bulb', 192, 22, 51)}
      {(state === 'level_up' || state === 'badge_unlock') && prop('level-badge', 169, 161, 71, state === 'level_up' ? { scaleX: [.25, 1, .25, 1] } : {})}
      {(state === 'streak_up' || state === 'answer_correct_combo' && combo >= 3) && prop('streak-fire', 188, 129, 60)}
      {state === 'streak_lost' && <motion.g animate={paused ? { opacity: .45, y: 8 } : { opacity: [1, .2, .45], y: [0, 8, 8] }} transition={{ duration: paused ? 0 : duration }}>{prop('streak-fire', 188, 150, 48)}</motion.g>}
      {state === 'idle_bored' && prop('coffee', 196, 171, 49)}
      {state === 'cheer_encourage' && prop('heart', 200, 68, 40)}
      {state === 'timer_hurry' && prop('exclamation', 210, 24, 34)}
      {sleepy && <motion.text x="197" y="54" fill={palette.ink} stroke={palette.cream} strokeWidth="2" paintOrder="stroke" fontSize="24" fontWeight="900" animate={paused ? { y: 0, opacity: .65 } : { y: [4, -5, 4], opacity: [.35, .8, .35] }} transition={transition}>Z<tspan dx="2" dy="-12" fontSize="17">z</tspan></motion.text>}
      {(state === 'error_404' || state === 'offline') && <g data-layer="network_cable"><path d={state === 'error_404' ? 'M53 188q30-26 60 0m30 0q31-26 61 0' : 'M56 188q19 31 46 10t40 0q27 21 58-10'} stroke={palette.ink} strokeWidth="5" fill="none" strokeLinecap="round" /><rect x="102" y="179" width="13" height="17" rx="3" fill={palette.coral} /><rect x="139" y="179" width="13" height="17" rx="3" fill={palette.coral} /><path d="M107 178v-5m5 5v-5m31 5v-5m5 5v-5" stroke={palette.gold} strokeWidth="2" strokeLinecap="round" />{state === 'error_404' ? <path d="m124 172-4 9 9 4-5 9" fill="none" stroke={palette.coral} strokeWidth="3" strokeLinecap="round" /> : prop('question', 207, 42, 34)}</g>}
      {!paused && (state === 'lesson_complete' || state === 'perfect_score' || state === 'level_up' || state === 'badge_unlock') && <g className="bitty-confetti" aria-hidden="true">{Array.from({ length: state === 'perfect_score' ? 18 : 12 }, (_, i) => {
        const angle = -Math.PI + i * Math.PI / 11;
        const distance = 63 + i % 4 * 13;
        return <motion.rect key={i} x="125" y="116" width={i % 2 ? 4 : 6} height={i % 2 ? 8 : 4} rx="1" fill={[palette.gold, palette.coral, palette.mint][i % 3]} initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }} animate={{ opacity: [0, 1, 1, 0], x: [0, Math.cos(angle) * distance], y: [0, Math.sin(angle) * distance - 50, 85], rotate: [0, i % 2 ? 210 : -180] }} transition={{ duration: Math.min(duration, 2.4), delay: .32 + i % 3 * .04, ease: 'easeOut' }} />;
      })}</g>}
      {state === 'xp_gain' && <motion.g animate={paused ? { y: 0, opacity: 1 } : { y: [10, -29, -51], x: [0, 7, 15], opacity: [0, 1, 0] }} transition={{ duration: paused ? 0 : duration, ease: cubicOut }}><path d={starPath(199, 86, 11, 5)} fill={palette.gold} /><text x="207" y="93" fontSize="17" fontWeight="900" fill={palette.ink} stroke={palette.cream} strokeWidth="2" paintOrder="stroke">+{Math.round(clamp(xp, 0, 999))}</text></motion.g>}
    </svg>
  </div>;
}
