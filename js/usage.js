// Inference vs training: every share statement as a dot (date x share), and token-volume series as a table.
(function () {
  // One row per statement, grouped by vantage point; an arrow marks a lower bound ("more than 40%").
  const VANT = [["Suppliers (revenue or usage)", "--s1"], ["AI labs (spend)", "--s2"], ["Market estimates", "--s3"]];
  const vant = s => /^market/.test(s) ? 2 : /OpenAI|Anthropic|MiniMax|Z\.ai/.test(s) ? 1 : 0;
  const PUB = u => /deloitte/.test(u) ? "Deloitte" : /mckinsey/.test(u) ? "McKinsey" : /gartner|cxotoday/.test(u) ? "Gartner" : "";
  function draw() {
    const svg = $("#infSvg"); svg.innerHTML = "";
    const seen = new Set();
    const pts = NC.inference.filter(r => r.metric === "inference_share" && r.value > 0 && r.value <= 1)
      .filter(r => { const k = `${r.subject}|${r.as_of}|${r.value}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => vant(a.subject) - vant(b.subject) || a.as_of.localeCompare(b.as_of));
    const L = 200, R = 420, rh = 19, T = 22;
    const x = v => L + v * (R - L);
    let y = T, last = -1;
    const rows = [];
    pts.forEach(p => { const g = vant(p.subject); if (g !== last) { rows.push({ head: VANT[g][0], y }); y += rh; last = g; } rows.push({ p, y }); y += rh; });
    svg.setAttribute("viewBox", `0 0 440 ${y + 26}`);
    for (let v = 0; v <= 1.001; v += 0.25) { el("line", { x1: x(v), x2: x(v), y1: T - 8, y2: y, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: y + 16, "text-anchor": "middle" }, svg).textContent = `${v * 100}%`; }
    el("line", { x1: x(0.5), x2: x(0.5), y1: T - 8, y2: y, stroke: css("--text-muted"), "stroke-dasharray": "3 3" }, svg);
    el("text", { x: L, y: 10, "font-size": 11 }, svg).textContent = "share serving inference →";
    rows.forEach(r => {
      if (r.head) { el("text", { x: 4, y: r.y + 13, "font-size": 11, "font-weight": 600, class: "ink" }, svg).textContent = r.head; return; }
      const p = r.p, cy = r.y + 9, col = css(VANT[vant(p.subject)][1]), lb = /lower bound|more than|well over|in excess|>\s?50/i.test(p.note);
      const who = /^market/.test(p.subject) ? `${PUB(p.source_url) || "Market"}${/IaaS/.test(p.subject) ? " (cloud AI spend)" : ""}` : p.subject;
      const forecast=p.as_of>NC.built.slice(0,10);
      el("text", { x: L - 8, y: cy + 4, "text-anchor": "end", "font-size": 11, class: "ink" }, svg).textContent = `${who} · ${p.as_of.slice(0, 4)}${forecast?' forecast':''}`;
      el("line", { x1: L, x2: R, y1: cy, y2: cy, stroke: css("--grid"), "stroke-dasharray": "2 3" }, svg);
      if (lb) el("path", { d: `M${x(p.value)},${cy} L${x(p.value) + 22},${cy} M${x(p.value) + 17},${cy - 4} L${x(p.value) + 22},${cy} L${x(p.value) + 17},${cy + 4}`, stroke: col, "stroke-width": 2, fill: "none" }, svg);
      const filled = p.confidence === "reported";
      const c = el("circle", { cx: x(p.value), cy, r: 5.5, fill: filled ? col : css("--surface-1"), stroke: col, "stroke-width": 2 }, svg);
      el("text", { x: x(p.value) + (lb ? 26 : 9), y: cy + 4, "font-size": 10 }, svg).textContent = `${lb ? "≥" : ""}${Math.round(p.value * 100)}%`;
      hover(c, `<b>${esc(who)}</b>${lb ? "at least " : ""}${Math.round(p.value * 100)}% inference${badge(p.confidence)} · ${esc(p.as_of)}${forecast?' · forecast':''}<br><span class="muted">${esc(p.note)}</span><br>${src(p.source_url)}`);
    });
  }
  onTheme(draw); draw();
})();
