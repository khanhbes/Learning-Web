import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as docker from '../content/docker/index.mjs';
import {createDockerState,runDockerScript,runDockerCommand,parseDockerCommand} from '../shared/docker-simulator.mjs';
import {runDocker} from '../server/docker-runner.mjs';
import {validateContent} from '../content/schema.mjs';
const id=k=>'docker-'+k;
function measured(key,s){
 const c=s.containers.web,im=s.images['app:1'],data=s.volumes.data,files=data?.files??{};
 switch(key){
 case'run':case'create':return{state:c.status};
 case'lifecycle':case'start':return{state:c.status,file:c.files['/app/index.txt']};
 case'publish':return{host:c.ports[0].host,container:c.ports[0].container};
 case'logs':return{running:Object.values(s.containers).filter(c=>c.status==='running').length,stopped:Object.values(s.containers).filter(c=>c.status==='exited').length};
 case'tag':return{labels:Object.keys(s.images).length,sameImage:s.images['byte-web:1'].id===s.images['release:1'].id};
 case'build':case'copy':return{file:im.files['/app/index.txt'],publishedPorts:Object.values(s.containers).reduce((n,c)=>n+c.ports.length,0)};
 case'ignore':return{indexIncluded:Object.hasOwn(im.files,'/app/index.txt'),envIncluded:Object.hasOwn(im.files,'/app/.env')};
 case'env':return{containerEnv:c.env.APP_ENV,imageEnv:s.images['byte-web:1'].env.APP_ENV??null};
 case'volume':return{volume:c.mounts[0].source,file:files['note.txt']};
 case'replace':return{image:c.image,file:files['note.txt']};
 case'network':return{network:c.networks.find(n=>s.containers.db.networks.includes(n)),publishedDbPorts:s.containers.db.ports.length};
 case'connect':return{networks:c.networks.length,containers:Object.keys(s.containers).length};
 case'limits':return{memoryMiB:Number(c.memory.slice(0,-1)),cpus:c.cpus};
 case'nonroot':return{containerUser:c.user,imageUser:s.images['byte-web:1'].user};
 case'readonly':return{rootReadOnly:c.readOnly,dataReadOnly:c.mounts[0].readOnly};
 case'restart':return{policy:c.restart};
 case'compose-up':case'compose-down':return{runningServices:Object.values(s.containers).filter(c=>c.compose&&c.status==='running').length,volumes:Object.keys(s.volumes).length};
 case'cleanup':return{running:Object.values(s.containers).filter(c=>c.status==='running').length,removedOld:!Object.hasOwn(s.containers,'old')};
 case'release':return{host:c.ports[0].host,user:c.user,memoryMiB:Number(c.memory.slice(0,-1))};
 case'multistage':return{file:im.files['/app/index.txt'],buildArtifactInFinal:Object.hasOwn(im.files,'/artifact.txt')};
 default:throw Error(key);
 }
}
test('Docker catalog maps all20 original images by hash and all30 sessions to authored material',()=>{
 validateContent({course:docker.course,lessons:docker.lessons,problems:docker.problems,sources:docker.sourceCatalog});
 assert.equal(docker.lessons.length,30);assert.deepEqual(docker.lessons.filter(l=>l.kind==='exam').map(l=>l.id),[8,16,24]);
 const directory=new URL('../study documents/Docker/',import.meta.url),files=readdirSync(directory).filter(f=>/\.jpe?g$/i.test(f));
 assert.equal(files.length,20);assert.deepEqual([...docker.sourceCatalog.map(s=>s.file)].sort(),files.sort());
 for(const s of docker.sourceCatalog){assert.equal(createHash('sha256').update(readFileSync(new URL(s.file,directory))).digest('hex'),s.sha256);assert.ok(docker.lessons.some(l=>l.sourcePrefixes.includes(s.prefix)),s.prefix);}
 assert.ok(docker.corrections.length>=5);
});
test('All24 Docker goals: 200seeds, independently measured final reports, alternatives, wrong scripts and input immutability',()=>{
 for(const pid of docker.problemIds)for(let seed=0;seed<200;seed++){
  const input=docker.generateInput(pid,seed),before=structuredClone(input),script=docker.referenceScripts[pid];
  assert.deepEqual(docker.generateInput(pid,seed),input);
  const result=docker.gradeDockerScript(pid,input,script);
  assert.equal(result.passed,true,pid+' '+seed+' '+result.errors.join(';'));
  assert.deepEqual(measured(pid.slice(7),result.state),docker.oracle(pid,input),pid+' independent report');
  assert.equal(docker.checkOutput(pid,input,measured(pid.slice(7),result.state)),true);
  assert.equal(docker.checkOutput(pid,input,{pass:true}),false);
  assert.equal(docker.gradeDockerScript(pid,input,'docker ps -a\n'+script+'\ndocker ps').passed,true,pid+' alternative');
  assert.equal(docker.gradeDockerScript(pid,input,'# no changes').passed,false,pid+' no-op');
  assert.deepEqual(input,before);
 }
 const scenario=docker.generateInput(id('run'),1);
 assert.equal(docker.gradeDockerScript(id('run'),scenario,'docker create --name web byte-web:1\ndocker start web').passed,true);
});
test('Container lifecycle keeps files on stop, named volumes survive replacement/down, EXPOSE never publishes',()=>{
 let s=createDockerState({volumes:{data:{files:{'note.txt':'retain me'}}}});
 let r=runDockerScript(s,'docker run -d --name web -v data:/data byte-web:1\ndocker stop web');
 assert.equal(r.ok,true);assert.equal(r.state.containers.web.status,'exited');assert.equal(r.state.volumes.data.files['note.txt'],'retain me');
 r=runDockerScript(r.state,'docker rm web\ndocker run -d --name web -v data:/data byte-web:1\ndocker exec web cat /data/note.txt');assert.equal(r.ok,true);assert.match(r.output,/retain me/);
 const exposed=runDockerScript(s,'docker build -t app:1 .\ndocker run -d --name web app:1');assert.deepEqual(exposed.state.containers.web.ports,[]);assert.ok(exposed.state.images['app:1'].exposed.includes(80));
 const compose=runDockerScript(s,'docker compose up -d\ndocker compose down');assert.equal(compose.ok,true);assert.equal(Object.keys(compose.state.containers).length,0);assert.equal(compose.state.volumes.data.files['note.txt'],'retain me');
});
test('Port reservations bind at start, failures are atomic and shell/host operations cannot execute',()=>{
 const s=createDockerState(),created=runDockerScript(s,'docker create --name one -p 8080:80 byte-web:1\ndocker create --name two -p 8080:80 byte-web:1');
 assert.equal(created.ok,true);const one=runDockerCommand(created.state,'docker start one');assert.equal(one.ok,true);
 const collision=runDockerCommand(one.state,'docker start two');assert.equal(collision.ok,false);assert.deepEqual(collision.state,one.state);
 for(const command of ['echo test','docker run --privileged byte-web:1','docker run -v C:/Users:/host byte-web:1','docker run -v /:/host byte-web:1','docker exec one sh','docker ps; echo bad','docker ps | anything','docker run --name __proto__ byte-web:1','docker volume create constructor']){
  const r=runDockerCommand(one.state,command);assert.equal(r.ok,false,command);assert.deepEqual(r.state,one.state);
 }
 assert.throws(()=>parseDockerCommand('docker ps $(unknown)'));
 const quoted=runDockerCommand(s,'edit text.txt "$(not-executed)"');assert.equal(quoted.ok,true);assert.equal(quoted.state.context['text.txt'],'$(not-executed)');
 assert.equal(runDockerScript(s,Array(121).fill('docker ps')).ok,false);
 assert.equal(runDockerScript(s,'x'.repeat(50001)).ok,false);
 assert.equal(runDockerScript(s,'edit Dockerfile "FROM byte-web:1\\nRUN anything"\ndocker build -t app:1 .').ok,false);
});
test('Docker runner reports real accept/reject and infrastructure mismatch without false fail',async()=>{
 for(const pid of docker.problemIds){
  const good=await runDocker({problemId:pid,language:'shell',code:docker.referenceScripts[pid],seed:'runner',version:docker.VERSION},docker);assert.equal(good.status,'accepted',pid);
  const bad=await runDocker({problemId:pid,language:'shell',code:'docker ps',seed:'runner',version:docker.VERSION},docker);assert.equal(bad.status,'rejected',pid);
  assert.ok(good.frames.length);assert.ok(good.checks.filter(c=>c.group!=='sample').every(c=>c.actual===undefined&&c.expected===undefined));
 }
 const base={problemId:docker.problemIds[0],language:'shell',code:docker.referenceScripts[docker.problemIds[0]],seed:0};
 assert.equal((await runDocker({...base,version:'missing'},docker)).status,'infrastructure_error');
 assert.equal((await runDocker({...base,fixtures:[]},docker)).status,'infrastructure_error');
 assert.equal((await runDocker({...base,language:'python'},docker)).status,'compile_error');
});
test('Docker capstone requires all3 code functions, essay and >=80; customtests distinguish known wrong workflows',()=>{
 const a=docker.createCapstone(0);a.answers=Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]));a.essay=Object.fromEntries(docker.essayFields.map(f=>[f.id,'Giải thích có ví dụ và giới hạn.']));a.codesPassed=[...docker.capstoneProblems];
 assert.equal(docker.gradeCapstone(a).score,90);assert.equal(docker.gradeCapstone(a).passed,true);
 a.codesPassed.pop();assert.equal(docker.gradeCapstone(a).passed,false);a.codesPassed=[...docker.capstoneProblems];a.essay[docker.essayFields[0].id]=' ';assert.equal(docker.gradeCapstone(a).passed,false);
 const tests=docker.capstoneProblems.map(problemId=>({problemId,input:{seed:'edge'},expected:docker.oracle(problemId,docker.generateInput(problemId,'edge'))}));
 const score=docker.customTestScore(tests);assert.equal(score.score,10);assert.equal(score.killed.length,6);assert.equal(docker.customTestScore([...tests,...tests]).score,10);
 assert.equal(docker.validCustomInput(docker.capstoneProblems[0],{seed:'x',state:{}}),false);
});
