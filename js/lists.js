// China, provider reference, method and source coverage.
(function () {
  $("#byline").innerHTML = `${NC.counts.facts.toLocaleString()} sourced facts · ${NC.providers.length} provider profiles · compiled ${String(NC.built).slice(0, 10)}`;
  // takeaways computed from the data, so they stay true when the data is rebuilt
  (function takeaways() {
    // Floors (a minimum value or a maximum capacity) are not point prices, so medians leave them out.
    const kw = NC.contracts.filter(c => !c.excluded), point = kw.filter(c => !kwFloor(c)), all = point.map(c => c.implied_allin_usd_per_kw_month).filter(Boolean), ls = point.map(c => c.implied_usd_per_kw_month).filter(Boolean);
    const floors = kw.filter(c => kwFloor(c) && (c.implied_allin_usd_per_kw_month || c.implied_usd_per_kw_month));
    const mdn = v => { v = [...v].sort((a, b) => a - b); return (v[Math.floor((v.length-1) / 2)]+v[Math.ceil((v.length-1) / 2)])/2; };
    $("#kwNote").textContent = `Median all-in compute: $${Math.round(mdn(all)).toLocaleString()}/kW-month, n=${all.length}. Median powered-space lease: $${Math.round(mdn(ls)).toLocaleString()}/kW-month, n=${ls.length}. Gap ≈$${Math.round((mdn(all) - mdn(ls)) / 10) * 10}/kW-month. ${floors.length ? `Floors are left out of the medians: ${floors.map(c => `${c.buyer} ← ${c.supplier} ≥$${Math.round(c.implied_allin_usd_per_kw_month || c.implied_usd_per_kw_month)}`).join(", ")}. ` : ""}`;
  })();
  const c = NC.counts;
  // Readable timestamps, and contract counts that say what differs from Table 2 (equity, M&A and framework rows are excluded from the deal views).
  const when = t => { const d = new Date(t); return isNaN(d) ? esc(String(t)) : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"; };
  const dealRows = [...NC.contracts, ...(NC.hardware || [])], excl = dealRows.filter(r => r.excluded).length;
  $("#asof").innerHTML = `Built ${when(NC.built)}: ${c.facts.toLocaleString()} facts, ${c.contracts} contract records (${excl} equity, M&A or framework rows excluded from the deal views, which start from 2025 by default), ${c.prices} price points; ${c.reported.toLocaleString()} reported,
    ${c.derived} derived, ${c.estimated} estimated; ${c.gaps} known gaps listed under Method.`;
  if(NC.live?.checked_at)$('#asof').innerHTML+=` <br>Public benchmark feeds checked ${when(NC.live.checked_at)}; company facts retain their individual observation dates. ${src('data/live.json','Feed freshness and source status')}`;
  // China chips
  (function china() {
    const draw = () => { const svg = $("#cnSvg"); svg.innerHTML = "";
      const narrow = (svg.parentElement.getBoundingClientRect().width || 900) < 560, W = narrow ? 380 : 900;
      const rows = [...NC.china_chips].sort((a, b) => b.value - a.value), max = Math.max(...rows.map(r => r.value)), L = narrow ? 108 : 205, R = narrow ? 320 : 730, rh = narrow ? 32 : 30;
      svg.setAttribute("viewBox", `0 0 ${W} ${rows.length * rh + 10}`);
      rows.forEach((r, i) => { const y = 6 + i * rh, nv = /^(H|A)\d|MI/.test(r.chip);
        el("text", { x: L - 12, y: y + 19, "text-anchor": "end", class: "ink" }, svg).textContent = r.chip;
        const b = el("rect", { x: L, y: y + 6, width: Math.max(2, r.value / max * (R - L)), height: 18, rx: 2, fill: css(nv ? "--s1" : "--s2") }, svg);
        el("text", { x: L + r.value / max * (R - L) + 6, y: y + 19, class: "value" }, svg).textContent = num(r.value);
        hover(b, `<b>${esc(r.chip)}</b>${num(r.value)} units delivered to China by end-2025 (Epoch AI estimate, aggregate; not by company)<br>${src(r.source_url)}`); });
    };
    onTheme(draw); draw();
    // Lead finding, computed: China's share of the world token estimate and the chips that dominate its deliveries.
    const est = window.DEMAND_RESEARCH?.global_estimate, cnTok = est?.components.find(c => /China/.test(c.name)), chips = [...NC.china_chips], tot = chips.reduce((s, r) => s + r.value, 0);
    const h20 = chips.filter(r => /^H20$/.test(r.chip)).reduce((s, r) => s + r.value, 0), asc = chips.filter(r => /^Ascend/.test(r.chip)).reduce((s, r) => s + r.value, 0);
    if ($("#chinaLead") && tot) $("#chinaLead").innerHTML = `${cnTok && est ? `<b>China is ≈${Math.round(100 * cnTok.central / est.total.central)}% of the world token estimate.</b> ` : ""}Most accelerators delivered there by end-2025 are NVIDIA’s H20, ${Math.round(100 * h20 / tot)}%, and Huawei’s Ascend, ${Math.round(100 * asc / tot)}%, Epoch estimates.`;
    if ($("#closeChina")) $("#closeChina").innerHTML = `<b>For the answer:</b> Fig. 1 excludes China’s tokens and chips, so China does not change the 2027–28 answer.`;
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
  // Sources and method as a compact definition list: short heads, the same statements and links.
  $("#methodBox").innerHTML = `<dl class="method-list">
    <dt>Evidence</dt><dd>Filings, earnings calls, company pages, price APIs, named press and <a href="https://epoch.ai/data" target="_blank" rel="noopener">Epoch AI</a> datasets (CC BY 4.0). Tags: <b>R</b> reported, <b>D</b> derived by a stated formula, <b>E</b> estimated. The <a href="AUDIT.md">source audit</a> records selection rules and limits.</dd>
    <dt>Rules</dt><dd><ul>
      <li>Online, contracted and pipeline power stay separate and are never summed. Hosts carry MW; GPUs belong to their owners. Money uses the cloud segment where one is reported.</li>
      <li>Power: company MW → GPUs at 1.4 kW (Hopper) or 2.0 kW (GB200/GB300) of IT power. Company IT power → facility ×${window.CONTRACT_SCHEDULE?.it_to_facility || 1.3} (PUE). $/GPU-hour and rack MW use SemiAnalysis’s 2.12 kW all-in facility power per GPU.</li>
      <li>H100-equivalents measure peak compute, not delivered throughput. Prices convert at the ECB rate on the source date.</li></ul></dd>
    <dt>Limits</dt><dd>Hyperscaler fleets are Epoch’s model, neocloud GPU counts are mostly inferred from power, training vs inference comes from statements, and tracked data-center supply is a floor.</dd>
    <dt>Use</dt><dd>Hover any mark for its terms and source; click to pin it. Red marks flag unresolved source conflicts. Data: <a href="data/nc.js">data/nc.js</a> and the CSVs below.</dd>
  </dl>`;
  table("#tComparisons",NC.comparisons||[],[{k:"name",h:"Survey",f:r=>src(r.url,esc(r.name))},{k:"scope",h:"Focus"},{k:"strength",h:"Strength of the inspected source"},{k:"ours",h:"This page’s contribution and limit"}]);
  $("#gapN").textContent = NC.gaps.length;
  table("#tGaps", NC.gaps, [{ k: "subject", h: "Subject" }, { k: "metric", h: "Metric" }, { k: "why", h: "Why missing" }, { k: "best_lead", h: "Best lead" }]);
})();
