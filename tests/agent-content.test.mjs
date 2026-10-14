import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import * as agent from '../content/agent/index.mjs';

test('Agent: teaching diagrams show only the states used by the selected architecture',()=>{
 for(const [id,states] of [['agent-reflex',['observe','policy','finish']],['agent-state',['observe','memory','finish']],['agent-goal-path',['observe','plan','finish']]]) {
  const trace=agent.traceFor(id,agent.problems[id].sampleInput);
  for(const frame of trace.frames) {
   assert.deepEqual(frame.nodes.map(n=>n.id),states);
   assert.ok(frame.edges.every(edge=>edge.every(node=>states.includes(node))));
   assert.equal(frame.nodes.filter(n=>n.status==='active').length,1);
  }
 }
});
import {validateContent} from '../content/schema.mjs';

test('Agent: all eight original images mapped; 24 mandatory+8 optional rich lessons',()=>{
 assert.deepEqual(validateContent({course:agent.course,lessons:agent.lessons,problems:agent.problems,sources:agent.sourceCatalog}),{lessons:32,problems:22,sources:8});
 assert.equal(agent.course.mandatoryLessons,24);assert.equal(agent.course.advancedLessons,8);
 assert.equal(agent.course.runtime,'ml-python');assert.deepEqual(agent.course.languages,['python']);
 assert.deepEqual(agent.lessons.filter(l=>l.kind==='exam').map(l=>l.id),[8,16,24]);
 assert.equal(readdirSync('study documents/AI Agent').filter(f=>/\.(png|jpe?g)$/i.test(f)).length,8);
 assert.equal(new Set(agent.sourceCatalog.map(s=>s.sha256)).size,8);
 for(const s of agent.sourceCatalog){assert.equal(createHash('sha256').update(readFileSync(s.path)).digest('hex'),s.sha256);assert.ok(s.lessonIds.length&&s.reviewIds.length&&s.interviewIds.length);assert.equal(s.courseId,'agent');}
 for(const l of agent.lessons){assert.equal(l.courseId,'agent');assert.ok(l.blocks.length>=7);assert.equal(l.activityCount,8);assert.equal(l.visualization.kind,'agent');assert.ok(l.visualization.input&&l.visualization.notice);assert.equal(l.problemIds.length,l.kind==='exam'?2:1);for(const pid of l.problemIds)assert.ok(agent.solutions[pid]);for(const prefix of l.sourcePrefixes)assert.ok(agent.sourceCatalog.find(s=>s.prefix===prefix).lessonIds.includes(l.id));}
 assert.equal(agent.knowledgeTipRows.length,16);assert.equal(agent.knowledgeInterviewRows.length,24);
 for(const r of [...agent.knowledgeTipRows,...agent.knowledgeInterviewRows]){assert.equal(r.length,9);assert.equal(new Set(r.slice(3,7)).size,4,r[1]);assert.ok(agent.sourceCatalog.some(s=>s.prefix===r[8]));assert.ok(agent.knowledgeLessonIds[r[0]]);}
 assert.ok(agent.corrections.length>=8);assert.match(agent.corrections.find(c=>c.id==='AGENT-E04').after,/coordinator/);assert.match(agent.corrections.find(c=>c.id==='AGENT-E03').after,/không đồng nghĩa/);
});

