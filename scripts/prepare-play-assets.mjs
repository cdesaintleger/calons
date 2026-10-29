// Render real Calons UI with simulated sensor events; no physical device claim.
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='docs/google-play/assets';
await mkdir(out,{recursive:true});
await copyFile('public/icon-512-v1.3.2.png',`${out}/icone-512.png`);
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
try{
 for(const theme of ['light','night']){
  const page=await browser.newPage({viewport:{width:432,height:768},deviceScaleFactor:2.5});
  await page.addInitScript(theme=>{
   localStorage.setItem('calons-theme',JSON.stringify(theme));
   localStorage.setItem('ducato-cal',JSON.stringify({pitch:0,roll:0}));
   for(const name of ['DeviceMotionEvent','DeviceOrientationEvent'])if(window[name])Object.defineProperty(window[name],'requestPermission',{value:async()=> 'granted',configurable:true});
  },theme);
  await page.goto(process.env.CALONS_URL||'http://127.0.0.1:4174');
  await page.getByRole('button',{name:'Activer le capteur',exact:true}).click();
  await page.evaluate(async()=>{for(let i=0;i<60;i++){const e=new Event('deviceorientation');Object.assign(e,{beta:-.8,gamma:1.1});dispatchEvent(e);await new Promise(r=>setTimeout(r,30));}});
  await page.screenshot({path:`${out}/capture-${theme}.png`,animations:'disabled'});
  const footer=await page.locator('footer').boundingBox();assert.ok(footer.y+footer.height<=768,'Footer must remain visible');
  if(theme==='light'){
   await page.getByRole('button',{name:'Paramètres',exact:true}).click();
   await page.screenshot({path:`${out}/capture-parametres.png`,animations:'disabled'});
  }
  await page.close();
 }
 for(const theme of ['classic','light','night']){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.addInitScript(theme=>localStorage.setItem('calons-theme',JSON.stringify(theme)),theme);
  await page.goto(process.env.CALONS_URL||'http://127.0.0.1:4174');
  await context.setOffline(true);
  await page.getByRole('button',{name:'Paramètres',exact:true}).click();
  await page.locator('summary').filter({hasText:/^Confidentialité$/}).click();
  assert.equal(await page.getByRole('heading',{name:'Politique de confidentialité de Calons',exact:true}).count(),1);
  assert.equal(await page.getByRole('link',{name:'christophe@lindev.fr',exact:true}).getAttribute('href'),'mailto:christophe@lindev.fr');
  await context.close();
  console.log(`${theme}: politique accessible hors ligne`);
 }
 const page=await browser.newPage({viewport:{width:1024,height:500},deviceScaleFactor:1});
 const shot=await readFile(`${out}/capture-night.png`);
 await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;width:1024px;height:500px;overflow:hidden;background:#062941;color:#fff9ec;font-family:Arial,sans-serif}.copy{position:absolute;top:98px;left:64px;width:530px}h1{font-size:60px;letter-spacing:-2px;margin:0 0 18px}p{font-size:28px;line-height:1.3;margin:0 0 26px}.accent{color:#00c9c5}.small{font-size:19px;color:#bed3da}.phone{position:absolute;right:72px;top:24px;height:452px;border:6px solid #31516b;border-radius:28px;box-shadow:0 15px 30px #001522;overflow:hidden}.phone img{height:440px;display:block}.level{width:405px;height:6px;background:#31516b;position:relative;margin-top:32px}.level:after{content:'';width:34px;height:14px;border-radius:10px;background:#00c9c5;position:absolute;top:-4px;left:185px}</style><div class="copy"><h1>Posons-nous<span class="accent">.</span></h1><p>Votre escale à niveau,<br>avec deux cales.</p><div class="small">Guidage sonore · Capteurs natifs · Hors ligne</div><div class="level"></div></div><div class="phone"><img src="data:image/png;base64,${shot.toString('base64')}"></div>`);
 await page.screenshot({path:`${out}/presentation-1024x500.png`,animations:'disabled'});
 await page.close();
 await writeFile('docs/google-play/assets/README.md',`# Visuels Google Play\n\n- Icône : 512 × 512.\n- Présentation : 1024 × 500.\n- Trois captures : 1080 × 1920, interface réelle exécutée dans Chrome avec capteurs simulés (−0,8° / +1,1°), zéro de calibration simulé et dimensions par défaut. Aucune capture physique Android. Le badge du navigateur peut différer de celui de l’APK natif.\n- Régénération : lancer Vite sur le port 4174, puis node scripts/prepare-play-assets.mjs (PLAYWRIGHT_MODULE et CHROME_EXECUTABLE optionnels).\n`);
}finally{await browser.close()}
