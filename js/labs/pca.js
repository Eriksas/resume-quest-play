// PCA：转动一条方向线，看所有点投影上去后有多分散；方差最大的方向就是第一主成分。再看降到一维。
Labs.register('pca', {
  render(host, K) {
    const root = K.panel(host);
    const r = K.rng(26);
    const pts = Array.from({ length: 50 }, () => {
      const a = K.gauss(r) * 1.4;
      const b = K.gauss(r) * 0.45;
      return { x: a * 0.85 - b * 0.53, y: a * 0.53 + b * 0.85 };
    });
    const pc = K.ml.pca2(pts);
    const bestAng = (Math.atan2(pc.v1[1], pc.v1[0]) * 180) / Math.PI;
    let collapse = 0;

    const ctl = K.row(root);
    const ang = K.slider(ctl, { label: '方向角度', min: -90, max: 90, step: 1, value: -30, fmt: (v) => v + '°', onInput: () => draw() });
    const btns = K.row(root);
    K.button(btns, '找到方差最大的方向', () => ang.set(Math.round(((bestAng + 90) % 180) - 90)), true);
    K.button(btns, '降到一维（投影上去）', () => animate(1));
    K.button(btns, '还原', () => animate(0));
    const p = K.plot(root, { x: [-4, 4], y: [-3, 3], w: 600, h: 420, xlabel: '特征 1（已标准化）', ylabel: '特征 2', label: 'PCA 投影' });
    const gL = p.layer('line', true);
    const gProj = p.layer('proj', true);
    const gP = p.layer('pts', true);
    const stats = K.stats(root);
    const note = K.note(root, '');

    function draw() {
      const t = (ang.value * Math.PI) / 180;
      const u = [Math.cos(t), Math.sin(t)];
      K.clear(gL);
      K.line(gL, p.sx(pc.mx - u[0] * 6), p.sy(pc.my - u[1] * 6), p.sx(pc.mx + u[0] * 6), p.sy(pc.my + u[1] * 6), { stroke: 'var(--series-2)', 'stroke-width': 2.5 });
      K.clear(gProj);
      const proj = pts.map((q) => (q.x - pc.mx) * u[0] + (q.y - pc.my) * u[1]);
      const shown = pts.map((q, i) => {
        const tx = pc.mx + proj[i] * u[0];
        const ty = pc.my + proj[i] * u[1];
        if (collapse < 0.99) K.line(gProj, p.sx(q.x), p.sy(q.y), p.sx(tx), p.sy(ty), { class: 'soft', 'stroke-dasharray': '2 3' });
        K.marker(gProj, 'circle', p.sx(tx), p.sy(ty), 3, { fill: 'var(--series-2)' });
        return { x: q.x + (tx - q.x) * collapse, y: q.y + (ty - q.y) * collapse, c: 0 };
      });
      K.drawPoints(gP, p, shown, { r: 4.5 });
      const varHere = K.mean(proj.map((v) => v * v));
      const total = pc.l1 + pc.l2;
      stats.set([
        ['投影后的方差', varHere.toFixed(2)],
        ['最大可能（第一主成分）', pc.l1.toFixed(2)],
        ['第一主成分解释的方差', K.pct(pc.l1 / total, 0), 'good'],
      ]);
      const close = varHere > pc.l1 * 0.995;
      note.className = 'lab-note ' + (close ? 'good' : '');
      note.innerHTML = close
        ? `找到了：这个方向上点最分散，投影后保留的信息最多，这就是<b>第一主成分</b>。它一个方向就解释了 ${K.pct(pc.l1 / total, 0)} 的方差，所以把二维压成一维，丢的信息不多。`
        : '橙色线是一个候选方向，虚线是每个点投影到线上的过程。PCA 要找让<b>投影后的方差最大</b>（也等价于投影距离的平方和最小）的方向。转动角度，看方差怎么变。';
    }
    function animate(to) {
      const from = collapse;
      let s = 0;
      K.loop(host, () => {
        s += 1;
        collapse = from + ((to - from) * s) / 18;
        draw();
        return s < 18;
      }, 30);
    }
    draw();
    K.note(root, '做法：先标准化（不然量纲大的特征会主导），算协方差矩阵，取最大的几个特征值对应的特征向量作为新坐标轴。新的几个主成分互相不相关。<b>PCA 不看标签 y</b>，是无监督的。', '');
  },
});
