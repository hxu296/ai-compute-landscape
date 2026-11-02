// Contracts: buyer -> supplier flow (band width = disclosed value) and a table that follows the selection.
(function () {
  let from = "2025", kind = "all", view = "relations", sel = null, minimum = 0;
  const maxDeal=Math.max(...[...NC.contracts,...NC.hardware].map(c=>c.value_usd||0));
  const W = 900, H = 560, NW = 14, GAP = 8, LX = 170, RX = 900 - 250;
  const short = s => s.length > 24 ? s.slice(0, 23) + "…" : s;
  function priceTxt(c) {
    if (c.implied_usd_per_gpu_hour) return `$${c.implied_usd_per_gpu_hour}/GPU-h`;
    if (c.implied_usd_per_kw_month) return `lease $${Math.round(c.implied_usd_per_kw_month)}/kW-mo`;
    let s = c.implied_allin_usd_per_kw_month ? `all-in $${Math.round(c.implied_allin_usd_per_kw_month).toLocaleString()}/kW-mo` : "";
    if (c.implied_usd_per_gpu_hour_est) s += ` (≈$${c.implied_usd_per_gpu_hour_est.low}–${c.implied_usd_per_gpu_hour_est.high}/GPU-h, floor)`;
    return s;
  }
  function deals() {
    const base = kind === "all" ? [...NC.contracts, ...NC.hardware] : kind === "hardware" ? NC.hardware : NC.contracts.filter(c => c.kind === kind);
    return base.filter(c => !c.excluded && String(c.announced || "").slice(0, 4) >= from && (c.value_usd ? c.value_usd >= minimum : $("#dealUnpriced").checked));
  }
  function draw() {
    $("#dealRelations").classList.toggle("on", view === "relations"); $("#dealDollars").classList.toggle("on", view === "dollars");
    if (view === "relations") { drawRelations(); table1(); return; }
    const svg = $("#sankey"); svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const ds = deals().filter(c => c.value_usd > 0 && (c.kind !== "compute" || firmCompute(c)));
    $("#dealTake").innerHTML=`<span class="verdict">Disclosed values keep their contractual limits</span>The relationship view keeps unpriced TPU access and cancellable or scenario-dependent agreements visible. Widths show disclosed nominal amounts and spend floors, with conditional and cancellable agreements excluded from this view. They do not measure delivered capacity or annual spend; relationships can still overlap.`;
    const tot = (key) => { const m = new Map(); ds.forEach(c => m.set(c[key], (m.get(c[key]) || 0) + c.value_usd)); return [...m].sort((a, b) => b[1] - a[1]); };
    const topB = tot("buyer").slice(0, 7).map(x => x[0]), topS = tot("supplier").slice(0, 14).map(x => x[0]);
    const bk = c => topB.includes(c.buyer) ? c.buyer : "Other buyers", sk = c => topS.includes(c.supplier) ? c.supplier : "Other suppliers";
    const agg = new Map(); ds.forEach(c => { const k = bk(c) + "→" + sk(c); const a = agg.get(k) || { b: bk(c), s: sk(c), v: 0, deals: [] }; a.v += c.value_usd; a.deals.push(c); agg.set(k, a); });
    const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
    const bN = [...new Set([...agg.values()].map(a => a.b))].map(n => ({ n, v: sum([...agg.values()].filter(a => a.b === n), a => a.v) })).sort((a, b) => b.v - a.v);
    const sN = [...new Set([...agg.values()].map(a => a.s))].map(n => ({ n, v: sum([...agg.values()].filter(a => a.s === n), a => a.v) })).sort((a, b) => b.v - a.v);
    const total = sum(bN, x => x.v); if (!total) { el("text", { x: 20, y: 40 }, svg).textContent = "No deals with a disclosed value in this range."; table1(); return; }
    const scale = v => v / total * (H - 20 - GAP * (Math.max(bN.length, sN.length) - 1));
    const place = (nodes) => { let y = 10; nodes.forEach(n => { n.y = y; n.h = Math.max(2, scale(n.v)); n.off = 0; y += n.h + GAP; }); };
    place(bN); place(sN);
    const color = new Map(bN.map((n, i) => [n.n, n.n === "Other buyers" ? css("--text-muted") : css(SER[i % 8])]));
    const B = Object.fromEntries(bN.map(n => [n.n, n])), S = Object.fromEntries(sN.map(n => [n.n, n]));
    const active = a => !sel || (sel.side === "buyer" ? a.b === sel.name : a.s === sel.name);
    [...agg.values()].sort((a, b) => b.v - a.v).forEach(a => {
      const h = Math.max(1, scale(a.v)), b = B[a.b], s = S[a.s];
      const y1 = b.y + b.off + h / 2, y2 = s.y + s.off + h / 2; b.off += h; s.off += h;
      const p = el("path", { d: `M${LX + NW},${y1} C${(LX + RX) / 2},${y1} ${(LX + RX) / 2},${y2} ${RX},${y2}`, class: "band", stroke: color.get(a.b), "stroke-width": h,
        "stroke-opacity": active(a) ? 0.5 : 0.08 }, svg);
      hover(p, () => `<b>${esc(a.b)} → ${esc(a.s)}</b>${money(a.v)} across ${a.deals.length} deal${a.deals.length > 1 ? "s" : ""}<br>` +
        a.deals.slice(0, 6).map(c => `${String(c.announced || "").slice(0, 7)} · ${money(c.value_usd)}${c.term_years ? ` · ${c.term_years} yrs` : ""}${badge(c.confidence)} ${esc(priceTxt(c))}`).join("<br>"));
    });
    const lastY = { buyer: -1e9, supplier: -1e9 };
    const node = (n, x, side, anchor, tx) => {
      const r = el("rect", { x, y: n.y, width: NW, height: n.h, rx: 3, class: "node", fill: side === "buyer" ? color.get(n.n) : css("--text-secondary") }, svg);
      const ly = Math.max(n.y + n.h / 2 + 4, lastY[side] + 13); lastY[side] = ly;
      const t = el("text", { x: tx, y: ly, "text-anchor": anchor, class: "ink", "font-size": n.h < 10 ? 11 : 12 }, svg); t.textContent = `${short(n.n)} ${money(n.v)}`;
      r.onclick = t.onclick = () => { sel = sel && sel.name === n.n ? null : { side, name: n.n }; draw(); };
      hover(r, `<b>${esc(n.n)}</b>${money(n.v)} in this view · click to filter`);
    };
    bN.forEach(n => node(n, LX, "buyer", "end", LX - 6)); sN.forEach(n => node(n, RX, "supplier", "start", RX + NW + 6));
    $("#dealSel").textContent = sel ? `Showing ${sel.side} ${sel.name}` : `${ds.length} deals with a disclosed value, ${money(total)} in total`;
    table1();
  }
  function drawRelations() {
    const svg = $("#sankey"); svg.innerHTML = "";
    const ds = deals(), buyers = [...new Set(ds.map(c => c.buyer))], suppliers = [...new Set(ds.map(c => c.supplier))];
    const degree = (k, n) => ds.filter(c => c[k] === n).length;
    buyers.sort((a,b) => degree("buyer",b)-degree("buyer",a)); suppliers.sort((a,b) => degree("supplier",b)-degree("supplier",a));
    const h = Math.max(360, Math.max(buyers.length, suppliers.length) * 25 + 50);
    svg.setAttribute("viewBox", `0 0 900 ${h}`);
    const y = (arr, n) => 30 + arr.indexOf(n) * ((h - 60) / Math.max(1, arr.length - 1));
    const pairs = new Map(); ds.forEach(c => { const k = c.buyer + "→" + c.supplier; if (!pairs.has(k)) pairs.set(k, []); pairs.get(k).push(c); });
    pairs.forEach(cs => {
      const c = cs[0], active = !sel || (sel.side === "buyer" ? c.buyer : c.supplier) === sel.name;
      const col = css(SER[buyers.indexOf(c.buyer) % SER.length]);
      const path = el("path", {d:`M190,${y(buyers,c.buyer)} C400,${y(buyers,c.buyer)} 490,${y(suppliers,c.supplier)} 690,${y(suppliers,c.supplier)}`,
        fill:"none",stroke:col,"stroke-width":active ? (cs.some(d=>d.value_usd)?1.2+12*Math.sqrt(cs.reduce((v,d)=>v+(d.value_usd||0),0)/maxDeal):1.2) : 1,"stroke-opacity": active ? .48 : .06,
        "stroke-dasharray":cs.every(c=>c.kind === "hardware") ? "5 4" : ""},svg);
      hover(path, `<b>${esc(c.buyer)} → ${esc(c.supplier)}</b>` + cs.map(c=>`${esc(c.gpu_type || "chip type undisclosed")} · ${c.value_usd ? money(c.value_usd) : "value undisclosed"}<br>${esc(c.evidence || c.structure)}${badge(c.confidence)}`).join("<br>"));
      path.onclick = () => {sel={side:"supplier",name:c.supplier};draw();};
    });
    const totals=(side,n)=>ds.filter(c=>c[side]===n).reduce((sum,c)=>sum+(c.value_usd||0),0);
    const maxNode=Math.max(...buyers.map(n=>totals("buyer",n)),...suppliers.map(n=>totals("supplier",n)),1);
    const nodes = (arr, side, x, tx, anchor) => arr.forEach((n,i)=>{
      const active=!sel || sel.side === side && sel.name === n;
      const total=totals(side,n),radius=total?Math.max(3,10*Math.sqrt(total/maxNode)):3;
      const circle=el("circle",{cx:x,cy:y(arr,n),r:radius,fill:total?css(side === "buyer" ? SER[i%8] : "--s1"):css("--paper"),stroke:css(side === "buyer" ? SER[i%8] : "--s1"),"stroke-width":1.2,opacity:active?1:.45},svg);
      hover(circle,`<b>${esc(n)}</b>${total?money(total)+" disclosed nominal deal value":"Deal value undisclosed"} in the current view. Circle area follows value, with a minimum visible size; overlapping or conditional amounts are retained.`);
      const t=el("text",{x:tx,y:y(arr,n)+4,"text-anchor":anchor,class:"ink","font-size":12},svg);t.textContent=short(n);el("title",{},t).textContent=n;
      t.style.cursor=circle.style.cursor="pointer"; t.onclick=circle.onclick=()=>{sel=sel?.side===side&&sel.name===n?null:{side,name:n};draw();};
    });
    nodes(buyers,"buyer",190,178,"end");nodes(suppliers,"supplier",690,702,"start");
    suppliers.forEach(n=>{const ids=[...new Set(ds.filter(c=>c.supplier===n).flatMap(c=>["value_usd","capacity_gpus","capacity_mw"].flatMap(m=>conflictIds(n,m,c))))];if(ids.length){const t=el("text",{x:680,y:y(suppliers,n)+4,class:"svg-conflict","data-conflict":ids.join(","),tabindex:0,role:"button","aria-label":"Source comparison for "+n},svg);t.textContent="!";}});
    $("#dealSel").textContent=sel?`${sel.name} selected`:`${pairs.size} relationships; width follows disclosed nominal value`;
    $("#dealTake").innerHTML=`<span class="verdict">An undisclosed price still represents a real relationship</span>Google Cloud’s OpenAI and Anthropic links, AWS Trainium, and AMD supply agreements stay visible here. Widths show disclosed nominal amounts, with floors, options and cancellation terms retained; thin unpriced links do not mean zero. Dashed lines are hardware supply. Click any company for its terms and sources below.`;
  }
  function table1() {
    const rows = deals().filter(c => !sel || (sel.side === "buyer" ? (c.buyer === sel.name || (sel.name === "Other buyers")) : (c.supplier === sel.name || sel.name === "Other suppliers")))
      .map(c => ({ ...c, price: priceTxt(c), cap: c.capacity_text || (c.capacity_accelerators ? `${c.capacity_relation || ""} ${num(c.capacity_accelerators)} ${c.accelerator_unit}` : c.capacity_gpus ? `${c.capacity_relation || ""} ${num(c.capacity_gpus)} GPUs` : c.capacity_mw ? `${c.capacity_mw_relation || ""} ${num(c.capacity_mw)} MW` : "not disclosed") }))
      .sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0));
    table("#tDeals", rows, [{ k: "buyer", h: "Buyer" }, { k: "supplier", h: "Supplier" }, { k: "announced", h: "Announced", f: r => `<span class="nw">${esc(String(r.announced || "").slice(0, 10))}</span>` },
      { k: "value_usd", h: "Value", f: r => (r.value_usd ? `${esc(r.value_relation || "")} ${money(r.value_usd)}` : esc(r.value_text || "not disclosed")) + badge(r.confidence) + conflictBadge(r.supplier,"value_usd",r) }, { k: "term_years", h: "Years", f:r=>r.term_years || "not disclosed" }, { k: "cap", h: "Capacity", f:r=>esc(r.cap)+conflictBadge(r.supplier,"capacity_gpus",r)+conflictBadge(r.supplier,"capacity_mw",r) },
      { k:"gpu_type", h:"Chip / system" }, { k: "price", h: "Implied price" }, { k: "structure", h: "Terms / evidence", f: r => `<span title="${esc(r.note || "")}">${esc(r.evidence || r.structure)}${r.source_date?`<br><b class="small">Latest source ${esc(r.source_date)}</b>`:""}<br><span class="muted small">${esc(r.note || "")}</span></span>` }, { k: "source_url", h: "", f: r => src(r.source_url) }]);
  }
  $("#dealFrom").onchange = e => { from = e.target.value; sel = null; draw(); };
  $("#dealKind").onchange = e => { kind = e.target.value; if(kind === "all")view="relations"; sel = null; draw(); };
  $("#dealReset").onclick = () => { sel = null; draw(); };
  $("#dealRelations").onclick=()=>{view="relations";draw();};
  $("#dealDollars").onclick=()=>{view="dollars";if(kind==="all"){kind="compute";$("#dealKind").value=kind;}sel=null;draw();};
  $("#dealMin").oninput=e=>{minimum=maxDeal*(Number(e.target.value)/100)**2;$("#dealMinLabel").textContent=minimum?money(minimum)+" and above":"All values";if(minimum>0)$("#dealUnpriced").checked=false;sel=null;draw();};
  $("#dealUnpriced").onchange=()=>{sel=null;draw();};
  onTheme(draw); draw();
})();
