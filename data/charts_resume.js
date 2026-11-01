// 简历篇的“项目数字图”：把面试要报的数字画成图，方便记。
// 规则和题目一样：数字只来自材料，每张图写出处；文档之间冲突时按背诵稿和简历（见 docs/题库大纲.md）。
// 标题、一句话、备注里用 **…** 包起来的是数字，“遮住数字”时会被盖住。
//
// type: 'bars'  横条：items [{ label, value, text?（显示的文字，默认 value+unit）, sub?, hl?（重点）, parts?（分段）}]，ref?（参考线）
//       'lines' 折线：x [数字], xText（x 轴怎么显示）, series [{ name, values, hl?, base?（灰色参考线）}], mark（要标数字的那个 x 的下标）
//       'tiles' 数字卡：items [{ value, label, sub? }]
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.addCharts([
    // ---------- X5 短信项目 ----------
    {
      id: 'x5-ab', chapter: 'resume_x5', type: 'bars', unit: '%', max: 100,
      title: '短信让购买率提升了 **3.32 个百分点**',
      say: '约 **20 万**客户随机分两组：不发短信的购买率 **60.33%**，发了的 **63.65%**。',
      items: [
        { label: '对照组（不发短信）', value: 60.33 },
        { label: '实验组（发短信）', value: 63.65, hl: true },
      ],
      note: '95% 置信区间 **[2.90, 3.75]** 个百分点，相对提升 **5.5%**。',
      source: [S('x5', '阶段 1 › 第 4 步 平均处理效应'), S('bs', '二、短信项目 › 骨架')],
    },
    {
      id: 'x5-topk', chapter: 'resume_x5', type: 'lines', unit: '%',
      title: '只发前 30%：增益模型拿到 **59.3%** 的增量，传统购买预测只有 **13.3%**',
      say: '按增量挑的前 30% 贡献了 **59.3%** 的增量购买；按“谁最可能买”挑的前 30% 只有 **13.3%**，还不如随机发。',
      x: [0, 10, 30, 50, 100], xText: (v) => `${v}%`, xTitle: '发给多少客户（按模型的排序从前往后发）', yTitle: '拿到全部增量的比例',
      series: [
        { name: '增益模型（按增量排）', values: [0, 25.4, 59.3, 75.8, 100], hl: true },
        { name: '传统购买预测（按“最可能买”排）', values: [0, 3.4, 13.3, 40.6, 100] },
        { name: '随机发', values: [0, 10, 30, 50, 100], base: true },
      ],
      mark: 2,
      note: '测试集上的结果；全部发送时三条线都到 100%。',
      source: [S('bs', '二、短信项目 › 背诵版 第 2 段'), S('x5', '阶段 4 › 增益曲线和 Qini 曲线')],
    },
    {
      id: 'x5-groups', chapter: 'resume_x5', type: 'bars', unit: ' 个百分点',
      title: '可说服的人增量 **6.02**，铁定买的人只有 **1.56**',
      say: '可说服的人收到短信后购买率提升 **6.02** 个百分点；铁定买的人只提升 **1.56**，他们不发也有八成以上会买。',
      items: [
        { label: '可说服', value: 6.02, hl: true, sub: '占 31.2% · 不发也会买 41.0%' },
        { label: '高基础、仍有增量', value: 3.46, sub: '占 18.8% · 不发也会买 74.8%' },
        { label: '铁定买', value: 1.56, hl: true, sub: '占 31.2% · 不发也会买 83.4%' },
        { label: '发了也没用', value: 0.19, sub: '占 18.8% · 不发也会买 40.4%' },
      ],
      ref: { value: 3.32, text: '平均 3.32' },
      note: '实际增量 = 测试集上这一类“发了的人减没发的人”的购买率差。四类的叫法按背诵稿。',
      source: [S('bs', '三 › 四类客户一览'), S('x5', '阶段 5 › 四类人群')],
    },
    {
      id: 'x5-profit', chapter: 'resume_x5', type: 'bars', unit: '',
      title: '只发约一半客户，比全部都发多赚约 **16%**',
      say: '把客户按增量从高到低排，发给大约一半时利润最高，比全部都发多赚约 **16%**。',
      items: [
        { label: '全部都发', value: 12741, text: '12,741' },
        { label: '按增量只发前 50%', value: 14828, text: '14,828', hl: true },
      ],
      note: '每 1 万名客户的利润。短信成本和毛利是假设的参数，成本变了，最优比例也会变。',
      source: [S('bs', '二、短信项目 › 常见追问「16% 怎么算的？」'), S('x5', '阶段 5 › ROI 模拟')],
    },
    {
      id: 'x5-scale', chapter: 'resume_x5', type: 'tiles',
      title: '数据规模',
      items: [
        { value: '约 20 万', label: '实验客户', sub: '随机分成两组' },
        { value: '约 4580 万行', label: '交易流水', sub: '用 SQL 处理' },
        { value: '43 个', label: '客户特征' },
      ],
      source: [S('bs', '二、短信项目 › 骨架')],
    },

    // ---------- AI Agent 项目 ----------
    {
      id: 'ag-gmv', chapter: 'resume_agent', type: 'bars', unit: '%',
      title: '“GMV 涨了 **56%**”，扣掉以后净销售只涨约 **1.6%**',
      say: '那一周只有 **5** 个交易日、上周是 **6** 个，还混着一笔后来被取消的大单；助手把这个提示放在报告最前面。',
      items: [
        { label: 'GMV 看起来的涨幅', value: 56 },
        { label: '扣掉取消大单后，净销售的涨幅', value: 1.6, text: '约 1.6%', hl: true },
      ],
      source: [S('bs', '一、AI Agent 项目 › 背诵版')],
    },
    {
      id: 'ag-acc', chapter: 'resume_agent', type: 'bars', unit: '%', max: 100,
      title: '答对率：**一半左右** → **九成左右**',
      say: '出了 **20** 道故意埋了陷阱的测试题：只让 AI 写初稿时大概答对一半，加上数字核对和自动重写以后能答对九成左右。',
      items: [
        { label: '只让 AI 写初稿', value: 50, text: '一半左右' },
        { label: '加上数字核对和自动重写', value: 90, text: '九成左右', hl: true },
      ],
      note: '背诵稿用的是约数，面试时也说约数。',
      source: [S('bs', '一、AI Agent 项目 › 背诵版'), S('bs', '一 › 只报这几个数字')],
    },
    {
      id: 'ag-scale', chapter: 'resume_agent', type: 'tiles',
      title: '其他要报的数字',
      items: [
        { value: '约 107 万行', label: '公开电商数据集的订单记录' },
        { value: '每周一', label: '自动运行，生成运营周报' },
        { value: '约 29%', label: '加“分析流程手册”多花的调用成本', sub: '加不加都是 20 题对 9 题' },
      ],
      source: [S('bs', '一 › 只报这几个数字'), S('bs', '一 › 常见追问「遇到过什么困难？」')],
    },

    // ---------- 建行实习 ----------
    {
      id: 'ccb-tiles', chapter: 'resume_ccb', type: 'tiles',
      title: '建行实习的数字',
      items: [
        { value: '数百条', label: '核验的新入职员工档案', sub: '具体条数记不准就说“几百条”' },
        { value: '20 多项', label: '定位到的异常', sub: '字段缺失、重复录入、跨表对不上' },
        { value: '两个月', label: '实习时长', sub: '2024.07–2024.08' },
      ],
      source: [S('cv', '中国建设银行 广东自贸区分行'), S('star', '二 › 问 1')],
    },

    // ---------- 大创项目 ----------
    {
      id: 'dc-funnel', chapter: 'resume_dachuang', type: 'bars', unit: '%', max: 100,
      title: '试饮 → 复购落差最大：**89.7%** → **66.5%**，少了 **23.2** 个百分点',
      say: '愿意尝一次的人有近九成，但愿意持续多花钱的只有三分之二，所以重点放在让第一杯喝得值。',
      items: [
        { label: '认知：支持药食同源产品', value: 90.3 },
        { label: '兴趣：对中药配方饮品感兴趣', value: 71.6 },
        { label: '试饮：会尝试中药果醋饮品', value: 89.7, hl: true, parts: [{ label: '绝对会', value: 32.9 }, { label: '可能会', value: 56.8 }], sub: '绝对会 32.9% + 可能会 56.8%' },
        { label: '复购：愿意为健康功能饮品多花钱', value: 66.5, hl: true },
      ],
      note: '每一层是一道不同的题、在全部 **155** 人里的占比，不是同一批人逐层追踪，所以不一定逐层递减。“复购”用付费意愿代替，是意愿，不是真实行为。',
      source: [S('star', '三、大创项目 › A 行动 第二步'), S('cv', '大学生创新创业训练项目')],
    },
    {
      id: 'dc-care', chapter: 'resume_dachuang', type: 'bars', unit: '%', max: 100,
      title: '最关心健康益处（**59.4%**）和口感（**31.6%**）',
      say: '所以话术突出健康功效，配方保证口感；价格只有 **8.4%** 的人最关心。',
      items: [
        { label: '健康益处', value: 59.4, hl: true },
        { label: '口感', value: 31.6, hl: true },
        { label: '价格', value: 8.4 },
      ],
      source: [S('star', '三 › A 行动 第三步')],
    },
    {
      id: 'dc-age', chapter: 'resume_dachuang', type: 'bars', unit: '%', max: 100,
      title: '样本偏年长：35 岁以上占 **46.5%**，目标客群 20–30 岁只有 **16.1%**',
      say: '这是方便抽样，代表性有限，结论只能当方向参考。被问到时主动说出这个局限。',
      items: [
        { label: '15–20 岁', value: 33.6 },
        { label: '20–30 岁（目标客群）', value: 16.1, hl: true },
        { label: '35 岁以上', value: 46.5 },
      ],
      note: '材料里只列了这三个年龄段。',
      source: [S('star', '四 › 问 7'), S('ai', '项目：大创醋饮品牌创业实践 › 问卷里的关键数字')],
    },
    {
      id: 'dc-tiles', chapter: 'resume_dachuang', type: 'tiles',
      title: '调研和经营的数字',
      items: [
        { value: '150 多份', label: '回收的问卷', sub: '有效 155 份' },
        { value: '6+', label: '梳理过的主流茶饮品牌' },
        { value: '10–15 元', label: '定价', sub: '卡在主力价格带' },
        { value: '约 5 元', label: '一杯中杯的成本' },
        { value: '3 天', label: '不利天气下实现盈亏平衡' },
      ],
      source: [S('cv', '大学生创新创业训练项目'), S('star', '三 › A 行动 第四步')],
    },

    // ---------- 自我介绍 ----------
    {
      id: 'intro-tiles', chapter: 'resume_intro', type: 'tiles',
      title: '自我介绍和基本情况',
      items: [
        { value: '4.02', label: '本科 GPA', sub: '满分 5' },
        { value: '13/93', label: '专业排名' },
        { value: '6.5 / 545', label: 'IELTS / CET-6' },
        { value: '11 月 2 日', label: '可以到岗' },
        { value: '6 个月', label: '能实习的时长', sub: 'JD 要求 3 个月以上' },
      ],
      source: [S('didi', '一 › 面试策略（两个硬优势）'), S('didi', '二 › 中文版')],
    },
  ]);
})();
