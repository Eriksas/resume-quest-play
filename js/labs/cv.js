// 模型选择：K 折交叉验证、时间序列滚动验证、训练 / 验证 / 测试三份划分；用交叉验证挑多项式阶数。
Labs.register('cv', {
  render(host, K) {
    const root = K.panel(host);
    const ctl = K.row(root);
    const mode = K.seg(ctl, [{ value: 'kfold', label: 'K 折交叉验证' }, { value: 'rolling', label: '时间序列滚动验证' }, { value: 'holdout', label: '训练 / 验证 / 测试' }], 'kfold', () => draw());
    const ctl2 = K.row(root);
    const kSl = K.slider(ctl2, { label: '折数 K', min: 2, max: 10, step: 1, value: 5, onInput: () => draw() });
    const diag = K.h('<div></div>', root);
    K.legend(root, [['训练', 0, 'square'], ['验证', 1, 'square'], ['测试（最后只用一次）', 2, 'square'], ['这一轮不用', -1, 'square']]);
    const extra = K.h('<div></div>', root);
    const note = K.note(root, '');

    // 交叉验证挑阶数用的数据
    const r = K.rng(4);
    const data = Array.from({ length: 30 }, () => {
      const x = -1 + 2 * r();
      return { x, y: 0.8 * Math.sin(Math.PI * x) + K.gauss(r) * 0.25 };
    });

    function blocks(rows, nBlocks) {
      diag.innerHTML = '';
      const W = 640;
      const rowH = 26;
      const H = rows.length * rowH + 22;
      const svg = K.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg', role: 'img', 'aria-label': '数据划分示意' }, diag);
      const bw = (W - 110) / nBlocks;
      rows.forEach((row, i) => {
        K.text(svg, 8, 12 + i * rowH + 13, row.label, { 'font-size': 11.5 });
        row.cells.forEach((c, j) => K.s('rect', { x: 100 + j * bw, y: 12 + i * rowH, width: bw - 2, height: rowH - 6, rx: 3, fill: c < 0 ? 'var(--surface-2)' : K.color(c), opacity: c < 0 ? 1 : 0.85 }, svg));
      });
      if (mode.value === 'rolling') K.text(svg, W - 8, H - 4, '时间 →', { 'text-anchor': 'end', 'font-size': 11 });
    }

    function cvCurve(k) {
      extra.innerHTML = '';
      K.h('<h3 class="sub-h">用 K 折交叉验证挑模型复杂度（多项式阶数）</h3>', extra);
      const idx = data.map((_, i) => i);
      const errs = [];
      for (let d = 1; d <= 10; d++) {
        let e = 0;
        for (let f = 0; f < k; f++) {
          const va = idx.filter((i) => i % k === f);
          const tr = idx.filter((i) => i % k !== f);
          const c = K.ml.polyfit(tr.map((i) => data[i].x), tr.map((i) => data[i].y), d, 1e-6);
          e += K.mean(va.map((i) => (K.ml.polyval(c, data[i].x) - data[i].y) ** 2));
        }
        const cAll = K.ml.polyfit(data.map((q) => q.x), data.map((q) => q.y), d, 1e-6);
        errs.push({ d, cv: e / k, tr: K.mean(data.map((q) => (K.ml.polyval(cAll, q.x) - q.y) ** 2)) });
      }
      const best = errs.reduce((a, b) => (b.cv < a.cv ? b : a));
      const p = K.plot(extra, { x: [1, 10], y: [-2, 1], w: 640, h: 240, xlabel: '阶数', ylabel: '误差（对数）', xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yticks: [-2, -1, 0, 1], fy: (v) => (v === 0 ? '1' : '10^' + v), label: '交叉验证误差' });
      const g = p.layer('e', true);
      const L = (v) => p.sy(K.clamp(Math.log10(v), -2, 1));
      K.path(g, errs.map((e) => [p.sx(e.d), L(e.tr)]), { stroke: 'var(--series-1)', 'stroke-width': 2 });
      K.path(g, errs.map((e) => [p.sx(e.d), L(e.cv)]), { stroke: 'var(--series-2)', 'stroke-width': 2 });
      K.marker(g, 'diamond', p.sx(best.d), L(best.cv), 8, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });
      K.text(g, p.sx(best.d) + 10, L(best.cv) + 18, `交叉验证选 ${best.d} 阶`, { class: 'strong' });
      K.legend(extra, [['训练误差（越复杂越低）', 0, 'line'], [`${k} 折交叉验证误差`, 1, 'line']]);
    }

    function draw() {
      kSl.el.hidden = mode.value !== 'kfold';
      const m = mode.value;
      if (m === 'kfold') {
        const k = kSl.value;
        const n = 20;
        blocks(Array.from({ length: k }, (_, f) => ({ label: `第 ${f + 1} 轮`, cells: Array.from({ length: n }, (_, j) => (Math.floor((j * k) / n) === f ? 1 : 0)) })), n);
        cvCurve(k);
        note.innerHTML = `<b>K 折交叉验证</b>：把数据分成 ${k} 份，每轮拿 1 份当验证、其余训练，轮流 ${k} 次，最后取平均分。每个样本都当过一次验证集，比只切一次更稳；代价是要训练 ${k} 次。适合数据不多、样本之间相互独立的情况。`;
      } else if (m === 'rolling') {
        const n = 20;
        const rows = [8, 10, 12, 14, 16].map((t, i) => ({ label: `第 ${i + 1} 次`, cells: Array.from({ length: n }, (_, j) => (j < t ? 0 : j < t + 2 ? 1 : -1)) }));
        blocks(rows, n);
        extra.innerHTML = '';
        note.innerHTML = '<b>时间序列不能随机划分</b>：随机切会让模型“用未来预测过去”，分数虚高。要按时间滚动：每次只用过去的数据训练，预测紧接着的下一段，再往前滚。';
      } else {
        blocks([{ label: '一次性划分', cells: Array.from({ length: 20 }, (_, j) => (j < 12 ? 0 : j < 16 ? 1 : 2)) }], 20);
        extra.innerHTML = '';
        note.innerHTML = '<b>三份划分</b>：训练集用来训练；验证集用来挑模型、调参数；测试集只在最后评估一次。如果在测试集上挑模型，等于拿考试题复习，成绩会虚高。';
      }
    }
    draw();
  },
});
