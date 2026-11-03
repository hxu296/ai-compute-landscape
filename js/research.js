// Source ledger and matched regional spot histories.
(function(){
  const daily=NC.daily?.items||[],lead=daily[0];
  if(lead){
    const impactLabels=['','Low impact','Moderate impact','Significant impact','High impact','Extremely high impact'];
    const rating=i=>`<span class="impact impact-${i.impact_score||1}" title="${esc(i.impact_reason||'Routine market observation')}">${impactLabels[i.impact_score||1]}</span>`;
    $('#dailyBrief').innerHTML=`<div class="news-meta"><span class="kicker">${lead.status==='reviewed'?'Compute news':'Daily market brief'}</span><time>${esc(lead.date)}</time>${rating(lead)}</div><div class="news-lead"><button type="button" id="newsLead">${esc(lead.title)}</button><button type="button" id="newsArchive">All news (${daily.length})</button></div>`;
    const dialog=document.createElement('dialog');dialog.id='newsDialog';dialog.className='news-dialog';dialog.setAttribute('aria-labelledby','newsHeading');
    dialog.innerHTML=`<div class="news-dialog-head"><h2 id="newsHeading">Compute news archive</h2><button type="button" id="newsClose" aria-label="Close news archive">×</button></div><div class="news-filters"><label>Search<input type="search" id="newsSearch" placeholder="Company, topic or date"></label><label>Minimum impact<select id="newsImpact"><option value="1">All impact levels</option><option value="2">Moderate or higher</option><option value="3">Significant or higher</option><option value="4">High or higher</option><option value="5">Extremely high</option></select></label><span id="newsCount" role="status"></span></div><details class="impact-guide"><summary>How impact is rated</summary><p>Editorial assessment of scale, scope and delivery implications: Low: minor or routine. Moderate: incremental. Significant: substantial regional or segment development. High: major industry change. Extremely high: exceptional ecosystem-wide change. Conditions and timing affect the rating. Impact is separate from confidence in the evidence.</p></details><div id="newsItems"></div>`;
    document.body.appendChild(dialog);
    function stories(){
      const q=$('#newsSearch').value.trim().toLowerCase(),min=Number($('#newsImpact').value);
      const shown=daily.filter(i=>(i.impact_score||1)>=min&&JSON.stringify(i).toLowerCase().includes(q));
      $('#newsCount').textContent=`${shown.length} of ${daily.length} stories`;
      $('#newsItems').innerHTML=shown.length?shown.map(i=>`<article class="news-story"><div class="news-meta"><time>${esc(i.date)}</time>${rating(i)}<span>${i.kind==='news'?'News':i.status==='reviewed'?'Analysis':'Automated market brief'}</span></div><h3>${esc(i.title)}</h3><p>${esc(i.summary)}</p><p class="news-reason"><b>Why this rating:</b> ${esc(i.impact_reason||'Routine benchmark observation.')}</p>${i.confidence?`<p class="news-confidence"><b>Evidence confidence:</b> ${esc(i.confidence)}</p>`:''}${i.event_date?`<p class="news-dates"><b>Event / announcement:</b> ${esc(i.event_date)}${i.event_date_scope?' · '+esc(i.event_date_scope):''}</p>`:''}${i.future_target?`<p class="news-dates"><b>Future target:</b> ${esc(i.future_target)}</p>`:''}<ul class="news-sources">${(i.sources||[]).map(s=>`<li>${src(s.url,esc(s.title))} <time>${esc(s.date)}</time></li>`).join('')}</ul></article>`).join(''):'<p class="news-empty">No stories match these filters.</p>';
    }
    function open(){$('#newsSearch').value='';$('#newsImpact').value='1';stories();dialog.showModal();dialog.scrollTop=0;document.body.classList.add('news-open');$('#newsSearch').focus();}
    $('#newsLead').onclick=open;$('#newsArchive').onclick=open;$('#newsClose').onclick=()=>dialog.close();
    $('#newsSearch').oninput=stories;$('#newsImpact').onchange=stories;
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>document.body.classList.remove('news-open'));
  }else $('#dailyBrief').hidden=true;

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
  function draw(){
    $('#spotCtl').querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i===selected));
    const p=panels[selected];if(!p)return;const svg=$('#spotSvg');svg.innerHTML='';svg.setAttribute('viewBox','0 0 900 290');
    const pts=p.points,x0=Date.parse(p.start),x1=Date.parse(p.end),max=Math.ceil(Math.max(...pts.map(v=>v.usd)));
    const x=d=>58+(Date.parse(d)-x0)/(x1-x0)*800,y=v=>240-v/max*210;
    for(let v=0;v<=max;v++){el('line',{x1:58,x2:858,y1:y(v),y2:y(v),stroke:css('--grid')},svg);el('text',{x:48,y:y(v)+4,'text-anchor':'end'},svg).textContent='$'+v;}
    [0,2,4,6,7].forEach(i=>{const d=new Date(x0+i*864e5).toISOString();el('text',{x:x(d),y:263,'text-anchor':'middle'},svg).textContent=d.slice(5,10);});
    el('path',{d:pts.map((v,i)=>`${i?'L':'M'}${x(v.timestamp)},${y(v.usd)}`).join(''),fill:'none',stroke:css('--s1'),'stroke-width':2},svg);
    pts.forEach(v=>hover(el('circle',{cx:x(v.timestamp),cy:y(v.usd),r:3,fill:css('--s1'),'fill-opacity':.25},svg),`<b>Nebius ${esc(p.gpu)} · ${esc(p.region)}</b>${esc(v.timestamp)}<br>$${v.usd.toFixed(3)}/GPU-hour · posted spot quote`));
  }
  panels.forEach((p,i)=>{const b=document.createElement('button');b.textContent=`${p.gpu} · ${p.region}`;b.onclick=()=>{selected=i;draw();};$('#spotCtl').appendChild(b);});
  table('#tSpot',panels,[{k:'gpu',h:'Chip'},{k:'region',h:'Region'},{k:'start',h:'Start (UTC)'},{k:'end',h:'End (UTC)'},{k:'first_24h',h:'First day median',f:p=>'$'+p.first_24h.median.toFixed(2)},{k:'last_24h',h:'Last day median',f:p=>'$'+p.last_24h.median.toFixed(2)},{k:'sku',h:'Matched SKU'},{k:'url',h:'',f:p=>src(p.url)}]);
  onTheme(draw);draw();
})();
