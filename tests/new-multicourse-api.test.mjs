import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.mjs";
import { createStore } from "../server/store.mjs";
import { dayTime } from "../server/game.mjs";

async function setup() {
  const store=createStore(":memory:");
  const app=await createApp({store,execute:async()=>({status:"accepted",checks:[],message:"API gate fixture; runtime checked separately"}),now:()=>dayTime("2026-10-13")+3600000,health:async()=>({available:false}),aiHealth:async()=>({available:false}),tutor:async()=>({available:false,text:"fixture"})});
  const call=async(method,url,payload)=>{const r=await app.inject({method,url,payload});return{status:r.statusCode,body:r.json()};};
  const passCode=async(attempt,table="attempts",prefix="/api")=>{
    const saved=store.get(table,attempt.id);
    for(const problemId of saved.requiredProblems) {
      const r=await call("POST",`${prefix}/${table==="capstones"?"capstone":"attempts"}/${attempt.id}/code`,{problemId,language:"python",code:"# verified separately\ndef solve(data): return data"});
      assert.equal(r.status,200,JSON.stringify(r.body));
      for(let i=0;i<100;i++){const job=store.get("jobs",r.body.jobId);if(job.status==="completed")break;await new Promise(resolve=>setTimeout(resolve,5));}
      assert.equal(store.get("jobs",r.body.jobId).status,"completed");
    }
  };
  return {store,app,call,passCode};
}
test("Course manifests, source paths, same numeric lesson IDs and language preferences stay independent", async()=>{
  const {store,app,call}=await setup();
  try {
    const courses=(await call("GET","/api/courses")).body.courses;
    assert.deepEqual(courses.map(c=>[c.id,c.mandatoryLessons,c.advancedLessons]),[["dsa",48,12],["ml",40,12],["da",28,8],["git",24,6],["agent",24,8],["linear",28,8]]);
    for(const c of courses)for(const lesson of c.lessons){assert.equal(lesson.blocks,undefined,"Catalog must not leak lesson solutions");assert.equal(lesson.questions,undefined,"Catalog must not leak assessment answers");}
    assert.equal((await call("GET","/api/courses/ml/lessons/1")).status,200);
    assert.equal((await call("GET","/api/courses/ml/lessons/2")).status,403);
    const dsa=(await call("POST","/api/attempts",{lessonId:1,courseId:"dsa",mode:"practice"})).body;
    const ml=(await call("POST","/api/attempts",{lessonId:1,courseId:"ml",mode:"practice"})).body;
    assert.notEqual(dsa.id,ml.id);assert.equal(store.getState().energy,20);
    assert.equal((await call("POST","/api/attempts",{lessonId:1,courseId:"ml",mode:"practice"})).body.id,ml.id);assert.equal(store.getState().energy,20);
    assert.deepEqual(store.getState().courses.dsa.started,[1]);assert.deepEqual(store.getState().courses.ml.started,[1]);
    assert.equal((await call("PUT","/api/profile",{name:"QA",language:"cpp",dailyGoal:50,activeCourse:"dsa"})).status,200);
    assert.equal((await call("PUT","/api/profile",{name:"QA",language:"python",dailyGoal:50,activeCourse:"ml",settings:{sound:false,reducedMotion:true}})).status,200);
    assert.equal(store.getState().courses.dsa.language,"cpp");assert.equal(store.getState().courses.ml.language,"python");
    assert.equal((await call("GET","/api/state")).body.activeCourse,"ml");
    assert.equal((await call("PUT","/api/profile",{name:"QA",language:"cpp",dailyGoal:50,activeCourse:"ml"})).status,400);
    const dsalesson=(await call("GET","/api/lessons/1")).body;
    assert.ok(dsalesson.sources.length);
    const image=await app.inject(`/sources/${dsalesson.sources[0].file}`);assert.equal(image.statusCode,200);assert.match(image.headers["content-type"],/image\/jpeg/);
  } finally {await app.close();}
});
test("ML 80% gate, code gate, boosted completion rewards and selected-course projections preserve DSA", async()=>{
  const {store,app,call,passCode}=await setup();
  try {
    store.transaction(()=>{const s=store.getState();s.gems=100;store.putState(s);});
    assert.equal((await call("POST","/api/shop/buy",{itemId:"boost-2",requestId:"buy"})).status,200);
    assert.equal((await call("POST","/api/shop/buy",{itemId:"boost-2",requestId:"buy"})).status,200);
    assert.equal(store.getState().consumables["boost-2"],1);
    assert.equal((await call("POST","/api/inventory/activate",{itemId:"boost-2",requestId:"activate"})).status,200);
    const a=(await call("POST","/api/attempts",{lessonId:1,courseId:"ml",mode:"assessment"})).body;
    const p=store.get("attempts",a.id);assert.equal(p.questions.length,5);
    const answers=Object.fromEntries(p.questions.slice(0,4).map(q=>[q.id,q.answerId]));
    const wrong=p.questions[4].options.find(o=>o.id!==p.questions[4].answerId);answers[p.questions[4].id]=wrong.id;
    await call("PATCH",`/api/attempts/${a.id}`,{answers});
    const noCode=(await call("POST",`/api/attempts/${a.id}/submit`,{})).body;
    assert.equal(noCode.knowledge,80);assert.equal(noCode.passed,false);assert.equal(store.getState().activeBoost.charges,2);assert.equal(store.getState().xp,0);
    const retry=(await call("POST","/api/attempts",{lessonId:1,courseId:"ml",mode:"assessment",retake:true})).body;
    const p2=store.get("attempts",retry.id),answers2=Object.fromEntries(p2.questions.map(q=>[q.id,q.answerId]));
    await call("PATCH",`/api/attempts/${retry.id}`,{answers:answers2});await passCode(retry);
    const report=(await call("POST",`/api/attempts/${retry.id}/submit`,{})).body;assert.equal(report.passed,true);
    assert.equal(report.reward.baseXp,50);assert.equal(report.reward.bonusXp,50);assert.equal(report.reward.xp,100);assert.equal(store.getState().activeBoost.charges,1);
    await call("POST",`/api/attempts/${retry.id}/submit`,{});assert.equal(store.getState().xp,100);assert.equal(store.getState().activeBoost.charges,1);
    assert.equal(store.getState().courses.ml.progress[1].passed,true);assert.equal(store.getState().progress[1],undefined);
    assert.equal((await call("GET","/api/courses/ml/lessons/2")).status,200);assert.equal((await call("GET","/api/lessons/2")).status,403);
  } finally {await app.close();}
});
test("Backup v2 restores knowledge drafts/bookmarks and v1 imports once into DSA without losing historical rewards", async()=>{
  const {store,app,call}=await setup();
  try {
    const a=(await call("POST","/api/knowledge/attempts",{courseId:"ml",topicId:"ml-interview-11"})).body;
    await call("POST","/api/knowledge/bookmarks",{id:"ml-interview-11",bookmarked:true});
    const q=store.get("knowledge_attempts",a.id).questions[0];await call("PATCH",`/api/knowledge/attempts/${a.id}/answers`,{answers:{[q.id]:q.expected}});
    const backup=(await call("GET","/api/data/export")).body;assert.equal(backup.version,2);assert.equal(backup.knowledgeAttempts.length,1);
    const restore=await call("POST","/api/data/import",backup);assert.equal(restore.status,200,JSON.stringify(restore.body));
    assert.equal(store.get("knowledge_attempts",a.id).answers[q.id],q.expected);assert.ok(store.getState().knowledge.bookmarks.includes("ml-interview-11"));
    const legacy=structuredClone(backup);legacy.version=legacy.state.version=1;legacy.state.xp=300;legacy.state.gems=10;legacy.state.progress={1:{passed:true,bestKnowledge:100}};legacy.state.started=[1];
    for(const key of ["courses","activeCourse","level","levelRewardIds","rewardEvents","consumables","avatarFrames","activeBoost","knowledge"])delete legacy.state[key];
    delete legacy.knowledgeAttempts;
    legacy.ledger=[{id:"lesson:1",created_at:100,xp:50,gems:10,reason:"Historical lesson"}];
    assert.equal((await call("POST","/api/data/import",legacy)).status,200);
    assert.equal(store.getState().courses.dsa.progress[1].passed,true);assert.equal(store.getState().courses.ml.progress[1],undefined);
    assert.ok(store.getState().levelRewardIds.length>0);const old=structuredClone(store.getState());
    store.transaction(()=>{const s=store.getState();assert.equal(store.reward(s,"lesson:1",{xp:50,gems:10}),false);store.putState(s);});
    assert.deepEqual(store.getState(),old);
  } finally {await app.close();}
});
test("All 40 ML lesson gates reach the separate capstone and exclusive course gift", async()=>{
  const {store,app,call,passCode}=await setup();
  try {
    assert.equal((await call("POST","/api/courses/ml/capstone",{})).status,403);
    for(let lessonId=1;lessonId<=40;lessonId++) {
      const r=await call("POST","/api/attempts",{courseId:"ml",lessonId,mode:"assessment"});assert.equal(r.status,200,`ML ${lessonId}: ${JSON.stringify(r.body)}`);
      const a=r.body,privateA=store.get("attempts",a.id);
      assert.equal(privateA.questions.length,[13,24,35,40].includes(lessonId)?10:5);
      assert.equal(privateA.requiredProblems.length,[13,24,35,40].includes(lessonId)?2:1);
      await call("PATCH",`/api/attempts/${a.id}`,{answers:Object.fromEntries(privateA.questions.map(q=>[q.id,q.answerId]))});
      await passCode(a);
      const result=await call("POST",`/api/attempts/${a.id}/submit`,{});assert.equal(result.status,200);assert.equal(result.body.passed,true,`ML ${lessonId}`);
    }
    const summary=(await call("GET","/api/courses/ml")).body;assert.equal(summary.completed,40);assert.equal(summary.capstoneUnlocked,true);
    assert.equal(Object.keys(store.getState().courses.dsa.progress).length,0);
    const cap=(await call("POST","/api/courses/ml/capstone",{})).body,privateCap=store.get("capstones",cap.id);
    assert.equal(privateCap.requiredProblems.length,3);
    const save=await call("PATCH",`/api/courses/ml/capstone/${cap.id}`,{essay:Object.fromEntries(Object.keys(privateCap.essay).map(key=>[key,"Đã giải thích dữ liệu giả lập, giới hạn, cấu hình và cách kiểm thử."])),answers:Object.fromEntries(privateCap.questions.map(q=>[q.id,q.answerId]))});assert.equal(save.status,200,JSON.stringify(save.body));
    await passCode(cap,"capstones","/api/courses/ml");
    const result=await call("POST",`/api/courses/ml/capstone/${cap.id}/submit`,{});assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.passed,true);
    assert.equal(store.getState().courses.ml.capstonePassed,true);assert.equal(store.getState().courses.dsa.capstonePassed,false);assert.ok(store.getState().inventory.includes("scientist"));assert.equal(store.getState().inventory.includes("algorithm"),false);
    assert.equal(store.getState().xp,2400);const finalGems=store.getState().gems;
    await call("POST",`/api/courses/ml/capstone/${cap.id}/submit`,{});assert.equal(store.getState().xp,2400);assert.equal(store.getState().gems,finalGems);
    assert.equal(store.getState().rewardEvents.filter(e=>e.id==="course-complete:ml").length,1);
  } finally {await app.close();}
});
