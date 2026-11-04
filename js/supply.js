// Who supplies it: Epoch H100e stacked by chip designer (end-2025), or MW online/contracted per provider.
(function () {
  let mode = "compute",designer="All";
  const DES = [["Nvidia", "--s1"], ["Google", "--s2"], ["Amazon", "--s3"], ["AMD", "--s4"]];
  // Delivered chips (Epoch chip owners, end-2025) plus dated additions at Epoch-tracked frontier sites, by year online.
  const TL=window.DC_TIMELINES,YRS=[['2026','--s5',.9],['2027','--s5',.65],['2028','--s5',.42],['final','--s5',.24]],yLabel=y=>y==='final'?'after 2028':'in '+y;
  // One year's segment: the Epoch-tracked sites that add capacity in that year, with their own increments.
  const yearTip=(name,j,metric,fmt,fromNow=false,from=null,barValue=null)=>{const t=TL?.providers?.[name],[y]=YRS[j],prev=j?YRS[j-1][0]:fromNow&&t?.mw?.now!=null&&(!from||from>=String(TL.retrieved_utc).slice(0,10))?'now':'2025',sites=(t?.sites||[]).map(s=>({n:s.name,v:Math.max(0,(s[metric][y]||0)-(s[metric][prev]||0)),end:s[metric][y]||0})).filter(s=>s.v>0).sort((a,b)=>b.v-a.v);
    const head=j===0&&from&&prev!=='now'?`from ${esc(from)} (the company figure’s date) to end-${y}`:prev==='now'?`in the rest of ${y} (after ${String(TL.retrieved_utc).slice(0,10)})`:yLabel(y);
    return `<b>${esc(name)} · Epoch-tracked, coming online ${head}</b>+${fmt(barValue??sites.reduce((a,s)=>a+s.v,0))} (E)${j===0&&from&&barValue!=null&&CS[name]?.target_end_2026&&barValue<(t.mw[y]-levelAt(t,from))-1?`<br><span class="small">Capped at the company’s own year-end target (${esc(CS[name].target_end_2026.basis)}); Epoch’s remaining ${fmt((t.mw[y]-levelAt(t,from))-barValue)} is shown in 2027.</span>`:''}${j===0&&from&&prev!=='now'?`<br><span class="small muted">Sites listed with their additions during ${y}:</span>`:''}<br>${sites.slice(0,8).map(s=>`${esc(s.n)}: +${fmt(s.v)} → ${fmt(s.end)}`).join('<br>')}${sites.length>8?`<br>…and ${sites.length-8} more`:''}<br><span class="small">Epoch projection from permits, filings and satellite imagery; dates can slip.</span>${src(TL.source_url,'Epoch data-center tracker')}`;};
  function drawCompute(svg) {
    const all=designer==="All",tl=n=>TL?.providers?.[n];
    const names=[...new Set([...NC.providers.filter(p=>Object.keys(p.epoch_designers||{}).length).map(p=>p.name),...(all?Object.keys(TL?.providers||{}).filter(n=>n!=='Undisclosed owner'):[])])];
    const rows = names.map(name=>{const p=NC.providers.find(p=>p.name===name),des=p?.epoch_designers||{},d=Object.fromEntries(Object.entries(des).filter(([k])=>all||k===designer)),base=Object.values(d).reduce((a,b)=>a+b,0),t=tl(name);
        const fut=all&&t?YRS.map(([y],i)=>{const prev=i?YRS[i-1][0]:'2025';return Math.max(0,t.h100e[y]-t.h100e[prev]);}):[0,0,0,0];
        const sitesOnly=!base&&t?t.h100e['2025']:0;
        return {name,d,base,sitesOnly,fut,t,total:base+sitesOnly+fut.reduce((a,b)=>a+b,0)};})
      .filter(r=>r.total>0).sort((a, b) => b.total - a.total);
    const L = 190, R = 700, T = 20, rh = 30, max = Math.max(...rows.map(r => r.total));
    svg.setAttribute("viewBox", `0 0 900 ${T + rows.length * rh + 40}`);
    const x = v => L + (v / max) * (R - L);
    for (let i=0;i<=4;i++) { const v=max*i/4; el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: T + rows.length * rh, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: T + rows.length * rh + 16, "text-anchor": "middle" }, svg).textContent = max>=1e6?`${+(v/1e6).toFixed(1)}M`:num(v); }
    rows.forEach((r, i) => {
      const y = T + i * rh; let acc = 0;
      el("text", { x: L - 10, y: y + 18, "text-anchor": "end", class: "ink" }, svg).textContent = r.name;
      DES.forEach(([k, c]) => { const v = r.d[k] || 0; if (!v) return;
        const b = el("rect", { x: x(acc) + 1, y: y + 7, width: Math.max(1, x(acc + v) - x(acc) - 2), height: 15, rx: 3, fill: css(c) }, svg); acc += v;
        hover(b, `<b>${esc(r.name)}: ${k} chips</b>${num(v)} H100-equivalents (Epoch median, end-2025)<br>${src("https://epoch.ai/data/ai-chip-owners-documentation/methodology","Epoch methodology")}`); });
      acc=r.base;
      if(r.sitesOnly){const b=el("rect",{x:x(0)+1,y:y+7,width:Math.max(1,x(r.sitesOnly)-x(0)-2),height:15,rx:3,fill:"none",stroke:css("--s1"),"stroke-dasharray":"3 2"},svg);acc=r.sitesOnly;
        hover(b,`<b>${esc(r.name)}</b>${num(r.sitesOnly)} H100e at Epoch-tracked sites, end-2025 (sites only, not a whole fleet)`);}
      const tip=()=>`<b>${esc(r.name)}</b>${r.base?`${num(r.base)} H100e delivered by end-2025 (Epoch chip owners)<br>`:''}Coming online at Epoch-tracked sites (E):<br>${YRS.map(([y],j)=>`${yLabel(y)}: +${num(r.fut[j])} H100e`).join('<br>')}<br><span class="small">${(r.t?.sites||[]).slice(0,6).map(s=>esc(s.name)).join(', ')}${(r.t?.sites||[]).length>6?'…':''}</span><br>${src(TL.source_url,'Epoch data-center timelines')}`;
      YRS.forEach(([yr,c,o],j)=>{const v=r.fut[j];if(!v)return;const b=el("rect",{x:x(acc)+1,y:y+7,width:Math.max(1,x(acc+v)-x(acc)-2),height:15,rx:3,fill:css(c),opacity:o,"data-year":yr},svg);hover(b,()=>yearTip(r.name,j,'h100e',v=>num(Math.round(v))+' H100e'));acc+=v;});
      const f=r.fut.reduce((a,b)=>a+b,0),now=r.base||r.sitesOnly;
      el("text", { x: x(r.total) + 6, y: y + 18, class: "ink", "font-family": "JetBrains Mono, monospace", "font-size": 11 }, svg).textContent = (now?`${(now/1e6).toFixed(2)}M`:'')+(f?`${now?' + ':'+'}${(f/1e6).toFixed(2)}M planned`:'');
    });
    $("#supLegend").innerHTML = DES.filter(([k])=>all||k===designer).map(([k, c]) => `<span><i style="background:var(${c})"></i>${k === "Google" ? "Google TPU" : k === "Amazon" ? "Amazon Trainium" : k}</span>`).join("")+(all?`<span><i style="width:28px;background:linear-gradient(90deg,var(--s5) 0 25%,color-mix(in srgb,var(--s5) 70%,white) 25% 50%,color-mix(in srgb,var(--s5) 45%,white) 50% 75%,color-mix(in srgb,var(--s5) 25%,white) 75%)"></i>planned at tracked sites, by year (darker = sooner)</span>`:'');
    $("#supNote").innerHTML = `Solid: Epoch AI "AI chip owners" median cumulative deliveries to 2025-12-31, in H100-equivalents at dense 8-bit performance. Lighter segments: additional H100e scheduled to come online at Epoch-tracked frontier data centers, by year, from <a href="${TL?.source_url}" target="_blank" rel="noopener">Epoch's data-center timelines</a>${TL?` (retrieved ${String(TL.retrieved_utc).slice(0,10)})`:''}. These cover tracked frontier sites only, so whole-fleet additions are larger; projected sites can slip. Owners as Epoch records them (e.g. Oracle owns Stargate Abilene, which Crusoe built). Estimates, not disclosures. Planned additions are shown with "All" designers only. ${src("https://epoch.ai/data/ai-chip-owners-documentation/methodology", "Epoch's chip-owner method")}`;
  }
  // Power, facility MW where Epoch is the source: online (company figure, or Epoch-tracked sites), Epoch-tracked additions by year,
  // then the company's own stated schedule for the rest of its contracted MW; only what no one dates stays "no date disclosed".
  const CS=window.CONTRACT_SCHEDULE?.rows||{},RET=String(TL?.retrieved_utc||'').slice(0,10),day=s=>Date.parse(String(s).slice(0,10)+(String(s).length<=7?'-28':'')+'T00:00:00Z');
  const SCHED=[['2026','rest of 2026',.95],['2027','2027',.75],['by2028','by end-2028',.6],['2028','2028',.5],['2029+','2029 or later',.35]];
  // Epoch facility level at a date: the provider's dated series when present, otherwise the year-end/now levels.
  const levelAt=(t,date)=>{if(!t)return 0;if(t.series?.length){let v=0;for(const[d,mw]of t.series){if(d<=date)v=mw;else break;}return v;}
    if(date>=RET)return t.mw.now??t.mw['2026'];if(date<='2025-12-31')return t.mw['2025'];const f=(day(date)-day('2025-12-31'))/(day(RET)-day('2025-12-31'));return t.mw['2025']+f*((t.mw.now??t.mw['2025'])-t.mw['2025']);};
  // One basis: company IT (and billable) figures are scaled to facility power; gross and connected power count as facility.
  const PUE=window.CONTRACT_SCHEDULE?.it_to_facility||1.3,toFac=(b,fallback)=>{const k=String(b&&b!=='unknown'?b:fallback||'').toLowerCase();return /\bit\b|critical|billable/.test(k)?PUE:1;},basisLabel=(b,fallback)=>b&&b!=='unknown'?b:fallback?fallback+' (schedule basis)':'basis not stated';
  function drawPower(svg) {
    const rows = NC.providers.filter(p => p.latest.mw_online || p.latest.mw_contracted || p.documented_power).map(p => {
      const t=TL?.providers?.[p.name],o=CS[p.name]?.online_override,co=p.latest.mw_online,ct=CS[p.name]&&p.latest.mw_contracted?p.latest.mw_contracted:p.latest.mw_contracted && !["mixed","in-service commitment"].includes(p.latest.mw_contracted.stage) ? p.latest.mw_contracted : null;
      // Online: a reviewed correction, the company's own figure, or Epoch's facility level today at the documented sites.
      const rb=CS[p.name]?.power_basis,on=o?{raw:o.mw,f:toFac(o.power_basis,rb),pb:o.power_basis,as_of:o.as_of,source_url:o.source_url,basis:o.basis,grade:o.grade,kind:'corrected'}:co?{raw:co.value,f:toFac(co.power_basis,rb),pb:basisLabel(co.power_basis,rb),as_of:co.as_of,source_url:co.source_url,cell:co,kind:'company'}:p.documented_power&&t?{raw:t.mw.now,f:1,as_of:RET,kind:'epoch',doc:p.documented_power}:p.documented_power?{raw:p.documented_power.value,f:PUE,as_of:p.documented_power.as_of,kind:'sites',doc:p.documented_power}:null;
      if(on)on.value=on.raw*on.f;
      const fct=ct?toFac(ct.power_basis,rb):1,fs=toFac(rb,null),ctv=ct?ct.value*fct:0;
      const from=on?String(on.as_of).slice(0,10):RET,epoch=t?YRS.map(([y],j)=>Math.max(0,t.mw[y]-(j?t.mw[YRS[j-1][0]]:Math.max(levelAt(t,from),0)))):[0,0,0,0];
      // A company's own year-end target caps Epoch's 2026 additions on top of its online figure (both in facility power).
      const tg=CS[p.name]?.target_end_2026;if(tg&&on&&on.kind!=='epoch'){const cap=tg.mw*toFac(tg.power_basis,rb)-on.value;if(cap>=0&&epoch[0]>cap){epoch[1]+=epoch[0]-cap;epoch[0]=cap;}}
      let sch=ct&&CS[p.name]?SCHED.map(([k])=>(CS[p.name].segments?.[k]?.mw||0)*fs):SCHED.map(()=>0);
      // Where the company's stated target or backlog already includes its Epoch-tracked sites, take those out of the stated phases (earliest first).
      if(CS[p.name]?.includes_epoch==='same_year'){const yi={'2026':0,'2027':1,'2028':2};sch=sch.map((v,j)=>{const e=yi[SCHED[j][0]];return e==null?v:Math.max(0,v-epoch[e]);});}
      else if(CS[p.name]?.includes_epoch){let over=epoch.reduce((a,b)=>a+b,0);sch=sch.map(v=>{const c=Math.min(v,over);over-=c;return v-c;});}
      const known=(on?on.value:0)+epoch.reduce((a,b)=>a+b,0)+sch.reduce((a,b)=>a+b,0),undated=ct?Math.max(0,ctv-known):0;
      return {name:p.name,group:p.group,t,on,ct,ctv,fct,fs,rb,from,epoch,sch,undated,inserviceCommitted:p.latest.mw_contracted?.stage==="in-service commitment"?p.latest.mw_contracted:null,pipe:p.latest.mw_pipeline,
        end:Math.max(ctv,known)};})
      .filter(r => r.on || r.ct).sort((a, b) => b.end - a.end);
    const L = 205, R = 640, T = 20, rh = 26, max = Math.max(...rows.map(r=>r.end));
    svg.setAttribute("viewBox", `0 0 900 ${T + rows.length * rh + 40}`);
    const x = v => L + (v / max) * (R - L);
    for (let v = 0; v <= max; v += 1000) { el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: T + rows.length * rh, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: T + rows.length * rh + 16, "text-anchor": "middle" }, svg).textContent = `${v / 1000} GW`; }
    rows.forEach((r, i) => {
      const y = T + i * rh;
      markConflict(svg,r.name,"mw_online",L-193,y+15);
      el("text", { x: L - 10, y: y + 15, "text-anchor": "end", class: "ink" }, svg).textContent = r.name;
      const onTip=()=>{const o=r.on;const conv=o.f!==1?`<br><span class="small">≈${num(Math.round(o.value))} MW facility power at ×${PUE} (company figure is ${esc(o.pb||'IT')} power).</span>`:'';
        if(o.kind==='corrected')return`<b>${esc(r.name)} · online (corrected)</b>${num(o.raw)} MW ${esc(o.pb||'')} · ${esc(o.as_of)} · grade ${esc(o.grade)}${conv}<br><span class="muted">${esc(o.basis)}</span><br>${src(o.source_url)}`;
        if(o.kind==='company')return`<b>${esc(r.name)} · online (company figure)</b>${cell(o.cell,"mw")} · ${esc(o.pb)}${conv}`+(r.inserviceCommitted?`<br>Within the in-service fleet: ${cell(r.inserviceCommitted,"mw")} customer-committed (subset)`:'');
        const d=o.doc;return`<b>${esc(r.name)} · Epoch-tracked sites online today</b>${num(Math.round(o.value))} MW facility power at ${esc(RET)} (E), not the whole fleet${d?.sites?`<br><span class="small">Documented sites (IT power, latest observation): ${d.sites.slice(0,8).map(s=>`${esc(s.site)} ${num(s.value)} MW (${ym(s.as_of)})`).join(' · ')}${d.sites.length>8?' …':''}</span>`:''}<br>${src(TL.source_url,'Epoch data-center tracker')}`;};
      const schTip=(k,drawn)=>{const g=CS[r.name]?.segments?.[k],lab=SCHED.find(s=>s[0]===k)[1];return`<b>${esc(r.name)} · company-stated, in service ${esc(lab)}</b>+${num(Math.round(drawn))} MW facility (E)${Math.abs(drawn-g.mw)>1?`<br><span class="small muted">Company figure ${num(Math.round(g.mw))} MW ${esc(r.rb||'')}${r.fs!==1?` × ${PUE} to facility`:''}${CS[r.name]?.includes_epoch?', less capacity already in the Epoch-tracked segments':''}.</span>`:''}<br>${g.items.map(it=>`${num(Math.round(it.mw))} MW · ${esc(it.basis)}${it.grade?` · grade ${esc(it.grade)}`:''} ${it.source_url?src(it.source_url,'↗'):''}`).join('<br>')}<br><span class="small">Contracted capacity outside Epoch-tracked sites. Landlord and tenant rows can overlap (e.g. Fluidstack MW inside TeraWulf, Hut 8 and Cipher).</span>`;};
      const undTip=()=>`<b>${esc(r.name)} · contracted, no date disclosed</b>≈${num(Math.round(r.undated))} MW facility of ${cell(r.ct,"mw")}${r.fct!==1?` (×${PUE} to facility)`:''}<br><span class="small">Contracted total minus online, Epoch-tracked additions and company-stated phases.${CS[r.name]?.notes?' '+esc(CS[r.name].notes.slice(0,300))+'…':''}</span>`+(r.pipe?`<br>Pipeline (not contracted): ${cell(r.pipe,"mw")}`:'');
      let acc=0;
      if (r.on) { hover(el("rect", { x: L, y: y + 4, width: Math.max(2, x(r.on.value) - L), height: 16, rx: 3, fill: css("--s1"), opacity: r.on.kind==='company'||r.on.kind==='corrected'?1:.6, "data-seg":"online" }, svg), onTip); acc=r.on.value; }
      r.epoch.forEach((v,j)=>{if(!v)return;const [yr,c,o]=YRS[j];hover(el("rect",{x:x(acc),y:y+4,width:Math.max(1,x(acc+v)-x(acc)),height:16,fill:css(c),opacity:o,"data-year":yr},svg),()=>yearTip(r.name,j,'mw',v=>num(Math.round(v))+' MW',true,r.on&&r.on.kind!=='epoch'?r.from:null,v));acc+=v;});
      r.sch.forEach((v,j)=>{if(!v)return;const [k,,o]=SCHED[j];hover(el("rect",{x:x(acc),y:y+4,width:Math.max(1,x(acc+v)-x(acc)),height:16,fill:css("--s2"),opacity:o,"data-sched":k},svg),()=>schTip(k,v));acc+=v;});
      if(r.undated>0){hover(el("rect",{x:x(acc),y:y+5,width:Math.max(1,x(acc+r.undated)-x(acc)),height:14,rx:2,fill:"none",stroke:css("--s2"),"stroke-dasharray":"3 2","data-sched":"undated"},svg),undTip);acc+=r.undated;}
      const plannedE=r.epoch.reduce((a,b)=>a+b,0),plannedC=r.sch.reduce((a,b)=>a+b,0);
      el("text", { x: x(r.end) + 6, y: y + 16 }, svg).textContent = r.inserviceCommitted ? `${num(r.on.value)} MW · in service` :
        `${r.on?num(Math.round(r.on.value)):'?'}${r.ct?` / ${num(Math.round(r.ctv))}`:''} MW`+(plannedE+plannedC?` · +${num(Math.round(plannedE+plannedC))} dated`:'')+(r.undated>0?` · ${num(Math.round(r.undated))} undated`:'')+(r.on&&r.on.kind==='epoch'?' · tracked sites':'');
    });
    $("#supLegend").innerHTML = `<span><i style="background:var(--s1)"></i>online now (lighter: tracked sites only)</span><span><i style="width:28px;background:linear-gradient(90deg,var(--s5) 0 25%,color-mix(in srgb,var(--s5) 70%,white) 25% 50%,color-mix(in srgb,var(--s5) 45%,white) 50% 75%,color-mix(in srgb,var(--s5) 25%,white) 75%)"></i>coming online at tracked sites (darker = sooner)</span><span><i style="width:28px;background:linear-gradient(90deg,var(--s2) 0 25%,color-mix(in srgb,var(--s2) 70%,white) 25% 50%,color-mix(in srgb,var(--s2) 45%,white) 50% 75%,color-mix(in srgb,var(--s2) 25%,white) 75%)"></i>company-stated schedule (darker = sooner)</span><span><i style="border:1px dashed var(--s2)"></i>no date disclosed</span>`;
    $("#supNote").innerHTML = `Each bar adds, left to right: power online today; capacity Epoch’s tracker schedules at the company’s own sites (facility MW, E), counted from the date of the company’s online figure; then the company’s own stated in-service schedule for the rest of its contracted MW (filings, calls and decks, graded in the hover); and only what nobody dates as “no date disclosed”. Everything is in facility power: company figures stated as IT (or billable) power are scaled by ×${PUE} (Epoch’s implied ratio at Colossus is 1.25–1.35); gross and connected power count as facility; hover any segment for the company’s own figure and basis. Hyperscaler rows use Epoch’s facility power at their tracked sites, which is not their whole fleet. Landlord and tenant rows overlap. Cipher’s online figure excludes its bitcoin-mining load; Fluidstack and DayOne use their latest in-service figures. ${src("https://epoch.ai/data/ai-data-centers","Epoch data and coverage")}`;
  }
  function draw() { const svg = $("#supSvg"); svg.innerHTML = ""; if(mode==="compute")drawCompute(svg);else drawPower(svg);
    $("#supDesignerCtl").hidden=mode!=="compute";
    $("#supCompute").classList.toggle("on", mode === "compute"); $("#supPower").classList.toggle("on", mode === "power"); }
  $("#supCompute").onclick = () => { mode = "compute"; draw(); }; $("#supPower").onclick = () => { mode = "power"; draw(); };
  $("#supDesigner").onchange=()=>{designer=$("#supDesigner").value;draw();};
  onTheme(draw); draw();
  const family = c => /^(MI|Instinct MI)/.test(c) ? "AMD" : /^TPU/.test(c) ? "Google TPU" : /^Trainium/.test(c) ? "AWS Trainium" : /^Ascend/.test(c) ? "Huawei" : "NVIDIA";
  let chipFamily="All";
  function chipTable(){
    $("#chipCtl").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.textContent===chipFamily));
    const rows=NC.native_chips.filter(r=>chipFamily==="All"||family(r.gpu_type)===chipFamily).sort((a,b)=>family(a.gpu_type).localeCompare(family(b.gpu_type))||b.value-a.value);
    table("#nativeChips",rows,[{k:"subject",h:"Provider / owner"},{k:"gpu_type",h:"Accelerator"},{k:"value",h:"Native count",f:r=>esc(r.value_relation||"")+" "+num(r.value)+badge(r.confidence)+conflictBadge(r.subject,"gpus_by_type")},{k:"as_of",h:"As of"},{k:"status",h:"Scope / status",f:r=>esc(r.note||r.status)},{k:"source_url",h:"",f:r=>src(r.source_url)}]);
  }
  ["All","NVIDIA","AMD","Google TPU","AWS Trainium","Huawei"].forEach(n=>{const b=document.createElement("button");b.textContent=n;b.onclick=()=>{chipFamily=n;chipTable();};$("#chipCtl").appendChild(b);});chipTable();
})();
