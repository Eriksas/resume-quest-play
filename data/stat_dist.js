// 统计篇 · 1 统计分布（期望和方差、伯努利、二项、泊松、正态）
(function () {
  const S = (file, section) => ({ file, section });
  QuizBank.register({
    id: 'stat_dist',
    part: { id: 'stat', title: '统计篇', order: 3, desc: '先看动画讲解，再做题' },
    order: 10,
    title: '统计分布',
    subtitle: '期望和方差、伯努利、二项、泊松、正态',
    badge: '分',
    intro: '三星重点是正态分布和中心极限定理：它是置信区间和 z / t 检验的基础。其余分布记住“描述什么 + 期望方差”就够了。',

    lessons: [
      {
        id: 'st-ev', title: '14.1 常见分布的期望和方差', stars: 2, lab: 'dist',
        oneLiner: '期望是长期平均水平，方差是离散程度（不确定性）。每种常见分布都有现成的期望、方差公式，背下这张表就够了。',
        tryIt: [
          '逐个切换分布，拖动参数，看形状怎么变。',
          '点“抽样 2000 次”，看样本均值、样本方差和理论值有多接近。',
        ],
        points: [
          '伯努利 B(1, p)：E = p，Var = p(1 − p)。',
          '二项 B(n, p)：E = np，Var = np(1 − p)。',
          '泊松 P(λ)：E = Var = λ。',
          '均匀 U(a, b)：E = (a + b) / 2，Var = (b − a)² / 12。',
          '指数分布（发生率 λ）：E = 1 / λ，Var = 1 / λ²。',
          '正态 N(μ, σ²)：E = μ，Var = σ²。',
          '标准差 = 方差开平方，和原变量同单位，更好解释。',
          '收入、订单金额这类右偏数据，均值会被少数极高值拉高，常看中位数。',
        ],
        source: [S('didi-stat', '1. 描述统计；2. 期望、方差、协方差、相关系数'), S('nist-unif', 'Mean / Standard Deviation'), S('nist-exp', 'Mean / Standard Deviation')],
      },
      {
        id: 'st-bern', title: '14.2 伯努利分布（0-1 分布）', stars: 2, lab: 'bern',
        oneLiner: '伯努利分布就是一次只有两种结果的试验：成功记 1（概率 p），失败记 0。一个用户是否转化、一单是否完成，都是伯努利变量。',
        tryIt: [
          '点“试 500 次”，看成功比例怎么慢慢靠近 p。',
          '拖动 p，看方差 p(1 − p) 在 p = 0.5 时最大。',
        ],
        points: [
          '只有 0 / 1 两个取值：P(X = 1) = p，P(X = 0) = 1 − p。',
          '期望 E = p：转化率本身就是伯努利变量的均值。',
          '方差 Var = p(1 − p)，p = 0.5 时最大，p 接近 0 或 1 时很小。',
          'n 个用户的转化率，标准误 = √(p(1 − p) / n)。',
          '多次独立的伯努利试验加起来，就是二项分布。',
        ],
        project: 'X5 项目的结果变量“是否购买”就是伯努利变量：实验组购买率 63.65%、对照组 60.33%，两组之差的标准误用的就是 √(p(1 − p) / n) 这一类公式（不合并方差）。',
        source: [S('didi-stat', '3. 常见分布'), S('x5', '第 4 步：平均处理效应（ATE）')],
      },
      {
        id: 'st-binom', title: '14.3 二项分布（n 重伯努利试验）', stars: 2, lab: 'binom',
        oneLiner: '做 n 次独立的伯努利试验，每次成功概率都是 p，成功的总次数就服从二项分布 B(n, p)：期望 np，方差 np(1 − p)。它是“转化人数”的基础模型。',
        tryIt: [
          '点“放 200 个球”，看小球堆出来的形状和橙色虚线（理论概率）对得上。',
          '把 p 调到 0.2，看分布变得右偏。',
          '勾上“叠加正态近似”，把 n 调大，看二项分布越来越像正态。',
        ],
        points: [
          '条件：n 次试验相互独立，每次成功概率相同。',
          'P(X = k) = C(n, k) × p^k × (1 − p)^(n − k)。',
          '期望 np，方差 np(1 − p)。',
          'p = 0.5 时对称；p 偏小时右偏，p 偏大时左偏。',
          'n 大、p 不太接近 0 或 1 时，近似正态 N(np, np(1 − p))：这是比例 z 检验的基础。',
          'n 很大、p 很小时，近似泊松分布（λ = np）。',
        ],
        source: [S('didi-stat', '3. 常见分布'), S('nist-binom', 'Binomial Distribution'), S('gs-prob', '9.1 Bernoulli Trials（正态近似）')],
      },
      {
        id: 'st-pois', title: '14.4 泊松分布', stars: 0, lab: 'pois',
        oneLiner: '泊松分布描述单位时间（或单位面积）里随机事件发生的次数，比如每分钟的订单数。它只有一个参数 λ，期望和方差都等于 λ。',
        tryIt: [
          '点“再模拟 200 分钟”，看每分钟订单数的分布和泊松理论值对得上。',
          '勾上“和二项分布比较”，看 B(50, λ/50) 和泊松几乎重合。',
        ],
        points: [
          '场景：每分钟订单数、每小时客服来电、每天故障次数等低频事件计数。',
          '条件：事件之间相互独立，平均发生率稳定。',
          'P(X = k) = λ^k × e^(−λ) / k!。',
          '期望 = 方差 = λ。',
          '事件之间的等待时间服从指数分布。',
          '二项分布在 n 很大、p 很小、np = λ 时近似泊松。',
        ],
        source: [S('didi-stat', '3. 常见分布'), S('nist-pois', 'Poisson Distribution'), S('gs-prob', '5.1 Important Distributions（二项分布的泊松近似）')],
      },
      {
        id: 'st-normal', title: '14.5 正态分布', stars: 3, lab: 'normal',
        oneLiner: '正态分布是对称的钟形曲线，由均值 μ 和标准差 σ 决定。更重要的是中心极限定理：样本量够大时，样本均值近似正态，所以才能算置信区间、做 z / t 检验。',
        tryIt: [
          '点“μ ± 1σ / 2σ / 3σ”，记住 68%、95%、99.7%。',
          '在下面的实验里，选“指数分布”，把每次抽的个数从 1 调到 30，看样本均值的分布变成正态、变窄。',
        ],
        points: [
          '对称钟形，均值 = 中位数 = 众数，由 μ 和 σ 决定。',
          '68-95-99.7 法则：μ ± 1σ、2σ、3σ 以内的概率约 68%、95%、99.7%。',
          '标准化：z = (x − μ) / σ，变成标准正态 N(0, 1)。95% 双侧的临界值是 1.96。',
          '中心极限定理：样本量足够大时，样本均值的抽样分布近似正态 N(μ, σ² / n)。',
          '标准误 SE = σ / √n：描述“估计值本身有多不稳定”；标准差 SD 描述个体数据的离散，两者不要混淆。',
          '业务数据本身不一定正态；很多方法依赖的是“样本均值近似正态”。',
          '置信区间 = 估计值 ± 临界值 × 标准误。',
        ],
        project: 'X5 全样本 20 万人，平均效应 3.32 个百分点，标准误 0.217，95% 置信区间 [2.90, 3.75]；测试集只有 40,008 人，同样的 3.32，标准误变成 0.49，区间 [2.37, 4.27] 宽得多——样本越少，标准误越大。',
        source: [S('didi-stat', '4. 抽样与中心极限定理 CLT；5. 置信区间（CI）'), S('nist-norm', 'Normal Distribution（Central Limit Theorem）'), S('x5', '第 4 步：平均处理效应（ATE）；测试集的整体效应')],
      },
    ],

    questions: [
      // ---------- 14.1 期望和方差 ----------
      {
        id: 'st-ev-match', lesson: 'st-ev', type: 'match',
        prompt: '把分布和它的期望、方差连起来。',
        pairs: [
          { left: '伯努利 B(1, p)', right: 'E = p，Var = p(1 − p)' },
          { left: '二项 B(n, p)', right: 'E = np，Var = np(1 − p)' },
          { left: '泊松 P(λ)', right: 'E = λ，Var = λ' },
          { left: '均匀 U(a, b)', right: 'E = (a + b) / 2，Var = (b − a)² / 12' },
          { left: '正态 N(μ, σ²)', right: 'E = μ，Var = σ²' },
        ],
        source: [S('didi-stat', '3. 常见分布'), S('nist-binom', 'Mean / Standard Deviation'), S('nist-pois', 'Mean / Standard Deviation'), S('nist-unif', 'Mean / Standard Deviation')],
      },
      {
        id: 'st-ev-c1', lesson: 'st-ev', type: 'choice',
        prompt: '期望和方差分别衡量什么？',
        options: [
          { text: '期望是长期平均水平；方差是离散程度（不确定性），单位是原单位的平方；标准差是方差开平方，和原变量同单位，更容易解释。', correct: true },
          { text: '方差越大，说明均值越大。', trap: '概念混淆', why: '方差衡量的是围绕均值波动有多大，和均值大小无关。' },
          { text: '标准差和方差一样，单位都是原单位的平方。', trap: '概念混淆', why: '方差是平方单位；标准差开了平方根，回到原单位。' },
        ],
        source: [S('didi-stat', '1. 描述统计；2. 期望、方差、协方差、相关系数')],
      },
      {
        id: 'st-ev-c2', lesson: 'st-ev', type: 'choice',
        prompt: '分析收入、订单金额时，为什么常看中位数而不只看均值？',
        options: [
          { text: '这类数据通常右偏，少数极高值会把均值拉高；中位数受极端值影响小，更能描述“典型用户”。', correct: true },
          { text: '因为中位数总是比均值大。', trap: '概念混淆', why: '右偏分布里通常是均值大于中位数。' },
          { text: '均值没有用，只看中位数就够了。', trap: '说过头', why: '两者描述的东西不同；算总收入、GMV 时仍然要用均值。' },
        ],
        source: [S('didi-stat', '1. 描述统计')],
      },

      // ---------- 14.2 伯努利 ----------
      {
        id: 'st-bern-c1', lesson: 'st-bern', type: 'choice',
        prompt: '什么是伯努利分布？期望和方差是多少？',
        options: [
          { text: '一次试验只有两种结果：成功记 1（概率 p），失败记 0，比如一个用户是否转化。期望 p，方差 p(1 − p)。', correct: true },
          { text: '期望 p，方差也是 p。', trap: '数字记错', why: '方差是 p(1 − p)，不是 p。' },
          { text: 'p 越大，方差越大。', trap: '概念混淆', why: 'p(1 − p) 在 p = 0.5 时最大，p 接近 1 时方差反而很小。' },
        ],
        source: [S('didi-stat', '3. 常见分布')],
      },
      {
        id: 'st-bern-c2', lesson: 'st-bern', type: 'choice',
        prompt: '两个实验各有 1 万人，一个转化率约 50%，一个约 5%。哪个转化率的标准误更大？',
        options: [
          { text: '50% 的那个。标准误 = √(p(1 − p) / n)，p(1 − p) 在 0.5 时最大，所以同样样本量下，50% 附近的转化率波动最大。', correct: true },
          { text: '5% 的那个，因为转化率越低越不稳定。', trap: '概念混淆', why: '按绝对值算，p(1 − p) 在 0.05 时只有 0.0475，比 0.5 时的 0.25 小得多。' },
          { text: '一样大，因为样本量相同。', trap: '概念混淆', why: '标准误还取决于 p(1 − p)，不只是 n。' },
        ],
        source: [S('didi-stat', '3. 常见分布；4. 抽样与中心极限定理 CLT'), S('x5', '第 4 步：平均处理效应（ATE）')],
      },

      // ---------- 14.3 二项 ----------
      {
        id: 'st-binom-c1', lesson: 'st-binom', type: 'choice',
        prompt: '二项分布描述的是什么？',
        options: [
          { text: 'n 次相互独立、每次成功概率都是 p 的伯努利试验里，成功的总次数。期望 np，方差 np(1 − p)，是“转化人数”的基础模型。', correct: true },
          { text: 'n 次试验不需要独立，只要成功概率相同就行。', trap: '概念混淆', why: '独立是二项分布的前提；同一个用户被重复计数就不满足。' },
          { text: '二项分布永远是左右对称的。', trap: '说过头', why: '只有 p = 0.5 时对称；p 偏小时右偏。' },
        ],
        source: [S('didi-stat', '3. 常见分布'), S('nist-binom', 'Binomial Distribution')],
      },
      {
        id: 'st-binom-c2', lesson: 'st-binom', type: 'choice',
        prompt: '二项分布什么时候可以用正态分布近似？',
        options: [
          { text: 'n 足够大、p 不太接近 0 或 1 时，近似 N(np, np(1 − p))。大样本转化率 A/B 实验能用 z 检验，就是这个道理。', correct: true },
          { text: '只要 n > 30 就一定可以。', trap: '说过头', why: 'p 非常小（比如 0.001）时，n = 30 远远不够，这时更接近泊松分布。' },
          { text: '二项分布是离散的，永远不能用正态近似。', trap: '概念混淆', why: 'n 大时离散的二项分布形状非常接近正态，近似效果很好。' },
        ],
        source: [S('gs-prob', '9.1 Central Limit Theorem：Bernoulli Trials'), S('didi-stat', '8. z 检验 / t 检验 / 卡方检验')],
      },

      // ---------- 14.4 泊松 ----------
      {
        id: 'st-pois-c1', lesson: 'st-pois', type: 'choice',
        prompt: '泊松分布适合描述什么？期望和方差是多少？',
        options: [
          { text: '单位时间里随机事件发生的次数，比如每分钟订单数、每小时来电数；要求事件独立、发生率稳定。期望和方差都等于 λ。', correct: true },
          { text: '期望是 λ，方差是 λ²。', trap: '数字记错', why: '泊松分布期望 = 方差 = λ。' },
          { text: '描述一个用户是否转化。', trap: '概念混淆', why: '是否转化只有 0 / 1，是伯努利分布。' },
        ],
        source: [S('didi-stat', '3. 常见分布'), S('nist-pois', 'Poisson Distribution')],
      },
      {
        id: 'st-pois-c2', lesson: 'st-pois', type: 'choice',
        prompt: '泊松分布和二项分布有什么关系？',
        options: [
          { text: 'n 很大、p 很小、np = λ 保持适中时，二项分布 B(n, p) 近似泊松分布 P(λ)。', correct: true },
          { text: 'n 很小时，二项分布近似泊松分布。', trap: '概念混淆', why: '条件是 n 很大、p 很小。' },
          { text: '两者没有关系。', trap: '概念混淆', why: '泊松可以看成二项分布在“试验很多、每次成功率很低”时的极限。' },
        ],
        source: [S('gs-prob', '5.1 Important Distributions：Poisson Distribution'), S('didi-stat', '3. 常见分布')],
      },

      // ---------- 14.5 正态 ----------
      {
        id: 'st-norm-c1', lesson: 'st-normal', type: 'choice',
        prompt: '正态分布的 68-95-99.7 法则是什么？',
        options: [
          { text: '落在 μ ± 1σ、μ ± 2σ、μ ± 3σ 以内的概率，分别约 68%、95%、99.7%。', correct: true },
          { text: 'μ ± 1σ 以内约 95%，μ ± 2σ 以内约 99.7%。', trap: '数字记错', why: '±1σ 约 68%，±2σ 约 95%，±3σ 约 99.7%。' },
          { text: '95% 置信区间用的临界值是 2.58。', trap: '数字记错', why: '95% 双侧是 1.96；2.58 对应 99%。' },
        ],
        source: [S('nist-norm', 'Normal Distribution')],
      },
      {
        id: 'st-norm-c2', lesson: 'st-normal', type: 'choice',
        prompt: '中心极限定理说的是什么？',
        options: [
          { text: '在相对温和的条件下，样本量足够大时，样本均值的抽样分布趋近正态。所以即使原始数据不正态，也能用它构造置信区间、做显著性检验。', correct: true },
          { text: '样本量大了以后，原始数据本身就会变成正态分布。', trap: '概念混淆', why: '变成正态的是“样本均值的分布”，原始数据的分布不会变。' },
          { text: '只要 n ≥ 30，任何情况下都可以放心用正态近似。', trap: '说过头', why: '数据重尾、极端值多，或者样本不独立（同一用户重复观测）时，30 可能远远不够。' },
        ],
        source: [S('didi-stat', '4. 抽样与中心极限定理 CLT；8. z 检验 / t 检验 / 卡方检验')],
      },
      {
        id: 'st-norm-c3', lesson: 'st-normal', type: 'choice',
        prompt: '标准差 SD 和标准误 SE 有什么区别？',
        options: [
          { text: 'SD 描述个体数据的离散程度；SE 描述估计量（比如样本均值）本身有多不稳定，等于 σ / √n，样本越大 SE 越小。', correct: true },
          { text: '两个是一回事，只是叫法不同。', trap: '概念混淆', why: 'SD 不随样本量变小；SE 随 √n 变小。' },
          { text: '样本越大，SD 越小。', trap: '概念混淆', why: '样本越大，变小的是 SE；SD 只会越来越接近总体的真实值。' },
        ],
        source: [S('didi-stat', '4. 抽样与中心极限定理 CLT')],
      },
      {
        id: 'st-norm-c4', lesson: 'st-normal', type: 'choice',
        prompt: '面试官：“你 X5 项目的 95% 置信区间 [2.90, 3.75] 怎么理解？”',
        options: [
          { text: '它是 3.32 ± 1.96 × 0.217 个百分点算出来的。意思是：如果重复做这个实验、按同样方法构造区间，长期约 95% 的区间会覆盖真实效应。区间不含 0，说明短信效应显著为正。', correct: true },
          { text: '真实效应有 95% 的概率落在 [2.90, 3.75] 里。', trap: '概念混淆', why: '严格说，95% 指的是“这种构造方法”长期覆盖真实值的比例，不要说已算出的区间有 95% 概率包含真实值。' },
          { text: '置信区间是 [2.90, 3.75] 个百分比，说明相对提升在 3% 左右。', trap: '数字记错', why: '单位是“个百分点”（绝对差）；相对提升是 5.5%。' },
        ],
        source: [S('didi-stat', '5. 置信区间（CI）'), S('x5', '第 4 步：平均处理效应（ATE）')],
      },
      {
        id: 'st-norm-match', lesson: 'st-normal', type: 'match',
        prompt: '把数字 / 公式和它的含义连起来。',
        pairs: [
          { left: '1.96', right: '95% 双侧置信区间的临界值' },
          { left: '0.84', right: '80% 功效对应的 z 值（算 MDE 用）' },
          { left: 'σ / √n', right: '样本均值的标准误' },
          { left: '(x − μ) / σ', right: 'z 分数：标准化成 N(0, 1)' },
        ],
        source: [S('nist-norm', 'Normal Distribution'), S('x5', '第 7 步：最小可检测效应（MDE）'), S('didi-stat', '4. 抽样与中心极限定理 CLT')],
      },
      {
        id: 'st-norm-recite', lesson: 'st-normal', type: 'recite',
        prompt: '请讲一下正态分布和中心极限定理。',
        targetSeconds: 60,
        answer: '形状 → 68-95-99.7 → 标准化 → 中心极限定理 → 标准误 → 用途',
        points: [
          '形状：对称钟形，均值 = 中位数，由 μ 和 σ 决定',
          '68-95-99.7：±1σ、2σ、3σ 以内约 68%、95%、99.7%',
          '标准化：z = (x − μ) / σ 变成 N(0, 1)，95% 临界值 1.96',
          '中心极限定理：样本够大时，样本均值近似正态 N(μ, σ² / n)',
          '标准误 σ / √n：样本越大越小，和标准差不是一回事',
          '用途：置信区间 = 估计值 ± 1.96 × 标准误，z / t 检验',
          '提醒：原始业务数据不一定正态，依赖的是样本均值近似正态',
        ],
        source: [S('didi-stat', '3. 常见分布；4. 抽样与中心极限定理 CLT；5. 置信区间（CI）'), S('nist-norm', 'Normal Distribution')],
      },
    ],
  });
})();
