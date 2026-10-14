// Real runner smoke journey, always in an isolated in-memory profile. The full
// sequential gates (without fixture unlocks) are covered by agent-linear-api.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';
import {getCourse} from '../content/registry.mjs';
const store=createStore(':memory:'),app=await createApp({store,config:{cloud:false,aiProvider:'off'},aiHealth:async()=>({available:false})});
const report={createdAt:new Date().toISOString(),checks:[],passed:false,note:'Actual runner: first lesson and all three capstone functions in each course. Middle lesson progress is fixture-unlocked ONLY in this in-memory profile; full sequential gates are tested separately.'};
const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});assert.equal(r.statusCode,200,url+': '+r.body);return r.json();};
async function submitCode(a,def,prefix) {
  for(const problemId of a.requiredProblems) {
    const {jobId}=await call('POST',`${prefix}/${a.id}/code`,{problemId,language:'python',code:def.solution(problemId,'python')});
    const deadline=Date.now()+180000;let job;
    do {await new Promise(resolve=>setTimeout(resolve,250));job=store.get('jobs',jobId);assert.ok(Date.now()<deadline,'Grading deadline');} while(['queued','running'].includes(job.status));
    assert.equal(job.result.status,'accepted',JSON.stringify(job.result));
    report.checks.push({courseId:def.course.id,problemId,mode:a.mode,status:job.result.status,tests:job.result.total});
    console.log(JSON.stringify(report.checks.at(-1)));
  }
}
try {
  for(const id of ['agent','linear']) {
    const def=getCourse(id),a=await call('POST','/api/attempts',{courseId:id,lessonId:1,mode:'assessment'}),saved=store.get('attempts',a.id);
    await call('PATCH',`/api/attempts/${a.id}`,{answers:Object.fromEntries(saved.questions.map(q=>[q.id,q.answerId]))});
    await submitCode(a,def,'/api/attempts');
    assert.equal((await call('POST',`/api/attempts/${a.id}/submit`,{})).passed,true);
    const xp=store.getState().xp;await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(store.getState().xp,xp);
    const state=store.getState();for(let l=2;l<=def.course.mandatoryLessons;l++)state.courses[id].progress[l]={passed:true,bestKnowledge:100,nextReview:0};store.putState(state);
    const prefix=`/api/courses/${id}/capstone`,cap=await call('POST',prefix,{}),original=store.get('capstones',cap.id);
    await call('PATCH',`${prefix}/${cap.id}`,{essay:Object.fromEntries(def.essayFields.map(f=>[f.id,'Dữ liệu giả lập, điều kiện, thuật toán, trường hợp biên và kết quả đã được giải thích.'])),answers:Object.fromEntries(original.questions.map(q=>[q.id,q.answerId]))});
    await submitCode(cap,def,prefix);
    const result=await call('POST',`${prefix}/${cap.id}/submit`,{});assert.equal(result.passed,true,JSON.stringify(result));
    assert.equal(result.code,60);
  }
  const backup=await call('GET','/api/data/export');await call('POST','/api/data/import',backup);
  assert.equal(store.getState().courses.agent.capstonePassed,true);assert.equal(store.getState().courses.linear.capstonePassed,true);
  assert.deepEqual(store.getState().courses.dsa.progress,{});report.backupRestored=true;report.passed=true;
} finally {await app.close();mkdirSync('output',{recursive:true});writeFileSync('output/agent-linear-real-api-report.json',JSON.stringify(report,null,2));}
