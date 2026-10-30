import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
// Exercise generated worker fetch handling without a network, including Vary: Origin.
test('generated worker serves navigation and cross-origin-mode assets from offline cache',async()=>{
 const source=await readFile('dist/sw.js','utf8'),handlers={};
 const base='https://cdesaintleger.github.io/calons/';
 const saved=new Map();let networkCalls=0;
 const cache={addAll:async paths=>{for(const path of paths){const url=new URL(path,base).href;saved.set(url,{body:await readFile('dist/'+path.slice(2)),url})}},match:async(req,options)=>{const url=typeof req==='string'?req:req.url;return typeof req==='object'&&req.asset&&!options?.ignoreVary?undefined:saved.get(url)}};
 vm.runInNewContext(source,{URL,self:{location:{origin:new URL(base).origin},registration:{scope:base},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch:async()=>{networkCalls++;throw new Error('offline')}});
 let installation;handlers.install({waitUntil:p=>installation=p});await installation;
 for(const url of [base,...saved.keys()]){let response;handlers.fetch({request:{method:'GET',url,mode:url===base?'navigate':'cors',asset:url!==base},respondWith:p=>response=p});assert.ok((await response).body.length>0)}
 assert.equal(networkCalls,0);
});


test('production entry uses the configured deployment base', async () => {
 const html = await readFile('dist/index.html', 'utf8');
 const expected = process.env.VITE_BASE_PATH || './';
 const assets = [...html.matchAll(/(?:src|href)="([^"]+\/assets\/[^"]+)"/g)].map(match => match[1]);
 assert.ok(assets.length >= 2, 'JS and CSS must be present');
 for (const asset of assets) assert.ok(asset.startsWith(expected + 'assets/'), asset);
 const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
 assert.equal(manifest.start_url, './');
 assert.equal(manifest.scope, './');
});

test('cache activation removes only old versions of this application scope', async () => {
 const source=await readFile('dist/sw.js','utf8'),handlers={},deleted=[];
 const scope='https://cdesaintleger.github.io/calons/';
 const prefix='calons-'+encodeURIComponent(scope)+'-';
 const hash=source.match(/const CACHE=PREFIX+\+"([a-f0-9]+)"/)[1];
 const current=prefix+hash, old=prefix+'old', other='calons-other-scope-old';
 let claimed=false;
 vm.runInNewContext(source,{URL,self:{registration:{scope},clients:{claim:async()=>{claimed=true}},addEventListener:(name,fn)=>handlers[name]=fn},caches:{keys:async()=>[old,current,other],delete:async key=>deleted.push(key)}});
 let activation;handlers.activate({waitUntil:p=>activation=p});await activation;
 assert.deepEqual(deleted,[old]);assert.equal(claimed,true);
});

// A page added after an older install must not be replaced by the app shell.
test('privacy navigation renders the policy, including a cache miss; unknown pages keep their network response',async()=>{
 const source=await readFile('dist/sw.js','utf8'),handlers={};
 const base='https://cdesaintleger.github.io/calons/',policy=new URL('privacy.html',base).href;
 const index={body:'APPLICATION'},privacy={body:await readFile('dist/privacy.html','utf8')};
 const saved=new Map([[new URL('index.html',base).href,index],[policy,privacy]]);
 const calls=[];
 vm.runInNewContext(source,{URL,self:{location:{origin:new URL(base).origin},registration:{scope:base},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>({match:async request=>saved.get(typeof request==='string'?request:request.url)})},fetch:async request=>{calls.push(request.url);return request.url.startsWith(policy)?privacy:{status:404,body:'NOT FOUND'}}});
 const navigate=async url=>{let response;handlers.fetch({request:{url,method:'GET',mode:'navigate'},respondWith:p=>response=p});return response};
 assert.match((await navigate(policy)).body,/Politique de confidentialité de Calons/);
 saved.delete(policy);
 assert.match((await navigate(policy)).body,/Politique de confidentialité de Calons/);
 assert.match((await navigate(policy+'?fresh=1')).body,/Politique de confidentialité de Calons/);
 assert.equal((await navigate(base+'unknown.html')).status,404);
 assert.equal((await navigate(base)).body,'APPLICATION');
 assert.equal(calls.length,3);
});

test('new offline cache takes over only after all files are cached',async()=>{
 const source=await readFile('dist/sw.js','utf8'),handlers={};
 let complete,activated=false;
 const pending=new Promise(resolve=>complete=resolve);
 vm.runInNewContext(source,{URL,self:{registration:{scope:'https://example.com/calons/'},skipWaiting:async()=>{activated=true},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>({addAll:()=>pending})}});
 let installation;handlers.install({waitUntil:p=>installation=p});
 await Promise.resolve();assert.equal(activated,false);
 complete();await installation;assert.equal(activated,true);
});
