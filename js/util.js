// 通用小工具 + 玩法注册表（Modes）。每种玩法在 js/modes/ 下注册自己。
(function () {
  'use strict';

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  // 数据里可以用 **加粗** 标出关键数字
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function sourceList(list) {
    return (list || []).map((s) => {
      const meta = window.QuizBank && QuizBank.sources[s.file];
      const name = meta ? meta.short : s.file;
      const label = meta && meta.url
        ? `<a class="src-file" href="${esc(meta.url)}" target="_blank" rel="noopener noreferrer" title="${esc(meta.title)}">${esc(name)}</a>`
        : `<span class="src-file" title="${esc(meta ? meta.title : '')}">${esc(name)}</span>`;
      return `<li>${label}${s.section ? ' › ' + esc(s.section) : ''}</li>`;
    });
  }

  // 题目的出处；如果题目关联了讲解，再加一个“回看讲解”的按钮
  function sourceHTML(q) {
    const list = sourceList(q.source);
    const lesson = q.lesson && window.QuizBank && QuizBank.lesson(q.lesson);
    const back = lesson ? `<button type="button" class="link-btn" data-lesson-link="${esc(lesson.id)}">▶ 回看动画讲解：${esc(lesson.title)}</button>` : '';
    const src = list.length ? `<details class="source"><summary>出处</summary><ul>${list.join('')}</ul></details>` : '';
    return back + src;
  }

  const reducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  window.Util = { esc, fmt, shuffle, el, sourceHTML, sourceList, reducedMotion };
  window.Modes = {};
})();
