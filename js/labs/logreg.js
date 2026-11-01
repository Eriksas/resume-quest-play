// 逻辑回归：线性部分 z = w·x + b，经过 sigmoid 变成概率；调 w 和分界点，或者让梯度下降自己训练。
Labs.register('logreg', {
  render(host, K) {
    const root = K.panel(host);
    const r = K.rng(11);
    let pts = [];
    for (let i = 0; i < 9; i++) pts.push({ x: 0.6 + r() * 5.2, y: 0 });
    for (let i = 0; i < 9; i++) pts.push({ x: 4.2 + r() * 5.2, y: 1 });
    let w = 0.6;
    let x0 = 5;
    let training = null;
    const trace = [];

    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);

    const p = K.plot(left, { x: [0, 10], y: [-0.08, 1.08], w: 520, h: 320, xlabel: '特征 x', ylabel: 'P(y=1)', yticks: [0, 0.5, 1], label: '逻辑回归：sigmoid 曲线' });
    const gErr = p.layer('err', true);
    const gCurve = p.layer('curve', true);
    const gB = p.layer('boundary', true);
    const gPts = p.layer('pts');
    const gHover = p.layer('hover');
    K.caption(left, '点曲线上方 / 下方空白处，加一个 y=1 / y=0 的点；点已有的点可以翻转它的类别。');

    // 右边：sigmoid 本身 + 损失下降曲线
    const ps = K.plot(right, { x: [-8, 8], y: [0, 1], w: 300, h: 170, xlabel: 'z', yticks: [0, 0.5, 1], xticks: [-8, -4, 0, 4, 8], label: 'sigmoid 函数' });
    const gs = ps.layer('s', true);
    const curvePts = [];
    for (let z = -8; z <= 8; z += 0.2) curvePts.push([ps.sx(z), ps.sy(K.sigmoid(z))]);
    K.path(gs, curvePts, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
    const zDot = K.marker(ps.layer('dot'), 'circle', 0, 0, 6, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });
    const zText = K.text(ps.svg, ps.P.l + 6, ps.P.t + 14, '', { class: 'strong' });
    K.caption(right, 'σ(z) = 1 / (1 + e^(−z))：把任意实数压到 0～1');
    const pl = K.plot(right, { x: [0, 60], y: [0, 1.2], w: 300, h: 150, xlabel: '训练步数', ylabel: '对数损失', yticks: [0, 0.5, 1], xticks: [0, 20, 40, 60], label: '训练时的损失' });
    const gl = pl.layer('l', true);

    const ctl = K.row(root);
    const sw = K.slider(ctl, { label: '陡峭程度 w', min: -3, max: 3, step: 0.05, value: w, fmt: (v) => v.toFixed(2), onInput: (v) => { w = v; stop(); draw(); } });
    const sx0 = K.slider(ctl, { label: '分界点 x', min: 0, max: 10, step: 0.05, value: x0, fmt: (v) => v.toFixed(2), onInput: (v) => { x0 = v; stop(); draw(); } });
    const btns = K.row(root);
    const trainBtn = K.button(btns, '用梯度下降训练', () => (training ? stop() : train()), true);
    K.button(btns, '打乱参数', () => {
      stop();
      w = -0.8;
      x0 = 2;
      trace.length = 0;
      sw.set(w, true);
      sx0.set(x0, true);
      draw();
    });
    const stats = K.stats(root);
    const note = K.note(root, '');

    const bOf = () => -w * x0;
    const prob = (x) => K.sigmoid(w * x + bOf());
    const loss = () => K.mean(pts.map((q) => {
      const pr = K.clamp(prob(q.x), 1e-6, 1 - 1e-6);
      return -(q.y * Math.log(pr) + (1 - q.y) * Math.log(1 - pr));
    }));

    function draw() {
      K.clear(gCurve);
      K.clear(gErr);
      K.clear(gB);
      const c = [];
      for (let x = 0; x <= 10.001; x += 0.05) c.push([p.sx(x), p.sy(prob(x))]);
      K.path(gCurve, c, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      K.line(gB, p.sx(x0), p.sy(-0.08), p.sx(x0), p.sy(1.08), { class: 'soft', 'stroke-dasharray': '4 4' });
      K.line(gB, p.sx(0), p.sy(0.5), p.sx(10), p.sy(0.5), { class: 'soft', 'stroke-dasharray': '2 4' });
      pts.forEach((q) => {
        const pr = prob(q.x);
        const wrong = (pr >= 0.5 ? 1 : 0) !== q.y;
        K.line(gErr, p.sx(q.x), p.sy(q.y), p.sx(q.x), p.sy(pr), { stroke: wrong ? 'var(--bad)' : 'var(--muted)', 'stroke-width': wrong ? 2 : 1, 'stroke-opacity': wrong ? 0.9 : 0.45 });
      });
      K.drawPoints(gPts, p, pts.map((q) => ({ x: q.x, y: q.y, c: q.y ? 1 : 0 })), { r: 6, shapes: true });
      const acc = K.mean(pts.map((q) => ((prob(q.x) >= 0.5 ? 1 : 0) === q.y ? 1 : 0)));
      const L = loss();
      stats.set([
        ['模型', `z = ${w.toFixed(2)}x ${bOf() >= 0 ? '+' : '−'} ${Math.abs(bOf()).toFixed(2)}`],
        ['对数损失', L.toFixed(3), L < 0.4 ? 'good' : ''],
        ['准确率（阈值 0.5）', K.pct(acc)],
        ['分界点', `x = ${x0.toFixed(2)}`],
      ]);
      note.innerHTML = w < 0
        ? 'w 是负的：x 越大，P(y=1) 越小，方向反了，损失很大。'
        : '竖线是分界点（概率 = 0.5 的地方，也就是 z = 0）。每个点到曲线的竖线越长、越红，它贡献的<b>对数损失</b>越大；判错的点被重罚。训练就是调 w 和 b 让总损失最小。';
      drawTrace();
    }

    function drawTrace() {
      K.clear(gl);
      if (trace.length > 1) K.path(gl, trace.map((v, i) => [pl.sx(i), pl.sy(Math.min(v, 1.2))]), { stroke: 'var(--series-2)', 'stroke-width': 2 });
    }

    function step() {
      // 对 w、b 做一步梯度下降，再换算回分界点
      let b = bOf();
      let gw = 0;
      let gb = 0;
      pts.forEach((q) => {
        const e = K.sigmoid(w * q.x + b) - q.y;
        gw += e * q.x;
        gb += e;
      });
      w -= (0.12 * gw) / pts.length;
      b -= (0.6 * gb) / pts.length;
      if (Math.abs(w) > 1e-3) x0 = K.clamp(-b / w, 0, 10);
      w = K.clamp(w, -3, 3);
      sw.set(Math.round(w * 100) / 100, true);
      sx0.set(Math.round(x0 * 100) / 100, true);
      trace.push(loss());
      draw();
    }
    function train() {
      trace.length = 0;
      trace.push(loss());
      trainBtn.textContent = '暂停';
      training = K.loop(host, () => {
        step();
        if (trace.length > 60) {
          stop();
          return false;
        }
        return true;
      }, 90);
    }
    function stop() {
      if (training) training.stop();
      training = null;
      trainBtn.textContent = '用梯度下降训练';
    }

    // 悬停读概率
    p.svg.addEventListener('pointermove', (e) => {
      const d = p.toData(e);
      K.clear(gHover);
      if (!p.inside(d)) return;
      const pr = prob(d.x);
      K.marker(gHover, 'circle', p.sx(d.x), p.sy(pr), 5, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });
      K.text(gHover, Math.min(p.sx(d.x) + 8, p.W - 120), p.sy(pr) - 8, `x=${d.x.toFixed(1)}，P=${pr.toFixed(2)}`, { class: 'strong' });
      const z = w * d.x + bOf();
      zDot.setAttribute('cx', ps.sx(K.clamp(z, -8, 8)));
      zDot.setAttribute('cy', ps.sy(K.sigmoid(z)));
      zText.textContent = `z = ${z.toFixed(2)} → σ(z) = ${K.sigmoid(z).toFixed(2)}`;
    });
    p.svg.addEventListener('pointerleave', () => K.clear(gHover));
    p.svg.addEventListener('click', (e) => {
      const d = p.toData(e);
      if (!p.inside(d)) return;
      const near = pts.findIndex((q) => Math.abs(p.sx(q.x) - p.sx(d.x)) < 9 && Math.abs(p.sy(q.y) - p.sy(d.y)) < 12);
      if (near >= 0) pts[near].y = 1 - pts[near].y;
      else if (pts.length < 40) pts.push({ x: K.clamp(d.x, 0.1, 9.9), y: d.y > 0.5 ? 1 : 0 });
      stop();
      draw();
    });
    zDot.setAttribute('cx', ps.sx(0));
    zDot.setAttribute('cy', ps.sy(0.5));
    zText.textContent = '把鼠标移到左图上';
    draw();
  },
});
