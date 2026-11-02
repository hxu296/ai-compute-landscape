// Tiles, China, provider cards, method and gaps.
(function () {
  const SOFT = /potential|not committed|optional|backstop|up to/i;
  const cmp = NC.contracts.filter(c => !c.excluded && c.value_usd && c.kind === "compute" && !SOFT.test(c.structure || ""));
  const committed = cmp.reduce((a, c) => a + c.value_usd, 0);
  const h100 = NC.prices.filter(p => p.sku === "H100" && p.basis === "on-demand per GPU-hour").map(p => p.usd).sort((a, b) => a - b);
  const med = h100.length ? h100[Math.floor(h100.length / 2)] : null;
  const ep = NC.providers.filter(p => p.epoch && p.epoch.length).map(p => [p.name, p.epoch.at(-1)[1]]).sort((a, b) => b[1] - a[1]);
  const cw = PROV["CoreWeave"].latest;
  $("#tiles").innerHTML = [
    [money(committed), `disclosed value of ${cmp.length} firm compute-service contracts (leases, hardware orders, options, backstops and framework deals excluded)`],
    [`${(ep[0][1] / 1e6).toFixed(1)}M`, `H100-equivalents at ${ep[0][0]}, the largest fleet (Epoch estimate, end-2025)`],
    [cw.mw_online ? `${(cw.mw_online.value / 1000).toFixed(1)} GW` : "", `online at CoreWeave, the largest neocloud (${cw.mw_contracted ? (cw.mw_contracted.value / 1000).toFixed(1) + " GW contracted" : ""})`],
    [med ? `$${med.toFixed(2)}` : "", `median on-demand H100 price per GPU-hour across ${h100.length} providers`],
    ["55–67%", "of AI compute (Deloitte) or cloud AI spend (Gartner) expected to serve inference in 2026; see Inference vs training"],
  ].map(([n, l]) => `<div class="card tile"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");
  const c = NC.counts;
  $("#asof").innerHTML = `Data as of ${NC.built}: ${c.facts.toLocaleString()} facts, ${c.contracts} contracts, ${c.prices} price points; ${c.reported.toLocaleString()} reported,
    ${c.derived} derived, ${c.estimated} estimated; ${c.gaps} known gaps listed under Method.`;
  // China chips
  (function china() {
    const draw = () => { const svg = $("#cnSvg"); svg.innerHTML = "";
      const rows = [...NC.china_chips].sort((a, b) => b.value - a.value), max = Math.max(...rows.map(r => r.value)), L = 120, R = 380, rh = 32;
      svg.setAttribute("viewBox", `0 0 440 ${rows.length * rh + 10}`);
      rows.forEach((r, i) => { const y = 6 + i * rh, nv = /^(H|A)\d|MI/.test(r.chip);
        el("text", { x: L - 6, y: y + 18, "text-anchor": "end", class: "ink" }, svg).textContent = r.chip;
        const b = el("rect", { x: L, y: y + 6, width: Math.max(2, r.value / max * (R - L)), height: 18, rx: 4, fill: css(nv ? "--s1" : "--s2") }, svg);
        el("text", { x: L + r.value / max * (R - L) + 4, y: y + 19 }, svg).textContent = num(r.value);
        hover(b, `<b>${esc(r.chip)}</b>${num(r.value)} units delivered to China by end-2025 (Epoch AI estimate, aggregate; not by company)`); });
    };
    onTheme(draw); draw();
    const cn = NC.providers.filter(p => p.group === "China");
    table("#tChina", cn, [{ k: "name", h: "Company" }, { k: "cap", h: "Quarterly capex", f: r => cell(r.latest.capex_usd, "usd") },
      { k: "rev", h: "Quarterly revenue", f: r => cell(r.latest.revenue_usd, "usd") }, { k: "mw", h: "MW online", f: r => cell(r.latest.mw_online, "mw") },
      { k: "gpu", h: "Accelerators", f: r => cell(r.latest.gpus_total, "gpus") }]);
  })();
  // provider cards
  const ctl = $("#provCtl"); let grp = "All";
  ["All", "Hyperscaler", "Neocloud", "Host", "Marketplace", "China"].forEach(g => { const b = document.createElement("button"); b.textContent = g; b.dataset.g = g;
    b.onclick = () => { grp = g; cards(); }; ctl.appendChild(b); });
  function cards() {
    ctl.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.g === grp));
    const ps = NC.providers.filter(p => grp === "All" || p.group === grp);
    $("#provCards").innerHTML = ps.map(p => { const l = p.latest, host = p.group === "Host";
      const items = [!host && ["GPUs installed", cell(l.gpus_total, "gpus")], p.epoch && p.epoch.length && ["Epoch estimate", `${num(p.epoch.at(-1)[1])} H100e${badge("estimated")} <span class="muted small">${ym(p.epoch.at(-1)[0])}</span>`],
        ["MW online", cell(l.mw_online, "mw")], ["MW contracted", cell(l.mw_contracted, "mw")], l.mw_pipeline && ["MW pipeline", cell(l.mw_pipeline, "mw")],
        p.mw_planned && p.mw_planned.length && ["MW planned", p.mw_planned.map(r => `${esc(r.site || "")} ${num(r.value)} <span class="muted small">${esc(r.target_status || r.target_date || "")}</span>`).join("<br>")],
        ["Backlog", cell(l.backlog_usd, "usd")], ["Quarterly revenue", cell(l.revenue_usd, "usd")], ["Quarterly capex", cell(l.capex_usd, "usd")],
        l.valuation_usd && ["Valuation", cell(l.valuation_usd, "usd")], host && p.tenants.length && ["Tenants", esc(p.tenants.join(", "))]].filter(Boolean);
      return `<div class="card pcard"><h3>${esc(p.name)} <span class="muted small">${p.group} · ${p.n_facts} facts</span></h3><dl>${items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div>`; }).join("");
  }
  cards();
  $("#methodBox").innerHTML = `<p><b>How numbers were collected.</b> Six research passes (hyperscalers, neoclouds and hosts, contracts, pricing, China,
    inference and growth) plus gap-filling passes, from SEC filings, earnings releases and calls, company pages and price APIs, reputable press, and
    Epoch AI's public datasets. Each row keeps its source link. Three rounds of independent fact-checking corrected labels (pipeline vs contracted,
    company vs segment, owned vs tenant GPUs), exchange rates and duplicates; corrections are kept apart from the raw research.</p>
    <p><b>Rules.</b> Hosts carry MW only; GPUs belong to their owners. Money uses the cloud segment where one is reported. Estimates from power use
    1,400 W IT per Hopper GPU and 2,000 W per GB200/GB300 GPU (PUE 1.3 from gross) and are shown as ±30% ranges unless the source gives a range.
    H100-equivalents are a compute yardstick at dense peak, not delivered throughput. Prices are converted at the ECB rate on the source date.
    Figures that mix online and planned capacity are marked and never summed as contracted.</p>
    <p><b>What this cannot tell you.</b> Hyperscaler fleets are Epoch's model, not disclosures. Neocloud GPU counts are mostly inferred from power.
    Inference vs training is a set of statements, not a measurement. ByteDance's fleet is a weak bottom-up estimate.</p>
    <p><b>Credits.</b> Fleet estimates and lab spending breakdowns are from <a href="https://epoch.ai/data" target="_blank" rel="noopener">Epoch AI</a>
    (CC BY 4.0). Price indices are Silicon Data and Ornn readings as published. Every other figure links to its own source in the tables and tooltips.
    The full dataset ships with the page as <a href="data/nc.js">data/nc.js</a>.</p>`;
  $("#gapN").textContent = NC.gaps.length;
  table("#tGaps", NC.gaps, [{ k: "subject", h: "Subject" }, { k: "metric", h: "Metric" }, { k: "why", h: "Why missing" }, { k: "best_lead", h: "Best lead" }]);
})();
