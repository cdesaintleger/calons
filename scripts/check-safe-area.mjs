import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
await mkdir('/tmp/calons-safe-area',{recursive:true});
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const theme of ['classic','light','night']) for(const [width,height] of [[320,740],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.addInitScript(theme=>{localStorage.setItem('calons-theme',JSON.stringify(theme));localStorage.setItem('ducato-cal',JSON.stringify({pitch:0,roll:0}));for(const name of ['DeviceMotionEvent','DeviceOrientationEvent'])if(window[name])Object.defineProperty(window[name],'requestPermission',{value:async()=> 'granted',configurable:true});},theme);
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button',{name:'Activer le capteur',exact:true}).click();
  await page.evaluate(()=>{const e=new Event('deviceorientation');Object.assign(e,{beta:1,gamma:-1});dispatchEvent(e);});
  await page.getByRole('button',{name:'Activer le son',exact:true}).click();
  for(const top of [0,32,48]){
   // Capacitor injects these values; zero simulates old WebViews padded natively.
   await page.evaluate(top=>{document.documentElement.style.setProperty('--safe-area-inset-top',`${top}px`);document.documentElement.style.setProperty('--safe-area-inset-bottom',top?'24px':'0px');},top);
   const button=await page.locator('.sound-toggle').boundingBox();assert.ok(button.y>=top+6,`${engine}/${theme}: overlaps status bar`);
   assert.equal(await page.locator('.author-credit').innerText(),'Par Christophe de saint leger');
   const footer=await page.locator('footer').boundingBox();
   if(theme!=='classic')assert.ok(footer.y+footer.height<=height-(top?24:0),`${engine}/${theme}/${width}: footer outside safe area ${footer.y+footer.height}`);
   if(top===48&&width===390)await page.screenshot({path:`/tmp/calons-safe-area/${engine}-${theme}.png`});
  }
  await page.evaluate(()=>scrollTo(0,100));const sticky=await page.locator('.app-header').boundingBox();assert.ok(sticky.y>=48);
  await page.close();console.log(`${engine}/${theme}/${width}: safe insets and author verified`);
 }}finally{await browser.close();}
}
