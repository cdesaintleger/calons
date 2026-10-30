import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?walk(`${dir}/${e.name}`):`${dir}/${e.name}`))).flat()}
const files=(await walk('dist')).filter(f=>!f.endsWith('/sw.js')).sort();
const hash=createHash('sha256');for(const f of files)hash.update(await readFile(f));
hash.update(await readFile('scripts/service-worker.mjs'));
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js', `const PREFIX='calons-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+${JSON.stringify(version)};
const ASSETS=${JSON.stringify(files.map(f=>'./'+f.slice(5)))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request,{ignoreVary:true});if(hit)return hit;if(e.request.mode==='navigate'){const path=new URL(e.request.url).pathname;const root=new URL('./',self.registration.scope).pathname;if(path===root||path===root+'index.html')return (await c.match(new URL('./index.html',self.registration.scope).href,{ignoreVary:true}))||fetch(e.request)}return fetch(e.request)}))});
`);
console.log('Offline cache generated:', version, files.length, 'files');
