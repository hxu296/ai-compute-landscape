// Contracts: buyer -> supplier flow (band width = disclosed value) and a table that follows the selection.
(function () {
  let from = "2025", kind = "compute", sel = null;   // sel = {side: "buyer"|"supplier", name}
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
    const base = kind === "hardware" ? NC.hardware : NC.contracts.filter(c => c.kind === kind);
    return base.filter(c => !c.excluded && String(c.announced || "").slice(0, 4) >= from);
  }
  function draw() {
    const svg = $("#sankey"); svg.innerHTML = "";
    const ds = deals().filter(c => c.value_usd > 0);
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
    const node = (n, x, side, anchor, tx) => {
      const r = el("rect", { x, y: n.y, width: NW, height: n.h, rx: 3, class: "node", fill: side === "buyer" ? color.get(n.n) : css("--text-secondary") }, svg);
      const t = el("text", { x: tx, y: n.y + n.h / 2 + 4, "text-anchor": anchor, class: "ink" }, svg); t.textContent = `${short(n.n)} ${money(n.v)}`;
      r.onclick = t.onclick = () => { sel = sel && sel.name === n.n ? null : { side, name: n.n }; draw(); };
      hover(r, `<b>${esc(n.n)}</b>${money(n.v)} in this view · click to filter`);
    };
    bN.forEach(n => node(n, LX, "buyer", "end", LX - 6)); sN.forEach(n => node(n, RX, "supplier", "start", RX + NW + 6));
    $("#dealSel").textContent = sel ? `Showing ${sel.side} ${sel.name}` : `${ds.length} deals with a disclosed value, ${money(total)} in total`;
    table1();
  }
  function table1() {
    const rows = deals().filter(c => !sel || (sel.side === "buyer" ? (c.buyer === sel.name || (sel.name === "Other buyers")) : (c.supplier === sel.name || sel.name === "Other suppliers")))
      .map(c => ({ ...c, price: priceTxt(c), cap: c.capacity_gpus ? `${num(c.capacity_gpus)} ${/TPU/.test(c.structure + c.supplier) && /Google/.test(c.supplier) ? "TPUs" : /Rainier|Trainium/.test(c.structure) ? "Trainium chips" : "GPUs"}` : c.capacity_mw ? `${num(c.capacity_mw)} MW` : "" }))
      .sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0));
    table("#tDeals", rows, [{ k: "buyer", h: "Buyer" }, { k: "supplier", h: "Supplier" }, { k: "announced", h: "Announced", f: r => `<span class="nw">${esc(String(r.announced || "").slice(0, 10))}</span>` },
      { k: "value_usd", h: "Value", f: r => money(r.value_usd) + badge(r.confidence) }, { k: "term_years", h: "Years" }, { k: "cap", h: "Capacity" },
      { k: "price", h: "Implied price" }, { k: "structure", h: "Structure", f: r => { const s = String(r.structure || ""); return s.length > 100 ? `<span title="${esc(s)}">${esc(s.slice(0, 97).replace(/\s+\S*$/, ""))}…</span>` : esc(s); } }, { k: "source_url", h: "", f: r => src(r.source_url) }]);
  }
  $("#dealFrom").onchange = e => { from = e.target.value; sel = null; draw(); };
  $("#dealKind").onchange = e => { kind = e.target.value; sel = null; draw(); };
  $("#dealReset").onclick = () => { sel = null; draw(); };
  onTheme(draw); draw();
})();
