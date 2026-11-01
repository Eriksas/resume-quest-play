// 层次聚类（凝聚式）：每一步合并距离最近的两个簇，右边同步画出树状图；拖动“切一刀”的高度得到几个簇。
Labs.register('hier', {
  render(host, K) {
    const root = K.panel(host);
    const names = 'ABCDEFGHIJKL'.split('');
    const r = K.rng(19);
    const centers = [[-1.6, 1.2], [1.5, 1.4], [0.2, -1.3]];
    const pts = names.map((nm, i) => {
      const c = centers[i % 3];
      return { x: c[0] + K.gauss(r) * 0.55, y: c[1] + K.gauss(r) * 0.55, name: nm };
    });
    let merges = [];
    let shown = 0;

    const ctl = K.row(root);
    const link = K.seg(ctl, [{ value: 'single', label: '单链接（最近两点）' }, { value: 'complete', label: '全链接（最远两点）' }, { value: 'average', label: '平均链接' }], 'average', () => { merges = K.ml.agglo(pts, link.value); shown = 0; draw(); });
    const btns = K.row(root);
    K.button(btns, '合并最近的两簇', () => { shown = Math.min(shown + 1, merges.length); draw(); }, true);
    K.button(btns, '一直合并到底', () => { shown = merges.length; draw(); });
    K.button(btns, '重来', () => { shown = 0; draw(); });
    const ctl2 = K.row(root);
    const cut = K.slider(ctl2, { label: '在这个高度切一刀', min: 0.2, max: 4, step: 0.05, value: 1.6, fmt: (v) => v.toFixed(2), onInput: () => draw() });

    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const p = K.plot(left, { x: [-3.2, 3.2], y: [-2.8, 3], w: 400, h: 340, xlabels: false, ylabels: false, label: '数据点和合并过程' });
    const gH = p.layer('hull', true);
    const gP = p.layer('pts', true);
    const pd = K.plot(right, { x: [0, names.length + 1], y: [0, 4.2], w: 400, h: 340, xticks: [], ylabel: '合并时的距离', yticks: [0, 1, 2, 3, 4], label: '树状图' });
    const gD = pd.layer('d', true);
    const gLbl = pd.layer('labels');
    const gCut = pd.layer('cut', true);
    const stats = K.stats(root);
    const note = K.note(root, '');

    function clustersAt(steps, maxD) {
      const parent = pts.map((_, i) => i);
      const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
      const ids = new Map(pts.map((_, i) => [i, i]));
      merges.slice(0, steps).forEach((m) => {
        if (maxD != null && m.d > maxD) return;
        const a = find(m.members[0]);
        m.members.forEach((j) => (parent[find(j)] = a));
        void ids;
      });
      const roots = [...new Set(pts.map((_, i) => find(i)))];
      return pts.map((_, i) => roots.indexOf(find(i)));
    }

    function draw() {
      // 左边：按“已经合并的步数”和“切的高度”上色
      const lab = clustersAt(shown, cut.value);
      const k = Math.max(...lab) + 1;
      K.clear(gH);
      const groups = clustersAt(shown, null);
      [...new Set(groups)].forEach((g) => {
        const mem = pts.filter((_, i) => groups[i] === g);
        if (mem.length < 2) return;
        const cx = K.mean(mem.map((q) => q.x));
        const cy = K.mean(mem.map((q) => q.y));
        const rad = Math.max(...mem.map((q) => Math.hypot(q.x - cx, q.y - cy))) + 0.25;
        K.s('ellipse', { cx: p.sx(cx), cy: p.sy(cy), rx: p.sx(cx + rad) - p.sx(cx), ry: p.sy(cy) - p.sy(cy + rad), fill: 'none', stroke: 'var(--muted)', 'stroke-dasharray': '4 3' }, gH);
      });
      K.drawPoints(gP, p, pts.map((q, i) => ({ x: q.x, y: q.y, c: k <= 6 ? lab[i] : -1 })), { r: 6, shapes: true });
      pts.forEach((q) => K.text(gP, p.sx(q.x) + 8, p.sy(q.y) - 6, q.name, { class: 'strong', 'font-size': 11 }));

      // 右边：树状图（叶子顺序取最终合并树的中序）
      K.clear(gD);
      const order = [];
      const node = new Map(pts.map((_, i) => [i, { leaf: i }]));
      merges.forEach((m) => node.set(m.id, { a: m.a, b: m.b, d: m.d }));
      (function walk(id) {
        const n = node.get(id);
        if (n.leaf != null) order.push(n.leaf);
        else { walk(n.a); walk(n.b); }
      })(merges.length ? merges[merges.length - 1].id : 0);
      const xy = new Map();
      K.clear(gLbl);
      order.forEach((leaf, i) => {
        xy.set(leaf, { x: i + 1, y: 0 });
        K.text(gLbl, pd.sx(i + 1), pd.H - pd.P.b + 15, pts[leaf].name, { 'text-anchor': 'middle', class: 'strong', 'font-size': 11 });
      });
      merges.slice(0, shown).forEach((m) => {
        const A = xy.get(m.a);
        const B = xy.get(m.b);
        const y = Math.min(m.d, 4.2);
        K.path(gD, [[pd.sx(A.x), pd.sy(A.y)], [pd.sx(A.x), pd.sy(y)], [pd.sx(B.x), pd.sy(y)], [pd.sx(B.x), pd.sy(B.y)]], { stroke: 'var(--series-1)', 'stroke-width': 2 });
        xy.set(m.id, { x: (A.x + B.x) / 2, y });
      });
      K.clear(gCut);
      K.line(gCut, pd.P.l, pd.sy(cut.value), pd.W - pd.P.r, pd.sy(cut.value), { stroke: 'var(--series-2)', 'stroke-width': 2, 'stroke-dasharray': '6 4' });
      const next = merges[shown];
      stats.set([['已合并步数', `${shown} / ${merges.length}`], ['切在当前高度得到的簇数', String(k)]]);
      note.innerHTML = shown < merges.length
        ? `下一步会合并距离为 <b>${next.d.toFixed(2)}</b> 的两个簇。凝聚式层次聚类：一开始每个点自成一簇，每一步把<b>最近的两簇</b>合并，直到只剩一簇。“两簇之间的距离”怎么算，就是链接方式。`
        : '树状图画完了。<b>不用事先定簇数</b>：在不同高度横着切一刀，就得到不同数量的簇。缺点是每一步都要算两两距离，样本多时很慢；而且合并了就不能撤销。';
    }
    merges = K.ml.agglo(pts, link.value);
    draw();
  },
});
