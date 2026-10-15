import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';
import {getCourse} from '../content/registry.mjs';
import {createLab as legacyLab} from '../content/labs.mjs';
import {newAttempt} from '../server/assessment.mjs';

const clock=Date.UTC(2026,9,15,7);
async function fixture(){
  const store=createStore(':memory:');
  const app=await createApp({store,now:()=>clock,config:{cloud:false,aiProvider:'off'},health:async()=>({available:false}),aiHealth:async()=>({available:false})});
  const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});return{status:r.statusCode,body:r.json()};};
  function legacy(courseId='dsa',lessonId=1,mode='practice'){
    const def=getCourse(courseId),lesson=def.lessons.find(l=>l.id===lessonId);
    const old=newAttempt(lesson,mode,'fixed-old-seed',randomUUID(),clock-10000,def);
    delete old.teachingVersion;delete old.assessmentVersion;delete old.learningProgress;
    if(courseId==='dsa'&&mode==='practice')old.lab=legacyLab(lesson,old.seed);
    store.put('attempts',old);return old;
  }
  return{store,app,call,legacy};
}

test('Opt-in guided upgrade preserves the frozen legacy attempt and latest code without inheriting academic passes',async()=>{
  const{app,store,call,legacy}=await fixture();
  try{
    const old=legacy();old.codeDrafts={add:{python:'old python',cpp:'old cpp'}};
    old.answers={[old.questions[0].id]:old.questions[0].options[0].id};
    old.codesPassed=['add'];old.learningCursor={phase:'code',block:2};store.put('attempts',old);
    const before=store.getState(),frozen=structuredClone(old);
    const response=await call('POST',`/api/attempts/${old.id}/guided`,{codeDrafts:{add:{python:'new python',cpp:'new cpp'}}});
    assert.equal(response.status,200,JSON.stringify(response.body));
    const next=response.body,raw=store.get('attempts',next.id),retired=store.get('attempts',old.id);
    assert.notEqual(next.id,old.id);assert.notEqual(next.seed,old.seed);
    assert.equal(next.teachingVersion,getCourse('dsa').teachingFlow(1).version);assert.equal(next.lab.version,2);
    assert.equal(next.learningProgress.stepId,'intro');assert.equal(next.status,'active');assert.equal(next.mode,'practice');
    assert.deepEqual(next.codeDrafts,{add:{python:'new python',cpp:'new cpp'}});
    assert.deepEqual(next.answers,{});assert.deepEqual(next.codesPassed,[]);assert.deepEqual(next.jobIds,[]);assert.equal(next.result,null);
    assert.equal(retired.status,'abandoned');assert.equal(retired.guidedSuccessorId,next.id);
    for(const key of ['seed','questions','answers','lab','codesPassed','jobIds','learningCursor','version'])assert.deepEqual(retired[key],frozen[key],key);
    assert.deepEqual(retired.codeDrafts,next.codeDrafts);
    assert.equal(raw.createdAt,clock);assert.equal(retired.updatedAt,clock);
    assert.deepEqual(store.getState(),before);assert.equal(store.db.prepare('SELECT count(*) n FROM ledger').get().n,0);
    const again=await call('POST',`/api/attempts/${old.id}/guided`,{codeDrafts:{add:{python:'new python',cpp:'new cpp'}}});
    assert.equal(again.status,200);assert.equal(again.body.id,next.id);assert.equal(store.list('attempts').length,2);
    assert.deepEqual(store.getState(),before);assert.deepEqual(store.get('attempts',next.id),raw);
    for(const q of again.body.questions){assert.equal(q.answerId,undefined);assert.equal(q.feedbackByOption,undefined);}
  }finally{await app.close();}
});

test('Upgrade merges a pending language draft and supports Git shell without changing inventory or energy',async()=>{
  const{app,store,call,legacy}=await fixture();
  try{
    const old=legacy();old.codeDrafts={add:{python:'saved python',cpp:'saved cpp'}};store.put('attempts',old);
    const before=store.getState();
    const python=(await call('POST',`/api/attempts/${old.id}/guided`,{codeDrafts:{add:{python:'just typed'}}})).body;
    assert.deepEqual(python.codeDrafts,{add:{python:'just typed',cpp:'saved cpp'}});
    const git=legacy('git'),pid=getCourse('git').lessons[0].problemIds[0];
    const shell=await call('POST',`/api/attempts/${git.id}/guided`,{codeDrafts:{[pid]:{shell:'git status'}}});
    assert.equal(shell.status,200,JSON.stringify(shell.body));assert.equal(shell.body.codeDrafts[pid].shell,'git status');
    assert.deepEqual(store.getState(),before);assert.equal(store.db.prepare('SELECT count(*) n FROM ledger').get().n,0);
  }finally{await app.close();}
});