test('Agent: 200 seeds of all22 templates independently agree with trusted Python reference',()=>{
 const fixtures=[];
 for(const pid of agent.problemIds){for(let seed=0;seed<200;seed++){const input=agent.generateInput(pid,seed);assert.deepEqual(input,agent.generateInput(pid,seed));assert.ok(agent.checkOutput(pid,input,agent.oracle(pid,input)));assert.ok(!agent.checkOutput(pid,input,{pass:true}),pid);fixtures.push({id:pid,input});}for(const t of agent.testsFor(pid,'verified')){assert.ok(agent.checkOutput(pid,t.input,t.expected));fixtures.push({id:pid,input:t.input});}}
 // Execute repository-authored trusted references only. Student code uses the isolated browser runtime.
 const script=`import json,sys\np=json.load(sys.stdin)\nf={}\nfor name,source in p['solutions'].items():\n scope={}\n exec(compile(source,'reference:'+name,'exec'),scope)\n f[name]=scope['solve']\njson.dump([f[t['id']](t['input']) for t in p['fixtures']],sys.stdout,allow_nan=False)\n`;
 const run=spawnSync(process.env.BYTEPATH_TEST_PYTHON||'python',['-I','-c',script],{input:JSON.stringify({solutions:agent.solutions,fixtures}),encoding:'utf8',timeout:120000,maxBuffer:32*1024*1024});
 assert.equal(run.status,0,run.stderr||run.error?.message);const outputs=JSON.parse(run.stdout);assert.equal(outputs.length,fixtures.length);fixtures.forEach((f,i)=>assert.ok(agent.checkOutput(f.id,f.input,outputs[i]),f.id+' fixture'+i));
});

test('Agent: 6400 activity variants have eight kinds/identity answers and no leaked public solutions',()=>{
 for(const lesson of agent.lessons)for(let seed=0;seed<200;seed++){
  const lab=agent.createLab(lesson,seed),publicLab=agent.publicLab(lab);assert.equal(lab.questions.length,8);assert.equal(new Set(lab.questions.map(q=>q.id)).size,8);
  for(let i=0;i<lab.questions.length;i++){const q=lab.questions[i];assert.ok(agent.checkLab(q,q.kind==='output'?JSON.stringify(q.answer):q.answer),'lesson'+lesson.id+' '+q.id);assert.ok(!agent.checkLab(q,'wrong'));assert.ok(!Object.hasOwn(publicLab.questions[i],'answer'));assert.ok(!Object.hasOwn(publicLab.questions[i],'explanation'));}
 }
 for(const l of agent.lessons)for(const row of agent.topicQuestions[l.pack])assert.equal(new Set(row.slice(1)).size,row.length-1,row[0]);
});

test('Agent: independently enumerate small graphs to verify shortest path and alternative acceptance',()=>{
 const names=['A','B','C'],possible=names.flatMap(a=>names.filter(b=>b!==a).map(b=>[a,b]));
 const enumerate=(graph,start,goal)=>{const paths=[],visit=path=>{const last=path.at(-1);if(last===goal){paths.push(path);return;}for(const next of graph[last])if(!path.includes(next))visit([...path,next]);};visit([start]);return paths;};
 for(let mask=0;mask<2**possible.length;mask++){
  const graph=Object.fromEntries(names.map(n=>[n,[]]));possible.forEach(([a,b],i)=>{if(mask&(1<<i))graph[a].push(b);});
  for(const start of names)for(const goal of names){const d={graph,start,goal},paths=enumerate(graph,start,goal),min=paths.length?Math.min(...paths.map(p=>p.length)):null,output=agent.oracle('agent-goal-path',d);assert.equal(output?.length??null,min);for(const p of paths)assert.equal(agent.checkOutput('agent-goal-path',d,p),p.length===min);}
 }
 const d={graph:{A:['B','C'],B:['D'],C:['D'],D:[]},start:'A',goal:'D'};assert.ok(agent.checkOutput('agent-goal-path',d,['A','C','D']));assert.ok(!agent.checkOutput('agent-goal-path',d,['A','D']));assert.ok(!agent.checkOutput('agent-goal-path',d,['A','B','D','D']));
});

test('Agent: exhaustive tiny dependency graphs and policy boundaries check rule ordering',()=>{
 const tasks=['A','B','C'],possible=tasks.flatMap(a=>tasks.map(b=>[a,b])),permutations=[['A','B','C'],['A','C','B'],['B','A','C'],['B','C','A'],['C','A','B'],['C','B','A']];
 for(let mask=0;mask<2**possible.length;mask++){const edges=possible.filter((_,i)=>mask&(1<<i)),valid=permutations.filter(p=>edges.every(([a,b])=>p.indexOf(a)<p.indexOf(b)));assert.deepEqual(agent.oracle('agent-dependencies',{tasks,edges}),valid[0]??null);}
 for(const exists of [false,true])for(const allowed of [false,true])for(const risky of [false,true])for(const approved of [false,true]){
  const d={tools:exists?[{id:'t',scope:'read',risky}]:[],calls:[{id:'C',tool:'t'}],allowedScopes:allowed?['read']:[],approved:approved?['C']:[]};assert.deepEqual(agent.oracle('agent-policy',d),[{id:'C',decision:!exists||!allowed?'deny':risky&&!approved?'approval':'allow'}]);
 }
});

