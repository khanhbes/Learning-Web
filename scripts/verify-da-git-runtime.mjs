import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {executeML,runML,mlRunnerHealth} from '../server/ml-runner.mjs';
import {runGit} from '../server/git-runner.mjs';
import {getCourse} from '../content/registry.mjs';
const da=getCourse('da'),git=getCourse('git');
mkdirSync('output',{recursive:true});
assert.equal((await mlRunnerHealth()).available,true,'Prepared isolated Python runtime');
// References execute in a real fresh browser; expected results remain in Node.
const inputs=da.problemIds.flatMap(id=>Array.from({length:8},(_,i)=>({id,input:da.generateInput(id,`da-runtime:${i}`)})));
const source=`import json\n_sources=json.loads(${JSON.stringify(JSON.stringify(da.solutions))})\n_functions={}\nfor _id,_source in _sources.items():\n    _scope={}\n    exec(compile(_source,'<reference>','exec'),_scope)\n    _functions[_id]=_scope['solve']\ndef solve(data):\n    return _functions[data['id']](data['input'])`;
const result=await executeML({code:source,inputs,packages:[]});
assert.equal(result.status,'executed',JSON.stringify(result));
const values=JSON.parse(result.output),checks=inputs.map((d,i)=>({problemId:d.id,seed:i%8,passed:da.checkOutput(d.id,d.input,values[i])}));
assert.ok(checks.every(c=>c.passed),JSON.stringify(checks.filter(c=>!c.passed)));
console.log(`DA references: ${checks.length}/${checks.length} in isolated Pyodide, including actual SQLite.`);
const sqlCorrect=await runML({problemId:'da-sql-join',language:'python',code:da.solution('da-sql-join','python'),seed:'sql-runtime',version:da.VERSION},da);
assert.equal(sqlCorrect.status,'accepted',JSON.stringify(sqlCorrect));
const sqlWrong=await runML({problemId:'da-sql-join',language:'python',code:'def solve(data): return []',seed:'sql-runtime',version:da.VERSION},da);
assert.equal(sqlWrong.status,'rejected');
const gitChecks=[];
for(const id of git.problemIds){const report=await runGit({problemId:id,language:'shell',code:git.solution(id,'shell'),seed:'git-runner-reference',version:git.VERSION},git);assert.equal(report.status,'accepted',id+':'+JSON.stringify(report));gitChecks.push({problemId:id,passed:true,tests:report.total});}
const gitWrong=await runGit({problemId:'git-stage',language:'shell',code:'git status',seed:'wrong',version:git.VERSION});assert.equal(gitWrong.status,'rejected');
const demoSource=`_demos=${JSON.stringify(JSON.stringify(da.demonstrations))}\nimport json,io,contextlib\n_demos=json.loads(_demos)\ndef solve(data):\n    buf=io.StringIO()\n    with contextlib.redirect_stdout(buf):\n        exec(compile(_demos[data['id']],'<lesson-demo>','exec'),{})\n    return buf.getvalue()`;
const demo=await executeML({code:demoSource,inputs:Object.keys(da.demonstrations).map(id=>({id})),packages:['numpy','pandas']});
assert.equal(demo.status,'executed',JSON.stringify(demo));
const report={date:'2026-10-14',engine:'Pyodide 314.0.7 in sandboxed Chromium / Git pure simulation',DA:{referenceChecks:checks,SQLCorrect:sqlCorrect.status,SQLWrong:sqlWrong.status,demonstrationLessons:Object.keys(da.demonstrations),demonstrationOutput:JSON.parse(demo.output)},Git:{referenceChecks:gitChecks,wrong:gitWrong.status}};
writeFileSync('output/da-git-runtime-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({DA:checks.length,SQLCorrect:sqlCorrect.status,SQLWrong:sqlWrong.status,Git:gitChecks.length,demonstrations:Object.keys(da.demonstrations).length,passed:true}));
