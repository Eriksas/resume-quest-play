// FP-Tree：第一遍数每个商品出现几次、按次数排序；第二遍把每张订单按这个顺序插进一棵前缀树。
Labs.register('fptree', {
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
    const minSup = 3;
    const cnt = {};
    tx.flat().forEach((i) => (cnt[i] = (cnt[i] || 0) + 1));
    const order = Object.keys(cnt).filter((i) => cnt[i] >= minSup).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b, 'zh'));
    const sorted = tx.map((t) => order.filter((i) => t.includes(i)));
    let inserted = 0;

    K.h(`<div class="lab-note"><b>第一遍扫描</b>：数每个商品出现在几单（最小支持度 ${minSup} 单）：${Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).map((i) => `${i} ${cnt[i]}${cnt[i] < minSup ? '（不够，丢掉）' : ''}`).join('，')}。<br>频繁的商品按次数从多到少排好：<b>${order.join(' → ')}</b>。</div>`, root);
    const btns = K.row(root);
    K.button(btns, '插入下一张订单', () => { inserted = Math.min(inserted + 1, tx.length); draw(); }, true);
    K.button(btns, '全部插入', () => { inserted = tx.length; draw(); });
    K.button(btns, '重来', () => { inserted = 0; draw(); });
    const list = K.h('<div></div>', root);
    const svgBox = K.h('<div class="lab-scroll"></div>', root);
    const note = K.note(root, '');

    function build(n) {
      const rootN = { item: null, count: 0, kids: [], id: 'root' };
      let uid = 0;
      sorted.slice(0, n).forEach((t) => {
        let cur = rootN;
        t.forEach((item) => {
          let kid = cur.kids.find((k) => k.item === item);
          if (!kid) { kid = { item, count: 0, kids: [], id: 'n' + uid++, parent: cur }; cur.kids.push(kid); }
          kid.count += 1;
          cur = kid;
        });
      });
      return rootN;
    }

    function draw() {
      list.innerHTML = `<table class="lab-table"><thead><tr><th>订单</th><th>原始</th><th>去掉不频繁的、按顺序排好</th></tr></thead><tbody>${
        tx.map((t, i) => `<tr class="${i < inserted ? 'on' : ''}"><td>#${i + 1}</td><td>${t.join('、')}</td><td>${sorted[i].join(' → ')}</td></tr>`).join('')
      }</tbody></table>`;
      const tree = build(inserted);
      // 布局
      const leaves = [];
      (function walk(n) { if (!n.kids.length) leaves.push(n); n.kids.forEach(walk); })(tree);
      const W = Math.max(520, leaves.length * 110 + 40);
      const depth = (function d(n) { return n.kids.length ? 1 + Math.max(...n.kids.map(d)) : 0; })(tree);
      const H = depth * 70 + 70;
      svgBox.innerHTML = '';
      const svg = K.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg', role: 'img', 'aria-label': 'FP 树' }, svgBox);
      const pos = new Map();
      let li = 0;
      (function place(n, d) {
        if (!n.kids.length) { pos.set(n, { x: 60 + li * 110, y: 30 + d * 70 }); li += 1; return; }
        n.kids.forEach((k) => place(k, d + 1));
        pos.set(n, { x: (pos.get(n.kids[0]).x + pos.get(n.kids[n.kids.length - 1]).x) / 2, y: 30 + d * 70 });
      })(tree, 0);
      const all = [];
      (function walk(n) { all.push(n); n.kids.forEach(walk); })(tree);
      // 同一商品的节点用虚线串起来（节点链）
      order.forEach((item, ci) => {
        const ns = all.filter((n) => n.item === item);
        for (let i = 1; i < ns.length; i++) {
          const a = pos.get(ns[i - 1]);
          const b = pos.get(ns[i]);
          K.path(svg, [[a.x, a.y], [(a.x + b.x) / 2, Math.max(a.y, b.y) + 30], [b.x, b.y]], { stroke: K.color(ci), 'stroke-dasharray': '3 4', 'stroke-opacity': 0.7 });
        }
      });
      all.forEach((n) => n.kids.forEach((k) => { const a = pos.get(n); const b = pos.get(k); K.line(svg, a.x, a.y, b.x, b.y, { class: 'soft', 'stroke-width': 1.5 }); }));
      all.forEach((n) => {
        const q = pos.get(n);
        if (n === tree) {
          K.s('circle', { cx: q.x, cy: q.y, r: 10, fill: 'var(--surface-2)', stroke: 'var(--border)' }, svg);
          K.text(svg, q.x, q.y + 4, '根', { 'text-anchor': 'middle', 'font-size': 11 });
          return;
        }
        const ci = order.indexOf(n.item);
        K.s('rect', { x: q.x - 40, y: q.y - 14, width: 80, height: 28, rx: 8, fill: K.color(ci), 'fill-opacity': 0.2, stroke: K.color(ci) }, svg);
        K.text(svg, q.x, q.y + 4, `${n.item} : ${n.count}`, { 'text-anchor': 'middle', class: 'strong', 'font-size': 12 });
      });
      note.innerHTML = inserted === 0
        ? '<b>第二遍扫描</b>：把每张订单（排好序的）从根往下插。前缀相同就沿着已有的路径走、计数 +1；不同就分叉出新节点。'
        : inserted < tx.length
          ? `插入了 ${inserted} 张订单。共同前缀被压缩到同一条路径上，所以树比原始数据小得多。彩色虚线把同一商品的所有节点串起来，方便之后查找。`
          : '建好了：<b>只扫描了两遍数据</b>，之后挖频繁项集都在这棵树上做——从某个商品出发，沿着它的节点往上收集路径（条件模式基），递归地找频繁组合，<b>不用像 Apriori 那样生成大量候选、反复扫描数据</b>，所以数据量大时快得多。';
    }
    draw();
  },
});
