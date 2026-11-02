const {test}=require('node:test'),assert=require('node:assert/strict');
const {estimate}=require('../js/capacity_math'),data=require('../research/capacity.json');
const point=id=>data.points.find(p=>p.result_id===id);
const base={tokensPerDay:40e12,outputShare:.02,cacheHit:.98,usableCapacity:1,costPerGpuHour:1.86,powerKwPerGpu:1.87};
const calc=(id,change={})=>estimate(point(id),{...base,...change},data.hardware);
test('audited 40T example uses whole mixed prefill/decode groups and all physical costs',()=>{
 const r=calc('444911');assert.equal(r.racks,244);assert.equal(r.groupsPerRack,3);assert.equal(r.packedGpusPerRack,60);assert.equal(r.spareGpusPerRack,12);assert.equal(r.physicalGpus,17568);assert.equal(r.annualCost,286245964.8);assert.ok(Math.abs(r.powerMw-32.85216)<1e-8);
});
test('stricter Pro and Flash configurations reproduce independent hand calculations',()=>{
 assert.equal(calc('444914').racks,468);assert.equal(calc('444212').racks,159);assert.equal(calc('446626').racks,51);assert.equal(calc('446626').groupsPerRack,18);
});
test('every per-GPU rate uses all physical allocated GPUs, including aggregate Flash',()=>{
 for(const p of data.points)for(const kind of ['input','output','total'])assert.ok(Math.abs(p[kind+'_tps']/p.total_allocated_gpus-p[kind+'_tps_per_allocated_gpu'])<6e-6);
 assert.equal(point('444212').total_allocated_gpus,4);
});
test('cache composition conserves tokens and cannot invent prefill capacity',()=>{
 const r=calc('444914');assert.equal(r.output,.8e12);assert.equal(r.cachedInput,38.416e12);assert.equal(r.freshInput,.784e12);assert.equal(r.output+r.cachedInput+r.freshInput,40e12);
 const cold=calc('444914',{cacheHit:0});assert.equal(cold.racks,r.racks);assert.equal(cold.freshInput,39.2e12);
});
test('input-only and output-only limits use their own denominators',()=>{
 assert.equal(calc('444914',{outputShare:0}).limiting,'logical input');assert.equal(calc('444914',{outputShare:1}).limiting,'output');assert.equal(calc('444914',{tokensPerDay:0}).racks,0);
});
test('reserving capacity increases rack requirement; invalid inputs cannot produce numbers',()=>{
 assert.ok(calc('444914',{usableCapacity:.7}).racks>calc('444914').racks);
 for(const change of [{outputShare:1.1},{cacheHit:-.1},{usableCapacity:0},{tokensPerDay:NaN}])assert.throws(()=>calc('444914',change));
});
