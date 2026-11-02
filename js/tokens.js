// Token activity stays in its disclosed time basis; scopes are never summed.
(function(){
  const periods=['day','minute','week','month','quarter','year','cumulative'];
  const period=r=>r.unit.match(/^tokens per (minute|day|week|month|quarter|year)/)?.[1]||(/cumulative|total tokens/i.test(r.unit)?'cumulative':null);
  const records=NC.tokens.filter(r=>r.value>0&&/^tokens/.test(r.unit)&&period(r));
  const tok=v=>{const u=[[1e15,'Q'],[1e12,'T'],[1e9,'B'],[1e6,'M']].find(([n])=>v>=n);return u?`${+(v/u[0]).toPrecision(4)}${u[1]}`:num(v);};
  const qualifier=r=>/^(>|≥|more than|over|at least)/i.test(r.value_relation||'')?'≥':r.value_relation||'';
  periods.filter(p=>records.some(r=>period(r)===p)).forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p==='cumulative'?'Cumulative total':`Tokens per ${p}`;$('#tokenPeriod').appendChild(o);});
  function draw(){
    const selected=$('#tokenPeriod').value,groups=new Map();
    records.filter(r=>period(r)===selected).forEach(r=>{const k=r.subject+' · '+r.unit;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});
    const rows=[...groups].map(([key,rs])=>{rs.sort((a,b)=>a.as_of.localeCompare(b.as_of));return{key,first:rs[0],last:rs.at(-1)};}).sort((a,b)=>b.last.value-a.last.value);
    const svg=$('#tokenSvg');svg.innerHTML='';const L=225,R=795,T=22,rh=33,max=Math.max(1,...rows.map(r=>r.last.value));svg.setAttribute('viewBox',`0 0 920 ${T+rh*rows.length+40}`);
    const x=v=>L+(R-L)*v/max;
    for(let i=0;i<=4;i++){const v=max*i/4;el('line',{x1:x(v),x2:x(v),y1:T-5,y2:T+rh*rows.length,stroke:css('--grid')},svg);el('text',{x:x(v),y:T+rh*rows.length+20,'text-anchor':'middle'},svg).textContent=tok(v);}
    rows.forEach((r,i)=>{const y=T+i*rh,p=r.last;el('text',{x:L-10,y:y+17,'text-anchor':'end',class:'ink','font-size':11},svg).textContent=p.subject;
      const bar=el('rect',{x:L,y:y+5,width:Math.max(2,x(p.value)-L),height:18,rx:3,fill:css(p.confidence==='derived'?'--s4':'--s1'),opacity:.72},svg);
      el('text',{x:x(p.value)+7,y:y+18,'font-size':11},svg).textContent=qualifier(p)+tok(p.value);
      hover(bar,`<b>${esc(p.subject)}</b>${esc(qualifier(p))}${tok(p.value)} ${esc(p.unit)}${badge(p.confidence)}<br>Dated disclosure / observation: ${esc(p.as_of)}${p.as_of_basis?` (${esc(p.as_of_basis)})`:""}${p.source_date?` · published ${esc(p.source_date)}`:''}<br>${esc(p.note||'Source-specific scope; token accounting may differ.')}<br>${src(p.source_url)}`);
    });
    table('#tokenTable',rows,[{k:'key',h:'Provider / exact series'},{k:'first',h:'First collected observation',f:r=>`${esc(qualifier(r.first))}${tok(r.first.value)} · ${esc(r.first.as_of)} ${src(r.first.source_url,'↗')}`},{k:'last',h:'Latest collected observation',f:r=>`${esc(qualifier(r.last))}${tok(r.last.value)}${badge(r.last.confidence)} · ${esc(r.last.as_of)} ${src(r.last.source_url,'↗')}`},{k:'scope',h:'Scope and limits',f:r=>esc(r.last.note||'The exact reporting basis is retained in the series label; token types are not standardized across providers.')}]);
  }
  $('#tokenPeriod').onchange=draw;onTheme(draw);draw();
  $('#tokenCoverage').innerHTML='<p>Company totals, model-specific usage, router traffic and nationwide aggregates can overlap. The table preserves separate disclosures instead of inferring an undisclosed total. T = trillion, Q = quadrillion, B = billion, M = million.</p>'+(NC.token_coverage||[]).map(r=>`<p><b>${esc(r.subject)}:</b> ${esc(r.note)} ${r.source_url?src(r.source_url):''}</p>`).join('');
})();
