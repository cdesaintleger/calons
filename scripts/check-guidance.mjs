import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.TEST_OUTPUT||'/tmp/calons-guidance-check';await mkdir(output,{recursive:true});
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='chromium'?chromium.launch({...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),headless:true}):webkit.launch({headless:true}));
 try{
 for(const theme of ['classic','light','night']) for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:width===320?740:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(theme=>{localStorage.setItem('calons-theme',JSON.stringify(theme));localStorage.setItem('ducato-cal',JSON.stringify({pitch:0,roll:0}));for(const name of ['DeviceMotionEvent','DeviceOrientationEvent']){const api=window[name]||class extends Event{};Object.defineProperty(api,'requestPermission',{value:()=>Promise.resolve(window.deny?'denied':'granted'),configurable:true});Object.defineProperty(window,name,{value:api,configurable:true});}},theme);
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:4174');await page.getByRole('button',{name:'Activer le capteur',exact:true}).click();
  await page.getByText('Aucun signal du capteur',{exact:true}).waitFor({timeout:7000});
  await page.evaluate(()=>{const e=new Event('deviceorientation');Object.assign(e,{beta:75,gamma:0});dispatchEvent(e);});
  await page.getByText('Posez le téléphone à plat',{exact:true}).waitFor();
  const notice=await page.locator('.measurement-notice').boundingBox();assert.ok(notice.y>=0&&notice.y+notice.height<844);
  if(theme!=='classic'){
   const rects=await page.locator('.modern-wheel').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));assert.ok(rects[0].bottom<=rects[2].top);
  }
  await page.screenshot({path:`${output}/${engine}-${theme}-${width}.png`,animations:'disabled'});
  await page.evaluate(()=>{const e=new Event('deviceorientation');Object.assign(e,{beta:0,gamma:0});dispatchEvent(e);});
  const acquiring=await page.locator('.measurement-notice').boundingBox();assert.equal(acquiring.height,notice.height);assert.equal(acquiring.y,notice.y);
  await page.evaluate(async()=>{for(let i=0;i<50;i++){const e=new Event('deviceorientation');Object.assign(e,{beta:0,gamma:0});dispatchEvent(e);await new Promise(r=>setTimeout(r,50));}});
  await page.getByRole('progressbar',{name:'Stabilité'}).waitFor();
  assert.equal(await page.locator('progress').getAttribute('value'),'100');
  const stable=await page.locator('.measurement-notice').boundingBox();assert.equal(stable.height,notice.height);assert.equal(stable.y,notice.y);
  await page.screenshot({path:`${output}/${engine}-${theme}-${width}-stable.png`,animations:'disabled'});
  await page.getByText('Mesure en pause',{exact:true}).waitFor({timeout:7000});
  const paused=await page.locator('.measurement-notice').boundingBox();assert.equal(paused.height,notice.height);assert.equal(paused.y,notice.y);assert.equal(await page.locator('progress').getAttribute('value'),'0');
  await page.reload();await page.evaluate(()=>window.deny=true);await page.getByRole('button',{name:'Activer le capteur',exact:true}).click();
  await page.getByText('Accès au capteur à vérifier',{exact:true}).waitFor();assert.deepEqual(errors,[]);
  await page.close();console.log(`${engine}/${theme}: PASS no signal, tilt notice, recovery, pause, permission failure and layout`);
 }
 }finally{await browser.close();}
}
