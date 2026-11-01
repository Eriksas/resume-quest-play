// 过拟合：多项式阶数越高，训练误差越小，测试误差先降后升；加数据、加 L2 正则都能把它拉回来。
Labs.register('overfit', {
  render(host, K) {
    const root = K.panel(host);
    const truth = (x) => 0.8 * Math.sin(Math.PI * x);
    let seed = 2;
    let train = [];
    let test = [];
    const LAMS = [0, 0.0001, 0.001, 0.01, 0.1, 1];
    const gen = () => {
      const r = K.rng(seed);
      const n = nSeg.value;
      train = Array.from({ length: n }, (_, i) => {
        const x = -1 + (2 * (i + 0.5)) / n + (r() - 0.5) * (1.6 / n);
        return { x, y: truth(x) + K.gauss(r) * 0.25 };
      });
      test = Array.from({ length: 60 }, () => {
        const x = -1 + 2 * r();
        return { x, y: truth(x) + K.gauss(r) * 0.25 };
      });
    };

    const ctl = K.row(root);
    const deg = K.slider(ctl, { label: '模型复杂度（多项式阶数）', min: 1, max: 12, step: 1, value: 3, onInput: () => draw() });
    const lam = K.slider(ctl, { label: 'L2 正则强度 λ', min: 0, max: 5, step: 1, value: 0, fmt: (i) => String(LAMS[i]), onInput: () => draw() });
    const ctl2 = K.row(root);
    const nSeg = K.seg(ctl2, [{ value: 12, label: '训练样本 12 个' }, { value: 60, label: '训练样本 60 个' }], 12, () => { gen(); draw(); });
    const showTest = K.check(ctl2, '显示测试点', true, () => draw());
    K.button(ctl2, '换一批数据', () => { seed += 1; gen(); draw(); });

    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const p = K.plot(left, { x: [-1.05, 1.05], y: [-1.6, 1.6], w: 440, h: 320, xlabels: false, ylabels: false, label: '数据和拟合曲线' });
    const gT = p.layer('truth', true);
    const gC = p.layer('curve', true);
    const gTe = p.layer('test', true);
    const gTr = p.layer('train', true);
    K.legend(left, [['训练点', 0], ['测试点（模型没见过）', 1], ['拟合曲线', 0, 'line']]);
    const pe = K.plot(right, { x: [1, 12], y: [-2.3, 1], w: 380, h: 320, xlabel: '阶数', ylabel: '误差（对数刻度）', xticks: [1, 3, 5, 7, 9, 11], yticks: [-2, -1, 0, 1], fy: (v) => (v === 0 ? '1' : '10^' + v), label: '训练误差和测试误差随复杂度变化' });
    const gE = pe.layer('e', true);
    const gEc = pe.layer('cur');
    K.legend(right, [['训练误差', 0, 'line'], ['测试误差', 1, 'line']]);
    const stats = K.stats(root);
    const note = K.note(root, '');

    const mse = (c, set) => K.mean(set.map((q) => (K.ml.polyval(c, q.x) - q.y) ** 2));
    const fitDeg = (d) => K.ml.polyfit(train.map((q) => q.x), train.map((q) => q.y), d, LAMS[lam.value]);

    function draw() {
      const c = fitDeg(deg.value);
      K.clear(gT);
      K.clear(gC);
      const tp = [];
      const cp = [];
      for (let x = -1; x <= 1.0001; x += 0.01) {
        tp.push([p.sx(x), p.sy(truth(x))]);
        cp.push([p.sx(x), p.sy(K.clamp(K.ml.polyval(c, x), -3, 3))]);
      }
      K.path(gT, tp, { class: 'soft', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 });
      K.path(gC, cp, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      K.drawPoints(gTr, p, train.map((q) => ({ x: q.x, y: q.y, c: 0 })), { r: 5 });
      if (showTest.value) K.drawPoints(gTe, p, test.map((q) => ({ x: q.x, y: q.y, c: 1 })), { r: 3.5, hollow: () => true });
      else K.clear(gTe);

      K.clear(gE);
      K.clear(gEc);
      const tr = [];
      const te = [];
      const teM = [];
      for (let d = 1; d <= 12; d++) {
        const cd = fitDeg(d);
        teM.push(mse(cd, test));
        tr.push([pe.sx(d), pe.sy(K.clamp(Math.log10(mse(cd, train) + 1e-6), -2.3, 1))]);
        te.push([pe.sx(d), pe.sy(K.clamp(Math.log10(teM[d - 1] + 1e-6), -2.3, 1))]);
      }
      K.path(gE, tr, { stroke: 'var(--series-1)', 'stroke-width': 2 });
      K.path(gE, te, { stroke: 'var(--series-2)', 'stroke-width': 2 });
      K.line(gEc, pe.sx(deg.value), pe.P.t, pe.sx(deg.value), pe.H - pe.P.b, { class: 'soft', 'stroke-dasharray': '3 3' });
      K.marker(gEc, 'circle', tr[deg.value - 1][0], tr[deg.value - 1][1], 5, { fill: 'var(--series-1)', stroke: 'var(--surface)', 'stroke-width': 2 });
      K.marker(gEc, 'circle', te[deg.value - 1][0], te[deg.value - 1][1], 5, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });

      const eTr = mse(c, train);
      const eTe = mse(c, test);
      // 和右图里测试误差的最低点比：明显高出一截才算过拟合（数据有噪声，测试误差不可能降到 0）
      const best = Math.min(...teM);
      const state = eTr > 0.08 ? 'under' : eTe > best * 1.5 ? 'over' : 'good';
      stats.set([
        ['训练误差 MSE', eTr.toFixed(3)],
        ['测试误差 MSE', eTe > 99 ? '>99' : eTe.toFixed(3), state === 'over' ? 'bad' : state === 'good' ? 'good' : ''],
        ['判断', state === 'under' ? '欠拟合' : state === 'over' ? '过拟合' : '刚好'],
      ]);
      note.className = 'lab-note ' + (state === 'good' ? 'good' : 'warn');
      if (state === 'under') note.innerHTML = '<b>欠拟合</b>：模型太简单，连训练点都拟合不好，训练误差和测试误差都高。';
      else if (state === 'over') note.innerHTML = '<b>过拟合</b>：曲线拐来拐去穿过每个训练点，训练误差很小，可一到没见过的测试点误差就大。它学到的是噪声。试试：把训练样本换成 60 个，或者把 λ 调大。';
      else note.innerHTML = '<b>刚好</b>：测试误差在右图的最低点附近（训练误差总会比测试误差低一些）。测试误差最低的那个复杂度就是该选的——实际中用验证集或交叉验证去找它。';
    }

    gen();
    draw();
  },
});
