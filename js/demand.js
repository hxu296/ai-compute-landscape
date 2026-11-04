// Token projection to the as-of date (rolled forward daily): each company's latest disclosure on its own dated trend; estimates stay labeled.
(function(){
  const data=window.DEMAND_RESEARCH,est=data&&data.global_estimate;if(!est||!$('#projectionBars'))return;
  const t=n=>n>=1000?(n/1000).toLocaleString('en-US',{maximumFractionDigits:2})+'Q':n.toLocaleString('en-US',{maximumFractionDigits:n<10?1:0})+'T';
  const day=new Date(est.as_of+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});document.querySelectorAll('.projection-date').forEach(e=>e.textContent=day);
  const pct=g=>g==null?'—':'+'+(g*100).toFixed(1)+'%/month';
  const rows=[...est.components].sort((a,b)=>b.central-a.central),max=Math.max(...rows.map(r=>r.high));
  $('#projectionHeadline').innerHTML=`<b>≈${t(est.total.central)} logical tokens/day</b>, summing the non-overlapping parts below. Range: ${t(est.total.low)}–${t(est.total.high)}. China is ${Math.round(100*rows.find(r=>/China/.test(r.name)).central/est.total.central)}% of the central case.`+(est.spend?` At measured list prices that is ≈$${Math.round(est.spend.total_usd_m_per_day)}M a day (≈$${Math.round(est.spend.total_usd_b_per_year)}B a year) of API-price value, a lower bound.`:'');
  const w=v=>(100*v/max).toFixed(2)+'%';
  $('#projectionBars').innerHTML=rows.map(r=>`<div class="demand-bar-row projection-row"><div><b>${esc(r.name)}</b><br><span class="small">${esc(r.scope)}</span></div><div class="demand-bar-track projection-track"><span class="projection-central" style="width:${w(r.central)}"></span>${r.latest_daily?`<span class="projection-latest" style="width:${w(Math.min(r.latest_daily,r.central))}"></span>`:''}<i class="projection-range" style="left:${w(r.low)};width:${w(r.high-r.low)}"></i></div><strong>≈${t(r.central)}<br><span class="small">${t(r.low)}–${t(r.high)}</span></strong></div>`).join('');
  if(est.spend&&$('#spendNote'))$('#spendNote').textContent=est.spend.note;
  table('#projectionTable',rows.map(r=>({...r,total_central:est.total.central,as_of:est.as_of})),[
    {k:'name',h:'Component',f:r=>`<b>${esc(r.name)}</b><br><span class="small">${esc(r.scope)}</span>`},
    {k:'latest_daily',h:'Latest level',f:r=>r.latest_daily?`${t(r.latest_daily)}/day<br><span class="small">${esc(r.latest_date)}</span>`:'No disclosure'},
    {k:'monthly_growth',h:'Trend used',f:r=>`${pct(r.monthly_growth)}<br><span class="small">${esc(r.growth_basis)}</span>`},
    {k:'central',h:day.replace(/, \d{4}$/,'')+' (E)',f:r=>`<b>≈${t(r.central)}/day</b><br><span class="small">range ${t(r.low)}–${t(r.high)}</span>`},
    {k:'spend_usd_m_per_day',h:'Spend/day (E)',f:r=>r.spend_usd_m_per_day==null?'—':`≈$${r.spend_usd_m_per_day.toFixed(0)}M<br><span class="small">$${r.usd_per_mtok}/Mtok · ${esc(r.spend_kind)}</span>`},
    {k:'note',h:'Notes',f:r=>esc(r.note)+' '+src(r.source_url,'Source ↗')}]);
})();
