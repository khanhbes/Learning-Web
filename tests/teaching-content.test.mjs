import test from 'node:test';
import assert from 'node:assert/strict';
import {courseRegistry} from '../content/registry.mjs';
import {bridges,getBridge,checkBridge} from '../content/pedagogy/bridges.mjs';
import {TEACHING_VERSION,ASSESSMENT_VERSION,ACTIVITY_IDS,displayValue,initialLearningProgress} from '../content/pedagogy/engine.mjs';
import {newAttempt,publicAttempt} from '../server/assessment.mjs';
import {workedTrace} from '../content/pedagogy/worked.mjs';
const valueFor=q=>['number','output'].includes(q.kind)?JSON.stringify(q.answer):q.answer;

test('All registered lessons have authored teaching, specific algorithms, bridges, minimal examples and eight embedded tasks',()=>{
  let count=0,exams=0;
  for(const [id,def]of Object.entries(courseRegistry)){
    const algorithms=[];
    for(const l of def.lessons){
      if(l.kind==='exam'){exams++;assert.equal(def.teachingFlow(l),null);continue;}
      count++;
      const d=def.teachingDesigns[l.id],f=def.teachingFlow(l);
      assert.equal(f.version,TEACHING_VERSION);
      assert.ok(d.goals.length>=2&&d.goals.length<=3,id+l.id);
      assert.ok(d.algorithm.length>=3&&d.algorithm.length<=6,id+l.id);
      assert.ok(d.vocabulary.length>=2,id+l.id);
      assert.equal(new Set(d.vocabulary.map(v=>v.term)).size,d.vocabulary.length);
      for(const term of d.vocabulary)for(const field of ['term','definition','example'])assert.ok(term[field]?.trim(),id+l.id+' '+field);
      assert.ok(f.prerequisites.every(b=>Object.hasOwn(bridges,b)),id+l.id+' bridge');
      assert.deepEqual(f.steps.filter(s=>s.activityId).map(s=>s.activityId),ACTIVITY_IDS);
      assert.equal(new Set(f.steps.map(s=>s.id)).size,f.steps.length);
      assert.ok(def.checkOutput(f.sample.problemId,f.sample.input,f.sample.output),id+l.id+' example');
      assert.equal(f.steps.find(s=>s.id==='model').visual.input,f.sample.input);
      assert.ok(d.misconception.wrong&&d.misconception.why&&d.misconception.repair);
      for(const [kind,row]of Object.entries(d.checks)){
        assert.ok(row.length>=4,id+l.id+' '+kind);
        assert.ok(!row.slice(2,-1).includes(row[1]),id+l.id+' duplicate correct');
        assert.ok(!row.slice(1,-1).some(t=>/điểm XP|bảng xếp hạng|theo số gem|tăng XP|màu button|màu đẹp|tên mascot/i.test(t)),id+l.id+' distracting trivia');
      }
      algorithms.push(JSON.stringify(d.algorithm));
    }
    assert.ok(new Set(algorithms).size>=Math.floor(algorithms.length*.8),id+' repeated algorithms');
  }
  assert.equal(count,308);assert.equal(exams,32);
  const first=courseRegistry.linear.teachingFlow(1);
  assert.deepEqual(first.sample.input,{x:2,y:1});assert.deepEqual(first.sample.output,[2,1]);
  assert.ok(first.steps.find(s=>s.code).code.python.split('\n').length<=3);
  assert.match(first.steps.find(s=>s.code).code.python,/return \[data\['x'\], data\['y'\]\]/);
  for(const id of ['ml','da','agent'])assert.ok(courseRegistry[id].teachingFlow(1).prerequisites.includes('functions'));
});

