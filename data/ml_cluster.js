// 机器学习篇 · 4 无监督：聚类（K-means、DBSCAN、层次聚类、三种对比）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'ml_cluster',
    part: { id: 'ml', title: '机器学习篇', order: 2, desc: '先看动画讲解，再做题' },
    order: 40,
    title: '聚类',
    subtitle: 'K-means、DBSCAN、层次聚类',
    badge: '聚',
    intro: 'K-means 是三星重点：步骤、目标函数、怎么选 K、缺点，都要能一口气讲出来。',

    lessons: [
      {
        id: 'ml-kmeans', title: '3.1.1 K-means 聚类', stars: 3, lab: 'kmeans',
        oneLiner: 'K-means 先选 K 个中心，然后反复“把每个点分给最近的中心 → 把中心挪到簇的平均位置”，直到分配不再变化；目标是让簇内平方和（惯性）最小。',
        tryIt: [
          '用“下一步”一步步看分配和更新。',
          '用“随机选初始中心”，点“换个初始中心”几次，比较收敛后的惯性；再换成 k-means++。',
          '切到“两个月牙”，看 K-means 怎么切错。',
          '看右边的肘部图，找拐点。',
        ],
        points: [
          '步骤：定 K → 初始化中心 → 分配到最近中心 → 中心更新为簇均值 → 重复到收敛。',
          '目标：最小化簇内平方和。每轮只降不升，一定收敛，但可能停在局部最优，要多次初始化取最好的。',
          'k-means++：让初始中心彼此离得远，比随机初始化稳；sklearn 默认用它。',
          '选 K：肘部法、轮廓系数，再结合业务（运营能承接几类人群）。',
          '用前要标准化；对离群点敏感（均值会被拉偏）。',
          '它假设簇是大小相近的凸形圆团；弯曲形状、密度差很大的簇分不好。',
        ],
        project: '可以这样接：X5 项目给每个客户做了 43 个特征（RFM、积分促销敏感度、门店忠诚度等）。如果要做客户分群，可以把这些特征标准化后跑 K-means，再看每群的画像。注意：这个项目里没有做聚类，面试时只能说“可以这样用”。',
        source: [S('sk-cluster', 'K-means'), S('x5-qa', '问题 12')],
      },
      {
        id: 'ml-dbscan', title: '3.1.2 DBSCAN 聚类', stars: 1, lab: 'dbscan',
        oneLiner: 'DBSCAN 按密度聚类：半径 eps 内至少有 minPts 个点的叫核心点，从核心点出发把密度相连的点连成一簇，连不上的是噪声。',
        tryIt: [
          '点几个点，看它们是核心点、边界点还是噪声。',
          '把 eps 调到 0.8，看所有点连成一片。',
          '点“播放”，看簇是怎么一圈圈扩出来的。',
        ],
        points: [
          '两个参数：eps（邻域半径）、minPts（最少邻居数）。',
          '三种点：核心点、边界点、噪声点。',
          '优点：不用指定簇数；能找任意形状的簇；能识别噪声和离群点。',
          '缺点：对 eps 敏感；各簇密度差很大时一个 eps 照顾不过来；边界点的归属可能随数据顺序变化。',
          '选 eps 的经验方法：画 k 近邻距离图，找拐点。',
        ],
        source: [S('sk-cluster', 'DBSCAN')],
      },
      {
        id: 'ml-hier', title: '3.1.3 层次聚类', stars: 1, lab: 'hier',
        oneLiner: '凝聚式层次聚类：一开始每个点自成一簇，每步合并最近的两簇，直到只剩一簇，过程画成树状图；在不同高度切一刀，得到不同个数的簇。',
        tryIt: [
          '一步步点“合并最近的两簇”，对照右边的树状图。',
          '拖“在这个高度切一刀”，看簇数怎么变。',
          '换成单链接，看合并顺序有什么不同。',
        ],
        points: [
          '链接方式（两簇之间的距离怎么算）：单链接（最近两点）、全链接（最远两点）、平均链接、Ward（合并后簇内方差增加最少）。',
          '不用事先定簇数，树状图很直观。',
          '计算量大（要两两算距离），样本多时慢。',
          '合并了就不能撤销。',
          '单链接能处理细长形状，但对噪声敏感、容易连成一长串；Ward 得到的簇大小比较均匀。',
        ],
        source: [S('sk-cluster', 'Hierarchical clustering')],
      },
      {
        id: 'ml-clustercmp', title: '3.1.4 三种聚类的优缺点', stars: 1, lab: 'clustercmp',
        oneLiner: 'K-means 快，但要定 K、只认圆团；DBSCAN 不用定 K、能找任意形状和噪声，但怕密度不均；层次聚类不用定 K、有树状图，但慢。',
        tryIt: ['依次切换四种数据，看三种方法谁分得对。'],
        points: [
          '样本多、簇大致是圆团 → K-means。',
          '形状不规则、有噪声 → DBSCAN。',
          '样本不多、想看层次结构 → 层次聚类。',
          '共同点：都靠距离，先标准化；结果要结合业务解释。',
        ],
        source: [S('sk-cluster', 'Overview of clustering methods')],
      },
    ],

    questions: [
      // ---------- K-means ----------
      {
        id: 'ml-km-sort', lesson: 'ml-kmeans', type: 'sort',
        prompt: 'K-means 的步骤，按顺序排。',
        items: [
          '确定簇数 K',
          '初始化 K 个中心（比如用 k-means++）',
          '把每个点分配给离它最近的中心',
          '把每个中心更新为它那一簇的均值',
          '重复分配和更新，直到分配不再变化',
        ],
        answer: '定 **K** → 初始化中心 → **分配** → **更新** → 重复到收敛',
        source: [S('sk-cluster', 'K-means')],
      },
      {
        id: 'ml-km-c1', lesson: 'ml-kmeans', type: 'choice',
        prompt: 'K-means 的目标函数是什么？一定能收敛吗？',
        options: [
          { text: '最小化簇内平方和（每个点到自己中心的距离平方之和，也叫惯性）。每一轮分配和更新都不会让它变大，所以一定收敛；但可能停在局部最优，结果依赖初始中心，所以要多跑几次取最好的。', correct: true },
          { text: '一定能找到全局最优解。', trap: '说过头', why: '只保证收敛到局部最优，换个初始中心结果可能不同。' },
          { text: '目标是让不同簇的中心之间距离之和最小。', trap: '概念混淆', why: '目标是簇内的距离平方和最小，不是簇间。' },
        ],
        source: [S('sk-cluster', 'K-means（inertia）')],
      },
      {
        id: 'ml-km-c2', lesson: 'ml-kmeans', type: 'choice',
        prompt: 'K-means 的 K 怎么选？',
        options: [
          { text: '肘部法：画 K 和惯性的曲线，找下降突然变缓的拐点；轮廓系数：越接近 1 越好；最后结合业务，比如运营能承接几类人群。', correct: true },
          { text: 'K 越大越好，惯性越小说明聚得越好。', trap: '说过头', why: 'K 等于样本数时惯性为 0，但没有意义。惯性一定随 K 增大而下降。' },
          { text: '用交叉验证的准确率来选 K。', trap: '概念混淆', why: '聚类没有标签，没有“准确率”可以算。' },
        ],
        source: [S('sk-cluster', 'K-means、Silhouette Coefficient')],
      },
      {
        id: 'ml-km-c3', lesson: 'ml-kmeans', type: 'choice',
        prompt: 'k-means++ 解决了什么问题？',
        options: [
          { text: '初始化的问题：让初始中心彼此离得远（离已选中心越远的点越容易被选中），比随机初始化更稳、更快收敛。sklearn 默认就用它。', correct: true },
          { text: '它能自动确定 K。', trap: '概念混淆', why: 'k-means++ 只管初始化，K 还是要自己定。' },
          { text: '它让 K-means 能分出弯曲形状的簇。', trap: '说过头', why: '分配规则没变，还是按最近的中心分，弯曲形状照样分不好。' },
        ],
        source: [S('sk-cluster', 'K-means（k-means++）')],
      },
      {
        id: 'ml-km-c4', lesson: 'ml-kmeans', type: 'choice',
        prompt: 'K-means 有什么缺点？',
        options: [
          { text: '要事先定 K；对初始中心敏感；对离群点敏感；假设簇是大小相近的凸形圆团，弯曲形状、密度差很大的簇分不好；用前要标准化。', correct: true },
          { text: '只能分成两类。', trap: '概念混淆', why: 'K 可以是任意正整数。' },
          { text: '计算量太大，几千个样本就跑不动。', trap: '说过头', why: 'K-means 是最快的聚类方法之一，大数据也常用。' },
        ],
        source: [S('sk-cluster', 'K-means')],
      },
      {
        id: 'ml-km-c5', lesson: 'ml-kmeans', type: 'choice',
        prompt: '用 K-means 做用户分群，前处理要注意什么？',
        options: [
          { text: '先挑和业务相关的特征（比如最近一次购买、频次、金额），处理缺失和离群值，再标准化，避免量纲大的特征主导距离；分完群要看每群的画像能不能解释、运营能不能用。', correct: true },
          { text: '直接用原始的金额和次数，不用处理。', trap: '概念混淆', why: '金额的量纲远大于次数，不标准化的话距离几乎只由金额决定。' },
          { text: '把用户 ID 也作为一个特征放进去。', trap: '概念混淆', why: 'ID 只是编号，没有“远近”的含义，放进去只会添乱。' },
        ],
        source: [S('sk-cluster', 'K-means'), S('x5-qa', '问题 12')],
      },
      {
        id: 'ml-km-match', lesson: 'ml-kmeans', type: 'match',
        prompt: '把聚类里的概念和它的意思连起来。',
        pairs: [
          { left: '惯性（簇内平方和）', right: '每个点到所属中心的距离平方之和' },
          { left: '肘部法', right: '找惯性下降突然变缓的 K' },
          { left: '轮廓系数', right: '越接近 1，说明簇内紧、簇间远' },
          { left: 'k-means++', right: '让初始中心彼此离得远' },
        ],
        source: [S('sk-cluster', 'K-means、Silhouette Coefficient')],
      },
      {
        id: 'ml-km-recite', lesson: 'ml-kmeans', type: 'recite',
        prompt: '请讲一下 K-means。',
        targetSeconds: 60,
        answer: '无监督分 K 簇 → 四步迭代 → 目标函数 → 初始化 → 选 K → 缺点 → 应用',
        points: [
          '无监督，把样本分成 K 个簇',
          '步骤：初始化 K 个中心 → 分配到最近中心 → 中心更新为簇均值 → 重复到收敛',
          '目标：最小化簇内平方和；会收敛，但可能是局部最优',
          '初始化：k-means++，多跑几次取最好的',
          '选 K：肘部法、轮廓系数、业务',
          '缺点：要定 K、对初始值和离群点敏感、只适合圆团',
          '用前要标准化；应用如用户分群',
        ],
        source: [S('sk-cluster', 'K-means')],
      },

      // ---------- DBSCAN ----------
      {
        id: 'ml-db-c1', lesson: 'ml-dbscan', type: 'choice',
        prompt: 'DBSCAN 的核心点、边界点、噪声点分别是什么？',
        options: [
          { text: '核心点：eps 半径内至少有 minPts 个点；边界点：自己不是核心点，但在某个核心点的邻域里；噪声点：既不是核心点，也不在任何核心点的邻域里。', correct: true },
          { text: '核心点就是每个簇的中心，和 K-means 一样。', trap: '概念混淆', why: 'DBSCAN 没有“中心”；一个簇里可以有很多核心点。' },
          { text: '噪声点就是被分错的点。', trap: '概念混淆', why: '噪声点是密度太低、不属于任何簇的点，不是“分错”。' },
        ],
        source: [S('sk-cluster', 'DBSCAN')],
      },
      {
        id: 'ml-db-c2', lesson: 'ml-dbscan', type: 'choice',
        prompt: 'DBSCAN 和 K-means 比，有什么优势和不足？',
        options: [
          { text: '优势：不用事先指定簇数，能找任意形状的簇，能把噪声单独标出来。不足：对 eps 敏感，各簇密度差很大时效果差。', correct: true },
          { text: 'DBSCAN 不需要设任何参数。', trap: '说过头', why: '要设 eps 和 minPts，而且结果对 eps 很敏感。' },
          { text: 'DBSCAN 在密度差异很大的数据上效果最好。', trap: '概念混淆', why: '正好是它的弱点：一个 eps 很难同时照顾稀疏和密集的簇。' },
        ],
        source: [S('sk-cluster', 'DBSCAN')],
      },

      // ---------- 层次聚类 ----------
      {
        id: 'ml-hc-c1', lesson: 'ml-hier', type: 'choice',
        prompt: '层次聚类的单链接、全链接、平均链接有什么区别？',
        options: [
          { text: '是“两簇之间的距离”的不同算法：单链接取两簇最近的两点，全链接取最远的两点，平均链接取所有点对的平均（Ward 看合并后簇内方差增加多少）。单链接容易连成一长串，Ward 得到的簇大小比较均匀。', correct: true },
          { text: '是三种不同的初始化方法。', trap: '概念混淆', why: '层次聚类不需要初始化；链接方式定义的是簇间距离。' },
          { text: '单链接最不容易受噪声影响。', trap: '概念混淆', why: '单链接只看最近的一对点，一个噪声点就可能把两簇连起来，反而最敏感。' },
        ],
        source: [S('sk-cluster', 'Hierarchical clustering（linkage）')],
      },
      {
        id: 'ml-hc-c2', lesson: 'ml-hier', type: 'choice',
        prompt: '层次聚类怎么决定分几簇？',
        options: [
          { text: '不用事先定：先画出树状图，再在某个高度横着切一刀，切到几根竖线就是几簇。', correct: true },
          { text: '必须事先给定簇数 K，和 K-means 一样。', trap: '概念混淆', why: '可以先合并到底，再按树状图决定切在哪。' },
          { text: '自动选惯性最小的那一层。', trap: '概念混淆', why: '惯性在“每个点一簇”时最小（为 0），这样选没有意义。' },
        ],
        source: [S('sk-cluster', 'Hierarchical clustering')],
      },

      // ---------- 三种对比 ----------
      {
        id: 'ml-cc-c1', lesson: 'ml-clustercmp', type: 'choice',
        prompt: '数据里有很多噪声点，簇的形状也不规则，选哪种聚类？',
        options: [
          { text: 'DBSCAN：能找任意形状的簇，还能把噪声标出来。', correct: true },
          { text: 'K-means，因为它最快。', trap: '概念混淆', why: 'K-means 会把噪声硬塞进某一簇，而且只认圆团。' },
          { text: '层次聚类，因为它能识别噪声。', trap: '概念混淆', why: '层次聚类最后每个点都属于某一簇，不会单独标出噪声。' },
        ],
        source: [S('sk-cluster', 'Overview of clustering methods')],
      },
      {
        id: 'ml-cc-match', lesson: 'ml-clustercmp', type: 'match',
        prompt: '把场景和最合适的聚类方法连起来。',
        pairs: [
          { left: '样本很多、簇大致是圆团', right: 'K-means' },
          { left: '形状不规则、有噪声', right: 'DBSCAN' },
          { left: '样本不多、想看层次结构', right: '层次聚类' },
        ],
        source: [S('sk-cluster', 'Overview of clustering methods')],
      },
    ],
  });
})();
