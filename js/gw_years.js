// Facility power at Epoch-tracked frontier sites, GW per year, stacked by site owner: online at year end or added during the year.
(function () {
  const TL = window.DC_TIMELINES; if (!TL || !$("#gwYearSvg")) return;
  const YEARS = TL.years, LABEL = y => y === "final" ? "Final (≤2030)" : "End-" + y, COLORS = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
  let mode = "total", credit = "owner";
  const SRC = () => credit === "user" && TL.by_user ? TL.by_user : TL.providers, SXNAME = () => credit === "user" ? "SpaceXAI" : "xAI / SpaceX";
  // Company-stated plans above the tracked sites (public, dated), drawn hatched on top of the tracked bar.
  const SX = window.DEMAND_RESEARCH?.watch?.spacex_2027, PLAN = SX ? [{ owner: "xAI / SpaceX", from: "2027", mw: SX.company_gw * 1000 * (SX.facility_factor || 1), label: `SpaceX CEO target ≈${SX.company_gw} GW nameplate (≈IT power) by end-2027, Q3 call Oct 20 (grade B), shown as ≈${(SX.company_gw * (SX.facility_factor || 1)).toFixed(0)} GW facility power at PUE ${SX.facility_factor} to match Epoch; held flat after 2027. Filed: ${SX.filed_gw} GW nameplate at ${SX.filed_date}. Epoch tracks 3 SpaceX sites, missing Macroharder, Minihard, Gun Range, Spam, Starbase.`, url: SX.source_url }] : [];
  const gapTotal = (pl, i) => { const y = YEARS[i], t = SRC()[SXNAME()]?.mw[y] || 0; return (y === "final" || y >= pl.from) ? Math.max(0, pl.mw - t) : 0; };
  const gap = (pl, i) => mode === "total" || i === 0 ? gapTotal(pl, i) : Math.max(0, gapTotal(pl, i) - gapTotal(pl, i - 1));
  const value = (p, i) => { const y = YEARS[i]; return mode === "total" || i === 0 ? p.mw[y] : Math.max(0, p.mw[y] - p.mw[YEARS[i - 1]]); };
  function draw() {
    const svg = $("#gwYearSvg"); svg.innerHTML = "";
    const all = Object.entries(SRC()).map(([name, p]) => ({ name, p, sites: p.sites?.length || 0 }));
    const rank = all.sort((a, b) => b.p.mw.final - a.p.mw.final), top = rank.slice(0, COLORS.length), rest = rank.slice(COLORS.length);
    const series = [...top.map((r, i) => ({ ...r, color: css(COLORS[i]) })), ...(rest.length ? [{ name: `Other (${rest.length})`, members: rest, color: css("--muted") || "#999" }] : [])];
    const val = (s, i) => s.members ? s.members.reduce((a, m) => a + value(m.p, i), 0) : value(s.p, i);
    const plans = credit === "owner" && $("#gwYearPlans")?.checked ? PLAN : [];
    const totals = YEARS.map((_, i) => series.reduce((a, s) => a + val(s, i), 0)), max = Math.max(...totals.map((t, i) => t + plans.reduce((a, pl) => a + gap(pl, i), 0))) * 1.1 / 1000;
    const narrow = (svg.getBoundingClientRect().width || 900) < 600, W = narrow ? 420 : 900, H = narrow ? 300 : 370, fs = narrow ? 13 : 12;
    const L = narrow ? 44 : 52, R = W - 12, T = 18, B = H - 40, bw = (R - L) / YEARS.length * 0.58, cx = i => L + (i + .5) * (R - L) / YEARS.length, y = gw => B - gw / max * (B - T);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const defs = el("defs", {}, svg), pat = el("pattern", { id: "gwHatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 6, height: 6, fill: css("--surface-1") }, pat); el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: css("--s6"), "stroke-width": 3 }, pat);
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
      const tracked = acc;
      plans.forEach(pl => { const gw = gap(pl, i) / 1000; if (gw <= 0) return;
        const r = el("rect", { x: cx(i) - bw / 2, y: y(acc + gw), width: bw, height: y(acc) - y(acc + gw), fill: "url(#gwHatch)", stroke: css("--s6"), "stroke-width": 1, "data-gw-plan": pl.owner }, svg);
        hover(r, `<b>${esc(SXNAME())} · ${LABEL(yr)}</b>+${gw.toFixed(1)} GW ${mode === "total" ? "above tracked sites" : "added above tracked sites"}<br><span class="muted">${esc(pl.label)}</span><br>${src(pl.url)}`); acc += gw; });
      el("text", { x: cx(i), y: y(acc) - 6, "text-anchor": "middle", "font-size": fs, "font-weight": 600, class: "ink" }, svg).textContent = acc > tracked ? `${tracked.toFixed(1)} + ${(acc - tracked).toFixed(1)}${narrow ? "" : " GW"}` : `${acc.toFixed(1)}${narrow ? "" : " GW"}`;
      el("text", { x: cx(i), y: B + 18, "text-anchor": "middle", "font-size": fs, class: "ink" }, svg).textContent = narrow ? (yr === "final" ? (mode === "added" ? ">2028" : "≤2030") : yr) : mode === "added" && i > 0 ? (yr === "final" ? "After 2028" : "During " + yr) : LABEL(yr);
    });
    $("#gwYearLegend").innerHTML = series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("") + (plans.length ? `<span><i style="background:repeating-linear-gradient(45deg,var(--s6) 0 2px,transparent 2px 5px);outline:1px solid var(--s6)"></i>SpaceX-stated plan above tracked sites</span>` : "");
    const n = credit === "user" ? new Set(Object.values(TL.by_user).flatMap(u => u.sites.map(s => s.name))).size : Object.values(TL.providers).reduce((a, p) => a + (p.sites?.length || 0), 0);
    const oa = YEARS.map((_, i) => ["OpenAI", "Anthropic"].reduce((a, u) => a + (TL.by_user?.[u] ? (mode === "total" || i === 0 ? TL.by_user[u].mw[YEARS[i]] : Math.max(0, TL.by_user[u].mw[YEARS[i]] - TL.by_user[u].mw[YEARS[i - 1]])) : 0), 0) / (totals[i] || 1));
    $("#gwYearNote").textContent = `Epoch AI frontier data-center tracker, ${n} tracked sites worldwide, facility power, ` + (credit === "user" ? `credited to the labs Epoch lists as users (a shared site is split equally; sites without listed users are “Undisclosed user”). OpenAI + Anthropic: ${oa.map((v, i) => `${Math.round(v * 100)}% ${YEARS[i] === "final" ? "final" : YEARS[i]}`).join(" · ")} of tracked power. ` : `credited to the site owner (a lab renting a site, such as Anthropic at Google or Amazon campuses, appears under the owner). `) + `${mode === "added" ? "Added = year-end level minus the previous year-end; the first bar is the end-2025 level. " : ""}Tracked frontier campuses only, so tracked totals are a floor; the hatched segment adds SpaceX’s CEO target of ≈13 GW nameplate by end-2027 (≈17 GW facility power) above its ≈2.5 GW tracked: a spoken target, not tracked construction (filed: 1.7 GW nameplate, Sep 30 2026). SemiAnalysis’s lab-level model runs higher still. Planned levels are Epoch projections and can slip. Retrieved ${String(TL.retrieved_utc).slice(0, 10)}.`;
  }
  $("#gwYearPlans")?.addEventListener("change", draw);
  for (const [id, c] of [["gwCreditOwner", "owner"], ["gwCreditUser", "user"]]) $("#" + id)?.addEventListener("click", () => { credit = c; $("#gwCreditOwner").classList.toggle("on", c === "owner"); $("#gwCreditUser").classList.toggle("on", c === "user"); draw(); });
  for (const [id, m] of [["gwYearTotal", "total"], ["gwYearAdded", "added"]]) $("#" + id).addEventListener("click", () => { mode = m; $("#gwYearTotal").classList.toggle("on", m === "total"); $("#gwYearAdded").classList.toggle("on", m === "added"); draw(); });
  onTheme(draw); draw();
  let wide = innerWidth >= 600; addEventListener("resize", () => { if ((innerWidth >= 600) !== wide) { wide = !wide; draw(); } });
})();
