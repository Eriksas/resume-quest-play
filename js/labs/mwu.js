// 曼-惠特尼 U 检验：只看排序（秩），不看具体数值。拖动数据点，或者加一个极端值，对比 t 检验。
Labs.register('mwu', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const base = { A: [10, 15, 19, 24, 28, 31, 36, 42], B: [26, 34, 39, 45, 50, 55, 61, 68] };
    const data = { A: base.A.slice(), B: base.B.slice() };
    const rowY = { A: 1.85, B: 1.0 };
    const btns = K.row(root);
    K.button(btns, 'A 组混进一个极端大值', () => {
      const i = data.A.indexOf(Math.max(...data.A));
      data.A[i] = 100;
      place();
      update();
    }, true);
    K.button(btns, '还原', () => {
      data.A = base.A.slice();
      data.B = base.B.slice();
      place();
      update();
    });
    const p = K.plot(root, { x: [0, 105], y: [0.45, 2.4], w: 640, h: 210, yticks: [], ylabels: false, xlabel: '指标值（可以左右拖动每个点）', label: '两组数据' });
    const gMean = p.layer('mean', true);
    const gPts = p.layer('pts', false);
    K.text(p.svg, p.P.l + 4, p.sy(rowY.A) - 14, 'A 组', { class: 'strong' });
    K.text(p.svg, p.P.l + 4, p.sy(rowY.B) - 14, 'B 组', { class: 'strong' });
    K.legend(root, [['A 组', 0], ['B 组', 1, 'square'], ['各组均值（t 检验看的）', 'var(--text)', 'line']]);
    const stripBox = K.h('<div></div>', root);
    const stats = K.stats(root);
    const note = K.note(root, '');
    K.note(root, '<b>曼-惠特尼 U 检验</b>（也叫 Wilcoxon 秩和检验）：把两组数据混在一起从小到大排名，用<b>名次（秩）</b>代替原始数值。U 值可以理解为：把 A、B 两两配对（8 × 8 = 64 对），A 比 B 大的有几对。原假设是两组分布相同，谁也不比谁更容易偏大。它<b>不要求正态</b>，对极端值稳健，适合偏态、重尾或只有等级的数据（比如满意度 1–5 分）。这里的 p 值用正态近似（带连续性校正）；样本这么小时，scipy 默认算精确 p 值，数字会略有不同。', '');

    const els = { A: [], B: [] };
    ['A', 'B'].forEach((k, c) => {
      data[k].forEach((_, i) => {
        const g = K.s('g', null, gPts);
        K.marker(g, c ? 'square' : 'circle', 0, 0, 8, { fill: K.color(c), stroke: 'var(--surface)', 'stroke-width': 2 });
        const t = K.text(g, 0, -14, '', { 'text-anchor': 'middle', class: 'strong', 'font-size': 11 });
        K.drag(g, p, (d) => {
          data[k][i] = Math.round(K.clamp(d.x, 0, 100));
          place();
          update();
        });
        els[k].push({ g, t });
      });
    });
    function place() {
      const r = st.ranks(data.A.concat(data.B));
      ['A', 'B'].forEach((k, c) => data[k].forEach((v, i) => {
        const e = els[k][i];
        e.g.setAttribute('transform', `translate(${p.sx(v).toFixed(1)},${p.sy(rowY[k]).toFixed(1)})`);
        const rk = r[c * data.A.length + i];
        e.t.textContent = Number.isInteger(rk) ? String(rk) : rk.toFixed(1);
      }));
    }
    function update() {
      const A = data.A;
      const B = data.B;
      K.clear(gMean);
      [[A, 'A'], [B, 'B']].forEach(([arr, k]) => {
        const m = st.mean(arr);
        K.line(gMean, p.sx(m), p.sy(rowY[k] - 0.38), p.sx(m), p.sy(rowY[k] + 0.3), { stroke: 'var(--text)', 'stroke-width': 3, 'stroke-dasharray': '5 3' });
      });
      // 名次条
      stripBox.innerHTML = '';
      const svg = K.s('svg', { viewBox: '0 0 640 74', class: 'lab-svg', role: 'img', 'aria-label': '合在一起的名次' }, stripBox);
      const all = A.map((v) => ({ v, c: 0 })).concat(B.map((v) => ({ v, c: 1 })));
      const r = st.ranks(all.map((o) => o.v));
      all.forEach((o, i) => (o.r = r[i]));
      all.sort((x, y) => x.v - y.v || x.c - y.c);
      K.text(svg, 12, 16, '混在一起从小到大排名，只看颜色顺序：', { 'font-size': 11 });
      const step = 600 / all.length;
      all.forEach((o, i) => {
        const cx = 30 + i * step + step / 2 - 10;
        K.marker(svg, o.c ? 'square' : 'circle', cx, 40, 9, { fill: K.color(o.c) });
        K.text(svg, cx, 66, Number.isInteger(o.r) ? String(o.r) : o.r.toFixed(1), { 'text-anchor': 'middle', 'font-size': 10.5 });
      });
      const mw = st.mannWhitney(A, B);
      const tt = st.ttest(A, B, false);
      stats.set([
        ['A 组名次之和', String(mw.R1)],
        ['U（64 对里 A 更大的对数）', String(mw.U1)],
        ['U 检验 p 值', st.fmtP(mw.p), mw.p < 0.05 ? 'good' : ''],
        ['Welch t 检验 p 值', st.fmtP(tt.p), tt.p < 0.05 ? 'good' : ''],
      ]);
      const hasOut = Math.max(...A) >= 90;
      note.className = 'lab-note ' + (hasOut ? 'warn' : '');
      note.innerHTML = hasOut
        ? 'A 组的极端值把 A 的均值拉高、方差变大，<b>t 检验的 p 值一下子变大</b>；而在名次里它只是“第 16 名”，<b>U 检验几乎不受影响</b>。'
        : '试试点“A 组混进一个极端大值”，或者把某个点拖到很远的地方：只要名次不变，U 检验的结果就完全不变。';
    }
    place();
    update();
  },
});
