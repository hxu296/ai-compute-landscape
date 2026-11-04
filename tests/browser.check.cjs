// Smoke test of the built page in real Chrome: no script errors and every main view renders.
// Usage: node tests/browser.check.cjs _site/index.html   (CHROME_PATH overrides the browser binary)
const path=require('node:path'),{chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core');
const file=path.resolve(process.argv[2]||'index.html'),exe=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:exe}),errors=[],failures=[];
  for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(`${width}px: ${e.message}`));
    await page.goto('file://'+file);await page.waitForTimeout(500);
    const count=async(sel)=>page.locator(sel).count(),expect=async(name,sel,min)=>{const n=await count(sel);if(n<min)failures.push(`${width}px: ${name} has ${n}, expected at least ${min}`);};
    await expect('watch table rows','#watchTable tbody tr',8);
    await expect('GW per year segments','#gwYearSvg [data-gw-segment]',20);
    await expect('hero map states','#heroMap .usmap-state',48);
    await expect('hero map columns','#heroMap .usmap-col',10);
    await expect('build-out demand line','#buildoutSvg [data-build-need]',1);
    await expect('token chart labels','#tokenSvg text',20);
    await expect('projection rows','#projectionBars .projection-row',6);
    await expect('capacity bars','#capacityBars .capacity-bar-row',3);
    await expect('Fig. 1 bars','#supSvg rect',20);
    await expect('native accelerator bars','#chipStackSvg rect',5);
    await expect('deal rows','#tDeals tbody tr',10);
    await expect('provider cards','#provCards .pcard',20);
    await expect('risk table rows','#riskTable tbody tr',8);
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))failures.push(`${width}px: page overflows horizontally`);
    await page.close();
  }
  await browser.close();
  const problems=[...errors,...failures];
  if(problems.length){console.error(problems.join('\n'));process.exit(1);}
  console.log('Browser check passed at 1440px and 390px');
})().catch(e=>{console.error(e);process.exit(1);});
