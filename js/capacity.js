(function(){
  const data=NC.capacity;if(!data)return;
  const byId=new Map(data.points.map(p=>[p.result_id,p])),fmt=n=>Math.round(n).toLocaleString('en-US');
  const money=n=>'$'+(n>=1e9?(n/1e9).toFixed(2)+'B':(n/1e6).toFixed(1)+'M');
  const tri=n=>(n/1e12).toLocaleString('en-US',{maximumFractionDigits:3})+'T';
  const configs={
    '444914':'Pro · 104.6 tok/s/user · 16 GPUs',
    '444911':'Pro · 95.8 tok/s/user · 20 GPUs',
    '446626':'Flash · 112.7 tok/s/user · SGLang',
    '444212':'Flash · 132.5 tok/s/user · vLLM',
    '444210':'Flash · 85.7 tok/s/user · vLLM'
  };
  ['capacityPro','capacityFlash'].forEach((id,i)=>{
    Object.entries(configs).filter(([key])=>byId.get(key).model.endsWith(i?'Flash':'Pro')).forEach(([key,label])=>{
      const o=document.createElement('option');o.value=key;o.textContent=label;$('#'+id).appendChild(o);
    });
    $('#'+id).value=i?'446626':'444914';
  });
  data.presets.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.label;$('#capacityPreset').appendChild(o);});
  function draw(){
    const volume=$('#capacityVolume').valueAsNumber,q=$('#capacityOutput').valueAsNumber/100,h=$('#capacityCache').valueAsNumber/100,u=$('#capacityUse').valueAsNumber/100;
    const options={tokensPerDay:volume*1e12,outputShare:q,cacheHit:h,usableCapacity:u,costPerGpuHour:$('#capacityCost').valueAsNumber,powerKwPerGpu:$('#capacityPower').valueAsNumber};
    const valid=volume>0&&volume<=1e7&&Number.isFinite(options.costPerGpuHour)&&options.costPerGpuHour>=0&&Number.isFinite(options.powerKwPerGpu)&&options.powerKwPerGpu>=0;
    $('#capacityError').hidden=valid;if(!valid){$('#capacityResults').hidden=true;return;}$('#capacityResults').hidden=false;
    $('#capacityOutputValue').textContent=(q*100).toFixed(1)+'%';$('#capacityCacheValue').textContent=(h*100).toFixed(1)+'%';$('#capacityUseValue').textContent=fmt(u*100)+'%';
    const rows=[$('#capacityPro').value,$('#capacityFlash').value].map(id=>{const p=byId.get(id);return {p,r:CapacityMath.estimate(p,options,data.hardware)};});
    const max=Math.max(...rows.map(({r})=>r.racks),1);
    $('#capacityBars').innerHTML=rows.map(({p,r},i)=>`<div class="capacity-bar-row"><b>${i?'V4.1 Flash':'V4 Pro'}</b><div class="capacity-bar-track"><div class="capacity-bar-fill" style="width:${100*r.racks/max}%;background:var(--s${i?3:1})"></div></div><strong>${fmt(r.racks)} racks</strong></div>`).join('');
    $('#capacitySummary').textContent=`At ${tri(options.tokensPerDay)} logical tokens/day and ${fmt(u*100)}% of reference capacity: Pro ≈ ${fmt(rows[0].r.racks)} racks; Flash ≈ ${fmt(rows[1].r.racks)} racks. Both are conditional GB200 NVL72 equivalents, with whole serving groups packed into 72-GPU racks.`;
    $('#capacityComparison').innerHTML='<thead><tr><th>Model / measured configuration</th><th>Rack equivalents</th><th>Physical GPUs</th><th>All-in power</th><th>Annual ownership cost</th></tr></thead><tbody>'+rows.map(({p,r})=>`<tr data-point="${p.result_id}"><td><b>${p.model.replace('DeepSeek-','')}</b><br>${esc(p.framework)} · ${p.interactivity_p90_tok_s_user.toFixed(1)} tok/s/user at P90 latency<br><a href="${esc(p.run_url)}" target="_blank" rel="noopener">Run / result ${p.result_id} ↗</a></td><td><b>${fmt(r.racks)}</b><br><span class="small">${r.limiting} ratio sets scale</span></td><td>${fmt(r.physicalGpus)}</td><td>${r.powerMw.toFixed(1)} MW</td><td>${money(r.annualCost)}<br><span class="small">All 72 GPUs per rack charged</span></td></tr>`).join('')+'</tbody>';
    $('#capacityPacking').innerHTML=rows.map(({p,r})=>`<p><b>${p.model.replace('DeepSeek-','')}:</b> ${r.groupsPerRack} × ${p.total_allocated_gpus}-GPU groups per rack = ${r.packedGpusPerRack} allocated + ${r.spareGpusPerRack} spare GPUs. Each group serves ${fmt(p.input_tps)} logical input + ${fmt(p.output_tps)} output tokens/s. ${p.disaggregated?`${p.prefill_gpus} prefill + ${p.decode_gpus} decode GPUs`:'One 4-GPU aggregate engine'}; concurrency ${p.concurrency}. Continuous equivalent with fractional groups: ${r.continuousRackEquivalents.toFixed(1)} racks.</p>`).join('');
    const mix=rows[0].r;
    $('#capacityMix').innerHTML=`<div class="capacity-mix-bar" aria-label="Logical token composition"><span style="width:${100*(1-q)*h}%;background:var(--s4)"></span><span style="width:${100*(1-q)*(1-h)}%;background:var(--s1)"></span><span style="width:${100*q}%;background:var(--s3)"></span></div><div class="legend"><span><i style="background:var(--s4)"></i>${tri(mix.cachedInput)} cached input/day</span><span><i style="background:var(--s1)"></i>${tri(mix.freshInput)} fresh input/day</span><span><i style="background:var(--s3)"></i>${tri(mix.output)} output/day</span></div>`;
    $('#capacityProfiles').innerHTML=rows.map(({p})=>`<p><b>${p.model.replace('DeepSeek-','')} ${p.result_id}:</b> Mean logical prompt ${fmt(p.mean_input_tokens)} tokens; mean output ${fmt(p.mean_output_tokens_actual)}. Observed GPU cache ${(p.gpu_cache_hit_rate*100).toFixed(1)}%; external cache ${(p.external_cache_hit_rate*100).toFixed(1)}% (a separate reported metric). ${p.kv_offloading==='dram'?'Host DRAM HiCache enabled.':'Offload mode reported off.'} API date ${p.date_api}, retained as source metadata. ${p.speculative_note?esc(p.speculative_note):''}</p>`).join('');
    $('#capacityScenario').value=JSON.stringify({assumptions:options,hardware:data.hardware,results:rows.map(({p,r})=>({result_id:p.result_id,...r})),method:data.method},null,2);
  }
  $('#capacityPreset').onchange=()=>{const p=data.presets[+$('#capacityPreset').value];if(p.value!=null)$('#capacityVolume').value=p.value;$('#capacityBoundary').innerHTML=esc(p.note)+(p.source_url?' '+src(p.source_url,'Dated disclosure ↗'):'');draw();};
  $('#capacityVolume').addEventListener('input',()=>{$('#capacityPreset').value=data.presets.length-1;$('#capacityBoundary').textContent=data.presets.at(-1).note;draw();});
  ['capacityOutput','capacityCache','capacityUse','capacityCost','capacityPower','capacityPro','capacityFlash'].forEach(id=>$('#'+id).addEventListener('input',draw));
  $('#capacityCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#capacityScenario').value);$('#capacityCopy').textContent='Copied';}catch{$('#capacityScenario').hidden=false;$('#capacityScenario').select();$('#capacityCopy').textContent='Select and copy the scenario below';}};
  $('#capacityPreset').onchange();
})();
