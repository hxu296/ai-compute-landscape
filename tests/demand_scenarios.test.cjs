const {test}=require('node:test'),assert=require('node:assert/strict');
const {estimate}=require('../js/capacity_math');
const research=require('../research/demand-research.json'),capacity=require('../research/capacity-expanded.json');
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('Flash GB300 includes prefill plus decode and reproduces the small-rack scenario',()=>{
 const p=require('./fixtures/flash-446952.json');assert.equal(p.total_allocated_gpus,34);assert.equal(p.raw_row.num_prefill_gpu,18);assert.equal(p.raw_row.num_decode_gpu,16);
 const options={tokensPerDay:500e12,outputShare:.02,cacheHit:.98,usableCapacity:1,costPerGpuHour:0,powerKwPerGpu:0};
 const r=estimate(p,options,{gpus_per_rack:72});assert.equal(r.racks,214);assert.equal(r.groupsPerRack,2);assert.equal(r.packedGpusPerRack,68);assert.equal(r.physicalGpus,15408);
 assert.equal(estimate(p,{...options,usableCapacity:.7},{gpus_per_rack:72}).racks,305);
 assert.notEqual(p.output_tps_per_allocated_gpu,p.raw_row.metrics.output_tput_per_gpu,'Role-local decode rate must not become an all-GPU denominator');
});
test('one NVL72 run per model: the best output throughput per GPU above 50 tok/s/user, with checked GPU counts',()=>{
 const models=new Set();
 for(const p of capacity.points){
  assert.ok(['gb200','gb300'].includes(p.hardware));assert.equal(p.gpus_per_rack,72);assert.ok(p.interactivity_p90_tok_s_user>50);assert.equal(p.raw_row.benchmark_type,'agentic_traces');
  assert.ok(p.run_url.startsWith('https://github.com/SemiAnalysisAI/InferenceX/'));assert.match(p.physical_count_note,/^Job topology: /);
  const m=p.raw_row.metrics,expected=p.raw_row.disagg?p.raw_row.num_prefill_gpu+p.raw_row.num_decode_gpu:m.total_tput_tps/m.tput_per_gpu;
  close(p.total_allocated_gpus,expected,1e-6);close(p.input_tps/p.total_allocated_gpus,p.input_tps_per_allocated_gpu);
  assert.ok(!models.has(p.model),p.model);models.add(p.model);
 }
 assert.deepEqual([...models].sort(),['DeepSeek-V4-Pro','DeepSeek-V4.1-Flash','GLM-5.2','Kimi K3','Qwen3.8-Flash-Next']);
 assert.equal(capacity.points.find(p=>p.model==='DeepSeek-V4-Pro').result_id,'444884');
 assert.ok(!capacity.points.some(p=>p.raw_model_key==='glm5.3'));assert.ok(capacity.unavailable.some(p=>p.model==='GLM-5.3'));
 const pro=capacity.points.find(p=>p.result_id==='444884');
 const r=estimate(pro,{tokensPerDay:500e12,outputShare:.02,cacheHit:.98,usableCapacity:.7,costPerGpuHour:0,powerKwPerGpu:0},{gpus_per_rack:72});assert.equal(r.groupsPerRack,2);assert.equal(r.limiting,'output');
});
test('November global estimate is the sum of its components, with ordered ranges and no router layer',()=>{
 const g=research.global_estimate;let c=0,l=0,h=0;
 for(const x of g.components){assert.ok(x.low<=x.central&&x.central<=x.high,x.name);c+=x.central;l+=x.low;h+=x.high;assert.ok(!/OpenRouter/.test(x.name));}
 close(g.total.central,Math.round(c*10)/10,1e-3);close(g.total.low,Math.round(l*10)/10,1e-3);close(g.total.high,Math.round(h*10)/10,1e-3);
 const ant=g.components.find(x=>x.name==='Anthropic');close(ant.latest_daily,13.2e9/92/0.8/1e6,2e-3);
 for(const [k,e] of Object.entries(research.token_estimates))assert.ok(e.low<=e.central&&e.central<=e.high,k);
});
test('browser snapshot matches research inputs and unknown provider totals have no numeric values',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../data/research.js'),'utf8'),context);
 const page=JSON.parse(JSON.stringify(context.window.DEMAND_RESEARCH));for(const k of Object.keys(page))assert.deepEqual(page[k],research[k],k);
 assert.ok(page.global_estimate&&page.token_estimates&&!page.threads,'page payload keeps only fields it reads');
 const cap=JSON.parse(JSON.stringify(context.window.RESEARCH_CAPACITY));assert.equal(cap.points.length,capacity.points.length);assert.ok(cap.points.every(p=>!p.raw_row));
 for(const r of research.unavailable_tokens){assert.equal(r.value,undefined);assert.equal(r.show_in_plot,true);assert.ok(r.scope_id);}
 const applied=research.supplemental_tokens.find(r=>r.scope_id==='applied-compute-inference');
 assert.equal(applied.value,1e12);assert.equal(applied.value_relation,'>');assert.equal(applied.period,'day');assert.equal(applied.source_date,'2026-11-02');assert.equal(applied.observation_date,null);
});
