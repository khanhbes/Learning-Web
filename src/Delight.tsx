import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import Mascot from './Mascot';
import { Icon } from './components';
import { Link } from 'react-router-dom';
import { useMotionPreference } from './motionPreference';
export { useMotionPreference } from './motionPreference';
import './delight.css';

export function AnimatedNumber({ value, suffix = '', duration = .85, initialValue, delay = 0 }: { value: number; suffix?: string; duration?: number; initialValue?: number; delay?: number }) {
  const reduced = useMotionPreference(), [display, setDisplay] = useState(initialValue ?? value), previous = useRef(initialValue ?? value);
  useEffect(() => {
    const from = previous.current; previous.current = value;
    if (reduced || duration <= 0 || from === value) { setDisplay(value); return; }
    let frame = 0, start = 0;
    const tick = (time: number) => {
      start ||= time;
      const ratio = Math.min(1, (time - start) / (duration * 1000));
      setDisplay(Math.round(from + (value - from) * (1 - Math.pow(1 - ratio, 3))));
      if (ratio < 1) frame = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => { frame = requestAnimationFrame(tick); }, delay * 1000);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [value, reduced, duration, delay]);
  return <span className="bp-number"><span aria-hidden="true">{display}{suffix}</span><span className="bp-sr-only">{value}{suffix}</span></span>;
}

const sparks = Array.from({ length: 26 }, (_, i) => ({
  x: Math.cos(i * 2.399) * (90 + (i % 5) * 21),
  y: Math.sin(i * 2.399) * (65 + (i % 4) * 21) - 35,
  rotation: i * 47,
  color: ['#58cc02', '#ffc800', '#56c5ed', '#aa8ce9'][i % 4],
}));

function SparkBurst({ reduced }: { reduced: boolean }) {
  return <div className={`bp-sparks ${reduced ? 'bp-still' : ''}`} aria-hidden="true">{sparks.map((s, i) => <i key={i} className={i % 3 ? 'bp-confetti' : 'bp-star'} style={{ '--spark-x': `${s.x}px`, '--spark-y': `${s.y}px`, '--spark-turn': `${s.rotation}deg`, '--spark-color': s.color, '--spark-delay': `${.55 + i % 5 * .035}s` } as CSSProperties}>{i % 3 ? null : '✦'}</i>)}</div>;
}

function ChestArt() {
  return <svg className="bp-chest" viewBox="0 0 220 170" aria-hidden="true">
    <ellipse cx="110" cy="148" rx="73" ry="10" fill="#d9eabd" />
    <g className="bp-chest-light"><path d="M54 90 83 11h57l29 79z" fill="#fff0a0" opacity=".6" /><path d="m85 80 16-78h20l16 78z" fill="#fff9cf" /></g>
    <g className="bp-chest-gem"><path d="m91 45 10-13h19l10 13-20 24z" fill="#2ec5eb" /><path d="m91 45 19 24-6-24 6-13 7 13 13 0" fill="none" stroke="#93e9ff" strokeWidth="2" /></g>
    <path d="M43 87h134v49q0 11-12 11H55q-12 0-12-11z" fill="#edaa28" /><path d="M43 87h134v16H43z" fill="#ce8a12" /><path d="M63 92v55m94-55v55" stroke="#ffd766" strokeWidth="11" />
    <g className="bp-chest-lid"><path d="M43 87V69q0-25 25-25h84q25 0 25 25v18z" fill="#ffc743" /><path d="M63 87V67q0-23 14-23m66 0q14 0 14 23v20" fill="none" stroke="#ffe79e" strokeWidth="10" /><path d="M44 84h132" stroke="#c98c18" strokeWidth="5" /></g>
    <rect x="97" y="87" width="26" height="25" rx="6" fill="#ffdf77" /><path d="m110 92 3 5 6 1-4 4 1 6-6-3-5 3 1-6-5-4 6-1z" fill="#b07a13" />
    <path d="m25 65 2 6 7 2-7 2-2 7-2-7-7-2 7-2zm167-29 2 5 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffc800" />
  </svg>;
}

export function LoadingScene({ title = 'Byte đang chuẩn bị…', detail, compact = false, steps = [], progress }: { title?: string; detail?: string; compact?: boolean; steps?: string[]; progress?: number }) {
  const reduced = useMotionPreference(), [index, setIndex] = useState(0), [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  useEffect(() => {
    if (steps.length < 2 || !visible || reduced) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % steps.length), 3600);
    return () => clearInterval(timer);
  }, [steps.length, visible, reduced]);
  const definite = typeof progress === 'number' && Number.isFinite(progress);
  return <section role="status" className={`bp-loading ${compact ? 'bp-loading-compact' : ''} ${reduced || !visible ? 'bp-still' : ''}`} aria-busy="true" aria-label={title}>
    <div className="bp-loading-art" aria-hidden="true">
      <span className="bp-loading-orbit bp-orbit-a" /><span className="bp-loading-orbit bp-orbit-b" />
      <span className="bp-loading-tile bp-tile-code">&lt;/&gt;</span><span className="bp-loading-tile bp-tile-star">✦</span>
      <div className="bp-loading-mascot"><Mascot size={compact ? 90 : 150} mood="thinking" motionPaused={reduced || !visible} /></div>
      <span className="bp-loading-floor" />
    </div>
    <div className="bp-loading-copy"><h3>{title}</h3>{detail && <p>{detail}</p>}
      <div className="bp-loading-track" {...(definite ? { role: 'progressbar', 'aria-valuenow': progress, 'aria-valuemin': 0, 'aria-valuemax': 100 } : { 'aria-hidden': true })}><span style={definite ? { width: `${Math.max(0, Math.min(100, progress))}%`, animation: 'none' } : undefined} /></div>
      {steps.length > 0 && <small className="bp-loading-tip" aria-hidden="true">{steps[index % steps.length]}</small>}
      <span className="bp-loading-dots" aria-hidden="true"><i /><i /><i /></span>
    </div>
  </section>;
}

