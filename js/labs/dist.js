// 常见分布的期望和方差：选一个分布、调参数，看形状、期望和方差；再抽样，看样本均值和样本方差是不是接近理论值。
Labs.register('dist', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const poisSample = (r, lam) => { let k = 0; let p = 1; const L = Math.exp(-lam); do { k += 1; p *= r(); } while (p > L); return k - 1; };
    const D = {
      bern: { label: '伯努利', discrete: true, ps: [['p', '成功概率 p', 0.05, 0.95, 0.05, 0.3]], xr: () => [-0.5, 1.5], f: (x, P) => (x === 0 ? 1 - P.p : x === 1 ? P.p : 0), E: (P) => P.p, V: (P) => P.p * (1 - P.p), fE: 'p', fV: 'p(1 − p)', s: (r, P) => (r() < P.p ? 1 : 0) },
      binom: { label: '二项', discrete: true, ps: [['n', '试验次数 n', 1, 40, 1, 10], ['p', '成功概率 p', 0.05, 0.95, 0.05, 0.3]], xr: (P) => [-0.5, P.n + 0.5], f: (x, P) => st.binomPmf(x, P.n, P.p), E: (P) => P.n * P.p, V: (P) => P.n * P.p * (1 - P.p), fE: 'np', fV: 'np(1 − p)', s: (r, P) => { let c = 0; for (let i = 0; i < P.n; i++) if (r() < P.p) c += 1; return c; } },
      pois: { label: '泊松', discrete: true, ps: [['lam', '平均次数 λ', 0.5, 15, 0.5, 3]], xr: (P) => [-0.5, Math.ceil(P.lam + 4 * Math.sqrt(P.lam) + 2) + 0.5], f: (x, P) => st.poisPmf(x, P.lam), E: (P) => P.lam, V: (P) => P.lam, fE: 'λ', fV: 'λ', s: (r, P) => poisSample(r, P.lam) },
      unif: { label: '均匀', discrete: false, ps: [['a', '下限 a', 0, 5, 0.5, 1], ['w', '宽度 b − a', 0.5, 8, 0.5, 4]], xr: (P) => [P.a - 1, P.a + P.w + 1], f: (x, P) => (x >= P.a && x <= P.a + P.w ? 1 / P.w : 0), E: (P) => P.a + P.w / 2, V: (P) => (P.w * P.w) / 12, fE: '(a + b) / 2', fV: '(b − a)² / 12', s: (r, P) => P.a + r() * P.w },
      expo: { label: '指数', discrete: false, ps: [['lam', '速率 λ', 0.2, 3, 0.1, 1]], xr: (P) => [0, 6 / P.lam], f: (x, P) => (x < 0 ? 0 : P.lam * Math.exp(-P.lam * x)), E: (P) => 1 / P.lam, V: (P) => 1 / (P.lam * P.lam), fE: '1 / λ', fV: '1 / λ²', s: (r, P) => -Math.log(1 - r()) / P.lam },
      norm: { label: '正态', discrete: false, ps: [['mu', '均值 μ', -3, 3, 0.5, 0], ['sd', '标准差 σ', 0.5, 3, 0.1, 1]], xr: (P) => [P.mu - 4 * P.sd, P.mu + 4 * P.sd], f: (x, P) => st.normPdf(x, P.mu, P.sd), E: (P) => P.mu, V: (P) => P.sd * P.sd, fE: 'μ', fV: 'σ²', s: (r, P) => P.mu + P.sd * K.gauss(r) },
    };
    let key = 'binom';
    let P = {};
    let sample = null;
    let seed = 1;

    const ctl = K.row(root);
    K.seg(ctl, Object.keys(D).map((k) => ({ value: k, label: D[k].label })), key, (v) => { key = v; sample = null; buildSliders(); draw(); });
    const sl = K.row(root);
    const btns = K.row(root);
    K.button(btns, '抽样 2000 次', () => { const r = K.rng(seed++); sample = Array.from({ length: 2000 }, () => D[key].s(r, P)); draw(); }, true);
    K.button(btns, '清空样本', () => { sample = null; draw(); });
    const plotBox = K.h('<div></div>', root);
    const stats = K.stats(root);
    const note = K.note(root, '');

    function buildSliders() {
      sl.innerHTML = '';
      P = {};
      D[key].ps.forEach(([k, label, min, max, step, v]) => {
        P[k] = v;
        K.slider(sl, { label, min, max, step, value: v, fmt: (x) => (step < 1 ? x.toFixed(step < 0.1 ? 2 : 1) : String(x)), onInput: (x) => { P[k] = x; sample = null; draw(); } });
      });
    }

    function draw() {
      const d = D[key];
      const Q = Object.assign({}, P, { n: Math.round(P.n || 0) });
      const [x0, x1] = d.xr(Q);
      let ymax = 0;
      const pts = [];
      if (d.discrete) for (let x = Math.ceil(x0); x <= x1; x++) { const y = d.f(x, Q); pts.push([x, y]); ymax = Math.max(ymax, y); }
      else for (let i = 0; i <= 200; i++) { const x = x0 + ((x1 - x0) * i) / 200; const y = d.f(x, Q); pts.push([x, y]); ymax = Math.max(ymax, y); }
      let hist = null;
      if (sample) {
        if (d.discrete) {
          const cnt = new Map();
          sample.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
          hist = [...cnt.entries()].map(([x, c]) => [x, c / sample.length]);
        } else {
          const bins = 30;
          const w = (x1 - x0) / bins;
          const c = new Array(bins).fill(0);
          sample.forEach((v) => { const b = Math.floor((v - x0) / w); if (b >= 0 && b < bins) c[b] += 1; });
          hist = c.map((v, i) => [x0 + i * w, v / sample.length / w, w]);
        }
        hist.forEach((h) => (ymax = Math.max(ymax, h[1])));
      }
      plotBox.innerHTML = '';
      const p = K.plot(plotBox, { x: [x0, x1], y: [0, ymax * 1.15 || 1], w: 640, h: 300, xticks: d.discrete ? K.ticks(x0, x1, 6).filter(Number.isInteger) : undefined, ylabel: d.discrete ? '概率 P(X = k)' : '概率密度', fy: (v) => v.toFixed(2), ny: 3, label: `${d.label}分布` });
      const g = p.layer('g', true);
      if (hist && !d.discrete) hist.forEach(([x, y, w]) => K.s('rect', { x: p.sx(x) + 0.5, y: p.sy(y), width: Math.max(0, p.sx(x + w) - p.sx(x) - 1), height: p.sy(0) - p.sy(y), fill: 'var(--series-2)', opacity: 0.45 }, g));
      if (d.discrete) {
        const bw = Math.max(4, Math.min(30, (p.sx(1) - p.sx(0)) * 0.6));
        pts.forEach(([x, y]) => K.s('rect', { x: p.sx(x) - bw / 2, y: p.sy(y), width: bw, height: p.sy(0) - p.sy(y), rx: 3, fill: 'var(--series-1)' }, g));
        if (hist) hist.forEach(([x, y]) => K.marker(g, 'diamond', p.sx(x), p.sy(y), 5, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 1.5 }));
      } else K.path(g, pts.map(([x, y]) => [p.sx(x), p.sy(y)]), { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      const E = d.E(Q);
      const V = d.V(Q);
      K.line(g, p.sx(E), p.P.t, p.sx(E), p.H - p.P.b, { stroke: 'var(--text)', 'stroke-width': 2, 'stroke-dasharray': '6 4' });
      K.text(g, p.sx(E) + 6, p.P.t + 14, `期望 = ${E.toFixed(2)}`, { class: 'strong' });
      K.legend(plotBox, [[d.discrete ? '理论概率' : '理论密度', 0, d.discrete ? 'square' : 'line'], ['抽样得到的频率', 1, d.discrete ? '' : 'square']]);
      const items = [['期望 E(X)', `${d.fE} = ${E.toFixed(3)}`], ['方差 Var(X)', `${d.fV} = ${V.toFixed(3)}`]];
      if (sample) items.push(['样本均值', st.mean(sample).toFixed(3), 'good'], ['样本方差', st.var(sample).toFixed(3), 'good']);
      stats.set(items);
      note.innerHTML = {
        bern: '一次试验，成功记 1、失败记 0。比如一个用户“转化 / 没转化”。方差 p(1 − p) 在 p = 0.5 时最大。',
        binom: 'n 次独立的伯努利试验里成功的次数，比如 n 个用户里转化了几个。期望 np，方差 np(1 − p)。',
        pois: '单位时间（或单位面积）里事件发生的次数，比如每分钟来几个订单。<b>期望和方差都等于 λ</b>，这是它的标志。',
        unif: '区间内每个值可能性一样。期望在正中间，方差只和区间宽度有关。',
        expo: '等待下一次事件发生的时间，比如下一个订单还要等多久。它和泊松分布是一对：次数服从泊松，间隔服从指数。',
        norm: '钟形、对称，均值 = 中位数 = 众数。很多统计推断依赖“样本均值近似正态”。',
      }[key] + (sample ? ' 抽了 2000 次以后，样本均值和样本方差都很接近理论值——这就是大数定律。' : '');
    }
    buildSliders();
    draw();

    K.h(`<table class="lab-table"><thead><tr><th>分布</th><th>典型场景</th><th>期望</th><th>方差</th></tr></thead><tbody>
      <tr><td>伯努利 B(1, p)</td><td>一次是否转化</td><td>p</td><td>p(1 − p)</td></tr>
      <tr><td>二项 B(n, p)</td><td>n 个人里几个转化</td><td>np</td><td>np(1 − p)</td></tr>
      <tr><td>泊松 P(λ)</td><td>每分钟来几单</td><td>λ</td><td>λ</td></tr>
      <tr><td>均匀 U(a, b)</td><td>区间内等可能</td><td>(a + b) / 2</td><td>(b − a)² / 12</td></tr>
      <tr><td>指数 Exp(λ)</td><td>等下一单要多久</td><td>1 / λ</td><td>1 / λ²</td></tr>
      <tr><td>正态 N(μ, σ²)</td><td>大量因素叠加的波动</td><td>μ</td><td>σ²</td></tr>
    </tbody></table>`, root);
  },
});
