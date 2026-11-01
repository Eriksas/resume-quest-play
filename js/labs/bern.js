// 伯努利分布：一次试验只有 0 / 1。抛很多次，成功比例会贴近 p；方差 p(1 − p) 在 p = 0.5 时最大。
Labs.register('bern', {
  render(host, K) {
    const root = K.panel(host);
    let flips = [];
    let r = K.rng(5);
    const ctl = K.row(root);
    const pSl = K.slider(ctl, { label: '成功概率 p（比如转化率）', min: 0.05, max: 0.95, step: 0.05, value: 0.3, fmt: (v) => v.toFixed(2), onInput: () => { flips = []; draw(); } });
    const btns = K.row(root);
    K.button(btns, '试 1 次', () => flip(1), true);
    K.button(btns, '试 50 次', () => flip(50));
    K.button(btns, '试 500 次', () => flip(500));
    K.button(btns, '清空', () => { flips = []; r = K.rng(Math.floor(Math.random() * 1e6)); draw(); });

    const seqBox = K.h('<div></div>', root);
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const pr = K.plot(left, { x: [0, 1], y: [0, 1], w: 380, h: 260, xlabel: '试验次数', ylabel: '累计成功比例', yticks: [0, 0.25, 0.5, 0.75, 1], xlabels: false, label: '成功比例随次数变化' });
    const gR = pr.layer('r', true);
    K.caption(left, '成功比例会越来越贴近 p（大数定律）');
    const pv = K.plot(right, { x: [0, 1], y: [0, 0.3], w: 320, h: 260, xlabel: 'p', ylabel: '方差 p(1 − p)', xticks: [0, 0.5, 1], yticks: [0, 0.1, 0.2, 0.25], fy: (v) => v.toFixed(2), label: '方差随 p 变化' });
    const gV = pv.layer('v', true);
    const curve = [];
    for (let x = 0; x <= 1.0001; x += 0.01) curve.push([pv.sx(x), pv.sy(x * (1 - x))]);
    K.path(gV, curve, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
    const dot = K.marker(pv.layer('d', true), 'circle', 0, 0, 7, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 2 });
    K.caption(right, 'p = 0.5 时方差最大（0.25）');
    const stats = K.stats(root);
    K.note(root, '<b>和 A/B 测试的关系</b>：每个用户“转化 = 1、没转化 = 0”就是一次伯努利试验。n 个人的转化率，方差是 p(1 − p) / n，开根号就是标准误。所以转化率在 50% 附近时波动最大、需要的样本最多；样本量翻 4 倍，标准误才减半。', '');

    function flip(k) {
      for (let i = 0; i < k; i++) flips.push(r() < pSl.value ? 1 : 0);
      draw();
    }
    function draw() {
      const p = pSl.value;
      seqBox.innerHTML = '';
      const last = flips.slice(-60);
      const svg = K.s('svg', { viewBox: '0 0 640 40', class: 'lab-svg', role: 'img', 'aria-label': '最近 60 次试验' }, seqBox);
      last.forEach((v, i) => K.s('rect', { x: 6 + i * 10.5, y: 10, width: 9, height: 20, rx: 2, fill: v ? 'var(--series-2)' : 'var(--series-1)', opacity: v ? 1 : 0.35 }, svg));
      if (!last.length) K.text(svg, 10, 25, '点“试 1 次”开始；橙色 = 成功（1），浅蓝 = 失败（0）', { 'font-size': 12 });
      K.clear(gR);
      K.line(gR, pr.sx(0), pr.sy(p), pr.sx(1), pr.sy(p), { stroke: 'var(--text)', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 });
      if (flips.length) {
        let s = 0;
        const path = flips.map((v, i) => { s += v; return [pr.sx((i + 1) / flips.length), pr.sy(s / (i + 1))]; });
        K.path(gR, path, { stroke: 'var(--series-2)', 'stroke-width': 2 });
      }
      dot.setAttribute('cx', pv.sx(p));
      dot.setAttribute('cy', pv.sy(p * (1 - p)));
      const n = flips.length;
      const succ = flips.reduce((a, b) => a + b, 0);
      stats.set([
        ['试验次数', String(n)],
        ['成功比例', n ? (succ / n).toFixed(3) : '—'],
        ['理论期望 p', p.toFixed(2)],
        ['理论方差 p(1−p)', (p * (1 - p)).toFixed(4)],
        ['比例的标准误 √(p(1−p)/n)', n ? Math.sqrt((p * (1 - p)) / n).toFixed(4) : '—'],
      ]);
    }
    draw();
  },
});
