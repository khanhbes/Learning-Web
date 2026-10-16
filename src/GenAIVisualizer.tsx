import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { api } from './api';
import LearningDataView from './LearningDataView';
import { useVisualPlayback, VisualPlayback } from './VisualPlayback';
import type { Lesson } from './types';
import './genai-visualizer.css';

type Bar={id:string;value:number;selected?:boolean};
type Frame={label:string;entries:{label:string;value:unknown}[];tokens?:string[];active?:number[];bars?:Bar[];matrix?:boolean[][];budget?:number;used?:number;kept?:string[];valid?:boolean;stage?:string;result?:unknown};
type Trace={title:string;mode:string;frames:Frame[];input:any;result:unknown;notice:string};
const short=(v:unknown):string=>v===null?'null':typeof v==='number'?String(Number(v.toPrecision(6))):typeof v==='string'?v:typeof v==='boolean'?(v?'đúng':'sai'):Array.isArray(v)?v.map(short).join(', '):JSON.stringify(v);
const labels:Record<string,string>={index:'Vị trí',token:'Mảnh token',total:'Tổng',probability:'Xác suất',numerator:'Tổng tích',denominator:'Tổng trọng số',weight:'Trọng số',value:'Giá trị',product:'Tích',weighted:'Kết quả',window:'Cửa sổ token',reserved:'Dành cho đầu ra',available:'Còn cho prompt',prompt:'Token prompt',fits:'Có vừa không?',budget:'Ngân sách',used:'Đã dùng',remaining:'Còn lại',correct:'Số đúng',actual:'Dự đoán',expected:'Nhãn chuẩn',valid:'Đúng schema',supported:'Có bằng chứng',steps:'Số bước',limit:'Giới hạn',status:'Trạng thái',result:'Kết quả',full:'Tham số nền',adapter:'Tham số adapter',bytes:'Byte trọng số',prefix:'Độ dài tiền tố',equal:'Hai token bằng nhau',rowIndex:'Vị trí đang xét'};

