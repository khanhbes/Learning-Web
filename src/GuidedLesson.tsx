import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { api } from './api';
import { Button, Icon, Modal, ProgressBar } from './components';
import { useApp } from './context';
import { useMotionPreference } from './motionPreference';
import type { Attempt, Language, LearningProgress, Lesson, TeachingStep } from './types';
import { currentLanguage, gitCourse } from './courseUI';
import Mascot from './bitty/Mascot';
import TeachingActivity, { ActivityControls, activityInitialValue } from './TeachingActivity';
import LearningDataView from './LearningDataView';
import TeachingTrace from './TeachingTrace';
import Visualizer from './Visualizer';
import MLVisualizer from './MLVisualizer';
import DAVisualizer from './DAVisualizer';
import AgentVisualizer from './AgentVisualizer';
import LinearVisualizer from './LinearVisualizer';
import GitWorkbench from './GitWorkbench';
import DockerVisualizer from './DockerVisualizer';
import GenAIVisualizer from './GenAIVisualizer';
import RAGVisualizer from './RAGVisualizer';
import './teaching.css';

const stageNames: Record<string, string> = { intro: 'Gặp một vấn đề', model: 'Xem một ví dụ', guided: 'Cùng làm từng bước', practice: 'Tự mình thử', transfer: 'Vận dụng điều vừa học', code: 'Từ ý tưởng đến code' };
const bridgeNames: Record<string, string> = { variables: 'Biến và giá trị', condition: 'Điều kiện', conditions: 'Điều kiện', loops: 'Vòng lặp', functions: 'Hàm và return', lists: 'Danh sách', dictionaries: 'Dictionary', input: 'Dữ liệu đầu vào', errors: 'Đọc lỗi Python', coordinates: 'Tọa độ', fractions: 'Phân số', percentages: 'Phần trăm', sum: 'Tổng', sums:'Tổng và cộng dồn',recursion:'Đệ quy và điểm dừng', mean: 'Trung bình', notation: 'Ký hiệu toán' };
function bridgeLabel(id: string) { return bridgeNames[id] || id.replaceAll('-', ' '); }

