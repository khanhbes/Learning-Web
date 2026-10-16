import {useEffect,useMemo,useState} from 'react';
import {motion} from 'motion/react';
import type {Lesson} from './types';
import {Button,Icon} from './components';
import {useMotionPreference} from './motionPreference';
import {VisualPlayback,useVisualPlayback} from './VisualPlayback';
import {createDockerState,dockerFrame,runDockerScript,DOCKER_SIM_NOTICE} from '../shared/docker-simulator.mjs';
import './docker-workshop.css';

const stateNames:Record<string,string>={created:'Đã tạo',running:'Đang chạy',exited:'Đã dừng'};
const list=(v:any)=>Array.isArray(v)?v:[];
export function DockerFrameView({frame}:{frame:any}){
  const reduced=useMotionPreference();
  if(!frame)return null;
  const images=list(frame.images),containers=list(frame.containers),volumes=list(frame.volumes),networks=list(frame.networks);
  const visible=containers.slice(0,4),height=Math.max(250,100+visible.length*95,75+Math.min(4,volumes.length)*77);
  return <div className="docker-frame">
    <div className="docker-mobile-resources">
      <section><h5>IMAGE · GÓI NỀN</h5><div>{images.map(im=><span className="docker-resource-image" key={im.tag}>{im.tag}</span>)}</div></section>
      <p aria-hidden="true">↓ Tạo môi trường riêng từ image</p>
      <section><h5>CONTAINER · ỨNG DỤNG</h5>{containers.length?containers.map(c=><div className={`docker-mobile-container ${c.status}`} key={c.name}><strong>{c.name}</strong><b>{stateNames[c.status]??c.status}</b><small>Từ {c.image}</small>{list(c.ports).length>0&&<small>Cổng {list(c.ports).map(p=>`${p.host} → ${p.container}`).join(', ')}</small>}{list(c.mounts).length>0&&<small>Gắn {list(c.mounts).map(m=>`${m.source} → ${m.target}`).join(', ')}</small>}</div>):<div className="docker-mobile-empty">Chưa tạo container</div>}</section>
      <section><h5>VOLUME · LƯU RIÊNG VỚI CONTAINER</h5>{volumes.length?volumes.map(v=><div className="docker-mobile-volume" key={v.name}><strong>{v.name}</strong><span>{v.fileCount??Object.keys(v.files??{}).length} tệp được giữ</span></div>):<div className="docker-mobile-empty">Chưa có named volume</div>}</section>
    </div>
    <svg viewBox={`0 0 720 ${height}`} role="img" aria-label={`${images.length} image, ${containers.length} container, ${volumes.length} named volume. ${containers.map(c=>c.name+': '+(stateNames[c.status]??c.status)).join('; ')}`}>
      <text x="28" y="28" className="docker-svg-heading">IMAGE · GÓI NỀN</text><text x="282" y="28" className="docker-svg-heading">CONTAINER · ỨNG DỤNG</text><text x="564" y="28" className="docker-svg-heading">VOLUME · DỮ LIỆU</text>
      <rect x="18" y="45" width="200" height={height-65} rx="16" fill="#eaf4f8"/>
      {images.slice(0,4).map((im,i)=><g key={im.tag} transform={`translate(31 ${65+i*43})`}><rect width="174" height="33" rx="8" fill="white" stroke="#a8d2df"/><path d="M10 11h14m-14 5h14m-14 5h14" stroke="#5eacc2" strokeWidth="2"/><text x="32" y="21" className="docker-svg-label">{im.tag}</text><title>{im.tag} · {im.id}</title></g>)}
      {!images.length&&<text x="35" y="90" className="docker-svg-label">Chưa có image</text>}
      {images.length>4&&<text x="35" y={height-30} className="docker-svg-label">+{images.length-4} image khác</text>}
      {visible.map((c,i)=>{const y=55+i*95,mounts=list(c.mounts),running=c.status==='running',imageIndex=images.findIndex(im=>im.tag===c.image),imageY=81+Math.max(0,Math.min(3,imageIndex))*43;return <g key={c.name}>
        <path d={`M218 ${imageY}C249 ${imageY} 243 ${y+30} 273 ${y+30}`} fill="none" stroke="#adcbd4" strokeWidth="3" strokeDasharray="5 5"/><path d={`m266 ${y+24} 7 6-7 6`} fill="none" stroke="#adcbd4" strokeWidth="2"/>
        <motion.rect x="277" y={y} width="230" height="78" rx="14" initial={false} animate={{fill:running?'#e9f6e0':'#f0f2f1',stroke:running?'#8ac65d':'#b6c3bd'}} transition={{duration:reduced?0:.25}} strokeWidth="2"/>
        <circle cx="296" cy={y+23} r="5" fill={running?'#5baf2e':'#93a59a'}/><text x="309" y={y+28} className="docker-svg-name">{c.name}</text><text x="295" y={y+49} className="docker-svg-label">{stateNames[c.status]??c.status} · {c.image}</text>
        <text x="295" y={y+66} className="docker-svg-small">{list(c.ports).length?list(c.ports).map(p=>`${p.host} → ${p.container}`).join(' · '):'Chưa publish cổng host'}</text>
        {mounts.map((m:any)=>{const vi=volumes.findIndex(vol=>vol.name===m.source);if(vi<0||vi>=4)return null;const vy=93+vi*77;return <g key={m.source+':'+m.target}><path d={`M507 ${y+39}C535 ${y+39} 531 ${vy} 560 ${vy}`} fill="none" stroke="#c1b291" strokeWidth="3"/><title>{c.name}: {m.source} gắn vào {m.target}</title></g>;})}
      </g>;})}
      {!visible.length&&<><rect x="277" y="65" width="230" height="92" rx="14" fill="none" stroke="#c5d7d0" strokeWidth="2" strokeDasharray="6 5"/><text x="392" y="105" textAnchor="middle" className="docker-svg-name">Chưa có container</text><text x="392" y="129" textAnchor="middle" className="docker-svg-label">Tạo từ một image</text></>}
      {volumes.slice(0,4).map((v,i)=><g key={v.name} transform={`translate(560 ${63+i*77})`}><rect width="139" height="61" rx="12" fill="#fff6df" stroke="#dfc892"/><ellipse cx="21" cy="21" rx="9" ry="5" fill="#e6c981"/><path d="M12 21v13c0 7 18 7 18 0V21" fill="none" stroke="#c4a95e" strokeWidth="2"/><text x="39" y="25" className="docker-svg-name">{v.name}</text><text x="14" y="48" className="docker-svg-label">{v.fileCount??Object.keys(v.files??{}).length} tệp được giữ</text></g>)}
      {!volumes.length&&<text x="565" y="91" className="docker-svg-label">Chưa có volume</text>}
    </svg>
    {containers.length>4&&<p>Hình hiển thị 4/{containers.length} container. Bảng trạng thái bên dưới có toàn bộ tài nguyên.</p>}
    <div className="docker-network-line"><Icon name="network" size={17}/><span>Mạng: {networks.map(n=>n.name).join(' · ')||'chưa có'}</span></div>
    {!!containers.length&&<div className="docker-table-wrap"><table><caption>Trạng thái và đường kết nối</caption><thead><tr><th>Container</th><th>Trạng thái</th><th>Host → bên trong</th><th>Volume → đường dẫn</th><th>Mạng</th></tr></thead><tbody>{containers.map(c=><tr key={c.name}><th>{c.name}</th><td>{stateNames[c.status]??c.status}</td><td>{list(c.ports).map(p=>`${p.ip}:${p.host} → ${p.container}`).join(', ')||'Không publish'}</td><td>{list(c.mounts).map(m=>`${m.source} → ${m.target}${m.readOnly?' (chỉ đọc)':''}`).join(', ')||'Chưa gắn'}</td><td>{list(c.networks).join(', ')}</td></tr>)}</tbody></table></div>}
    {volumes.some(v=>Object.keys(v.files??{}).length>0)&&<details className="docker-retained-files"><summary>Xem dữ liệu trong volume</summary>{volumes.map(v=><div key={v.name}>{Object.entries(v.files??{}).map(([file,text])=><p key={file}><b>{v.name}/{file}</b><span>{String(text)}</span></p>)}</div>)}</details>}
  </div>;
}

