// 卡方检验：① 独立性检验（2×2 列联表：分组 × 是否转化）；② 拟合优度检验（样本比例失衡 SRM，可代入 X5 数据）。
Labs.register('chisq', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const ctl = K.row(root);
    const mode = K.seg(ctl, [{ value: 'ind', label: '① 独立性：分组和转化有关吗' }, { value: 'gof', label: '② 拟合优度：分流比例对吗（SRM）' }], 'ind', () => show());
    const panes = { ind: K.h('<div class="lab"></div>', root), gof: K.h('<div class="lab"></div>', root) };
    function show() { Object.keys(panes).forEach((k) => (panes[k].hidden = k !== mode.value)); }
    const fmtN = (v) => Math.round(v).toLocaleString();

    function chiCurve(box, df, x2, label) {
      box.innerHTML = '';
      const crit = st.critical((x) => st.chi2Sf(x, df), 0.05);
      const x1 = Math.max(8, crit * 2);
      const p = K.plot(box, { x: [0, x1], y: [0, 0.8], w: 640, h: 180, ylabels: false, grid: false, label });
      const g = p.layer('g', true);
      const reg = [[p.sx(crit), p.sy(0)]];
      for (let x = crit; x <= x1; x += x1 / 300) reg.push([p.sx(x), p.sy(st.chi2Pdf(x, df))]);
      reg.push([p.sx(x1), p.sy(0)]);
      K.path(g, reg, { fill: 'var(--bad)', 'fill-opacity': 0.4, stroke: 'none' });
      const pts = [];
      for (let x = x1 / 400; x <= x1; x += x1 / 400) pts.push([p.sx(x), p.sy(Math.min(st.chi2Pdf(x, df), 0.85))]);
      K.path(g, pts, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      const ox = Math.min(x2, x1);
      K.line(g, p.sx(ox), p.P.t, p.sx(ox), p.sy(0), { stroke: 'var(--series-2)', 'stroke-width': 3 });
      K.text(g, Math.min(p.sx(ox) + 6, p.W - 150), p.P.t + 14, `χ² = ${x2.toFixed(2)}${x2 > x1 ? '（出了图）' : ''}`, { class: 'strong' });
      K.text(g, p.sx(crit) + 4, p.sy(0) - 8, `临界值 ${crit.toFixed(2)}`, { 'font-size': 11 });
    }

    // ---------- ① 独立性 ----------
    (() => {
      const box = panes.ind;
      const c1 = K.row(box);
      const nA = K.slider(c1, { label: '对照组人数', min: 50, max: 3000, step: 50, value: 300, fmt: fmtN, onInput: () => draw() });
      const pA = K.slider(c1, { label: '对照组转化率', min: 1, max: 99, step: 1, value: 20, fmt: (v) => v + '%', onInput: () => draw() });
      const c2 = K.row(box);
      const nB = K.slider(c2, { label: '实验组人数', min: 50, max: 3000, step: 50, value: 300, fmt: fmtN, onInput: () => draw() });
      const pB = K.slider(c2, { label: '实验组转化率', min: 1, max: 99, step: 1, value: 26, fmt: (v) => v + '%', onInput: () => draw() });
      const c3 = K.row(box);
      const yates = K.check(c3, '连续性校正（scipy 对 2×2 表默认开启）', true, () => draw());
      const tbl = K.h('<div class="lab-scroll"></div>', box);
      const curve = K.h('<div></div>', box);
      const stats = K.stats(box);
      const note = K.note(box, '');
      K.note(box, '<b>卡方独立性检验</b>的原假设：两个分类变量相互独立（这里就是“分到哪组”和“是否转化”无关）。做法：先按“如果独立”算出每格的<b>期望频数 E = 行合计 × 列合计 ÷ 总数</b>，再看实际频数 O 偏离多少：χ² = Σ (O − E)² ÷ E，自由度 = (行数 − 1) × (列数 − 1)。每格期望频数最好都 ≥ 5，太小时用 Fisher 精确检验。<b>小知识</b>：2×2 表不做连续性校正时，χ² 正好等于“合并方差的两比例 z 检验”的 z²。', '');
      function draw() {
        const n1 = nA.value;
        const n2 = nB.value;
        const a = Math.round((n1 * pA.value) / 100);
        const c = Math.round((n2 * pB.value) / 100);
        const O = [[a, n1 - a], [c, n2 - c]];
        const rowT = [n1, n2];
        const colT = [a + c, n1 + n2 - a - c];
        const N = n1 + n2;
        const E = O.map((row, i) => row.map((_, j) => (rowT[i] * colT[j]) / N));
        let x2 = 0;
        let x2raw = 0;
        const contrib = O.map((row, i) => row.map((o, j) => {
          const e = E[i][j];
          const d = Math.abs(o - e);
          const dc = yates.value ? Math.max(0, d - Math.min(0.5, d)) : d;
          const v = (dc * dc) / e;
          x2 += v;
          x2raw += (d * d) / e;
          return v;
        }));
        const pv = st.chi2Sf(x2, 1);
        const maxC = Math.max(...contrib.flat(), 1e-9);
        const cell = (i, j) => {
          const pct = Math.round((contrib[i][j] / maxC) * 40);
          return `<td style="background:color-mix(in srgb, var(--series-2) ${pct}%, transparent)"><b>${fmtN(O[i][j])}</b><br><span class="small muted">期望 ${E[i][j].toFixed(1)}</span><br><span class="small muted">贡献 ${contrib[i][j].toFixed(2)}</span></td>`;
        };
        tbl.innerHTML = `<table class="lab-table"><thead><tr><th></th><th>转化</th><th>未转化</th><th style="white-space:nowrap">合计</th></tr></thead><tbody>
          <tr><th style="white-space:nowrap">对照组</th>${cell(0, 0)}${cell(0, 1)}<td>${fmtN(n1)}</td></tr>
          <tr><th style="white-space:nowrap">实验组</th>${cell(1, 0)}${cell(1, 1)}<td>${fmtN(n2)}</td></tr>
          <tr><th>合计</th><td>${fmtN(colT[0])}</td><td>${fmtN(colT[1])}</td><td>${fmtN(N)}</td></tr></tbody></table>`;
        chiCurve(curve, 1, x2, '卡方分布（自由度 1）');
        const pp = (a + c) / N;
        const z = (c / n2 - a / n1) / Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2));
        stats.set([
          ['χ²' + (yates.value ? '（校正后）' : ''), x2.toFixed(3)],
          ['p 值', st.fmtP(pv), pv < 0.05 ? 'good' : ''],
          ['不校正的 χ²', x2raw.toFixed(3)],
          ['两比例 z 检验的 z²', (z * z).toFixed(3)],
        ]);
        const minE = Math.min(...E.flat());
        note.className = 'lab-note ' + (minE < 5 ? 'warn' : pv < 0.05 ? 'good' : '');
        note.innerHTML = minE < 5
          ? `有格子的期望频数只有 ${minE.toFixed(1)}，小于 5，卡方近似不可靠，应改用 Fisher 精确检验。`
          : pv < 0.05 ? `${st.pEq(pv)}，低于 0.05：分组和是否转化<b>不独立</b>，两组转化率有显著差异。表格里颜色越深的格子，对 χ² 的贡献越大。` : `${st.pEq(pv)}，不低于 0.05：没有足够证据说分组和转化有关。试试把两组人数都调大。`;
      }
      draw();
    })();

    // ---------- ② 拟合优度 / SRM ----------
    (() => {
      const box = panes.gof;
      const NS = [2000, 20000, 200000];
      const c1 = K.row(box);
      let custom = null;
      const nSeg = K.seg(c1, NS.map((v) => ({ value: v, label: `总共 ${v.toLocaleString()} 人` })), 20000, () => { custom = null; draw(); });
      const share = K.slider(c1, { label: '实验组实际占比（设计是 50%）', min: 47, max: 53, step: 0.1, value: 50.5, fmt: (v) => v.toFixed(1) + '%', onInput: () => { custom = null; draw(); } });
      const c2 = K.row(box);
      K.button(c2, '代入 X5 短信实验的分组人数', () => { custom = [99981, 100058]; nSeg.set(200000, true); share.set(50, true); draw(); }, true);
      const bars = K.h('<div></div>', box);
      const curve = K.h('<div></div>', box);
      const stats = K.stats(box);
      const note = K.note(box, '');
      K.note(box, '<b>样本比例失衡检验（SRM）</b>：检验实际分组人数是否符合设计比例，用的是<b>卡方拟合优度检验</b>，χ² = Σ (实际人数 − 期望人数)² ÷ 期望人数。偏离太多，常见原因是分流有 bug 或者部分用户的数据丢了，这时实验结果不可信，要先查分流和数据链路。注意：样本越大，同样 0.5% 的偏离越容易显著。', '');
      function draw() {
        let t;
        let c;
        if (custom) [t, c] = custom;
        else {
          const N = Number(nSeg.value);
          t = Math.round((N * share.value) / 100);
          c = N - t;
        }
        const N = t + c;
        const e = N / 2;
        const x2 = ((t - e) ** 2) / e + ((c - e) ** 2) / e;
        const pv = st.chi2Sf(x2, 1);
        bars.innerHTML = '';
        const svg = K.s('svg', { viewBox: '0 0 640 120', class: 'lab-svg', role: 'img', 'aria-label': '实际人数和期望人数' }, bars);
        const W = 520;
        [['实验组', t, 0, 34], ['对照组', c, 1, 80]].forEach(([lab, v, col, y]) => {
          const w = (v / N) * W * 1.6;
          K.text(svg, 12, y + 5, lab, { class: 'strong' });
          K.s('rect', { x: 70, y: y - 12, width: Math.min(w, 560), height: 24, rx: 4, fill: K.color(col), opacity: 0.8 }, svg);
          K.text(svg, 76, y + 5, `${v.toLocaleString()} 人（${((v / N) * 100).toFixed(2)}%）`, { 'font-size': 11.5, style: 'fill:#fff;font-weight:700' });
        });
        const ex = 70 + 0.5 * W * 1.6;
        K.line(svg, ex, 14, ex, 102, { stroke: 'var(--text)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 });
        K.text(svg, ex + 4, 112, '期望：各 50%', { 'font-size': 11 });
        chiCurve(curve, 1, x2, '卡方分布（自由度 1）');
        stats.set([
          ['期望人数（每组）', e.toLocaleString(undefined, { maximumFractionDigits: 1 })],
          ['χ²', x2.toFixed(3)],
          ['p 值', st.fmtP(pv), pv < 0.05 ? 'bad' : 'good'],
        ]);
        note.className = 'lab-note ' + (pv < 0.05 ? 'warn' : 'good');
        note.innerHTML = custom
          ? '<b>X5 项目的数字</b>：实验组 99,981 人，对照组 100,058 人，实验组占比 0.4998，χ² = 0.030，p = 0.863，没有分流异常的迹象。（官方没公布设计比例，项目里按 0.5 作为假设。）'
          : pv < 0.05 ? `${st.pEq(pv)}，低于 0.05：分组人数和设计比例不符，<b>先别看实验结果</b>，去查分流和埋点。` : `${st.pEq(pv)}：人数比例和设计相符。试试保持 50.5% 不变，把总人数调到 200,000。`;
      }
      draw();
    })();
    show();
  },
});
