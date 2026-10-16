import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import * as genai from '../content/genai/index.mjs';
import {validateContent} from '../content/schema.mjs';
import {lessonDesigns} from '../content/pedagogy/genai.mjs';
import {buildTeachingFlow,createTeachingLab,checkTeachingActivity,generateUnderstandingQuestions,ACTIVITY_IDS} from '../content/pedagogy/engine.mjs';
const def={...genai,originalLessonMaterial:genai.lessonMaterial,teachingDesigns:lessonDesigns};

test('Gen AI: 11 original pages map to 24 mandatory + 6 optional lessons and verified source hashes',()=>{
 assert.deepEqual(validateContent({...genai,sources:genai.sourceCatalog}),{lessons:30,problems:24,sources:11});
 assert.deepEqual(genai.lessons.filter(l=>l.kind==='exam').map(l=>l.id),[8,16,24]);
 assert.equal(readdirSync('study documents/Gen AI').filter(f=>/\.(jpe?g|png)$/i.test(f)).length,11);
 for(const s of genai.sourceCatalog){assert.equal(createHash('sha256').update(readFileSync(s.path)).digest('hex'),s.sha256);assert.ok(s.lessonIds.length);for(const id of s.lessonIds)assert.ok(genai.lessons[id-1].sourcePrefixes.includes(s.prefix));}
 for(const l of genai.lessons){assert.equal(l.activityCount,8);assert.equal(l.visualization.kind,'genai');assert.ok(genai.units.find(u=>u.id===l.unitId).color);for(const pid of l.problemIds)assert.ok(genai.solutions[pid]);}
 assert.equal(genai.knowledgeInterviewRows.length,27);assert.equal(genai.knowledgeTipRows.length,20);
 for(const row of [...genai.knowledgeInterviewRows,...genai.knowledgeTipRows])assert.equal(new Set(row.slice(3,7)).size,4,row[1]);
 assert.ok(genai.corrections.length>=12);
});

test('Gen AI: 200 seeds per template independently agree with trusted Python references, edges and output contracts',()=>{
 const fixtures=[];for(const id of genai.problemIds){for(let seed=0;seed<200;seed++){const input=genai.generateInput(id,seed);assert.deepEqual(input,genai.generateInput(id,seed));fixtures.push({id,input});}for(const t of genai.testsFor(id,'verified'))fixtures.push({id,input:t.input});}
 const script=`import json,sys\np=json.load(sys.stdin)\nf={}\nfor name,source in p['solutions'].items():\n scope={}\n exec(compile(source,'reference:'+name,'exec'),scope)\n f[name]=scope['solve']\njson.dump([f[t['id']](t['input']) for t in p['fixtures']],sys.stdout,allow_nan=False)\n`;
 // Only trusted repository-authored solutions run on the host. Learner code runs in the existing isolated runtime.
 const run=spawnSync(process.env.BYTEPATH_TEST_PYTHON||'python',['-I','-c',script],{input:JSON.stringify({solutions:genai.solutions,fixtures}),encoding:'utf8',timeout:120000,maxBuffer:32*1024*1024});
 assert.equal(run.status,0,run.stderr||run.error?.message);const actual=JSON.parse(run.stdout);assert.equal(actual.length,fixtures.length);
 fixtures.forEach((f,i)=>{assert.ok(genai.checkOutput(f.id,f.input,actual[i]),f.id+' '+i);assert.ok(!genai.checkOutput(f.id,f.input,{pass:true}),f.id);const trace=genai.traceFor(f.id,f.input);assert.ok(genai.checkOutput(f.id,f.input,trace.frames.at(-1).result));});
});

test('Gen AI: all nonexam lessons have authored guided steps and 200 seeds of eight activities and balanced assessments',()=>{
 for(const lesson of genai.lessons){const design=lessonDesigns[lesson.id];if(lesson.kind!=='exam'){
  const flow=buildTeachingFlow(def,lesson,design);assert.deepEqual(flow.steps.filter(s=>s.activityId).map(s=>s.activityId),ACTIVITY_IDS);assert.ok(design.vocabulary.length>=2);assert.ok(design.misconception.why.length>25);
  for(let seed=0;seed<200;seed++){const lab=createTeachingLab(def,lesson,seed,design);assert.equal(lab.questions.length,8);assert.ok(new Set(lab.questions.map(q=>q.kind)).size>=4);for(const q of lab.questions){assert.ok(checkTeachingActivity(def,q,['number','output'].includes(q.kind)?JSON.stringify(q.answer):q.answer),lesson.id+' '+q.id);assert.ok(!checkTeachingActivity(def,q,'not-a-result'));}}
 }
 for(let seed=0;seed<200;seed++){const qs=generateUnderstandingQuestions(def,lesson,'assessment',seed,lessonDesigns),counts={};assert.equal(qs.length,lesson.kind==='exam'?10:5);for(const q of qs){counts[q.category]=(counts[q.category]??0)+1;assert.equal(q.options.filter(o=>o.id===q.answerId).length,1);assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length);if(q.category==='trace')assert.ok(genai.checkOutput(q.problemId,q.input,q.traceAnswer));}assert.deepEqual(counts,lesson.kind==='exam'?{concept:2,trace:3,apply:3,error:2}:{concept:1,trace:2,error:1,apply:1});}
 }
});

