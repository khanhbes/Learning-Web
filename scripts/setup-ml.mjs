import {mkdir,readFile,writeFile,copyFile,access} from "node:fs/promises";
import {statfsSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {chromium} from "playwright";
const VERSION="314.0.7",root=".runtime/ml",base=`https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
const free=statfsSync(".");
if(free.bavail*free.bsize<1024**3) throw Error("Cần ít nhất 1 GB trống trên ổ chứa workspace trước khi chuẩn bị ML.");
await mkdir(root,{recursive:true});
const core=["pyodide.js","pyodide.asm.mjs","pyodide.asm.wasm","python_stdlib.zip","pyodide-lock.json"];
const hashes={},download=async(file,hash)=>{
 const path=`${root}/${file}`;
 if(existsSync(path)){const bytes=await readFile(path);if(!hash || createHash("sha256").update(bytes).digest("hex")===hash){hashes[file]=createHash("sha256").update(bytes).digest("hex");return;}}
 const response=await fetch(base+file,{signal:AbortSignal.timeout(120000)});
 if(!response.ok) throw Error(`Không tải được runtime ${file}: ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer()),digest=createHash("sha256").update(bytes).digest("hex");
 if(hash && digest!==hash) throw Error(`Checksum sai: ${file}`);
 await writeFile(path,bytes);hashes[file]=digest;
};
for(const file of core){
 try {await access(`node_modules/pyodide/${file}`);await copyFile(`node_modules/pyodide/${file}`,`${root}/${file}`);hashes[file]=createHash("sha256").update(await readFile(`${root}/${file}`)).digest("hex");}
 catch {await download(file);}
}
const lock=JSON.parse(await readFile(`${root}/pyodide-lock.json`,"utf8")),names=new Set();
function collect(name){if(names.has(name))return;const p=lock.packages[name];if(!p)throw Error(`Package không có trong bản đóng: ${name}`);names.add(name);for(const d of p.depends??[])collect(d);}
for(const p of ["numpy","pandas","scipy","scikit-learn","matplotlib"])collect(p);
for(const name of names){const p=lock.packages[name];await download(p.file_name,p.sha256);}
if(!existsSync(chromium.executablePath())) {
 const result=spawnSync(process.execPath,["node_modules/playwright/cli.js","install","chromium"],{stdio:"inherit",windowsHide:true});
 if(result.status!==0)throw Error("Chưa tải được Chromium cho runner ML.");
}
await writeFile(`${root}/manifest.json`,JSON.stringify({version:VERSION,files:hashes,packages:Object.fromEntries([...names].map(n=>[n,lock.packages[n].version])),browser:chromium.executablePath()},null,2));
console.log(`ML sẵn sàng: Pyodide ${VERSION}, ${names.size} thư viện/phụ thuộc, ${Object.keys(hashes).length} asset đã kiểm chứng.`);
