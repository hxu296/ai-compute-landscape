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

