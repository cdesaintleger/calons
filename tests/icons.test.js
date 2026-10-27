import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('installable icons reference real PNGs with matching dimensions and dedicated maskable variant',async()=>{
 const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));
 for(const icon of manifest.icons){
  const png=await readFile(`dist/${icon.src}`);assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(icon.sizes,`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
 }
 assert.ok(manifest.icons.some(i=>i.purpose==='any'&&i.sizes==='192x192'));
 assert.ok(manifest.icons.some(i=>i.purpose==='any'&&i.sizes==='512x512'));
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'&&i.sizes==='512x512'));
});
test('browser and Apple icons resolve locally and are precached',async()=>{
 const html=await readFile('dist/index.html','utf8'),sw=await readFile('dist/sw.js','utf8');
 for(const [name,size] of [['favicon-32-v1.3.2.png',32],['apple-touch-icon-v1.3.2.png',180]]){
  assert.ok(html.includes(name));assert.ok(sw.includes(name));
  const png=await readFile(`dist/${name}`);assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
 }
 assert.ok(sw.includes('logo.svg'));
});
test('Android adaptive icon preserves the web mark and its maskable framing',async()=>{
 const root='android/app/src/main/res/';
 const vector=await readFile(root+'drawable/calons_launcher_foreground.xml','utf8');
 const web=await readFile('public/logo.svg','utf8');
 assert.deepEqual([...vector.matchAll(/android:pathData="([^"]+)"/g)].map(m=>m[1]),[...web.matchAll(/ d="([^"]+)"/g)].map(m=>m[1]));
 const attr=name=>Number(vector.match(new RegExp(`android:${name}="([^"]+)"`))[1]);
 const visible=72,webSize=512,webScale=.8;
 for(const axis of ['X','Y']){
  assert.equal(attr('scale'+axis),visible/webSize*webScale);
  assert.equal(attr('translate'+axis),54-webSize/2*attr('scale'+axis));
 }
 assert.equal(attr('viewportWidth'),108);assert.equal(attr('viewportHeight'),108);
 for(const name of ['ic_launcher','ic_launcher_round']){
  const xml=await readFile(root+`mipmap-anydpi-v26/${name}.xml`,'utf8');
  assert.ok(xml.includes('@drawable/calons_launcher_foreground'));
  assert.ok(xml.includes('@color/ic_launcher_background'));
 }
 assert.ok((await readFile(root+'values/ic_launcher_background.xml','utf8')).includes('#062941'));
 for(const color of ['#fff9ec','#00c9c5'])assert.ok(vector.includes(color)&&web.includes(color));
});
