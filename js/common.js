// Shared helpers: tooltip, theme, SVG builder, number formats, confidence badges, sortable tables.
const NC = window.NC;
if(window.LIVE){
  NC.live=window.LIVE;
  if(window.LIVE.market_checks?.length)NC.market_checks=window.LIVE.market_checks;
  const fresh=new Map((window.LIVE.benchmarks||[]).map(b=>[b.name,b]));
  NC.benchmarks=NC.benchmarks.map(b=>fresh.get(b.name)||b);
  NC.daily=window.LIVE.daily;
}
const $ = (s, r = document) => r.querySelector(s);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (parent) parent.appendChild(e); return e; }
function esc(s) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
const tip = $("#tip");
let tipPinned=false,tipAnchor=null;
function showTip(html, ev, pin=false) {
  if(tipPinned&&!pin)return;
  tipPinned=pin;tip.classList.toggle('pinned',pin);
  tip.innerHTML=(pin?'<button type="button" class="tip-close" aria-label="Close pinned chart detail">×</button><span class="tip-state">Pinned · Escape to close</span>':'')+html+(pin?'':'<span class="tip-hint">Click to pin details</span>');
  tip.style.display='block';tip.setAttribute('role',pin?'dialog':'tooltip');tip.setAttribute('aria-label','Chart detail');
  tip.style.left=Math.max(8,Math.min(ev.clientX+14,innerWidth-tip.offsetWidth-8))+'px';
  tip.style.top=Math.max(8,Math.min(ev.clientY+14,innerHeight-tip.offsetHeight-8))+'px';
  if(pin)tip.querySelector('.tip-close').onclick=()=>hideTip(true);
}
function hideTip(force=false) {if(tipPinned&&!force)return;tipPinned=false;tipAnchor=null;tip.classList.remove('pinned');tip.style.display='none';}
function hover(node, html) {
  const content=()=>typeof html==='function'?html():html;
  node.dataset.tip='true';
  node.addEventListener('mousemove',ev=>showTip(content(),ev));
  node.addEventListener('mouseleave',()=>hideTip());
  node.addEventListener('click',ev=>{if(tipPinned&&tipAnchor===node){hideTip(true);return;}showTip(content(),ev,true);tipAnchor=node;});
}
 document.addEventListener('pointerdown',ev=>{if(!tip.contains(ev.target)&&!ev.target.closest('[data-tip]'))hideTip(true);});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape')hideTip(true);});
 addEventListener('resize',()=>hideTip(true));
const qTheme = new URLSearchParams(location.search).get("theme");
if (qTheme === "light" || qTheme === "dark") document.documentElement.setAttribute("data-theme", qTheme);
const redraw = [];
function onTheme(f) { redraw.push(f); }
$("#theme").onclick = () => { const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", cur === "dark" ? "light" : "dark"); redraw.forEach(f => f()); };
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => redraw.forEach(f => f()));
const SER = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
// One colour per company across the site (Fig. 2 power view, Fig. 3, Fig. 6, A1, A2, Table 2). Ten named companies get a
// fixed hue; every other company is the same neutral grey, so colour always means the same firm. Chip designers have
// their own fixed set (DESIGNER_COLOR). Presentation only: no value depends on these.
// Hues are assigned so that the owners most often stacked next to each other (Figs. 2 and 3) differ most; AWS and Google
// match their chips' designer colours (Trainium green, TPU red).
const COMPANY_COLORS = [[/^(aws|amazon)\b/i, "--s3"], [/^microsoft/i, "--s1"], [/^google/i, "--s2"], [/^oracle/i, "--s4"], [/^meta\b/i, "--s7"],
  [/^coreweave/i, "--s8"], [/^openai/i, "--s5"], [/^anthropic/i, "--s6"], [/^(xai|spacex)/i, "--c-xai"], [/^nebius/i, "--c-nebius"], [/^bytedance/i, "--c-bytedance"]];
function companyVar(name) { const n = String(name || "").trim(), m = COMPANY_COLORS.find(([re]) => re.test(n)); return m ? m[1] : null; }
function companyColor(name, fallback = "--c-other") { return css(companyVar(name) || fallback); }
const DESIGNER_COLOR = { Nvidia: "--d-nvidia", NVIDIA: "--d-nvidia", Google: "--d-google", "Google TPU": "--d-google", Amazon: "--d-amazon", "AWS Trainium": "--d-amazon", AMD: "--d-amd", Huawei: "--d-huawei" };
// A lighter shade of a colour (t = 0 the colour, 1 the paper), for "planned" segments drawn in the owner's own colour.
function tint(color, t) { const h = c => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c).trim()); const n = m ? parseInt(m[1], 16) : 0x999999; return [n >> 16, n >> 8 & 255, n & 255]; };
  const a = h(color), b = h(css("--paper") || "#fffdf8"); return "#" + a.map((v, i) => Math.round(v * (1 - t) + b[i] * t).toString(16).padStart(2, "0")).join(""); }
