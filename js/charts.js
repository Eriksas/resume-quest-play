// 项目数字图：把 data/charts_resume.js 里的图画出来（横条、折线、数字卡）。
// “遮住数字”打开时，所有数字（标题里 **…** 包起来的、条形末端的、图上标的）都会被盖住，点一下才露出来，用来自测。
(function () {
  'use strict';

  const esc = (s) => Util.esc(s);
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); });
    if (parent) parent.appendChild(e);
    return e;
  };
  // **数字** → 可以被遮住的数字
  const numfmt = (s) => esc(s || '').replace(/\*\*(.+?)\*\*/g, '<b class="num">$1</b>');
  // 小字说明里的数字也要能遮住
  const subfmt = (s) => esc(s || '').replace(/\d+(?:\.\d+)?%?/g, '<span class="num">$&</span>');
  const valText = (c, it) => it.text || (c.unit === '%' ? `${it.value}%` : `${it.value}`);
  const unitNote = (c) => (c.unit && c.unit !== '%' ? `单位：${c.unit.trim()}` : '');

  // ---------- 横条 ----------
  function bars(body, c, quiz) {
    const max = c.max || Math.max(...c.items.map((it) => it.value), c.ref ? c.ref.value : 0);
    const anyHl = c.items.some((it) => it.hl);
    const list = Util.el('<div class="pc-bars"></div>');
    if (unitNote(c)) list.appendChild(Util.el(`<p class="muted small">${esc(unitNote(c))}</p>`));
    const room = '(100% - 6.5em)';
    c.items.forEach((it, i) => {
      const color = it.hl || !anyHl ? 'var(--series-1)' : 'var(--deemph)';
      const row = Util.el(`<div class="pc-row ${it.hl ? 'hl' : ''}" tabindex="0">
        <div class="pc-label"><span>${esc(it.label)}</span>${it.sub ? `<span class="muted small">${subfmt(it.sub)}</span>` : ''}</div>
        <div class="pc-track"><span class="pc-fill"></span><b class="pc-val num">${esc(valText(c, it))}</b></div>
      </div>`);
      const fill = row.querySelector('.pc-fill');
      if (it.parts && it.parts.length) {
        // 分段：同一种颜色由深到浅，段与段之间留 2px 缝
        fill.classList.add('parts');
        fill.style.width = `calc(${room} * ${(it.value / max).toFixed(4)})`;
        const shades = it.hl || !anyHl ? ['var(--series-1)', 'var(--seq-1)'] : ['var(--deemph)', 'var(--deemph-2)'];
        it.parts.forEach((p, k) => {
          const seg = document.createElement('span');
          seg.style.flex = `${p.value} 1 0`;
          seg.style.background = shades[k % shades.length];
          fill.appendChild(seg);
        });
      } else {
        fill.style.width = `calc(${room} * ${(it.value / max).toFixed(4)})`;
        fill.style.background = color;
      }
      if (c.ref) {
        const ref = Util.el(`<span class="pc-ref" style="left:calc(${room} * ${(c.ref.value / max).toFixed(4)})"></span>`);
        if (i === 0) ref.appendChild(Util.el(`<span class="pc-ref-label">${numfmt(c.ref.text)}</span>`));
        row.querySelector('.pc-track').appendChild(ref);
      }
      StatsPage.tipOn(row, () => (quiz() ? null : {
        title: it.label,
        rows: [['合计', valText(c, it), color]].concat((it.parts || []).map((p) => [p.label, c.unit === '%' ? `${p.value}%` : `${p.value}`, null])).concat(it.sub && !it.parts ? [[it.sub, '', null]] : []),
      }));
      list.appendChild(row);
    });
    body.appendChild(list);
    if (c.ref) body.appendChild(Util.el(`<p class="muted small">竖线：${numfmt(c.ref.text)}</p>`));
    body.appendChild(table(['', '数值'].concat(c.items.some((it) => it.sub) ? ['说明'] : []), c.items.map((it) => [it.label, valText(c, it)].concat(c.items.some((x) => x.sub) ? [it.sub || ''] : []))));
  }

  // ---------- 折线 ----------
  function lines(body, c, quiz, card) {
    const W = StatsPage.chartWidth(card);
    const H = 240;
    const P = { l: 40, r: 16, t: 24, b: 44 };
    const xs = c.x;
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const sx = (v) => P.l + ((v - x0) / (x1 - x0)) * (W - P.l - P.r);
    const yMax = c.unit === '%' ? 100 : StatsPage.niceTicks(Math.max(...c.series.flatMap((s) => s.values))).pop();
    const yt = c.unit === '%' ? [0, 25, 50, 75, 100] : StatsPage.niceTicks(yMax);
    const sy = (v) => H - P.b - (v / yMax) * (H - P.t - P.b);
    const fmt = (v) => (c.unit === '%' ? `${v}%` : `${v}`);
    // 颜色按固定顺序：重点那条用 1 号色，其余依次 2 号色……；“随机”这类参考线用灰色虚线
    let slot = 0;
    const ser = c.series.map((s) => ({ ...s, color: s.base ? 'var(--deemph)' : `var(--series-${++slot})` }));
    body.appendChild(Util.el(`<div class="viz-legend">${ser.map((s) => `<span><i class="sw line ${s.base ? 'dash' : ''}" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`));
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'viz-svg', role: 'img', 'aria-label': c.title.replace(/\*\*/g, '') });
    yt.forEach((v) => {
      svgEl('line', { x1: P.l, x2: W - P.r, y1: sy(v), y2: sy(v), class: v ? 'grid' : 'base' }, svg);
      svgEl('text', { x: P.l - 6, y: sy(v) + 4, 'text-anchor': 'end', class: 'tick' }, svg).textContent = fmt(v);
    });
    xs.forEach((v) => {
      svgEl('text', { x: sx(v), y: H - P.b + 16, 'text-anchor': 'middle', class: 'tick' }, svg).textContent = c.xText ? c.xText(v) : v;
    });
    if (c.xTitle) svgEl('text', { x: P.l + (W - P.l - P.r) / 2, y: H - 6, 'text-anchor': 'middle', class: 'tick' }, svg).textContent = c.xTitle;
    if (c.yTitle) svgEl('text', { x: P.l, y: 12, class: 'tick' }, svg).textContent = c.yTitle;
    ser.slice().reverse().forEach((s) => {
      svgEl('path', { d: 'M' + xs.map((v, i) => `${sx(v).toFixed(1)},${sy(s.values[i]).toFixed(1)}`).join('L'), class: 'pc-line', stroke: s.color, 'stroke-dasharray': s.base ? '5 4' : null, 'stroke-width': s.hl ? 2.5 : 2 }, svg);
      if (!s.base) xs.forEach((v, i) => svgEl('circle', { cx: sx(v), cy: sy(s.values[i]), r: i === c.mark ? 5 : 3.5, fill: s.color, class: 'pc-dot' }, svg));
    });
    // 只在要记的那个位置标数字：重点那条标在点上方，其余标在下方
    if (c.mark != null) {
      const mx = sx(xs[c.mark]);
      ser.filter((s) => !s.base).forEach((s) => {
        // 重点那条标在点的左上方（线从左下方来，那里是空的），其余标在右下方
        const y = sy(s.values[c.mark]) + (s.hl ? -10 : 18);
        svgEl('text', { x: s.hl ? mx - 8 : mx + 8, y, 'text-anchor': s.hl ? 'end' : 'start', class: 'val num' }, svg).textContent = fmt(s.values[c.mark]);
      });
    }
    const cross = svgEl('line', { y1: P.t, y2: H - P.b, class: 'cross', visibility: 'hidden' }, svg);
    const hit = svgEl('rect', { x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b, class: 'hit', tabindex: 0 }, svg);
    StatsPage.tipOn(hit, (e) => {
      if (quiz()) return null;
      let i = c.mark != null ? c.mark : xs.length - 1;
      if (e) {
        const r = svg.getBoundingClientRect();
        const vx = ((e.clientX - r.left) / r.width) * W;
        i = xs.reduce((b, v, k) => (Math.abs(sx(v) - vx) < Math.abs(sx(xs[b]) - vx) ? k : b), 0);
      }
      cross.setAttribute('x1', sx(xs[i]));
      cross.setAttribute('x2', sx(xs[i]));
      cross.setAttribute('visibility', 'visible');
      return { title: `${c.xTitle ? c.xTitle.replace(/（.*）/, '') : ''} ${c.xText ? c.xText(xs[i]) : xs[i]}`, rows: ser.map((s) => [s.name, fmt(s.values[i]), s.color]) };
    });
    hit.addEventListener('pointerleave', () => cross.setAttribute('visibility', 'hidden'));
    hit.addEventListener('blur', () => cross.setAttribute('visibility', 'hidden'));
    body.appendChild(svg);
    body.appendChild(table([c.xTitle || ''].concat(ser.map((s) => s.name)), xs.map((v, i) => [c.xText ? c.xText(v) : v].concat(ser.map((s) => fmt(s.values[i]))))));
  }

  // ---------- 数字卡 ----------
  function tiles(body, c) {
    body.appendChild(Util.el(`<div class="pc-tiles">${c.items.map((it) => `<div class="pc-tile"><b class="num">${esc(it.value)}</b><span>${esc(it.label)}</span>${it.sub ? `<span class="muted small">${subfmt(it.sub)}</span>` : ''}</div>`).join('')}</div>`));
  }

  function table(head, rows) {
    return Util.el(`<details class="viz-table"><summary>看数据表</summary><div class="lab-scroll"><table class="lab-table">
      <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div></details>`);
  }

  // 画一个关卡的所有数字图。root 上有 .quiz 时数字被遮住
  function render(host, list, root) {
    const quiz = () => root.classList.contains('quiz');
    list.forEach((c) => {
      const card = Util.el(`<section class="card pc-card" id="chart-${esc(c.id)}">
        <h2 class="pc-title">${numfmt(c.title)}</h2>
        ${c.say ? `<p class="pc-say">${numfmt(c.say)}</p>` : ''}
        <div class="pc-body"></div>
        ${c.note ? `<p class="muted small">${numfmt(c.note)}</p>` : ''}
        ${c.source && c.source.length ? `<details class="source"><summary>出处</summary><ul>${Util.sourceList(c.source).join('')}</ul></details>` : ''}
      </section>`);
      host.appendChild(card);
      const body = card.querySelector('.pc-body');
      if (c.type === 'bars') bars(body, c, quiz);
      else if (c.type === 'lines') lines(body, c, quiz, card);
      else tiles(body, c);
    });
    // 遮住时：点一下数字露出来，再点一下盖回去
    root.addEventListener('click', (e) => {
      if (!quiz()) return;
      const n = e.target.closest('.num');
      if (n) n.classList.toggle('shown');
    });
  }

  window.ProjectCharts = { render };
})();
