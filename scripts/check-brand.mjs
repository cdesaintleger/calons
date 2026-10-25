import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const theme of ['classic','light','night']){
  const page=await browser.newPage({viewport:{width:320,height:740}});
  await page.addInitScript(theme=>localStorage.setItem('calons-theme',JSON.stringify(theme)),theme);
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:4174');
  await page.waitForFunction(()=>document.querySelector('.brand-mark')?.naturalWidth>0);
  for(const width of [320,390,760]){
   await page.setViewportSize({width,height:844});
   const rects=await page.locator('.brand,.sound-toggle,.preferences-button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right};}));
   assert.ok(rects[0].right<=rects[1].x,JSON.stringify({theme,width,rects}));assert.ok(rects[1].right<=rects[2].x);assert.ok(rects[2].right<=width);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.close();
 }console.log(engine+': logo loaded, header controls fit all themes at 320/390/760px');}finally{await browser.close();}
}
