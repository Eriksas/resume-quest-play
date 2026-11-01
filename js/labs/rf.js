// 随机森林：每棵树用有放回抽样的数据、每次分裂只看随机一部分特征；很多棵不稳的树平均起来，边界变平滑。
Labs.register('rf', {
  render(host, K) {
    const root = K.panel(host);
    const make = (seed, n) => K.data.moons(K.rng(seed), n, 0.28).map((q) => ({ f: [q.x, q.y], y: q.t }));
    const train = make(12, 120);
    const test = make(120, 400);
    const MAXT = 40;
    const trees = [];
    const r = K.rng(31);
    for (let t = 0; t < MAXT; t++) {
      const counts = new Array(train.length).fill(0);
      for (let i = 0; i < train.length; i++) counts[Math.floor(r() * train.length)] += 1;
      const boot = [];
      counts.forEach((c, i) => { for (let k = 0; k < c; k++) boot.push(train[i]); });
      const tree = K.ml.cart(boot, { maxDepth: 8, minLeaf: 1, features: () => [Math.floor(r() * 2)] });
      trees.push({ tree, counts });
    }
    // OOB：每个样本只用没见过它的树来预测
    const oobAcc = (T) => {
      let right = 0;
      let n = 0;
      train.forEach((q, i) => {
        const ts = trees.slice(0, T).filter((t) => t.counts[i] === 0);
        if (!ts.length) return;
        n += 1;
        const pr = K.mean(ts.map((t) => K.ml.treeProb(t.tree, q.f)));
        if ((pr >= 0.5 ? 1 : 0) === q.y) right += 1;
      });
      return n ? right / n : NaN;
    };

    const ctl = K.row(root);
    const view = K.seg(ctl, [{ value: 'one', label: '看其中一棵树' }, { value: 'forest', label: '看整片森林' }], 'forest', () => draw());
    const ctl2 = K.row(root);
    const nT = K.slider(ctl2, { label: '树的数量', min: 1, max: MAXT, step: 1, value: 10, onInput: () => draw() });
    const which = K.slider(ctl2, { label: '看第几棵', min: 1, max: MAXT, step: 1, value: 1, onInput: () => { view.set('one', true); draw(); } });

    const p = K.plot(root, { x: [-1.6, 2.6], y: [-1.3, 1.8], w: 640, h: 380, xlabels: false, ylabels: false, label: '随机森林的决策区域' });
    const reg = K.regions(p.layer('reg', true), p, 64, 38);
    const gPts = p.layer('pts', true);
    K.legend(root, [['类别 0', 0], ['类别 1', 1, 'square'], ['这棵树没抽到的样本（袋外）', -1]]);
    const stats = K.stats(root);
    const note = K.note(root, '');

    function draw() {
      const T = nT.value;
      const one = view.value === 'one';
      const k = Math.min(which.value, MAXT) - 1;
      const prob = (f) => (one ? K.ml.treeProb(trees[k].tree, f) : K.mean(trees.slice(0, T).map((t) => K.ml.treeProb(t.tree, f))));
      reg.paint((x, y) => {
        const pr = prob([x, y]);
        return { c: pr >= 0.5 ? 1 : 0, a: 0.06 + 0.22 * Math.abs(pr - 0.5) * 2 };
      });
      K.drawPoints(gPts, p, train.map((q, i) => ({ x: q.f[0], y: q.f[1], c: one && trees[k].counts[i] === 0 ? -1 : q.y, n: one ? trees[k].counts[i] : 1 })), {
        shapes: true,
        size: (d) => (one ? 3 + Math.min(d.n, 4) * 1.4 : 4.5),
        opacity: (d) => (one && d.n === 0 ? 0.45 : 1),
      });
      const accOf = (fn) => K.mean(test.map((q) => ((fn(q.f) >= 0.5 ? 1 : 0) === q.y ? 1 : 0)));
      const single = accOf((f) => K.ml.treeProb(trees[k].tree, f));
      const forest = accOf((f) => K.mean(trees.slice(0, T).map((t) => K.ml.treeProb(t.tree, f))));
      const oob = trees[k].counts.filter((c) => c === 0).length;
      stats.set([
        [`第 ${k + 1} 棵树的测试准确率`, K.pct(single, 1)],
        [`${T} 棵树平均后`, K.pct(forest, 1), forest > single ? 'good' : ''],
        ['袋外（OOB）准确率', K.pct(oobAcc(T), 1)],
        ['这棵树没抽到的样本', `${oob} / ${train.length}`],
      ]);
      note.innerHTML = one
        ? `第 ${k + 1} 棵树：用<b>有放回抽样</b>抽了 ${train.length} 次（点越大 = 被抽到的次数越多，灰色 = 一次也没抽到，约三分之一），而且每次分裂只随机看一个特征。单棵树长得很深、边界很碎，换一棵就不一样——方差大。`
        : `${T} 棵树<b>投票（取平均概率）</b>：各自的碎边界互相抵消，整体边界变平滑，测试准确率比单棵树高。这就是 Bagging 降方差。没抽到某个样本的那些树可以拿来给它打分，得到“袋外准确率”，相当于免费的验证集。`;
    }
    draw();
  },
});
