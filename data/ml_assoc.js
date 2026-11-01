// 机器学习篇 · 7 关联规则（Apriori、FP-Tree）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'ml_assoc',
    part: { id: 'ml', title: '机器学习篇', order: 2, desc: '先看动画讲解，再做题' },
    order: 70,
    title: '关联规则',
    subtitle: 'Apriori、FP-Tree（FP-Growth）',
    badge: '联',
    intro: '记住三个指标（支持度、置信度、提升度）和两种算法的区别就够了。',

    lessons: [
      {
        id: 'ml-apriori', title: '4.4.1 Apriori', stars: 0, lab: 'apriori',
        oneLiner: 'Apriori 一层层找频繁项集：先找频繁的单个商品，再拼出两件、三件的组合；只要一个组合的某个子集不频繁，它本身就不可能频繁，可以直接剪掉。',
        tryIt: [
          '点“下一层”，一层层看候选项集怎么被数、被剪。',
          '把最小支持度调到 2，看第 3 层出现“剪枝”。',
          '拉最小置信度，看哪些规则留下；留意提升度是否大于 1。',
        ],
        points: [
          '支持度：A 和 B 同时出现的订单占比。',
          '置信度：买了 A 的订单里也买了 B 的比例，即 P(B | A)。',
          '提升度：置信度 ÷ B 本身的支持度；大于 1 才说明有正向关联，等于 1 说明相互独立。',
          'Apriori 原理：频繁项集的子集一定频繁 → 反过来用来剪枝。',
          '缺点：每一层都要扫一遍数据，候选集可能很多。',
          '应用：购物篮分析、商品搭配推荐、套餐组合。',
        ],
        source: [S('mlx-rules', 'support、confidence、lift')],
      },
      {
        id: 'ml-fptree', title: '4.4.2 FP-Tree（FP-Growth）', stars: 0, lab: 'fptree',
        oneLiner: 'FP-Growth 只扫描两遍数据：第一遍数频次、排序，第二遍把订单插进一棵 FP 树（共同前缀合并）；之后在树上递归挖频繁项集，不用生成大量候选。',
        tryIt: ['点“插入下一张订单”，看共同前缀怎么被合并、计数怎么累加。'],
        points: [
          '第一遍：统计每个商品的支持度，去掉不频繁的，按频次从高到低排序。',
          '第二遍：每张订单按这个顺序插入前缀树，相同前缀共享路径、计数累加。',
          '挖掘：从每个商品出发收集它的路径（条件模式基），递归构造条件 FP 树。',
          '比 Apriori 快：不生成候选集、扫描次数少；结果和 Apriori 一样。',
        ],
        source: [S('mlx-fp', 'FP-Growth vs Apriori'), S('fp-paper', '论文')],
      },
    ],

    questions: [
      {
        id: 'ml-ap-c1', lesson: 'ml-apriori', type: 'choice',
        prompt: '支持度、置信度、提升度分别是什么？',
        options: [
          { text: '支持度：A 和 B 同时出现的订单占比；置信度：买了 A 的订单里也买了 B 的比例，即 P(B | A)；提升度：置信度除以 B 本身的支持度，大于 1 说明买 A 让买 B 更常见，等于 1 说明两者独立。', correct: true },
          { text: '置信度高就说明 A 和 B 一定有关联，不用看提升度。', trap: '说过头', why: '如果 B 本来就很常见，置信度也会很高；要看提升度是否大于 1。' },
          { text: '提升度等于 1 说明强关联。', trap: '概念混淆', why: '等于 1 说明相互独立，没有关联。' },
        ],
        source: [S('mlx-rules', 'support、confidence、lift')],
      },
      {
        id: 'ml-ap-sort', lesson: 'ml-apriori', type: 'sort',
        prompt: 'Apriori 的步骤，按顺序排。',
        items: [
          '设定最小支持度',
          '扫描数据，找出频繁 1 项集',
          '用频繁 k 项集拼出 k+1 项候选，剪掉含不频繁子集的',
          '扫描数据数候选的支持度，留下频繁的',
          '重复直到没有新的频繁项集，再从中生成关联规则',
        ],
        answer: '最小支持度 → 频繁 1 项集 → 拼候选并**剪枝** → 数支持度 → 重复 → 生成**规则**',
        source: [S('mlx-rules', 'association_rules')],
      },
      {
        id: 'ml-fp-c1', lesson: 'ml-fptree', type: 'choice',
        prompt: 'FP-Growth 比 Apriori 好在哪里？',
        options: [
          { text: '不用一层层生成候选项集，也不用每层都扫描数据：只扫两遍数据建一棵 FP 树，之后在树上递归挖掘，数据大时快得多。', correct: true },
          { text: 'FP-Growth 能找出 Apriori 找不到的频繁项集。', trap: '说过头', why: '在同样的最小支持度下，两者找出的频繁项集一样，区别在效率。' },
          { text: 'FP-Growth 不需要设最小支持度。', trap: '概念混淆', why: '同样要设最小支持度。' },
        ],
        source: [S('mlx-fp', 'FP-Growth vs Apriori'), S('fp-paper', '论文')],
      },
    ],
  });
})();