test('Agent: regressions for zeros, unknown observations, priorities, ties and malformed outputs',()=>{
 assert.deepEqual(agent.oracle('agent-observe',{fields:['x','y'],observations:[{field:'x',value:false},{field:'y',value:0}]}),{x:false,y:0});
 assert.deepEqual(agent.oracle('agent-state',{memory:{A:true},observations:[{cell:'A',dirty:false},{cell:'A',dirty:null},{cell:'B',dirty:null}]}),{A:false});
 assert.deepEqual(agent.oracle('agent-reflex',{reserve:20,percepts:[{battery:19,dirty:true},{battery:20,dirty:true},{battery:20,dirty:false}]}),['charge','clean','move']);
 assert.deepEqual(agent.oracle('agent-utility',{weights:{quality:2,time:1,risk:3},actions:[{id:'A',quality:8,time:4,risk:1}]}),{id:'A',score:9});
 assert.deepEqual(agent.oracle('agent-assign',{workers:[{id:'B',skills:['x'],load:0},{id:'A',skills:['x'],load:0}],tasks:[{id:'0',skill:'x'},{id:'1',skill:'x'}]}),{assignments:[{task:'0',worker:'A'},{task:'1',worker:'B'}],loads:{B:1,A:1}});
 assert.deepEqual(agent.oracle('agent-feedback',{actions:['A','B'],feedback:[{action:'A',reward:-1}]}),{means:{A:-1,B:null},best:'A'});
 assert.deepEqual(agent.oracle('agent-schema',{schemas:{f:['x']},calls:[{tool:'f',args:{x:0}},{tool:'f',args:{x:true}},{tool:'f',args:{x:1,extra:0}},{tool:'f',args:{x:Infinity}}]}),[true,false,false,false]);
 assert.deepEqual(agent.oracle('agent-retrieval',{query:['x','x'],docs:[{id:'B',tokens:['x','x']},{id:'A',tokens:['x']}],k:2}),[{id:'A',score:1},{id:'B',score:1}]);
 assert.deepEqual(agent.oracle('agent-context',{messages:[{id:'A',cost:2},{id:'B',cost:9}],limit:8,reserved:0}),[]);
 assert.deepEqual(agent.oracle('agent-loop',{outcomes:['success'],maxSteps:1}),{steps:1,status:'done'});
 assert.deepEqual(agent.oracle('agent-retry',{outcomes:['permanent','success'],maxAttempts:2}),{attempts:1,status:'failed'});
 assert.equal(agent.oracle('agent-votes',{votes:['A','A','abstain','abstain']}),null);
 assert.deepEqual(agent.oracle('agent-coverage',{expected:['A','A','B'],retrieved:['A','A']}),{hits:1,total:2,recall:0.5});
 assert.deepEqual(agent.oracle('agent-evaluate',{expected:[true,false],actual:[true,true]}),{tp:1,fp:1,fn:0,tn:0,precision:0.5,recall:1});
 for(const pid of agent.problemIds){const d=agent.generateInput(pid,'bad-output'),correct=agent.oracle(pid,d);assert.ok(!agent.checkOutput(pid,d,JSON.stringify(correct)));if(correct!==null)assert.ok(!agent.checkOutput(pid,d,null));if(Array.isArray(correct))assert.ok(!agent.checkOutput(pid,d,[...correct,null]));if(correct&&typeof correct==='object'&&!Array.isArray(correct))assert.ok(!agent.checkOutput(pid,d,{...correct,extra:true}));}
 assert.ok(!agent.checkOutput('agent-evaluate',{expected:[true],actual:[true]},{tp:1.00000001,fp:0,fn:0,tn:0,precision:1,recall:1}));
});

