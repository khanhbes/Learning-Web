// Private deployment snapshot. Credentials and session cookies never leave memory.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const privatePath=process.argv[2]??'.data/public/ml-before-export.json';
if(dirname(resolve(privatePath))!==resolve('.data/public') || extname(privatePath)!=='.json')throw Error('Snapshot must be a JSON file in .data/public.');
const state=JSON.parse(readFileSync('.data/public/state.json','utf8').replace(/^\uFEFF/,''));
if(process.argv.includes('--offline')){
  if(!['.data/bytepath.sqlite','.data/public/online.sqlite'].includes(state.db))throw Error('Unexpected database path.');
  const db=new DatabaseSync(state.db,{readOnly:true});let data;
  try{
    db.exec('BEGIN');
    const profile=JSON.parse(db.prepare("SELECT value FROM meta WHERE key='state'").get().value);
    const list=table=>db.prepare(`SELECT data FROM ${table} ORDER BY rowid DESC`).all().map(r=>({courseId:'dsa',...JSON.parse(r.data)}));
    data={version:profile.version,exportedAt:Date.now(),state:profile,attempts:list('attempts'),jobs:list('jobs'),ledger:db.prepare('SELECT * FROM ledger').all(),capstones:list('capstones'),drafts:list('drafts'),knowledgeAttempts:list('knowledge_attempts')};
    db.exec('COMMIT');
  }finally{db.close();}
  if(data.jobs.some(j=>['queued','running'].includes(j.status)))throw Error('A grading job is active; wait before updating.');
  writeFileSync(privatePath,JSON.stringify(data));
  console.log(JSON.stringify({backupReady:true,version:data.version,attempts:data.attempts.length,privatePath,readOnly:true}));
  process.exit(0);
}
const origin=state.publicOrigin??state.origin;
const login=await fetch('http://127.0.0.1:3002/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({password:state.password})});
if(!login.ok)throw Error('Cannot authenticate for backup: '+login.status);
const cookie=login.headers.get('set-cookie')?.split(';')[0];
const response=await fetch('http://127.0.0.1:3002/api/data/export',{headers:{cookie,Origin:origin}});
if(!response.ok)throw Error('Backup failed');
const data=await response.json();
if(data.jobs.some(j=>['queued','running'].includes(j.status)))throw Error('A grading job is active; wait before updating.');
writeFileSync(privatePath,JSON.stringify(data));
console.log(JSON.stringify({backupReady:true,version:data.version,attempts:data.attempts.length,privatePath}));
