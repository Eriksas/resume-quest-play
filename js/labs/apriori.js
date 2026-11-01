// Apriori：一层层找频繁项集。用“频繁项集的子集一定频繁”来剪枝，再从频繁项集里挑关联规则。
Labs.register('apriori', {
  render(host, K) {
    const root = K.panel(host);
    const tx = [
      ['牛奶', '面包', '尿布'],
      ['可乐', '面包', '尿布', '啤酒'],
      ['牛奶', '尿布', '啤酒', '鸡蛋'],
      ['面包', '牛奶', '尿布', '啤酒'],
      ['面包', '牛奶', '尿布', '可乐'],
      ['面包', '牛奶', '鸡蛋'],
    ];
    K.h(`<table class="lab-table"><thead><tr><th>订单</th><th>买了什么（示例数据）</th></tr></thead><tbody>${tx.map((t, i) => `<tr><td>#${i + 1}</td><td>${t.join('、')}</td></tr>`).join('')}</tbody></table>`, root);
    const ctl = K.row(root);
    const minSup = K.slider(ctl, { label: '最小支持度（至少出现在几单里）', min: 1, max: 5, step: 1, value: 3, fmt: (v) => `${v} 单（${Math.round((v / tx.length) * 100)}%）`, onInput: () => { level = 1; draw(); } });
    const btns = K.row(root);
    K.button(btns, '下一层', () => { level += 1; draw(); }, true);
    K.button(btns, '重来', () => { level = 1; draw(); });
    const out = K.h('<div></div>', root);
    const note = K.note(root, '');
    K.h('<h3 class="sub-h">关联规则：从频繁项集里挑</h3>', root);
    const ctl2 = K.row(root);
    const minConf = K.slider(ctl2, { label: '最小置信度', min: 0.3, max: 1, step: 0.05, value: 0.7, fmt: (v) => K.pct(v), onInput: () => rules() });
    const rulesBox = K.h('<div></div>', root);
    K.note(root, '<b>支持度</b>：A 和 B 同时出现的订单占比。<b>置信度</b> P(B | A)：买了 A 的订单里，有多少也买了 B。<b>提升度</b> = 置信度 ÷ B 本身的支持度；等于 1 说明 A、B 相互独立，大于 1 才说明“买 A 让买 B 更常见”。', '');
    let level = 1;

    const sup = (set) => tx.filter((t) => set.every((i) => t.includes(i))).length;
    const key = (s) => s.slice().sort().join('+');
    function levels() {
      const items = [...new Set(tx.flat())].sort();
      const res = [];
      let freq = items.map((i) => [i]);
      let cands = freq;
      for (let k = 1; k <= 4; k++) {
        const rowsK = cands.map((c) => {
          const pruned = k > 2 && c.some((_, j) => !res[k - 2].frequent.has(key(c.filter((__, m) => m !== j))));
          const s = pruned ? null : sup(c);
          return { c, s, pruned, ok: !pruned && s >= minSup.value };
        });
        const frequent = new Set(rowsK.filter((r) => r.ok).map((r) => key(r.c)));
        res.push({ k, rows: rowsK, frequent });
        const fl = rowsK.filter((r) => r.ok).map((r) => r.c);
        const next = new Map();
        for (let a = 0; a < fl.length; a++) for (let b = a + 1; b < fl.length; b++) {
          const u = [...new Set(fl[a].concat(fl[b]))].sort();
          if (u.length === k + 1) next.set(key(u), u);
        }
        cands = [...next.values()];
        if (!cands.length) break;
      }
      return res;
    }

    function draw() {
      const res = levels();
      const show = res.slice(0, level);
      out.innerHTML = show.map((L) => `<h3 class="sub-h">${L.k} 项集（候选 ${L.rows.length} 个）</h3>
        <table class="lab-table"><thead><tr><th>项集</th><th>出现在几单</th><th>结果</th></tr></thead><tbody>${
          L.rows.map((r) => `<tr class="${r.ok ? 'on' : 'off'}"><td>${r.c.join(' + ')}</td><td>${r.pruned ? '不用数' : r.s}</td><td class="${r.ok ? 'good' : 'bad'}">${r.pruned ? '剪枝：它有子集不频繁' : r.ok ? '频繁' : '不够'}</td></tr>`).join('')
        }</tbody></table>`).join('');
      const last = show[show.length - 1];
      const pruned = res.some((L) => L.rows.some((r) => r.pruned));
      note.innerHTML = level >= res.length
        ? `找完了，一共扫描了 ${res.length} 遍数据。${pruned ? '注意那些“剪枝”的候选：只要它有一个子集不频繁，它本身一定不频繁，<b>连数都不用数</b>——这就是 Apriori 原理。' : ''}Apriori 的缺点：每一层都要扫一遍数据、候选集可能很多。`
        : `第 ${last.k} 层：先数每个候选出现在几单里，留下达到最小支持度的。下一层的候选只从这一层的频繁项集拼出来。`;
      rules();
    }

    function rules() {
      const res = levels();
      const list = [];
      res.forEach((L) => L.rows.filter((r) => r.ok && r.c.length >= 2).forEach((r) => {
        r.c.forEach((b) => {
          const A = r.c.filter((x) => x !== b);
          const conf = r.s / sup(A);
          const lift = conf / (sup([b]) / tx.length);
          list.push({ A, b, sup: r.s / tx.length, conf, lift });
        });
      }));
      rulesBox.innerHTML = list.length
        ? `<table class="lab-table"><thead><tr><th>规则</th><th>支持度</th><th>置信度</th><th>提升度</th></tr></thead><tbody>${
          list.sort((a, b) => b.conf - a.conf).map((r) => `<tr class="${r.conf >= minConf.value ? 'on' : 'off'}"><td>${r.A.join(' + ')} → ${r.b}</td><td>${K.pct(r.sup)}</td><td>${K.pct(r.conf)}</td><td class="${r.lift > 1 ? 'good' : r.lift < 1 ? 'bad' : ''}">${r.lift.toFixed(2)}</td></tr>`).join('')
        }</tbody></table>`
        : '<p class="muted small">当前支持度下没有两件以上的频繁项集。</p>';
    }
    draw();
  },
});
