// Stress test: what if the independent labs fail at once? Seven steps on one basis (IT MW, one GB300 price), then the
// same Fig. 1 model with only three inputs changed: tokens lost, compute freed now, and future builds that slip.
// Control: OpenAI pays for only part of its next year.
(function(){
  const N=window.NEOLAB_STRESS,B=window.BuildoutBase,TL=window.DC_TIMELINES;if(!N||!B||!$('#stressSteps'))return;
  const C=N.conversion,perMw=C.usd_per_gpu_hour*8760*(1000/C.kw_it_per_gpu)/1e9,mw=v=>v/perMw; // $B per IT MW-year
  const labs=N.labs.map(l=>({...l,mw:l.spend_bn.map(mw)})),sum=(f,i)=>labs.filter(f).reduce((a,l)=>a+l.mw[i],0);
  const all=[0,1].map(i=>sum(()=>1,i)),gpu=[0,1].map(i=>sum(l=>l.bucket==='gpu',i)),hyp=[0,1].map(i=>sum(l=>l.bucket==='hyperscaler',i)),unk=[0,1].map(i=>sum(l=>l.bucket==='unknown',i));
  const R=N.rentable_it_mw,DAY=864e5,r10=v=>Math.round(v/10)*10,MW=a=>`${r10(a[0])}–${r10(a[1])} MW`,P=v=>{const x=v*100;return(x<10&&Math.abs(x-Math.round(x))>.05?x.toFixed(1):x.toFixed(0))+'%';},aP=v=>Math.abs(v*100).toFixed(1)+'%',sP=v=>(v>=0?'+':'−')+Math.abs(v*100).toFixed(1)+'%';
  const dp=(s,e)=>(1+s)**e-1;
  // OpenAI's tracked fleet 12 months out (facility MW, Epoch by user), linear between dated levels, ÷1.3 to IT.
  const OA=TL.by_user?.OpenAI,lvl=(m,t)=>{const pts=[[Date.parse(TL.retrieved_utc),m.now],[Date.parse('2026-12-31'),m['2026']],[Date.parse('2027-12-31'),m['2027']],[Date.parse('2028-12-31'),m['2028']]];for(let i=1;i<pts.length;i++)if(t<=pts[i][0]){const[a,ya]=pts[i-1],[b,yb]=pts[i];return ya+(yb-ya)*Math.max(0,(t-a)/(b-a));}return pts.at(-1)[1];};
  const t12=B.t0+365*DAY,oaIt=OA?[lvl(OA.mw,t12)/1.3,(lvl(OA.mw,t12)+lvl(OA.shared_mw,t12))/1.3]:null;
  // Future builds: OpenAI's tracked 2027–28 additions (Epoch H100e, linear between year ends); the neolabs' dated
  // future commitments at the same H100e per MW as those additions, ramping in through 2027.
  const YE=y=>Date.parse(y+'-12-31'),oaAdd=t=>{const h=OA.h100e,p=[[YE(2026),h['2026']],[YE(2027),h['2027']],[YE(2028),h['2028']]];if(t<=p[0][0])return 0;for(let i=1;i<p.length;i++)if(t<=p[i][0])return p[i-1][1]+(p[i][1]-p[i-1][1])*(t-p[i-1][0])/(p[i][0]-p[i-1][0])-p[0][1];return p[2][1]-p[0][1];};
  const hPerMw=(OA.h100e['2028']-OA.h100e['2026'])/(OA.mw['2028']-OA.mw['2026']),futMw=N.future.reduce((x,f)=>x+f.mw,0),ramp=t=>Math.min(1,Math.max(0,(t-YE(2026))/(YE(2027)-YE(2026))));
  const perRack=BuildoutMath.H100E_PER_RACK,oaAddMw=OA.mw['2028']-OA.mw['2026'];
  // Fig. 1's crossing with three inputs changed: demand × (1 − tokens lost); serving room + unabsorbed freed racks;
  // built compute − builds that slip. Absorbed compute is not added to serving room, so the loosening is a floor.
  const cross=(loss,freeMw,cut)=>{const F=freeMw*1000/B.rackKw;for(let t=B.t0;t<=B.tEnd;t+=DAY)if(B.need0*(1-loss)*(1+B.g)**((t-B.t0)/B.MON)>=B.MID*(B.built(t)-cut(t))+F)return t;return null;};
  const allX=(loss,cut)=>{for(let t=B.t0;t<=B.tEnd;t+=DAY)if(B.need0*(1-loss)*(1+B.g)**((t-B.t0)/B.MON)>=B.built(t)-cut(t))return t;return null;};
  const none=()=>0,shift=(loss,freeMw,cut=none)=>{const c=cross(loss,freeMw,cut);return B.cross&&c?(c-B.cross)/DAY:null;};
  const days=d=>d==null?'—':Math.abs(d)<45?`${Math.round(Math.abs(d))} day${Math.round(Math.abs(d))===1?'':'s'}`:`${(Math.abs(d)/30.4).toFixed(1)} months`,num=d=>days(d).replace(/ (days?|months)$/,'');
  const span=(a,b)=>{const lo=Math.min(a,b),hi=Math.max(a,b);if(Math.max(-lo,hi)<4)return`within ${days(Math.max(1,Math.max(-lo,hi)))}`;const one=Math.round(lo)===Math.round(hi);if(lo>=0)return one?`${days(hi)} later`:`${num(lo)}–${days(hi)} later`;if(hi<=0)return one?`${days(lo)} earlier`:`${num(hi)}–${days(lo)} earlier`;return`${days(lo)} earlier to ${days(hi)} later`;};
  const sgn=(a,b)=>{const lo=Math.min(a,b),hi=Math.max(a,b),u=Math.max(Math.abs(lo),Math.abs(hi))<45?'days':'months',f=d=>u==='days'?Math.round(Math.abs(d)):(Math.abs(d)/30.4).toFixed(1);return Math.max(-lo,hi)<4?'≈0':lo>=0?`+${f(lo)} to +${f(hi)} ${u}`:hi<=0?`−${f(hi)} to −${f(lo)} ${u}`:`−${f(lo)} to +${f(hi)} ${u}`;};
  let mode='neolab';
  const v=id=>$('#'+id).valueAsNumber;
  function draw(){
    const m=v('stressMigrate')/100,a=v('stressAbsorb')/100,sl=v('stressSlip')/100,e=-v('stressElastic'),sf=v('stressShortfall')/100,ctl=mode==='control';
    $('#stressMigrateValue').textContent=P(m);$('#stressAbsorbValue').textContent=P(a);$('#stressElasticValue').textContent='−'+(-e).toFixed(1);$('#stressShortfallValue').textContent=P(sf);$('#stressSlipValue').textContent=P(sl);
    $('#stressMigrateBox').hidden=ctl;$('#stressShortfallBox').hidden=!ctl;
    const T=N.tokens,loss=ctl?[0,0]:[T.own_model_share[0]*(1-m),T.own_model_share[1]*(1-m)],lossC=ctl?0:T.central*(1-m);
    const freed=ctl?oaIt.map(x=>x*sf):all,mkt=ctl?freed:gpu;
    const cut=ctl?t=>sf*sl*oaAdd(t)/perRack:t=>sl*futMw*hPerMw*ramp(t)/perRack,cutMw=ctl?sf*sl*oaAddMw:sl*futMw,cut28=cut(YE(2028))/B.built(YE(2028));
    const shock=[mkt[0]*(1-a)/R.high,mkt[1]*(1-a)/R.low],sh=[shift(loss[0],freed[0]*(1-a)),shift(loss[1],freed[1]*(1-a))];
    const net=[shift(loss[0],freed[0]*(1-a),cut),shift(loss[1],freed[1]*(1-a),cut)],cutOnly=shift(0,0,cut),A0=allX(0,none),A1=[allX(loss[0],cut),allX(loss[1],cut)];
    const aTxt=A0&&A1.every(Boolean)?`Not enough compute at all (${B.fmt(A0)}): ${span((A1[0]-A0)/DAY,(A1[1]-A0)/DAY)}.`:'';
    const pr=[dp(shock[0],N.elasticity.range[0]),dp(shock[1],N.elasticity.range[1])],prSel=dp((shock[0]+shock[1])/2,e);
    const types=Object.entries(labs.reduce((o,l)=>(o[l.type]=(o[l.type]||0)+1,o),{})).map(([k,n])=>`${n} ${k}`).join(', ');
    const bar=(parts,tot)=>`<div class="stress-bar">${parts.map(([k,x,c])=>`<span style="width:${(100*x[1]/tot).toFixed(1)}%;--c:var(${c})" title="${esc(k)}: ${MW(x)}"></span>`).join('')}</div>`;
    const ex=ctl?N.exposure.control:N.exposure.neolab;
    const step=(n,h,big,body,more='')=>`<li class="stress-step"><span class="stress-n">${n}</span><h4>${h}</h4><p class="stress-big">${big}</p><p class="stress-body">${body}</p>${more}</li>`;
    const s1=ctl?step(1,'Who fails','OpenAI, partly',`It pays for ${P(1-sf)} of its next 12 months.`)
      :step(1,'Who fails',`${labs.length} labs`,`≈$${labs.reduce((x,l)=>x+l.spend_bn[0],0).toFixed(1)}–${labs.reduce((x,l)=>x+l.spend_bn[1],0).toFixed(1)}B a year of compute (E). ${types}. Perplexity and Cognition are out: they mostly call others’ models.`,
        `<details class="fig-notes"><summary>The list and its rule</summary><p class="small">${esc(N.rule)}</p><div class="table-scroll"><table class="t" id="stressLabs"></table></div></details>`);
    const s2=ctl?step(2,'Their tokens','unchanged','Its users still want them.')
      :step(2,'Their tokens',`≈${P(lossC)} lost`,`≈${P(T.central)} (${P(T.own_model_share[0])}–${P(T.own_model_share[1])}) of tokens run on their own models (E); ${P(m)} of that moves to other labs.`,`<details class="fig-notes"><summary>Precedent</summary><p class="small">${esc(T.precedent)} ${esc(T.note)}</p></details>`);
    const s3=step(3,'Compute freed',MW(freed),ctl?`${P(sf)} of OpenAI’s ≈${(oaIt[0]/1000).toFixed(1)}–${(oaIt[1]/1000).toFixed(1)} GW tracked fleet a year out (IT; high end counts sites shared with Microsoft).`
        :`${bar([['Neocloud or own GPUs',gpu,'--s1'],['Hyperscaler or TPU',hyp,'--s3'],['Unknown or sovereign',unk,'--line']],all[1])}<span class="stress-key"><i style="--c:var(--s1)"></i>neocloud/own GPU ${MW(gpu)} <i style="--c:var(--s3)"></i>hyperscaler/TPU ${MW(hyp)} <i style="--c:var(--line)"></i>unknown ${MW(unk)}</span>`,
      `<p class="stress-body">${ctl?'These GPUs are':'The GPU part is'} ${P(mkt[0]/R.high)}–${P(mkt[1]/R.low)} of rentable neocloud power (≈${(R.low/1000).toFixed(1)}–${(R.high/1000).toFixed(1)} GW IT). After ${P(a)} is absorbed, ${P(shock[0])}–${P(shock[1])} reaches the market.</p><details class="fig-notes"><summary>Basis, supply and precedents</summary><p class="small">${esc(C.note)} ${esc(R.note)}</p><ul class="small">${R.items.map(i=>`<li>${esc(i.name)}: ${esc(i.mw)} MW · ${esc(i.basis)}</li>`).join('')}</ul><p class="small">${esc(N.absorption.note)}</p><ul class="small">${N.precedents.map(p=>`<li>${esc(p.case)} (${esc(String(p.date||'').slice(0,7))}): ${esc(p.fate)} ${src(p.source_url)}</li>`).join('')}</ul>${ctl?`<p class="small">${esc(N.control.note)}</p>`:''}</details>`);
    const s4=step(4,'Future builds that slip',`≈${(cutMw/1000).toFixed(1)} GW`,ctl?`Of ≈${(oaAddMw/1000).toFixed(1)} GW of 2027–28 builds where OpenAI is the sole listed user, ${P(sf)} is unfunded and ${P(sl)} of that slips: ${P(cut28)} of 2028 supply.`
        :`${N.future.map(f=>esc(f.short)).join('; ')}. ${P(sl)} slips: ${P(cut28)} of 2028 supply.`,`<details class="fig-notes"><summary>Why this tightens later</summary><p class="small">${esc(N.future_note)} ${ctl?'':N.future.map(f=>`${esc(f.lab)}: ${f.mw} MW, ${esc(f.when)}, ${esc(f.basis)} ${src(f.source_url)}`).join(' · ')}</p></details>`);
    const s5=step(5,'Rents',`${sP(pr[0])} to ${sP(pr[1])}`,`Price response −0.5 (2024–25, mild) to −2 (pure supply shock). At −${(-e).toFixed(1)}: ${sP(prSel)}.`,`<details class="fig-notes"><summary>Why a range</summary><p class="small">${esc(N.elasticity.note)}</p></details>`);
    const s6=step(6,'Who’s hurt first',ctl?'Oracle, Microsoft':'≤4% at any named supplier',ctl?'Each has ≈45% of its backlog from OpenAI; CoreWeave and AWS hold ≈$22B and ≈$138B of its contracts.':'SpaceX AI ≈4% of its lease run-rate (Reflection), Nscale ≈3% of backlog (Figure). Nebius, Fluidstack, CoreWeave: not disclosed.',`<details class="fig-notes"><summary>Each supplier, with source</summary><ul class="stress-ex">${ex.map(x=>`<li><b>${esc(x.who)}</b> ${esc(x.what)} ${src(x.source_url)}</li>`).join('')}</ul></details>`);
    const ok=B.cross&&net.every(x=>x!=null)&&sh.every(x=>x!=null)&&cutOnly!=null;
    const s7=`<li class="stress-step stress-net"><span class="stress-n">7</span><h4>Effect on the answer: Fig. 1’s crossing (${B.cross?B.fmt(B.cross):'none'})</h4>${ok?`<p class="stress-big">${sgn(net[0],net[1])}</p><p class="stress-body">Release: ${span(sh[0],sh[1])}. Slipped builds: ${Math.abs(cutOnly)<1?'no change':`${days(cutOnly)} ${cutOnly>0?'later':'earlier'}`}. ${aTxt} A one-off release buys about a week; a bust matters through <a href="#buildout">token growth</a> or cancelled builds.</p><details class="fig-notes"><summary>How this is computed</summary><p class="small">The same Fig. 1 model at its defaults, with three inputs changed: demand × (1 − tokens lost); the serving room gains the freed compute big labs don’t take; built compute loses the builds that slip. Absorbed compute is not added to the serving room, though a big lab could serve on it, so the loosening is a little understated.</p></details>`:'<p class="stress-body">No crossing at Fig. 1’s defaults.</p>'}</li>`;
    $('#stressSteps').innerHTML=s1+s2+s3+s4+s5+s6+s7;
    if(!ctl)table('#stressLabs',labs,[{k:'name',h:'Lab',f:l=>`<b>${esc(l.name)}</b> <span class="muted">${esc(l.type)}</span>`},{k:'last_raise',h:'Last raise (R)',f:l=>esc(l.last_raise)+' '+src(l.source_url)},{k:'spend_bn',h:'Compute/yr (E)',f:l=>`$${l.spend_bn[0]}–${l.spend_bn[1]}B · ${MW(l.mw)}`},{k:'runway',h:'Runway',f:l=>esc(l.runway)},{k:'where',h:'Where it runs',f:l=>esc(l.where)+`<br><span class="small">exit: ${esc(l.exit)}</span>`},{k:'grade',h:'Grade',f:l=>esc(l.grade)}]);
    const N7=ok?span(net[0],net[1]):'—';
    const L=ctl?`If OpenAI paid for only ${P(1-sf)} of its next year, ≈${MW(freed)} comes free and rents fall ${aP(pr[0])}–${aP(pr[1])}. But ≈${(cutMw/1000).toFixed(1)} GW of its builds slip: the crossing moves ${N7}, the outright shortage ${A0&&A1[0]?days((A0-A1[0])/DAY):'—'} sooner. Looser now, tighter later.`
      :`If all ${labs.length} failed at once, ≈${MW(all)} comes free, ≈${P(lossC)} of tokens disappear and rents fall ${aP(pr[0])}–${aP(pr[1])}. Net of cancelled builds, Fig. 1’s crossing moves ${N7}. The token economy survives.`;
    $('#stressLead').textContent=L;
  }
  $('#stressMode').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;mode=b.dataset.mode;[...$('#stressMode').children].forEach(x=>x.classList.toggle('on',x===b));draw();});
  ['stressMigrate','stressAbsorb','stressElastic','stressShortfall','stressSlip'].forEach(id=>$('#'+id).addEventListener('input',draw));
  draw();
})();