for(const [id,def]of Object.entries(courseRegistry))test(`${id}: 200 seeds per lesson preserve all8 checked tasks and balanced uniquely-correct questions`,()=>{
  const optionSets=new Set();
  for(const l of def.lessons)for(let seed=0;seed<200;seed++){
    if(l.kind!=='exam'){
      const lab=def.createLab(l,seed);assert.equal(lab.version,2);assert.equal(lab.questions.length,8);
      for(const q of lab.questions){assert.equal(def.checkLab(q,valueFor(q)),true,id+l.id+' '+q.id+' '+seed);assert.equal(def.checkLab(q,'not-a-valid-result'),false);}
      assert.ok(new Set(lab.questions.map(q=>q.kind)).size>=4);
    }
    const a=newAttempt(l,'assessment',String(seed),'test',0,def),counts={};
    assert.equal(a.assessmentVersion,ASSESSMENT_VERSION);
    assert.equal(a.questions.length,l.kind==='exam'?10:5);
    for(const q of a.questions){
      counts[q.category]=(counts[q.category]??0)+1;
      assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);
      assert.equal(new Set(q.options.map(o=>o.text)).size,q.options.length);
      assert.equal(q.options.filter(o=>o.id===q.answerId).length,1);
      if(q.category==='trace'){
        assert.equal(q.options.find(o=>o.id===q.answerId).text,displayValue(q.traceAnswer));
        if(!['linear','git','docker'].includes(id))assert.ok(def.checkOutput(q.problemId,q.input,q.traceAnswer));
      }
      assert.ok(q.sourceLessonId<=l.id);
    }
    assert.deepEqual(counts,l.kind==='exam'?{concept:2,trace:3,apply:3,error:2}:{concept:1,trace:2,error:1,apply:1});
    if(l.id===1)optionSets.add(a.questions[0].answerId);
    const visible=publicAttempt(a);
    for(const q of visible.questions)for(const key of ['answerId','explanation','traceAnswer','feedbackByOption'])assert.equal(Object.hasOwn(q,key),false);
  }
  assert.ok(optionSets.size>150,'Answer IDs must vary with the seed');
});

test('Mathematical and snapshot anchors are independently verified; bridge diagnostics never expose answer fields',()=>{
  const find=(c,n,k)=>courseRegistry[c].teachingDesigns[n].checks[k][1];
  assert.equal(find('da',30,'concept'),String((10*1+20*3)/4));
  assert.equal(find('da',29,'concept'),String((60-50)/50*100)+'%');
  assert.equal(find('da',36,'concept'),String(5/20*100)+'%');
  assert.equal(find('da',15,'concept'),String(2*2));
  for(const [id,b]of Object.entries(bridges))for(const language of ['python','cpp']){
    const pub=getBridge(id,language);assert.equal(pub.tasks.length,2);assert.equal(b.questions.length,3);
    for(const q of [pub.diagnostic,...pub.tasks]){
      assert.equal(q.answer,undefined);assert.equal(q.explanation,undefined);
      for(const o of q.options){const result=checkBridge(id,q.id,o.id);assert.equal(result.valid,true);assert.equal(result.correct,o.text===b.questions.find(t=>t.id===q.id).answer);}
    }
  }
  const f=courseRegistry.dsa.teachingFlow(1);
  assert.equal(initialLearningProgress(f,{phase:'code',block:0}).stepId,'independent-code');
  assert.equal(initialLearningProgress(f,{phase:'visual',block:0}).stepId,'visual');
});

test('Worked traces use the displayed example, preserve zero/false, and show actual intermediate arithmetic',()=>{
  for(const def of Object.values(courseRegistry))for(const lesson of def.lessons.filter(l=>l.kind!=='exam')){
    const flow=def.teachingFlow(lesson),trace=flow.trace;
    assert.deepEqual(trace.input,flow.sample.input);assert.deepEqual(trace.result,flow.sample.output);
    assert.ok(trace.frames.length>=1&&trace.frames.length<=80);
    assert.ok(trace.frames.every(f=>f.caption));assert.doesNotThrow(()=>JSON.parse(JSON.stringify(trace)));
  }
  const ml=courseRegistry.ml,make=(pid,input)=>workedTrace(ml,{id:2},{problemId:pid,input,output:ml.oracle(pid,input)});
  assert.deepEqual(make('ml-mean',{values:[2,3,1]}).frames.filter(f=>f.state.count>0).map(f=>f.state.total),[2,5,6,6]);
  assert.deepEqual(make('ml-dot',{a:[2,3],b:[4,1]}).frames.slice(1).map(f=>f.state.total),[8,11]);
  assert.equal(make('ml-mse',{y:[2,0],pred:[1,2]}).frames.at(-1).state.mse,2.5);
  const confusion=make('ml-confusion',{y:[1,0,1,0],p:[.9,.8,.2,.1],threshold:.5});
  assert.equal(confusion.frames.length,6);
  assert.deepEqual(confusion.frames.slice(1,-1).map(f=>[f.state.tp,f.state.fp,f.state.fn,f.state.tn]),[[1,0,0,0],[1,1,0,0],[1,1,1,0],[1,1,1,1]]);
  const agent=courseRegistry.agent.teachingFlow(1);assert.equal(agent.sample.output.battery,0);assert.equal(agent.sample.output.dirty,false);assert.equal(agent.sample.output.temperature,null);
  assert.deepEqual(courseRegistry.linear.teachingFlow(1).trace.frames.map(f=>f.state),[{x:0,y:0},{x:2,y:0},{x:2,y:1},[2,1]]);
});
