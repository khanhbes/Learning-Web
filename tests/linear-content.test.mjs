import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as linear from '../content/linear/index.mjs';
import {dot,norm,rank,rref,matvec,determinant,near} from '../content/linear/problems.mjs';

test('Linear: all ten original images verified, mapped and auditable',async()=>{
 assert.equal(linear.sourceCatalog.length,10);assert.equal(new Set(linear.sourceCatalog.map(s=>s.id)).size,10);
 for(const s of linear.sourceCatalog){assert.equal(s.courseId,'linear');assert.equal(s.reviewed,true);assert.match(s.path,/study documents\/Đại số tuyến tính\//);assert.equal(createHash('sha256').update(await readFile(new URL('../'+s.path,import.meta.url))).digest('hex'),s.sha256);assert.ok(s.lessonIds.length>0);assert.ok(s.topics.length>0);assert.ok(s.lessonIds.every(id=>linear.lessons.some(l=>l.id===id)));}
 assert.equal(linear.lessons.filter(l=>l.id<=28).length,28);assert.equal(linear.lessons.filter(l=>l.kind==='advanced').length,8);assert.equal(linear.lessons.filter(l=>l.kind==='exam').length,4);
 assert.deepEqual(linear.lessons.filter(l=>l.kind==='exam').map(l=>l.id),[7,14,21,28]);
 for(const lesson of linear.lessons){assert.equal(lesson.courseId,'linear');assert.equal(lesson.activityCount,8);assert.ok(lesson.blocks.length>=6);assert.ok(lesson.sourcePrefixes.every(p=>linear.sourceCatalog.some(s=>s.prefix===p)));assert.ok(lesson.blocks.every(b=>b.label));assert.ok(lesson.visualData.scene);assert.ok(lesson.visualData.xLabel);assert.ok(lesson.visualData.alt.length>30);assert.ok(lesson.problemIds.every(id=>linear.problems[id]));}
 assert.equal(linear.knowledgeTipRows.length,20);assert.equal(linear.knowledgeInterviewRows.length,20);
 for(const row of [...linear.knowledgeTipRows,...linear.knowledgeInterviewRows]){assert.equal(row.length,9);assert.equal(new Set(row.slice(3,7)).size,4);assert.ok(linear.knowledgeLessonIds[row[0]]);assert.ok(linear.sourceCatalog.some(s=>s.prefix===row[8]));}
});

test('Linear: 6800 generated inputs, finite outputs, stable seeds and strict checkers',()=>{
 for(const id of linear.problemIds){assert.ok(linear.solutions[id].includes('def solve(data)'));assert.equal(linear.problems[id].runtime,'ml-python');assert.equal(linear.problemDetails(id).tolerance.absolute,1e-7);
  for(let seed=0;seed<200;seed++){const input=linear.generateInput(id,seed),snapshot=structuredClone(input),output=linear.oracle(id,input);assert.deepEqual(linear.generateInput(id,seed),input);assert.equal(linear.checkOutput(id,input,output),true,id+' seed'+seed);assert.equal(linear.checkOutput(id,input,'invalid'),false);assert.equal(linear.checkOutput(id,input,undefined),false);assert.doesNotThrow(()=>JSON.parse(JSON.stringify(output)));assert.deepEqual(input,snapshot,'oracle must not mutate input');if(linear.capstoneProblems.includes(id))assert.equal(linear.validCustomInput(id,input),true);
   assert.equal(linear.checkOutput(id,input,{pass:true}),false);assert.equal(linear.checkOutput(id,input,NaN),false);
  }
  for(const input of linear.edgeInputs[id]??[])assert.equal(linear.checkOutput(id,input,linear.oracle(id,input)),true,id+' edge');
  const trace=linear.traceFor(id,linear.generateInput(id,'trace'));assert.equal(trace.kind,'linear');assert.ok(trace.frames.length>=2);assert.ok(trace.frames.every(frame=>frame.caption));
 }
});

test('Linear: 7200 activity variants preserve answer IDs and semantic JSON grading',()=>{
 for(const lesson of linear.lessons)for(let seed=0;seed<200;seed++){const lab=linear.createLab(lesson,seed),safe=linear.publicLab(lab);assert.equal(lab.questions.length,8);assert.equal(new Set(lab.questions.map(q=>q.id)).size,8);for(let i=0;i<lab.questions.length;i++){const q=lab.questions[i];assert.equal(linear.checkLab(q,q.kind==='output'?JSON.stringify(q.answer):q.answer),true);assert.equal(linear.checkLab(q,'invalid'),false);assert.ok(!Object.hasOwn(safe.questions[i],'answer'));assert.ok(!Object.hasOwn(safe.questions[i],'explanation'));}for(const row of linear.topicQuestions[lesson.pack])assert.equal(new Set(row.slice(1)).size,row.length-1);}
});

test('Linear: independent exhaustive 2x2 integer determinant/rank/conditioning oracle',()=>{
 for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let c=-2;c<=2;c++)for(let d=-2;d<=2;d++){
  const A=[[a,b],[c,d]],det=a*d-b*c,expectedRank=det!==0?2:[a,b,c,d].some(x=>x!==0)?1:0;
  assert.equal(linear.oracle('linear-determinant',{A}),det);assert.equal(linear.oracle('linear-rank',{A}),expectedRank);assert.equal(linear.oracle('linear-condition',{A})===null,det===0);
  if(det!==0){const inv=linear.oracle('linear-inverse',{A});assert.ok(near([[a*inv[0][0]+b*inv[1][0],a*inv[0][1]+b*inv[1][1]],[c*inv[0][0]+d*inv[1][0],c*inv[0][1]+d*inv[1][1]]],[[1,0],[0,1]]));}
 }
});

test('Linear: independent permutation 3x3 determinant and centered least squares',()=>{
 const permutations=[[0,1,2,1],[0,2,1,-1],[1,0,2,-1],[1,2,0,1],[2,0,1,1],[2,1,0,-1]];
 for(let seed=0;seed<200;seed++){const A=linear.generateInput('linear-cayley',seed).A,B=[[...A[0],seed%5],[...A[1],seed%3],[seed%2,1,-2]],det=permutations.reduce((s,[i,j,k,sign])=>s+sign*B[0][i]*B[1][j]*B[2][k],0);assert.equal(linear.oracle('linear-determinant',{A:B}),det);
  const input=linear.generateInput('linear-least-squares',seed),out=linear.oracle('linear-least-squares',input),mx=input.x.reduce((s,v)=>s+v,0)/input.x.length,my=input.y.reduce((s,v)=>s+v,0)/input.y.length,slope=input.x.reduce((s,x,i)=>s+(x-mx)*(input.y[i]-my),0)/input.x.reduce((s,x)=>s+(x-mx)**2,0);
  assert.ok(near(out.slope,slope));assert.ok(near(out.intercept,my-slope*mx));assert.ok(near(input.y.reduce((s,y,i)=>s+(y-out.predictions[i]),0),0));assert.ok(near(input.y.reduce((s,y,i)=>s+(y-out.predictions[i])*input.x[i],0),0));
 }
});

test('Linear: source errata regressions and genuine step-by-step elimination',()=>{
 const A=[[1,2,-1],[2,4,1],[3,6,0]];assert.equal(rank(A),2);assert.deepEqual(rref(A).matrix,[[1,2,0],[0,0,1],[0,0,0]]);
 const system={A:[[1,1,1],[2,1,-1],[1,-1,2]],b:[6,3,3]};assert.equal(linear.checkOutput('linear-solve',system,[9/7,18/7,15/7]),true);assert.equal(linear.checkOutput('linear-solve',system,[27/7,-6/7,15/7]),false);
 assert.equal(determinant([[1,2,3],[0,1,4],[5,6,0]]),1);assert.deepEqual(linear.oracle('linear-cayley',{A:[[2,1],[1,2]]}),{square:[[5,4],[4,5]],trace:4,det:3,residual:[[0,0],[0,0]]});assert.equal(linear.checkOutput('linear-cayley',{A:[[2,1],[1,2]]},[[0,0],[0,0]]),false);
 const trace=linear.traceFor('linear-rref',{A});assert.ok(trace.frames.length>4);assert.deepEqual(trace.frames[0].matrix,A);assert.deepEqual(trace.frames.at(-1).matrix,rref(A).matrix);assert.notDeepEqual(trace.frames[1].matrix,A);
 assert.ok(linear.corrections.some(c=>c.id==='LINEAR-E03'));assert.ok(linear.corrections.some(c=>c.id==='LINEAR-E06'));
});

test('Linear: accepts equivalent solutions, eigen/PCA/QR signs and every valid column basis',()=>{
 const s=Math.SQRT1_2,e={A:[[2,1],[1,2]]};assert.equal(linear.checkOutput('linear-eigenpairs',e,{values:[3,1],vectors:[[-s,-s],[-s,s]]}),true);assert.equal(linear.checkOutput('linear-eigenpairs',e,{values:[1,3],vectors:[[0,0],[s,s]]}),false);assert.equal(linear.checkOutput('linear-eigenpairs',e,{values:[1,1],vectors:[[s,-s],[-s,s]]}),false);
 const input={A:[[1,0,1],[0,1,1]]};for(const columns of [[0,1],[0,2],[1,2],[2,1]])assert.equal(linear.checkOutput('linear-column-basis',input,columns),true);for(const columns of [[0,0],[0],[3,1],[0.00001,1]])assert.equal(linear.checkOutput('linear-column-basis',input,columns),false);
 const infinite={A:[[1,1],[2,2]],b:[3,6]};assert.equal(linear.checkOutput('linear-solve-report',infinite,{status:'infinite',rank:1,nullity:1,solution:[1,2]}),true);assert.equal(linear.checkOutput('linear-solve-report',infinite,{status:'infinite',rank:1,nullity:1,solution:[3,0]}),true);assert.equal(linear.checkOutput('linear-solve-report',infinite,{status:'infinite',rank:1.00000001,nullity:1,solution:[1,2]}),false);
 const pca={points:[[-1,-2],[0,0],[1,2]]},direction=linear.oracle('linear-pca-direction',pca);assert.equal(linear.checkOutput('linear-pca-direction',pca,direction.map(x=>-x)),true);assert.equal(linear.checkOutput('linear-pca-direction',pca,[0,0]),false);
 const isotropic={points:[[1,0],[-1,0],[0,1],[0,-1]]};assert.equal(linear.checkOutput('linear-pca-direction',isotropic,[s,s]),true);
 const qrInput={A:[[1,1],[0,1]]};assert.equal(linear.checkOutput('linear-qr',qrInput,{Q:[[-1,0],[0,1]],R:[[-1,-1],[0,1]]}),true);assert.equal(linear.checkOutput('linear-qr',qrInput,{Q:[[1,0],[0,1]],R:[[1,0],[1,1]]}),false);
 for(const id of ['linear-qr','linear-solve-report','linear-least-squares']){const d=linear.generateInput(id,3);assert.equal(linear.checkOutput(id,d,null),false);assert.equal(linear.checkOutput(id,d,undefined),false);assert.equal(linear.checkOutput(id,d,{solution:[Infinity,0]}),false);}
 assert.equal(linear.checkOutput('linear-rank',{A:[[1]]},1.00000001),false);assert.equal(linear.checkOutput('linear-shape',{A:[[1]]},[1,1.00000001]),false);
});

test('Linear: canonical trace questions and vocabulary follow the lesson stage',()=>{
 for(const id of linear.problemIds)for(let seed=0;seed<200;seed++){const q=linear.traceQuestion(id,seed);assert.equal(new Set([q.answer,...q.wrongAnswers].map(JSON.stringify)).size,3);assert.ok(q.answer===null||typeof q.answer==='number'||typeof q.answer==='string');assert.ok(q.prompt.includes('4 chữ số'));assert.deepEqual(q,linear.traceQuestion(id,seed));}
 const first=linear.createLab(linear.lessons[0],0).questions.find(q=>q.kind==='match');assert.deepEqual(first.pairs.map(p=>p.left),['Hoành độ x','Tung độ y','Hệ số vô hướng']);assert.ok(!first.pairs.some(p=>/Pivot|Residual|Cơ sở/.test(p.left)));
 const elimination=linear.createLab(linear.lessons[15],0).questions.find(q=>q.kind==='match');assert.ok(elimination.pairs.some(p=>p.left==='Pivot'));
 const projection=linear.createLab(linear.lessons[21],0).questions.find(q=>q.kind==='match');assert.ok(projection.pairs.some(p=>p.left==='Residual'));
 assert.ok(linear.lessons[5].blocks.some(b=>b.problemId==='linear-matrix-add'));
});

test('Linear: capstone pass boundary, required code/essay and mutant evidence',()=>{
 const a=linear.createCapstone(100);assert.equal(a.courseId,'linear');assert.equal(a.lessonId,28);assert.equal(a.version,linear.VERSION);assert.deepEqual(Object.keys(a.tasks),linear.capstoneProblems);
 a.codesPassed=[...linear.capstoneProblems];a.essay=Object.fromEntries(linear.essayFields.map(f=>[f.id,'Phân tích của người học.']));a.answers=Object.fromEntries(a.questions.slice(2).map(q=>[q.id,q.answerId]));assert.equal(linear.gradeCapstone(a).score,80);assert.equal(linear.gradeCapstone(a).passed,true);
 a.answers[a.questions[2].id]='wrong';assert.equal(linear.gradeCapstone(a).score,75);assert.equal(linear.gradeCapstone(a).passed,false);a.answers=Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]));a.codesPassed.pop();assert.equal(linear.gradeCapstone(a).passed,false);a.codesPassed=[...linear.capstoneProblems];a.essay.problem='';assert.equal(linear.gradeCapstone(a).passed,false);
 const fixtures=[['linear-transform-batch',{A:[[2,1],[0,1]],b:[1,-1],points:[[1,2],[0,0]]}],['linear-solve-report',{A:[[1,1,0],[2,2,0]],b:[3,6]}],['linear-solve-report',{A:[[1,1],[2,2]],b:[3,7]}],['linear-least-squares',{x:[0,1,2],y:[1,4,5]}]],tests=fixtures.map(([problemId,input])=>({problemId,input,expected:linear.oracle(problemId,input)}));const report=linear.customTestScore(tests);assert.equal(report.score,10);assert.ok(report.killed.length>=4);assert.equal(report.errors.length,0);
 assert.equal(linear.customTestScore([{...tests[0],expected:[[0,0],[0,0]]}]).score,0);assert.equal(linear.validCustomInput('linear-solve-report',{A:[[NaN]],b:[1]}),false);assert.equal(linear.validCustomInput('linear-least-squares',{x:[1,1,1],y:[1,2,3]}),false);assert.equal(linear.validCustomInput('linear-transform-batch',{A:[[1],[0]],b:[0,0],points:[]}),false);
 const undetectable={problemId:'linear-transform-batch',input:{A:[[1,0],[0,1]],b:[0,0],points:[[1,2]]},expected:[[1,2]]};assert.deepEqual(linear.customTestScore([undetectable]).killed,[],'identity input cannot distinguish transpose/no translation mutants');
 for(let seed=0;seed<200;seed++)for(const q of linear.capstoneQuestions(seed))assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length,'only one canonical MC answer');
});
