// 机器学习篇 · 5 降维（PCA、PLS）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'ml_reduce',
    part: { id: 'ml', title: '机器学习篇', order: 2, desc: '先看动画讲解，再做题' },
    order: 50,
    title: '降维',
    subtitle: 'PCA 主成分分析、PLS 偏最小二乘',
    badge: '维',
    intro: '一关很短。PCA 记住“找投影方差最大的方向、不看 y”；PLS 记住“它看 y”。',

    lessons: [
      {
        id: 'ml-pca', title: '4.1.1 PCA 主成分分析', stars: 1, lab: 'pca',
        oneLiner: 'PCA 找一组新的正交方向，让数据投影上去方差最大；只保留前几个主成分，就能在信息损失不多的情况下降维。它不看标签，是无监督的。',
        tryIt: [
          '转动方向角度，看投影后的方差什么时候最大。',
          '点“找到方差最大的方向”，再点“降到一维”。',
        ],
        points: [
          '步骤：标准化 → 算协方差矩阵 → 特征值分解（或 SVD）→ 取最大的几个特征值对应的方向。',
          '主成分之间互不相关；每个主成分是原始特征的线性组合。',
          '保留几个：看累计解释方差比例，再结合下游任务的效果。',
          '用途：降维、去噪、可视化、缓解共线性；K-means 之前先做 PCA 也常见。',
          '缺点：新特征不好解释；只能捕捉线性结构；不看 y，可能丢掉对预测有用但方差小的方向。',
        ],
        source: [S('sk-pca', 'PCA'), S('sk-cluster', 'K-means（高维时先做 PCA）')],
      },
      {
        id: 'ml-pls', title: '4.1.2 PLS 偏最小二乘', stars: 0, lab: 'pls',
        oneLiner: 'PLS 也是找新方向来降维，但它找的是和 y 协方差最大的方向，再在新方向上做回归；适合自变量多、共线性强、样本又少的情况。',
        tryIt: ['滑块在 0 时，y 只和方差小的方向有关：看 PCA 方向和 y 几乎无关，PLS 方向却抓住了 y。'],
        points: [
          'PCA 只看 X（无监督）；PLS 同时看 X 和 y（有监督）。',
          '既降维又回归，常用于光谱分析这类特征比样本还多的场景。',
          '和主成分回归（先 PCA 再回归）比，PLS 选方向时就考虑了 y。',
        ],
        source: [S('sk-pls', 'Cross decomposition')],
      },
    ],

    questions: [
      {
        id: 'ml-pca-c1', lesson: 'ml-pca', type: 'choice',
        prompt: 'PCA 的原理是什么？',
        options: [
          { text: '找一组正交的新方向：第一个方向让数据投影后方差最大，第二个在和第一个正交的前提下方差最大……只保留前几个方向就实现了降维。具体是对标准化后数据的协方差矩阵做特征值分解（或 SVD）。', correct: true },
          { text: 'PCA 从原始特征里挑出和 y 最相关的几个。', trap: '概念混淆', why: 'PCA 不看 y；得到的是原始特征的线性组合，不是挑出原始特征。' },
          { text: 'PCA 找方差最小的方向，因为方差小说明噪声少。', trap: '概念混淆', why: '说反了：保留方差大的方向，方差小的方向才被丢掉。' },
        ],
        source: [S('sk-pca', 'PCA')],
      },
      {
        id: 'ml-pca-c2', lesson: 'ml-pca', type: 'choice',
        prompt: '做 PCA 之前为什么要标准化？',
        options: [
          { text: 'PCA 按方差找方向，量纲大的特征方差天然大，会主导主成分；标准化后各特征才站在同一起跑线上。', correct: true },
          { text: '因为 PCA 要求数据服从正态分布。', trap: '概念混淆', why: '问题出在量纲，不是分布。' },
          { text: '不用标准化，PCA 会自动处理量纲。', trap: '概念混淆', why: 'PCA 不会自动处理；sklearn 的 PCA 只做中心化，不做缩放。' },
        ],
        source: [S('sk-pca', 'PCA')],
      },
      {
        id: 'ml-pls-c1', lesson: 'ml-pls', type: 'choice',
        prompt: 'PLS 和 PCA 有什么区别？',
        options: [
          { text: 'PCA 只看 X，找方差最大的方向（无监督）；PLS 同时看 X 和 y，找和 y 协方差最大的方向（有监督），再在这些方向上做回归。', correct: true },
          { text: '两者完全一样，只是名字不同。', trap: '概念混淆', why: '最大区别是 PLS 用到了 y。' },
          { text: 'PLS 是一种聚类方法。', trap: '概念混淆', why: 'PLS 是降维加回归的方法。' },
        ],
        source: [S('sk-pls', 'Cross decomposition')],
      },
    ],
  });
})();
