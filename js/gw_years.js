// Facility power at Epoch-tracked frontier sites, GW per year, stacked by site owner: online at year end or added during the year.
(function () {
  const TL = window.DC_TIMELINES; if (!TL || !$("#gwYearSvg")) return;
  const YEARS = TL.years, LABEL = y => y === "final" ? "Final (≤2030)" : "End-" + y, COLORS = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
  let mode = "total", credit = "owner";
  const SRC = () => credit === "user" && TL.by_user ? TL.by_user : TL.providers, SXNAME = () => credit === "user" ? "SpaceXAI" : "xAI / SpaceX";
  // User view: the labs in a fixed order (then Other, then Undisclosed user on top); Epoch's "SpaceXAI" is shown under the site-wide name.
  const USER_ORDER = ["OpenAI", "Anthropic", "Google DeepMind", "Meta", "Microsoft", "SpaceXAI", "ByteDance"], DISPLAY = n => n === "SpaceXAI" ? "xAI / SpaceX" : n;
  // Company-stated plans above the tracked sites (public, dated), drawn hatched on top of the tracked bar.
  const SX = window.DEMAND_RESEARCH?.watch?.spacex_2027, PLAN = SX ? [{ owner: "xAI / SpaceX", from: "2027", mw: SX.company_gw * 1000 * (SX.facility_factor || 1), label: `SpaceX CEO target ≈${SX.company_gw} GW nameplate (≈IT power) by end-2027, Q3 call Oct 20 (grade B), shown as ≈${(SX.company_gw * (SX.facility_factor || 1)).toFixed(0)} GW facility power at PUE ${SX.facility_factor} to match Epoch; held flat after 2027. Filed: ${SX.filed_gw} GW nameplate at ${SX.filed_date}. Epoch tracks 3 SpaceX sites, missing Macroharder, Minihard, Gun Range, Spam, Starbase.`, url: SX.source_url }] : [];
  const gapTotal = (pl, i) => { const y = YEARS[i], t = SRC()[SXNAME()]?.mw[y] || 0; return (y === "final" || y >= pl.from) ? Math.max(0, pl.mw - t) : 0; };
  const gap = (pl, i) => mode === "total" || i === 0 ? gapTotal(pl, i) : Math.max(0, gapTotal(pl, i) - gapTotal(pl, i - 1));
  const value = (p, i) => { const y = YEARS[i]; return mode === "total" || i === 0 ? p.mw[y] : Math.max(0, p.mw[y] - p.mw[YEARS[i - 1]]); };
  function draw() {
    const svg = $("#gwYearSvg"); svg.innerHTML = "";
    const all = Object.entries(SRC()).map(([name, p]) => ({ name, p, sites: p.sites?.length || 0 }));
    const rank = all.sort((a, b) => b.p.mw.final - a.p.mw.final);
    // Who is shown by name: the owner view keeps the eight largest owners; the user view names the labs, in a fixed order.
    const user = credit === "user", und = r => /^(Undisclosed|Shared site)/.test(r.name);
    const named = user ? USER_ORDER.map(n => rank.find(r => r.name === n)).filter(Boolean) : rank.slice(0, COLORS.length).filter(r => !und(r));
    const undis = rank.filter(und).filter(r => user || rank.slice(0, COLORS.length).includes(r)), rest = rank.filter(r => !named.includes(r) && !undis.includes(r));
    // Stack: named companies (site-wide company colours), then "Other" (grey), then "Undisclosed" on top, hatched so it does not read as a company.
    const series = [...named.map(r => ({ ...r, label: DISPLAY(r.name), color: companyColor(r.name) })), ...(rest.length ? [{ name: `Other (${rest.length})`, label: `Other (${rest.length})`, members: rest, color: css("--c-other") }] : []),
      ...undis.sort((a, b) => /^Shared/.test(a.name) ? -1 : /^Shared/.test(b.name) ? 1 : 0).map(r => /^Shared/.test(r.name)
        ? ({ ...r, label: r.name, color: "url(#gwSharedHatch)", swatch: `repeating-linear-gradient(-45deg,var(--chart-axis) 0 1.5px,var(--wash) 1.5px 4px)`, shared: true })
        : ({ ...r, label: r.name, color: "url(#gwUndHatch)", swatch: `repeating-linear-gradient(45deg,var(--c-other) 0 2px,var(--paper) 2px 4px)`, undisclosed: true }))];
    const val = (s, i) => s.members ? s.members.reduce((a, m) => a + value(m.p, i), 0) : value(s.p, i);
    const plans = credit === "owner" && $("#gwYearPlans")?.checked ? PLAN : [];
    const totals = YEARS.map((_, i) => series.reduce((a, s) => a + val(s, i), 0)), bars = totals.map((t, i) => t + plans.reduce((a, pl) => a + gap(pl, i), 0)), max = Math.max(...bars) * (user || (svg.getBoundingClientRect().width || 900) < 600 ? 1.2 : 1.1) / 1000;
    // OpenAI + Anthropic share of each bar, from the user data: low = their own sites; high = plus the full power of shared sites they are listed at (an upper bound).
    const lvl = (u, k, i) => { const v = TL.by_user?.[u]?.[k]; if (!v) return 0; return mode === "total" || i === 0 ? v[YEARS[i]] || 0 : Math.max(0, (v[YEARS[i]] || 0) - (v[YEARS[i - 1]] || 0)); };
    const oa = YEARS.map((_, i) => ["OpenAI", "Anthropic"].reduce((a, u) => a + lvl(u, "mw", i), 0) / (totals[i] || 1));
    const oaHi = YEARS.map((_, i) => ["OpenAI", "Anthropic"].reduce((a, u) => a + lvl(u, "mw", i) + lvl(u, "shared_mw", i), 0) / (totals[i] || 1));
    const pct = i => { const lo = Math.round(oa[i] * 100), hi = Math.round(oaHi[i] * 100); return hi > lo ? `${lo}–${hi}%` : `${lo}%`; };
    if ($("#gwYearTitle")) $("#gwYearTitle").textContent = user ? "Who uses the tracked data-center power" : "Tracked data-center power, year by year";
    if ($("#gwYearCaption")) $("#gwYearCaption").textContent = user ? "Each tracked site is credited to the lab Epoch lists as its user. Sites with several users and no stated split are shown as Shared; sites with no listed user as Undisclosed." : "Facility power at the frontier campuses Epoch AI tracks: a floor, not every data center.";
    const planCtl = $("#gwYearPlans")?.closest("label"); if (planCtl) planCtl.hidden = user;
    const narrow = (svg.getBoundingClientRect().width || 900) < 600, W = narrow ? 420 : 900, H = narrow ? 300 : 370, fs = narrow ? 13 : 12;
    const L = narrow ? 44 : 52, R = W - 12, T = 18, B = H - 40, bw = (R - L) / YEARS.length * 0.58, cx = i => L + (i + .5) * (R - L) / YEARS.length, y = gw => B - gw / max * (B - T);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const defs = el("defs", {}, svg), pat = el("pattern", { id: "gwHatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 6, height: 6, fill: css("--surface-1") }, pat); el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: css("--s6"), "stroke-width": 3 }, pat);
    const sp = el("pattern", { id: "gwSharedHatch", width: 5, height: 5, patternUnits: "userSpaceOnUse", patternTransform: "rotate(-45)" }, defs);
    el("rect", { width: 5, height: 5, fill: css("--wash") }, sp); el("line", { x1: 0, y1: 0, x2: 0, y2: 5, stroke: css("--chart-axis"), "stroke-width": 1.5 }, sp);
    const up = el("pattern", { id: "gwUndHatch", width: 5, height: 5, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 5, height: 5, fill: tint(css("--c-other"), .45) }, up); el("line", { x1: 0, y1: 0, x2: 0, y2: 5, stroke: css("--c-other"), "stroke-width": 2 }, up);
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
        // User view: the lab's own sites (final level), then the shared sites it is listed at, which are counted in "Shared site", not here.
        const siteList = () => { const ss = s.p.sites || [], own = user ? ss.filter(x => !x.shared) : ss, sh = user ? ss.filter(x => x.shared) : [], n = own.length, gwf = x => `${(x.mw_final / 1000).toFixed(2)} GW`;
          if (!user || ss[0]?.mw_final == null) return `${ss.length} tracked site${ss.length === 1 ? "" : "s"}`;
          if (s.shared) return `${n} sites with several listed users and no stated split (final level):<br>` + own.slice(0, 10).map(x => `${esc(x.name)} · ${gwf(x)} · ${esc((x.users || []).map(DISPLAY).join(", "))}`).join("<br>") + (n > 10 ? `<br>+${n - 10} more` : "");
          return `${n} site${n === 1 ? "" : "s"} of its own (final level):<br>` + own.slice(0, 8).map(x => `${esc(x.name)} · ${gwf(x)}`).join("<br>") + (n > 8 ? `<br>+${n - 8} more` : "") +
            (sh.length ? `<br>Also listed at ${sh.length} shared site${sh.length > 1 ? "s" : ""}, counted under “Shared site”: ` + sh.map(x => `${esc(x.name)} (${gwf(x)}, with ${esc((x.users || []).filter(u => u !== s.name).map(DISPLAY).join(", "))})`).join("; ") : ""); };
        const who = s.members ? s.members.map(m => `${esc(DISPLAY(m.name))} ${(value(m.p, i) / 1000).toFixed(2)} GW`).join("<br>") : siteList();
        const share = `${(100 * gw * 1000 / totals[i]).toFixed(0)}% of tracked power${mode === "added" && i > 0 ? " added" : ""}` + (bars[i] > totals[i] ? ` · ${(100 * gw * 1000 / bars[i]).toFixed(0)}% of the bar incl. the hatched SpaceX plan` : "");
        hover(r, `<b>${esc(s.label || s.name)} · ${LABEL(yr)}</b>${gw.toFixed(2)} GW ${mode === "total" ? "online" : i === 0 ? "online (first year shown)" : "added during the year"} · ${share}<br><span class="muted">${who}</span>`);
        acc += gw;
      });
      const tracked = acc;
      plans.forEach(pl => { const gw = gap(pl, i) / 1000; if (gw <= 0) return;
        const r = el("rect", { x: cx(i) - bw / 2, y: y(acc + gw), width: bw, height: y(acc) - y(acc + gw), fill: "url(#gwHatch)", stroke: css("--s6"), "stroke-width": 1, "data-gw-plan": pl.owner }, svg);
        hover(r, `<b>${esc(SXNAME())} · ${LABEL(yr)}</b>+${gw.toFixed(1)} GW ${mode === "total" ? "above tracked sites" : "added above tracked sites"}<br><span class="muted">${esc(pl.label)}</span><br>${src(pl.url)}`); acc += gw; });
      // Phones: the tracked total and the plan increment go on two lines so neighbouring bars' labels do not run together.
      if (narrow && acc > tracked) { el("text", { x: cx(i), y: y(acc) - 6, "text-anchor": "middle", class: "ink", "font-weight": 600 }, svg).textContent = tracked.toFixed(1); el("text", { x: cx(i), y: y(acc) - 6 - fs * 1.25, "text-anchor": "middle", class: "share" }, svg).textContent = `+${(acc - tracked).toFixed(1)}`; }
      else el("text", { x: cx(i), y: y(acc) - 6, "text-anchor": "middle", "font-size": fs, "font-weight": 600, class: "ink" }, svg).textContent = acc > tracked ? `${tracked.toFixed(1)} + ${(acc - tracked).toFixed(1)}${narrow ? "" : " GW"}` : `${acc.toFixed(1)}${narrow ? "" : " GW"}`;
      if (user && totals[i] > 0) el("text", { x: cx(i), y: y(acc) - 6 - fs * 1.35, "text-anchor": "middle", class: "share", "data-gw-share": YEARS[i] }, svg).textContent = narrow ? pct(i) : `OpenAI + Anthropic: ${pct(i)}`;
      el("text", { x: cx(i), y: B + 18, "text-anchor": "middle", "font-size": fs, class: "ink" }, svg).textContent = narrow ? (yr === "final" ? (mode === "added" ? ">2028" : "≤2030") : yr) : mode === "added" && i > 0 ? (yr === "final" ? "After 2028" : "During " + yr) : LABEL(yr);
    });
    $("#gwYearLegend").innerHTML = series.map(s => `<span><i style="background:${s.swatch || s.color}"></i>${esc(s.label || s.name)}</span>`).join("") + (user && narrow ? `<span class="legend-note">% above a bar = OpenAI + Anthropic share (own sites – plus shared sites)</span>` : "") + (plans.length ? `<span><i style="background:repeating-linear-gradient(45deg,var(--s6) 0 2px,transparent 2px 5px);outline:1px solid var(--s6)"></i>SpaceX-stated plan above tracked sites</span>` : "");
    const n = credit === "user" ? new Set(Object.values(TL.by_user).flatMap(u => u.sites.map(s => s.name))).size : Object.values(TL.providers).reduce((a, p) => a + (p.sites?.length || 0), 0);
    const sxT = (TL.providers?.["xAI / SpaceX"]?.mw?.["2027"] || 0) / 1000, sxF = SX ? SX.company_gw * (SX.facility_factor || 1) : 0;
    $("#gwYearNote").textContent = `Epoch AI frontier data-center tracker, ${n} tracked sites worldwide, facility power, ` + (credit === "user" ? `credited to the lab Epoch lists as the user. Sites with several listed users and no stated split form one “Shared site (several users)” segment; sites without listed users are “Undisclosed user”. OpenAI + Anthropic: ${YEARS.map((y, i) => `${pct(i)} ${y === "final" ? "final" : y}`).join(" · ")} of tracked power (low: their own sites; high: plus the full power of shared sites they are listed at, an upper bound)${mode === "added" ? " added in each period (first bar: end-2025 level)" : ""}. ` : `credited to the site owner (a lab renting a site, such as Anthropic at Google or Amazon campuses, appears under the owner). `) + `${mode === "added" ? "Added = year-end level minus the previous year-end; the first bar is the end-2025 level. " : ""}Tracked frontier campuses only, so tracked totals are a floor. ${SX ? `The hatched segment (owner view) lifts xAI / SpaceX to its CEO target for end-2027: ≈${SX.company_gw} GW nameplate (≈IT power), ≈${sxF.toFixed(1)} GW facility power at PUE ${SX.facility_factor || 1}, against ≈${sxT.toFixed(1)} GW facility power at its tracked sites, so the hatch adds ≈${Math.max(0, sxF - sxT).toFixed(1)} GW. It is a spoken target, not tracked construction (filed: ${SX.filed_gw} GW nameplate, ${SX.filed_date}). ` : ""}Planned levels are Epoch projections and can slip. Retrieved ${String(TL.retrieved_utc).slice(0, 10)}.`;
  }
  $("#gwYearPlans")?.addEventListener("change", draw);
  for (const [id, c] of [["gwCreditOwner", "owner"], ["gwCreditUser", "user"]]) $("#" + id)?.addEventListener("click", () => { credit = c; $("#gwCreditOwner").classList.toggle("on", c === "owner"); $("#gwCreditUser").classList.toggle("on", c === "user"); draw(); });
  for (const [id, m] of [["gwYearTotal", "total"], ["gwYearAdded", "added"]]) $("#" + id).addEventListener("click", () => { mode = m; $("#gwYearTotal").classList.toggle("on", m === "total"); $("#gwYearAdded").classList.toggle("on", m === "added"); draw(); });
  onTheme(draw); draw();
  let wide = innerWidth >= 600; addEventListener("resize", () => { if ((innerWidth >= 600) !== wide) { wide = !wide; draw(); } });
})();
