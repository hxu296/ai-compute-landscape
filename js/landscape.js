// A reading map: public contracts connect facilities, cloud operators and capacity buyers.
(function(){
  const clouds=new Set(NC.providers.filter(p=>['Hyperscaler','Neocloud'].includes(p.group)).map(p=>p.name));
  const hosts=new Set(NC.providers.filter(p=>p.group==='Host').map(p=>p.name).concat(['GDS','VNET']));
  const buyers=new Set(['OpenAI','Anthropic','Meta','Microsoft','Google','ByteDance / Volcano Engine']);
  const canonical=n=>({'Microsoft':'Microsoft Azure','Google':'Google Cloud','Oracle':'Oracle OCI','Amazon':'AWS'}[n]||n);
  const candidates=NC.contracts.filter(c=>!c.excluded&&['compute','lease'].includes(c.kind));
  const pairs=new Map();
  for(const c of candidates){
    let from,to;
    if(hosts.has(c.supplier)&&clouds.has(canonical(c.buyer))){from='0|'+c.supplier;to='1|'+canonical(c.buyer);}
    else if(clouds.has(c.supplier)&&buyers.has(c.buyer)){from='1|'+c.supplier;to='2|'+c.buyer;}
    else continue;
    const key=from+'→'+to;if(!pairs.has(key))pairs.set(key,{key,from,to,contracts:[]});pairs.get(key).contracts.push(c);
  }
  const edges=[...pairs.values()],nodes=[...new Set(edges.flatMap(e=>[e.from,e.to]))].map(id=>({id,layer:+id[0],name:id.slice(2)}));
  const degree=id=>edges.filter(e=>e.from===id||e.to===id).length;
  const layers=[0,1,2].map(l=>nodes.filter(n=>n.layer===l).sort((a,b)=>degree(b.id)-degree(a.id)||a.name.localeCompare(b.name)));
  const maxRows=Math.max(...layers.map(a=>a.length)),W=1080,H=Math.max(340,64+maxRows*30),left=[8,447,878],width=194;
  layers.forEach(a=>a.forEach((n,i)=>{n.x=left[n.layer];n.y=52+(i+.5)*(H-68)/a.length;}));
  const byId=Object.fromEntries(nodes.map(n=>[n.id,n])),svg=$('#flowSvg');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  ['FACILITY OWNERS','CLOUDS / OPERATORS','CAPACITY BUYERS'].forEach((t,i)=>el('text',{x:left[i]+4,y:20,class:'flow-heading'},svg).textContent=t);
  let selected=null,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true;
  const edgeEls=new Map(),nodeEls=new Map();
  const color=l=>css(l===0?'--s4':l===1?'--s3':'--s1');
  function scope(id){
    if(!id)return new Set(edges.map(e=>e.key));const n=byId[id];let keep=edges.filter(e=>e.from===id||e.to===id);
    if(n.layer===2){const parents=new Set(keep.map(e=>e.from));keep=keep.concat(edges.filter(e=>parents.has(e.to)));}
    if(n.layer===0){const children=new Set(keep.map(e=>e.to));keep=keep.concat(edges.filter(e=>children.has(e.from)));}
    return new Set(keep.map(e=>e.key));
  }
  function highlight(id=selected){
    const keys=scope(id),active=new Set(edges.filter(e=>keys.has(e.key)).flatMap(e=>[e.from,e.to]));
    edgeEls.forEach((g,key)=>{g.style.opacity=keys.has(key)?'1':'.045';g.classList.toggle('flow-active',!!id&&keys.has(key));});
    nodeEls.forEach((g,key)=>{g.style.opacity=active.has(key)?'1':'.3';g.classList.toggle('flow-selected',key===selected);});
  }
  function choose(id){
    selected=id||null;$('#flowFocus').value=selected||'';$('#flowDetails').hidden=!selected;highlight();
    const direct=selected?edges.filter(e=>e.from===selected||e.to===selected).flatMap(e=>e.contracts):[];
    $('#flowMeta').innerHTML=selected?`<b>${esc(byId[selected].name)}</b> · ${direct.length} disclosed agreements with ${degree(selected)} counterparties. Linked upstream or downstream agreements are context; no capacity allocation is inferred.`:`${nodes.length} entities · ${edges.length} relationships · ${edges.reduce((a,e)=>a+e.contracts.length,0)} source-linked agreements. Select a company to inspect its terms and counterparties.`;
    if(selected)table('#flowTable',direct,[{k:'buyer',h:'Buyer'},{k:'supplier',h:'Supplier'},{k:'announced',h:'Announcement'},{k:'value_usd',h:'Disclosed amount',f:c=>(c.value_usd?esc(c.value_relation||'')+' '+money(c.value_usd):'undisclosed')+conflictBadge(c.supplier,'value_usd',c)},{k:'structure',h:'Contract basis'},{k:'source_url',h:'',f:c=>src(c.source_url)}]);
  }
  for(const e of edges){
    const a=byId[e.from],b=byId[e.to],x0=a.x+width,x1=b.x,d=`M${x0},${a.y} C${x0+95},${a.y} ${x1-95},${b.y} ${x1},${b.y}`;
    const g=el('g',{class:'flow-link'},svg);edgeEls.set(e.key,g);
    const line=el('path',{d,fill:'none',stroke:color(a.layer),'stroke-width':1.6,'stroke-opacity':.42},g);
    const hit=el('path',{d,fill:'none',stroke:'transparent','stroke-width':10,tabindex:0,role:'button','aria-label':`${a.name} supplies ${b.name}; ${e.contracts.length} agreements`},g);
    const dot=el('circle',{r:2.2,fill:color(a.layer),class:'flow-particle','pointer-events':'none'},g);
    el('animateMotion',{dur:`${3+(edges.indexOf(e)%4)*.65}s`,begin:`-${edges.indexOf(e)*.27}s`,repeatCount:'indefinite',path:d},dot);
    hover(hit,`<b>${esc(a.name)} → ${esc(b.name)}</b>${e.contracts.length} disclosed agreement${e.contracts.length===1?'':'s'}<br>`+e.contracts.slice(0,4).map(c=>`${esc(c.announced)} · ${c.value_usd?esc(c.value_relation||'')+' '+money(c.value_usd):'price undisclosed'}<br>${esc(c.structure)}`).join('<br>'));
    hit.onpointerenter=()=>highlight(e.to);hit.onpointerleave=()=>highlight();hit.onclick=()=>choose(e.to);
    hit.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose(e.to);}};
  }
  for(const n of nodes){
    const g=el('g',{class:'flow-node',tabindex:0,role:'button','aria-label':n.name+'; select relationships'},svg);nodeEls.set(n.id,g);
    el('rect',{x:n.x,y:n.y-13,width,height:26,rx:3,fill:css('--paper'),stroke:css('--line')},g);
    el('rect',{x:n.x,y:n.y-13,width:3,height:26,fill:color(n.layer)},g);
    el('text',{x:n.x+10,y:n.y+4,class:'flow-name'},g).textContent=n.name;
    el('text',{x:n.x+width-8,y:n.y+4,'text-anchor':'end',class:'flow-degree'},g).textContent=degree(n.id);
    g.onpointerenter=()=>highlight(n.id);g.onpointerleave=()=>highlight();g.onclick=()=>choose(selected===n.id?'':n.id);
    g.onfocus=()=>highlight(n.id);g.onblur=()=>highlight();g.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose(selected===n.id?'':n.id);}};
    const option=document.createElement('option');option.value=n.id;option.textContent=['Facility: ','Cloud: ','Buyer: '][n.layer]+n.name;$('#flowFocus').appendChild(option);
  }
  function motion(){if(playing&&visible)svg.unpauseAnimations();else svg.pauseAnimations();$('#flowMotion').textContent=playing?'Pause motion':'Play motion';$('#flowMotion').setAttribute('aria-pressed',String(playing));}
  $('#flowMotion').onclick=()=>{playing=!playing;motion();};$('#flowFocus').onchange=e=>choose(e.target.value);$('#flowReset').onclick=()=>choose('');
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;motion();}).observe(svg);motion();choose('');
})();

