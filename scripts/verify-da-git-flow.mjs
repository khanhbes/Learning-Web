import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';
import {getCourse} from '../content/registry.mjs';
const store=createStore(':memory:');
const app=await createApp({store,health:async()=>({available:false}),aiHealth:async()=>({available:false}),config:{cloud:false,aiProvider:'off'}});
const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});assert.equal(r.statusCode,200,url+': '+r.body);return r.json();};
const reports=[];
async function code(a,def,prefix='/api/attempts'){
 for(const pid of a.requiredProblems){
  const language=def.course.languages[0],job=await call('POST',`${prefix}/${a.id}/code`,{problemId:pid,language,code:def.solution(pid,language)});
  const start=Date.now();let j;
  do{await new Promise(r=>setTimeout(r,250));j=store.get('jobs',job.jobId);assert.ok(Date.now()-start<180000,'Grading job deadline');}while(['queued','running'].includes(j.status));
  assert.equal(j.result.status,'accepted',JSON.stringify(j.result));reports.push({courseId:def.course.id,mode:a.mode,problemId:pid,status:j.result.status,tests:j.result.total});
 }
}
try{
 for(const id of ['da','git']){
  const def=getCourse(id),a=await call('POST','/api/attempts',{courseId:id,lessonId:1,mode:'assessment'}),privateA=store.get('attempts',a.id);
  await call('PATCH',`/api/attempts/${a.id}`,{answers:Object.fromEntries(privateA.questions.map(q=>[q.id,q.answerId]))});await code(privateA,def);
  const result=await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(result.passed,true);
  const xp=store.getState().xp;await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(store.getState().xp,xp);
  // Fixture unlocks middle lessons only for this separate in-memory runtime test.
  // The complete sequential path is verified without fixture unlocks in API tests.
  const s=store.getState();for(let l=2;l<=def.course.mandatoryLessons;l++)s.courses[id].progress[l]={passed:true,bestKnowledge:100,nextReview:0};store.putState(s);
  if(id==='da'){
   const sql=await call('POST','/api/attempts',{courseId:id,lessonId:8,mode:'assessment'}),saved=store.get('attempts',sql.id);
   await call('PATCH',`/api/attempts/${sql.id}`,{answers:Object.fromEntries(saved.questions.map(q=>[q.id,q.answerId]))});await code(saved,def);assert.equal((await call('POST',`/api/attempts/${sql.id}/submit`,{})).passed,true);
  }
  const cap=await call('POST',`/api/courses/${id}/capstone`,{}),saved=store.get('capstones',cap.id);
  await call('PATCH',`/api/courses/${id}/capstone/${cap.id}`,{essay:Object.fromEntries(def.essayFields.map(f=>[f.id,'Input, assumptions, reproducible evidence and limits are explained.'])),answers:Object.fromEntries(saved.questions.map(q=>[q.id,q.answerId]))});
  await code(saved,def,`/api/courses/${id}/capstone`);
  assert.equal((await call('POST',`/api/courses/${id}/capstone/${cap.id}/submit`,{})).passed,true);
 }
 const backup=await call('GET','/api/data/export');writeFileSync('.data/da-git-runtime-backup.json',JSON.stringify(backup));await call('POST','/api/data/import',backup);
 assert.equal(store.getState().courses.da.capstonePassed,true);assert.equal(store.getState().courses.git.capstonePassed,true);
 mkdirSync('output',{recursive:true});writeFileSync('output/da-git-real-api-report.json',JSON.stringify({date:'2026-10-14',note:'First lesson, DA SQL and three capstone tasks in both courses use actual runners; middle lesson gates are fixture-unlocked only in this script.',checks:reports,duplicateRewards:false,backupRestored:true},null,2));
 console.log(JSON.stringify({checks:reports.length,actualRunners:true,capstonesPassed:['da','git'],backupRestored:true}));
}finally{await app.close();}
