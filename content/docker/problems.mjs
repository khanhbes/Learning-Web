import {random,int} from '../../shared/random.mjs';
import {createDockerState,runDockerScript,DOCKER_SIM_NOTICE} from '../../shared/docker-simulator.mjs';
export const VERSION='docker-2026.10.15-v1';
const copy=x=>structuredClone(x);
const rows=[
 ['run','Cho ứng dụng một căn phòng','Tạo và chạy container web từ byte-web:1. Không thay đổi image gốc.','docker run -d --name web byte-web:1'],
 ['create','Chuẩn bị trước, chạy sau','Tạo container web từ byte-web:1 nhưng chưa khởi động.','docker create --name web byte-web:1'],
 ['lifecycle','Dừng mà giữ căn phòng','Container web đang chạy. Dừng web; giữ nguyên file và container để có thể start lại.','docker stop web'],
 ['start','Mở lại ứng dụng','Khởi động web đã dừng, giữ nội dung và cấu hình đã có.','docker start web'],
 ['publish','Nối cửa ngoài với cửa trong','Chạy web từ byte-web:1, publish cổng host 8080 tới cổng container 80.','docker run -d --name web -p 8080:80 byte-web:1'],
 ['logs','Tìm dấu vết trước khi sửa','Đọc logs và inspect của web đang chạy. Giữ nguyên cấu hình, file và trạng thái.','docker logs web\ndocker inspect web'],
 ['tag','Hai nhãn, cùng một image','Thêm nhãn release:1 cho byte-web:1. Giữ nhãn cũ và ID image.','docker tag byte-web:1 release:1'],
 ['build','Nấu từ công thức Dockerfile','Build context được cấp thành app:1 bằng Dockerfile đã có. File /app/index.txt phải bằng index.txt của context.','docker build -t app:1 .'],
 ['copy','Đặt đúng file vào image','Viết Dockerfile từ byte-web:1, COPY index.txt vào /app/index.txt, EXPOSE 80 rồi build app:1. Không tự publish cổng.','edit Dockerfile "FROM byte-web:1\\nCOPY index.txt /app/index.txt\\nEXPOSE 80"\ndocker build -t app:1 .'],
 ['ignore','Chọn hành lý cho build','Tạo .dockerignore bỏ .env và debug.log. Dockerfile dùng COPY . /app/. Build app:1, chứa index.txt nhưng không có hai file riêng.','edit .dockerignore ".env\\ndebug.log"\nedit Dockerfile "FROM byte-web:1\\nCOPY . /app/"\ndocker build -t app:1 .'],
 ['env','Cấu hình tách khỏi image','Chạy web từ byte-web:1 với APP_ENV=practice. Không sửa ENV của image gốc.','docker run -d --name web -e APP_ENV=practice byte-web:1'],
 ['volume','Gắn ngăn tủ bền vững','Chạy web từ byte-web:1, gắn named volume data sẵn có vào /data. Giữ mọi dữ liệu của volume.','docker run -d --name web -v data:/data byte-web:1'],
 ['replace','Đổi container, giữ sổ tay','web cũ đang chạy và dùng volume data. Dừng, xóa web, tạo web mới từ byte-web:2 với cùng volume gắn tại /data. Giữ nội dung sổ tay.','docker stop web\ndocker rm web\ndocker run -d --name web -v data:/data byte-web:2'],
 ['network','Cho hai ứng dụng chung mạng','Tạo network school; chạy web bằng byte-web:1 và db bằng byte-db:1 cùng network school. Không publish DB ra host.','docker network create school\ndocker run -d --name web --network school byte-web:1\ndocker run -d --name db --network school byte-db:1'],
 ['connect','Nối một phòng đang hoạt động','web đang chạy trên bridge; network school đã tồn tại. Nối web vào school, giữ bridge và không tạo container mới.','docker network connect school web'],
 ['limits','Chia tài nguyên có giới hạn','Chạy web từ byte-web:1 với --memory 256m và --cpus 0.5. Các số là cấu hình mô phỏng, không phải đo hiệu năng.','docker run -d --name web --memory 256m --cpus 0.5 byte-web:1'],
 ['nonroot','Đúng người, đúng quyền','Chạy web bằng byte-web:1 với UID 1000 thay UID 0 của image. Không thay đổi image gốc.','docker run -d --name web --user 1000 byte-web:1'],
 ['readonly','Giữ nền chỉ đọc, mở tủ dữ liệu','Chạy web từ byte-web:1 với root filesystem read-only, đồng thời gắn data vào /data để dành nơi ghi. Giữ dữ liệu volume.','docker run -d --name web --read-only -v data:/data byte-web:1'],
 ['restart','Ghi rõ chính sách khởi động lại','Chạy web từ byte-web:1 với restart policy unless-stopped. Mô hình chỉ kiểm cấu hình, không giả lập daemon reboot.','docker run -d --name web --restart unless-stopped byte-web:1'],
 ['compose-up','Một bản đồ, hai service','Đọc compose config đã cấp, chạy web và db bằng docker compose up -d. Giữ volume data và không tự mở cổng DB.','docker compose config\ndocker compose up -d'],
 ['compose-down','Dỡ ứng dụng, giữ dữ liệu','Stack Compose đang chạy. Dùng compose down để bỏ service và network riêng, giữ named volume data với nội dung cũ.','docker compose down'],
 ['cleanup','Chỉ dọn đồ đã chỉ định','Container old đã dừng, keep đang chạy. Xóa old, giữ keep và mọi volume. Không dùng lệnh prune hàng loạt.','docker rm old'],
 ['release','Phát hành một trang học nhỏ','Build app:1 từ context, chạy web từ app:1 ở 127.0.0.1:8080→80, UID 1000, RAM 256m, CPU 0.5. File index.txt phải giữ đúng nội dung được cấp.','docker build -t app:1 .\ndocker run -d --name web -p 127.0.0.1:8080:80 --user 1000 --memory 256m --cpus 0.5 app:1'],
 ['multistage','Chỉ mang sản phẩm cuối','Dockerfile có stage build từ byte-web:1 để COPY index.txt vào /artifact.txt; stage cuối từ byte-web:1 chỉ COPY --from=build /artifact.txt /app/index.txt. Build app:1.','edit Dockerfile "FROM byte-web:1 AS build\\nCOPY index.txt /artifact.txt\\nFROM byte-web:1\\nCOPY --from=build /artifact.txt /app/index.txt"\ndocker build -t app:1 .'],
];
export const problemIds=rows.map(r=>'docker-'+r[0]);
export const referenceScripts=Object.fromEntries(rows.map(r=>['docker-'+r[0],r[3]]));
function seededContainer(s,name='web',flags=''){const r=runDockerScript(s,`docker run -d --name ${name} ${flags} byte-web:1`);if(!r.ok)throw Error(r.errors.join(';'));return r.state;}
export function generateInput(id,seed=0){
 if(!problemIds.includes(id))throw Error('Unknown Docker problem '+id);
 const key=id.slice(7),rng=random(String(seed)+':'+id),payload='Bài học '+int(rng,1,9999),note='Tiến độ '+int(rng,1,9999),s0=createDockerState();let s=s0;
 s.context['index.txt']=payload;s.images['byte-web:1'].files['/app/index.txt']=payload;s.volumes.data={files:{'note.txt':note}};
 const base=copy(s.images['byte-web:1']);const goal={imagesPreserved:{'byte-web:1':base},volumesPreserved:{data:copy(s.volumes.data)},containers:{},report:{}};
 const web=(props)=>{goal.containers.web={image:'byte-web:1',status:'running',...props};};
 switch(key){
  case'run':web({});goal.report={state:'running'};break;
  case'create':web({status:'created'});goal.report={state:'created'};break;
  case'lifecycle':s=seededContainer(s);web({status:'exited',files:copy(s.containers.web.files)});goal.report={state:'exited',file:payload};break;
  case'start':s=seededContainer(s);s.containers.web.status='exited';web({files:copy(s.containers.web.files)});goal.report={state:'running',file:payload};break;
  case'publish':web({ports:[{host:8080,container:80,ip:'0.0.0.0'}]});goal.report={host:8080,container:80};break;
  case'logs':s=seededContainer(s);s.containers.web.logs=['Bắt đầu xử lý '+note,'Đã tải '+payload];web(copy(s.containers.web));goal.observations=['logs:web','inspect:web'];goal.report={running:1,stopped:0};break;
  case'tag':goal.images={'release:1':base};goal.report={labels:3,sameImage:true};break;
  case'build':case'copy':goal.images={'app:1':{files:{'/app/index.txt':payload}}};goal.report={file:payload,publishedPorts:0};break;
  case'ignore':s.context['.env']='DEMO_VALUE='+note;s.context['debug.log']=payload;goal.images={'app:1':{files:{'/app/index.txt':payload}}};goal.forbiddenFiles={'app:1':['/app/.env','/app/debug.log']};goal.report={indexIncluded:true,envIncluded:false};break;
  case'env':web({env:{APP_ENV:'practice'}});goal.report={containerEnv:'practice',imageEnv:null};break;
  case'volume':web({mounts:[{source:'data',target:'/data',readOnly:false}]});goal.report={volume:'data',file:note};break;
  case'replace':s.images['byte-web:2']={...copy(base),id:'virtual-web-2'};s=seededContainer(s,'web','-v data:/data');web({image:'byte-web:2',mounts:[{source:'data',target:'/data',readOnly:false}]});goal.report={image:'byte-web:2',file:note};break;
  case'network':goal.networks=['school'];web({networks:['school'],ports:[]});goal.containers.db={image:'byte-db:1',status:'running',networks:['school'],ports:[]};goal.report={network:'school',publishedDbPorts:0};break;
  case'connect':s=seededContainer(s);s.networks.school={driver:'bridge'};web({networks:['bridge','school']});goal.report={networks:2,containers:1};break;
  case'limits':web({memory:'256m',cpus:0.5});goal.report={memoryMiB:256,cpus:0.5};break;
  case'nonroot':web({user:'1000'});goal.report={containerUser:'1000',imageUser:'0'};break;
  case'readonly':web({readOnly:true,mounts:[{source:'data',target:'/data',readOnly:false}]});goal.report={rootReadOnly:true,dataReadOnly:false};break;
  case'restart':web({restart:'unless-stopped'});goal.report={policy:'unless-stopped'};break;
  case'compose-up':goal.networks=['lesson_default'];web({compose:true,networks:['lesson_default'],ports:[{host:8080,container:80,ip:'0.0.0.0'}]});goal.containers.db={image:'byte-db:1',status:'running',compose:true,mounts:[{source:'data',target:'/data',readOnly:false}],ports:[]};goal.observations=['compose:config'];goal.report={runningServices:2,volumes:1};break;
  case'compose-down':s=runDockerScript(s,'docker compose up -d').state;goal.absentContainers=['web','db'];goal.absentNetworks=['lesson_default'];goal.report={runningServices:0,volumes:1};break;
  case'cleanup':s=seededContainer(seededContainer(s,'keep'),'old');s.containers.old.status='exited';goal.containers.keep=copy(s.containers.keep);goal.absentContainers=['old'];goal.report={running:1,removedOld:true};break;
  case'release':goal.images={'app:1':{files:{'/app/index.txt':payload}}};web({image:'app:1',ports:[{host:8080,container:80,ip:'127.0.0.1'}],user:'1000',memory:'256m',cpus:0.5,files:{'/app/index.txt':payload}});goal.report={host:8080,user:'1000',memoryMiB:256};break;
  case'multistage':goal.images={'app:1':{files:{'/app/index.txt':payload}}};goal.forbiddenFiles={'app:1':['/artifact.txt']};goal.report={file:payload,buildArtifactInFinal:false};break;
 }
 return{seed:String(seed),initial:s,goal};
}
const equal=(a,b)=>a===b||Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>equal(v,b[i]))||a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)&&Object.keys(a).length===Object.keys(b).length&&Object.entries(a).every(([k,v])=>Object.hasOwn(b,k)&&equal(v,b[k]));
const subset=(a,b)=>a===b||Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every(v=>b.some(x=>equal(v,x)))||a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)&&Object.entries(a).every(([k,v])=>Object.hasOwn(b,k)&&subset(v,b[k]));
export function oracle(id,input){if(!problemIds.includes(id)||!input?.goal?.report)throw Error('Docker oracle missing fixture.');return copy(input.goal.report);}
export function checkOutput(id,input,output){return problemIds.includes(id)&&!!equal(oracle(id,input),output);}
export function checkDockerGoal(input,result){
 if(!result.ok)return false;const g=input.goal,s=result.state;
 return Object.entries(g.containers??{}).every(([n,c])=>subset(c,s.containers[n]))&&Object.entries(g.images??{}).every(([n,c])=>subset(c,s.images[n]))&&Object.entries(g.imagesPreserved??{}).every(([n,c])=>equal(c,s.images[n]))&&Object.entries(g.volumesPreserved??{}).every(([n,c])=>equal(c,s.volumes[n]))&&(g.networks??[]).every(n=>Object.hasOwn(s.networks,n))&&(g.absentContainers??[]).every(n=>!Object.hasOwn(s.containers,n))&&(g.absentNetworks??[]).every(n=>!Object.hasOwn(s.networks,n))&&(g.observations??[]).every(n=>s.observations.includes(n))&&Object.entries(g.forbiddenFiles??{}).every(([n,files])=>s.images[n]&&files.every(p=>!Object.hasOwn(s.images[n].files,p)));
}
export function gradeDockerScript(id,input,script){if(!problemIds.includes(id))throw Error('Unknown Docker problem');const result=runDockerScript(input.initial,script);return{...result,passed:checkDockerGoal(input,result)};}
export function testsFor(id,seed,opts={}){const only=typeof opts==='boolean'?opts:!!opts.publicOnly;const data=[...Array.from({length:2},(_,i)=>({name:'Mô hình mẫu '+(i+1),group:'sample',input:generateInput(id,'sample-'+i)})),...(only?[]:Array.from({length:8},(_,i)=>({name:'Dữ liệu riêng '+(i+1),group:'random',input:generateInput(id,String(seed)+':'+i)})))];return data.map((x,i)=>({...x,id:i+1,expected:oracle(id,x.input)}));}
export function edgeInputs(id){return[generateInput(id,'small'),generateInput(id,'retained-data')];}
export const problems=Object.fromEntries(rows.map(([key,title,statement])=>{const id='docker-'+key,sampleInput=generateInput(id,0);return[id,{id,version:VERSION,courseId:'docker',title,statement,skill:key,constraints:DOCKER_SIM_NOTICE+' Mỗi dòng một lệnh, tối đa120 dòng/50.000 ký tự; registry chỉ có byte-web:1/2 và byte-db:1. Tên tài nguyên cố định; nội dung file và volume đổi theo seed. edit FILE "TEXT" là editor ảo, dùng \\n cho xuống dòng. Dockerfile hỗ trợ FROM, COPY, WORKDIR, ENV, EXPOSE, USER, CMD; không chạy RUN/ADD hoặc shell. Compose dùng cấu hình đề cấp, không phải parser YAML đầy đủ. Chấm trạng thái và dữ liệu theo goal; không so chuỗi lệnh với mẫu.',sampleInput,sampleOutput:oracle(id,sampleInput),hints:['Đọc trạng thái ban đầu và điều kiện cuối. Phân biệt image, container và dữ liệu bền vững.','Xác định tài nguyên cần sửa và phần phải giữ; xem cờ --name, -p, -v hoặc --network theo đề.','Chia thao tác thành từng dòng. Dùng ps, inspect hoặc volume inspect để kiểm chứng trạng thái.'],starters:{shell:'# Terminal Docker mô phỏng, không truy cập máy thật.\ndocker ps -a\n'}}];}));
export const solutions=referenceScripts;
export function solution(id){return solutions[id];}
export function problemDetails(id){const p=problems[id];return p?{...p,language:'shell',starter:p.starters.shell,contract:p.constraints,examples:testsFor(id,0,{publicOnly:true}).map(t=>({input:t.input,output:t.expected}))}:null;}
export function traceQuestion(id,seed){const input=generateInput(id,seed),commands=referenceScripts[id].split('\n'),take=int(random(String(seed)+':take'),0,commands.length),steps=commands.slice(0,take),result=runDockerScript(input.initial,steps),answer={running:Object.values(result.state.containers).filter(c=>c.status==='running').length,containers:Object.keys(result.state.containers).length,volumes:Object.keys(result.state.volumes).length};return{prompt:'Sau các lệnh đã hiển thị, đếm container đang chạy, tổng container còn tồn tại và named volume.',input:{initial:input.initial,commands:steps},answer,wrongAnswers:[{...answer,running:answer.running+1},{...answer,containers:answer.containers+1},{...answer,volumes:answer.volumes+1}],explanation:'ps mặc định chỉ hiện đang chạy; ps -a gồm cả đã tạo/đã dừng. Volume được đếm riêng, stop không xóa container hoặc volume.'};}
