// CatBoost：类别特征的“有序目标统计”——每一行只用排在它前面的行来编码，自己的标签不参与，避免目标泄露。
Labs.register('catboost', {
  render(host, K) {
    const root = K.panel(host);
    K.note(root, '示例数据：8 个用户的“城市”（类别特征）和“是否下单”（标签）。要把城市变成数字才能喂给树。', '');
    const rows = [
      ['北京', 1], ['上海', 0], ['北京', 1], ['杭州', 1], ['上海', 1], ['北京', 0], ['杭州', 0], ['上海', 0],
    ].map(([city, y], i) => ({ id: i + 1, city, y }));
    let perm = rows.map((_, i) => i);
    let sel = 4;
    let seed = 1;
    const ctl = K.row(root);
    const prior = K.slider(ctl, { label: '先验 prior', min: 0, max: 1, step: 0.05, value: 0.05, fmt: (v) => v.toFixed(2), onInput: () => draw() });
    K.button(ctl, '换一个随机排列', () => {
      const r = K.rng(++seed);
      for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
      draw();
    }, true);
    const table = K.h('<div></div>', root);
    K.caption(root, '点一行，看它的编码用到了哪些行。');
    const note = K.note(root, '');

    function draw() {
      const p = prior.value;
      const order = perm.map((i) => rows[i]);
      const enc = order.map((row, k) => {
        const before = order.slice(0, k).filter((o) => o.city === row.city);
        const cnt1 = before.filter((o) => o.y === 1).length;
        return { before, cnt1, total: before.length, val: (cnt1 + p) / (before.length + 1) };
      });
      const naive = (row) => {
        const same = rows.filter((o) => o.city === row.city);
        return same.filter((o) => o.y === 1).length / same.length;
      };
      const s = Math.min(sel, order.length - 1);
      const used = new Set(enc[s].before.map((o) => o.id));
      table.innerHTML = `<table class="lab-table"><thead><tr><th>顺序</th><th>用户</th><th>城市</th><th>是否下单</th><th>有序目标统计</th><th>直接用全体均值（会泄露）</th></tr></thead><tbody>${
        order.map((row, k) => `<tr data-k="${k}" class="${k === s ? 'on' : used.has(row.id) ? '' : k > s ? 'off' : ''}" style="cursor:pointer">
          <td>${k + 1}</td><td>#${row.id}</td><td>${row.city}</td><td>${row.y}</td>
          <td>(${enc[k].cnt1} + ${p.toFixed(2)}) / (${enc[k].total} + 1) = <b>${enc[k].val.toFixed(2)}</b></td>
          <td>${naive(row).toFixed(2)}</td></tr>`).join('')
      }</tbody></table>`;
      table.querySelectorAll('tr[data-k]').forEach((tr) => tr.addEventListener('click', () => { sel = Number(tr.dataset.k); draw(); }));
      const row = order[s];
      note.innerHTML = `第 ${s + 1} 行（${row.city}）的编码只看<b>排在它前面、同样是${row.city}的 ${enc[s].total} 行</b>，其中下单的 ${enc[s].cnt1} 行；它自己的标签不参与，后面的行（划掉的）也不参与。` +
        '<br>如果直接用“这个城市所有人的平均下单率”来编码，每一行的编码里都含着它自己的标签——模型训练时等于偷看了答案（<b>目标泄露</b>），线上效果会变差。CatBoost 用随机排列 + 只看前面的行来避免这一点；它的“有序提升”也用同样的思路解决梯度提升里的预测偏移。';
    }
    draw();
    K.h(`<ul class="point-list">
      <li><b>原生支持类别特征</b>：不用自己做 one-hot 或目标编码，用上面的有序目标统计自动转成数字。</li>
      <li><b>有序提升（ordered boosting）</b>：计算某个样本的残差时，只用没见过这个样本的模型，减少过拟合。</li>
      <li><b>对称树（oblivious tree）</b>：同一层的所有节点用同一个切分条件，树结构简单、预测快、不容易过拟合。</li>
      <li>默认参数下效果往往就不错，类别特征多的表格数据很合适。</li>
    </ul>`, root);
  },
});
