// 正则化：在系数平面上，损失的等高线（椭圆）碰到约束区域（L1 菱形 / L2 圆）的那一点就是解。L1 容易碰在坐标轴上 → 系数正好为 0。
Labs.register('regular', {
  render(host, K) {
    const root = K.panel(host);
    const ws = [2.0, 0.7]; // 不加正则时的最优系数
    const A = [[1.0, 0.45], [0.45, 0.7]];
    const loss = (w) => {
      const d0 = w[0] - ws[0];
      const d1 = w[1] - ws[1];
      return A[0][0] * d0 * d0 + 2 * A[0][1] * d0 * d1 + A[1][1] * d1 * d1;
    };
    // A 的特征分解，用来画椭圆
    const tr = A[0][0] + A[1][1];
    const det = A[0][0] * A[1][1] - A[0][1] ** 2;
    const l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det);
    const l2 = tr - l1;
    let v1 = [l1 - A[1][1], A[0][1]];
    const nv = Math.hypot(...v1);
    v1 = [v1[0] / nv, v1[1] / nv];
    const v2 = [-v1[1], v1[0]];

    const ctl = K.row(root);
    const kind = K.seg(ctl, [{ value: 'l1', label: 'L1（Lasso）：菱形' }, { value: 'l2', label: 'L2（Ridge）：圆' }], 'l1', () => draw());
    const ctl2 = K.row(root);
    const t = K.slider(ctl2, { label: '约束大小 t（越小 = 正则越强）', min: 0.2, max: 3, step: 0.05, value: 1.2, fmt: (v) => v.toFixed(2), onInput: () => draw() });
    const p = K.plot(root, { x: [-1.4, 3.2], y: [-1.4, 2.2], w: 560, h: 440, xlabel: '系数 w₁', ylabel: '系数 w₂', label: '正则化的几何解释' });
    const gC = p.layer('contours', true);
    const gR = p.layer('region', true);
    const gS = p.layer('sol', true);
    const stats = K.stats(root);
    const note = K.note(root, '');
    K.line(p.layer('axes0', true), p.sx(-1.4), p.sy(0), p.sx(3.2), p.sy(0), { class: 'soft' });
    K.line(p.layer('axes1', true), p.sx(0), p.sy(-1.4), p.sx(0), p.sy(2.2), { class: 'soft' });

    const ellipse = (c) => {
      const out = [];
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
        const u = Math.cos(a) * Math.sqrt(c / l1);
        const v = Math.sin(a) * Math.sqrt(c / l2);
        out.push([p.sx(ws[0] + u * v1[0] + v * v2[0]), p.sy(ws[1] + u * v1[1] + v * v2[1])]);
      }
      return out;
    };

    function solve() {
      const T = t.value;
      const inside = kind.value === 'l1' ? Math.abs(ws[0]) + Math.abs(ws[1]) <= T : Math.hypot(ws[0], ws[1]) <= T;
      if (inside) return ws.slice();
      let best = null;
      for (let i = 0; i < 4000; i++) {
        const a = (i / 4000) * Math.PI * 2;
        let w;
        if (kind.value === 'l2') w = [T * Math.cos(a), T * Math.sin(a)];
        else {
          const c = Math.cos(a);
          const s = Math.sin(a);
          const k = T / (Math.abs(c) + Math.abs(s));
          w = [k * c, k * s];
        }
        const L = loss(w);
        if (!best || L < best.L) best = { w, L };
      }
      return best.w;
    }

    function draw() {
      const w = solve();
      const L = loss(w);
      K.clear(gC);
      [0.15, 0.6, 1.4, 2.6].forEach((c) => K.path(gC, ellipse(c), { class: 'soft', 'stroke-width': 1 }));
      if (L > 1e-6) K.path(gC, ellipse(L), { stroke: 'var(--series-2)', 'stroke-width': 2.5 });
      K.marker(gC, 'cross', p.sx(ws[0]), p.sy(ws[1]), 6, { stroke: 'var(--text)' });
      K.text(gC, p.sx(ws[0]) + 8, p.sy(ws[1]) - 8, '不加正则的最优解', { 'font-size': 11 });
      K.clear(gR);
      const T = t.value;
      const shape = kind.value === 'l1'
        ? [[T, 0], [0, T], [-T, 0], [0, -T], [T, 0]]
        : Array.from({ length: 121 }, (_, i) => [T * Math.cos((i / 120) * Math.PI * 2), T * Math.sin((i / 120) * Math.PI * 2)]);
      K.path(gR, shape.map((q) => [p.sx(q[0]), p.sy(q[1])]), { fill: 'var(--series-1)', 'fill-opacity': 0.14, stroke: 'var(--series-1)', 'stroke-width': 2 });
      K.clear(gS);
      K.marker(gS, 'circle', p.sx(w[0]), p.sy(w[1]), 7, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });
      const zero = Math.abs(w[1]) < 0.02 || Math.abs(w[0]) < 0.02;
      stats.set([
        ['w₁', w[0].toFixed(2)],
        ['w₂', Math.abs(w[1]) < 0.02 ? '0（被删掉）' : w[1].toFixed(2), Math.abs(w[1]) < 0.02 ? 'good' : ''],
        ['离最优多出的损失', L.toFixed(3)],
      ]);
      note.className = 'lab-note ' + (zero && kind.value === 'l1' ? 'good' : '');
      if (L < 1e-6) note.innerHTML = '约束很宽，最优解本来就在区域里面，正则不起作用。把 t 调小试试。';
      else if (kind.value === 'l1') note.innerHTML = zero
        ? '橙色等高线第一次碰到菱形，碰在了<b>菱形的角上</b>——角都在坐标轴上，所以 w₂ 正好等于 0。这就是 L1 能做<b>特征选择</b>（产生稀疏解）的原因。'
        : '等高线碰到的是菱形的边，两个系数都不为 0；继续把 t 调小，解会滑到角上。';
      else note.innerHTML = 'L2 的约束是圆，没有角，等高线一般碰在圆的某个光滑位置：两个系数都被<b>等比例往 0 压小</b>，但很少正好变成 0。L2 适合处理共线性、让模型更稳。';
    }
    draw();
    K.note(root, '把它和损失函数对应起来：L1 正则 = 损失 + λ·Σ|w|，L2 正则 = 损失 + λ·Σw²。λ 越大，等价于这里的 t 越小。', '');
  },
});
