import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';
import {getCourse} from '../content/registry.mjs';
import {TEACHING_VERSION} from '../content/pedagogy/engine.mjs';

const ids=['docker','genai','rag'];
async function setup(){
  const store=createStore(':memory:');
  const app=await createApp({store,now:()=>Date.UTC(2026,9,15,5),config:{cloud:false,aiProvider:'off'},
    health:async()=>({available:false}),aiHealth:async()=>({available:false}),
    // This fixture tests persistence and gates. Course tests verify actual execution.
    execute:async({code})=>({status:code.includes('API_ACCEPT')?'accepted':'rejected',checks:[],message:'API gating fixture'})});
  const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});return{status:r.statusCode,body:r.json()};};
  const passCode=async(a,capstone=false)=>{
    for(const problemId of a.requiredProblems){
      const url=capstone?`/api/courses/${a.courseId}/capstone/${a.id}/code`:`/api/attempts/${a.id}/code`;
      const r=await call('POST',url,{problemId,language:getCourse(a.courseId).course.languages[0],code:'# API_ACCEPT'});
      assert.equal(r.status,200,JSON.stringify(r.body));
      for(let i=0;i<100&&store.get('jobs',r.body.jobId).status!=='completed';i++)await new Promise(resolve=>setTimeout(resolve,5));
      assert.equal(store.get('jobs',r.body.jobId).result.status,'accepted');
    }
  };
  return{store,app,call,passCode};
}

