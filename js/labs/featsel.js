// 特征筛选：过滤法（看相关性）、包裹法（递归特征消除 RFE）、嵌入法（Lasso 让系数变成 0）。
Labs.register('featsel', {
  render(host, K) {
    const root = K.panel(host);
    // 8 个特征：x1~x3 有用；x4 ≈ x1（冗余）；x5~x7 是噪声；x8 几乎是常数
    const r = K.rng(21);
    const N = 240;
    const names = ['x1 有用', 'x2 有用', 'x3 有用', 'x4 ≈ x1', 'x5 噪声', 'x6 噪声', 'x7 噪声', 'x8 近乎常数'];
    const X = [];
    const y = [];
    for (let i = 0; i < N; i++) {
      const x1 = K.gauss(r);
      const x2 = K.gauss(r);
      const x3 = K.gauss(r);
      const x4 = x1 + K.gauss(r) * 0.15;
      const row = [x1, x2, x3, x4, K.gauss(r), K.gauss(r), K.gauss(r), r() < 0.97 ? 0 : 1];
      X.push(row);
      y.push(3 * x1 - 2 * x2 + 1.2 * x3 + K.gauss(r) * 1.5);
    }
    const { Z } = K.ml.standardize(X.map((row) => row.map((v, j) => (j === 7 ? v + 1e-9 * j : v))));
    const ym = K.mean(y);
    const yc = y.map((v) => v - ym);
    const trIdx = [...Array(N).keys()].filter((i) => i % 4 !== 0);
    const vaIdx = [...Array(N).keys()].filter((i) => i % 4 === 0);
    const variance = X[0].map((_, j) => { const col = X.map((row) => row[j]); const m = K.mean(col); return K.mean(col.map((v) => (v - m) ** 2)); });
    const corr = Z[0].map((_, j) => { const col = Z.map((row) => row[j]); return Math.abs(K.mean(col.map((v, i) => v * yc[i])) / Math.sqrt(K.mean(yc.map((v) => v * v)))); });

    const ctl = K.row(root);
    const mode = K.seg(ctl, [{ value: 'filter', label: '过滤法' }, { value: 'wrapper', label: '包裹法（RFE）' }, { value: 'embed', label: '嵌入法（L1 / Lasso）' }], 'filter', () => { setup(); draw(); });
    const sub = K.row(root);
    const p = K.plot(root, { x: [0, 8], y: [0, 1], w: 640, h: 280, xticks: [], ylabels: false, grid: false, label: '每个特征的得分' });
    const gB = p.layer('bars');
    const stats = K.stats(root);
    const note = K.note(root, '');

    let removed = [];
    let rfeLog = [];
    let thr = null;
    let alpha = null;

    function setup() {
      sub.innerHTML = '';
      removed = [];
      rfeLog = [];
      if (mode.value === 'filter') thr = K.slider(sub, { label: '相关性阈值', min: 0, max: 0.8, step: 0.02, value: 0.2, fmt: (v) => v.toFixed(2), onInput: () => draw() });
      if (mode.value === 'wrapper') {
        K.button(sub, '去掉当前最弱的特征', () => { rfeStep(); draw(); }, true);
        K.button(sub, '重来', () => { removed = []; rfeLog = []; draw(); });
      }
      if (mode.value === 'embed') alpha = K.slider(sub, { label: 'L1 正则强度 α', min: 0, max: 2.5, step: 0.05, value: 0.2, fmt: (v) => v.toFixed(2), onInput: () => draw() });
    }

    const fitOLS = (cols, idx) => K.ml.ols(idx.map((i) => cols.map((j) => Z[i][j])), idx.map((i) => yc[i]), 0);
    function valR2(cols) {
      if (!cols.length) return 0;
      const b = fitOLS(cols, trIdx);
      const pred = (i) => b[0] + cols.reduce((s, j, k) => s + b[k + 1] * Z[i][j], 0);
      const sse = vaIdx.reduce((s, i) => s + (yc[i] - pred(i)) ** 2, 0);
      const vm = K.mean(vaIdx.map((i) => yc[i]));
      const sst = vaIdx.reduce((s, i) => s + (yc[i] - vm) ** 2, 0);
      return 1 - sse / sst;
    }
    function rfeStep() {
      const cols = [...Array(8).keys()].filter((j) => !removed.includes(j));
      if (cols.length <= 1) return;
      const b = fitOLS(cols, trIdx);
      let worst = 0;
      cols.forEach((j, k) => { if (Math.abs(b[k + 1]) < Math.abs(b[worst + 1])) worst = k; });
      removed.push(cols[worst]);
      rfeLog.push({ removed: cols[worst], r2: valR2(cols.filter((_, k) => k !== worst)) });
    }
    function lasso(a) {
      let b = new Array(8).fill(0);
      for (let it = 0; it < 200; it++) {
        for (let j = 0; j < 8; j++) {
          let rho = 0;
          let zz = 0;
          for (let i = 0; i < N; i++) {
            const pred = b.reduce((s, bk, k) => s + bk * Z[i][k], 0) - b[j] * Z[i][j];
            rho += Z[i][j] * (yc[i] - pred);
            zz += Z[i][j] ** 2;
          }
          rho /= N;
          zz /= N;
          b[j] = Math.sign(rho) * Math.max(Math.abs(rho) - a, 0) / zz;
        }
      }
      return b;
    }

    function bars(vals, keep, fmt, maxV) {
      K.clear(gB);
      const bw = (p.W - p.P.l - p.P.r) / 8;
      vals.forEach((v, j) => {
        const h = (Math.abs(v) / maxV) * (p.H - p.P.t - p.P.b - 18);
        const x = p.P.l + j * bw + 8;
        const yb = p.H - p.P.b;
        K.s('rect', { x, y: yb - h, width: bw - 16, height: Math.max(h, 1), rx: 4, fill: keep[j] ? 'var(--series-1)' : 'var(--muted)', opacity: keep[j] ? 1 : 0.35 }, gB);
        K.text(gB, x + (bw - 16) / 2, yb - h - 5, fmt(v), { 'text-anchor': 'middle', 'font-size': 11 });
        K.text(gB, x + (bw - 16) / 2, yb + 15, names[j], { 'text-anchor': 'middle', 'font-size': 10.5, class: keep[j] ? 'strong' : '' });
      });
    }

    function draw() {
      if (mode.value === 'filter') {
        const keep = corr.map((c, j) => c >= thr.value && variance[j] > 0.05);
        bars(corr, keep, (v) => v.toFixed(2), 1);
        K.line(gB, p.P.l, p.H - p.P.b - (thr.value / 1) * (p.H - p.P.t - p.P.b - 18), p.W - p.P.r, p.H - p.P.b - (thr.value / 1) * (p.H - p.P.t - p.P.b - 18), { stroke: 'var(--series-2)', 'stroke-dasharray': '5 4', 'stroke-width': 2 });
        stats.set([['保留特征', String(keep.filter(Boolean).length)], ['留下的特征在验证集上的 R²', valR2(keep.map((k, j) => (k ? j : -1)).filter((j) => j >= 0)).toFixed(3)]]);
        note.innerHTML = '<b>过滤法</b>：每个特征单独和目标算一个分数（这里是相关系数的绝对值），再按阈值或前 k 个挑。方差几乎为 0 的 x8 先被方差阈值去掉。快，但看不出“x4 和 x1 重复了”——两个都会留下。';
      } else if (mode.value === 'wrapper') {
        const cols = [...Array(8).keys()].filter((j) => !removed.includes(j));
        const b = fitOLS(cols, trIdx);
        const coef = new Array(8).fill(0);
        cols.forEach((j, k) => (coef[j] = b[k + 1]));
        const mx = Math.max(...coef.map(Math.abs), 0.1);
        bars(coef, coef.map((_, j) => !removed.includes(j)), (v) => (v ? v.toFixed(2) : '已删'), mx);
        stats.set([['剩余特征', String(cols.length)], ['验证集 R²', valR2(cols).toFixed(3)], ['已删除', removed.map((j) => names[j].split(' ')[0]).join('、') || '无']]);
        note.innerHTML = '<b>包裹法（RFE）</b>：用模型本身打分——每次拟合一遍，删掉系数绝对值最小的那个特征，再重新拟合……一直删到验证集表现开始变差为止。比过滤法准，但要反复训练模型，慢。注意看：删到只剩 x1/x4 之一、x2、x3 时 R² 几乎不掉。';
      } else {
        const b = lasso(alpha.value);
        const mx = Math.max(...b.map(Math.abs), 0.1);
        bars(b, b.map((v) => Math.abs(v) > 1e-6), (v) => (Math.abs(v) > 1e-6 ? v.toFixed(2) : '0'), Math.max(mx, 3.2));
        const kept = b.map((v, j) => (Math.abs(v) > 1e-6 ? j : -1)).filter((j) => j >= 0);
        stats.set([['非零系数', String(kept.length)], ['验证集 R²（用留下的特征重拟合）', valR2(kept).toFixed(3)]]);
        note.innerHTML = '<b>嵌入法</b>：在训练的同时做筛选。Lasso 在损失里加了 α×|系数| 的惩罚，α 越大，越多系数被压到<b>正好是 0</b>，等于把特征删了。树模型的特征重要性也属于这一类。相关的 x1 和 x4，Lasso 往往只留一个。';
      }
    }

    setup();
    draw();
  },
});