function Bars({bars,reduced,selected,onSelect}:{bars:Bar[];reduced:boolean;selected:string;onSelect:(v:string)=>void}){
 const minimum=Math.min(0,...bars.map(b=>b.value)),maximum=Math.max(1,...bars.map(b=>b.value)),scale=(v:number)=>75+(v-minimum)/(maximum-minimum)*380,zero=scale(0);
 return <svg viewBox={`0 0 520 ${Math.max(150,bars.length*58+60)}`} role="group" aria-label="Biểu đồ giá trị từng ứng viên. Chọn một cột để đọc giá trị.">
  <line x1={zero} x2={zero} y1="15" y2={bars.length*58+20} stroke="#a9a1b5"/><text x={zero} y={bars.length*58+45} textAnchor="middle">0</text>
  {bars.map((b,i)=><g key={b.id} role="button" tabIndex={0} aria-label={`${b.id}: ${short(b.value)}${b.selected?' · được giữ':''}`} aria-pressed={selected===b.id} onClick={()=>onSelect(b.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(b.id);}}}>
   <text x="4" y={i*58+42}>{b.id}</text><motion.rect x={Math.min(zero,scale(b.value))} y={i*58+17} height="34" rx="8" initial={false} animate={{width:Math.max(2,Math.abs(scale(b.value)-zero))}} transition={{duration:reduced?0:0.25}} fill={b.selected?'#399b73':'#a879d7'} stroke={selected===b.id?'#443356':'transparent'} strokeWidth="3"/><text x={Math.max(zero,scale(b.value))+8} y={i*58+40}>{short(b.value)}</text>
  </g>)}
 </svg>;
}
function StatePicture({frame,trace,selected,onSelect,reduced}:{frame:Frame;trace:Trace;selected:string;onSelect:(v:string)=>void;reduced:boolean}){
 const tokens=frame.tokens??(['count','encode'].includes(trace.mode)?trace.input.tokens:undefined);
 if(tokens)return <svg viewBox={`0 0 540 ${Math.max(170,Math.ceil(tokens.length/4)*102+45)}`} role="group" aria-label={`Các mảnh token đã tách: ${tokens.join(' · ')}. Chỉ số bắt đầu từ 0.`}>
  {!tokens.length&&<text x="270" y="80" textAnchor="middle">Danh sách rỗng · 0 token</text>}
  {tokens.map((token:string,i:number)=>{const x=15+i%4*132,y=30+Math.floor(i/4)*102;return <g key={i} role="button" tabIndex={0} aria-label={`Vị trí ${i}: ${token}`} aria-pressed={selected===String(i)} onClick={()=>onSelect(String(i))} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(String(i));}}}><motion.rect x={x} y={y} width="115" height="58" rx="16" initial={false} animate={{fill:frame.active?.includes(i)?'#dcf3e5':'#eee4fa'}} transition={{duration:reduced?0:.2}} stroke={selected===String(i)?'#5a397c':'#c9b2e2'} strokeWidth="2"/><text x={x+57} y={y+35} textAnchor="middle">{token}</text><text x={x+57} y={y+80} textAnchor="middle" className="genai-small">vị trí {i}</text></g>;})}
 </svg>;
 if(frame.matrix){
   const n=frame.matrix.length,size=Math.min(53,350/Math.max(1,n));
   return <svg viewBox="0 0 500 420" role="img" aria-label={`Mặt nạ ${n} × ${n}: hàng i cho phép cột j khi j nhỏ hơn hoặc bằng i. Hàng đang xét ${frame.active?.[0]??'chưa có'}.`}>
     <text x="250" y="25" textAnchor="middle">Cột j · token được nhìn</text>
     {!n&&<text x="250" y="140" textAnchor="middle">n = 0 · ma trận rỗng</text>}
     {frame.matrix.map((row,i)=>row.map((allowed,j)=><g key={`${i}-${j}`}>
       <rect x={70+j*size} y={55+i*size} width={size-5} height={size-5} rx="7" fill={allowed?'#8acfae':'#eee9f2'} stroke={frame.active?.includes(i)?'#6f4893':'transparent'} strokeWidth="2"/>
       <text x={70+j*size+(size-5)/2} y={55+i*size+size*.61} textAnchor="middle">{allowed?'✓':'×'}</text>
     </g>))}
     <text x="250" y="405" textAnchor="middle">✓ được nhìn · × bị che · chỉ số từ 0</text>
   </svg>;
 }
 if(frame.budget!==undefined){const budget=frame.budget,used=frame.used??0,width=420*Math.min(1,used/Math.max(1,budget));return <svg viewBox="0 0 520 215" role="img" aria-label={`Ngân sách ${budget} token; đã dùng ${used}; ${used>budget?'vượt '+(used-budget):'còn '+(budget-used)} token.`}><text x="260" y="40" textAnchor="middle">Ba lô context · {budget} token</text><rect x="50" y="70" width="420" height="62" rx="18" fill="#eee6f4"/><motion.rect x="50" y="70" height="62" rx="18" initial={false} animate={{width}} transition={{duration:reduced?0:.25}} fill={used>budget?'#e78983':'#9569c5'}/><text x="260" y="108" textAnchor="middle" fill={width>210?'white':'#3f2e53'}>{used} / {budget}</text><text x="260" y="170" textAnchor="middle">{used>budget?'Vượt '+(used-budget):'Còn '+(budget-used)} token</text>{frame.kept&&<text x="260" y="200" textAnchor="middle">Giữ: {frame.kept.join(' → ')||'chưa có'}</text>}</svg>;}
 if(frame.bars?.length)return <Bars bars={frame.bars} reduced={reduced} selected={selected} onSelect={onSelect}/>;
 if(frame.stage==='input'){
  const candidates=trace.input?.candidates;
  if(Array.isArray(candidates)&&candidates.length&&candidates.every(c=>typeof(c.weight??c.score)==='number'))return <div><p className="genai-small">Các ứng viên trước khi sắp xếp · {(trace.mode==='top-p'||trace.mode==='top-k')?'trọng số':'điểm'}</p><Bars bars={candidates.map(c=>({id:c.id,value:c.weight??c.score}))} reduced={reduced} selected={selected} onSelect={onSelect}/></div>;
  if(Array.isArray(trace.input?.counts))return <div><p className="genai-small">Số lượt quan sát · chưa chuẩn hóa thành xác suất</p><Bars bars={trace.input.counts.map((value:number,i:number)=>({id:'T'+i,value}))} reduced={reduced} selected={selected} onSelect={onSelect}/></div>;
  return <LearningDataView value={trace.input} label="Dữ liệu trước khi xử lý" raw={false}/>;
 }
 // Compare bars only when all displayed numbers share the same unit. Products,
 // divisors and parameter counts belong in labelled calculation boxes below.
 const numerical=frame.entries.filter(e=>typeof e.value==='number').map(e=>({id:labels[e.label]??e.label,value:e.value as number}));
 if(trace.mode==='latency'&&numerical.length>1)return <Bars bars={numerical} reduced={reduced} selected={selected} onSelect={onSelect}/>;
 const fields=frame.entries.filter(e=>e.label!=='input').slice(0,4);
 return <svg viewBox={`0 0 540 ${Math.max(190,fields.length*86+20)}`} role="img" aria-label={fields.length?fields.map(e=>(labels[e.label]??e.label)+': '+short(e.value)).join('. '):'Dữ liệu đã sẵn sàng. Bấm bước sau để quan sát phép xử lý.'}>
  {(fields.length?fields:[{label:'Bắt đầu',value:'Đọc dữ liệu bên dưới → bấm bước sau'}]).map((e,i)=><g key={e.label}><rect x="16" y={15+i*86} width="508" height="70" rx="16" fill={frame.valid===false?'#fbe8e6':frame.valid===true?'#e1f4e9':'#f0e8f8'}/><text x="34" y={40+i*86} className="genai-small">{labels[e.label]??e.label}</text><text x="34" y={66+i*86}>{short(e.value).length>49?short(e.value).slice(0,46)+'…':short(e.value)}</text></g>)}
 </svg>;
}

