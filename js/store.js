// 进度：经验值、每道题的 Leitner 盒子、关卡星级、设置。存在浏览器 localStorage，可导出 / 导入。
(function () {
  'use strict';

  const KEY = 'resumeQuest.v1';
  const APP = 'resume-quest';

  // Leitner 分盒：答错回到 1 号盒当天再出；答对升一盒，间隔变长
  const INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
  const MASTERED_BOX = 3;
  const XP_PER_LEVEL = 200;
  const TITLES = ['面试新手', '渐入佳境', '娓娓道来', '对答如流', '面霸'];

  let state = null;
  let storageOK = true;

  const pad = (n) => String(n).padStart(2, '0');
  const dayStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dayStr(new Date());
  function addDays(day, n) {
    const [y, m, d] = day.split('-').map(Number);
    return dayStr(new Date(y, m - 1, d + n));
  }

  const fresh = () => ({
    version: 1,
    xp: 0,
    cards: {},
    chapters: {},
    lessons: {},
    daily: { lastDate: null, streak: 0 },
    days: {}, // 每天的记录：{ 'YYYY-MM-DD': { n: 答题数, ok: 答对数, xp: 经验值, m: 当天结束时已掌握的题数 } }
    settings: { pets: true },
    createdAt: today(),
  });

  function normalize(s) {
    const base = fresh();
    if (!s || typeof s !== 'object') return base;
    return {
      version: 1,
      xp: Number(s.xp) || 0,
      cards: s.cards && typeof s.cards === 'object' ? s.cards : {},
      chapters: s.chapters && typeof s.chapters === 'object' ? s.chapters : {},
      lessons: s.lessons && typeof s.lessons === 'object' ? s.lessons : {},
      daily: Object.assign(base.daily, s.daily || {}),
      days: s.days && typeof s.days === 'object' ? s.days : {},
      settings: Object.assign(base.settings, s.settings || {}),
      createdAt: s.createdAt || base.createdAt,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = normalize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      storageOK = false;
      state = fresh();
    }
    baseline();
  }

  // 老进度（或导入的旧文件）没有每日记录：用现在的掌握数当起点，曲线从今天开始画
  function baseline() {
    if (!Object.keys(state.days).length && Object.keys(state.cards).length) {
      state.days[today()] = { n: 0, ok: 0, xp: 0, m: masteredCount() };
    }
  }

  const masteredCount = () => Object.values(state.cards).filter((c) => c.box >= MASTERED_BOX).length;
  function dayLog() {
    const t = today();
    if (!state.days[t]) {
      state.days[t] = { n: 0, ok: 0, xp: 0, m: masteredCount() };
      const keys = Object.keys(state.days).sort();
      keys.slice(0, Math.max(0, keys.length - 400)).forEach((k) => delete state.days[k]); // 只留最近 400 天
    }
    return state.days[t];
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOK = true;
    } catch (e) {
      storageOK = false;
    }
  }

  // 记录一次作答。onlyIfDue：关卡里重复刷没到期的题，答对不升盒（防止刷一遍就“掌握”）；答错一律回 1 号盒。
  function review(qid, correct, opts) {
    const t = today();
    const isNew = !state.cards[qid];
    const c = state.cards[qid] || { box: 1, seen: 0, right: 0, wrong: 0, due: t };
    c.seen += 1;
    if (correct) {
      c.right += 1;
      if (isNew || !(opts && opts.onlyIfDue) || c.due <= t) {
        c.box = Math.min(c.box + 1, 5);
        c.due = addDays(t, INTERVAL_DAYS[c.box]);
      }
    } else {
      c.wrong += 1;
      c.box = 1;
      c.due = t;
    }
    c.last = t;
    state.cards[qid] = c;
    const d = dayLog();
    d.n += 1;
    if (correct) d.ok += 1;
    d.m = masteredCount();
    save();
    return c;
  }

  const card = (qid) => state.cards[qid] || null;
  const isDue = (qid) => {
    const c = state.cards[qid];
    return !!c && c.due <= today();
  };
  const isMastered = (qid) => {
    const c = state.cards[qid];
    return !!c && c.box >= MASTERED_BOX;
  };

  function addXP(n) {
    state.xp = Math.max(0, state.xp + n);
    if (n > 0) dayLog().xp += n;
    save();
  }

  function level() {
    const lv = Math.floor(state.xp / XP_PER_LEVEL) + 1;
    const into = state.xp % XP_PER_LEVEL;
    return {
      lv,
      title: TITLES[Math.min(Math.floor((lv - 1) / 2), TITLES.length - 1)],
      into,
      need: XP_PER_LEVEL,
      pct: into / XP_PER_LEVEL,
      xp: state.xp,
    };
  }

  const starsFor = (acc) => (acc >= 1 ? 3 : acc >= 0.85 ? 2 : acc >= 0.7 ? 1 : 0);

  function chapterRecord(id) {
    return state.chapters[id] || { best: 0, stars: 0, runs: 0 };
  }

  // 一整轮闯关结束后调用，返回是否首次通关
  function recordRun(id, acc) {
    const r = Object.assign({ best: 0, stars: 0, runs: 0 }, state.chapters[id]);
    const before = r.stars;
    r.runs += 1;
    r.best = Math.max(r.best, acc);
    r.stars = Math.max(r.stars, starsFor(acc));
    if (!r.clearedAt && r.stars >= 1) r.clearedAt = today();
    state.chapters[id] = r;
    save();
    return { firstClear: before < 1 && r.stars >= 1, stars: r.stars, newStars: starsFor(acc) };
  }

  function finishDaily() {
    const t = today();
    const d = state.daily;
    if (d.lastDate === t) return d.streak;
    d.streak = d.lastDate === addDays(t, -1) ? d.streak + 1 : 1;
    d.lastDate = t;
    save();
    return d.streak;
  }

  function streak() {
    const d = state.daily;
    if (d.lastDate === today() || d.lastDate === addDays(today(), -1)) return d.streak;
    return 0;
  }

  // 讲解：第一次看完返回 true（用来发经验值）
  function markLesson(id) {
    if (state.lessons[id]) return false;
    state.lessons[id] = today();
    save();
    return true;
  }
  const lessonSeen = (id) => !!state.lessons[id];

  const settings = () => state.settings;
  function setSetting(k, v) {
    state.settings[k] = v;
    save();
  }

  function exportText() {
    return JSON.stringify({ app: APP, version: 1, exportedAt: new Date().toISOString(), state }, null, 2);
  }

  function importText(text) {
    let obj;
    try {
      obj = JSON.parse(text);
    } catch (e) {
      throw new Error('文件不是有效的 JSON');
    }
    if (!obj || obj.app !== APP || !obj.state) throw new Error('这不是本游戏导出的进度文件');
    state = normalize(obj.state);
    baseline();
    save();
  }

  function reset() {
    const keep = state.settings;
    state = fresh();
    state.settings = keep;
    save();
  }

  window.Store = {
    load, save, review, card, isDue, isMastered, addXP, level, starsFor, chapterRecord, recordRun,
    finishDaily, streak, settings, setSetting, exportText, importText, reset, today, addDays, markLesson, lessonSeen,
    days: () => state.days,
    cards: () => state.cards,
    chapters: () => state.chapters,
    masteredCount,
    get storageOK() { return storageOK; },
    get xp() { return state.xp; },
    MASTERED_BOX, INTERVAL_DAYS,
  };
})();
