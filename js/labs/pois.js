// 泊松分布：订单随机到达，平均每分钟 λ 单。数每分钟来了几单，分布就是泊松；它也是“n 很大、p 很小”的二项分布的近似。
Labs.register('pois', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    let seed = 3;
    let minutes = [];
    const ctl = K.row(root);
    const lam = K.slider(ctl, { label: '平均每分钟订单数 λ', min: 0.5, max: 12, step: 0.5, value: 3, fmt: (v) => v.toFixed(1), onInput: () => { minutes = []; simulate(20); } });
    const btns = K.row(root);
    K.button(btns, '再模拟 200 分钟', () => simulate(200), true);
    K.button(btns, '清空', () => { minutes = []; simulate(20); });
    const cmp = K.check(btns, '和二项分布比较（n = 50，p = λ / n）', false, () => draw());
    const tl = K.h('<div></div>', root);
    const p = { box: K.h('<div></div>', root) };
    const stats = K.stats(root);
    K.note(root, '<b>泊松分布</b>描述单位时间（或单位面积）里随机事件发生的次数：每分钟的订单数、每小时的客服来电、每天的故障数。条件是事件之间相互独立、平均发生率稳定。它的期望和方差<b>都等于 λ</b>；事件之间的等待时间服从指数分布。', '');

    function simulate(m) {
      const r = K.rng(seed++);
      for (let i = 0; i < m; i++) {
        const ev = [];
        let t = -Math.log(1 - r()) / lam.value;
        while (t < 1) { ev.push(t); t += -Math.log(1 - r()) / lam.value; }
        minutes.push(ev);
      }
      draw();
    }
    function draw() {
      // 时间轴：前 10 分钟
      tl.innerHTML = '';
      const svg = K.s('svg', { viewBox: '0 0 640 90', class: 'lab-svg', role: 'img', 'aria-label': '订单到达时间轴' }, tl);
      const show = minutes.slice(0, 10);
      show.forEach((ev, i) => {
        const x0 = 20 + i * 60;
        K.s('rect', { x: x0, y: 22, width: 58, height: 30, rx: 4, fill: 'var(--surface-2)' }, svg);
        ev.forEach((t) => K.line(svg, x0 + 2 + t * 54, 24, x0 + 2 + t * 54, 50, { stroke: 'var(--series-2)', 'stroke-width': 2 }));
        K.text(svg, x0 + 29, 70, `${ev.length} 单`, { 'text-anchor': 'middle', 'font-size': 11, class: 'strong' });
        K.text(svg, x0 + 29, 16, `第 ${i + 1} 分钟`, { 'text-anchor': 'middle', 'font-size': 10 });
      });
      // 分布
      const L = lam.value;
      const kmax = Math.ceil(L + 4 * Math.sqrt(L) + 3);
      const counts = new Array(kmax + 1).fill(0);
      minutes.forEach((ev) => { if (ev.length <= kmax) counts[ev.length] += 1; });
      const n = minutes.length;
      let ymax = 0;
      for (let k = 0; k <= kmax; k++) ymax = Math.max(ymax, st.poisPmf(k, L), n ? counts[k] / n : 0);
      p.box.innerHTML = '';
      const pl = K.plot(p.box, { x: [-0.5, kmax + 0.5], y: [0, ymax * 1.15], w: 640, h: 260, xticks: K.ticks(0, kmax, 8).filter(Number.isInteger), xlabel: '每分钟订单数 k', ylabel: '概率', ny: 3, fy: (v) => v.toFixed(2), label: '泊松分布' });
      const g = pl.layer('g', true);
      const bw = Math.min(26, (pl.sx(1) - pl.sx(0)) * 0.55);
      for (let k = 0; k <= kmax; k++) {
        K.s('rect', { x: pl.sx(k) - bw / 2, y: pl.sy(n ? counts[k] / n : 0), width: bw, height: pl.sy(0) - pl.sy(n ? counts[k] / n : 0), rx: 2, fill: 'var(--series-1)', opacity: 0.8 }, g);
        K.marker(g, 'diamond', pl.sx(k), pl.sy(st.poisPmf(k, L)), 5, { fill: 'var(--series-2)', stroke: 'var(--surface)', 'stroke-width': 1.5 });
        if (cmp.value) K.marker(g, 'circle', pl.sx(k), pl.sy(st.binomPmf(k, 50, Math.min(1, L / 50))), 3.5, { fill: 'var(--series-3)' });
      }
      K.legend(p.box, [['模拟出的频率', 0, 'square'], ['泊松理论概率', 1]].concat(cmp.value ? [['二项 B(50, λ/50)', 2]] : []));
      const all = minutes.map((e) => e.length);
      stats.set([
        ['模拟分钟数', String(n)],
        ['理论期望 = 方差 = λ', L.toFixed(1)],
        ['样本均值', n ? st.mean(all).toFixed(2) : '—', 'good'],
        ['样本方差', n > 1 ? st.var(all).toFixed(2) : '—', 'good'],
      ]);
    }
    simulate(20);
  },
});
