// 统计篇 · 3 非参数检验（卡方检验、曼-惠特尼 U、其他）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'stat_nonparam',
    part: { id: 'stat', title: '统计篇', order: 3, desc: '先看动画讲解，再做题' },
    order: 30,
    title: '非参数检验',
    subtitle: '卡方检验、曼-惠特尼 U、其他非参数检验',
    badge: '秩',
    intro: '卡方检验是重点，而且你 X5 项目的样本比例检验（SRM）用的就是它。其余记住“不假设分布、用名次代替数值”和各自的用途就够了。',

    lessons: [
      {
        id: 'st-chisq', title: '16.1 卡方检验', stars: 2, lab: 'chisq',
        oneLiner: '卡方检验比较“实际频数”和“理论期望频数”差多少：χ² = Σ (O − E)² ÷ E。独立性检验看两个分类变量是否相关；拟合优度检验看实际比例是否符合理论比例，比如分流是否 1:1。',
        tryIt: [
          '① 调两组的转化率和人数，看哪个格子对 χ² 贡献最大；关掉连续性校正，对比 χ² 和 z²。',
          '② 切到“拟合优度”，保持 50.5% 不变，把总人数从 2,000 调到 200,000。',
          '② 点“代入 X5 短信实验的分组人数”，对一对 χ² = 0.030、p = 0.863。',
        ],
        points: [
          '独立性检验：原假设是两个分类变量相互独立，例如渠道和是否转化。',
          '期望频数 E = 行合计 × 列合计 ÷ 总数；自由度 = (行数 − 1) × (列数 − 1)。',
          '拟合优度检验：实际频数是否符合理论比例；自由度 = 类别数 − 1。',
          '每格期望频数最好都 ≥ 5，太小时用 Fisher 精确检验。',
          '2×2 表 scipy 默认做连续性校正；不校正时，χ² 等于合并方差的两比例 z 检验的 z²。',
          'SRM（样本比例失衡）就是对分组人数做拟合优度检验，不通过的话实验结论不可信。',
        ],
        project: 'X5 项目的第一步就是 SRM：实验组 99,981 人，对照组 100,058 人，实验组占比 0.4998，按 1:1 的假设做卡方拟合优度检验，χ² = 0.030，p = 0.863，没有分流异常的迹象。（官方没公布设计比例，按 scikit-uplift 文档的 0.5 作为假设。）',
        source: [S('didi-stat', '8. z 检验 / t 检验 / 卡方检验'), S('sp-chi2', 'chi2_contingency'), S('nist-chigof', 'Chi-Square Goodness-of-Fit Test'), S('x5', '第 1 步：样本比例检验（SRM）')],
      },
      {
        id: 'st-mwu', title: '16.2 曼-惠特尼 U 检验 / Wilcoxon 秩和检验', stars: 1, lab: 'mwu',
        oneLiner: '把两组数据混在一起排名，用名次（秩）代替原始数值，看某一组的名次是不是整体偏高。不要求正态、对极端值稳健，是两独立样本 t 检验的非参数替代。',
        tryIt: [
          '左右拖动几个点：只要名次不变，U 检验的结果就不变。',
          '点“A 组混进一个极端大值”，对比 t 检验和 U 检验的 p 值。',
        ],
        points: [
          '曼-惠特尼 U 检验和 Wilcoxon 秩和检验是同一个检验的两种叫法。',
          '原假设：两组分布相同，谁也不比谁更容易偏大。',
          'U 的直观含义：两组两两配对，A 比 B 大的对数。',
          '适合：偏态、重尾、有极端值，或者只有等级的数据（满意度 1–5 分）。',
          '配对样本不用它，用 Wilcoxon 符号秩检验。',
        ],
        source: [S('sp-mwu', 'mannwhitneyu'), S('didi-stat', '8. z 检验 / t 检验 / 卡方检验（非参数检验）')],
      },
      {
        id: 'st-npother', title: '16.3 其他非参数检验（了解即可）', stars: 0, lab: 'npother',
        oneLiner: '常见的非参数检验，基本都能找到对应的参数检验：配对用 Wilcoxon 符号秩，多组用 Kruskal-Wallis，相关用 Spearman，比较整个分布用 KS 检验。',
        tryIt: ['把“平移”调回 0、“波动倍数”调到 2：两组中心一样只是波动不同，看哪个检验能发现。'],
        points: [
          'Wilcoxon 符号秩检验：配对样本，对应配对 t 检验。',
          'Kruskal-Wallis H 检验：三组及以上独立样本，对应单因素方差分析。',
          'Friedman 检验：三组及以上配对样本。',
          'Spearman 秩相关：用名次算相关系数，看单调关系，对应 Pearson 相关。',
          'KS 检验：比较两组的整个分布（位置、波动、形状），或检验数据是否服从某个分布。',
          'Shapiro-Wilk 检验：检验数据是否近似正态。',
          '共同特点：不假设具体分布，多用名次，稳健；数据真的近似正态时功效略低。',
        ],
        source: [S('sp-wilcoxon', 'wilcoxon'), S('sp-kruskal', 'kruskal'), S('sp-ks', 'ks_2samp'), S('nist-ks', 'Kolmogorov-Smirnov Goodness-of-Fit Test'), S('sp-shapiro', 'shapiro')],
      },
    ],

    questions: [
      // ---------- 16.1 卡方 ----------
      {
        id: 'st-chi-c1', lesson: 'st-chisq', type: 'choice',
        prompt: '卡方检验通常用来做什么？',
        options: [
          { text: '看两个分类变量是否相关（独立性检验），比如渠道和是否转化；也可以检验实际频数是否符合理论比例（拟合优度检验），比如 A/B 实验的分流是不是 1:1。', correct: true },
          { text: '比较两组的人均 GMV 有没有差异。', trap: '概念混淆', why: '人均 GMV 是连续数值的均值，用 t 检验。' },
          { text: '检验两组的方差是否相等。', trap: '概念混淆', why: '那是 Levene 检验或方差比 F 检验。' },
        ],
        source: [S('didi-stat', '8. z 检验 / t 检验 / 卡方检验'), S('nist-chigof', 'Chi-Square Goodness-of-Fit Test')],
      },
      {
        id: 'st-chi-c2', lesson: 'st-chisq', type: 'choice',
        prompt: '卡方独立性检验的统计量怎么算？',
        options: [
          { text: '先假设独立，算每格的期望频数 E = 行合计 × 列合计 ÷ 总数；χ² = Σ (实际 O − 期望 E)² ÷ E；自由度 = (行数 − 1) × (列数 − 1)。', correct: true },
          { text: 'χ² = Σ (O − E) ÷ E。', trap: '数字记错', why: '分子要平方：(O − E)²，否则正负会抵消。' },
          { text: '自由度 = 格子总数 − 1。', trap: '概念混淆', why: '独立性检验的自由度是 (r − 1)(c − 1)；2×2 表是 1。' },
        ],
        source: [S('sp-chi2', 'chi2_contingency')],
      },
      {
        id: 'st-chi-c3', lesson: 'st-chisq', type: 'choice',
        prompt: '面试官：“你 X5 项目里的 SRM 是怎么做的？结果如何？”',
        options: [
          { text: '检验实际分组人数是否符合设计比例，用卡方拟合优度检验。官方没公布比例，按 1:1 假设。实验组 99,981 人、对照组 100,058 人，χ² = 0.030，p = 0.863，没有分流异常的迹象。', correct: true },
          { text: 'χ² = 0.863，p = 0.030，说明分流有问题。', trap: '数字记错', why: '是 χ² = 0.030、p = 0.863，没有发现异常。' },
          { text: 'SRM 检验的是两组客户的特征是否平衡，比如年龄、消费额。', trap: '概念混淆', why: '那是平衡性检验（SMD）；SRM 只看两组人数比例。' },
        ],
        source: [S('x5', '第 1 步：样本比例检验（SRM）'), S('x5-qa', '6. 样本比例失衡检验（SRM）是什么？为什么要做？')],
      },
      {
        id: 'st-chi-c4', lesson: 'st-chisq', type: 'choice',
        prompt: '列联表里有的格子期望频数只有 2，还能用卡方检验吗？',
        options: [
          { text: '不太合适。卡方检验的近似要求每格的期望频数都不太小，常用的经验是 ≥ 5；太小时改用 Fisher 精确检验。', correct: true },
          { text: '可以，卡方检验对样本量没有要求。', trap: '说过头', why: '期望频数太小时，卡方分布的近似不可靠。' },
          { text: '把这个格子删掉，再做卡方检验。', trap: '说过头', why: '随便删格子会改变问题本身；应该合并类别或用精确检验。' },
        ],
        source: [S('sp-chi2', 'Notes：expected frequencies at least 5')],
      },
      {
        id: 'st-chi-match', lesson: 'st-chisq', type: 'match',
        prompt: '把卡方检验相关的概念和含义连起来。',
        pairs: [
          { left: '独立性检验', right: '两个分类变量是否相关' },
          { left: '拟合优度检验', right: '实际频数是否符合理论比例' },
          { left: '期望频数 E', right: '行合计 × 列合计 ÷ 总数' },
          { left: 'SRM', right: '分组人数是否符合设计比例' },
        ],
        source: [S('sp-chi2', 'chi2_contingency'), S('nist-chigof', 'Chi-Square Goodness-of-Fit Test'), S('x5', '第 1 步：样本比例检验（SRM）')],
      },

      // ---------- 16.2 曼-惠特尼 U ----------
      {
        id: 'st-mwu-c1', lesson: 'st-mwu', type: 'choice',
        prompt: '曼-惠特尼 U 检验是什么？什么时候用？',
        options: [
          { text: '把两组数据混在一起排名，用名次代替原始数值，检验两组分布是否相同（某一组是否整体偏大）。不要求正态，对极端值稳健，适合偏态、重尾或等级数据，是两独立样本 t 检验的非参数替代。', correct: true },
          { text: '它用来比较配对样本，比如同一批人前后对比。', trap: '概念混淆', why: '配对样本用 Wilcoxon 符号秩检验；U 检验用于两组独立样本。' },
          { text: '它和 t 检验一样，要求数据近似正态。', trap: '概念混淆', why: '它只用名次，不要求正态。' },
        ],
        source: [S('sp-mwu', 'mannwhitneyu')],
      },
      {
        id: 'st-mwu-c2', lesson: 'st-mwu', type: 'choice',
        prompt: '两组各 8 个人，其中一组混进了一个特别大的极端值。t 检验和 U 检验，哪个更稳？',
        options: [
          { text: 'U 检验更稳：极端值在名次里只是“最后一名”，影响有限；t 检验的均值和方差都会被它拉偏，结论可能完全变掉。', correct: true },
          { text: 't 检验更稳，因为样本均值近似正态。', trap: '概念混淆', why: '每组只有 8 个人，中心极限定理帮不上忙，一个极端值就能把均值拉偏。' },
          { text: '两个一样，极端值对哪个检验都没影响。', trap: '概念混淆', why: 't 检验直接用原始数值，受极端值影响很大。' },
        ],
        source: [S('sp-mwu', 'mannwhitneyu'), S('didi-stat', '1. 描述统计（均值受极端值影响较大）')],
      },

      // ---------- 16.3 其他 ----------
      {
        id: 'st-np-match', lesson: 'st-npother', type: 'match',
        prompt: '把非参数检验和它对应的参数检验连起来。',
        pairs: [
          { left: '曼-惠特尼 U', right: '两独立样本 t 检验' },
          { left: 'Wilcoxon 符号秩', right: '配对 t 检验' },
          { left: 'Kruskal-Wallis', right: '单因素方差分析' },
          { left: 'Spearman 秩相关', right: 'Pearson 相关' },
        ],
        source: [S('sp-mwu', 'mannwhitneyu'), S('sp-wilcoxon', 'wilcoxon'), S('sp-kruskal', 'kruskal')],
      },
      {
        id: 'st-np-c1', lesson: 'st-npother', type: 'choice',
        prompt: '非参数检验有什么共同特点？',
        options: [
          { text: '不假设数据服从某个具体分布，多数用名次代替原始数值，所以对偏态和极端值稳健。代价是：数据真的近似正态时，功效通常比参数检验略低。', correct: true },
          { text: '非参数检验没有任何前提假设。', trap: '说过头', why: '仍然要求样本独立等条件，只是不要求具体的分布形式。' },
          { text: '非参数检验总是比参数检验更好，应该优先用。', trap: '说过头', why: '数据满足参数检验的前提时，参数检验功效更高。' },
        ],
        source: [S('didi-stat', '8. z 检验 / t 检验 / 卡方检验（非参数检验）'), S('sp-mwu', 'mannwhitneyu')],
      },
    ],
  });
})();
