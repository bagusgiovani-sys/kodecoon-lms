// Run against a clean production demo server. BASE_URL and CHROME_PATH are optional.
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
const dir=await mkdtemp(join(tmpdir(),'nexus-navigation-'))
const chrome=spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9351',`--user-data-dir=${dir}`,'about:blank'],{windowsHide:true,stdio:'ignore'})
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let socket,seq=0; const pending=new Map(),errors=[]
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value}
async function state(){return evaluate(`({url:location.href,heading:document.querySelector('h1')?.textContent,buttons:[...document.querySelectorAll('button,a')].map(e=>({text:e.innerText,label:e.getAttribute('aria-label')})),body:document.body.innerText.slice(0,1600),timeOrigin:performance.timeOrigin})`)}
async function click(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'nearest',inline:'nearest'})`);await sleep(150);const r=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...r});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r})}
try {
 let pages;for(let i=0;i<50;i++){try{pages=await(await fetch('http://127.0.0.1:9351/json')).json();if(pages.length)break}catch{}await sleep(200)}
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r)
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description)}
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});

 const origin=process.env.BASE_URL ?? 'http://127.0.0.1:3037';
 async function waitFor(expr,label){for(let i=0;i<100;i++){if(await evaluate(expr))return;await sleep(100)}throw Error('Timed out: '+label+' '+JSON.stringify(await state()))}
 async function route(selector,path){await click(selector);await waitFor(`location.pathname===${JSON.stringify(path)} && !!document.querySelector('main h1')`,path);await waitFor("Number(getComputedStyle(document.querySelector('main > div')).opacity)>=.999",'section fully visible');assert.equal(await evaluate('performance.timeOrigin'),born,'no document reload')}
 await send('Page.navigate',{url:origin+'/login'});await waitFor("!!document.querySelector('button[type=submit]')",'login');
 await waitFor("!document.querySelector('[data-testid=nexus-splash]')",'splash exit');await sleep(500);
 const born=await evaluate('performance.timeOrigin');
 await click('button[type=submit]');await waitFor("location.pathname==='/staff'",'immediate login navigation');await waitFor(`!document.querySelector('[aria-label="Welcome, Gio"]')`,'welcome removed');
 console.log('PASS login -> welcome -> workspace');
 await click('[aria-label="Center workspace"]');await sleep(250);await click('[role=option]:nth-child(2)');await waitFor("location.pathname==='/staff/STB/dashboard'",'center');
 for(let round=0;round<2;round++)for(const [selector,path] of [['a[href="/staff/STB/schedule"]','/staff/STB/schedule'],['a[href="/classes"]','/classes'],['a[href="/students"]','/students'],['a[href="/courses"]','/courses'],['a[href="/attendance"]','/attendance'],['a[href="/admin/teachers"]','/admin/teachers'],['a[href="/staff/STB/dashboard"]','/staff/STB/dashboard']]) await route(selector,path);
 console.log('PASS all seven tabs, twice, visible content, no reload');
 await evaluate(`['/students','/courses','/classes','/attendance'].forEach(href=>document.querySelector('a[href="'+href+'"]').click())`);
 await waitFor("location.pathname==='/attendance' && !!document.querySelector('main h1')",'rapid tabs');
 assert.equal(await evaluate('performance.timeOrigin'),born);console.log('PASS rapid tab changes');
 await route('a[href="/staff/STB/dashboard"]','/staff/STB/dashboard');
 await evaluate('history.back()');await waitFor("location.pathname==='/attendance'",'back');await evaluate('history.forward()');await waitFor("location.pathname==='/staff/STB/dashboard'",'forward');
 await route('a[href="/students"]','/students');
 await route('a[href="/students/student-1"]','/students/student-1');
 console.log('PASS history and student details');
 for(const width of [1440,768,390]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:width===390});await sleep(300);
   await click('[aria-label="Color theme"]');await sleep(250);
   assert(await evaluate("(()=>{const r=document.querySelector('[role=listbox]').getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()"),'theme menu within viewport');
   await evaluate("document.querySelector('[role=listbox]').scrollTop=999");await sleep(150);
   assert(await evaluate("!!document.querySelector('[role=listbox]')"),'scroll does not dismiss menu');
   await click('[role=option]:last-child');await sleep(250);assert.equal(await evaluate('document.documentElement.dataset.nexusTheme'),'candy');
   await click('[aria-label="Center workspace"]');await sleep(250);await click('[role=option]:nth-child(3)');await waitFor("location.pathname==='/staff/PIK/dashboard'",'PIK');
   await route('a[href="/students"]','/students');
   assert(await evaluate("document.querySelector('main').innerText.includes('Maya Putri')"),'PIK students');
   assert(!(await evaluate("document.querySelector('main').innerText.includes('Aiden Pratama')")),'no STB student');
   const img=await send('Page.captureScreenshot',{format:'png'});await writeFile(dir+'/width-'+width+'.png',Buffer.from(img.data,'base64'));
   assert.equal(await evaluate('performance.timeOrigin'),born,'no reload at responsive width');
   console.log('PASS center and theme controls at '+width+'px');
 }
 const routeBefore=await evaluate('location.href');await sleep(45000);assert.equal(await evaluate('location.href'),routeBefore);assert.equal(await evaluate('performance.timeOrigin'),born);console.log('PASS idle 45 seconds without refresh');
 await click('[aria-label="Log out"]');await waitFor("!!document.querySelector('button[type=submit]')",'logout');
 await click('a[href="/student/login"]');await sleep(300);await click('button[type=submit]');await waitFor("location.pathname==='/student'",'parent');await sleep(3500);
 assert(!(await evaluate(`!!document.querySelector('[aria-label="Center workspace"]')`)),'parent has no staff selector');
 console.log('PASS parent login and restricted navigation');
 assert.deepEqual(errors,[]);console.log('PASS no browser exceptions. Screenshots: '+dir);
}finally{console.log('BROWSER ERRORS',errors);socket?.close();chrome.kill()}
