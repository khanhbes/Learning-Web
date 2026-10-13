import {executeML,runML,mlRunnerHealth} from "../server/ml-runner.mjs";
import {solutions,problems,generateInput,checkOutput,VERSION} from "../content/ml/index.mjs";
import {writeFileSync,mkdirSync} from "node:fs";
mkdirSync("output",{recursive:true});
const health=await mlRunnerHealth();console.log(JSON.stringify(health));
if(!health.available)process.exit(1);
const libraryVersions={};
for(const name of ["numpy","pandas","scipy","sklearn","matplotlib"]){
 const imports=await executeML({code:`def solve(data):\n    import ${name}\n    return ${name}.__version__`,inputs:[{}],packages:[name==="sklearn"?"scikit-learn":name]});
 console.log("Library smoke:",name,imports.status,imports.output??imports.message);
 if(imports.status!=="executed"){console.log(imports.diagnostic);process.exit(1);}
 libraryVersions[name]=JSON.parse(imports.output)[0];
}
// One fresh sandboxed browser runs all reference functions on frozen fixtures;
// expected answers stay in Node, never in the learner runtime.
const inputs=Object.keys(problems).flatMap(id=>Array.from({length:8},(_,i)=>({id,input:generateInput(id,`runtime-reference:${i}`)})));
const source=`_sources = ${JSON.stringify(JSON.stringify(solutions))}\nimport json\n_sources = json.loads(_sources)\n_functions = {}\nfor _id, _source in _sources.items():\n    _scope = {}\n    exec(compile(_source, '<reference>', 'exec'), _scope)\n    _functions[_id] = _scope['solve']\ndef solve(data):\n    return _functions[data['id']](data['input'])`;
const result=await executeML({code:source,inputs,packages:[]});
if(result.status!=="executed"){console.log(result.message);process.exit(1);}
const values=JSON.parse(result.output),checks=inputs.map((d,i)=>({id:d.id,seed:i%8,passed:checkOutput(d.id,d.input,values[i])}));
const failed=checks.filter(c=>!c.passed);
console.log(`Reference results: ${checks.length-failed.length}/${checks.length}`);
if(failed.length){console.log(JSON.stringify(failed));process.exit(1);}
const sampleId="ml-mean",correct=await runML({problemId:sampleId,language:"python",code:solutions[sampleId],seed:"grading-smoke",version:VERSION});
const wrong=await runML({problemId:sampleId,language:"python",code:"def solve(data):\n    return 0",seed:"grading-smoke",version:VERSION});
const isolation=await executeML({code:"def solve(data):\n    import os\n    import js\n    try:\n        open('/.env').read()\n        files = 'LEAK'\n    except Exception:\n        files = 'blocked'\n    request = js.XMLHttpRequest.new()\n    try:\n        request.open('GET', 'https://example.com', False)\n        request.send()\n        network = 'LEAK'\n    except Exception:\n        network = 'blocked'\n    return {'node':str(js.eval('typeof process')), 'files':files, 'network':network, 'env':os.environ.get('GEMINI_API_KEY','absent')}\n",inputs:[{}],packages:[]});
const timeout=await executeML({code:"def solve(data):\n    while True: pass",inputs:[{}],packages:[],executionTimeout:600});
const output=await executeML({code:"def solve(data):\n    return 'x' * (2 * 1024 * 1024 + 1)",inputs:[{}],packages:[]});
const invalidPackage=await executeML({code:"def solve(data): return 0",inputs:[{}],packages:["bytepath-missing-package"]});
const isolationValue=JSON.parse(isolation.output??"null")?.[0];
const report={health,libraryVersions,referenceChecks:checks,correct:correct.status,wrong:wrong.status,isolation:isolationValue,timeout:timeout.status,output:output.status,missingPackage:invalidPackage.status};
writeFileSync("output/ml-runtime-report.json",JSON.stringify(report,null,2));
if(correct.status!=="accepted"||wrong.status!=="rejected"||isolationValue?.node!=="undefined"||isolationValue?.files!=="blocked"||isolationValue?.network!=="blocked"||isolationValue?.env!=="absent"||timeout.status!=="runtime_error"||output.status!=="runtime_error"||invalidPackage.status!=="infrastructure_error")process.exit(1);
console.log("ML runtime/reference/isolation checks passed.");
