// K-means：一步步看“分配 → 更新中心”，比较随机初始化和 k-means++，再用肘部法选 K。
Labs.register('kmeans', {
  render(host, K) {
    const root = K.panel(host);
    const sets = {
      blobs: () => K.data.blobs(K.rng(3), [[-2, 2], [2, 2.2], [0, -1.8], [2.6, -1.2]], 30, 0.55),
      moons: () => K.data.moons(K.rng(4), 140, 0.08).map((q) => ({ x: q.x * 2.4 - 1.2, y: q.y * 2.6 - 0.6 })),
      uneven: () => K.data.blobs(K.rng(5), [[-1.8, 0.2, 1.1], [1.9, 1.8, 0.3], [2.1, -1.7, 0.3]], 40, 0.4),
    };
    let data = sets.blobs();
    let cs = [];
    let lab = null;
    let phase = 'assign';
    let iter = 0;
    let done = false;
    let trails = [];
    let playing = null;
    let seed = 1;

    const ctl = K.row(root);
    const ds = K.seg(ctl, [{ value: 'blobs', label: '四个圆团' }, { value: 'moons', label: '两个月牙' }, { value: 'uneven', label: '大小不一' }], 'blobs', (v) => {
      data = sets[v]();
      restart();
      elbow();
    });
    const init = K.seg(ctl, [{ value: 'random', label: '随机选初始中心' }, { value: 'plus', label: 'k-means++' }], 'random', () => restart());
    const ctl2 = K.row(root);
    const kSl = K.slider(ctl2, { label: '簇数 K', min: 1, max: 6, step: 1, value: 4, onInput: () => { restart(); elbow(); } });
    const btns = K.row(root);
    const stepBtn = K.button(btns, '下一步：分配', () => step(), true);
    const playBtn = K.button(btns, '自动播放', () => (playing ? pause() : play()));
    K.button(btns, '换个初始中心', () => { seed += 1; restart(); });

    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const p = K.plot(left, { x: [-4, 4.5], y: [-3.6, 4], w: 460, h: 380, axes: true, xlabels: false, ylabels: false, grid: false, label: 'K-means 聚类过程' });
    const gLines = p.layer('lines', true);
    const gTrail = p.layer('trail', true);
    const gPts = p.layer('pts', true);
    const gC = p.layer('cent');
    const stats = K.stats(left);

    const pe = K.plot(right, { x: [1, 6], y: [0, 1], w: 320, h: 220, xlabel: 'K', ylabel: '惯性（簇内平方和）', xticks: [1, 2, 3, 4, 5, 6], ylabels: false, label: '肘部法' });
    const ge = pe.layer('e');
    K.caption(right, '肘部法：K 每加 1，惯性都会下降；下降突然变缓的“拐点”就是比较合适的 K。');
    const note = K.note(root, '');

    function restart() {
      pause();
      const r = K.rng(seed * 31 + kSl.value);
      cs = K.ml.kmeansInit(data, kSl.value, init.value, r);
      trails = cs.map((c) => [{ x: c.x, y: c.y }]);
      lab = null;
      phase = 'assign';
      iter = 0;
      done = false;
      K.clear(gLines);
      draw();
    }

    function step() {
      if (done) return;
      if (phase === 'assign') {
        const nl = K.ml.assign(data, cs);
        if (lab && nl.every((v, i) => v === lab[i])) {
          done = true;
          pause();
        }
        lab = nl;
        K.clear(gLines);
        if (!done) data.forEach((q, i) => K.line(gLines, p.sx(q.x), p.sy(q.y), p.sx(cs[lab[i]].x), p.sy(cs[lab[i]].y), { stroke: K.color(lab[i]), 'stroke-opacity': 0.35, 'stroke-width': 1 }));
        phase = 'update';
        iter += 1;
      } else {
        K.clear(gLines);
        cs = K.ml.update(data, lab, cs);
        cs.forEach((c, i) => trails[i].push({ x: c.x, y: c.y }));
        phase = 'assign';
      }
      draw();
    }

    function draw() {
      K.drawPoints(gPts, p, data.map((q, i) => ({ x: q.x, y: q.y, c: lab ? lab[i] : -1 })), { r: 4.5, shapes: true });
      K.clear(gTrail);
      trails.forEach((t, i) => {
        if (t.length > 1) K.path(gTrail, t.map((q) => [p.sx(q.x), p.sy(q.y)]), { stroke: K.color(i), 'stroke-width': 2, 'stroke-dasharray': '4 3' });
      });
      K.clear(gC);
      cs.forEach((c, i) => {
        K.marker(gC, 'diamond', p.sx(c.x), p.sy(c.y), 10, { fill: K.color(i), stroke: 'var(--text)', 'stroke-width': 2 });
      });
      const inertia = lab ? K.ml.inertia(data, lab, cs) : NaN;
      stats.set([
        ['轮次', String(iter)],
        ['下一步', done ? '已收敛' : phase === 'assign' ? '分配' : '更新中心'],
        ['惯性', lab ? inertia.toFixed(1) : '—', done ? 'good' : ''],
      ]);
      stepBtn.textContent = done ? '已收敛' : phase === 'assign' ? '下一步：分配' : '下一步：更新中心';
      stepBtn.disabled = done;
      const which = ds.value;
      if (!lab) note.innerHTML = '菱形是初始中心。<b>分配</b>：每个点归到离它最近的中心；<b>更新</b>：每个中心挪到它那一簇的平均位置。两步交替，直到分配不再变化。';
      else if (done && which === 'moons') note.innerHTML = '收敛了，但月牙被横着切开了：K-means 按“离哪个中心近”分，切出来的簇是凸的块，弯曲的形状它分不对——这时换 DBSCAN。';
      else if (done && which === 'uneven') note.innerHTML = '收敛了。K-means 喜欢大小差不多的圆团：大团常被切成几块，或者小团被并进大团。';
      else if (done) note.innerHTML = '收敛了：再分配，没有一个点换簇。结果依赖初始中心，可以点“换个初始中心”多试几次，惯性越小越好；k-means++ 让初始中心彼此离得远，通常更稳。';
      else note.innerHTML = '虚线是中心走过的路。每一轮惯性（所有点到自己中心的距离平方和）都只会变小或不变，所以一定会收敛——但可能停在局部最优。';
      note.className = 'lab-note ' + (done && which !== 'blobs' ? 'warn' : '');
    }

    function play() {
      playBtn.textContent = '暂停';
      playing = K.loop(host, () => {
        if (done) { pause(); return false; }
        step();
        return true;
      }, 650);
    }
    function pause() {
      if (playing) playing.stop();
      playing = null;
      playBtn.textContent = '自动播放';
    }

    function elbow() {
      K.clear(ge);
      const vals = [1, 2, 3, 4, 5, 6].map((k) => K.ml.kmeans(data, k, K.rng(100 + k), 'plus', 4).inertia);
      const top = vals[0] || 1;
      const ptsE = vals.map((v, i) => [pe.sx(i + 1), pe.sy(v / top)]);
      K.path(ge, ptsE, { stroke: 'var(--series-1)', 'stroke-width': 2 });
      ptsE.forEach((q, i) => K.marker(ge, 'circle', q[0], q[1], i + 1 === kSl.value ? 7 : 4, { fill: i + 1 === kSl.value ? 'var(--series-2)' : 'var(--series-1)', stroke: 'var(--surface)', 'stroke-width': 2 }));
    }

    restart();
    elbow();
  },
});
