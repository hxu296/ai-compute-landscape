const {test}=require('node:test'),assert=require('node:assert/strict');
const math=require('../js/demand_math'),{estimate}=require('../js/capacity_math');
const research=require('../research/demand-research.json'),capacity=require('../research/capacity-expanded.json');
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Anthropic Q3 sensitivity uses consumption revenue and actual quarter days',()=>{
 const q=research.anthropic.periods.find(p=>p.id==='q3');assert.equal(q.days,92);assert.equal(q.consumption_revenue_usd,13.2e9);
 close(math.revenueTokens(q.consumption_revenue_usd,q.days,2),71.73913043478261e12);
 close(math.revenueTokens(q.consumption_revenue_usd,q.days,6),23.91304347826087e12);
 assert.equal(math.revenueTokens(0,92,2),0);
});
test('November growth is explicit, compounds over actual elapsed days and never invents an anchor',()=>{
 const flat=math.extrapolate(40e12,'2026-09-30','2026-11-03',0);assert.equal(flat.days,34);assert.equal(flat.value,40e12);
 const up=math.extrapolate(40e12,'2026-09-30','2026-11-03',.2);close(up.value,40e12*1.2**(34/30.4375));
 assert.throws(()=>math.extrapolate(undefined,'2026-09-30','2026-11-03',.2));
 for(const date of ['2026-02-29','2026-11','bad'])assert.throws(()=>math.extrapolate(1,date,'2026-11-03',0));
 assert.throws(()=>math.extrapolate(1,'2026-11-03','2026-11-02',0));
});
test('cash stress and efficiency have independent assumptions, with no net-loss-to-cash conversion',()=>{
 close(math.runway(131.845,5,10),24.369);close(math.runway(131.845,10,0),13.1845);
 assert.equal(math.gpuDemand(10,10),1);assert.equal(math.gpuDemand(2,10),.2);assert.equal(math.gpuDemand(0,1),0);
 for(const f of [()=>math.runway(1,0,0),()=>math.runway(1,1,2),()=>math.gpuDemand(1,0),()=>math.revenueTokens(1,0,1),()=>math.revenueTokens(1,1,0),()=>math.extrapolate(1,'2026-10-01','2026-11-03',-1)])assert.throws(f);
});
test('Flash GB300 includes prefill plus decode and reproduces the small-rack scenario',()=>{
 const p=capacity.points.find(p=>p.result_id==='446952');assert.equal(p.total_allocated_gpus,34);assert.equal(p.raw_row.num_prefill_gpu,18);assert.equal(p.raw_row.num_decode_gpu,16);
 const options={tokensPerDay:500e12,outputShare:.02,cacheHit:.98,usableCapacity:1,costPerGpuHour:0,powerKwPerGpu:0};
 const r=estimate(p,options,{gpus_per_rack:72});assert.equal(r.racks,214);assert.equal(r.groupsPerRack,2);assert.equal(r.packedGpusPerRack,68);assert.equal(r.physicalGpus,15408);
 assert.equal(estimate(p,{...options,usableCapacity:.7},{gpus_per_rack:72}).racks,305);
 assert.notEqual(p.output_tps_per_allocated_gpu,p.raw_row.metrics.output_tput_per_gpu,'Role-local decode rate must not become an all-GPU denominator');
});
test('only NVL72 runs above 50 tok/s/user, one best run per model and rack type, with checked GPU counts',()=>{
 const keys=new Set();
 for(const p of capacity.points){
  assert.ok(['gb200','gb300'].includes(p.hardware));assert.equal(p.gpus_per_rack,72);assert.ok(p.interactivity_p90_tok_s_user>50);assert.equal(p.raw_row.benchmark_type,'agentic_traces');
  assert.ok(p.run_url.startsWith('https://github.com/SemiAnalysisAI/InferenceX/'));assert.match(p.physical_count_note,/^Job topology: /);
  const m=p.raw_row.metrics,expected=p.raw_row.disagg?p.raw_row.num_prefill_gpu+p.raw_row.num_decode_gpu:m.total_tput_tps/m.tput_per_gpu;
  close(p.total_allocated_gpus,expected,1e-6);close(p.input_tps/p.total_allocated_gpus,p.input_tps_per_allocated_gpu);
  const key=p.model+'|'+p.hardware;assert.ok(!keys.has(key),key);keys.add(key);
 }
 // Pipeline parallelism is missing from the API's tensor-parallel field; the per-GPU rate gives the 16 physical GPUs.
 const kimi=capacity.points.find(p=>p.result_id==='445854');assert.equal(kimi.raw_row.decode_tp,8);assert.equal(kimi.total_allocated_gpus,16);
 assert.ok(!capacity.points.some(p=>p.raw_model_key==='glm5.3'));assert.ok(capacity.points.some(p=>p.raw_model_key==='glm5.2'));
 assert.ok(capacity.unavailable.some(p=>p.model==='GLM-5.3'));assert.ok(capacity.unavailable.some(p=>p.model==='Qwen3.8-Flash-Next'&&/GB200/.test(p.hardware)));
 const pro=capacity.points.find(p=>p.result_id==='444884');assert.equal(pro.total_allocated_gpus,28);
 const r=estimate(pro,{tokensPerDay:500e12,outputShare:.02,cacheHit:.98,usableCapacity:.7,costPerGpuHour:0,powerKwPerGpu:0},{gpus_per_rack:72});assert.equal(r.groupsPerRack,2);assert.equal(r.limiting,'output');
});
test('browser snapshot matches research inputs and unknown provider totals have no numeric values',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/research.js'),'utf8'),context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.window.DEMAND_RESEARCH)),research);
 assert.deepEqual(JSON.parse(JSON.stringify(context.window.RESEARCH_CAPACITY)),capacity);
 for(const r of research.unavailable_tokens){assert.equal(r.value,undefined);assert.equal(r.show_in_plot,true);assert.ok(r.scope_id);}
 const applied=research.supplemental_tokens.find(r=>r.scope_id==='applied-compute-inference');
 assert.equal(applied.value,1e12);assert.equal(applied.value_relation,'>');assert.equal(applied.period,'day');assert.equal(applied.source_date,'2026-11-02');assert.equal(applied.observation_date,null);
});
test('a later anchor is unavailable for an earlier target without clearing other scenarios',()=>{
 const items=[{subject:'Early',anchor_daily:40e12,anchor_high:null,reference:'2026-07-15'},{subject:'Applied Compute',anchor_daily:1e12,anchor_high:null,reference:'2026-11-02'},{subject:'Range',anchor_daily:40e12,anchor_high:50e12,reference:'2026-09-25'}];
 const nov1=math.projectAnchors(items,'2026-11-01',0);
 assert.deepEqual(nov1.rows.map(r=>r.subject),['Early','Range']);assert.deepEqual(nov1.later.map(r=>r.subject),['Applied Compute']);
 assert.equal(nov1.rows[1].scenario_high,50e12);assert.equal(nov1.later[0].scenario_daily,null);
 for(const target of ['2026-11-02','2026-11-03']){const r=math.projectAnchors(items,target,0);assert.equal(r.rows.length,3);assert.equal(r.later.length,0);assert.equal(r.rows.find(x=>x.subject==='Applied Compute').scenario_daily,1e12);}
 close(math.projectAnchors(items,'2026-11-03',.1).rows.find(x=>x.subject==='Early').scenario_daily,40e12*1.1**(111/30.4375));
 assert.throws(()=>math.projectAnchors(items,'2026-11',0));assert.throws(()=>math.projectAnchors(items,'2026-11-03',-1));
});
