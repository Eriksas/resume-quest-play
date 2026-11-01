// 题库清单：游戏启动时按这里的顺序加载 data/ 里的文件。
// 新增章节：把数据文件放进 data/，再在下面加一行文件名。不用改游戏代码。
window.QUIZ_FILES = [
  // 出处表（题目里的 source.file 用这里的简称）
  'sources_resume.js',

  // 简历篇（关卡顺序看每个文件里的 order，不看这里的顺序）
  'resume_x5.js',
  'resume_agent.js',
  'resume_ccb.js',
  'resume_dachuang.js',
  'resume_intro.js',

  // 机器学习篇（每节讲解的动画在 js/labs/ 里，第一次打开才加载）
  'sources_ml.js',
  'ml_basics.js',
  'ml_linear.js',
  'ml_classify.js',
  'ml_cluster.js',
  'ml_reduce.js',
  'ml_ensemble.js',
  'ml_assoc.js',

  // 统计篇
  'sources_stat.js',
  'stat_dist.js',
  'stat_param.js',
  'stat_nonparam.js',
  'stat_markov.js',

  // 讲解的“▶ 播放讲解”步骤（按讲解 id 对上）
  'tours_ml.js',
  'tours_stat.js',

  // 简历篇的“项目数字图”
  'charts_resume.js',
];
