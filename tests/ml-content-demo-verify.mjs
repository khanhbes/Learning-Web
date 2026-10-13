import {writeFileSync,mkdirSync} from 'node:fs';
import {executeML} from '../server/ml-runner.mjs';
import {demonstrations} from '../content/ml/demonstrations.mjs';

// Manual scientific-package verification in the same isolated runner as real submissions.
// Separate package groups respect the 1GB memory budget.
const groups=[
 {name:'numpy',ids:[3,5],packages:['numpy']},
 {name:'pandas',ids:[4],packages:['numpy','pandas']},
 {name:'matplotlib',ids:[8],packages:['numpy','matplotlib']},
 {name:'scipy',ids:[32],packages:['numpy','scipy']},
 {name:'sklearn',ids:[11,14,16,17,18,19,20,21,22,23,25,26,27,29,30,31,33,34,36],packages:['numpy','scikit-learn']},
];
const report={runtime:'Pyodide314.0.7 / Python3.14',createdAt:new Date().toISOString(),groups:[],total:Object.keys(demonstrations).length};
for(const group of groups) {
 const selected=Object.fromEntries(group.ids.map(id=>[id,demonstrations[id]]));
 const source='import json, io, contextlib, traceback\n_sources = json.loads('+JSON.stringify(JSON.stringify(selected))+')\ndef solve(data):\n    reports=[]\n    for lesson_id, source in _sources.items():\n        output=io.StringIO()\n        try:\n            with contextlib.redirect_stdout(output):\n                exec(compile(source,"library-demo:"+lesson_id,"exec"),{})\n            reports.append({"lessonId":int(lesson_id),"ok":True,"stdout":output.getvalue()})\n        except Exception as error:\n            reports.append({"lessonId":int(lesson_id),"ok":False,"stdout":output.getvalue(),"error":str(error),"trace":traceback.format_exc()})\n    return reports\n';
 const started=Date.now();
 const run=await executeML({code:source,inputs:[{}],packages:group.packages,executionTimeout:30000});
 const item={name:group.name,packages:group.packages,elapsedMs:Date.now()-started,status:run.status};
 if(run.status==='executed'){item.demos=JSON.parse(run.output)[0];item.stdout=run.stdout;item.stderr=run.stderr;}
 else {item.message=run.message;item.phase=run.phase;item.diagnostic=run.diagnostic;}
 report.groups.push(item);mkdirSync('output',{recursive:true});writeFileSync('output/ml-demo-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({group:group.name,status:item.status,elapsedMs:item.elapsedMs,passed:item.demos?.filter(d=>d.ok).length,total:group.ids.length,errors:item.demos?.filter(d=>!d.ok).map(d=>({lessonId:d.lessonId,error:d.error}))}));
}
report.passed=report.groups.reduce((s,g)=>s+(g.demos?.filter(d=>d.ok).length||0),0);
const results=Object.fromEntries(report.groups.flatMap(g=>g.demos??[]).map(d=>[d.lessonId,d]));
const checkpoints={3:/Tích vô hướng: 11(?:\.0)?/,4:/'A': 15(?:\.0)?.*'B': 30(?:\.0)?/,5:/Median: 12(?:\.0)?/,11:/Test6: \[\[3(?:\.0)?\]\]/,14:/Query4: \[9(?:\.0)?\]/,16:/\[1\.0, 2\.0, 4\.0, 8\.0\]/,20:/Prediction: \[0, 1\]/,23:/\[0, 1\]/,25:/\[\[2, 1\], \[1, 2\]\]/,26:/AUC: 0\.875/,27:/R²: -39601(?:\.0)?/,33:/\[0, 0, 0, -1\]/,34:/Variance sklearn dùng ddof1: \[4\.999/};
report.numericCheckpoints=Object.entries(checkpoints).map(([lessonId,pattern])=>({lessonId:Number(lessonId),passed:pattern.test(results[lessonId]?.stdout??'')}));
report.allPassed=report.passed===report.total&&report.numericCheckpoints.every(x=>x.passed);
writeFileSync('output/ml-demo-report.json',JSON.stringify(report,null,2)+'\n');
if(!report.allPassed)process.exitCode=1;
