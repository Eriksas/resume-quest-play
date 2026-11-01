// LightGBM：按层生长 vs 按叶子生长；直方图分桶减少候选切分点。
Labs.register('lgbm', {
  render(host, K) {
    const root = K.panel(host);
    K.h('<h3 class="sub-h">树怎么长：按层（level-wise） vs 按叶子（leaf-wise）</h3>', root);
    K.note(root, '每个叶子上的数字是“再切一刀能让损失下降多少”（示意数字）。两边都只允许切同样多刀，看谁把损失降得更多。', '');
    // 示意：每个节点再切一刀的收益
    const r = K.rng(8);
    const gainOf = new Map();
    const gain = (id) => {
      if (!gainOf.has(id)) gainOf.set(id, Math.round((id === 'r' ? 60 : 4 + r() * 40) * (1 / (1 + 0.25 * id.length))));
      return gainOf.get(id);
    };
    let budget = 0;
    const ctl = K.row(root);
    K.button(ctl, '两边各切一刀', () => { budget = Math.min(budget + 1, 7); draw(); }, true);
    K.button(ctl, '重来', () => { budget = 0; draw(); });
    const grid = K.h('<div class="lab-grid2"></div>', root);
    const boxes = ['按层生长（XGBoost 默认的方式）', '按叶子生长（LightGBM）'].map((t) => {
      const b = K.h('<div></div>', grid);
      const svg = K.s('svg', { viewBox: '0 0 380 250', class: 'lab-svg', role: 'img', 'aria-label': t }, b);
      const cap = K.h(`<p class="lab-caption"><b>${t}</b></p>`, b);
      return { svg, cap };
    });
    const note = K.note(root, '');

    function grow(policy) {
      let leaves = ['r'];
      const splits = [];
      let total = 0;
      for (let s = 0; s < budget; s++) {
        let pick;
        if (policy === 'leaf') pick = leaves.reduce((a, b) => (gain(b) > gain(a) ? b : a));
        else {
          const minDepth = Math.min(...leaves.map((l) => l.length));
          pick = leaves.find((l) => l.length === minDepth);
        }
        splits.push(pick);
        total += gain(pick);
        leaves = leaves.filter((l) => l !== pick).concat([pick + 'L', pick + 'R']);
      }
      return { leaves, splits, total };
    }
    function drawTree(svg, res) {
      K.clear(svg);
      const all = ['r'];
      res.splits.forEach((s) => all.push(s + 'L', s + 'R'));
      const pos = (id) => {
        const d = id.length - 1;
        let x = 0;
        for (let i = 1; i < id.length; i++) x += (id[i] === 'R' ? 1 : 0) * Math.pow(2, -i);
        return { x: 20 + (x + Math.pow(2, -d - 1)) * 340, y: 24 + d * 54 };
      };
      all.forEach((id) => {
        if (id === 'r') return;
        const pa = pos(id.slice(0, -1));
        const pb = pos(id);
        K.line(svg, pa.x, pa.y, pb.x, pb.y, { class: 'soft', 'stroke-width': 1.5 });
      });
      all.forEach((id) => {
        const q = pos(id);
        const isLeaf = res.leaves.includes(id);
        K.s('circle', { cx: q.x, cy: q.y, r: 14, fill: isLeaf ? 'var(--series-3)' : 'var(--surface-2)', 'fill-opacity': isLeaf ? 0.25 : 1, stroke: 'var(--border)' }, svg);
        if (isLeaf) K.text(svg, q.x, q.y + 4, String(gain(id)), { 'text-anchor': 'middle', 'font-size': 11, class: 'strong' });
      });
      K.text(svg, 10, 244, `已切 ${res.splits.length} 刀，损失共下降 ${res.total}`, { class: 'strong' });
    }
    function draw() {
      const a = grow('level');
      const b = grow('leaf');
      drawTree(boxes[0].svg, a);
      drawTree(boxes[1].svg, b);
      note.innerHTML = budget === 0
        ? '点“两边各切一刀”开始。'
        : `同样切 ${budget} 刀：按层生长把同一层的节点挨个切完，损失下降 ${a.total}；按叶子生长每次挑收益最大的叶子切，下降 ${b.total}。<b>按叶子生长更快降低损失，但树会长得很深、不对称，数据少时容易过拟合</b>，所以 LightGBM 要配合 max_depth、num_leaves 限制。`;
    }
    draw();

    K.h('<h3 class="sub-h">直方图算法：连续值先分桶</h3>', root);
    const r2 = K.rng(12);
    const vals = Array.from({ length: 300 }, () => Math.min(0.999, Math.abs(K.gauss(r2)) * 0.35 + r2() * 0.3));
    const ctl2 = K.row(root);
    const bins = K.slider(ctl2, { label: '桶的个数', min: 4, max: 64, step: 4, value: 16, onInput: () => drawH() });
    const ph = K.plot(root, { x: [0, 1], y: [0, 1], w: 640, h: 200, xlabel: '特征值', ylabels: false, grid: false, label: '直方图分桶' });
    const gh = ph.layer('h', true);
    const sh = K.stats(root);
    function drawH() {
      const b = bins.value;
      const cnt = new Array(b).fill(0);
      vals.forEach((v) => (cnt[Math.floor(v * b)] += 1));
      const mx = Math.max(...cnt);
      K.clear(gh);
      cnt.forEach((c, i) => K.s('rect', { x: ph.sx(i / b) + 1, y: ph.sy(c / mx), width: ph.sx(1 / b) - ph.sx(0) - 2, height: ph.sy(0) - ph.sy(c / mx), rx: 2, fill: 'var(--series-1)' }, gh));
      sh.set([['不分桶时的候选切分点', String(new Set(vals).size - 1)], ['分桶后的候选切分点', String(b - 1), 'good']]);
    }
    drawH();
    K.h(`<ul class="point-list">
      <li><b>直方图</b>：把连续特征分成若干个桶，只在桶的边界上找切分点，计算量和内存都大幅下降；子节点的直方图还能用“父节点减兄弟节点”算出来。</li>
      <li><b>GOSS（单边梯度采样）</b>：梯度大的样本（还没学好的）全部保留，梯度小的只随机抽一部分，用更少的数据估计分裂增益。</li>
      <li><b>EFB（互斥特征捆绑）</b>：很少同时取非零值的稀疏特征（比如 one-hot 出来的列）捆成一个特征，减少特征数。</li>
      <li><b>类别特征</b>：可以直接处理，不用先 one-hot。</li>
    </ul>`, root);
  },
});
