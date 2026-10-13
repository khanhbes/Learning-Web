import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {isolatedBrowser,browserExecutable} from "./ml-browser.mjs";
import * as ml from "../content/ml/index.mjs";
const ROOT=resolve(".runtime/ml"),ORIGIN="https://ml-runtime.invalid",MAX_OUTPUT=2*1024*1024;
let verified=null,queue=Promise.resolve();
function runtimeManifest(){
 if(verified)return verified;
 const m=JSON.parse(readFileSync(resolve(ROOT,"manifest.json"),"utf8"));
 if(m.version!=="314.0.7")throw Error("Runtime ML sai phiên bản.");
 for(const [file,hash] of Object.entries(m.files)){
  if(!/^[a-zA-Z0-9_.+-]+$/.test(file) || createHash("sha256").update(readFileSync(resolve(ROOT,file))).digest("hex")!==hash)throw Error("Asset ML không khớp checksum.");
 }
 return verified=m;
}
export async function mlRunnerHealth(){
 try {runtimeManifest();if(process.platform!=="win32" || !browserExecutable())throw Error("Thiếu Chromium/Windows Job Object.");return {available:true,engine:"pyodide",image:"Pyodide 314.0.7 / Python 3.14",message:"NumPy, pandas, SciPy, scikit-learn · Chromium sandbox / RAM 1 GB",packages:verified.packages};}
 catch{return {available:false,engine:"pyodide",message:"Chạy npm run ml:setup để chuẩn bị runtime ML trên ổ C. Bài và bản nháp vẫn được giữ."};}
}
const timed=(promise,ms,message)=>{let t;return Promise.race([promise,new Promise((_,reject)=>t=setTimeout(()=>reject(Error(message)),ms))]).finally(()=>clearTimeout(t));};
export function executeML(options){const pending=queue.then(()=>executeIsolated(options));queue=pending.catch(()=>{});return pending;}
async function executeIsolated({code,inputs,packages=["numpy","pandas","scikit-learn"],executionTimeout=30000}){
 let owned,context,phase="browser",initializing=true;const diagnostic=[],initBegin=Date.now();
 try {
  const manifest=runtimeManifest();owned=await isolatedBrowser();
  context=await owned.browser.newContext({serviceWorkers:"block",acceptDownloads:false,permissions:[]});
  await context.route("**/*",async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===ORIGIN && req.method()==="GET"){
    if(url.pathname==="/")return route.fulfill({status:200,contentType:"text/html",body:"<!doctype html><meta charset=utf-8><title>Isolated ML</title><script src='/pyodide.js'></script>",headers:{"Content-Security-Policy":"default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'none'; style-src 'none'"}});
    const file=decodeURIComponent(url.pathname.slice(1));
    if(manifest.files[file] && /^[a-zA-Z0-9_.+-]+$/.test(file))return route.fulfill({status:200,body:readFileSync(resolve(ROOT,file)),contentType:/\.m?js$/.test(file)?"application/javascript":file.endsWith(".json")?"application/json":file.endsWith(".wasm")?"application/wasm":"application/octet-stream"});
   }
   await route.abort("blockedbyclient");
  });
  await context.routeWebSocket("**/*",ws=>ws.close());
  const page=await context.newPage();page.on("console",m=>{if(initializing && diagnostic.length<8)diagnostic.push(m.text().slice(0,200));});page.on("pageerror",e=>{if(initializing && diagnostic.length<8)diagnostic.push(e.message.slice(0,200));});await page.goto(ORIGIN+"/");
  phase="Python/packages";
  const packageNames={numpy:"numpy",pandas:"pandas",scipy:"scipy",sklearn:"scikit-learn",matplotlib:"matplotlib"};
  const required=[...new Set([...packages,...[...code.matchAll(/\b(numpy|pandas|scipy|sklearn|matplotlib)\b/g)].map(m=>packageNames[m[1]])])];
  const imports=Object.entries(packageNames).filter(([,name])=>required.includes(name)).map(([name])=>name);
  await timed(page.evaluate(async({packages,imports})=>{
   globalThis.mlPyodide=await loadPyodide({indexURL:location.origin+"/"});
   for(const name of packages){console.info("ML init: "+name);await mlPyodide.loadPackage(name);}
   // Importing compiled scientific libraries is environment initialization,
   // rather than part of the student's 30-second algorithm budget.
   for(const name of imports){console.info("ML import: "+name);await mlPyodide.runPythonAsync("import "+name+(name==="matplotlib"?"\nmatplotlib.use('Agg')":""));}
  },{packages:required,imports}),Math.max(1,120000-(Date.now()-initBegin)),"Khởi tạo Python quá 120 giây; cần chấm lại.");
  initializing=false;phase="code";
  const result=await timed(page.evaluate(async({code,inputs,max})=>{
   const py=globalThis.mlPyodide;let stdout="",stderr="",size=0;
   const capture=(text,err)=>{size+=new TextEncoder().encode(text+"\n").byteLength;if(size>max)throw Error("BYTEPATH_OUTPUT_LIMIT");if(err)stderr+=(text+"\n");else stdout+=(text+"\n");};
   py.setStdout({batched:t=>capture(t,false)});py.setStderr({batched:t=>capture(t,true)});
   py.globals.set("__bp_source",code);py.globals.set("__bp_inputs",JSON.stringify(inputs));
   try {
    const output=await py.runPythonAsync(`import json as _bp_json\n_bp_ns = {}\nexec(compile(__bp_source, '<submission>', 'exec'), _bp_ns)\nif not callable(_bp_ns.get('solve')): raise ValueError('Cần khai báo solve(data)')\n_bp_results = [_bp_ns['solve'](d) for d in _bp_json.loads(__bp_inputs)]\n_bp_json.dumps(_bp_results, allow_nan=False)`);
    if(new TextEncoder().encode(String(output)).byteLength+size>max)return {status:"runtime_error",message:"Đầu ra vượt 2 MB."};
    return {status:"executed",output:String(output),stdout,stderr};
   } catch(e){return {status:"runtime_error",message:String(e).includes("BYTEPATH_OUTPUT_LIMIT")?"Đầu ra vượt 2 MB.":String(e).slice(0,4000),stdout:stdout.slice(0,max),stderr:stderr.slice(0,max)};}
  },{code,inputs,max:MAX_OUTPUT}),executionTimeout,"BYTEPATH_EXECUTION_TIMEOUT");
  return result;
 }catch(e){return {status:e.message==="BYTEPATH_EXECUTION_TIMEOUT"?"runtime_error":"infrastructure_error",message:e.message==="BYTEPATH_EXECUTION_TIMEOUT"?"Chương trình vượt thời gian chạy 30 giây.":"Chưa có kết quả — cần chấm lại. "+e.message,phase,diagnostic};}
 finally{try{await owned?.stop();}catch{}try{await timed(context?.close()??Promise.resolve(),2000,"cleanup");}catch{}try{await timed(owned?.browser.close()??Promise.resolve(),2000,"cleanup");}catch{}}
}
export async function runML({problemId,language,code,seed,publicOnly=false,version,fixtures}){
 if(language!=="python")return {status:"compile_error",message:"Khóa ML dùng Python."};
 if(version && version!==ml.VERSION)return {status:"infrastructure_error",message:"Không có checker đúng phiên bản đề; cần chấm lại."};
 const health=await mlRunnerHealth();if(!health.available)return {status:"infrastructure_error",message:health.message};
 const tests=fixtures??ml.testsFor(problemId,seed,{publicOnly,version}),begin=Date.now();
 let expected;
 try{expected=tests.map(t=>ml.oracle(problemId,t.input));if(expected.some((v,i)=>!ml.checkOutput(problemId,tests[i].input,v)))throw Error("Oracle/checker không nhất quán");}
 catch{return {status:"infrastructure_error",message:"Oracle chưa nhất quán; cần chấm lại."};}
 const result=await executeML({code,inputs:tests.map(t=>t.input),packages:ml.problems[problemId]?.packages??["numpy","pandas","scikit-learn"]});
 if(result.status!=="executed")return result;
 let outputs;try{outputs=JSON.parse(result.output);if(!Array.isArray(outputs)||outputs.length!==tests.length)throw Error();}catch{return {status:"rejected",message:"solve(data) cần trả giá trị JSON cho mỗi bộ dữ liệu.",stdout:result.stdout};}
 const checks=tests.map((t,i)=>({name:t.name??`Test ${i+1}`,group:t.group??"hidden",passed:ml.checkOutput(problemId,t.input,outputs[i]),...(t.group==="sample"?{input:t.input,expected:expected[i],actual:outputs[i]}:{})}));
 return {status:checks.every(c=>c.passed)?"accepted":"rejected",passed:checks.filter(c=>c.passed).length,total:checks.length,checks,elapsedMs:Date.now()-begin,stdout:result.stdout,stderr:result.stderr,version:ml.VERSION};
}
