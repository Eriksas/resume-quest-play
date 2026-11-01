// 简历篇 · 自我介绍、SQL 与 Excel（滴滴拉美外卖运营实习）
// 全部来自滴滴准备稿：二（自我介绍）、四（SQL）、五（Excel）、七（通用问题）。
// 自我介绍原文里的名字换成了“（你的名字）”，游戏里不放个人信息。
QuizBank.register({
  id: 'resume_intro',
  part: { id: 'resume', title: '简历篇', order: 1, desc: '按简历讲，不讲太深' },
  order: 50,
  title: '自我介绍、SQL 与 Excel',
  subtitle: '中英文自我介绍 + 运营岗常问的取数题',
  badge: '介',
  intro: '中英文自我介绍各约 1 分半，数字只说三个：20 万客户、约一半客户、多赚约 16%。SQL 和 Excel 考的是“给你一张表，能不能自己把数取出来”。',

  questions: [
    // ---------- 自我介绍 ----------
    {
      id: 'intro-sort-cn',
      type: 'sort',
      prompt: '中文自我介绍的结构，按顺序排。',
      items: [
        '我是谁：浙大数字经济研一，本科东财金融，GPA 4.02，排名 13/93',
        '第一点 用户增长：短信项目，只发约一半客户，多赚约 16%',
        '第二点 指标监测和复盘：AI 辅助分析流程、每周自动周报、SQL 和 Excel',
        '第三点 市场和竞品调研：大创项目，6 个以上品牌、问卷漏斗',
        '为什么想来：市场变化快，要用英语、跨时差协作',
        '到岗：11 月 2 日到岗，每周五天，实习 6 个月',
      ],
      answer: '我是谁 → 三点匹配（**用户增长 → 指标监测 → 竞品调研**，正好对应 JD 前三条）→ 为什么想来 + 到岗时间',
      note: '要求 30 秒版：只保留“我是谁”和第一点（短信项目），再加一句“我可以 11 月 2 日到岗，实习 6 个月”。',
      source: [
        { file: 'didi', section: '二、自我介绍 › 结构、中文版' },
        { file: 'didi', section: '二 › 讲的时候注意' },
      ],
    },

    {
      id: 'intro-match-numbers',
      type: 'match',
      prompt: '自我介绍和基本情况里的数字，连起来。',
      pairs: [
        { left: '4.02', right: '本科 GPA（满分 5）' },
        { left: '13/93', right: '专业排名' },
        { left: '20 万', right: '短信项目的实验客户数' },
        { left: '约 16%', right: '只发约一半客户，比全发多赚的利润' },
        { left: '11 月 2 日', right: '可以到岗的时间' },
        { left: '6 个月', right: '能实习的时长（JD 只要求 3 个月以上）' },
      ],
      note: '另一个硬优势：IELTS 6.5、CET-6 545 分。',
      source: [
        { file: 'didi', section: '一 › 面试策略（两个硬优势）' },
        { file: 'didi', section: '二 › 中文版' },
        { file: 'cv', section: '教育背景' },
      ],
    },

    {
      id: 'gen-c-why-ops',
      type: 'choice',
      prompt: '为什么选运营，不做数据岗？',
      options: [
        { text: '我更喜欢数据能落到动作上。短信项目里最有成就感的不是模型，而是“只给一半人发反而多赚钱”这个投放决策。运营岗能让我用数据决定圈谁、给什么，并且很快看到结果。', correct: true },
        { text: '因为数据岗要求太高，我技术还不够。', trap: '说偏了', why: '等于承认自己不行，也没说出你想做运营的真正原因。' },
        { text: '短信项目里我做了 S/T/X-Learner 和 Qini 系数评估，模型这块已经做透了，想换个方向。', trap: '讲太深', why: '运营面试官不爱听算法，滴滴准备稿要求不主动讲增益模型原理。重点是“数据落到决策”。' },
      ],
      source: [
        { file: 'didi', section: '七 › 中文通用问题「为什么选运营，不做数据岗？」' },
        { file: 'didi', section: '一 › 面试策略' },
      ],
    },

    {
      id: 'gen-c-language',
      type: 'choice',
      prompt: '你会西班牙语或葡萄牙语吗？',
      options: [
        { text: '目前不会，工作中我会用英语沟通。如果入职，我会先学外卖场景里常用的词，方便看竞品和用户评价。', correct: true },
        { text: '会一点西班牙语，日常交流没问题。', trap: '说过头', why: '滴滴准备稿：不要说自己会。' },
        { text: '不会，不过用翻译软件应该就够了。', trap: '说偏了', why: '听起来不想投入。要说“会先学外卖场景里常用的词”。' },
      ],
      source: [{ file: 'didi', section: '七 › 中文通用问题「你会西班牙语或葡萄牙语吗？」' }],
    },

    {
      id: 'gen-c-start',
      type: 'choice',
      prompt: '什么时候到岗？能实习多久？一周几天？',
      options: [
        { text: '11 月 2 日可以到岗，实习 6 个月，每周五天。', correct: true },
        { text: '11 月 20 日到岗，实习 3 个月，每周四天。', trap: '数字记错', why: '是 11 月 2 日到岗、6 个月、每周五天，和简历保持一致。' },
        { text: '要看研一的课程安排，到时候再说。', trap: '说偏了', why: '不要当场含糊。提前按实际课表想好怎么安排。' },
      ],
      source: [{ file: 'didi', section: '七 › 中文通用问题「什么时候到岗？」' }],
    },

    {
      id: 'gen-c-strength',
      type: 'choice',
      prompt: '你最大的优势是什么？',
      options: [
        { text: '数据和业务都能接住。我能自己用 SQL 取数、用 Excel 做报表，也习惯先问“这个数对业务意味着什么”。比如发券，我会先想增量而不是核销率。', correct: true },
        { text: '我做事认真，抗压能力强。', trap: '说偏了', why: '太泛，没有例子。每个说法都要接一个项目里的例子。' },
        { text: '我最大的优势是会做各种机器学习模型。', trap: '讲太深', why: '运营岗看的是能不能看数、用数说话、有没有运营思维；主打模型会把话题引到算法上。' },
      ],
      source: [
        { file: 'didi', section: '七 › 中文通用问题「你最大的优势是什么？」' },
        { file: 'didi', section: '一 › 岗位拆解' },
      ],
    },

    // ---------- SQL ----------
    {
      id: 'sql-sort-order',
      type: 'sort',
      prompt: 'SQL 的执行顺序，按顺序排。',
      items: ['FROM / JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT（窗口函数在这一步算）', 'DISTINCT', 'ORDER BY', 'LIMIT'],
      answer: 'FROM / JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT',
      note: '所以 WHERE 里不能用 SELECT 起的别名，也不能直接用窗口函数的结果过滤，要套一层子查询。',
      source: [{ file: 'didi', section: '四 › 问 1：SQL 的执行顺序' }],
    },

    {
      id: 'sql-c-level',
      type: 'choice',
      prompt: '你的 SQL 用到什么程度？',
      options: [
        { text: '日常取数没问题，JOIN、分组聚合、窗口函数都常用。短信项目里我用 SQL 处理过约 4580 万行交易流水，给每个客户算 RFM 这类指标。', correct: true },
        { text: '我精通 SQL，数据库调优、存储过程都很熟。', trap: '说过头', why: '运营岗考的是能不能自己取数；说“精通、调优”会被追问到你不熟的地方。' },
        { text: '处理过约 458 万行交易流水。', trap: '数字记错', why: '是约 4580 万行。' },
      ],
      source: [{ file: 'didi', section: '四 › SQL 常问问题（开头）' }],
    },

    {
      id: 'sql-c-alias',
      type: 'choice',
      prompt: 'WHERE 里能不能用 SELECT 里起的别名？',
      options: [
        { text: '不能。WHERE 在 SELECT 之前执行，所以用不了别名，也不能直接用窗口函数的结果过滤，要套一层子查询。', correct: true },
        { text: '能，因为 SELECT 是最先执行的。', trap: '概念混淆', why: '最先执行的是 FROM / JOIN；SELECT 在 WHERE、GROUP BY、HAVING 之后。' },
        { text: '不能，因为 WHERE 在 ORDER BY 之后执行。', trap: '概念混淆', why: '结论对、原因错：WHERE 在 SELECT 和 ORDER BY 之前执行。' },
      ],
      source: [{ file: 'didi', section: '四 › 问 1' }],
    },

    {
      id: 'sql-c-having',
      type: 'choice',
      prompt: 'WHERE 和 HAVING 的区别？',
      options: [
        { text: 'WHERE 在分组前过滤行，不能用聚合函数；HAVING 在分组后过滤组，可以写 HAVING COUNT(*) > 3。能用 WHERE 就用 WHERE，先过滤数据量小。', correct: true },
        { text: '两个一样，只是写的位置不同。', trap: '概念混淆', why: '一个在分组前过滤行，一个在分组后过滤组。' },
        { text: 'WHERE 可以用聚合函数，HAVING 不行。', trap: '概念混淆', why: '说反了：HAVING 可以用聚合函数，WHERE 不行。' },
      ],
      source: [{ file: 'didi', section: '四 › 问 2' }],
    },

    {
      id: 'sql-c-leftjoin',
      type: 'choice',
      prompt: 'LEFT JOIN 有什么坑？',
      options: [
        { text: '一是右表的筛选条件写在 WHERE 里，会把没匹配上的行过滤掉，变成 INNER JOIN，要写在 ON 里；二是右表的键不唯一时行数会变多，求和就重复算了。', correct: true },
        { text: 'LEFT JOIN 只保留两边都有的行。', trap: '概念混淆', why: '那是 INNER JOIN。LEFT JOIN 保留左表全部，右表没有的填 NULL。' },
        { text: '右表的筛选条件应该写在 WHERE 里，写在 ON 里不起作用。', trap: '概念混淆', why: '正好反了：写在 WHERE 里会把没匹配上的行过滤掉，变成 INNER JOIN。' },
      ],
      source: [{ file: 'didi', section: '四 › 问 3' }],
    },

    {
      id: 'sql-c-count',
      type: 'choice',
      prompt: '在订单表里算“下单用户数”，用哪个 COUNT？',
      options: [
        { text: 'COUNT(DISTINCT user_id)。COUNT(*) 数行数，适合算订单数；COUNT(列) 不数 NULL；COUNT(DISTINCT 列) 数去重后的个数。', correct: true },
        { text: 'COUNT(*)，因为每一行就是一个用户。', trap: '概念混淆', why: '订单表里一个用户可能有很多行，COUNT(*) 算出来的是订单数。' },
        { text: 'COUNT(user_id)，它会自动去重。', trap: '概念混淆', why: 'COUNT(列) 只是不数 NULL，不会去重。' },
      ],
      source: [{ file: 'didi', section: '四 › 问 4' }],
    },

    {
      id: 'sql-c-rank',
      type: 'choice',
      prompt: '对 100、100、90 排名，ROW_NUMBER、RANK、DENSE_RANK 分别给什么？',
      options: [
        { text: 'ROW_NUMBER 给 1、2、3（不并列）；RANK 给 1、1、3（并列后跳号）；DENSE_RANK 给 1、1、2（并列不跳号）。', correct: true },
        { text: 'ROW_NUMBER 给 1、1、2；RANK 给 1、2、3；DENSE_RANK 给 1、1、3。', trap: '数字记错', why: 'ROW_NUMBER 从不并列：1、2、3。' },
        { text: 'RANK 给 1、1、2；DENSE_RANK 给 1、1、3。', trap: '数字记错', why: '这两个说反了：RANK 跳号（1、1、3），DENSE_RANK 不跳号（1、1、2）。' },
      ],
      note: '取“每个用户第一单”用 ROW_NUMBER；取“前三名含并列”用 DENSE_RANK。',
      source: [{ file: 'didi', section: '四 › 问 5' }],
    },

    {
      id: 'sql-c-union',
      type: 'choice',
      prompt: 'UNION 和 UNION ALL 的区别？',
      options: [
        { text: 'UNION 会去重，慢一些；UNION ALL 不去重。确定没有重复时用 UNION ALL。', correct: true },
        { text: 'UNION ALL 会去重，UNION 不去重。', trap: '概念混淆', why: '说反了：UNION 去重，UNION ALL 不去重。' },
        { text: 'UNION 是左右拼接列，UNION ALL 是上下拼接行。', trap: '概念混淆', why: '两个都是上下拼接行，区别只在去不去重。' },
      ],
      source: [{ file: 'didi', section: '四 › 问 6' }],
    },

    {
      id: 'sql-c-null',
      type: 'choice',
      prompt: 'NULL 要注意什么？',
      options: [
        { text: 'NULL 和任何值比较都不是真，判断要用 IS NULL；AVG 会忽略 NULL，可能会把平均值算高；用 COALESCE(列, 0) 把 NULL 替成 0。', correct: true },
        { text: '判断是不是空值，写 = NULL 就行。', trap: '概念混淆', why: 'NULL 和任何值比较都不是真，要用 IS NULL。' },
        { text: 'AVG 会把 NULL 当成 0 来算。', trap: '概念混淆', why: 'AVG 会忽略 NULL，所以可能把平均值算高。' },
      ],
      source: [{ file: 'didi', section: '四 › 问 7' }],
    },

    {
      id: 'sql-c-slow',
      type: 'choice',
      prompt: '查询太慢怎么办？',
      options: [
        { text: '只取需要的列，不写 SELECT *；先用分区字段（比如日期）过滤再 JOIN；大表先聚合到需要的粒度再关联。', correct: true },
        { text: '先把几张大表全部 JOIN 起来，最后再统一用 WHERE 过滤。', trap: '概念混淆', why: '正好反了：要先过滤、先聚合，再关联。' },
        { text: '我会去改数据库的索引结构和执行引擎参数。', trap: '讲太深', why: '运营岗不考这个；说出来会被追问到你不熟的地方。' },
      ],
      source: [{ file: 'didi', section: '四 › 问 8' }],
    },

    // ---------- Excel ----------
    {
      id: 'xl-match-sql',
      type: 'match',
      prompt: 'Excel 写法和它的作用（或对应的 SQL），连起来。',
      pairs: [
        { left: 'VLOOKUP', right: 'SQL 里对应 LEFT JOIN' },
        { left: 'SUMIFS', right: 'SQL 里对应带 WHERE 的 GROUP BY' },
        { left: '=COUNTIF(A:A, A2) > 1', right: '标出重复值' },
        { left: '本期 / 上期 − 1', right: '环比' },
        { left: '$A$1', right: '行和列都固定的绝对引用' },
        { left: 'COALESCE(列, 0)', right: '在 SQL 里把 NULL 换成 0' },
      ],
      source: [
        { file: 'star', section: '二 › 问 2' },
        { file: 'didi', section: '五 › 问 5、7、10；四 › 问 7' },
      ],
    },

    {
      id: 'xl-c-na',
      type: 'choice',
      prompt: 'VLOOKUP 为什么会报 #N/A？',
      options: [
        { text: '通常是三种原因：真的找不到；格式不一致（一边文本一边数字）；有多余空格（用 TRIM 去掉）。外面套 IFERROR(…, "未匹配") 把错误标出来。', correct: true },
        { text: '因为第四个参数填了 0。', trap: '概念混淆', why: '0 是精确匹配，是对的写法。' },
        { text: '因为数据量太大，Excel 算不过来。', trap: '概念混淆', why: '#N/A 是没找到匹配值：真找不到、格式不一致、多余空格。' },
      ],
      source: [{ file: 'didi', section: '五 › 问 1' }],
    },

    {
      id: 'xl-c-limits',
      type: 'choice',
      prompt: 'VLOOKUP 有什么局限？怎么替代？',
      options: [
        { text: '只能向右查；列号是写死的，插入列会取错；重复的键只返回第一个。替代是 INDEX + MATCH，或者新版的 XLOOKUP，左右都能查，也自带找不到时的默认值。', correct: true },
        { text: '没什么局限，左右都能查。', trap: '概念混淆', why: 'VLOOKUP 只能向右查，向左要用 INDEX + MATCH 或 XLOOKUP。' },
        { text: '用 SUMIFS 就能替代 VLOOKUP 查文本。', trap: '概念混淆', why: 'SUMIFS 是按条件求和，不是查找取值。' },
      ],
      source: [{ file: 'didi', section: '五 › 问 2' }],
    },

    {
      id: 'xl-c-sumifs',
      type: 'choice',
      prompt: 'SUMIF 和 SUMIFS 有什么区别？',
      options: [
        { text: 'SUMIF 只能一个条件，SUMIFS 可以多个，而且参数顺序不同：SUMIFS 的求和列在第一个。', correct: true },
        { text: 'SUMIFS 的求和列写在最后一个参数。', trap: '概念混淆', why: '反了：SUMIFS 求和列在第一个。' },
        { text: 'SUMIFS 是计数，SUMIF 是求和。', trap: '概念混淆', why: '两个都是求和；按条件计数用 COUNTIFS。' },
      ],
      source: [{ file: 'didi', section: '五 › 问 3' }],
    },

    {
      id: 'xl-c-pivot',
      type: 'choice',
      prompt: '数据透视表一般用来做什么？',
      options: [
        { text: '快速汇总和交叉分析，比如行放城市、列放日期、值放 GMV 求和和订单计数。“值显示方式”能直接算占比和环比，切片器可以按城市筛选，源数据更新后要刷新。', correct: true },
        { text: '透视表会自动跟着源数据更新，不用刷新。', trap: '概念混淆', why: '源数据更新后要刷新；源数据做成“表格”（Ctrl + T），新增行才会自动包含。' },
        { text: '透视表主要用来画图。', trap: '概念混淆', why: '主要是快速汇总和交叉分析。' },
      ],
      source: [{ file: 'didi', section: '五 › 问 4' }],
    },

    {
      id: 'xl-c-dup',
      type: 'choice',
      prompt: '怎么找出重复的数据？',
      options: [
        { text: '只想标出来、不删，用 =COUNTIF(A:A, A2) > 1，或者条件格式里的“重复值”高亮。先标出来再确认，比直接删安全；真要去重再用“删除重复项”或 UNIQUE()。', correct: true },
        { text: '直接点“删除重复项”，最快。', trap: '说偏了', why: '先标出来再确认，比直接删安全，和建行实习里“不直接改原始数据”是一个道理。' },
        { text: '用 VLOOKUP 查自己，报错的就是重复。', trap: '概念混淆', why: '找重复用计数：COUNTIF 结果大于 1 就是重复。' },
      ],
      source: [
        { file: 'didi', section: '五 › 问 5' },
        { file: 'star', section: '一 › A 行动 第 5 步' },
      ],
    },

    {
      id: 'xl-c-ref',
      type: 'choice',
      prompt: '$A$1、$A1、A$1 有什么区别？',
      options: [
        { text: '$A$1 行和列都固定；$A1 只固定列；A$1 只固定行。按 F4 切换。算占比时，分母的合计格要加 $。', correct: true },
        { text: '$A1 只固定行，A$1 只固定列。', trap: '概念混淆', why: '说反了：$ 在谁前面就固定谁。$A1 固定列，A$1 固定行。' },
        { text: '加了 $ 的格子就不能往下拖了。', trap: '概念混淆', why: '照样能拖，只是被 $ 固定的部分不变。' },
      ],
      source: [{ file: 'didi', section: '五 › 问 7' }],
    },

    {
      id: 'xl-c-growth',
      type: 'choice',
      prompt: '环比和同比怎么算？',
      options: [
        { text: '环比 = 本期 / 上期 − 1；同比 = 本期 / 去年同期 − 1。外卖日报常用“和上周同一天比”，避开周几效应。', correct: true },
        { text: '环比 = 本期 − 上期。', trap: '概念混淆', why: '那是差值；环比是本期 / 上期 − 1。' },
        { text: '同比是和上一个周期比，环比是和去年同期比。', trap: '概念混淆', why: '说反了：环比和上一个周期比，同比和去年同期比。' },
      ],
      source: [{ file: 'didi', section: '五 › 问 10' }],
    },

    {
      id: 'xl-c-big',
      type: 'choice',
      prompt: '数据量很大、Excel 卡了怎么办？',
      options: [
        { text: 'Excel 一张表最多约 104 万行。数据大就先用 SQL 聚合到需要的粒度（比如按天、按城市）再导进 Excel；少用整列引用和大量 VLOOKUP；可以用 Power Query 做清洗。', correct: true },
        { text: 'Excel 一张表最多约 1 万行，超过就得拆成好几个文件。', trap: '数字记错', why: '是约 104 万行；数据大就先用 SQL 聚合再导入。' },
        { text: '多开几个 Excel 窗口，分开算。', trap: '说偏了', why: '没解决问题。正确做法是先用 SQL 聚合到需要的粒度。' },
      ],
      source: [{ file: 'didi', section: '五 › 问 12' }],
    },

    // ---------- 口述 ----------
    {
      id: 'intro-recite-cn',
      type: 'recite',
      prompt: '请先做一个中文自我介绍。',
      targetSeconds: 90,
      answer: '我是谁 → 三点匹配：**用户增长**（20 万客户、约一半、多赚约 16%）→ **指标监测和复盘** → **市场和竞品调研** → 为什么想来 → **11 月 2 日**到岗、每周五天、**6 个月**',
      points: [
        '我是谁：浙大数字经济研一，本科东财金融，GPA 4.02，专业排名 13/93',
        '第一点 用户增长：20 万客户的随机实验，找出“发了才会买”的客户',
        '说了“按假设的成本和毛利”，只给约一半客户发，多赚约 16%',
        '对应岗位里的人群筛选、权益投放和效果复盘',
        '第二点 指标监测和复盘：AI 辅助分析流程（指标对比、因素拆解、维度下钻），每周自动周报',
        'SQL 和 Excel 都比较熟，建行实习用 Excel 核验过几百条数据',
        '第三点 市场和竞品调研：国家级大创，6 个以上品牌的定价和渠道，问卷做了转化漏斗',
        '为什么想来：拉美市场变化快、运营效果直接；要用英语、跨时差协作',
        '11 月 2 日到岗，每周五天，实习 6 个月',
      ],
      script: [
        '面试官您好，我叫（你的名字），现在是浙江大学数字经济专业的研一学生，本科在东北财经大学读金融，GPA 4.02，专业排名 13/93。',
        '我从三个方面说说我和这个岗位的匹配。',
        '第一是用户增长。我做过一个零售短信营销项目：用 20 万客户的随机实验数据，先评估短信到底带来了多少增量购买，再找出“发了才会买”的客户。按假设的成本和毛利测算，只给约一半客户发，比全部发多赚约 16%。这和岗位里的人群筛选、权益投放和效果复盘是同一件事。',
        '第二是指标监测和复盘。我搭过一套 AI 辅助的分析流程，按“指标对比、因素拆解、维度下钻”定位指标变化的原因，每周自动生成运营周报。SQL 和 Excel 我都比较熟，本科在建行实习时也用 Excel 核验过几百条数据。',
        '第三是市场和竞品调研。我本科参加过一个国家级大创项目，做中药果醋饮品，我负责竞品和用户调研，梳理了 6 个以上品牌的定价和渠道，用问卷做了用户转化漏斗。',
        '我对滴滴拉美外卖很感兴趣。一是这个市场正在快速变化，比如 99Food 重返巴西、和 iFood、Keeta 竞争，运营动作的效果很直接；二是这个岗位要用英语、跨时差协作，正好是我想锻炼的。我可以 11 月 2 日到岗，每周五天，实习 6 个月。谢谢。',
      ],
      note: '数字只说三个：20 万客户、约一半客户、多赚约 16%，其他数字留给追问。',
      source: [{ file: 'didi', section: '二、自我介绍 › 中文版、讲的时候注意' }],
    },

    {
      id: 'intro-recite-en',
      type: 'recite',
      prompt: 'Could you introduce yourself in English?',
      targetSeconds: 90,
      answer: 'Who I am → three fits: **user growth** (200,000 customers, about half, around 16%) → **metric monitoring** → **market research** → why DiDi → start **November 2nd**, five days a week, **six months**',
      points: [
        'Who I am: first-year master\'s in Digital Economy at Zhejiang University; bachelor\'s in Finance at Dongbei University of Finance and Economics',
        'My background fits this role in three ways',
        'User growth: a randomized experiment with 200,000 customers; found the customers who buy only when they receive the message',
        'Under assumed costs and margins, sending to about half earned around 16% more profit than sending to everyone',
        'That is close to audience selection, incentive design and campaign review',
        'Metric monitoring: an AI-assisted workflow (compare periods, break into drivers, drill down), weekly report produced automatically',
        'Comfortable with SQL and Excel; at China Construction Bank, cross-checked several hundred employee records',
        'Market research: national-level student startup, herbal fruit-vinegar drinks, compared pricing and channels of more than six brands, built a customer funnel',
        'Why DiDi: the Latin American market is changing fast and results show quickly',
        'Start on November 2nd, five days a week for six months, comfortable across time zones',
      ],
      script: [
        "Hi, I'm (your name). I'm a first-year master's student in Digital Economy at Zhejiang University, and I did my bachelor's in Finance at Dongbei University of Finance and Economics.",
        'I think my background fits this role in three ways.',
        "First, user growth. In a retail SMS marketing project, I used a randomized experiment with 200,000 customers to measure how many extra purchases the SMS really created. Then I found the customers who buy only when they receive the message. Under assumed costs and margins, sending to about half of the customers earned around 16% more profit than sending to everyone. That's very close to audience selection, incentive design and campaign review in this role.",
        "Second, metric monitoring. I built an AI-assisted workflow that explains why a metric changed, by comparing periods, breaking the metric into drivers and drilling down by dimension. It also produces a weekly operations report automatically. I'm comfortable with SQL and Excel. During my internship at China Construction Bank, I used Excel to cross-check several hundred employee records.",
        'Third, market research. In a national-level student startup project selling herbal fruit-vinegar drinks, I compared the pricing and channels of more than six tea-drink brands and used a survey to build a customer funnel.',
        "I'm excited about DiDi's food delivery business in Latin America, because the market is changing fast and operations decisions show results quickly. I can start on November 2nd, work five days a week for six months, and I'm comfortable working across time zones. Thank you.",
      ],
      source: [{ file: 'didi', section: '二、自我介绍 › English Version' }],
    },
  ],
});
