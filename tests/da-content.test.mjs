import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import * as da from '../content/da/index.mjs';
import {validateContent} from '../content/schema.mjs';

test('DA: every source image is catalogued and all 36 lessons have verified structured material',()=>{
 assert.deepEqual(validateContent({course:da.course,lessons:da.lessons,problems:da.problems,sources:da.sourceCatalog}),{lessons:36,problems:37,sources:10});
 assert.deepEqual(da.sourceCatalog.map(s=>s.page),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(new Set(da.sourceCatalog.map(s=>s.sha256)).size,10);
 for(const s of da.sourceCatalog){assert.equal(createHash('sha256').update(readFileSync(s.path)).digest('hex'),s.sha256);assert.ok(s.lessonIds.length&&s.reviewIds.length&&s.interviewIds.length);assert.equal(s.courseId,'da');}
 assert.equal(da.course.mandatoryLessons,28);assert.equal(da.course.advancedLessons,8);
 assert.deepEqual(da.lessons.filter(l=>l.kind==='exam').map(l=>l.id),[7,14,21,28]);
 assert.deepEqual(da.lessons.filter(l=>l.problemIds.some(id=>id.startsWith('da-sql-'))).map(l=>l.id),[8,12,15,18]);
 for(const lesson of da.lessons){assert.equal(lesson.courseId,'da');assert.ok(lesson.blocks.length>=6);assert.equal(lesson.activityCount,8);assert.ok(lesson.visualData.rows.length&&lesson.visualData.xLabel&&lesson.visualData.yLabel);for(const id of lesson.problemIds)assert.ok(da.solutions[id]);for(const prefix of lesson.sourcePrefixes)assert.ok(da.sourceCatalog.find(s=>s.prefix===prefix).lessonIds.includes(lesson.id),'source reverse mapping '+lesson.id);}
 assert.equal(da.knowledgeTipRows.length,16);assert.equal(da.knowledgeInterviewRows.length,20);
 for(const row of [...da.knowledgeTipRows,...da.knowledgeInterviewRows]){assert.equal(row.length,9);assert.equal(new Set(row.slice(3,7)).size,4);assert.ok(da.sourceCatalog.some(s=>s.prefix===row[8]));}
});

test('DA: 200 seeds per each of 37 templates independently match Python and actual SQLite',()=>{
 const fixtures=[];
 for(const id of Object.keys(da.problems)){
  for(let seed=0;seed<200;seed++){const input=da.generateInput(id,seed);assert.deepEqual(input,da.generateInput(id,seed));assert.ok(da.checkOutput(id,input,da.oracle(id,input)));assert.ok(!da.checkOutput(id,input,{pass:true}));fixtures.push({id,input});}
  for(const t of da.testsFor(id,'verified')){assert.ok(da.checkOutput(id,t.input,t.expected));fixtures.push({id,input:t.input});}
 }
 // Host execution is only repository-authored trusted reference code, never student submissions.
 const script=`import sys,json\np=json.load(sys.stdin)\nf={}\nfor name,source in p['solutions'].items():\n scope={}\n exec(compile(source,'reference:'+name,'exec'),scope)\n f[name]=scope['solve']\njson.dump([f[t['id']](t['input']) for t in p['fixtures']],sys.stdout,allow_nan=False)\n`;
 const run=spawnSync(process.env.BYTEPATH_TEST_PYTHON||'python',['-I','-c',script],{input:JSON.stringify({solutions:da.solutions,fixtures}),encoding:'utf8',timeout:120000,maxBuffer:64*1024*1024});
 assert.equal(run.status,0,run.stderr||run.error?.message);const outputs=JSON.parse(run.stdout);assert.equal(outputs.length,fixtures.length);
 fixtures.forEach((f,i)=>assert.ok(da.checkOutput(f.id,f.input,outputs[i]),f.id+' independent fixture '+i));
});

test('DA: source corrections, missing, exact boundaries, join multiplicity and valid alternative outputs',()=>{
 assert.deepEqual(da.oracle('da-topk',{rows:[{id:1,value:50000},{id:2,value:60000},{id:3,value:55000}],k:3}),[2,3,1]);
 assert.deepEqual(da.oracle('da-group',{rows:[{region:'HR-Laptop',value:50000},{region:'HR-Laptop',value:55000}]}),{'HR-Laptop':105000});
 assert.deepEqual(da.oracle('da-full-join',{left:[{id:1,key:10}],right:[{key:10,name:'HR'}]}),[{id:1,name:'HR'}]);
 assert.deepEqual(da.oracle('da-quartile',{values:[10,20,30,40,50,60,70,80]}),{q1:27.5,q3:62.5,indices:[]});
 assert.deepEqual(da.oracle('da-aggregate',{values:[0,null,2]}),{rows:3,nonNull:2,sum:2,mean:1});
 assert.deepEqual(da.oracle('da-missing',{values:[0,null,10],fallback:7}),[0,5,10]);
 assert.deepEqual(da.oracle('da-rank',{rows:[{id:3,value:80},{id:1,value:100},{id:2,value:100}]}),[{id:1,rowNumber:1,rank:1,denseRank:1},{id:2,rowNumber:2,rank:1,denseRank:1},{id:3,rowNumber:3,rank:3,denseRank:2}]);
 assert.equal(da.oracle('da-inner-join',{left:[{id:1,key:0},{id:2,key:0}],right:[{key:0,name:'A'},{key:0,name:'B'}]}).length,4);
 assert.equal(da.oracle('da-correlation',{x:[1,1],y:[1,2]}),null);
 const d={rows:[{region:'North',value:2},{region:'South',value:3}]};assert.ok(da.checkOutput('da-group',d,{South:3,North:2}));assert.ok(!da.checkOutput('da-group',d,{North:2,South:3,Other:0}));
 assert.ok(!da.checkOutput('da-row-count',{rows:[]},false));assert.ok(!da.checkOutput('da-mean',{values:[1,2]},NaN));assert.ok(!da.checkOutput('da-mean',{values:[1,2]},'1.5'));
 assert.ok(!da.checkOutput('da-row-count',{rows:[{},{}]},2.00000001));
 assert.ok(!da.checkOutput('da-where',{rows:[{id:1000000,region:'A',value:1}],region:'A',threshold:0},[1000001]));
 assert.ok(!da.checkOutput('da-left-join',{left:[{id:1000000,key:1}],right:[{key:1,name:'A'}]},[{id:1000001,name:'A'}]));
 assert.ok(!da.checkOutput('da-kpi',{rows:[{id:1,region:'A',revenue:10}]},{revenue:10,orders:1.00000001,averageOrder:10,byRegion:{A:{orders:1,revenue:10}}}));
 assert.ok(da.checkOutput('da-mean',{values:[1,2]},1.50000001));
 const labels={rows:[{region:'__proto__',value:2},{region:'constructor',value:3},{region:'__proto__',value:4}]};
 assert.deepEqual(da.oracle('da-group',labels),JSON.parse('{"__proto__":6,"constructor":3}'));
 assert.deepEqual(da.oracle('da-having',{...labels,threshold:4}),JSON.parse('{"__proto__":6}'));
 assert.deepEqual(da.oracle('da-kpi',{rows:labels.rows.map(r=>({...r,revenue:r.value}))}),{revenue:9,orders:3,averageOrder:3,byRegion:JSON.parse('{"__proto__":{"orders":2,"revenue":6},"constructor":{"orders":1,"revenue":3}}')});
 assert.deepEqual(da.oracle('da-cohort',{users:[{id:1,cohort:'__proto__',active:true},{id:2,cohort:'__proto__',active:false}]}),JSON.parse('{"__proto__":{"total":2,"active":1,"rate":0.5}}'));
 assert.equal(Object.prototype.orders,undefined);
});

test('DA: 7200 activity variants use answer identities and semantic output checkers',()=>{
 for(const lesson of da.lessons){for(let seed=0;seed<200;seed++){const lab=da.createLab(lesson,seed);assert.equal(lab.questions.length,8);assert.equal(new Set(lab.questions.map(q=>q.id)).size,8);const publicLab=da.publicLab(lab);for(let i=0;i<lab.questions.length;i++){const q=lab.questions[i];assert.ok(da.checkLab(q,q.kind==='output'?JSON.stringify(q.answer):q.answer),'lesson '+lesson.id+' '+q.id);assert.ok(!da.checkLab(q,'wrong'));assert.ok(!Object.hasOwn(publicLab.questions[i],'answer'));assert.ok(!Object.hasOwn(publicLab.questions[i],'explanation'));}}
  for(const[prompt,...choices]of da.topicQuestions[lesson.pack]){assert.ok(prompt.length>5);assert.equal(new Set(choices).size,choices.length);}
 }
});

test('DA: exhaustive small filtering and aggregate domains independently verify signs and null',()=>{
 for(let n=0;n<=4;n++)for(let mask=0;mask<3**n;mask++){const values=Array.from({length:n},(_,i)=>[null,0,2][Math.floor(mask/3**i)%3]),numbers=values.filter(v=>v!==null);assert.deepEqual(da.oracle('da-aggregate',{values}),{rows:n,nonNull:numbers.length,sum:numbers.length?numbers.reduce((a,b)=>a+b,0):null,mean:numbers.length?numbers.reduce((a,b)=>a+b,0)/numbers.length:null});}
 for(let value=0;value<=3;value++)for(let threshold=0;threshold<=3;threshold++){const rows=[{id:0,region:'A',value},{id:1,region:'B',value}];assert.deepEqual(da.oracle('da-where',{rows,region:'A',threshold}),value>=threshold?[0]:[]);}
});

test('DA: connected capstone data, 80% gate, mandatory essays/code and mutation test evidence',()=>{
 const a=da.createCapstone(100);assert.deepEqual(a.tasks['da-kpi'].rows,da.oracle('da-clean-orders',a.tasks['da-clean-orders']).rows);assert.deepEqual(a.tasks['da-chart-series'].rows,a.tasks['da-kpi'].rows);
 a.codesPassed=[...da.capstoneProblems];a.essay=Object.fromEntries(da.essayFields.map(f=>[f.id,'Bài phân tích của người học.']));a.answers=Object.fromEntries(a.questions.slice(2).map(q=>[q.id,q.answerId]));
 assert.equal(da.gradeCapstone(a).score,80);assert.ok(da.gradeCapstone(a).passed);a.answers[a.questions[2].id]='wrong';assert.equal(da.gradeCapstone(a).score,75);assert.ok(!da.gradeCapstone(a).passed);
 a.answers=Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]));a.codesPassed.pop();assert.ok(!da.gradeCapstone(a).passed);a.codesPassed=[...da.capstoneProblems];a.essay.problem='';assert.ok(!da.gradeCapstone(a).passed);
 const fixture=[['da-clean-orders',{rows:[{id:0,region:'North',month:'2026-01',quantity:null,price:10},{id:0,region:'North',month:'2026-01',quantity:1,price:10},{id:1,region:'South',month:'2026-01',quantity:1,price:-3}]}],['da-kpi',{rows:[{id:0,region:'North',month:'2026-01',revenue:10},{id:1,region:'North',month:'2026-01',revenue:20},{id:2,region:'South',month:'2026-02',revenue:90}]}],['da-chart-series',{rows:[{id:0,region:'North',month:'2026-01',revenue:10}],months:['2026-01','2026-02']}]];
 const tests=fixture.map(([problemId,input])=>({problemId,input,expected:da.oracle(problemId,input)}));const score=da.customTestScore(tests);assert.equal(score.score,10);assert.ok(score.killed.length>=4);assert.equal(score.errors.length,0);
 assert.equal(da.customTestScore([{...tests[0],expected:{pass:true}}]).score,0);assert.ok(!da.validCustomInput('da-kpi',{rows:[{id:1,region:'A',month:'m',revenue:NaN}]}));
 const uniqueRows={rows:[{id:0,region:'North',month:'2026-01',quantity:1,price:10},{id:1,region:'South',month:'2026-02',quantity:2,price:10}]};
 const uniqueScore=da.customTestScore([{problemId:'da-clean-orders',input:uniqueRows,expected:da.oracle('da-clean-orders',uniqueRows)}]);
 assert.deepEqual(uniqueScore.killed,[],'a test without duplicates must not earn credit for detecting last-duplicate-wins');
});
