// 正态分布：① 调 μ、σ 和区间，看面积（概率）和 68-95-99.7 法则；② 中心极限定理：不管原始数据长什么样，样本均值都会变得接近正态。
Labs.register('normal', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);

    // ---------- ① 正态曲线和面积 ----------
    K.h('<h3 class="sub-h">① 曲线下的面积就是概率</h3>', root);
    const c1 = K.row(root);
    const mu = K.slider(c1, { label: '均值 μ', min: -3, max: 3, step: 0.5, value: 0, fmt: (v) => v.toFixed(1), onInput: () => drawA() });
    const sd = K.slider(c1, { label: '标准差 σ', min: 0.5, max: 2.5, step: 0.1, value: 1, fmt: (v) => v.toFixed(1), onInput: () => drawA() });
    const c2 = K.row(root);
    const lo = K.slider(c2, { label: '区间左端 a', min: -8, max: 8, step: 0.1, value: -1, fmt: (v) => v.toFixed(1), onInput: () => drawA() });
    const hi = K.slider(c2, { label: '区间右端 b', min: -8, max: 8, step: 0.1, value: 1, fmt: (v) => v.toFixed(1), onInput: () => drawA() });
    const c3 = K.row(root);
    [1, 2, 3].forEach((k) => K.button(c3, `μ ± ${k}σ`, () => { lo.set(+(mu.value - k * sd.value).toFixed(1), true); hi.set(+(mu.value + k * sd.value).toFixed(1), true); drawA(); }, k === 1));
    const pA = K.plot(root, { x: [-8, 8], y: [0, 0.85], w: 640, h: 260, xlabel: 'x', yticks: [0, 0.2, 0.4, 0.6, 0.8], fy: (v) => v.toFixed(1), label: '正态分布的面积' });
    const gA = pA.layer('a', true);
    const sA = K.stats(root);
    function drawA() {
      const m = mu.value;
      const s = sd.value;
      const a = Math.min(lo.value, hi.value);
      const b = Math.max(lo.value, hi.value);
      K.clear(gA);
      const area = [[pA.sx(a), pA.sy(0)]];
      for (let x = a; x <= b + 1e-9; x += 0.02) area.push([pA.sx(x), pA.sy(st.normPdf(x, m, s))]);
      area.push([pA.sx(b), pA.sy(0)]);
      K.path(gA, area, { fill: 'var(--series-1)', 'fill-opacity': 0.25, stroke: 'none' });
      const curve = [];
      for (let x = -8; x <= 8; x += 0.04) curve.push([pA.sx(x), pA.sy(st.normPdf(x, m, s))]);
      K.path(gA, curve, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      for (let k = -3; k <= 3; k++) {
        const x = m + k * s;
        K.line(gA, pA.sx(x), pA.sy(0), pA.sx(x), pA.sy(st.normPdf(x, m, s)), { class: 'soft', 'stroke-dasharray': '2 3' });
        K.text(gA, pA.sx(x), pA.sy(0) - 4, k ? `${k > 0 ? '+' : ''}${k}σ` : 'μ', { 'text-anchor': 'middle', 'font-size': 10 });
      }
      const prob = st.normCdf((b - m) / s) - st.normCdf((a - m) / s);
      sA.set([
        ['P(a < X < b)', K.pct(prob, 2), 'good'],
        ['a 的 z 分数 (a − μ)/σ', ((a - m) / s).toFixed(2)],
        ['b 的 z 分数 (b − μ)/σ', ((b - m) / s).toFixed(2)],
      ]);
    }
    drawA();
    K.note(root, '<b>68-95-99.7 法则</b>：落在 μ ± 1σ、± 2σ、± 3σ 以内的概率约 68%、95%、99.7%。任何正态变量减去均值、除以标准差（z 分数）以后，都变成标准正态 N(0, 1)，所以只要查一张表。95% 置信区间里的 1.96，就是标准正态两边各留 2.5% 的位置。', '');

    // ---------- ② 中心极限定理 ----------
    K.h('<h3 class="sub-h">② 中心极限定理：样本均值近似正态</h3>', root);
    const srcs = {
      expo: { label: '指数分布（右偏，像订单金额）', mu: 1, sd: 1, s: (r) => -Math.log(1 - r()), x: [0, 6] },
      dice: { label: '掷骰子（均匀）', mu: 3.5, sd: Math.sqrt(35 / 12), s: (r) => 1 + Math.floor(r() * 6), x: [0.5, 6.5] },
      bimodal: { label: '两极分化（双峰）', mu: 0, sd: Math.sqrt(1 + 0.3 ** 2), s: (r) => (r() < 0.5 ? -1 : 1) + 0.3 * K.gauss(r), x: [-2.2, 2.2] },
    };
    const c4 = K.row(root);
    const src = K.seg(c4, Object.keys(srcs).map((k) => ({ value: k, label: srcs[k].label })), 'expo', () => drawB());
    const c5 = K.row(root);
    const nSeg = K.seg(c5, [1, 2, 5, 10, 30].map((v) => ({ value: v, label: `每次抽 ${v} 个` })), 1, () => drawB());
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const leftB = K.h('<div></div>', grid);
    const rightB = K.h('<div></div>', grid);
    const sB = K.stats(root);
    let seed = 1;
    K.button(c5, '换一批', () => { seed += 1; drawB(); });
    function hist(box, data, x0, x1, title, overlay) {
      box.innerHTML = '';
      const bins = 30;
      const w = (x1 - x0) / bins;
      const c = new Array(bins).fill(0);
      data.forEach((v) => { const b = Math.floor((v - x0) / w); if (b >= 0 && b < bins) c[b] += 1; });
      const dens = c.map((v) => v / data.length / w);
      let ymax = Math.max(...dens);
      if (overlay) for (let x = x0; x <= x1; x += w / 4) ymax = Math.max(ymax, overlay(x));
      const p = K.plot(box, { x: [x0, x1], y: [0, ymax * 1.15], w: 320, h: 220, ylabels: false, label: title });
      const g = p.layer('g', true);
      dens.forEach((d, i) => K.s('rect', { x: p.sx(x0 + i * w) + 0.5, y: p.sy(d), width: Math.max(0, p.sx(x0 + w) - p.sx(x0) - 1), height: p.sy(0) - p.sy(d), fill: 'var(--series-1)', opacity: 0.75 }, g));
      if (overlay) {
        const pts = [];
        for (let x = x0; x <= x1; x += (x1 - x0) / 200) pts.push([p.sx(x), p.sy(overlay(x))]);
        K.path(g, pts, { stroke: 'var(--series-2)', 'stroke-width': 2.5 });
      }
      K.caption(box, title);
    }
    function drawB() {
      const s = srcs[src.value];
      const n = Number(nSeg.value);
      const r = K.rng(seed * 101 + n);
      const raw = Array.from({ length: 3000 }, () => s.s(r));
      const means = Array.from({ length: 2000 }, () => { let t = 0; for (let i = 0; i < n; i++) t += s.s(r); return t / n; });
      const se = s.sd / Math.sqrt(n);
      hist(leftB, raw, s.x[0], s.x[1], '原始数据的分布', null);
      const span = Math.max(4 * se, 0.3);
      hist(rightB, means, s.mu - span, s.mu + span, `2000 个“样本均值”的分布（每个由 ${n} 个数平均）`, (x) => st.normPdf(x, s.mu, se));
      sB.set([
        ['原始数据的标准差 σ', s.sd.toFixed(3)],
        ['理论标准误 σ / √n', se.toFixed(3)],
        ['样本均值的实际标准差', Math.sqrt(st.var(means)).toFixed(3), 'good'],
      ]);
    }
    drawB();
    K.note(root, '把 n 从 1 调到 30：不管原始数据是右偏、均匀还是双峰，<b>样本均值</b>的分布都越来越像正态（橙色曲线），而且越来越窄——宽度就是<b>标准误 σ / √n</b>。这就是为什么 A/B 测试比较“转化率”“人均 GMV”这类平均数时，可以用 z 检验、t 检验，即使原始数据并不正态。', '');
  },
});
