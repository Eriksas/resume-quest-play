// 不同指标类型选什么检验：一步步回答几个问题，得到推荐的检验方法。
Labs.register('testpick', {
  render(host, K) {
    const root = K.panel(host);
    const Q = {
      kind: { q: '你要比较的指标是什么类型？', opts: [
        ['mean', '连续数值的均值（人均 GMV、时长、客单价）'],
        ['prop', '比例 / 转化率（每个人是 0 或 1）'],
        ['cat', '两个分类变量的计数（渠道 × 是否转化）'],
        ['rank', '严重偏态、有极端值，或者只有排序 / 等级'],
      ] },
      groups: { q: '比较几组？', opts: [['two', '两组'], ['multi', '三组及以上']] },
      paired: { q: '是不同的人，还是同一批对象前后对比？', opts: [['indep', '不同的人（独立样本）'], ['paired', '同一批对象（配对样本）']] },
      eqvar: { q: '两组的方差差不多吗？（可以先用 Levene 检验看看）', opts: [['eq', '差不多'], ['neq', '不确定 / 差别大']] },
    };
    const R = {
      'mean|two|indep|eq': ['两样本 t 检验（Student）', 'scipy.stats.ttest_ind(a, b)', '假设两组方差相等。样本量很大时，t 检验和 z 检验结果几乎一样。'],
      'mean|two|indep|neq': ['Welch t 检验', 'scipy.stats.ttest_ind(a, b, equal_var=False)', '不假设方差相等，实际工作中拿不准时就用它，几乎没有损失。'],
      'mean|two|paired': ['配对 t 检验', 'scipy.stats.ttest_rel(before, after)', '先算每个对象的前后差值，再检验差值的均值是不是 0。'],
      'mean|multi|indep': ['单因素方差分析（ANOVA，F 检验）', 'scipy.stats.f_oneway(a, b, c)', '假设独立、正态、方差相等；方差不齐可以用 Welch ANOVA。显著只说明“至少有一组不同”，要再做两两比较（并校正多重比较）。'],
      'mean|multi|paired': ['重复测量方差分析', '（了解即可）', '同一批对象在多个条件下测量。面试里说出名字和适用场景就够了。'],
      'prop|two': ['两比例 z 检验（大样本）', 'statsmodels 的 proportions_ztest，或者 2×2 卡方检验', '转化率 A/B 测试最常用。不加连续性校正时，2×2 卡方统计量正好等于 z²。'],
      'prop|multi': ['卡方检验（k × 2 列联表）', 'scipy.stats.chi2_contingency(table)', '多个组的转化率是否都一样。'],
      'cat': ['卡方独立性检验', 'scipy.stats.chi2_contingency(table)', '看两个分类变量是否独立。每个格子的期望频数最好都 ≥ 5；太小时用 Fisher 精确检验。'],
      'rank|two|indep': ['曼-惠特尼 U 检验（Wilcoxon 秩和检验）', 'scipy.stats.mannwhitneyu(a, b)', '不要求正态，比较两组谁整体偏大；对极端值稳健。'],
      'rank|two|paired': ['Wilcoxon 符号秩检验', 'scipy.stats.wilcoxon(before, after)', '配对 t 检验的非参数版本。'],
      'rank|multi|indep': ['Kruskal-Wallis H 检验', 'scipy.stats.kruskal(a, b, c)', '方差分析的非参数版本。'],
      'rank|multi|paired': ['Friedman 检验', 'scipy.stats.friedmanchisquare(a, b, c)', '多组配对的非参数检验。'],
    };
    let ans = {};
    const box = K.h('<div class="lab"></div>', root);

    function flow() {
      const steps = ['kind'];
      if (ans.kind && ans.kind !== 'cat') steps.push('groups');
      if ((ans.kind === 'mean' || ans.kind === 'rank') && ans.groups) steps.push('paired');
      if (ans.kind === 'mean' && ans.groups === 'two' && ans.paired === 'indep') steps.push('eqvar');
      return steps;
    }
    function resultKey() {
      const a = ans;
      if (a.kind === 'cat') return 'cat';
      if (a.kind === 'prop' && a.groups) return `prop|${a.groups}`;
      if ((a.kind === 'mean' || a.kind === 'rank') && a.groups && a.paired) {
        if (a.kind === 'mean' && a.groups === 'two' && a.paired === 'indep') return a.eqvar ? `mean|two|indep|${a.eqvar}` : null;
        return `${a.kind}|${a.groups}|${a.paired}`;
      }
      return null;
    }
    function draw() {
      box.innerHTML = '';
      flow().forEach((k, i) => {
        const card = K.h(`<div class="card" style="padding:12px 14px"><p class="small muted">第 ${i + 1} 步</p><p><b>${Q[k].q}</b></p><div class="lab-controls" style="margin-top:8px"></div></div>`, box);
        const row = card.querySelector('.lab-controls');
        Q[k].opts.forEach(([v, label]) => {
          const b = K.button(row, label, () => {
            const keep = flow().slice(0, flow().indexOf(k));
            const next = {};
            keep.forEach((kk) => (next[kk] = ans[kk]));
            next[k] = v;
            ans = next;
            draw();
          }, ans[k] === v);
          if (ans[k] && ans[k] !== v) b.style.opacity = 0.55;
        });
      });
      const key = resultKey();
      if (key) {
        const [name, code, why] = R[key];
        K.h(`<div class="lab-note good"><b>推荐：${name}</b><br><code>${Util.esc(code)}</code><br>${why}</div>`, box);
        K.button(box, '重新选', () => { ans = {}; draw(); });
      }
    }
    draw();
    K.h(`<div><h3 class="sub-h">一张表看全</h3><div class="lab-scroll"><table class="lab-table"><thead><tr><th>指标类型</th><th>两组（独立）</th><th>两组（配对）</th><th>多组</th></tr></thead><tbody>
      <tr><td>均值（近似正态）</td><td>t 检验；方差不齐用 Welch</td><td>配对 t 检验</td><td>方差分析 ANOVA（F 检验）</td></tr>
      <tr><td>比例 / 转化率</td><td>两比例 z 检验 或 卡方</td><td>McNemar 检验（了解）</td><td>卡方检验</td></tr>
      <tr><td>分类 × 分类</td><td colspan="3">卡方独立性检验；期望频数太小用 Fisher 精确检验</td></tr>
      <tr><td>偏态 / 极端值 / 等级</td><td>曼-惠特尼 U</td><td>Wilcoxon 符号秩</td><td>Kruskal-Wallis</td></tr>
    </tbody></table></div></div>`, root);
    K.note(root, '选之前先确认三件事：<b>指标类型</b>（均值、比例还是计数）、<b>样本是否独立</b>（同一个用户被算了几次？随机化单位是不是分析单位？）、<b>分布和方差</b>（极端值多不多、方差齐不齐）。样本量大时，均值的检验靠中心极限定理也能用 z 近似。', '');
  },
});
