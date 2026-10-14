import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';
import {getCourse} from '../content/registry.mjs';
import {runGit} from '../server/git-runner.mjs';
import {dayTime} from '../server/game.mjs';
import {randomUUID} from 'node:crypto';

async function fixture() {
  const store=createStore(':memory:');
  // DA reference programs run in the real isolated runtime in verify-da-git-runtime.
  // These API tests use a fixture executor to check persistence and academic gates.
  const execute=async options=>options.language==='shell'?runGit(options):({status:'accepted',checks:[],message:'DA runtime verified separately'});
  const app=await createApp({store,execute,now:()=>dayTime('2026-10-14')+3600000,health:async()=>({available:false}),aiHealth:async()=>({available:false})});
  const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});return{status:r.statusCode,body:r.json()};};
  const submitCode=async(a,prefix='/api/attempts')=>{
    const def=getCourse(a.courseId),language=def.course.languages[0];
    for(const problemId of a.requiredProblems) {
      const result=await call('POST',`${prefix}/${a.id}/code`,{problemId,language,code:language==='shell'?def.solution(problemId,'shell'):'def solve(data): return data'});
      assert.equal(result.status,200,JSON.stringify(result.body));
      for(let i=0;i<200;i++){if(['completed','error'].includes(store.get('jobs',result.body.jobId).status))break;await new Promise(r=>setTimeout(r,5));}
      const job=store.get('jobs',result.body.jobId);assert.equal(job.result?.status,'accepted',JSON.stringify(job.result));
      assert.equal(job.courseId,a.courseId);
    }
  };
  return{store,app,call,submitCode};
}

test('DA and Git sources, preferences, draft languages and backup stay separate',async()=>{
  const{app,store,call}=await fixture();
  try{
    for(const id of ['da','git']) {
      const sources=(await call('GET',`/api/sources?courseId=${id}`)).body.sources;
      assert.equal(sources.length,10);
      for(const source of sources){const r=await app.inject(source.url);assert.equal(r.statusCode,200);assert.match(r.headers['content-type'],/image\/jpeg/);}
      const def=getCourse(id),lang=def.course.languages[0];
      assert.equal((await call('PUT','/api/profile',{name:'QA',language:lang,dailyGoal:50,activeCourse:id})).status,200);
      const a=(await call('POST','/api/attempts',{courseId:id,lessonId:1,mode:'practice'})).body;
      const pid=def.lessons[0].problemIds[0];
      const save=await call('PATCH',`/api/attempts/${a.id}`,{codeDrafts:{[pid]:{[lang]:'saved draft'}}});assert.equal(save.status,200,JSON.stringify(save.body));
      assert.equal((await call('GET',`/api/attempts/${a.id}`)).body.codeDrafts[pid][lang],'saved draft');
      const k=(await call('GET',`/api/knowledge?courseId=${id}`)).body;
      assert.equal(k.topics.length,20);assert.equal(k.tips.length,id==='da'?16:12);
    }
    assert.equal(store.getState().courses.git.language,'shell');
    const backup=(await call('GET','/api/data/export')).body;
    assert.equal((await call('POST','/api/data/import',backup)).status,200);
    assert.equal(store.getState().courses.git.language,'shell');
    assert.deepEqual(store.getState().courses.dsa.started,[]);
    assert.deepEqual(store.getState().courses.da.started,[1]);assert.deepEqual(store.getState().courses.git.started,[1]);
  }finally{await app.close();}
});

