import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { course,lessons,sourceCatalog,problems,solutions,generateInput,oracle,checkOutput,testsFor,createLab,checkLab,createCapstone,gradeCapstone,customTestScore,topicQuestions } from '../content/ml/index.mjs';

test('ML: 65 source hashes and mappings, 40 mandatory and 12 optional lessons',()=>{
 assert.equal(sourceCatalog.length,65);assert.equal(new Set(sourceCatalog.map(s=>s.sha256)).size,65);
 const referenceSet=new Set(sourceCatalog.map(s=>s.prefix));
 for(const source of sourceCatalog){assert.equal(createHash('sha256').update(readFileSync(source.path)).digest('hex'),source.sha256);assert.ok(source.lessonIds.length||source.interviewIds.length||source.uses.includes('review'));}
 assert.equal(course.mandatoryLessons,40);assert.equal(lessons.length,52);assert.deepEqual(lessons.filter(l=>l.kind==='exam').map(l=>l.id),[13,24,35,40]);
 for(const lesson of lessons){assert.ok(lesson.blocks.length>=5);assert.ok(lesson.visualization);assert.equal(lesson.courseId,'ml');assert.equal(createLab(lesson,'validation').questions.length,8);for(const id of lesson.problemIds)assert.ok(problems[id]&&solutions[id]);for(const prefix of lesson.sourcePrefixes)assert.ok(referenceSet.has(prefix));}
 const interviewIds=new Set(sourceCatalog.flatMap(s=>s.interviewIds));assert.equal(interviewIds.size,35);
});

test('ML: at least 200 seeds per template, valid deterministic tests and alternative Python oracle',()=>{
 const fixtures=[];
 for(const id of Object.keys(problems)) {
  for(let seed=0;seed<200;seed++) {
   const input=generateInput(id,seed);assert.deepEqual(generateInput(id,seed),input);
   const expected=oracle(id,input);assert.ok(checkOutput(id,input,expected),id+' seed '+seed);assert.ok(!checkOutput(id,input,{pass:true}),id+' cannot trust pass field');
   fixtures.push({id,input});
  }
  for(const item of testsFor(id,'checked-fixtures')){assert.ok(checkOutput(id,item.input,item.expected),id+' '+item.group);fixtures.push({id,input:item.input});}
 }
 // Only repository-authored reference functions run here. Student code always uses isolated runner.
 const verification=`import sys,json,math\npayload=json.load(sys.stdin)\nfunctions={}\nfor name,source in payload['solutions'].items():\n scope={}\n exec(compile(source,'reference:'+name,'exec'),scope)\n functions[name]=scope['solve']\noutputs=[]\nfor fixture in payload['fixtures']:\n outputs.append(functions[fixture['id']](fixture['input']))\njson.dump(outputs,sys.stdout,allow_nan=False)\n`;
 const run=spawnSync(process.env.BYTEPATH_TEST_PYTHON||'python',['-I','-c',verification],{input:JSON.stringify({solutions,fixtures}),encoding:'utf8',maxBuffer:40*1024*1024,timeout:120000});
 assert.equal(run.status,0,run.stderr||run.error?.message);const outputs=JSON.parse(run.stdout);assert.equal(outputs.length,fixtures.length);
 fixtures.forEach((f,i)=>assert.ok(checkOutput(f.id,f.input,outputs[i]),f.id+' independently implemented Python fixture '+i));
});

test('ML regression: negative R2, leakage, forest probabilities, clustering permutations and PCA signs',()=>{
 assert.ok(oracle('ml-metrics',{y:[0,1],pred:[100,100]}).r2<0);
 assert.equal(oracle('ml-impute',{train:[2,null,4],test:[100,null]}).test[1],3);
 assert.deepEqual(oracle('ml-forest',{treeProbabilities:[[0.49,0.49,0.99]]}).labels,[1]);
 const pcaInput={points:[[0,0],[1,2],[2,4]]},expected=oracle('ml-pca',pcaInput);
 assert.ok(checkOutput('ml-pca',pcaInput,{...expected,direction:expected.direction.map(x=>-x),projections:expected.projections.map(x=>-x)}));
 assert.ok(!checkOutput('ml-pca',pcaInput,{...expected,direction:expected.direction.map(x=>-x)}));
 const km={points:[[0,0],[1,0],[10,10]],centroids:[[0,0],[10,10]]},res=oracle('ml-kmeans',km);
 assert.ok(checkOutput('ml-kmeans',km,{labels:res.labels.map(x=>1-x),centroids:[...res.centroids].reverse()}));
 assert.ok(!checkOutput('ml-kmeans',km,{labels:res.labels.map(x=>1-x),centroids:res.centroids}));
 const dbInput=generateInput('ml-dbscan',0),labels=oracle('ml-dbscan',dbInput);
 assert.ok(checkOutput('ml-dbscan',dbInput,labels.map(x=>x<0?x:x+100)));
 assert.ok(!checkOutput('ml-dbscan',dbInput,labels.map(()=>0)));
});