type CelebrationProps = {
  variant: 'lesson' | 'level' | 'gift' | 'capstone' | 'practice';
  title: string; subtitle?: string; xp?: number; bonusXp?: number; gems?: number; level?: number;
  children?: ReactNode; compact?: boolean; showSkip?: boolean; onSkip?: () => void;
};

export function CelebrationScene({ variant, title, subtitle, xp, bonusXp, gems, level, children, compact = false, showSkip = true, onSkip }: CelebrationProps) {
  const preference = useMotionPreference(), [finished, setFinished] = useState(false);
  const reduced = preference || finished;
  const finish = () => { setFinished(true); onSkip?.(); };
  return <section className={`bp-celebration bp-${variant} ${compact ? 'bp-celebration-compact' : ''} ${reduced ? 'bp-still bp-finished' : ''}`} aria-label={title}>
    <div className="bp-celebration-art">
      <div className="bp-celebration-halo" aria-hidden="true" /><div className="bp-celebration-ring" aria-hidden="true" />
      <div className="bp-celebration-rays" aria-hidden="true" />
      <SparkBurst reduced={reduced} />
      {variant === 'gift' ? <ChestArt /> : <div className="bp-hero-mascot"><Mascot size={compact ? 145 : 190} mood="celebrate" motionPaused={reduced} /></div>}
      <motion.span className="bp-achievement-seal" initial={reduced ? false : { scale: 0, rotate: -35 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: reduced ? 0 : .8, type: 'spring', damping: 12 }} aria-hidden="true">
        {variant === 'level' && level !== undefined ? level : <Icon name={variant === 'capstone' ? 'graduate' : variant === 'gift' ? 'gem' : 'check'} size={28} />}
      </motion.span>
    </div>
    <motion.div className="bp-celebration-copy bp-reveal" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : .4, duration: .3 }}>
      <span className="bp-celebration-eyebrow">{variant === 'level' ? 'MỘT CỘT MỐC MỚI' : variant === 'gift' ? 'QUÀ DÀNH CHO BẠN' : variant === 'capstone' ? 'BẠN ĐÃ LÀM ĐƯỢC!' : 'MỖI BƯỚC ĐỀU ĐÁNG NHỚ'}</span>
      <h2>{title}</h2>{subtitle && <p>{subtitle}</p>}
    </motion.div>
    {(typeof xp === 'number' || typeof gems === 'number') && <div className="bp-reward-totals bp-reveal">
      {typeof xp === 'number' && <div className="bp-reward-pill bp-reward-xp"><Icon name="zap" size={24} /><strong>+<AnimatedNumber value={xp} initialValue={0} delay={reduced ? 0 : .9} duration={reduced ? 0 : .85} /> XP</strong></div>}
      {typeof gems === 'number' && <div className="bp-reward-pill bp-reward-gem"><Icon name="gem" size={24} /><strong>+<AnimatedNumber value={gems} initialValue={0} delay={reduced ? 0 : .9} duration={reduced ? 0 : .85} /></strong><span>kim cương</span></div>}
    </div>}
    {!!bonusXp && <p className="bp-boost-caption">Đã gồm +{bonusXp} XP từ gói X2</p>}
    {children && <div className="bp-celebration-detail">{children}</div>}
    {showSkip && !preference && !finished && <button type="button" className="bp-skip" onClick={finish}>Bỏ qua hiệu ứng <Icon name="forward" size={14} /></button>}
  </section>;
}

