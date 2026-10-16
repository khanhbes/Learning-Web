import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import * as rag from '../content/rag/index.mjs';
import {validateContent} from '../content/schema.mjs';
import {lessonDesigns} from '../content/pedagogy/rag.mjs';
import {buildTeachingFlow,createTeachingLab,checkTeachingActivity,generateUnderstandingQuestions,publicTeachingLab} from '../content/pedagogy/engine.mjs';
import {bridges} from '../content/pedagogy/bridges.mjs';
const def={...rag,originalLessonMaterial:rag.lessonMaterial};

test('RAG: all sixteen source images mapped and 28+6 sessions retain readable, focused learning data',()=>{
 assert.deepEqual(validateContent({course:rag.course,lessons:rag.lessons,problems:rag.problems,sources:rag.sourceCatalog}),{lessons:34,problems:22,sources:16});
 assert.equal(rag.course.mandatoryLessons,28);assert.equal(rag.course.advancedLessons,6);assert.deepEqual(rag.lessons.filter(l=>l.kind==='exam').map(l=>l.id),[9,18,28]);
 assert.equal(readdirSync('study documents/RAG LLM').filter(f=>/\.(png|jpe?g)$/i.test(f)).length,16);
 for(const source of rag.sourceCatalog){assert.equal(createHash('sha256').update(readFileSync(source.path)).digest('hex'),source.sha256);assert.ok(source.lessonIds.length);}
 for(const lesson of rag.lessons){assert.ok(lesson.sourcePrefixes.length);assert.equal(lesson.problemIds.length,lesson.kind==='exam'?2:1);assert.ok(lesson.blocks.length>=7);assert.ok(lesson.visualization.input);assert.equal(lesson.activityCount,8);}
 for(const row of [...rag.knowledgeTipRows,...rag.knowledgeInterviewRows]){assert.equal(row.length,9);assert.equal(new Set(row.slice(3,7)).size,4,row[1]);assert.ok(rag.knowledgeLessonIds[row[0]]);}
 assert.equal(rag.knowledgeTipRows.length,20);assert.equal(rag.knowledgeInterviewRows.length,31);
 assert.match(rag.corrections.find(c=>c.id==='RAG-E02').after,/384/);assert.match(rag.corrections.find(c=>c.id==='RAG-E05').after,/không|khỏi/i);
});

test('RAG: 200 seeds per 22 problems agree with independent trusted Python references',()=>{
 const fixtures=[];for(const pid of rag.problemIds){for(let seed=0;seed<200;seed++){const input=rag.generateInput(pid,seed);assert.deepEqual(input,rag.generateInput(pid,seed));assert.ok(rag.checkOutput(pid,input,rag.oracle(pid,input)));assert.ok(!rag.checkOutput(pid,input,{pass:true}));fixtures.push({id:pid,input});}for(const t of rag.testsFor(pid,'rag-check')){assert.ok(rag.checkOutput(pid,t.input,t.expected));fixtures.push({id:pid,input:t.input});}}
 // Only repository-authored trusted references run here. Learner submissions use the isolated runner.
 const script='import json,sys\np=json.load(sys.stdin)\nf={}\nfor name,source in p["solutions"].items():\n scope={}\n exec(compile(source,"reference:"+name,"exec"),scope)\n f[name]=scope["solve"]\njson.dump([f[t["id"]](t["input"]) for t in p["fixtures"]],sys.stdout,allow_nan=False)\n';
 const run=spawnSync(process.env.BYTEPATH_TEST_PYTHON||'python',['-I','-c',script],{input:JSON.stringify({solutions:rag.solutions,fixtures}),encoding:'utf8',timeout:120000,maxBuffer:32*1024*1024});
 assert.equal(run.status,0,run.stderr||run.error?.message);const out=JSON.parse(run.stdout);assert.equal(out.length,fixtures.length);fixtures.forEach((f,i)=>assert.ok(rag.checkOutput(f.id,f.input,out[i]),f.id+' fixture '+i));
});