// A small colour dot for a company name in tables and lists (grey for companies outside the named set).
function companyDot(name) { const v = companyVar(name); return `<i class="co-dot${v ? "" : " other"}" style="background:var(${v || "--c-other"})" aria-hidden="true"></i>`; }
function money(v) { if (v == null || isNaN(v)) return ""; const a = Math.abs(v);
  return a >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : a >= 1e9 ? `$${(v / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B` : a >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${v.toLocaleString()}`; }
// A deal's $/kW-month is a floor when its value is a minimum or its capacity a maximum.
function kwFloor(c) { return /at least|more than|minimum|over/i.test(c.value_relation || "") || c.value_status === "minimum" || /up to/i.test(c.capacity_mw_relation || ""); }
// $/GPU-hour applies only to NVIDIA or AMD GPU capacity (no contract gives a chip field beyond gpu_type, so text is checked too).
function gpuDeal(c) { const t = [c.gpu_type, c.supplier, c.structure, c.note].join(" ");
  return !/Trainium|Inferentia|TPU|Cerebras|WSE|wafer|Groq|Ascend/i.test(t) && (!c.gpu_type || /NVIDIA|GB\d|\b[BH]\d{2,3}|Rubin|Blackwell|AMD|MI\d{3}/i.test(c.gpu_type)); }
function num(v) { if (v == null) return ""; const a = Math.abs(v); return a >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : a >= 1e4 ? `${Math.round(v / 1e3)}k` : Math.round(v).toLocaleString(); }
function badge(c) { const k = { reported: "r", derived: "d", estimated: "e" }[c]; return k ? `<span class="badge ${k}" title="${c}">${k.toUpperCase()}</span>` : ""; }
function src(u, t = "source") { return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : ""; }
function ym(d) { return String(d || "").slice(0, 7); }
// a value cell: number + badge + date + source; estimates with a range show the range
function cell(r, kind) {
  if (!r) return `<span class="na">not disclosed</span>`;
  let v = kind === "usd" ? money(r.value) : num(r.value);
  if (r.range_low && r.range_high) v = `${num(r.range_low)}–${num(r.range_high)}`;
  else if (r.confidence === "estimated") v = `≈${v}`;
  if (r.value_relation) v = esc(r.value_relation) + " " + v;
  const extra = [r.stage === "mixed" ? "online+planned mixed" : "", r.target_status || "", r.power_basis && !["IT", "unknown"].includes(r.power_basis) ? r.power_basis : "",
                 r.scope && r.scope !== "company" && kind === "usd" ? r.scope.replace(/^(segment|company):/, "") : ""].filter(Boolean).join(", ");
  return `<span title="${esc([r.note,r.method,r.unit].filter(Boolean).join(" · "))}">${v}</span>${badge(r.confidence)} <span class="muted small">${ym(r.as_of)}${extra ? " · " + esc(extra) : ""}</span> ${src(r.source_url, "↗")}${conflictBadge(r.subject,r.metric)}`;
}
function table(id, rows, cols) {
  const t = $(id); if (!t) return; let key = null, dir = 1;
  let download=t.previousElementSibling;
  if(!download || download.dataset.exportFor !== id){download=document.createElement("button");download.type="button";download.className="table-download";download.dataset.exportFor=id;t.before(download);}
  download.textContent=`Download shown rows (${rows.length})`;download.onclick=()=>downloadCsv(id.replace("#",""),rows);
  function render() {
    const rs = key ? [...rows].sort((a, b) => { const x = a[key] ?? "", y = b[key] ?? ""; return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * dir; }) : rows;
    // Presentation: a column whose raw values are all numbers (or empty) is right-aligned.
    const nc = cols.map(c => rows.some(r => typeof r[c.k] === "number") && rows.every(r => r[c.k] == null || typeof r[c.k] === "number")), cl = i => nc[i] ? ' class="n"' : "";
    t.innerHTML = "<thead><tr>" + cols.map((c, i) => `<th data-k="${c.k}"${cl(i)}>${c.h}${key === c.k ? (dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("") + "</tr></thead><tbody>" +
      rs.map(r => "<tr>" + cols.map((c, i) => `<td${cl(i)}>${c.f ? c.f(r) : esc(r[c.k])}</td>`).join("") + "</tr>").join("") + "</tbody>";
    // ...unless its rendered cells carry prose (a qualifier, scope or grade): those stay left-aligned.
    nc.forEach((on, i) => { if (on && [...t.querySelectorAll(`tbody tr > :nth-child(${i + 1})`)].some(td => td.textContent.trim().length > 22)) t.querySelectorAll(`tr > :nth-child(${i + 1})`).forEach(c => c.classList.remove("n")); });
    t.querySelectorAll("th").forEach(th => th.onclick = () => { const k = th.dataset.k; dir = key === k ? -dir : -1; key = k; render(); });
  }
  render();
}
function svgPoint(svg, ev) { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
const PROV = Object.fromEntries(NC.providers.map(p => [p.name, p]));
function firmCompute(c) {
  if (c.kind !== "compute" || c.excluded || !(c.value_usd > 0)) return false;
  if (c.value_status) return c.value_status === "minimum";
  const txt=((c.structure || "")+" "+(c.note || "")).replace(/noncancel(?:l)?able/gi, "binding");
  return !/potential|not committed|optional|backstop|up to|terminable|cancell|90.day/i.test(txt);
}
function providerPrices(rows) {
  // A provider gets one vote in a median. Its lowest posted region/config is explicit in the caption.
  const by = new Map(); rows.forEach(p => { const k = `${p.provider}|${p.sku}|${p.basis}`; if (!by.has(k) || p.usd < by.get(k).usd) by.set(k, p); }); return [...by.values()];
}

function downloadCsv(name,rows){
  const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];
  const quote=v=>{if(v==null)return '""';if(typeof v==='object')v=JSON.stringify(v);v=String(v);if(/^[=+@-]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';};
  const content=[keys,...rows.map(r=>keys.map(k=>r[k]))].map(row=>row.map(quote).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
