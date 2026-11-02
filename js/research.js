// Source ledger and matched regional spot histories.
(function(){
  const facts=NC.research_facts||[];
  function evidence(){const q=$('#evidenceSearch').value.toLowerCase();table('#tEvidence',facts.filter(r=>JSON.stringify(r).toLowerCase().includes(q)),[{k:'subject',h:'Subject'},{k:'metric',h:'Metric / unit',f:r=>`${esc(r.metric)} · ${esc(r.unit)}`},{k:'value',h:'Checked claim',f:r=>`${esc(r.value_relation||'')} ${esc(typeof r.value==='number'?r.value.toLocaleString():r.value)}${badge(r.confidence)}${conflictBadge(r.subject,r.metric)}`},{k:'as_of',h:'Observation / claim date'},{k:'scope',h:'Scope'},{k:'note',h:'Limits / interpretation'},{k:'source_url',h:'',f:r=>src(r.source_url)}]);}
  $('#evidenceSearch').oninput=evidence;evidence();
  let category='All';
  function ledger(){
    $('#conflictCtl').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.k===category));
    const rs=(NC.conflicts||[]).filter(c=>category==='All'||c.classification===category);
    table('#tConflicts',rs,[{k:'subject',h:'Subject',f:r=>esc(r.subject||r.subjects?.join(', '))},{k:'classification',h:'Kind',f:r=>esc(conflictLabel(r))},{k:'explanation',h:'What differs'},{k:'treatment',h:'Display decision'},{k:'sources',h:'Both sources',f:r=>`<button type="button" class="source-note ${r.classification==='real_conflict'?'disputed':'context'}" data-conflict="${esc(r.id)}">Compare ${r.sources?.length||0} sources</button>`}]);
  }
  [['All','All'],['real_conflict','Conflicts'],['revision','Later evidence / source dates'],['scope_difference','Different bases']].forEach(([k,l])=>{const b=document.createElement('button');b.textContent=l;b.dataset.k=k;b.onclick=()=>{category=k;ledger();};$('#conflictCtl').appendChild(b);});ledger();
  let selected=0;const panels=NC.spot_panels||[];
  function pct(v){return `${v>0?'+':''}${v.toFixed(1)}%`;}
  function draw(){
    $('#spotCtl').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i===selected));
    const p=panels[selected];if(!p)return;const svg=$('#spotSvg');svg.innerHTML='';svg.setAttribute('viewBox','0 0 900 290');
    const pts=p.points,x0=Date.parse(p.start),x1=Date.parse(p.end),max=Math.ceil(Math.max(...pts.map(v=>v.usd)));
    const x=d=>58+(Date.parse(d)-x0)/(x1-x0)*800,y=v=>240-v/max*210;
    for(let v=0;v<=max;v++){el('line',{x1:58,x2:858,y1:y(v),y2:y(v),stroke:css('--grid')},svg);el('text',{x:48,y:y(v)+4,'text-anchor':'end'},svg).textContent='$'+v;}
    [0,2,4,6,7].forEach(i=>{const d=new Date(x0+i*864e5).toISOString();el('text',{x:x(d),y:263,'text-anchor':'middle'},svg).textContent=d.slice(5,10);});
    el('path',{d:pts.map((v,i)=>`${i?'L':'M'}${x(v.timestamp)},${y(v.usd)}`).join(''),fill:'none',stroke:css('--s1'),'stroke-width':2},svg);
    pts.forEach(v=>hover(el('circle',{cx:x(v.timestamp),cy:y(v.usd),r:3,fill:css('--s1'),'fill-opacity':.25},svg),`<b>Nebius ${esc(p.gpu)} · ${esc(p.region)}</b>${esc(v.timestamp)}<br>$${v.usd.toFixed(3)}/GPU-hour · posted spot quote`));
    const a=pts[0].usd,b=pts.at(-1).usd,change=100*(p.last_24h.median/p.first_24h.median-1);
    $('#spotTake').innerHTML=`<span class="verdict">${esc(p.gpu)}: endpoints ${pct(100*(b/a-1))}; daily medians ${pct(change)}</span>First-day median <b>$${p.first_24h.median.toFixed(2)}</b> → last-day median <b>$${p.last_24h.median.toFixed(2)}</b>. Week minimum/median/maximum: $${p.week.min.toFixed(2)} / $${p.week.median.toFixed(2)} / $${p.week.max.toFixed(2)}. ${src(p.url,'Reproduce provider API query')}<br><span class="small">${esc(p.aggregation)}. ${esc(p.note)}</span>`;
  }
  panels.forEach((p,i)=>{const b=document.createElement('button');b.textContent=`${p.gpu} · ${p.region}`;b.onclick=()=>{selected=i;draw();};$('#spotCtl').appendChild(b);});
  table('#tSpot',panels,[{k:'gpu',h:'Chip'},{k:'region',h:'Region'},{k:'start',h:'Start (UTC)'},{k:'end',h:'End (UTC)'},{k:'first_24h',h:'First day median',f:p=>'$'+p.first_24h.median.toFixed(2)},{k:'last_24h',h:'Last day median',f:p=>'$'+p.last_24h.median.toFixed(2)},{k:'sku',h:'Matched SKU'},{k:'url',h:'',f:p=>src(p.url)}]);
  onTheme(draw);draw();
})();
