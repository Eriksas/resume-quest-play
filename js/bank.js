// 题库：加载 data/ 里的数据文件，检查格式，按“篇 → 关卡”整理好。
(function () {
  'use strict';

  const chapters = [];
  const sources = {};
  const errors = [];
  const seenIds = new Set();
  const lessonIds = new Set();
  // 正在加载的数据文件：[{ f: 文件名, src: 路径 }]
  let loading = [];
  // 当前正在执行的是哪个数据文件（并行下载、按顺序执行，所以用 currentScript 判断）
  const currentFile = () => (document.currentScript && document.currentScript.dataset.file) || '';

  function addSources(map) {
    Object.assign(sources, map || {});
  }

  // 讲解的播放步骤可以单独放一个文件：QuizBank.addTours({ 讲解id: [步骤…] })，加载完再挂到讲解上
  const tours = {};
  function addTours(map) {
    Object.assign(tours, map || {});
  }

  // 项目数字图：QuizBank.addCharts([{ id, chapter, type, title, items… }])，格式见 data/charts_resume.js
  const rawCharts = [];
  const charts = [];
  function addCharts(list) {
    (list || []).forEach((c) => rawCharts.push(c));
  }
  function checkChart(c) {
    if (!c || !c.id) return '缺少 id';
    if (!c.title) return '缺少 title';
    if (!chapters.some((ch) => ch.id === c.chapter)) return `关卡 “${c.chapter}” 不存在`;
    const items = Array.isArray(c.items) ? c.items : [];
    if (c.type === 'bars') {
      if (!items.length || items.some((it) => !it || !it.label || typeof it.value !== 'number')) return 'bars 的每一项都要有 label 和数字 value';
    } else if (c.type === 'tiles') {
      if (!items.length || items.some((it) => !it || it.value == null || !it.label)) return 'tiles 的每一项都要有 value 和 label';
    } else if (c.type === 'lines') {
      if (!Array.isArray(c.x) || !Array.isArray(c.series) || !c.series.length) return 'lines 需要 x 和 series';
      if (c.series.some((se) => !se.name || !Array.isArray(se.values) || se.values.length !== c.x.length)) return 'lines 的每条线都要有 name，values 和 x 一样长';
    } else return `不认识的 type “${c.type}”`;
    return '';
  }

  function checkQuestion(q) {
    if (!q || typeof q !== 'object') return '不是一个对象';
    if (!q.id) return '缺少 id';
    if (seenIds.has(q.id)) return `题目 id “${q.id}” 重复了`;
    if (!q.prompt) return '缺少 prompt（题干）';
    switch (q.type) {
      case 'sort':
        if (!Array.isArray(q.items) || q.items.length < 2) return 'sort 题需要至少 2 个 items';
        break;
      case 'choice': {
        if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) return 'choice 题需要 2–4 个 options';
        const right = q.options.filter((o) => o && o.correct).length;
        if (right !== 1) return `choice 题必须正好 1 个 correct: true（现在 ${right} 个）`;
        if (q.options.some((o) => !o.text)) return '有选项缺少 text';
        break;
      }
      case 'match':
        if (!Array.isArray(q.pairs) || q.pairs.length < 2) return 'match 题需要至少 2 组 pairs';
        break;
      case 'recite':
        if (!Array.isArray(q.points) || q.points.length < 1) return 'recite 题需要 points';
        break;
      default:
        return `不认识的题型 “${q.type}”`;
    }
    return '';
  }

  // 讲解的播放步骤：每步至少有一句 say，其余字段见 js/tour.js
  const TOUR_KEYS = ['say', 'set', 'click', 'check', 'look', 'ms', 'wait'];
  function checkTour(l) {
    if (l.tour == null) return '';
    if (!l.lab) return '没有 lab，不能播放';
    if (!Array.isArray(l.tour) || !l.tour.length) return 'tour 要写成非空数组';
    for (let i = 0; i < l.tour.length; i++) {
      const st = l.tour[i];
      if (!st || typeof st !== 'object') return `第 ${i + 1} 步不是对象`;
      if (!st.say) return `第 ${i + 1} 步缺少 say`;
      const bad = Object.keys(st).filter((k) => !TOUR_KEYS.includes(k));
      if (bad.length) return `第 ${i + 1} 步有不认识的字段 ${bad.join('、')}`;
    }
    return '';
  }

  function register(ch) {
    const where = currentFile() || '数据文件';
    if (!ch || !ch.id) return errors.push(`${where}：章节缺少 id`);
    if (chapters.some((c) => c.id === ch.id)) return errors.push(`${where}：章节 id “${ch.id}” 重复了`);
    if (!ch.part || !ch.part.id) return errors.push(`${where}：章节 “${ch.id}” 缺少 part`);
    const lessons = [];
    (ch.lessons || []).forEach((l, i) => {
      if (!l || !l.id || !l.title) return errors.push(`${where} 第 ${i + 1} 个讲解：缺少 id 或 title`);
      if (lessonIds.has(l.id)) return errors.push(`${where}：讲解 id “${l.id}” 重复了`);
      lessonIds.add(l.id);
      const lesson = Object.assign({}, l, { chapterId: ch.id });
      const te = checkTour(l);
      if (te) {
        errors.push(`${where} 讲解 ${l.id} 的播放步骤：${te}（这一节先不显示播放按钮）`);
        delete lesson.tour;
      }
      lessons.push(lesson);
    });
    const valid = [];
    (ch.questions || []).forEach((q, i) => {
      const e = checkQuestion(q);
      if (e) errors.push(`${where} 第 ${i + 1} 题：${e}`);
      else {
        seenIds.add(q.id);
        valid.push(Object.assign({}, q, { chapterId: ch.id }));
      }
    });
    chapters.push(Object.assign({}, ch, { questions: valid, lessons, order: ch.order || 0 }));
  }

  function loadScript(src, file) {
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false; // 并行下载，但按插入顺序执行（出处表要先于章节）
      s.dataset.file = file || '';
      s.onload = () => resolve(true);
      s.onerror = () => {
        errors.push(`没能加载 ${src}（文件名写错了，或者文件不在 data/ 里）`);
        resolve(false);
      };
      document.head.appendChild(s);
    });
  }

  // 数据文件里有语法错误时，浏览器只会报到 window.onerror，这里接住它
  window.addEventListener('error', (e) => {
    const hit = e.filename && loading.find((x) => e.filename.indexOf(x.src) !== -1);
    if (hit) errors.push(`${hit.f} 第 ${e.lineno} 行有语法错误：${e.message}`);
  });

  async function loadAll(base, files) {
    loading = files.map((f) => ({ f, src: base + f }));
    await Promise.all(loading.map((x) => loadScript(x.src, x.f)));
    loading = [];
    finish();
  }

  function finish() {
    const checkSources = (owner, list) =>
      (list || []).forEach((s) => {
        if (!sources[s.file]) errors.push(`${owner} 的出处 “${s.file}” 没有在出处表里登记`);
      });
    chapters.forEach((c) => {
      c.questions.forEach((q) => {
        checkSources('题目 ' + q.id, q.source);
        if (q.lesson && !lessonIds.has(q.lesson)) errors.push(`题目 ${q.id} 关联的讲解 “${q.lesson}” 不存在`);
      });
      c.lessons.forEach((l) => checkSources('讲解 ' + l.id, l.source));
    });
    chapters.sort((a, b) => (a.part.order || 0) - (b.part.order || 0) || a.order - b.order);
    const allLessons = chapters.flatMap((c) => c.lessons);
    Object.keys(tours).forEach((id) => {
      const l = allLessons.find((x) => x.id === id);
      if (!l) return errors.push(`播放步骤里的讲解 “${id}” 不存在`);
      const e = checkTour({ lab: l.lab, tour: tours[id] });
      if (e) return errors.push(`讲解 ${id} 的播放步骤：${e}（这一节先不显示播放按钮）`);
      l.tour = tours[id];
    });
    const ids = new Set();
    rawCharts.forEach((c, i) => {
      const where = `项目数字图 ${(c && c.id) || `第 ${i + 1} 张`}`;
      const e = checkChart(c) || (ids.has(c.id) ? 'id 重复了' : '');
      if (e) return errors.push(`${where}：${e}`);
      ids.add(c.id);
      checkSources(where, c.source);
      charts.push(c);
    });
  }

  function parts() {
    const map = new Map();
    chapters.forEach((c) => {
      if (!map.has(c.part.id)) map.set(c.part.id, Object.assign({ chapters: [] }, c.part));
      map.get(c.part.id).chapters.push(c);
    });
    return [...map.values()];
  }

  const chapter = (id) => chapters.find((c) => c.id === id);
  const question = (id) => {
    for (const c of chapters) {
      const q = c.questions.find((x) => x.id === id);
      if (q) return q;
    }
    return null;
  };

  const lesson = (id) => {
    for (const c of chapters) {
      const l = c.lessons.find((x) => x.id === id);
      if (l) return l;
    }
    return null;
  };

  window.QuizBank = { register, addSources, addTours, addCharts, charts, loadAll, parts, chapter, question, lesson, chapters, sources, errors };
})();
