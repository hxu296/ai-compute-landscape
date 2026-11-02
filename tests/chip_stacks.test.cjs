const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/nc.js'),'utf8'),sandbox);
const rows=sandbox.window.NC.chip_stacks;
test('stacks have one observation per owner, accelerator and exact date',()=>{
 assert.ok(rows.length>50);const keys=new Set();for(const r of rows){const k=[r.subject,r.gpu_type,r.as_of].join('|');assert.ok(!keys.has(k));keys.add(k);assert.ok(['2025-12-31','2026-03-31'].includes(r.as_of));assert.ok(r.source_url.includes('epoch.ai/data/ai_chip_owners_cumulative_by_chip_type.csv'));assert.ok(r.scope.startsWith('company'));}
});
test('AWS tenant-use subset and official overlay do not double-count the Epoch estimate',()=>{
 const aws=rows.filter(r=>r.subject==='AWS'&&r.gpu_type==='Trainium2'&&r.as_of==='2025-12-31');assert.equal(aws.length,1);assert.equal(aws[0].value,1400284);
});
test('source categories outside the normalized enum remain visible',()=>{
 for(const chip of ['H100/H200','TPU v4','TPU v4i','Trainium1','Instinct MI350X'])assert.ok(rows.some(r=>r.gpu_type===chip&&r.value>0),chip);
});
