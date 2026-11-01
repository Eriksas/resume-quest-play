// 三种聚类对比：同一份数据，分别用 K-means、DBSCAN、层次聚类，看谁分得对。
Labs.register('clustercmp', {
  render(host, K) {
    const root = K.panel(host);
    const sets = {
      blobs: { label: '三个圆团', make: () => K.data.blobs(K.rng(3), [[-1.6, 1.1], [1.6, 1.2], [0, -1.3]], 30, 0.45), k: 3, eps: 0.5, mp: 4, link: 'average' },
      moons: { label: '两个月牙', make: () => K.data.moons(K.rng(4), 120, 0.06).map((q) => ({ x: q.x * 2.2 - 1.1, y: q.y * 2.4 - 0.6 })), k: 2, eps: 0.42, mp: 4, link: 'single' },
      density: { label: '密度差很多', make: () => K.data.blobs(K.rng(8), [[-1.5, 0.4, 0.95], [1.7, 1.2, 0.18], [1.7, -1.0, 0.18]], 30, 0.3), k: 3, eps: 0.3, mp: 4, link: 'average' },
      noise: { label: '圆团 + 很多噪声', make: () => {
        const b = K.data.blobs(K.rng(9), [[-1.5, 1.0], [1.5, 1.0], [0, -1.2]], 26, 0.35);
        const r = K.rng(90);
        for (let i = 0; i < 30; i++) b.push({ x: -3 + r() * 6, y: -2.6 + r() * 5 });
        return b;
      }, k: 3, eps: 0.45, mp: 5, link: 'average' },
    };
    const ctl = K.row(root);
    const pick = K.seg(ctl, Object.keys(sets).map((k) => ({ value: k, label: sets[k].label })), 'blobs', () => draw());
    const grid = K.h('<div class="lab-grid3"></div>', root);
    const cols = ['K-means', 'DBSCAN', '层次聚类'].map((t) => {
      const box = K.h('<div></div>', grid);
      const p = K.plot(box, { x: [-3.2, 3.4], y: [-2.8, 3], w: 300, h: 260, axes: false, label: t });
      const cap = K.h(`<p class="lab-caption"><b>${t}</b></p>`, box);
      return { p, g: p.layer('pts'), cap };
    });
    K.h(`<table class="lab-table">
      <thead><tr><th></th><th>K-means</th><th>DBSCAN</th><th>层次聚类</th></tr></thead>
      <tbody>
        <tr><td>要事先定簇数</td><td class="bad">要（K）</td><td class="good">不用（要定 eps、minPts）</td><td class="good">不用（切树状图）</td></tr>
        <tr><td>任意形状的簇</td><td class="bad">不行，偏好大小相近的圆团</td><td class="good">可以</td><td>看链接方式（单链接可以）</td></tr>
        <tr><td>识别噪声 / 离群点</td><td class="bad">不能，每个点都被分进某一簇</td><td class="good">能</td><td class="bad">不能</td></tr>
        <tr><td>密度差很多的簇</td><td>一般</td><td class="bad">难，一个 eps 照顾不了两种密度</td><td>一般</td></tr>
        <tr><td>大数据速度</td><td class="good">快</td><td>中等</td><td class="bad">慢（要算两两距离）</td></tr>
        <tr><td>结果稳定性</td><td>依赖初始中心，要多跑几次</td><td>稳定（边界点归属可能随顺序变）</td><td>稳定，但合并后不能撤销</td></tr>
      </tbody></table>`, root);
    const note = K.note(root, '');

    function draw() {
      const s = sets[pick.value];
      const data = s.make();
      const km = K.ml.kmeans(data, s.k, K.rng(2), 'plus', 5).lab;
      const db = K.ml.dbscan(data, s.eps, s.mp).lab;
      const merges = K.ml.agglo(data, s.link);
      const parent = data.map((_, i) => i);
      const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
      merges.slice(0, data.length - s.k).forEach((m) => { const a = find(m.members[0]); m.members.forEach((j) => (parent[find(j)] = a)); });
      const roots = [...new Set(data.map((_, i) => find(i)))];
      const hc = data.map((_, i) => roots.indexOf(find(i)));
      [km, db, hc].forEach((lab, j) => K.drawPoints(cols[j].g, cols[j].p, data.map((q, i) => ({ x: q.x, y: q.y, c: lab[i] })), { r: 3.6, shapes: true }));
      cols[0].cap.innerHTML = `<b>K-means</b>（K = ${s.k}）`;
      cols[1].cap.innerHTML = `<b>DBSCAN</b>（eps = ${s.eps}，minPts = ${s.mp}；灰色 = 噪声）`;
      cols[2].cap.innerHTML = `<b>层次聚类</b>（${{ single: '单链接', average: '平均链接', complete: '全链接' }[s.link]}，切成 ${s.k} 簇）`;
      note.innerHTML = {
        blobs: '大小相近的圆团：三种方法都能分对。这种数据用 K-means 最省事。',
        moons: '月牙：K-means 横着切错了；DBSCAN 和单链接层次聚类顺着形状连起来，分对了。',
        density: '一个松散的大团 + 两个紧密的小团：DBSCAN 的一个 eps 很难同时照顾两种密度，松散的那团被拆成噪声或碎块。',
        noise: '很多噪声：K-means 和层次聚类会把噪声硬塞进某一簇，把中心拉偏；DBSCAN 能把它们标成噪声（灰色）。',
      }[pick.value];
    }
    draw();
  },
});