for(const courseId of ['da','git'])test(`${courseId} sequential gates reach capstone, with independent best results and rewards`,async()=>{
  const{store,app,call,submitCode}=await fixture(),def=getCourse(courseId);
  try{
    assert.equal((await call('POST',`/api/courses/${courseId}/capstone`,{})).status,403);
    for(let lessonId=1;lessonId<=def.course.mandatoryLessons;lessonId++) {
      const result=await call('POST','/api/attempts',{courseId,lessonId,mode:'assessment'});
      assert.equal(result.status,200,JSON.stringify(result.body));const a=store.get('attempts',result.body.id);
      const exam=def.lessons[lessonId-1].kind==='exam';assert.equal(a.questions.length,exam?10:5);assert.equal(a.requiredProblems.length,exam?2:1);
      assert.equal((await call('PATCH',`/api/attempts/${a.id}`,{answers:Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]))})).status,200);
      if(lessonId===1){const noCode=await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(noCode.body.passed,false,JSON.stringify(noCode.body));assert.equal(store.getState().xp,0);const saved=store.get('attempts',a.id);saved.status='active';saved.result=null;store.put('attempts',saved);}
      await submitCode(a);
      const report=await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(report.status,200);assert.equal(report.body.passed,true,JSON.stringify(report.body));
      const xp=store.getState().xp;await call('POST',`/api/attempts/${a.id}/submit`,{});assert.equal(store.getState().xp,xp,'No duplicate completion reward');
    }
    const cap=(await call('POST',`/api/courses/${courseId}/capstone`,{})).body,a=store.get('capstones',cap.id);
    assert.equal(a.requiredProblems.length,3);
    assert.equal((await call('PATCH',`/api/courses/${courseId}/capstone/${a.id}`,{essay:Object.fromEntries(def.essayFields.map(f=>[f.id,'Explained input, assumptions, evidence and limits.'])),answers:Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]))})).status,200);
    await submitCode(a,`/api/courses/${courseId}/capstone`);
    const report=await call('POST',`/api/courses/${courseId}/capstone/${a.id}/submit`,{});assert.equal(report.status,200,JSON.stringify(report.body));assert.equal(report.body.passed,true);
    assert.equal(store.getState().courses[courseId].capstonePassed,true);assert.equal(store.getState().courses.dsa.capstonePassed,false);assert.equal(store.getState().courses.ml.capstonePassed,false);
    assert.equal((await call('GET',`/api/courses/${courseId}/lessons/${def.course.mandatoryLessons+1}`)).status,200);
    const backup=(await call('GET','/api/data/export')).body;assert.equal((await call('POST','/api/data/import',backup)).status,200);
    assert.equal(store.get('capstones',a.id).result.passed,true);assert.equal(store.getState().courses[courseId].capstonePassed,true);
  }finally{await app.close();}
});

test('Git workbench is a bounded non-rewarding simulation and is hidden during assessment',async()=>{
  const{app,store,call}=await fixture();
  try{
    const before=store.getState();
    const good=await call('POST','/api/courses/git/workbench',{lessonId:1,script:'git init\ngit status'});assert.equal(good.status,200);assert.equal(good.body.ok,true,JSON.stringify(good.body));assert.ok(good.body.frames.length);
    const bad=await call('POST','/api/courses/git/workbench',{lessonId:1,script:'node -e "process.exit()"'});assert.equal(bad.body.ok,false);
    assert.equal(store.getState().xp,before.xp);assert.equal(store.getState().gems,before.gems);
    assert.equal((await call('POST','/api/courses/git/workbench',{lessonId:2,script:'git status'})).status,403);
    const a=(await call('POST','/api/attempts',{courseId:'git',lessonId:1,mode:'assessment'})).body;
    assert.ok(a.questions.every(q=>!q.input?.goal && !q.input?.answer));
    assert.equal((await call('POST','/api/courses/git/workbench',{lessonId:1,script:'git status'})).status,403);
  }finally{await app.close();}
});

test('Backups preserve valid dictionary labels without creating object prototypes',async()=>{
  const{app,store,call}=await fixture();
  try{
    const a=(await call('POST','/api/attempts',{courseId:'da',lessonId:1,mode:'practice'})).body;
    const expected=JSON.parse('{"byRegion":{"__proto__":{"revenue":4},"constructor":{"revenue":3}}}');
    store.put('jobs',{id:randomUUID(),courseId:'da',attemptId:a.id,problemId:'da-kpi',language:'python',publicOnly:false,createdAt:0,version:getCourse('da').VERSION,code:'def solve(data): return data',status:'completed',result:{status:'accepted',checks:[{expected,actual:expected}]},fixtures:[{input:{},expected}]});
    const backup=(await call('GET','/api/data/export')).body;
    const imported=await call('POST','/api/data/import',backup);assert.equal(imported.status,200,JSON.stringify(imported.body));
    const saved=store.list('jobs')[0].result.checks[0].actual.byRegion;
    assert.equal(Object.hasOwn(saved,'__proto__'),true);assert.equal(saved.__proto__.revenue,4);assert.equal(saved.constructor.revenue,3);
    assert.equal(Object.prototype.revenue,undefined);
    const malformed=await app.inject({method:'POST',url:'/api/data/import',headers:{'content-type':'application/json'},payload:'{"broken"'});assert.equal(malformed.statusCode,400);
  }finally{await app.close();}
});

test('Git runner grades final semantics and treats missing fixtures/version as infrastructure issues',async()=>{
  const def=getCourse('git'),pid='git-stage',options={problemId:pid,language:'shell',seed:'api-real-sim',version:def.VERSION};
  const correct=await runGit({...options,code:def.solution(pid,'shell')});assert.equal(correct.status,'accepted');assert.ok(correct.frames.length);
  const wrong=await runGit({...options,code:'git status'});assert.equal(wrong.status,'rejected');
  const spoof=await runGit({...options,code:'{"passed":true}'});assert.equal(spoof.status,'rejected');
  assert.equal((await runGit({...options,version:'missing',code:'git status'})).status,'infrastructure_error');
  assert.equal((await runGit({...options,fixtures:[],code:'git status'})).status,'infrastructure_error');
});
