// 机器学习篇 · 6 集成学习（随机森林、AdaBoost、XGBoost、LightGBM、CatBoost）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'ml_ensemble',
    part: { id: 'ml', title: '机器学习篇', order: 2, desc: '先看动画讲解，再做题' },
    order: 60,
    title: '集成学习',
    subtitle: 'Bagging：随机森林；Boosting：AdaBoost、XGBoost、LightGBM、CatBoost',
    badge: '林',
    intro: '两星重点是随机森林和 XGBoost。先分清 Bagging（并行、降方差）和 Boosting（串行、降偏差）。',

    lessons: [
      {
        id: 'ml-rf', title: '4.2.1 随机森林', stars: 2, lab: 'rf',
        oneLiner: '随机森林 = 很多棵决策树投票。每棵树用有放回抽样的数据（Bagging），每次分裂只看随机一部分特征，让树之间不那么像；平均后方差大幅下降。',
        tryIt: [
          '切到“看其中一棵树”，看它的边界有多碎；换几棵看看。',
          '切回“看整片森林”，把树的数量从 1 拉到 40。',
          '留意袋外（OOB）准确率。',
        ],
        points: [
          '两种随机：行（有放回抽样）+ 列（每次分裂随机选一部分特征，分类常用 √特征数）。',
          '每棵树可以长得很深，靠平均来降方差。',
          '每棵树大约有三分之一的样本没被抽到（袋外样本），可以用来算 OOB 分数，相当于免费的验证集。',
          '特征重要性：按分裂带来的不纯度下降累计；偏向取值多的特征，可以用置换重要性对照。',
          '优点：效果稳、调参少、可以并行；缺点：模型大，不如单棵树好解释。',
          'Bagging 主要降方差，Boosting 主要降偏差。',
        ],
        source: [S('sk-ens', 'Random Forests、Out-of-bag')],
      },
      {
        id: 'ml-adaboost', title: '4.3.1 AdaBoost', stars: 0, lab: 'adaboost',
        oneLiner: 'AdaBoost 一轮轮训练弱分类器（常用只切一刀的树桩）：上一轮分错的样本权重变大，下一轮重点照顾；最后按每个分类器的准确程度加权投票。',
        tryIt: [
          '点“下一轮”，看分错的点变大。',
          '跑 10 轮以上，看右边组合起来的边界怎么圈出圆形。',
        ],
        points: [
          '样本权重：分错的变大、分对的变小。',
          '分类器权重：错误率越低，话语权越大。',
          '串行训练，不能并行。',
          '对噪声和离群点敏感（分不对的点会被反复加权）。',
          'GBDT 把“调整样本权重”换成了“拟合负梯度”。',
        ],
        source: [S('sk-ens', 'AdaBoost')],
      },
      {
        id: 'ml-xgb', title: '4.3.2 XGBoost', stars: 2, lab: 'xgb',
        oneLiner: 'XGBoost 是工程上做到极致的梯度提升树：用一阶和二阶梯度近似损失，目标函数里加了树的复杂度正则（叶子数 + 叶子权重），用增益公式决定分不分裂。',
        tryIt: [
          '拖“切在第几个样本之后”，看增益怎么变；点“自动找增益最大的切分”。',
          '把 λ 调大，看叶子权重被压小。',
          '把 γ 调到 6 以上，看分裂被否决。',
        ],
        points: [
          '目标 = 损失 + 每棵树的正则 Ω，Ω = γT + ½λΣw²（T 是叶子数，w 是叶子权重）。',
          '二阶泰勒展开：每个样本只需要 g（一阶梯度）和 h（二阶梯度），任何可导损失都能套同一套解法。',
          '叶子最优权重 w* = −G / (H + λ)。',
          '分裂增益 = ½[G左²/(H左+λ) + G右²/(H右+λ) − (G左+G右)²/(H左+H右+λ)] − γ；不大于 0 就不分。',
          '防过拟合：学习率（每棵树打折）、行抽样、列抽样、限制深度。',
          '工程：缺失值自动学默认方向；同一棵树里找切分点可以并行（树和树之间还是串行）。',
        ],
        source: [S('xgb', 'Introduction to Boosted Trees')],
      },
      {
        id: 'ml-lgbm', title: '4.3.3 LightGBM', stars: 0, lab: 'lgbm',
        oneLiner: 'LightGBM 是更快的梯度提升树：直方图算法把连续值分桶，按叶子生长（每次切收益最大的叶子），再用 GOSS 和 EFB 减少样本和特征。',
        tryIt: [
          '点“两边各切一刀”几次，比较按层和按叶子生长谁降损失更多。',
          '拖“桶的个数”，看候选切分点少了多少。',
        ],
        points: [
          '直方图：分桶后只在桶边界找切分点，省时省内存。',
          '按叶子生长：同样叶子数，损失降得更多；但树更深，数据少时容易过拟合，要限制 num_leaves、max_depth。',
          'GOSS：梯度大的样本全留，梯度小的抽一部分。',
          'EFB：把很少同时非零的稀疏特征捆成一个。',
          '能直接处理类别特征。',
          '论文摘要里说，训练速度比传统 GBDT 快最多 20 倍以上，精度几乎不变。',
        ],
        project: '余额宝和 X5 两个项目里，LightGBM 都因为数据少或信号弱过拟合了，最后都输给了更简单的方法。',
        source: [S('lgb', 'Features'), S('lgb-paper', '摘要'), S('yeb-qa', '问题 21'), S('x5-qa', '问题 18')],
      },
      {
        id: 'ml-catboost', title: '4.3.4 CatBoost', stars: 0, lab: 'catboost',
        oneLiner: 'CatBoost 擅长类别特征：用“有序目标统计”把类别变成数字（每行只用排在前面的行来算，避免目标泄露），配合有序提升和对称树。',
        tryIt: [
          '点表格里的不同行，看它的编码用到了哪几行。',
          '点“换一个随机排列”，看同一个用户的编码怎么变。',
        ],
        points: [
          '有序目标统计：随机排列后，每一行的编码 =（前面同类别里标签为 1 的个数 + 先验）÷（前面同类别的行数 + 1）。',
          '有序提升：用来减少梯度提升里的预测偏移（论文里说这是一种目标泄露）。',
          '对称树：同一层的所有节点用同一个切分条件。',
          '类别特征多的表格数据很合适。',
        ],
        source: [S('cb', '类别特征转数值'), S('cb-paper', '摘要')],
      },
    ],

    questions: [
      // ---------- 随机森林 ----------
      {
        id: 'ml-rf-c1', lesson: 'ml-rf', type: 'choice',
        prompt: '随机森林的“随机”体现在哪里？',
        options: [
          { text: '两处：每棵树用有放回抽样得到的样本训练（Bagging）；每次分裂只从随机挑的一部分特征里选最优切分。两种随机让树之间不那么相似，平均后方差降得更多。', correct: true },
          { text: '每棵树随机选切分点，不看不纯度。', trap: '概念混淆', why: '在随机挑出的那几个特征里，还是按不纯度选最优切分。' },
          { text: '随机决定每棵树投票的权重。', trap: '概念混淆', why: '每棵树的权重一样，随机的是样本和特征。' },
        ],
        source: [S('sk-ens', 'Random Forests')],
      },
      {
        id: 'ml-rf-c2', lesson: 'ml-rf', type: 'choice',
        prompt: 'Bagging 和 Boosting 有什么区别？',
        options: [
          { text: 'Bagging（如随机森林）并行训练很多个互相独立的模型，再投票或平均，主要降方差；Boosting（如 AdaBoost、GBDT、XGBoost）串行训练，每个新模型重点修正前面的错误，主要降偏差。', correct: true },
          { text: 'Bagging 是串行，Boosting 是并行。', trap: '概念混淆', why: '说反了。' },
          { text: '两者都是在同一份数据上把同一个模型训练很多次。', trap: '概念混淆', why: 'Bagging 每次用不同的抽样数据；Boosting 每次的目标（样本权重或残差）都在变。' },
        ],
        source: [S('sk-ens', 'Ensembles')],
      },
      {
        id: 'ml-rf-c3', lesson: 'ml-rf', type: 'choice',
        prompt: '什么是袋外（OOB）估计？',
        options: [
          { text: '有放回抽样时，每棵树大约有三分之一的样本没被抽到。用没见过某个样本的那些树给它打分，汇总起来就是袋外分数，相当于免费的验证集。', correct: true },
          { text: '袋外样本是被删掉的离群点。', trap: '概念混淆', why: '袋外样本只是这一棵树没抽到的样本，别的树可能抽到了。' },
          { text: '袋外估计就是测试集上的分数。', trap: '概念混淆', why: '袋外分数只用训练数据算，不需要单独的测试集。' },
        ],
        source: [S('sk-ens', 'Out-of-bag estimate')],
      },
      {
        id: 'ml-rf-c4', lesson: 'ml-rf', type: 'choice',
        prompt: '随机森林和 GBDT 怎么选？',
        options: [
          { text: '随机森林稳、调参少、可以并行，适合先做一个强基线；GBDT / XGBoost / LightGBM 通常精度更高，但对参数更敏感、更容易过拟合，要配合验证集和早停。数据少、信号弱时，简单模型也可能更好。', correct: true },
          { text: 'GBDT 永远比随机森林好。', trap: '说过头', why: '要看数据；参数没调好或数据少时，GBDT 更容易过拟合。' },
          { text: '随机森林只能做分类，不能做回归。', trap: '概念混淆', why: '随机森林也能做回归，叶子和投票改成取平均。' },
        ],
        source: [S('sk-ens', 'Random Forests、Gradient Boosting'), S('x5-qa', '问题 18')],
      },

      // ---------- AdaBoost ----------
      {
        id: 'ml-ab-c1', lesson: 'ml-adaboost', type: 'choice',
        prompt: 'AdaBoost 每一轮是怎么调整的？',
        options: [
          { text: '提高上一轮分错样本的权重、降低分对样本的权重，让下一个弱分类器重点学难分的样本；每个弱分类器按自己的错误率得到投票权重，错误率越低权重越大。', correct: true },
          { text: '每一轮都换一批随机样本，权重不变。', trap: '概念混淆', why: '那更像 Bagging；AdaBoost 是调整样本权重。' },
          { text: '每一轮拟合上一轮的残差。', trap: '概念混淆', why: '那是梯度提升（平方损失下）的做法。' },
        ],
        source: [S('sk-ens', 'AdaBoost')],
      },

      // ---------- XGBoost ----------
      {
        id: 'ml-xg-c1', lesson: 'ml-xgb', type: 'choice',
        prompt: 'XGBoost 相比普通 GBDT 有哪些改进？',
        options: [
          { text: '二阶泰勒展开（同时用一阶和二阶梯度）；目标函数里加了正则（叶子数和叶子权重的惩罚）；用增益公式决定分裂，自带剪枝；还有行列抽样、缺失值默认方向、并行找切分点等工程优化。', correct: true },
          { text: 'XGBoost 不用决策树，用的是线性模型。', trap: '概念混淆', why: '主要用的还是决策树（gbtree）。' },
          { text: 'XGBoost 把 Boosting 改成了并行训练很多棵独立的树。', trap: '概念混淆', why: '树还是一棵接一棵串行加的；并行的是同一棵树内部找切分点。' },
        ],
        source: [S('xgb', 'Introduction to Boosted Trees')],
      },
      {
        id: 'ml-xg-c2', lesson: 'ml-xgb', type: 'choice',
        prompt: 'XGBoost 的正则项是什么？',
        options: [
          { text: 'Ω = γT + ½λΣw²：T 是叶子数，w 是叶子权重。γ 惩罚多长叶子，λ 把叶子权重往 0 压。', correct: true },
          { text: 'Ω = λΣ|特征系数|，和 Lasso 一样。', trap: '概念混淆', why: '惩罚的是树的叶子数和叶子权重，不是特征系数。' },
          { text: 'XGBoost 没有正则，只靠早停防过拟合。', trap: '概念混淆', why: '目标函数里带正则，正是它和普通 GBDT 的主要区别之一。' },
        ],
        source: [S('xgb', 'Model Complexity')],
      },
      {
        id: 'ml-xg-c3', lesson: 'ml-xgb', type: 'choice',
        prompt: '叶子权重 w* = −G / (H + λ) 里，λ 变大会怎样？',
        options: [
          { text: '分母变大，叶子权重被往 0 压小，每棵树走的步子更保守，有助于防过拟合。', correct: true },
          { text: '叶子权重变大，模型学得更快。', trap: '概念混淆', why: 'λ 在分母里，变大只会让权重变小。' },
          { text: '只影响分裂的数量，不影响叶子权重。', trap: '概念混淆', why: '两个都影响：λ 同时出现在叶子权重和分裂增益的公式里。' },
        ],
        source: [S('xgb', 'The Structure Score')],
      },
      {
        id: 'ml-xg-match', lesson: 'ml-xgb', type: 'match',
        prompt: '把 XGBoost 的常用参数和作用连起来。',
        pairs: [
          { left: 'learning_rate', right: '缩小每棵树的贡献，要配更多棵树' },
          { left: 'max_depth', right: '限制每棵树的深度' },
          { left: 'subsample', right: '每棵树随机用一部分样本' },
          { left: 'colsample_bytree', right: '每棵树随机用一部分特征' },
          { left: 'gamma', right: '分裂增益要超过它才分裂' },
        ],
        source: [S('xgb', 'Introduction to Boosted Trees')],
      },

      // ---------- LightGBM ----------
      {
        id: 'ml-lgb-c1', lesson: 'ml-lgbm', type: 'choice',
        prompt: 'LightGBM 为什么训练快？',
        options: [
          { text: '直方图算法把连续特征分桶，只在桶边界找切分点；按叶子生长，同样叶子数降损失更多；GOSS 保留梯度大的样本、梯度小的只抽一部分；EFB 把互斥的稀疏特征捆在一起。', correct: true },
          { text: '因为它不用决策树。', trap: '概念混淆', why: 'LightGBM 还是梯度提升决策树。' },
          { text: '因为它按层生长，每层只切一个节点。', trap: '概念混淆', why: '它是按叶子生长：每次挑收益最大的叶子切。' },
        ],
        source: [S('lgb', 'Features'), S('lgb-paper', '摘要')],
      },

      // ---------- CatBoost ----------
      {
        id: 'ml-cb-c1', lesson: 'ml-catboost', type: 'choice',
        prompt: 'CatBoost 怎么处理类别特征？',
        options: [
          { text: '用有序目标统计：先随机排列样本，每一行的编码只用排在它前面、类别相同的行的标签来算（加上先验），自己的标签不参与，避免目标泄露。', correct: true },
          { text: '先统一做 one-hot 编码。', trap: '概念混淆', why: 'CatBoost 的特点就是不用自己做 one-hot，内部自动转成数值。' },
          { text: '直接用整列的目标均值来编码，最准。', trap: '概念混淆', why: '编码里含有自己的标签，会泄露答案，线上效果变差。' },
        ],
        source: [S('cb', '类别特征转数值'), S('cb-paper', '摘要')],
      },
    ],
  });
})();
