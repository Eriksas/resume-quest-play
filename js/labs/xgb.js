// XGBoost：一个节点要不要分裂？用一阶梯度 g、二阶梯度 h 算叶子权重和分裂增益，看 λ、γ 怎么起作用。
Labs.register('xgb', {
  render(host, K) {
    const root = K.panel(host);
    // 示例数据：8 个样本，当前预测都是 0；平方损失下 g = 预测 − 真实值，h = 1
    const ys = [-2.2, -1.6, -1.9, -0.5, 0.4, 1.7, 2.3, 1.8];
    const g = ys.map((y) => 0 - y);
    const h = ys.map(() => 1);

    const ctl = K.row(root);
    const cut = K.slider(ctl, { label: '切在第几个样本之后', min: 1, max: 7, step: 1, value: 3, onInput: () => draw() });
    const ctl2 = K.row(root);
    const lam = K.slider(ctl2, { label: 'λ（叶子权重的 L2 惩罚）', min: 0, max: 10, step: 0.5, value: 1, fmt: (v) => v.toFixed(1), onInput: () => draw() });
    const gam = K.slider(ctl2, { label: 'γ（每多一个叶子的代价）', min: 0, max: 8, step: 0.25, value: 0, fmt: (v) => v.toFixed(2), onInput: () => draw() });
    const btns = K.row(root);
    K.button(btns, '自动找增益最大的切分', () => {
      let best = 1;
      for (let k = 1; k <= 7; k++) if (gain(k) > gain(best)) best = k;
      cut.set(best);
    }, true);

    const p = K.plot(root, { x: [0.4, 8.6], y: [-3, 3], w: 640, h: 300, xticks: [1, 2, 3, 4, 5, 6, 7, 8], xlabel: '样本（按特征值排好序）', ylabel: '残差 = −g', fx: (v) => '#' + v, label: '每个样本的残差和叶子权重' });
    const gBars = p.layer('bars', true);
    const gW = p.layer('w', true);
    const gCut = p.layer('cut', true);
    K.legend(root, [['每个样本的残差（就是负梯度 −g）', 0, 'square'], ['叶子权重 w*', 1, 'line']]);
    const formula = K.h('<div class="lab-note"></div>', root);
    const stats = K.stats(root);

    const sum = (a, i0, i1) => a.slice(i0, i1).reduce((s, v) => s + v, 0);
    const parts = (k) => {
      const GL = sum(g, 0, k), HL = sum(h, 0, k), GR = sum(g, k, 8), HR = sum(h, k, 8);
      return { GL, HL, GR, HR };
    };
    const score = (G, H) => (G * G) / (H + lam.value);
    function gain(k) {
      const { GL, HL, GR, HR } = parts(k);
      return 0.5 * (score(GL, HL) + score(GR, HR) - score(GL + GR, HL + HR)) - gam.value;
    }

    function draw() {
      const k = cut.value;
      const { GL, HL, GR, HR } = parts(k);
      const wL = -GL / (HL + lam.value);
      const wR = -GR / (HR + lam.value);
      const wAll = -(GL + GR) / (HL + HR + lam.value);
      const G = gain(k);
      K.clear(gBars);
      ys.forEach((y, i) => {
        const x = i + 1;
        K.s('rect', { x: p.sx(x) - 16, y: Math.min(p.sy(y), p.sy(0)), width: 32, height: Math.abs(p.sy(y) - p.sy(0)), rx: 4, fill: 'var(--series-1)', opacity: 0.85 }, gBars);
        K.text(gBars, p.sx(x), y >= 0 ? p.sy(y) - 5 : p.sy(y) + 14, y.toFixed(1), { 'text-anchor': 'middle', 'font-size': 11 });
      });
      K.line(gBars, p.sx(0.4), p.sy(0), p.sx(8.6), p.sy(0), { class: 'soft' });
      K.clear(gW);
      const split = G > 0;
      if (split) {
        K.line(gW, p.sx(0.6), p.sy(wL), p.sx(k + 0.5), p.sy(wL), { stroke: 'var(--series-2)', 'stroke-width': 3.5 });
        K.line(gW, p.sx(k + 0.5), p.sy(wR), p.sx(8.4), p.sy(wR), { stroke: 'var(--series-2)', 'stroke-width': 3.5 });
        K.text(gW, p.sx((k + 1.1) / 2), p.sy(wL) - 7, `w左 = ${wL.toFixed(2)}`, { 'text-anchor': 'middle', class: 'strong' });
        K.text(gW, p.sx((k + 8.9) / 2), p.sy(wR) - 7, `w右 = ${wR.toFixed(2)}`, { 'text-anchor': 'middle', class: 'strong' });
      } else {
        K.line(gW, p.sx(0.6), p.sy(wAll), p.sx(8.4), p.sy(wAll), { stroke: 'var(--series-2)', 'stroke-width': 3.5, 'stroke-dasharray': '6 4' });
        K.text(gW, p.sx(4.5), p.sy(wAll) - 7, `不分裂，整个节点一个权重 w = ${wAll.toFixed(2)}`, { 'text-anchor': 'middle', class: 'strong' });
      }
      K.clear(gCut);
      K.line(gCut, p.sx(k + 0.5), p.P.t, p.sx(k + 0.5), p.H - p.P.b, { stroke: 'var(--text)', 'stroke-width': 2, 'stroke-dasharray': split ? '0' : '4 4', opacity: split ? 1 : 0.5 });

      formula.innerHTML = `叶子权重 <b>w* = −G / (H + λ)</b>；分裂增益 <b>Gain = ½ [G左²/(H左+λ) + G右²/(H右+λ) − (G左+G右)²/(H左+H右+λ)] − γ</b><br>` +
        `代入：G左 = ${GL.toFixed(1)}，H左 = ${HL}，G右 = ${GR.toFixed(1)}，H右 = ${HR}，λ = ${lam.value}，γ = ${gam.value} → <b>Gain = ${G.toFixed(2)}</b>` +
        (split ? '，大于 0，值得分裂。' : '，不大于 0：多一个叶子换来的损失下降抵不上 γ 这个代价，<b>不分裂</b>（这就是 XGBoost 自带的剪枝）。');
      formula.className = 'lab-note ' + (split ? 'good' : 'warn');
      stats.set([
        ['增益 Gain', G.toFixed(2), split ? 'good' : 'bad'],
        ['左叶权重', split ? wL.toFixed(2) : '—'],
        ['右叶权重', split ? wR.toFixed(2) : '—'],
        ['λ = 0 时的左叶权重（= 残差平均）', (-GL / HL).toFixed(2)],
      ]);
    }
    draw();

    K.h('<h3 class="sub-h">XGBoost 比普通 GBDT 多做了什么</h3>', root);
    K.h(`<ul class="point-list">
      <li><b>二阶展开</b>：同时用一阶梯度 g 和二阶梯度 h 去近似损失，任何可导的损失函数都能套同一套求解方法。</li>
      <li><b>目标函数带正则</b>：Ω = γT + ½λΣw²，T 是叶子数、w 是叶子权重。上面拖 λ 看叶子权重被压小，拖 γ 看分裂被否决。</li>
      <li><b>增益公式直接决定分不分</b>：Gain 不大于 0 就不分裂，等于边长树边剪枝。</li>
      <li><b>工程优化</b>：行抽样、列抽样（和随机森林一个思路，防过拟合）；缺失值自动学一个默认方向；分裂点查找可以并行。</li>
    </ul>`, root);
  },
});
