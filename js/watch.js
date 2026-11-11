// Build-out vs demand, and the dated watch table. All values derive from the site's snapshots; estimates stay labeled.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BuildoutMath=api;})(typeof window!=='undefined'?window:globalThis,function(){
  const CHINA=['ByteDance / Volcano Engine','Huawei Cloud','Alibaba Cloud'],H100E_PER_RACK=72*2.526528549772612,YEARS=['2025','2026','2027','2028'];
  // Supply in GB300 NVL72 rack-equivalents: covered owners' end-2025 fleet plus Epoch-tracked additions, China excluded
  // (Chinese companies by name, plus China-located sites in any other bucket, e.g. "Undisclosed owner").
  // scale2028 < 1 counts 2028 additions (mostly Rubin) by memory bandwidth instead of Epoch's 8-bit FLOP H100e.
  function supply(providers,timelines,scale2028=1){
    const base=providers.filter(p=>!CHINA.includes(p.name)).reduce((a,p)=>a+Object.values(p.epoch_designers||{}).reduce((x,y)=>x+y,0),0);
    const t=Object.entries(timelines.providers).filter(([n])=>!CHINA.includes(n)).map(([,v])=>{const cn=(v.sites||[]).filter(s=>s.country==='China');return cn.length?Object.fromEntries(Object.entries(v.h100e).map(([y,h])=>[y,h-cn.reduce((a,s)=>a+(s.h100e?.[y]||0),0)])):v.h100e;});
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
  let BE0=null,BR0=null,CR0=null,G0=null; // Fig. 1 at its default slider values (first draw): break-even, build rate, crossing; quoted in the text growth at the default slider values (first draw), quoted by the lead block
  if($('#buildoutSvg')){
    // Default token growth = today's measured trend (output-weighted across components with a dated trend).
    {const gc=est.components.filter(c=>c.monthly_growth!=null),gt=gc.reduce((x,c)=>x+c.central*c.monthly_growth,0)/gc.reduce((x,c)=>x+c.central,0);if(isFinite(gt))$('#buildGrowth').value=Math.round(gt*100);}
    const day=s=>Date.parse(s+'T00:00:00Z'),MON=30.4375*864e5,t0=day(est.as_of),ends=BuildoutMath.YEARS.map(y=>[day(y+'-12-31'),y]);
    const fmt=t=>new Date(t).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'});
    const SC=D.watch?.serving_cost;
    const draw=()=>{const g=$('#buildGrowth').valueAsNumber/100,price=$('#buildPrice').valueAsNumber,eff=$('#buildEff')?.valueAsNumber||1,eM=eff**(1/12);S=BuildoutMath.supply(NC.providers,TL,+($('#buildRubin')?.value||1));
      $('#buildGrowthValue').textContent=(g*100).toFixed(0)+'%/mo';$('#buildPriceValue').textContent='$'+price.toFixed(2)+'/h';if($('#buildEffValue'))$('#buildEffValue').textContent=eff.toFixed(1)+'×/yr';
      // Built racks between year ends grow geometrically.
      const built=t=>{for(let i=1;i<ends.length;i++){const[a,ya]=ends[i-1],[b,yb]=ends[i];if(t<=b){const f=(t-a)/(b-a);return S[ya].racks*(S[yb].racks/S[ya].racks)**f;}}return S['2028'].racks;};
      const need0=exChina*SC.usd_per_mtok/1e6/(price*24)/72,implied=need0/(exChina/mixes[1].rate),need=t=>need0*((1+g)/eM)**((t-t0)/MON),tEnd=ends.at(-1)[0],mEnd=(tEnd-t0)/MON;
      const pts=[];for(let t=t0;t<=tEnd+1;t+=MON/2)pts.push(t);pts.push(tEnd);
      const grid=[];for(let t=t0;t<=tEnd;t+=864e5)grid.push(t);const first=f=>grid.find(t=>f(t)),cross=first(t=>need(t)>=MID*built(t)),all=first(t=>need(t)>=built(t));
      const buildRate=(built(tEnd)/built(t0))**(12/mEnd)-1,breakEven=((MID*built(tEnd)/need0)**(1/mEnd))*eM-1;if(BE0===null){BE0=breakEven;BR0=buildRate;CR0=cross||null;G0=g;const Sf=S;
        // Fig. 1 at its defaults, frozen, for the stress test (js/neolab.js): it changes only the inputs it names.
        window.BuildoutBase={need0,g,t0,MON,MID,tEnd,cross,all,fmt,rackKw:72*1.87,built:t=>{for(let i=1;i<ends.length;i++){const[a,ya]=ends[i-1],[b,yb]=ends[i];if(t<=b){const f=(t-a)/(b-a);return Sf[ya].racks*(Sf[yb].racks/Sf[ya].racks)**f;}}return Sf['2028'].racks;}};}
      const svg=$('#buildoutSvg'),narrow=(svg.getBoundingClientRect().width||900)<600,W=narrow?420:900,H=narrow?340:330,L=narrow?40:64,R=W-(narrow?96:150),T=16,B=H-34,fs=narrow?12:11,lo=Math.min(need0,built(t0)*BAND[0])/3,hi=built(tEnd)*2.2;
      const x=t=>L+(t-t0)/(tEnd-t0)*(R-L),y=v=>B-(Math.log10(Math.max(v,lo))-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(B-T),line=f=>pts.map((t,i)=>`${i?'L':'M'}${x(t).toFixed(1)},${y(Math.min(f(t),hi)).toFixed(1)}`).join('');
      svg.innerHTML='';svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
      for(let e=Math.ceil(Math.log10(lo));e<=Math.log10(hi);e++){const v=10**e;el('line',{x1:L,x2:R,y1:y(v),y2:y(v),stroke:css('--grid')},svg);el('text',{x:L-8,y:y(v)+4,'text-anchor':'end','font-size':fs},svg).textContent=v>=1e6?(v/1e6)+'M':v>=1e3?(v/1e3)+'k':v;}
      el('text',{x:L-8,y:T-4,'text-anchor':'start','font-size':10},svg).textContent=narrow?'GB300 racks':'GB300 rack-equivalents (log scale)';
      for(const[t,yr]of ends.slice(1)){el('line',{x1:x(t),x2:x(t),y1:T,y2:B,stroke:css('--grid')},svg);el('text',{x:x(t),y:B+16,'text-anchor':'middle','font-size':11},svg).textContent=narrow?yr:'End-'+yr;}
      if(x(ends[1][0])-x(t0)>70)el('text',{x:x(t0),y:B+16,'text-anchor':'start','font-size':11},svg).textContent=fmt(t0);
      // Three regions of the plane: inference fits in today's serving share (green), inference takes compute from training
      // (amber), not enough compute at all (light red, above everything built).
      const area=(up,lo,attrs)=>el('path',{d:pts.map((t,i)=>`${i?'L':'M'}${x(t).toFixed(1)},${y(Math.min(up(t),hi)).toFixed(1)}`).join('')+[...pts].reverse().map(t=>`L${x(t).toFixed(1)},${y(Math.min(lo(t),hi)).toFixed(1)}`).join('')+'Z',...attrs},svg);
      area(t=>MID*built(t),()=>lo,{fill:css('--s3'),opacity:.14,'data-area':'fits'});
      area(built,t=>MID*built(t),{fill:css('--s4'),opacity:.16,'data-area':'from-training'});
      area(()=>hi,built,{fill:css('--s2'),opacity:.12,'data-area':'short'});
      // Shortage region: demand above the serving band's midpoint.
      el('path',{d:pts.map((t,i)=>`${i?'L':'M'}${x(t).toFixed(1)},${y(BAND[1]*built(t)).toFixed(1)}`).join('')+[...pts].reverse().map(t=>`L${x(t).toFixed(1)},${y(BAND[0]*built(t)).toFixed(1)}`).join('')+'Z',fill:css('--s1'),opacity:.18},svg);
      el('path',{d:line(built),fill:'none',stroke:css('--ink'),'stroke-width':1.5,'stroke-dasharray':'5 4'},svg);
      el('path',{d:line(t=>MID*built(t)),fill:'none',stroke:css('--s1'),'stroke-width':2.5},svg);
      const zone=t=>need(t)>=built(t)?'--s2':need(t)>=MID*built(t)?'--s4':'--s3';
      el('path',{d:line(need),fill:'none',stroke:css('--ink'),'stroke-width':4.5,opacity:.12,'data-build-need':'1'},svg);
      for(let k=1;k<pts.length;k++){const a=pts[k-1],b2=pts[k];el('line',{x1:x(a).toFixed(1),y1:y(Math.min(need(a),hi)).toFixed(1),x2:x(b2).toFixed(1),y2:y(Math.min(need(b2),hi)).toFixed(1),stroke:css(zone(b2)),'stroke-width':3,'stroke-linecap':'round'},svg);}
      // End labels, pushed apart so close lines stay readable.
      const tags=[[built(tEnd),narrow?'All built':'All compute built',css('--ink')],[MID*built(tEnd),narrow?'Serving 30%':'Serving share (30%)',css('--s1')],[need(tEnd),need(tEnd)>hi?(narrow?'Inference ↑':'Inference ↑ off scale'):(narrow?'Inference':'Inference demand'),css('--ink')]].map(([v,text,color])=>({py:y(Math.min(v,hi))+4,text,color})).sort((a,b)=>a.py-b.py);
      tags.forEach((g,i)=>{if(i&&g.py-tags[i-1].py<19)g.py=tags[i-1].py+19;el('text',{x:R+8,y:g.py,'font-size':12,'font-weight':600,fill:g.color},svg).textContent=g.text;});
      if(cross){el('circle',{cx:x(cross),cy:y(need(cross)),r:6,fill:css('--s4'),stroke:'#fff','stroke-width':1.5},svg);el('text',{x:x(cross),y:y(need(cross))+22,'text-anchor':'middle','font-size':12,'font-weight':600,class:'ink'},svg).textContent=(narrow?'':'Outgrows today’s serving share · ')+fmt(cross);}
      if(all){el('circle',{cx:x(all),cy:y(need(all)),r:6,fill:css('--s2'),stroke:'#fff','stroke-width':1.5},svg);el('text',{x:x(all),y:y(need(all))-12,'text-anchor':'middle','font-size':12,'font-weight':600,class:'ink'},svg).textContent=(narrow?'':'Real shortage · ')+fmt(all);}
      const pctm=v=>(v*100).toFixed(1)+'%/mo';
      // Same crossing with Meta's own fleet left out (mostly recommender and ads work, so the lab split fits it worst).
      const META='Meta (own use)',SM=BuildoutMath.supply(NC.providers.filter(p=>p.name!==META),{...TL,providers:Object.fromEntries(Object.entries(TL.providers).filter(([n])=>n!==META))},+($('#buildRubin')?.value||1));
      const builtM=t=>{for(let i=1;i<ends.length;i++){const[a,ya]=ends[i-1],[b,yb]=ends[i];if(t<=b){const f=(t-a)/(b-a);return SM[ya].racks*(SM[yb].racks/SM[ya].racks)**f;}}return SM['2028'].racks;},crossM=first(t=>need(t)>=MID*builtM(t)),metaShare=1-SM['2025'].racks/S['2025'].racks;
      $('#buildoutHeadline').innerHTML=`Tracked compute grows <b>≈${Math.round(buildRate*100)}% a year</b> through 2028. `+
        (cross?`At <b>${(g*100).toFixed(0)}%/month</b>, inference outgrows today’s serving share in <b>${fmt(cross)}</b>. After that it takes compute from training. `+(all?`At that pace, ≈${Math.round((1+g)**((all-t0)/MON))}× today’s tokens would need <b>more than all tracked compute</b> by <b>${fmt(all)}</b>. Read that as a warning, not a forecast.`:`It stays below all tracked compute through 2028: <b>no outright shortage</b>.`):`At <b>${(g*100).toFixed(0)}%/month</b>, inference fits inside today’s serving share through 2028: <b>room to spare</b>.`)+
        ` Break-even for today’s split: <b>≈${pctm(breakEven)}</b>. Tracked sites are a floor for 2027–28, so the chart leans toward shortage.`;
      $('#buildoutNote').textContent=`Log scale, so slope = growth rate. Compute built is Epoch’s tracked build-out, fixed; only demand responds to the sliders. Inference demand = ≈${(exChina/1e12).toFixed(0)}T/day ex-China tokens (${est.as_of}) × $${SC.usd_per_mtok.toFixed(3)} serving cost per million tokens (Anthropic’s filed cost of revenue ÷ its tokens, ${SC.period}) ÷ $${price.toFixed(2)} per GB300-equivalent hour, grown at ${(g*100).toFixed(0)}%/mo. That is ≈${implied.toFixed(1)}× the GPUs the DeepSeek-V4-Pro benchmark would need. Shaded band = 26–36% of all built compute: what serving would get if every owner split its fleet like Anthropic (its S-1/A, E). Meta’s own fleet (≈${Math.round(metaShare*100)}% of the end-2025 base) runs mostly recommender and ads work; leaving it out moves the crossing ${crossM?`to ${fmt(crossM)}`:'inside 2028 or later'}${cross&&crossM?` (${fmt(cross)} with it)`:''}.`;};
    for(const id of ['buildGrowth','buildPrice','buildEff','buildRubin'])$('#'+id).addEventListener('input',draw);draw();
    let wideB=innerWidth>=600;addEventListener('resize',()=>{if((innerWidth>=600)!==wideB){wideB=!wideB;draw();}});
  }
  // Watch table
  if($('#watchTable')){
    const g=est.components.filter(c=>c.monthly_growth!=null),gw=g.reduce((a,c)=>a+c.central*c.monthly_growth,0)/g.reduce((a,c)=>a+c.central,0);
    const SCw=D.watch?.serving_cost,use=price=>exChina*SCw.usd_per_mtok/1e6/(price*24)/72/S0['2026'].racks;
    const mc=n=>(window.LIVE?.market_checks||[]).find(m=>m.name===n),chg=(m,w)=>m?.changes?.[w]?.percent==null?'—':(m.changes[w].percent>0?'+':'')+m.changes[w].percent.toFixed(1)+'%';
    const TH={rentUp:2,rentDown:-5,tokens:.03,commit:.9};
    const ago=n=>new Date(Date.parse(String(NC.built).slice(0,10))-n*864e5).toISOString().slice(0,10),recent=n=>NC.contracts.filter(c=>!c.excluded&&String(c.announced||'')>=ago(n));
    // "Up to" or conditional values are not firm amounts. An aggregate row counts only the agreement signed in the window when its note gives the split.
    const cond=c=>c.value_status==='conditional'||/up to/i.test(c.value_relation||'')||/conditional/i.test(c.structure||'');
    const part=c=>{const m=/aggregate/i.test(c.structure||'')&&/includes ~?\$([\d.]+)B ([A-Z][a-z]+)\s?(\d{4}) agreement/.exec(c.note||'');return m&&+m[1]*1e9<c.value_usd?{v:+m[1]*1e9,pre:c.value_usd-m[1]*1e9}:{v:c.value_usd,pre:0};};
    const B=v=>`$${(v/1e9).toFixed(1)}B`;
    const deals=n=>{const cs=recent(n),val=cs.filter(c=>c.value_usd),sum=a=>a.reduce((x,c)=>x+part(c).v,0),firm=sum(val.filter(c=>!cond(c))),cnd=sum(val.filter(cond)),pre=val.filter(c=>part(c).pre),buyers=new Set(val.map(c=>c.buyer));
      return`${cs.length} deal${cs.length===1?'':'s'}`+(val.length?` · ${B(firm)} firm${cnd?` + ${B(cnd)} conditional or “up to”`:''}${pre.length?` (excl. ≈${B(pre.reduce((x,c)=>x+part(c).pre,0))} of ${pre.map(c=>c.supplier).join(', ')} agreements signed before the window)`:''}${buyers.size===1?`, all one buyer (${[...buyers][0]})`:''}`:' · value not disclosed');};
    const price=(m,n)=>{const v=m?.changes?.['90']?.percent;return v==null?{sig:'neutral',read:'—'}:v>TH.rentUp?{sig:'short',read:`${n} rents up ${v.toFixed(1)}% in 90 days → shortage`}:v<TH.rentDown?{sig:'slack',read:`${n} rents down ${Math.abs(v).toFixed(1)}% in 90 days → slack`}:{sig:'neutral',read:`${n} rents flat → balanced`};};
    // One buyer signing everything is a concentration risk, not a broad shortage signal.
    const dealSig=()=>{const cs=recent(90).filter(c=>c.value_usd),buyers=new Set(cs.map(c=>c.buyer)),nc=cs.filter(cond).length;if(!cs.length)return{sig:'slack',read:'No new valued deals in 90 days'};
      return buyers.size===1?{sig:'risk',read:`Buyers still signing, but all one buyer (${[...buyers][0]})${nc?`, ${nc} of ${cs.length} conditional`:''} → concentrated, not a broad shortage signal`}:{sig:'short',read:`${buyers.size} buyers signing valued deals → broad demand`};};
    const W=D.watch||{},a=W.anthropic_12m,h=mc('SemiAnalysis H100'),b=mc('SemiAnalysis B200');
    const rows=[
      {hz:'Now',m:'Logical tokens per day, global (E)',v:`≈${(est.total.central/1000).toFixed(2)} quadrillion (${(est.total.low/1000).toFixed(2)}–${(est.total.high/1000).toFixed(2)} quadrillion)`,c30:`≈+${(100*((1+gw)-1)).toFixed(0)}% trend (estimate)`,c90:`≈+${(100*((1+gw)**3-1)).toFixed(0)}% trend (estimate)`,sig:gw>TH.tokens?'short':'neutral',read:gw>TH.tokens?`Demand growing ≈${(gw*100).toFixed(0)}%/month, faster than compute → tight`:'Demand growth slowing',href:'#token-projection',src:'Projection from each company’s dated trend'},
      {hz:'2026–28',m:'H100e delivered → planned, ex-China',v:`${M(S0['2025'].h100e)} delivered by end-2025 → ${M(S0['2026'].h100e)} / ${M(S0['2027'].h100e)} / ${M(S0['2028'].h100e)} by 2026/27/28 (2028 with Rubin on a bandwidth basis: ${M(BuildoutMath.supply(NC.providers,TL,0.619)['2028'].h100e)}–${M(BuildoutMath.supply(NC.providers,TL,0.824)['2028'].h100e)})`,c30:'annual series',c90:'',sig:'watch',read:`Supply ≈${(S0['2028'].h100e/S0['2026'].h100e).toFixed(1)}× from end-2026 to end-2028 → glut if demand or training budgets slow`,href:'#supply',src:'Epoch chip-owner deliveries + tracked data-center timelines'},
      {hz:'2026–28',m:'Share of end-2026 compute that today’s ex-China tokens need for serving',v:`${pct(use(7))}–${pct(use(3))} at $7–3 per GB300-equivalent hour, priced at Anthropic’s serving cost per token (E); labs spend 26–36% on serving`,c30:'—',c90:'—',sig:'watch',read:'Small share is not idle: training and uncounted traffic use the rest; see Build-out',href:'#buildout',src:'Build-out vs demand chart'},
      {hz:'Now',m:'H100 rental, SemiAnalysis composite',v:h?`$${h.usd.toFixed(2)}/hr · ${h.date}`:'—',c30:chg(h,'30'),c90:chg(h,'90'),...price(h,'H100'),href:'#pricing',src:'Daily market feed'},
      {hz:'Now',m:'B200 rental, SemiAnalysis composite',v:b?`$${b.usd.toFixed(2)}/hr · ${b.date}`:'—',c30:chg(b,'30'),c90:chg(b,'90'),...price(b,'B200'),href:'#pricing',src:'Daily market feed'},
      a&&{hz:'Now',m:'Anthropic commitments due next 12 months vs revenue',v:`$${a.due_12m_b}B due vs $${a.revenue_run_rate_b}B revenue run-rate (${(a.due_12m_b/a.revenue_run_rate_b).toFixed(2)}×) · ${(a.due_12m_b/a.compute_expense_run_rate_b).toFixed(1)}× compute-expense run-rate`,c30:'quarterly filing',c90:'',sig:a.due_12m_b/a.revenue_run_rate_b>=TH.commit?'risk':'neutral',read:a.due_12m_b/a.revenue_run_rate_b>=TH.commit?'Buyer committed ≈ its whole revenue → still buying (tight now), but a funding risk':'Commitments well covered by revenue',href:a.source_url,src:'S-1/A, November 2'},
      {hz:'Now',m:'New compute contracts recorded',v:`${recent(90).length} deal${recent(90).length===1?'':'s'} in 90 days · ${recent(30).length} in 30 days`,c30:deals(30),c90:deals(90),...dealSig(),href:'#deals',src:'Contracts table; cancellations not systematically tracked'},
    ,
      W.spacex_2027&&{hz:'2026–28',m:'Planned power vs tracked sites: xAI / SpaceX 2027',v:(X=>{const f=X.facility_factor||1;return`CEO target ≈${X.company_gw} GW nameplate (≈IT power) by end-2027 ≈ ${(X.company_gw*f).toFixed(1)} GW facility power at PUE ${f}, vs ${X.tracked_gw.toFixed(1)} GW facility power at Epoch-tracked sites; filed ${X.filed_gw} GW nameplate ≈ ${(X.filed_gw*f).toFixed(1)} GW facility (${X.filed_date}), CFO ${X.cfo_ye2026_gw} GW nameplate by end-2026`;})(W.spacex_2027),c30:'call',c90:'filing',sig:'watch',read:'Epoch misses most new SpaceX buildings, so tracked supply is a floor → adds glut risk if the target is met',href:W.spacex_2027.source_url,src:'SpaceX Q3 call (Oct 20) and 10-Q; Epoch data-center timelines'},
      W.training_funding&&{hz:'2026–28',m:'Labs’ training budgets (glut trigger)',v:`Training, research and internal use ≈${Math.round(W.training_funding.training_share_low*100)}–${Math.round(W.training_funding.training_share_high*100)}% of Anthropic’s compute spend; $${W.training_funding.short_term_q3_b.toFixed(1)}B short-term compute bought in Q3. A cut in lab training plans is what would free compute for the rental market`,c30:'quarterly filing',c90:'',sig:'watch',read:'Glut trigger: cuts to training plans would release most lab compute',href:W.training_funding.source_url,src:'Anthropic S-1/A, November 2'},
      W.hopper_2028&&{hz:'2026–28',m:'H100 1-year price in 2028, two precedents (E)',v:`≈$${W.hopper_2028.successor_path_usd.toFixed(2)}/hr if a successor arrives in a shortage (−15–17%) · ≈$${W.hopper_2028.glut_path_usd.toFixed(2)}/hr if supply catches up (−50% in 18 months)`,c30:'scenario',c90:'',sig:'watch',read:'What each path would look like in prices',href:W.hopper_2028.source_url,src:'SemiAnalysis index history: A100 after H100, H100 after B200 and in 2024'}
    ].filter(Boolean).sort((x,y)=>(x.hz==='Now'?0:1)-(y.hz==='Now'?0:1));
    const SIG={short:'Shortage',slack:'Slack',risk:'Risk',watch:'Watch',neutral:'Neutral'};
    table('#watchTable',rows,[{k:'hz',h:'Horizon',f:r=>`<b>${esc(r.hz)}</b>`},{k:'m',h:'Measure',f:r=>`<a href="${r.href}">${esc(r.m)}</a><br><span class="small muted">${esc(r.src)}</span>`},{k:'read',h:'Reads as',f:r=>`<span class="sig sig-${r.sig}">${SIG[r.sig]}</span> ${esc(r.read)}`},{k:'v',h:'Latest',f:r=>esc(r.v)},{k:'c30',h:'30 / 90 days',f:r=>`${esc(r.c30)}${r.c90?`<br><span class="small">${esc(r.c90)}</span>`:''}`}]);
    // Text that answers the page's two questions, computed from the rows above, Fig. 1's defaults and the live feeds.
    if($('#watchLead')){
      const nowR=rows.filter(r=>r.hz==='Now'),tight=nowR.filter(r=>r.sig==='short').length>=nowR.length/2,be=BE0,word={short:'tight',slack:'slack',neutral:'balanced'};
      const d90=m=>m?.changes?.['90']?.percent,delta=v=>v==null?'':`<span class="lead-delta ${v>0?'up':v<0?'down':''}">${v>0?'+':''}${Math.round(v)}% in 90 days</span>`;
      const tile=(label,big,chg,w,href)=>`<a class="lead-stat" href="${href}"><span class="lead-label">${label}</span><span class="lead-big">${big}</span><span class="lead-chg">${chg}</span><span class="lead-word">${w}</span></a>`;
      const ph=price(h,'H100'),pb=price(b,'B200'),ra=a?a.due_12m_b/a.revenue_run_rate_b:null,TF=W.training_funding,mo=t=>new Date(t).toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'});
      const yr=g=>((1+g)**12),list=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a.at(-1):a[0]||'';
      $('#watchAnswer').textContent=tight?'Yes.':'Not clearly.';
      const parts=[(h&&b&&d90(h)!=null&&d90(b)!=null)?`H100 and B200 rents ${d90(h)>0&&d90(b)>0?'rose':'moved'} ${Math.abs(Math.round(d90(h)))}% and ${Math.abs(Math.round(d90(b)))}% in 90 days`:'',
        TF?.short_term_q3_b?`Anthropic bought $${TF.short_term_q3_b.toFixed(1)}B of short-term compute in Q3`:'',ra!=null?`${TF?.short_term_q3_b?'Its':'Anthropic’s'} next-12-month commitments are ≈${ra.toFixed(1)}× its revenue run-rate`:''].filter(Boolean);
      $('#watchLead').innerHTML=`${tight?'Rents are rising again after a long fall, and buyers pay a premium for short-term capacity.':parts.map(x=>x+'. ').join('')} Will it last? <a href="#outlook">Part 2 ↓</a>`;
      $('#watchStats').innerHTML=[h&&tile('H100 rental',`$${h.usd.toFixed(2)}/h`,delta(d90(h)),word[ph.sig]||'—','#pricing'),
        b&&tile('B200 rental',`$${b.usd.toFixed(2)}/h`,delta(d90(b)),word[pb.sig]||'—','#pricing'),
        TF?.short_term_q3_b&&tile('Anthropic short-term compute',`$${TF.short_term_q3_b.toFixed(1)}B`,'bought in Q3','premium capacity','#watchSignals'),
        a&&tile('Anthropic’s next-12-month commitments',`≈${ra.toFixed(1)}×`,'its revenue run-rate',ra>=TH.commit?'funding risk':'covered','#watchSignals'),
        tile('Tokens per day',`≈${(est.total.central/1000).toFixed(1)} quadrillion`,`<span class="lead-delta up">+${Math.round(gw*100)}%/month</span>`,gw>TH.tokens?'growing':'slowing','#token-projection')].filter(Boolean).join('');
      // Sourced "capacity-constrained" statements, when the research file carries them.
      // Verbatim, strongest first: the top 'tight' statements, then the 'loosening' ones behind one line so the block stays balanced.
      const Q=Array.isArray(D.watch?.capacity_quotes)?D.watch.capacity_quotes:[],tq=Q.filter(q=>q.direction!=='loosening').slice(0,5),lq=Q.filter(q=>q.direction==='loosening');
      // Quotes from Q2 for companies whose Q3 call is still ahead carry a refresh tag.
      const PENDING={'CoreWeave':'Q3 call Nov 10','Nebius':'Q3 call Nov 12'},qli=q=>`<li><b>${esc(q.company||'')}</b> <q>${esc(q.quote)}</q> <span class="lead-quote-meta">${esc(q.speaker||'')}${q.speaker&&q.date?', ':''}${esc(q.date||'')}${PENDING[q.company]?` · Q2; ${PENDING[q.company]}`:''}${q.source_url?' · '+src(q.source_url,'source'):''}</span></li>`;
      // Measured evidence first (costly to fake): backlog growth against capacity growth over the same period.
      const lvl=(t,d)=>{let v=0;for(const[x,m]of(t?.series||[])){if(x<=d)v=m;else break;}return v;},gs=(n,m)=>NC.growth?.[n]?.[m]||[],at=(n,m,d)=>gs(n,m).find(r=>r[0]===d)?.[1];
      // Like-for-like only: the company's own backlog against its own capacity. Others report backlog for a wider scope than any capacity figure we have.
      const BK=[['CoreWeave','2025-06-30','2026-06-30','company']].map(([n,a2,b2,basis])=>{const b0=at(n,'backlog_usd',a2),b1=at(n,'backlog_usd',b2);if(!b0||!b1)return null;
        const c0=basis==='company'?at(n,'mw_online',a2):lvl(TL.providers[n],a2),c1=basis==='company'?at(n,'mw_online',b2):lvl(TL.providers[n],b2);if(!c0||!c1)return null;
        const bg=b1/b0-1,cg=c1/c0-1,yoy=Date.parse(b2)-Date.parse(a2)>200*864e5;return{n,bg,cg,yoy,basis,b1,c0,c1,read:bg>cg*1.15?'backlog faster':cg>bg*1.15?'capacity faster':'about even'};}).filter(Boolean);
      const pctx=v=>(v>=0?'+':'')+Math.round(v*100)+'%',faster=BK.filter(r=>r.read==='backlog faster').map(r=>r.n.replace(' Cloud','').replace(' Azure','').replace(' OCI','')),even=BK.filter(r=>r.read==='about even').map(r=>r.n),slower=BK.filter(r=>r.read==='capacity faster').map(r=>r.n.replace(' Azure','').replace(' OCI',''));
      const evid=`<p class="lead-quotes-head">Measured evidence</p><ul class="lead-quotes lead-evidence">`+
                (BK.length?`<li><b>Backlog vs capacity.</b> CoreWeave’s backlog grew ${Math.round(BK[0].bg*100)}% and its MW online ${Math.round(BK[0].cg*100)}% in the year to June 2026: demand keeps pace with a fast build. Oracle delivered 850 MW in one quarter while its RPO rose $209B to $664B.</li>`:'')+`</ul>`;
      // Sources, scope notes and the remaining statements, collapsed under the block.
      const notes=`<details class="fig-notes"><summary>Sources and more statements</summary><p class="small">Rents: SemiAnalysis composites, 90-day change; the 26–54% fall since Q1 2025 is Silicon Data’s regional medians. Anthropic: S-1/A, November 2; revenue run-rate = Q3 × 4. Oracle: 8-K, Sep 10. CoreWeave is the one company that reports backlog and capacity on the same basis. Other companies report backlog for a wider scope (all commercial or all cloud) than any capacity figure we have, so they are not compared. E = estimate.</p>${tq.length>3?`<ul class="lead-quotes">${tq.slice(3).map(qli).join('')}</ul>`:''}${lq.length?`<p class="small"><b>Counter-signals in full:</b></p><ul class="lead-quotes">${lq.map(qli).join('')}</ul>`:''}</details>`;
      if($('#tightQuotes'))$('#tightQuotes').innerHTML=evid+(Q.length?`<p class="lead-quotes-head">What companies say. Weaker: “sold out” is also a sales pitch.</p><ul class="lead-quotes">${tq.slice(0,3).map(qli).join('')}</ul>`+(lq.length?`<p class="small lead-counter-line"><b>Counter-signals:</b> ${lq.map(q=>`${esc(q.company.replace(/ \(.*\)$/,''))}${q.source_url?' '+src(q.source_url,'↗'):''}`).join(' · ')}</p>`:''):'')+notes;
      // Part 2 lead: the one number.
      const stays=gw>be;
      if($('#outlookLead')&&be!=null)$('#outlookLead').innerHTML=`<b>It depends on one number: token growth of ≈${Math.round(be*100)}% a month, or ≈${yr(be).toFixed(1)}× a year.</b> Faster, and compute stays tight. Slower, and it loosens. Today’s trend is ≈${Math.round(gw*100)}%/month.`;
      if($('#closeOutlook')&&be!=null)$('#closeOutlook').innerHTML=`<b>For 2027–28:</b> on today’s trend, ${stays?'compute stays tight':'compute loosens'}. <a href="#flip">What could change that ↓</a>`;
      const ratio=S0['2028'].h100e/S0['2026'].h100e;if($('#dekBuild'))$('#dekBuild').textContent=ratio>2?'more than doubles':`grows ≈${ratio.toFixed(1)}×`;
      if($('#whySupply'))$('#whySupply').innerHTML=`<b>Why it matters:</b> outside China, covered owners grow ≈${ratio.toFixed(1)}×, from ${M(S0['2026'].h100e)} to ${M(S0['2028'].h100e)} H100e, between end-2026 and end-2028. That is Fig. 1’s supply line.`;
      const tp=y=>Object.values(TL.providers).reduce((s,p)=>s+(p.mw?.[y]||0),0);
      if($('#whyPower'))$('#whyPower').innerHTML=`<b>Why it matters:</b> tracked power rises from ≈${(tp('2026')/1000).toFixed(0)} GW at end-2026 to ≈${(tp('2028')/1000).toFixed(0)} GW at end-2028. Most of that is scheduled, not built, and can slip.`;
      if($('#whyTokens'))$('#whyTokens').innerHTML=`<b>Why it matters:</b> this ≈${Math.round(gw*100)}%/month trend decides Fig. 1.`;
      if($('#whyInference'))$('#whyInference').innerHTML=`<b>Why it matters:</b> inference must outgrow serving’s ≈${Math.round(BAND[0]*100)}–${Math.round(BAND[1]*100)}% share of lab compute before it takes compute from training.`;
      if($('#closeSupply'))$('#closeSupply').innerHTML=`<b>For 2027–28:</b> supply is mostly scheduled already, so demand decides.`;
      if($('#closeDemand'))$('#closeDemand').innerHTML=`<b>For 2027–28:</b> ≈${Math.round(gw*100)}%/month ${stays?'beats':'falls short of'} the ≈${Math.round(be*100)}%/month break-even, so compute ${stays?'stays tight':'loosens'}.`;
      // What could flip it: computed from the tracker, the filing rows and the risk table.
      const o=TL.providers['Oracle OCI'],add28=tp('2028')-tp('2027'),or28=o?(o.mw['2028']-o.mw['2027']):0,SX=W.spacex_2027;
      if($('#flipList'))$('#flipList').innerHTML=[`<li><b>2028 sites slip.</b> ≈${(add28/1000).toFixed(1)} GW of tracked facility power is due online in 2028${o?`, ≈${(or28/1000).toFixed(1)} GW of it at Oracle’s Stargate sites`:''}. These are Epoch projections, not built capacity. Slips keep compute tight longer. <a href="#supply">Supply ↑</a></li>`,
        TF?`<li><b>Training budgets.</b> Training, research and internal use take ≈${Math.round(TF.training_share_low*100)}–${Math.round(TF.training_share_high*100)}% of Anthropic’s compute spend. Cuts to lab training plans would free compute for the rental market. <a href="#inference-split">Fig. 5 ↑</a></li>`:'',
        `<li><b>Whether buyers can pay.</b> ${ra!=null?`Anthropic’s next-12-month commitments are ≈${ra.toFixed(1)}× its revenue run-rate. `:''}If buyers can’t pay, landlords and neoclouds feel it first. <a href="#exposure">Table 1 ↓</a></li>`,
        SX?`<li><b>More supply than tracked.</b> SpaceX’s CEO targets ≈${SX.company_gw} GW nameplate by end-2027; Epoch tracks ${SX.tracked_gw.toFixed(1)} GW facility power at its sites. Untracked buildings would loosen compute sooner.</li>`:'',
        (BE0!=null&&G0!=null?`<li><b>Software efficiency, the 2000-style risk.</b> In 2000, DWDM multiplied capacity on fiber already laid. The analogue is software cutting GPU-hours per token. Above ≈${(((1+G0)/(1+BE0))**12).toFixed(1)}× a year from software alone, today’s ${Math.round(G0*100)}%/month no longer outgrows the build-out. At fixed quality it is ≈3× a year, but traffic keeps moving to bigger frontier models. <a href="#buildout">Fig. 1 slider ↑</a></li>`:''),
        `<li><b>Cheaper GPU-hours or slower tokens.</b> Both move Fig. 1’s break-even. <a href="#buildout">Fig. 1 ↑</a></li>`].filter(Boolean).join('');
      if($('#closePrices')){const HP=W.hopper_2028;$('#closePrices').innerHTML=HP?`<b>2028:</b> a 1-year H100 rental at ≈$${HP.successor_path_usd.toFixed(2)}/h if a successor arrives in a shortage, ≈$${HP.glut_path_usd.toFixed(2)}/h if supply catches up (two precedents; estimates).`:'';}
      if($('#closeDeals'))$('#closeDeals').innerHTML=`<b>If it loosens:</b> two buyers sign most of the money, so their demand decides whether these contracts hold.`;
    }
    const now=rows.filter(r=>r.hz==='Now'),n=t=>now.filter(r=>r.sig===t).length;
    $('#watchVerdict').innerHTML=`<b>Now:</b> ${n('short')} of ${now.length} signals point to a shortage${n('slack')?`, ${n('slack')} to slack`:''}${n('risk')?`; ${n('risk')} flag${n('risk')===1?'s':''} buyer risk (funding or concentration)`:''}. <b>2026–28:</b> supply keeps growing fast, and the tracked sites undercount it. A glut needs demand growth to slow or labs to cut training budgets; those rows are the ones to watch.<details class="fig-notes"><summary>How each row is read</summary><p class="small"> rents up more than ${TH.rentUp}% over 90 days = shortage, down more than ${-TH.rentDown}% = slack, otherwise balanced; token demand growing faster than ${TH.tokens*100}% a month = shortage; commitments due within 12 months at ${TH.commit}× revenue or more = funding risk; valued deals signed in 90 days = buyers still signing, but risk rather than shortage when one buyer signed them all. Conditional and “up to” deal values are shown apart from firm ones.</p></details>`;
    $('#watchAsOf').textContent=`Prices ${String(window.LIVE?.checked_at||'').slice(0,10)}; tokens projected to ${est.as_of}.`;
  }
  // Neocloud and landlord risk: filed backlog, debt, cost of debt and customer concentration.
  const R=D.neocloud_risk;
  if(R&&$('#riskTable')){
    const n=(v,d=1)=>v==null?'—':(+v).toFixed(d),pc=v=>v==null?'—':Math.round(v)+'%';
    $('#riskNote').innerHTML=`Six factors each score 1, safe, to 3, exposed. Out of 18, <b>High</b> is 15+, <b>Medium</b> 12–14 and <b>Low</b> under 12. Debt and contracts signed after each row’s period are added to the same date; CoreWeave and Nebius Q3 rows follow once their filings are in. Lambda, Crusoe and Fluidstack disclose too little to score.`;
    // Why text uses each row's own basis: the share is of revenue or backlog as filed, interest is filed expense (with debt × rate beside it), tenor names the actual mismatch.
    const who=r=>(r.top1_customer||'one customer').split(/[,(;.]/)[0].trim(),dxr=r=>{const v=r.cost_of_debt_effective_pct_D??r.cost_of_debt_coupon_pct_D;return v!=null&&r.revenue_annualized_usd_b?r.debt_principal_usd_b*v/r.revenue_annualized_usd_b:null;},note=(r,k)=>r.score_notes?.[k]?` (${r.score_notes[k]})`:'';
    const FACTORS=[['concentration',r=>`${Math.round(r.top1_pct)}% of ${r.top1_basis||'revenue'} from ${who(r)}${note(r,'concentration')}`],['tenor',r=>(r.tenor_why||'debt and contract terms do not match')+note(r,'tenor')],['funding',r=>r.funding_unknown?'cost of planned build undisclosed':r.unfunded_usd_b?`$${(+r.unfunded_usd_b).toFixed(1)}B of planned build not yet financed`:'planned build needs financing'],['backlog_cover',r=>`backlog only ${(+r.D_backlog_to_debt).toFixed(1)}× its debt`],['cost',r=>`expensive debt (${(+(r.cost_of_debt_effective_pct_D??r.cost_of_debt_coupon_pct_D)).toFixed(1)}%)`],['interest_burden',r=>{const d=dxr(r);return`interest expense ≈${Math.round(r.D_interest_to_revenue_pct)}% of revenue${r.interest_note?`, ${r.interest_note}`:''}${d!=null?`; debt × rate ≈${Math.round(d)}%`:''}${note(r,'interest_burden')}`;}]];
    const level=t=>t>=15?['High','sig-short']:t>=12?['Medium','sig-risk']:['Low','sig-slack'];
    const why=r=>{const hi=FACTORS.filter(([k])=>r.score?.[k]===3).map(([,f])=>f(r));return hi.length?hi.join('; '):'no factor at the most exposed level';};
    // Short tags for the most exposed factors; the full sentence is in each tag's tooltip.
    const TAG={concentration:'One big customer',tenor:'Term mismatch',funding:'Build not financed',backlog_cover:'Thin backlog cover',cost:'Expensive debt',interest_burden:'Heavy interest'};
    const whyTags=r=>{const hi=FACTORS.filter(([k])=>r.score?.[k]===3);return hi.length?hi.map(([k,f])=>`<span class="risk-tag" title="${esc(f(r))}">${TAG[k]||k}</span>`).join(' ')+`<details class="cell-more"><summary>Details</summary><span class="small muted">${esc(why(r))}</span></details>`:'<span class="small muted">No factor at the most exposed level</span>';};
    table('#riskTable',R.rows,[
      {k:'company',h:'Company',f:r=>`<b>${esc(r.company.replace(/ \(.*\)$/,''))}</b><br><span class="small">${esc(r.model.replace(/ \(.*\)$/,''))}</span><br><span class="small muted">${src(r.filing_url,'Filing')} · ${esc(String(r.period_end).slice(0,10))} · next ${esc(r.next_report||'—')}</span>`},
      {k:'rank',h:'Exposure',f:r=>{const[l,c]=level(r.score?.total||0);return`<span class="sig ${c}">${l}</span><br><span class="small">${r.score?.total??'—'}/18 · #${r.rank}${r.funding_unknown?' · funding unknown':''}</span>`;}},
      {k:'why',h:'Why',f:r=>whyTags(r)},
      {k:'backlog_usd_b',h:'Backlog (signed, not yet earned)',f:r=>`$${n(r.backlog_usd_b)}B <span class="small">grade ${esc(r.backlog_grade)}</span>`},
      {k:'debt_principal_usd_b',h:'Debt',f:r=>`$${n(r.debt_principal_usd_b,2)}B`},
      {k:'cost_of_debt_effective_pct_D',h:'Interest rate',f:r=>{const v=r.cost_of_debt_effective_pct_D??r.cost_of_debt_coupon_pct_D;return v==null?'—':`<span title="${esc(r.cost_note||'')}">${n(v)}%</span>`+(r.cost_of_debt_effective_pct_D==null?' <span class="small">coupon</span>':'')+(r.cost_note?' <span class="small">pro forma (D)</span>':'');}},
      {k:'D_debt_to_stabilized_annual_contracted_rev',h:'Debt ÷ yearly contracted revenue',f:r=>r.D_debt_to_stabilized_annual_contracted_rev==null?(r.D_debt_to_annualized_revenue==null?'—':n(r.D_debt_to_annualized_revenue)+'× revenue'):n(r.D_debt_to_stabilized_annual_contracted_rev)+'×'},
      {k:'unfunded_usd_b',h:'Planned build not yet financed',f:r=>r.unfunded_usd_b==null&&r.unfunded_mw==null?'—':`<span title="${esc(r.unfunded_basis||'')}">${r.unfunded_usd_b!=null?'$'+n(r.unfunded_usd_b)+'B'+(r.unfunded_usd_scope?` <span class="small">${esc(r.unfunded_usd_scope)}</span>`:''):''}${r.unfunded_mw?`${r.unfunded_usd_b!=null?(r.unfunded_mw_scope?'<br>':' · '):''}${Number(r.unfunded_mw).toLocaleString('en-US')} MW${r.unfunded_mw_scope?` <span class="small">${esc(r.unfunded_mw_scope)}</span>`:''}`:''}</span> <span class="small">grade ${esc(r.unfunded_grade||'')}</span>`},
      {k:'top1_pct',h:'Largest customer',f:r=>`${pc(r.top1_pct)} ${esc((r.top1_customer||'').replace(/ \(.*$/,''))}${r.top1_basis?`<br><span class="small">share of ${esc(r.top1_basis)}</span>`:''}${r.top3_pct?`<br><span class="small">top 3: ${pc(r.top3_pct)}</span>`:''}`},
      {k:'backstops',h:'Backstop if a customer defaults',f:r=>{const t=r.backstops||'None disclosed.',first=t.split(/(?<=\.)\s/)[0],rest=t.slice(first.length).trim();return`<span class="small">${esc(first)}</span>${rest?`<details class="cell-more"><summary>More</summary><span class="small muted">${esc(rest)}</span></details>`:''}${r.unverified?`<br><span class="small muted">Not verified in filings: ${esc(r.unverified)}</span>`:''}`;}}]);
    // Headline: the three most exposed by total score (the table's own rank).
    if($('#riskHeadline')){const mx=Math.max(...R.rows.map(r=>r.score?.total||0)),top=R.rows.filter(r=>(r.score?.total||0)===mx).map(r=>r.company.replace(/ \(.*\)$/,''));$('#riskHeadline').textContent=`Most exposed${top.length>1?`, tied at ${mx}/18`:`, at ${mx}/18`}: ${top.length>1?top.slice(0,-1).join(', ')+' and '+top.at(-1):top[0]}.`;if($('#exposureLead'))$('#exposureLead').innerHTML=`<b>If compute loosens, leveraged neoclouds and their landlords feel it first.</b>`;}
    const ex=R.rows.flatMap(r=>Object.entries(r.score_notes||{}).map(([k,v])=>`${esc(r.company.replace(/ \(.*\)$/,''))} (${esc(k.replace('_',' '))}): ${esc(v)}.`));
    if($('#riskRules'))$('#riskRules').innerHTML=`<summary>How each factor is scored</summary><ul class="small">
      <li><b>Grades:</b> A filed, B company-stated, C estimated.</li>
      <li><b>Concentration</b>, the largest counterparty’s share of backlog or revenue (whichever the row states), and its credit. A counterparty guaranteed or backstopped by an investment-grade company counts as investment-grade, once the guarantee is in force. 3 = non-investment-grade above 50% with no backstop; 2 = investment-grade above 50%, or non-investment-grade at 30–50%; 1 = investment-grade at 50% or less, non-investment-grade under 30%, or diversified. Examples: Hut 8’s 74% high-investment-grade tenant (2); Cipher’s 45% AWS under an Amazon.com guarantee (1); Oracle’s ≈45% OpenAI (2); WhiteFiber’s ≈38% Nscale, unrated with no backstop (2); Galaxy’s 100% CoreWeave, and TeraWulf’s 70% Anthropic, whose Google support starts only in 2027–28 (3).</li>
      <li><b>Tenor mismatch</b>: 3 = debt or lease commitments mismatched to customer contracts by more than 5 years, a refinancing wall, or bridge loans; 2 = partial mismatch; 1 = amortizing and matched.</li>
      <li><b>Funding</b>, contracted build not yet financed: 1 = none, 2 = under $15B, 3 = $15B or more. Nebius is scored 2 because the cost of its 2027–29 build is undisclosed. The $15B line is absolute, so it is biased by size: a small company cannot score 3 however short of cash it is. We plan to rescore all rows against cash plus undrawn facilities in one pass.</li>
      <li><b>Backlog cover</b>, backlog ÷ debt: 3 below 2.5×, 2 at 2.5–4×, 1 above 4×.</li>
      <li><b>Cost of debt</b>, weighted effective rate (coupon where no effective rate is filed): 3 above 8%, 2 at 6–8%, 1 below 6%.</li>
      <li><b>Interest burden</b>, interest expensed in the latest quarter (after capitalization, before interest income, excluding non-cash charges on customer prepayments) ÷ that quarter’s recurring revenue (rent or cloud revenue where the filing splits it out) (D): 3 above 50%, 2 at 20–50%, 1 below 20%. Where a filing includes those prepayment charges without giving the amount (CoreWeave, IREN, Nebius), the filed figure is used and the row says so; the Why column also shows debt × rate ÷ annualized revenue.</li>
      ${ex.length?`<li><b>Notes on individual rows:</b> ${ex.join(' ')}</li>`:''}</ul>`;
  }
})();
