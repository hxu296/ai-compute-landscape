// US state choropleth of Epoch AI's tracked frontier data-center power (window.US_SITES from research/us-sites.json,
// geometry window.US_STATES / US_CITIES from data/us_states.js). Needs common.js helpers: $, el, esc, src, hover, table, onTheme.
(function () {
  const VIEWS = {
    now:     {label: 'Online now', short: 'online now', get: m => m.now},
    add2026: {label: 'Planned additions by end-2026', short: 'added by end-2026', get: m => m['2026'] - m.now},
    add2027: {label: 'Planned additions by end-2027', short: 'added by end-2027', get: m => m['2027'] - m.now},
    add2028: {label: 'Planned additions by end-2028', short: 'added by end-2028', get: m => m['2028'] - m.now},
    total2028: {label: 'Total by end-2028', short: 'total by end-2028', get: m => m['2028']}
  };
  const r1 = v => Math.round(v * 10) / 10;
  // Per-state rows summed from the sites themselves, so the map never depends on a precomputed total.
  function model(D, view) {
    const get = VIEWS[view].get, states = new Map(), cities = new Map();
    for (const s of D.sites) {
      const k = s.state || null;
      if (!states.has(k)) states.set(k, {state: k, sites: [], value: 0, now: 0, y2028: 0});
      const st = states.get(k);
      st.sites.push(s); st.value += get(s.mw); st.now += s.mw.now; st.y2028 += s.mw['2028'];
      if (k && s.city) {
        const ck = s.city + ', ' + k;
        if (!cities.has(ck)) cities.set(ck, {city: ck, sites: [], value: 0});
        const c = cities.get(ck); c.sites.push(s); c.value += get(s.mw);
      }
    }
    for (const x of [...states.values(), ...cities.values()]) {
      x.value = r1(x.value); if ('now' in x) { x.now = r1(x.now); x.y2028 = r1(x.y2028); }
      x.sites.sort((a, b) => b.mw['2028'] - a.mw['2028'] || b.mw.now - a.mw.now || a.name.localeCompare(b.name));
    }
    return {states, unlocated: states.get(null) || {state: null, sites: [], value: 0, now: 0, y2028: 0}, cities: [...cities.values()]};
  }
  // Up to four class breaks on a square-root spacing of the maximum (TX and TN dominate), rounded to a 1-1.5-2-2.5-3-4-5-6-8 series.
  function breaks(max) {
    const nice = v => { if (v <= 0) return 0; const p = 10 ** Math.floor(Math.log10(v)), f = v / p;
      return Math.max(1, p * [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].reduce((a, c) => Math.abs(c - f) < Math.abs(a - f) ? c : a)); };
    const b = [1, 2, 3, 4].map(k => nice(max * (k / 5) ** 2));
    return b.filter((v, i) => v > 0 && v < max && (i === 0 || v > b[i - 1]));
  }
  const api = {VIEWS, model, breaks};
  if (typeof window !== 'undefined') window.US_MAP = api;
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof document === 'undefined') return;

  const svg = document.getElementById('usMapSvg');
  if (!svg || !window.US_SITES || !window.US_STATES) return;
  const D = window.US_SITES, G = window.US_STATES, CITY = window.US_CITIES || {}, META = window.US_MAP_META || {width: 960, height: 600};
  const select = $('#usMapView'), note = $('#usMapNote'), legend = $('#usMapLegend'), unloc = $('#usMapUnlocated');
  const fmt = v => (v < 0 ? '−' : '') + Math.abs(Math.round(v)).toLocaleString('en-US');
  const mw = v => fmt(v) + ' MW';
  const day = new Date(D.retrieved_utc).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
  const byAddress = D.sites.filter(s => s.state && s.state_basis !== 'site name' && s.state_basis !== 'source text').length;
  const byName = D.sites.filter(s => s.state_basis === 'site name').length, bySource = D.sites.filter(s => s.state_basis === 'source text').length;
  svg.setAttribute('viewBox', `0 0 ${META.width} ${META.height}`);

  function lum(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 1; const n = parseInt(m[1], 16); return ((n >> 16) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) / 255; }
  function palette() {
    const paper = css('--paper') || '#fffdf8', dark = lum(paper) < 0.5;
    return dark
      ? {ramp: ['#1c3a5e', '#256abf', '#3987e5', '#86b6ef', '#cde2fb'], zero: '#26303b', none: css('--wash') || '#2a2926', hatch: css('--line') || '#4a4740', paper, ink: css('--ink') || '#f0efec', light: '#0b0b0b', darkFrom: 3}
      : {ramp: ['#b7d3f6', '#6da7ec', '#2a78d6', '#1c5cab', '#0d366b'], zero: '#e7eef7', none: css('--wash') || '#f3eee4', hatch: css('--line') || '#d8d0c4', paper, ink: css('--ink') || '#161513', light: '#ffffff', darkFrom: 2};
  }
  function siteRows(sites, limit) {
    const shown = sites.slice(0, limit);
    const basis = s => s.state_basis === 'site name' ? ' · <i>state inferred from site name</i>' : s.state_basis === 'source text' ? ' · <i>state from Epoch source text, not address</i>' : '';
    return '<table class="usmap-tip">' + shown.map(s => `<tr><td>${esc(s.name)}<span class="muted"> · ${esc(s.city || 'city not given')} · ${esc(s.owner || 'owner not listed')}${basis(s)}</span></td><td>${fmt(s.mw.now)} → ${fmt(s.mw['2028'])}</td></tr>`).join('') +
      '</table>' + (sites.length > limit ? `<span class="muted">+${sites.length - limit} more sites</span>` : '');
  }

  function draw() {
    const view = VIEWS[select.value] ? select.value : 'now', V = VIEWS[view], P = palette(), m = model(D, view);
    const rows = [...m.states.values()].filter(r => r.state);
    const max = Math.max(0, ...rows.map(r => r.value)), b = breaks(max);
    const bin = v => v <= 0 ? -1 : b.findIndex(x => v <= x) < 0 ? b.length : b.findIndex(x => v <= x);
    const fill = v => v <= 0 ? P.zero : P.ramp[P.ramp.length - 1 - b.length + bin(v)];
    svg.replaceChildren();
    svg.setAttribute('aria-label', `US states shaded by tracked AI data-center power, ${V.label.toLowerCase()} (MW)`);
    const defs = el('defs', {}, svg), pat = el('pattern', {id: 'usMapHatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)'}, defs);
    el('rect', {width: 6, height: 6, fill: P.none}, pat); el('line', {x1: 0, y1: 0, x2: 0, y2: 6, stroke: P.hatch, 'stroke-width': 1.4}, pat);
    const gStates = el('g', {}, svg), outline = el('path', {d: '', fill: 'none', stroke: P.ink, 'stroke-width': 2, 'stroke-linejoin': 'round', 'pointer-events': 'none'}, svg);
    const gCities = el('g', {}, svg), gLabels = el('g', {'pointer-events': 'none'}, svg);
    for (const [k, g] of Object.entries(G)) {
      const r = m.states.get(k);
      const p = el('path', {d: g.d, fill: r ? fill(r.value) : 'url(#usMapHatch)', stroke: P.paper, 'stroke-width': 1, 'stroke-linejoin': 'round', class: 'usmap-state'}, gStates);
      p.addEventListener('mouseenter', () => outline.setAttribute('d', g.d)); p.addEventListener('mouseleave', () => outline.setAttribute('d', ''));
      p.setAttribute('aria-label', g.name + (r ? `: ${mw(r.value)} ${V.short}` : ': no tracked site'));
      hover(p, () => r
        ? `<b>${esc(g.name)}</b>${mw(r.value)} ${esc(V.short)} · ${r.sites.length} tracked site${r.sites.length > 1 ? 's' : ''}<br><span class="muted">State total: ${mw(r.now)} online now → ${mw(r.y2028)} by end-2028 (Epoch facility power)</span>` +
          `<span class="muted small">Site · city · owner, MW now → end-2028</span>` + siteRows(r.sites, innerWidth < 600 ? 6 : 12)
        : `<b>${esc(g.name)}</b>No tracked site with this state in its Epoch address. That is not zero data-center capacity: Epoch tracks frontier campuses only${m.unlocated.sites.length ? `, and ${m.unlocated.sites.length} tracked US site${m.unlocated.sites.length > 1 ? 's have' : ' has'} no supported state` : ''}.`);
    }
    // Direct labels for the largest states only; text size is held near 11px on screen at any width.
    const scale = (svg.getBoundingClientRect().width || META.width) / META.width, fs = Math.min(26, 11.5 / scale);
    const narrow = scale < 0.6, top = rows.filter(r => r.value > 0).sort((a, b) => b.value - a.value).slice(0, narrow ? 4 : 6);
    const placed = [];
    for (const r of top) {
      const [x, y] = G[r.state].c, wBox = fs * 0.62 * Math.max(r.state.length, fmt(r.value).length) / 2, box = [x - wBox, y - fs, x + wBox, y + fs * 1.3];
      if (placed.some(q => box[0] < q[2] && q[0] < box[2] && box[1] < q[3] && q[1] < box[3])) continue; // skip a label that would collide
      placed.push(box);
      const dark = P.ramp.indexOf(fill(r.value)) >= P.darkFrom;
      // Inline style: the site's `svg text` rule would override presentation attributes. The halo in the state's own fill keeps text legible over city rings.
      const t = el('text', {x, y, 'text-anchor': 'middle', style: `font-size:${fs}px;font-weight:600;fill:${dark ? P.light : P.ink};paint-order:stroke;stroke:${fill(r.value)};stroke-width:${fs / 4}px;stroke-linejoin:round`}, gLabels);
      el('tspan', {x, dy: 0}, t).textContent = r.state;
      el('tspan', {x, dy: fs * 1.15, 'font-weight': 400}, t).textContent = fmt(r.value);
    }
    // City markers: the ten largest cities in this view (five on a phone-width map), area proportional to MW.
    const cities = m.cities.filter(c => c.value > 0 && CITY[c.city]).sort((a, b) => b.value - a.value).slice(0, narrow ? 5 : 10);
    const cmax = Math.max(1, ...cities.map(c => c.value)), rmax = Math.min(40, 20 / Math.sqrt(scale));
    for (const c of [...cities].reverse()) {
      const [x, y] = CITY[c.city];
      const g = el('g', {class: 'usmap-city', tabindex: 0}, gCities);
      el('circle', {cx: x, cy: y, r: Math.max(12, rmax + 4), fill: 'transparent'}, g);
      const cr = Math.max(3, rmax * Math.sqrt(c.value / cmax)), sw = 1.5 / Math.sqrt(scale);
      el('circle', {cx: x, cy: y, r: cr, fill: 'none', stroke: P.paper, 'stroke-width': sw * 3, 'stroke-opacity': 0.9}, g); // halo so rings read on the darkest fills
      el('circle', {cx: x, cy: y, r: cr, fill: 'none', stroke: P.ink, 'stroke-width': sw}, g);
      hover(g, () => `<b>${esc(c.city)}</b>${mw(c.value)} ${esc(V.short)} · ${c.sites.length} site${c.sites.length > 1 ? 's' : ''}<span class="muted small">Marker at the Census Gazetteer point for the city, not the site parcel.</span>` + siteRows(c.sites, innerWidth < 600 ? 4 : 8));
    }

    const sw = (style, label) => `<span><i class="usmap-swatch" style="${style}"></i>${label}</span>`;
    const lo = [0, ...b], steps = P.ramp.slice(P.ramp.length - 1 - b.length);
    legend.innerHTML = `<span class="ctl-label">${esc(V.label)} · MW</span>` +
      steps.map((c, i) => sw(`background:${c}`, i < b.length ? `${fmt(lo[i])}–${fmt(b[i])}` : `&gt;${fmt(lo[i])}`)).join('') +
      sw(`background:${P.zero}`, rows.some(r => r.value < 0) ? '0 or less in this view' : '0 in this view') +
      sw(`background:repeating-linear-gradient(45deg,${P.hatch} 0 1.4px,${P.none} 1.4px 4px)`, 'no tracked site') +
      `<span><i class="usmap-swatch usmap-ring"></i>Top ${cities.length} cities, circle area scales with MW</span>`;

    const un = m.unlocated, unNow = un.sites.reduce((a, s) => a + s.mw.now, 0), un28 = un.sites.reduce((a, s) => a + s.mw['2028'], 0);
    note.innerHTML = `Epoch AI frontier data-center tracker: ${D.us_sites} tracked US sites, facility power (MW). Covers frontier campuses only, not every data center; planned levels are Epoch projections and can slip. Retrieved ${esc(day)}. ` +
      `${byAddress} sites are placed by the state in their Epoch address, ${bySource} by a state named in their Epoch source links and ${byName} by their site name alone (each marked in the hover). ` +
      (D.unlocated ? `${D.unlocated} site${D.unlocated > 1 ? 's' : ''} (${mw(unNow)} now, ${mw(un28)} by end-2028) ${D.unlocated > 1 ? 'have' : 'has'} no supported state, ${D.unlocated > 1 ? 'are' : 'is'} not on the map and ${D.unlocated > 1 ? 'are' : 'is'} listed below, so a state marked “no tracked site” may still host ${D.unlocated > 1 ? 'one of them' : 'it'}. ` : '') +
      `Additions are the year-end level minus the level on the retrieval date. ${src(D.dataset_url || D.source_url, 'Epoch AI data')} (CC BY 4.0); boundaries us-atlas / U.S. Census Bureau; city points Census Gazetteer.`;
    if (unloc) unloc.hidden = !D.unlocated;
    if (unloc && D.unlocated) unloc.innerHTML = `<summary>${D.unlocated} tracked US site${D.unlocated > 1 ? 's' : ''} with no supported state (not mapped)</summary><ul class="small">` +
      un.sites.map(s => `<li>${esc(s.name)} · ${esc(s.owner || 'owner not listed')} · ${mw(s.mw.now)} now → ${mw(s.mw['2028'])} by end-2028${s.address ? ' · address: “' + esc(s.address) + '”' : ' · no address'}</li>`).join('') + '</ul>';

    const tableRows = rows.filter(r => r.value > 0 || view === 'now').sort((a, b) => b.value - a.value || b.y2028 - a.y2028).slice(0, 10).map(r => ({
      state: G[r.state].name, sites: r.sites.length, view_mw: r.value, mw_now: r.now, mw_end_2028: r.y2028,
      largest_site: r.sites[0].name, largest_site_mw_2028: r.sites[0].mw['2028'], view: V.label, retrieved_utc: D.retrieved_utc, source_url: D.source_url}));
    const cols = [{k: 'state', h: 'State'}, {k: 'sites', h: 'Sites'}, {k: 'mw_now', h: 'MW now', f: r => fmt(r.mw_now)}, {k: 'mw_end_2028', h: 'MW end-2028', f: r => fmt(r.mw_end_2028)},
      {k: 'largest_site', h: 'Largest site (end-2028)', f: r => `${esc(r.largest_site)} <span class="muted small">${fmt(r.largest_site_mw_2028)} MW</span>`}];
    if (view !== 'now' && view !== 'total2028') cols.splice(2, 0, {k: 'view_mw', h: V.short.replace('added', 'Added'), f: r => fmt(r.view_mw)});
    table('#usMapTable', tableRows, cols);
  }
  select.addEventListener('change', draw);
  onTheme(draw);
  let w = 0; addEventListener('resize', () => { const nw = svg.getBoundingClientRect().width; if (Math.abs(nw - w) > 40) { w = nw; draw(); } });
  draw(); w = svg.getBoundingClientRect().width;
})();
