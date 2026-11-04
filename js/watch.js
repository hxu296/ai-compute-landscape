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
  // Build-out: inference demand (today's tokens on a tunable growth rate) against the compute being built (Epoch, fixed), monthly to end-2028.
  const BAND=[.26,.36],MID=.30;
  if($('#buildoutSvg')){
    const day=s=>Date.parse(s+'T00:00:00Z'),MON=30.4375*864e5,t0=day(est.as_of),ends=BuildoutMath.YEARS.map(y=>[day(y+'-12-31'),y]);
    const fmt=t=>new Date(t).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'});
    const SC=D.watch?.serving_cost;
    const draw=()=>{const g=$('#buildGrowth').valueAsNumber/100,price=$('#buildPrice').valueAsNumber;S=BuildoutMath.supply(NC.providers,TL,+($('#buildRubin')?.value||1));
      $('#buildGrowthValue').textContent=(g*100).toFixed(0)+'%/mo';$('#buildPriceValue').textContent='$'+price.toFixed(2)+'/h';
      // Built racks between year ends grow geometrically.
      const built=t=>{for(let i=1;i<ends.length;i++){const[a,ya]=ends[i-1],[b,yb]=ends[i];if(t<=b){const f=(t-a)/(b-a);return S[ya].racks*(S[yb].racks/S[ya].racks)**f;}}return S['2028'].racks;};
      const need0=exChina*SC.usd_per_mtok/1e6/(price*24)/72,implied=need0/(exChina/mixes[1].rate),need=t=>need0*(1+g)**((t-t0)/MON),tEnd=ends.at(-1)[0],mEnd=(tEnd-t0)/MON;
      const pts=[];for(let t=t0;t<=tEnd+1;t+=MON/2)pts.push(t);pts.push(tEnd);
      const first=f=>pts.find(t=>f(t)),cross=first(t=>need(t)>=MID*built(t)),all=first(t=>need(t)>=built(t));
      const buildRate=(built(tEnd)/built(t0))**(12/mEnd)-1,breakEven=(MID*built(tEnd)/need0)**(1/mEnd)-1;
      const svg=$('#buildoutSvg'),narrow=(svg.getBoundingClientRect().width||900)<600,W=narrow?420:900,H=narrow?340:330,L=narrow?40:64,R=W-(narrow?78:150),T=16,B=H-34,fs=narrow?12:11,lo=Math.min(need0,built(t0)*BAND[0])/3,hi=built(tEnd)*2.2;
      const x=t=>L+(t-t0)/(tEnd-t0)*(R-L),y=v=>B-(Math.log10(Math.max(v,lo))-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(B-T),line=f=>pts.map((t,i)=>`${i?'L':'M'}${x(t).toFixed(1)},${y(Math.min(f(t),hi)).toFixed(1)}`).join('');
      svg.innerHTML='';svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
      for(let e=Math.ceil(Math.log10(lo));e<=Math.log10(hi);e++){const v=10**e;el('line',{x1:L,x2:R,y1:y(v),y2:y(v),stroke:css('--grid')},svg);el('text',{x:L-8,y:y(v)+4,'text-anchor':'end','font-size':fs},svg).textContent=v>=1e6?(v/1e6)+'M':v>=1e3?(v/1e3)+'k':v;}
      el('text',{x:L-8,y:T-4,'text-anchor':'end','font-size':10},svg).textContent='racks';
      for(const[t,yr]of ends.slice(1)){el('line',{x1:x(t),x2:x(t),y1:T,y2:B,stroke:css('--grid')},svg);el('text',{x:x(t),y:B+16,'text-anchor':'middle','font-size':11},svg).textContent=narrow?yr:'End-'+yr;}
      if(x(ends[1][0])-x(t0)>70)el('text',{x:x(t0),y:B+16,'text-anchor':'start','font-size':11},svg).textContent=fmt(t0);
      // Shortage region: demand above the serving band's midpoint.
      el('path',{d:pts.map((t,i)=>`${i?'L':'M'}${x(t).toFixed(1)},${y(BAND[1]*built(t)).toFixed(1)}`).join('')+[...pts].reverse().map(t=>`L${x(t).toFixed(1)},${y(BAND[0]*built(t)).toFixed(1)}`).join('')+'Z',fill:css('--s1'),opacity:.18},svg);
      el('path',{d:line(built),fill:'none',stroke:css('--ink'),'stroke-width':1.5,'stroke-dasharray':'5 4'},svg);
      el('path',{d:line(t=>MID*built(t)),fill:'none',stroke:css('--s1'),'stroke-width':2.5},svg);
      el('path',{d:line(need),fill:'none',stroke:css('--s2'),'stroke-width':3,'data-build-need':'1'},svg);
      // End labels, pushed apart so close lines stay readable.
      const tags=[[built(tEnd),narrow?'All built':'All compute built',css('--ink')],[MID*built(tEnd),narrow?'Serving 30%':'Serving share (30%)',css('--s1')],[need(tEnd),need(tEnd)>hi?(narrow?'Inference ↑':'Inference ↑ off scale'):(narrow?'Inference':'Inference demand'),css('--s2')]].map(([v,text,color])=>({py:y(Math.min(v,hi))+4,text,color})).sort((a,b)=>a.py-b.py);
      tags.forEach((g,i)=>{if(i&&g.py-tags[i-1].py<15)g.py=tags[i-1].py+15;el('text',{x:R+8,y:g.py,'font-size':12,'font-weight':600,fill:g.color},svg).textContent=g.text;});
      if(cross){el('circle',{cx:x(cross),cy:y(need(cross)),r:6,fill:css('--s2')},svg);el('text',{x:x(cross),y:y(need(cross))-12,'text-anchor':'middle','font-size':12,'font-weight':600,class:'ink'},svg).textContent=(narrow?'':'Shortage from ')+fmt(cross);}
      const pctm=v=>(v*100).toFixed(1)+'%/mo';
      $('#buildoutHeadline').innerHTML=`Compute being built grows <b>≈${Math.round(buildRate*100)}% a year</b> through 2028 (Epoch, fixed). Inference demand grows at the token rate you choose. `+
        (cross?`At <b>${(g*100).toFixed(0)}%/month</b>, inference outgrows labs’ serving share of compute in <b>${fmt(cross)}</b>: from then on there is a <b>shortage</b> unless training gives up compute${all?`, and by ${fmt(all)} inference alone would need everything built`:''}.`:`At <b>${(g*100).toFixed(0)}%/month</b>, inference stays inside labs’ serving share through 2028: <b>room to spare</b> for inference, so any shortage comes from training.`)+
        ` Break-even: <b>≈${pctm(breakEven)}</b> token growth just fills the serving share by end-2028; faster means shortage, slower means oversupply for inference.`;
      $('#buildoutNote').textContent=`Log scale, so slope = growth rate. Inference demand = ≈${(exChina/1e12).toFixed(0)}T/day ex-China tokens (${est.as_of}) × $${SC.usd_per_mtok.toFixed(3)} serving cost per million tokens (Anthropic’s filed cost of revenue ÷ its tokens, ${SC.period}) ÷ $${price.toFixed(2)} per GB300-equivalent hour, grown at ${(g*100).toFixed(0)}%/mo. That is ≈${implied.toFixed(1)}× the GPUs the DeepSeek-V4-Pro benchmark would need. Shaded band = 26–36% of built compute, the share labs spend on serving today (E).`;};
    for(const id of ['buildGrowth','buildPrice','buildRubin'])$('#'+id).addEventListener('input',draw);draw();
    let wideB=innerWidth>=600;addEventListener('resize',()=>{if((innerWidth>=600)!==wideB){wideB=!wideB;draw();}});
  }
  // Watch table
  if($('#watchTable')){
    const g=est.components.filter(c=>c.monthly_growth!=null),gw=g.reduce((a,c)=>a+c.central*c.monthly_growth,0)/g.reduce((a,c)=>a+c.central,0);
    const SCw=D.watch?.serving_cost,use=price=>exChina*SCw.usd_per_mtok/1e6/(price*24)/72/S0['2026'].racks;
    const mc=n=>(window.LIVE?.market_checks||[]).find(m=>m.name===n),chg=(m,w)=>m?.changes?.[w]?.percent==null?'—':(m.changes[w].percent>0?'+':'')+m.changes[w].percent.toFixed(1)+'%';
    const ago=n=>new Date(Date.parse(String(NC.built).slice(0,10))-n*864e5).toISOString().slice(0,10),recent=n=>NC.contracts.filter(c=>!c.excluded&&String(c.announced||'')>=ago(n));
    const deals=n=>{const cs=recent(n),v=cs.reduce((a,c)=>a+(c.value_usd||0),0),buyers=new Set(cs.filter(c=>c.value_usd).map(c=>c.buyer));return`${cs.length} deal${cs.length===1?'':'s'}${v?` · $${(v/1e9).toFixed(0)}B disclosed${buyers.size===1?`, all one buyer (${[...buyers][0]})`:''}`:' · value not disclosed'}`;};
    const price=(m,n)=>{const v=m?.changes?.['90']?.percent;return v==null?{sig:'neutral',read:'—'}:v>2?{sig:'short',read:`${n} rents up ${v.toFixed(1)}% in 90 days → shortage`}:v<-5?{sig:'slack',read:`${n} rents down ${Math.abs(v).toFixed(1)}% in 90 days → slack`}:{sig:'neutral',read:`${n} rents flat → balanced`};};
    const dealSig=()=>{const cs=recent(90).filter(c=>c.value_usd),buyers=new Set(cs.map(c=>c.buyer));return cs.length?{sig:'short',read:`Buyers still signing${buyers.size===1?`, but all one buyer (${[...buyers][0]}) → concentrated`:''}`}:{sig:'slack',read:'No new valued deals in 90 days'};};
    const W=D.watch||{},a=W.anthropic_12m,h=mc('SemiAnalysis H100'),b=mc('SemiAnalysis B200');
    const rows=[
      {hz:'Now',m:'Logical tokens per day, global (E)',v:`≈${(est.total.central/1000).toFixed(2)}Q (${(est.total.low/1000).toFixed(2)}–${(est.total.high/1000).toFixed(2)}Q)`,c30:`≈+${(100*((1+gw)-1)).toFixed(0)}% trend E`,c90:`≈+${(100*((1+gw)**3-1)).toFixed(0)}% trend E`,sig:gw>.03?'short':'neutral',read:gw>.03?`Demand growing ≈${(gw*100).toFixed(0)}%/month, faster than compute → tight`:'Demand growth slowing',href:'#token-projection',src:'Projection from each company’s dated trend'},
      {hz:'2026–28',m:'H100e delivered → planned, ex-China',v:`${M(S0['2025'].h100e)} delivered by end-2025 → ${M(S0['2026'].h100e)} / ${M(S0['2027'].h100e)} / ${M(S0['2028'].h100e)} by 2026/27/28 (2028 with Rubin on a bandwidth basis: ${M(BuildoutMath.supply(NC.providers,TL,0.619)['2028'].h100e)}–${M(BuildoutMath.supply(NC.providers,TL,0.824)['2028'].h100e)})`,c30:'annual series',c90:'annual series',sig:'watch',read:`Supply ≈${(S0['2028'].h100e/S0['2026'].h100e).toFixed(1)}× from end-2026 to end-2028 → glut if demand or training budgets slow`,href:'#supply',src:'Epoch chip-owner deliveries + tracked data-center timelines'},
      {hz:'2026–28',m:'Share of end-2026 compute that today’s ex-China tokens need for serving',v:`${pct(use(7))}–${pct(use(3))} at $7–3 per GB300-equivalent hour, priced at Anthropic’s serving cost per token (E); labs spend 26–36% on serving`,c30:'—',c90:'—',sig:'watch',read:'Small share is not idle: training and uncounted traffic use the rest; see Build-out',href:'#buildout',src:'Build-out vs demand chart'},
      {hz:'Now',m:'H100 rental, SemiAnalysis composite',v:h?`$${h.usd.toFixed(2)}/hr · ${h.date}`:'—',c30:chg(h,'30'),c90:chg(h,'90'),...price(h,'H100'),href:'#pricing',src:'Daily market feed'},
      {hz:'Now',m:'B200 rental, SemiAnalysis composite',v:b?`$${b.usd.toFixed(2)}/hr · ${b.date}`:'—',c30:chg(b,'30'),c90:chg(b,'90'),...price(b,'B200'),href:'#pricing',src:'Daily market feed'},
      a&&{hz:'Now',m:'Anthropic commitments due next 12 months vs revenue',v:`$${a.due_12m_b}B due vs $${a.revenue_run_rate_b}B revenue run-rate (${(a.due_12m_b/a.revenue_run_rate_b).toFixed(2)}×) · ${(a.due_12m_b/a.compute_expense_run_rate_b).toFixed(1)}× compute-expense run-rate`,c30:'filing',c90:'filing',sig:'risk',read:a.due_12m_b/a.revenue_run_rate_b>=.9?'Buyer committed ≈ its whole revenue → still buying (tight now), but a funding risk':'Commitments well covered by revenue',href:a.source_url,src:'S-1/A, November 2'},
      {hz:'Now',m:'New compute contracts recorded',v:(()=>{const c=[...NC.contracts].filter(c=>!c.excluded&&c.announced).sort((a,b)=>String(b.announced).localeCompare(String(a.announced)))[0];return c?`Latest: ${c.buyer} ← ${c.supplier} · ${String(c.announced).slice(0,10)}`:'—';})(),c30:deals(30),c90:deals(90),...dealSig(),href:'#deals',src:'Contracts table; cancellations not systematically tracked'},
    ,
      W.spacex_2027&&{hz:'2026–28',m:'Planned power vs tracked sites: xAI / SpaceX 2027',v:`CEO target ≈${W.spacex_2027.company_gw} GW nameplate by end-2027 vs ${W.spacex_2027.tracked_gw.toFixed(1)} GW facility at Epoch-tracked sites; filed ${W.spacex_2027.filed_gw} GW nameplate (${W.spacex_2027.filed_date}), CFO ${W.spacex_2027.cfo_ye2026_gw} GW by end-2026`,c30:'call',c90:'filing',sig:'watch',read:'Epoch misses most new SpaceX buildings, so tracked supply is a floor → adds glut risk if the target is met',href:W.spacex_2027.source_url,src:'SpaceX Q3 call (Oct 20) and 10-Q; Epoch data-center timelines'},
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
    $('#riskNote').innerHTML=`If AI demand or a big customer falters, who gets hurt first? Each company is scored on six factors from 1 (safe) to 3 (exposed), total 6–18: <b>High</b> 15+, <b>Medium</b> 12–14, <b>Low</b> under 12. Figures are from the latest filings before Q3 results (due Nov 4–12). Grades: A filed, B company-stated, C estimated. Lambda, Crusoe and Fluidstack disclose too little to score.`;
    const FACTORS=[['concentration',r=>`${Math.round(r.top1_pct)}% of revenue from ${(r.top1_customer||'one customer').replace(/ \(.*$/,'')}`],['tenor',()=>'debt comes due before its contracts end'],['funding',r=>r.funding_unknown?'cost of planned build undisclosed':r.unfunded_usd_b?`$${(+r.unfunded_usd_b).toFixed(1)}B of planned build not yet financed`:'planned build needs financing'],['backlog_cover',r=>`backlog only ${(+r.D_backlog_to_debt).toFixed(1)}× its debt`],['cost',r=>`expensive debt (${(+(r.cost_of_debt_effective_pct_D??r.cost_of_debt_coupon_pct_D)).toFixed(1)}%)`],['interest_burden',()=>'interest takes over half of revenue']];
    const level=t=>t>=15?['High','sig-short']:t>=12?['Medium','sig-risk']:['Low','sig-slack'];
    const why=r=>{const hi=FACTORS.filter(([k])=>r.score?.[k]===3).map(([,f])=>f(r));return hi.length?hi.slice(0,3).join('; '):'no factor at the most exposed level';};
    table('#riskTable',R.rows,[
      {k:'company',h:'Company',f:r=>`<b>${esc(r.company.replace(/ \(.*\)$/,''))}</b><br><span class="small">${esc(r.model.replace(/ \(.*\)$/,''))}</span>`},
      {k:'rank',h:'Exposure',f:r=>{const[l,c]=level(r.score?.total||0);return`<span class="sig ${c}">${l}</span><br><span class="small">${r.score?.total??'—'}/18 · #${r.rank}${r.funding_unknown?' · funding unknown':''}</span>`;}},
      {k:'why',h:'Why',f:r=>`<span class="small">${esc(why(r))}</span>`},
      {k:'backlog_usd_b',h:'Backlog (signed, not yet earned)',f:r=>`$${n(r.backlog_usd_b)}B <span class="small">grade ${esc(r.backlog_grade)}</span>`},
      {k:'debt_principal_usd_b',h:'Debt',f:r=>`$${n(r.debt_principal_usd_b,2)}B`},
      {k:'cost_of_debt_effective_pct_D',h:'Interest rate',f:r=>{const v=r.cost_of_debt_effective_pct_D??r.cost_of_debt_coupon_pct_D;return v==null?'—':n(v)+'%'+(r.cost_of_debt_effective_pct_D==null?' <span class="small">coupon</span>':'');}},
      {k:'D_debt_to_stabilized_annual_contracted_rev',h:'Debt ÷ yearly contracted revenue',f:r=>r.D_debt_to_stabilized_annual_contracted_rev==null?(r.D_debt_to_annualized_revenue==null?'—':n(r.D_debt_to_annualized_revenue)+'× revenue'):n(r.D_debt_to_stabilized_annual_contracted_rev)+'×'},
      {k:'unfunded_usd_b',h:'Planned build not yet financed',f:r=>r.unfunded_usd_b==null&&r.unfunded_mw==null?'—':`<span title="${esc(r.unfunded_basis||'')}">${r.unfunded_usd_b!=null?'$'+n(r.unfunded_usd_b)+'B':''}${r.unfunded_mw?`${r.unfunded_usd_b!=null?' · ':''}${Number(r.unfunded_mw).toLocaleString('en-US')} MW`:''}</span> <span class="small">grade ${esc(r.unfunded_grade||'')}</span>`},
      {k:'top1_pct',h:'Largest customer',f:r=>`${pc(r.top1_pct)} ${esc((r.top1_customer||'').replace(/ \(.*$/,''))}${r.top3_pct?`<br><span class="small">top 3: ${pc(r.top3_pct)}</span>`:''}`},
      {k:'backstops',h:'Backstop if a customer defaults',f:r=>{const t=r.backstops||'None disclosed.',first=t.split(/(?<=\.)\s/)[0];return`<span class="small" title="${esc(t)}">${esc(first)}${first.length<t.length?' …':''}</span>`;}},
      {k:'period_end',h:'Data as of',f:r=>`<span class="nw">${esc(String(r.period_end).slice(0,10))}</span>`},
      {k:'filing_url',h:'Source',f:r=>`${src(r.filing_url,'Filing ↗')}<br><span class="small">next ${esc(r.next_report||'')}</span>`}]);
  }
})();
