// Token projection to the as-of date (rolled forward daily): each company's latest disclosure on its own dated trend; estimates stay labeled.
(function(){
  const data=window.DEMAND_RESEARCH,est=data&&data.global_estimate;if(!est||!$('#projectionBars'))return;
  const t=n=>n>=1000?(n/1000).toLocaleString('en-US',{maximumFractionDigits:2})+'Q':n.toLocaleString('en-US',{maximumFractionDigits:n<10?1:0})+'T';
  const day=new Date(est.as_of+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});document.querySelectorAll('.projection-date').forEach(e=>e.textContent=day);
  const pct=g=>g==null?'—':'+'+(g*100).toFixed(1)+'%/month';
  const rows=[...est.components].sort((a,b)=>b.central-a.central),max=Math.max(...rows.map(r=>r.high));
  $('#projectionHeadline').innerHTML=`<b>≈${t(est.total.central)} tokens/day</b> (${t(est.total.low)}–${t(est.total.high)}), ${Math.round(100*rows.find(r=>/China/.test(r.name)).central/est.total.central)}% in China.`+(est.spend?` At list prices, ≈$${Math.round(est.spend.total_usd_m_per_day)}M a day of API value (a floor).`:'');
  const w=v=>(100*v/max).toFixed(2)+'%';
  $('#projectionBars').innerHTML=rows.map(r=>`<div class="demand-bar-row projection-row"><div><b class="proj-name">${esc(r.name)}</b></div><div class="demand-bar-track projection-track"><span class="projection-central" style="width:${w(r.central)}"></span>${r.latest_daily?`<span class="projection-latest" style="width:${w(Math.min(r.latest_daily,r.central))}"></span>`:''}<i class="projection-range" style="left:${w(r.low)};width:${w(r.high-r.low)}"></i></div><strong>≈${t(r.central)}<br><span class="small">${t(r.low)}–${t(r.high)}</span></strong></div>`).join('');
  $('#projectionBars').querySelectorAll('.proj-name').forEach((n,i)=>hover(n,`<b>${esc(rows[i].name)}</b>${esc(rows[i].scope)}`));
  // China split into the companies that disclose a daily figure. The national projection stays the total; makers are
  // parts of it at their own dates (not rolled forward), estimates draw as ranges, and the rest is unattributed.
  const cn=rows.find(r=>/China/.test(r.name)),CP=cn?.parts;
  if(CP&&cn){const mk=CP.makers,pt=mk.filter(m=>m.t_per_day!=null),ex=mk.filter(m=>m.t_per_day==null),pts=pt.reduce((a,m)=>a+m.t_per_day,0),lo=pts+ex.reduce((a,m)=>a+(m.t_low||0),0),hi=pts+ex.reduce((a,m)=>a+(m.t_high||0),0);
    const over=lo>cn.central,ua=[Math.max(0,cn.central-hi),Math.max(0,cn.central-lo)],sh=v=>Math.round(100*v/cn.central)+'%';
    // Stacked bar in the same grid and scale as the China row above it: named makers solid, GLM's low end solid plus a
    // hatched range, small makers, and the rest unattributed, adding up to China's projected total.
    const nm=m=>m.name.replace(/ \(.*\)$/,''),lab=m=>`${/more|least/.test(m.relation||'')?'≥':''}${t(m.t_per_day)}`,big=pt.filter(m=>m.t_per_day>=10),small=pt.filter(m=>m.t_per_day<10);
    const COL=['--s1','--s2','--s3','--s5'];let ci0=0;const col=()=>COL[Math.min(ci0++,COL.length-1)];
    const segs=[...big.map(m=>({k:nm(m),v:m.t_per_day,c:col(),tip:`${nm(m)} ${lab(m)} · ${m.date}`})),...ex.flatMap(m=>{const c=col();return[{k:nm(m),v:m.t_low,c,tip:`${nm(m)} ≈${t(m.t_low)}–${t(m.t_high)} (estimate), low end`},{k:nm(m),v:m.t_high-m.t_low,c,hatch:1,tip:`${nm(m)} ≈${t(m.t_low)}–${t(m.t_high)} (estimate), rest of range`}]}),
      {k:'small',v:small.reduce((a,m)=>a+m.t_per_day,0),c:'--s4',tip:small.map(m=>`${nm(m)} ${lab(m)}`).join(', ')},{k:'ua',v:ua[0],c:'--line',tip:`Unattributed ≈${t(ua[0])}–${t(ua[1])}`}].filter(x=>x.v>0);
    const pc=v=>(100*v/cn.central).toFixed(2)+'%',seen=new Set();
    const bar=`<div class="demand-bar-row projection-row cn-row"><div><b>Inside China, by maker</b><br><span class="small">named makers ${sh(lo)}–${sh(hi)}${over?' <b>(conflict: parts exceed the total)</b>':''}</span></div><div class="demand-bar-track projection-track"><div class="cn-bar" style="width:${w(cn.central)}">${segs.map(x=>`<span class="cn-seg${x.hatch?' hatch':''}" style="width:${pc(x.v)};--c:var(${x.c})" title="${esc(x.tip)}"></span>`).join('')}</div></div><strong>≈${t(cn.central)}<br><span class="small">same total</span></strong></div>`;
    const sw=x=>`<i class="${x.hatch?'hatch-sw':''}" style="--c:var(${x.c})"></i>`;
    const legend=`<ul class="cn-legend small">${segs.filter(x=>!x.hatch).map(x=>`<li>${sw(ex.some(m=>nm(m)===x.k)?{...x,hatch:1}:x)}${esc(x.tip.replace(/, low end$/,''))}</li>`).join('')}</ul>`;
    const html=`${bar}<div class="cn-under">${legend}<details class="fig-notes cn-notes"><summary>About this split</summary><p class="small">Each figure is at its own date, not projected; most are lower bounds, so named shares are floors. Platforms that host others’ models are listed, not added: ${CP.platforms.map(p=>`${esc(p.name)} ${/more|least/.test(p.relation||'')?'>':''}${t(p.t_per_day)}`).join(' · ')}. Alibaba, Baidu, MiniMax, Kimi and iFlytek publish growth multiples only. ${esc(CP.national_note)}</p></details></div>`;
    const rowsEl=[...$('#projectionBars').querySelectorAll('.projection-row')],ci=rows.indexOf(cn);if(rowsEl[ci])rowsEl[ci].insertAdjacentHTML('afterend',`<div class="projection-china">${html}</div>`);
    if($('#chinaNationalNote'))$('#chinaNationalNote').textContent=CP.national_note;}
  if(est.spend&&$('#spendNote'))$('#spendNote').textContent=est.spend.note;
  table('#projectionTable',rows.map(r=>({...r,total_central:est.total.central,as_of:est.as_of})),[
    {k:'name',h:'Component',f:r=>`<b>${esc(r.name)}</b><br><span class="small">${esc(r.scope)}</span>`},
    {k:'latest_daily',h:'Latest level',f:r=>r.latest_daily?`${t(r.latest_daily)}/day<br><span class="small">${esc(r.latest_date)}</span>`:'No disclosure'},
    {k:'monthly_growth',h:'Trend used',f:r=>`${pct(r.monthly_growth)}<br><span class="small">${esc(r.growth_basis)}</span>`},
    {k:'central',h:day.replace(/, \d{4}$/,'')+' (E)',f:r=>`<b>≈${t(r.central)}/day</b><br><span class="small">range ${t(r.low)}–${t(r.high)}</span>`},
    {k:'spend_usd_m_per_day',h:'Spend/day (E)',f:r=>r.spend_usd_m_per_day==null?'—':`≈$${r.spend_usd_m_per_day.toFixed(0)}M<br><span class="small">$${r.usd_per_mtok}/Mtok · ${esc(r.spend_kind)}</span>`},
    {k:'note',h:'Notes',f:r=>esc(r.note)+' '+src(r.source_url,'Source ↗')}]);
})();
