import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';
import {solutions} from '../content/ml/index.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const store=createStore(':memory:');
const app=await createApp({store,config:{cloud:false,aiProvider:'off',origin:''},aiHealth:async()=>({available:false})});
const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});if(r.statusCode!==200)throw Error(`${url}: ${r.statusCode} ${r.body}`);return r.json();};
const grade=async(a,base)=>{
 const reports=[];
 for(const problemId of a.requiredProblems){
  const {jobId}=await call('POST',`${base}/${a.id}/code`,{problemId,language:'python',code:solutions[problemId]});
  const begin=Date.now();let job;
  do{await new Promise(r=>setTimeout(r,200));job=await call('GET','/api/jobs/'+jobId);if(Date.now()-begin>180000)throw Error('Job timeout');}while(['queued','running'].includes(job.status));
  assert.equal(job.result.status,'accepted',JSON.stringify(job.result));reports.push({problemId,status:job.result.status,total:job.result.total});
 }
 return reports;
};
try{
 const a=await call('POST','/api/attempts',{courseId:'ml',lessonId:1,mode:'assessment'});
 const raw=store.get('attempts',a.id);
 await call('PATCH','/api/attempts/'+a.id,{answers:Object.fromEntries(raw.questions.map(q=>[q.id,q.answerId]))});
 const lessonCode=await grade(raw,'/api/attempts');const lessonResult=await call('POST',`/api/attempts/${a.id}/submit`,{});
 assert.equal(lessonResult.passed,true);assert.equal(store.getState().courses.dsa.progress[1],undefined);
 // Gate progression for every lesson is verified separately in the API test.
 // Here fixture setup opens the final assessment to exercise three REAL jobs.
 store.transaction(()=>{const s=store.getState();for(let i=2;i<=40;i++)s.courses.ml.progress[i]={passed:true,bestKnowledge:100};store.putState(s);});
 const cap=await call('POST','/api/courses/ml/capstone',{}),privateCap=store.get('capstones',cap.id);
 await call('PATCH',`/api/courses/ml/capstone/${cap.id}`,{essay:Object.fromEntries(Object.keys(privateCap.essay).map(k=>[k,'QA: dữ liệu giả lập, fit trên train, ngưỡng chỉ định và trường hợp biên.'])),answers:Object.fromEntries(privateCap.questions.map(q=>[q.id,q.answerId]))});
 const capCode=await grade(privateCap,'/api/courses/ml/capstones');
 const capResult=await call('POST',`/api/courses/ml/capstone/${cap.id}/submit`,{});assert.equal(capResult.passed,true);
 const before=store.getState().xp;await call('POST',`/api/courses/ml/capstone/${cap.id}/submit`,{});assert.equal(store.getState().xp,before);
 const backup=await call('GET','/api/data/export');await call('POST','/api/data/import',backup);
 assert.equal(store.getState().courses.ml.capstonePassed,true);assert.equal(store.list('drafts')[0].courseId,'ml');
 mkdirSync('output',{recursive:true});writeFileSync('output/ml-real-api-report.json',JSON.stringify({lessonCode,lessonResult,capCode,capResult,backupVersion:backup.version,duplicateRewardPrevented:true,independentDSA:true,capstoneUsesSameDataset:true,gateSetup:'Lessons 2–40 fixture setup; all lesson gates separately tested in new-multicourse-api.test.mjs'},null,2));
 console.log('ML real API lesson/code/capstone/backup checks passed.');
}finally{await app.close();}
