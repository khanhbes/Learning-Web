import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';
import {getCourse} from '../content/registry.mjs';
import {createLab as legacyLab} from '../content/labs.mjs';
import {newAttempt} from '../server/assessment.mjs';
const clock=Date.UTC(2026,9,15,5);
async function fixture(){
  const store=createStore(':memory:');
  const app=await createApp({store,now:()=>clock,config:{cloud:false,aiProvider:'off'},health:async()=>({available:false}),aiHealth:async()=>({available:false})});
  const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});return{status:r.statusCode,body:r.json()};};
  return{store,app,call};
}

test('Guided learning validates progress per lesson, resumes drafts and never unlocks or grants XP',async()=>{
  const {app,store,call}=await fixture();
  try{
    for(const courseId of ['dsa','ml','da','git','agent','linear']){
      const material=(await call('GET',`/api/courses/${courseId}/lessons/1`)).body;
      assert.equal(material.teachingFlow.steps.filter(s=>s.activityId).length,8);
      const opened=await call('POST','/api/attempts',{courseId,lessonId:1,mode:'practice'});assert.equal(opened.status,200,JSON.stringify(opened.body));const a=opened.body;
      assert.equal(a.lab.version,2);assert.equal(a.learningProgress.stepId,'intro');
      for(const q of a.lab.questions){assert.equal(q.answer,undefined);assert.equal(q.explanation,undefined);}
      const version=material.teachingFlow.version,progress={version,stepId:'activity-predict',seen:['intro','model','activity-predict'],tried:['activity-predict']};
      assert.equal((await call('PATCH',`/api/attempts/${a.id}`,{learningProgress:progress,codeDrafts:{}})).status,200);
      assert.equal((await call('PATCH',`/api/attempts/${a.id}`,{learningProgress:{...progress,stepId:'another-course'}})).status,400);
      assert.equal((await call('PATCH',`/api/attempts/${a.id}`,{learningProgress:{...progress,version:'unknown'}})).status,400);
      const resumed=(await call('POST','/api/attempts',{courseId,lessonId:1,mode:'practice'})).body;
      assert.equal(resumed.id,a.id);assert.equal(resumed.seed,a.seed);assert.deepEqual(resumed.learningProgress,progress);
      assert.deepEqual(resumed.questions,a.questions);assert.equal((await call('GET',`/api/courses/${courseId}/lessons/2`)).status,403);
    }
    const state=store.getState();assert.equal(state.xp,0);assert.equal(state.gems,0);assert.equal(store.db.prepare('SELECT count(*) n FROM ledger').get().n,0);
  }finally{await app.close();}
});

test('Bridge support is shared, language-specific, saved in backup and blocked in assessments with no reward',async()=>{
  const {app,store,call}=await fixture();
  try{
    const b=(await call('GET','/api/learning/bridges/functions?language=cpp')).body;
    assert.equal(b.tasks.length,2);assert.match(b.example.code,/int add/);assert.equal(b.diagnostic.answer,undefined);
    const before=store.getState();
    assert.equal((await call('PUT','/api/learning/bridges/functions',{language:'cpp',status:'seen'})).status,200);
    for(const question of b.tasks){const r=await call('POST','/api/learning/bridges/functions/check',{language:'cpp',questionId:question.id,value:'o0'});assert.equal(r.status,200);assert.equal(r.body.correct,true);}
    assert.equal((await call('POST','/api/learning/bridges/functions/check',{language:'cpp',questionId:'fake',value:'o0'})).status,400);
    const s=store.getState();assert.deepEqual(s.learningSupport['functions:cpp'].correct,['check-1','check-2']);assert.equal(s.learningSupport['functions:python'],undefined);
    for(const key of ['xp','gems','energy'])assert.equal(s[key],before[key]);
    const backup=(await call('GET','/api/data/export')).body;
    assert.equal((await call('POST','/api/data/import',backup)).status,200);
    assert.deepEqual(store.getState().learningSupport,s.learningSupport);
    const exam=(await call('POST','/api/attempts',{courseId:'dsa',lessonId:1,mode:'assessment'})).body;
    assert.equal((await call('GET','/api/learning/bridges/functions')).status,403);
    assert.equal((await call('PUT','/api/learning/bridges/functions',{status:'seen',language:'python'})).status,403);
    assert.equal((await call('POST','/api/learning/bridges/functions/check',{questionId:'diagnostic',value:'o0'})).status,403);
    assert.equal((await call('PATCH',`/api/attempts/${exam.id}`,{learningProgress:{version:'teaching-2026.10.15-v1',stepId:'intro',seen:[],tried:[]}})).status,403);
  }finally{await app.close();}
});

