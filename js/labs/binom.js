// 二项分布：高尔顿板。每个小球经过 n 排钉子，每排以概率 p 往右、1 − p 往左，落点 = 往右的次数，服从 B(n, p)。
Labs.register('binom', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const W = 640;
    const H = 460;
    let counts = [];
    let balls = [];
    let anim = null;
    let total = 0;
    let rng = K.rng(9);

    const ctl = K.row(root);
    const nSl = K.slider(ctl, { label: '钉子排数 n（试验次数）', min: 2, max: 14, step: 1, value: 10, onInput: () => reset() });
    const pSl = K.slider(ctl, { label: '每次往右的概率 p', min: 0.1, max: 0.9, step: 0.05, value: 0.5, fmt: (v) => v.toFixed(2), onInput: () => reset() });
    const btns = K.row(root);
    K.button(btns, '放 1 个球', () => drop(1), true);
    K.button(btns, '放 200 个球', () => drop(200));
    K.button(btns, '清空', () => reset());
    const approx = K.check(btns, '叠加正态近似', false, () => drawBins());
    const svg = K.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg', role: 'img', 'aria-label': '高尔顿板' }, root);
    const gPeg = K.s('g', null, svg);
    const gBin = K.s('g', null, svg);
    const gBall = K.s('g', null, svg);
    const stats = K.stats(root);
    K.note(root, '每个球都在做 n 次“往左还是往右”的伯努利试验，落在第 k 格 = 往右了 k 次。球多了以后，堆出来的形状就是二项分布 B(n, p)：期望 np、方差 np(1 − p)。n 大、p 不太偏时，它很像正态分布（勾上“叠加正态近似”看看）。', '');

    const top = 30;
    const rowH = () => 220 / nSl.value;
    const dx = () => Math.min(40, (W - 80) / (nSl.value + 1));
    const pegX = (row, j) => W / 2 + (j - row / 2) * dx();
    const binTop = 280;
    const binBottom = H - 30;

    function reset() {
      if (anim) anim.stop();
      anim = null;
      balls = [];
      total = 0;
      counts = new Array(nSl.value + 1).fill(0);
      rng = K.rng(Math.floor(Math.random() * 1e6));
      drawPegs();
      drawBins();
      K.clear(gBall);
    }
    function drawPegs() {
      K.clear(gPeg);
      const n = nSl.value;
      for (let row = 0; row < n; row++) for (let j = 0; j <= row; j++) K.s('circle', { cx: pegX(row, j), cy: top + row * rowH(), r: 3, fill: 'var(--muted)' }, gPeg);
    }
    function drawBins() {
      K.clear(gBin);
      const n = nSl.value;
      const p = pSl.value;
      const w = dx() * 0.8;
      const maxP = Math.max(...counts.map((_, k) => st.binomPmf(k, n, p)));
      const scale = (binBottom - binTop - 20) / maxP;
      counts.forEach((c, k) => {
        const x = W / 2 + (k - n / 2) * dx();
        const theo = st.binomPmf(k, n, p);
        const freq = total ? c / total : 0;
        K.s('rect', { x: x - w / 2, y: binBottom - freq * scale, width: w, height: freq * scale, rx: 2, fill: 'var(--series-1)' }, gBin);
        K.s('rect', { x: x - w / 2, y: binBottom - theo * scale, width: w, height: theo * scale, rx: 2, fill: 'none', stroke: 'var(--series-2)', 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }, gBin);
        K.text(gBin, x, binBottom + 14, String(k), { 'text-anchor': 'middle', 'font-size': 10.5 });
      });
      if (approx.value) {
        const mu = n * p;
        const sd = Math.sqrt(n * p * (1 - p));
        const pts = [];
        for (let x = -0.5; x <= n + 0.5; x += 0.05) pts.push([W / 2 + (x - n / 2) * dx(), binBottom - st.normPdf(x, mu, sd) * scale]);
        K.path(gBin, pts, { stroke: 'var(--text)', 'stroke-width': 2 });
      }
      K.line(gBin, 20, binBottom, W - 20, binBottom, { class: 'soft' });
      K.text(gBin, 20, binTop - 6, '蓝色 = 小球落点的频率；橙色虚线 = 理论概率', { 'font-size': 11 });
      const mean = total ? counts.reduce((s, c, k) => s + c * k, 0) / total : NaN;
      const vr = total > 1 ? counts.reduce((s, c, k) => s + c * (k - mean) ** 2, 0) / (total - 1) : NaN;
      stats.set([
        ['已落下的球', String(total)],
        ['理论期望 np', (n * p).toFixed(2)],
        ['理论方差 np(1−p)', (n * p * (1 - p)).toFixed(2)],
        ['样本均值', Number.isFinite(mean) ? mean.toFixed(2) : '—', 'good'],
        ['样本方差', Number.isFinite(vr) ? vr.toFixed(2) : '—', 'good'],
      ]);
    }
    function drop(k) {
      const n = nSl.value;
      for (let i = 0; i < k; i++) {
        const path = [];
        let right = 0;
        for (let row = 0; row < n; row++) { path.push(right); if (rng() < pSl.value) right += 1; }
        path.push(right);
        balls.push({ path, t: -i * 0.35, el: null });
      }
      if (!anim) anim = K.loop(host, step, 30);
    }
    function step() {
      const n = nSl.value;
      balls.forEach((b) => {
        b.t += 0.5;
        if (b.t < 0) return;
        if (!b.el) b.el = K.s('circle', { r: 4.5, fill: 'var(--series-2)' }, gBall);
        const row = Math.min(Math.floor(b.t), n);
        const f = b.t - Math.floor(b.t);
        const x0 = W / 2 + (b.path[row] - row / 2) * dx();
        const nr = Math.min(row + 1, n);
        const x1 = W / 2 + (b.path[nr] - nr / 2) * dx();
        const x = row >= n ? x0 : x0 + (x1 - x0) * f;
        const y = row >= n ? top + n * rowH() + (b.t - n) * 30 : top + (row + f) * rowH() - 8;
        b.el.setAttribute('cx', x);
        b.el.setAttribute('cy', y);
      });
      const landed = balls.filter((b) => b.t >= n + 1.5);
      landed.forEach((b) => { counts[b.path[n]] += 1; total += 1; b.el && b.el.remove(); });
      if (landed.length) {
        balls = balls.filter((b) => b.t < n + 1.5);
        drawBins();
      }
      if (!balls.length) { anim = null; return false; }
      return true;
    }
    reset();
  },
});
