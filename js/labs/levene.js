// 方差齐性检验：Levene（中位数版）把每个点换成“离本组中位数的距离”，再对这些距离做方差分析。
Labs.register('levene', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const n = 20;
    const r = K.rng(48);
    const raw = {
      normal: [0, 1].map(() => Array.from({ length: n }, () => K.gauss(r))),
      skew: [0, 1].map(() => Array.from({ length: n }, () => -Math.log(1 - r()) - 1)),
    };
    const c1 = K.row(root);
    const ratio = K.slider(c1, { label: '真实标准差之比 σB / σA', min: 0.5, max: 3, step: 0.1, value: 1.6, fmt: (v) => v.toFixed(1), onInput: () => draw() });
    const c2 = K.row(root);
    const shape = K.seg(c2, [{ value: 'normal', label: '数据近似正态' }, { value: 'skew', label: '数据右偏' }], 'normal', () => { sim.innerHTML = ''; draw(); });
    const outlier = K.check(c2, 'A 组混进 1 个极端值', false, () => draw());
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const stats = K.stats(root);
    const note = K.note(root, '');
    const simRow = K.row(root);
    K.button(simRow, '模拟 500 次：两组方差其实相等时，谁误报多？', () => simulate(), true);
    const sim = K.h('<div></div>', root);
    K.note(root, '<b>为什么要检验方差齐性？</b>Student t 检验和方差分析都假设各组方差相等。<b>Levene 检验</b>的原假设是“各组方差相等”：先把每个数据换成它离本组中位数的距离 |x − 中位数|，再对这些距离做一次方差分析——波动大的组，距离普遍更大。用中位数的版本（Brown-Forsythe）对偏态和极端值更稳健，scipy.stats.levene 默认就是它。实际工作中，拿不准就直接用 <b>Welch t 检验</b>，它不需要方差相等。', '');

    function groups(ratioV, kind, withOut) {
      const [za, zb] = raw[kind];
      const A = za.map((z) => 10 + z);
      const B = zb.map((z) => 10 + ratioV * z);
      if (withOut) A[0] = 16;
      return [A, B];
    }
    function strip(box, data, title, centers, x0, x1) {
      box.innerHTML = '';
      const p = K.plot(box, { x: [x0, x1], y: [0, 2], w: 320, h: 150, yticks: [], ylabels: false, grid: false, label: title });
      const g = p.layer('g', true);
      const rr = K.rng(9);
      data.forEach((arr, c) => {
        const y = c ? 1.4 : 0.55;
        arr.forEach((v) => K.marker(g, c ? 'square' : 'circle', p.sx(v), p.sy(y + (rr() - 0.5) * 0.45), 3.4, { fill: K.color(c), opacity: 0.75 }));
        K.line(g, p.sx(centers[c]), p.sy(y - 0.35), p.sx(centers[c]), p.sy(y + 0.35), { stroke: 'var(--text)', 'stroke-width': 3 });
      });
      K.text(p.svg, p.P.l + 4, p.sy(0.55) + 4, 'A', { class: 'strong' });
      K.text(p.svg, p.P.l + 4, p.sy(1.4) + 4, 'B', { class: 'strong' });
      K.caption(box, title);
    }
    function draw() {
      const [A, B] = groups(ratio.value, shape.value, outlier.value);
      const dev = [A, B].map((g) => { const m = st.median(g); return g.map((v) => Math.abs(v - m)); });
      const all = A.concat(B);
      strip(left, [A, B], '原始数据（黑线 = 中位数）', [st.median(A), st.median(B)], Math.min(...all) - 0.5, Math.max(...all) + 0.5);
      const dmax = Math.max(...dev[0], ...dev[1]);
      strip(right, dev, '离本组中位数的距离（黑线 = 平均距离）', [st.mean(dev[0]), st.mean(dev[1])], -0.2, dmax + 0.5);
      const lev = st.levene([A, B]);
      const vA = st.var(A);
      const vB = st.var(B);
      const F = Math.max(vA, vB) / Math.min(vA, vB);
      const pF = Math.min(1, 2 * st.fSf(F, n - 1, n - 1));
      stats.set([
        ['A 的标准差', Math.sqrt(vA).toFixed(2)],
        ['B 的标准差', Math.sqrt(vB).toFixed(2)],
        ['Levene 统计量', lev.F.toFixed(2)],
        ['Levene p 值', st.fmtP(lev.p), lev.p < 0.05 ? 'bad' : 'good'],
        ['方差比 F 检验 p 值', st.fmtP(pF), pF < 0.05 ? 'bad' : 'good'],
      ]);
      note.className = 'lab-note ' + (lev.p < 0.05 ? 'warn' : 'good');
      note.innerHTML = lev.p < 0.05
        ? `Levene ${st.pEq(lev.p)}，低于 0.05：<b>方差不齐</b>，比较均值时用 Welch t 检验（scipy 里 equal_var=False）。`
        : `Levene ${st.pEq(lev.p)}，不低于 0.05：没有证据说方差不齐，Student t 检验可以用（用 Welch 也几乎没有损失）。`;
    }
    function simulate() {
      const rs = K.rng(77);
      const kind = shape.value;
      let fa = 0;
      let la = 0;
      const R = 500;
      for (let t = 0; t < R; t++) {
        const g = [0, 1].map(() => Array.from({ length: n }, () => (kind === 'normal' ? K.gauss(rs) : -Math.log(1 - rs()) - 1)));
        const vA = st.var(g[0]);
        const vB = st.var(g[1]);
        const F = Math.max(vA, vB) / Math.min(vA, vB);
        if (2 * st.fSf(F, n - 1, n - 1) < 0.05) fa += 1;
        if (st.levene(g).p < 0.05) la += 1;
      }
      sim.innerHTML = '';
      const s = K.stats(sim);
      s.set([
        ['数据', kind === 'normal' ? '近似正态' : '右偏'],
        ['方差比 F 检验误报率', K.pct(fa / R, 1), fa / R > 0.08 ? 'bad' : 'good'],
        ['Levene 误报率', K.pct(la / R, 1), la / R > 0.08 ? 'bad' : 'good'],
      ]);
      K.note(sim, `两组方差其实相等，按 α = 0.05，理想的误报率是 5% 左右。${kind === 'normal' ? '数据正态时两者都差不多；切到“数据右偏”再模拟一次看看。' : '数据右偏时，方差比 F 检验的误报率明显超过 5%，Levene（中位数版）仍然接近 5%。'}`, '');
    }
    draw();
  },
});
