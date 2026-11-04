// China, provider reference, method and source coverage.
(function () {
  $("#byline").innerHTML = `${NC.counts.facts.toLocaleString()} sourced facts · ${NC.providers.length} provider profiles · compiled ${String(NC.built).slice(0, 10)}`;
  // takeaways computed from the data, so they stay true when the data is rebuilt
  (function takeaways() {
    // Floors (a minimum value or a maximum capacity) are not point prices, so medians leave them out.
    const kw = NC.contracts.filter(c => !c.excluded), point = kw.filter(c => !kwFloor(c)), all = point.map(c => c.implied_allin_usd_per_kw_month).filter(Boolean), ls = point.map(c => c.implied_usd_per_kw_month).filter(Boolean);
    const floors = kw.filter(c => kwFloor(c) && (c.implied_allin_usd_per_kw_month || c.implied_usd_per_kw_month));
    const mdn = v => { v = [...v].sort((a, b) => a - b); return (v[Math.floor((v.length-1) / 2)]+v[Math.ceil((v.length-1) / 2)])/2; };
    $("#kwNote").textContent = `Medians across available unit-price calculations: all-in compute $${Math.round(mdn(all)).toLocaleString()}/kW-month (n=${all.length}); powered-space leases $${Math.round(mdn(ls)).toLocaleString()}/kW-month (n=${ls.length}); gap ≈$${Math.round((mdn(all) - mdn(ls)) / 10) * 10}/kW-month. ${floors.length ? `Floors are left out of the medians: ${floors.map(c => `${c.buyer} ← ${c.supplier} (≥$${Math.round(c.implied_allin_usd_per_kw_month || c.implied_usd_per_kw_month)})`).join(", ")}. ` : ""}Samples differ in geography, power basis, delivery date and contract terms.`;
  })();
  const c = NC.counts;
  $("#asof").innerHTML = `Built ${NC.built}: ${c.facts.toLocaleString()} facts, ${c.contracts} contracts, ${c.prices} price points; ${c.reported.toLocaleString()} reported,
    ${c.derived} derived, ${c.estimated} estimated; ${c.gaps} known gaps listed under Method.`;
  if(NC.live?.checked_at)$('#asof').innerHTML+=` <br>Public benchmark feeds checked ${esc(NC.live.checked_at)}; company facts retain their individual observation dates. ${src('data/live.json','Feed freshness and source status')}`;
  // China chips
  (function china() {
    const draw = () => { const svg = $("#cnSvg"); svg.innerHTML = "";
      const rows = [...NC.china_chips].sort((a, b) => b.value - a.value), max = Math.max(...rows.map(r => r.value)), L = 120, R = 380, rh = 32;
      svg.setAttribute("viewBox", `0 0 440 ${rows.length * rh + 10}`);
      rows.forEach((r, i) => { const y = 6 + i * rh, nv = /^(H|A)\d|MI/.test(r.chip);
        el("text", { x: L - 6, y: y + 18, "text-anchor": "end", class: "ink" }, svg).textContent = r.chip;
        const b = el("rect", { x: L, y: y + 6, width: Math.max(2, r.value / max * (R - L)), height: 18, rx: 4, fill: css(nv ? "--s1" : "--s2") }, svg);
        el("text", { x: L + r.value / max * (R - L) + 4, y: y + 19 }, svg).textContent = num(r.value);
        hover(b, `<b>${esc(r.chip)}</b>${num(r.value)} units delivered to China by end-2025 (Epoch AI estimate, aggregate; not by company)<br>${src(r.source_url)}`); });
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
    const q=$("#providerSearch").value.toLowerCase();
    const ps = NC.providers.filter(p => (grp === "All" || p.group === grp) && (p.name+" "+p.group).toLowerCase().includes(q));
    $("#providerCount").textContent=`${ps.length} providers`;
    $("#provCards").innerHTML = ps.map(p => { const l = p.latest, host = p.group === "Host", epoch=(p.epoch||[]).findLast(r=>r[0]<='2025-12-31');
      const items = [!host && ["GPUs installed", cell(l.gpus_total, "gpus")], epoch && ["Epoch estimate · common date", `${num(epoch[1])} H100e${badge("estimated")} <span class="muted small">${ym(epoch[0])}</span> ${src('https://epoch.ai/data/ai-chip-owners-documentation/methodology','↗')}`],
        ["MW online", cell(l.mw_online, "mw")], [p.name==="VNET"?"MW committed within in-service fleet":"MW contracted (source scope)", cell(l.mw_contracted, "mw")], l.mw_utilized && ["MW utilized",cell(l.mw_utilized,"mw")], l.mw_order_wins && ["New order wins (period flow)",cell(l.mw_order_wins,"mw")], l.mw_pipeline && ["MW pipeline", cell(l.mw_pipeline, "mw")],
        p.mw_planned && p.mw_planned.length && ["MW planned", p.mw_planned.map(r => `${esc(r.site || r.scope || "")} ${cell(r,"mw")} <span class="muted small">target ${esc(r.target_status || r.target_date || "not dated")}</span>`).join("<br>")],
        ["Backlog", cell(l.backlog_usd, "usd")], ["Quarterly revenue (scope shown)", cell(l.revenue_usd, "usd")], ["Quarterly capex", cell(l.capex_usd, "usd")],
        l.valuation_usd && ["Valuation", cell(l.valuation_usd, "usd")], host && p.tenants.length && ["Tenants", esc(p.tenants.join(", "))]].filter(Boolean);
      // Flag profiles whose newest dated observation is more than six months before the build date.
      const newest=Object.values(l||{}).filter(v=>v&&v.as_of).map(v=>String(v.as_of)).sort().at(-1),cutoff=new Date(Date.parse(String(NC.built).slice(0,10))-182*864e5).toISOString().slice(0,7),stale=newest&&newest.slice(0,7)<cutoff;
      return `<div class="card pcard${stale?' stale':''}"><h3>${esc(p.name)}${conflictBadge(p.name,"mw_online")}${conflictBadge(p.name,"gpus_total")} <span class="muted small">${p.group} · ${p.n_facts} facts</span>${stale?` <span class="stale-flag" title="Newest dated observation is more than six months old">latest data ${esc(newest.slice(0,7))}</span>`:''}</h3><dl>${items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div>`; }).join("");
  }
  $("#providerSearch").oninput=cards;cards();
  $("#methodBox").innerHTML = `<p><b>Sources and definitions.</b> SEC filings, earnings releases and calls, company pages and price APIs, named press reports and Epoch AI's public datasets provide the evidence. Each row keeps its source. Pipeline, contracted and online power are separate measures; company and segment revenue retain their scope. Hosts and tenants can refer to the same buildings, and dated observations are not additive.</p>
    <p><b>Rules.</b> Hosts carry MW only; GPUs belong to their owners. Money uses the cloud segment where one is reported. Estimates from power use
    1,400 W IT per Hopper GPU and 2,000 W per GB200/GB300 GPU (PUE 1.3 from gross). Source ranges are retained where available; other estimates carry an approximation mark.
    H100-equivalents are a compute yardstick at dense peak, not delivered throughput. Prices are converted at the ECB rate on the source date.
    Figures that mix online and planned capacity are marked and never summed as contracted.</p>
    <p><b>What this cannot tell you.</b> Hyperscaler fleets are Epoch's model, not disclosures. Neocloud GPU counts are mostly inferred from power.
    Inference vs training is a set of statements, not a measurement. ByteDance's fleet is a weak bottom-up estimate.</p>
    <p><b>Credits.</b> Fleet estimates and lab spending breakdowns are from <a href="https://epoch.ai/data" target="_blank" rel="noopener">Epoch AI</a>
    (CC BY 4.0). Price references link to Silicon Data, Ornn, SemiAnalysis and Compute Desk; missing current fixings stay missing. Source links are provenance, not a guarantee that every historical row has been independently re-read. The <a href="AUDIT.md">source audit</a> records evidence limits and selection rules.
    Exact source URLs and formulas appear beside the affected charts. No complete company-wide hyperscaler power total or current private contract fixing is inferred.</p><p>Hover, focus or tap source-note badges to compare the dated claims and see the display decision. Red marks identify unresolved factual conflicts; neutral marks identify changed evidence or different definitions. The public presentation dataset ships with the page as <a href="data/nc.js">data/nc.js</a>.</p>`;
  table("#tComparisons",NC.comparisons||[],[{k:"name",h:"Survey",f:r=>src(r.url,esc(r.name))},{k:"scope",h:"Focus"},{k:"strength",h:"Strength of the inspected source"},{k:"ours",h:"This page’s contribution and limit"}]);
  $("#gapN").textContent = NC.gaps.length;
  table("#tGaps", NC.gaps, [{ k: "subject", h: "Subject" }, { k: "metric", h: "Metric" }, { k: "why", h: "Why missing" }, { k: "best_lead", h: "Best lead" }]);
})();
