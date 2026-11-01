// DBSCAN：按密度聚类。调 eps（半径）和 minPts（最少邻居数），看核心点、边界点、噪声点，以及簇是怎么一圈圈扩出来的。
Labs.register('dbscan', {
  render(host, K) {
    const root = K.panel(host);
    const sets = {
      moons: () => {
        const m = K.data.moons(K.rng(6), 240, 0.05).map((q) => ({ x: q.x * 2.2 - 1.1, y: q.y * 2.4 - 0.6 }));
        const r = K.rng(60);
        for (let i = 0; i < 12; i++) m.push({ x: -3.2 + r() * 6.6, y: -2.6 + r() * 5.4 });
        return m;
      },
      blobs: () => {
        const b = K.data.blobs(K.rng(7), [[-1.8, 1.2, 0.35], [1.6, 1.4, 0.6], [0.2, -1.4, 0.45]], 40, 0.4);
        const r = K.rng(70);
        for (let i = 0; i < 12; i++) b.push({ x: -3.2 + r() * 6.6, y: -2.6 + r() * 5.4 });
        return b;
      },
    };
    let data = sets.moons();
    let res = null;
    let picked = null;
    let anim = null;

    const ctl = K.row(root);
    K.seg(ctl, [{ value: 'moons', label: '月牙 + 噪声' }, { value: 'blobs', label: '圆团 + 噪声' }], 'moons', (v) => { data = sets[v](); picked = null; run(); });
    const ctl2 = K.row(root);
    const eps = K.slider(ctl2, { label: '半径 eps', min: 0.1, max: 0.8, step: 0.02, value: 0.36, fmt: (v) => v.toFixed(2), onInput: () => run() });
    const mp = K.slider(ctl2, { label: '最少邻居 minPts', min: 2, max: 12, step: 1, value: 5, onInput: () => run() });
    const btns = K.row(root);
    K.button(btns, '播放：簇怎么扩出来', () => play(), true);
    const p = K.plot(root, { x: [-3.4, 3.6], y: [-2.8, 3], w: 600, h: 400, xlabels: false, ylabels: false, label: 'DBSCAN 聚类结果' });
    const gC = p.layer('circle', true);
    const gP = p.layer('pts', true);
    K.legend(root, [['实心 = 核心点', 0], ['空心 = 边界点', 0], ['灰色叉 = 噪声', -1]]);
    K.caption(root, '点任意一个点，看它的 eps 邻域里有几个邻居。');
    const stats = K.stats(root);
    const note = K.note(root, '');

    function run() {
      if (anim) anim.stop();
      res = K.ml.dbscan(data, eps.value, mp.value);
      draw(null);
    }
    function draw(visible) {
      K.clear(gP);
      data.forEach((q, i) => {
        const shown = !visible || visible.has(i);
        const c = res.lab[i];
        const px = p.sx(q.x);
        const py = p.sy(q.y);
        if (c < 0 || !shown) {
          K.marker(gP, 'cross', px, py, 3.5, { stroke: 'var(--muted)', opacity: shown ? 0.8 : 0.35 });
          return;
        }
        K.marker(gP, K.SHAPES[c % 6], px, py, 5, res.core[i]
          ? { fill: K.color(c), stroke: 'var(--surface)', 'stroke-width': 1.2 }
          : { fill: 'var(--surface)', stroke: K.color(c), 'stroke-width': 2 });
      });
      K.clear(gC);
      if (picked != null) {
        const q = data[picked];
        const rx = p.sx(q.x + eps.value) - p.sx(q.x);
        const ry = p.sy(q.y) - p.sy(q.y + eps.value);
        K.s('ellipse', { cx: p.sx(q.x), cy: p.sy(q.y), rx, ry, fill: 'var(--series-4)', 'fill-opacity': 0.12, stroke: 'var(--series-4)', 'stroke-width': 2 }, gC);
        res.nb[picked].forEach((j) => K.line(gC, p.sx(q.x), p.sy(q.y), p.sx(data[j].x), p.sy(data[j].y), { class: 'soft' }));
      }
      const noise = res.lab.filter((v) => v < 0).length;
      stats.set([['簇数', String(res.clusters)], ['噪声点', String(noise)], ['核心点', String(res.core.filter(Boolean).length)]]);
      if (picked != null) {
        const n = res.nb[picked].length;
        note.innerHTML = `这个点的 eps 邻域里有 <b>${n}</b> 个点（含自己），minPts = ${mp.value}：` + (res.core[picked] ? '够数，它是<b>核心点</b>。' : res.lab[picked] >= 0 ? '不够数，但它落在某个核心点的邻域里，是<b>边界点</b>。' : '不够数，也不挨着任何核心点，是<b>噪声</b>。');
      } else if (res.clusters === 1 && noise < 5) note.innerHTML = 'eps 太大：所有点连成一片，只剩一个簇。';
      else if (noise > data.length * 0.4) note.innerHTML = 'eps 太小或 minPts 太大：大部分点都成了噪声。';
      else note.innerHTML = 'DBSCAN 不用事先指定簇数：从一个<b>核心点</b>（eps 半径内至少有 minPts 个点）出发，把能“密度可达”的点都连进同一簇，剩下的是<b>噪声</b>。所以它能分出月牙这种弯曲的形状，还能顺便找出离群点。';
    }
    function play() {
      if (anim) anim.stop();
      const vis = new Set();
      let k = 0;
      anim = K.loop(host, () => {
        for (let s = 0; s < 4 && k < res.order.length; s++) vis.add(res.order[k++]);
        draw(vis);
        if (k >= res.order.length) { draw(null); return false; }
        return true;
      }, 60);
    }
    p.svg.addEventListener('click', (e) => {
      const d = p.toData(e);
      let best = -1;
      let bd = Infinity;
      data.forEach((q, i) => { const dd = (p.sx(q.x) - d.px) ** 2 + (p.sy(q.y) - d.py) ** 2; if (dd < bd) { bd = dd; best = i; } });
      picked = bd < 400 ? best : null;
      draw(null);
    });
    run();
  },
});
