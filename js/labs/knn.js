// KNN：点一下放一个新样本，看离它最近的 K 个邻居怎么投票；再看 K 的大小和“不标准化”对决策区域的影响。
Labs.register('knn', {
  render(host, K) {
    const root = K.panel(host);
    const data = K.data.blobs(K.rng(14), [[-1.3, 1.0], [1.4, 1.2], [0.1, -1.3]], 18, 0.75).map((q) => ({ x: q.x, y: q.y, c: q.t }));
    let query = { x: 0.2, y: 0.3 };

    const ctl = K.row(root);
    const kSl = K.slider(ctl, { label: '邻居数 K', min: 1, max: 25, step: 2, value: 5, onInput: () => draw(true) });
    const ctl2 = K.row(root);
    const showReg = K.check(ctl2, '显示决策区域', true, () => draw(true));
    const unscaled = K.check(ctl2, '不做标准化（横轴单位放大 10 倍）', false, () => draw(true));
    const p = K.plot(root, { x: [-3.5, 3.5], y: [-3.2, 3.4], w: 600, h: 400, xlabels: false, ylabels: false, label: 'KNN 分类' });
    const reg = K.regions(p.layer('reg', true), p, 60, 40);
    const gL = p.layer('lines', true);
    const gP = p.layer('pts', true);
    const gQ = p.layer('q', true);
    K.caption(root, '点图上任意位置，把新样本（星形）放过去。');
    const stats = K.stats(root);
    const note = K.note(root, '');

    const dist = (a, b) => {
      const sx = unscaled.value ? 10 : 1;
      return Math.hypot((a.x - b.x) * sx, a.y - b.y);
    };
    const vote = (q, k) => {
      const nn = data.map((d) => ({ d, dist: dist(q, d) })).sort((a, b) => a.dist - b.dist).slice(0, k);
      const cnt = [0, 0, 0];
      nn.forEach((n) => (cnt[n.d.c] += 1));
      const best = cnt.indexOf(Math.max(...cnt));
      return { nn, cnt, best };
    };

    function draw(repaint) {
      const k = kSl.value;
      if (repaint) {
        if (showReg.value) reg.paint((x, y) => {
          const v = vote({ x, y }, k);
          return { c: v.best, a: 0.1 + 0.12 * (v.cnt[v.best] / k) };
        });
        else reg.paint(() => null);
      }
      K.drawPoints(gP, p, data, { r: 5, shapes: true });
      const v = vote(query, k);
      K.clear(gL);
      v.nn.forEach((n) => K.line(gL, p.sx(query.x), p.sy(query.y), p.sx(n.d.x), p.sy(n.d.y), { stroke: K.color(n.d.c), 'stroke-width': 1.8, 'stroke-opacity': 0.8 }));
      if (!unscaled.value) {
        const rad = v.nn[v.nn.length - 1].dist;
        K.s('ellipse', { cx: p.sx(query.x), cy: p.sy(query.y), rx: p.sx(query.x + rad) - p.sx(query.x), ry: p.sy(query.y) - p.sy(query.y + rad), fill: 'none', stroke: 'var(--muted)', 'stroke-dasharray': '4 4' }, gL);
      }
      K.clear(gQ);
      const sx = p.sx(query.x);
      const sy = p.sy(query.y);
      const star = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? 5 : 12;
        star.push([sx + rr * Math.cos(a), sy + rr * Math.sin(a)]);
      }
      K.path(gQ, star.concat([star[0]]), { fill: K.color(v.best), stroke: 'var(--text)', 'stroke-width': 1.5 });
      stats.set([
        ['K', String(k)],
        ['投票（蓝 / 橙 / 青）', v.cnt.join(' / ')],
        ['预测类别', ['蓝', '橙', '青'][v.best]],
      ]);
      if (unscaled.value) note.innerHTML = '横轴的单位放大 10 倍后，距离几乎只由横轴决定：邻居都是“左右挨着”的点，纵轴的信息被淹没了。所以 KNN、K-means、SVM 这类靠距离的方法，<b>用之前要先标准化</b>。';
      else if (k === 1) note.innerHTML = 'K = 1：只听最近那一个点的，决策区域碎成一块一块，对噪声很敏感——<b>过拟合</b>。';
      else if (k >= 19) note.innerHTML = 'K 很大：远处的点也来投票，边界被抹平，小的类会被多数类吃掉——<b>欠拟合</b>。一般用交叉验证选 K，取奇数可以避免两类打平。';
      else note.innerHTML = 'KNN 没有训练过程：来一个新样本，算它到所有训练样本的距离，找最近的 K 个，少数服从多数。简单，但预测时要算一遍所有距离，数据大时慢。';
    }

    p.svg.addEventListener('click', (e) => {
      const d = p.toData(e);
      if (!p.inside(d)) return;
      query = { x: d.x, y: d.y };
      draw(false);
    });
    draw(true);
  },
});
