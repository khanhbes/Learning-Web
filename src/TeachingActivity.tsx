import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { api } from './api';
import { Button, Icon } from './components';
import { useApp } from './context';
import { useMotionPreference } from './motionPreference';
import { useMascot } from './bitty/MascotProvider';
import { currentLanguage } from './courseUI';
import type { Attempt } from './types';
import LearningDataView from './LearningDataView';

export function activityInitialValue(question: any) {
  return question.kind === 'order' ? question.items.map((item: any) => item.id) : question.kind === 'match' ? {} : '';
}
function entryFields(question: any): any[] {
  const fields = question.fields || question.ui?.fields;
  return Array.isArray(fields) ? fields : [];
}
function FieldAnswer({ question, value, onChange }: { question: any; value: any; onChange: (value: any) => void }) {
  const fields = entryFields(question);
  let object: Record<string, any> = {};
  try { object = typeof value === 'string' && value.trim() ? JSON.parse(value) : value || {}; } catch { /* Retain the text until it is valid. */ }
  if (fields.length) return <fieldset className="teaching-answer-fields"><legend>{question.answerLabel || 'Kết quả bạn dự đoán'}</legend>{fields.map((field: any, index) => {
    const key = field.key || field.name || field.id || String(index);
    return <label key={key}>{field.label || key}{field.type === 'boolean' ? <select value={object?.[key] === undefined ? '' : String(object[key])} onChange={event => {
      const next = { ...object };
      if (event.target.value === '') delete next[key]; else next[key] = event.target.value === 'true';
      onChange(JSON.stringify(next));
    }}><option value="">Chọn…</option><option value="true">Đúng (true)</option><option value="false">Sai (false)</option></select> : <input type={field.type === 'number' ? 'number' : 'text'} step="any" value={object?.[key] === null ? 'null' : object?.[key] ?? ''} placeholder={field.placeholder || (field.type === 'scalar' ? '0, false hoặc null' : '')} onChange={event => {
      let entry:any=event.target.value;
      if(field.type==='number'&&entry!=='')entry=Number(entry);
      if(field.type==='scalar'){try{entry=JSON.parse(entry);}catch{/* Keep incomplete text editable. */}}
      const next = { ...object, [key]: entry };
      onChange(JSON.stringify(next));
    }}/>}</label>;
  })}</fieldset>;
  const numeric = question.kind === 'number' || question.ui === 'number' || question.ui?.kind === 'number' || question.ui?.type === 'number';
  const single = numeric || question.kind === 'fill' || question.ui === 'text' || question.ui?.kind === 'text';
  return <label className="lab-output teaching-output">{question.answerLabel || (question.kind === 'fill' ? 'Điền phần còn thiếu' : 'Kết quả bạn dự đoán')}
    {single ? <input type={numeric ? 'number' : 'text'} step="any" spellCheck={false} value={typeof value === 'object' ? JSON.stringify(value) : value} placeholder={question.placeholder || question.ui?.placeholder || (numeric ? 'Nhập một số' : 'Nhập câu trả lời')} onChange={event => onChange(event.target.value)}/>
      : <textarea spellCheck={false} aria-label={question.answerLabel || 'Kết quả dự đoán'} rows={3} placeholder={question.placeholder || question.ui?.placeholder || 'Ví dụ: 8, true hoặc [0, 1]'} value={typeof value === 'object' ? JSON.stringify(value) : value} onChange={event => onChange(event.target.value)}/>}
    {!single && <small>Dùng số, true/false hoặc danh sách trong dấu ngoặc vuông. Không cần viết chương trình.</small>}
  </label>;
}

export function ActivityControls({ question: q, value, onChange, disabled = false }: { question: any; value: any; onChange: (value: any) => void; disabled?: boolean }) {
  const dragged = useRef(''), reduced = useMotionPreference();
  const { state, course } = useApp();
  function move(id: string, to: number) {
    const order = [...value] as string[], from = order.indexOf(id);
    if (from < 0) return;
    order.splice(from, 1); order.splice(Math.max(0, Math.min(to, order.length)), 0, id); onChange(order);
  }
  const code = typeof q.code === 'string' ? q.code : q.code?.[currentLanguage(course, state.profile.language)];
  return <fieldset className="activity-controls" disabled={disabled}>
    {q.template && <p className="teaching-fill-template">{q.template}</p>}
    {q.input !== undefined && <LearningDataView value={q.input} label={q.inputLabel || 'Quan sát dữ liệu'}/>}
    {code && <pre className="teaching-short-code"><code>{code}</code></pre>}
    {q.kind === 'order' && <ol className="step-sorter">{(value as string[]).map((id, index) => <motion.li layout={!reduced} key={id} draggable={!disabled} onDragStart={() => { dragged.current = id; }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); move(dragged.current, index); }}>
      <span className="step-handle" aria-hidden="true">⠿</span><b>{index + 1}</b><p>{q.items.find((item: any) => item.id === id)?.text}</p><div><button type="button" aria-label={`Đưa bước ${index + 1} lên`} disabled={disabled || index === 0} onClick={() => move(id, index - 1)}><Icon name="up" size={17}/></button><button type="button" aria-label={`Đưa bước ${index + 1} xuống`} disabled={disabled || index === value.length - 1} onClick={() => move(id, index + 1)}><Icon name="down" size={17}/></button></div>
    </motion.li>)}</ol>}
    {q.kind === 'match' && <div className="match-pairs">{q.pairs.map((pair: any) => <label key={pair.id}><strong>{pair.left}</strong><Icon name="right" size={18}/><select value={value[pair.id] ?? ''} aria-label={'Ý nghĩa của ' + pair.left} onChange={event => onChange({ ...value, [pair.id]: event.target.value })}><option value="">Chọn ý nghĩa…</option>{q.options.map((option: any) => <option key={option.id} value={option.id}>{option.text}</option>)}</select></label>)}</div>}
    {(q.kind === 'choice' || (q.kind === 'fill' && q.options?.length)) && <div className="lab-choices">{q.options.map((option: any) => <button type="button" key={option.id} aria-pressed={value === option.id} onClick={() => onChange(option.id)}>{option.text}</button>)}</div>}
    {(['number', 'output'].includes(q.kind) || (q.kind === 'fill' && !q.options?.length)) && <FieldAnswer question={q} value={value} onChange={onChange}/>}
  </fieldset>;
}

