// 分类评估：模型给每个样本一个分数，拖动阈值看混淆矩阵、精确率、召回率怎么变；ROC 曲线和 AUC 与阈值无关。
Labs.register('metrics', {
  render(host, K) {
    const root = K.panel(host);
    let neg = [];
    let pos = [];
    const ctl = K.row(root);
    const sep = K.seg(ctl, [{ value: 2.6, label: '分得开' }, { value: 1.3, label: '有重叠' }, { value: 0.4, label: '很难分' }], 1.3, () => { gen(); draw(); });
    const rare = K.check(ctl, '正样本只占 5%', false, () => { gen(); draw(); });
    const ctl2 = K.row(root);
    const thr = K.slider(ctl2, { label: '阈值（分数 ≥ 阈值判为正）', min: 0.02, max: 0.98, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2), onInput: () => draw() });

    const ps = K.plot(root, { x: [0, 1], y: [0, 2], w: 640, h: 170, xlabel: '模型给的分数', yticks: [], ylabels: false, grid: false, label: '正负样本的分数分布' });
    const gS = ps.layer('s', true);
    const gT = ps.layer('t', true);
    K.legend(root, [['实际为负', 0], ['实际为正', 1, 'square'], ['实心 = 判为正，空心 = 判为负', -1]]);
    K.text(ps.svg, ps.P.l + 4, ps.sy(1.55), '实际为正', { 'font-size': 11 });
    K.text(ps.svg, ps.P.l + 4, ps.sy(0.55), '实际为负', { 'font-size': 11 });
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div class="lab"></div>', grid);
    const right = K.h('<div></div>', grid);
    const cm = K.h('<div class="cm"></div>', left);
    const stats = K.stats(left);
    const pr = K.plot(right, { x: [0, 1], y: [0, 1], w: 320, h: 300, xlabel: '假正率 FPR', ylabel: '真正率 TPR（召回）', xticks: [0, 0.5, 1], yticks: [0, 0.5, 1], label: 'ROC 曲线' });
    const gR = pr.layer('roc', true);
    const note = K.note(root, '');

    function gen() {
      const r = K.rng(17);
      const d = Number(sep.value);
      const nP = rare.value ? 16 : 100;
      neg = Array.from({ length: 300 }, () => K.sigmoid(-d / 2 + K.gauss(r)));
      pos = Array.from({ length: nP }, () => K.sigmoid(d / 2 + K.gauss(r)));
    }
    const count = (t) => {
      const tp = pos.filter((s) => s >= t).length;
      const fp = neg.filter((s) => s >= t).length;
      return { tp, fp, fn: pos.length - tp, tn: neg.length - fp };
    };

    function draw() {
      const t = thr.value;
      const r = K.rng(3);
      K.clear(gS);
      // 颜色 = 真实类别；实心 = 被判为正，空心 = 被判为负
      const dot = (s, y, shape, col) => K.marker(gS, shape, ps.sx(s), ps.sy(y), 3.2, s >= t
        ? { fill: col, stroke: 'none' }
        : { fill: 'var(--surface)', stroke: col, 'stroke-width': 1.3 });
      neg.forEach((s) => dot(s, 0.2 + r() * 0.6, 'circle', 'var(--series-1)'));
      pos.forEach((s) => dot(s, 1.2 + r() * 0.6, 'square', 'var(--series-2)'));
      K.clear(gT);
      K.line(gT, ps.sx(t), ps.P.t, ps.sx(t), ps.H - ps.P.b, { stroke: 'var(--text)', 'stroke-width': 2.5 });
      K.text(gT, ps.sx(t) + 6, ps.P.t + 12, '判为正 →', { class: 'strong', 'font-size': 11 });

      const { tp, fp, fn, tn } = count(t);
      const acc = (tp + tn) / (pos.length + neg.length);
      const prec = tp + fp ? tp / (tp + fp) : NaN;
      const rec = tp / pos.length;
      const fpr = fp / neg.length;
      const f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
      cm.innerHTML = `<div class="h"></div><div class="h">预测为正</div><div class="h">预测为负</div>
        <div class="h">实际为正</div><div class="tp">TP<b>${tp}</b></div><div class="fn">FN<b>${fn}</b></div>
        <div class="h">实际为负</div><div class="fp">FP<b>${fp}</b></div><div class="tn">TN<b>${tn}</b></div>`;
      stats.set([
        ['准确率', K.pct(acc, 1)],
        ['精确率 TP/(TP+FP)', Number.isFinite(prec) ? K.pct(prec, 0) : '—'],
        ['召回率 TP/(TP+FN)', K.pct(rec, 0)],
        ['F1', f1.toFixed(2)],
        ['假正率 FP/(FP+TN)', K.pct(fpr, 0)],
      ]);

      // ROC
      const ts = [1.01].concat(pos.concat(neg).sort((a, b) => b - a), [-0.01]);
      const roc = ts.map((tt) => { const c = count(tt); return [c.fp / neg.length, c.tp / pos.length]; });
      let auc = 0;
      for (let i = 1; i < roc.length; i++) auc += (roc[i][0] - roc[i - 1][0]) * (roc[i][1] + roc[i - 1][1]) / 2;
      K.clear(gR);
      K.line(gR, pr.sx(0), pr.sy(0), pr.sx(1), pr.sy(1), { class: 'soft', 'stroke-dasharray': '4 4' });
      K.path(gR, roc.map((q) => [pr.sx(q[0]), pr.sy(q[1])]).concat([[pr.sx(1), pr.sy(0)], [pr.sx(0), pr.sy(0)]]), { fill: 'var(--series-1)', 'fill-opacity': 0.12, stroke: 'none' });
      K.path(gR, roc.map((q) => [pr.sx(q[0]), pr.sy(q[1])]), { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      K.marker(gR, 'circle', pr.sx(fpr), pr.sy(rec), 7, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });
      K.text(gR, pr.sx(0.5), pr.sy(0.12), `AUC = ${auc.toFixed(3)}`, { class: 'strong', 'text-anchor': 'middle' });

      note.innerHTML = rare.value
        ? `正样本只有 ${pos.length} 个：准确率很高没意义（全猜负也有 ${K.pct(300 / 316, 0)}），精确率却很容易掉下来——少量误报就能盖过真正的正样本。这时更该看 <b>PR 曲线（精确率-召回率）</b>，ROC 在极度不均衡时会显得过于乐观。`
        : '阈值往左拖：判为正的更多，<b>召回率升、精确率降</b>；往右拖则相反。ROC 曲线把所有阈值下的（假正率，召回率）连起来，橙点是当前阈值的位置。<b>AUC</b> = 随机挑一个正样本和一个负样本，正样本分数更高的概率；0.5 等于瞎猜，1 是完美。';
    }
    gen();
    draw();
  },
});
