import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/index.mjs';
import {createStore} from '../server/store.mjs';

test('SPA entry pages cannot cache an old frontend, while assets and API routing still work',async()=>{
 const root=mkdtempSync(join(tmpdir(),'bytepath-delivery-'));
 mkdirSync(join(root,'assets'));writeFileSync(join(root,'index.html'),'<html><script src="/assets/app-v2.js"></script></html>');writeFileSync(join(root,'assets','app-v2.js'),'/* current app */');
 const app=await createApp({store:createStore(':memory:'),assetRoot:root,config:{cloud:false,aiProvider:'off'},aiHealth:async()=>({available:false})});
 try{
  for(const url of ['/','/courses/linear/lesson/1?phase=learn&guided=1']){
   const r=await app.inject({url});assert.equal(r.statusCode,200);assert.match(r.headers['cache-control'],/no-store/);assert.match(r.headers['content-type'],/text\/html/);assert.match(r.body,/app-v2\.js/);
  }
  assert.equal((await app.inject({url:'/assets/app-v2.js'})).statusCode,200);
  const missing=await app.inject({url:'/api/not-a-route'});assert.equal(missing.statusCode,404);assert.match(missing.headers['content-type'],/json/);
 }finally{await app.close();assert.ok(root.startsWith(join(tmpdir(),'bytepath-delivery-')));rmSync(root,{recursive:true,force:true});}
});
