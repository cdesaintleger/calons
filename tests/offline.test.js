import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
// Exercise generated worker fetch handling without a network, including Vary: Origin.
test('generated worker serves navigation and cross-origin-mode assets from offline cache',async()=>{
 const source=await readFile('dist/sw.js','utf8'),handlers={};
 const base='https://example.test/van/';
 const saved=new Map();let networkCalls=0;
 const cache={addAll:async paths=>{for(const path of paths){const url=new URL(path,base).href;saved.set(url,{body:await readFile('dist/'+path.slice(2)),url})}},match:async(req,options)=>{const url=typeof req==='string'?req:req.url;return typeof req==='object'&&req.asset&&!options?.ignoreVary?undefined:saved.get(url)}};
 vm.runInNewContext(source,{URL,self:{location:{origin:'https://example.test'},registration:{scope:base},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async()=>{networkCalls++;throw new Error('offline')}});
 let installation;handlers.install({waitUntil:p=>installation=p});await installation;
 for(const url of [base,...saved.keys()]){let response;handlers.fetch({request:{method:'GET',url,mode:url===base?'navigate':'cors',asset:url!==base},respondWith:p=>response=p});assert.ok((await response).body.length>0)}
 assert.equal(networkCalls,0);
});