function CoordinateBoard({ input }: { input: any }) {
  const target:[number,number]=[Number(input?.x??2),Number(input?.y??1)];
  const [point, setPoint] = useState<[number, number]>([0,0]);
  const reduced = useMotionPreference(), size = 27, origin = 165;
  const x = Number.isFinite(point[0]) ? Math.max(-5, Math.min(5, point[0])) : 0, y = Number.isFinite(point[1]) ? Math.max(-5, Math.min(5, point[1])) : 0;
  function move(event:React.PointerEvent<SVGSVGElement>){const svg=event.currentTarget,ctm=svg.getScreenCTM();if(!ctm)return;const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const v=p.matrixTransform(ctm.inverse());setPoint([Math.max(-5,Math.min(5,Math.round((v.x-origin)/size))),Math.max(-5,Math.min(5,Math.round((origin-v.y)/size)))]);}
  return <div className="coordinate-board"><svg style={{touchAction:'none'}} viewBox="0 0 330 330" role="img" aria-label={`Bitty ở tọa độ ${x}, ${y}; x theo chiều ngang, y theo chiều dọc.`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={e=>{if(e.buttons===1)move(e);}}>
    {Array.from({ length: 11 }, (_, i) => <g key={i}><line x1={origin + (i-5)*size} y1="24" x2={origin + (i-5)*size} y2="306" stroke="#e1eade"/><line x1="24" y1={origin + (i-5)*size} x2="306" y2={origin + (i-5)*size} stroke="#e1eade"/></g>)}
    <path d="M24 165H310M165 306V20" stroke="#849786" strokeWidth="2"/><text x="308" y="186">x</text><text x="177" y="25">y</text><text x="150" y="184">0</text>
    <path d={`M165 165H${origin+x*size}V${origin-y*size}`} fill="none" stroke="#94c85d" strokeWidth="5" strokeDasharray="6 5"/>
    <motion.g animate={{ x: origin + x*size, y: origin - y*size }} transition={{ duration: reduced ? 0 : .25 }}><circle r="14" fill="#65b32d"/><circle cx="-4" cy="-2" r="2" fill="white"/><circle cx="4" cy="-2" r="2" fill="white"/><path d="M-4 4Q0 7 4 4" fill="none" stroke="white" strokeWidth="1.5"/></motion.g>
    <text x="20" y="324">Ngang trước, dọc sau</text>
  </svg><div className="coordinate-inputs"><p>Thử đưa Bitty đến <strong>[{target.join(', ')}]</strong>: ngang trước, dọc sau.</p>{(['x', 'y'] as const).map((axis, index) => <label key={axis}>{axis} · {index === 0 ? 'ngang' : 'dọc'}<input aria-label={`Tọa độ ${axis}`} type="range" min="-5" max="5" step="1" value={index === 0 ? x : y} onChange={event => setPoint(p => index === 0 ? [Number(event.target.value), p[1]] : [p[0], Number(event.target.value)])}/><output>{index === 0 ? x : y}</output></label>)}<p aria-live="polite">Vị trí hiện tại <strong>[{x}, {y}]</strong>{x===target[0]&&y===target[1]?' · Đã đến đúng điểm!':''}</p><button className="text-link" type="button" onClick={() => setPoint([0,0])}>Về gốc [0, 0]</button></div></div>;
}

function ExplainedCode({ code, annotations = [] }: { code: string; annotations?: (string | { line?: number; text: string })[] }) {
  const [active, setActive] = useState(0), lines = code.split('\n'), initial = lines.slice(0, 14), rest = lines.slice(14);
  function line(text: string, i: number) { const annotation = annotations[i]; return <button type="button" key={i} className={active === i ? 'active' : ''} onClick={() => setActive(i)} aria-label={`Dòng ${i+1}: ${text}`}><span aria-hidden="true">{i+1}</span><code>{text || ' '}</code>{annotation && <Icon name="info" size={14}/>}</button>; }
  const explanation = annotations[active];
  return <div className="explained-code"><div className="explained-code-lines">{initial.map(line)}</div>{rest.length > 0 && <details><summary>Xem {rest.length} dòng hỗ trợ</summary><div className="explained-code-lines">{rest.map((text, i) => line(text, i + 14))}</div></details>}{explanation && <p className="code-line-caption" role="status"><b>Dòng {typeof explanation === 'string' ? active+1 : explanation.line ?? active+1}:</b> {typeof explanation === 'string' ? explanation : explanation.text}</p>}<small>Chạm một dòng để xem lời giải thích.</small></div>;
}

function BridgeLesson({ bridgeId, language, onClose }: { bridgeId: string; language: Language; onClose: () => void }) {
  const { notify, refresh } = useApp();
  const [bridge, setBridge] = useState<any>(null), [error, setError] = useState(''), [values, setValues] = useState<Record<string, any>>({}), [feedback, setFeedback] = useState<Record<string, any>>({}), [busy, setBusy] = useState(false), [started, setStarted] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => { let active = true; api(`/learning/bridges/${bridgeId}?language=${language}`).then(value => { if (active) setBridge(value.bridge || value); }).catch(error => { if (active) setError(error.message); }); api(`/learning/bridges/${bridgeId}`, 'PUT', { language, status: 'seen' }).then(() => refresh()).catch(() => {}); return () => { active = false; }; }, [bridgeId, language]);
  const checks = bridge?.tasks || bridge?.questions || bridge?.checks || [], diagnostic = bridge?.diagnostic;
  async function check(q: any) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try { const result = await api(`/learning/bridges/${bridgeId}/check`, 'POST', { questionId: q.id, value: values[q.id] ?? activityInitialValue(q), language }); setFeedback(prev => ({ ...prev, [q.id]: result.feedback || result })); await refresh(); }
    catch (error) { notify((error as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const title = bridge?.title || bridgeLabel(bridgeId);
  async function skip() { try { await api(`/learning/bridges/${bridgeId}`, 'PUT', { language, status: 'skipped' }); await refresh(); onClose(); } catch (error) { notify((error as Error).message); } }
  return <Modal open onClose={onClose} title={title} className="teaching-bridge-modal"><div className="teaching-bridge"><span className="eyebrow">BỔ TRỢ NGAY TẠI ĐÂY</span><h2>{title}</h2><p className="teaching-muted">Học một ý nhỏ rồi quay lại đúng bước đang làm. Phần này không tính điểm hoặc tiêu hao năng lượng.</p>{error ? <p role="alert">{error}</p> : !bridge ? <p role="status">Đang mở ví dụ…</p> : <>
    {!started && diagnostic ? <section><h3>{diagnostic.prompt}</h3><ActivityControls question={{ ...diagnostic, kind: diagnostic.kind || 'choice' }} value={values[diagnostic.id] ?? activityInitialValue({ ...diagnostic, kind: diagnostic.kind || 'choice' })} onChange={value => setValues(prev => ({ ...prev, [diagnostic.id]: value }))}/>{feedback[diagnostic.id] && <p role="status">{feedback[diagnostic.id].explanation}</p>}<div className="teaching-bridge-actions"><Button busy={busy} onClick={() => check(diagnostic)}>THỬ TRẢ LỜI</Button><Button variant="outline" onClick={() => setStarted(true)}>TÔI CHƯA BIẾT</Button></div>{feedback[diagnostic.id] && <button className="text-link" onClick={() => setStarted(true)}>Xem ví dụ ngắn</button>}</section> : <>
      <p>{bridge.text || bridge.explanation}</p>{(bridge.paragraphs || []).map((text: string) => <p key={text}>{text}</p>)}
      {bridge.example && <div className="teaching-bridge-example">{typeof bridge.example === 'string' ? <p>{bridge.example}</p> : <><p>{bridge.example.text || bridge.example.explanation}</p><LearningDataView value={bridge.example.input} label="Ví dụ" raw={false}/>{bridge.example.output !== undefined && <LearningDataView value={bridge.example.output} label="Kết quả" raw={false}/>} {bridge.example.code && <ExplainedCode code={bridge.example.code}/>}</>}{bridge.code && <ExplainedCode code={typeof bridge.code === 'string' ? bridge.code : bridge.code[language] || bridge.code.python} annotations={bridge.annotations?.[language] || []}/>}</div>}
      {checks.map((q: any, index: number) => <section className="teaching-bridge-check" key={q.id}><span className="eyebrow">THỬ {index+1}/{checks.length}</span><h3>{q.prompt}</h3><ActivityControls question={q} value={values[q.id] ?? activityInitialValue(q)} onChange={value => setValues(prev => ({ ...prev, [q.id]: value }))} disabled={busy}/>{feedback[q.id] && <p className={feedback[q.id].correct ? 'teaching-correct' : 'teaching-retry'} role="status">{feedback[q.id].correct ? 'Đúng rồi. ' : 'Cùng thử lại. '}{feedback[q.id].explanation}</p>}<Button busy={busy} variant="outline" onClick={() => check(q)}>KIỂM TRA</Button></section>)}
    </>}
  </>}<div className="teaching-bridge-return"><Button onClick={onClose}><Icon name="left" size={18}/> QUAY LẠI BÀI ĐANG HỌC</Button><button type="button" className="text-link" onClick={skip}>Bỏ qua phần bổ trợ này</button></div></div></Modal>;
}

export default function GuidedLesson({ lesson, attempt, onChange, onCode, onAssessment }: { lesson: Lesson; attempt: Attempt; onChange: (attempt: Attempt) => void; onCode: () => void; onAssessment: () => void }) {
  const { state, course } = useApp(), reduced = useMotionPreference(), flow = lesson.teachingFlow!;
  const language = currentLanguage(course, state.profile.language);
  const progress = attempt.learningProgress;
  const initial = Math.max(0, flow.steps.findIndex(step => step.id === progress?.stepId));
  const [index, setIndex] = useState(initial), [tocOpen, setTocOpen] = useState(false), [bridge, setBridge] = useState(''), [showMore, setShowMore] = useState(false);
  const latest = useRef(attempt), heading = useRef<HTMLHeadingElement>(null), navigated = useRef(false);
  latest.current = attempt;
  const step = flow.steps[index] || flow.steps[0];
  function updateAttempt(a: Attempt) { latest.current = a; onChange(a); }
  function updateProgress(id: string, tried?: string) {
    const a = latest.current, previous = a.learningProgress;
    const next: LearningProgress = { version: flow.version, stepId: id, seen: [...new Set([...(previous?.seen || []), id])], tried: [...new Set([...(previous?.tried || []), ...(tried ? [tried] : [])])] };
    updateAttempt({ ...a, learningProgress: next });
  }
  useEffect(() => { if (step && !latest.current.learningProgress?.seen?.includes(step.id)) updateProgress(step.id); }, [step?.id, attempt.id]);
  useEffect(() => {
    setShowMore(false);
    if (navigated.current) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({top:0,behavior:'instant'});
    }
  }, [step?.id]);
  if (!step) return null;
  function go(next: number) { const target = Math.max(0, Math.min(next, flow.steps.length-1)); navigated.current = true; setIndex(target); setTocOpen(false); updateProgress(flow.steps[target].id); }
  function reviewModel() { let previous = 0; for (let i = 0; i < index; i++) if (flow.steps[i].kind === 'worked' || flow.steps[i].stage === 'model') previous = i; go(previous); }
  function courseVisual() {
    if (course.id === 'docker') return <DockerVisualizer lesson={lesson} compact/>;
    if (course.id === 'genai') return <GenAIVisualizer lesson={lesson} compact/>;
    if (course.id === 'rag') return <RAGVisualizer lesson={lesson} compact/>;
    if (course.id === 'linear' && lesson.id === 1) return <CoordinateBoard input={step.visual?.input || flow.sample.input}/>;
    if (course.id === 'linear') return <LinearVisualizer lesson={lesson} compact/>;
    if (course.id === 'agent') return <AgentVisualizer lesson={lesson} compact/>;
    if (course.id === 'da') return <DAVisualizer lesson={lesson} compact/>;
    if (course.id === 'ml') return <MLVisualizer lesson={lesson}/>;
    if (gitCourse(course)) return <GitWorkbench lesson={lesson} compact/>;
    return <Visualizer problemId={step.visual?.problemId || flow.sample.problemId || lesson.problems[0].id}/>;
  }
  const seen = latest.current.learningProgress?.seen || [], tried = latest.current.learningProgress?.tried || [], code = step.code?.[language];
  return <div className="guided-lesson">
    <div className="guided-toolbar"><button className="guided-toc-toggle" type="button" aria-expanded={tocOpen} onClick={() => setTocOpen(value => !value)}><Icon name="book" size={18}/> Mục lục <Icon name={tocOpen ? 'up' : 'down'} size={16}/></button><span>Bước {index+1}/{flow.steps.length}</span><small>Có thể dừng và tiếp tục</small></div>
    <ProgressBar value={seen.length} max={flow.steps.length}/>
    {tocOpen && <motion.nav aria-label="Mục lục bài học" className="guided-toc" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}>{flow.steps.map((item, i) => <button type="button" key={item.id} aria-current={i === index ? 'step' : undefined} onClick={() => go(i)}><span className={tried.includes(item.id) ? 'tried' : seen.includes(item.id) ? 'seen' : ''}>{tried.includes(item.id) ? <Icon name="check" size={15}/> : i+1}</span><b>{item.title}</b><small>{tried.includes(item.id) ? 'Đã thử' : seen.includes(item.id) ? 'Đã xem' : stageNames[item.stage]}</small></button>)}</motion.nav>}
    <motion.article className="guided-step" key={step.id} initial={reduced ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .18 }}>
      <div className="guided-step-heading"><div><span className="eyebrow">{stageNames[step.stage]}</span><h1 tabIndex={-1} ref={heading}>{step.title}</h1>{step.prompt && <p className="guided-question">{step.prompt}</p>}</div>{step.stage === 'intro' && <Mascot size={112}/>}</div>
      {step.id === 'intro' && <ul className="guided-objectives" aria-label="Sau buổi này bạn có thể">{flow.objectives.slice(0, 3).map(item => <li key={item}><Icon name="target" size={18}/>{item}</li>)}</ul>}
      {step.visual && <div className="guided-visual">{step.visual.kind === 'course' ? courseVisual() : step.visual.kind==='trace'&&flow.trace?<TeachingTrace trace={flow.trace} identity={lesson.id+':'+flow.version}/>:<LearningDataView value={step.visual.input} label={step.visual.focus || 'Cùng quan sát'}/>}</div>}
      {step.text && <p className="guided-explanation">{step.text}</p>}
      {step.explanations && <ol className="guided-explanation-steps">{step.explanations.map((text, i) => <li key={i}><span>{i+1}</span><p>{text}</p></li>)}</ol>}
      {step.kind === 'worked' && step.visual?.output !== undefined && <LearningDataView value={step.visual.output} label="Kết quả của ví dụ"/>}
      {code && <ExplainedCode key={step.id + language} code={code} annotations={step.annotations?.[language] || []}/>}
      {step.activityId && <TeachingActivity key={attempt.id + ':' + step.activityId} attempt={attempt} questionId={step.activityId} onChange={updateAttempt} onTried={() => updateProgress(step.id, step.id)} onReview={reviewModel}/>}
      {flow.prerequisites.length > 0 && <div className="guided-prerequisites"><span>Chưa quen một ý?</span>{flow.prerequisites.map(id => <button type="button" key={id} onClick={() => setBridge(id)}><Icon name="sprout" size={15}/>{bridgeLabel(id)}{['check-1','check-2'].every(q => state.learningSupport?.[`${id}:${language}`]?.correct?.includes(q)) && <small>· Đã học bổ trợ</small>}</button>)}</div>}
      {step.kind === 'code' && <div className="guided-code-handoff"><p>Đến lượt bạn viết lời giải. Dữ liệu ví dụ giúp thử ý tưởng; bộ test còn kiểm tra các trường hợp khác.</p><Button onClick={onCode}><Icon name="code" size={18}/> MỞ PHÒNG CODE</Button></div>}
      {step.id === 'intro' && <p className="guided-time"><Icon name="clock" size={15}/> Một buổi gồm các phần ngắn. Bạn có thể tạm dừng sau mỗi phần; bài làm được tự lưu.</p>}
      {flow.glossary.length > 0 && <div className="guided-glossary" aria-label="Giải nghĩa thuật ngữ"><span>Từ mới</span>{flow.glossary.map(item => <details key={item.term}><summary>{item.term}</summary><div><strong>{item.term}</strong><p>{item.definition}</p>{item.example && <small>Ví dụ: {item.example}</small>}</div></details>)}</div>}
      {step.visual?.kind !== 'course' && <details className="guided-more" open={showMore} onToggle={event => setShowMore(event.currentTarget.open)}><summary>Thử thêm với hình tương tác</summary>{showMore && <><p className="teaching-muted">Dữ liệu thử thêm độc lập với ví dụ đã giải phía trên. Thay đổi tại đây không sửa đáp án của hoạt động.</p>{courseVisual()}</>}</details>}
    </motion.article>
    <div className="guided-footer"><Button variant="outline" disabled={index === 0} onClick={() => go(index-1)}><Icon name="left" size={18}/> QUAY LẠI</Button><Button onClick={() => index < flow.steps.length-1 ? go(index+1) : onAssessment()}>{index === flow.steps.length-1 ? 'ĐẾN KIỂM TRA' : 'TIẾP TỤC'}<Icon name="right" size={18}/></Button></div>
    <details className="guided-deep-dive"><summary><Icon name="layers" size={18}/> Tìm hiểu thêm & tài liệu ôn</summary>{flow.deepDive.map((block, i) => <details key={i}><summary>{block.title}</summary><p>{block.text}</p>{block.code?.[language] && <ExplainedCode code={block.code[language]!}/>} {block.commandSnippet && <pre className="teaching-short-code"><code>{block.commandSnippet}</code></pre>}</details>)}<ul>{flow.summary.map(text => <li key={text}>{text}</li>)}</ul></details>
    {bridge && <BridgeLesson key={bridge} bridgeId={bridge} language={language} onClose={() => setBridge('')}/>}
  </div>;
}
