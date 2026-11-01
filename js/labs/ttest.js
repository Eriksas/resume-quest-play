// t 检验 / z 检验：① 两组均值的 t 检验；② 两组转化率的 z 检验（可以代入 X5 的数据）；③ 两类错误和功效。
Labs.register('ttest', {
  render(host, K) {
    const st = K.st;
    const root = K.panel(host);
    const ctl = K.row(root);
    const mode = K.seg(ctl, [{ value: 't', label: '① 两组均值：t 检验' }, { value: 'z', label: '② 两组转化率：z 检验' }, { value: 'pow', label: '③ 两类错误与功效' }], 't', () => show());
    const panes = { t: K.h('<div class="lab"></div>', root), z: K.h('<div class="lab"></div>', root), pow: K.h('<div class="lab"></div>', root) };
    function show() { Object.keys(panes).forEach((k) => (panes[k].hidden = k !== mode.value)); }

    // 画一条分布曲线 + 拒绝域 + 观测值
    function densityPlot(box, pdf, crit, obs, tail, label, xr, ref) {
      box.innerHTML = '';
      const [x0, x1] = xr || [-5, 5];
      const p = K.plot(box, { x: [x0, x1], y: [0, 0.45], w: 640, h: 220, ylabels: false, grid: false, label });
      const g = p.layer('g', true);
      const reg = (a, b) => {
        const pts = [[p.sx(a), p.sy(0)]];
        for (let x = a; x <= b + 1e-9; x += (x1 - x0) / 400) pts.push([p.sx(x), p.sy(pdf(x))]);
        pts.push([p.sx(b), p.sy(0)]);
        K.path(g, pts, { fill: 'var(--bad)', 'fill-opacity': 0.25, stroke: 'none' });
      };
      if (tail === 'two') { reg(x0, -crit); reg(crit, x1); } else reg(crit, x1);
      if (ref) {
        const rp = [];
        for (let x = x0; x <= x1; x += (x1 - x0) / 400) rp.push([p.sx(x), p.sy(ref(x))]);
        K.path(g, rp, { stroke: 'var(--muted)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
      }
      const pts = [];
      for (let x = x0; x <= x1; x += (x1 - x0) / 400) pts.push([p.sx(x), p.sy(pdf(x))]);
      K.path(g, pts, { stroke: 'var(--series-1)', 'stroke-width': 2.5 });
      const ox = K.clamp(obs, x0, x1);
      K.line(g, p.sx(ox), p.P.t, p.sx(ox), p.sy(0), { stroke: 'var(--series-2)', 'stroke-width': 3 });
      K.text(g, Math.min(p.sx(ox) + 6, p.W - 150), p.P.t + 14, `观测值 = ${obs.toFixed(2)}${obs > x1 || obs < x0 ? '（出了图）' : ''}`, { class: 'strong' });
      K.line(g, p.sx(crit), p.P.t + 22, p.sx(crit), p.sy(0), { stroke: 'var(--bad)', 'stroke-dasharray': '3 3', 'stroke-width': 1.2 });
      K.text(g, p.sx(crit) - 4, p.P.t + 34, `临界值 ${crit.toFixed(2)}`, { 'font-size': 11, 'text-anchor': 'end' });
      return p;
    }

    // ---------- ① t 检验 ----------
    (() => {
      const box = panes.t;
      const r = K.rng(42);
      const zA = Array.from({ length: 200 }, () => K.gauss(r));
      const zB = Array.from({ length: 200 }, () => K.gauss(r));
      const c1 = K.row(box);
      const diff = K.slider(c1, { label: '真实均值差 Δ', min: 0, max: 3, step: 0.1, value: 0.8, fmt: (v) => v.toFixed(1), onInput: () => draw() });
      const sdv = K.slider(c1, { label: '组内标准差 σ', min: 0.5, max: 4, step: 0.1, value: 2, fmt: (v) => v.toFixed(1), onInput: () => draw() });
      const c2 = K.row(box);
      const nSl = K.slider(c2, { label: '每组样本量 n', min: 5, max: 200, step: 5, value: 20, onInput: () => draw() });
      const welch = K.check(c2, 'Welch（不假设方差相等）', true, () => draw());
      const tail = K.seg(c2, [{ value: 'two', label: '双尾' }, { value: 'one', label: '单尾（B > A）' }], 'two', () => draw());
      const dots = K.h('<div></div>', box);
      const dens = K.h('<div></div>', box);
      K.legend(box, [['t 分布（原假设成立时）', 0, 'line'], ['标准正态（对比用）', -1, 'line'], ['拒绝域（α = 0.05）', 'var(--bad)', 'square'], ['观测到的 t', 1, 'line']]);
      const stats = K.stats(box);
      const note = K.note(box, '');
      function draw() {
        const n = nSl.value;
        const A = zA.slice(0, n).map((z) => 10 + sdv.value * z);
        const B = zB.slice(0, n).map((z) => 10 + diff.value + sdv.value * z);
        const res = st.ttest(A, B, !welch.value);
        dots.innerHTML = '';
        const lo = Math.min(...A, ...B) - 1;
        const hi = Math.max(...A, ...B) + 1;
        const p = K.plot(dots, { x: [lo, hi], y: [0, 2], w: 640, h: 120, yticks: [], ylabels: false, grid: false, label: '两组样本' });
        const g = p.layer('g', true);
        const rr = K.rng(7);
        [[A, 0, 0.5], [B, 1, 1.4]].forEach(([arr, c, y]) => {
          arr.forEach((v) => K.marker(g, c ? 'square' : 'circle', p.sx(v), p.sy(y + (rr() - 0.5) * 0.4), 3.5, { fill: K.color(c), opacity: 0.7 }));
          const m = st.mean(arr);
          K.line(g, p.sx(m), p.sy(y - 0.35), p.sx(m), p.sy(y + 0.35), { stroke: 'var(--text)', 'stroke-width': 3 });
        });
        K.text(p.svg, p.P.l + 4, p.sy(0.5) + 4, 'A', { class: 'strong' });
        K.text(p.svg, p.P.l + 4, p.sy(1.4) + 4, 'B', { class: 'strong' });
        const crit = tail.value === 'two' ? st.tInv(0.975, res.df) : st.tInv(0.95, res.df);
        const pv = tail.value === 'two' ? res.p : st.tSf(res.t, res.df);
        densityPlot(dens, (x) => st.tPdf(x, res.df), crit, res.t, tail.value, 't 分布和拒绝域', [-5, 5], (x) => st.normPdf(x));
        const tc = st.tInv(0.975, res.df);
        stats.set([
          ['样本均值差 B − A', res.diff.toFixed(2)],
          ['标准误 SE', res.se.toFixed(3)],
          ['t = 差 / SE', res.t.toFixed(2)],
          ['自由度', res.df.toFixed(1)],
          ['p 值', st.fmtP(pv), pv < 0.05 ? 'good' : ''],
          ['95% 置信区间', `[${(res.diff - tc * res.se).toFixed(2)}, ${(res.diff + tc * res.se).toFixed(2)}]`],
        ]);
        note.className = 'lab-note ' + (pv < 0.05 ? 'good' : '');
        note.innerHTML = (pv < 0.05 ? `${st.pEq(pv)}，低于 0.05，<b>拒绝原假设</b>：两组均值有显著差异。` : `${st.pEq(pv)}，不低于 0.05，<b>证据不足以拒绝原假设</b>（不等于“证明了两组一样”）。`) +
          ' t 统计量 = 均值差 ÷ 标准误：差越大、组内波动越小、样本越多，t 越大。小样本时 t 分布比正态分布“尾巴更厚”，临界值更大；n 大了以后两者几乎一样。';
      }
      draw();
    })();

    // ---------- ② z 检验（比例） ----------
    (() => {
      const box = panes.z;
      const NS = [100, 500, 1000, 5000, 20000, 100000];
      let custom = null;
      const c1 = K.row(box);
      const pa = K.slider(c1, { label: '对照组转化率', min: 1, max: 99, step: 0.01, value: 10, fmt: (v) => v.toFixed(2) + '%', onInput: () => { custom = null; draw(); } });
      const pb = K.slider(c1, { label: '实验组转化率', min: 1, max: 99, step: 0.01, value: 12, fmt: (v) => v.toFixed(2) + '%', onInput: () => { custom = null; draw(); } });
      const c2 = K.row(box);
      const nSl = K.slider(c2, { label: '每组人数', min: 0, max: 5, step: 1, value: 2, fmt: (i) => NS[i].toLocaleString(), onInput: () => { custom = null; draw(); } });
      K.button(c2, '代入 X5 短信实验的数据', () => { custom = [100058, 99981]; pa.set(60.33, true); pb.set(63.65, true); nSl.set(5, true); draw(); }, true);
      const dens = K.h('<div></div>', box);
      const stats = K.stats(box);
      const note = K.note(box, '');
      function draw() {
        const p1 = pa.value / 100;
        const p2 = pb.value / 100;
        const [n1, n2] = custom || [NS[nSl.value], NS[nSl.value]];
        const d = p2 - p1;
        const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
        const z = d / se;
        const pv = 2 * st.normSf(Math.abs(z));
        densityPlot(dens, (x) => st.normPdf(x), 1.96, custom ? 15.32 : z, 'two', '标准正态和拒绝域', [-6, 6]);
        if (custom) {
          stats.set([
            ['对照 / 实验人数', '100,058 / 99,981'],
            ['购买率差（ATE）', '3.32 个百分点'],
            ['标准误 SE', '0.217 个百分点'],
            ['z', '15.32'],
            ['p 值', '< 0.0001', 'good'],
            ['95% 置信区间', '[2.90, 3.75] 个百分点'],
          ]);
          note.innerHTML = '<b>这就是你 X5 项目的结果</b>（上面是项目里的原始数字）：实验组购买率 63.65%、对照组 60.33%，差 3.32 个百分点，标准误 0.217 个百分点，z = 15.32，95% 置信区间 [2.90, 3.75]，相对提升 5.5%。滑块上的转化率四舍五入到了两位小数，直接按滑块算会差一点点（z ≈ 15.30），面试时说项目里的数字。';
          return;
        }
        stats.set([
          ['两组人数', `${n1.toLocaleString()} / ${n2.toLocaleString()}`],
          ['转化率差', (d * 100).toFixed(2) + ' 个百分点'],
          ['标准误 SE', (se * 100).toFixed(3) + ' 个百分点'],
          ['z = 差 / SE', z.toFixed(2)],
          ['p 值', st.fmtP(pv), pv < 0.05 ? 'good' : ''],
          ['95% 置信区间', `[${((d - 1.96 * se) * 100).toFixed(2)}, ${((d + 1.96 * se) * 100).toFixed(2)}] 个百分点`],
        ]);
        note.innerHTML = '同样差 2 个百分点：每组 100 人时远不显著，每组 5000 人时就很显著。' +
          ' 两比例 z 检验：SE = √(p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂)，z = 差 ÷ SE。样本大时，比例的抽样分布近似正态（中心极限定理），所以用 z 而不是 t。';
      }
      draw();
    })();

    // ---------- ③ 两类错误和功效 ----------
    (() => {
      const box = panes.pow;
      const c1 = K.row(box);
      const eff = K.slider(c1, { label: '真实效应（以标准差为单位）', min: 0, max: 1.5, step: 0.05, value: 0.4, fmt: (v) => v.toFixed(2), onInput: () => draw() });
      const nSl = K.slider(c1, { label: '每组样本量 n', min: 5, max: 300, step: 5, value: 50, onInput: () => draw() });
      const c2 = K.row(box);
      const alpha = K.seg(c2, [{ value: 0.01, label: 'α = 0.01' }, { value: 0.05, label: 'α = 0.05' }, { value: 0.1, label: 'α = 0.10' }], 0.05, () => draw());
      const plotBox = K.h('<div></div>', box);
      K.legend(box, [['原假设成立时的检验统计量', 0, 'line'], ['真实效应存在时的检验统计量', 1, 'line'], ['α：误报（第一类错误）', -1, 'square'], ['β：漏报（第二类错误）', 3, 'square']]);
      const stats = K.stats(box);
      K.note(box, '<b>第一类错误 α</b>：原假设是真的，却拒绝了它（误报：以为策略有效，其实没效）。<b>第二类错误 β</b>：真的有效果，却没检测出来（漏报）。<b>功效 = 1 − β</b>。样本越大、真实效应越大、噪声越小，功效越高；把 α 定得越严，功效越低。<b>最小可检测效应 MDE ≈ (1.96 + 0.84) × 标准误</b>，就是在 α = 0.05、功效 80% 时能可靠检测到的最小效应。', '');
      function draw() {
        const a = Number(alpha.value);
        const shift = eff.value * Math.sqrt(nSl.value / 2);
        const crit = st.normInv(1 - a / 2);
        plotBox.innerHTML = '';
        const x0 = -4;
        const x1 = Math.max(6, shift + 4);
        const p = K.plot(plotBox, { x: [x0, x1], y: [0, 0.45], w: 640, h: 240, ylabels: false, grid: false, label: '两类错误' });
        const g = p.layer('g', true);
        const area = (f, a0, b0, col) => {
          const pts = [[p.sx(a0), p.sy(0)]];
          for (let x = a0; x <= b0 + 1e-9; x += 0.02) pts.push([p.sx(x), p.sy(f(x))]);
          pts.push([p.sx(b0), p.sy(0)]);
          K.path(g, pts, { fill: col, 'fill-opacity': 0.3, stroke: 'none' });
        };
        const h0 = (x) => st.normPdf(x);
        const h1 = (x) => st.normPdf(x, shift, 1);
        area(h0, crit, x1, 'var(--muted)');
        area(h0, x0, -crit, 'var(--muted)');
        area(h1, Math.max(x0, -crit), crit, 'var(--series-4)');
        [[h0, 0], [h1, 1]].forEach(([f, c]) => {
          const pts = [];
          for (let x = x0; x <= x1; x += 0.02) pts.push([p.sx(x), p.sy(f(x))]);
          K.path(g, pts, { stroke: K.color(c), 'stroke-width': 2.5 });
        });
        K.line(g, p.sx(crit), p.P.t, p.sx(crit), p.sy(0), { stroke: 'var(--text)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 });
        K.text(g, p.sx(crit) + 4, p.P.t + 12, `临界值 ${crit.toFixed(2)}`, { 'font-size': 11 });
        const beta = st.normCdf(crit - shift) - st.normCdf(-crit - shift);
        stats.set([
          ['α（误报率）', a.toFixed(2)],
          ['β（漏报率）', beta.toFixed(3), beta > 0.2 ? 'bad' : ''],
          ['功效 1 − β', (1 - beta).toFixed(3), 1 - beta >= 0.8 ? 'good' : 'bad'],
        ]);
      }
      draw();
    })();
    show();
  },
});
