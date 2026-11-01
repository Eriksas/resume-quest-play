// 机器学习篇 · 2 回归与分类评估（线性回归、分类模型评估、逻辑回归）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'ml_linear',
    part: { id: 'ml', title: '机器学习篇', order: 2, desc: '先看动画讲解，再做题' },
    order: 20,
    title: '回归与分类评估',
    subtitle: '线性回归、分类模型评估、逻辑回归',
    badge: '归',
    intro: '两个三星重点：线性回归和逻辑回归。逻辑回归正好是你 X5 项目最后选中的基础模型。',

    lessons: [
      {
        id: 'ml-linreg', title: '2.1.1 线性回归（包括多元回归）', stars: 3, lab: 'linreg',
        oneLiner: '线性回归用一条直线（多元时是一个平面）去拟合 y，系数用最小二乘求：让所有样本的残差平方和最小。',
        tryIt: [
          '切到“自己调直线”，拖两个滑块，让橙色方块的总面积最小。',
          '点“加一个离群点”，看整条线被拽过去。',
          '下面的实验：把相关系数拉到 0.95 以上，看 b₁ 散得多开。',
        ],
        points: [
          '模型：y = b₀ + b₁x₁ + … + bₖxₖ + 误差。bⱼ 表示其他变量不变时，xⱼ 增加 1 个单位，y 平均变化多少。',
          '求解：最小二乘（OLS），有解析解；数据很大时也可以用梯度下降。',
          '评估：R²（解释了 y 多少比例的波动）、调整 R²、RMSE、MAE。',
          '经典假设：线性关系、误差相互独立、误差同方差、误差正态（做推断时）、自变量之间没有严重共线性。',
          '离群点影响大：误差被平方，一个远点能把整条线拽过去。',
          '多重共线性：不太影响预测，但单个系数不稳、甚至符号反；可以用 VIF 检查，删掉或合并变量，或者用岭回归。',
          '加 L2 是岭回归（Ridge），加 L1 是 Lasso。',
        ],
        project: '余额宝项目用日历特征做了线性回归（Ridge）：单独得分 4.169，不算高，但各月最稳定（标准差 0.470），误差模式和周期因子法不同，所以放进了等权融合。',
        source: [S('sk-linear', 'Ordinary Least Squares、Ridge'), S('yeb-qa', '问题 22')],
      },
      {
        id: 'ml-metrics', title: '2.3.1 分类模型评估方法', stars: 1, lab: 'metrics',
        oneLiner: '先画混淆矩阵：精确率 = 判为正的里面真有多少是正，召回率 = 真正的正样本里抓到多少。阈值一动两者此消彼长；AUC 看整体排序能力，和阈值无关。',
        tryIt: [
          '拖阈值，看 TP、FP、FN、TN 怎么变。',
          '切到“很难分”，看 ROC 曲线贴近对角线、AUC 接近 0.5。',
          '勾上“正样本只占 5%”，看精确率掉得多快。',
        ],
        points: [
          '准确率 = (TP + TN) / 全部；不均衡时会骗人。',
          '精确率 = TP / (TP + FP)：判为正的要靠谱（如推荐、垃圾邮件判定）。',
          '召回率 = TP / (TP + FN)：正样本别漏（如风控、疾病筛查）。',
          'F1 = 精确率和召回率的调和平均。',
          'ROC：横轴假正率、纵轴召回率；AUC = 随机挑一对正负样本，正样本得分更高的概率，0.5 等于瞎猜。',
          '极度不均衡时，PR 曲线比 ROC 更能看出问题。',
          '回归问题看 MAE、RMSE、R²、MAPE。',
        ],
        project: '余额宝项目用了 MAPE。它的缺点：对高估和低估的惩罚不对称（低估最多错 100%，高估可以无限大），实际值接近 0 时会被放大；那个项目每天金额都在百万元级别，所以用它没问题。',
        source: [S('sk-metrics', '分类和回归指标'), S('yeb-qa', '问题 29')],
      },
      {
        id: 'ml-logreg', title: '2.3.2 逻辑回归', stars: 3, lab: 'logreg',
        oneLiner: '逻辑回归 = 线性部分 z = w·x + b，经过 sigmoid 变成 0～1 的概率，用对数损失（交叉熵）训练。名字叫回归，其实做的是分类。',
        tryIt: [
          '拖“陡峭程度”和“分界点”，看对数损失怎么变。',
          '点“用梯度下降训练”，看右下角的损失曲线下降。',
          '在曲线下方空白处多点几个 y = 0 的点，看分界点怎么挪。',
        ],
        points: [
          'P(y = 1 | x) = 1 / (1 + e^(−(w·x + b)))，大于阈值（默认 0.5）判为正。',
          '决策边界 w·x + b = 0 是一条直线（高维是超平面），所以它是线性分类器。',
          '损失用对数损失（交叉熵），等价于最大似然；它是凸的，梯度下降能找到全局最优。套上 sigmoid 后再用均方误差就不是凸的了。',
          '系数解释：xⱼ 增加 1，对数几率增加 wⱼ，几率乘以 e^wⱼ。',
          'sklearn 默认就带正则，C 是正则强度的倒数；带正则时要先标准化。',
          '优点：简单、快、好解释、输出概率；缺点：只能画直线边界，非线性要靠特征工程。',
        ],
        project: 'X5 项目的增益模型最后选的是逻辑回归版 T-learner：增益信号只有 3 个百分点左右，LightGBM 过拟合（验证集 Qini 0.0102、测试集 0.0048），逻辑回归验证集最高（0.0155）、测试集 0.0129。因为特征量纲差别很大，逻辑回归前先做了中位数填补和标准化。',
        source: [S('sk-linear', 'Logistic regression'), S('x5-qa', '问题 18'), S('x5', '阶段 3 › 基础模型的设置')],
      },
    ],

    questions: [
      // ---------- 线性回归 ----------
      {
        id: 'ml-lr-c1', lesson: 'ml-linreg', type: 'choice',
        prompt: '线性回归的系数是怎么求出来的？',
        options: [
          { text: '最小二乘：选一组系数，让所有样本的残差平方和最小，有解析解；数据很大时也可以用梯度下降。', correct: true },
          { text: '让所有点到直线的垂直距离（点到线的最短距离）之和最小。', trap: '概念混淆', why: '最小二乘看的是竖直方向（y 方向）的误差，而且是平方和。' },
          { text: '随机试很多条线，选准确率最高的。', trap: '概念混淆', why: '回归没有“准确率”，而且最小二乘有解析解，不用瞎试。' },
        ],
        source: [S('sk-linear', 'Ordinary Least Squares')],
      },
      {
        id: 'ml-lr-c2', lesson: 'ml-linreg', type: 'choice',
        prompt: '多元回归里，系数 b₁ = 2 怎么解释？',
        options: [
          { text: '在其他变量不变的情况下，x₁ 每增加 1 个单位，y 平均增加 2。', correct: true },
          { text: 'x₁ 增加 1，会导致 y 增加 2。', trap: '说过头', why: '回归系数本身只说明相关；要说“导致”，需要随机实验之类的因果识别。' },
          { text: 'x₁ 的重要性是 2，在所有特征里排第一。', trap: '概念混淆', why: '系数大小受量纲影响，要标准化以后才能互相比较。' },
        ],
        source: [S('sk-linear', 'Ordinary Least Squares'), S('x5-qa', '问题 27')],
      },
      {
        id: 'ml-lr-c3', lesson: 'ml-linreg', type: 'choice',
        prompt: '线性回归有哪些基本假设？',
        options: [
          { text: '线性关系、误差相互独立、误差同方差、（做推断时）误差服从正态，以及自变量之间没有严重的多重共线性。', correct: true },
          { text: '要求自变量和因变量本身都服从正态分布。', trap: '概念混淆', why: '正态假设针对的是误差，不是变量本身。' },
          { text: '要求样本量至少 1 万。', trap: '说过头', why: '没有这种硬性要求；样本少时估计更不精确而已。' },
        ],
        source: [S('sk-linear', 'Ordinary Least Squares')],
      },
      {
        id: 'ml-lr-c4', lesson: 'ml-linreg', type: 'choice',
        prompt: '什么是多重共线性？有什么影响？',
        options: [
          { text: '自变量之间高度相关。它不太影响预测，但会让单个系数很不稳定，标准误变大、甚至符号反过来。可以用 VIF 检查，处理办法是删掉或合并变量，或者用岭回归。', correct: true },
          { text: '会让预测准确率大幅下降。', trap: '说过头', why: '共线性主要影响单个系数的解释，对整体预测影响不大。' },
          { text: '共线性越强，系数越可靠。', trap: '概念混淆', why: '正好相反：共线性越强，单个系数越不稳。' },
        ],
        source: [S('sk-linear', 'Ordinary Least Squares（multicollinearity）、Ridge')],
      },
      {
        id: 'ml-lr-c5', lesson: 'ml-linreg', type: 'choice',
        prompt: 'R² 是什么？越大越好吗？',
        options: [
          { text: 'R² 表示模型解释了 y 多少比例的波动。但加变量 R² 只升不降，所以比较不同变量个数的模型，要看调整 R² 或验证集上的误差。', correct: true },
          { text: '越大越好，0.99 一定是好模型。', trap: '说过头', why: '在训练集上 R² 很高也可能是过拟合，或者混进了泄露信息的特征。' },
          { text: 'R² 就是回归模型的准确率。', trap: '概念混淆', why: 'R² 是解释方差的比例，不是准确率。' },
        ],
        source: [S('sk-metrics', 'R² score')],
      },
      {
        id: 'ml-lr-c6', lesson: 'ml-linreg', type: 'choice',
        prompt: '离群点对线性回归有什么影响？',
        options: [
          { text: '影响很大：误差是平方后求和的，一个离得很远的点能把整条线拽过去。可以先检查、修正或剔除离群点，或者换对离群点不敏感的方法（比如 Huber 回归）。', correct: true },
          { text: '没影响，最小二乘会自动忽略离群点。', trap: '概念混淆', why: '正好相反，平方会把离群点的影响放大。' },
          { text: '离群点越多，模型越稳。', trap: '概念混淆', why: '离群点会让系数偏离大多数数据的规律。' },
        ],
        source: [S('sk-linear', 'Robustness regression（Huber）')],
      },
      {
        id: 'ml-lr-match', lesson: 'ml-linreg', type: 'match',
        prompt: '把几种线性回归和它的特点连起来。',
        pairs: [
          { left: '普通最小二乘 OLS', right: '只最小化残差平方和' },
          { left: '岭回归 Ridge', right: '加 L2 惩罚，系数整体变小' },
          { left: 'Lasso', right: '加 L1 惩罚，部分系数变成 0' },
          { left: 'Elastic Net', right: 'L1 和 L2 一起用，相关特征成组保留' },
        ],
        source: [S('sk-linear', 'OLS、Ridge、Lasso、Elastic-Net')],
      },
      {
        id: 'ml-lr-recite', lesson: 'ml-linreg', type: 'recite',
        prompt: '请讲一下线性回归。',
        targetSeconds: 60,
        answer: '模型 → 系数含义 → 最小二乘 → 评估指标 → 假设 → 常见问题 → 正则版本',
        points: [
          '模型：y = b₀ + b₁x₁ + … + 误差',
          '系数含义：其他变量不变时，x 增加 1 单位 y 的平均变化',
          '求解：最小二乘，让残差平方和最小，有解析解',
          '评估：R²、调整 R²、RMSE',
          '假设：线性、误差独立、同方差、误差正态、无严重共线性',
          '常见问题：离群点、多重共线性',
          '扩展：加 L2 是岭回归，加 L1 是 Lasso',
        ],
        source: [S('sk-linear', 'Linear Models')],
      },

      // ---------- 分类评估 ----------
      {
        id: 'ml-mt-c1', lesson: 'ml-metrics', type: 'choice',
        prompt: '精确率和召回率分别是什么？什么时候更看重召回率？',
        options: [
          { text: '精确率：判为正的样本里真正为正的比例；召回率：所有真正的正样本里被抓到的比例。漏掉代价大的场景更看重召回，比如识别欺诈、疾病筛查。', correct: true },
          { text: '精确率和召回率是一回事，只是叫法不同。', trap: '概念混淆', why: '分母不同：精确率除以“判为正的”，召回率除以“真正为正的”。' },
          { text: '垃圾邮件过滤更看重召回率，宁可把正常邮件也当成垃圾邮件。', trap: '概念混淆', why: '把正常邮件误判成垃圾邮件的代价更大，这类场景一般更看重精确率。' },
        ],
        source: [S('sk-metrics', 'Precision, recall and F-measures')],
      },
      {
        id: 'ml-mt-c2', lesson: 'ml-metrics', type: 'choice',
        prompt: 'AUC 是什么意思？',
        options: [
          { text: 'ROC 曲线下的面积，含义是随机挑一个正样本和一个负样本，模型给正样本打分更高的概率。0.5 相当于瞎猜，1 是完美；它看排序能力，和阈值无关。', correct: true },
          { text: 'AUC 就是阈值取 0.5 时的准确率。', trap: '概念混淆', why: 'AUC 综合了所有阈值，不依赖某一个阈值。' },
          { text: 'AUC 越接近 0.5 越好。', trap: '概念混淆', why: '0.5 等于随机猜，越接近 1 越好。' },
        ],
        source: [S('sk-metrics', 'ROC / AUC')],
      },
      {
        id: 'ml-mt-match', lesson: 'ml-metrics', type: 'match',
        prompt: '把指标和它的公式连起来。',
        pairs: [
          { left: '精确率', right: 'TP / (TP + FP)' },
          { left: '召回率', right: 'TP / (TP + FN)' },
          { left: '假正率', right: 'FP / (FP + TN)' },
          { left: '准确率', right: '(TP + TN) / 全部样本' },
          { left: 'F1', right: '精确率和召回率的调和平均' },
        ],
        source: [S('sk-metrics', 'Classification metrics')],
      },

      // ---------- 逻辑回归 ----------
      {
        id: 'ml-lg-c1', lesson: 'ml-logreg', type: 'choice',
        prompt: '逻辑回归是怎么做分类的？',
        options: [
          { text: '先算线性部分 z = w·x + b，经过 sigmoid 压到 0～1 之间当作“属于正类的概率”，大于阈值（默认 0.5）判为正；用对数损失训练。', correct: true },
          { text: '逻辑回归是回归模型，输出连续值，不能做分类。', trap: '概念混淆', why: '名字里有“回归”，但它输出的是概率，用来做分类。' },
          { text: '先用决策树把样本分组，再在每组里求平均概率。', trap: '概念混淆', why: '那更像树模型；逻辑回归是线性部分加 sigmoid。' },
        ],
        source: [S('sk-linear', 'Logistic regression')],
      },
      {
        id: 'ml-lg-c2', lesson: 'ml-logreg', type: 'choice',
        prompt: '为什么逻辑回归用对数损失，不用均方误差？',
        options: [
          { text: '套上 sigmoid 后，均方误差关于参数不是凸的，可能卡在局部最优；对数损失是凸的，判错得越离谱罚得越重，梯度下降能找到全局最优。它也等价于最大似然估计。', correct: true },
          { text: '因为均方误差算起来更慢。', trap: '概念混淆', why: '不是速度问题，是优化性质的问题（凸不凸）。' },
          { text: '其实都一样，用哪个都行。', trap: '说过头', why: '两者的优化性质和概率含义都不一样。' },
        ],
        source: [S('sk-linear', 'Logistic regression（log-loss）')],
      },
      {
        id: 'ml-lg-c3', lesson: 'ml-logreg', type: 'choice',
        prompt: '逻辑回归的决策边界是什么形状？',
        options: [
          { text: '直线（高维是超平面）：概率 = 0.5 对应 w·x + b = 0。所以它是线性分类器；要弯曲的边界，得加交叉项、多项式特征。', correct: true },
          { text: 'S 形曲线，因为用了 sigmoid。', trap: '概念混淆', why: 'S 形是概率随 z 变化的曲线，不是特征空间里的分界线。' },
          { text: '可以是任意形状，取决于数据。', trap: '说过头', why: '不加特征变换时，边界一定是线性的。' },
        ],
        source: [S('sk-linear', 'Logistic regression')],
      },
      {
        id: 'ml-lg-c4', lesson: 'ml-logreg', type: 'choice',
        prompt: '逻辑回归的系数 w 怎么解释？',
        options: [
          { text: 'xⱼ 增加 1 个单位，对数几率（log odds）增加 wⱼ，也就是几率乘以 e^wⱼ。', correct: true },
          { text: 'xⱼ 增加 1，购买概率增加 wⱼ 个百分点。', trap: '概念混淆', why: '概率的变化是非线性的，和当前位置有关；线性的是对数几率。' },
          { text: '系数越大的特征越重要，不用管量纲。', trap: '概念混淆', why: '要先标准化，系数才能互相比较。' },
        ],
        source: [S('sk-linear', 'Logistic regression'), S('x5', '阶段 5 › 模型系数怎么读')],
      },
      {
        id: 'ml-lg-c5', lesson: 'ml-logreg', type: 'choice',
        prompt: '逻辑回归和线性回归有什么区别？',
        options: [
          { text: '线性回归预测连续值，用最小二乘；逻辑回归预测类别的概率，线性部分经过 sigmoid，用对数损失（最大似然）。两者的线性部分一样，都可以加 L1 / L2 正则。', correct: true },
          { text: '没区别，逻辑回归就是把线性回归的结果四舍五入。', trap: '概念混淆', why: '损失函数和输出含义都不同。' },
          { text: '线性回归只能有一个自变量，逻辑回归可以有多个。', trap: '概念混淆', why: '两者都可以有多个自变量。' },
        ],
        source: [S('sk-linear', 'OLS、Logistic regression')],
      },
      {
        id: 'ml-lg-c6', lesson: 'ml-logreg', type: 'choice',
        prompt: '（联系项目）X5 项目最后为什么选逻辑回归，而不是 LightGBM？',
        options: [
          { text: '增益信号只有 3 个百分点左右，很弱，LightGBM 容易过拟合：默认参数的 LightGBM T-learner 验证集 Qini 0.0102、测试集只有 0.0048；逻辑回归 T-learner 验证集最高（0.0155），测试集 0.0129。复杂模型必须在验证集上证明自己更好才采用。', correct: true },
          { text: '因为逻辑回归在任何问题上都比树模型好。', trap: '说过头', why: '是这个项目信号弱、复杂模型过拟合；换个数据结论可能相反。' },
          { text: '因为 LightGBM 不能输出概率。', trap: '概念混淆', why: 'LightGBM 可以输出概率；问题是它在这里过拟合了。' },
        ],
        source: [S('x5-qa', '问题 18')],
      },
      {
        id: 'ml-lg-sort', lesson: 'ml-logreg', type: 'sort',
        prompt: '训练逻辑回归的一轮迭代，按顺序排。',
        items: [
          '算线性部分 z = w·x + b',
          '经过 sigmoid 得到概率 p',
          '用对数损失衡量预测和真实标签的差距',
          '求损失对 w、b 的梯度',
          '沿负梯度更新 w、b，重复直到收敛',
        ],
        answer: '线性部分 → **sigmoid** → **对数损失** → 梯度 → 更新',
        source: [S('sk-linear', 'Logistic regression')],
      },
      {
        id: 'ml-lg-recite', lesson: 'ml-logreg', type: 'recite',
        prompt: '请讲一下逻辑回归。',
        targetSeconds: 60,
        answer: '用途 → 线性部分 + sigmoid → 阈值和线性边界 → 对数损失 → 求解和正则 → 系数解释 → 优缺点',
        points: [
          '用途：二分类，输出属于正类的概率',
          '线性部分 z = w·x + b，经过 sigmoid 压到 0～1',
          '大于阈值（默认 0.5）判为正，决策边界是直线（超平面）',
          '损失用对数损失（交叉熵），等价于最大似然，是凸的',
          '用梯度下降等方法求解，常加 L1 / L2 正则',
          '系数解释：x 增加 1，几率乘以 e^w',
          '优点简单、快、好解释；缺点只能画线性边界',
        ],
        source: [S('sk-linear', 'Logistic regression')],
      },
    ],
  });
})();