// Capacity can be installed, committed and utilized in different proportions.
(function(){
  const p=PROV['VNET'].latest,on=p.mw_online,comm=p.mw_contracted,used=p.mw_utilized,orders=p.mw_order_wins,build=p.mw_under_construction;
  function draw(){
    const svg=$('#vnetSvg');svg.innerHTML='';svg.setAttribute('viewBox','0 0 900 230');
    const L=30,R=870,y=54,w=v=>v/on.value*(R-L),parts=[{v:used.value,label:'Utilized',color:'--s3',note:'Capacity used by customers.'},{v:comm.value-used.value,label:'Committed, not utilized',color:'--s4',note:'Committed capacity minus utilized capacity; not automatically available for rental.'},{v:on.value-comm.value,label:'Uncommitted',color:'--text-muted',note:'In-service capacity not committed under customer agreements.'}];let x=L;
    el('text',{x:L,y:24,class:'ink','font-size':14},svg).textContent=`${num(on.value)} MW in service · ${on.as_of}`;
    parts.forEach(r=>{const rect=el('rect',{x,y,width:w(r.v),height:40,fill:css(r.color),opacity:.8},svg);hover(rect,`<b>${esc(r.label)}: ${num(r.v)} MW</b>${esc(r.note)}<br>${src(on.source_url)}`);x+=w(r.v);});
    el('text',{x:L+12,y:y+25,fill:'#fff','font-size':14},svg).textContent=`${num(used.value)} MW utilized`;
    el('text',{x:L+w(used.value)+w(comm.value-used.value)/2,y:y+17,'text-anchor':'middle',fill:css('--ink'),'font-size':12},svg).textContent=`${num(comm.value-used.value)} MW`;
    el('text',{x:L+w(used.value)+w(comm.value-used.value)/2,y:y+36,'text-anchor':'middle','font-size':10},svg).textContent='committed, not utilized';
    el('text',{x:R,y:117,'text-anchor':'end','font-size':12},svg).textContent=`${num(on.value-comm.value)} MW uncommitted`;
    el('line',{x1:L,x2:L+w(comm.value),y1:138,y2:138,stroke:css('--s1'),'stroke-width':2},svg);
    el('text',{x:L,y:160,'font-size':13,fill:css('--s1')},svg).textContent=`${num(comm.value)} MW committed within the in-service fleet · ${(100*comm.value/on.value).toFixed(1)}%`;
    el('text',{x:L,y:204,'font-size':13},svg).textContent=`Separate measures: ${orders.value} MW new orders in Jan–Jun 2026 · ${build.value} MW under construction at June 30`;
  }
  $('#vnetNote').innerHTML=`Customer commitments cover ${num(comm.value)} of ${num(on.value)} MW in service; utilized capacity is a subset. New orders are a flow during a period and can cover future delivery. Under-construction capacity is another stock. These figures do not describe metered electricity consumption. ${src(on.source_url,'VNET Q2 filing, operational results and definitions')}${conflictBadge('VNET','mw_contracted')}`;
  onTheme(draw);draw();
})();
