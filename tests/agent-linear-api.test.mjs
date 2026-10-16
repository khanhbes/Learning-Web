import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/index.mjs';
import { createStore } from '../server/store.mjs';
import { getCourse } from '../content/registry.mjs';
import { dayTime } from '../server/game.mjs';

async function fixture() {
  const store=createStore(':memory:');
  let nextStatus='accepted';
  // Academic gates/persistence use a controlled executor here. Reference code
  // is checked in the real sandbox separately by verify-agent-linear-runtime.
  const execute=async options=>({status:nextStatus,checks:[],message:'Isolated API fixture',version:options.version});
  const app=await createApp({store,execute,now:()=>dayTime('2026-10-15')+12*3600000,
    health:async()=>({available:false}),aiHealth:async()=>({available:false}),
    config:{cloud:false,aiProvider:'off'}});
  const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});return {status:r.statusCode,body:r.json()};};
  const answer=async(a,count=a.questions.length,prefix='/api/attempts')=>{
    const saved=store.get(prefix.includes('/capstone')?'capstones':'attempts',a.id);
    const answers=Object.fromEntries(saved.questions.map((q,i)=>[q.id,i<count?q.answerId:q.options.find(o=>o.id!==q.answerId).id]));
    const r=await call('PATCH',`${prefix}/${a.id}`,{answers});assert.equal(r.status,200,JSON.stringify(r.body));
  };
  const code=async(a,prefix='/api/attempts')=>{
    const def=getCourse(a.courseId);
    for(const problemId of a.requiredProblems) {
      const r=await call('POST',`${prefix}/${a.id}/code`,{problemId,language:'python',code:def.solution(problemId,'python')});
      assert.equal(r.status,200,JSON.stringify(r.body));
      for(let i=0;i<200&&['queued','running'].includes(store.get('jobs',r.body.jobId).status);i++)await new Promise(resolve=>setTimeout(resolve,5));
      const job=store.get('jobs',r.body.jobId);assert.equal(job.courseId,a.courseId);
      assert.equal(job.result.status,nextStatus);
    }
  };
  return {store,app,call,answer,code,setStatus:status=>{nextStatus=status;}};
}

test('AI Agent and Linear Algebra sources, preferences, lesson-one drafts and backup remain separate',async()=>{
  const {store,app,call}=await fixture();
  try {
    const courses=(await call('GET','/api/courses')).body.courses;
    assert.equal(courses.length,9);
    for(const [id,sourceCount] of [['agent',8],['linear',10]]) {
      const def=getCourse(id);
      assert.equal(def.course.runtime,'pyodide');
      const sources=(await call('GET',`/api/sources?courseId=${id}`)).body.sources;
      assert.equal(sources.length,sourceCount);
      for(const source of sources){const r=await app.inject(source.url);assert.equal(r.statusCode,200);assert.match(r.headers['content-type'],/image\/jpeg/);}
      assert.equal((await call('PUT','/api/profile',{name:'QA',language:'python',dailyGoal:50,activeCourse:id})).status,200);
      assert.equal((await call('GET',`/api/courses/${id}/lessons/2`)).status,403);
      const a=(await call('POST','/api/attempts',{courseId:id,lessonId:1,mode:'practice'})).body;
      assert.equal(a.courseId,id);
      assert.equal(a.lab.questions.length,8);
      for(const q of a.lab.questions){assert.equal(q.answer,undefined);assert.equal(q.explanation,undefined);}
      const pid=def.lessons[0].problemIds[0];
      assert.equal((await call('PATCH',`/api/attempts/${a.id}`,{codeDrafts:{[pid]:{python:`# draft ${id}`}}})).status,200);
      assert.equal((await call('GET',`/api/attempts/${a.id}`)).body.codeDrafts[pid].python,`# draft ${id}`);
      const trace=await call('GET',`/api/traces/${pid}?lessonId=1`);
      assert.equal(trace.status,200,JSON.stringify(trace.body));assert.ok(trace.body.frames.length>=2);
      const k=(await call('GET',`/api/knowledge?courseId=${id}`)).body;
      assert.ok(k.tips.length>=12);assert.ok(k.topics.length>=16);
      const session=(await call('POST','/api/knowledge/attempts',{courseId:id,topicId:k.topics[0].id})).body;
      const saved=store.get('knowledge_attempts',session.id);
      assert.equal((await call('PATCH',`/api/knowledge/attempts/${session.id}/answers`,{answers:Object.fromEntries(saved.questions.map(q=>[q.id,q.expected]))})).status,200);
      const report=await call('POST',`/api/knowledge/attempts/${session.id}/submit`,{});
      assert.equal(report.status,200);assert.equal(report.body.report.passed,true);
      const gems=store.getState().gems;
      await call('POST',`/api/knowledge/attempts/${session.id}/submit`,{});assert.equal(store.getState().gems,gems);
    }
    assert.deepEqual(store.getState().courses.agent.started,[1]);assert.deepEqual(store.getState().courses.linear.started,[1]);
    for(const id of ['dsa','ml','da','git'])assert.deepEqual(store.getState().courses[id].started,[]);
    const backup=(await call('GET','/api/data/export')).body;
    const restore=await call('POST','/api/data/import',backup);assert.equal(restore.status,200,JSON.stringify(restore.body));
    const byId=rows=>[...rows].sort((a,b)=>a.id.localeCompare(b.id));
    assert.deepEqual(byId((await call('GET','/api/data/export')).body.attempts),byId(backup.attempts));
    assert.equal(store.getState().activeCourse,'linear');
  } finally {await app.close();}
});

