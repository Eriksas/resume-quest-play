// PLS 偏最小二乘：和 PCA 一样找新方向，但它看 y——找和 y 协方差最大的方向。
Labs.register('pls', {
  render(host, K) {
    const root = K.panel(host);
    const r = K.rng(33);
    // X 的方差主要在 u 方向，但 y 只和方差小的 v 方向有关
    const base = Array.from({ length: 60 }, () => ({ a: K.gauss(r) * 1.5, b: K.gauss(r) * 0.6, e: K.gauss(r) }));
    const ctl = K.row(root);
    const mix = K.slider(ctl, { label: 'y 和“方差大的方向”的关系', min: 0, max: 1, step: 0.05, value: 0, fmt: (v) => v.toFixed(2), onInput: () => draw() });
    const p = K.plot(root, { x: [-4.5, 4.5], y: [-3.2, 3.2], w: 600, h: 400, xlabel: 'x₁', ylabel: 'x₂', label: 'PCA 方向和 PLS 方向' });
    const gP = p.layer('pts', true);
    const gL = p.layer('lines', true);
    K.legend(root, [['PCA 第一方向（只看 X）', 0, 'line'], ['PLS 第一方向（看 X 和 y）', 1, 'line'], ['点的颜色深浅 = y 的大小', 2]]);
    const stats = K.stats(root);
    K.note(root, '<b>PCA</b> 只看 X，找方差最大的方向，和 y 无关（无监督）；<b>PLS</b> 找让 X 的投影和 y 协方差最大的方向（有监督）。当自变量很多、彼此高度相关、样本又少时（比如光谱数据），PLS 先降维再回归，比直接做最小二乘稳定。', '');

    function draw() {
      const u = [Math.cos(0.5), Math.sin(0.5)];
      const v = [-u[1], u[0]];
      const pts = base.map((q) => ({ x: q.a * u[0] + q.b * v[0], y: q.a * u[1] + q.b * v[1], yy: mix.value * q.a + (1 - mix.value) * 2.2 * q.b + 0.3 * q.e }));
      const ys = pts.map((q) => q.yy);
      const ymin = Math.min(...ys);
      const ymax = Math.max(...ys);
      K.clear(gP);
      pts.forEach((q) => K.marker(gP, 'circle', p.sx(q.x), p.sy(q.y), 5.5, { fill: 'var(--series-3)', 'fill-opacity': 0.15 + 0.85 * ((q.yy - ymin) / (ymax - ymin)), stroke: 'var(--series-3)', 'stroke-width': 1 }));
      const pc = K.ml.pca2(pts);
      const mx = K.mean(pts.map((q) => q.x));
      const my = K.mean(pts.map((q) => q.y));
      const ym = K.mean(ys);
      let w = [0, 0];
      pts.forEach((q, i) => { w[0] += (q.x - mx) * (ys[i] - ym); w[1] += (q.y - my) * (ys[i] - ym); });
      const nw = Math.hypot(w[0], w[1]) || 1;
      w = [w[0] / nw, w[1] / nw];
      K.clear(gL);
      [[pc.v1, 1], [w, 2]].forEach(([d, c]) => K.line(gL, p.sx(mx - d[0] * 6), p.sy(my - d[1] * 6), p.sx(mx + d[0] * 6), p.sy(my + d[1] * 6), { stroke: K.color(c - 1), 'stroke-width': 3, 'stroke-dasharray': c === 2 ? '8 4' : null }));
      const corr = (d) => {
        const s = pts.map((q) => (q.x - mx) * d[0] + (q.y - my) * d[1]);
        const sm = K.mean(s);
        const cov = K.mean(s.map((v2, i) => (v2 - sm) * (ys[i] - ym)));
        const sd = (a) => Math.sqrt(K.mean(a.map((v2) => (v2 - K.mean(a)) ** 2)));
        return cov / (sd(s) * sd(ys));
      };
      stats.set([
        ['PCA 方向的得分和 y 的相关', Math.abs(corr(pc.v1)).toFixed(2)],
        ['PLS 方向的得分和 y 的相关', Math.abs(corr(w)).toFixed(2), 'good'],
      ]);
    }
    draw();
  },
});
