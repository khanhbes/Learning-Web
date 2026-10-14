import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMotionPreference } from './motionPreference';
import { useApp } from './context';
import { api } from './api';
import { Byte, Icon, Button, ProgressBar } from './components';
import { LevelUpOverlay } from './bitty/RewardOverlays';
import { CelebrationScene } from './Delight';
import { courseInfo } from './courseUI';

export function CourseArt({ courseId = 'dsa' }: { courseId?: string }) {
  const labels:Record<string,string>={dsa:'Các nút dữ liệu kết nối thành cây',ml:'Điểm dữ liệu và đường dự đoán',da:'Bảng dữ liệu chuyển thành biểu đồ doanh thu',git:'Nhánh tính năng gặp nhánh chính ở một commit hợp nhất'};
  return <svg className="course-art" viewBox="0 0 340 190" role="img" aria-label={labels[courseId]||'Hành trình học cùng Byte'}>
    <circle cx="170" cy="97" r="85" fill={{ml:'#e8efff',da:'#e0f6f3',git:'#fff0e6'}[courseId]||'#e9f8dc'} />
    {courseId==='da'?<>
      <rect x="42" y="36" width="143" height="116" rx="12" fill="white" stroke="#b6ddd5" strokeWidth="3"/><path d="M43 68h141M43 96h141M43 124h141M85 37v114M137 37v114" stroke="#d9ebe5" strokeWidth="2"/><path d="M54 51h20m21 0h30m22 0h23" stroke="#2c9f8a" strokeWidth="6" strokeLinecap="round"/>{[82,110,138].map((y,i)=><g key={y}><circle cx="65" cy={y} r="5" fill="#58cc02"/><path d={`M98 ${y}h21M147 ${y}h${14+i*3}`} stroke="#9cbeb6" strokeWidth="4" strokeLinecap="round"/></g>)}
      <rect x="165" y="77" width="137" height="91" rx="15" fill="white" stroke="#9bd6c9" strokeWidth="3"/><path d="M183 90v60h103" fill="none" stroke="#b4cec3" strokeWidth="2"/>{[27,43,62].map((h,i)=><rect key={h} x={197+i*29} y={148-h} width="20" height={h} rx="5" fill={['#8ed0bd','#46b49c','#2b927e'][i]}/>)}<path d="m200 46 27 10-27 10" fill="none" stroke="#ffc800" strokeWidth="6" strokeLinecap="round"/>
    </>:courseId==='git'?<>
      <path d="M59 121h222M111 121c23 0 6-65 48-65h58c40 0 8 65 55 65" fill="none" stroke="#d89775" strokeWidth="6" strokeLinecap="round"/>{[[59,121],[111,121],[171,121],[217,56],[272,121]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="15" fill={i===3?'#8b82d8':'#ee9869'} stroke="white" strokeWidth="4"/><circle cx={x} cy={y} r="4" fill="white"/></g>)}<rect x="148" y="31" width="57" height="45" rx="14" fill="#a296e5"/><text x="176" y="58" textAnchor="middle" fill="white" fontSize="18" fontWeight="900">+</text><rect x="209" y="142" width="76" height="28" rx="10" fill="white"/><text x="247" y="161" textAnchor="middle" fontSize="13" fontWeight="900" fill="#b67150">main</text><rect x="44" y="41" width="73" height="45" rx="10" fill="white"/><path d="m60 53-8 9 8 9m17-18 8 9-8 9m-7-20-5 22" fill="none" stroke="#c7835a" strokeWidth="3" strokeLinecap="round"/>
    </>:courseId==='ml' ? <>
      <path d="M48 146h238M59 153V37" stroke="#aec4da" strokeWidth="3" strokeLinecap="round" />
      <path d="m68 128 57-15 62-46 77-24" fill="none" stroke="#58cc02" strokeWidth="6" strokeLinecap="round" />
      {[[78,112],[94,123],[115,95],[130,115],[164,79],[177,91],[202,62],[227,63],[250,37],[271,56]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="8" fill={i < 4 ? '#6a8be9' : '#58cc02'} stroke="white" strokeWidth="3" />)}
      <rect x="199" y="103" width="95" height="47" rx="15" fill="white" /><path d="M211 126h17l8-12 10 24 10-19 12 7h13" fill="none" stroke="#8c79d7" strokeWidth="3" strokeLinecap="round" />
    </> : <>
      <path d="M170 54 99 101m71-47 71 47M99 101 61 147m38-46 41 46m101-46-39 46m39-46 39 46" stroke="#acd687" strokeWidth="6" strokeLinecap="round" />
      {[[170,54],[99,101],[241,101],[61,147],[140,147],[202,147],[280,147]].map(([x,y],i) => <g key={i}><circle cx={x} cy={y} r={i ? 19 : 25} fill={i ? '#58cc02' : '#3caa13'} /><text x={x} y={y+6} textAnchor="middle" fill="white" fontSize="18" fontWeight="900">{[8,3,12,1,6,10,14][i]}</text></g>)}
    </>}
    <path d="m29 43 3 9 10 3-10 3-3 10-3-10-10-3 10-3zM305 70l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="#ffc800" />
  </svg>;
}
export function CoursesPage() {
  const { courses, course, selectCourse, notify, state } = useApp();
  const navigate = useNavigate(), [busy, setBusy] = useState(''), reduced = useMotionPreference();
  return <div className="wide-page courses-page">
    <span className="eyebrow">BYTEPATH · THƯ VIỆN KHÓA HỌC</span><h1>Bạn muốn khám phá gì?</h1><p>Mỗi khóa một hành trình. Cùng một bộ sưu tập thành tích.</p>
    <div className="course-catalog">{courses.map(c => {
      const count = c.mandatoryCount ?? c.lessons?.length ?? 0, completed = c.completed ?? state.courses?.[c.id]?.completed ?? 0,info=courseInfo(c);
      return <motion.article key={c.id} className={`course-choice ${c.id === course.id ? 'selected' : ''}`} whileHover={reduced?undefined:{ y: -3 }}>
        <CourseArt courseId={c.id} /><div className="course-choice-content"><span className="eyebrow">{c.tagline||info.tagline}</span><h2>{c.title}</h2><p>{c.description||info.description}</p><span className="course-meta">{count} buổi bắt buộc{c.advancedCount?` · ${c.advancedCount} buổi mở rộng`:''}</span><ProgressBar value={completed} max={count} /><small>{completed}/{count} buổi đã đạt</small><Button busy={busy === c.id} onClick={async () => { setBusy(c.id); try { await selectCourse(c.id); navigate('/'); } catch(e) { notify((e as Error).message); } finally { setBusy(''); } }}>{completed ? 'TIẾP TỤC' : 'KHÁM PHÁ KHÓA HỌC'}<Icon name="right" size={18} /></Button></div>
      </motion.article>;
    })}</div>
  </div>;
}
export function LearningHub() {
  const { course, state } = useApp();
  return <div className="wide-page learning-hub"><span className="eyebrow">LUYỆN CÙNG BYTE</span><h1>Một chút luyện, nhớ lâu hơn.</h1><p>Chọn cách luyện phù hợp với bạn hôm nay.</p><div className="learning-options">
    {[['/review','refresh','Ôn kiến thức',`${state.reviewDue} buổi đến hạn · hồi năng lượng khi đạt`],['/knowledge','chat','Mẹo & Phỏng vấn','Đọc biểu đồ, tìm lỗi, ghép ý tưởng · kiếm kim cương'],['/practice','code','Phòng thực hành',`${course.id.toUpperCase()} · viết code với dữ liệu mới`]].map(([to,icon,title,description]) => <Link key={to} to={to}><span className="learning-option-icon"><Icon name={icon} size={35} /></span><div><h2>{title}</h2><p>{description}</p></div><Icon name="next" /></Link>)}
  </div><div className="practice-mascot-note"><Byte size={135} mood="encouraging" /><p>Làm sai là một bước trong quá trình học.<br /><strong>Thử lại bao nhiêu lần cũng được.</strong></p></div></div>;
}
export function ProfileLevel() {
  const { state } = useApp(), l = state.level;
  if (!l) return null;
  return <div className="profile-level"><div className="level-emblem"><Icon name="star" size={26} /><b>{l.level}</b></div><div><div className="row between"><strong>Cấp {l.level} / 30</strong><small>{l.capped ? 'Đã đạt cấp tối đa' : `${l.xpIntoLevel} / ${l.xpForNext} XP`}</small></div><ProgressBar value={l.capped ? 1 : l.xpIntoLevel} max={l.capped ? 1 : l.xpForNext} /><p>{l.capped ? 'Mỗi XP mới vẫn được tính vào mục tiêu và giải đấu.' : 'Mỗi cấp mở một món quà dành riêng cho bạn.'}</p></div></div>;
}
export function ProfileFrames() {
  const {state,refresh,notify}=useApp();
  const frames=[['frame-leaf','Lá non',6],['frame-wave','Sóng xanh',11],['frame-star','Sao sáng',16],['frame-moon','Trăng nhỏ',21],['frame-prism','Lăng kính',26]] as const;
  return <section className="profile-frames"><h2>Khung avatar</h2><p>Quà riêng tại các cột mốc cấp độ.</p><div>{frames.map(([id,name,level])=>{
    const owned=state.avatarFrames?.includes(id),selected=state.profile.avatarFrame===id;
    return <button key={id} className={selected?'selected':''} disabled={!owned||selected} aria-label={`${name}${owned?', trang bị':', mở tại cấp '+level}`} onClick={async()=>{try{await api('/profile','PUT',{...state.profile,avatarFrame:id});await refresh();}catch(e){notify((e as Error).message);}}}><span className={`avatar-frame ${id}`}><Icon name={owned?'user':'lock'} size={24}/></span><strong>{name}</strong><small>{selected?'Đang dùng':owned?'Trang bị':'Cấp '+level}</small></button>;
  })}</div></section>;
}
function chime() {
  const audio = new AudioContext();
  [.0, .12, .26].forEach((t, i) => { const o = audio.createOscillator(), g = audio.createGain(); o.connect(g); g.connect(audio.destination); o.frequency.value = [523,659,784][i]; g.gain.setValueAtTime(.05,audio.currentTime+t); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+t+.3); o.start(audio.currentTime+t); o.stop(audio.currentTime+t+.32); });
  setTimeout(() => void audio.close(), 1000);
}
export function LevelCelebration() {
  const { state, refresh, notify } = useApp(), systemReduced = useMotionPreference(), [closing,setClosing] = useState(false);
  const [blocked, setBlocked] = useState(true);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const check = () => setBlocked(!!document.querySelector('[role="dialog"]:not(.level-event-modal)'));
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check();
    return () => observer.disconnect();
  }, []);
  const events = (state.rewardEvents || []).filter(e => !e.seen), event = events[0];
  const reduced = systemReduced || state.profile.settings?.reducedMotion;
  const visible = !!event && !blocked;
  const toLevel = events.at(-1)?.toLevel ?? 1;
  const leveledUp = events.some(e => e.toLevel > e.fromLevel);
  useEffect(() => {
    if (!visible) return;
    setPhase(reduced ? 3 : 0);
    if (reduced) return;
    const timers = [720, 1250, 1920].map((delay, i) => window.setTimeout(() => setPhase(i + 1), delay));
    return () => timers.forEach(window.clearTimeout);
  }, [visible, event?.id, reduced]);
  async function seen() { setClosing(true); try { for (const e of events) await api('/reward-events/'+e.id+'/seen','POST',{}); await refresh(); } catch(e) { notify((e as Error).message); } finally { setClosing(false); } }
  return <LevelUpOverlay open={visible} level={toLevel} eventId={events.map(e => e.id).join(':') || undefined} variant={leveledUp ? 'level' : 'badge'} title={leveledUp ? 'Bạn đã lên cấp' : 'Quà hoàn thành khóa học'}>
    <CelebrationScene
      variant={leveledUp ? 'level' : 'capstone'}
      title={leveledUp ? toLevel - (event?.fromLevel ?? 1) > 1 ? 'Liên tiếp những cột mốc!' : 'Bạn đã lên cấp!' : 'Một hành trình trọn vẹn!'}
      subtitle={leveledUp ? 'Kiến thức tăng lên. Bộ sưu tập cũng vậy.' : 'Diện mạo đặc biệt dành cho thành tích của bạn.'}
      level={leveledUp ? toLevel : undefined}
      compact
      showSkip={false}
    >
      {leveledUp && <div className="level-story" data-phase={phase}>
        <div className="level-story-label"><span>HÀNH TRÌNH KINH NGHIỆM</span><span aria-live="polite">{phase === 0 ? 'Đang tăng XP' : phase < 3 ? 'Cột mốc mới!' : 'Quà của bạn'}</span></div>
        <div className="level-xp-bar" aria-label="Đã đủ kinh nghiệm để lên cấp">
          <motion.span key={event?.id} initial={reduced ? false : { width: '0%' }} animate={{ width: '100%' }} transition={{ duration: reduced ? 0 : .7, ease: [.22,1,.36,1] }} />
          <motion.i aria-hidden="true" initial={false} animate={reduced ? {} : { opacity: [0,.9,0], x: ['-20%','120%'] }} transition={{ duration: .7 }} />
        </div>
        <div className="level-story-number"><span>Cấp {event?.fromLevel}</span><Icon name="right" size={17} /><motion.strong key={phase > 0 ? 'new-level' : 'previous-level'} initial={reduced ? false : { scale: .8, y: 6 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 300 }}>Cấp {phase > 0 ? toLevel : event?.fromLevel}</motion.strong></div>
      </div>}
      <div className="level-gifts level-story-gifts" aria-label="Quà đã được thêm vào bộ sưu tập">
        {events.flatMap(e => e.rewards || []).map((r,i) => <motion.div className="bp-reveal" key={`${r.level ?? ''}:${r.itemId ?? r.type}:${i}`} initial={reduced ? false : { opacity: 0, scale: .9, y: 14 }} animate={phase >= 3 || reduced ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: .9, y: 14 }} transition={{ delay: reduced ? 0 : Math.min(i,5)*.075, type: 'spring', damping: 18 }}>
          <span className={`level-gift-icon ${r.type === 'skin' ? 'level-gift-mascot' : ''}`}>{r.type === 'skin' ? <Byte skin={r.itemId} size={55} mood="celebrate" /> : <Icon name={r.type === 'gems' || r.type === 'gem' ? 'gem' : r.type === 'frame' ? 'user' : 'gift'} size={24} />}</span>
          <span>{r.name || r.itemId || 'Kim cương'}{r.type === 'gems' || r.type === 'energy-voucher' ? '' : r.amount > 1 ? ` ×${r.amount}` : ''}</span>
          {r.level && <small>Cấp {r.level}</small>}
        </motion.div>)}
      </div>
      <p className="level-reward-caption">Quà đã được lưu. Tiếp tục khám phá cùng Byte nhé!</p>
    </CelebrationScene>
    <div className="reward-dialog-actions"><Button busy={closing} onClick={() => { if(state.profile.settings?.sound) { try {chime();} catch {} } void seen(); }}>TIẾP TỤC KHÁM PHÁ<Icon name="right" size={19} /></Button><button className="text-link" disabled={closing} onClick={() => void seen()}>Bỏ qua hiệu ứng</button></div>
  </LevelUpOverlay>;
}
