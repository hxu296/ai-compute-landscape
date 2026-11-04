// The deal network: buyers ← clouds / operators ← disclosed landlords, drawn from the same contract rows as Table 2.
// Buyer–cloud links are sized by disclosed dollars, cloud–landlord links by contracted MW (one scale per side). Presentation only.
(function () {
  // Default: compute rentals and building leases; chip-supply orders (NVIDIA, AMD, Broadcom…) are one toggle away.
  let from = "2025", kind = "rent", sel = null, minimum = 0, chips = false;
  // Buyers drawn by name; everyone else is one grey "Other buyers" row and every undisclosed counterparty one "Undisclosed buyers" row.
  const BIG = [["OpenAI", /^openai/i], ["Anthropic", /^anthropic/i], ["Meta", /^meta\b/i], ["Microsoft", /^microsoft/i], ["Google", /^google/i], ["xAI / SpaceX", /^(xai|spacex)/i]];
  const buyerGroup = n => /undisclosed/i.test(n) ? "Undisclosed buyers" : (BIG.find(([, re]) => re.test(n)) || ["Other buyers"])[0];
  const groupColor = g => g === "Other buyers" ? css("--c-other") : g === "Undisclosed buyers" ? tint(css("--c-other"), .4) : companyColor(g, "--chart-axis");
  const canonical = n => ({ "Microsoft": "Microsoft Azure", "Google": "Google Cloud", "Oracle": "Oracle OCI", "Amazon": "AWS" }[n] || n);
  const maxDeal=Math.max(1,...[...NC.contracts,...NC.hardware].filter(c=>!c.excluded).map(c=>c.value_usd||0));
  const short = (s, n = 26) => s.length > n ? s.slice(0, n - 1) + "…" : s;
  function priceTxt(c) {
    if (c.implied_usd_per_gpu_hour) return `$${c.implied_usd_per_gpu_hour}/GPU-h`;
    if (c.implied_usd_per_kw_month) return `lease $${Math.round(c.implied_usd_per_kw_month)}/kW-mo`;
    let s = c.implied_allin_usd_per_kw_month ? `all-in $${Math.round(c.implied_allin_usd_per_kw_month).toLocaleString()}/kW-mo` : "";
    if (c.implied_usd_per_gpu_hour_est) s += ` (≈$${c.implied_usd_per_gpu_hour_est.low}–${c.implied_usd_per_gpu_hour_est.high}/GPU-h, floor)`;
    return s;
  }
  const inKind = c => kind === "all" ? true : kind === "hardware" ? c.kind === "hardware" : kind === "rent" ? c.kind === "compute" || c.kind === "lease" || (chips && c.kind === "hardware") : c.kind === kind || (kind === "compute" && chips && c.kind === "hardware");
  const pool = () => [...NC.contracts, ...NC.hardware].filter(c => !c.excluded && String(c.announced || "").slice(0, 4) >= from);
  function deals() { return pool().filter(c => inKind(c) && (c.value_usd ? c.value_usd >= minimum : $("#dealUnpriced").checked)); }
  // Columns: a lease runs tenant (a cloud, middle) → landlord (right); every other deal runs buyer (left) → supplier (middle).
  const isLease = c => c.kind === "lease";
  const MAXMID = 14, MAXRIGHT = 10;
  // A row that its note calls the same underlying deal as another row in the same pair with the same MW (e.g. OpenAI–Oracle 4.5 GW,
  // 2025-07-22 and 2025-09-10) is counted once in MW totals; dollars are summed only where disclosed.
  const once = cs => cs.filter(c => !(/same underlying deal/i.test(c.note || "") && cs.some(o => o !== c && o.capacity_mw && o.capacity_mw === c.capacity_mw && !/same underlying deal/i.test(o.note || ""))));
  let layout = null;
  function build(ds) {
    const midTot = new Map(), rightTot = new Map(), add = (m, k, v) => m.set(k, (m.get(k) || 0) + v);
    ds.forEach(c => { if (isLease(c)) { add(rightTot, c.supplier, c.capacity_mw || 0); add(midTot, canonical(c.buyer), (c.capacity_mw || 0) * 1e7); } else add(midTot, canonical(c.supplier), (c.value_usd || 0) + 1); });
    const topMid = new Set([...midTot].sort((a, b) => b[1] - a[1]).slice(0, MAXMID).map(x => x[0])), topRight = new Set([...rightTot].sort((a, b) => b[1] - a[1]).slice(0, MAXRIGHT).map(x => x[0]));
    const mid = n => topMid.has(n) ? n : "Other operators", right = n => topRight.has(n) ? n : "Other landlords";
    const ends = c => isLease(c) ? ["1|" + mid(canonical(c.buyer)), "2|" + right(c.supplier)] : ["0|" + buyerGroup(c.buyer), "1|" + mid(canonical(c.supplier))];
    const links = new Map();
    ds.forEach(c => { const [a, b] = ends(c), k = a + "→" + b; if (!links.has(k)) links.set(k, { k, a, b, lease: isLease(c), cs: [] }); links.get(k).cs.push(c); });
    const L = [...links.values()];
    L.forEach(l => { l.usd = l.lease ? 0 : l.cs.reduce((s, c) => s + (c.value_usd || 0), 0); l.mw = l.lease ? once(l.cs).reduce((s, c) => s + (c.capacity_mw || 0), 0) : 0; l.size = l.lease ? l.mw : l.usd; });
    const ids = [...new Set(L.flatMap(l => [l.a, l.b]))], N = Object.fromEntries(ids.map(id => [id, { id, col: +id[0], name: id.slice(2) }]));
    Object.values(N).forEach(n => { const out = L.filter(l => l.a === n.id), inn = L.filter(l => l.b === n.id);
      n.usdOut = out.reduce((s, l) => s + l.usd, 0); n.usdIn = inn.reduce((s, l) => s + l.usd, 0); n.mwOut = out.reduce((s, l) => s + l.mw, 0); n.mwIn = inn.reduce((s, l) => s + l.mw, 0);
      n.partners = new Set((n.col === 0 ? out.map(l => l.b) : n.col === 2 ? inn.map(l => l.a) : inn.map(l => l.a))).size; n.deals = out.concat(inn).reduce((s, l) => s + l.cs.length, 0);
      n.grouped = /^(Other|Undisclosed) /.test(n.name); });
    const rankL = n => n.name === "Undisclosed buyers" ? 2 : n.name === "Other buyers" ? 1 : 0;
    const cols = [0, 1, 2].map(cl => Object.values(N).filter(n => n.col === cl).sort((a, b) => cl === 0 ? rankL(a) - rankL(b) || b.usdOut - a.usdOut : (a.grouped - b.grouped) || (cl === 1 ? b.usdIn - a.usdIn || b.mwOut - a.mwOut : b.mwIn - a.mwIn) || a.name.localeCompare(b.name)));
    return { L, N, cols, ends };
  }
  const gw = v => v >= 1000 ? `${(v / 1000).toFixed(1)} GW` : `${Math.round(v).toLocaleString()} MW`;
  const metric = n => n.col === 0 ? `${n.usdOut ? money(n.usdOut) + " disclosed" : "value undisclosed"} · ${n.partners} supplier${n.partners === 1 ? "" : "s"}` :
    n.col === 1 ? [n.usdIn ? `${money(n.usdIn)} sold` : "", n.mwOut ? `${gw(n.mwOut)} leased` : ""].filter(Boolean).join(" · ") || `${n.deals} deal${n.deals === 1 ? "" : "s"}, size undisclosed` :
    n.mwIn ? `${gw(n.mwIn)} leased out` : `${n.deals} lease${n.deals === 1 ? "" : "s"}, MW undisclosed`;
  const nodeColor = n => n.col === 0 ? groupColor(n.name) : n.grouped ? css("--c-other") : companyColor(n.name, "--chart-axis");
  function draw() {
    const svg = $("#flowSvg"); if (!svg) { table1(); return; } svg.innerHTML = "";
    const ds = deals(), all = pool(), G = layout = build(ds), { L, N, cols } = G;
    // Coverage line: what the current filters leave out of the network and Table 2, counted from the same rows.
    const out = all.filter(c => !ds.includes(c)), why = c => !inKind(c) ? (c.kind === "hardware" ? "chip supply" : c.kind === "lease" ? "building leases" : "compute services") : !c.value_usd ? "unpriced" : "below the minimum value";
    const miss = new Map(); out.forEach(c => miss.set(why(c), (miss.get(why(c)) || 0) + 1));
    if ($("#flowCoverage")) $("#flowCoverage").textContent = `Showing ${ds.length} of ${all.length} deals announced from ${from}` + (miss.size ? `; left out: ${[...miss].map(([k, v]) => `${k} (${v})`).join(", ")}.` : ".");
    const W = 1080, rows = Math.max(...cols.map(c => c.length), 1), H = Math.max(340, 64 + rows * 38), left = [8, 443, 878], width = 194;
    cols.forEach(c => c.forEach((n, i) => { n.x = left[n.col]; n.y = 52 + (i + .5) * (H - 68) / c.length; }));
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    ["BUYERS", "CLOUDS / OPERATORS", "DISCLOSED LANDLORDS"].forEach((t, i) => el("text", { x: left[i] + 4, y: 20, class: "flow-heading" }, svg).textContent = t);
    el("text", { x: left[2] + 4, y: 34, class: "flow-degree" }, svg).textContent = "listed hosts and builders";
    // Headline, computed from the drawn links.
    const lUsd = L.filter(l => !l.lease), tot = lUsd.reduce((s, l) => s + l.usd, 0), oa = lUsd.filter(l => /^0\|(OpenAI|Anthropic)$/.test(l.a)), oaV = oa.reduce((s, l) => s + l.usd, 0);
    const via = new Map(); oa.forEach(l => via.set(l.b.slice(2), (via.get(l.b.slice(2)) || 0) + l.usd)); const top4 = [...via].sort((a, b) => b[1] - a[1]).slice(0, 4), t4 = top4.reduce((s, x) => s + x[1], 0);
    const list = a => a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a.at(-1) : a[0] || "", lease = cols[1].filter(n => n.mwOut && !n.grouped).sort((a, b) => b.mwOut - a.mwOut), lt = lease.reduce((s, n) => s + n.mwOut, 0);
    // Firm = a stated amount without "up to", conditional, cancellable or potential status; "at least" amounts count as firm floors.
    const firm = c => c.value_usd && !/up to/.test(c.value_relation || "") && !["conditional", "cancellable", "potential"].includes(c.value_status), oaF = oa.reduce((s, l) => s + l.cs.filter(firm).reduce((x, c) => x + c.value_usd, 0), 0);
    // Landlord total = every MW drawn into the landlord column, grouped operators included.
    const landMW = cols[2].reduce((s, n) => s + (n.mwIn || 0), 0), lessees = cols[1].filter(n => n.mwOut && !n.grouped).sort((a, b) => b.mwOut - a.mwOut);
    if ($("#dealHeadline")) $("#dealHeadline").textContent = (oaV ? `OpenAI and Anthropic sign ≈${money(oaV)} of the ${money(tot)} disclosed (≈${money(oaF)} of it firm; the rest is "up to", conditional or cancellable); ${t4 / oaV > .5 ? "most of it" : "the largest part"} flows through ${list(top4.map(x => x[0]))}.` : tot ? `${money(tot)} disclosed in this view.` : "") +
      (landMW ? ` Disclosed landlords lease ≈${(landMW / 1000).toFixed(1)} GW, mostly to ${list(lessees.slice(0, 2).map(n => n.name))}.` : "");
    const maxMW = Math.max(1, ...L.map(l => l.mw)), maxUSD = Math.max(1, ...L.map(l => l.usd)), wOf = l => l.size > 0 ? 1.2 + 12 * Math.sqrt(l.size / (l.lease ? maxMW : maxUSD)) : 1;
    const scope = id => { if (!id) return new Set(L.map(l => l.k)); const n = N[id]; let keep = L.filter(l => l.a === id || l.b === id);
      if (n.col === 0) { const m = new Set(keep.map(l => l.b)); keep = keep.concat(L.filter(l => m.has(l.a))); }
      if (n.col === 2) { const m = new Set(keep.map(l => l.a)); keep = keep.concat(L.filter(l => m.has(l.b))); }
      return new Set(keep.map(l => l.k)); };
    const linkEls = new Map(), nodeEls = new Map(), selId = sel ? sel.id : null;
    const highlight = (id = selId) => { const ks = scope(id), act = new Set(L.filter(l => ks.has(l.k)).flatMap(l => [l.a, l.b]));
      linkEls.forEach((g, k) => { g.style.opacity = ks.has(k) ? "1" : ".05"; g.classList.toggle("flow-active", !!id && ks.has(k)); });
      nodeEls.forEach((g, k) => { g.style.opacity = !id || act.has(k) ? "1" : ".3"; g.classList.toggle("flow-selected", k === selId); }); };
    const choose = id => { sel = id && N[id] ? { id, col: N[id].col, name: N[id].name } : null; draw(); };
    [...L].sort((a, b) => b.size - a.size).forEach(l => {
      const a = N[l.a], b = N[l.b], x0 = a.x + width, x1 = b.x, d = `M${x0},${a.y} C${x0 + 110},${a.y} ${x1 - 110},${b.y} ${x1},${b.y}`;
      const g = el("g", { class: "flow-link" }, svg); linkEls.set(l.k, g);
      el("path", { d, fill: "none", stroke: l.lease ? css("--rule") : nodeColor(a), "stroke-width": wOf(l), "stroke-opacity": l.size > 0 ? .5 : .75, "stroke-dasharray": l.size > 0 ? "" : "3 3" }, g);
      const hit = el("path", { d, fill: "none", stroke: "transparent", "stroke-width": Math.max(10, wOf(l) + 4), tabindex: 0, role: "button", "aria-label": `${a.name} → ${b.name}; ${l.cs.length} deals` }, g);
      hover(hit, `<b>${esc(a.name)} → ${esc(b.name)}</b>${l.size > 0 ? (l.lease ? `${gw(l.mw)} contracted` : `${money(l.usd)} disclosed`) : (l.lease ? "MW undisclosed" : "value undisclosed")} · ${l.cs.length} deal${l.cs.length === 1 ? "" : "s"}<br>` +
        l.cs.slice(0, 5).map(c => `${esc(String(c.announced || "").slice(0, 10))} · ${a.grouped || b.grouped ? esc(c.buyer) + " → " + esc(c.supplier) + " · " : ""}${c.value_usd ? esc(c.value_relation || "") + " " + money(c.value_usd) : c.capacity_mw ? num(c.capacity_mw) + " MW" : "undisclosed"}${badge(c.confidence)}<br><span class="muted">${esc(String(c.structure || "").slice(0, 90))}</span>`).join("<br>") + (l.cs.length > 5 ? `<br>+${l.cs.length - 5} more in Table 2` : ""));
      hit.onpointerenter = () => highlight(l.b); hit.onpointerleave = () => highlight(); hit.onclick = () => choose(l.b);
    });
    Object.values(N).forEach(n => {
      const g = el("g", { class: "flow-node", tabindex: 0, role: "button", "aria-label": `${n.name}: ${metric(n)}; select to list its deals` }, svg); nodeEls.set(n.id, g);
      el("rect", { x: n.x, y: n.y - 16, width, height: 32, rx: 3, fill: css("--paper"), stroke: css("--line-soft") }, g);
      el("rect", { x: n.x, y: n.y - 16, width: 3, height: 32, fill: nodeColor(n) }, g);
      const t = el("text", { x: n.x + 10, y: n.y - 2, class: "flow-name" }, g); t.textContent = short(n.name); if (n.name.length > 26) el("title", {}, t).textContent = n.name;
      el("text", { x: n.x + 10, y: n.y + 11, class: "flow-degree" }, g).textContent = metric(n);
      // A company that buys and sells is drawn once on each side it acts on; its other role is named here.
      const alsoBuys = n.col === 1 && !n.grouped ? ds.filter(c => !isLease(c) && buyerGroup(c.buyer) === "Other buyers" && canonical(c.buyer) === n.name) : [];
      const members = n.grouped ? [...new Set(ds.filter(c => G.ends(c).includes(n.id)).map(c => n.col === 0 ? c.buyer : n.col === 2 ? c.supplier : isLease(c) ? canonical(c.buyer) : canonical(c.supplier)))] : [];
      hover(g, `<b>${esc(n.name)}</b>${esc(metric(n))}${alsoBuys.length ? `<br>Also buys ${money(alsoBuys.reduce((s, c) => s + (c.value_usd || 0), 0))} from ${esc(alsoBuys.map(c => c.supplier).join(", "))} (in “Other buyers”)` : ""}${members.length ? `<br><span class="muted">${members.slice(0, 12).map(esc).join(", ")}${members.length > 12 ? "…" : ""}</span>` : ""}<br><span class="muted">Click to highlight and list its deals in Table 2.</span>`);
      g.onpointerenter = () => highlight(n.id); g.onpointerleave = () => highlight(); g.onclick = () => choose(selId === n.id ? "" : n.id);
      g.onkeydown = ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); choose(selId === n.id ? "" : n.id); } };
      if (n.col === 1 && !n.grouped) { const cids = [...new Set(ds.filter(c => canonical(c.supplier) === n.name).flatMap(c => ["value_usd", "capacity_gpus", "capacity_mw"].flatMap(m => conflictIds(c.supplier, m, c))))];
        if (cids.length) { const ct = el("text", { x: n.x + width - 8, y: n.y + 4, "text-anchor": "end", class: "svg-conflict", "data-conflict": cids.join(","), tabindex: 0, role: "button", "aria-label": "Source comparison for " + n.name }, svg); ct.textContent = "!"; } }
    });
    highlight();
    const f = $("#flowFocus"); if (f) { f.innerHTML = `<option value="">All companies</option>` + [0, 1, 2].flatMap(cl => cols[cl].map(n => `<option value="${esc(n.id)}">${["Buyer", "Cloud", "Landlord"][cl]}: ${esc(n.name)}</option>`)).join(""); f.value = selId || ""; f.onchange = e => choose(e.target.value); }
    if ($("#flowMeta")) $("#flowMeta").innerHTML = sel ? `<b>${esc(sel.name)}</b> · ${esc(metric(N[sel.id]))}. Table 2 lists its deals; linked upstream or downstream deals are context, and no capacity allocation is inferred.` :
      `Width: disclosed $ (buyer → cloud) and contracted MW (cloud → landlord), one scale per side; dashed = size undisclosed. Hyperscalers’ own campuses (QTS, Vantage, Stack and self-built) are not in the deal data.`;
    if ($("#dealSel")) $("#dealSel").textContent = sel ? `${sel.name} selected` : "";
    table1();
  }
  let showAllDeals=false;
  function table1() {
    const all = deals().filter(c => !sel || !layout || layout.ends(c).includes(sel.id))
      .map(c => ({ ...c, price: priceTxt(c), cap: c.capacity_text || (c.capacity_accelerators ? `${c.capacity_relation || ""} ${num(c.capacity_accelerators)} ${c.accelerator_unit}` : c.capacity_gpus ? `${c.capacity_relation || ""} ${num(c.capacity_gpus)} GPUs` : c.capacity_mw ? `${c.capacity_mw_relation || ""} ${num(c.capacity_mw)} MW` : "not disclosed") }))
      .sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0));
    // Top 20 by disclosed value unless searching or expanded.
    const q=($("#dealSearch")?.value||"").trim().toLowerCase(),matched=q?all.filter(c=>[c.buyer,c.supplier,c.gpu_type,c.site,c.structure].join(" ").toLowerCase().includes(q)):all,rows=q||showAllDeals?matched:matched.slice(0,20);
    if($("#dealCount"))$("#dealCount").textContent=`${rows.length} of ${all.length} deals shown (${kind==="all"?"all kinds":kind==="rent"?"compute services and leases"+(chips?" and chip orders":""):kind==="compute"?"compute services"+(chips?" and chip orders":""):kind==="lease"?"building leases":"hardware orders"}${sel?", "+sel.name:""}, announced from ${from})`;if($("#dealShowAll")){$("#dealShowAll").textContent=showAllDeals?"Show top 20":"Show all deals";$("#dealShowAll").hidden=!!q||all.length<=20;}
    // Six visible columns; date, chip, capacity, terms, notes and the source sit in each row's Details.
    const kwm = r => r.implied_allin_usd_per_kw_month || r.implied_usd_per_kw_month;
    table("#tDeals", rows, [{ k: "buyer", h: "Buyer", f: r => `<span class="co">${companyDot(r.buyer)}<span>${esc(r.buyer)}</span></span>` }, { k: "supplier", h: "Supplier", f: r => `<span class="co">${companyDot(r.supplier)}<span>${esc(r.supplier)}</span></span>` },
      { k: "value_usd", h: "Value", f: r => (r.value_usd ? `${esc(r.value_relation || "")} ${money(r.value_usd)}` : `<span class="na">${esc(r.value_text || "not disclosed")}</span>`) + badge(r.confidence) + conflictBadge(r.supplier,"value_usd",r) },
      { k: "term_years", h: "Years", f: r => r.term_years || `<span class="na">—</span>` },
      { k: "capacity_mw", h: "MW", f: r => r.capacity_mw ? `${esc(r.capacity_mw_relation || "")} ${num(r.capacity_mw)}${conflictBadge(r.supplier,"capacity_mw",r)}` : `<span class="na">—</span>` },
      { k: "implied_allin_usd_per_kw_month", h: "$/kW-month", f: r => kwm(r) ? `${r.implied_usd_per_kw_month && !r.implied_allin_usd_per_kw_month ? "lease " : "all-in "}$${Math.round(kwm(r)).toLocaleString()}` : `<span class="na">—</span>` },
      { k: "announced", h: "", f: r => { const t = r.evidence || r.structure || "", n = r.note || ""; return `<details class="cell-more"><summary>Details</summary><span class="small"><b>Announced</b> ${esc(String(r.announced || "").slice(0, 10))}${r.gpu_type ? ` · <b>Chip</b> ${esc(r.gpu_type)}` : ""} · <b>Capacity</b> ${esc(r.cap)}${conflictBadge(r.supplier,"capacity_gpus",r)}${r.price ? ` · <b>Implied</b> ${esc(r.price)}` : ""}<br>${esc(t)}${n ? `<br><span class="muted">${esc(n)}</span>` : ""}${r.source_date ? `<br><span class="muted">Latest source ${esc(r.source_date)}</span>` : ""} ${src(r.source_url)}</span></details>`; } }]);
  }
  $("#dealFrom").onchange = e => { from = e.target.value; sel = null; draw(); };
  const syncCtl = () => { if ($("#dealChipsCtl")) $("#dealChipsCtl").hidden = !(kind === "rent" || kind === "compute"); };
  $("#dealKind").onchange = e => { kind = e.target.value; sel = null; syncCtl(); draw(); };
  if ($("#dealChips")) $("#dealChips").onchange = e => { chips = e.target.checked; sel = null; draw(); };
  syncCtl();
  $("#dealReset").onclick = () => { sel = null; draw(); };
  if($("#dealSearch"))$("#dealSearch").oninput=()=>table1();
  if($("#dealShowAll"))$("#dealShowAll").onclick=()=>{showAllDeals=!showAllDeals;table1();};
  $("#dealMin").oninput=e=>{minimum=maxDeal*(Number(e.target.value)/100)**2;$("#dealMinLabel").textContent=minimum?money(minimum)+" and above":"All values";if(minimum>0)$("#dealUnpriced").checked=false;sel=null;draw();};
  $("#dealUnpriced").onchange=()=>{sel=null;draw();};
  onTheme(draw); draw();
})();
