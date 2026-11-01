// 梯度下降 vs 梯度提升：一个在“参数空间”里沿负梯度改参数，一个在“函数空间”里每步加一棵树去拟合负梯度。
Labs.register('gdgb', {
  render(host, K) {
    const root = K.panel(host);
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div class="lab"></div>', grid);
    const right = K.h('<div class="lab"></div>', grid);

    // ---------- 梯度下降 ----------
    K.h('<h3 class="sub-h">梯度下降：改参数 w</h3>', left);
    const L = (w) => 0.5 * (w - 2) ** 2 + 0.3;
    const dL = (w) => w - 2;
    let w = -2.5;
    let path = [w];
    const pg = K.plot(left, { x: [-3, 6], y: [0, 12], w: 380, h: 260, xlabel: '参数 w', ylabel: '损失', yticks: [0, 4, 8, 12], label: '损失函数和梯度下降的路径' });
    const gCurve = pg.layer('c', true);
    const gPath = pg.layer('p', true);
    const cp = [];
    for (let x = -3; x <= 6; x += 0.05) cp.push([pg.sx(x), pg.sy(L(x))]);
    K.path(gCurve, cp, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
    const c1 = K.row(left);
    const lr = K.slider(c1, { label: '学习率', min: 0.1, max: 2.1, step: 0.1, value: 0.3, fmt: (v) => v.toFixed(1), onInput: () => { w = -2.5; path = [w]; drawGD(); } });
    const c2 = K.row(left);
    K.button(c2, '走一步', () => { w = w - lr.value * dL(w); path.push(w); drawGD(); }, true);
    K.button(c2, '重来', () => { w = -2.5; path = [w]; drawGD(); });
    const sGD = K.stats(left);
    function drawGD() {
      K.clear(gPath);
      const ptsP = path.map((v) => [pg.sx(K.clamp(v, -3, 6)), pg.sy(Math.min(L(v), 12))]);
      if (ptsP.length > 1) K.path(gPath, ptsP, { stroke: 'var(--series-2)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
      ptsP.forEach((q, i) => K.marker(gPath, 'circle', q[0], q[1], i === ptsP.length - 1 ? 7 : 3.5, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 1.5 }));
      sGD.set([['步数', String(path.length - 1)], ['w', w.toFixed(3)], ['损失', L(w).toFixed(3), Math.abs(w) > 6 ? 'bad' : '']]);
    }
    drawGD();
    K.note(left, '每一步：w ← w − 学习率 × 梯度。学习率太小走得慢；超过 2 就来回越跳越远，发散了。', '');

    // ---------- 梯度提升 ----------
    K.h('<h3 class="sub-h">梯度提升：每步加一棵小树</h3>', right);
    const r = K.rng(9);
    const data = Array.from({ length: 40 }, (_, i) => {
      const x = (i + 0.5) / 40;
      return { x, y: Math.sin(2 * Math.PI * x) + K.gauss(r) * 0.15 };
    });
    let F = data.map(() => K.mean(data.map((q) => q.y)));
    let rounds = 0;
    let lastStump = null;
    const pb = K.plot(right, { x: [0, 1], y: [-1.6, 1.6], w: 380, h: 260, xlabels: false, ylabel: 'y', label: '梯度提升的拟合过程' });
    const gRes = pb.layer('res', true);
    const gF = pb.layer('f', true);
    const gPb = pb.layer('pts', true);
    const c3 = K.row(right);
    const nu = K.slider(c3, { label: '学习率 ν', min: 0.1, max: 1, step: 0.1, value: 0.5, fmt: (v) => v.toFixed(1) });
    const c4 = K.row(right);
    K.button(c4, '加一棵树', () => boost(1), true);
    K.button(c4, '再加 10 棵', () => boost(10));
    K.button(c4, '重来', () => { F = data.map(() => K.mean(data.map((q) => q.y))); rounds = 0; lastStump = null; drawGB(); });
    const sGB = K.stats(right);
    function stump(res) {
      // 一层回归树：找一个切点，左右各取残差平均
      let best = null;
      for (let k = 1; k < data.length; k++) {
        const l = res.slice(0, k);
        const rr = res.slice(k);
        const ml = K.mean(l);
        const mr = K.mean(rr);
        const sse = l.reduce((s, v) => s + (v - ml) ** 2, 0) + rr.reduce((s, v) => s + (v - mr) ** 2, 0);
        if (!best || sse < best.sse) best = { sse, t: (data[k - 1].x + data[k].x) / 2, ml, mr };
      }
      return best;
    }
    function boost(n) {
      for (let i = 0; i < n; i++) {
        const res = data.map((q, j) => q.y - F[j]);
        const s = stump(res);
        F = F.map((f, j) => f + nu.value * (data[j].x <= s.t ? s.ml : s.mr));
        lastStump = s;
        rounds += 1;
      }
      drawGB();
    }
    function drawGB() {
      K.drawPoints(gPb, pb, data.map((q) => ({ x: q.x, y: q.y, c: 0 })), { r: 3.5 });
      K.clear(gRes);
      data.forEach((q, j) => K.line(gRes, pb.sx(q.x), pb.sy(q.y), pb.sx(q.x), pb.sy(F[j]), { stroke: 'var(--series-2)', 'stroke-opacity': 0.6 }));
      K.clear(gF);
      const step = [];
      data.forEach((q, j) => {
        const x0 = j === 0 ? 0 : (data[j - 1].x + q.x) / 2;
        const x1 = j === data.length - 1 ? 1 : (q.x + data[j + 1].x) / 2;
        step.push([pb.sx(x0), pb.sy(F[j])], [pb.sx(x1), pb.sy(F[j])]);
      });
      K.path(gF, step, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      if (lastStump) K.line(gF, pb.sx(lastStump.t), pb.P.t, pb.sx(lastStump.t), pb.H - pb.P.b, { class: 'soft', 'stroke-dasharray': '3 3' });
      const mse = K.mean(data.map((q, j) => (q.y - F[j]) ** 2));
      sGB.set([['树的数量', String(rounds)], ['训练 MSE', mse.toFixed(3)]]);
    }
    drawGB();
    K.note(right, '橙色竖线是残差（平方损失下就是负梯度）。每一步拟合一棵只切一刀的小树去拟合残差，乘上学习率 ν 后加到模型上。', '');

    K.note(root, '<b>一句话区分</b>：梯度下降是一种<b>优化方法</b>，在参数空间里沿负梯度更新参数（线性回归、逻辑回归、神经网络都靠它训练）；梯度提升是一种<b>集成模型</b>，在函数空间里做“梯度下降”——每一步新加一个弱学习器（通常是树）去拟合当前损失的负梯度，加法叠起来。GBDT、XGBoost、LightGBM 都属于梯度提升。', 'good');
  },
});
