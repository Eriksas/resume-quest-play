// 统计篇用到的材料：你的滴滴速查 PDF + 官方文档 / 教材（带链接）。X5 项目的数字沿用简历篇和机器学习篇的出处（x5、x5-qa、x5-log）。
(function () {
  const NIST = (page, title) => ({ short: 'NIST 统计手册', title: `NIST/SEMATECH e-Handbook of Statistical Methods：${title}`, url: `https://www.itl.nist.gov/div898/handbook/eda/section3/${page}.htm` });
  const SP = (fn) => ({ short: `scipy · ${fn}`, title: `SciPy 文档：scipy.stats.${fn}`, url: `https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.${fn}.html` });
  QuizBank.addSources({
    'didi-stat':   { short: '滴滴速查 · 统计学', title: '滴滴数据分析面试_SQL与统计学_手机速查版.pdf（B. 统计学面试主干）' },
    'nist-norm':   NIST('eda3661', '1.3.6.6.1 Normal Distribution'),
    'nist-unif':   NIST('eda3662', '1.3.6.6.2 Uniform Distribution'),
    'nist-exp':    NIST('eda3667', '1.3.6.6.7 Exponential Distribution'),
    'nist-binom':  NIST('eda366i', '1.3.6.6.18 Binomial Distribution'),
    'nist-pois':   NIST('eda366j', '1.3.6.6.19 Poisson Distribution'),
    'nist-t2':     NIST('eda353', '1.3.5.3 Two-Sample t-Test for Equal Means'),
    'nist-anova':  NIST('eda354', '1.3.5.4 One-Factor ANOVA'),
    'nist-f':      NIST('eda359', '1.3.5.9 F-Test for Equality of Two Variances'),
    'nist-levene': NIST('eda35a', '1.3.5.10 Levene Test for Equality of Variances'),
    'nist-chigof': NIST('eda35f', '1.3.5.15 Chi-Square Goodness-of-Fit Test'),
    'nist-ks':     NIST('eda35g', '1.3.5.16 Kolmogorov-Smirnov Goodness-of-Fit Test'),
    'sp-ttest':    SP('ttest_ind'),
    'sp-ttrel':    SP('ttest_rel'),
    'sp-levene':   SP('levene'),
    'sp-chi2':     SP('chi2_contingency'),
    'sp-chisq':    SP('chisquare'),
    'sp-mwu':      SP('mannwhitneyu'),
    'sp-wilcoxon': SP('wilcoxon'),
    'sp-anova':    SP('f_oneway'),
    'sp-kruskal':  SP('kruskal'),
    'sp-ks':       SP('ks_2samp'),
    'sp-shapiro':  SP('shapiro'),
    'gs-prob':     { short: 'Grinstead & Snell 概率教材', title: 'Grinstead & Snell《Introduction to Probability》（免费公开版）', url: 'https://math.dartmouth.edu/~prob/prob/prob.pdf' },
    'rabiner':     { short: 'Rabiner 1989 · HMM 教程', title: 'L. R. Rabiner, A Tutorial on Hidden Markov Models and Selected Applications in Speech Recognition, Proceedings of the IEEE, 1989', url: 'https://doi.org/10.1109/5.18626' },
  });
})();
