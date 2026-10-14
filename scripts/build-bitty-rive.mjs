import { spawnSync } from 'node:child_process';
import { stat, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateBittySource } from '../animation/bitty/build-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=process.env.BYTEPATH_RIVE_CLI || path.join(root,'.runtime/rive-cli/v1.5.1',process.platform==='win32'?'rive.exe':'rive');
const project=path.join(root,'animation/bitty');
const executable=await stat(cli).catch(()=>null);
if(!executable?.isFile())throw new Error('Rive CLI 1.5.1 missing. Install the official CLI, or set BYTEPATH_RIVE_CLI to its executable.');
const summary=await generateBittySource();
for(const args of [[project,'--verify','--format=json'],['inspect',project,'--summary'],[project,'--once','--format=json']]){
  const result=spawnSync(cli,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});
  if(result.error||result.status!==0)throw new Error(`Rive ${args.slice(1).join(' ')} failed: ${result.stderr||result.stdout||result.error?.message}`);
  process.stdout.write(result.stdout);
}
const binary=await readFile(path.join(project,'build/bitty.riv'));
if(binary.length>=200000)throw new Error(`Bitty .riv exceeds 200 KB: ${binary.length}`);
if(binary.subarray(0,4).toString()!=='RIVE')throw new Error('Compiler output is not a Rive binary');
await writeFile(path.join(project,'build/verification.json'),JSON.stringify({...summary,bytes:binary.length,scriptFree:true,verifiedAt:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({...summary,rivBytes:binary.length}));
