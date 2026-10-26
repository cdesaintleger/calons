import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const theme of ['classic','light','night']) for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.addInitScript(theme=>{localStorage.setItem('calons-theme',JSON.stringify(theme));localStorage.setItem('ducato-cal',JSON.stringify({pitch:0,roll:0}));for(const name of ['DeviceMotionEvent','DeviceOrientationEvent'])if(window[name])Object.defineProperty(window[name],'requestPermission',{value:async()=> 'granted',configurable:true});},theme);
  await page.goto('http://127.0.0.1:4174');await page.getByRole('button',{name:'Activer le capteur',exact:true}).click();
  let initial;const warnings=new Set();
  for(const beta of [0,8,0,75,0,-8,0,75,0]){
   await page.evaluate(beta=>{const e=new Event('deviceorientation');Object.assign(e,{beta,gamma:0});dispatchEvent(e);},beta);
   await page.waitForTimeout(180);
   const boxes=await page.locator(theme==='classic'?'.vehicle-stage,.view-tabs':'.modern-map,.modern-prediction,.modern-actions').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}));
   if(!initial)initial=boxes;else assert.deepEqual(boxes,initial,`${engine}/${theme}/${width}, beta ${beta}`);
   if(theme!=='classic') warnings.add(await page.locator('.modern-prediction').getAttribute('class'));
   assert.equal(await page.locator('progress').count(),0);
  }
  if(theme!=='classic')assert.equal(warnings.size,2,'must exercise both residual warning states');
  await page.close();console.log(`${engine}/${theme}/${width}: no layout shift across sensor and residual transitions`);
 }}finally{await browser.close();}
}
