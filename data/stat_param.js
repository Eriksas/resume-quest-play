// 统计篇 · 2 参数检验（选检验方法、t / z 检验、F 检验、方差齐性检验）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'stat_param',
    part: { id: 'stat', title: '统计篇', order: 3, desc: '先看动画讲解，再做题' },
    order: 20,
    title: '参数检验',
    subtitle: '选检验方法、t / z 检验、F 检验、方差齐性',
    badge: '检',
    intro: '三星重点是 t / z 检验：p 值、两类错误、功效、置信区间，再加上你 X5 项目的那组数字。面试时先说清“指标是什么类型”，再说用什么检验。',

    lessons: [
      {
        id: 'st-pick', title: '15.1 不同指标类型对应的检验方法', stars: 2, lab: 'testpick',
        oneLiner: '先看指标类型（均值、比例、分类计数，还是偏态 / 等级），再看比几组、样本独立还是配对、方差齐不齐，就能选出检验方法。',
        tryIt: [
          '一步步回答问题，看推荐的检验和 scipy 函数。',
          '对照下面的表，自己说一遍：两组人均 GMV 用什么？两组转化率用什么？',
        ],
        points: [
          '两组均值：t 检验；方差不齐用 Welch t；同一批对象前后对比用配对 t。',
          '两组比例（转化率），大样本：两比例 z 检验（或 2×2 卡方）。',
          '两个分类变量是否相关：卡方独立性检验。',
          '三组及以上均值：方差分析（F 检验），显著后再做两两比较并校正。',
          '严重偏态、极端值多、等级数据：曼-惠特尼 U 等非参数检验。',
          '选之前先确认实验单位和样本是否独立：同一用户的重复观测、用户聚类都会破坏独立性。',
        ],
        source: [S('didi-stat', '8. z 检验 / t 检验 / 卡方检验：知道什么时候用'), S('sp-ttest', 'equal_var'), S('sp-ttrel', 'ttest_rel')],
      },
      {
        id: 'st-ttest', title: '15.2 t 检验 / z 检验', stars: 3, lab: 'ttest',
        oneLiner: '检验统计量 = 差 ÷ 标准误。t 检验常用来比较两个均值（小样本、总体方差未知）；z 检验用于大样本的均值或比例，转化率 A/B 测试最常见。',
        tryIt: [
          '① 把样本量从 5 拉到 200，看 t 值和 p 值怎么变。',
          '② 点“代入 X5 短信实验的数据”，对一对 z = 15.32、置信区间 [2.90, 3.75]。',
          '③ 拖“每组样本量”，看功效什么时候超过 80%；把 α 改成 0.01，看功效下降。',
        ],
        points: [
          '流程：提出 H0 / H1 → 选 α（常用 0.05）→ 算检验统计量和 p 值 → p < α 拒绝 H0，否则“证据不足以拒绝 H0” → 再看效应量和置信区间。',
          'p 值：在 H0 成立的前提下，观察到当前或更极端结果的概率。它不是“H0 为真的概率”。',
          '两比例 z 检验：SE = √(p₁(1 − p₁)/n₁ + p₂(1 − p₂)/n₂)，z = 差 ÷ SE。',
          '第一类错误 α：误报；第二类错误 β：漏报；功效 = 1 − β。',
          '功效受样本量、真实效应大小、方差、α 影响。',
          'MDE ≈ (1.96 + 0.84) × SE：5% 显著性、80% 功效下能可靠检测到的最小效应。',
          '统计显著 ≠ 业务显著：大样本下很小的提升也会显著，要看 lift、置信区间和成本收益。',
        ],
        project: 'X5 项目：实验组购买率 63.65%、对照组 60.33%，ATE = 3.32 个百分点，标准误 0.217（不合并方差），z = 15.32，95% 置信区间 [2.90, 3.75]，相对提升 5.5%；用回归 target ~ treatment 加稳健标准误做了一遍，结果完全一致。MDE 不调整时 0.608 个百分点。',
        source: [S('didi-stat', '6. 假设检验；7. 第一类错误、第二类错误与统计功效；8. z 检验 / t 检验 / 卡方检验'), S('nist-t2', 'Two-Sample t-Test'), S('x5', '第 4 步：平均处理效应（ATE）；第 7 步：最小可检测效应（MDE）')],
      },
      {
        id: 'st-ftest', title: '15.3 F 检验', stars: 1, lab: 'ftest',
        oneLiner: 'F 检验最常见的用法是方差分析：F = 组间均方 ÷ 组内均方，检验多组均值是否全都相等；另一种用法是比较两组方差（方差比）。',
        tryIt: [
          '① 把“组间差异”拉大、“组内波动”调小，看 F 变大、p 变小。',
          '② 切到“方差比”，把标准差之比调到 1，看 F 在 1 附近。',
        ],
        points: [
          '方差分析的原假设：所有组的均值都相等。',
          'F = 组间均方 MSB ÷ 组内均方 MSW；H0 成立时 F 在 1 附近。',
          '显著只说明“至少有一组不同”，要再做两两比较，并校正多重比较。',
          '前提：各组独立、近似正态、方差相等。',
          '两组时，方差分析的 F 等于 Student t 的平方。',
          '方差比 F 检验对非正态非常敏感，检验方差齐性更常用 Levene。',
        ],
        source: [S('nist-anova', 'One-Factor ANOVA'), S('nist-f', 'F-Test for Equality of Two Variances'), S('sp-anova', 'f_oneway')],
      },
      {
        id: 'st-levene', title: '15.4 方差齐性检验', stars: 1, lab: 'levene',
        oneLiner: '方差齐性检验看各组方差是否相等。Levene 检验把每个数换成它离本组中位数（或均值）的距离，再对这些距离做方差分析。方差不齐时，比较均值用 Welch t 检验。',
        tryIt: [
          '把标准差之比拉到 2 以上，看 Levene 的 p 值变小。',
          '切到“数据右偏”，点“模拟 500 次”，对比方差比 F 检验和 Levene 的误报率。',
        ],
        points: [
          '为什么要做：Student t 检验和方差分析都假设各组方差相等。',
          'Levene 的原假设：各组方差相等。',
          '做法：z = |x − 本组中位数|，对 z 做单因素方差分析。用中位数的版本（Brown-Forsythe）更稳健，scipy.stats.levene 默认就是它。',
          '方差比 F 检验对非正态非常敏感，偏态数据下容易误报；Levene 更稳健。',
          '拿不准就直接用 Welch t 检验（equal_var=False），不需要方差相等。',
        ],
        source: [S('nist-levene', 'Levene Test for Equality of Variances'), S('sp-levene', "center='median'"), S('sp-ttest', 'equal_var=False（Welch）')],
      },
    ],

    questions: [
      // ---------- 15.1 选检验 ----------
      {
        id: 'st-pick-match', lesson: 'st-pick', type: 'match',
        prompt: '把场景和最常用的检验方法连起来。',
        pairs: [
          { left: '两组的人均 GMV（均值）', right: 't 检验（方差不齐用 Welch）' },
          { left: '两组的转化率，样本很大', right: '两比例 z 检验' },
          { left: '渠道 × 是否转化', right: '卡方独立性检验' },
          { left: '三个方案的均值', right: '方差分析（F 检验）' },
          { left: '严重偏态、极端值很多的两组', right: '曼-惠特尼 U 检验' },
        ],
        source: [S('didi-stat', '8. z 检验 / t 检验 / 卡方检验：知道什么时候用'), S('sp-anova', 'f_oneway'), S('sp-mwu', 'mannwhitneyu')],
      },
      {
        id: 'st-pick-c1', lesson: 'st-pick', type: 'choice',
        prompt: '同一批 500 个用户，改版前后各测一次使用时长，比较前后差异，用什么检验？',
        options: [
          { text: '配对 t 检验：先算每个用户前后的差值，再检验差值的均值是不是 0。', correct: true },
          { text: '两独立样本 t 检验。', trap: '概念混淆', why: '前后两次是同一批人，样本不独立，应该用配对检验。' },
          { text: '卡方检验。', trap: '概念混淆', why: '卡方检验看的是分类变量的计数，使用时长是连续数值。' },
        ],
        source: [S('sp-ttrel', 'ttest_rel')],
      },
      {
        id: 'st-pick-c2', lesson: 'st-pick', type: 'choice',
        prompt: '面试官：“选检验方法之前，你会先确认什么？”',
        options: [
          { text: '先看数据生成机制：指标是均值、比例还是计数；实验单位是什么、样本是否独立（同一用户重复观测、用户聚类）；分布是否偏态、有没有极端值。再决定用 t、z、卡方还是非参数检验。', correct: true },
          { text: '样本量够大就不用管别的，直接用 t 检验。', trap: '说过头', why: '样本大也不能忽略用户聚类、重复观测这类依赖性，它们会让标准误被低估。' },
          { text: '先跑一遍所有检验，挑 p 值最小的那个报告。', trap: '说过头', why: '这就是“捞显著”，会大大增加假阳性。方法要事先根据指标类型定好。' },
        ],
        source: [S('didi-stat', '8. z 检验 / t 检验 / 卡方检验；12. 多重比较、分层分析与“捞显著”')],
      },
      {
        id: 'st-pick-c3', lesson: 'st-pick', type: 'choice',
        prompt: '比较三个方案的均值，为什么不直接两两做三次 t 检验？',
        options: [
          { text: '每次检验都有 α 的误报概率，做很多次检验，至少一次误报的概率会越来越大（多重比较问题）。应该先做方差分析，显著后再做校正过的两两比较（比如 Bonferroni）。', correct: true },
          { text: '两两 t 检验比方差分析更精确，所以应该这么做。', trap: '说过头', why: '问题不在精确，而在多次检验会累积第一类错误。' },
          { text: 't 检验只能用于两组，所以三组根本没法比较。', trap: '概念混淆', why: '可以两两比较，只是要先做整体检验并校正多重比较。' },
        ],
        source: [S('didi-stat', '12. 多重比较、分层分析与“捞显著”'), S('nist-anova', 'One-Factor ANOVA')],
      },

      // ---------- 15.2 t / z 检验 ----------
      {
        id: 'st-t-sort', lesson: 'st-ttest', type: 'sort',
        prompt: '假设检验的步骤，按顺序排。',
        items: [
          '提出原假设 H0 和备择假设 H1',
          '选择显著性水平 α（常用 0.05）',
          '计算检验统计量和 p 值',
          'p < α 拒绝 H0，否则“证据不足以拒绝 H0”',
          '再看效应量和置信区间，判断业务意义',
        ],
        answer: '**H0 / H1** → 选 **α** → 算**统计量和 p 值** → 和 α 比较下结论 → 看**效应量和置信区间**',
        source: [S('didi-stat', '6. 假设检验：一条主线就够')],
      },
      {
        id: 'st-t-c1', lesson: 'st-ttest', type: 'choice',
        prompt: 'p 值到底是什么？',
        options: [
          { text: '在原假设成立的前提下，观察到当前结果或更极端结果的概率。p 很小，说明当前数据和原假设不太一致。', correct: true },
          { text: '原假设为真的概率。', trap: '概念混淆', why: 'p 值是“假设 H0 为真时”算出来的，它不是 H0 为真的概率。' },
          { text: '实验结果是由随机造成的概率。', trap: '概念混淆', why: '这是最常见的误解，p 值不是这个意思。' },
        ],
        source: [S('didi-stat', '6. 假设检验：p-value 到底是什么？')],
      },
      {
        id: 'st-t-c2', lesson: 'st-ttest', type: 'choice',
        prompt: '新策略的实验 p = 0.20，你怎么下结论？',
        options: [
          { text: '证据不足以拒绝原假设：这次实验没能检测出显著效果。不能说“证明了新策略没用”，可能是效应太小或样本不够（功效不足），可以结合置信区间和 MDE 一起说明。', correct: true },
          { text: '接受原假设，证明新策略无效。', trap: '说过头', why: '不显著只是“没有足够证据”，不等于证明没有效果。' },
          { text: '说明新策略有 80% 的概率有效。', trap: '概念混淆', why: 'p 值不能这样换算成“有效的概率”。' },
        ],
        source: [S('didi-stat', '6. 假设检验；7. 第一类错误、第二类错误与统计功效')],
      },
      {
        id: 'st-t-c3', lesson: 'st-ttest', type: 'choice',
        prompt: 't 检验和 z 检验有什么区别？',
        options: [
          { text: 't 检验最常用来比较两个均值，适合小样本、总体方差未知；z 检验用于大样本的均值或比例，转化率 A/B 测试常用。样本量大时 t 分布非常接近正态，两者结果几乎一样。', correct: true },
          { text: 't 检验只能用于大样本，小样本要用 z 检验。', trap: '概念混淆', why: '反了：小样本、方差未知时用 t 检验。' },
          { text: 'z 检验只能比较均值，不能比较比例。', trap: '概念混淆', why: '两比例 z 检验正是转化率 A/B 测试最常用的方法。' },
        ],
        source: [S('didi-stat', '8. z 检验 / t 检验 / 卡方检验'), S('nist-t2', 'Two-Sample t-Test')],
      },
      {
        id: 'st-t-c4', lesson: 'st-ttest', type: 'choice',
        prompt: '第一类错误、第二类错误和功效分别是什么？',
        options: [
          { text: '第一类错误 α：原假设是真的却拒绝了（误报，以为策略有效其实没效）；第二类错误 β：原假设是假的却没拒绝（漏报）；功效 = 1 − β，真实有效果时检测出来的概率。样本越多、效果越大、噪声越小，功效越高。', correct: true },
          { text: '第一类错误是漏报，第二类错误是误报。', trap: '概念混淆', why: '说反了：第一类是误报（假阳性），第二类是漏报（假阴性）。' },
          { text: '把 α 从 0.05 改成 0.01，误报少了，功效也会更高。', trap: '概念混淆', why: 'α 定得越严，越难拒绝 H0，功效会下降。' },
        ],
        source: [S('didi-stat', '7. 第一类错误、第二类错误与统计功效')],
      },
      {
        id: 'st-t-c5', lesson: 'st-ttest', type: 'choice',
        prompt: '面试官：“你 X5 项目里，短信的平均效应是怎么检验的？”',
        options: [
          { text: '比较两组购买率：实验组 63.65%、对照组 60.33%，差 3.32 个百分点。标准误用不合并方差的公式，0.217 个百分点，z = 15.32，95% 置信区间 [2.90, 3.75]。又用回归 target ~ treatment 加稳健标准误做了一遍，结果一致。', correct: true },
          { text: '购买率提升了 3.32%，z = 3.32。', trap: '数字记错', why: '3.32 是“个百分点”（绝对差），相对提升是 5.5%；z 是 15.32。' },
          { text: '用的是配对 t 检验，因为同一批客户前后各看了一次。', trap: '概念混淆', why: '实验组和对照组是两批不同的客户，是独立样本的比例比较。' },
        ],
        source: [S('x5', '第 4 步：平均处理效应（ATE）'), S('x5-log', '平均处理效应')],
      },
      {
        id: 'st-t-c6', lesson: 'st-ttest', type: 'choice',
        prompt: '什么是最小可检测效应（MDE）？',
        options: [
          { text: '在 5% 显著性水平、80% 功效下，实验能可靠检测到的最小效应，约等于 (1.96 + 0.84) × 标准误。MDE 越小，需要的样本量越大。X5 项目不调整时 MDE 是 0.61 个百分点。', correct: true },
          { text: 'MDE = 1.96 × 标准误。', trap: '数字记错', why: '还要加上 80% 功效对应的 0.84：(1.96 + 0.84) × SE。' },
          { text: 'MDE 就是实验最后实际测出来的效应。', trap: '概念混淆', why: 'MDE 是实验前规划的“检测能力”，不是实验结果。' },
        ],
        source: [S('x5-qa', '10. 什么是最小可检测效应（MDE）？'), S('x5', '第 7 步：最小可检测效应（MDE）'), S('didi-stat', '11. MDE、样本量与“显著但没用”')],
      },
      {
        id: 'st-t-c7', lesson: 'st-ttest', type: 'choice',
        prompt: '为什么说“统计显著 ≠ 业务显著”？',
        options: [
          { text: 'p 值受样本量影响，大样本下很小的提升也会显著，但收益可能覆盖不了成本。所以要同时报告绝对变化、相对 lift、置信区间和对应的收益成本。X5 判断分组平衡时也是用 SMD 衡量差异大小，而不是只看 p 值。', correct: true },
          { text: 'p 值越小，说明效果越大。', trap: '概念混淆', why: 'p 值同时受效应大小和样本量影响，样本很大时微小效果也能 p 很小。' },
          { text: '只要显著就应该上线。', trap: '说过头', why: '还要看效果大小、成本、风险和护栏指标。' },
        ],
        source: [S('didi-stat', '11. MDE、样本量与“显著但没用”'), S('x5-qa', '7. 为什么判断平衡用 SMD，而不是只看 t 检验的 p 值？')],
      },
      {
        id: 'st-t-sort2', lesson: 'st-ttest', type: 'sort',
        prompt: 'A/B 实验的标准流程，按顺序排。',
        items: [
          '明确业务假设：改动为什么可能影响什么指标',
          '定义实验单位（用户 / 司机 / 城市 / 订单）',
          '确定主指标和护栏指标',
          '提前确定样本量、MDE 和实验时长',
          '随机分组，运行实验，做数据质量检查（分流、埋点、SRM）',
          '比较效应量 + 置信区间 + p 值',
          '结合业务收益和风险决定是否上线',
        ],
        answer: '业务假设 → 实验单位 → 主指标 / 护栏 → 样本量和 MDE → 分流和**质量检查** → 效应量 + CI + p → 上线决策',
        note: '速查原文还有“检查基线平衡”和“分层分析放在主结论之后”两步，这里合并了。',
        source: [S('didi-stat', '9. A/B Test：标准流程')],
      },
      {
        id: 'st-t-match', lesson: 'st-ttest', type: 'match',
        prompt: '把概念和它的意思连起来。',
        pairs: [
          { left: 'p 值', right: 'H0 成立时，出现当前或更极端结果的概率' },
          { left: '第一类错误 α', right: '误报：没效果却判为有效' },
          { left: '第二类错误 β', right: '漏报：有效果却没检测出来' },
          { left: '功效 1 − β', right: '真有效果时能检测出来的概率' },
        ],
        source: [S('didi-stat', '6. 假设检验；7. 第一类错误、第二类错误与统计功效')],
      },
      {
        id: 'st-t-recite', lesson: 'st-ttest', type: 'recite',
        prompt: '请讲一下 t 检验 / z 检验，最好结合你的项目。',
        targetSeconds: 75,
        answer: '假设 → 统计量 → t 还是 z → p 值 → 两类错误和功效 → X5 例子 → 业务意义',
        points: [
          '假设：H0 两组没有差别，α 常用 0.05',
          '统计量 = 差 ÷ 标准误',
          't 检验比较均值，小样本、方差未知；z 检验用于大样本均值或比例',
          'p 值：H0 成立时出现当前或更极端结果的概率；p < α 拒绝 H0',
          '两类错误：α 误报，β 漏报，功效 1 − β；MDE ≈ (1.96 + 0.84) × SE',
          'X5：63.65% vs 60.33%，差 3.32 个百分点，SE 0.217，z = 15.32，CI [2.90, 3.75]',
          '最后看效应量和置信区间，统计显著不等于业务显著',
        ],
        source: [S('didi-stat', '6. 假设检验；7. 第一类错误、第二类错误与统计功效；8. z 检验 / t 检验 / 卡方检验'), S('x5', '第 4 步：平均处理效应（ATE）；第 7 步：最小可检测效应（MDE）')],
      },

      // ---------- 15.3 F 检验 ----------
      {
        id: 'st-f-c1', lesson: 'st-ftest', type: 'choice',
        prompt: '方差分析里的 F 统计量是什么？显著说明什么？',
        options: [
          { text: 'F = 组间均方 ÷ 组内均方，原假设是所有组均值相等。显著只说明至少有一组和别的不同，具体是哪组要再做两两比较（并校正多重比较）。', correct: true },
          { text: 'F 显著说明每两组之间都有显著差异。', trap: '说过头', why: '只能说明“不全相等”，不能说明每一对都不同。' },
          { text: '方差分析比较的是各组的方差大小，所以叫方差分析。', trap: '概念混淆', why: '它比较的是均值，只是用“分解方差（波动）”的方法来做。' },
        ],
        source: [S('nist-anova', 'One-Factor ANOVA'), S('sp-anova', 'f_oneway')],
      },
      {
        id: 'st-f-c2', lesson: 'st-ftest', type: 'choice',
        prompt: '用方差比 F 检验比较两组方差，有什么要注意的？',
        options: [
          { text: 'F = 两个样本方差之比，它对“数据是否正态”非常敏感：数据偏态或有极端值时容易误报。所以检验方差齐性更常用 Levene 检验。', correct: true },
          { text: 'F 检验对极端值很稳健，什么数据都可以用。', trap: '概念混淆', why: '恰恰相反，它对非正态和极端值很敏感。' },
          { text: 'F 值越接近 0，说明两组方差越接近。', trap: '概念混淆', why: '方差相等时 F 在 1 附近。' },
        ],
        source: [S('nist-f', 'F-Test for Equality of Two Variances'), S('nist-levene', 'Levene Test')],
      },

      // ---------- 15.4 方差齐性 ----------
      {
        id: 'st-lev-c1', lesson: 'st-levene', type: 'choice',
        prompt: '什么是方差齐性检验？为什么要做？',
        options: [
          { text: '检验各组的总体方差是否相等。Student t 检验和方差分析都假设方差相等，所以要先看一下；常用 Levene 检验。不齐的话，比较均值用 Welch t 检验。', correct: true },
          { text: '方差不齐就不能比较两组均值了。', trap: '说过头', why: '可以，用 Welch t 检验（不假设方差相等）就行。' },
          { text: 'Levene 检验的原假设是“各组方差不相等”。', trap: '概念混淆', why: '原假设是方差相等；p 小才说明方差不齐。' },
        ],
        source: [S('nist-levene', 'Levene Test for Equality of Variances'), S('sp-ttest', 'equal_var=False（Welch）')],
      },
      {
        id: 'st-lev-c2', lesson: 'st-levene', type: 'choice',
        prompt: 'Levene 检验具体怎么做？为什么比方差比 F 检验更常用？',
        options: [
          { text: '把每个数换成它离本组中位数（或均值）的距离，再对这些距离做方差分析；波动大的组距离普遍更大。用中位数的版本对偏态和极端值更稳健，scipy.stats.levene 默认就用中位数。', correct: true },
          { text: 'Levene 直接比较两组的样本方差之比。', trap: '概念混淆', why: '那是方差比 F 检验；Levene 是对“离中心的距离”做方差分析。' },
          { text: 'Levene 只能比较两组。', trap: '概念混淆', why: '可以比较多组，本质是一次方差分析。' },
        ],
        source: [S('nist-levene', 'Levene Test for Equality of Variances'), S('sp-levene', "center='median'")],
      },
    ],
  });
})();
