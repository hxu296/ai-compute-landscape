(function(){
  // Announced, not-yet-delivered chips for owners outside Epoch's snapshot; kept as a separate dashed segment.
  const FUT=window.DEMAND_RESEARCH?.future_accelerators||[];
  const records=NC.chip_stacks||[],family=c=>/^(MI|Instinct MI|AMD)/.test(c)?'AMD':/^TPU/.test(c)?'Google TPU':/^Trainium/.test(c)?'AWS Trainium':'NVIDIA';
  const owners=[...new Set(records.map(r=>r.subject))].sort(),color=o=>css('--s'+(owners.indexOf(o)%8+1));
  function draw(){
    const date=$('#chipStackDate').value,model=$('#chipStackGroup').value==='model',selected=records.filter(r=>r.as_of===date),groups=new Map();
    selected.forEach(r=>{const k=model?r.gpu_type:family(r.gpu_type);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);});
    const showFut=$('#chipStackFuture')?.checked,fut=new Map();
    if(showFut)FUT.forEach(r=>{const k=model?r.gpu_type:family(r.gpu_type);if(!groups.has(k))groups.set(k,[]);if(!fut.has(k))fut.set(k,[]);fut.get(k).push(r);});
    if(!model)['NVIDIA','AMD','Google TPU','AWS Trainium'].forEach(k=>{if(!groups.has(k))groups.set(k,[]);});
    const rows=[...groups].map(([name,rs])=>({name,rs,total:rs.reduce((n,r)=>n+r.value,0),fs:fut.get(name)||[],ft:(fut.get(name)||[]).reduce((n,r)=>n+r.count,0)})).sort((a,b)=>(b.total+b.ft)-(a.total+a.ft));
    const svg=$('#chipStackSvg');svg.innerHTML='';const L=145,R=740,T=20,rh=56,max=Math.max(...rows.map(r=>r.total+r.ft),1);svg.setAttribute('viewBox',`0 0 910 ${T+rh*rows.length+50}`);
    const x=v=>L+(R-L)*v/max;
    for(let i=0;i<=4;i++){const v=max*i/4;el('line',{x1:x(v),x2:x(v),y1:T-4,y2:T+rows.length*rh,stroke:css('--grid')},svg);el('text',{x:x(v),y:T+rows.length*rh+23,'text-anchor':'middle'},svg).textContent=(v/1e6).toFixed(1)+'M';}
    rows.forEach(({name,rs,total,fs,ft},i)=>{
      const y=T+i*rh;el('text',{x:L-12,y:y+22,'text-anchor':'end',class:'ink'},svg).textContent=name;
      if(!rs.length&&!fs.length){el('text',{x:L+8,y:y+22},svg).textContent='No covered observation at this date';return;}
      let start=0;
      owners.forEach(owner=>{
        const rr=rs.filter(r=>r.subject===owner),count=rr.reduce((s,r)=>s+r.value,0);if(!count)return;
        const bar=el('rect',{x:x(start),y:y+5,width:x(count)-L,height:29,fill:color(owner),stroke:css('--paper'),'stroke-width':1,'data-owner':owner,'data-count':count,'data-chip':name},svg);
        hover(bar,`<b>${esc(name)} · ${esc(owner)}</b>${num(count)} delivered chips · estimate<br>Reporting date ${date}<br>${rr.map(r=>`${esc(r.gpu_type)}: ${num(r.value)}<br>${esc(r.note||'')}`).join('<br>')}<br>${src(rr[0].source_url,'Epoch source data')}`);start+=count;
      });
      if(ft){const bar=el('rect',{x:x(start),y:y+5,width:x(ft)-L,height:29,fill:css('--s2'),opacity:.28,stroke:css('--ink'),'stroke-width':1,'stroke-dasharray':'4 3','data-future':name},svg);
        hover(bar,`<b>${esc(name)} · announced, not yet delivered</b>${num(ft)} chips across ${fs.length} owner${fs.length>1?'s':''}, outside Epoch’s owner snapshot<br>${fs.map(r=>`${esc(r.owner)}: ${num(r.count)} ${esc(r.gpu_type)} · ${esc(r.status)} · ${esc(r.expected)}${r.category==='E'?' (E)':''}<br><span class="small">${esc(r.note)}</span> ${src(r.source_url,'↗')}`).join('<br>')}`);}
      el('text',{x:x(total+ft)+8,y:y+23,class:'ink'},svg).textContent=(total?num(total)+' E':'')+(ft?(total?' + ':'')+num(ft)+' announced':'');
    });
    $('#chipStackLegend').innerHTML=owners.filter(o=>selected.some(r=>r.subject===o)).map(o=>`<span><i style="background:${color(o)}"></i>${esc(o)}</span>`).join('');
    $('#chipStackNote').innerHTML=`E = estimate. Sum of per-owner, per-model median delivered-chip estimates for the covered owners only; not worldwide shipments or an online inventory. Epoch’s cumulative series does not subtract retirements. ${date==='2026-03-31'?'Q1 is incomplete and has no AMD, Trainium or some owner updates here; absent bars mean missing coverage, not zero chips.':'All segments use the same end-2025 reporting date; older TPU generations and the combined H100/H200 category are retained.'} The stack uses only Epoch’s owner model, excluding official-count overlays, host/tenant subsets and future announcements. ${src('https://epoch.ai/data/ai_chip_owners_cumulative_by_chip_type.csv','Source and methodology')}`;
  }
  $('#chipStackFuture')&&($('#chipStackFuture').onchange=draw);$('#chipStackDate').onchange=draw;$('#chipStackGroup').onchange=draw;onTheme(draw);draw();
})();
