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
  // B1 chart
  if($('#buildoutBars')){
    const draw=()=>{const g=$('#buildGrowth').valueAsNumber/100,d=$('#buildDerate').valueAsNumber,s=+$('#buildShare').value;S=BuildoutMath.supply(NC.providers,TL,+($('#buildRubin')?.value||1));
      $('#buildGrowthValue').textContent=(g*100).toFixed(0)+'%/mo';$('#buildDerateValue').textContent=d.toFixed(1)+'×';
      const need=mixes.map(x=>({...x,n:BuildoutMath.needed(exChina,x.rate,g,d,s)})),max=Math.max(...BuildoutMath.YEARS.map(y=>Math.max(S[y].racks,need[1].n[y])))*1.08;
      $('#buildoutBars').innerHTML=BuildoutMath.YEARS.map(y=>{const lo=Math.min(...need.map(x=>x.n[y])),hi=Math.max(...need.map(x=>x.n[y])),mid=need[1].n[y],use=mid/S[y].racks;
        const w=v=>Math.min(100,100*v/max).toFixed(2)+'%';
        return`<div class="build-row"><b>${y==='2025'?'End-2025':'End-'+y}</b><div class="build-track"><span class="build-supply" style="width:${w(S[y].racks)}"></span><i class="build-range" style="left:${w(lo)};width:calc(${w(hi)} - ${w(lo)})"></i><i class="build-need" style="left:${w(mid)}"></i></div><strong>${k(S[y].racks)} built · ${k(mid)} needed<br><span class="small">V4-Pro-like use ${pct(use)} (range ${pct(lo/S[y].racks)}–${pct(hi/S[y].racks)}) E</span></strong></div>`;}).join('');
      $('#buildoutNote').textContent=`Ex-China tokens ≈${(exChina/1e12).toFixed(0)}T/day on Nov 3, grown at ${(g*100).toFixed(0)}%/month. Needed = tokens ÷ measured GB300 rack throughput × ${d.toFixed(1)}× real-world derate ÷ ${s} serving share. Marker: V4-Pro-like mix; line: Flash-like to Kimi-like.`;};
    for(const id of ['buildGrowth','buildDerate','buildShare','buildRubin'])$('#'+id).addEventListener('input',draw);draw();
  }
  // Watch table
  if($('#watchTable')){
    const g=est.components.filter(c=>c.monthly_growth!=null),gw=g.reduce((a,c)=>a+c.central*c.monthly_growth,0)/g.reduce((a,c)=>a+c.central,0);
    const use=d=>BuildoutMath.needed(exChina,mixes[1].rate,0,d,.30)['2026']/S0['2026'].racks;
    const mc=n=>(window.LIVE?.market_checks||[]).find(m=>m.name===n),chg=(m,w)=>m?.changes?.[w]?.percent==null?'—':(m.changes[w].percent>0?'+':'')+m.changes[w].percent.toFixed(1)+'%';
    const ago=n=>new Date(Date.parse(String(NC.built).slice(0,10))-n*864e5).toISOString().slice(0,10),recent=n=>NC.contracts.filter(c=>!c.excluded&&String(c.announced||'')>=ago(n));
    const deals=n=>{const cs=recent(n),v=cs.reduce((a,c)=>a+(c.value_usd||0),0),buyers=new Set(cs.filter(c=>c.value_usd).map(c=>c.buyer));return`${cs.length} deal${cs.length===1?'':'s'}${v?` · $${(v/1e9).toFixed(0)}B disclosed${buyers.size===1?`, all one buyer (${[...buyers][0]})`:''}`:' · value not disclosed'}`;};
    const W=D.watch||{},a=W.anthropic_12m,h=mc('SemiAnalysis H100'),b=mc('SemiAnalysis B200');
    const rows=[
      {hz:'Now',m:'Logical tokens per day, global (E)',v:`≈${(est.total.central/1000).toFixed(2)}Q (${(est.total.low/1000).toFixed(2)}–${(est.total.high/1000).toFixed(2)}Q)`,c30:`≈+${(100*((1+gw)-1)).toFixed(0)}% trend E`,c90:`≈+${(100*((1+gw)**3-1)).toFixed(0)}% trend E`,href:'#token-projection',src:'Projection from each company’s dated trend'},
      {hz:'2026–28',m:'H100e delivered → planned, ex-China',v:`${M(S0['2025'].h100e)} delivered by end-2025 → ${M(S0['2026'].h100e)} / ${M(S0['2027'].h100e)} / ${M(S0['2028'].h100e)} by 2026/27/28 (2028 with Rubin on a bandwidth basis: ${M(BuildoutMath.supply(NC.providers,TL,0.619)['2028'].h100e)}–${M(BuildoutMath.supply(NC.providers,TL,0.824)['2028'].h100e)})`,c30:'annual series',c90:'annual series',href:'#supply',src:'Epoch chip-owner deliveries + tracked data-center timelines'},
      {hz:'2026–28',m:'Today’s ex-China tokens vs end-2026 compute stock',v:`${pct(use(1))} at benchmark – ${pct(use(6))} at 6× derate (V4-Pro-like mix, GPU-count basis, E)`,c30:'—',c90:'—',href:'#buildout',src:'Build-out vs demand chart'},
      {hz:'Now',m:'H100 rental, SemiAnalysis composite',v:h?`$${h.usd.toFixed(2)}/hr · ${h.date}`:'—',c30:chg(h,'30'),c90:chg(h,'90'),href:'#pricing',src:'Daily market feed'},
      {hz:'Now',m:'B200 rental, SemiAnalysis composite',v:b?`$${b.usd.toFixed(2)}/hr · ${b.date}`:'—',c30:chg(b,'30'),c90:chg(b,'90'),href:'#pricing',src:'Daily market feed'},
      a&&{hz:'Now',m:'Anthropic commitments due next 12 months vs revenue',v:`$${a.due_12m_b}B due vs $${a.revenue_run_rate_b}B revenue run-rate (${(a.due_12m_b/a.revenue_run_rate_b).toFixed(2)}×) · ${(a.due_12m_b/a.compute_expense_run_rate_b).toFixed(1)}× compute-expense run-rate`,c30:'filing',c90:'filing',href:a.source_url,src:'S-1/A, November 2'},
      {hz:'Now',m:'New compute contracts recorded',v:(()=>{const c=[...NC.contracts].filter(c=>!c.excluded&&c.announced).sort((a,b)=>String(b.announced).localeCompare(String(a.announced)))[0];return c?`Latest: ${c.buyer} ← ${c.supplier} · ${String(c.announced).slice(0,10)}`:'—';})(),c30:deals(30),c90:deals(90),href:'#deals',src:'Contracts table; cancellations not systematically tracked'},
    ,
      W.hopper_2028&&{hz:'2026–28',m:'H100 1-year price in 2028, two precedents (E)',v:`≈$${W.hopper_2028.successor_path_usd.toFixed(2)}/hr if a successor arrives in a shortage (−15–17%) · ≈$${W.hopper_2028.glut_path_usd.toFixed(2)}/hr if supply catches up (−50% in 18 months)`,c30:'scenario',c90:'scenario',href:W.hopper_2028.source_url,src:'SemiAnalysis index history: A100 after H100, H100 after B200 and in 2024'}
    ].filter(Boolean).sort((x,y)=>(x.hz==='Now'?0:1)-(y.hz==='Now'?0:1));
    table('#watchTable',rows,[{k:'hz',h:'Horizon',f:r=>`<b>${esc(r.hz)}</b>`},{k:'m',h:'Measure',f:r=>`<a href="${r.href}">${esc(r.m)}</a>`},{k:'v',h:'Latest',f:r=>esc(r.v)},{k:'c30',h:'30 days',f:r=>esc(r.c30)},{k:'c90',h:'90 days',f:r=>esc(r.c90)},{k:'src',h:'Basis',f:r=>`<span class="small">${esc(r.src)}</span>`}]);
    $('#watchAsOf').textContent=`As of ${String(NC.built).slice(0,10)} (prices ${String(window.LIVE?.checked_at||'').slice(0,10)}). E = estimate.`;
  }
})();
