// Dated evidence and explicit estimates stay on separate surfaces.
(function(){
  const data=window.DEMAND_RESEARCH;if(!data)return;
  const fmt=n=>n.toLocaleString('en-US',{maximumFractionDigits:2}),tri=n=>fmt(n/1e12)+'T';
  const citations=r=>`${src(r.source_url,'Source ↗')}<br><span class="small">${esc(r.source_date?'Published '+r.source_date:'Checked '+(r.checked_at||data.reviewed_at))}</span>`;
  const evidence=(id,rows)=>table(id,rows,[{k:'subject',h:'Company / scope',f:r=>`<b>${esc(r.subject)}</b>`},{k:'claim',h:'Dated evidence',f:r=>esc(r.claim)+badge(r.evidence_category==='R'?'reported':'estimated')},{k:'note',h:'What it establishes',f:r=>esc(r.note)},{k:'source_date',h:'Provenance',f:citations}]);
  evidence('#demandGrowth',data.growth);evidence('#demandCoverage',data.coverage);evidence('#labLiquidity',data.labs);evidence('#trainingCounts',data.training);evidence('#chinaDevelopment',data.china_development);evidence('#inferenceDebate',data.threads);
  data.anthropic.periods.forEach(p=>{const option=document.createElement('option');option.value=p.id;option.textContent=p.label;$('#anthropicPeriod').appendChild(option);});
  function drawAnthropic(){
    const p=data.anthropic.periods.find(p=>p.id===$('#anthropicPeriod').value),price=$('#anthropicPrice').valueAsNumber,growth=$('#anthropicGrowth').valueAsNumber/100;
    try{
      const anchor=DemandMath.revenueTokens(p.consumption_revenue_usd,p.days,price),scenario=DemandMath.extrapolate(anchor,p.reference_date,data.reviewed_at,growth);
      $('#anthropicResult').textContent=`E: ${tri(anchor)} logical tokens/day implied for ${p.label} at an assumed $${fmt(price)}/million; ${tri(scenario.value)}/day in a November 3 scenario with ${fmt(growth*100)}% monthly growth.`;
      $('#anthropicBasis').innerHTML=esc(p.note)+` The period average is used as a scenario baseline at its end (${p.reference_date}), not as a measured end-day rate. November scaling spans ${scenario.days} days. `+p.source_urls.map(url=>src(url,'Filing ↗')).join(' · ');
      const rows=[1,2,6].map(price=>({price,period_daily:DemandMath.revenueTokens(p.consumption_revenue_usd,p.days,price),revenue_usd:p.consumption_revenue_usd,days:p.days,period:p.label,evidence_category:'E',scope:'consumption-billed traffic; subscriptions excluded'}));
      table('#anthropicSensitivity',rows,[{k:'price',h:'Assumed realized $/Mtok',f:r=>'$'+r.price},{k:'period_daily',h:'Implied period average',f:r=>'≈'+tri(r.period_daily)+'/day E'},{k:'scope',h:'Coverage'}]);
    }catch(error){$('#anthropicResult').textContent='Enter a positive realized price and monthly growth between −99% and 1,000%.';$('#anthropicBasis').textContent='Scenario unavailable for invalid inputs.';table('#anthropicSensitivity',[],[{k:'price',h:'No valid scenario'}]);}
  }
  for(const id of ['anthropicPeriod','anthropicPrice','anthropicGrowth'])$('#'+id).addEventListener('input',drawAnthropic);drawAnthropic();
  function drawScenarios(){
    const growth=$('#tokenScenarioGrowth').valueAsNumber/100,target=$('#tokenScenarioDate').value;
    const anchors=TokenMath.latestByScope([...NC.token_snapshot.records,...(data.supplemental_tokens||[])]).filter(r=>r.comparison_group==='platform');
    try{
      if(target<'2026-11-01'||target>'2026-11-03')throw new Error('Use the reviewed November window');
      const rows=anchors.map(r=>{
        const d=TokenMath.daily(r),reference=/^\d{4}-\d{2}-\d{2}$/.test(r.observation_date||'')?r.observation_date:r.source_date;
        const projected=DemandMath.extrapolate(d.value,reference,target,growth),high=d.high==null?null:DemandMath.extrapolate(d.high,reference,target,growth).value;
        return{subject:r.subject,scope:r.display_scope,anchor_daily:d.value,anchor_high:d.high,anchor_bound:TokenMath.boundText(r),reference,reference_basis:r.observation_date?'disclosed observation':'publication used only as scenario reference',days:projected.days,scenario_daily:projected.value,scenario_high:high,target_date:target,assumed_monthly_growth:growth,evidence_category:'E',source_url:r.source_url,note:r.note};
      }).sort((a,b)=>b.scenario_daily-a.scenario_daily);
      $('#tokenScenarioNote').textContent=`E: disclosed anchors scaled to ${target} at an assumed ${fmt(growth*100)}% per month. Zero holds each anchor constant. Bars are scenarios, not measured November usage or new lower bounds. Dates, scopes and token accounting differ; no total is calculated.`;
      const max=Math.max(...rows.map(r=>r.scenario_high||r.scenario_daily),1);
      $('#tokenScenarioBars').innerHTML=rows.map(r=>`<div class="demand-bar-row"><div><b>${esc(r.subject)}</b><br><span class="small">${esc(r.scope)}</span></div><div class="demand-bar-track"><span style="width:${100*r.scenario_daily/max}%"></span></div><strong>≈${tri(r.scenario_daily)}${r.scenario_high!=null?'–'+tri(r.scenario_high):''} E</strong></div>`).join('');
      table('#tokenScenarioTable',rows,[{k:'subject',h:'Company / exact scope',f:r=>`<b>${esc(r.subject)}</b><br>${esc(r.scope)}`},{k:'anchor_daily',h:'Dated daily equivalent',f:r=>`${esc(r.anchor_bound)}${tri(r.anchor_daily)}${r.anchor_high!=null?'–'+tri(r.anchor_high):''}<br>${esc(r.reference)} · ${r.days} days to target<br><span class="small">${esc(r.reference_basis)}</span>`},{k:'scenario_daily',h:'November scenario',f:r=>`≈${tri(r.scenario_daily)}${r.scenario_high!=null?'–'+tri(r.scenario_high):''}/day E`},{k:'note',h:'Source / scope',f:r=>esc(r.note)+' '+src(r.source_url,'Source ↗')}]);
    }catch(error){$('#tokenScenarioNote').textContent='Choose November 1–3, 2026 and monthly growth between −99% and 1,000%.';$('#tokenScenarioBars').textContent='Scenario unavailable.';table('#tokenScenarioTable',[],[{k:'subject',h:'No valid scenario'}]);}
  }
  for(const id of ['tokenScenarioGrowth','tokenScenarioDate'])$('#'+id).addEventListener('input',drawScenarios);drawScenarios();
  function drawRunway(){
    try{const burn=$('#runwayBurn').valueAsNumber,reserve=$('#runwayReserve').valueAsNumber,months=DemandMath.runway(131.845,burn,reserve);$('#runwayResult').textContent=`Stress scenario: ${fmt(months)} months from the September 30 liquidity pool, after $${fmt(reserve)}B reserve, at an assumed $${fmt(burn)}B monthly net cash outflow. This is neither today's measured burn nor a forecast of exhaustion.`;}
    catch(error){$('#runwayResult').textContent='Enter a positive monthly outflow and a reserve from $0B to $131.845B.';}
  }
  for(const id of ['runwayBurn','runwayReserve'])$('#'+id).addEventListener('input',drawRunway);drawRunway();
  function drawEfficiency(){
    try{const demand=$('#demandMultiple').valueAsNumber,efficiency=$('#efficiencyMultiple').valueAsNumber,factor=DemandMath.gpuDemand(demand,efficiency);$('#efficiencyResult').textContent=`At the same model mix, quality, latency and reserve, ${fmt(demand)}× demand ÷ ${fmt(efficiency)}× useful throughput per GPU = ${fmt(factor)}× GPUs. Cached-token accounting and workload shifts can invalidate this simple ratio; neither multiplier is a forecast.`;}
    catch(error){$('#efficiencyResult').textContent='Demand must be nonnegative and efficiency must be positive.';}
  }
  for(const id of ['demandMultiple','efficiencyMultiple'])$('#'+id).addEventListener('input',drawEfficiency);drawEfficiency();
})();
