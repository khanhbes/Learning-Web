import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { createStore } from "../server/store.mjs";
import { registerKnowledgeRoutes } from "../server/knowledge.mjs";
import { registerGamificationRoutes, purchaseExtended } from "../server/gamification.mjs";

test("Knowledge API preserves private answers, resumes drafts and grades transactionally once", async () => {
  const store=createStore(":memory:"), app=Fastify();
  registerKnowledgeRoutes(app,{store,now:()=>100}); registerGamificationRoutes(app,{store,now:()=>100});
  try {
    const catalog=(await app.inject("/api/knowledge?courseId=ml")).json();
    assert.equal(catalog.tips.length,20); assert.equal(catalog.topics.length,35);
    assert.equal(catalog.topics.some(t=>"templates" in t),false);
    const create=()=>app.inject({method:"POST",url:"/api/knowledge/attempts",payload:{courseId:"ml",topicId:"ml-interview-11"}});
    const a=(await create()).json(), resume=(await create()).json();
    assert.equal(a.id,resume.id); assert.equal(a.questions.length,5);
    assert.equal(a.questions.some(q=>"expected" in q),false);
    const trusted=store.get("knowledge_attempts",a.id), answers=Object.fromEntries(trusted.questions.map(q=>[q.id,q.expected]));
    const saved=await app.inject({method:"PATCH",url:`/api/knowledge/attempts/${a.id}/answers`,payload:{answers}});
    assert.equal(saved.statusCode,200);
    const fetched=(await app.inject(`/api/knowledge/attempts/${a.id}`)).json(); assert.deepEqual(fetched.answers,answers);
    const submit=()=>app.inject({method:"POST",url:`/api/knowledge/attempts/${a.id}/submit`,payload:{}});
    const result=(await submit()).json(); assert.equal(result.report.score,100); assert.equal(result.report.rewards.gems,15); assert.equal(result.report.rewards.xp,20);
    const retry=(await submit()).json(); assert.equal(retry.duplicate,true);
    assert.equal(store.getState().xp,20); assert.equal(store.getState().gems,15);
    assert.equal(store.db.prepare("SELECT COUNT(*) n FROM ledger").get().n,2);
    const bad=await app.inject({method:"POST",url:"/api/knowledge/bookmarks",payload:{id:"constructor",bookmarked:true}}); assert.equal(bad.statusCode,400);
    const bookmark=await app.inject({method:"POST",url:"/api/knowledge/bookmarks",payload:{id:"ml-interview-11",bookmarked:true}}); assert.equal(bookmark.statusCode,200);
    assert.ok((await app.inject("/api/knowledge?courseId=ml")).json().bookmarks.includes("ml-interview-11"));
  } finally { await app.close(); store.close(); }
});
test("Actual store boosts ledger XP once, gifts level boundaries, and activation retries preserve charges", async () => {
  const store=createStore(":memory:"),app=Fastify(); registerGamificationRoutes(app,{store,now:()=>100});
  try {
    store.transaction(()=>{const s=store.getState();s.gems=200;purchaseExtended(s,"boost-2",{requestId:"buy"});store.putState(s);});
    const request={method:"POST",url:"/api/inventory/activate",payload:{itemId:"boost-2",requestId:"activate"}};
    assert.equal((await app.inject(request)).statusCode,200);
    assert.equal((await app.inject(request)).json().duplicate,true);
    store.transaction(()=>{const s=store.getState();assert.equal(store.reward(s,"first",{xp:50,now:100}),true);assert.equal(store.reward(s,"first",{xp:50,now:100}),false);store.putState(s);});
    const s=store.getState();assert.equal(s.xp,100);assert.equal(s.activeBoost.charges,1);assert.equal(s.level.level,2);assert.equal(s.gems,170);
    const row=store.db.prepare("SELECT xp FROM ledger WHERE id='first'").get();assert.equal(row.xp,100);
    const seen=await app.inject({method:"POST",url:`/api/reward-events/${s.rewardEvents[0].id}/seen`,payload:{}});assert.equal(seen.statusCode,200);assert.equal(store.getState().rewardEvents[0].seen,true);
  } finally { await app.close();store.close(); }
});
