import {readFileSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {decidePublicRecovery,recoveryRetryDelay} from './public-recovery-policy.mjs';

const root=resolve(import.meta.dirname,'..'),privateRoot=resolve(root,'.data/public');
const readJson=name=>JSON.parse(readFileSync(resolve(privateRoot,name),'utf8').replace(/^\uFEFF/,''));
const enabled=()=>{try{const desired=readJson('desired.json');return desired.enabled===true&&desired.recoveryEnabled===true;}catch{return false;}};
export function readPublicJobState(database,projectRoot=root){
  if(!['.data/bytepath.sqlite','.data/public/online.sqlite','.data/public/tunnel-qa.sqlite'].includes(database))return 'unknown';
  let db;
  try{
    db=new DatabaseSync(resolve(projectRoot,database),{readOnly:true});
    let active=false;
    for(const row of db.prepare("SELECT data FROM jobs").all()){
      const job=JSON.parse(row.data);
      if(!job||typeof job!=='object'||!['queued','running','completed','error'].includes(job.status))return 'unknown';
      if(job.status==='queued'||job.status==='running')active=true;
    }
    return active?'active':'idle';
  }catch{return 'unknown';}finally{db?.close();}
}
export function hasActivePublicJobs(database){
  return readPublicJobState(database)!=='idle';
}
async function health(origin){
  if(!origin)return false;
  try{const r=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(8000)});return r.ok&&(await r.json()).mode==='cloud';}catch{return false;}
}
async function networkAvailable(){
  try{const r=await fetch('https://www.cloudflare.com/cdn-cgi/trace',{method:'HEAD',signal:AbortSignal.timeout(8000)});return r.status<500;}catch{return false;}
}
async function runRecovery(action){
  if(!enabled())return false;
  const script=resolve(root,'scripts',action==='sync-alias'?'repair-public-alias.ps1':'start-public.ps1');
  const log=openSync(resolve(privateRoot,'recovery-last.log'),'w');
  const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script,'-Recovery'],{cwd:root,windowsHide:true,stdio:['ignore',log,log]});
  closeSync(log);
  if(child.pid)writeFileSync(resolve(privateRoot,'recovery-process.json'),JSON.stringify({pid:child.pid,started:new Date().toISOString(),script}));
  const result=await new Promise(resolveResult=>{child.once('error',()=>resolveResult(false));child.once('exit',code=>resolveResult(code===0));});
  return result;
}
export async function runPublicWatchdog(){
  let failures=0,failedAttempts=0,nextRecoveryAt=0;
  console.log('Public connection monitor started; no AI or grading requests.');
  while(enabled()){
    try{
      const s=readJson('state.json');
      const [localHealthy,tunnelHealthy,publicHealthy]=await Promise.all([health('http://127.0.0.1:3002'),health(s.origin),health(s.publicOrigin??s.origin)]);
      const healthy=localHealthy&&tunnelHealthy&&publicHealthy;
      failures=healthy?0:failures+1;
      if(healthy){failedAttempts=0;nextRecoveryAt=0;}
      if(failures>=3){
        const action=decidePublicRecovery({enabled:enabled(),failures,localHealthy,tunnelHealthy,publicHealthy,internetReachable:await networkAvailable(),gradingActive:hasActivePublicJobs(s.db),now:Date.now(),nextRecoveryAt});
        if(action==='restart'||action==='sync-alias'){
          console.log('Recovering public connection: '+action);
          const repaired=await runRecovery(action);
          if(repaired){failures=0;failedAttempts=0;nextRecoveryAt=Date.now()+120000;}
          else{nextRecoveryAt=Date.now()+recoveryRetryDelay(++failedAttempts);console.log('Recovery deferred; inspect private logs or Cloudflare sign-in.');}
        }
      }
    }catch{console.log('Connection check deferred; application data was left untouched.');}
    if(enabled())await new Promise(resolveTimer=>setTimeout(resolveTimer,60000));
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await runPublicWatchdog();
