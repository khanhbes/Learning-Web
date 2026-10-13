// Private deployment snapshot. Credentials and session cookies never leave memory.
import {readFileSync,writeFileSync} from 'node:fs';
const state=JSON.parse(readFileSync('.data/public/state.json','utf8').replace(/^\uFEFF/,''));
const origin=state.publicOrigin??state.origin;
const login=await fetch('http://127.0.0.1:3002/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({password:state.password})});
if(!login.ok)throw Error('Cannot authenticate for backup: '+login.status);
const cookie=login.headers.get('set-cookie')?.split(';')[0];
const response=await fetch('http://127.0.0.1:3002/api/data/export',{headers:{cookie,Origin:origin}});
if(!response.ok)throw Error('Backup failed');
const data=await response.json();
if(data.jobs.some(j=>['queued','running'].includes(j.status)))throw Error('A grading job is active; wait before updating.');
writeFileSync('.data/public/ml-before-export.json',JSON.stringify(data));
console.log(JSON.stringify({backupReady:true,version:data.version,attempts:data.attempts.length,privatePath:'.data/public/ml-before-export.json'}));
