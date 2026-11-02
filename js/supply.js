// Who supplies it: Epoch H100e stacked by chip designer (end-2025), or MW online/contracted per provider.
(function () {
  let mode = "compute";
  const DES = [["Nvidia", "--s1"], ["Google", "--s2"], ["Amazon", "--s3"], ["AMD", "--s4"]];
  function drawCompute(svg) {
    const rows = NC.providers.filter(p => Object.keys(p.epoch_designers || {}).length)
      .map(p => ({ name: p.name, d: p.epoch_designers, total: Object.values(p.epoch_designers).reduce((a, b) => a + b, 0) })).sort((a, b) => b.total - a.total);
    const L = 150, R = 820, T = 20, rh = 36, max = Math.max(...rows.map(r => r.total));
    svg.setAttribute("viewBox", `0 0 900 ${T + rows.length * rh + 40}`);
    const x = v => L + (v / max) * (R - L);
    for (let v = 0; v <= max; v += 1e6) { el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: T + rows.length * rh, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: T + rows.length * rh + 16, "text-anchor": "middle" }, svg).textContent = `${v / 1e6}M`; }
    rows.forEach((r, i) => {
      const y = T + i * rh; let acc = 0;
      el("text", { x: L - 10, y: y + 21, "text-anchor": "end", class: "ink" }, svg).textContent = r.name;
      DES.forEach(([k, c]) => { const v = r.d[k] || 0; if (!v) return;
        const b = el("rect", { x: x(acc) + 1, y: y + 9, width: Math.max(1, x(acc + v) - x(acc) - 2), height: 16, rx: 3, fill: css(c) }, svg); acc += v;
        hover(b, `<b>${esc(r.name)}: ${k} chips</b>${num(v)} H100-equivalents (Epoch median, end-2025)`); });
      const other = r.total - DES.reduce((a, [k]) => a + (r.d[k] || 0), 0);
      el("text", { x: x(r.total) + 6, y: y + 21, class: "ink", "font-family": "JetBrains Mono, monospace", "font-size": 11.5 }, svg).textContent = `${(r.total / 1e6).toFixed(2)}M` + (other > 1000 ? " (incl. other)" : "");
    });
    $("#supLegend").innerHTML = DES.map(([k, c]) => `<span><i style="background:var(${c})"></i>${k === "Google" ? "Google TPU" : k === "Amazon" ? "Amazon Trainium" : k}</span>`).join("");
    const g = rows[0], tpu = (g.d.Google || 0) / g.total;
    const cust = Math.round(rows.reduce((a, r) => a + (r.d.Google || 0) + (r.d.Amazon || 0), 0) / rows.reduce((a, r) => a + r.total, 0) * 100);
    $("#supTake").innerHTML = `<span class="verdict">Custom chips are ${cust}% of the largest fleets</span><b>${esc(g.name)}</b> leads with ${(g.total / 1e6).toFixed(1)}M H100-equivalents,
      ${Math.round(tpu * 100)}% of them its own TPUs. Across the ${rows.length} fleets shown, ${cust}% of the compute is Google or Amazon silicon and nearly all the rest is Nvidia.`;
    $("#supNote").innerHTML = `Epoch AI "AI chip owners" estimate: median cumulative deliveries to 2025-12-31, in H100-equivalents at dense 8-bit
      performance. An estimate, not a disclosure, and never added to our own totals. ${src("https://epoch.ai/data/ai-chip-owners-documentation/methodology", "Epoch's method")}`;
  }
  function drawPower(svg) {
    const rows = NC.providers.filter(p => p.latest.mw_online || p.latest.mw_contracted).map(p => ({
      name: p.name, group: p.group, on: p.latest.mw_online, ct: p.latest.mw_contracted && p.latest.mw_contracted.stage !== "mixed" ? p.latest.mw_contracted : null,
      mixed: p.latest.mw_contracted && p.latest.mw_contracted.stage === "mixed" ? p.latest.mw_contracted : null, pipe: p.latest.mw_pipeline }))
      .filter(r => r.on || r.ct).sort((a, b) => ((b.ct || b.on || {}).value || 0) - ((a.ct || a.on || {}).value || 0)).slice(0, 18);
    const L = 150, R = 800, T = 20, rh = 26, max = Math.max(...rows.map(r => Math.max(r.on ? r.on.value : 0, r.ct ? r.ct.value : 0)));
    svg.setAttribute("viewBox", `0 0 900 ${T + rows.length * rh + 40}`);
    const x = v => L + (v / max) * (R - L);
    for (let v = 0; v <= max; v += 1000) { el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: T + rows.length * rh, stroke: css("--grid") }, svg);
      el("text", { x: x(v), y: T + rows.length * rh + 16, "text-anchor": "middle" }, svg).textContent = `${v / 1000} GW`; }
    rows.forEach((r, i) => {
      const y = T + i * rh;
      el("text", { x: L - 10, y: y + 15, "text-anchor": "end", class: "ink" }, svg).textContent = r.name;
      const tipHtml = () => `<b>${esc(r.name)}</b> (${r.group})<br>Online: ${r.on ? cell(r.on, "mw") : "not disclosed"}<br>Contracted: ${r.ct ? cell(r.ct, "mw") : "not disclosed"}` +
        (r.pipe ? `<br>Pipeline (not contracted): ${cell(r.pipe, "mw")}` : "");
      if (r.ct) hover(el("rect", { x: L, y: y + 4, width: Math.max(2, x(r.ct.value) - L), height: 16, rx: 4, fill: css("--s2"), opacity: 0.45 }, svg), tipHtml);
      if (r.on) hover(el("rect", { x: L, y: y + 8, width: Math.max(2, x(r.on.value) - L), height: 8, rx: 3, fill: css("--s1") }, svg), tipHtml);
      el("text", { x: x(Math.max(r.on ? r.on.value : 0, r.ct ? r.ct.value : 0)) + 6, y: y + 16 }, svg).textContent =
        `${r.on ? num(r.on.value) : "?"} / ${r.ct ? num(r.ct.value) : "?"} MW`;
    });
    $("#supLegend").innerHTML = `<span><i style="background:var(--s1)"></i>online</span><span><i style="background:var(--s2);opacity:.45"></i>contracted</span>`;
    const cw = rows.find(r => r.name === "CoreWeave");
    $("#supTake").innerHTML = `<span class="verdict">Contracted power runs far ahead of power online</span>Across the ${rows.length} companies shown, ${num(rows.reduce((a, r) => a + (r.on ? r.on.value : 0), 0))} MW is online and
      ${num(rows.reduce((a, r) => a + (r.ct ? r.ct.value : 0), 0))} MW is contracted.${cw && cw.on && cw.ct ? ` CoreWeave alone has ${(cw.ct.value / cw.on.value).toFixed(1)}× more contracted than running.` : ""}`;
    $("#supNote").innerHTML = `Latest disclosed MW per company (company totals, not sites). Hosts' MW is shown even though tenants own the GPUs. Power basis
      varies (IT, gross or billable; hover a bar). Pipelines and figures that mix online with planned capacity are not drawn. Hyperscalers do not disclose MW.`;
  }
  function draw() { const svg = $("#supSvg"); svg.innerHTML = ""; (mode === "compute" ? drawCompute : drawPower)(svg);
    $("#supCompute").classList.toggle("on", mode === "compute"); $("#supPower").classList.toggle("on", mode === "power"); }
  $("#supCompute").onclick = () => { mode = "compute"; draw(); }; $("#supPower").onclick = () => { mode = "power"; draw(); };
  onTheme(draw); draw();
})();