test('Current guided practice is returned in place and a successor remains idempotent after backup import',async()=>{
  const{app,store,call,legacy}=await fixture();
  try{
    const old=legacy(),next=(await call('POST',`/api/attempts/${old.id}/guided`,{})).body;
    const stale=store.get('attempts',next.id);stale.codesPassed=['add'];store.put('attempts',stale);
    const current=await call('POST',`/api/attempts/${next.id}/guided`,{codeDrafts:{add:{python:'saved in new attempt'}}});
    assert.equal(current.status,200);assert.equal(current.body.id,next.id);assert.equal(store.list('attempts').length,2);
    assert.deepEqual(current.body.codesPassed,[],'A code edit cannot keep a stale code pass');
    const backup=await call('GET','/api/data/export');
    assert.equal((await call('POST','/api/data/import',backup.body)).status,200);
    const retry=await call('POST',`/api/attempts/${old.id}/guided`,{});
    assert.equal(retry.status,200);assert.equal(retry.body.id,next.id);assert.equal(retry.body.codeDrafts.add.python,'saved in new attempt');
    assert.equal(store.get('attempts',old.id).guidedSuccessorId,next.id);assert.equal(store.list('attempts').length,2);
  }finally{await app.close();}
});

test('Upgrade rejects unknown IDs, exams, review, assessment and completed attempts',async()=>{
  const{app,store,call,legacy}=await fixture();
  try{
    for(const id of ['not-a-uuid','constructor',randomUUID()])assert.equal((await call('POST',`/api/attempts/${id}/guided`,{})).status,404);
    for(const mode of ['review','assessment','capstone']){
      const a=legacy('dsa',1,mode);assert.equal((await call('POST',`/api/attempts/${a.id}/guided`,{})).status,403);assert.deepEqual(store.get('attempts',a.id),a);
    }
    const exam=legacy('dsa',13);assert.equal((await call('POST',`/api/attempts/${exam.id}/guided`,{})).status,403);
    const completed=legacy();completed.status='completed';store.put('attempts',completed);
    assert.equal((await call('POST',`/api/attempts/${completed.id}/guided`,{})).status,403);
    assert.deepEqual(store.get('attempts',completed.id),completed);
  }finally{await app.close();}
});

test('Upgrade validates code ownership, course language, code size and payload before mutating the original',async()=>{
  const{app,store,call,legacy}=await fixture();
  try{
    const old=legacy(),otherCourse=getCourse('ml').lessons[0].problemIds[0];
    const otherLesson=Object.keys(getCourse('dsa').problems).find(pid=>!getCourse('dsa').lessons[0].problemIds.includes(pid));
    for(const codeDrafts of [{[otherCourse]:{python:'x'}},{[otherLesson]:{python:'x'}},{add:{shell:'git status'}},{add:{javascript:'x'}},{add:{python:'x'.repeat(50001)}}]){
      assert.equal((await call('POST',`/api/attempts/${old.id}/guided`,{codeDrafts})).status,400);
      assert.deepEqual(store.get('attempts',old.id),old);assert.equal(store.list('attempts').length,1);
    }
    const ml=legacy('ml'),pid=getCourse('ml').lessons[0].problemIds[0];
    assert.equal((await call('POST',`/api/attempts/${ml.id}/guided`,{codeDrafts:{[pid]:{cpp:'x'}}})).status,400);
    assert.equal((await call('POST',`/api/attempts/${old.id}/guided`,{courseId:'ml'})).status,400);
    assert.deepEqual(store.get('attempts',old.id),old);
  }finally{await app.close();}
});

test('Conflicting active practice and a missing successor never create a duplicate or partially save a draft',async()=>{
  const{app,store,call,legacy}=await fixture();
  try{
    const old=legacy(),other=legacy();
    const conflict=await call('POST',`/api/attempts/${old.id}/guided`,{codeDrafts:{add:{python:'must roll back'}}});
    assert.equal(conflict.status,409);assert.equal(store.list('attempts').length,2);assert.deepEqual(store.get('attempts',old.id),old);
    other.status='abandoned';store.put('attempts',other);
    old.guidedSuccessorId=randomUUID();old.status='abandoned';store.put('attempts',old);
    assert.equal((await call('POST',`/api/attempts/${old.id}/guided`,{})).status,409);
    assert.equal(store.list('attempts').length,2);
  }finally{await app.close();}
});