test('Frozen legacy labs and questions survive resume and import; new retakes use v2 without changing old attempts',async()=>{
  const {app,store,call}=await fixture();
  try{
    const def=getCourse('dsa'),old=newAttempt(def.lessons[0],'practice','legacy-fixed-seed',randomUUID(),clock,def);
    delete old.assessmentVersion;delete old.teachingVersion;delete old.learningProgress;
    old.lab=legacyLab(def.lessons[0],old.seed);old.learningCursor={phase:'practice',block:2};
    old.questions=[{id:'old-question',prompt:'Câu hỏi của bản nháp cũ',options:[{id:'old-a',text:'Đáp án cũ'},{id:'old-b',text:'Phương án cũ khác'}],answerId:'old-a',explanation:'Giải thích đã lưu'}];
    old.answers={'old-question':'old-b'};old.codeDrafts={add:{python:'def solve(data):\n    return data["a"]+data["b"]'}};
    store.put('attempts',old);
    const resume=(await call('POST','/api/attempts',{courseId:'dsa',lessonId:1,mode:'practice'})).body;
    assert.equal(resume.teachingVersion,undefined);assert.equal(resume.lab.version,1);assert.equal(resume.learningProgress.stepId,'activity-concept');assert.equal(resume.seed,old.seed);
    assert.deepEqual(store.get('attempts',old.id),old);
    const order=old.lab.questions.find(q=>q.kind==='order');
    assert.equal((await call('POST',`/api/attempts/${old.id}/lab`,{questionId:order.id,value:order.answer})).body.correct,true);
    const backup=(await call('GET','/api/data/export')).body;
    assert.equal((await call('POST','/api/data/import',backup)).status,200);
    assert.deepEqual(store.get('attempts',old.id).questions,old.questions);assert.deepEqual(store.get('attempts',old.id).codeDrafts,old.codeDrafts);
    const next=(await call('POST','/api/attempts',{courseId:'dsa',lessonId:1,mode:'practice',retake:true})).body;
    assert.equal(next.lab.version,2);assert.notEqual(next.id,old.id);assert.equal(store.get('attempts',old.id).status,'abandoned');
  }finally{await app.close();}
});

test('Practice feedback explains the current error, persists repeat-help and grants daily task credit once',async()=>{
  const {app,store,call}=await fixture();
  try{
    const a=(await call('POST','/api/attempts',{courseId:'linear',lessonId:1,mode:'practice'})).body;
    const raw=store.get('attempts',a.id),q=raw.lab.questions.find(q=>q.id==='concept'),wrong=q.options.find(o=>o.id!==q.answer).id;
    for(let i=0;i<2;i++)assert.equal((await call('POST',`/api/attempts/${a.id}/lab`,{questionId:q.id,value:wrong})).body.correct,false);
    const r=(await call('GET',`/api/attempts/${a.id}`)).body.lab.responses.concept;
    assert.equal(r.reviewSuggested,true);assert.ok(r.explanation);assert.match(r.misconception,/Bạn chọn/);
    for(let i=0;i<2;i++)assert.equal((await call('POST',`/api/attempts/${a.id}/lab`,{questionId:q.id,value:q.answer})).body.correct,true);
    assert.equal(Object.values(store.getState().daily)[0].labCompletions,1);assert.equal(store.getState().xp,0);
    assert.ok(store.get('attempts',a.id).learningProgress.tried.includes('activity-concept'));
    const backup=(await call('GET','/api/data/export')).body;
    assert.equal((await call('POST','/api/data/import',backup)).status,200);assert.ok(store.get('attempts',a.id).learningProgress.tried.includes('activity-concept'));
  }finally{await app.close();}
});
