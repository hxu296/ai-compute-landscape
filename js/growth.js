// Shared coordinates for scale and relative growth; observations are never interpolated.
(function () {
  const METRICS = [["revenue_usd", "Quarterly revenue"], ["mw_online", "MW online"], ["backlog_usd", "Backlog"]];
  let metric = "revenue_usd", mode = "absolute";
  // Start with a readable handful: the three big clouds, Oracle and the two largest neoclouds; the rest are one click away.
  const START=['AWS','Microsoft Azure','Google Cloud','Oracle OCI','CoreWeave','Nebius'],selected = new Set(Object.keys(NC.growth).filter(n=>START.includes(n)));
  if(!selected.size)Object.keys(NC.growth).forEach(n=>selected.add(n));
  const ctl = $("#growthCtl");
  METRICS.forEach(([k,l])=>{const b=document.createElement("button");b.textContent=l;b.dataset.k=k;b.onclick=()=>{metric=k;draw();};ctl.appendChild(b);});
  function draw() {
    ctl.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.k===metric));
    $("#growthAbs").classList.toggle("on",mode==="absolute");$("#growthIdx").classList.toggle("on",mode==="index");
    const names=Object.keys(NC.growth).filter(n=>(NC.growth[n][metric]||[]).length);
    const colors=Object.fromEntries(names.map((n,i)=>[n,SER[i%8]]));
    $("#growthCompanies").innerHTML=names.map(n=>`<label><input type="checkbox" value="${esc(n)}" ${selected.has(n)?"checked":""}><i style="background:var(${colors[n]})"></i>${esc(n)}</label>`).join("");
    $("#growthCompanies").querySelectorAll("input").forEach(e=>e.onchange=()=>{e.checked?selected.add(e.value):selected.delete(e.value);draw();});
    const subs=names.filter(n=>selected.has(n)).map(n=>{
      let pts=NC.growth[n][metric].filter(p=>p[0]>="2024-01-01" && p[1]>=0), base=null;
      if(mode==="index"){
        base=pts.find(p=>p[0]>="2025-05-31" && p[0]<="2025-06-30" && p[1]>0);
        pts=base?pts.filter(p=>p[0]>=base[0]):[];
      }
      return {n,pts,base,c:colors[n]};
    }).filter(s=>s.pts.length);
    const sparse=subs.filter(s=>s.pts.length===1).map(s=>s.n);
    $("#growthNote").textContent=`Each line retains one reporting scope and power basis. ${sparse.length?'Single observations (no trend line): '+sparse.join(', ')+'. ':''}${mode==='index'?'Companies without a positive Q2 2025 baseline are omitted.':''}`;
    const svg=$("#growthSvg");svg.innerHTML="";
    if(!subs.length){el("text",{x:60,y:50},svg).textContent="Choose companies with observations in this period.";$("#growthSummary").innerHTML="";$("#growthLegend").innerHTML="";return;}
    const all=subs.flatMap(s=>s.pts),t0=Math.min(...all.map(p=>Date.parse(p[0]))),t1=Math.max(...all.map(p=>Date.parse(p[0])));
    const value=(s,p)=>mode==="index"?p[1]/s.base[1]*100:p[1];
    const max=Math.max(1,...subs.flatMap(s=>s.pts.map(p=>value(s,p))))*1.08;
    const x=d=>76+(Date.parse(d)-t0)/(t1-t0||1)*770,y=v=>350-v/max*320;
    const fmt=v=>mode==="index"?`${Math.round(v)}`:metric==="mw_online"?`${num(v)} MW`:money(v);
    for(let i=0;i<=4;i++){const v=max*i/4;el("line",{x1:76,x2:846,y1:y(v),y2:y(v),stroke:css("--grid")},svg);el("text",{x:68,y:y(v)+4,"text-anchor":"end"},svg).textContent=fmt(v);}
    el("text",{x:76,y:16,"font-size":11},svg).textContent=mode==="index"?"Q2 2025 observation = 100":metric==="mw_online"?"MW online · hover for power basis":metric==="revenue_usd"?"USD per quarter":"USD · backlog balance";
    for(let yr=new Date(t0).getUTCFullYear();yr<=new Date(t1).getUTCFullYear();yr++)for(const mo of ["01","07"]){const d=`${yr}-${mo}-01`;if(Date.parse(d)>=t0&&Date.parse(d)<=t1)el("text",{x:x(d),y:374,"text-anchor":"middle"},svg).textContent=`${yr}-${mo}`;}
    subs.forEach((s,i)=>{
      el("path",{d:s.pts.map((p,j)=>`${j?"L":"M"}${x(p[0])},${y(value(s,p))}`).join(""),fill:"none",stroke:css(s.c),"stroke-width":2.6,"stroke-dasharray":i>=8?"6 3":""},svg);
      s.pts.forEach(p=>{const c=el("circle",{cx:x(p[0]),cy:y(value(s,p)),r:4,fill:p[2]==="reported"?css(s.c):css("--surface-1"),stroke:css(s.c),"stroke-width":1.7},svg);
        hover(c,`<b>${esc(s.n)}</b>${p[0]} · ${metric==="mw_online"?num(p[1])+" MW":money(p[1])}${badge(p[2])}<br>${esc(p[4]||"company")}${p[6]?' · '+esc(p[6])+' power':''}<br>${esc(p[7]||'')}${mode==="index"?`<br>Index ${value(s,p).toFixed(1)}; base ${s.base[0]}`:""}<br>${src(p[3])}`);});
    });
    $("#growthLegend").innerHTML="";
    const rows=subs.map(s=>{const a=s.pts[0],b=s.pts.at(-1);return {name:s.n,start:a[0],first:a[1],end:b[0],last:b[1],mult:s.pts.length>1&&a[1]>0?b[1]/a[1]:null,scope:[b[4]||"company",b[6]].filter(Boolean).join(' · '),source_url:b[3]};});
    table("#growthSummary",rows,[{k:"name",h:"Company"},{k:"start",h:"First date"},{k:"first",h:"First",f:r=>metric==="mw_online"?num(r.first):money(r.first)},{k:"end",h:"Latest date"},{k:"last",h:"Latest",f:r=>metric==="mw_online"?num(r.last):money(r.last)},{k:"mult",h:"Multiple",f:r=>r.mult==null?'—':r.mult.toFixed(2)+"×"},{k:"scope",h:"Reporting scope"},{k:"source_url",h:"",f:r=>src(r.source_url)}]);
  }
  $("#growthAbs").onclick=()=>{mode="absolute";draw();};$("#growthIdx").onclick=()=>{mode="index";draw();};
  $("#growthAll").onclick=()=>{Object.keys(NC.growth).forEach(n=>selected.add(n));draw();};
  $("#growthNone").onclick=()=>{selected.clear();draw();};
  onTheme(draw);draw();
})();
