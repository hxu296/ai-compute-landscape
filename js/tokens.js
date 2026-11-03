// Native disclosures and explicitly labeled arithmetic conversions; scopes are never summed.
(function(){
  const EST=window.DEMAND_RESEARCH?.token_estimates||{};
  const periods=['day','minute','week','month','quarter','year','cumulative'];
  const period=r=>r.unit.match(/^tokens per (minute|day|week|month|quarter|year)/)?.[1]||(/cumulative|total tokens/i.test(r.unit)?'cumulative':null);
  const supplemental=window.DEMAND_RESEARCH?.supplemental_tokens||[];
  const supplementalNative=supplemental.map(r=>({...r,unit:'tokens per '+r.period,as_of:r.observation_date||r.source_date,as_of_basis:r.observation_date?'observation':'publication; measurement day unspecified'}));
  const canonical=[...NC.tokens,...supplementalNative].filter(r=>r.value>0&&/^tokens/.test(r.unit)&&period(r)).map(r=>/^(Google|Google Cloud)$/.test(r.subject)&&period(r)==='minute'?{...r,subject:'Google Cloud',unit:'tokens per minute (first-party model APIs)'}:r);
  const seenApi=new Set(),records=canonical.filter(r=>{if(r.subject!=='Google Cloud'||period(r)!=='minute')return true;const key=r.value+'|'+r.as_of.slice(0,7);if(seenApi.has(key))return false;seenApi.add(key);return true;});
  const tok=v=>{const u=[[1e15,'Q'],[1e12,'T'],[1e9,'B'],[1e6,'M']].find(([n])=>v>=n);return u?`${+(v/u[0]).toPrecision(4)}${u[1]}`:num(v);};
  const rangeText=r=>tok(r.value)+(r.range_high!=null?'–'+tok(r.range_high):'');
  const qualifier=TokenMath.boundText;
  const chartLabel=(svg,text,y,cls)=>{
    const label=el('text',{x:185,y,'text-anchor':'end',class:cls},svg);label.textContent=text;
    let short=text;while(label.getComputedTextLength()>178&&short.length>1){short=short.slice(0,-1);label.textContent=short+'…';}
    el('title',{},label).textContent=text;return label;
  };
  const latestOption=document.createElement('option');latestOption.value='latest';latestOption.textContent='Latest · daily equivalents';$('#tokenPeriod').appendChild(latestOption);
  periods.filter(p=>records.some(r=>period(r)===p)).forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p==='cumulative'?'Native history · cumulative':`Native history · per ${p}`;$('#tokenPeriod').appendChild(o);});
  function drawHistory(){
    $('#tokenViewNote').textContent='Native reporting periods and historical observations. Change to Latest for daily equivalents across periods; API and all-product scopes remain separate.';
    const selected=$('#tokenPeriod').value,groups=new Map();
    records.filter(r=>period(r)===selected).forEach(r=>{const k=r.subject+' · '+r.unit;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});
    const rows=[...groups].map(([key,rs])=>{rs.sort((a,b)=>a.as_of.localeCompare(b.as_of));return{key,first:rs[0],last:rs.at(-1)};}).sort((a,b)=>b.last.value-a.last.value);
    const missing=[...(NC.token_coverage||[]),...(window.DEMAND_RESEARCH?.unavailable_tokens||[])].filter(r=>r.show_in_plot).map(r=>({key:r.subject+' · total unavailable',first:null,last:{...r,value:null,confidence:null,display_scope:'Comparable total unavailable'}}));
    const plotted=rows.concat(missing);
    const svg=$('#tokenSvg');svg.innerHTML='';const L=195,R=505,T=22,rh=43,max=Math.max(1,...plotted.map(r=>r.last.value||0));svg.setAttribute('viewBox',`0 0 680 ${T+rh*plotted.length+40}`);
    const x=v=>L+(R-L)*v/max;
    for(let i=0;i<=4;i++){const v=max*i/4;el('line',{x1:x(v),x2:x(v),y1:T-5,y2:T+rh*plotted.length,stroke:css('--grid')},svg);el('text',{x:x(v),y:T+rh*plotted.length+20,'text-anchor':'middle'},svg).textContent=tok(v);}
    plotted.forEach((r,i)=>{const y=T+i*rh,p=r.last;
      chartLabel(svg,p.subject,y+14,'ink token-company');
      const scope=p.display_scope||p.unit?.match(/\((.*)\)/)?.[1]||'Source-specific scope';
      chartLabel(svg,scope,y+28,'token-scope');
      if(p.value==null){const label=el('text',{x:L+8,y:y+19,'font-size':11,fill:css('--muted')},svg);label.textContent=EST[p.subject]?`Not disclosed · estimate ≈${tok(EST[p.subject].central)}/day E`:'Total unavailable';hover(label,`<b>${esc(p.subject)}</b>${esc(p.note)}<br>${src(p.source_url,'Sources checked')}`);return;}

      const bar=el('rect',{x:L,y:y+5,width:Math.max(2,x(p.value)-L),height:24,rx:3,fill:css(p.confidence==='derived'?'--s4':'--s1'),opacity:.72},svg);
      el('text',{x:x(p.value)+7,y:y+18,class:'token-value','font-size':12},svg).textContent=qualifier(p)+rangeText(p)+(p.confidence==='derived'?' D':'')+' · '+p.as_of.slice(0,7);
      hover(bar,`<b>${esc(p.subject)}</b>${esc(qualifier(p))}${rangeText(p)} ${esc(p.unit)}${badge(p.confidence)}<br>Dated disclosure / observation: ${esc(p.as_of)}${p.as_of_basis?` (${esc(p.as_of_basis)})`:""}${p.source_date?` · published ${esc(p.source_date)}`:''}<br>${esc(p.note||'Source-specific scope; token accounting may differ.')}<br>${src(p.source_url)}`);
    });
    table('#tokenTable',rows.concat(missing),[{k:'key',h:'Provider / exact series'},{k:'first',h:'First collected observation',f:r=>r.first?`${esc(qualifier(r.first))}${rangeText(r.first)} · ${esc(r.first.as_of)} ${src(r.first.source_url,'↗')}`:'Unavailable'},{k:'last',h:'Latest collected observation',f:r=>r.last.value==null?`Unavailable ${src(r.last.source_url,'sources checked')}`:`${esc(qualifier(r.last))}${rangeText(r.last)}${badge(r.last.confidence)} · ${esc(r.last.as_of)} ${src(r.last.source_url,'↗')}`},{k:'scope',h:'Scope and limits',f:r=>esc(r.last.note||'The exact reporting basis is retained in the series label; token types are not standardized across providers.')}]);
  }
  const relation=TokenMath.boundText;
  function native(r){return relation(r)+tok(r.value)+(r.range_high!=null?'–'+tok(r.range_high):'')+' / '+(r.native_period_label||(r.window_days?r.window_days+' days':r.period));}
  const contextSources=r=>(r.supporting_disclosures||[]).map(s=>`${esc(s.source_date)}: ${esc(s.claim)} ${esc(s.treatment)} ${src(s.source_url,'Related source ↗')}`).join('<br>');
  function drawLatest(){
    const snapshot=NC.token_snapshot,rows=TokenMath.latestByScope([...snapshot.records,...supplemental]).map(r=>({...r,comparison_group:['platform','subset','historical','aggregate'].includes(r.comparison_group)?r.comparison_group:r.status==='reported_historical'?'historical':'platform',daily:TokenMath.daily(r),daily_value:TokenMath.daily(r)?.value})).filter(r=>r.daily).sort((a,b)=>b.daily.value-a.daily.value);
    const groups=[['platform','Platform and API disclosures'],['subset','Limited coverage'],['historical','Historical observations'],['aggregate','National aggregate'],['unavailable','No disclosed total · estimate (E)']];
    const missing=[...(snapshot.unavailable||[]),...(window.DEMAND_RESEARCH?.unavailable_tokens||[])].filter(r=>r.show_in_plot).map(r=>({...r,daily:null,comparison_group:'unavailable'})),all=groups.flatMap(([key])=>rows.filter(r=>r.comparison_group===key).concat(missing.filter(r=>r.comparison_group===key)));
    $('#tokenViewNote').textContent=`Evidence checked ${snapshot.reviewed_at||snapshot.checked_at}. Daily equivalents grouped by coverage. Dates differ; historical figures and narrower subsets are separate. D = converted period. Groups share one scale and are not additive.`;
    const svg=$('#tokenSvg');svg.innerHTML='';const L=195,R=505,T=28,rh=47,gh=28,used=groups.filter(([key])=>all.some(r=>r.comparison_group===key)),end=T+rh*all.length+gh*used.length,max=Math.max(1,...rows.map(r=>r.daily.high||r.daily.value));svg.setAttribute('viewBox',`0 0 680 ${end+40}`);const x=v=>L+(R-L)*v/max;
    el('text',{x:L,y:12,'font-size':11},svg).textContent='Daily equivalent · tokens/day';
    for(let i=0;i<=4;i++){const v=max*i/4;el('line',{x1:x(v),x2:x(v),y1:T-5,y2:end,stroke:css('--grid')},svg);el('text',{x:x(v),y:end+20,'text-anchor':'middle'},svg).textContent=tok(v);}
    let cursor=T,lastGroup=null;
    all.forEach((r,i)=>{
      if(r.comparison_group!==lastGroup){el('text',{x:4,y:cursor+14,class:'ink','font-size':11,'font-weight':600,'data-token-group':r.comparison_group},svg).textContent=groups.find(([key])=>key===r.comparison_group)[1];cursor+=gh;lastGroup=r.comparison_group;}
      const y=cursor,scope=r.display_scope||'Comparable total unavailable';cursor+=rh;
      chartLabel(svg,r.subject==='ByteDance / Volcano Engine'?'ByteDance / Volcano':r.subject,y+14,'ink token-company');
      chartLabel(svg,scope,y+29,'token-scope');
      if(!r.daily){const e=EST[r.subject];
        if(e){const w=Math.max(2,x(Math.min(e.central,max))-L),bar=el('rect',{x:L,y:y+5,width:w,height:25,rx:3,fill:'none',stroke:css('--s1'),'stroke-width':1.5,'stroke-dasharray':'4 3','data-token-estimate':r.subject},svg);
          el('line',{x1:x(Math.min(e.low,max)),x2:x(Math.min(e.high,max)),y1:y+17,y2:y+17,stroke:css('--muted'),'stroke-width':1.5},svg);
          el('text',{x:x(Math.min(e.high,max))+7,y:y+15,class:'token-value'},svg).textContent='≈'+tok(e.central)+' E';
          el('text',{x:x(Math.min(e.high,max))+7,y:y+29,class:'token-scope'},svg).textContent='range '+tok(e.low)+'–'+tok(e.high);
          hover(bar,`<b>${esc(r.subject)}</b>Estimate, not a disclosure: ≈${tok(e.central)}/day (range ${tok(e.low)}–${tok(e.high)}), November 3.<br>${esc(e.basis)}<br>${src(e.source_url,'Basis ↗')}`);return;}
        const label=el('text',{x:L+8,y:y+19,class:'token-value'},svg);label.textContent='Total unavailable';hover(label,`<b>${esc(r.subject)}</b>${esc(r.note||'No comparable total verified.')}<br>${r.source_url?src(r.source_url,'Sources checked'):''}`);return;}
      const d=r.daily,bar=el('rect',{x:L,y:y+5,width:Math.max(2,x(d.value)-L),height:25,rx:3,fill:css(d.converted?'--s4':'--s1'),opacity:.72,'data-token-scope':r.scope_id},svg);
      if(d.high!=null){el('line',{x1:x(d.value),x2:x(d.high),y1:y+17,y2:y+17,stroke:css('--s1'),'stroke-width':2,'stroke-dasharray':'3 2'},svg);el('line',{x1:x(d.high),x2:x(d.high),y1:y+10,y2:y+24,stroke:css('--s1'),'stroke-width':2},svg);}
      const label=relation(r)+tok(d.value)+(d.high!=null?'–'+tok(d.high):'')+(d.converted?' D':'');
      el('text',{x:x(d.high||d.value)+7,y:y+15,class:'token-value'},svg).textContent=label;
      el('text',{x:x(d.high||d.value)+7,y:y+29,class:'token-scope'},svg).textContent=(r.observation_end?'FY ended ':r.observation_date?'obs ':'pub ')+(r.observation_end||r.observation_date||r.source_date).slice(0,7);
      hover(bar,`<b>${esc(r.subject)} · ${esc(scope)}</b>${esc(native(r))}<br>Daily equivalent: ${esc(relation(r))}${tok(d.value)}${d.high!=null?'–'+tok(d.high):''}${d.converted?' D':''}<br>${esc(d.formula)}<br>Observation: ${esc(r.observation_start?r.observation_start+' to '+r.observation_end:r.observation_date||'window not specified')} · published ${esc(r.source_date)}<br>${esc(r.date_basis||'')}${r.date_basis?'<br>':''}${esc(r.note||'Input/output/cache accounting is not standardized.')}<br>${src(r.source_url)}${r.supporting_disclosures?.length?'<br>'+contextSources(r):''}`);
    });
    table('#tokenTable',all,[{k:'subject',h:'Company / scope',f:r=>`<b>${esc(r.subject)}</b><br>${esc(r.display_scope||'Comparable total unavailable')}`},{k:'value',h:'Latest native disclosure',f:r=>r.daily?`${esc(native(r))}${badge(r.confidence||'reported')}`:EST[r.subject]?`Not disclosed · estimate ≈${tok(EST[r.subject].central)}/day (${tok(EST[r.subject].low)}–${tok(EST[r.subject].high)})${badge('estimated')}`:'Unavailable'},{k:'daily_value',h:'Daily equivalent',f:r=>r.daily?`${esc(relation(r))}${tok(r.daily.value)}${r.daily.high!=null?'–'+tok(r.daily.high):''}${r.daily.converted?badge('derived'):''}<br><span class="small">${esc(r.daily.formula)}</span>`:'Unavailable'},{k:'observation_date',h:'Observation / publication',f:r=>`${esc(r.observation_start?r.observation_start+' to '+r.observation_end:r.observation_date||'Window unspecified')}<br><span class="small">Published ${esc(r.source_date||'not dated')}</span>`},{k:'note',h:'Scope, limits and source',f:r=>`${esc(r.note||'No comparable total verified.')} ${r.source_url?src(r.source_url,'Source ↗'):''}${r.supporting_disclosures?.length?'<br>'+contextSources(r):''}`}]);
  }
  function draw(){if($('#tokenPeriod').value==='latest')drawLatest();else drawHistory();}
  $('#tokenPeriod').onchange=draw;onTheme(draw);draw();document.fonts?.ready.then(draw);
  $('#tokenCoverage').innerHTML='<p>Company totals, model-specific usage, router traffic and nationwide aggregates can overlap. The table preserves separate disclosures instead of inferring an undisclosed total. T = trillion, Q = quadrillion, B = billion, M = million.</p>'+(NC.token_coverage||[]).map(r=>`<p><b>${esc(r.subject)}:</b> ${esc(r.note)} ${r.source_url?src(r.source_url):''}</p>`).join('');
})();
