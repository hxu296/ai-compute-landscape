const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/nc.js'),'utf8'),context);const n=JSON.parse(JSON.stringify(context.window.NC)),provider=s=>n.providers.find(p=>p.name===s);
test('growth endpoints agree with provider cards and each series keeps one definition',()=>{
 for(const [s,metrics] of Object.entries(n.growth))for(const [m,rows] of Object.entries(metrics)){
  const latest=provider(s).latest[m];assert(latest,`${s} ${m} has a profile value`);
  assert.equal(rows.at(-1)[1],latest.value,`${s} ${m} value`);assert.equal(rows.at(-1)[0],latest.as_of,`${s} ${m} date`);
  assert.equal(new Set(rows.map(r=>r[4])).size,1,`${s} ${m} scope`);assert.equal(new Set(rows.map(r=>r[6])).size,1,`${s} ${m} power basis`);
  for(const row of rows){assert.match(row[0],/^\d{4}-\d{2}-\d{2}$/);assert.match(row[3],/^https:\/\//);assert(row[0]<=n.built.slice(0,10));}
 }
});
test('AI and hosting revenue is never replaced by a mining total or another segment',()=>{
 const expected={'IREN':135e6,'Applied Digital':262.6e6,'Core Scientific':215.4e6,'TeraWulf':62986000};
 for(const [s,value] of Object.entries(expected)){assert.equal(provider(s).latest.revenue_usd.value,value);assert.equal(n.growth[s].revenue_usd.at(-1)[1],value);}
 assert.equal(provider('Microsoft Azure').latest.backlog_usd.value,677e9);assert(n.growth['Microsoft Azure'].backlog_usd.every(r=>r[4].includes('commercial RPO')));
 assert.equal(n.growth.Nebius.revenue_usd.find(r=>r[0]==='2025-03-31')[1],50.9e6);
});
test('site phases, legacy mining power and missing periods do not become company trends',()=>{
 assert.equal(provider('IREN').latest.mw_online,null);assert.equal(provider('IREN').documented_power.value,50);assert.equal(provider('IREN').documented_power.n_sites,1);
 assert.deepEqual(n.growth['Hut 8 / Highrise'].mw_online.map(r=>r[1]),[0]);assert.equal(n.growth.Crusoe.mw_online.length,1);
 assert(!n.growth['xAI / SpaceX'].mw_online.some(r=>r[3].includes('epoch.ai')));
 assert.equal(n.growth['Core Scientific'].mw_online.find(r=>r[0]==='2026-03-31')[1],225);assert.equal(n.growth['Core Scientific'].mw_online.find(r=>r[0]==='2026-05-06')[1],243);
 assert.equal(n.growth['Microsoft Azure'].revenue_usd.length,2);assert.equal(n.growth['Alibaba Cloud'].revenue_usd.length,1);
});
test('Core Scientific powered-space tranches carry no chip-inclusive price',()=>{
 const rows=n.contracts.filter(c=>c.supplier==='Core Scientific'&&!c.excluded);assert.equal(rows.length,5);
 for(const c of rows){assert.equal(c.kind,'lease');assert(c.implied_usd_per_kw_month>0);assert(!c.implied_allin_usd_per_kw_month);assert(!c.implied_usd_per_gpu_hour_est);}
 const partnership=rows.find(c=>c.buyer==='AMD');assert.equal(partnership.capacity_mw,530);assert.equal(partnership.value_status,'potential');
});
test('material agreements preserve unpriced capacity bounds and distinguish hardware from services',()=>{
 for(const supplier of ['AMD','NVIDIA','Broadcom']){const c=n.hardware.find(c=>c.buyer==='Meta'&&c.supplier===supplier);assert(c);assert.equal(c.value_usd,undefined);}
 assert.equal(n.hardware.find(c=>c.buyer==='Meta'&&c.supplier==='AMD').capacity_mw_relation,'up to');
 assert.equal(n.hardware.find(c=>c.buyer==='Meta'&&c.supplier==='Broadcom').capacity_mw_relation,'more than');
 const iren=n.contracts.find(c=>c.buyer==='NVIDIA'&&c.supplier==='IREN');assert.equal(iren.value_usd,3.4e9);assert.equal(iren.kind,'compute');
 assert(!n.inference.some(r=>r.subject==='Together AI'));assert(n.prices.some(p=>p.sku==='Ascend 910C'&&p.group==='China'));
});
