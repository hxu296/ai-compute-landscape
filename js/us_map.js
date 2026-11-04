// US map of Epoch AI's tracked frontier data-center power over time (window.US_SITES from research/us-sites.json,
// geometry window.US_STATES / US_CITIES from data/us_states.js). 3D: an oblique (affine-tilted) map with one prism per
// city, height proportional to facility MW at the slider date; 2D: the same map flat with proportional circles.
// Needs common.js helpers: $, el, esc, src, hover, table, css, onTheme.
(function () {
  const r1 = v => Math.round(v * 10) / 10;
  // Latest dated value on or before day; 0 before the first observation (as in automation/snapshot_us_sites.level).
  function levelAt(series, day) {
    let v = 0;
    for (const [d, x] of series || []) { if (d <= day) v = x; else break; }
    return v;
  }
  // Monthly slider dates: month ends from Jan 2024 (or the first observation, if later) to the last projection (<= 2030).
  // The retrieval month uses the retrieval date itself, so the default frame equals the snapshot's "now".
  function months(D) {
    const start = (D.series_start && D.series_start > '2024-01' ? D.series_start : '2024-01').slice(0, 7);
    const end = ((D.series_end || '2030-01') < '2030-12' ? D.series_end || '2030-01' : '2030-12').slice(0, 7);
    const out = [];
    for (let y = +start.slice(0, 4), m = +start.slice(5, 7) - 1; `${y}-${String(m + 1).padStart(2, '0')}` <= end; m === 11 ? (y++, m = 0) : m++) {
      const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
      out.push(ym === D.now_date.slice(0, 7) ? D.now_date : new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10));
    }
    return out;
  }
  // Per-state and per-city rows at a date, summed from the sites themselves. Sites with a state but no city are grouped
  // at "<state> (city not given)" so they still get a column (placed at the state's centre by the renderer).
  // measure: 'mw' (facility MW, s.series) or 'capex' (Epoch estimated total capital cost, $B of 2025 USD, s.capex_series).
  const MEASURES = {mw: {series: 'series', end: s => s.mw['2028'], round: r1},
    capex: {series: 'capex_series', end: s => s.capex_busd['2028'], round: v => Math.round(v * 100) / 100}};
  function modelAt(D, day, measure = 'mw') {
    const M = MEASURES[measure], states = new Map(), cities = new Map();
    for (const s of D.sites) {
      const v = levelAt(s[M.series], day), k = s.state || null;
      if (!states.has(k)) states.set(k, {state: k, sites: [], value: 0, y2028: 0});
      const st = states.get(k); st.sites.push(s); st.value += v; st.y2028 += M.end(s);
      if (!k) continue;
      const ck = s.city ? `${s.city}, ${k}` : `${k} (city not given)`;
      if (!cities.has(ck)) cities.set(ck, {key: ck, state: k, city: s.city ? `${s.city}, ${k}` : null, sites: [], value: 0});
      const c = cities.get(ck); c.sites.push(s); c.value += v;
    }
    for (const x of [...states.values(), ...cities.values()]) {
      x.value = M.round(x.value); if ('y2028' in x) x.y2028 = M.round(x.y2028);
      x.sites.sort((a, b) => M.end(b) - M.end(a) || a.name.localeCompare(b.name));
    }
    return {states, cities: [...cities.values()], unlocated: states.get(null) || {state: null, sites: [], value: 0, y2028: 0},
      total: M.round(D.sites.reduce((a, s) => a + levelAt(s[M.series], day), 0))};
  }
  // State ranking kept for the data tests and any full map view; the hero itself now draws one neutral land colour and one column colour.
  // Fixed colour assignment: the seven states with the most tracked MW by end-2028 get a categorical slot, in this order;
  // every other state with a site is neutral. Ranked once, never by the slider, so a colour follows its state.
  const SLOTS = ['--s1', '--s2', '--s3', '--s4', '--s6', '--s5', '--s8'];
  function colourStates(D) {
    const tot = new Map();
    for (const s of D.sites) if (s.state) tot.set(s.state, (tot.get(s.state) || 0) + s.mw['2028']);
    return new Map([...tot].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, SLOTS.length).map(([k], i) => [k, SLOTS[i]]));
  }
  const api = {levelAt, months, modelAt, colourStates, SLOTS, MEASURES};
  if (typeof window !== 'undefined') window.US_MAP = api;
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof document === 'undefined') return;

  if (!window.US_SITES || !window.US_STATES) return;
  const svg = document.getElementById('usMapSvg'), heroSvg = document.getElementById('heroMap');
  if (!svg && !heroSvg) return;
  const D = window.US_SITES, G = window.US_STATES, CITY = window.US_CITIES || {}, META = window.US_MAP_META || {width: 960, height: 567};
  const note = $('#usMapNote'), legend = $('#usMapLegend'), unloc = $('#usMapUnlocated'), slider = $('#usMapTime'), readout = $('#usMapReadout'),
    play = $('#usMapPlay'), b3 = $('#usMap3d'), b2 = $('#usMap2d'), ticks = $('#usMapTicks'), bPow = $('#usMapPower'), bCap = $('#usMapCapex');
  const MONTHS = months(D), NOW = MONTHS.findIndex(d => d === D.now_date), COLOUR = colourStates(D);
  const fmt = v => Math.round(v).toLocaleString('en-US'), mw = v => fmt(v) + ' MW', gw = v => (v / 1000).toFixed(1) + ' GW';
  const usd = v => v >= 1000 ? '$' + (v / 1000).toFixed(2) + 'T' : '$' + (v >= 100 ? fmt(v) : v >= 1 || v === 0 ? v.toFixed(1) : v.toFixed(2)) + 'B';
  // Display rules per measure; colours stay ranked by MW (colourStates) whichever measure is shown.
  const SHOW = {mw: {short: v => gw(v), long: v => mw(v), name: 'power', unit: 'MW', col: 'MW'},
    capex: {short: v => usd(v), long: v => usd(v), name: 'capex', unit: '$B', col: '$B'}};
  const dayLong = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
  const dayMonth = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', {month: 'short', year: 'numeric', timeZone: 'UTC'});
  const label = i => i === NOW ? dayLong(MONTHS[i]) : dayMonth(MONTHS[i]), dayLabel = d => d === D.now_date ? dayLong(d) : dayMonth(d);
  const byAddress = D.sites.filter(s => s.state && s.state_basis !== 'site name' && s.state_basis !== 'source text').length;
  const byName = D.sites.filter(s => s.state_basis === 'site name').length, bySource = D.sites.filter(s => s.state_basis === 'source text').length;
  let mode = '3d', measure = 'mw', idx = NOW < 0 ? MONTHS.length - 1 : NOW, timer = null;

  // ---- geometry: parse the projected paths once; 3D is an affine tilt (rotate, then compress y) of the same points
  const W = META.width, H = META.height, CX = W / 2, CY = H / 2, TH = 0.07, K = 0.56;
  const tilt = ([x, y]) => { const dx = x - CX, dy = y - CY; return [CX + dx * Math.cos(TH) - dy * Math.sin(TH), CY + (dx * Math.sin(TH) + dy * Math.cos(TH)) * K]; };
  const rings = Object.fromEntries(Object.entries(G).map(([k, g]) => [k, (g.d.match(/[MLZ][^MLZ]*/g) || []).map(t => [t[0], t.slice(1) ? t.slice(1).split(',').map(Number) : null])]));
  const pathOf = (k, T) => rings[k].map(([c, p]) => p ? c + T(p).map(v => v.toFixed(1)).join(',') : c).join('');
  const PATHS = {'2d': {}, '3d': {}};
  for (const k of Object.keys(G)) { PATHS['2d'][k] = G[k].d; PATHS['3d'][k] = pathOf(k, tilt); }
  const pos = c => CITY[c.key] || G[c.state].c; // city point, or the state centre when Epoch gives no city
  // One linear height scale for the whole timeline (the tallest column at any date reaches HMAX), so Play is comparable.
  const HMAX = 150, A = 6.5;
  const CMAX = Object.fromEntries(Object.keys(MEASURES).map(k => [k, Math.max(1e-9, ...MONTHS.map(d => Math.max(0, ...modelAt(D, d, k).cities.map(c => c.value))))]));
  const REF = {mw: [1000, '1 GW'], capex: CMAX.capex >= 60 ? [25, '$25B'] : [10, '$10B']};
  const hOf = (v, k = measure) => HMAX * v / CMAX[k];
  const b3d = (() => { // frame: the tilted map plus the highest column top at any date, plus room for labels
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const k of Object.keys(G)) for (const [, p] of rings[k]) if (p) { const [x, y] = tilt(p); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    let top = y0;
    for (const k of Object.keys(MEASURES)) for (const d of MONTHS) for (const c of modelAt(D, d, k).cities) top = Math.min(top, tilt(pos(c))[1] - A * K - hOf(c.value, k));
    return [x0 - 8, top - 34, x1 - x0 + 16, y1 - top + 34 + 14];
  })();

  // ---- colours
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec((c || '').trim()); const n = m ? parseInt(m[1], 16) : 0x888888; return [n >> 16, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v * (1 - t) + hex(b)[i] * t).toString(16).padStart(2, '0')).join('');
  function palette() {
    const paper = css('--paper') || '#fffdf8', ink = css('--ink') || '#161513', line = css('--line') || '#d8d0c4';
    // One neutral land colour and one column colour: the state fills carried no meaning, the columns carry the measure.
    const land = mix(line, paper, 0.18), column = css('--map-column') || '#2c7a70';
    const base = () => column;
    return {paper, ink, line, muted: css('--muted') || '#6d6860', wash: css('--wash') || '#f3eee4', base,
      tint: () => land, none: land};
  }

  function siteRows(sites, day, limit) {
    const basis = s => s.state_basis === 'site name' ? ' · <i>state inferred from site name</i>' : s.state_basis === 'source text' ? ' · <i>state from Epoch source text, not address</i>' : '';
    return `<span class="muted small">Site · owner; at ${esc(dayLabel(day))}, then end-2028 (MW · est. capex)</span><table class="usmap-tip">` +
      sites.slice(0, limit).map(s => `<tr><td>${esc(s.name)}<span class="muted"> · ${esc(s.owner || 'owner not listed')}${s.city ? '' : ' · city not given'}${basis(s)}</span></td>` +
        `<td>${fmt(levelAt(s.series, day))} MW · ${usd(levelAt(s.capex_series, day))}<br><span class="muted">${fmt(s.mw['2028'])} MW · ${usd(s.capex_busd['2028'])}</span></td></tr>`).join('') +
      '</table>' + (sites.length > limit ? `<span class="muted">+${sites.length - limit} more sites</span>` : '');
  }
  const statusOf = day => day > D.now_date ? 'Epoch projection' : day === D.now_date ? 'latest Epoch data (retrieval date)' : 'Epoch dated observations';
  const status = () => statusOf(MONTHS[idx]);

  // ---- labels: city + GW above the tallest columns, skipped when they would collide or leave the frame
  function labeller(gLabels, fs, frame, P, measure) {
    const boxes = [];
    return (x, yTop, name, value) => {
      const w = fs * 0.64 * Math.max(name.length, 6) + fs * 0.6, h = fs * 2.4;
      const tries = [[0, 0, 'middle'], [0, h * 0.9, 'middle'], [0, h * 1.8, 'middle'], [-w / 2 - fs * 0.4, h * 0.6, 'end'], [w / 2 + fs * 0.4, h * 0.6, 'start']];
      for (const [dx, up, anchor] of tries) {
        const cx = x + dx, base = yTop - up, l = anchor === 'middle' ? cx - w / 2 : anchor === 'end' ? cx - w : cx, box = [l - 2, base - h - 2, l + w + 2, base + 1];
        if (box[0] < frame[0] || box[2] > frame[0] + frame[2] || box[1] < frame[1]) continue;
        if (boxes.some(q => box[0] < q[2] && q[0] < box[2] && box[1] < q[3] && q[1] < box[3])) continue;
        boxes.push(box, [x - 1, base, x + 1, yTop]); // the leader line also blocks later labels
        if (up || dx) el('line', {x1: x, y1: yTop, x2: anchor === 'middle' ? cx : anchor === 'end' ? cx + 2 : cx - 2, y2: base - (dx ? fs * 0.8 : 0), stroke: P.muted, 'stroke-width': Math.max(0.6, 0.8 / Math.max(fs / 11, 1) * fs / 11)}, gLabels);
        const t = el('text', {x: cx, y: base - fs * 1.25, 'text-anchor': anchor, style: `font-size:${fs}px;font-weight:600;fill:${P.ink};paint-order:stroke;stroke:${P.paper};stroke-width:${fs / 3.5}px;stroke-linejoin:round`}, gLabels);
        el('tspan', {x: cx, dy: 0}, t).textContent = name;
        const v = el('tspan', {x: cx, dy: fs * 1.15}, t); v.textContent = SHOW[measure].short(value); v.setAttribute('style', `font-weight:400;fill:${P.muted}`);
        return true;
      }
      return false;
    };
  }

  // Draw the map into any <svg>; Fig. 1b and the page hero both use this (window.USMap.render).
  // o: {day: 'YYYY-MM-DD', measure: 'mw' | 'capex', mode: '3d' | '2d', compact: fewer labels for the hero}
  function render(svg, o = {}) {
    const day = o.day || D.now_date, measure = MEASURES[o.measure] ? o.measure : 'mw', mode = o.mode === '2d' ? '2d' : '3d', compact = !!o.compact;
    const label = () => dayLabel(day), status = () => statusOf(day), hOf = v => HMAX * v / CMAX[measure], hatch = svg.id + 'Hatch';
    const P = palette(), m = modelAt(D, day, measure), is3d = mode === '3d', T = is3d ? tilt : p => p, S = SHOW[measure];
    const both = sites => [sites.reduce((a, s) => a + levelAt(s.series, day), 0), sites.reduce((a, s) => a + levelAt(s.capex_series, day), 0)];
    const bothLine = sites => { const [w, c] = both(sites); return `${mw(w)} · ${usd(c)} est. capex`; };
    const frame = is3d ? b3d : [0, 0, W, H];
    svg.setAttribute('viewBox', frame.map(v => v.toFixed(1)).join(' '));
    svg.replaceChildren();
    svg.setAttribute('aria-label', `${is3d ? '3D columns' : 'Circles'} of tracked AI data-center ${measure === 'mw' ? 'power (MW)' : 'estimated capex ($B)'} by US city at ${label()} (${status()})`);
    const scale = (svg.getBoundingClientRect().width || frame[2]) / frame[2], narrow = scale < 0.6, fs = Math.min(30, 11 / scale);
    const defs = el('defs', {}, svg), pat = el('pattern', {id: hatch, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)'}, defs);
    el('rect', {width: 6, height: 6, fill: P.none}, pat); el('line', {x1: 0, y1: 0, x2: 0, y2: 6, stroke: P.line, 'stroke-width': 1.2}, pat);
    if (is3d) { const slab = el('g', {transform: 'translate(0,5)', 'pointer-events': 'none'}, svg); for (const k of Object.keys(G)) el('path', {d: PATHS['3d'][k], fill: mix(P.line, P.ink, 0.12), stroke: mix(P.line, P.ink, 0.12), 'stroke-width': 1}, slab); }
    const gStates = el('g', {}, svg), outline = el('path', {d: '', fill: 'none', stroke: P.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'pointer-events': 'none'}, svg);
    const gCols = el('g', {}, svg), gLabels = el('g', {'pointer-events': 'none'}, svg);
    for (const k of Object.keys(G)) {
      const r = m.states.get(k), d = PATHS[mode][k];
      const p = el('path', {d, fill: P.tint(k), stroke: P.paper, 'stroke-width': 1, 'stroke-linejoin': 'round', class: 'usmap-state'}, gStates);
      p.addEventListener('mouseenter', () => outline.setAttribute('d', d)); p.addEventListener('mouseleave', () => outline.setAttribute('d', ''));
      p.setAttribute('aria-label', G[k].name + (r ? `: ${S.long(r.value)} at ${label()}` : ': no tracked site'));
      hover(p, () => r
        ? `<b>${esc(G[k].name)}</b>${bothLine(r.sites)} at ${esc(label())} (${esc(status())}) · ${r.sites.length} tracked site${r.sites.length > 1 ? 's' : ''}<br><span class="muted">End-2028: ${mw(r.sites.reduce((a, s) => a + s.mw['2028'], 0))} · ${usd(r.sites.reduce((a, s) => a + s.capex_busd['2028'], 0))}</span>` + siteRows(r.sites, day, innerWidth < 600 ? 6 : 12)
        : `<b>${esc(G[k].name)}</b>No tracked site in this state. That is not zero data-center capacity: Epoch tracks frontier campuses only${m.unlocated.sites.length ? `, and ${m.unlocated.sites.length} tracked US site${m.unlocated.sites.length > 1 ? 's have' : ' has'} no supported state` : ''}.`);
    }
    const cols = m.cities.filter(c => c.value > 0).map(c => ({...c, p: pos(c)}));
    const tipFor = c => () => `<b>${esc(c.city || G[c.state].name + ' · city not given')}</b>${bothLine(c.sites)} at ${esc(label())} (${esc(status())}) · ${c.sites.length} site${c.sites.length > 1 ? 's' : ''}` +
      `<span class="muted small">${CITY[c.key] ? 'Placed at the Census Gazetteer point for the city, not the site parcel.' : c.city ? 'No Census point for this city: placed at the state’s centre.' : 'Epoch gives no city: placed at the state’s centre.'}</span>` + siteRows(c.sites, day, innerWidth < 600 ? 4 : 8);
    const place = labeller(gLabels, fs, frame, P, measure), nLabels = compact ? (narrow ? 2 : 4) : narrow ? 4 : 6;
    if (is3d) {
      // Prisms drawn back to front (north first). Faces: hidden back faces first, then the lit front faces, then the top.
      const prisms = cols.map(c => {
        const [x, y] = c.p, base = [[x, y - A * 1.3], [x + A * 1.3, y], [x, y + A * 1.3], [x - A * 1.3, y]].map(tilt), h = hOf(c.value);
        return {c, base, h, y: tilt(c.p)[1]};
      }).sort((a, b) => a.y - b.y);
      const touch = 18 / scale;
      for (const q of prisms) {
        const col = P.base(q.c.state), top = q.base.map(([x, y]) => [x, y - q.h]), mid = q.base.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
        const g = el('g', {class: 'usmap-col', tabindex: 0, role: 'button', 'aria-label': `${q.c.city || G[q.c.state].name}: ${S.long(q.c.value)}`}, gCols);
        const faces = q.base.map((p, i) => { const n = q.base[(i + 1) % 4], ex = (p[0] + n[0]) / 2 - mid[0], ey = (p[1] + n[1]) / 2 - mid[1]; return {p, n, i, ex, ey}; }).sort((a, b) => a.ey - b.ey);
        for (const f of faces) {
          const pts = [f.p, f.n, top[(f.i + 1) % 4], top[f.i]].map(v => v.map(z => z.toFixed(1)).join(',')).join(' ');
          el('polygon', {points: pts, fill: f.ex > 0 ? mix(col, '#000', 0.34) : mix(col, '#000', 0.08), stroke: mix(col, '#000', 0.45), 'stroke-width': 0.5, 'stroke-linejoin': 'round'}, g);
        }
        el('polygon', {points: top.map(v => v.map(z => z.toFixed(1)).join(',')).join(' '), fill: mix(col, '#fff', 0.3), stroke: mix(col, '#000', 0.35), 'stroke-width': 0.5}, g);
        const xs = q.base.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), yb = Math.max(...q.base.map(p => p[1])), yt = Math.min(...top.map(p => p[1]));
        const padX = Math.max(0, (touch - (x1 - x0)) / 2), padY = Math.max(0, (touch - (yb - yt)) / 2);
        el('rect', {x: x0 - padX, y: yt - padY, width: x1 - x0 + 2 * padX, height: yb - yt + 2 * padY, fill: 'transparent'}, g);
        q.labelAt = [(x0 + x1) / 2, yt - 3];
        hover(g, tipFor(q.c));
      }
      // Label the tallest columns that have a real city (a state-centre placeholder is not a place); try more candidates so collisions skip, not stack.
      let shown = 0; for (const q of [...prisms].filter(q => q.c.city).sort((a, b) => b.c.value - a.c.value)) { if (shown >= nLabels) break; if (place(q.labelAt[0], q.labelAt[1], shortName(q.c), q.c.value)) shown++; }
      // Reference column (1 GW or $10B/$25B) on the same scale, in the empty Atlantic corner.
      const rx = frame[0] + frame[2] - 54 / Math.max(scale, 0.5), ry = frame[1] + frame[3] - 22, rh = hOf(REF[measure][0]);
      const rb = [[rx - A, ry - A * K], [rx + A, ry - A * K], [rx + A, ry + A * K], [rx - A, ry + A * K]];
      const ref = el('g', {'pointer-events': 'none'}, svg);
      el('polygon', {points: [rb[3], rb[2], [rb[2][0], rb[2][1] - rh], [rb[3][0], rb[3][1] - rh]].map(v => v.join(',')).join(' '), fill: mix(P.line, P.ink, 0.35)}, ref);
      el('polygon', {points: rb.map(([x, y]) => [x, y - rh].join(',')).join(' '), fill: mix(P.line, P.ink, 0.15)}, ref);
      const rt = el('text', {x: rx - A - 4, y: ry - rh / 2, 'text-anchor': 'end', style: `font-size:${fs * 0.95}px;fill:${P.muted}`}, ref); rt.textContent = REF[measure][1];
    } else {
      const RMAX = 30, rOf = v => RMAX * Math.sqrt(v / CMAX[measure]);
      for (const c of [...cols].sort((a, b) => b.value - a.value)) {
        const [x, y] = c.p, g = el('g', {class: 'usmap-col', tabindex: 0, role: 'button', 'aria-label': `${c.city || G[c.state].name}: ${S.long(c.value)}`}, gCols), r = Math.max(2, rOf(c.value));
        el('circle', {cx: x, cy: y, r: Math.max(r, 9 / scale), fill: 'transparent'}, g);
        el('circle', {cx: x, cy: y, r, fill: P.base(c.state), 'fill-opacity': 0.82, stroke: P.paper, 'stroke-width': 1.2}, g);
        c.labelAt = [x, y - r - 2];
        hover(g, tipFor(c));
      }
      for (const c of [...cols].sort((a, b) => b.value - a.value).slice(0, nLabels)) place(c.labelAt[0], c.labelAt[1], shortName(c), c.value);
      const rx = W - 60, ry = H - 40, rr = rOf(REF[measure][0]), ref = el('g', {'pointer-events': 'none'}, svg);
      el('circle', {cx: rx, cy: ry, r: rr, fill: 'none', stroke: P.muted, 'stroke-width': 1}, ref);
      const rt = el('text', {x: rx - rr - 5, y: ry + 4, 'text-anchor': 'end', style: `font-size:${fs * 0.95}px;fill:${P.muted}`}, ref); rt.textContent = REF[measure][1];
    }
    return {total: m.total, P, is3d, text: `Online at ${label()} · ${S.short(m.total)}${measure === 'capex' ? ' est. capex' : ''} tracked US · ${status()}`};
  }
  function draw() {
    const r = render(svg, {day: MONTHS[idx], measure, mode});
    readout.textContent = r.text; slider.setAttribute('aria-valuetext', r.text);
    drawLegend(r.P, r.is3d);
  }
  const shortName = c => c.city ? c.city : `${G[c.state].name}, no city`;

  function drawLegend(P, is3d) {
    const sw = (bg, t) => `<span><i class="usmap-swatch" style="background:${bg}"></i>${t}</span>`;
    legend.innerHTML = [...COLOUR.keys()].map(k => sw(P.base(k), esc(G[k].name))).join('') + sw(P.base('__'), 'other states with a tracked site') +
      sw(`repeating-linear-gradient(45deg,${P.line} 0 1.2px,${P.none} 1.2px 4px)`, 'no tracked site') +
      `<span class="muted">${is3d ? 'Column height' : 'Circle area'} = city ${measure === 'mw' ? 'MW' : 'estimated capex ($B, 2025 USD)'}, one scale for all dates; colours by MW rank</span>`;
  }

  function drawText() {
    const m = modelAt(D, MONTHS[idx], measure), S = SHOW[measure], un = m.unlocated, un28 = un.sites.reduce((a, s) => a + s.mw['2028'], 0);
    note.innerHTML = `Epoch AI frontier data-center tracker: ${D.us_sites} tracked US sites, facility power (MW). Covers frontier campuses only, not every data center; planned levels are Epoch projections and can slip. Retrieved ${esc(dayLong(D.now_date))}. ` +
      `Each site's level is its latest Epoch observation or projection on or before the slider date; dates after the retrieval date are projections. Columns (3D) and circles (2D) sum the sites in a city on one fixed scale per measure; sites without a city or Census city point sit at their state's centre. ` +
      `Capex is Epoch's estimated total capital cost (compute + construction, 2025 USD): a model estimate, not company-reported spend. ` +
      `${byAddress} sites are placed by the state in their Epoch address, ${bySource} by a state named in their Epoch source links and ${byName} by their site name alone (each marked in the hover). ` +
      (D.unlocated ? `${D.unlocated} site${D.unlocated > 1 ? 's' : ''} (${mw(un28)} by end-2028) ${D.unlocated > 1 ? 'have' : 'has'} no supported state, ${D.unlocated > 1 ? 'are' : 'is'} not on the map but ${D.unlocated > 1 ? 'are' : 'is'} in the US total and listed below, so a state marked “no tracked site” may still host ${D.unlocated > 1 ? 'one of them' : 'it'}. ` : '') +
      `State colours mark the ${COLOUR.size} states with the most tracked MW by end-2028; the rest share one neutral. ${src(D.dataset_url || D.source_url, 'Epoch AI data')} (CC BY 4.0); boundaries us-atlas / U.S. Census Bureau; city points Census Gazetteer.`;
    if (unloc) unloc.hidden = !D.unlocated;
    if (unloc && D.unlocated) unloc.innerHTML = `<summary>${D.unlocated} tracked US site${D.unlocated > 1 ? 's' : ''} with no supported state (not mapped)</summary><ul class="small">` +
      un.sites.map(s => `<li>${esc(s.name)} · ${esc(s.owner || 'owner not listed')} · ${mw(levelAt(s.series, MONTHS[idx]))} · ${usd(levelAt(s.capex_series, MONTHS[idx]))} est. capex at ${esc(label(idx))} → ${mw(s.mw['2028'])} · ${usd(s.capex_busd['2028'])} by end-2028${s.address ? ' · address: “' + esc(s.address) + '”' : ' · no address'}</li>`).join('') + '</ul>';
    const rows = [...m.states.values()].filter(r => r.state && r.value > 0).sort((a, b) => b.value - a.value || b.y2028 - a.y2028).slice(0, 10).map(r => {
      const key = MEASURES[measure].series, big = [...r.sites].sort((a, b) => levelAt(b[key], MONTHS[idx]) - levelAt(a[key], MONTHS[idx]) || MEASURES[measure].end(b) - MEASURES[measure].end(a))[0];
      return {state: G[r.state].name, sites: r.sites.length, value_at_date: r.value, value_end_2028: r.y2028, unit: measure === 'mw' ? 'MW facility power' : 'USD billions (2025), Epoch estimated total capital cost',
        date: MONTHS[idx], basis: status(), largest_site: big.name, largest_site_value: levelAt(big[key], MONTHS[idx]), retrieved_utc: D.retrieved_utc, source_url: D.source_url};
    });
    const cell = v => measure === 'mw' ? fmt(v) : usd(v);
    $('#usMapTableTitle') && ($('#usMapTableTitle').textContent = `Top ten states at ${label(idx)}${MONTHS[idx] > D.now_date ? ' (projected)' : ''}`);
    table('#usMapTable', rows, [{k: 'state', h: 'State'}, {k: 'sites', h: 'Sites'}, {k: 'value_at_date', h: `${S.col} at date`, f: r => cell(r.value_at_date)},
      {k: 'value_end_2028', h: `${S.col} end-2028`, f: r => cell(r.value_end_2028)}, {k: 'largest_site', h: 'Largest site at date', f: r => `${esc(r.largest_site)} <span class="muted small">${measure === 'mw' ? fmt(r.largest_site_value) + ' MW' : usd(r.largest_site_value)}</span>`}]);
  }

  window.USMap = {render, months: MONTHS, nowIndex: NOW, total: (day, k = 'mw') => modelAt(D, day, k).total, gw, dayLabel, statusOf};

  // ---- page hero: the same 3D map, scrubbed through time by scrolling a sticky hero (static under reduced motion
  // or when the hero is taller than the viewport). At rest (before the hero pins) it shows the retrieval date, because
  // Jan 2024 is nearly empty (0.6 GW); once pinned, scrolling replays Jan 2024 -> Epoch's last projection.
  function hero() {
    const track = document.getElementById('heroTrack'), sec = heroSvg && heroSvg.closest('.hero');
    if (!heroSvg || !track || !sec) return;
    const out = document.getElementById('heroReadout'), bar = document.getElementById('heroProgress'), hint = document.getElementById('heroHint'), nav = document.getElementById('readingNav');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let shown = -1, raf = 0, still = false, stick = 0;
    const navH = () => nav ? nav.offsetHeight : 0;
    const layout = () => {
      const kids = [...sec.children].map(e => e.getBoundingClientRect()), cs = getComputedStyle(sec);
      const need = Math.max(...kids.map(r => r.bottom)) - Math.min(...kids.map(r => r.top)) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      still = reduce.matches || need > innerHeight - navH();
      track.classList.toggle('hero-static', still);
      // Pin the hero centred in the viewport below the reading nav, so the stage reads as intentional, not blank.
      stick = Math.round(Math.max(navH(), navH() + (innerHeight - navH() - sec.offsetHeight) / 2));
      document.documentElement.style.setProperty('--hero-top', stick + 'px');
      if (hint) hint.textContent = still ? `Shown at the retrieval date, ${dayLong(D.now_date)}.` : 'Scroll to play 2025 to Epoch’s last projection.';
    };
    const frame = () => {
      raf = 0;
      // The hero opens on Jan 2025 and scrolling plays Jan 2025 -> Epoch's last projection (owner's choice).
      const S0 = Math.max(0, MONTHS.findIndex(d => d >= '2025-01-01'));
      let p = 1, i = still ? (NOW < 0 ? MONTHS.length - 1 : NOW) : S0;
      if (!still) { const range = Math.max(1, track.offsetHeight - sec.offsetHeight), raw = (stick - track.getBoundingClientRect().top) / range;
        p = Math.min(1, Math.max(0, raw)); if (raw > 0) i = S0 + Math.round(p * (MONTHS.length - 1 - S0)); }
      if (bar) bar.style.width = (100 * (i - S0) / Math.max(1, MONTHS.length - 1 - S0)).toFixed(1) + '%';
      track.classList.toggle('hero-playing', !still && p > 0);
      if (i === shown) return;
      shown = i;
      const day = MONTHS[i], r = render(heroSvg, {day, measure: 'mw', mode: '3d', compact: true});
      const capex = modelAt(D, day, 'capex').total;
      out.innerHTML = `<span class="hero-date">${esc(dayMonth(day))}</span><span class="hero-total">${esc(gw(r.total))} <span class="hero-sep">·</span> ${esc(usd(capex))} est. capex <span class="hero-scope">tracked US</span></span><span class="hero-status">${esc(statusOf(day))}</span>`;
      heroSvg.setAttribute('aria-label', `3D map of tracked AI data-center power by US city, ${dayMonth(day)}: ${gw(r.total)} and ${usd(capex)} estimated capex tracked US (${statusOf(day)})`);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', queue, {passive: true});
    let hw = innerWidth;
    addEventListener('resize', () => { if (Math.abs(innerWidth - hw) < 2 && !still) { queue(); return; } hw = innerWidth; layout(); shown = -1; queue(); });
    reduce.addEventListener('change', () => { layout(); shown = -1; queue(); });
    onTheme(() => { shown = -1; queue(); });
    // Content above the hero (the news banner, fonts) can settle after this script runs: re-measure on layout changes.
    let lastTop = null;
    const settle = () => { const t = Math.round(track.getBoundingClientRect().top + scrollY); if (t !== lastTop) { lastTop = t; layout(); queue(); } };
    if (window.ResizeObserver) new ResizeObserver(settle).observe(document.body);
    addEventListener('load', settle);
    layout(); frame(); lastTop = Math.round(track.getBoundingClientRect().top + scrollY);
  }
  hero();
  if (!svg) return;

  // ---- controls
  slider.min = 0; slider.max = MONTHS.length - 1; slider.step = 1; slider.value = idx;
  if (ticks) ticks.innerHTML = MONTHS.map((d, i) => d.endsWith('-01-31') || i === 0 ? `<span style="left:${(100 * i / (MONTHS.length - 1)).toFixed(2)}%">${d.slice(0, 4)}</span>` : '').join('') +
    '';
  if (ticks && NOW >= 0) { const n = document.createElement('span'); n.className = 'usmap-now'; n.title = 'Retrieval date: later dates are Epoch projections'; n.textContent = '▼';
    n.style.left = `calc(8px + (100% - 16px) * ${(NOW / (MONTHS.length - 1)).toFixed(4)})`; ticks.parentNode.appendChild(n); }
  const stop = () => { if (timer) cancelAnimationFrame(timer); timer = null; play.textContent = '▶ Play'; play.setAttribute('aria-pressed', 'false'); drawText(); };
  let touched = false;
  slider.addEventListener('input', () => { if (timer) stop(); touched = true; idx = +slider.value; draw(); });
  slider.addEventListener('change', drawText);
  play.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (idx >= MONTHS.length - 1 || !touched) { idx = 0; touched = true; }
    const from = idx, t0 = performance.now(), ms = 7000 * (MONTHS.length - 1 - from) / (MONTHS.length - 1);
    play.textContent = '❚❚ Pause'; play.setAttribute('aria-pressed', 'true');
    const step = t => { const next = Math.min(MONTHS.length - 1, from + Math.floor((t - t0) / ms * (MONTHS.length - 1 - from)));
      if (next !== idx) { idx = next; slider.value = idx; draw(); }
      if (idx >= MONTHS.length - 1) stop(); else timer = requestAnimationFrame(step); };
    timer = requestAnimationFrame(step);
  });
  const setMode = m => { mode = m; b3.classList.toggle('on', m === '3d'); b2.classList.toggle('on', m === '2d'); b3.setAttribute('aria-pressed', m === '3d'); b2.setAttribute('aria-pressed', m === '2d'); draw(); };
  b3.addEventListener('click', () => setMode('3d')); b2.addEventListener('click', () => setMode('2d'));
  const setMeasure = k => { measure = k; bPow.classList.toggle('on', k === 'mw'); bCap.classList.toggle('on', k === 'capex'); bPow.setAttribute('aria-pressed', k === 'mw'); bCap.setAttribute('aria-pressed', k === 'capex'); draw(); drawText(); };
  if (bPow && bCap) { bPow.addEventListener('click', () => setMeasure('mw')); bCap.addEventListener('click', () => setMeasure('capex')); }
  onTheme(() => { draw(); });
  let w = 0; addEventListener('resize', () => { const nw = svg.getBoundingClientRect().width; if (Math.abs(nw - w) > 40) { w = nw; draw(); } });
  setMode('3d'); drawText(); w = svg.getBoundingClientRect().width;
})();
