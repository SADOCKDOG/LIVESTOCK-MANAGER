const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const PROJECT_ROOT='C:/Users/yo/repo/LIVESTOCK-MANAGER/www'; const PORT=8096; const BASE=`http://localhost:${PORT}`;
function start(){const http=require('http');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};return new Promise(r=>{const s=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(PROJECT_ROOT,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});s.listen(PORT,()=>r(s));});}
(async()=>{const server=await start();const br=await chromium.launch({headless:true});const ctx=await br.newContext({viewport:{width:390,height:844},isMobile:true});const page=await ctx.newPage();
await page.goto(`${BASE}/index.html`,{waitUntil:'domcontentloaded'});
await page.waitForFunction('typeof App!=="undefined"',{timeout:30000});
await page.evaluate(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>/CHAMORRO/i.test(b.textContent));if(b)b.click();});
await page.waitForTimeout(800);
await page.evaluate(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>/ACEPTAR/i.test(b.textContent));if(b)b.click();});
await page.waitForTimeout(3000);
await page.evaluate(()=>{location.hash='#/animales';});
await page.waitForTimeout(2500);
const info=await page.evaluate(()=>{
  const buttons=Array.from(document.querySelectorAll('button, [role="button"]'));
  return buttons.map(b=>({tag:b.tagName, text:b.textContent.trim(), cls:b.className, id:b.id, visible: b.offsetParent!==null})).filter(x=>/SALTAR|SIGUIENTE|NO MOSTRAR/i.test(x.text));
});
console.log(JSON.stringify(info,null,2));
await br.close();server.close();
})();
