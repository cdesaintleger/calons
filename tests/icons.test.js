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
