import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TIMELINES } from '../../shared/mascot-motion.mjs';
import { Button, Icon } from '../components';
import Mascot from './Mascot';
import { useMascot } from './MascotProvider';
import { PageTransition, type PageTransitionVariant } from './PageTransition';
import type { MascotNumber, MascotTimeline } from './mascot-types';
import './bitty-studio.css';

const labels: Record<MascotTimeline, string> = {
  idle_breathe: 'Thở nhẹ', idle_blink: 'Chớp mắt', idle_look: 'Nhìn quanh', idle_bored: 'Chờ bạn', idle_sleep: 'Ngủ gật',
  wave_hello: 'Xin chào', teach_talk: 'Giải thích', teach_point: 'Chỉ bài học', teach_think: 'Suy nghĩ', teach_idea: 'Có ý tưởng!', teach_code: 'Gõ code',
  answer_correct: 'Đúng rồi!', answer_correct_combo: 'Chuỗi xuất sắc', answer_wrong: 'Thử lại nhé', answer_almost: 'Gần đúng rồi', timer_hurry: 'Chú ý đồng hồ',
  lesson_complete: 'Xong buổi học', perfect_score: 'Hoàn hảo!', streak_up: 'Giữ ngọn lửa', streak_lost: 'Bắt đầu lại', level_up: 'Lên cấp!', badge_unlock: 'Mở huy hiệu', xp_gain: 'Nhận XP',
  cheer_encourage: 'Cùng cố gắng', loading: 'Đang tải', error_404: 'Lạc đường 404', offline: 'Kiểm tra mạng',
};
const groups: { title: string; icon: string; states: MascotTimeline[] }[] = [
  { title: 'Một người bạn nhỏ', icon: 'heart', states: ['idle_breathe', 'idle_blink', 'idle_look', 'idle_bored', 'idle_sleep', 'wave_hello'] },
  { title: 'Cùng hiểu bài', icon: 'book', states: ['teach_talk', 'teach_point', 'teach_think', 'teach_idea', 'teach_code'] },
  { title: 'Thử, sai, rồi giỏi hơn', icon: 'brain', states: ['answer_correct', 'answer_correct_combo', 'answer_wrong', 'answer_almost', 'timer_hurry', 'cheer_encourage'] },
  { title: 'Mỗi bước đều đáng mừng', icon: 'sparkles', states: ['lesson_complete', 'perfect_score', 'streak_up', 'streak_lost', 'level_up', 'badge_unlock', 'xp_gain'] },
  { title: 'Bitty luôn ở đây', icon: 'network', states: ['loading', 'error_404', 'offline'] },
];
const transitionNames: Record<PageTransitionVariant, string> = {
  mascot_wipe: 'Bitty kéo màn', iris_circle: 'Vòng tròn mở', jump_through: 'Nhảy qua trang',
  slide_card: 'Thẻ trượt nhẹ', curtain_pixel: 'Màn pixel', celebration_fade: 'Dư âm ăn mừng',
};
const controls: { name: MascotNumber; label: string; min: number; max: number; step: number }[] = [
  { name: 'combo', label: 'Chuỗi đúng', min: 0, max: 10, step: 1 },
  { name: 'xp', label: 'XP minh họa', min: 0, max: 999, step: 1 },
  { name: 'mood', label: 'Biểu cảm', min: 0, max: 4, step: 1 },
  { name: 'viseme', label: 'Hình miệng', min: 0, max: 5, step: 1 },
  { name: 'lookX', label: 'Nhìn ngang', min: -1, max: 1, step: .05 },
  { name: 'lookY', label: 'Nhìn dọc', min: -1, max: 1, step: .05 },
];

