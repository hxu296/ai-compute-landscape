// Facility power at Epoch-tracked frontier sites, GW per year, stacked by site owner: online at year end or added during the year.
(function () {
  const TL = window.DC_TIMELINES; if (!TL || !$("#gwYearSvg")) return;
  const YEARS = TL.years, LABEL = y => y === "final" ? "Final (≤2030)" : "End-" + y, COLORS = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
  let mode = "total";
  const value = (p, i) => { const y = YEARS[i]; return mode === "total" || i === 0 ? p.mw[y] : Math.max(0, p.mw[y] - p.mw[YEARS[i - 1]]); };
  function draw() {
    const svg = $("#gwYearSvg"); svg.innerHTML = "";
    const all = Object.entries(TL.providers).map(([name, p]) => ({ name, p, sites: p.sites?.length || 0 }));
    const rank = all.sort((a, b) => b.p.mw.final - a.p.mw.final), top = rank.slice(0, COLORS.length), rest = rank.slice(COLORS.length);
    const series = [...top.map((r, i) => ({ ...r, color: css(COLORS[i]) })), ...(rest.length ? [{ name: `Other (${rest.length})`, members: rest, color: css("--muted") || "#999" }] : [])];
    const val = (s, i) => s.members ? s.members.reduce((a, m) => a + value(m.p, i), 0) : value(s.p, i);
    const totals = YEARS.map((_, i) => series.reduce((a, s) => a + val(s, i), 0)), max = Math.max(...totals) * 1.1 / 1000;
    const narrow = (svg.getBoundingClientRect().width || 900) < 600, W = narrow ? 420 : 900, H = narrow ? 300 : 370, fs = narrow ? 13 : 12;
    const L = narrow ? 44 : 52, R = W - 12, T = 18, B = H - 40, bw = (R - L) / YEARS.length * 0.58, cx = i => L + (i + .5) * (R - L) / YEARS.length, y = gw => B - gw / max * (B - T);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    if (narrow) el("text", { x: 4, y: 11, "font-size": fs - 1 }, svg).textContent = "GW";
    const step = max > 40 ? 10 : max > 16 ? 5 : max > 6 ? 2 : 1;
    for (let v = 0; v <= max; v += step) {
      el("line", { x1: L, x2: R, y1: y(v), y2: y(v), stroke: css("--grid") }, svg);
      el("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", "font-size": fs - 1 }, svg).textContent = narrow ? `${v}` : `${v} GW`;
    }
    YEARS.forEach((yr, i) => {
      let acc = 0;
      series.forEach(s => {
        const gw = val(s, i) / 1000; if (gw <= 0) return;
        const r = el("rect", { x: cx(i) - bw / 2, y: y(acc + gw), width: bw, height: Math.max(.5, y(acc) - y(acc + gw)), fill: s.color, stroke: css("--surface-1"), "stroke-width": .6, "data-gw-segment": s.name }, svg);
        const who = s.members ? s.members.map(m => `${esc(m.name)} ${(value(m.p, i) / 1000).toFixed(2)} GW`).join("<br>") : `${s.sites} tracked site${s.sites === 1 ? "" : "s"}`;
        hover(r, `<b>${esc(s.name)} · ${LABEL(yr)}</b>${gw.toFixed(2)} GW ${mode === "total" ? "online" : i === 0 ? "online (first year shown)" : "added during the year"} · ${(100 * gw * 1000 / totals[i]).toFixed(0)}% of the bar<br><span class="muted">${who}</span>`);
        acc += gw;
      });
      el("text", { x: cx(i), y: y(acc) - 6, "text-anchor": "middle", "font-size": fs, "font-weight": 600, class: "ink" }, svg).textContent = `${acc.toFixed(1)}${narrow ? "" : " GW"}`;
      el("text", { x: cx(i), y: B + 18, "text-anchor": "middle", "font-size": fs, class: "ink" }, svg).textContent = narrow ? (yr === "final" ? (mode === "added" ? ">2028" : "≤2030") : yr) : mode === "added" && i > 0 ? (yr === "final" ? "After 2028" : "During " + yr) : LABEL(yr);
    });
    $("#gwYearLegend").innerHTML = series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("");
    const n = Object.values(TL.providers).reduce((a, p) => a + (p.sites?.length || 0), 0);
    $("#gwYearNote").textContent = `Epoch AI frontier data-center tracker, ${n} tracked sites worldwide, facility power, credited to the site owner (a lab renting a site, such as Anthropic at Google or Amazon campuses, appears under the owner). ${mode === "added" ? "Added = year-end level minus the previous year-end; the first bar is the end-2025 level. " : ""}Tracked frontier campuses only, so totals are a floor: SpaceX alone reports ≈13 GW planned for 2027 against ≈2.5 GW tracked. Planned levels are Epoch projections and can slip. Retrieved ${String(TL.retrieved_utc).slice(0, 10)}.`;
  }
  for (const [id, m] of [["gwYearTotal", "total"], ["gwYearAdded", "added"]]) $("#" + id).addEventListener("click", () => { mode = m; $("#gwYearTotal").classList.toggle("on", m === "total"); $("#gwYearAdded").classList.toggle("on", m === "added"); draw(); });
  onTheme(draw); draw();
  let wide = innerWidth >= 600; addEventListener("resize", () => { if ((innerWidth >= 600) !== wide) { wide = !wide; draw(); } });
})();
