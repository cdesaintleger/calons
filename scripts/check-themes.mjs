// Optional browser suite; provide Playwright and its browsers separately.
import { mkdir } from 'node:fs/promises';
const {chromium,webkit,devices}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.TEST_OUTPUT||'/tmp/calons-theme-check';await mkdir(output,{recursive:true});
import assert from 'node:assert/strict';
import {solve,sensorSlopes} from '../src/level.js';
const config={wheelbase:403.5,track:181,maxLevel:3,heights:[7,14,21]};
const a=sensorSlopes(1,-1),expected=solve(a.pitch,a.roll,config);
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='chromium'?chromium.launch({...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),headless:true}):webkit.launch({headless:true}));
 try{
 const context=await browser.newContext({...devices['iPhone 13'],deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(!localStorage.getItem('ducato-cal'))localStorage.setItem('ducato-cal',JSON.stringify({pitch:0,roll:0}));for(const name of ['DeviceMotionEvent','DeviceOrientationEvent']){if(window[name])Object.defineProperty(window[name],'requestPermission',{configurable:true,value:()=>Promise.resolve('granted')});}});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4174');
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='classic');
 await page.getByRole('button',{name:'Activer le capteur',exact:true}).click();
 async function feed(){await page.evaluate(async()=>{for(let i=0;i<48;i++){const e=new Event('deviceorientation');Object.assign(e,{beta:1,gamma:-1});dispatchEvent(e);await new Promise(r=>setTimeout(r,50));}});}
 await feed();await page.getByRole('button',{name:'Activer le son',exact:true}).click();
 for(const [theme,label] of [['light','Clair'],['night','Bleu nuit'],['classic','Classique'],['night','Bleu nuit']]){
  await page.getByRole('button',{name:'Paramètres',exact:true}).click();await page.getByRole('radio',{name:new RegExp(label)}).check();
  assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
  await page.getByRole('button',{name:'Fermer les paramètres',exact:true}).click();
  assert.equal(await page.locator('.sound-toggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('calons-theme'))),theme);
  if(theme!=='classic'){
   await feed();const meters=page.getByRole('meter');assert.equal(await meters.count(),4);
   for(let i=0;i<4;i++)assert.ok(Math.abs(Number(await meters.nth(i).getAttribute('aria-valuenow'))-Math.min(expected.ideal[i],21))<.01);
   for(let i=0;i<4;i++)assert.equal(await page.locator('.modern-wheel strong').nth(i).innerText(),expected.levels[i]?`${expected.heights[i].toLocaleString('fr-FR')} cm`:'Au sol');
   for(const [width,height] of [[320,740],[390,844],[430,932]]){
    await page.setViewportSize({width,height});const d=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}));
    assert.ok(d.height<=height,JSON.stringify({engine,theme,...d}));assert.equal(d.width,width);
   }
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${output}/calons-${engine}-${theme}.png`});
  }
 }
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.theme==='night');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ducato-cal')).pitch),0);
 await page.getByRole('button',{name:'Paramètres',exact:true}).click();await page.locator('.advanced summary').click();await page.getByRole('button',{name:'Simulation',exact:true}).click();
 await page.getByRole('slider',{name:'Avant / arrière'}).fill('2');await page.getByRole('button',{name:'Fermer les paramètres',exact:true}).click();assert.match(await page.locator('.modern-status').innerText(),/Simulation/);
 await page.getByRole('button',{name:'ⓘ Aide',exact:true}).click();await page.getByRole('heading',{name:'Placement et calibration'}).waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Paramètres',exact:true}).click();await page.getByRole('radio',{name:/Classique/}).check();await page.keyboard.press('Escape');await page.getByRole('tab',{name:'Où placer les cales',exact:true}).click();assert.equal(await page.locator('.placement-grid>div').count(),4);
 assert.deepEqual(errors,[]);await page.evaluate(()=>localStorage.setItem('calons-theme','"invalid"'));await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.theme==='classic');
 console.log(engine+': PASS themes, persistence, fallback, audio continuity, solver values, no-scroll mobile layout, simulation, dialogs and classic tabs.');
 }finally{await browser.close();}
}
