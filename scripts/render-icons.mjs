// Render the editable vector source; Playwright/Chromium are optional build tools.
import {readFile,copyFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=await readFile('public/logo.svg','utf8');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
try{
 for(const [file,size,maskable] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512,true],['apple-touch-icon.png',180],['favicon-32.png',32]]){
  const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  const svg=maskable?source.replace('<g id="mark">','<g id="mark" transform="translate(51.2 51.2) scale(.8)">'):source;
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${svg}`);
  await page.screenshot({path:`public/${file.replace('.png','-v1.3.2.png')}`,animations:'disabled'});if(['icon-192.png','icon-512.png'].includes(file))await copyFile(`public/${file.replace('.png','-v1.3.2.png')}`,`public/${file}`);await page.close();
 }
}finally{await browser.close();}