test('ML labs: objective checker follows answer IDs, ordered steps and semantic outputs',()=>{
 for(const lesson of lessons) {
  for(let seed=0;seed<200;seed++) {
   const lab=createLab(lesson,'labseed-'+seed);
   assert.equal(new Set(lab.questions.map(q=>q.id)).size,8);
   for(const q of lab.questions){const input=q.kind==='output'?JSON.stringify(q.answer):q.answer;assert.ok(checkLab(q,input),'lesson '+lesson.id+' '+q.id);assert.ok(!checkLab(q,'wrong'),'lesson '+lesson.id+' '+q.id);}
  }
  for(const [prompt,...answers] of topicQuestions[lesson.pack]){assert.ok(prompt.length>5);assert.equal(new Set(answers).size,answers.length,'lesson '+lesson.id+' ambiguous choices');}
 }
});

test('ML small exhaustive domains: binary baseline and confusion matrices',()=>{
 for(let n=1;n<=8;n++)for(let mask=0;mask<2**n;mask++) {
  const labels=Array.from({length:n},(_,i)=>(mask>>i)&1),ones=labels.filter(x=>x===1).length;
  assert.ok(checkOutput('ml-baseline',{labels},ones>n-ones?1:0));
 }
 const n=3;
 for(let labels=0;labels<2**n;labels++)for(let scores=0;scores<3**n;scores++)for(const threshold of [0.25,0.5,0.75]) {
  const y=Array.from({length:n},(_,i)=>(labels>>i)&1),p=Array.from({length:n},(_,i)=>Math.floor(scores/3**i)%3/2),prediction=p.map(v=>v>=threshold?1:0);
  const tp=y.filter((v,i)=>v===1&&prediction[i]===1).length,fp=y.filter((v,i)=>v===0&&prediction[i]===1).length,fn=y.filter((v,i)=>v===1&&prediction[i]===0).length,tn=n-tp-fp-fn;
  const precision=tp+fp?tp/(tp+fp):0,recall=tp+fn?tp/(tp+fn):0;
  assert.ok(checkOutput('ml-confusion',{y,p,threshold},{tp,fp,fn,tn,precision,recall,f1:tp+fp+fn?2*tp/(2*tp+fp+fn):0,accuracy:(tp+tn)/n}));
 }
});

test('ML capstone score boundaries and mutation evidence',()=>{
 const a=createCapstone(123);a.codesPassed=['ml-preprocess','ml-churn-fit','ml-confusion'];a.essay=Object.fromEntries(Object.keys(a.essay).map(k=>[k,'Phân tích đã viết.']));
 assert.deepEqual(a.tasks['ml-churn-fit'].X,oracle('ml-preprocess',a.tasks['ml-preprocess']).train);
 assert.deepEqual(a.tasks['ml-confusion'].p,oracle('ml-churn-fit',a.tasks['ml-churn-fit']).probabilities);
 // 60 code + 20 trace = 80 exactly; text is required but AI does not grade it.
 a.answers=Object.fromEntries(a.questions.slice(2).map(q=>[q.id,q.answerId]));
 assert.equal(gradeCapstone(a).score,80);assert.ok(gradeCapstone(a).passed);
 a.answers[a.questions[2].id]='wrong';assert.equal(gradeCapstone(a).score,75);assert.ok(!gradeCapstone(a).passed);
 a.answers=Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]));a.codesPassed.pop();assert.ok(!gradeCapstone(a).passed);
 a.codesPassed.push('ml-confusion');a.essay.problem='';assert.ok(!gradeCapstone(a).passed);
 const inputs=[['ml-preprocess',{train:[[2],[null],[4]],test:[[100],[null]]}],['ml-churn-fit',{X:[[0],[2]],y:[0,1],query:[[1]],k:1,threshold:0.7}],['ml-churn-fit',{X:[[0],[1],[2]],y:[0,1,1],query:[[1]],k:3,threshold:0.7}],['ml-confusion',{y:[1,1,0],p:[0.5,0.1,0.8],threshold:0.5}]];
 const tests=inputs.map(([problemId,input])=>({problemId,input,expected:oracle(problemId,input)})),score=customTestScore(tests);
 assert.equal(score.score,10);assert.ok(score.killed.length>=4);assert.equal(score.errors.length,0);
});