function TryThreshold({mode,reduced}:{mode:string;reduced:boolean}){
 const [p,setP]=useState(61),[k,setK]=useState(2),[budget,setBudget]=useState(8),[latest,setLatest]=useState(5),[weight,setWeight]=useState(3),[size,setSize]=useState(3),[filter,setFilter]=useState(mode==='top-k'?'top-k':'top-p'),[inspect,setInspect]=useState('');
 const isTop=['top-p','top-k','greedy','distribution'].includes(mode),isContext=['context','budget'].includes(mode);
 if(isTop){let mass=0;const nucleus:string[]=[];const rows=[60,30,10].map((value,i)=>{const id=['A','B','C'][i],inNucleus=mass<p;if(inNucleus)nucleus.push(id);mass+=value;return{id,value,selected:filter==='top-k'?i<k:inNucleus};});return <div className="genai-try"><h4>Thử thêm · lọc các cột 60%, 30%, 10%</h4><label>Bộ lọc trên hình<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="top-p">Top-p · đủ xác suất</option><option value="top-k">Top-k · đủ số lượng</option></select></label><label>Ngưỡng p: {p}%<input type="range" min="1" max="100" value={p} onChange={e=>setP(Number(e.target.value))}/></label><label>Số lượng k: {k}<input type="range" min="0" max="3" value={k} onChange={e=>setK(Number(e.target.value))}/></label><Bars bars={rows} reduced={reduced} selected={inspect} onSelect={setInspect}/><p role="status">Top-p giữ {nucleus.join(', ')}; top-k giữ {rows.slice(0,k).map(r=>r.id).join(', ')||'không ứng viên nào'}. Hình đang dùng {filter}, cột xanh được giữ. {inspect&&`Đang xem ${inspect}: ${rows.find(r=>r.id===inspect)?.value}%.`}</p><p className="genai-hint">Đơn vị: %. Top-p xét tổng xác suất đạt hoặc vượt p, top-k xét số ứng viên. Đây là bước lọc, chưa lấy mẫu token.</p></div>;}
 if(isContext){const costs=[2,4,latest];let left=budget;const kept:string[]=[];for(let i=2;i>=0;i--){if(costs[i]>left)break;left-=costs[i];kept.unshift('M'+i);}return <div className="genai-try"><h4>Thử thêm · tin mới có vừa ba lô?</h4><label>Ngân sách: {budget} token<input type="range" min="0" max="16" value={budget} onChange={e=>setBudget(Number(e.target.value))}/></label><label>Chi phí tin mới nhất: {latest} token<input type="range" min="1" max="12" value={latest} onChange={e=>setLatest(Number(e.target.value))}/></label><div className="genai-message-row">{costs.map((c,i)=><span key={i} className={kept.includes('M'+i)?'kept':''}>M{i}<strong>{c} token</strong>{kept.includes('M'+i)?'giữ':'bỏ'}</span>)}</div><p role="status">Cũ → mới. Giữ {kept.join(', ')||'không tin nào'}; còn {left} token. Gặp tin không vừa thì dừng, không nhảy qua để nhặt tin cũ.</p></div>;}
 if(mode==='attention')return <div className="genai-try"><h4>Thử thêm · giá trị 2 và 6</h4><label>Trọng số của 6: {weight}<input type="range" min="0" max="8" value={weight} onChange={e=>setWeight(Number(e.target.value))}/></label><p role="status">Trọng số của 2 giữ ở 1. Trung bình có trọng số = (2 + {weight} × 6) / (1 + {weight}) = {short((2+weight*6)/(1+weight))}. {inspect&&`Đang xem trọng số của ${inspect}.`}</p><Bars bars={[{id:'Giá trị 2',value:1},{id:'Giá trị 6',value:weight}]} reduced={reduced} selected={inspect} onSelect={setInspect}/><p className="genai-hint">Chiều dài cột biểu diễn trọng số, không phải giá trị 2 hoặc 6.</p></div>;
 if(mode==='causal')return <div className="genai-try"><h4>Thử thêm · bao nhiêu vị trí được nhìn?</h4><label>Số token n: {size}<input type="range" min="0" max="6" value={size} onChange={e=>setSize(Number(e.target.value))}/></label><p role="status">Có {size*(size+1)/2} ô được phép trong {size*size} ô. Vị trí cuối nhìn được {size} token, kể cả chính nó.</p></div>;
 return null;
}
export default function GenAIVisualizer({lesson,compact=false}:{lesson:Lesson;compact?:boolean}){
 const pid=(lesson as any).visualization?.problemId??lesson.problemIds[0], [seed,setSeed]=useState(''),[trace,setTrace]=useState<Trace|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(true),[selected,setSelected]=useState(''),ticket=useRef(0);
 const playback=useVisualPlayback(trace?.frames.length??0,`${lesson.id}:${pid}:${seed}`),frame=trace?.frames[playback.step];
 useEffect(()=>{const current=++ticket.current;setBusy(true);setError('');setTrace(null);setSelected('');void api<Trace>('/traces/'+encodeURIComponent(pid)+'?'+new URLSearchParams({lessonId:String(lesson.id),seed:seed||'lesson-'+lesson.id})).then(data=>{if(current!==ticket.current)return;if(!data.frames?.length)throw Error('Mô phỏng chưa có dữ liệu.');setTrace(data);}).catch(e=>{if(current===ticket.current)setError(e.message);}).finally(()=>{if(current===ticket.current)setBusy(false);});return()=>{ticket.current++;};},[lesson.id,pid,seed]);
 return <section className={`genai-visualizer${compact?' workshop-compact':''}`} tabIndex={0} onKeyDown={playback.onKeyDown} aria-label="Mô phỏng Gen AI; phím trái phải đổi bước, Space chạy hoặc dừng" aria-keyshortcuts="ArrowLeft ArrowRight Home End Space">
  <header><span className="eyebrow">GEN AI · NHÌN TỪNG BƯỚC</span><h3>{trace?.title??'Từ dữ liệu đến quyết định'}</h3><p>Đoán điều thay đổi, rồi bấm bước sau để đối chiếu.</p></header>
  {busy?<p role="status">Đang chuẩn bị mô phỏng…</p>:error?<p role="alert">{error}</p>:frame&&trace?<><figure className="genai-canvas"><StatePicture frame={frame} trace={trace} selected={selected} onSelect={setSelected} reduced={playback.reduced}/><figcaption aria-live="polite">{frame.label}</figcaption></figure>{selected&&<p role="status">Đang chọn: {frame.tokens?`vị trí ${selected} · ${frame.tokens[Number(selected)]}`:selected}. Giá trị được ghi ngay trên hình.</p>}<label className="genai-timeline">Bước {playback.step+1} / {trace.frames.length}<input type="range" min="0" max={trace.frames.length-1} value={playback.step} aria-label="Chọn bước mô phỏng Gen AI" onChange={e=>{playback.go(Number(e.target.value));setSelected('');}}/></label><details className="genai-state"><summary>Xem dữ liệu của bước này</summary>{frame.entries.map(e=><div key={e.label}><strong>{labels[e.label]??e.label}</strong><LearningDataView value={e.value}/></div>)}</details></>:null}
  <VisualPlayback playback={playback} busy={busy} onChangeData={()=>{playback.reset();setSeed(String(Date.now()));}}/>
  {trace&&!compact&&<TryThreshold key={pid} mode={trace.mode} reduced={playback.reduced}/>}
  <details><summary>Đọc hình và giới hạn mô phỏng</summary><p>{trace?.notice??'Dữ liệu nhỏ được cung cấp sẵn; không gọi model hoặc API. Hình giúp hiểu quy tắc, không chấm code người học.'}</p>{trace&&<LearningDataView value={trace.input}/>}</details>
 </section>;
}
