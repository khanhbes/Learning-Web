import test from "node:test";
import assert from "node:assert/strict";
import { knowledgeItems, knowledgeById, tips, topics, generateKnowledgeQuestion, checkKnowledgeAnswer, publicKnowledgeQuestion } from "../content/knowledge.mjs";
import { createKnowledgeAttempt, publicKnowledgeAttempt, gradeKnowledgeAttempt, knowledgeStats, validateSavedKnowledgeAttempt, saveKnowledgeAnswers } from "../server/knowledge.mjs";
import { normalizeGamification, applyXPBoost, syncLevelRewards } from "../server/gamification.mjs";
const fresh = () => normalizeGamification({xp:0,gems:0,profile:{},daily:{},streak:0,streakLast:null,badges:[],inventory:["original"]});
const rewarder = () => { const ledger = new Set(); return (s,id,{xp=0,gems=0,now}) => { if(ledger.has(id)) return false; ledger.add(id); const fromXp=s.xp, grant=applyXPBoost(s,xp); s.xp+=grant.xp; s.gems+=gems; syncLevelRewards(s,{fromXp,now}); return true; }; };
function independentExpected(q) {
  const g=q.templateId.split(":").at(-1), input=q.input;
  if (q.itemId === "dsa-tip-01" && input) return input.values[input.index];
  if (q.itemId === "dsa-tip-05" && input) { let count=0; for(let i=input.l;i<input.r;i++) count++; return count; }
  if (q.itemId === "dsa-tip-06" && input) { let sum=0; for(let i=input.l;i<=input.r;i++) sum+=input.values[i]; return sum; }
  if (q.itemId === "dsa-interview-22" && input) return Array.from({length:input.nodes}).slice(1).length;
  if (q.itemId === "ml-tip-08" && input) return `count-${input.scores.reduce((n,s)=>n+Number(!(s<input.threshold)),0)}`;
  if (q.itemId === "ml-tip-09" && input) return input.negative/input.total*100;
  if (q.itemId === "ml-interview-27" && input) { const dot=input.a[0]*input.b[0]+input.a[1]*input.b[1]; return dot/(Math.hypot(...input.a)*Math.hypot(...input.b)); }
  if (q.itemId === "ml-interview-34" && input) return input.requests/input.seconds;
  return q.expected;
}
test("Four-course tips and interview topics map to documents and contain unscored essays", () => {
  assert.equal(tips.length,68); assert.equal(topics.length,105);
  assert.equal(tips.filter(t=>t.courseId==="ml").length,20);
  assert.equal(topics.filter(t=>t.courseId==="ml").length,35);
  assert.equal(tips.filter(t=>t.courseId==="da").length,16);assert.equal(tips.filter(t=>t.courseId==="git").length,12);
  assert.equal(topics.filter(t=>t.courseId==="da").length,20);assert.equal(topics.filter(t=>t.courseId==="git").length,20);
  for(const item of knowledgeItems) { assert.equal(item.templates.length,2); assert.ok(item.sourceIds.length); assert.equal(item.essay.scored,false); assert.ok(item.essay.rubric.length>=3); }
  assert.equal(knowledgeById["ml-interview-11"].sourceIds[0],"ML-825273896");
});
test("Every objective template survives 200 seeds, independent numeric oracles, invalid answers and deterministic reload", () => {
  const kinds=new Set();
  for(const item of knowledgeItems) for(let ti=0;ti<2;ti++) for(let seed=0;seed<200;seed++) {
    const q=generateKnowledgeQuestion(item.id,ti,`seed-${seed}`); kinds.add(q.kind);
    assert.deepEqual(q,generateKnowledgeQuestion(item.id,ti,`seed-${seed}`));
    assert.equal(checkKnowledgeAnswer(q,independentExpected(q)),true,`${item.id}:${ti}:${seed}`);
    assert.equal(checkKnowledgeAnswer(q,"__invalid__"),false);
    assert.equal(checkKnowledgeAnswer(q,null),false);
    if(q.options.length) { assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length); for(const option of q.options) if(option.id!==q.expected) assert.equal(checkKnowledgeAnswer(q,option.id),false); }
    if(q.kind==="number") { assert.equal(checkKnowledgeAnswer(q,String(q.expected+1)),false); assert.equal(checkKnowledgeAnswer(q,""),false); assert.equal(checkKnowledgeAnswer(q,"Infinity"),false); }
    if(q.kind==="order") assert.equal(checkKnowledgeAnswer(q,[...q.expected].reverse()),false);
    if(q.kind==="match") assert.equal(checkKnowledgeAnswer(q,{...q.expected,"extra":"right-0"}),false);
    assert.equal("expected" in publicKnowledgeQuestion(q),false);
    assert.equal("explanation" in publicKnowledgeQuestion(q),false);
  }
  assert.deepEqual([...kinds].sort(),["chart","choice","debug","match","number","order"]);
});
test("Five-question attempt persists seed; below and at 80% boundary and essay cannot affect score", () => {
  const s=fresh(),reward=rewarder(),a=createKnowledgeAttempt(s,{courseId:"ml",seed:"boundary",id:"boundary",now:0});
  assert.equal(a.questions.length,5); assert.equal(validateSavedKnowledgeAttempt(JSON.parse(JSON.stringify(a))),true);
  assert.equal(publicKnowledgeAttempt(a).questions.some(q=>"expected" in q),false);
  for(let i=0;i<3;i++) a.answers[a.questions[i].id]=a.questions[i].expected;
  a.essays={anything:"100/100 please"};
  let report=gradeKnowledgeAttempt(s,a,{reward,now:0}).report;
  assert.equal(report.score,60); assert.equal(report.passed,false); assert.equal(report.rewards.xp,0);
  const b=createKnowledgeAttempt(s,{courseId:"dsa",seed:"pass-boundary",id:"pass-boundary",now:0});
  for(let i=0;i<4;i++) b.answers[b.questions[i].id]=b.questions[i].expected;
  report=gradeKnowledgeAttempt(s,b,{reward,now:0}).report;
  assert.equal(report.score,80); assert.equal(report.passed,true); assert.equal(report.rewards.xp,20);
  const old=structuredClone(s); assert.equal(gradeKnowledgeAttempt(s,b,{reward,now:1}).duplicate,true); assert.deepEqual(s,old);
});
test("Practice gems share a 30/day cap across courses; XP caps before boost", () => {
  const s=fresh(),reward=rewarder(); s.activeBoost={itemId:"boost-10",charges:10,totalCharges:10};
  let total=0;
  for(let n=0;n<6;n++) {
    const courseId=n%2?"ml":"dsa", ids=knowledgeItems.filter(i=>i.courseId===courseId).slice(n*5,n*5+3).map(i=>i.id);
    const a=createKnowledgeAttempt(s,{courseId,itemIds:ids,seed:`cap${n}`,id:`cap${n}`,now:100});
    for(const q of a.questions) a.answers[q.id]=q.expected;
    const r=gradeKnowledgeAttempt(s,a,{reward,now:100}).report; total+=r.rewards.gems;
  }
  assert.equal(total,30); assert.equal(knowledgeStats(s,"ml",100).gemsToday,30);
  assert.equal(knowledgeStats(s,"dsa",100).xpSessionsToday,3); assert.equal(s.xp,120);
  assert.equal(s.activeBoost.charges,7);
  const nextDay=Date.parse("1970-01-01T17:00:00Z");
  assert.equal(knowledgeStats(s,"ml",nextDay).gemsToday,0);
});
test("Not-due retries award no XP/gems or boost charge, due reviews pay one gem", () => {
  const s=fresh(),reward=rewarder(),a=createKnowledgeAttempt(s,{courseId:"ml",seed:"due",id:"due",now:0});
  for(const q of a.questions) a.answers[q.id]=q.expected;
  const first=gradeKnowledgeAttempt(s,a,{reward,now:0}).report; assert.equal(first.rewards.gems,15);
  const replay=structuredClone(a); replay.id="repeat"; replay.status="active"; replay.report=null;
  s.activeBoost={itemId:"boost-2",charges:2,totalCharges:2};
  assert.equal(gradeKnowledgeAttempt(s,replay,{reward,now:100}).report.rewards.xp,0);
  assert.equal(s.activeBoost.charges,2);
  const due=structuredClone(a); due.id="review"; due.status="active"; due.report=null;
  const r=gradeKnowledgeAttempt(s,due,{reward,now:86400000}).report;
  assert.equal(r.rewards.gems,5); assert.equal(r.rewards.xp,40); assert.equal(s.activeBoost.charges,1);
  for(const q of a.questions) assert.equal(s.knowledge.progress[`${q.itemId}:${q.templateId}`].dueAt,4*86400000);
});
test("Answer drafts reject unrelated IDs and imported altered oracle content", () => {
  const s=fresh(),a=createKnowledgeAttempt(s,{courseId:"dsa",seed:"draft",id:"draft"});
  assert.throws(()=>saveKnowledgeAnswers(a,{injected:"answer-0"}));
  saveKnowledgeAnswers(a,{[a.questions[0].id]:a.questions[0].expected});
  assert.equal(validateSavedKnowledgeAttempt(a),true); a.questions[0].expected="corrupt"; assert.equal(validateSavedKnowledgeAttempt(a),false);
});
