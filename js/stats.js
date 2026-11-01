// 学习数据页：把答题记录画成几张图——掌握进度、最近 14 天、已掌握题数的变化、各关表现、错得最多的知识点。
// 由 app.js 调用 StatsPage.render(app, ctx)，ctx 里是 app.js 的几个函数（跳转、开始练习等）。
(function () {
  'use strict';

  const esc = (s) => Util.esc(s);
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (parent) parent.appendChild(e);
    return e;
  };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const md = (day) => { const [, m, d] = day.split('-'); return `${Number(m)}/${Number(d)}`; };
  const plain = (s) => String(s || '').replace(/\*\*/g, '');
  const cut = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

  // 掌握阶段：按 Leitner 盒子分。顺序 = 进度从高到低，图例和条形都按这个顺序
  const STAGES = [
    { key: 3, label: '已掌握', note: '3 号盒及以上', color: 'var(--seq-3)', ink: 'var(--seq-ink-3)' },
    { key: 2, label: '在巩固', note: '2 号盒', color: 'var(--seq-2)', ink: 'var(--seq-ink-2)' },
    { key: 1, label: '要重练', note: '1 号盒：答错过或刚见过', color: 'var(--seq-1)', ink: 'var(--seq-ink-1)' },
    { key: 0, label: '没做过', note: '', color: 'var(--seq-0)', ink: 'var(--text)' },
  ];
  const stageOf = (c) => (!c ? 0 : c.box >= Store.MASTERED_BOX ? 3 : c.box === 2 ? 2 : 1);

  // ---------- 提示框：所有带 _tip 的元素共用一个 ----------
  let tip = null;
  function tipBox() {
    if (!tip || !tip.isConnected) {
      tip = document.createElement('div');
      tip.className = 'viz-tip';
      tip.setAttribute('role', 'tooltip');
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(data, x, y) {
    const t = tipBox();
    t.textContent = '';
    const h = document.createElement('div');
    h.className = 'viz-tip-title';
    h.textContent = data.title;
    t.appendChild(h);
    (data.rows || []).forEach(([label, value, color]) => {
      const r = document.createElement('div');
      r.className = 'viz-tip-row';
      const k = document.createElement('i');
      if (color) k.style.background = color;
      else k.className = 'none';
      const v = document.createElement('b');
      v.textContent = value;
      const l = document.createElement('span');
      l.textContent = label;
      r.append(k, v, l);
      t.appendChild(r);
    });
    t.hidden = false;
    const w = t.offsetWidth;
    const hgt = t.offsetHeight;
    let left = x + 14;
    if (left + w > innerWidth - 8) left = x - w - 14;
    left = Math.max(8, left);
    let top = y - hgt - 12;
    if (top < 8) top = y + 18;
    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
  }
  const hideTip = () => { if (tip) tip.hidden = true; };
  function wireTips(root) {
    const dataOf = (el, e) => (typeof el._tip === 'function' ? el._tip(e) : el._tip);
    root.addEventListener('pointermove', (e) => {
      const el = e.target.closest('[data-tip]');
      const d = el && dataOf(el, e);
      if (d) showTip(d, e.clientX, e.clientY);
      else hideTip();
    });
    root.addEventListener('pointerleave', hideTip);
    root.addEventListener('focusin', (e) => {
      const el = e.target.closest('[data-tip]');
      const d = el && dataOf(el, null);
      if (!d) return hideTip();
      const r = el.getBoundingClientRect();
      showTip(d, r.left + r.width / 2, r.top);
    });
    root.addEventListener('focusout', hideTip);
    addEventListener('scroll', hideTip, { passive: true });
  }
  function tipOn(el, data) {
    el.dataset.tip = '1';
    el._tip = data;
    return el;
  }

  // ---------- 数据 ----------
  function collect() {
    const cards = Store.cards();
    const parts = QuizBank.parts();
    const allQs = QuizBank.chapters.flatMap((c) => c.questions);
    let seen = 0;
    let right = 0;
    Object.values(cards).forEach((c) => { seen += c.seen || 0; right += c.right || 0; });
    const lessons = QuizBank.chapters.flatMap((c) => c.lessons || []);
    return { cards, parts, allQs, seen, right, lessons, mastered: allQs.filter((q) => stageOf(cards[q.id]) === 3).length };
  }

  // ---------- ① 掌握进度：每篇一根堆叠条 ----------
  function masteryBlock(host, D) {
    const rows = D.parts.map((p) => ({ label: p.title, qs: p.chapters.flatMap((c) => c.questions) }));
    rows.push({ label: '全部', qs: D.allQs, total: true });
    rows.forEach((r) => {
      r.n = [0, 0, 0, 0];
      r.qs.forEach((q) => { r.n[stageOf(D.cards[q.id])] += 1; });
    });
    const sec = Util.el(`<section class="card viz-card">
      <h2 class="viz-title">掌握进度</h2>
      <p class="muted small">按复习盒子分：答对一次升一盒，升到 3 号盒算“已掌握”；答错回到 1 号盒。</p>
      <div class="viz-legend">${STAGES.map((s) => `<span><i class="sw ${s.key === 0 ? 'none' : ''}" style="background:${s.color}"></i>${s.label}</span>`).join('')}</div>
      <div class="stack-rows"></div>
    </section>`);
    host.appendChild(sec);
    const wrap = sec.querySelector('.stack-rows');
    rows.forEach((r) => {
      const total = r.qs.length;
      const row = Util.el(`<div class="stack-row ${r.total ? 'is-total' : ''}">
        <div class="stack-head"><span class="stack-label">${esc(r.label)}</span><span class="muted small">已掌握 <b class="ink">${r.n[3]}</b> / ${total} · ${pct(r.n[3], total)}%</span></div>
        <div class="stack-bar" role="img" aria-label="${esc(r.label)}：${STAGES.map((s) => `${s.label} ${r.n[s.key]} 题`).join('，')}"></div>
      </div>`);
      const bar = row.querySelector('.stack-bar');
      STAGES.forEach((s) => {
        const n = r.n[s.key];
        if (!n) return;
        const seg = document.createElement('div');
        seg.className = `seg ${s.key === 0 ? 'none' : ''}`;
        seg.style.flexGrow = n;
        seg.style.background = s.color;
        seg.style.color = s.ink;
        seg.tabIndex = 0;
        const lab = document.createElement('span');
        lab.textContent = n;
        seg.appendChild(lab);
        tipOn(seg, { title: `${r.label} · ${s.label}`, rows: [[`题（占 ${pct(n, total)}%）`, n, s.color]].concat(s.note ? [[s.note, '', null]] : []) });
        bar.appendChild(seg);
      });
      wrap.appendChild(row);
    });
    // 放不下的数字不硬塞：量一下，放不下就只留给提示框和数据表
    requestAnimationFrame(() => sec.querySelectorAll('.seg span').forEach((sp) => {
      if (sp.offsetWidth + 10 > sp.parentElement.clientWidth) sp.textContent = '';
    }));
    sec.appendChild(tableView(['', ...STAGES.map((s) => s.label), '合计'], rows.map((r) => [r.label, ...STAGES.map((s) => r.n[s.key]), r.qs.length])));
  }

  // ---------- ② 最近 14 天：每天答了几题（答对 / 答错堆叠） ----------
  function recentBlock(host, D) {
    const days = Store.days();
    const t = Store.today();
    const list = [];
    for (let i = 13; i >= 0; i--) {
      const day = Store.addDays(t, -i);
      const d = days[day] || { n: 0, ok: 0 };
      list.push({ day, n: d.n || 0, ok: d.ok || 0, bad: (d.n || 0) - (d.ok || 0) });
    }
    const total = list.reduce((s, d) => s + d.n, 0);
    const ok = list.reduce((s, d) => s + d.ok, 0);
    const active = list.filter((d) => d.n).length;
    const sec = Util.el(`<section class="card viz-card">
      <h2 class="viz-title">最近 14 天</h2>
      <p class="muted small">${total ? `共答 ${total} 题，答对 ${pct(ok, total)}%，有 ${active} 天在练。` : '最近 14 天还没有答题记录。'}</p>
      <div class="viz-legend"><span><i class="sw" style="background:var(--series-1)"></i>答对</span><span><i class="sw" style="background:var(--series-2)"></i>答错</span></div>
    </section>`);
    host.appendChild(sec);
    const W = chartWidth(sec);
    const H = 220;
    const P = { l: 34, r: 10, t: 18, b: 26 };
    const max = Math.max(...list.map((d) => d.n));
    const ticks = niceTicks(max || 10);
    const yMax = ticks[ticks.length - 1];
    const band = (W - P.l - P.r) / list.length;
    const bw = Math.min(24, band * 0.62);
    const sy = (v) => H - P.b - (v / yMax) * (H - P.t - P.b);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'viz-svg', role: 'img', 'aria-label': `最近 14 天每天的答题数：共 ${total} 题` });
    ticks.forEach((v) => {
      svgEl('line', { x1: P.l, x2: W - P.r, y1: sy(v), y2: sy(v), class: v ? 'grid' : 'base' }, svg);
      const tx = svgEl('text', { x: P.l - 6, y: sy(v) + 4, 'text-anchor': 'end', class: 'tick' }, svg);
      tx.textContent = v;
    });
    list.forEach((d, i) => {
      const cx = P.l + band * i + band / 2;
      const x = cx - bw / 2;
      // 先画答对（贴着基线），再画答错；两段之间留 2px 表面色的缝；只有最上面那段是圆角
      const segs = [[d.ok, 'var(--series-1)'], [d.bad, 'var(--series-2)']].filter((s) => s[0] > 0);
      let base = 0;
      segs.forEach(([v, color], k) => {
        const y0 = sy(base);
        const y1 = sy(base + v) + (k > 0 ? 0 : 0);
        const top = k === segs.length - 1;
        const gap = k > 0 ? 2 : 0;
        svgEl('path', { d: barPath(x, y1, bw, Math.max(1, y0 - y1 - gap), top ? 4 : 0), fill: color }, svg);
        base += v;
      });
      if (i % 2 === (list.length - 1) % 2) {
        const lx = svgEl('text', { x: cx, y: H - 8, 'text-anchor': 'middle', class: 'tick' }, svg);
        lx.textContent = i === list.length - 1 ? '今天' : md(d.day);
      }
      if (i === list.length - 1 && d.n) {
        const lv = svgEl('text', { x: cx, y: sy(d.n) - 6, 'text-anchor': 'middle', class: 'val' }, svg);
        lv.textContent = d.n;
      }
      const hit = svgEl('rect', { x: P.l + band * i, y: P.t, width: band, height: H - P.t - P.b, class: 'hit', tabindex: 0 }, svg);
      tipOn(hit, { title: i === list.length - 1 ? `今天（${md(d.day)}）` : md(d.day), rows: d.n ? [['答对', d.ok, 'var(--series-1)'], ['答错', d.bad, 'var(--series-2)'], ['正确率', `${pct(d.ok, d.n)}%`, null]] : [['这天没有答题', '', null]] });
    });
    sec.appendChild(svg);
    sec.appendChild(tableView(['日期', '答题', '答对', '答错', '正确率'], list.map((d) => [md(d.day), d.n, d.ok, d.bad, d.n ? `${pct(d.ok, d.n)}%` : '—'])));
  }

  // ---------- ③ 已掌握题数的变化（最近 30 天） ----------
  function trendBlock(host, D) {
    const days = Store.days();
    const keys = Object.keys(days).sort();
    const t = Store.today();
    const pts = [];
    for (let i = 29; i >= 0; i--) {
      const day = Store.addDays(t, -i);
      // 当天没练就沿用之前最近一天的掌握数（掌握数只会在答题时变化）
      let k = keys.filter((x) => x <= day).pop();
      pts.push({ day, m: k ? days[k].m : null, n: days[day] ? days[day].n : 0 });
    }
    const known = pts.filter((p) => p.m != null);
    const sec = Util.el(`<section class="card viz-card">
      <h2 class="viz-title">已掌握题数的变化</h2>
      <p class="muted small">${known.length ? `最近 30 天：${known[0].m} → ${known[known.length - 1].m} 题（共 ${D.allQs.length} 题）。` : '还没有记录。'}${keys.length < 2 ? '每天的记录从这次更新开始，多练几天就能看到曲线。' : ''}</p>
    </section>`);
    host.appendChild(sec);
    if (!known.length) return;
    const W = chartWidth(sec);
    const H = 200;
    const P = { l: 34, r: 40, t: 16, b: 26 };
    const ticks = niceTicks(Math.max(10, ...known.map((p) => p.m)));
    const yMax = ticks[ticks.length - 1];
    const sx = (i) => P.l + (i / (pts.length - 1)) * (W - P.l - P.r);
    const sy = (v) => H - P.b - (v / yMax) * (H - P.t - P.b);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'viz-svg', role: 'img', 'aria-label': `已掌握题数：现在 ${known[known.length - 1].m} 题` });
    ticks.forEach((v) => {
      svgEl('line', { x1: P.l, x2: W - P.r, y1: sy(v), y2: sy(v), class: v ? 'grid' : 'base' }, svg);
      const tx = svgEl('text', { x: P.l - 6, y: sy(v) + 4, 'text-anchor': 'end', class: 'tick' }, svg);
      tx.textContent = v;
    });
    (W < 420 ? [0, 10, 20, 29] : [0, 7, 14, 21, 29]).forEach((i) => {
      const lx = svgEl('text', { x: sx(i), y: H - 8, 'text-anchor': i === 0 ? 'start' : i === 29 ? 'end' : 'middle', class: 'tick' }, svg);
      lx.textContent = i === 29 ? '今天' : md(pts[i].day);
    });
    const idx = pts.map((p, i) => [p, i]).filter(([p]) => p.m != null);
    const line = idx.map(([p, i]) => `${sx(i).toFixed(1)},${sy(p.m).toFixed(1)}`);
    if (idx.length > 1) {
      const first = idx[0][1];
      const last = idx[idx.length - 1][1];
      svgEl('path', { d: `M${sx(first)},${sy(0)}L${line.join('L')}L${sx(last)},${sy(0)}Z`, class: 'area' }, svg);
      svgEl('path', { d: `M${line.join('L')}`, class: 'line' }, svg);
    }
    const [lp, li] = idx[idx.length - 1];
    svgEl('circle', { cx: sx(li), cy: sy(lp.m), r: 4, class: 'dot' }, svg);
    const lv = svgEl('text', { x: sx(li) + 8, y: sy(lp.m) + 4, class: 'val' }, svg);
    lv.textContent = lp.m;
    // 十字线：指到哪一天就显示那一天
    const cross = svgEl('line', { y1: P.t, y2: H - P.b, class: 'cross', visibility: 'hidden' }, svg);
    const hit = svgEl('rect', { x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b, class: 'hit', tabindex: 0 }, svg);
    tipOn(hit, (e) => {
      let i = pts.length - 1;
      if (e) {
        const r = svg.getBoundingClientRect();
        const vx = ((e.clientX - r.left) / r.width) * W;
        i = Math.max(0, Math.min(pts.length - 1, Math.round(((vx - P.l) / (W - P.l - P.r)) * (pts.length - 1))));
      }
      const p = pts[i];
      cross.setAttribute('x1', sx(i));
      cross.setAttribute('x2', sx(i));
      cross.setAttribute('visibility', 'visible');
      return { title: i === pts.length - 1 ? '今天' : md(p.day), rows: p.m == null ? [['还没有记录', '', null]] : [['已掌握', `${p.m} 题`, 'var(--series-1)'], ['当天答题', `${p.n} 题`, null]] };
    });
    hit.addEventListener('pointerleave', () => cross.setAttribute('visibility', 'hidden'));
    hit.addEventListener('blur', () => cross.setAttribute('visibility', 'hidden'));
    sec.appendChild(svg);
    sec.appendChild(tableView(['日期', '已掌握', '当天答题'], pts.filter((p) => p.m != null).map((p) => [md(p.day), p.m, p.n])));
  }

  // ---------- ④ 各关表现：每关的掌握比例 + 最好正确率 ----------
  function chapterBlock(host, D, ctx) {
    const sec = Util.el(`<section class="card viz-card">
      <h2 class="viz-title">各关表现</h2>
      <p class="muted small">条形是这一关已掌握的比例；右边是闯关的最好正确率（≥ 70% 通关）。点一行进入这一关。</p>
      <div class="ch-list"></div>
    </section>`);
    host.appendChild(sec);
    const list = sec.querySelector('.ch-list');
    D.parts.forEach((p) => {
      list.appendChild(Util.el(`<div class="ch-part muted small">${esc(p.title)}</div>`));
      p.chapters.forEach((c) => {
        const total = c.questions.length;
        const m = c.questions.filter((q) => stageOf(D.cards[q.id]) === 3).length;
        const tried = c.questions.filter((q) => D.cards[q.id]).length;
        const rec = Store.chapterRecord(c.id);
        const row = Util.el(`<button type="button" class="ch-row" data-ch="${esc(c.id)}">
          <span class="ch-name">${esc(c.title)}</span>
          <span class="ch-track"><span class="ch-fill" style="width:${pct(m, total)}%"></span></span>
          <span class="ch-val">${m}/${total}</span>
          <span class="ch-best ${rec.runs ? '' : 'muted'}">${rec.runs ? `${Math.round(rec.best * 100)}%` : '—'}</span>
        </button>`);
        tipOn(row, { title: c.title, rows: [['已掌握', `${m} / ${total} 题`, 'var(--series-1)'], ['做过', `${tried} 题`, null], ['最好正确率', rec.runs ? `${Math.round(rec.best * 100)}%（闯关 ${rec.runs} 次）` : '还没闯过', null]] });
        list.appendChild(row);
      });
    });
    list.addEventListener('click', (e) => {
      const r = e.target.closest('[data-ch]');
      if (r) ctx.renderLevel(r.dataset.ch);
    });
  }

  // ---------- ⑤ 错得最多的知识点 + 错题 ----------
  function weakBlock(host, D, ctx) {
    const wrongQs = D.allQs.filter((q) => (D.cards[q.id] && D.cards[q.id].wrong) > 0);
    const sec = Util.el(`<section class="card viz-card">
      <h2 class="viz-title">错得最多的知识点</h2>
      <p class="muted small">${wrongQs.length ? '按答错次数加起来排：机器学习和统计按讲解分，简历篇按关卡分。点一行去看讲解或进关卡。' : '还没有答错过的题。答错的题会出现在这里。'}</p>
    </section>`);
    host.appendChild(sec);
    if (!wrongQs.length) return;
    const groups = new Map();
    wrongQs.forEach((q) => {
      const ch = QuizBank.chapter(q.chapterId);
      const l = q.lesson ? QuizBank.lesson(q.lesson) : null;
      const key = l ? `l:${l.id}` : `c:${ch.id}`;
      if (!groups.has(key)) groups.set(key, { key, label: l ? l.title : ch.title, sub: l ? ch.title : ch.part.title, lesson: l && l.id, chapter: ch.id, wrong: 0, qs: 0 });
      const g = groups.get(key);
      g.wrong += D.cards[q.id].wrong;
      g.qs += 1;
    });
    const top = [...groups.values()].sort((a, b) => b.wrong - a.wrong || b.qs - a.qs).slice(0, 8);
    const max = top[0].wrong;
    const list = Util.el('<div class="weak-list"></div>');
    top.forEach((g) => {
      const row = Util.el(`<button type="button" class="weak-row" data-key="${esc(g.key)}">
        <span class="weak-name"><b>${esc(g.label)}</b><span class="muted small">${esc(g.sub)} · ${g.qs} 道题错过</span></span>
        <span class="weak-track"><span class="weak-fill" style="width:calc((100% - 5em) * ${Math.max(0.03, g.wrong / max).toFixed(3)})"></span><span class="weak-val">错 ${g.wrong} 次</span></span>
      </button>`);
      tipOn(row, { title: g.label, rows: [['答错次数', g.wrong, 'var(--series-1)'], ['错过的题', `${g.qs} 道`, null]] });
      list.appendChild(row);
    });
    list.addEventListener('click', (e) => {
      const r = e.target.closest('[data-key]');
      if (!r) return;
      const g = top.find((x) => x.key === r.dataset.key);
      if (g.lesson) ctx.renderLesson(g.lesson, 'dir');
      else ctx.renderLevel(g.chapter);
    });
    sec.appendChild(list);

    // 错得最多的几道题，可以直接练一遍
    const worst = wrongQs
      .filter(ctx.playable)
      .sort((a, b) => D.cards[b.id].wrong - D.cards[a.id].wrong || D.cards[a.id].box - D.cards[b.id].box)
      .slice(0, 8);
    const sec2 = Util.el(`<section class="card viz-card">
      <h2 class="viz-title">错得最多的题</h2>
      <ol class="worst-list">${worst.map((q) => {
        const c = D.cards[q.id];
        const ch = QuizBank.chapter(q.chapterId);
        return `<li><span>${esc(cut(plain(q.prompt), 60))}</span><span class="muted small">${esc(ch.title)} · 错 ${c.wrong} 次 · 对 ${c.right} 次 · 现在在 ${c.box} 号盒</span></li>`;
      }).join('')}</ol>
      <button type="button" class="btn primary block" data-act="drill">把这 ${worst.length} 道题练一遍</button>
    </section>`);
    host.appendChild(sec2);
    sec2.querySelector('[data-act="drill"]').addEventListener('click', () => ctx.startSession({ kind: 'free', title: '错题重练', questions: worst }));
  }

  // ---------- 小工具 ----------
  // 图按卡片的实际宽度画（1 个单位 = 1 像素），手机上字也不会被缩小
  const chartWidth = (sec) => Math.max(280, Math.min(760, Math.round(sec.clientWidth - 32)));
  function niceTicks(max) {
    const raw = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
    const nice = Math.max(1, Math.round(step));
    const out = [];
    for (let v = 0; v <= max + nice - 1e-9; v += nice) out.push(v);
    if (out[out.length - 1] < max) out.push(out[out.length - 1] + nice);
    return out;
  }
  // 柱子：顶上 4px 圆角，底部方的
  function barPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h);
    if (!rr) return `M${x},${y}h${w}v${h}h${-w}Z`;
    return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
  }
  function tableView(head, rows) {
    return Util.el(`<details class="viz-table"><summary>看数据表</summary><div class="lab-scroll"><table class="lab-table">
      <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div></details>`);
  }

  function render(app, ctx0) {
    // 离开这一页前先收起提示框
    const ctx = {};
    Object.entries(ctx0).forEach(([k, fn]) => { ctx[k] = k === 'playable' ? fn : (...a) => { hideTip(); return fn(...a); }; });
    const D = collect();
    const lv = Store.level();
    const lessonsSeen = D.lessons.filter((l) => Store.lessonSeen(l.id)).length;
    app.innerHTML = `
      <div class="screen wide stats-page">
        <header class="topbar">
          <button type="button" class="btn ghost back" data-act="home">← 地图</button>
          <span class="muted small">Lv.${lv.lv} ${esc(lv.title)} · ${lv.xp} XP</span>
        </header>
        <h1 class="stats-h1">学习数据</h1>
        <section class="kpis">
          <div class="kpi hero"><span class="kpi-label">已掌握</span><span class="kpi-value">${D.mastered}<small> / ${D.allQs.length} 题</small></span><span class="kpi-sub">${pct(D.mastered, D.allQs.length)}%</span></div>
          <div class="kpi"><span class="kpi-label">累计作答</span><span class="kpi-value">${D.seen}<small> 次</small></span><span class="kpi-sub">答对 ${pct(D.right, D.seen)}%</span></div>
          <div class="kpi"><span class="kpi-label">连续打卡</span><span class="kpi-value">${Store.streak()}<small> 天</small></span><span class="kpi-sub">做完“今日 10 分钟”算一天</span></div>
          <div class="kpi"><span class="kpi-label">讲解看过</span><span class="kpi-value">${lessonsSeen}<small> / ${D.lessons.length} 节</small></span><span class="kpi-sub">机器学习 + 统计</span></div>
        </section>
        <div class="stats-body"></div>
      </div>`;
    const body = app.querySelector('.stats-body');
    masteryBlock(body, D);
    recentBlock(body, D);
    trendBlock(body, D);
    chapterBlock(body, D, ctx);
    weakBlock(body, D, ctx);
    const screen = app.querySelector('.screen');
    wireTips(screen);
    screen.querySelector('[data-act="home"]').addEventListener('click', () => ctx.renderHome());
    window.scrollTo(0, 0);
    // 转屏或改窗口大小：宽度变化明显就按新宽度重画
    lastW = innerWidth;
    lastArgs = [app, ctx0];
  }

  let lastW = 0;
  let lastArgs = null;
  let resizeT = null;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      if (!lastArgs || !lastArgs[0].querySelector('.stats-page') || Math.abs(innerWidth - lastW) < 40) return;
      const y = scrollY;
      render(...lastArgs);
      window.scrollTo(0, y);
    }, 200);
  });

  // 项目数字图（js/charts.js）也用这套提示框和取宽度的办法
  window.StatsPage = { render, hideTip, wireTips, tipOn, chartWidth, niceTicks };
})();