export function DockerScenarioPreview({input,output}:{input:unknown;output?:unknown}){
  const s=input&&typeof input==='object'?input as any:{};
  const frame=s.initial?dockerFrame(s.initial):null,goal=s.goal;
  return <div className="docker-scenario"><h4>Trước khi thao tác</h4>{frame&&<DockerFrameView frame={frame}/>}
    {s.commands?.length>0&&<><h4>Các lệnh cần theo dõi</h4><pre>{s.commands.join('\n')}</pre></>}
    {goal&&<div className="docker-target"><h4>Trạng thái cần đạt</h4><ul>
      {Object.entries(goal.containers??{}).map(([name,c]:[string,any])=><li key={name}><b>{name}</b>: {stateNames[c.status]??c.status??'giữ trạng thái'}, image {c.image??'theo đề'}{c.ports?.length?'; cổng '+c.ports.map((p:any)=>`${p.ip}:${p.host} → ${p.container}`).join(', '):''}{c.mounts?.length?'; gắn '+c.mounts.map((m:any)=>`${m.source} → ${m.target}`).join(', '):''}{c.user?'; user '+c.user:''}{c.memory?'; RAM '+c.memory:''}.</li>)}
      {Object.keys(goal.images??{}).length>0&&<li>Image kết quả: {Object.keys(goal.images).join(', ')}.</li>}
      {goal.absentContainers?.length>0&&<li>Container đã xóa: {goal.absentContainers.join(', ')}.</li>}
      {Object.keys(goal.volumesPreserved??{}).length>0&&<li>Giữ nguyên dữ liệu: {Object.keys(goal.volumesPreserved).join(', ')}.</li>}
      {goal.networks?.length>0&&<li>Mạng cần có: {goal.networks.join(', ')}.</li>}
      {goal.observations?.length>0&&<li>Đọc trạng thái: {goal.observations.join(', ')}.</li>}
    </ul></div>}
    <details className="docker-raw"><summary>Đặc tả đầy đủ và dữ liệu JSON</summary><pre>{JSON.stringify(input,null,2)}</pre>{output!==undefined&&<pre>{JSON.stringify(output,null,2)}</pre>}</details>
  </div>;
}

