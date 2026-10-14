// Trusted reference programs execute inside the same isolated runtime used for
// student submissions. Expected answers and output checkers stay in Node.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {executeML,runML,mlRunnerHealth} from '../server/ml-runner.mjs';
import {getCourse} from '../content/registry.mjs';

mkdirSync('output',{recursive:true});
const report={createdAt:new Date().toISOString(),engine:'Pyodide 314.0.7 / sandboxed Chromium / Windows Job Object',courses:[],passed:false};
const selected=process.argv.slice(2);
const courseIds=selected.length?selected:['agent','linear'];
assert.ok(courseIds.every(id=>['agent','linear'].includes(id))&&new Set(courseIds).size===courseIds.length,'Only agent/linear course IDs are allowed');
assert.equal((await mlRunnerHealth()).available,true,'Prepared isolated Python runtime is required; missing runtime is not a student failure');
try {
  for(const id of courseIds) {
    const def=getCourse(id);
    const inputs=def.problemIds.flatMap(problemId=>[
      ...Array.from({length:20},(_,seed)=>({problemId,seed,input:def.generateInput(problemId,`runtime:${id}:${seed}`)})),
      ...(typeof def.edgeInputs==='function'?def.edgeInputs(problemId):def.edgeInputs[problemId]??[]).map((input,i)=>({problemId,seed:`edge-${i}`,input})),
    ]);
    const sources=Object.fromEntries(def.problemIds.map(pid=>[pid,def.solution(pid,'python')]));
    const code=`import json\n_sources=json.loads(${JSON.stringify(JSON.stringify(sources))})\n_functions={}\nfor _id,_source in _sources.items():\n    _scope={}\n    exec(compile(_source,'<trusted-reference>','exec'),_scope)\n    _functions[_id]=_scope['solve']\ndef solve(data):\n    return _functions[data['problemId']](data['input'])`;
    const executed=await executeML({code,inputs,packages:[]});
    assert.equal(executed.status,'executed',JSON.stringify(executed));
    const outputs=JSON.parse(executed.output);
    assert.equal(outputs.length,inputs.length);
    const checks=inputs.map((d,i)=>({problemId:d.problemId,seed:d.seed,passed:def.checkOutput(d.problemId,d.input,outputs[i])}));
    for(const [i,check] of checks.entries())assert.equal(check.passed,true,JSON.stringify({check,input:inputs[i].input,actual:outputs[i],expected:def.oracle(inputs[i].problemId,inputs[i].input)}));
    const problemId=def.lessons[0].problemIds[0];
    const accepted=await runML({problemId,language:'python',code:def.solution(problemId,'python'),seed:`run:${id}`,version:def.VERSION},def);
    assert.equal(accepted.status,'accepted',JSON.stringify(accepted));
    const rejected=await runML({problemId,language:'python',code:'def solve(data): return "invalid result"',seed:`run:${id}`,version:def.VERSION},def);
    assert.equal(rejected.status,'rejected',JSON.stringify(rejected));
    report.courses.push({id,referenceChecks:checks,accepted:accepted.status,rejected:rejected.status});
    console.log(JSON.stringify({courseId:id,referenceChecks:checks.length,passed:true,accepted:accepted.status,rejected:rejected.status}));
  }
  report.passed=true;
} finally {writeFileSync('output/agent-linear-runtime-report.json',JSON.stringify(report,null,2));}
