// Who supplies it: Epoch H100e stacked by chip designer (end-2025), or MW online/contracted per provider.
(function () {
  let mode = "compute",designer="All";
  const DES = [["Nvidia", "--s1"], ["Google", "--s2"], ["Amazon", "--s3"], ["AMD", "--s4"]];
  // Delivered chips (Epoch chip owners, end-2025) plus dated additions at Epoch-tracked frontier sites, by year online.
  const TL=window.DC_TIMELINES,YRS=[['2026','--s5',.9],['2027','--s5',.65],['2028','--s5',.42],['final','--s5',.24]],yLabel=y=>y==='final'?'after 2028':'in '+y;
  function drawCompute(svg) {
    const all=designer==="All",tl=n=>TL?.providers?.[n];
    const names=[...new Set([...NC.providers.filter(p=>Object.keys(p.epoch_designers||{}).length).map(p=>p.name),...(all?Object.keys(TL?.providers||{}):[])])];
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
      YRS.forEach(([yr,c,o],j)=>{const v=r.fut[j];if(!v)return;const b=el("rect",{x:x(acc)+1,y:y+7,width:Math.max(1,x(acc+v)-x(acc)-2),height:15,rx:3,fill:css(c),opacity:o,"data-year":yr},svg);hover(b,tip);acc+=v;});
      const f=r.fut.reduce((a,b)=>a+b,0),now=r.base||r.sitesOnly;
      el("text", { x: x(r.total) + 6, y: y + 18, class: "ink", "font-family": "JetBrains Mono, monospace", "font-size": 11 }, svg).textContent = (now?`${(now/1e6).toFixed(2)}M`:'')+(f?`${now?' + ':'+'}${(f/1e6).toFixed(2)}M planned`:'');
    });
    $("#supLegend").innerHTML = DES.filter(([k])=>all||k===designer).map(([k, c]) => `<span><i style="background:var(${c})"></i>${k === "Google" ? "Google TPU" : k === "Amazon" ? "Amazon Trainium" : k}</span>`).join("")+(all?YRS.map(([y,c,o])=>`<span><i style="background:var(${c});opacity:${o}"></i>online ${yLabel(y)} (E)</span>`).join('')+`<span><i style="border:1px dashed var(--s1)"></i>tracked sites only, end-2025</span>`:'');
    $("#supNote").innerHTML = `Solid: Epoch AI "AI chip owners" median cumulative deliveries to 2025-12-31, in H100-equivalents at dense 8-bit performance. Lighter segments: additional H100e scheduled to come online at Epoch-tracked frontier data centers, by year, from <a href="${TL?.source_url}" target="_blank" rel="noopener">Epoch's data-center timelines</a>${TL?` (retrieved ${String(TL.retrieved_utc).slice(0,10)})`:''}. These cover tracked frontier sites only, so whole-fleet additions are larger; projected sites can slip. Owners as Epoch records them (e.g. Oracle owns Stargate Abilene, which Crusoe built). Estimates, not disclosures. Planned additions are shown with "All" designers only. ${src("https://epoch.ai/data/ai-chip-owners-documentation/methodology", "Epoch's chip-owner method")}`;
  }
  // gpu=true converts each MW value into the Blackwell-class GPUs it could power (estimate, not owned chips).
  const KW_PER_GPU=2.12,DEFAULT_H100E_PER_MW=1000/KW_PER_GPU*2.526528549772612;
  function drawPower(svg,gpu=false) {
    const k=r=>{if(!gpu)return 1;const t=TL?.providers?.[r.name];return t&&t.mw.final>0&&t.h100e.final>0?t.h100e.final/t.mw.final:DEFAULT_H100E_PER_MW;},amt=(v,r)=>gpu?num(Math.round(v*k(r)/1000)*1000):num(v),unit=gpu?'H100e':'MW';
    const rows = NC.providers.filter(p => p.latest.mw_online || p.latest.mw_contracted || p.documented_power).map(p => ({
      name: p.name, group: p.group, on: p.latest.mw_online || p.documented_power, partial: !p.latest.mw_online && !!p.documented_power, ct: p.latest.mw_contracted && !["mixed","in-service commitment"].includes(p.latest.mw_contracted.stage) ? p.latest.mw_contracted : null, inserviceCommitted: p.latest.mw_contracted?.stage === "in-service commitment" ? p.latest.mw_contracted : null,
      mixed: p.latest.mw_contracted && p.latest.mw_contracted.stage === "mixed" ? p.latest.mw_contracted : null, pipe: p.latest.mw_pipeline }))
      .filter(r => r.on || r.ct).sort((a, b) => (b.partial ? 1 : 0) - (a.partial ? 1 : 0) || ((b.ct || b.on || {}).value || 0) - ((a.ct || a.on || {}).value || 0));
    const L = 205, R = 640, T = 20, rh = 26, add=r=>{const t=TL?.providers?.[r.name];return t?YRS.map(([y],j)=>Math.max(0,t.mw[y]-t.mw[j?YRS[j-1][0]:'2025'])):[0,0,0,0];},max = Math.max(...rows.map(r => k(r)* Math.max(r.on ? r.on.value : 0, r.ct ? r.ct.value : 0, (r.on?r.on.value:0)+add(r).reduce((a,b)=>a+b,0))));
    svg.setAttribute("viewBox", `0 0 900 ${T + rows.length * rh + 40}`);
    const x = v => L + (v / max) * (R - L);
    const step=gpu?(max>4e6?2e6:500000):1000;
    for (let v = 0; v <= max; v += step) { el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: T + rows.length * rh, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: T + rows.length * rh + 16, "text-anchor": "middle" }, svg).textContent = gpu?`${v/1e6}M`:`${v / 1000} GW`; }
    rows.forEach((r, i) => {
      const y = T + i * rh;
      markConflict(svg,r.name,"mw_online",L-193,y+15);
      el("text", { x: L - 10, y: y + 15, "text-anchor": "end", class: "ink" }, svg).textContent = r.name;
      const tipHtml = () => `<b>${esc(r.name)}</b> (${r.group})<br>Online: ${r.on ? cell(r.on, "mw") : "not disclosed"}<br>Total contracted: ${r.ct ? cell(r.ct, "mw") : "not disclosed"}` + (r.inserviceCommitted ? `<br>Within the in-service fleet: ${cell(r.inserviceCommitted,"mw")} customer-committed (subset, not a total including future capacity)` : "") +
        (r.partial ? `<br><b>Incomplete AI-site subtotal, ${r.on.n_sites} sites; not total fleet</b><br>${r.on.sites.map(s=>`${esc(s.site)}: ${num(s.value)} MW (${ym(s.as_of)})`).join("<br>")}` : "") + (r.pipe ? `<br>Pipeline (not contracted): ${cell(r.pipe, "mw")}` : "")+(add(r).some(v=>v)?`<br><b>Epoch-tracked sites coming online (facility MW, E):</b> ${YRS.map(([y],j)=>`${yLabel(y)} +${num(Math.round(add(r)[j]))}`).join(' · ')}${r.ct?`<br>Contracted beyond online and tracked sites: ${num(Math.max(0,Math.round(r.ct.value-(r.on?r.on.value:0)-add(r).reduce((a,b)=>a+b,0))))} MW, timing not disclosed`:''}`:(r.ct?`<br>Contracted beyond online: timing not disclosed`:''))+(gpu?`<br><b>Power-implied H100e (E):</b> ${r.on?'≈'+amt(r.on.value,r)+' online':''}${r.on&&r.ct?' · ':''}${r.ct?'≈'+amt(r.ct.value,r)+' contracted':''} at ${(k(r)).toFixed(0)} H100e per MW (${TL?.providers?.[r.name]?'this provider’s Epoch-tracked sites':'GB300 default: '+KW_PER_GPU+' kW all-in per GPU'}). Compute the power could support, not chips the company owns.`:"");
      if (r.ct) hover(el("rect", { x: L, y: y + 4, width: Math.max(2, x(k(r)*r.ct.value) - L), height: 16, rx: 4, fill: css("--s2"), opacity: 0.45 }, svg), tipHtml);
      {let acc=r.on?r.on.value:0;add(r).forEach((v,j)=>{if(!v)return;const [yr,c,o]=YRS[j];hover(el("rect",{x:x(k(r)*acc),y:y+4,width:Math.max(1,x(k(r)*(acc+v))-x(k(r)*acc)),height:16,rx:2,fill:css(c),opacity:o,"data-year":yr},svg),tipHtml);acc+=v;});}
      if (r.on) hover(el("rect", { x: L, y: y + 8, width: Math.max(2, x(k(r)*r.on.value) - L), height: 8, rx: 3, fill: r.partial ? css("--s4") : css("--s1"), opacity:r.partial?.75:1, stroke:r.partial?css("--s4"):"none","stroke-dasharray":r.partial?"4 2":"" }, svg), tipHtml);
      el("text", { x: x(k(r)*Math.max(r.on ? r.on.value : 0, r.ct ? r.ct.value : 0, (r.on?r.on.value:0)+add(r).reduce((a,b)=>a+b,0))) + 6, y: y + 16 }, svg).textContent =
        r.inserviceCommitted ? `${amt(r.on.value,r)} ${unit} · in service${gpu?' E':''}` : r.partial ? `${amt(r.on.value,r)} ${unit} · sites only${gpu?' E':''}`+(add(r).some(v=>v)?` · +${amt(add(r).reduce((a,b)=>a+b,0),r)} planned`:'') : `${r.on ? amt(r.on.value,r) : "?"} / ${r.ct ? amt(r.ct.value,r) : "?"} ${unit}${gpu?' E':''}`+(add(r).some(v=>v)?` · +${amt(add(r).reduce((a,b)=>a+b,0),r)} planned`:'');
    });
    if(gpu){$("#supLegend").innerHTML = `<span><i style="background:var(--s1)"></i>H100e supportable by online power (E)</span><span><i style="background:var(--s2);opacity:.45"></i>by total contracted power (E)</span><span><i style="background:var(--s4)"></i>documented AI sites only (incomplete)</span>`+YRS.map(([y,c,o])=>`<span><i style="background:var(${c});opacity:${o}"></i>Epoch-tracked, online ${yLabel(y)}</span>`).join('');
      $("#supNote").innerHTML = `Estimates (E): each provider's online and total contracted MW × H100e per MW. Providers with Epoch-tracked sites use their own sites' ratio (for example AWS ≈750 with Trainium, Oracle ≈2,000 with Rubin-class plans); others use a GB300 default of ${DEFAULT_H100E_PER_MW.toFixed(0)} (2.12 kW all-in per GPU, SemiAnalysis; 2.53 H100e per GPU, Epoch). Contracted includes capacity not yet built. For hosts such as Crusoe, Applied Digital or Core Scientific these are GPUs in their buildings, owned by tenants (for example Oracle/OpenAI at Abilene), not by the host. Older Hopper fleets draw less per GPU, so this understates their counts; company MW bases differ (IT, gross or billable). Not added to Epoch's H100-equivalents.`;return;}
    $("#supLegend").innerHTML = `<span><i style="background:var(--s1)"></i>company online</span><span><i style="background:var(--s2);opacity:.45"></i>company contracted</span><span><i style="background:var(--s4)"></i>documented AI sites only (incomplete)</span>`+YRS.map(([y,c,o])=>`<span><i style="background:var(${c});opacity:${o}"></i>Epoch-tracked, online ${yLabel(y)}</span>`).join('');
    $("#supNote").innerHTML = `Year segments: facility power scheduled to come online at Epoch-tracked frontier sites (E), starting from the company's online figure; the rest of a contracted total has no disclosed timing. Site subtotals use the latest dated IT-power observation per documented site and exclude future projections. Epoch records are estimates; IREN’s Horizon 1 is a reported site phase. Company figures can use IT, gross or billable power (hover for basis). VNET’s bar shows only in-service capacity; its customer-committed subset is described in the tooltip and is excluded from the total-contracted series. Planned additions and utility contracts are not online fleet capacity. ${src("https://epoch.ai/data/ai-data-centers","Epoch data and coverage")}`;
  }
  function draw() { const svg = $("#supSvg"); svg.innerHTML = ""; if(mode==="compute")drawCompute(svg);else drawPower(svg,mode==="gpus");
    $("#supDesignerCtl").hidden=mode!=="compute";
    $("#supCompute").classList.toggle("on", mode === "compute"); $("#supPower").classList.toggle("on", mode === "power"); $("#supGpus")?.classList.toggle("on", mode === "gpus"); }
  $("#supCompute").onclick = () => { mode = "compute"; draw(); }; $("#supPower").onclick = () => { mode = "power"; draw(); }; const gpuBtn=$("#supGpus");if(gpuBtn)gpuBtn.onclick = () => { mode = "gpus"; draw(); };
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