export default function DockerVisualizer({lesson,compact=false}:{lesson:Lesson;compact?:boolean}){
  const v=typeof lesson.visualization==='object'?lesson.visualization:null;
  const original=v?.commands?.join('\n')??'docker run -d --name web byte-web:1\ndocker stop web';
  const [script,setScript]=useState(original),[submitted,setSubmitted]=useState(original),[variant,setVariant]=useState(0),[revision,setRevision]=useState(0);
  useEffect(()=>{setScript(original);setSubmitted(original);setVariant(0);setRevision(0);},[lesson.id,original]);
  const initial=useMemo(()=>{
    const s=structuredClone(v?.initial??createDockerState());
    if(variant){s.context['index.txt']='Trang học thử '+variant;for(const vol of Object.values(s.volumes) as any[])for(const key of Object.keys(vol.files))vol.files[key]='Bài ghi chú '+variant;}
    return s;
  },[v?.initial,variant]);
  const result=useMemo(()=>runDockerScript(initial,submitted),[initial,submitted,revision]);
  const playback=useVisualPlayback(result.frames.length,`${lesson.id}:${variant}:${revision}`),frame=result.frames[playback.step];
  return <section className={`docker-visualizer ${compact?'compact':''}`} aria-label="Phòng Docker mô phỏng" tabIndex={0} onKeyDown={playback.onKeyDown}>
    <div className="docker-workshop-heading"><span className="eyebrow">PHÒNG CONTAINER</span><h3>Mỗi lệnh thay đổi điều gì?</h3><p>Đi từng bước; nhìn container đổi trạng thái và kiểm tra dữ liệu còn lại.</p></div>
    <div className="docker-step-caption" aria-live="polite"><span>{playback.step+1}</span><code>{frame?.label??'Trước thao tác'}</code></div>
    <DockerFrameView frame={frame}/>
    <VisualPlayback playback={playback} onChangeData={()=>setVariant(n=>n+1)}/>
    <details className="docker-command-lab"><summary>Tự đổi chuỗi lệnh</summary><label>Lệnh trong môi trường ảo<textarea aria-label="Chuỗi lệnh Docker khám phá" value={script} rows={5} maxLength={50000} spellCheck={false} onChange={e=>setScript(e.target.value)}/></label><div className="docker-command-actions"><Button onClick={()=>{setSubmitted(script);setRevision(n=>n+1);}}>THỬ CHUỖI LỆNH</Button><Button variant="outline" onClick={()=>{setScript(original);setSubmitted(original);setVariant(0);setRevision(n=>n+1);}}>VỀ VÍ DỤ MẪU</Button></div><p>Chuỗi mới bắt đầu từ trạng thái ban đầu của bài. Bấm bước sau để xem từng thay đổi. Bài nộp tính điểm được chấm riêng.</p></details>
    {!result.ok&&<div role="status" className="docker-error"><b>Lệnh chưa thực hiện được</b><p>{result.errors.join(' ')}</p><small>Trạng thái trước lệnh lỗi được giữ để bạn sửa và thử lại.</small></div>}
    <p className="docker-sim-notice"><Icon name="shield" size={16}/>{DOCKER_SIM_NOTICE}</p>
  </section>;
}
