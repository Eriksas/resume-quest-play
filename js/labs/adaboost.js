// AdaBoost：每一轮训练一个只切一刀的“树桩”，分错的点权重变大（点变大），下一轮更关注它们；最后加权投票。
Labs.register('adaboost', {
  render(host, K) {
    const root = K.panel(host);
    const r = K.rng(15);
    const pts = [];
    for (let i = 0; i < 36; i++) {
      const x = r() * 2 - 1;
      const y = r() * 2 - 1;
      pts.push({ f: [x, y], y: x * x + y * y < 0.42 ? 1 : 0 });
    }
    let w = pts.map(() => 1 / pts.length);
    let learners = [];

    const btns = K.row(root);
    K.button(btns, '下一轮', () => { round(); draw(); }, true);
    K.button(btns, '再跑 10 轮', () => { for (let i = 0; i < 10; i++) round(); draw(); });
    K.button(btns, '重来', () => { w = pts.map(() => 1 / pts.length); learners = []; draw(); });
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const p = K.plot(left, { x: [-1.05, 1.05], y: [-1.05, 1.05], w: 380, h: 340, axes: false, label: '这一轮的树桩和样本权重' });
    const gS = p.layer('stump', true);
    const gP = p.layer('pts', true);
    K.caption(left, '这一轮：虚线是新树桩，点越大 = 权重越大');
    const p2 = K.plot(right, { x: [-1.05, 1.05], y: [-1.05, 1.05], w: 380, h: 340, axes: false, label: '所有树桩加权投票后的结果' });
    const reg = K.regions(p2.layer('reg', true), p2, 40, 36);
    const gP2 = p2.layer('pts', true);
    K.caption(right, '目前为止所有树桩加权投票的结果');
    const stats = K.stats(root);
    const note = K.note(root, '');

    function bestStump() {
      let best = null;
      [0, 1].forEach((j) => {
        const vals = [...new Set(pts.map((q) => q.f[j]))].sort((a, b) => a - b);
        for (let k = 0; k < vals.length - 1; k++) {
          const t = (vals[k] + vals[k + 1]) / 2;
          [1, -1].forEach((sgn) => {
            let err = 0;
            pts.forEach((q, i) => {
              const pred = (q.f[j] > t ? 1 : 0) ^ (sgn < 0 ? 1 : 0);
              if (pred !== q.y) err += w[i];
            });
            if (!best || err < best.err) best = { j, t, sgn, err };
          });
        }
      });
      return best;
    }
    const stumpPred = (s, f) => ((f[s.j] > s.t ? 1 : 0) ^ (s.sgn < 0 ? 1 : 0));
    function round() {
      const s = bestStump();
      const err = Math.max(s.err, 1e-6);
      s.alpha = 0.5 * Math.log((1 - err) / err);
      pts.forEach((q, i) => {
        const ok = stumpPred(s, q.f) === q.y;
        w[i] *= Math.exp(ok ? -s.alpha : s.alpha);
      });
      const tot = w.reduce((a, b) => a + b, 0);
      w = w.map((v) => v / tot);
      learners.push(s);
    }
    const ensemble = (f) => learners.reduce((s, l) => s + l.alpha * (stumpPred(l, f) ? 1 : -1), 0);

    function draw() {
      K.clear(gS);
      const last = learners[learners.length - 1];
      if (last) {
        if (last.j === 0) K.line(gS, p.sx(last.t), p.P.t, p.sx(last.t), p.H - p.P.b, { stroke: 'var(--text)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' });
        else K.line(gS, p.P.l, p.sy(last.t), p.W - p.P.r, p.sy(last.t), { stroke: 'var(--text)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' });
      }
      const maxW = Math.max(...w);
      K.drawPoints(gP, p, pts.map((q, i) => ({ x: q.f[0], y: q.f[1], c: q.y, w: w[i] })), { shapes: true, size: (d) => 2.5 + 9 * Math.sqrt(d.w / maxW) });
      if (learners.length) reg.paint((x, y) => { const s = ensemble([x, y]); return { c: s > 0 ? 1 : 0, a: 0.18 }; });
      else reg.paint(() => null);
      K.drawPoints(gP2, p2, pts.map((q) => ({ x: q.f[0], y: q.f[1], c: q.y })), { r: 4, shapes: true });
      const acc = learners.length ? K.mean(pts.map((q) => ((ensemble(q.f) > 0 ? 1 : 0) === q.y ? 1 : 0))) : NaN;
      stats.set([
        ['轮数', String(learners.length)],
        ['这一轮树桩的加权错误率', last ? last.err.toFixed(3) : '—'],
        ['这一轮树桩的话语权 α', last ? last.alpha.toFixed(2) : '—'],
        ['组合后训练准确率', learners.length ? K.pct(acc) : '—'],
      ]);
      note.innerHTML = learners.length
        ? '每轮：① 在当前权重下找错误率最低的树桩；② 错误率越低，它的话语权 α 越大；③ <b>分错的点权重变大、分对的变小</b>，下一轮的树桩就会去照顾这些难分的点。一根树桩只能横切或竖切一刀，几十根加权组合起来就能圈出圆形。'
        : '一开始所有点权重一样。点“下一轮”训练第一根树桩。';
    }
    draw();
  },
});
