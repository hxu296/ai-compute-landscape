// Native disclosures and explicitly labeled arithmetic conversions; scopes are never summed.
(function(){
  const periods=['day','minute','week','month','quarter','year','cumulative'];
  const period=r=>r.unit.match(/^tokens per (minute|day|week|month|quarter|year)/)?.[1]||(/cumulative|total tokens/i.test(r.unit)?'cumulative':null);
  const canonical=NC.tokens.filter(r=>r.value>0&&/^tokens/.test(r.unit)&&period(r)).map(r=>/^(Google|Google Cloud)$/.test(r.subject)&&period(r)==='minute'?{...r,subject:'Google Cloud',unit:'tokens per minute (first-party model APIs)'}:r);
  const seenApi=new Set(),records=canonical.filter(r=>{if(r.subject!=='Google Cloud'||period(r)!=='minute')return true;const key=r.value+'|'+r.as_of.slice(0,7);if(seenApi.has(key))return false;seenApi.add(key);return true;});
  const tok=v=>{const u=[[1e15,'Q'],[1e12,'T'],[1e9,'B'],[1e6,'M']].find(([n])=>v>=n);return u?`${+(v/u[0]).toPrecision(4)}${u[1]}`:num(v);};
  const rangeText=r=>tok(r.value)+(r.range_high!=null?'–'+tok(r.range_high):'');
  const qualifier=r=>/^(>|≥|more than|over|at least)/i.test(r.value_relation||'')?'≥':r.value_relation||'';
  const latestOption=document.createElement('option');latestOption.value='latest';latestOption.textContent='Latest · daily equivalents';$('#tokenPeriod').appendChild(latestOption);
  periods.filter(p=>records.some(r=>period(r)===p)).forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p==='cumulative'?'Native history · cumulative':`Native history · per ${p}`;$('#tokenPeriod').appendChild(o);});
  function drawHistory(){
    $('#tokenViewNote').textContent='Native reporting periods and historical observations. Change to Latest for daily equivalents across periods; API and all-product scopes remain separate.';
    const selected=$('#tokenPeriod').value,groups=new Map();
    records.filter(r=>period(r)===selected).forEach(r=>{const k=r.subject+' · '+r.unit;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});
    const rows=[...groups].map(([key,rs])=>{rs.sort((a,b)=>a.as_of.localeCompare(b.as_of));return{key,first:rs[0],last:rs.at(-1)};}).sort((a,b)=>b.last.value-a.last.value);
    const missing=(NC.token_coverage||[]).filter(r=>r.show_in_plot).map(r=>({key:r.subject+' · total unavailable',first:null,last:{...r,value:null,confidence:null,display_scope:'Comparable total unavailable'}}));
    const latest=new Map();
    rows.forEach(r=>{const old=latest.get(r.last.subject);if(!old||r.last.as_of>old.last.as_of)latest.set(r.last.subject,r);});
    const plotted=[...latest.values()].sort((a,b)=>b.last.value-a.last.value).concat(missing);
    const svg=$('#tokenSvg');svg.innerHTML='';const L=195,R=505,T=22,rh=43,max=Math.max(1,...plotted.map(r=>r.last.value||0));svg.setAttribute('viewBox',`0 0 680 ${T+rh*plotted.length+40}`);
    const x=v=>L+(R-L)*v/max;
    for(let i=0;i<=4;i++){const v=max*i/4;el('line',{x1:x(v),x2:x(v),y1:T-5,y2:T+rh*plotted.length,stroke:css('--grid')},svg);el('text',{x:x(v),y:T+rh*plotted.length+20,'text-anchor':'middle'},svg).textContent=tok(v);}
    plotted.forEach((r,i)=>{const y=T+i*rh,p=r.last;
      el('text',{x:L-10,y:y+14,'text-anchor':'end',class:'ink token-company','font-size':14},svg).textContent=p.subject;
      const scope=p.display_scope||p.unit?.match(/\((.*)\)/)?.[1]||'Source-specific scope';
      const short=scope.length>36?scope.slice(0,34)+'…':scope;
      el('text',{x:L-10,y:y+28,'text-anchor':'end',class:'token-scope','font-size':10,fill:css('--muted')},svg).textContent=short;
      if(p.value==null){const label=el('text',{x:L+8,y:y+19,'font-size':11,fill:css('--muted')},svg);label.textContent='Total unavailable';hover(label,`<b>${esc(p.subject)}</b>${esc(p.note)}<br>${src(p.source_url,'Sources checked')}`);return;}

      const bar=el('rect',{x:L,y:y+5,width:Math.max(2,x(p.value)-L),height:24,rx:3,fill:css(p.confidence==='derived'?'--s4':'--s1'),opacity:.72},svg);
      el('text',{x:x(p.value)+7,y:y+18,class:'token-value','font-size':12},svg).textContent=qualifier(p)+rangeText(p)+(p.confidence==='derived'?' D':'')+' · '+p.as_of.slice(0,7);
      hover(bar,`<b>${esc(p.subject)}</b>${esc(qualifier(p))}${rangeText(p)} ${esc(p.unit)}${badge(p.confidence)}<br>Dated disclosure / observation: ${esc(p.as_of)}${p.as_of_basis?` (${esc(p.as_of_basis)})`:""}${p.source_date?` · published ${esc(p.source_date)}`:''}<br>${esc(p.note||'Source-specific scope; token accounting may differ.')}<br>${src(p.source_url)}`);
    });
    table('#tokenTable',rows.concat(missing),[{k:'key',h:'Provider / exact series'},{k:'first',h:'First collected observation',f:r=>r.first?`${esc(qualifier(r.first))}${rangeText(r.first)} · ${esc(r.first.as_of)} ${src(r.first.source_url,'↗')}`:'Unavailable'},{k:'last',h:'Latest collected observation',f:r=>r.last.value==null?`Unavailable ${src(r.last.source_url,'sources checked')}`:`${esc(qualifier(r.last))}${rangeText(r.last)}${badge(r.last.confidence)} · ${esc(r.last.as_of)} ${src(r.last.source_url,'↗')}`},{k:'scope',h:'Scope and limits',f:r=>esc(r.last.note||'The exact reporting basis is retained in the series label; token types are not standardized across providers.')}]);
  }
  const relation=r=>/^(>|≥|more than|over|at least)/i.test(r.value_relation||'')?(r.value_relation==='≥'?'≥':'>'):/nearly|about|approx|≈/i.test(r.value_relation||'')?'≈':r.value_relation||'';
  function native(r){return (r.value_relation&&/nearly/i.test(r.value_relation)?'nearly ':relation(r))+tok(r.value)+(r.range_high!=null?'–'+tok(r.range_high):'')+' / '+(r.window_days?r.window_days+' days':r.period);}
  function drawLatest(){
    const snapshot=NC.token_snapshot,rows=TokenMath.latestByScope(snapshot.records).map(r=>({...r,daily:TokenMath.daily(r),daily_value:TokenMath.daily(r)?.value})).filter(r=>r.daily).sort((a,b)=>b.daily.value-a.daily.value);
    const missing=(snapshot.unavailable||[]).filter(r=>r.show_in_plot).map(r=>({...r,daily:null})),all=rows.concat(missing);
    $('#tokenViewNote').textContent=`Evidence checked ${snapshot.checked_at}. Latest per scope; native observations and daily conversions share the same rows. D = converted period; ranges retain both ends.`;
    const svg=$('#tokenSvg');svg.innerHTML='';const L=195,R=505,T=22,rh=47,max=Math.max(1,...rows.map(r=>r.daily.high||r.daily.value));svg.setAttribute('viewBox',`0 0 680 ${T+rh*all.length+40}`);const x=v=>L+(R-L)*v/max;
    for(let i=0;i<=4;i++){const v=max*i/4;el('line',{x1:x(v),x2:x(v),y1:T-5,y2:T+rh*all.length,stroke:css('--grid')},svg);el('text',{x:x(v),y:T+rh*all.length+20,'text-anchor':'middle'},svg).textContent=tok(v);}
    all.forEach((r,i)=>{
      const y=T+i*rh,scope=r.display_scope||'Comparable total unavailable',short=scope.length>36?scope.slice(0,34)+'…':scope;
      el('text',{x:L-10,y:y+14,'text-anchor':'end',class:'ink token-company'},svg).textContent=r.subject==='ByteDance / Volcano Engine'?'ByteDance / Volcano':r.subject;
      el('text',{x:L-10,y:y+29,'text-anchor':'end',class:'token-scope'},svg).textContent=short;
      if(!r.daily){const label=el('text',{x:L+8,y:y+19,class:'token-value'},svg);label.textContent='Total unavailable';hover(label,`<b>${esc(r.subject)}</b>${esc(r.note||'No comparable total verified.')}<br>${r.source_url?src(r.source_url,'Sources checked'):''}`);return;}
      const d=r.daily,bar=el('rect',{x:L,y:y+5,width:Math.max(2,x(d.value)-L),height:25,rx:3,fill:css(d.converted?'--s4':'--s1'),opacity:.72,'data-token-scope':r.scope_id},svg);
      if(d.high!=null){el('line',{x1:x(d.value),x2:x(d.high),y1:y+17,y2:y+17,stroke:css('--s1'),'stroke-width':2,'stroke-dasharray':'3 2'},svg);el('line',{x1:x(d.high),x2:x(d.high),y1:y+10,y2:y+24,stroke:css('--s1'),'stroke-width':2},svg);}
      const label=relation(r)+tok(d.value)+(d.high!=null?'–'+tok(d.high):'')+(d.converted?' D':'');
      el('text',{x:x(d.high||d.value)+7,y:y+15,class:'token-value'},svg).textContent=label;
      el('text',{x:x(d.high||d.value)+7,y:y+29,class:'token-scope'},svg).textContent=(r.observation_date?'obs ':'pub ')+(r.observation_date||r.source_date).slice(0,7);
      hover(bar,`<b>${esc(r.subject)} · ${esc(scope)}</b>${esc(native(r))}<br>Daily equivalent: ${esc(relation(r))}${tok(d.value)}${d.high!=null?'–'+tok(d.high):''}${d.converted?' D':''}<br>${esc(d.formula)}<br>Observation: ${esc(r.observation_date||'window not specified')} · published ${esc(r.source_date)}<br>${esc(r.date_basis||'')}${r.date_basis?'<br>':''}${esc(r.note||'Input/output/cache accounting is not standardized.')}<br>${src(r.source_url)}`);
    });
    table('#tokenTable',all,[{k:'subject',h:'Company / scope',f:r=>`<b>${esc(r.subject)}</b><br>${esc(r.display_scope||'Comparable total unavailable')}`},{k:'value',h:'Latest native disclosure',f:r=>r.daily?`${esc(native(r))}${badge(r.confidence||'reported')}`:'Unavailable'},{k:'daily_value',h:'Daily equivalent',f:r=>r.daily?`${esc(relation(r))}${tok(r.daily.value)}${r.daily.high!=null?'–'+tok(r.daily.high):''}${r.daily.converted?badge('derived'):''}<br><span class="small">${esc(r.daily.formula)}</span>`:'Unavailable'},{k:'observation_date',h:'Observation / publication',f:r=>`${esc(r.observation_date||'Window unspecified')}<br><span class="small">Published ${esc(r.source_date||'not dated')}</span>`},{k:'note',h:'Scope, limits and source',f:r=>`${esc(r.note||'No comparable total verified.')} ${r.source_url?src(r.source_url,'Source ↗'):''}`}]);
  }
  function draw(){if($('#tokenPeriod').value==='latest')drawLatest();else drawHistory();}
  $('#tokenPeriod').onchange=draw;onTheme(draw);draw();
  $('#tokenCoverage').innerHTML='<p>Company totals, model-specific usage, router traffic and nationwide aggregates can overlap. The table preserves separate disclosures instead of inferring an undisclosed total. T = trillion, Q = quadrillion, B = billion, M = million.</p>'+(NC.token_coverage||[]).map(r=>`<p><b>${esc(r.subject)}:</b> ${esc(r.note)} ${r.source_url?src(r.source_url):''}</p>`).join('');
})();
