import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import assert from 'node:assert/strict';
import {getCourse} from '../content/registry.mjs';
const snapshotPath=process.argv[2]??'.data/public/agent-linear-before-export.json';
if(dirname(resolve(snapshotPath))!==resolve('.data/public')||extname(snapshotPath)!=='.json')throw Error('Expected a private release snapshot.');
const state=JSON.parse(readFileSync('.data/public/state.json','utf8').replace(/^\uFEFF/,'')),origin=state.publicOrigin??state.origin;
const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({password:state.password})});
assert.equal(login.status,200,'Existing password');
const cookie=login.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
const get=async path=>{const r=await fetch(origin+path,{headers:{cookie,Origin:origin}});assert.equal(r.status,200,path);return r.json();};
const courses=(await get('/api/courses')).courses;
assert.deepEqual(courses.map(c=>[c.id,c.mandatoryCount,c.advancedCount]),[['dsa',48,12],['ml',40,12],['da',28,8],['git',24,6],['agent',24,8],['linear',28,8]]);
const report={origin,online:true,existingPassword:true,courses:[],profilePreserved:false,frontendPublished:false};
for(const id of ['agent','linear']) {
  const def=getCourse(id),sources=(await get('/api/sources?courseId='+id)).sources,k=await get('/api/knowledge?courseId='+id),lesson=await get(`/api/courses/${id}/lessons/1`);
  assert.equal(sources.length,def.sourceCatalog.length);assert.equal(lesson.courseId,id);assert.equal(lesson.problems.length,def.lessons[0].problemIds.length);
  assert.equal(k.tips.length,def.knowledgeTipRows.length);assert.equal(k.topics.length,def.knowledgeInterviewRows.length);
  for(const source of sources){const r=await fetch(origin+source.url,{headers:{cookie,Origin:origin}});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/jpeg/);}
  report.courses.push({id,mandatory:def.course.mandatoryLessons,advanced:def.course.advancedLessons,sources:sources.length,tips:k.tips.length,interviews:k.topics.length});
}
const before=JSON.parse(readFileSync(snapshotPath,'utf8')),after=await get('/api/data/export');
for(const[id,value]of Object.entries(before.state.courses))assert.deepEqual(after.state.courses[id],value,`${id} progress/language retained`);
for(const key of ['name','language','dailyGoal'])assert.deepEqual(after.state.profile[key],before.state.profile[key],`Profile ${key}`);
assert.equal(after.state.activeCourse,before.state.activeCourse);assert.equal(after.state.xp,before.state.xp);assert.equal(after.state.gems,before.state.gems);
for(const id of before.state.inventory)assert.ok(after.state.inventory.includes(id));
const byId=rows=>[...rows].sort((a,b)=>a.id.localeCompare(b.id));
for(const key of ['attempts','jobs','capstones','drafts','knowledgeAttempts'])assert.deepEqual(byId(after[key]??[]),byId(before[key]??[]),`${key} retained`);
for(const row of before.ledger)assert.ok(after.ledger.some(r=>r.id===row.id));
report.profilePreserved=true;
const staged=readFileSync('output/agent-linear-dist/index.html','utf8'),entry=staged.match(/<script[^>]+src="([^"]+)"/)?.[1];assert.ok(entry);
const html=await fetch(origin);assert.equal(html.status,200);assert.ok((await html.text()).includes(entry));assert.equal((await fetch(origin+entry)).status,200);
report.frontendPublished=true;
assert.equal((await fetch(origin+'/api/courses')).status,401,'Private APIs remain password-protected');
report.privateApisProtected=true;
const health=await get('/api/health');assert.equal(health.mlRunner.available,true);report.pythonRunnerAvailable=true;
writeFileSync('output/agent-linear-live-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
