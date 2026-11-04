// Hand-drawn masthead mark (a data hall of GPU racks). Seeded, so it draws the same every load. The page hero is now the 3D map in js/us_map.js.
(function () {
  const INK = "#2a2420", RED = "#c23a2b", SAND = "#e9dfc9", BLUE = "#dbe4ee", PINK = "#f6d9d2";
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const j = a => (rnd() - 0.5) * 2 * a;
  // a slightly bowed stroke, drawn twice like a pen going over a line
  function line(svg, x1, y1, x2, y2, o = {}) {
    const w = o.w || 2, c = o.c || INK, a = o.j ?? 0.9;
    for (const [k, op] of [[1, 1], [0.7, 0.75]]) {
      const mx = (x1 + x2) / 2 + j(a * 1.5), my = (y1 + y2) / 2 + j(a * 1.5);
      el("path", { d: `M${x1 + j(a)},${y1 + j(a)}Q${mx},${my} ${x2 + j(a)},${y2 + j(a)}`, stroke: c, "stroke-width": w * k, "stroke-opacity": op, fill: "none", "stroke-linecap": "round" }, svg);
    }
  }
  function box(svg, x, y, w, h, o = {}) {
    if (o.fill) el("rect", { x: x + j(0.6), y: y + j(0.6), width: w, height: h, rx: o.rx ?? 1.5, fill: o.fill }, svg);
    const p = { w: o.w || 2, c: o.c || INK, j: o.j };
    line(svg, x, y, x + w, y, p); line(svg, x + w, y, x + w, y + h, p); line(svg, x + w, y + h, x, y + h, p); line(svg, x, y + h, x, y, p);
  }
  function hatch(svg, x, y, w, h, c = RED, gap = 5) {
    for (let t = gap; t < w + h; t += gap) {
      const ax = x + Math.max(0, t - h), ay = y + Math.min(h, t), bx = x + Math.min(w, t), by = y + Math.max(0, t - w);
      el("path", { d: `M${ax + j(0.5)},${ay + j(0.5)}L${bx + j(0.5)},${by + j(0.5)}`, stroke: c, "stroke-width": 1.1, "stroke-opacity": 0.85, "stroke-linecap": "round" }, svg);
    }
  }
  function brand() {
    const svg = document.getElementById("brandArt"); if (!svg) return; svg.innerHTML = ""; seed = 3;
    box(svg, 4, 9, 56, 46, { fill: SAND, w: 2.2 });
    for (let k = 0; k < 3; k++) { const x = 12 + k * 14; box(svg, x, 19, 10, 28, { fill: k === 1 ? PINK : BLUE, w: 1.6 }); if (k === 1) hatch(svg, x + 1, 20, 8, 26, RED, 4); }
  }
  brand();
})();
