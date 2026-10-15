import { useState } from 'react';
import { Button, Icon } from './components';
import type { Attempt } from './types';
import Mascot from './bitty/Mascot';
import TeachingActivity from './TeachingActivity';

export default function HandsOnLab({ attempt, onChange, onQuiz }: { attempt: Attempt; onChange: (attempt: Attempt) => void; onQuiz: () => void }) {
  const [index, updateIndex] = useState(attempt.lab?.cursor ?? 0);
  const lab = attempt.lab, question = lab?.questions[index];
  if (!question) return null;
  function setIndex(next: number) { updateIndex(next); onChange({ ...attempt, lab: { ...lab, cursor: next } }); }
  const names: Record<string, string> = { concept: 'Nhớ một ý', order: 'Xếp bước', match: 'Ghép cặp', predict: 'Dự đoán', fill: 'Điền chỗ trống', debug: 'Sửa lỗi', boundary: 'Thử giới hạn', transfer: 'Vận dụng' };
  return <section className="hands-on" aria-label="Hoạt động thực hành"><div className="lab-intro"><div><span className="eyebrow">HỌC BẰNG CÁCH LÀM</span><h1>Thử bằng đôi tay của bạn</h1><p>Thực hành từng ý. Có thể quay lại ví dụ hoặc thử lại bất kỳ lúc nào.</p></div><Mascot size={105}/></div>
    <div className="lab-tabs" role="tablist" aria-label="Hoạt động tương tác">{lab.questions.map((item: any, i: number) => <button role="tab" type="button" key={item.id} aria-selected={index === i} tabIndex={index === i ? 0 : -1} onClick={() => setIndex(i)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (i+1)%lab.questions.length : event.key === 'ArrowLeft' ? (i+lab.questions.length-1)%lab.questions.length : event.key === 'Home' ? 0 : event.key === 'End' ? lab.questions.length-1 : null;
      if (next !== null) { event.preventDefault(); setIndex(next); event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus(); }
    }}><Icon name={lab.completed?.includes(item.id) ? 'check' : item.kind === 'order' ? 'layers' : item.kind === 'match' ? 'link' : 'puzzle'} size={18}/><span>{names[item.id] || item.title || 'Hoạt động ' + (i+1)}</span></button>)}</div>
    <div className="lab-workspace" role="tabpanel"><TeachingActivity key={question.id} attempt={attempt} questionId={question.id} onChange={onChange}/><div className="lesson-footer"><Button variant="outline" onClick={onQuiz}>CÂU HỎI ÔN <Icon name="right" size={17}/></Button><Button onClick={() => index < lab.questions.length-1 ? setIndex(index+1) : onQuiz()}>{index < lab.questions.length-1 ? 'HOẠT ĐỘNG TIẾP' : 'ÔN LẠI KIẾN THỨC'}<Icon name="right" size={18}/></Button></div></div>
  </section>;
}