test('RAG: 200 seeds of guided activities and assessments are objective and preserve category balance',()=>{
 const bridgeIds=new Set(Object.keys(bridges));
 for(const lesson of rag.lessons){const design=lessonDesigns[lesson.id];if(lesson.kind!=='exam'){
  assert.ok(design);for(const id of design.bridges)assert.ok(bridgeIds.has(id),'bridge '+id);
  const flow=buildTeachingFlow(def,lesson,design);assert.equal(flow.steps.length,15);assert.equal(flow.steps.filter(s=>s.kind==='activity').length,8);assert.ok(flow.trace.frames.length>=2);
 }
 for(let seed=0;seed<200;seed++){
  if(design){const lab=createTeachingLab(def,lesson,seed,design),publicLab=publicTeachingLab(lab);assert.equal(lab.questions.length,8);for(const [i,q]of lab.questions.entries()){assert.ok(checkTeachingActivity(def,q,['number','output'].includes(q.kind)?JSON.stringify(q.answer):q.answer),lesson.id+':'+q.id);assert.ok(!checkTeachingActivity(def,q,'__wrong__'));assert.ok(!Object.hasOwn(publicLab.questions[i],'answer'));}}
  const qs=generateUnderstandingQuestions(def,lesson,'assessment',seed,lessonDesigns);assert.equal(qs.length,lesson.kind==='exam'?10:5);assert.equal(qs.filter(q=>q.category==='trace').length,lesson.kind==='exam'?3:2);for(const q of qs){assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length);assert.ok(q.options.some(o=>o.id===q.answerId));}
 }
 }
});

test('RAG: trace states remain consistent with independent results without mutating source data',()=>{
 for(const pid of rag.problemIds)for(let seed=0;seed<200;seed++){const input=rag.generateInput(pid,seed),before=structuredClone(input),trace=rag.traceFor(pid,input);assert.deepEqual(input,before);assert.ok(trace.frames.length>=2);assert.deepEqual(trace.result,rag.oracle(pid,input));assert.deepEqual(trace.frames.at(-1).state.result,trace.result);for(const f of trace.frames)assert.ok(f.label&&f.state&&Array.isArray(f.entries));}
});

test('RAG: boundary contracts, float equivalence and malformed output regressions',()=>{
 assert.equal(rag.oracle('rag-lookup',{docs:[{id:'A',answer:''}],sourceId:'A'}),'');
 assert.deepEqual(rag.oracle('rag-budget',{chunks:[{id:'A',cost:9},{id:'B',cost:2}],limit:5,reserved:1}),{ids:['B'],used:2,remaining:2});
 assert.deepEqual(rag.oracle('rag-chunks',{tokens:['a','b','c','d'],size:3,overlap:2}),[{start:0,tokens:['a','b','c']},{start:1,tokens:['b','c','d']}]);
 assert.deepEqual(rag.oracle('rag-retrieve',{query:['a','a'],docs:[{id:'B',tokens:['a','a']},{id:'A',tokens:['a']}],k:2}),[{id:'A',score:1},{id:'B',score:1}]);
 assert.deepEqual(rag.oracle('rag-rerank',{candidates:['B','A'],scores:{A:1,B:1,Z:999},k:2}),['A','B']);
 assert.deepEqual(rag.oracle('rag-citations',{sources:[{id:'A',text:'Hello'}],claims:[{id:'C',sourceId:'A',quote:''},{id:'D',sourceId:'X',quote:'Hello'}]}),[{id:'C',supported:false},{id:'D',supported:false}]);
 assert.deepEqual(rag.oracle('rag-metrics',{relevant:['A','B'],retrieved:['A','A','X']}),{hits:1,precision:.5,recall:.5});
 assert.equal(rag.oracle('rag-cosine',{a:[0,0],b:[1,0]}),null);assert.equal(rag.oracle('rag-cosine',{a:[1,0],b:[-1,0]}),-1);
 assert.ok(rag.checkOutput('rag-cosine',{a:[1,1],b:[1,0]},Math.SQRT1_2+1e-9));assert.ok(!rag.checkOutput('rag-cosine',{a:[1,1],b:[1,0]},Math.SQRT1_2+.001));
 assert.equal(rag.oracle('rag-abstain',{scores:[50],threshold:50}),'answer');assert.deepEqual(rag.oracle('rag-filter',{docs:[{id:'A',tenant:'x',expiresAt:10}],tenant:'x',now:10}),[]);
 for(const pid of rag.problemIds){const input=rag.generateInput(pid,'invalid-output'),out=rag.oracle(pid,input);assert.ok(!rag.checkOutput(pid,input,Infinity));assert.ok(!rag.checkOutput(pid,input,JSON.stringify(out)));if(Array.isArray(out))assert.ok(!rag.checkOutput(pid,input,[...out,null]));if(out&&typeof out==='object'&&!Array.isArray(out))assert.ok(!rag.checkOutput(pid,input,{...out,extra:true}));}
});