export default function TeachingActivity({ attempt, questionId, onChange, onTried, onReview }: { attempt: Attempt; questionId: string; onChange: (attempt: Attempt) => void; onTried?: () => void; onReview?: () => void }) {
  const { notify } = useApp(), mascot = useMascot(), reduced = useMotionPreference();
  const [busy, setBusy] = useState(false), [wrongCount, setWrongCount] = useState(0);
  const alive = useRef(true), inFlight = useRef(false), latest = useRef(attempt), notified = useRef(new Set<string>());
  latest.current = attempt;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => setWrongCount(0), [questionId]);
  const lab = attempt.lab, q = lab?.questions.find((item: any) => item.id === questionId);
  if (!q) return <p className="teaching-muted">Hoạt động của bản nháp này nằm trong mục Luyện tập đã lưu.</p>;
  const value = lab.drafts?.[q.id] ?? lab.responses?.[q.id]?.value ?? activityInitialValue(q);
  const feedback = lab.responses?.[q.id];
  const currentFeedback = feedback && JSON.stringify(feedback.value) === JSON.stringify(value) ? feedback : null;
  const protectedAttempt = attempt.mode === 'assessment' || attempt.mode === 'capstone';
  function update(next: any) { const a = latest.current; onChange({ ...a, lab: { ...a.lab, drafts: { ...a.lab.drafts, [q.id]: next } } }); }
  async function check() {
    if (inFlight.current || protectedAttempt || attempt.status !== 'active') return;
    inFlight.current = true; setBusy(true);
    try {
      const result = await api(`/attempts/${attempt.id}/lab`, 'POST', { questionId: q.id, value });
      if (!alive.current) return;
      const a = latest.current, next = { ...a, lab: { ...result.attempt.lab, drafts: { ...result.attempt.lab.drafts, ...a.lab.drafts, [q.id]: value } }, updatedAt: result.attempt.updatedAt };
      onChange(next); onTried?.();
      const response = result.attempt.lab.responses[q.id], eventId = `teaching:${attempt.id}:${q.id}:${JSON.stringify(value).slice(0, 160)}`;
      if (!response.correct) setWrongCount(count => count + 1);
      if (!notified.current.has(eventId)) { notified.current.add(eventId); mascot.say(response.correct ? 'correct' : 'wrong', { id: eventId }); }
    } catch (error) { notify((error as Error).message); }
    finally { inFlight.current = false; if (alive.current) setBusy(false); }
  }
  return <section className="teaching-activity" aria-label={q.title || 'Thử bằng tay'}>
    {q.title && <h3>{q.title}</h3>}<p>{q.prompt}</p>
    <ActivityControls question={q} value={value} onChange={update} disabled={busy || protectedAttempt || attempt.status !== 'active'}/>
    {currentFeedback && <motion.div role="status" initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`lab-feedback ${currentFeedback.correct ? 'correct' : 'retry'}`}><Icon name={currentFeedback.correct ? 'success' : 'info'} size={24}/><div><strong>{currentFeedback.correct ? 'Bạn đã hiểu bước này!' : 'Cùng xem lại cách nghĩ'}</strong>{currentFeedback.misconception && <p>Điều cần phân biệt: {currentFeedback.misconception}</p>}<p>{currentFeedback.explanation}</p>{currentFeedback.example && <LearningDataView value={currentFeedback.example} label="Thử nhìn ví dụ nhỏ này" raw={false}/>} {currentFeedback.nextTry && <p>{currentFeedback.nextTry}</p>}</div></motion.div>}
    {(wrongCount >= 2 || currentFeedback?.reviewSuggested) && !currentFeedback?.correct && onReview && <button type="button" className="teaching-review-link" onClick={onReview}><Icon name="book" size={17}/> Xem lại ví dụ rồi thử tiếp</button>}
    <div className="teaching-check"><Button busy={busy} variant={currentFeedback?.correct ? 'outline' : undefined} disabled={protectedAttempt || attempt.status !== 'active'} onClick={check}><Icon name={currentFeedback?.correct ? 'refresh' : 'check'} size={18}/>{currentFeedback?.correct ? 'THỬ KIỂM TRA LẠI' : 'KIỂM TRA CÁCH LÀM'}</Button><small>Luyện tập · Có thể làm lại</small></div>
  </section>;
}
