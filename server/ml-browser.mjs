import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdtemp,readFile,rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const safeEnvironment=()=>Object.fromEntries(["SystemRoot","WINDIR","TEMP","TMP","LOCALAPPDATA","USERPROFILE","PATH"].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
export function browserExecutable() {
  const p=process.env.BYTEPATH_ML_BROWSER || chromium.executablePath();
  return existsSync(p)?p:null;
}
export async function isolatedBrowser() {
 if(process.platform!=="win32") throw Error("Runner ML yêu cầu Windows Job Object; không tự bỏ giới hạn tài nguyên.");
 const executable=browserExecutable();if(!executable) throw Error("Chưa có Chromium. Chạy npm run ml:setup.");
 const runtimeRoot=resolve(".runtime/ml");
 const directory=await mkdtemp(resolve(runtimeRoot,"job-"));
 if(!directory.startsWith(runtimeRoot+"\\"))throw Error("Thư mục job nằm ngoài runtime.");
 const args=["--headless=new","--remote-debugging-port=0","--remote-debugging-address=127.0.0.1",`--user-data-dir=${directory}`,"--no-first-run","--no-default-browser-check","--disable-background-networking","--disable-component-update","--disable-default-apps","--disable-extensions","--disable-sync","--disable-breakpad","--disable-features=MediaRouter,OptimizationHints,AutofillServerCommunication","--force-webrtc-ip-handling-policy=disable_non_proxied_udp","about:blank"];
 // Chromium's sandbox is enabled by default: there is deliberately no
 // --no-sandbox or --disable-setuid-sandbox flag anywhere in this launch.
 const guard=spawn("powershell.exe",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",resolve("scripts/ml-job-guard.ps1")],{env:safeEnvironment(),windowsHide:true,stdio:["pipe","pipe","pipe"]});
 let ready="",error="",exited=false;
 guard.stdout.on("data",b=>ready+=b.toString());guard.stderr.on("data",b=>error+=b.toString());guard.once("exit",()=>exited=true);
 guard.once("error",e=>{error=e.message;exited=true;});
 guard.stdin.write(JSON.stringify({executable,args,cwd:directory})+"\n");
 const stop=async()=>{guard.stdin.end();await Promise.race([new Promise(r=>guard.once("exit",r)),sleep(5000)]); if(!exited) guard.kill();await rm(directory,{recursive:true,force:true,maxRetries:4,retryDelay:300});};
 try {
  let endpoint;
  const start=Date.now();
  while(Date.now()-start<90000){
   if(exited) throw Error(error||"Job Object chưa sẵn sàng.");
   try {const lines=(await readFile(resolve(directory,"DevToolsActivePort"),"utf8")).trim().split("\n");endpoint=`http://127.0.0.1:${lines[0]}`;break;}catch{}
   await sleep(100);
  }
  if(!endpoint || !/READY:\d+/.test(ready)) throw Error("Chromium không khởi động trong Job Object. "+(error||ready||"Hết thời gian chờ DevToolsActivePort.").slice(0,500));
  const browser=await chromium.connectOverCDP(endpoint,{timeout:15000});
  return {browser,stop,guard,pid:Number(ready.match(/READY:(\d+)/)[1])};
 } catch(e) {await stop();throw e;}
}
