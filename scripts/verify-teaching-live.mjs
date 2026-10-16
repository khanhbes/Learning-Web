import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import assert from 'node:assert/strict';
import {courseRegistry} from '../content/registry.mjs';
import {TEACHING_VERSION} from '../content/pedagogy/engine.mjs';

// Read-only release verification. Credentials and learner records stay in memory;
// output contains only counts, booleans and the public site address.
const snapshotPath=process.argv[2]??'.data/public/teaching-before-export.json';
if(dirname(resolve(snapshotPath))!==resolve('.data/public')||extname(snapshotPath)!=='.json')throw Error('Expected a private release snapshot.');
const settings=JSON.parse(readFileSync('.data/public/state.json','utf8').replace(/^\uFEFF/,''));
const origin=settings.publicOrigin??settings.origin;
const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({password:settings.password})});
assert.equal(login.status,200,'Existing password must still work');
const cookie=login.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
const get=async path=>{const r=await fetch(origin+path,{headers:{cookie,Origin:origin}});assert.equal(r.status,200,path);return r.json();};
const report={origin,online:true,existingPassword:true,courses:[],teachingVersion:TEACHING_VERSION};
const courses=(await get('/api/courses')).courses;assert.equal(courses.length,Object.keys(courseRegistry).length);
for(const[id,def]of Object.entries(courseRegistry)){
  const course=courses.find(c=>c.id===id),lesson=await get(`/api/courses/${id}/lessons/1`),flow=lesson.teachingFlow;
  assert.equal(course.mandatoryCount,def.course.mandatoryLessons);assert.equal(course.advancedCount,def.course.advancedLessons);
  assert.equal(flow.version,TEACHING_VERSION);assert.equal(flow.steps.filter(s=>s.activityId).length,8);assert.ok(flow.trace.frames.length>0);
  report.courses.push({id,lessons:def.lessons.filter(l=>l.kind!=='exam').length,exams:def.lessons.filter(l=>l.kind==='exam').length,steps:flow.steps.length});
}
const before=JSON.parse(readFileSync(snapshotPath,'utf8')),after=await get('/api/data/export');
const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
const same=(a,b,label)=>assert.ok(stable(a)===stable(b),label+' must be preserved');
for(const[id,value]of Object.entries(before.state.courses))same(after.state.courses[id],value,id+' progress/language');
for(const key of ['name','language','dailyGoal','skin'])same(after.state.profile[key],before.state.profile[key],'Profile '+key);
for(const key of ['activeCourse','xp','gems','inventory'])same(after.state[key],before.state[key],key);
same(after.state.learningSupport??{},before.state.learningSupport??{},'Bridge progress');
const byId=rows=>[...rows].sort((a,b)=>a.id.localeCompare(b.id));
for(const key of ['attempts','jobs','capstones','drafts','knowledgeAttempts'])same(byId(after[key]??[]),byId(before[key]??[]),key);
for(const row of before.ledger)same(after.ledger.find(r=>r.id===row.id),row,'Existing reward ledger');
report.profilePreserved=true;report.existingAttemptsPreserved=true;report.rewardsPreserved=true;
const staged=readFileSync('output/teaching-dist/index.html','utf8'),entry=staged.match(/<script[^>]+src="([^"]+)"/)?.[1];assert.ok(entry);
const html=await fetch(origin);assert.equal(html.status,200);assert.ok((await html.text()).includes(entry));assert.equal((await fetch(origin+entry)).status,200);
report.frontendPublished=true;
assert.equal((await fetch(origin+'/api/courses')).status,401);report.privateApisProtected=true;
const health=await get('/api/health');assert.equal(health.mlRunner.available,true);report.pythonRunnerAvailable=true;
writeFileSync('output/teaching-live-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
