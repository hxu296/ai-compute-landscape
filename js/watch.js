// Build-out vs demand, and the dated watch table. All values derive from the site's snapshots; estimates stay labeled.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BuildoutMath=api;})(typeof window!=='undefined'?window:globalThis,function(){
  const CHINA=['ByteDance / Volcano Engine','Huawei Cloud','Alibaba Cloud'],H100E_PER_RACK=72*2.526528549772612,YEARS=['2025','2026','2027','2028'];
  // Supply in GB300 NVL72 rack-equivalents: covered owners' end-2025 fleet plus Epoch-tracked additions, China excluded.
  // scale2028 < 1 counts 2028 additions (mostly Rubin) by memory bandwidth instead of Epoch's 8-bit FLOP H100e.
  function supply(providers,timelines,scale2028=1){
    const base=providers.filter(p=>!CHINA.includes(p.name)).reduce((a,p)=>a+Object.values(p.epoch_designers||{}).reduce((x,y)=>x+y,0),0);
    const t=Object.entries(timelines.providers).filter(([n])=>!CHINA.includes(n)).map(([,v])=>v.h100e);
    let acc=base;const out={'2025':base};
    for(const [i,y] of YEARS.slice(1).entries()){const prev=YEARS[i];acc+=t.reduce((a,h)=>a+Math.max(0,h[y]-h[prev]),0)*(y==='2028'?scale2028:1);out[y]=acc;}
    return Object.fromEntries(Object.entries(out).map(([y,h])=>[y,{h100e:h,racks:h/H100E_PER_RACK}]));
  }
  // Racks of compute needed at year end: tokens grown monthly, divided by measured per-rack throughput, times derate, over serving share.
  function needed(tokensPerDay,perRackTokensPerDay,monthlyGrowth,derate,servingShare,asOf='2026-11-03'){
    if(!(tokensPerDay>0&&perRackTokensPerDay>0&&derate>=1&&servingShare>0&&servingShare<=1&&monthlyGrowth>-1))throw new Error('Invalid build-out inputs');
    return Object.fromEntries(YEARS.map(y=>{const months=(Date.parse(y+'-12-31')-Date.parse(asOf))/864e5/30.4375;return[y,tokensPerDay*(1+monthlyGrowth)**months/perRackTokensPerDay*derate/servingShare];}));
  }
  return{supply,needed,CHINA,H100E_PER_RACK,YEARS};
});
(function(){
  if(typeof document==='undefined')return;
  const D=window.DEMAND_RESEARCH,TL=window.DC_TIMELINES,CAP=window.RESEARCH_CAPACITY;if(!D||!TL||!CAP)return;
  const est=D.global_estimate,china=est.components.find(c=>/China/.test(c.name)),exChina=(est.total.central-china.central)*1e12;
  const perRack=model=>{const p=CAP.points.find(p=>p.model===model);if(!p)return null;const T=1e15,r=CapacityMath.estimate(p,{tokensPerDay:T,outputShare:.02,cacheHit:.98,usableCapacity:1,costPerGpuHour:0,powerKwPerGpu:0},{gpus_per_rack:72});return T/r.continuousRackEquivalents;};
  const mixes=[['DeepSeek-V4.1-Flash','Flash-like'],['DeepSeek-V4-Pro','V4-Pro-like'],['Kimi K3','Kimi-like']].map(([m,l])=>({m,l,rate:perRack(m)})).filter(x=>x.rate);
  let S=BuildoutMath.supply(NC.providers,TL);const S0=S,k=n=>Math.round(n/1000).toLocaleString('en-US')+'k',pct=v=>(v*100).toFixed(v<.1?1:0)+'%',M=n=>(n/1e6).toFixed(1)+'M';
  // Build-out: share of built compute that serving the counted tokens needs, against labs' serving share of compute spend.
  const BAND=[.26,.36];
  if($('#buildoutBars')){
    const draw=()=>{const g=$('#buildGrowth').valueAsNumber/100,d=$('#buildDerate').valueAsNumber;S=BuildoutMath.supply(NC.providers,TL,+($('#buildRubin')?.value||1));
      $('#buildGrowthValue').textContent=(g*100).toFixed(0)+'%/mo';$('#buildDerateValue').textContent=d.toFixed(1)+'×';
      const need=mixes.map(x=>({...x,n:BuildoutMath.needed(exChina,x.rate,g,d,1,est.as_of)})),share=y=>need[1].n[y]/S[y].racks;
      const w=v=>(100*Math.min(1,v)).toFixed(2)+'%';
      $('#buildoutBars').innerHTML=BuildoutMath.YEARS.map(y=>{const lo=Math.min(...need.map(x=>x.n[y]))/S[y].racks,hi=Math.max(...need.map(x=>x.n[y]))/S[y].racks,v=share(y);
        return`<div class="build-row"><b>End-${y}</b><div class="build-track"><span class="build-inf" style="width:${w(v)}"></span><i class="build-band" style="left:${w(BAND[0])};width:${(100*(BAND[1]-BAND[0])).toFixed(2)}%"></i></div><strong>Inference ${pct(v)}${v>1?' (exceeds built)':''}<br><span class="small">${k(S[y].racks)} racks built · model mix ${pct(lo)}–${pct(hi)}</span></strong></div>`;}).join('');
      const cross=BuildoutMath.YEARS.find(y=>share(y)>=BAND[0]);
      $('#buildoutHeadline').innerHTML=`Serving the tokens we count needs <b>${pct(share('2026'))}</b> of the compute built by end-2026 and <b>${pct(share('2028'))}</b> by end-2028. Labs spend 26–36% of compute on serving today and most of the rest on training, so a small share is not spare capacity. `+(cross?`At these settings inference reaches labs’ serving share by <b>end-${cross}</b>; after that, inference and training compete for the same compute.`:`At these settings inference stays below labs’ serving share through 2028, leaving room for training to grow.`);
      $('#buildoutNote').textContent=`Inference = ≈${(exChina/1e12).toFixed(0)}T/day ex-China tokens (${est.as_of}) × ${(g*100).toFixed(0)}%/mo growth ÷ GB300 rack throughput × ${d.toFixed(1)}× real-fleet factor, as a share of built compute (E). Bar uses a DeepSeek-V4-Pro-like model; “model mix” spans V4.1-Flash- to Kimi-K3-like.`;};
    for(const id of ['buildGrowth','buildDerate','buildRubin'])$('#'+id).addEventListener('input',draw);draw();
  }
  // Watch table
  if($('#watchTable')){
    const g=est.components.filter(c=>c.monthly_growth!=null),gw=g.reduce((a,c)=>a+c.central*c.monthly_growth,0)/g.reduce((a,c)=>a+c.central,0);
    const use=d=>BuildoutMath.needed(exChina,mixes[1].rate,0,d,1,est.as_of)['2026']/S0['2026'].racks;
    const mc=n=>(window.LIVE?.market_checks||[]).find(m=>m.name===n),chg=(m,w)=>m?.changes?.[w]?.percent==null?'—':(m.changes[w].percent>0?'+':'')+m.changes[w].percent.toFixed(1)+'%';
    const ago=n=>new Date(Date.parse(String(NC.built).slice(0,10))-n*864e5).toISOString().slice(0,10),recent=n=>NC.contracts.filter(c=>!c.excluded&&String(c.announced||'')>=ago(n));
    const deals=n=>{const cs=recent(n),v=cs.reduce((a,c)=>a+(c.value_usd||0),0),buyers=new Set(cs.filter(c=>c.value_usd).map(c=>c.buyer));return`${cs.length} deal${cs.length===1?'':'s'}${v?` · $${(v/1e9).toFixed(0)}B disclosed${buyers.size===1?`, all one buyer (${[...buyers][0]})`:''}`:' · value not disclosed'}`;};
    const price=(m,n)=>{const v=m?.changes?.['90']?.percent;return v==null?{sig:'neutral',read:'—'}:v>2?{sig:'short',read:`${n} rents up ${v.toFixed(1)}% in 90 days → shortage`}:v<-5?{sig:'slack',read:`${n} rents down ${Math.abs(v).toFixed(1)}% in 90 days → slack`}:{sig:'neutral',read:`${n} rents flat → balanced`};};
    const dealSig=()=>{const cs=recent(90).filter(c=>c.value_usd),buyers=new Set(cs.map(c=>c.buyer));return cs.length?{sig:'short',read:`Buyers still signing${buyers.size===1?`, but all one buyer (${[...buyers][0]}) → concentrated`:''}`}:{sig:'slack',read:'No new valued deals in 90 days'};};
    const W=D.watch||{},a=W.anthropic_12m,h=mc('SemiAnalysis H100'),b=mc('SemiAnalysis B200');
    const rows=[
      {hz:'Now',m:'Logical tokens per day, global (E)',v:`≈${(est.total.central/1000).toFixed(2)}Q (${(est.total.low/1000).toFixed(2)}–${(est.total.high/1000).toFixed(2)}Q)`,c30:`≈+${(100*((1+gw)-1)).toFixed(0)}% trend E`,c90:`≈+${(100*((1+gw)**3-1)).toFixed(0)}% trend E`,sig:gw>.03?'short':'neutral',read:gw>.03?`Demand growing ≈${(gw*100).toFixed(0)}%/month, faster than compute → tight`:'Demand growth slowing',href:'#token-projection',src:'Projection from each company’s dated trend'},
      {hz:'2026–28',m:'H100e delivered → planned, ex-China',v:`${M(S0['2025'].h100e)} delivered by end-2025 → ${M(S0['2026'].h100e)} / ${M(S0['2027'].h100e)} / ${M(S0['2028'].h100e)} by 2026/27/28 (2028 with Rubin on a bandwidth basis: ${M(BuildoutMath.supply(NC.providers,TL,0.619)['2028'].h100e)}–${M(BuildoutMath.supply(NC.providers,TL,0.824)['2028'].h100e)})`,c30:'annual series',c90:'annual series',sig:'watch',read:`Supply ≈${(S0['2028'].h100e/S0['2026'].h100e).toFixed(1)}× from end-2026 to end-2028 → glut if demand or training budgets slow`,href:'#supply',src:'Epoch chip-owner deliveries + tracked data-center timelines'},
      {hz:'2026–28',m:'Share of end-2026 compute that today’s ex-China tokens need for serving',v:`${pct(use(1))} at benchmark – ${pct(use(6))} at 6× real-fleet factor (V4-Pro-like mix, E); labs spend 26–36% on serving`,c30:'—',c90:'—',sig:'watch',read:'Small share is not idle: training and uncounted traffic use the rest; see Build-out',href:'#buildout',src:'Build-out vs demand chart'},
      {hz:'Now',m:'H100 rental, SemiAnalysis composite',v:h?`$${h.usd.toFixed(2)}/hr · ${h.date}`:'—',c30:chg(h,'30'),c90:chg(h,'90'),...price(h,'H100'),href:'#pricing',src:'Daily market feed'},
      {hz:'Now',m:'B200 rental, SemiAnalysis composite',v:b?`$${b.usd.toFixed(2)}/hr · ${b.date}`:'—',c30:chg(b,'30'),c90:chg(b,'90'),...price(b,'B200'),href:'#pricing',src:'Daily market feed'},
      a&&{hz:'Now',m:'Anthropic commitments due next 12 months vs revenue',v:`$${a.due_12m_b}B due vs $${a.revenue_run_rate_b}B revenue run-rate (${(a.due_12m_b/a.revenue_run_rate_b).toFixed(2)}×) · ${(a.due_12m_b/a.compute_expense_run_rate_b).toFixed(1)}× compute-expense run-rate`,c30:'filing',c90:'filing',sig:'risk',read:a.due_12m_b/a.revenue_run_rate_b>=.9?'Buyer committed ≈ its whole revenue → still buying (tight now), but a funding risk':'Commitments well covered by revenue',href:a.source_url,src:'S-1/A, November 2'},
      {hz:'Now',m:'New compute contracts recorded',v:(()=>{const c=[...NC.contracts].filter(c=>!c.excluded&&c.announced).sort((a,b)=>String(b.announced).localeCompare(String(a.announced)))[0];return c?`Latest: ${c.buyer} ← ${c.supplier} · ${String(c.announced).slice(0,10)}`:'—';})(),c30:deals(30),c90:deals(90),...dealSig(),href:'#deals',src:'Contracts table; cancellations not systematically tracked'},
    ,
      W.spacex_2027&&{hz:'2026–28',m:'Planned power vs tracked sites: xAI / SpaceX 2027',v:`≈${W.spacex_2027.company_gw} GW SpaceX estimate (${W.spacex_2027.under_construction_gw} GW under construction) vs ${W.spacex_2027.tracked_gw.toFixed(1)} GW at Epoch-tracked sites; built compute in 2027–28 is a floor`,c30:'report',c90:'report',sig:'watch',read:'More supply coming than tracked sites show → adds glut risk',href:W.spacex_2027.source_url,src:'SemiAnalysis, November 3, 2026; Epoch data-center timelines'},
      W.training_funding&&{hz:'2026–28',m:'Labs’ training budgets (glut trigger)',v:`Training, research and internal use ≈${Math.round(W.training_funding.training_share_low*100)}–${Math.round(W.training_funding.training_share_high*100)}% of Anthropic’s compute spend; $${W.training_funding.short_term_q3_b.toFixed(1)}B short-term compute bought in Q3. A cut in lab training plans is what would free compute for the rental market`,c30:'filing',c90:'filing',sig:'watch',read:'Glut trigger: cuts to training plans would release most lab compute',href:W.training_funding.source_url,src:'Anthropic S-1/A, November 2'},
      W.hopper_2028&&{hz:'2026–28',m:'H100 1-year price in 2028, two precedents (E)',v:`≈$${W.hopper_2028.successor_path_usd.toFixed(2)}/hr if a successor arrives in a shortage (−15–17%) · ≈$${W.hopper_2028.glut_path_usd.toFixed(2)}/hr if supply catches up (−50% in 18 months)`,c30:'scenario',c90:'scenario',sig:'watch',read:'What each path would look like in prices',href:W.hopper_2028.source_url,src:'SemiAnalysis index history: A100 after H100, H100 after B200 and in 2024'}
    ].filter(Boolean).sort((x,y)=>(x.hz==='Now'?0:1)-(y.hz==='Now'?0:1));
    const SIG={short:'Shortage',slack:'Slack',risk:'Risk',watch:'Watch',neutral:'Neutral'};
    table('#watchTable',rows,[{k:'hz',h:'Horizon',f:r=>`<b>${esc(r.hz)}</b>`},{k:'m',h:'Measure',f:r=>`<a href="${r.href}">${esc(r.m)}</a>`},{k:'v',h:'Latest',f:r=>esc(r.v)},{k:'c30',h:'30 / 90 days',f:r=>`${esc(r.c30)}<br><span class="small">${esc(r.c90)}</span>`},{k:'read',h:'Reads as',f:r=>`<span class="sig sig-${r.sig}">${SIG[r.sig]}</span> ${esc(r.read)}`},{k:'src',h:'Basis',f:r=>`<span class="small">${esc(r.src)}</span>`}]);
    const now=rows.filter(r=>r.hz==='Now'),n=t=>now.filter(r=>r.sig===t).length;
    $('#watchVerdict').innerHTML=`<b>Now:</b> ${n('short')} of ${now.length} signals point to a shortage${n('slack')?`, ${n('slack')} to slack`:''}${n('risk')?`; ${n('risk')} flags buyer funding risk`:''}. <b>2026–28:</b> supply keeps growing fast, and the tracked sites undercount it. Compute turns into a glut only if demand growth slows or labs cut training budgets, so those rows are the ones to watch.`;
    $('#watchAsOf').textContent=`As of ${String(NC.built).slice(0,10)} (prices ${String(window.LIVE?.checked_at||'').slice(0,10)}). E = estimate.`;
  }
  // Neocloud and landlord risk: filed backlog, debt, cost of debt and customer concentration.
  const R=D.neocloud_risk;
  if(R&&$('#riskTable')){
    const n=(v,d=1)=>v==null?'—':(+v).toFixed(d),pc=v=>v==null?'—':Math.round(v)+'%';
    $('#riskNote').innerHTML=`Ranked by exposure (six 1–3 factors: backlog cover, cost of debt, concentration, tenor, interest burden, unfinanced build), 1 = most exposed. Backlog grade A filed, B company-stated, C estimated. Latest filings before Q3 results (due Nov 4–12). Landlord rent runs 10–20 years and cloud backlog 2–7, so compare debt ÷ annual contracted revenue. Lambda, Crusoe and Fluidstack disclose too little to compare.`;
    table('#riskTable',R.rows,[
      {k:'rank',h:'Rank',f:r=>`${r.rank}${r.funding_unknown?'<br><span class="small" title="Unfinanced build cost undisclosed; scored at the midpoint">funding unknown</span>':''}`},
      {k:'company',h:'Company',f:r=>`<b>${esc(r.company.replace(/ \(.*\)$/,''))}</b><br><span class="small">${esc(r.model.replace(/ \(.*\)$/,''))}</span>`},
      {k:'backlog_usd_b',h:'Backlog',f:r=>`$${n(r.backlog_usd_b)}B <span class="small">grade ${esc(r.backlog_grade)}</span>`},
      {k:'debt_principal_usd_b',h:'Debt',f:r=>`$${n(r.debt_principal_usd_b,2)}B`},
      {k:'cost_of_debt_effective_pct_D',h:'Cost of debt',f:r=>{const v=r.cost_of_debt_effective_pct_D??r.cost_of_debt_coupon_pct_D;return v==null?'—':n(v)+'%'+(r.cost_of_debt_effective_pct_D==null?' <span class="small">coupon</span>':'');}},
      {k:'D_debt_to_stabilized_annual_contracted_rev',h:'Debt ÷ annual contracted revenue',f:r=>r.D_debt_to_stabilized_annual_contracted_rev==null?(r.D_debt_to_annualized_revenue==null?'—':n(r.D_debt_to_annualized_revenue)+'× revenue'):n(r.D_debt_to_stabilized_annual_contracted_rev)+'×'},
      {k:'unfunded_usd_b',h:'Build not yet financed',f:r=>r.unfunded_usd_b==null&&r.unfunded_mw==null?'—':`<span title="${esc(r.unfunded_basis||'')}">${r.unfunded_usd_b!=null?'$'+n(r.unfunded_usd_b)+'B':''}${r.unfunded_mw?`${r.unfunded_usd_b!=null?' · ':''}${Number(r.unfunded_mw).toLocaleString('en-US')} MW`:''}</span> <span class="small">grade ${esc(r.unfunded_grade||'')}</span>`},
      {k:'top1_pct',h:'Top customer',f:r=>`${pc(r.top1_pct)} ${esc((r.top1_customer||'').replace(/ \(.*$/,''))}${r.top3_pct?`<br><span class="small">top 3: ${pc(r.top3_pct)}</span>`:''}`},
      {k:'backstops',h:'Backstops',f:r=>{const t=r.backstops||'None disclosed.',first=t.split(/(?<=\.)\s/)[0];return`<span class="small" title="${esc(t)}">${esc(first)}${first.length<t.length?' …':''}</span>`;}},
      {k:'period_end',h:'Period',f:r=>`<span class="nw">${esc(String(r.period_end).slice(0,10))}</span>`},
      {k:'filing_url',h:'Source',f:r=>`${src(r.filing_url,'Filing ↗')}<br><span class="small">next ${esc(r.next_report||'')}</span>`}]);
  }
})();
