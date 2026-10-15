import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonDesigns as da} from '../content/pedagogy/da.mjs';
import {lessonDesigns as git} from '../content/pedagogy/git.mjs';
import {lessonDesigns as agent} from '../content/pedagogy/agent.mjs';
import {lessonDesigns as linear} from '../content/pedagogy/linear.mjs';
import {oracle as agentOracle} from '../content/agent/problems.mjs';

test('specialized coaching has topic-specific goals and misconceptions, not legacy quiz placeholders',()=>{
 for(const [course,designs] of Object.entries({da,git,agent,linear}))for(const [id,design]of Object.entries(designs)){
  assert.ok(design.goals.length>=2 && design.goals.length<=3,`${course}/${id}: goals`);
  assert.ok(design.misconception.wrong.length>20,`${course}/${id}: complete misconception`);
  assert.doesNotMatch(design.misconception.wrong,/AI tự quyết định đáp án|Tên file final2|Một logo mới|Màu biểu đồ/);
  assert.notEqual(design.transfer.prompt,'Lỗi nào cần tránh trong bài này?');
  for(const check of Object.values(design.checks)){
   assert.equal(check.length,5,`${course}/${id}: prompt, three options, explanation`);
   assert.equal(new Set(check.slice(1,4)).size,3,`${course}/${id}: distinct choices`);
  }
 }
});

test('coordinate sample teaches only x, y, list order and return',()=>{
 assert.equal(linear[1].code.python,"def solve(data):\n    return [data['x'], data['y']]");
 assert.equal(linear[1].annotations.python.length,2);
 assert.match(linear[9].checks.apply[0],/vector cột/);
});

test('cofactor exercise does not claim the only remaining term is necessarily nonzero',()=>{
 // Expanding diag(1,0,4) along its last row leaves 4*C33, but C33=0.
 const minor=1*0-0*0;
 assert.equal(4*minor,0);
 assert.match(linear[11].checks.apply[0],/nhiều nhất/);
 assert.match(linear[11].checks.apply[4],/cofactor bằng 0/);
});

test('diagonalization reorder exercise explicitly uses distinct eigenvalues',()=>{
 // Swapping two eigenvectors in the repeated-eigenvalue matrix 2I is valid.
 const repeated=[[2,0],[0,2]], swappedP=[[0,1],[1,0]];
 const multiply=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((sum,x,k)=>sum+x*B[k][j],0)));
 assert.deepEqual(multiply(multiply(swappedP,repeated),swappedP),repeated);
 assert.match(linear[25].checks.error[0],/diag\(2,3\)/);
});

test('agent observation narration permits an explicitly observed null as well as a missing field',()=>{
 const input={fields:['battery','dirty','temperature'],observations:[{field:'battery',value:5},{field:'battery',value:0},{field:'dirty',value:null}]};
 assert.deepEqual(agentOracle('agent-observe',input),{battery:0,dirty:null,temperature:null});
 assert.match(agent[1].algorithm.join(' '),/0, false hoặc null/);
});

test('agent loop teaches all four terminal states and does not skip an error to reach later success',()=>{
 assert.deepEqual(agentOracle('agent-loop',{outcomes:['continue','error','success'],maxSteps:3}),{steps:2,status:'error'});
 assert.deepEqual(agentOracle('agent-loop',{outcomes:['continue'],maxSteps:3}),{steps:1,status:'exhausted'});
 assert.deepEqual(agentOracle('agent-loop',{outcomes:['continue','success'],maxSteps:2}),{steps:2,status:'done'});
 assert.deepEqual(agentOracle('agent-loop',{outcomes:['continue','continue'],maxSteps:2}),{steps:2,status:'limit'});
 assert.match(agent[22].algorithm.join(' '),/error/);
 assert.match(agent[22].checks.error[0],/chưa gặp success hay error/);
});

test('human handoff narration includes the independent step-limit boundary',()=>{
 const input={riskLimit:60,minConfidence:70,maxSteps:5,requests:[{id:'R',risk:10,confidence:90,steps:5}]};
 assert.deepEqual(agentOracle('agent-handoff',input),[{id:'R',decision:'human'}]);
 assert.match(agent[32].algorithm.join(' '),/steps≥maxSteps/);
 assert.equal(agent[32].checks.apply[1],'human vì đã chạm giới hạn bước');
});

test('assignment example explicitly gives every worker the required skill',()=>{
 const input={workers:[{id:'A',load:0,skills:['search']},{id:'B',load:0,skills:['search']}],tasks:[{id:'1',skill:'search'},{id:'2',skill:'search'},{id:'3',skill:'search'}]};
 assert.deepEqual(agentOracle('agent-assign',input).assignments.map(x=>x.worker),['A','B','A']);
 assert.match(agent[13].checks.concept[0],/đều có skill search/);
});

test('CI success is distinguished from every job running and passing',()=>{
 assert.match(git[29].checks.concept[1],/điều kiện thành công CI/);
 assert.match(git[29].misconception.why,/bị bỏ qua/);
 assert.match(git[29].transfer.explanation,/skip/);
});

test('statistical counterexamples are explicit instead of unconditional generalizations',()=>{
 assert.match(da[20].checks.error[0],/\[2,4\]/);
 assert.equal(da[30].checks.concept[1],'17.5');
 assert.equal((1*10+3*20)/(1+3),17.5);
 assert.match(da[32].transfer.explanation,/2 điểm phần trăm/);
 assert.match(agent[27].checks.concept[4],/Validation có thể dùng để chọn policy/);
});