test('RAG: exhaustive tiny chunking covers input exactly without an unnecessary terminal fragment',()=>{
 for(let n=0;n<=9;n++)for(let size=1;size<=6;size++)for(let overlap=0;overlap<size;overlap++){const tokens=Array.from({length:n},(_,i)=>String(i)),out=rag.oracle('rag-chunks',{tokens,size,overlap});assert.deepEqual([...new Set(out.flatMap(c=>c.tokens))],tokens);assert.ok(out.every(c=>c.tokens.length&&c.tokens.length<=size));assert.ok(out.slice(0,-1).every(c=>c.start+size<n));assert.ok(!out.length||out.at(-1).start+out.at(-1).tokens.length===n);}
});

test('RAG: capstone requires three code passes, complete essay and at least 80; mutation tests earn evidence',()=>{
 const a=rag.createCapstone(123);for(const pid of rag.capstoneProblems)assert.ok(rag.validCustomInput(pid,a.tasks[pid]));a.codesPassed=[...rag.capstoneProblems];a.essay=Object.fromEntries(rag.essayFields.map(f=>[f.id,'Nội dung đã viết.']));a.answers=Object.fromEntries(a.questions.slice(2).map(q=>[q.id,q.answerId]));assert.equal(rag.gradeCapstone(a).score,80);assert.ok(rag.gradeCapstone(a).passed);a.answers[a.questions[2].id]='wrong';assert.equal(rag.gradeCapstone(a).score,75);assert.ok(!rag.gradeCapstone(a).passed);a.answers=Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]));a.codesPassed.pop();assert.ok(!rag.gradeCapstone(a).passed);a.codesPassed=[...rag.capstoneProblems];a.essay.problem=' ';assert.ok(!rag.gradeCapstone(a).passed);
 const inputs=[['rag-chunks',{tokens:['a','b','c','d'],size:3,overlap:2}],['rag-retrieve',{query:['a','a'],docs:[{id:'A',tokens:['a']},{id:'B',tokens:['a']}],k:2}],['rag-citations',{sources:[{id:'A',text:'Hello'}],claims:[{id:'C',sourceId:'A',quote:''},{id:'D',sourceId:'X',quote:'Hello'}]}]];
 const tests=inputs.map(([problemId,input])=>({problemId,input,expected:rag.oracle(problemId,input)}));assert.equal(rag.customTestScore(tests).score,10);assert.equal(rag.customTestScore([...tests,...tests]).killed.length,rag.customTestScore(tests).killed.length);assert.equal(rag.customTestScore([{...tests[0],expected:[]}]).score,0);assert.ok(!rag.validCustomInput('rag-chunks',{tokens:['a'],size:2,overlap:2}));
});
