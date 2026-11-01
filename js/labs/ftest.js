// F 检验：① 方差分析（三组均值是否相同）：F = 组间均方 ÷ 组内均方；② 方差比：两组波动是否一样。
Labs.register('ftest', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const ctl = K.row(root);
    const mode = K.seg(ctl, [{ value: 'anova', label: '① 方差分析：三组均值' }, { value: 'ratio', label: '② 方差比：两组波动' }], 'anova', () => show());
    const panes = { anova: K.h('<div class="lab"></div>', root), ratio: K.h('<div class="lab"></div>', root) };
    function show() { Object.keys(panes).forEach((k) => (panes[k].hidden = k !== mode.value)); }

    // F 分布 + 右尾拒绝域 + 观测值
    function fCurve(box, d1, d2, F, alpha, label) {
      box.innerHTML = '';
      const crit = st.critical((x) => st.fSf(x, d1, d2), alpha);
      const x1 = Math.max(6, crit * 1.8);
      let ymax = 0;
      for (let x = x1 / 300; x <= x1; x += x1 / 300) ymax = Math.max(ymax, st.fPdf(x, d1, d2));
      ymax = Math.min(ymax, 1.1);
      const p = K.plot(box, { x: [0, x1], y: [0, ymax * 1.12], w: 640, h: 200, ylabels: false, grid: false, label });
      const g = p.layer('g', true);
      const reg = [[p.sx(crit), p.sy(0)]];
      for (let x = crit; x <= x1; x += x1 / 300) reg.push([p.sx(x), p.sy(st.fPdf(x, d1, d2))]);
      reg.push([p.sx(x1), p.sy(0)]);
      K.path(g, reg, { fill: 'var(--bad)', 'fill-opacity': 0.25, stroke: 'none' });
      const pts = [];
      for (let x = x1 / 300; x <= x1; x += x1 / 300) pts.push([p.sx(x), p.sy(st.fPdf(x, d1, d2))]);
      K.path(g, pts, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      const ox = Math.min(F, x1);
      K.line(g, p.sx(ox), p.P.t, p.sx(ox), p.sy(0), { stroke: 'var(--series-2)', 'stroke-width': 3 });
      K.text(g, Math.min(p.sx(ox) + 6, p.W - 140), p.P.t + 14, `F = ${F.toFixed(2)}${F > x1 ? '（出了图）' : ''}`, { class: 'strong' });
      K.text(g, p.sx(crit) + 4, p.sy(0) - 8, `临界值 ${crit.toFixed(2)}`, { 'font-size': 11 });
    }

    // ---------- ① 方差分析 ----------
    (() => {
      const box = panes.anova;
      const n = 12;
      const r = K.rng(5);
      const Z = [0, 1, 2].map(() => Array.from({ length: n }, () => K.gauss(r)));
      const J = [0, 1, 2].map(() => Array.from({ length: n }, () => (r() - 0.5) * 0.36));
      const c1 = K.row(box);
      const dSl = K.slider(c1, { label: '组间差异（各组真实均值拉开多少）', min: 0, max: 3, step: 0.1, value: 0.6, fmt: (v) => v.toFixed(1), onInput: () => draw() });
      const sSl = K.slider(c1, { label: '组内波动 σ', min: 0.5, max: 3, step: 0.1, value: 1.5, fmt: (v) => v.toFixed(1), onInput: () => draw() });
      const plotBox = K.h('<div></div>', box);
      K.legend(box, [['每组均值（粗横线）和总均值（虚线）', 'var(--text)', 'line'], ['组间：组均值离总均值多远', 2, 'line'], ['组内：每个点离本组均值多远', -1, 'line']]);
      const fBox = K.h('<div></div>', box);
      const stats = K.stats(box);
      const note = K.note(box, '');
      const names = ['A 方案', 'B 方案', 'C 方案'];
      function draw() {
        const off = [-1, 0, 1];
        const G = Z.map((z, i) => z.map((v) => 10 + off[i] * dSl.value + sSl.value * v));
        const res = st.anova(G);
        const all = [].concat(...G);
        const lo = Math.min(...all) - 1;
        const hi = Math.max(...all) + 1;
        plotBox.innerHTML = '';
        const p = K.plot(plotBox, { x: [0.4, 3.6], y: [lo, hi], w: 640, h: 260, xticks: [1, 2, 3], fx: (v) => names[v - 1] || '', fy: (v) => v.toFixed(0), ylabel: '指标值', label: '三组数据' });
        const g = p.layer('g', true);
        K.line(g, p.sx(0.4), p.sy(res.gm), p.sx(3.6), p.sy(res.gm), { stroke: 'var(--text)', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 });
        G.forEach((arr, i) => {
          const m = st.mean(arr);
          const cx = i + 1;
          arr.forEach((v, j) => K.line(g, p.sx(cx + J[i][j]), p.sy(v), p.sx(cx + J[i][j]), p.sy(m), { class: 'soft', 'stroke-width': 1 }));
          arr.forEach((v, j) => K.marker(g, K.SHAPES[i], p.sx(cx + J[i][j]), p.sy(v), 4, { fill: K.color(i), opacity: 0.85 }));
          K.line(g, p.sx(cx - 0.3), p.sy(m), p.sx(cx + 0.3), p.sy(m), { stroke: 'var(--text)', 'stroke-width': 3 });
          K.line(g, p.sx(cx + 0.36), p.sy(res.gm), p.sx(cx + 0.36), p.sy(m), { stroke: 'var(--series-3)', 'stroke-width': 4 });
        });
        fCurve(fBox, res.df1, res.df2, res.F, 0.05, 'F 分布（自由度 2 和 33）');
        stats.set([
          ['组间均方 MSB', res.msb.toFixed(2)],
          ['组内均方 MSW', res.msw.toFixed(2)],
          ['F = MSB / MSW', res.F.toFixed(2)],
          ['p 值', st.fmtP(res.p), res.p < 0.05 ? 'good' : ''],
        ]);
        note.className = 'lab-note ' + (res.p < 0.05 ? 'good' : '');
        note.innerHTML = (res.p < 0.05 ? `${st.pEq(res.p)}，低于 0.05：<b>至少有一组的均值和别的不同</b>，但 F 检验不告诉你是哪一组，要再做两两比较（并校正多重比较）。` : `${st.pEq(res.p)}，不低于 0.05：没有足够证据说三组均值不同。`) +
          ' 把“组间差异”拉大，绿色竖线变长，F 变大；把“组内波动”拉大，灰线变长，F 变小。';
      }
      draw();
      K.note(box, '<b>方差分析（ANOVA）</b>的原假设：所有组的均值都相等。思路是比较两种波动：<b>组间均方 MSB</b>（各组均值离总均值多远）和<b>组内均方 MSW</b>（每个点离本组均值多远，也就是噪声）。F = MSB ÷ MSW，原假设成立时 F 应该在 1 附近。前提：各组独立、近似正态、方差相等。只有两组时，F 正好等于 Student t 的平方。', '');
    })();

    // ---------- ② 方差比 ----------
    (() => {
      const box = panes.ratio;
      const r = K.rng(11);
      const ZA = Array.from({ length: 60 }, () => K.gauss(r));
      const ZB = Array.from({ length: 60 }, () => K.gauss(r));
      const c1 = K.row(box);
      const ratio = K.slider(c1, { label: '真实标准差之比 σB / σA', min: 0.5, max: 3, step: 0.1, value: 1.5, fmt: (v) => v.toFixed(1), onInput: () => draw() });
      const nSl = K.slider(c1, { label: '每组样本量 n', min: 5, max: 60, step: 1, value: 15, onInput: () => draw() });
      const dots = K.h('<div></div>', box);
      const fBox = K.h('<div></div>', box);
      const stats = K.stats(box);
      K.note(box, '<b>方差比 F 检验</b>：F = 较大的样本方差 ÷ 较小的样本方差，原假设是两组总体方差相等。它<b>对“数据是否正态”非常敏感</b>：数据偏态或有极端值时很容易误报。所以实际中检验方差齐性更常用 <b>Levene 检验</b>（下一节）。', 'warn');
      function draw() {
        const n = nSl.value;
        const A = ZA.slice(0, n).map((z) => 10 + z);
        const B = ZB.slice(0, n).map((z) => 10 + ratio.value * z);
        const vA = st.var(A);
        const vB = st.var(B);
        const big = vB >= vA;
        const F = big ? vB / vA : vA / vB;
        const pv = Math.min(1, 2 * st.fSf(F, n - 1, n - 1));
        dots.innerHTML = '';
        const all = A.concat(B);
        const p = K.plot(dots, { x: [Math.min(...all) - 0.5, Math.max(...all) + 0.5], y: [0, 2], w: 640, h: 120, yticks: [], ylabels: false, grid: false, label: '两组样本' });
        const g = p.layer('g', true);
        const rr = K.rng(3);
        [[A, 0, 0.5], [B, 1, 1.4]].forEach(([arr, c, y]) => arr.forEach((v) => K.marker(g, c ? 'square' : 'circle', p.sx(v), p.sy(y + (rr() - 0.5) * 0.4), 3.5, { fill: K.color(c), opacity: 0.75 })));
        K.text(p.svg, p.P.l + 4, p.sy(0.5) + 4, 'A', { class: 'strong' });
        K.text(p.svg, p.P.l + 4, p.sy(1.4) + 4, 'B', { class: 'strong' });
        fCurve(fBox, n - 1, n - 1, F, 0.025, `F 分布（自由度 ${n - 1} 和 ${n - 1}，双尾 α = 0.05）`);
        stats.set([
          ['A 的样本方差', vA.toFixed(2)],
          ['B 的样本方差', vB.toFixed(2)],
          ['F = 大方差 / 小方差', F.toFixed(2)],
          ['双尾 p 值', st.fmtP(pv), pv < 0.05 ? 'good' : ''],
        ]);
      }
      draw();
    })();
    show();
  },
});
