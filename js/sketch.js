// Hand-drawn illustration: a data hall of GPU racks fed by a transmission line. Seeded, so it draws the same every load.
(function () {
  const INK = "#2a2420", RED = "#c23a2b", SAND = "#e9dfc9", BLUE = "#dbe4ee", PINK = "#f6d9d2", AMBER = "#e8cf8f";
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
  function cross(svg, x, y) { line(svg, x - 5, y, x + 5, y, { c: RED, w: 1.3, j: 0.3 }); line(svg, x, y - 5, x, y + 5, { c: RED, w: 1.3, j: 0.3 }); }

  function hero() {
    const svg = document.getElementById("heroArt"); if (!svg) return; svg.innerHTML = ""; seed = 7;
    // ground
    line(svg, 6, 262, 394, 262, { w: 1.6 });
    for (let x = 14; x < 390; x += 9) line(svg, x, 266, x - 6, 274, { w: 0.9, j: 0.3, c: "#9a9488" });
    // transmission tower and wires
    const tx = 44;
    line(svg, tx - 16, 262, tx - 3, 70, { w: 1.8 }); line(svg, tx + 16, 262, tx + 3, 70, { w: 1.8 });
    for (let k = 0; k < 5; k++) { const y1 = 250 - k * 38, y2 = y1 - 38, a = 16 - k * 2.6, b = 16 - (k + 1) * 2.6;
      line(svg, tx - a, y1, tx + b, y2, { w: 1, j: 0.4 }); line(svg, tx + a, y1, tx - b, y2, { w: 1, j: 0.4 }); }
    line(svg, tx - 26, 92, tx + 26, 92, { w: 1.6 }); line(svg, tx - 20, 112, tx + 20, 112, { w: 1.6 });
    for (const [y, d] of [[92, 26], [112, 20]]) el("path", { d: `M${tx + d},${y} Q${(tx + 150) / 2},${y + 34} 150,${y + 30}`, stroke: INK, "stroke-width": 1.2, fill: "none", "stroke-opacity": 0.8 }, svg);
    // substation
    box(svg, 96, 214, 44, 48, { fill: AMBER, w: 1.8 });
    hatch(svg, 98, 216, 40, 44, "#b7791f", 6);
    line(svg, 118, 214, 118, 150, { w: 1.4 }); line(svg, 118, 150, 150, 122, { w: 1.2 });
    // the hall
    box(svg, 150, 104, 236, 158, { fill: SAND, w: 2.4 });
    line(svg, 146, 104, 268, 78, { w: 2 }); line(svg, 268, 78, 390, 104, { w: 2 });
    // cooling units on the roof
    for (const cx of [196, 268, 340]) { box(svg, cx - 18, 86 + (cx === 268 ? -6 : 4), 36, 14, { fill: "#fffdf8", w: 1.4 });
      el("circle", { cx: cx - 8, cy: 93 + (cx === 268 ? -6 : 4), r: 4, fill: "none", stroke: INK, "stroke-width": 1.1 }, svg);
      el("circle", { cx: cx + 8, cy: 93 + (cx === 268 ? -6 : 4), r: 4, fill: "none", stroke: INK, "stroke-width": 1.1 }, svg); }
    // racks: two rows, a few holding GPUs (red hatching)
    const gpu = new Set([1, 2, 5, 8, 9, 10]);
    let i = 0;
    for (const ry of [124, 190]) for (let k = 0; k < 6; k++, i++) {
      const x = 166 + k * 35, y = ry;
      box(svg, x, y, 26, 54, { fill: gpu.has(i) ? PINK : BLUE, w: 1.6 });
      if (gpu.has(i)) hatch(svg, x + 2, y + 2, 22, 50, RED, 5);
      else for (let s = 1; s < 6; s++) line(svg, x + 4, y + s * 9, x + 22, y + s * 9, { w: 0.8, j: 0.3, c: "#6d6860" });
    }
    // registration marks, as on a drafting sheet
    cross(svg, 384, 66); cross(svg, 152, 288);
  }
  function brand() {
    const svg = document.getElementById("brandArt"); if (!svg) return; svg.innerHTML = ""; seed = 3;
    box(svg, 4, 9, 56, 46, { fill: SAND, w: 2.2 });
    for (let k = 0; k < 3; k++) { const x = 12 + k * 14; box(svg, x, 19, 10, 28, { fill: k === 1 ? PINK : BLUE, w: 1.6 }); if (k === 1) hatch(svg, x + 1, 20, 8, 26, RED, 4); }
  }
  hero(); brand();
})();
