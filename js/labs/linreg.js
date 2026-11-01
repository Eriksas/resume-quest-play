// 线性回归：拖动数据点，看最小二乘直线、残差平方和 R² 怎么变；再看多重共线性让系数变得不稳。
Labs.register('linreg', {
  render(host, K) {
    const root = K.panel(host);
    const seed = { v: 7 };
    const make = () => {
      const r = K.rng(seed.v);
      return Array.from({ length: 12 }, (_, i) => {
        const x = 1 + i * 0.75 + (r() - 0.5) * 0.4;
        return { x, y: 2 + 0.8 * x + K.gauss(r) * 0.9 };
      });
    };
    let pts = make();
    let mode = 'ols';

    const top = K.row(root);
    K.seg(top, [{ value: 'ols', label: '最小二乘（自动）' }, { value: 'manual', label: '自己调直线' }], mode, (v) => {
      mode = v;
      manual.hidden = v !== 'manual';
      if (v === 'manual') {
        const f = fit();
        slope.set(Math.round(f.b1 * 100) / 100, true);
        icpt.set(Math.round((f.b0 + 1.5) * 20) / 20, true);
      }
      drawFit();
    });
    const sq = K.check(top, '显示残差平方', true, () => drawFit());

    const p = K.plot(root, { x: [0, 11], y: [0, 14], w: 540, h: 340, xlabel: 'x', ylabel: 'y', label: '线性回归：散点和拟合直线' });
    const gSq = p.layer('sq', true);
    const gRes = p.layer('res', true);
    const gLine = p.layer('line', true);
    const gPts = p.layer('pts');
    K.caption(root, '拖动点改变数据；点空白处加一个点。');

    const manual = K.row(root);
    manual.hidden = true;
    const slope = K.slider(manual, { label: '斜率 b₁', min: -1, max: 2, step: 0.01, value: 0.8, fmt: (v) => v.toFixed(2), onInput: () => drawFit() });
    const icpt = K.slider(manual, { label: '截距 b₀', min: -4, max: 8, step: 0.05, value: 2, fmt: (v) => v.toFixed(2), onInput: () => drawFit() });

    const btns = K.row(root);
    K.button(btns, '加一个离群点', () => {
      pts.push({ x: 9.5, y: 2 });
      drawAll();
    });
    K.button(btns, '换一批数据', () => {
      seed.v += 1;
      pts = make();
      drawAll();
    });
    const stats = K.stats(root);
    const note = K.note(root, '');

    function fit() {
      const mx = K.mean(pts.map((q) => q.x));
      const my = K.mean(pts.map((q) => q.y));
      let sxy = 0;
      let sxx = 0;
      pts.forEach((q) => {
        sxy += (q.x - mx) * (q.y - my);
        sxx += (q.x - mx) ** 2;
      });
      const b1 = sxx ? sxy / sxx : 0;
      return { b0: my - b1 * mx, b1, my };
    }
    const sse = (b0, b1) => pts.reduce((s, q) => s + (q.y - b0 - b1 * q.x) ** 2, 0);

    function drawFit() {
      const best = fit();
      const b0 = mode === 'manual' ? icpt.value : best.b0;
      const b1 = mode === 'manual' ? slope.value : best.b1;
      K.clear(gSq);
      K.clear(gRes);
      K.clear(gLine);
      K.line(gLine, p.sx(0), p.sy(b0), p.sx(11), p.sy(b0 + 11 * b1), { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      pts.forEach((q) => {
        const yh = b0 + b1 * q.x;
        const px = p.sx(q.x);
        const py = p.sy(q.y);
        const ph = p.sy(yh);
        if (sq.value) {
          const side = Math.abs(py - ph);
          K.s('rect', { x: px, y: Math.min(py, ph), width: side, height: side, fill: 'var(--series-2)', opacity: 0.13, stroke: 'var(--series-2)', 'stroke-opacity': 0.5 }, gSq);
        }
        K.line(gRes, px, py, px, ph, { stroke: 'var(--series-2)', 'stroke-width': 1.5, 'stroke-dasharray': '3 2' });
      });
      const e = sse(b0, b1);
      const eBest = sse(best.b0, best.b1);
      const sst = pts.reduce((s, q) => s + (q.y - best.my) ** 2, 0);
      const r2 = sst ? 1 - e / sst : 0;
      stats.set([
        ['直线', `ŷ = ${b0.toFixed(2)} + ${b1.toFixed(2)}x`],
        ['残差平方和 SSE', e.toFixed(2), mode === 'manual' && e > eBest * 1.02 ? 'bad' : 'good'],
        ['最小可能的 SSE', eBest.toFixed(2)],
        ['R²', r2.toFixed(3)],
        ['样本数', String(pts.length)],
      ]);
      note.innerHTML = mode === 'manual'
        ? (e <= eBest * 1.02 ? '找到了！这条线的残差平方和已经最小——这就是“最小二乘”。' : `你的直线比最优多了 <b>${(e - eBest).toFixed(2)}</b> 的残差平方和。橙色方块的总面积就是 SSE，试着让它最小。`)
        : '最小二乘：选一条直线，让所有<b>竖直方向的误差</b>的平方和（橙色方块的总面积）最小。离群点的误差被平方放大，所以它能把整条线“拽”过去。';
    }

    function drawAll() {
      const els = K.drawPoints(gPts, p, pts.map((q) => ({ x: q.x, y: q.y, c: 0 })), { r: 6 });
      els.forEach((e, i) =>
        K.drag(e, p, (d) => {
          pts[i].x = K.clamp(d.x, 0.2, 10.8);
          pts[i].y = K.clamp(d.y, 0.2, 13.8);
          e.setAttribute('cx', p.sx(pts[i].x));
          e.setAttribute('cy', p.sy(pts[i].y));
          drawFit();
        })
      );
      drawFit();
    }
    p.svg.addEventListener('click', (e) => {
      if (e.target.classList.contains('pt')) return;
      const d = p.toData(e);
      if (!p.inside(d) || pts.length >= 40) return;
      pts.push({ x: d.x, y: d.y });
      drawAll();
    });
    drawAll();

    // ---------- 多重共线性 ----------
    K.h('<h3 class="sub-h">多元回归：两个自变量高度相关会怎样？</h3>', root);
    K.note(root, '真实模型是 y = 1 + 1·x₁ + 1·x₂ + 噪声。每次抽 30 个样本拟合一次，重复 80 次，把得到的 (b₁, b₂) 画成一个点。', '');
    const ctl = K.row(root);
    const rho = K.slider(ctl, { label: 'x₁ 和 x₂ 的相关系数', min: 0, max: 0.99, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2), onInput: () => sim() });
    const p2 = K.plot(root, { x: [-2, 4], y: [-2, 4], w: 540, h: 300, xlabel: 'b₁ 的估计值', ylabel: 'b₂ 的估计值', label: '系数估计的散布' });
    const g2 = p2.layer('pts', true);
    const g2t = p2.layer('truth');
    K.marker(g2t, 'cross', p2.sx(1), p2.sy(1), 7, { stroke: 'var(--text)' });
    K.text(g2t, p2.sx(1) + 10, p2.sy(1) - 8, '真实值 (1, 1)', { class: 'strong' });
    const stats2 = K.stats(root);
    function sim() {
      const r = K.rng(99);
      const est = [];
      for (let k = 0; k < 80; k++) {
        const X = [];
        const y = [];
        for (let i = 0; i < 30; i++) {
          const x1 = K.gauss(r);
          const x2 = rho.value * x1 + Math.sqrt(1 - rho.value ** 2) * K.gauss(r);
          X.push([x1, x2]);
          y.push(1 + x1 + x2 + K.gauss(r));
        }
        const b = K.ml.ols(X, y, 0);
        est.push({ x: b[1], y: b[2], c: 0 });
      }
      K.drawPoints(g2, p2, est, { r: 3.5, opacity: () => 0.75 });
      const sd = (a) => Math.sqrt(K.mean(a.map((v) => (v - K.mean(a)) ** 2)));
      stats2.set([
        ['b₁ 的标准差', sd(est.map((e) => e.x)).toFixed(2), rho.value > 0.9 ? 'bad' : ''],
        ['b₁ + b₂ 的标准差', sd(est.map((e) => e.x + e.y)).toFixed(2)],
      ]);
    }
    sim();
    K.note(root, '相关越高，点云越沿着 b₁ + b₂ = 2 这条斜线拉长：<b>单个系数变得很不稳</b>（甚至符号反过来），但两者之和依然稳定。这就是多重共线性——预测不受影响，解释单个系数要小心。常见处理：删掉其一、合并变量，或者用岭回归（L2）。', 'warn');
  },
});
