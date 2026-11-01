// 朴素贝叶斯：勾选邮件里出现的词，按“各词条件独立”把概率直接相乘，算出是垃圾邮件的概率。
Labs.register('nb', {
  render(host, K) {
    const root = K.panel(host);
    K.note(root, '下面是一份<b>虚构的示例统计</b>：100 封训练邮件里 40 封是垃圾邮件、60 封正常，统计每个词在两类邮件里出现了几封。', '');
    const words = [
      { w: '免费', spam: 24, ham: 3 },
      { w: '中奖', spam: 14, ham: 0 },
      { w: '会议', spam: 2, ham: 27 },
      { w: '报告', spam: 4, ham: 21 },
      { w: '点击', spam: 20, ham: 9 },
    ];
    const NS = 40;
    const NH = 60;
    const on = new Set(['免费', '点击']);
    const ctl = K.row(root);
    words.forEach((x) => K.check(ctl, `邮件里有“${x.w}”`, on.has(x.w), (v) => { if (v) on.add(x.w); else on.delete(x.w); draw(); }));
    const ctl2 = K.row(root);
    const smooth = K.check(ctl2, '拉普拉斯平滑（每个计数 +1）', true, () => draw());
    const table = K.h('<div></div>', root);
    const p = K.plot(root, { x: [0, 1], y: [0, 1], w: 640, h: 90, axes: false, label: '垃圾邮件概率' });
    const g = p.layer('bar');
    const note = K.note(root, '');

    function draw() {
      const a = smooth.value ? 1 : 0;
      const pw = (cnt, N) => (cnt + a) / (N + 2 * a);
      let ls = NS / (NS + NH);
      let lh = NH / (NS + NH);
      const rows = words.map((x) => {
        const ps = on.has(x.w) ? pw(x.spam, NS) : 1 - pw(x.spam, NS);
        const ph = on.has(x.w) ? pw(x.ham, NH) : 1 - pw(x.ham, NH);
        ls *= ps;
        lh *= ph;
        return `<tr class="${on.has(x.w) ? 'on' : ''}"><td>${on.has(x.w) ? '有' : '没有'}“${x.w}”</td><td>${x.spam}/${NS}</td><td>${ps.toFixed(3)}</td><td>${x.ham}/${NH}</td><td class="${ph === 0 ? 'bad' : ''}">${ph.toFixed(3)}</td></tr>`;
      });
      const post = ls + lh ? ls / (ls + lh) : 0.5;
      table.innerHTML = `<table class="lab-table"><thead><tr><th>这封邮件</th><th>垃圾邮件里出现</th><th>P(词 | 垃圾)</th><th>正常邮件里出现</th><th>P(词 | 正常)</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
      K.clear(g);
      K.s('rect', { x: 20, y: 30, width: 600, height: 26, rx: 6, fill: 'var(--surface-2)' }, g);
      K.s('rect', { x: 20, y: 30, width: Math.max(2, 600 * post), height: 26, rx: 6, fill: 'var(--series-2)' }, g);
      K.text(g, 20, 20, `P(垃圾 | 这封邮件) = ${K.pct(post, 1)}`, { class: 'strong' });
      const zero = !smooth.value && on.has('中奖');
      note.className = 'lab-note ' + (zero ? 'warn' : '');
      note.innerHTML = zero
        ? '没有平滑时，“中奖”从没在正常邮件里出现过，P(中奖 | 正常) = 0，乘起来整封邮件属于正常的概率直接变 0——一个词就一票否决。<b>拉普拉斯平滑</b>给每个计数加 1，避免这种情况。'
        : '贝叶斯公式：P(垃圾 | 邮件) ∝ P(垃圾) × P(邮件 | 垃圾)。“朴素”在于假设各个词在给定类别下<b>相互独立</b>，于是 P(邮件 | 垃圾) 可以拆成每个词的概率直接相乘。这个假设通常不成立，但用来排序分类效果常常不错，而且训练、预测都很快，适合文本分类。';
    }
    draw();
  },
});
