// 统计篇 · 4 马尔可夫链与隐马尔可夫模型
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'stat_markov',
    part: { id: 'stat', title: '统计篇', order: 3, desc: '先看动画讲解，再做题' },
    order: 40,
    title: '马尔可夫链与 HMM',
    subtitle: '马尔可夫链、隐马尔可夫模型',
    badge: '链',
    intro: '这两节没有星，面试很少深挖。能说清“无记忆性、转移矩阵、稳态分布”和“隐藏状态 / 观测 / 三个经典问题”就够了，不用推公式。',

    lessons: [
      {
        id: 'st-markov', title: '17 马尔可夫链（MC）', stars: 0, lab: 'markov',
        oneLiner: '马尔可夫链描述系统在几个状态之间按概率跳转，下一步去哪只取决于现在在哪（无记忆性）。所有跳转概率写成转移矩阵，走很多步以后，各状态占比常常会稳定下来，叫稳态分布。',
        tryIt: [
          '点“走 10 步”几次，看活跃、沉默、流失的占比怎么稳定下来。',
          '把“流失 → 活跃”拖到 0，看流失变成吸收态。',
        ],
        points: [
          '马尔可夫性（无记忆性）：下一状态只依赖当前状态，和更早的历史无关。',
          '转移矩阵 P：第 i 行第 j 列是从状态 i 跳到状态 j 的概率，每一行加起来等于 1。',
          '分布更新：现在的占比是 π，下一步就是 πP。',
          '稳态分布：满足 π = πP，走得足够久以后占比不再变化。',
          '吸收态：进去就出不来的状态（比如永久流失）。',
          '业务例子：用户状态流转（活跃 / 沉默 / 流失）、预测未来的活跃占比。',
        ],
        source: [S('gs-prob', '第 11 章 Markov Chains（11.1 Introduction；11.2 Absorbing；11.3 Ergodic；11.4 Fundamental Limit Theorem）'), S('rabiner', 'Discrete Markov Processes')],
      },
      {
        id: 'st-hmm', title: '18 隐马尔可夫模型（HMM）', stars: 0, lab: 'hmm',
        oneLiner: '隐马尔可夫模型 = 一条看不见的马尔可夫链（隐藏状态）+ 每个隐藏状态按概率产生看得见的观测。经典的三个问题：评估（前向算法）、解码（维特比算法）、学习（Baum-Welch 算法）。',
        tryIt: [
          '点几个行为切换“浏览 / 加购 / 下单”，看最可能的意图路径怎么变。',
          '点“按模型随机生成一段”，对比维特比猜的路径和真实隐藏状态。',
        ],
        points: [
          '五个要素：隐藏状态集合、观测集合、初始概率、转移概率 A、发射概率 B。',
          '两个假设：隐藏状态只依赖上一个隐藏状态；观测只依赖当前隐藏状态。',
          '评估：已知模型，算一串观测出现的概率——前向算法。',
          '解码：已知模型和观测，找最可能的隐藏状态序列——维特比算法（动态规划）。',
          '学习：只有观测，估计模型参数——Baum-Welch 算法（EM 的一种）。',
          '经典应用：语音识别、词性标注、中文分词。',
        ],
        source: [S('rabiner', 'Elements of an HMM；The Three Basic Problems for HMMs；Solutions to the Three Basic Problems')],
      },
    ],

    questions: [
      {
        id: 'st-mc-c1', lesson: 'st-markov', type: 'choice',
        prompt: '什么是马尔可夫链？“马尔可夫性”指什么？',
        options: [
          { text: '系统在若干状态之间按概率转移，下一个状态只取决于当前状态，和之前怎么走过来的无关（无记忆性）。转移概率写成转移矩阵，每一行加起来等于 1。', correct: true },
          { text: '下一个状态取决于过去所有的状态。', trap: '概念混淆', why: '马尔可夫性恰恰是“只看现在，不看过去”。' },
          { text: '转移矩阵每一列加起来等于 1。', trap: '概念混淆', why: '按“行 = 现在，列 = 下一步”的写法，是每一行加起来等于 1。' },
        ],
        source: [S('gs-prob', '11.1 Introduction'), S('rabiner', 'Discrete Markov Processes')],
      },
      {
        id: 'st-mc-c2', lesson: 'st-markov', type: 'choice',
        prompt: '马尔可夫链的稳态分布是什么？',
        options: [
          { text: '满足 π = πP 的状态分布：按转移矩阵再走一步，各状态占比也不变。满足一定条件时，不管从哪出发，走得足够久都会收敛到它。', correct: true },
          { text: '稳态分布就是一开始的初始分布。', trap: '概念混淆', why: '初始分布可以是任意的；稳态是走很多步以后稳定下来的分布。' },
          { text: '任何马尔可夫链都会收敛到所有状态都有人的稳态。', trap: '说过头', why: '有吸收态时（比如永久流失），最后所有人都会进入吸收态。' },
        ],
        source: [S('gs-prob', '11.2 Absorbing Markov Chains；11.3 Ergodic Markov Chains；11.4 Fundamental Limit Theorem')],
      },
      {
        id: 'st-hmm-c1', lesson: 'st-hmm', type: 'choice',
        prompt: '隐马尔可夫模型由什么组成？',
        options: [
          { text: '一条看不见的马尔可夫链（隐藏状态，按转移概率 A 跳转），每个隐藏状态按发射概率 B 产生看得见的观测，再加上初始概率。假设隐藏状态只依赖上一个隐藏状态，观测只依赖当前隐藏状态。', correct: true },
          { text: 'HMM 里的隐藏状态可以直接观测到。', trap: '概念混淆', why: '隐藏状态看不到，只能通过观测去推断。' },
          { text: 'HMM 就是普通的马尔可夫链换了个名字。', trap: '概念混淆', why: '多了一层“隐藏状态 → 观测”的发射概率。' },
        ],
        source: [S('rabiner', 'Extension to Hidden Markov Models；Elements of an HMM')],
      },
      {
        id: 'st-hmm-match', lesson: 'st-hmm', type: 'match',
        prompt: '把 HMM 的三个经典问题和对应的算法连起来。',
        pairs: [
          { left: '评估：这串观测出现的概率', right: '前向算法' },
          { left: '解码：最可能的隐藏状态序列', right: '维特比算法' },
          { left: '学习：估计 A、B 和初始概率', right: 'Baum-Welch 算法（EM）' },
        ],
        source: [S('rabiner', 'The Three Basic Problems for HMMs；Solutions to the Three Basic Problems')],
      },
    ],
  });
})();