/** A single live renderer; the 27 selection buttons never spawn hidden canvases. */
export default function BittyStudio() {
  const mascot = useMascot();
  const serial = useRef(0);
  const [selected, setSelected] = useState<MascotTimeline>('wave_hello');
  const [renderer, setRenderer] = useState<'auto' | 'svg' | 'rive'>('auto');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [transition, setTransition] = useState<PageTransitionVariant>('mascot_wipe');
  const [scene, setScene] = useState(0);
  const [pointDirection, setPointDirection] = useState<'left' | 'right'>('right');
  const play = (state = selected) => {
    const inputs = { ...mascot.inputs };
    mascot.cancelAll();
    mascot.setInputs(inputs);
    setSelected(state);
    mascot.say(state, { id: `studio:${++serial.current}`, combo: inputs.combo, xp: inputs.xp, mood: inputs.mood });
  };
  const actual = mascot.state;
  const format = (name: MascotNumber, value: number) => name === 'lookX' || name === 'lookY' ? value.toFixed(2) : value;
  return <div className="bitty-studio">
    <header className="bitty-studio-heading">
      <Link className="text-link" to="/effects"><Icon name="left" size={17} /> Về phòng hiệu ứng</Link>
      <span className="eyebrow">LÀM QUEN VỚI BITTY</span>
      <h1>Một chút tinh nghịch.<br /><span>Thêm nhiều động lực.</span></h1>
      <p>Chạm một biểu cảm, kéo ánh nhìn, xem Bitty kể chuyện bằng chuyển động.</p>
    </header>
    <div className="bitty-studio-stage-layout">
      <section className="bitty-studio-stage" data-theme={theme} aria-label="Sân khấu Bitty">
        <span className="bitty-stage-spark one" aria-hidden="true">✦</span><span className="bitty-stage-spark two" aria-hidden="true">✧</span>
        <span className="bitty-stage-orbit" aria-hidden="true" />
        <div className="bitty-stage-character">
          <Mascot size={280} renderer={renderer} lookAt={{ x: mascot.inputs.lookX, y: mascot.inputs.lookY }}
            combo={mascot.inputs.combo} xp={mascot.inputs.xp} mood={mascot.inputs.mood} viseme={mascot.inputs.viseme}
            pointDirection={pointDirection} motionPaused={mascot.motionPaused} eventKey={mascot.active?.id ?? 'idle'} />
        </div>
        <div className="bitty-stage-status" aria-live="polite"><b>{labels[actual]}</b><span>{actual}</span></div>
        <div className="bitty-stage-actions">
          <Button onClick={() => play()}><Icon name="play" size={18} /> CHƠI LẠI</Button>
          <Button variant="outline" onClick={() => mascot.motionPaused ? mascot.resume() : mascot.pause()}>
            <Icon name={mascot.motionPaused ? 'play' : 'pause'} size={17} /> {mascot.motionPaused ? 'TIẾP TỤC' : 'DỪNG'}
          </Button>
          <button className="text-link" onClick={mascot.skip}>Bỏ qua <Icon name="forward" size={15} /></button>
        </div>
        {mascot.reducedMotion && <p className="bitty-motion-note">Giảm chuyển động đang bật. Biểu cảm giữ yên và chuyển nhẹ.</p>}
      </section>
      <aside className="bitty-studio-controls" aria-label="Điều khiển biểu cảm">
        <h2>Thử thay đổi một chút</h2>
        <label className="bitty-renderer-select">Cách hiển thị<select value={renderer} onChange={e => setRenderer(e.target.value as typeof renderer)}>
          <option value="auto">Tự động</option><option value="rive">Rive</option><option value="svg">Vector SVG</option>
        </select></label>
        <label className="bitty-renderer-select">Nền sân khấu<select value={theme} onChange={e => setTheme(e.target.value as 'light' | 'dark')}>
          <option value="light">Sáng</option><option value="dark">Tối</option>
        </select></label>
        {selected === 'teach_point' && <label className="bitty-renderer-select">Chỉ về phía<select value={pointDirection} onChange={e => setPointDirection(e.target.value as 'left' | 'right')}>
          <option value="left">Bên trái</option><option value="right">Bên phải</option>
        </select></label>}
        {controls.map(control => <label className="bitty-number-control" key={control.name}>
          <span>{control.label}<output>{format(control.name, mascot.inputs[control.name])}</output></span>
          <input type="range" aria-label={control.label} min={control.min} max={control.max} step={control.step}
            value={mascot.inputs[control.name]} onChange={e => mascot.setInputs({ [control.name]: Number(e.target.value) })} />
        </label>)}
        <label className="bitty-renderer-select">Chuyển cảnh<select value={transition} onChange={e => { setTransition(e.target.value as PageTransitionVariant); setScene(value => value + 1); }}>
          {Object.entries(transitionNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select></label>
        <p className="bitty-controls-note">XP và combo ở đây chỉ để xem hiệu ứng. Điểm, kim cương và tiến độ của bạn giữ nguyên.</p>
      </aside>
    </div>
    <section className="bitty-state-library" aria-labelledby="bitty-library-title">
      <div className="bitty-section-title"><div><span className="eyebrow">27 CÁCH ĐỒNG HÀNH</span><h2 id="bitty-library-title">Bộ biểu cảm của Bitty</h2></div><span>Chọn để xem ngay</span></div>
      {groups.map(group => <div className="bitty-state-group" key={group.title}>
        <h3><Icon name={group.icon} size={20} />{group.title}</h3>
        <div className="bitty-state-buttons">{group.states.map(state => <button key={state} data-timeline={state} aria-pressed={selected === state}
          className={selected === state ? 'selected' : ''} onClick={() => play(state)}>
          <span>{labels[state]}</span><small>{TIMELINES[state].loop ? 'Lặp' : `${(TIMELINES[state].duration / 1000).toFixed(1)} giây`}</small>
        </button>)}</div>
      </div>)}
    </section>
    <section className="bitty-transition-lab" aria-labelledby="bitty-transition-title">
      <div className="bitty-section-title"><div><span className="eyebrow">CHẠM ĐỂ TIẾP TỤC</span><h2 id="bitty-transition-title">Chuyển cảnh cũng có câu chuyện</h2></div><span>6 cách chuyển nhẹ nhàng</span></div>
      <div className="bitty-transition-tabs" role="group" aria-label="Kiểu chuyển cảnh">
        {Object.entries(transitionNames).map(([id, label]) => <button key={id} aria-pressed={transition === id}
          onClick={() => { setTransition(id as PageTransitionVariant); setScene(value => value + 1); }}>{label}</button>)}
      </div>
      <div className="bitty-transition-preview">
        <PageTransition transitionKey={`preview:${scene}`} variant={transition}>
          <div className={`bitty-demo-scene scene-${scene % 3}`}>
            <img src="/mascots/bitty/bitty-rig.svg" width="120" height="120" alt="Bitty đồng hành trong một màn hình mẫu" />
            <div><span className="eyebrow">BƯỚC {scene + 1}</span><h3>{['Thêm một ý tưởng hay.', 'Một bài tập, một bước tiến.', 'Bạn làm được rồi!'][scene % 3]}</h3><p>Chuyển cảnh nhanh và nhẹ, để bạn tập trung vào điều đang học.</p></div>
          </div>
        </PageTransition>
      </div>
      <Button variant="outline" onClick={() => setScene(value => value + 1)}>TIẾP TỤC <Icon name="right" size={18} /></Button>
    </section>
  </div>;
}
