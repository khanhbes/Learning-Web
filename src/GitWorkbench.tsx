import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { api } from './api';
import { useApp } from './context';
import { Icon, Button } from './components';
import { LoadingScene } from './Delight';
import { useMotionPreference } from './motionPreference';
import type { Lesson } from './types';
import { gitFrame } from '../shared/git-simulator.mjs';
import './data-workshops.css';

type GitFile={path:string;working?:string|null;index?:string|null;committed?:string|null;staged?:boolean;modified?:boolean;untracked?:boolean;conflict?:boolean;ignored?:boolean};
type GitFrame={label?:string;branch:string;head:string|null;files:GitFile[];nodes:{id:string;parents:string[];message:string;branches?:string[];tags?:string[]}[];branches?:Record<string,string>;remoteBranches?:Record<string,string>;conflicts?:string[];stashCount?:number};
export function GitScenarioPreview({input,output}:{input:unknown;output?:unknown}) {
  const scenario=input&&typeof input==='object'?input as {initial?:unknown;goal?:Record<string,unknown>;commands?:string[]}:{};
  const goal=(scenario.goal||(output&&typeof output==='object'?output:{})) as Record<string,any>;
  let frame:GitFrame|null=null;
  try{if(scenario.initial)frame=gitFrame(scenario.initial);}catch{/* Raw input stays available if an unfamiliar scenario cannot be drawn. */}
  const targets: string[]=[];
  if(goal.initialized)targets.push('Khởi tạo kho và có commit đầu tiên.');
  if(goal.branch)targets.push('Kết thúc ở nhánh '+goal.branch+'.');
  if(goal.headCommitCount!==undefined)targets.push('Lịch sử tới HEAD có '+goal.headCommitCount+' commit.');
  if(goal.exactCommitCount!==undefined)targets.push('Mô phỏng lưu '+goal.exactCommitCount+' mốc commit, gồm cả mốc không còn đi tới từ HEAD.');
  if(goal.headParentCount!==undefined)targets.push('Commit tại HEAD có '+goal.headParentCount+' parent.');
  if(goal.clean)targets.push('Working tree và index sạch, không còn xung đột.');
  if(goal.ancestors?.length)targets.push('Lịch sử chứa tổ tiên '+goal.ancestors.join(', ')+'.');
  if(goal.notAncestors?.length)targets.push('Lịch sử HEAD không chứa '+goal.notAncestors.join(', ')+'.');
  if(goal.forbiddenInHistory?.length)targets.push('Không đưa '+goal.forbiddenInHistory.join(', ')+' vào bất kỳ commit nào.');
  if(goal.tagAtHead)targets.push('Tag '+goal.tagAtHead+' trỏ tới HEAD.');
  if(goal.remoteTag)targets.push('Tag '+goal.remoteTag+' có ở remote ảo.');
  if(goal.remoteMatches)targets.push('Đồng bộ nhánh '+goal.remoteMatches.branch+' với remote '+goal.remoteMatches.remote+'.');
  if(goal.stashCount!==undefined)targets.push('Còn '+goal.stashCount+' mục trong stash.');
  if(goal.visitedBranches?.length)targets.push('Trong quá trình làm có ghé nhánh '+goal.visitedBranches.join(', ')+'.');
  if(goal.ignoredPatterns?.length)targets.push('.gitignore có '+goal.ignoredPatterns.join(', ')+'.');
  const fileTargets=[['headFiles','Commit tại HEAD'],['headRequiredFiles','Tệp bắt buộc trong HEAD'],['indexFiles','Staging / Index'],['workingFiles','Working tree']] as const;
  return <div className="git-problem-preview">
    <h4>Kho trước khi bạn thao tác</h4>{frame&&<GitFrameView frame={frame}/>}{scenario.commands?.length&&<><h4>Chuỗi lệnh cần theo dõi</h4><pre>{scenario.commands.join('\n')}</pre></>}
    {!!Object.keys(goal).length&&<><h4>Điều kiện kết thúc</h4><ul className="git-goal-summary">{targets.map(text=><li key={text}>{text}</li>)}{goal.branches&&Object.entries(goal.branches).map(([branch,id])=><li key={branch}>Nhánh <code>{branch}</code> trỏ tới <code>{String(id)}</code>.</li>)}{goal.remoteRefs&&Object.entries(goal.remoteRefs).map(([ref,id])=><li key={ref}>Remote-tracking <code>{ref}</code> trỏ tới <code>{String(id)}</code>.</li>)}</ul></>}
    {fileTargets.filter(([key])=>goal[key]).map(([key,label])=><details key={key} className="git-target-files"><summary>{label} · {Object.keys(goal[key]).length} tệp cần có</summary>{Object.entries(goal[key]).map(([path,value])=><div key={path}><b>{path}</b><pre>{String(value)}</pre></div>)}</details>)}
    <details className="git-raw-scenario"><summary>Xem dữ liệu gốc{Object.keys(goal).length?' & điều kiện đầy đủ':''} (JSON)</summary><small>Đầu vào</small><pre>{JSON.stringify(input,null,2)}</pre>{output!==undefined&&<><small>Trạng thái cần đạt</small><pre>{JSON.stringify(output,null,2)}</pre></>}</details>
  </div>;
}
export function GitFrameView({frame}:{frame:GitFrame}) {
  const reduced=useMotionPreference(),nodes=frame.nodes||[],primary=new Set<string>(),byId=new Map(nodes.map(n=>[n.id,n]));
  let ancestor=frame.branches?.main||frame.head;
  while(ancestor&&!primary.has(ancestor)){primary.add(ancestor);ancestor=byId.get(ancestor)?.parents?.[0]||'';}
  const positions=new Map(nodes.map((n,i)=>[n.id,{x:48+i*92,y:primary.has(n.id)?58:128}]));
  const groups=[{key:'working',title:'Working tree',hint:'Tệp đang chỉnh sửa',files:frame.files?.filter(f=>f.modified||f.untracked||f.conflict)||[]},{key:'index',title:'Staging / Index',hint:'Nội dung cho commit kế tiếp',files:frame.files?.filter(f=>f.staged)||[]},{key:'committed',title:'Commit tại HEAD',hint:'Phiên bản đã lưu',files:frame.files?.filter(f=>f.committed!==null&&f.committed!==undefined)||[]}];
  return <div className="git-state-view"><div className="git-state-strip"><span><Icon name="network" size={17}/><b>{frame.branch||'Chưa có nhánh'}</b></span><span>HEAD <code>{frame.head||'chưa có commit'}</code></span>{!!frame.stashCount&&<span>Stash {frame.stashCount}</span>}</div>
    <div className="git-three-areas">{groups.map((group,i)=><section key={group.key} className={'git-area git-area-'+group.key}><header><span>{i+1}</span><h4>{group.title}</h4></header><p>{group.hint}</p><ul>{group.files.map(f=><motion.li layout={!reduced} transition={{duration:reduced?0:.2}} key={f.path}><Icon name={f.conflict?'error':'file'} size={15}/><details className="git-file-snapshot"><summary>{f.path}</summary><pre>{f[group.key as 'working'|'index'|'committed']??'(đã xóa)'}</pre></details>{f.conflict&&<small>Xung đột</small>}{f.untracked&&group.key==='working'&&<small>Mới</small>}</motion.li>)}</ul>{!group.files.length&&<span className="git-empty-area">{group.key==='working'?'Không có thay đổi cần lưu':group.key==='index'?'Chưa stage tệp nào':'Chưa có tệp đã commit'}</span>}</section>)}</div>
    <div className="git-dag-wrap"><svg className="git-dag" viewBox={`0 0 ${Math.max(580,nodes.length*92+40)} 190`} style={{minWidth:Math.max(420,nodes.length*80)}} role="img" aria-label={`Lịch sử commit mô phỏng: ${nodes.map(n=>n.id+' '+n.message).join('; ')}. HEAD ${frame.head}, nhánh ${frame.branch}`}>
      {nodes.flatMap(n=>(n.parents||[]).map(parent=>{const p=positions.get(parent),q=positions.get(n.id);return p&&q?<path key={n.id+parent} d={`M${p.x} ${p.y} C${p.x+35} ${p.y} ${q.x-35} ${q.y} ${q.x} ${q.y}`} fill="none" stroke={n.parents.length>1?'#a091d9':'#d8baab'} strokeWidth="4"/>:null;}))}
      {nodes.map(n=>{const p=positions.get(n.id)!;return <g key={n.id}><motion.circle initial={false} animate={{cx:p.x,cy:p.y}} transition={{duration:reduced?0:.3}} r={n.id===frame.head?15:11} fill={n.id===frame.head?'#eb966c':'#afbcac'} stroke="white" strokeWidth="4"/><text x={p.x} y={p.y+30} textAnchor="middle" fontSize="12" fontWeight="900" fill="#6d7867">{n.id}</text>{(n.branches||Object.keys(frame.branches||{}).filter(b=>frame.branches?.[b]===n.id)).length>0&&<text x={p.x} y={p.y-22} textAnchor="middle" fontSize="11" fill="#9c694e">{(n.branches||Object.keys(frame.branches||{}).filter(b=>frame.branches?.[b]===n.id)).join(', ')}</text>}<title>{n.message}</title></g>;})}
      {!nodes.length&&<text x="290" y="80" textAnchor="middle" fill="#87977c">Commit đầu tiên sẽ xuất hiện ở đây.</text>}
    </svg></div>
  </div>;
}

