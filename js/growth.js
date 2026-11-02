// Growth: small multiples, one company per panel on its own scale, with the multiple since the first point.
(function () {
  const METRICS = [["revenue_usd", "Quarterly revenue"], ["mw_online", "MW online"], ["backlog_usd", "Backlog"]];
  let metric = "revenue_usd";
  const ctl = $("#growthCtl");
  METRICS.forEach(([k, l]) => { const b = document.createElement("button"); b.textContent = l; b.dataset.k = k; b.onclick = () => { metric = k; draw(); }; ctl.appendChild(b); });
  function draw() {
    ctl.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.k === metric));
    const grid = $("#growthGrid"); grid.innerHTML = "";
    const subs = Object.entries(NC.growth).filter(([, ms]) => ms[metric] && ms[metric].length >= 3)
      .map(([s, ms]) => { const all = ms[metric].filter(p => p[0] >= "2023-01"), i0 = all.findIndex(p => p[1] > 0), pts = i0 < 0 ? [] : all.slice(i0); return { s, pts, mult: pts.length ? pts.at(-1)[1] / pts[0][1] : 0 }; })
      .filter(x => x.pts.length >= 3).sort((a, b) => b.mult - a.mult);
    if (!subs.length) { grid.innerHTML = `<p class="muted">No company has 3+ dated points for this metric.</p>`; return; }
    subs.forEach(({ s, pts, mult }) => {
      const card = document.createElement("div"); card.className = "card";
      const fmt = v => metric === "mw_online" ? `${num(v)} MW` : money(v);
      card.innerHTML = `<h4>${esc(s)}</h4><div class="mult">${fmt(pts[0][1])} (${ym(pts[0][0])}) → ${fmt(pts.at(-1)[1])} (${ym(pts.at(-1)[0])}) · <b>${mult.toFixed(1)}×</b></div>`;
      const svg = el("svg", { viewBox: "0 0 260 110" }); card.appendChild(svg); grid.appendChild(card);
      const t0 = Date.parse(pts[0][0]), t1 = Date.parse(pts.at(-1)[0]) || t0 + 1, vmax = Math.max(...pts.map(p => p[1]));
      const x = d => 8 + (Date.parse(d) - t0) / (t1 - t0 || 1) * 240, y = v => 100 - v / vmax * 88;
      el("line", { x1: 8, x2: 248, y1: 100, y2: 100, stroke: css("--grid") }, svg);
      el("path", { d: pts.map((p, i) => `${i ? "L" : "M"}${x(p[0])},${y(p[1])}`).join(""), fill: "none", stroke: css("--s1"), "stroke-width": 2 }, svg);
      pts.forEach(p => { const c = el("circle", { cx: x(p[0]), cy: y(p[1]), r: p[2] === "reported" ? 3.5 : 3, fill: p[2] === "reported" ? css("--s1") : css("--surface-1"),
        stroke: css("--s1"), "stroke-width": 1.5 }, svg);
        hover(c, `<b>${esc(s)}</b>${ym(p[0])}: ${fmt(p[1])}${badge(p[2])}<br><span class="muted">${esc(p[3] || "")}</span>`); });
    });
  }
  onTheme(draw); draw();
})();