for(const courseId of ['agent','linear'])test(`${courseId}: 80% requires code, infrastructure preserves attempt, no duplicate boost/reward`,async()=>{
  const {store,app,call,answer,code,setStatus}=await fixture();
  try {
    const def=getCourse(courseId);
    const s=store.getState();s.gems=100;store.putState(s);
    assert.equal((await call('POST','/api/shop/buy',{itemId:'boost-2',requestId:'buy'})).status,200);
    assert.equal((await call('POST','/api/inventory/activate',{itemId:'boost-2',requestId:'activate'})).status,200);
    let a=(await call('POST','/api/attempts',{courseId,lessonId:1,mode:'assessment'})).body;
    await answer(a,4);
    assert.equal((await call('GET',`/api/traces/${def.lessons[0].problemIds[0]}?lessonId=1`)).status,403);
    assert.equal((await call('POST','/api/tutor',{courseId,lessonId:1,question:'Gợi ý'})).status,403);
    const noCode=(await call('POST',`/api/attempts/${a.id}/submit`,{})).body;
    assert.equal(noCode.knowledge,80);assert.equal(noCode.passed,false);
    assert.equal(store.getState().xp,0);assert.equal(store.getState().activeBoost.charges,2);
    a=(await call('POST','/api/attempts',{courseId,lessonId:1,mode:'assessment',retake:true})).body;
    await answer(a,4);setStatus('infrastructure_error');await code(a);
    assert.equal((await call('POST',`/api/attempts/${a.id}/submit`,{})).status,409);
    assert.equal(store.get('attempts',a.id).status,'active');assert.equal(store.getState().activeBoost.charges,2);
    setStatus('accepted');await code(a);
    const pass=(await call('POST',`/api/attempts/${a.id}/submit`,{})).body;
    assert.equal(pass.passed,true);assert.equal(pass.knowledge,80);assert.equal(pass.reward.baseXp,50);assert.equal(pass.reward.bonusXp,50);
    const xp=store.getState().xp;
    await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(store.getState().xp,xp);assert.equal(store.getState().activeBoost.charges,1);
    assert.equal(store.getState().courses[courseId].progress[1].passed,true);
    assert.equal(store.getState().courses.dsa.progress[1],undefined);
    assert.equal((await call('GET',`/api/courses/${courseId}/lessons/2`)).status,200);
  } finally {await app.close();}
});

for(const courseId of ['agent','linear'])test(`${courseId}: full sequential path reaches its own capstone and unlocks advanced lessons`,async()=>{
  const {store,app,call,answer,code}=await fixture();
  try {
    const def=getCourse(courseId);
    assert.equal((await call('POST',`/api/courses/${courseId}/capstone`,{})).status,403);
    for(const lesson of def.lessons.filter(l=>l.kind!=='advanced')) {
      const start=await call('POST','/api/attempts',{courseId,lessonId:lesson.id,mode:'assessment'});
      assert.equal(start.status,200,JSON.stringify(start.body));const a=start.body;
      assert.equal(a.questions.length,lesson.kind==='exam'?10:5);
      assert.equal(a.requiredProblems.length,lesson.kind==='exam'?2:1);
      await answer(a);await code(a);
      const r=await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(r.status,200);assert.equal(r.body.passed,true);
      const xp=store.getState().xp;await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(store.getState().xp,xp);
    }
    const a=(await call('POST',`/api/courses/${courseId}/capstone`,{})).body;
    assert.equal(a.requiredProblems.length,3);
    const prefix=`/api/courses/${courseId}/capstone`;
    await answer(a,a.questions.length,prefix);await code(a,prefix);
    assert.equal((await call('POST',`${prefix}/${a.id}/submit`,{})).status,400,'Complete essay is also required');
    assert.equal(store.get('capstones',a.id).status,'active','Incomplete essay retains the draft');
    // Retake intentionally changes its seed; ordinary resume would preserve it.
    const retry=await call('POST',`${prefix}/retake`,{});
    assert.equal(retry.status,200,JSON.stringify(retry.body));const b=retry.body;
    await answer(b,b.questions.length,prefix);await code(b,prefix);
    assert.equal((await call('PATCH',`${prefix}/${b.id}`,{essay:Object.fromEntries(def.essayFields.map(f=>[f.id,'Giải thích đầu vào, lựa chọn, trường hợp biên, kết quả và giới hạn đã kiểm chứng.']))})).status,200);
    const result=await call('POST',`${prefix}/${b.id}/submit`,{});
    assert.equal(result.status,200);assert.equal(result.body.passed,true,JSON.stringify(result.body));
    assert.equal(store.getState().courses[courseId].capstonePassed,true);
    const xp=store.getState().xp;await call('POST',`${prefix}/${b.id}/submit`,{});assert.equal(store.getState().xp,xp);
    const view=(await call('GET',`/api/courses/${courseId}`)).body;
    assert.equal(view.completed,def.course.mandatoryLessons);assert.ok(view.lessons.filter(l=>l.kind==='advanced').every(l=>l.unlocked));
    assert.equal(store.getState().courses.dsa.capstonePassed,false);
    const backup=(await call('GET','/api/data/export')).body;
    const restore=await call('POST','/api/data/import',backup);assert.equal(restore.status,200,JSON.stringify(restore.body));
    assert.equal(store.getState().courses[courseId].capstonePassed,true);
  } finally {await app.close();}
});