test('Gen AI: independent exhaustive small-domain checks and common mistakes',()=>{
 for(let a=1;a<100;a++)for(let p=1;p<=100;p++){const input={candidates:[{id:'B',weight:100-a},{id:'A',weight:a}],p},ordered=[...input.candidates].sort((x,y)=>y.weight-x.weight||x.id.localeCompare(y.id)),expected=ordered[0].weight>=p?[ordered[0].id]:ordered.map(c=>c.id);assert.deepEqual(genai.oracle('genai-top-p',input),expected);}
 for(let budget=0;budget<12;budget++)for(let a=1;a<=4;a++)for(let b=1;b<=4;b++){const input={budget,messages:[{id:'A',cost:a},{id:'B',cost:b}]},candidates=[[],['B'],['A','B']],expected=candidates.filter(ids=>ids.reduce((s,id)=>s+(id==='A'?a:b),0)<=budget).at(-1);assert.deepEqual(genai.oracle('genai-context',input),expected);}
 assert.deepEqual(genai.oracle('genai-encode',{tokens:['sun','missing'],vocab:{sun:0}}),[0,-1]);
 assert.deepEqual(genai.oracle('genai-schema',{allowedLabels:['ok'],outputs:[{label:'ok',confidence:0},{label:'ok',confidence:1},{label:'ok',confidence:true},{label:'ok',confidence:NaN},{label:'ok',confidence:.5,extra:1}]}),[true,true,false,false,false]);
 assert.deepEqual(genai.oracle('genai-quantize',{values:[-3,-1,1,3],step:2}),[-2,0,2,4]);
 assert.equal(genai.oracle('genai-memory',{parameters:3,bits:4}),2);
 assert.deepEqual(genai.oracle('genai-loop',{outcomes:['continue','done'],limit:2}),{steps:2,status:'done'});
 assert.ok(!genai.checkOutput('genai-context',{budget:3,messages:[{id:'A',cost:1},{id:'B',cost:2}]},['B','A']));
 assert.ok(genai.checkOutput('genai-evaluate',{expected:['A','B','C'],actual:['A','A','A']},{accuracy:.3333333333,total:3,correct:1}));
 assert.ok(!genai.checkOutput('genai-evaluate',{expected:['A'],actual:['A']},{accuracy:true,total:1,correct:1}));
 assert.ok(!genai.checkOutput('genai-attention',{weights:[1],values:[1]},Infinity));
});

test('Gen AI capstone: 80% boundary, all three code gates, complete essays, mutant tests and new seeds',()=>{
 const a=genai.createCapstone(100),b=genai.createCapstone(100);assert.notEqual(a.seed,b.seed);assert.equal(a.questions.length,6);
 a.essay=Object.fromEntries(genai.essayFields.map(f=>[f.id,'Giải thích của người học.']));a.codesPassed=[...genai.capstoneProblems];a.answers=Object.fromEntries(a.questions.slice(0,4).map(q=>[q.id,q.answerId]));
 assert.equal(genai.gradeCapstone(a).score,80);assert.equal(genai.gradeCapstone(a).passed,true);delete a.answers[a.questions[3].id];assert.equal(genai.gradeCapstone(a).passed,false);
 a.answers=Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]));a.codesPassed.pop();assert.equal(genai.gradeCapstone(a).passed,false);a.codesPassed=[...genai.capstoneProblems];a.essay.problem=' ';assert.equal(genai.gradeCapstone(a).passed,false);
 const inputs=[['genai-context',{budget:5,messages:[{id:'old',cost:1},{id:'new',cost:6}]}],['genai-context',{budget:3,messages:[{id:'A',cost:1},{id:'B',cost:2}]}],['genai-schema',{allowedLabels:['yes'],outputs:[{label:'yes',confidence:true},{label:'yes',confidence:.5,extra:1},{label:'no',confidence:.5}]}],['genai-evaluate',{expected:[],actual:[]}]];
 const tests=inputs.map(([problemId,input])=>({problemId,input,expected:genai.oracle(problemId,input)})),report=genai.customTestScore(tests);assert.equal(report.score,10);assert.ok(report.killed.length>=6);assert.equal(genai.customTestScore([...tests,tests[0]]).score,10);assert.equal(genai.customTestScore([{...tests[0],expected:['old']}]).score,0);
 assert.equal(genai.validCustomInput('genai-context',{budget:1,messages:[{id:'A',cost:0}]}),false);assert.equal(genai.validCustomInput('genai-evaluate',{expected:['A'],actual:[]}),false);
 for(let seed=0;seed<200;seed++){const qs=genai.capstoneQuestions(seed);for(const q of qs)assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length);}
});