test('Agent: real trace frames derive meaningful intermediate state and finish with oracle output',()=>{
 for(const pid of agent.problemIds)for(let seed=0;seed<200;seed++){
  const input=agent.generateInput(pid,seed),before=structuredClone(input),trace=agent.traceFor(pid,input);assert.deepEqual(input,before);assert.equal(trace.kind,'agent');assert.ok(trace.frames.length>=2);assert.deepEqual(trace.result,agent.oracle(pid,input));assert.deepEqual(trace.frames.at(-1).result,trace.result);
  for(const f of trace.frames){assert.ok(f.label&&f.activeNode&&f.nodes.some(n=>n.id===f.activeNode));assert.ok(Array.isArray(f.entries));}
 }
 const trace=agent.traceFor('agent-state',{memory:{A:true},observations:[{cell:'A',dirty:false},{cell:'A',dirty:null}]});assert.deepEqual(trace.frames[1].memory,{A:false});assert.deepEqual(trace.frames[2].memory,{A:false});
});

test('Agent: capstone connected fixtures,80% boundary, three code/essay gates and mutation evidence',()=>{
 const a=agent.createCapstone(100);assert.equal(a.courseId,'agent');for(const pid of agent.capstoneProblems)assert.ok(agent.validCustomInput(pid,a.tasks[pid]));
 assert.deepEqual(a.tasks['agent-evaluate'].expected,agent.oracle('agent-policy',a.tasks['agent-policy']).map(c=>c.decision==='allow'));
 a.codesPassed=[...agent.capstoneProblems];a.essay=Object.fromEntries(agent.essayFields.map(f=>[f.id,'Bài luận của tôi.']));a.answers=Object.fromEntries(a.questions.slice(2).map(q=>[q.id,q.answerId]));
 assert.equal(agent.gradeCapstone(a).score,80);assert.ok(agent.gradeCapstone(a).passed);a.answers[a.questions[2].id]='wrong';assert.equal(agent.gradeCapstone(a).score,75);assert.ok(!agent.gradeCapstone(a).passed);
 a.answers=Object.fromEntries(a.questions.map(q=>[q.id,q.answerId]));a.codesPassed.pop();assert.ok(!agent.gradeCapstone(a).passed);a.codesPassed=[...agent.capstoneProblems];a.essay.problem='';assert.ok(!agent.gradeCapstone(a).passed);
 const fixtures=[['agent-dependencies',{tasks:['A','B'],edges:[['B','A']]}],['agent-dependencies',{tasks:['A'],edges:[['A','A']]}],['agent-policy',{tools:[{id:'erase',scope:'delete',risky:true},{id:'publish',scope:'write',risky:true}],allowedScopes:['write'],approved:['C'],calls:[{id:'C',tool:'erase'},{id:'D',tool:'publish'},{id:'E',tool:'missing'}]}],['agent-evaluate',{expected:[true,false,false],actual:[true,true,true]}]];
 const tests=fixtures.map(([problemId,input])=>({problemId,input,expected:agent.oracle(problemId,input)})),score=agent.customTestScore(tests);assert.equal(score.score,10);assert.equal(score.errors.length,0);assert.ok(score.killed.length>=4);
 assert.equal(agent.customTestScore([{...tests[0],expected:{pass:true}}]).score,0);
 assert.ok(!agent.validCustomInput('agent-evaluate',{expected:[true],actual:[1]}));assert.ok(!agent.validCustomInput('agent-dependencies',{tasks:['A'],edges:[['A','missing']]}));assert.ok(!agent.validCustomInput('agent-policy',{tools:[{id:'t',scope:'read',risky:'false'}],calls:[],approved:[],allowedScopes:['read']}));
 const noFault={tools:[{id:'t',scope:'read',risky:false}],calls:[{id:'C',tool:'t'}],approved:[],allowedScopes:['read']};assert.deepEqual(agent.customTestScore([{problemId:'agent-policy',input:noFault,expected:agent.oracle('agent-policy',noFault)}]).killed,[]);
});
