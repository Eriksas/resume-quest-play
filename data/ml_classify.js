// 机器学习篇 · 3 分类算法（KNN、决策树、SVM、朴素贝叶斯）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'ml_classify',
    part: { id: 'ml', title: '机器学习篇', order: 2, desc: '先看动画讲解，再做题' },
    order: 30,
    title: '分类算法',
    subtitle: 'KNN、决策树、SVM、朴素贝叶斯',
    badge: '树',
    intro: '决策树是三星重点，也是随机森林、XGBoost 的基础。重点看它怎么选切分点、怎么防过拟合。',

    lessons: [
      {
        id: 'ml-knn', title: '2.3.3 KNN', stars: 1, lab: 'knn',
        oneLiner: 'KNN 没有训练过程：来一个新样本，找离它最近的 K 个训练样本，少数服从多数（回归就取平均）。',
        tryIt: [
          '点图上不同位置，看 K 个邻居怎么投票。',
          'K = 1 时决策区域很碎；K = 25 时边界被抹平。',
          '勾上“不做标准化”，看邻居几乎只看横轴了。',
        ],
        points: [
          'K 小 → 对噪声敏感、过拟合；K 大 → 边界被抹平、欠拟合。用交叉验证选 K，二分类常取奇数避免打平。',
          '距离：欧氏距离、曼哈顿距离等；用之前必须标准化。',
          '预测时要算到所有样本的距离，数据大时慢，可以用 KD 树、球树加速。',
          '特征维度很高时，距离的区分度变差（维度灾难）。',
          '可以按距离加权投票：越近的邻居话语权越大。',
        ],
        source: [S('sk-knn', 'Nearest Neighbors')],
      },
      {
        id: 'ml-tree', title: '2.3.4 决策树', stars: 3, lab: 'tree',
        oneLiner: '决策树一层层地问问题：每次选一个特征和切分点，让切开后的两组尽量“纯”（基尼不纯度或信息熵下降最多），直到满足停止条件；叶子按多数类预测。',
        tryIt: [
          '从深度 2 开始点“再长一层”，看训练和测试准确率怎么变。',
          '点树上的节点，看它管哪块区域、候选切分点里为什么选了这一个。',
          '把深度拉到 8，再把“叶子最少样本”调到 8，看过拟合被压住。',
        ],
        points: [
          '分裂标准：基尼不纯度 Σp(1−p)（CART）；信息熵 −Σp·log p，对应信息增益（ID3）和信息增益比（C4.5）。',
          '贪心：每一步只选当前最好的切分，不保证全局最优。',
          '防过拟合：预剪枝（最大深度、叶子最少样本、最小不纯度下降），后剪枝（如 sklearn 的代价复杂度剪枝 ccp_alpha）。',
          '优点：好解释、不用标准化、能处理非线性和特征之间的交互。',
          '缺点：容易过拟合；不稳定，数据稍变树就可能完全不同；边界只能横平竖直。',
          '回归树：叶子取平均，分裂看均方误差下降。',
          '随机森林、GBDT、XGBoost、LightGBM 都建立在决策树上。',
        ],
        project: 'X5 项目用一棵浅决策树（最多 3 层、每个叶子至少 2,000 人）去拟合增益模型的预测，提炼出几条好讲的投放规则，再到测试集上检验——这叫“代理模型”。最好讲的一条：用活动积分多、但购物天数不多的客户，增量 7.75 个百分点。',
        source: [S('sk-tree', 'Decision Trees'), S('x5', '阶段 5 › 一条可解释的规则'), S('x5-qa', '问题 26')],
      },
      {
        id: 'ml-svm', title: '2.3.5 SVM 支持向量机', stars: 1, lab: 'svm',
        oneLiner: 'SVM 找一条间隔最大的分界线，只有离边界最近的“支持向量”决定它；C 控制容忍犯错的程度，核函数让它能处理非线性。',
        tryIt: [
          '拖动没带圈的点，边界不动；拖带圈的支持向量，边界跟着动。',
          '点“加一个捣乱的点”，把 C 从 100 调到 0.05。',
          '下面点“映射 x → (x, x²)”。',
        ],
        points: [
          '最大间隔：分界线离两类最近的点都尽量远，泛化更好。',
          '软间隔：C 大 → 尽量不犯错、间隔窄、易过拟合；C 小 → 间隔宽、更宽容。',
          '核技巧：线性、多项式、RBF（高斯）、sigmoid；只算样本两两之间的核函数值，不用真的映射到高维。',
          'RBF 的 gamma 越大，每个样本的影响范围越小，越容易过拟合。',
          '需要标准化；样本很多时训练慢；不直接输出概率。',
        ],
        source: [S('sk-svm', 'Support Vector Machines')],
      },
      {
        id: 'ml-nb', title: '2.3.6 朴素贝叶斯', stars: 0, lab: 'nb',
        oneLiner: '朴素贝叶斯用贝叶斯公式算“属于每一类的概率”，并假设在给定类别时各特征相互独立，所以概率可以直接相乘。',
        tryIt: [
          '勾选不同的词，看垃圾邮件概率怎么变。',
          '勾上“中奖”，再关掉拉普拉斯平滑。',
        ],
        points: [
          'P(类别 | 特征) ∝ P(类别) × 每个特征的 P(特征 | 类别) 相乘。',
          '“朴素”= 假设特征之间条件独立；现实里常不成立，但分类效果往往够用。',
          '训练和预测都很快，适合文本分类、垃圾邮件识别。',
          '拉普拉斯平滑：每个计数加 1，避免没见过的词让概率变成 0。',
          '常见三种：高斯（连续特征）、多项式（词频）、伯努利（出现与否）。',
        ],
        source: [S('sk-nb', 'Naive Bayes')],
      },
    ],

    questions: [
      // ---------- KNN ----------
      {
        id: 'ml-kn-c1', lesson: 'ml-knn', type: 'choice',
        prompt: 'KNN 里的 K 怎么选？太大太小分别会怎样？',
        options: [
          { text: 'K 太小，只听最近的一两个点，对噪声敏感、容易过拟合；K 太大，边界被抹平、容易欠拟合。一般用交叉验证选，二分类取奇数避免打平。', correct: true },
          { text: 'K 越大越准，最好等于样本总数。', trap: '说过头', why: 'K 等于样本总数时，所有新样本都被判成多数类。' },
          { text: 'K 就是要把数据分成几类。', trap: '概念混淆', why: '那是 K-means 的 K；KNN 的 K 是邻居个数。' },
        ],
        source: [S('sk-knn', 'Nearest Neighbors Classification')],
      },
      {
        id: 'ml-kn-c2', lesson: 'ml-knn', type: 'choice',
        prompt: '为什么用 KNN 之前要标准化？',
        options: [
          { text: 'KNN 靠距离判断远近。量纲大的特征（比如以元计的收入）会主导距离，量纲小的特征几乎不起作用。', correct: true },
          { text: '因为 KNN 要求特征服从正态分布。', trap: '概念混淆', why: 'KNN 不要求分布，问题出在距离的量纲。' },
          { text: '标准化能让 KNN 训练得更快。', trap: '概念混淆', why: 'KNN 根本没有训练过程。' },
        ],
        source: [S('sk-knn', 'Nearest Neighbors')],
      },

      // ---------- 决策树 ----------
      {
        id: 'ml-tr-c1', lesson: 'ml-tree', type: 'choice',
        prompt: '决策树是怎么选择分裂特征和切分点的？',
        options: [
          { text: '遍历所有特征和候选切分点，算每种切法让不纯度（基尼不纯度或信息熵）下降多少，选下降最多的那个，然后在子节点上重复。这是贪心的，不保证全局最优。', correct: true },
          { text: '随机选一个特征来切。', trap: '概念混淆', why: '那是随机森林等方法加进来的随机性；单棵 CART 每次选最优切分。' },
          { text: '选和标签相关系数最高的特征，切在它的中位数上。', trap: '概念混淆', why: '标准是不纯度下降，切分点也是在所有候选里比较出来的。' },
        ],
        source: [S('sk-tree', 'Mathematical formulation')],
      },
      {
        id: 'ml-tr-c2', lesson: 'ml-tree', type: 'choice',
        prompt: '基尼不纯度和信息熵有什么区别？',
        options: [
          { text: '都衡量节点有多“混”，越纯越小。基尼 = Σp(1−p)，信息熵 = −Σp·log p；基尼不用算对数、稍快，两者选出的切分通常差不多。CART 用基尼，ID3 用信息增益，C4.5 用信息增益比。', correct: true },
          { text: '基尼越大，说明节点越纯。', trap: '概念混淆', why: '说反了：节点越纯，基尼越小（全是一类时为 0）。' },
          { text: '信息熵只能用在回归树上。', trap: '概念混淆', why: '基尼和信息熵都是分类树的标准；回归树看均方误差。' },
        ],
        source: [S('sk-tree', 'Classification criteria')],
      },
      {
        id: 'ml-tr-c3', lesson: 'ml-tree', type: 'choice',
        prompt: '决策树怎么防止过拟合？',
        options: [
          { text: '预剪枝：限制最大深度、叶子最少样本数、最小不纯度下降；后剪枝：先长完再剪掉作用小的分支，比如代价复杂度剪枝。也可以改用随机森林这类集成。', correct: true },
          { text: '让树长到训练准确率 100%，就不会过拟合了。', trap: '说过头', why: '训练准确率 100% 往往正是过拟合：树把噪声也切进去了。' },
          { text: '决策树不会过拟合，因为它不需要调参。', trap: '概念混淆', why: '决策树非常容易过拟合，这是它最大的缺点之一。' },
        ],
        source: [S('sk-tree', 'Tips on practical use、Minimal Cost-Complexity Pruning')],
      },
      {
        id: 'ml-tr-c4', lesson: 'ml-tree', type: 'choice',
        prompt: '决策树有什么优缺点？',
        options: [
          { text: '优点：好解释，能画出来；不用标准化；能处理非线性和特征交互。缺点：容易过拟合；不稳定，数据稍微变一点树就可能完全不同；边界只能横平竖直。', correct: true },
          { text: '缺点是必须先对特征做标准化。', trap: '概念混淆', why: '树按阈值切分，单调变换不影响结果，不需要标准化。' },
          { text: '优点是很稳定：数据变一点，树的结构也不会变。', trap: '概念混淆', why: '正好相反，不稳定是决策树的典型缺点，集成方法就是用来缓解它的。' },
        ],
        source: [S('sk-tree', 'Advantages and disadvantages')],
      },
      {
        id: 'ml-tr-sort', lesson: 'ml-tree', type: 'sort',
        prompt: '构建一棵分类决策树，按顺序排。',
        items: [
          '从根节点开始，放入全部训练样本',
          '对每个特征的每个候选切分点，算不纯度下降多少',
          '选下降最多的特征和切分点，把样本分到左右两个子节点',
          '在每个子节点上重复，直到满足停止条件',
          '叶子节点按多数类给出预测',
        ],
        answer: '根节点 → 算每种切法的**不纯度下降** → 选最好的切开 → 子节点上**递归** → 叶子按**多数类**预测',
        source: [S('sk-tree', 'Mathematical formulation')],
      },
      {
        id: 'ml-tr-match', lesson: 'ml-tree', type: 'match',
        prompt: '把决策树算法和它的分裂标准连起来。',
        pairs: [
          { left: 'ID3', right: '信息增益' },
          { left: 'C4.5', right: '信息增益比' },
          { left: 'CART 分类树', right: '基尼不纯度' },
          { left: 'CART 回归树', right: '均方误差（叶子取平均）' },
        ],
        source: [S('sk-tree', 'Tree algorithms: ID3, C4.5, C5.0 and CART')],
      },
      {
        id: 'ml-tr-c5', lesson: 'ml-tree', type: 'choice',
        prompt: '（联系项目）X5 项目里为什么要用一棵浅决策树？',
        options: [
          { text: '为了把增益模型的结果翻译成好讲的规则：在验证集上用一棵最多 3 层、每个叶子至少 2,000 人的浅树去拟合模型的预测增益，再到测试集上检验每条规则的实际增益。', correct: true },
          { text: '因为浅决策树比增益模型更准，就把原模型换掉了。', trap: '说过头', why: '浅树是“代理模型”，用来解释和提炼规则，不是替换原模型。' },
          { text: '为了让树长到最深，把每个客户单独分成一组。', trap: '概念混淆', why: '正好相反，限制深度和叶子样本数才能得到少数几条好讲、可靠的规则。' },
        ],
        source: [S('x5', '阶段 5 › 一条可解释的规则')],
      },
      {
        id: 'ml-tr-recite', lesson: 'ml-tree', type: 'recite',
        prompt: '请讲一下决策树。',
        targetSeconds: 75,
        answer: '结构 → 怎么分裂 → 贪心递归 → 叶子预测 → 防过拟合 → 优缺点 → 是集成模型的基础',
        points: [
          '结构：从根节点开始，一层层按特征提问，叶子给出预测',
          '分裂：选让不纯度下降最多的特征和切分点（基尼或信息熵）',
          '贪心地一层层往下长，直到满足停止条件',
          '叶子：分类取多数类，回归取平均',
          '防过拟合：限制深度、叶子最少样本、剪枝',
          '优点：好解释、不用标准化、能处理非线性',
          '缺点：容易过拟合、不稳定；是随机森林和 GBDT 的基础',
        ],
        source: [S('sk-tree', 'Decision Trees')],
      },

      // ---------- SVM ----------
      {
        id: 'ml-sv-c1', lesson: 'ml-svm', type: 'choice',
        prompt: '什么是支持向量？',
        options: [
          { text: '离分界线最近、落在间隔边上或间隔里面的那些样本。只有它们决定分界线，其余样本挪动不影响结果。', correct: true },
          { text: '所有被分对的样本。', trap: '概念混淆', why: '大部分分对的样本离边界很远，对边界没有影响。' },
          { text: '离分界线最远的样本。', trap: '概念混淆', why: '说反了，是离得最近的。' },
        ],
        source: [S('sk-svm', 'Support Vector Machines')],
      },
      {
        id: 'ml-sv-c2', lesson: 'ml-svm', type: 'choice',
        prompt: '核函数有什么用？',
        options: [
          { text: '把原本线性分不开的数据，隐式地映射到高维空间，在那里用一个超平面分开。核技巧只算样本两两之间的核函数值，不用真的算出高维坐标。常用 RBF（高斯）核。', correct: true },
          { text: '核函数用来给样本降维，减少特征数。', trap: '概念混淆', why: '方向反了：核技巧相当于升到高维（甚至无穷维）。' },
          { text: '核函数就是 SVM 的损失函数。', trap: '概念混淆', why: '核函数衡量两个样本的相似度，和损失函数不是一回事。' },
        ],
        source: [S('sk-svm', 'Kernel functions')],
      },
      {
        id: 'ml-sv-c3', lesson: 'ml-svm', type: 'choice',
        prompt: 'SVM 的参数 C 调大会怎样？',
        options: [
          { text: '对犯错的惩罚更重：间隔变窄、尽量把训练样本都分对，更容易过拟合；C 小则间隔更宽、更宽容。', correct: true },
          { text: 'C 越大，间隔越宽。', trap: '概念混淆', why: '说反了：C 小间隔才宽。' },
          { text: 'C 是多项式核的阶数。', trap: '概念混淆', why: '阶数是 degree 参数；C 是正则（软间隔）参数。' },
        ],
        source: [S('sk-svm', 'Tips on Practical Use（C）')],
      },

      // ---------- 朴素贝叶斯 ----------
      {
        id: 'ml-nb-c1', lesson: 'ml-nb', type: 'choice',
        prompt: '朴素贝叶斯“朴素”在哪里？',
        options: [
          { text: '假设在给定类别的条件下，各个特征相互独立，所以联合概率可以拆成每个特征的概率直接相乘。这个假设通常不成立，但分类效果往往还不错。', correct: true },
          { text: '朴素是指它只能处理两个类别。', trap: '概念混淆', why: '朴素贝叶斯可以做多分类；“朴素”指条件独立假设。' },
          { text: '朴素是指它不需要训练数据。', trap: '概念混淆', why: '它需要用训练数据估计各个条件概率。' },
        ],
        source: [S('sk-nb', 'Naive Bayes')],
      },
    ],
  });
})();
