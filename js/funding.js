// Can labs keep paying for training? Training ÷ revenue per lab (Anthropic on trend, OpenAI on its reported projections),
// and the two labs' funding gap against what they could raise. Inputs: research/training-funding.json.
(function(){
  const F=window.TRAINING_FUNDING;if(!F||!$('#fundSvg'))return;
  const A=F.anthropic,O=F.openai,P=F.pools,t0=2026+272/365; // Q3 run-rate dated at end-September 2026
  const yr=y=>y-t0,x2=v=>v.toFixed(2)+'×',B=v=>'$'+Math.round(v)+'B';
  // Anthropic: training = share × compute run-rate, growing gT a year; revenue grows gR a year from the Q3 run-rate.
  const aRatio=(t,gT,gR,s)=>s*A.compute_run_rate_b*gT**yr(t)/(A.revenue_run_rate_b*gR**yr(t));
  const aCross=(gT,gR,s)=>{const r0=s*A.compute_run_rate_b/A.revenue_run_rate_b;return gT<=gR?null:t0+Math.log(1/r0)/Math.log(gT/gR);};
  // Signed commitments, calendar years: 2027 ≈ ¾ of the next-12-month amount + ¼ of the later yearly rate; 2028 = the later rate.
  const later=(A.commit_through_2030_b-A.commit_next12_b)/(2030+1-(t0+1)),commit={2027:.75*A.commit_next12_b+.25*later,2028:later};
  const aRev=(y,gR)=>A.revenue_run_rate_b*gR**(y+.5-t0),aOpex=y=>A.opex_ex_compute_run_rate_b*A.opex_growth**(y+.5-t0);
  const aGap=(y,gR)=>Math.max(0,commit[y]+aOpex(y)-aRev(y,gR));
  const cap=(c,y)=>P.capacity.base_per_year*c.share*c.growth**(y-2026);
  function draw(){
    const gR=$('#fundRev').valueAsNumber,gT=$('#fundTrain').valueAsNumber;
    $('#fundRevValue').textContent=gR.toFixed(1)+'×/yr';$('#fundTrainValue').textContent=gT.toFixed(1)+'×/yr';
    const svg=$('#fundSvg');svg.innerHTML='';const W=440,H=230,L=40,R=W-78,T=12,Bm=H-26,X=t=>L+(t-2026)/(2031-2026)*(R-L),Y=v=>Bm-Math.min(v,2)/2*(Bm-T);
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    for(let v=0;v<=2;v+=.5){el('line',{x1:L,x2:R,y1:Y(v),y2:Y(v),stroke:css('--grid')},svg);el('text',{x:L-6,y:Y(v)+4,'text-anchor':'end','font-size':10},svg).textContent=v.toFixed(1)+'×';}
    for(let y=2026;y<=2031;y++)el('text',{x:X(y),y:H-8,'text-anchor':'middle','font-size':10},svg).textContent=y;
    el('line',{x1:L,x2:R,y1:Y(1),y2:Y(1),stroke:css('--ink'),'stroke-dasharray':'4 3',opacity:.7},svg);
    el('text',{x:R+4,y:Y(1)+4,'font-size':10,class:'ink'},svg).textContent='= revenue';
    const ts=[];for(let t=t0;t<=2031;t+=1/24)ts.push(t);
    const band=ts.map((t,i)=>`${i?'L':'M'}${X(t).toFixed(1)},${Y(aRatio(t,gT,gR,A.training_share[1])).toFixed(1)}`).join('')+[...ts].reverse().map(t=>`L${X(t).toFixed(1)},${Y(aRatio(t,gT,gR,A.training_share[0])).toFixed(1)}`).join('')+'Z';
    el('path',{d:band,fill:css('--s1'),opacity:.35},svg);
    const lastT=ts.at(-1),lab=el('text',{x:R+4,y:Math.max(T+8,Y(aRatio(lastT,gT,gR,.69))+4),'font-size':10,fill:css('--s1'),'font-weight':600},svg);lab.textContent='Anthropic';
    // Anthropic on signed commitments (hollow), OpenAI on its reported projections (filled, C).
    [[2027,commit[2027]],[2028,commit[2028]]].forEach(([y,cm])=>{const v=.69*cm/aRev(y,gR),c=el('circle',{cx:X(y+.5),cy:Y(v),r:4,fill:css('--surface-1'),stroke:css('--s1'),'stroke-width':1.6},svg);hover(c,`<b>Anthropic ${y}, signed commitments</b>≈${B(cm)} compute × 64–74% training ÷ ≈${B(aRev(y,gR))} revenue at ${gR.toFixed(1)}×/yr = ${x2(.64*cm/aRev(y,gR))}–${x2(.74*cm/aRev(y,gR))} · D`);});
    Object.keys(O.training).forEach(y=>{const v=O.training[y]/O.revenue[y],c=el('circle',{cx:X(+y+.5),cy:Y(v),r:4.5,fill:css('--s2')},svg);hover(c,`<b>OpenAI ${y}, reported projection (C)</b>Training $${O.training[y]}B ÷ revenue $${O.revenue[y]}B = ${x2(v)}<br><span class="muted">${esc(O.note)}</span>`);});
    el('text',{x:X(2027.5)+8,y:Y(O.training['2027']/O.revenue['2027'])-6,'font-size':10,fill:css('--s2'),'font-weight':600},svg).textContent='OpenAI (C)';
    // Gap vs capacity, 2027 and 2028.
    const bars=$('#fundBars'),yrs=[2027,2028],gaps=yrs.map(y=>({y,o:O.burn[y],a:aGap(y,gR)})),mx=Math.max(...gaps.map(g=>g.o+g.a),...yrs.map(y=>cap(P.capacity.cases[2],y)))*1.05,pc=v=>(100*v/mx).toFixed(1)+'%';
    bars.innerHTML=gaps.map(g=>`<div class="fund-row"><b>${g.y}</b><div class="fund-track"><span class="fund-o" style="width:${pc(g.o)}" title="OpenAI ≈${B(g.o)} (C)"></span><span class="fund-a" style="width:${pc(g.a)}" title="Anthropic ≈${B(g.a)} (D)"></span>${P.capacity.cases.map(c=>`<i class="fund-cap ${c.k}" style="left:${pc(cap(c,g.y))}" title="${c.k}: ≈${B(cap(c,g.y))}">${g.y===2027?`<em>${c.k==='pessimistic'?'pess.':c.k==='optimistic'?'opt.':'central'}</em>`:''}</i>`).join('')}</div><span class="small">gap ≈${B(g.o+g.a)}</span></div>`).join('')+
      `<p class="small fund-key"><i class="fund-o"></i>OpenAI gap (C) <i class="fund-a"></i>Anthropic gap (D) <i class="fund-cap"></i>what the two could raise: ${P.capacity.cases.map(c=>`${c.k} ≈${B(cap(c,2028))}`).join(' · ')} in 2028. Central is held flat at the Q3 pace, so it is the same both years.</p>`;
    const ac=aCross(gT,gR,(A.training_share[0]+A.training_share[1])/2),g28=gaps[1].o+gaps[1].a,cs=P.capacity.cases.map(c=>cap(c,2028));
    $('#fundHeadline').innerHTML=`On its reported projections, OpenAI’s training passes its revenue in 2027 and its funding gap peaks at ≈$85B in 2028 (C). Anthropic’s training ${ac==null?'never passes its revenue':`passes its revenue in ${Math.floor(ac)}`} at ${gR.toFixed(1)}× revenue growth. In 2028 the two need ≈${B(g28)}: ${g28>cs[0]?'more than the pessimistic case allows':'within every case'}${g28>cs[1]?' and more than the central case':''}.`;
    $('#fundTests').innerHTML=[`<li><b>Training ÷ serving gross profit.</b> Anthropic ${A.training_share.map(s=>x2(s*A.compute_run_rate_b/(A.revenue_run_rate_b*(1-A.cost_of_revenue_9m_b/A.revenue_9m_b)))).join('–')} on the Q3 run-rate, ${x2(.64*A.compute_9m_b/(A.revenue_9m_b-A.cost_of_revenue_9m_b))}–${x2(.74*A.compute_9m_b/(A.revenue_9m_b-A.cost_of_revenue_9m_b))} on Jan–Sep (A). OpenAI ≈${x2(O.training['2026']/(O.revenue['2026']-O.serving_2026_b))} on its reported projections (C).</li>`,
      `<li><b>Gap ÷ round size.</b> OpenAI’s 2027 gap is ≈${(O.burn['2027']/O.round_target_b).toFixed(1)}× its current $${O.round_target_b}B round target (C). Anthropic is cash-flow positive with $${Math.round(A.cash_b)}B of cash (A).</li>`,
      `<li><b>The pools.</b> Hyperscaler cash ≈0, so lab funding is now debt-funded, and debt is getting dearer.</li>`].join('');
  }
  $('#fundSignals').innerHTML=`<p class="small">${esc(P.hyperscaler)} ${src(P.hyperscaler_source_url)} ${esc(P.debt)} ${src(P.debt_source_url)}</p><p class="small">${esc(P.private_note)} ${P.private_quarters.map(q=>`${esc(q.q)} $${q.total}B (≈$${q.ex_mega}B without ${esc(q.mega)})`).join(' · ')}. ${src(P.private_source_url)}</p><ul class="small">${F.signals.map(s=>`<li>${esc(s.t)} ${src(s.source_url)}</li>`).join('')}</ul><p class="small">${esc(A.note)} ${src(A.source_url)}</p><p class="small">${esc(O.note)} ${src(O.source_url)}</p><p class="small">${esc(P.capacity.note)} Training cost growth: Epoch AI, ${F.epoch_training_growth.central}× a year (${F.epoch_training_growth.range.join('–')}×) for frontier runs ${src(F.epoch_training_growth.source_url)}.</p>`;
  ['fundRev','fundTrain'].forEach(id=>$('#'+id).addEventListener('input',draw));onTheme(draw);draw();
})();
