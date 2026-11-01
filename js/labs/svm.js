// SVM：找间隔最大的那条线；只有支持向量决定边界。调 C 看软间隔，再看核技巧怎么把“分不开”的数据变得可分。
Labs.register('svm', {
  render(host, K) {
    const root = K.panel(host);
    const r = K.rng(23);
    const base = [];
    for (let i = 0; i < 11; i++) base.push({ x: -1.6 + K.gauss(r) * 0.6, y: -0.6 + K.gauss(r) * 0.6, c: 0 });
    for (let i = 0; i < 11; i++) base.push({ x: 1.4 + K.gauss(r) * 0.6, y: 0.9 + K.gauss(r) * 0.6, c: 1 });
    let pts = base.map((q) => ({ ...q }));

    const ctl = K.row(root);
    const Cs = [0.05, 0.2, 1, 5, 100];
    const cSl = K.slider(ctl, { label: '惩罚系数 C', min: 0, max: 4, step: 1, value: 3, fmt: (i) => String(Cs[i]), onInput: () => draw() });
    let draw = () => {};
    const ctl2 = K.row(root);
    K.button(ctl2, '加一个捣乱的点', () => { pts.push({ x: -1.0, y: -0.2, c: 1 }); renderPoints(); });
    K.button(ctl2, '重置', () => { pts = base.map((q) => ({ ...q })); renderPoints(); });
    const p = K.plot(root, { x: [-3.6, 3.6], y: [-3, 3.2], w: 600, h: 380, xlabels: false, ylabels: false, label: '线性 SVM 的分类边界和间隔' });
    const gM = p.layer('margin', true);
    const gSV = p.layer('sv', true);
    const gP = p.layer('pts', true);
    K.caption(root, '拖动点试试：动普通的点，边界不变；动带圈的支持向量，边界跟着动。');
    const stats = K.stats(root);
    const note = K.note(root, '');

    // 简化 SMO（线性核），点数少，几百轮内收敛
    function train(C) {
      const n = pts.length;
      const X = pts.map((q) => [q.x, q.y]);
      const Y = pts.map((q) => (q.c ? 1 : -1));
      const Kx = (i, j) => X[i][0] * X[j][0] + X[i][1] * X[j][1];
      const a = new Array(n).fill(0);
      let b = 0;
      const f = (i) => a.reduce((s, ai, j) => s + ai * Y[j] * Kx(j, i), 0) + b;
      const rr = K.rng(5);
      let passes = 0;
      let it = 0;
      while (passes < 8 && it < 3000) {
        it += 1;
        let changed = 0;
        for (let i = 0; i < n; i++) {
          const Ei = f(i) - Y[i];
          if ((Y[i] * Ei < -1e-3 && a[i] < C) || (Y[i] * Ei > 1e-3 && a[i] > 0)) {
            let j = Math.floor(rr() * (n - 1));
            if (j >= i) j += 1;
            const Ej = f(j) - Y[j];
            const ai = a[i];
            const aj = a[j];
            const L = Y[i] !== Y[j] ? Math.max(0, aj - ai) : Math.max(0, ai + aj - C);
            const H = Y[i] !== Y[j] ? Math.min(C, C + aj - ai) : Math.min(C, ai + aj);
            if (L >= H) continue;
            const eta = 2 * Kx(i, j) - Kx(i, i) - Kx(j, j);
            if (eta >= 0) continue;
            a[j] = K.clamp(aj - (Y[j] * (Ei - Ej)) / eta, L, H);
            if (Math.abs(a[j] - aj) < 1e-6) continue;
            a[i] = ai + Y[i] * Y[j] * (aj - a[j]);
            const b1 = b - Ei - Y[i] * (a[i] - ai) * Kx(i, i) - Y[j] * (a[j] - aj) * Kx(i, j);
            const b2 = b - Ej - Y[i] * (a[i] - ai) * Kx(i, j) - Y[j] * (a[j] - aj) * Kx(j, j);
            b = a[i] > 0 && a[i] < C ? b1 : a[j] > 0 && a[j] < C ? b2 : (b1 + b2) / 2;
            changed += 1;
          }
        }
        passes = changed ? 0 : passes + 1;
      }
      const w = [0, 0];
      a.forEach((ai, i) => { w[0] += ai * Y[i] * X[i][0]; w[1] += ai * Y[i] * X[i][1]; });
      return { w, b, a };
    }

    function lineAt(m, off) {
      // w·x + b = off
      const [w0, w1] = m.w;
      if (Math.abs(w1) > 1e-9) return [[-3.6, (off - m.b - w0 * -3.6) / w1], [3.6, (off - m.b - w0 * 3.6) / w1]];
      return [[(off - m.b) / w0, -3], [(off - m.b) / w0, 3.2]];
    }

    draw = function () {
      const C = Cs[cSl.value];
      const m = train(C);
      K.clear(gM);
      const norm = Math.hypot(m.w[0], m.w[1]) || 1e-9;
      const band = [lineAt(m, 1), lineAt(m, -1)];
      K.path(gM, [band[0][0], band[0][1], band[1][1], band[1][0]].map((q) => [p.sx(q[0]), p.sy(q[1])]).concat([[p.sx(band[0][0][0]), p.sy(band[0][0][1])]]), { fill: 'var(--series-4)', 'fill-opacity': 0.13, stroke: 'none' });
      band.forEach((l) => K.line(gM, p.sx(l[0][0]), p.sy(l[0][1]), p.sx(l[1][0]), p.sy(l[1][1]), { class: 'soft', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 }));
      const mid = lineAt(m, 0);
      K.line(gM, p.sx(mid[0][0]), p.sy(mid[0][1]), p.sx(mid[1][0]), p.sy(mid[1][1]), { stroke: 'var(--text)', 'stroke-width': 2.5 });
      const sv = m.a.map((ai, i) => (ai > 1e-5 ? i : -1)).filter((i) => i >= 0);
      K.clear(gSV);
      sv.forEach((i) => K.s('circle', { cx: p.sx(pts[i].x), cy: p.sy(pts[i].y), r: 11, fill: 'none', stroke: 'var(--text)', 'stroke-width': 1.8 }, gSV));
      const wrong = pts.filter((q) => (m.w[0] * q.x + m.w[1] * q.y + m.b >= 0 ? 1 : 0) !== q.c).length;
      stats.set([['间隔宽度 2/‖w‖', (2 / norm).toFixed(2)], ['支持向量个数', String(sv.length)], ['训练集判错', String(wrong)]]);
      note.innerHTML = C <= 0.2
        ? '<b>C 很小</b>：允许一些点进到间隔里、甚至判错，换来更宽的间隔——更“宽容”、更不容易过拟合。'
        : C >= 100
          ? '<b>C 很大</b>：几乎不允许犯错，间隔会为了照顾个别点（比如那个捣乱的点）变得很窄——容易过拟合。'
          : '黑线是分类边界，黄色带是间隔。SVM 要找<b>间隔最大</b>的那条线；带圈的点是<b>支持向量</b>，只有它们决定边界，其余点挪动不影响结果。C 控制“犯错的代价”。';
    }
    // 点只画一次；拖动时只移动位置，避免把正在拖的元素删掉
    function renderPoints() {
      K.clear(gP);
      pts.forEach((q, i) => {
        const g = K.s('g', { transform: `translate(${p.sx(q.x)},${p.sy(q.y)})` }, gP);
        K.marker(g, q.c ? 'square' : 'circle', 0, 0, 6, { fill: K.color(q.c), stroke: 'var(--surface)', 'stroke-width': 1.5, class: 'pt' });
        K.drag(g, p, (d) => {
          q.x = K.clamp(d.x, -3.5, 3.5);
          q.y = K.clamp(d.y, -2.9, 3.1);
          g.setAttribute('transform', `translate(${p.sx(q.x)},${p.sy(q.y)})`);
          draw();
        });
        void i;
      });
      draw();
    }
    renderPoints();

    // ---------- 核技巧 ----------
    K.h('<h3 class="sub-h">核技巧：一维分不开，升到二维就能用一条直线分开</h3>', root);
    const r2 = K.rng(41);
    const one = [];
    for (let i = 0; i < 9; i++) one.push({ x: -0.9 + r2() * 1.8, c: 0 });
    for (let i = 0; i < 6; i++) one.push({ x: 1.6 + r2() * 1.1, c: 1 });
    for (let i = 0; i < 6; i++) one.push({ x: -2.7 + r2() * 1.1, c: 1 });
    let lifted = 0;
    const pk = K.plot(root, { x: [-3, 3], y: [-0.6, 8], w: 600, h: 300, xlabel: 'x', ylabel: 'x²', yticks: [0, 2, 4, 6, 8], label: '把一维数据映射到二维' });
    const gk = pk.layer('k', true);
    const ck = K.row(root);
    K.button(ck, '映射 x → (x, x²)', () => animate(1), true);
    K.button(ck, '放回一维', () => animate(0));
    function drawK() {
      K.clear(gk);
      K.drawPoints(gk, pk, one.map((q) => ({ x: q.x, y: lifted * q.x * q.x, c: q.c })), { r: 6, shapes: true });
      if (lifted > 0.98) K.line(gk, pk.sx(-3), pk.sy(1.9), pk.sx(3), pk.sy(1.9), { stroke: 'var(--text)', 'stroke-width': 2.5, 'stroke-dasharray': '6 3' });
    }
    function animate(to) {
      const from = lifted;
      let s = 0;
      K.loop(host, () => {
        s += 1;
        lifted = from + ((to - from) * s) / 20;
        drawK();
        return s < 20;
      }, 30);
    }
    drawK();
    K.note(root, '在一维上，橙色点在两头、蓝色点在中间，切一刀分不开。把每个点映射成 (x, x²) 后，橙色点被抬高，一条横线就能分开。核函数（如 RBF）做的就是这件事，而且<b>不用真的算出高维坐标</b>，只算两两之间的核函数值。', '');
  },
});
