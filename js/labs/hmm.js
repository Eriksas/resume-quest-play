// 隐马尔可夫模型：用户心里的“意图”看不到（隐藏状态），只能看到行为（观测）。前向算法算概率，维特比算法找最可能的意图序列。
Labs.register('hmm', {
  render(host, K) {
    const root = K.panel(host);
    const S = ['随便逛逛', '想买'];
    const O = ['浏览', '加购', '下单'];
    const pi0 = [0.7, 0.3];
    const A = [[0.8, 0.2], [0.3, 0.7]];
    const B = [[0.7, 0.25, 0.05], [0.3, 0.4, 0.3]];
    let obs = [0, 0, 1, 1, 2, 0];
    let truth = null;
    let rr = K.rng(12);

    K.h(`<div class="lab-grid2">
      <table class="lab-table"><thead><tr><th>转移概率 A</th><th>→ ${S[0]}</th><th>→ ${S[1]}</th></tr></thead><tbody>
        ${A.map((row, i) => `<tr><th>${S[i]}</th>${row.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}
        <tr><th>一开始</th>${pi0.map((v) => `<td>${v}</td>`).join('')}</tr></tbody></table>
      <table class="lab-table"><thead><tr><th>发射概率 B</th>${O.map((o) => `<th>${o}</th>`).join('')}</tr></thead><tbody>
        ${B.map((row, i) => `<tr><th>${S[i]}</th>${row.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>
    </div>`, root);
    K.note(root, '上面是一个示例模型（数字是编的）：用户的意图有“随便逛逛”和“想买”两种，我们看不到；能看到的是每一步的行为。点下面的行为可以切换（浏览 → 加购 → 下单），或者让模型随机生成一段。', '');
    const chips = K.row(root);
    const btns = K.row(root);
    K.button(btns, '按模型随机生成一段', () => generate(), true);
    K.button(btns, '还原示例', () => { obs = [0, 0, 1, 1, 2, 0]; truth = null; draw(); });
    const box = K.h('<div class="lab-scroll" style="--min-w:520px"></div>', root);
    K.legend(root, [[`圆越实 = 越可能是这个意图（前向-后向算出的概率）`, 0], ['维特比算法找到的最可能路径', 1, 'line']]);
    const stats = K.stats(root);
    const note = K.note(root, '');
    K.h(`<div><h3 class="sub-h">隐马尔可夫模型的三个经典问题</h3><div class="lab-scroll"><table class="lab-table"><thead><tr><th>问题</th><th>问的是什么</th><th>算法</th></tr></thead><tbody>
      <tr><td>评估</td><td>已知模型，这串行为出现的概率有多大？</td><td>前向算法</td></tr>
      <tr><td>解码</td><td>已知模型和行为，最可能的隐藏状态序列是什么？</td><td>维特比算法（动态规划）</td></tr>
      <tr><td>学习</td><td>只有行为数据，怎么估计 A、B 和初始概率？</td><td>Baum-Welch 算法（EM 的一种）</td></tr>
    </tbody></table></div></div>`, root);
    K.note(root, '<b>隐马尔可夫模型（HMM）</b>= 一条看不见的马尔可夫链（隐藏状态按转移概率 A 跳转）+ 每个状态按<b>发射概率 B</b> 产生看得见的观测。两个假设：隐藏状态只依赖上一个隐藏状态；观测只依赖当前的隐藏状态。经典应用有语音识别、词性标注、中文分词。面试里能说清“隐藏状态 / 观测 / 转移概率 / 发射概率”和这三个问题就够了。', '');

    function generate() {
      const pick = (p) => { const u = rr(); let acc = 0; for (let i = 0; i < p.length; i++) { acc += p[i]; if (u < acc) return i; } return p.length - 1; };
      truth = [];
      obs = [];
      let s = pick(pi0);
      for (let t = 0; t < 6; t++) {
        if (t) s = pick(A[s]);
        truth.push(s);
        obs.push(pick(B[s]));
      }
      draw();
    }
    function forwardBackward() {
      const T = obs.length;
      const al = [];
      al[0] = [0, 1].map((i) => pi0[i] * B[i][obs[0]]);
      for (let t = 1; t < T; t++) al[t] = [0, 1].map((j) => (al[t - 1][0] * A[0][j] + al[t - 1][1] * A[1][j]) * B[j][obs[t]]);
      const be = [];
      be[T - 1] = [1, 1];
      for (let t = T - 2; t >= 0; t--) be[t] = [0, 1].map((i) => A[i][0] * B[0][obs[t + 1]] * be[t + 1][0] + A[i][1] * B[1][obs[t + 1]] * be[t + 1][1]);
      const PO = al[T - 1][0] + al[T - 1][1];
      const post = al.map((a, t) => [0, 1].map((i) => (a[i] * be[t][i]) / PO));
      return { PO, post };
    }
    function viterbi() {
      const T = obs.length;
      const d = [];
      const psi = [];
      d[0] = [0, 1].map((i) => pi0[i] * B[i][obs[0]]);
      for (let t = 1; t < T; t++) {
        d[t] = [];
        psi[t] = [];
        for (let j = 0; j < 2; j++) {
          const c0 = d[t - 1][0] * A[0][j];
          const c1 = d[t - 1][1] * A[1][j];
          psi[t][j] = c0 >= c1 ? 0 : 1;
          d[t][j] = Math.max(c0, c1) * B[j][obs[t]];
        }
      }
      const path = new Array(T);
      path[T - 1] = d[T - 1][0] >= d[T - 1][1] ? 0 : 1;
      for (let t = T - 1; t > 0; t--) path[t - 1] = psi[t][path[t]];
      return { path, prob: Math.max(...d[T - 1]) };
    }
    function draw() {
      chips.innerHTML = '';
      obs.forEach((o, t) => {
        K.button(chips, `第 ${t + 1} 步：${O[o]}`, () => { obs[t] = (obs[t] + 1) % 3; truth = null; draw(); });
      });
      const fb = forwardBackward();
      const vt = viterbi();
      box.innerHTML = '';
      const W = 640;
      const H = truth ? 250 : 220;
      const svg = K.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg', role: 'img', 'aria-label': '维特比路径' }, box);
      const xs = (t) => 120 + t * 96;
      const ys = [110, 180];
      K.text(svg, 12, 40, '看得见的行为', { class: 'strong' });
      ys.forEach((y, i) => K.text(svg, 12, y + 4, S[i], { class: 'strong' }));
      for (let t = 1; t < obs.length; t++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) K.line(svg, xs(t - 1), ys[i], xs(t), ys[j], { class: 'soft', 'stroke-width': 1 });
      for (let t = 1; t < obs.length; t++) K.line(svg, xs(t - 1), ys[vt.path[t - 1]], xs(t), ys[vt.path[t]], { stroke: 'var(--series-2)', 'stroke-width': 5, 'stroke-linecap': 'round' });
      obs.forEach((o, t) => {
        K.s('rect', { x: xs(t) - 34, y: 24, width: 68, height: 26, rx: 13, fill: 'var(--surface-2)' }, svg);
        K.text(svg, xs(t), 42, O[o], { 'text-anchor': 'middle', class: 'strong' });
        for (let i = 0; i < 2; i++) {
          const pr = fb.post[t][i];
          K.s('circle', { cx: xs(t), cy: ys[i], r: 20, fill: 'var(--surface)', stroke: K.color(0), 'stroke-width': 2 }, svg);
          K.s('circle', { cx: xs(t), cy: ys[i], r: 20, fill: K.color(0), opacity: 0.12 + 0.88 * pr }, svg);
          K.text(svg, xs(t), ys[i] + 4, pr.toFixed(2), { 'text-anchor': 'middle', 'font-size': 11, style: `font-weight:700;fill:${pr > 0.5 ? '#fff' : 'var(--text)'}` });
        }
        if (truth) K.text(svg, xs(t), 232, `真实：${S[truth[t]]}`, { 'text-anchor': 'middle', 'font-size': 11 });
      });
      const hit = truth ? truth.filter((s, t) => s === vt.path[t]).length : null;
      stats.set([
        ['这串行为的概率 P(观测)', fb.PO.toExponential(2)],
        ['最可能的意图序列', vt.path.map((s) => (s ? '买' : '逛')).join(' → '), 'good'],
      ].concat(truth ? [['维特比猜对了几步', `${hit} / ${obs.length}`]] : []));
      note.innerHTML = truth
        ? '模型生成数据时，真实的隐藏状态写在最下面。维特比算法只看行为，猜出的路径和真实情况大部分一致，但不会每步都对。'
        : '把第 5 步改成“浏览”，或者把前几步都改成“加购”，看最可能路径怎么变。<b>前向算法</b>把所有可能路径的概率加起来，得到这串行为出现的概率；<b>维特比算法</b>每一步只保留到达每个状态的最优路径，最后回溯出整条最可能路径。';
    }
    draw();
  },
});
