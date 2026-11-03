// Who supplies it: Epoch H100e stacked by chip designer (end-2025), or MW online/contracted per provider.
(function () {
  let mode = "compute",designer="All";
  const DES = [["Nvidia", "--s1"], ["Google", "--s2"], ["Amazon", "--s3"], ["AMD", "--s4"]];
  function drawCompute(svg) {
    const rows = NC.providers.filter(p => Object.keys(p.epoch_designers || {}).length)
      .map(p => ({ name: p.name, d: Object.fromEntries(Object.entries(p.epoch_designers).filter(([k])=>designer==="All"||k===designer)), total: Object.entries(p.epoch_designers).filter(([k])=>designer==="All"||k===designer).reduce((a, [,b]) => a + b, 0) })).filter(r=>r.total>0).sort((a, b) => b.total - a.total);
    const L = 150, R = 820, T = 20, rh = 36, max = Math.max(...rows.map(r => r.total));
    svg.setAttribute("viewBox", `0 0 900 ${T + rows.length * rh + 40}`);
    const x = v => L + (v / max) * (R - L);
    for (let i=0;i<=4;i++) { const v=max*i/4; el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: T + rows.length * rh, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: T + rows.length * rh + 16, "text-anchor": "middle" }, svg).textContent = max>=1e6?`${+(v/1e6).toFixed(2)}M`:num(v); }
    rows.forEach((r, i) => {
      const y = T + i * rh; let acc = 0;
      el("text", { x: L - 10, y: y + 21, "text-anchor": "end", class: "ink" }, svg).textContent = r.name;
      DES.forEach(([k, c]) => { const v = r.d[k] || 0; if (!v) return;
        const b = el("rect", { x: x(acc) + 1, y: y + 9, width: Math.max(1, x(acc + v) - x(acc) - 2), height: 16, rx: 3, fill: css(c) }, svg); acc += v;
        hover(b, `<b>${esc(r.name)}: ${k} chips</b>${num(v)} H100-equivalents (Epoch median, end-2025)<br>${src("https://epoch.ai/data/ai-chip-owners-documentation/methodology","Epoch methodology")}`); });
      const other = r.total - DES.reduce((a, [k]) => a + (r.d[k] || 0), 0);
      el("text", { x: x(r.total) + 6, y: y + 21, class: "ink", "font-family": "JetBrains Mono, monospace", "font-size": 11.5 }, svg).textContent = `${(r.total / 1e6).toFixed(2)}M` + (other > 1000 ? " (incl. other)" : "");
    });
    $("#supLegend").innerHTML = DES.filter(([k])=>designer==="All"||k===designer).map(([k, c]) => `<span><i style="background:var(${c})"></i>${k === "Google" ? "Google TPU" : k === "Amazon" ? "Amazon Trainium" : k}</span>`).join("");
    $("#supNote").innerHTML = `Epoch AI "AI chip owners" estimate: median cumulative deliveries to 2025-12-31, in H100-equivalents at dense 8-bit
      performance. An estimate, not a disclosure, and never added to our own totals. ${src("https://epoch.ai/data/ai-chip-owners-documentation/methodology", "Epoch's method")}`;
  }
  function drawPower(svg) {
    const rows = NC.providers.filter(p => p.latest.mw_online || p.latest.mw_contracted || p.documented_power).map(p => ({
      name: p.name, group: p.group, on: p.latest.mw_online || p.documented_power, partial: !p.latest.mw_online && !!p.documented_power, ct: p.latest.mw_contracted && !["mixed","in-service commitment"].includes(p.latest.mw_contracted.stage) ? p.latest.mw_contracted : null, inserviceCommitted: p.latest.mw_contracted?.stage === "in-service commitment" ? p.latest.mw_contracted : null,
      mixed: p.latest.mw_contracted && p.latest.mw_contracted.stage === "mixed" ? p.latest.mw_contracted : null, pipe: p.latest.mw_pipeline }))
      .filter(r => r.on || r.ct).sort((a, b) => (b.partial ? 1 : 0) - (a.partial ? 1 : 0) || ((b.ct || b.on || {}).value || 0) - ((a.ct || a.on || {}).value || 0));
    const L = 205, R = 710, T = 20, rh = 26, max = Math.max(...rows.map(r => Math.max(r.on ? r.on.value : 0, r.ct ? r.ct.value : 0)));
    svg.setAttribute("viewBox", `0 0 900 ${T + rows.length * rh + 40}`);
    const x = v => L + (v / max) * (R - L);
    for (let v = 0; v <= max; v += 1000) { el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: T + rows.length * rh, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: T + rows.length * rh + 16, "text-anchor": "middle" }, svg).textContent = `${v / 1000} GW`; }
    rows.forEach((r, i) => {
      const y = T + i * rh;
      markConflict(svg,r.name,"mw_online",L-193,y+15);
      el("text", { x: L - 10, y: y + 15, "text-anchor": "end", class: "ink" }, svg).textContent = r.name;
      const tipHtml = () => `<b>${esc(r.name)}</b> (${r.group})<br>Online: ${r.on ? cell(r.on, "mw") : "not disclosed"}<br>Total contracted: ${r.ct ? cell(r.ct, "mw") : "not disclosed"}` + (r.inserviceCommitted ? `<br>Within the in-service fleet: ${cell(r.inserviceCommitted,"mw")} customer-committed (subset, not a total including future capacity)` : "") +
        (r.partial ? `<br><b>Incomplete AI-site subtotal, ${r.on.n_sites} sites; not total fleet</b><br>${r.on.sites.map(s=>`${esc(s.site)}: ${num(s.value)} MW (${ym(s.as_of)})`).join("<br>")}` : "") + (r.pipe ? `<br>Pipeline (not contracted): ${cell(r.pipe, "mw")}` : "");
      if (r.ct) hover(el("rect", { x: L, y: y + 4, width: Math.max(2, x(r.ct.value) - L), height: 16, rx: 4, fill: css("--s2"), opacity: 0.45 }, svg), tipHtml);
      if (r.on) hover(el("rect", { x: L, y: y + 8, width: Math.max(2, x(r.on.value) - L), height: 8, rx: 3, fill: r.partial ? css("--s4") : css("--s1"), opacity:r.partial?.75:1, stroke:r.partial?css("--s4"):"none","stroke-dasharray":r.partial?"4 2":"" }, svg), tipHtml);
      el("text", { x: x(Math.max(r.on ? r.on.value : 0, r.ct ? r.ct.value : 0)) + 6, y: y + 16 }, svg).textContent =
        r.inserviceCommitted ? `${num(r.on.value)} MW · in service` : r.partial ? `${num(r.on.value)} MW · sites only` : `${r.on ? num(r.on.value) : "?"} / ${r.ct ? num(r.ct.value) : "?"} MW`;
    });
    $("#supLegend").innerHTML = `<span><i style="background:var(--s1)"></i>company online</span><span><i style="background:var(--s2);opacity:.45"></i>company contracted</span><span><i style="background:var(--s4)"></i>documented AI sites only (incomplete)</span>`;
    $("#supNote").innerHTML = `Site subtotals use the latest dated IT-power observation per documented site and exclude future projections. Epoch records are estimates; IREN’s Horizon 1 is a reported site phase. Company figures can use IT, gross or billable power (hover for basis). VNET’s bar shows only in-service capacity; its customer-committed subset is described in the tooltip and is excluded from the total-contracted series. Planned additions and utility contracts are not online fleet capacity. ${src("https://epoch.ai/data/ai-data-centers","Epoch data and coverage")}`;
  }
  function draw() { const svg = $("#supSvg"); svg.innerHTML = ""; (mode === "compute" ? drawCompute : drawPower)(svg);
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
