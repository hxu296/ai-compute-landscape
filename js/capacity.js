// Whole measured serving groups; each hardware family keeps its own rack basis.
(function(){
  const legacy=NC.capacity,expanded=window.RESEARCH_CAPACITY;
  if(!legacy||!expanded)return;
  // Only measured GB200/GB300 NVL72 runs; each is the highest output-throughput run per GPU above the speed floor.
  const points=expanded.points,byId=new Map(points.map(p=>[p.result_id,p]));
  const fmt=n=>Math.round(n).toLocaleString('en-US'),tri=n=>(n/1e12).toLocaleString('en-US',{maximumFractionDigits:3})+'T';
  const mainIds=points.map(p=>p.result_id);
  const label=p=>`${p.model.replace('DeepSeek-','')} · ${p.hardware_label} · ${p.interactivity_p90_tok_s_user.toFixed(1)} tok/s/user`;
  // The default boundary is this site's November 2026 global estimate; disclosed presets keep their scopes.
  const global=window.DEMAND_RESEARCH?.global_estimate,presets=[...(global?[{label:`Estimated global traffic, ${global.as_of} · ${Math.round(global.total.central).toLocaleString('en-US')}T/day (E)`,value:Math.round(global.total.central),note:`Central estimate from the projection above (range ${Math.round(global.total.low).toLocaleString('en-US')}–${Math.round(global.total.high).toLocaleString('en-US')}T/day). An estimate, not a measured market total.`}]:[]),...legacy.presets.filter(p=>!/500T/.test(p.label)||p.value==null)];
  presets.forEach((p,i)=>{const option=document.createElement('option');option.value=i;option.textContent=p.label;$('#capacityPreset').appendChild(option);});
  function draw(){
    const volume=$('#capacityVolume').valueAsNumber,q=$('#capacityOutput').valueAsNumber/100,h=$('#capacityCache').valueAsNumber/100,u=$('#capacityUse').valueAsNumber/100;
    const cost=$('#capacityCost').valueAsNumber,power=$('#capacityPower').valueAsNumber;
    const valid=Number.isFinite(volume)&&volume>0&&volume<=1e7&&Number.isFinite(cost)&&cost>=0&&Number.isFinite(power)&&power>=0;
    $('#capacityError').hidden=valid;$('#capacityCopy').disabled=!valid;$('#capacityResults').hidden=!valid;
    if(!valid){$('#capacityPacking').textContent='';$('#capacityProfiles').textContent='';$('#capacityScenario').value='';return;}
    $('#capacityOutputValue').textContent=(q*100).toFixed(1)+'%';$('#capacityCacheValue').textContent=(h*100).toFixed(1)+'%';$('#capacityUseValue').textContent=fmt(u*100)+'%';
    const options={tokensPerDay:volume*1e12,outputShare:q,cacheHit:h,usableCapacity:u};
    const calculate=p=>{
      const rackGpus=72;
      if(p.total_allocated_gpus>rackGpus)return{p,r:null,rackGpus};
      const r=CapacityMath.estimate(p,{...options,costPerGpuHour:cost,powerKwPerGpu:power},{gpus_per_rack:rackGpus});
      return{p,r,rackGpus};
    };
    const all=mainIds.map(id=>calculate(byId.get(id))).sort((a,b)=>(a.r?.racks??Infinity)-(b.r?.racks??Infinity)),rows=all;
    const max=Math.max(1,...rows.map(({r})=>r?.racks||0));
    $('#capacityBars').innerHTML=rows.map(({p,r},i)=>`<div class="capacity-bar-row" data-arch="${esc(p.result_id)}"><b>${esc(p.model.replace('DeepSeek-',''))}<br><span class="small">${esc(p.hardware_label)}</span></b><div class="capacity-bar-track"><div class="capacity-bar-fill" style="width:${100*(r?.racks||0)/max}%"></div></div><strong>${r?`${fmt(r.racks)} racks<span class="cap-mw">≈${fmt(r.powerMw)} MW${r.powerMw>=1000?` (≈${(r.powerMw/1000).toFixed(1)} GW)`:''}</span>`:'Group does not fit'}</strong></div>`).join('')+`<p class="small muted cap-mw-note">MW = facility power at ${power} kW per GPU, all-in (physical GPUs × the kW input).</p>`;
    $('#capacityBars').querySelectorAll('[data-arch]').forEach(node=>{const p=byId.get(node.dataset.arch);if(p?.architecture_note)hover(node,`<b>${esc(p.model)} · ${esc(p.hardware_label)}</b>${esc(p.architecture_note)}<br><span class="small">${fmt(p.output_tps_per_allocated_gpu)} output tok/s per GPU at ${p.interactivity_p90_tok_s_user.toFixed(1)} tok/s/user · run ${esc(p.result_id)}</span>`);});
    $('#capacitySummary').textContent=`At ${tri(options.tokensPerDay)} logical tokens/day, ${(q*100).toFixed(1)}% output and ${fmt(u*100)}% reference capacity. Every rack is a physical 72-GPU NVL72. These are conditional model/hardware scenarios, not equal-quality alternatives or measured facilities.`;
    const comparisons=[...all];for(const row of rows)if(!comparisons.some(x=>x.p.result_id===row.p.result_id))comparisons.push(row);
    const exportRows=comparisons.map(({p,r,rackGpus})=>({model:p.model,hardware:p.hardware_label,result_id:p.result_id,source_url:p.run_url,date_api:p.date_api,p90_tok_s_user:p.interactivity_p90_tok_s_user,physical_gpus_per_group:p.total_allocated_gpus,input_tps:p.input_tps,output_tps:p.output_tps,gpus_per_rack:rackGpus,rack_basis:'physical NVL72 count',rack_estimate:r?.racks??null,physical_gpu_estimate:r?.physicalGpus??null,limiting:r?.limiting??'Group larger than rack; increase assumed rack size',...options}));
    table('#capacityComparison',exportRows,[{k:'model',h:'Model / hardware',f:r=>`<b>${esc(r.model)}</b><br>${esc(r.hardware)}<br>${src(r.source_url,'Result '+r.result_id+' ↗')}`},{k:'p90_tok_s_user',h:'Measured operating point',f:r=>`${r.p90_tok_s_user.toFixed(1)} tok/s/user<br>${r.physical_gpus_per_group} GPUs/group<br><span class="small">API date ${esc(r.date_api)}</span>`},{k:'rack_estimate',h:'Scenario racks',f:r=>r.rack_estimate==null?'Group does not fit':`<b>${fmt(r.rack_estimate)}</b><br>${r.gpus_per_rack} GPUs/rack<br><span class="small">${esc(r.rack_basis)}</span>`},{k:'physical_gpu_estimate',h:'Physical GPUs',f:r=>r.physical_gpu_estimate==null?'Unavailable':fmt(r.physical_gpu_estimate)},{k:'power_mw',h:`Facility power (${power} kW/GPU)`,f:r=>r.physical_gpu_estimate==null?'—':`≈${fmt(r.physical_gpu_estimate*power/1000)} MW`},{k:'limiting',h:'Scale set by',f:r=>esc(r.limiting)}]);
    $('#capacityPacking').innerHTML=rows.map(({p,r,rackGpus})=>`<p><b>${esc(p.model)} · ${esc(p.hardware_label)}:</b> ${r?`${r.groupsPerRack} × ${p.total_allocated_gpus}-GPU groups per rack; ${r.packedGpusPerRack} allocated + ${r.spareGpusPerRack} spare slots. Group rates: ${fmt(p.input_tps)} logical input and ${fmt(p.output_tps)} output tokens/s. Continuous equivalent: ${r.continuousRackEquivalents.toFixed(1)} racks.`:`The ${p.total_allocated_gpus}-GPU group does not fit the assumed ${rackGpus}-GPU rack.`} ${esc(p.physical_count_note)} ${p.count_evidence_url?src(p.count_evidence_url,'Count evidence ↗'):''}</p>`).join('');
    const mix=rows.find(x=>x.r)?.r;
    $('#capacityMix').innerHTML=mix?`<div class="capacity-mix-bar" aria-label="Logical token composition"><span style="width:${100*(1-q)*h}%;background:var(--s4)"></span><span style="width:${100*(1-q)*(1-h)}%;background:var(--s1)"></span><span style="width:${100*q}%;background:var(--s3)"></span></div><div class="legend"><span><i style="background:var(--s4)"></i>${tri(mix.cachedInput)} cached input/day</span><span><i style="background:var(--s1)"></i>${tri(mix.freshInput)} fresh input/day</span><span><i style="background:var(--s3)"></i>${tri(mix.output)} output/day</span></div>`:'';
    const pct=v=>v==null?'not supplied':(v*100).toFixed(1)+'%';
    $('#capacityProfiles').innerHTML=rows.map(({p})=>`<p><b>${esc(p.model)} ${p.result_id}:</b> ${esc(p.framework)} · source precision ${esc(p.precision)} · concurrency ${fmt(p.concurrency)}. Mean logical input ${fmt(p.mean_input_tokens)}; mean output ${fmt(p.mean_output_tokens_actual)} tokens. Reported GPU cache ${pct(p.gpu_cache_hit_rate)}; external cache ${pct(p.external_cache_hit_rate)} (not additive). KV offload: ${esc(p.kv_offloading)}. ${src(p.api_url||legacy.api_urls[p.model],'Raw API ↗')}</p>`).join('');
    const ownershipRows=all.filter(x=>x.r).map(({p,r})=>{return{model:p.model,racks:r.racks,physical_gpus:r.physicalGpus,annual_cost_usd:r.annualCost,power_mw:r.powerMw,source_url:p.run_url,cost_per_gpu_hour:cost,power_kw_per_gpu:power};});
    table('#capacityOwnership',ownershipRows,[{k:'model',h:'Model'},{k:'racks',h:'Racks',f:r=>fmt(r.racks)},{k:'annual_cost_usd',h:'Annual ownership scenario',f:r=>'$'+(r.annual_cost_usd/1e9).toFixed(2)+'B'},{k:'power_mw',h:'All-in power scenario',f:r=>r.power_mw.toFixed(1)+' MW'}]);
    $('#capacityScenario').value=JSON.stringify({assumptions:options,results:exportRows,ownershipResults:ownershipRows,ownershipAssumptions:{costPerGpuHour:cost,powerKwPerGpu:power},method:expanded.method},null,2);
  }
  $('#capacityPreset').onchange=()=>{const p=presets[+$('#capacityPreset').value];if(p.value!=null)$('#capacityVolume').value=p.value;$('#capacityBoundary').innerHTML=esc(p.note)+(p.source_url?' '+src(p.source_url,'Dated disclosure ↗'):'');draw();};
  $('#capacityVolume').addEventListener('input',()=>{$('#capacityPreset').value=presets.length-1;$('#capacityBoundary').textContent=presets.at(-1).note;draw();});
  for(const id of ['capacityOutput','capacityCache','capacityUse','capacityCost','capacityPower',])$('#'+id).addEventListener('input',draw);
  $('#capacityCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#capacityScenario').value);$('#capacityCopy').textContent='Copied';}catch{$('#capacityScenario').hidden=false;$('#capacityScenario').select();$('#capacityCopy').textContent='Select and copy the scenario below';}};
  $('#capacityPreset').onchange();
})();
