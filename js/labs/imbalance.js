// 样本不均衡：正样本只有 5%。看“准确率陷阱”，再比较欠采样、过采样、SMOTE、类别权重和调阈值。
Labs.register('imbalance', {
  render(host, K) {
    const root = K.panel(host);
    const make = (seed, nNeg, nPos) => {
      const r = K.rng(seed);
      const out = [];
      for (let i = 0; i < nNeg; i++) out.push({ x: -0.6 + K.gauss(r) * 1.0, y: -0.4 + K.gauss(r) * 1.0, t: 0 });
      for (let i = 0; i < nPos; i++) out.push({ x: 0.9 + K.gauss(r) * 0.65, y: 0.7 + K.gauss(r) * 0.65, t: 1 });
      return out;
    };
    const train = make(8, 190, 10);
    const test = make(80, 950, 50);

    const ctl = K.row(root);
    const method = K.seg(ctl, [
      { value: 'none', label: '不处理' },
      { value: 'under', label: '欠采样' },
      { value: 'over', label: '随机过采样' },
      { value: 'smote', label: 'SMOTE' },
      { value: 'weight', label: '类别权重' },
    ], 'none', () => draw());
    const ctl2 = K.row(root);
    const thr = K.slider(ctl2, { label: '判为正样本的概率阈值', min: 0.05, max: 0.95, step: 0.05, value: 0.5, fmt: (v) => v.toFixed(2), onInput: () => draw(true) });

    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const p = K.plot(left, { x: [-3.5, 3.5], y: [-3.2, 3.2], w: 440, h: 360, xlabels: false, ylabels: false, label: '训练数据和分类边界' });
    const gSeg = p.layer('seg', true);
    const gB = p.layer('boundary', true);
    const gPts = p.layer('pts', true);
    K.legend(left, [['负样本（多数）', 0], ['正样本（少数）', 1, 'square'], ['新合成 / 复制的正样本', 1]]);
    const cm = K.h('<div class="cm"></div>', right);
    const stats = K.stats(right);
    K.caption(right, '指标在 1000 个新样本上算（其中正样本 50 个，同样只占 5%）。');
    const note = K.note(root, '');

    let model = null;
    let shown = null;

    function resample() {
      const r = K.rng(5);
      const neg = train.filter((q) => q.t === 0);
      const pos = train.filter((q) => q.t === 1);
      const extra = [];
      let used = train.map((q) => ({ ...q, w: 1, faded: false }));
      const segs = [];
      if (method.value === 'under') {
        const idx = neg.map((_, i) => i);
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(r() * (i + 1));
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        const keep = new Set(idx.slice(0, 30).map((i) => neg[i]));
        used = train.map((q) => ({ ...q, w: 1, faded: q.t === 0 && !keep.has(q) }));
      } else if (method.value === 'over') {
        for (let k = 0; k < 170; k++) {
          const s = pos[Math.floor(r() * pos.length)];
          extra.push({ x: s.x + (r() - 0.5) * 0.06, y: s.y + (r() - 0.5) * 0.06, t: 1, w: 1, synth: true });
        }
      } else if (method.value === 'smote') {
        for (let k = 0; k < 170; k++) {
          const a = pos[Math.floor(r() * pos.length)];
          const nn = pos.filter((q) => q !== a).sort((u, v) => K.ml.dist2(u, a) - K.ml.dist2(v, a)).slice(0, 5);
          const b = nn[Math.floor(r() * nn.length)];
          const lamb = r();
          extra.push({ x: a.x + lamb * (b.x - a.x), y: a.y + lamb * (b.y - a.y), t: 1, w: 1, synth: true });
          if (k < 40) segs.push([a, b]);
        }
      } else if (method.value === 'weight') {
        used = used.map((q) => ({ ...q, w: q.t === 1 ? neg.length / pos.length : 1 }));
      }
      const fitSet = used.filter((q) => !q.faded).concat(extra);
      return { used, extra, segs, fitSet };
    }

    function draw(onlyThreshold) {
      if (!onlyThreshold || !model) {
        shown = resample();
        const fs = shown.fitSet;
        model = K.ml.logreg(fs.map((q) => [q.x, q.y]), fs.map((q) => q.t), { iters: 500, lr: 0.5, weights: fs.map((q) => q.w) });
        K.clear(gSeg);
        shown.segs.forEach(([a, b]) => K.line(gSeg, p.sx(a.x), p.sy(a.y), p.sx(b.x), p.sy(b.y), { stroke: 'var(--series-2)', 'stroke-opacity': 0.35 }));
        const ptsAll = shown.used.map((q) => ({ x: q.x, y: q.y, c: q.t, faded: q.faded, synth: false, w: q.w }))
          .concat(shown.extra.map((q) => ({ x: q.x, y: q.y, c: 1, synth: true })));
        K.drawPoints(gPts, p, ptsAll, {
          shapes: true,
          size: (d) => (d.synth ? 3 : d.w > 1 ? 7.5 : 4.5),
          hollow: (d) => d.synth,
          opacity: (d) => (d.faded ? 0.15 : 1),
        });
      }
      // 边界：P = 阈值 的直线
      K.clear(gB);
      const [w1, w2] = model.w;
      const z = Math.log(thr.value / (1 - thr.value));
      if (Math.abs(w2) > 1e-6) {
        const yAt = (x) => (z - model.b - w1 * x) / w2;
        K.line(gB, p.sx(-3.5), p.sy(yAt(-3.5)), p.sx(3.5), p.sy(yAt(3.5)), { stroke: 'var(--text)', 'stroke-width': 2.5, 'stroke-dasharray': '7 4' });
      }
      let tp = 0, fp = 0, tn = 0, fn = 0;
      test.forEach((q) => {
        const pred = model.p([q.x, q.y]) >= thr.value ? 1 : 0;
        if (pred && q.t) tp++;
        else if (pred && !q.t) fp++;
        else if (!pred && q.t) fn++;
        else tn++;
      });
      const acc = (tp + tn) / test.length;
      const prec = tp + fp ? tp / (tp + fp) : NaN;
      const rec = tp / (tp + fn);
      const f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
      cm.innerHTML = `<div class="h"></div><div class="h">预测为正</div><div class="h">预测为负</div>
        <div class="h">实际为正</div><div class="tp">TP<b>${tp}</b></div><div class="fn">FN（漏掉）<b>${fn}</b></div>
        <div class="h">实际为负</div><div class="fp">FP（误报）<b>${fp}</b></div><div class="tn">TN<b>${tn}</b></div>`;
      stats.set([
        ['准确率', K.pct(acc, 1)],
        ['精确率', Number.isFinite(prec) ? K.pct(prec, 0) : '—'],
        ['召回率', K.pct(rec, 0), rec < 0.5 ? 'bad' : 'good'],
        ['F1', f1.toFixed(2)],
      ]);
      const m = method.value;
      note.className = 'lab-note ' + (rec < 0.5 ? 'warn' : '');
      if (m === 'none' && thr.value >= 0.5) note.innerHTML = `准确率有 ${K.pct(acc, 1)}，看起来很好——可是 50 个正样本只抓到 ${tp} 个。全部猜“负”都能有 95% 的准确率，所以不均衡时<b>别看准确率</b>，看召回率、精确率、F1、PR 曲线。`;
      else if (m === 'under') note.innerHTML = '<b>欠采样</b>：把多数类随机扔掉一大半（灰掉的点），让两类数量接近。简单，但丢了信息。';
      else if (m === 'over') note.innerHTML = '<b>随机过采样</b>：把少数类复制很多遍。召回率上来了，但都是原样复制，容易过拟合那几个点。';
      else if (m === 'smote') note.innerHTML = '<b>SMOTE</b>：在少数类样本和它的近邻之间连线，在线上随机取点合成新样本（空心点），比直接复制更“铺得开”。注意：只对训练集做，测试集保持原样。';
      else if (m === 'weight') note.innerHTML = '<b>类别权重</b>：不改数据，只是让少数类判错的代价更大（大点 = 权重大）。sklearn 里就是 class_weight="balanced"。';
      else note.innerHTML = '<b>调阈值</b>：模型输出的是概率，阈值从 0.5 往下调，更多样本被判为正——召回率升、精确率降。按业务代价选阈值（漏掉一个坏人和误报一个好人，哪个更贵？）。';
    }

    draw();
  },
});
