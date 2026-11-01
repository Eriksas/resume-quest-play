// 决策树：调最大深度，一层层长出一棵 CART 树；点节点看它切在哪、为什么这样切。
Labs.register('tree', {
  render(host, K) {
    const root = K.panel(host);
    const rule = (a, b) => ((a > 0.55 && b > 0.35) || (a <= 0.55 && b > 0.75) ? 1 : 0);
    const makeSet = (seed, n, noise) => {
      const r = K.rng(seed);
      return Array.from({ length: n }, () => {
        const a = r();
        const b = r();
        let y = rule(a, b);
        if (r() < noise) y = 1 - y;
        return { f: [a, b], y };
      });
    };
    const train = makeSet(5, 80, 0.14);
    const test = makeSet(77, 300, 0.14);
    const FN = ['x₁', 'x₂'];
    let tree = null;
    let sel = null;

    const ctl = K.row(root);
    const depth = K.slider(ctl, { label: '最大深度', min: 0, max: 8, step: 1, value: 2, onInput: () => build() });
    const minLeaf = K.slider(ctl, { label: '叶子最少样本', min: 1, max: 15, step: 1, value: 1, onInput: () => build() });
    const ctl2 = K.row(root);
    const crit = K.seg(ctl2, [{ value: 'gini', label: '基尼不纯度' }, { value: 'entropy', label: '信息熵' }], 'gini', () => build());
    K.button(ctl2, '再长一层', () => depth.set(Math.min(8, depth.value + 1)), true);
    K.button(ctl2, '砍回一层', () => depth.set(Math.max(0, depth.value - 1)));

    const grid = K.h('<div class="lab-grid2"></div>', root);
    const left = K.h('<div></div>', grid);
    const right = K.h('<div></div>', grid);
    const p = K.plot(left, { x: [0, 1], y: [0, 1], w: 420, h: 380, xlabel: 'x₁', ylabel: 'x₂', label: '训练数据和决策树切出的区域' });
    const gReg = p.layer('regions', true);
    const gSel = p.layer('sel', true);
    const gPts = p.layer('pts');
    K.legend(left, [['类别 0', 0], ['类别 1', 1, 'square']]);
    const treeWrap = K.h('<div class="lab-scroll"></div>', right);
    K.caption(right, '点树上的节点，看它管哪一块区域、为什么这样切。');

    const stats = K.stats(root);
    const info = K.h('<div class="lab-note"></div>', root);
    const scanHost = K.h('<div></div>', root);
    const note = K.note(root, '', '');

    function build() {
      tree = K.ml.cart(train.map((q) => ({ f: q.f, y: q.y })), { maxDepth: depth.value, minLeaf: minLeaf.value, crit: crit.value });
      sel = tree;
      drawAll();
    }

    const leaves = (n) => (n.leaf ? [n] : leaves(n.left).concat(leaves(n.right)));
    const maxD = (n) => (n.leaf ? n.depth : Math.max(maxD(n.left), maxD(n.right)));
    function boundsOf(target) {
      let found = null;
      (function walk(n, b) {
        if (n === target) found = b;
        if (n.leaf || found) return;
        const L = b.slice();
        const R = b.slice();
        if (n.feat === 0) { L[1] = n.thr; R[0] = n.thr; } else { L[3] = n.thr; R[2] = n.thr; }
        walk(n.left, L);
        walk(n.right, R);
      })(tree, [0, 1, 0, 1]);
      return found;
    }
    function pathOf(target) {
      const out = [];
      (function walk(n, acc) {
        if (n === target) { out.push(...acc); return true; }
        if (n.leaf) return false;
        return walk(n.left, acc.concat(`${FN[n.feat]} ≤ ${n.thr.toFixed(2)}`)) || walk(n.right, acc.concat(`${FN[n.feat]} > ${n.thr.toFixed(2)}`));
      })(tree, []);
      return out;
    }

    function drawAll() {
      // 区域
      K.clear(gReg);
      leaves(tree).forEach((lf) => {
        const b = boundsOf(lf);
        const c = lf.p >= 0.5 ? 1 : 0;
        const purity = Math.abs(lf.p - 0.5) * 2;
        K.s('rect', { x: p.sx(b[0]), y: p.sy(b[3]), width: p.sx(b[1]) - p.sx(b[0]), height: p.sy(b[2]) - p.sy(b[3]), fill: K.color(c), opacity: 0.08 + 0.14 * purity, stroke: 'var(--muted)', 'stroke-opacity': 0.5 }, gReg);
      });
      K.drawPoints(gPts, p, train.map((q) => ({ x: q.f[0], y: q.f[1], c: q.y })), { r: 4.5, shapes: true });
      drawTree();
      drawSel();
      const acc = (set) => K.mean(set.map((q) => ((K.ml.treeProb(tree, q.f) >= 0.5 ? 1 : 0) === q.y ? 1 : 0)));
      const tr = acc(train);
      const te = acc(test);
      stats.set([
        ['训练准确率', K.pct(tr)],
        ['测试准确率（300 个新样本）', K.pct(te), te < tr - 0.08 ? 'bad' : 'good'],
        ['叶子数', String(leaves(tree).length)],
        ['实际深度', String(maxD(tree))],
      ]);
      const under = tr < 0.85;
      const over = !under && tr - te >= 0.1;
      if (under) note.innerHTML = `树太浅：连训练数据都只对了 ${K.pct(tr)}，规律还没学到，这是<b>欠拟合</b>。点“再长一层”。`;
      else if (over) note.innerHTML = `训练准确率 ${K.pct(tr)}，新样本只有 ${K.pct(te)}：树在追着个别噪声点切出小格子，这是<b>过拟合</b>。限制最大深度、调大“叶子最少样本”或者剪枝都能缓解。`;
      else note.innerHTML = '深度合适：训练和测试准确率接近。数据里有一部分标签是随机翻转的噪声，所以准确率到不了 100% 才正常。';
      note.className = 'lab-note ' + (under || over ? 'warn' : 'good');
    }

    function drawTree() {
      treeWrap.innerHTML = '';
      const lv = leaves(tree);
      const D = maxD(tree);
      const gapX = 84;
      const gapY = 72;
      const W = Math.max(420, lv.length * gapX + 20);
      const H = (D + 1) * gapY + 16;
      const svg = K.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg', role: 'img', 'aria-label': '决策树结构' }, treeWrap);
      svg.style.minWidth = Math.min(W, lv.length * 64 + 20) + 'px';
      const pos = new Map();
      let i = 0;
      (function place(n) {
        if (n.leaf) {
          pos.set(n, { x: 10 + gapX / 2 + i * gapX, y: 12 + n.depth * gapY });
          i += 1;
          return;
        }
        place(n.left);
        place(n.right);
        pos.set(n, { x: (pos.get(n.left).x + pos.get(n.right).x) / 2, y: 12 + n.depth * gapY });
      })(tree);
      const gE = K.s('g', null, svg);
      const gN = K.s('g', null, svg);
      (function edges(n) {
        if (n.leaf) return;
        [['left', '是'], ['right', '否']].forEach(([side, lab]) => {
          const a = pos.get(n);
          const b = pos.get(n[side]);
          K.line(gE, a.x, a.y + 36, b.x, b.y, { class: 'soft', 'stroke-width': 1.5 });
          K.text(gE, (a.x + b.x) / 2 + (side === 'left' ? -10 : 4), (a.y + 36 + b.y) / 2, lab, { 'font-size': 11 });
          edges(n[side]);
        });
      })(tree);
      pos.forEach((q, n) => {
        const g = K.s('g', { transform: `translate(${q.x - 38},${q.y})`, style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': n.leaf ? '叶子节点' : `${FN[n.feat]} 小于等于 ${n.thr.toFixed(2)}` }, gN);
        const c = n.p >= 0.5 ? 1 : 0;
        K.s('rect', { width: 76, height: 36, rx: 7, fill: n.leaf ? K.color(c) : 'var(--surface-2)', 'fill-opacity': n.leaf ? 0.18 + 0.3 * Math.abs(n.p - 0.5) * 2 : 1, stroke: n === sel ? 'var(--primary)' : 'var(--border)', 'stroke-width': n === sel ? 2.5 : 1 }, g);
        K.text(g, 38, 15, n.leaf ? `预测 ${c}` : `${FN[n.feat]} ≤ ${n.thr.toFixed(2)}`, { 'text-anchor': 'middle', class: 'strong', 'font-size': 11.5 });
        K.text(g, 38, 29, `n=${n.n} [${n.n0}|${n.n1}]`, { 'text-anchor': 'middle', 'font-size': 10.5 });
        const pick = () => { sel = n; drawTree(); drawSel(); };
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    }

    function drawSel() {
      K.clear(gSel);
      const b = boundsOf(sel);
      K.s('rect', { x: p.sx(b[0]), y: p.sy(b[3]), width: p.sx(b[1]) - p.sx(b[0]), height: p.sy(b[2]) - p.sy(b[3]), fill: 'none', stroke: 'var(--primary)', 'stroke-width': 3 }, gSel);
      if (!sel.leaf) {
        const v = sel.thr;
        if (sel.feat === 0) K.line(gSel, p.sx(v), p.sy(b[2]), p.sx(v), p.sy(b[3]), { stroke: 'var(--text)', 'stroke-width': 2.5, 'stroke-dasharray': '6 3' });
        else K.line(gSel, p.sx(b[0]), p.sy(v), p.sx(b[1]), p.sy(v), { stroke: 'var(--text)', 'stroke-width': 2.5, 'stroke-dasharray': '6 3' });
      }
      const path = pathOf(sel);
      const name = crit.value === 'gini' ? '基尼不纯度' : '信息熵';
      info.innerHTML = `<b>${path.length ? '规则：' + path.join(' 且 ') : '根节点：全部训练样本'}</b><br>样本 ${sel.n} 个（类别 0：${sel.n0}，类别 1：${sel.n1}），${name} ${sel.imp.toFixed(3)}。` +
        (sel.leaf
          ? (sel.n0 && sel.n1 ? '这是叶子：已经到了深度或样本数的限制，按多数类预测。' : '这是叶子：里面只剩一类，不用再切。')
          : `在这里选了 <b>${FN[sel.feat]} ≤ ${sel.thr.toFixed(2)}</b>：它让${name}下降 ${sel.gain.toFixed(3)}，是所有候选切法里最多的。`);
      drawScan();
    }

    function drawScan() {
      scanHost.innerHTML = '';
      if (sel.leaf) return;
      const name = crit.value === 'gini' ? '基尼' : '熵';
      K.h(`<h3 class="sub-h">这个节点的所有候选切法：切在哪里，${name}下降多少</h3>`, scanHost);
      const scans = [0, 1].map((j) => K.ml.splitScan(sel.pts, j, crit.value, minLeaf.value));
      const top = Math.max(0.02, ...scans.flat().map((s) => s.gain));
      const ps = K.plot(scanHost, { x: [0, 1], y: [0, top * 1.15], w: 640, h: 200, xlabel: '切分阈值', ylabel: `${name}下降`, ny: 3, fy: (v) => v.toFixed(2), label: '候选切分点的不纯度下降' });
      const g = ps.layer('scan', true);
      scans.forEach((s, j) => {
        if (!s.length) return;
        K.path(g, s.map((c) => [ps.sx(c.thr), ps.sy(c.gain)]), { stroke: K.color(j + 2), 'stroke-width': 2 });
        s.forEach((c) => K.marker(g, j ? 'square' : 'circle', ps.sx(c.thr), ps.sy(c.gain), 2.6, { fill: K.color(j + 2) }));
      });
      K.marker(g, 'diamond', ps.sx(sel.thr), ps.sy(sel.gain), 7, { fill: 'var(--text)', stroke: 'var(--surface)', 'stroke-width': 2 });
      K.text(g, Math.min(ps.sx(sel.thr) + 10, ps.W - 110), ps.sy(sel.gain) + 4, `最佳：${FN[sel.feat]} = ${sel.thr.toFixed(2)}`, { class: 'strong' });
      K.legend(scanHost, [['按 x₁ 切', 2], ['按 x₂ 切', 3, 'square']]);
    }

    build();
  },
});
