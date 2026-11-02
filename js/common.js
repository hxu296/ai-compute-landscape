// Shared helpers: tooltip, theme, SVG builder, number formats, confidence badges, sortable tables.
const NC = window.NC;
const $ = (s, r = document) => r.querySelector(s);
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (parent) parent.appendChild(e); return e; }
function esc(s) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
const tip = $("#tip");
function showTip(html, ev) { tip.innerHTML = html; tip.style.display = "block";
  tip.style.left = Math.min(ev.clientX + 14, innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = Math.min(ev.clientY + 14, innerHeight - tip.offsetHeight - 8) + "px"; }
function hideTip() { tip.style.display = "none"; }
function hover(node, html) { node.addEventListener("mousemove", ev => showTip(typeof html === "function" ? html() : html, ev)); node.addEventListener("mouseleave", hideTip);
  node.addEventListener("pointerup", ev => { if (ev.pointerType !== "mouse") showTip(typeof html === "function" ? html() : html, ev); }); }
document.addEventListener("pointerdown", ev => { if (ev.pointerType !== "mouse" && !ev.target.closest("svg")) hideTip(); });
const qTheme = new URLSearchParams(location.search).get("theme");
if (qTheme === "light" || qTheme === "dark") document.documentElement.setAttribute("data-theme", qTheme);
const redraw = [];
function onTheme(f) { redraw.push(f); }
$("#theme").onclick = () => { const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", cur === "dark" ? "light" : "dark"); redraw.forEach(f => f()); };
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => redraw.forEach(f => f()));
const SER = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
function money(v) { if (v == null || isNaN(v)) return ""; const a = Math.abs(v);
  return a >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : a >= 1e9 ? `$${(v / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B` : a >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${v.toLocaleString()}`; }
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
    t.innerHTML = "<thead><tr>" + cols.map(c => `<th data-k="${c.k}">${c.h}${key === c.k ? (dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("") + "</tr></thead><tbody>" +
      rs.map(r => "<tr>" + cols.map(c => `<td>${c.f ? c.f(r) : esc(r[c.k])}</td>`).join("") + "</tr>").join("") + "</tbody>";
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
