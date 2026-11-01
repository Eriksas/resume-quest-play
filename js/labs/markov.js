// 马尔可夫链：用户在“活跃 / 沉默 / 流失”三个状态之间流转。下一步去哪只看现在在哪（无记忆性）。
Labs.register('markov', {
  render(host, K) {
    const root = K.panel(host);
    const NAMES = ['活跃', '沉默', '流失'];
    const c1 = K.row(root);
    const keep = K.slider(c1, { label: '活跃 → 活跃（留存）', min: 0.5, max: 0.95, step: 0.05, value: 0.8, fmt: (v) => v.toFixed(2), onInput: () => reset() });
    const wake = K.slider(c1, { label: '沉默 → 活跃（召回）', min: 0, max: 0.6, step: 0.05, value: 0.3, fmt: (v) => v.toFixed(2), onInput: () => reset() });
    const back = K.slider(c1, { label: '流失 → 活跃（回流）', min: 0, max: 0.3, step: 0.01, value: 0.05, fmt: (v) => v.toFixed(2), onInput: () => reset() });
    const btns = K.row(root);
    K.button(btns, '走 1 步', () => step(1), true);
    K.button(btns, '走 10 步', () => step(10));
    K.button(btns, '从头开始', () => reset());
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const tbl = K.h('<div class="lab-scroll"></div>', root);
    const stats = K.stats(root);
    const note = K.note(root, '');
    K.note(root, '<b>马尔可夫链</b>：系统在几个状态之间按概率跳转，<b>下一步去哪只取决于现在在哪</b>，和之前怎么走过来的无关（无记忆性，也叫马尔可夫性）。所有跳转概率写成<b>转移矩阵 P</b>，每一行加起来等于 1。如果现在各状态的人数占比是 π，下一步就是 π × P。走很多步以后，如果占比稳定下来不再变，就叫<b>稳态分布</b>（满足 π = πP）。业务上可以用来描述用户状态流转、预测未来的活跃 / 流失占比。<span class="muted">（这里的转移概率是示例数字。）</span>', '');

    let hist = [];
    let token = 0;
    let rr = K.rng(4);
    function P() {
      const a = keep.value;
      const w = wake.value;
      const b = back.value;
      return [
        [a, (1 - a) * 0.8, (1 - a) * 0.2],
        [w, 1 - w - 0.2, 0.2],
        [b, 0, 1 - b],
      ];
    }
    const mul = (pi, M) => [0, 1, 2].map((j) => pi.reduce((s, v, i) => s + v * M[i][j], 0));
    function stationary(M) {
      let pi = [1, 0, 0];
      for (let i = 0; i < 5000; i++) pi = mul(pi, M);
      return pi;
    }
    function reset() {
      hist = [[1, 0, 0]];
      token = 0;
      rr = K.rng(4);
      draw();
    }
    function step(k) {
      const M = P();
      for (let i = 0; i < k; i++) {
        hist.push(mul(hist[hist.length - 1], M));
        const u = rr();
        let acc = 0;
        let nx = 2;
        for (let j = 0; j < 3; j++) { acc += M[token][j]; if (u < acc) { nx = j; break; } }
        token = nx;
      }
      draw();
    }
    function diagram(M) {
      left.innerHTML = '';
      const svg = K.s('svg', { viewBox: '0 0 320 300', class: 'lab-svg', role: 'img', 'aria-label': '状态转移图' }, left);
      const defs = K.s('defs', null, svg);
      const mk = K.s('marker', { id: 'mk-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 9, markerHeight: 9, markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse' }, defs);
      K.s('path', { d: 'M0,0L10,5L0,10Z', fill: 'var(--muted)' }, mk);
      const pos = [[160, 78], [60, 218], [260, 218]];
      const R = 32;
      const edge = (i, j, bend) => {
        if (M[i][j] <= 0) return;
        const [x1, y1] = pos[i];
        const [x2, y2] = pos[j];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const L = Math.hypot(dx, dy);
        const ux = dx / L;
        const uy = dy / L;
        const nx = -uy * bend;
        const ny = ux * bend;
        const sx = x1 + ux * R + nx * 0.25;
        const sy = y1 + uy * R + ny * 0.25;
        const ex = x2 - ux * (R + 2) + nx * 0.25;
        const ey = y2 - uy * (R + 2) + ny * 0.25;
        const cx = (x1 + x2) / 2 + nx;
        const cy = (y1 + y2) / 2 + ny;
        K.s('path', { d: `M${sx},${sy}Q${cx},${cy} ${ex},${ey}`, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1 + M[i][j] * 4, 'marker-end': 'url(#mk-arrow)', opacity: 0.8 }, svg);
        const lx = 0.25 * sx + 0.5 * cx + 0.25 * ex;
        const ly = 0.25 * sy + 0.5 * cy + 0.25 * ey;
        K.text(svg, lx + nx * 0.35, ly + ny * 0.35 + 4, M[i][j].toFixed(2), { 'text-anchor': 'middle', 'font-size': 11, class: 'strong' });
      };
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) edge(i, j, 22);
      pos.forEach(([x, y], i) => {
        const self = M[i][i];
        if (self > 0) {
          const oy = i === 0 ? -1 : 1;
          K.s('path', { d: `M${x - 14},${y + oy * (R - 4)} C${x - 34},${y + oy * (R + 34)} ${x + 34},${y + oy * (R + 34)} ${x + 14},${y + oy * (R - 2)}`, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1 + self * 4, 'marker-end': 'url(#mk-arrow)', opacity: 0.8 }, svg);
          K.text(svg, x, y + oy * (R + 34) + (oy > 0 ? 4 : 2), self.toFixed(2), { 'text-anchor': 'middle', 'font-size': 11, class: 'strong' });
        }
        K.s('circle', { cx: x, cy: y, r: R, fill: K.color(i), opacity: token === i ? 1 : 0.55, stroke: token === i ? 'var(--text)' : 'none', 'stroke-width': 3 }, svg);
        K.text(svg, x, y + 5, NAMES[i], { 'text-anchor': 'middle', style: 'fill:#fff;font-weight:700' });
      });
      K.caption(left, '黑圈 = 一个随机用户现在所在的状态');
    }
    function chart() {
      right.innerHTML = '';
      const T = Math.max(10, hist.length - 1);
      const p = K.plot(right, { x: [0, T], y: [0, 1], w: 320, h: 270, xlabel: '第几步', yticks: [0, 0.25, 0.5, 0.75, 1], fy: (v) => Math.round(v * 100) + '%', label: '各状态占比随步数变化' });
      const g = p.layer('g', true);
      [0, 1, 2].forEach((k) => {
        K.path(g, hist.map((pi, t) => [p.sx(t), p.sy(pi[k])]), { stroke: K.color(k), 'stroke-width': 2.5 });
        const last = hist[hist.length - 1][k];
        K.marker(g, K.SHAPES[k], p.sx(hist.length - 1), p.sy(last), 4, { fill: K.color(k) });
      });
      K.caption(right, '从 100% 活跃出发，各状态占比的变化');
    }
    function draw() {
      const M = P();
      diagram(M);
      chart();
      tbl.innerHTML = `<table class="lab-table"><thead><tr><th>转移矩阵 P（行 = 现在，列 = 下一步）</th>${NAMES.map((s) => `<th>→ ${s}</th>`).join('')}</tr></thead><tbody>${M.map((row, i) => `<tr><th>${NAMES[i]}</th>${row.map((v) => `<td>${v.toFixed(2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      const cur = hist[hist.length - 1];
      const pi = stationary(M);
      stats.set([
        ['已走步数', String(hist.length - 1)],
        ['当前占比（活跃 / 沉默 / 流失）', cur.map((v) => K.pct(v, 0)).join(' / ')],
        ['稳态分布', pi.map((v) => K.pct(v, 0)).join(' / '), 'good'],
      ]);
      note.className = 'lab-note ' + (back.value === 0 ? 'warn' : '');
      note.innerHTML = back.value === 0
        ? '“流失 → 活跃”是 0：流失成了<b>吸收态</b>，进去就出不来，走得足够久，所有人最后都会流失。'
        : '点“走 10 步”几次：不管从哪出发，各状态的占比最后都会稳定在<b>稳态分布</b>附近。把“流失 → 活跃”拖到 0 看看会怎样。';
    }
    reset();
  },
});