export function SuccessFeedback({ correct, label, children }: { correct: boolean; label?: string; children?: ReactNode }) {
  const reduced = useMotionPreference();
  return <motion.div role="status" className={`bp-feedback ${correct ? 'bp-feedback-correct' : 'bp-feedback-retry'}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>
    <motion.span className="bp-feedback-icon" initial={reduced ? false : { scale: .6, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 14 }}><Icon name={correct ? 'check' : 'info'} size={20} /></motion.span>
    <div><strong>{label || (correct ? 'Đúng rồi, tiến thêm một bước!' : 'Thử lại nhé, bạn đang học thêm một điều.')}</strong>{children && <div className="bp-feedback-detail">{children}</div>}</div>
    {correct && !reduced && <span className="bp-feedback-spark" aria-hidden="true">✦</span>}
  </motion.div>;
}

export function AnimationPreview() {
  const [scene, setScene] = useState('gift'), [replay, setReplay] = useState(0), reduced = useMotionPreference();
  const options = [['loading','brain','Đang chuẩn bị'],['lesson','check','Qua bài học'],['gift','gift','Mở quà'],['level','star','Lên cấp'],['capstone','graduate','Hoàn thành khóa']];
  const titles: Record<string, string> = {lesson:'Một bước tiến thật đẹp!',gift:'Mở một chút niềm vui!',level:'Bạn đã lên cấp!',capstone:'Một hành trình trọn vẹn!'};
  return <div className="wide-page bp-preview-page"><span className="eyebrow">GÓC VUI CỦA BYTE</span><h1>Những khoảnh khắc đáng nhớ.</h1><p>Thử chuyển cảnh và xem mascot của bạn ăn mừng.</p>
    <div className="bp-preview-tabs" role="tablist" aria-label="Chọn hiệu ứng">{options.map(([id,icon,label])=><button key={id} id={`effect-${id}`} role="tab" aria-selected={scene===id} aria-controls="effect-stage" className={scene===id?'selected':''} onClick={()=>{setScene(id);setReplay(0);}}><Icon name={icon} size={19}/><span>{label}</span></button>)}</div>
    <div className="bp-preview-stage" id="effect-stage" role="tabpanel" aria-labelledby={`effect-${scene}`} key={`${scene}:${replay}`}>
      {scene==='loading'?<LoadingScene title="Byte đang chuẩn bị hành trình…" detail="Sẵn sàng cho một điều mới hôm nay?" steps={['Mỗi bước nhỏ đều có ý nghĩa.', 'Bạn học theo tốc độ của mình.', 'Xem ý tưởng chuyển động, rồi thử bằng code.']}/>:<CelebrationScene variant={scene as CelebrationProps['variant']} title={titles[scene]} subtitle="Số thưởng bên dưới là dữ liệu minh họa." xp={scene==='lesson'?50:undefined} gems={scene==='gift'?15:undefined} level={scene==='level'?5:undefined}/>}
    </div>
    <div className="bp-preview-footer"><button type="button" className="btn outline" onClick={()=>setReplay(n=>n+1)}><Icon name="refresh" size={18}/>XEM LẠI</button><Link to="/profile" className="text-link"><Icon name="settings" size={16}/>{reduced?'Chế độ giảm chuyển động đang bật':'Cài đặt chuyển động và âm thanh'}</Link></div>
  </div>;
}
