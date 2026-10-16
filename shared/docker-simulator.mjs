// Educational state machine, not Docker, a shell, or an operating-system bridge.
// Every read/write below addresses JSON owned by this invocation only.
export const DOCKER_SIM_NOTICE='Phòng thí nghiệm Docker mô phỏng: chỉ thay đổi tài nguyên ảo trong bài. Không cài Docker, tải image, mở cổng thật hoặc chạy shell trên máy.';
const copy=v=>structuredClone(v), own=(o,k)=>Object.hasOwn(o,k);
const safeName=s=>typeof s==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,99}$/.test(s)&&!s.split(/[/:]/).some(x=>['__proto__','prototype','constructor','..'].includes(x));
const safeContextPath=s=>typeof s==='string'&&/^[a-zA-Z0-9_.-][a-zA-Z0-9_./-]{0,99}$/.test(s)&&!s.split('/').some(x=>['__proto__','prototype','constructor','.','..',''].includes(x));
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const ref=s=>s.includes(':')?s:s+':latest';
const image=(id,extra={})=>({id,files:{'/app/index.txt':'BytePath'},env:{},exposed:[],user:'0',workdir:'/',cmd:[],...extra});
export function createDockerState(options={}) {
 return {images:{'byte-web:1':image('virtual-web-1',{exposed:[80]}),'byte-db:1':image('virtual-db-1',{exposed:[5432]})},containers:{},volumes:{},networks:{bridge:{driver:'bridge'},none:{driver:'null'}},context:{'index.txt':'Xin chào BytePath','Dockerfile':'FROM byte-web:1\nCOPY index.txt /app/index.txt\nEXPOSE 80\nCMD ["serve"]'},compose:{services:{web:{image:'byte-web:1',ports:['8080:80']},db:{image:'byte-db:1',volumes:['data:/data']}},volumes:['data']},observations:[],nextId:1,...copy(options)};
}
export function parseDockerCommand(line) {
 assert(typeof line==='string'&&line.length<=8192,'Mỗi dòng tối đa 8 KB ký tự.');
 if(!line.trim()||line.trimStart().startsWith('#'))return[];
 const tokens=[];let token='',quote=null,active=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(quote){if(c===quote){quote=null;active=true;}else if(c==='\\'&&i+1<line.length){const n=line[++i];token+=n==='n'?'\n':n==='t'?'\t':n;}else token+=c;}
  else if(c==='"'||c==="'"){quote=c;active=true;}
  else if(/\s/.test(c)){if(active||token){tokens.push(token);token='';active=false;}}
  else{assert(!';&|<>`$'.includes(c),'Không hỗ trợ shell, pipe, chuyển hướng hoặc thay thế lệnh.');token+=c;active=true;}
 }
 assert(!quote,'Thiếu dấu đóng chuỗi.');if(active||token)tokens.push(token);return tokens;
}
const lookup=(o,name,kind)=>{assert(safeName(name)&&own(o,name),kind+' không tồn tại: '+String(name));return o[name];};
const options=(args,flags,booleans=[])=>{const out={_:[]};for(let i=0;i<args.length;i++){const t=args[i];if(t.startsWith('-')){const [key,...eq]=t.split('=');assert(flags.includes(key)||booleans.includes(key),'Cờ chưa được mô phỏng: '+key);if(booleans.includes(key)){assert(!eq.length,'Cờ này không nhận giá trị: '+key);out[key]=true;}else{const value=eq.length?eq.join('='):args[++i];assert(value!==undefined,'Thiếu giá trị cho '+key);(out[key]??=[]).push(value);}}else out._.push(t);}return out;};
function publish(s,ports,name,bind=true){return ports.map(value=>{const p=value.split(':');assert(p.length===2||p.length===3,'Dùng HOST:CONTAINER hoặc IP:HOST:CONTAINER.');const host=Number(p.at(-2)),container=Number(p.at(-1)),ip=p.length===3?p[0]:'0.0.0.0';assert(Number.isInteger(host)&&host>0&&host<=65535&&Number.isInteger(container)&&container>0&&container<=65535,'Cổng phải từ 1 tới 65535.');assert(['0.0.0.0','127.0.0.1'].includes(ip),'Mô phỏng hỗ trợ IP 0.0.0.0 hoặc 127.0.0.1.');assert(!bind||!Object.values(s.containers).some(c=>c.name!==name&&c.status==='running'&&c.ports.some(x=>x.host===host&&(x.ip===ip||x.ip==='0.0.0.0'||ip==='0.0.0.0'))),'Cổng host '+host+' đang bị dùng.');return{host,container,ip};});}
function startContainer(s,c){publish(s,c.ports.map(p=>p.ip+':'+p.host+':'+p.container),c.name);c.status='running';c.logs.push('Ứng dụng ảo đã bắt đầu.');}
function createContainer(s,args,running){
 const o=options(args,['--name','-p','--publish','-v','--volume','--network','-e','--env','--memory','--cpus','--user','--restart'],['-d','--detach','--read-only','--rm']);
 assert(o._.length===1,'Mẫu này nhận đúng một image; lệnh ứng dụng tùy ý chưa được hỗ trợ.');
 const imageRef=ref(o._[0]),im=lookup(s.images,imageRef,'Image'),name=o['--name']?.[0]??'container-'+s.nextId++;
 assert(safeName(name)&&!own(s.containers,name),'Tên container không hợp lệ hoặc đã tồn tại.');
 const networks=o['--network']??['bridge'];networks.forEach(n=>lookup(s.networks,n,'Network'));
 const volumes=[...(o['-v']??[]),...(o['--volume']??[])].map(spec=>{const [source,target,mode]=spec.split(':');assert(safeName(source)&&!source.startsWith('/')&&target?.startsWith('/')&&(!mode||mode==='ro'||mode==='rw'),'Dùng named volume TEN:/duong-dan[:ro]; bind mount host chưa được mô phỏng.');if(!own(s.volumes,source))s.volumes[source]={files:{}};return{source,target,readOnly:mode==='ro'};});
 const env={...im.env};for(const pair of [...(o['-e']??[]),...(o['--env']??[])]){const at=pair.indexOf('=');assert(at>0,'Biến môi trường dùng KEY=VALUE.');const key=pair.slice(0,at);assert(/^[A-Z_][A-Z0-9_]*$/i.test(key)&&safeName(key),'Tên biến không hợp lệ.');env[key]=pair.slice(at+1);}
 const memory=o['--memory']?.[0]??null,cpus=o['--cpus']?.[0]??null;
 assert(memory===null||/^[1-9]\d*[mg]$/i.test(memory),'Mô phỏng giới hạn RAM nhận số nguyên với m hoặc g.');assert(cpus===null||Number.isFinite(Number(cpus))&&Number(cpus)>0,'CPU phải lớn hơn 0.');
 const restart=o['--restart']?.[0]??'no';assert(['no','always','unless-stopped','on-failure'].includes(restart),'Restart policy không được hỗ trợ.');
 const c={name,image:imageRef,imageId:im.id,status:'created',ports:publish(s,[...(o['-p']??[]),...(o['--publish']??[])],name,running),mounts:volumes,networks,env,memory:memory?.toLowerCase()??null,cpus:cpus===null?null:Number(cpus),user:o['--user']?.[0]??im.user,readOnly:!!o['--read-only'],restart,autoRemove:!!o['--rm'],files:copy(im.files),logs:[],health:'not-configured'};
 s.containers[name]=c;if(running)startContainer(s,c);return name;
}
function build(s,args){
 const o=options(args,['-t','--tag','-f','--file']);assert(o._.length===1&&o._[0]==='.'&&(o['-t']??o['--tag'])?.length===1,'Dùng docker build -t TEN:TAG .');
 const target=ref((o['-t']??o['--tag'])[0]),path=(o['-f']??o['--file'])?.[0]??'Dockerfile';assert(safeName(target),'Tag không hợp lệ.');const file=lookup(s.context,path,'Dockerfile');
 let im=null;const stages={};let stageName=null;
 const ignored=(s.context['.dockerignore']??'').split('\n').filter(Boolean);
 for(const row of file.split('\n').map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'))){const at=row.indexOf(' '),op=(at<0?row:row.slice(0,at)).toUpperCase(),rest=row.slice(at+1).trim();
  if(op==='FROM'){if(stageName)stages[stageName]=copy(im);const a=rest.split(/\s+/);im=copy(lookup(s.images,ref(a[0]),'Base image'));stageName=a[1]?.toUpperCase()==='AS'?a[2]:null;if(stageName)assert(safeName(stageName),'Tên stage không hợp lệ.');continue;}
  assert(im,'Dockerfile cần FROM trước.');
  if(op==='WORKDIR'){assert(rest.startsWith('/')&&!rest.includes('..'),'WORKDIR dùng đường dẫn tuyệt đối ảo.');im.workdir=rest;}
  else if(op==='COPY'){const a=parseDockerCommand(rest);let files=s.context;if(a[0]?.startsWith('--from=')){const name=a.shift().slice(7);files=lookup(stages,name,'Build stage').files;}assert(a.length===2,'COPY nhận một nguồn và một đích.');const[src,dest]=a;assert(dest.startsWith('/'),'COPY dùng đích tuyệt đối trong mô hình.');const selected=src==='.'?Object.keys(files).filter(f=>!ignored.includes(f)&&!['Dockerfile','.dockerignore'].includes(f)):[src];for(const source of selected){assert(own(files,source)&&!(files===s.context&&ignored.includes(source)),'COPY không tìm thấy nguồn trong build context: '+source);im.files[dest.endsWith('/')?dest+source.replace(/^\//,''):dest]=files[source];}}
  else if(op==='EXPOSE'){const port=Number(rest);assert(Number.isInteger(port)&&port>0&&port<=65535,'EXPOSE nhận một cổng TCP.');im.exposed.push(port);}
  else if(op==='ENV'){const at=rest.indexOf('=');assert(at>0&&safeName(rest.slice(0,at)),'ENV dùng KEY=VALUE.');im.env[rest.slice(0,at)]=rest.slice(at+1);}
  else if(op==='USER')im.user=rest;
  else if(op==='CMD'){const cmd=JSON.parse(rest);assert(Array.isArray(cmd)&&cmd.every(x=>typeof x==='string'),'CMD dùng mảng JSON chuỗi.');im.cmd=cmd;}
  else throw Error('Dockerfile '+op+' chưa được mô phỏng; không thực thi hoặc giả vờ build thành công.');
 }
 assert(im,'Dockerfile trống.');im.id='virtual-build-'+s.nextId++;s.images[target]=im;return'Tạo image ảo '+target;
}
function apply(s,t){
 if(t[0]==='edit'){assert(t.length===3&&safeContextPath(t[1]),'edit FILE "TEXT" chỉ sửa build context ảo.');s.context[t[1]]=t[2];return'Đã sửa '+t[1]+' trong editor ảo.';}
 assert(t[0]==='docker','Chỉ hỗ trợ docker và edit của editor ảo.');const args=t.slice(2),op=t[1];
 if(op==='run'||op==='create')return createContainer(s,args,op==='run');
 if(op==='build')return build(s,args);
 if(['start','stop','restart','rm','logs','inspect','port'].includes(op)){
  const force=args.includes('-f'),names=args.filter(a=>a!=='-f');assert(names.length===1,'Dùng một tên container mỗi dòng.');const c=lookup(s.containers,names[0],'Container');
  if(op==='start'||op==='restart')startContainer(s,c);
  else if(op==='stop'){c.status='exited';if(c.autoRemove)delete s.containers[c.name];}
  else if(op==='rm'){assert(c.status!=='running'||force,'Dừng container trước rm hoặc dùng rm -f có chủ đích.');delete s.containers[c.name];}
  else{s.observations.push(op+':'+c.name);return op==='logs'?c.logs.join('\n'):JSON.stringify(op==='port'?c.ports:c);}
  return op+' '+c.name;
 }
 if(op==='ps'){assert(args.every(a=>a==='-a'||a==='--all'),'ps hỗ trợ -a hoặc --all.');s.observations.push('ps');return Object.values(s.containers).filter(c=>args.length||c.status==='running').map(c=>c.name+' '+c.status).join('\n')||'(không có container)';}
 if(op==='images'||op==='image'&&args[0]==='ls'){s.observations.push('images');return Object.keys(s.images).join('\n');}
 if(op==='pull'){assert(args.length===1&&safeName(args[0]),'pull nhận tên image ảo.');const r=ref(args[0]);assert(['byte-web:1','byte-db:1','byte-web:2'].includes(r),'Registry ảo chỉ có byte-web:1, byte-web:2, byte-db:1.');s.images[r]=image('virtual-'+r);return'Đã lấy '+r+' từ registry mô phỏng.';}
 if(op==='tag'){assert(args.length===2&&safeName(args[1]),'tag SOURCE TARGET.');s.images[ref(args[1])]=copy(lookup(s.images,ref(args[0]),'Image'));return'Thêm nhãn '+ref(args[1]);}
 if(op==='rmi'){assert(args.length===1,'rmi nhận một nhãn.');const r=ref(args[0]);lookup(s.images,r,'Image');assert(!Object.values(s.containers).some(c=>c.image===r),'Image đang được container tham chiếu.');delete s.images[r];return'Đã bỏ nhãn '+r;}
 if(op==='volume'||op==='network'){
  const collection=op==='volume'?s.volumes:s.networks,[sub,name,container]=args;
  if(sub==='ls'){s.observations.push(op+':ls');return Object.keys(collection).join('\n');}
  if(sub==='create'){assert(args.length===2&&safeName(name),'Tên tài nguyên không hợp lệ.');assert(!own(collection,name)||op==='volume','Network đã tồn tại.');collection[name]??=op==='volume'?{files:{}}:{driver:'bridge'};return name;}
  if(sub==='inspect'){s.observations.push(op+':inspect:'+name);return JSON.stringify(lookup(collection,name,op));}
  if(sub==='connect'&&op==='network'){lookup(collection,name,'Network');const c=lookup(s.containers,container,'Container');if(!c.networks.includes(name))c.networks.push(name);return'Đã nối '+container+' vào '+name;}
  if(sub==='rm'){lookup(collection,name,op);assert(!Object.values(s.containers).some(c=>op==='volume'?c.mounts.some(m=>m.source===name):c.networks.includes(name)),'Tài nguyên vẫn đang được dùng.');assert(!['bridge','none'].includes(name),'Không xóa network mặc định.');delete collection[name];return'Đã xóa '+name;}
  throw Error('Lệnh '+op+' chưa được mô phỏng.');
 }
 if(op==='exec'){const[cname,command,arg]=args,c=lookup(s.containers,cname,'Container');assert(c.status==='running','exec cần container đang chạy.');assert(args.length===3&&['cat','printenv'].includes(command),'exec chỉ hỗ trợ cat PATH hoặc printenv KEY; không có shell.');s.observations.push('exec:'+cname+':'+command+':'+arg);if(command==='printenv')return String(c.env[arg]??'');const mount=c.mounts.find(m=>arg.startsWith(m.target+'/'));const value=mount?s.volumes[mount.source].files[arg.slice(mount.target.length+1)]:c.files[arg];assert(value!==undefined,'File ảo không tồn tại.');return value;}
 if(op==='compose'){
  const[sub,...flags]=args;assert(['up','down','ps','config'].includes(sub),'Compose chỉ mô phỏng up/down/ps/config với cấu hình đề cấp.');
  if(sub==='config'){s.observations.push('compose:config');return JSON.stringify(s.compose);}
  if(sub==='ps'){s.observations.push('compose:ps');return Object.values(s.containers).filter(c=>c.compose).map(c=>c.name+' '+c.status).join('\n');}
  if(sub==='up'){assert(flags.every(f=>f==='-d'),'compose up chỉ nhận -d.');s.networks.lesson_default??={driver:'bridge'};for(const v of s.compose.volumes??[])s.volumes[v]??={files:{}};for(const[name,cfg]of Object.entries(s.compose.services)){if(own(s.containers,name)){assert(s.containers[name].compose,'Tên service đang bị container khác dùng.');startContainer(s,s.containers[name]);continue;}const a=['--name',name,'--network','lesson_default',...(cfg.ports??[]).flatMap(p=>['-p',p]),...(cfg.volumes??[]).flatMap(p=>['-v',p]),cfg.image];createContainer(s,a,true);s.containers[name].compose=true;}return'Các service ảo đã chạy. Health/readiness phải kiểm tra riêng.';}
  assert(flags.every(f=>f==='-v'||f==='--volumes'),'compose down hỗ trợ --volumes.');for(const[n,c]of Object.entries(s.containers))if(c.compose)delete s.containers[n];delete s.networks.lesson_default;if(flags.length)for(const v of s.compose.volumes??[])delete s.volumes[v];return'Dừng và xóa service ảo.';
 }
 if(op==='version'||op==='info'){s.observations.push(op);return'BytePath Docker simulation v1; không phải Docker Engine thật.';}
 throw Error('Lệnh Docker chưa được mô phỏng: '+String(op));
}
export function dockerFrame(state,label='Trước thao tác') {
 return{kind:'docker',label,images:Object.entries(state.images).map(([tag,im])=>({tag,id:im.id,exposed:im.exposed,user:im.user})),containers:Object.values(state.containers).map(copy),volumes:Object.entries(state.volumes).map(([name,v])=>({name,fileCount:Object.keys(v.files).length,files:copy(v.files)})),networks:Object.entries(state.networks).map(([name,n])=>({name,...n})),data:{containers:Object.values(state.containers).map(c=>({name:c.name,status:c.status,ports:c.ports.map(p=>p.host+'→'+p.container).join(', '),mounts:c.mounts.map(m=>m.source+'→'+m.target).join(', ')})),images:Object.keys(state.images),volumes:Object.keys(state.volumes)}};
}
export function runDockerCommand(state,line){const next=copy(state);try{const tokens=parseDockerCommand(line);const output=tokens.length?apply(next,tokens):'';return{ok:true,state:next,output,frame:dockerFrame(next,line)};}catch(e){return{ok:false,state:copy(state),output:'',error:e.message,frame:dockerFrame(state,'Lỗi: '+e.message)};}}
export function runDockerScript(initial,script){
 const lines=Array.isArray(script)?script:String(script).split(/\r?\n/);let state=copy(initial);const frames=[dockerFrame(state)],errors=[],outputs=[];
 if(lines.length>120||lines.join('\n').length>50000)return{ok:false,state,frames,errors:['Tối đa 120 dòng và 50.000 ký tự.'],output:'',notice:DOCKER_SIM_NOTICE};
 for(const[lineIndex,line]of lines.entries()){if(!line.trim()||line.trimStart().startsWith('#'))continue;const result=runDockerCommand(state,line);frames.push(result.frame);if(!result.ok){errors.push('Dòng '+(lineIndex+1)+': '+result.error);break;}state=result.state;outputs.push(result.output);if(JSON.stringify(frames).length+outputs.join('\n').length>2_000_000){errors.push('Đầu ra mô phỏng vượt 2 MB.');break;}}
 return{ok:errors.length===0,state,frames,errors,output:outputs.join('\n'),notice:DOCKER_SIM_NOTICE};
}
