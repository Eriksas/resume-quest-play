// 其他非参数检验（了解即可）：用 KS 检验演示“比较整个分布”，再用一张表列出常见的非参数检验。
Labs.register('npother', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const n = 80;
    const r = K.rng(31);
    const ZA = Array.from({ length: n }, () => K.gauss(r));
    const ZB = Array.from({ length: n }, () => K.gauss(r));
    K.h('<h3 class="sub-h">KS 检验：两组数据的整个分布一样吗？</h3>', root);
    const c1 = K.row(root);
    const shift = K.slider(c1, { label: 'B 组整体平移', min: -1.5, max: 1.5, step: 0.1, value: 0, fmt: (v) => v.toFixed(1), onInput: () => draw() });
    const scale = K.slider(c1, { label: 'B 组波动倍数', min: 0.4, max: 3, step: 0.1, value: 2, fmt: (v) => v.toFixed(1), onInput: () => draw() });
    const box = K.h('<div></div>', root);
    K.legend(root, [['A 组的累积比例', 0, 'line'], ['B 组的累积比例', 1, 'line'], ['最大差距 D', 'var(--text)', 'line']]);
    const stats = K.stats(root);
    const note = K.note(root, '');
    function ecdf(sorted, x) {
      let lo = 0;
      let hi = sorted.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= x) lo = m + 1; else hi = m; }
      return lo / sorted.length;
    }
    function draw() {
      const A = ZA.slice();
      const B = ZB.map((z) => shift.value + scale.value * z);
      const As = A.slice().sort((x, y) => x - y);
      const Bs = B.slice().sort((x, y) => x - y);
      box.innerHTML = '';
      const x0 = -6;
      const x1 = 6;
      const p = K.plot(box, { x: [x0, x1], y: [0, 1], w: 640, h: 240, xlabel: '指标值', ylabel: '≤ x 的比例', yticks: [0, 0.25, 0.5, 0.75, 1], fy: (v) => v.toFixed(2), label: '两组的累积分布' });
      const g = p.layer('g', true);
      [[As, 0], [Bs, 1]].forEach(([s, c]) => {
        const pts = [[p.sx(x0), p.sy(0)]];
        s.forEach((v, i) => { pts.push([p.sx(v), p.sy(i / s.length)]); pts.push([p.sx(v), p.sy((i + 1) / s.length)]); });
        pts.push([p.sx(x1), p.sy(1)]);
        K.path(g, pts, { stroke: K.color(c), 'stroke-width': 2.5 });
      });
      const ks = st.ks2(A, B);
      const ya = ecdf(As, ks.at);
      const yb = ecdf(Bs, ks.at);
      K.line(g, p.sx(ks.at), p.sy(ya), p.sx(ks.at), p.sy(yb), { stroke: 'var(--text)', 'stroke-width': 3 });
      K.text(g, p.sx(ks.at) + 6, p.sy((ya + yb) / 2), `D = ${ks.D.toFixed(2)}`, { class: 'strong' });
      const tt = st.ttest(A, B, false);
      const mw = st.mannWhitney(A, B);
      stats.set([
        ['KS 统计量 D', ks.D.toFixed(3)],
        ['KS p 值（近似）', st.fmtP(ks.p), ks.p < 0.05 ? 'good' : ''],
        ['U 检验 p 值', st.fmtP(mw.p), mw.p < 0.05 ? 'good' : ''],
        ['Welch t 检验 p 值', st.fmtP(tt.p), tt.p < 0.05 ? 'good' : ''],
      ]);
      const onlyScale = Math.abs(shift.value) < 0.05 && Math.abs(scale.value - 1) > 0.5;
      note.innerHTML = onlyScale
        ? '现在两组<b>中心一样、只是波动不同</b>：t 检验和 U 检验主要看“谁更大”，基本测不出来；KS 检验比较整条累积分布曲线，能发现这种差别。'
        : '<b>KS 检验</b>把两组的累积分布曲线画出来，看它们之间<b>最大的竖直差距 D</b>。位置、波动、形状只要有一样不同，D 都会变大。把“平移”调回 0、“波动倍数”调到 2 看看。';
    }
    draw();
    K.h(`<div><h3 class="sub-h">常见的非参数检验（知道名字和用途就够）</h3><div class="lab-scroll"><table class="lab-table"><thead><tr><th>检验</th><th>用途</th><th>对应的参数检验</th></tr></thead><tbody>
      <tr><td>曼-惠特尼 U（Wilcoxon 秩和）</td><td>两组独立样本，谁整体更大</td><td>两样本 t 检验</td></tr>
      <tr><td>Wilcoxon 符号秩检验</td><td>配对样本（同一批人前后对比）</td><td>配对 t 检验</td></tr>
      <tr><td>Kruskal-Wallis H 检验</td><td>三组及以上独立样本</td><td>单因素方差分析</td></tr>
      <tr><td>Friedman 检验</td><td>三组及以上配对样本</td><td>重复测量方差分析</td></tr>
      <tr><td>Spearman 秩相关</td><td>两个变量的单调相关（用名次算相关系数）</td><td>Pearson 相关</td></tr>
      <tr><td>KS 检验</td><td>两组的分布是否相同，或数据是否服从某个分布</td><td>—</td></tr>
      <tr><td>Shapiro-Wilk 检验</td><td>数据是否近似正态（决定用不用参数检验）</td><td>—</td></tr>
      <tr><td>Fisher 精确检验</td><td>列联表里期望频数太小时</td><td>卡方检验</td></tr>
    </tbody></table></div></div>`, root);
    K.note(root, '非参数检验的共同思路：<b>不假设数据服从某个具体分布</b>，多数用名次（秩）代替原始数值，所以对偏态和极端值稳健。代价是：数据真的近似正态时，它们的功效通常比 t 检验略低。', '');
  },
});
