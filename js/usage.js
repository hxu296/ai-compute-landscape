// Training vs inference: each lab's compute split as a 100% bar; supplier revenue/usage statements stay a separate measure.
(function () {
  const SPLIT = window.DEMAND_RESEARCH?.compute_split;
  const GROUPS = [["AI labs · share of compute spend", r => !/Deloitte/.test(r.who)], ["Market estimate · all AI compute, incl. hosts", r => /Deloitte/.test(r.who)]];
  function draw() {
    const svg = $("#infSvg"); if (!svg || !SPLIT) return; svg.innerHTML = "";
    const L = 150, R = 418, rh = 26, T = 34, x = v => L + v * (R - L);
    let y = T; const rows = [];
    // Latest dated observation per company; forecasts after the build date are left to the hover notes.
    const today = String(NC.built).slice(0, 10), latest = Object.values(SPLIT.rows.filter(r => r.as_of <= today).reduce((m, r) => (!m[r.who] || r.as_of > m[r.who].as_of ? { ...m, [r.who]: r } : m), {}));
    for (const [head, keep] of GROUPS) { rows.push({ head, y }); y += 20; for (const r of latest.filter(keep)) { rows.push({ r, y }); y += rh; } y += 6; }
    svg.setAttribute("viewBox", `0 0 440 ${y + 22}`);
    el("text", { x: L + 14, y: 12, "font-size": 11, class: "ink" }, svg).textContent = "inference (serving)";
    el("rect", { x: L - 1, y: 3, width: 10, height: 10, fill: css("--s1") }, svg);
    el("rect", { x: L + 132, y: 3, width: 10, height: 10, fill: css("--s3"), opacity: .55 }, svg);
    el("text", { x: L + 146, y: 12, "font-size": 11, class: "ink" }, svg).textContent = "training, research, other";
    for (let v = 0; v <= 1.001; v += 0.25) {
      el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: y - 6, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: y + 10, "text-anchor": "middle", "font-size": 10 }, svg).textContent = `${v * 100}%`;
    }
    rows.forEach(o => {
      if (o.head) { el("text", { x: 4, y: o.y + 12, "font-size": 11, "font-weight": 600, class: "ink" }, svg).textContent = o.head; return; }
      const r = o.r, cy = o.y + 2, h = 16, inf = r.inference, hi = r.inference_high;
      el("text", { x: L - 8, y: cy + 12, "text-anchor": "end", "font-size": 11, class: "ink" }, svg).textContent = `${r.who} · ${r.period}`;
      el("rect", { x: L, y: cy, width: x(1) - L, height: h, fill: css("--s3"), opacity: .55 }, svg);
      el("rect", { x: L, y: cy, width: x(inf) - L, height: h, fill: css("--s1") }, svg);
      if (hi) el("rect", { x: x(inf), y: cy, width: x(hi) - x(inf), height: h, fill: css("--s1"), opacity: .4 }, svg);
      const label = el("text", { x: x(hi || inf) + 5, y: cy + 12, "font-size": 10, class: "ink", "font-weight": 600 }, svg);
      label.textContent = `${Math.round(inf * 100)}%${hi ? `–${Math.round(hi * 100)}%` : ""}`;
      const hit = el("rect", { x: L, y: cy, width: x(1) - L, height: h, fill: "transparent", "data-split": r.who }, svg);
      hover(hit, `<b>${esc(r.who)} · ${esc(r.period)}</b>Inference ${Math.round(inf * 100)}%${hi ? `–${Math.round(hi * 100)}%` : ""}, training and other ${Math.round((1 - (hi || inf)) * 100)}%${hi ? `–${Math.round((1 - inf) * 100)}%` : ""} · ${esc(r.basis)} · grade ${esc(r.grade)}<br><span class="muted">${esc(r.note)}</span><br>${src(r.source_url)}`);
    });
  }
  // Supplier statements measure revenue or usage at a host or chip seller, not a lab's own split.
  function suppliers() {
    if (!$("#infSupplierTable")) return;
    const seen = new Set(), rows = NC.inference.filter(r => r.metric === "inference_share" && !/^market$/.test(r.subject) && !/OpenAI|Anthropic|MiniMax|Z\.ai/.test(r.subject))
      .filter(r => { const k = `${r.subject}|${r.as_of}|${r.value}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => b.as_of.localeCompare(a.as_of));
    table("#infSupplierTable", rows, [
      { k: "subject", h: "Who", f: r => `<b>${esc(r.subject.replace(/^market \(AI-optimized IaaS\)$/, "Gartner (cloud AI rental spend)"))}</b>` },
      { k: "value", h: "Inference", f: r => `${/lower bound|more than|well over|in excess/i.test(r.note) ? "≥" : ""}${Math.round(r.value * 100)}%` },
      { k: "as_of", h: "Date", f: r => `<span class="nw">${esc(r.as_of)}</span>` },
      { k: "note", h: "What it measures", f: r => `<span class="small">${esc(r.note)}</span> ${src(r.source_url, "Source ↗")}` }]);
  }
  onTheme(draw); draw(); suppliers();
})();
