// Pricing: dot plot of $/GPU-hour by chip (one dot per provider), index history, and deal $/kW-month.
(function () {
  const GROUPS = [["Hyperscaler", "--s1"], ["Neocloud", "--s2"], ["Marketplace", "--s3"], ["China", "--s7"]];
  const BASES = [["on-demand per GPU-hour", "On demand"], ["reserved 1yr", "1-year retail"], ["reserved 3yr", "3-year retail"], ["capacity block", "Capacity blocks"], ["starting from", "From / term unspecified"]];
  const ORDER = ["GB300 NVL72", "GB200 NVL72", "B300", "B200", "H200", "H100", "H100 PCIe/NVL", "H20", "A100", "MI355X", "MI325X", "MI300X", "TPU v7", "TPU v6e", "TPU v5p", "TPU v5e", "Trainium3", "Trainium2", "Trainium1", "L40S", "RTX PRO 6000", "RTX 5090", "RTX 4090"];
  const family = s => /^MI/.test(s) ? "AMD" : /^TPU/.test(s) ? "Google TPU" : /^Trainium/.test(s) ? "AWS Trainium" : "NVIDIA";
  let basis = "on-demand per GPU-hour";
  const ctl = $("#priceCtl");
  BASES.forEach(([k,l])=>{const b=document.createElement("button");b.textContent=l;b.dataset.k=k;b.onclick=()=>{basis=k;draw();};ctl.appendChild(b);});
  $("#priceGroup").onchange=$("#priceFamily").onchange=draw;
  $("#benchmarks").innerHTML=NC.benchmarks.map(b=>`<div class="benchmark"><div class="kicker">${esc(b.name)}</div><strong>${b.range_low!=null?`$${b.range_low.toFixed(2)}–${b.range_high.toFixed(2)}`:b.usd==null?"No public fixing":`$${b.usd.toFixed(2)}`}</strong><p>${esc(b.sku)} · ${b.usd==null?"checked":"as of"} ${b.date}</p><p>${esc(b.terms)}</p>${src(b.source_url)}</div>`).join("");
  $("#priceLegend").innerHTML = GROUPS.map(([g,c])=>`<span><i style="background:var(${c})"></i>${g}</span>`).join("")+`<span>│ median of shown providers</span>`;
  const pct = v => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
  table("#marketChanges", NC.market_checks, [{k:"name",h:"Benchmark"},{k:"terms",h:"Market / terms"},{k:"date",h:"Last observation"},{k:"usd",h:"USD / GPU-h",f:r=>`$${r.usd.toFixed(2)}`}, ...[7,30,90].map(n=>({k:`change${n}`,h:`${n}d change`,f:r=>{const c=r.changes[n];if(!c)return "unavailable";return `<span title="${esc(`${c.first_date}: $${c.first} → ${c.last_date}: $${c.last}`)}">${pct(c.percent)}</span>`;}})),{k:"source_url",h:"",f:r=>src(r.source_url)}]);
  function draw() {
    ctl.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.k===basis));
    const svg=$("#priceSvg");svg.innerHTML="";
    const raw=NC.prices.filter(p=>ORDER.includes(p.sku) && (basis==="starting from"?p.is_floor:p.basis===basis&&!p.is_floor)
      && ($("#priceGroup").value==="All"||p.group===$("#priceGroup").value) && ($("#priceFamily").value==="All"||family(p.sku)===$("#priceFamily").value));
    const ps=providerPrices(raw),skus=ORDER.filter(s=>ps.some(p=>p.sku===s));
    const L=150,R=825,T=16,rh=29,max=Math.max(4,...ps.map(p=>p.usd))*1.07;
    svg.setAttribute("viewBox",`0 0 920 ${Math.max(100,T+skus.length*rh+45)}`);
    const x=v=>L+v/max*(R-L);
    if(!ps.length)el("text",{x:30,y:40},svg).textContent="No current public rate for these filters. An undisclosed price is not zero.";
    for(let i=0;i<=5;i++){const v=max*i/5;el("line",{x1:x(v),x2:x(v),y1:T-4,y2:T+skus.length*rh,stroke:css("--grid")},svg);el("text",{x:x(v),y:T+skus.length*rh+17,"text-anchor":"middle"},svg).textContent=`$${v.toFixed(1)}`;}
    el("text",{x:(L+R)/2,y:T+skus.length*rh+36,"text-anchor":"middle"},svg).textContent="USD / physical GPU or TPU/Trainium chip-hour · no throughput normalization";
    skus.forEach((s,i)=>{
      const y=T+i*rh+rh/2,row=ps.filter(p=>p.sku===s).sort((a,b)=>a.usd-b.usd);
      el("text",{x:L-10,y:y+4,"text-anchor":"end",class:"ink"},svg).textContent=s.replace(" NVL72"," · GPU");
      el("line",{x1:L,x2:R,y1:y,y2:y,stroke:css("--grid"),"stroke-dasharray":"2 3"},svg);
      const med=(row[Math.floor((row.length-1)/2)].usd+row[Math.ceil((row.length-1)/2)].usd)/2;
      el("line",{x1:x(med),x2:x(med),y1:y-9,y2:y+9,stroke:css("--text-primary"),"stroke-width":2},svg);
      const seen={};row.forEach(p=>{const k=Math.round(x(p.usd)),dy=(seen[k]=(seen[k]||0)+1)-1;
        const c=el("circle",{cx:x(p.usd),cy:y+(dy?((dy%3)-1)*5:0),r:5,fill:css((GROUPS.find(g=>g[0]===p.group)||["","--text-muted"])[1]),stroke:css("--surface-1"),"stroke-width":2},svg);
        hover(c,`<b>${esc(p.provider)}: ${esc(s)}</b>${p.is_floor?"from ":""}$${p.usd.toFixed(2)} ${esc(p.unit)}${badge(p.confidence)}<br>${esc(p.configuration)} · ${esc(p.region||"")} · ${p.date}<br>${esc(p.basis)}<br><span class="muted">${esc(p.note)}</span><br>${src(p.source_url)}`);});
      el("text",{x:R+8,y:y+4,"font-size":11},svg).textContent=`$${med.toFixed(2)} · n=${row.length}`;
    });
    table("#priceTable",raw.sort((a,b)=>a.sku.localeCompare(b.sku)||a.usd-b.usd),[{k:"provider",h:"Provider"},{k:"sku",h:"Chip"},{k:"usd",h:"USD / accelerator-h",f:r=>`${r.is_floor?"from ":""}$${r.usd.toFixed(4)}`},{k:"basis",h:"Terms"},{k:"region",h:"Region"},{k:"configuration",h:"Configuration"},{k:"date",h:"Observed"},{k:"note",h:"Original unit / formula",f:r=>esc(r.method||r.note)},{k:"source_url",h:"",f:r=>src(r.source_url)}]);
    $("#priceBasisNote").textContent=`${ps.length} provider/chip quotes shown from ${raw.length} region/configuration rows. ${basis==="reserved 3yr"?"Three-year retail commitments are shown only where published; no market discount is inferred. ":""}${basis==="starting from"?"Minimum advertised prices: commitment and allocation may differ. ":""}Blackwell prices are per physical GPU in the specified NVL72 VM/tray, not per entire 72-GPU rack. No chart value is clipped.`;
  }
  function drawIdx() {
    const svg = $("#idxSvg"); svg.innerHTML = "";
    const keys = Object.keys(NC.indices);
    const series = keys.map((k, i) => ({ k, c: SER[i % 8], pts: NC.indices[k].filter(p => p[0] >= "2023-01") })).filter(s => s.pts.length >= 2);
    const all = series.flatMap(s => s.pts); if (!all.length) return;
    const t0 = Math.min(...all.map(p => Date.parse(p[0]))), t1 = Math.max(...all.map(p => Date.parse(p[0]))), vmax = Math.max(...all.map(p => p[1])) * 1.1;
    const x = d => 40 + (Date.parse(d) - t0) / (t1 - t0) * 390, y = v => 230 - v / vmax * 210;
    for (let v = 0; v <= vmax; v += 2) { el("line", { x1: 40, x2: 430, y1: y(v), y2: y(v), stroke: css("--grid") }, svg); el("text", { x: 34, y: y(v) + 4, "text-anchor": "end" }, svg).textContent = `$${v}`; }
    for (let yr = new Date(t0).getFullYear(); yr <= new Date(t1).getFullYear(); yr++) { const d = `${yr}-01-01`; if (Date.parse(d) >= t0) el("text", { x: x(d), y: 248, "text-anchor": "middle" }, svg).textContent = yr; }
    series.forEach(s => { el("path", { d: s.pts.map((p, i) => `${i ? "L" : "M"}${x(p[0])},${y(p[1])}`).join(""), fill: "none", stroke: css(s.c), "stroke-width": 2 }, svg);
      s.pts.forEach(p => hover(el("circle", { cx: x(p[0]), cy: y(p[1]), r: 3.5, fill: css(s.c) }, svg), `<b>${esc(s.k)}</b>${p[0]}: $${p[1]}<br><span class="muted">${esc(p[3])}</span>`)); });
    $("#idxLegend").innerHTML = series.map(s => `<span><i style="background:var(${s.c})"></i>${esc(s.k)}</span>`).join("");
  }
  function drawKw() {
    const svg = $("#kwSvg"); svg.innerHTML = "";
    const rows = NC.contracts.filter(c => !c.excluded && (c.implied_allin_usd_per_kw_month || c.implied_usd_per_kw_month))
      .map(c => ({ label: `${c.buyer} ← ${c.supplier}`, v: c.implied_allin_usd_per_kw_month || c.implied_usd_per_kw_month, lease: !!c.implied_usd_per_kw_month, c }))
      .sort((a, b) => b.v - a.v).slice(0, 12);
    const L = 200, R = 372, rh = 22, max = Math.max(...rows.map(r => r.v));
    svg.setAttribute("viewBox", `0 0 440 ${rows.length * rh + 10}`);
    rows.forEach((r, i) => { const y = 6 + i * rh;
      el("text", { x: L - 6, y: y + 14, "text-anchor": "end", "font-size": 11, class: "ink" }, svg).textContent = r.label.length > 30 ? r.label.slice(0, 29) + "…" : r.label;
      const b = el("rect", { x: L, y: y + 3, width: Math.max(2, (r.v / max) * (R - L)), height: 14, rx: 3, fill: css(r.lease ? "--s3" : "--s2") }, svg);
      el("text", { x: L + (r.v / max) * (R - L) + 4, y: y + 14, "font-size": 11 }, svg).textContent = `$${Math.round(r.v).toLocaleString()}`;
      hover(b, `<b>${esc(r.label)}</b>${r.lease ? "Lease (no chips)" : "All-in compute"}: $${Math.round(r.v).toLocaleString()} per kW-month${badge(r.c.confidence)}<br>` +
        `${money(r.c.value_usd)} · ${r.c.term_years} yrs · ${num(r.c.capacity_mw)} MW` + (r.c.implied_usd_per_gpu_hour_est ? `<br>≈$${r.c.implied_usd_per_gpu_hour_est.low}–${r.c.implied_usd_per_gpu_hour_est.high}/GPU-h (floor)` : "")); });
  }
  onTheme(() => { draw(); drawIdx(); drawKw(); }); draw(); drawIdx(); drawKw();
})();