test('Three new courses start independently with guided activities, private answers and resumable backups',async()=>{
  const {app,store,call}=await setup();
  try{
    const saved=[];
    for(const courseId of ids){
      const material=(await call('GET',`/api/courses/${courseId}/lessons/1`)).body;
      assert.equal(material.teachingFlow.version,TEACHING_VERSION);
      assert.equal(material.teachingFlow.steps.filter(s=>s.activityId).length,8);
      assert.ok(material.sources.length);
      const image=await app.inject(material.sources[0].url);assert.equal(image.statusCode,200);assert.match(image.headers['content-type'],/image\//);
      const a=(await call('POST','/api/attempts',{courseId,lessonId:1,mode:'practice'})).body;
      assert.equal(a.courseId,courseId);assert.equal(a.lab.version,2);
      for(const q of a.lab.questions){assert.equal(q.answer,undefined);assert.equal(q.explanation,undefined);}
      const pid=material.problemIds[0],lang=getCourse(courseId).course.languages[0];
      const progress={version:TEACHING_VERSION,stepId:'code-model',seen:['intro','model','code-model'],tried:[]};
      assert.equal((await call('PATCH',`/api/attempts/${a.id}`,{learningProgress:progress,codeDrafts:{[pid]:{[lang]:'# saved '+courseId}}})).status,200);
      const resumed=(await call('POST','/api/attempts',{courseId,lessonId:1,mode:'practice'})).body;
      assert.equal(resumed.id,a.id);assert.equal(resumed.seed,a.seed);assert.deepEqual(resumed.learningProgress,progress);
      assert.equal(resumed.codeDrafts[pid][lang],'# saved '+courseId);
      assert.equal((await call('GET',`/api/courses/${courseId}/lessons/2`)).status,403);
      const foreignId=getCourse(courseId==='docker'?'genai':'docker').lessons[0].problemIds[0];
      assert.equal((await call('POST',`/api/attempts/${a.id}/code`,{problemId:foreignId,language:lang,code:'# API_ACCEPT'})).status,400);
      saved.push(store.get('attempts',a.id));
    }
    assert.equal(store.getState().energy,15);assert.equal(store.getState().xp,0);assert.equal(store.getState().gems,0);
    assert.deepEqual(store.getState().courses.dsa.progress,{});
    const backup=(await call('GET','/api/data/export')).body;
    assert.equal((await call('POST','/api/data/import',backup)).status,200);
    for(const a of saved)assert.deepEqual(store.get('attempts',a.id),a);
  }finally{await app.close();}
});

test('Docker workbench uses bounded virtual state, never rewards and is blocked in an active assessment',async()=>{
 const {app,store,call}=await setup();
 try{
  const before=store.getState();
  const r=await call('POST','/api/courses/docker/workbench',{lessonId:1,script:'docker run -d --name web byte-web:1'});
  assert.equal(r.status,200);assert.equal(r.body.ok,true);assert.equal(r.body.state.containers.web.status,'running');
  for(const key of ['courses','xp','gems','energy','inventory'])assert.deepEqual(store.getState()[key],before[key]);
  const blocked=await call('POST','/api/courses/docker/workbench',{lessonId:1,script:'docker ps; echo unsupported'});
  assert.equal(blocked.status,200);assert.equal(blocked.body.ok,false);assert.equal(Object.keys(blocked.body.state.containers).length,0);
  assert.equal((await call('POST','/api/courses/docker/workbench',{lessonId:2,script:'docker ps'})).status,403);
  assert.equal((await call('POST','/api/courses/docker/workbench',{lessonId:1,script:'x'.repeat(50001)})).status,400);
  await call('POST','/api/attempts',{courseId:'docker',lessonId:1,mode:'assessment'});
  assert.equal((await call('POST','/api/courses/docker/workbench',{lessonId:1,script:'docker ps'})).status,403);
 }finally{await app.close();}
});

for(const courseId of ids)test(`${courseId}: mandatory path, 80% gate, capstone and rewards remain isolated and idempotent`,async()=>{
  const {app,store,call,passCode}=await setup(),def=getCourse(courseId);
  try{
    assert.equal((await call('POST',`/api/courses/${courseId}/capstone`,{})).status,403);
    const first=(await call('POST','/api/attempts',{courseId,lessonId:1,mode:'assessment'})).body;
    const raw=store.get('attempts',first.id);
    await call('PATCH',`/api/attempts/${first.id}`,{answers:Object.fromEntries(raw.questions.map(q=>[q.id,q.answerId]))});
    const blocked=(await call('POST',`/api/attempts/${first.id}/submit`,{})).body;
    assert.equal(blocked.knowledge,100);assert.equal(blocked.passed,false);assert.equal(store.getState().xp,0);
    for(const lesson of def.lessons.filter(l=>l.kind!=='advanced')){
      const opened=await call('POST','/api/attempts',{courseId,lessonId:lesson.id,mode:'assessment',retake:true});
      assert.equal(opened.status,200,`${courseId}/${lesson.id} ${JSON.stringify(opened.body)}`);
      const a=opened.body,privateA=store.get('attempts',a.id);
      assert.equal(privateA.questions.length,lesson.kind==='exam'?10:5);
      assert.equal(privateA.requiredProblems.length,lesson.kind==='exam'?2:1);
      // Exact boundary: 4/5 and 8/10 must pass once all mandatory code is accepted.
      const correctCount=lesson.kind==='exam'?8:4;
      const answers=Object.fromEntries(privateA.questions.map((q,i)=>[q.id,i<correctCount?q.answerId:q.options.find(o=>o.id!==q.answerId).id]));
      await call('PATCH',`/api/attempts/${a.id}`,{answers});await passCode(privateA);
      const result=(await call('POST',`/api/attempts/${a.id}/submit`,{})).body;
      assert.equal(result.knowledge,80);assert.equal(result.passed,true,`${courseId}/${lesson.id}`);
      const xp=store.getState().xp,gems=store.getState().gems;
      await call('POST',`/api/attempts/${a.id}/submit`,{});
      assert.equal(store.getState().xp,xp);assert.equal(store.getState().gems,gems);
    }
    assert.equal((await call('GET',`/api/courses/${courseId}`)).body.capstoneUnlocked,true);
    const cap=(await call('POST',`/api/courses/${courseId}/capstone`,{})).body;
    const privateCap=store.get('capstones',cap.id);assert.equal(privateCap.requiredProblems.length,3);
    await call('PATCH',`/api/courses/${courseId}/capstone/${cap.id}`,{essay:Object.fromEntries(Object.keys(privateCap.essay).map(k=>[k,'Phân tích dữ liệu, điều kiện và giới hạn; kiểm chứng từng chức năng theo đặc tả.'])),answers:Object.fromEntries(privateCap.questions.map(q=>[q.id,q.answerId]))});
    await passCode(privateCap,true);
    const report=await call('POST',`/api/courses/${courseId}/capstone/${cap.id}/submit`,{});
    assert.equal(report.status,200);assert.equal(report.body.passed,true,JSON.stringify(report.body));
    assert.equal(store.getState().courses[courseId].capstonePassed,true);
    assert.deepEqual(store.getState().courses.dsa.progress,{});assert.equal(store.getState().courses.dsa.capstonePassed,false);
    for(const other of ids.filter(id=>id!==courseId))assert.deepEqual(store.getState().courses[other].progress,{});
    const before=store.getState();await call('POST',`/api/courses/${courseId}/capstone/${cap.id}/submit`,{});
    assert.equal(store.getState().xp,before.xp);assert.equal(store.getState().gems,before.gems);
  }finally{await app.close();}
});