export default function GitWorkbench({lesson,compact=false}:{lesson:Lesson;compact?:boolean}) {
  const {notify}=useApp(),reduced=useMotionPreference(),visual=typeof lesson.visualization==='object'?lesson.visualization:null;
  const commands=visual?.commands||['git status'],[script,setScript]=useState(commands.join('\n')),[report,setReport]=useState<any>(null),[busy,setBusy]=useState(false),[cursor,setCursor]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[line,setLine]=useState('git status'),[file,setFile]=useState('README.md'),[text,setText]=useState('Xin chào BytePath!'),[scenario,setScenario]=useState('lesson');
  const request=useRef(0),mounted=useRef(true);
  const frames:GitFrame[]=report?.frames||[],frame=frames[Math.min(cursor,frames.length-1)]||report?.frame;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{setScript(commands.join('\n'));setReport(null);setPlaying(false);void run(commands.join('\n'));},[lesson.id]);
  async function run(next:string) {
    const ticket=++request.current;setBusy(true);setPlaying(false);
    try {const r=await api('/courses/git/workbench','POST',{lessonId:lesson.id,script:next});if(mounted.current&&ticket===request.current){setReport(r);setCursor(Math.max(0,(r.frames?.length||1)-1));}}
    catch(e){if(mounted.current&&ticket===request.current)notify((e as Error).message);}
    finally{if(mounted.current&&ticket===request.current)setBusy(false);}
  }
  useEffect(()=>{if(!playing||reduced)return;const timer=setInterval(()=>setCursor(c=>{if(c>=frames.length-1){setPlaying(false);return c;}return c+1;}),1000/speed);return()=>clearInterval(timer);},[playing,reduced,speed,frames.length]);
  useEffect(()=>{if(reduced)setPlaying(false);},[reduced]);
  function append(command:string) {const next=[script.trim(),command].filter(Boolean).join('\n');setScript(next);void run(next);}
  function reset() {const next=scenario==='new-file'?'git init\nedit note.txt "Ghi chú mới"\ngit status':scenario==='branch'?'git init\ngit add .\ngit commit -m "Bản đầu"\ngit branch feature\ngit switch feature\ngit status':commands.join('\n');setScript(next);void run(next);}
  return <section className={`git-workbench ${compact?'workshop-compact':''}`} aria-label="Kho Git mô phỏng">
    <header className="workshop-heading"><div><span className="eyebrow">GIT · KHO MÔ PHỎNG AN TOÀN</span><h3>Thay đổi của bạn đang ở đâu?</h3></div><span className="simulation-badge"><Icon name="shield" size={15}/>Mô phỏng</span></header>
    <p className="workshop-caption">{visual?.caption||'Chỉnh tệp, stage rồi commit. Mỗi lệnh tạo một trạng thái để bạn quan sát.'}</p>
    {busy?<LoadingScene compact title="Đang dựng trạng thái Git…" detail="Chạy các lệnh được phép trong kho mô phỏng."/>:frame?<GitFrameView frame={frame}/>:<p className="workshop-caption">Chạy mô phỏng để xem trạng thái. Kho này không đọc hoặc thay đổi tệp trên máy.</p>}
    <div className="workshop-controls"><button className="icon-button" aria-label={playing?'Dừng mô phỏng':'Chạy mô phỏng'} disabled={busy||frames.length<2||reduced} onClick={()=>{if(cursor>=frames.length-1)setCursor(0);setPlaying(!playing);}}><Icon name={playing?'pause':'play'}/></button><button className="icon-button" aria-label="Bước trước" disabled={busy||cursor<=0} onClick={()=>{setPlaying(false);setCursor(c=>c-1);}}><Icon name="previous"/></button><button className="icon-button" aria-label="Bước sau" disabled={busy||cursor>=frames.length-1} onClick={()=>{setPlaying(false);setCursor(c=>c+1);}}><Icon name="forward"/></button><select aria-label="Tốc độ mô phỏng" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><button className="icon-button" aria-label="Reset mô phỏng" disabled={busy} onClick={reset}><Icon name="reset"/></button><span className="workshop-step">Trạng thái {frames.length?cursor+1:0}/{frames.length}</span></div>
    <div className="git-workbench-editors"><div className="git-file-editor"><label>Tệp mô phỏng<input value={file} onChange={e=>setFile(e.target.value)} aria-label="Đường dẫn tệp mô phỏng" maxLength={120}/></label><label>Nội dung<textarea value={text} onChange={e=>setText(e.target.value)} rows={4} aria-label="Nội dung tệp mô phỏng" maxLength={6000}/></label><Button variant="soft" busy={busy} disabled={!file.trim()} onClick={()=>append('edit '+JSON.stringify(file.trim())+' '+JSON.stringify(text))}><Icon name="file" size={17}/>LƯU TRONG MÔ PHỎNG</Button><small>“edit” là thao tác editor của BytePath, không phải lệnh Git thật.</small></div>
      <div className="git-terminal"><div className="git-terminal-heading"><Icon name="code" size={17}/><span>Terminal mô phỏng</span></div><pre aria-live="polite">{(report?.steps||[]).slice(0,cursor).map((s:any)=>'$ '+(s.command||s.line||'')+'\n'+(s.output||s.error||'')).join('\n\n')||'Chưa chạy lệnh nào ở trạng thái này.'}</pre><form onSubmit={e=>{e.preventDefault();if(line.trim())append(line.trim());}}><label className="git-prompt"><span>$</span><input aria-label="Lệnh Git mô phỏng" value={line} onChange={e=>setLine(e.target.value)} maxLength={400}/></label><button type="submit" className="icon-button" aria-label="Chạy lệnh mô phỏng" disabled={busy||!line.trim()}><Icon name="right" size={19}/></button></form>{report?.errors?.length>0&&<p role="status" className="git-command-error">{report.errors.map((e:any)=>typeof e==='string'?e:e.error||e.message).join('\n')}</p>}</div>
    </div>
    <details className="workshop-reading"><summary>Kịch bản và lịch sử lệnh</summary><label>Đổi tình huống<select aria-label="Tình huống Git" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="lesson">Ví dụ trong buổi</option><option value="new-file">Thêm một ghi chú</option><option value="branch">Rẽ sang nhánh feature</option></select></label><Button variant="outline" busy={busy} onClick={reset}>DỰNG LẠI TÌNH HUỐNG</Button><label>Chuỗi lệnh<textarea aria-label="Chuỗi lệnh mô phỏng" rows={5} value={script} onChange={e=>setScript(e.target.value)} maxLength={50000}/></label><Button variant="soft" busy={busy} onClick={()=>void run(script)}>CHẠY CHUỖI LỆNH</Button><p>Chỉ các lệnh trong danh sách cho phép được mô phỏng; không chạy shell trên máy. Hình đang xem không chấm điểm. Bài nộp được checker ở backend kiểm tra riêng.</p></details>
  </section>;
}
