// 游戏主流程：地图 → 关卡 → 答题 → 结算；今日复习；导出 / 导入进度。
(function () {
  'use strict';
  const { esc, fmt, el, shuffle } = Util;

  const app = document.getElementById('app');
  const XP_RIGHT = { sort: 20, choice: 10, match: 15, recite: 30 };
  const XP_WRONG = 2;
  const XP_RETRY = 5;
  const LEVEL_BONUS = 50;
  const DAILY_BONUS = 30;
  const DAILY_SECONDS = 600;
  const PASS_HINT = '正确率 ≥ 70% 通关并解锁下一关；≥ 85% 两星；全对三星。';

  let keyHandler = null;
  let modalOpen = false;

  document.addEventListener('keydown', (e) => {
    if (modalOpen || !keyHandler) return;
    const t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    keyHandler(e);
  });

  // ---------- 小部件 ----------
  const LOCK_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z"/></svg>';

  function stars(n) {
    n = n || 0;
    return `<span class="stars" role="img" aria-label="${n} 星">${'★'.repeat(n)}<span class="off">${'★'.repeat(3 - n)}</span></span>`;
  }

  function bar(pct, label) {
    const p = Math.round(Math.max(0, Math.min(1, pct)) * 100);
    return `<div class="bar" role="progressbar" aria-label="${esc(label || '进度')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><span style="width:${p}%"></span></div>`;
  }

  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function confirmModal(title, body, okText, danger) {
    return new Promise((resolve) => {
      const wrap = el(`
        <div class="modal-backdrop">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h3 id="modal-title">${esc(title)}</h3>
            <p>${esc(body)}</p>
            <div class="actions end">
              <button type="button" class="btn" data-r="0">取消</button>
              <button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-r="1">${esc(okText || '确定')}</button>
            </div>
          </div>
        </div>`);
      const onKey = (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          done(false);
        }
      };
      function done(v) {
        wrap.remove();
        modalOpen = false;
        document.removeEventListener('keydown', onKey, true);
        resolve(v);
      }
      wrap.addEventListener('click', (e) => {
        const b = e.target.closest('[data-r]');
        if (b) done(b.dataset.r === '1');
        else if (e.target === wrap) done(false);
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(wrap);
      modalOpen = true;
      wrap.querySelector('[data-r="1"]').focus();
    });
  }

  // ---------- 题库统计 ----------
  const playable = (q) => !!Modes[q.type];
  const secondsOf = (q) => (Modes[q.type] && Modes[q.type].seconds) || 40;
  const minutesOf = (qs) => Math.max(1, Math.round(qs.reduce((s, q) => s + secondsOf(q), 0) / 60));

  function partOf(ch) {
    return QuizBank.parts().find((p) => p.id === ch.part.id);
  }

  function isUnlocked(ch) {
    const list = partOf(ch).chapters;
    const i = list.indexOf(ch);
    return i <= 0 || Store.chapterRecord(list[i - 1].id).stars >= 1;
  }

  // 关卡锁着时，动画讲解照样能看；只有做题要先通关上一关
  const canPreview = (ch) => !!(ch.lessons && ch.lessons.length);
  function lockHint(ch) {
    const list = partOf(ch).chapters;
    const prev = list[list.indexOf(ch) - 1];
    return `做题要先通关「${prev ? prev.title : '上一关'}」（正确率 ≥ 70%）`;
  }

  function nextChapter(id) {
    const ch = QuizBank.chapter(id);
    const list = partOf(ch).chapters;
    return list[list.indexOf(ch) + 1] || null;
  }

  function stats(ch) {
    const qs = ch.questions.filter(playable);
    let mastered = 0;
    let due = 0;
    let fresh = 0;
    qs.forEach((q) => {
      const c = Store.card(q.id);
      if (!c) fresh += 1;
      else {
        if (c.box >= Store.MASTERED_BOX) mastered += 1;
        if (Store.isDue(q.id)) due += 1;
      }
    });
    return { total: qs.length, mastered, due, fresh };
  }

  // 今日 10 分钟：先出到期的（盒子号小的优先），再补没做过的新题，凑满约 10 分钟；口述题每天最多 1 道
  function dailyPlan() {
    const all = QuizBank.chapters.filter(isUnlocked).flatMap((c) => c.questions.filter(playable));
    const due = shuffle(all.filter((q) => Store.isDue(q.id))).sort((a, b) => Store.card(a.id).box - Store.card(b.id).box);
    const fresh = all.filter((q) => !Store.card(q.id));
    const queue = [];
    let secs = 0;
    let recites = 0;
    for (const q of due.concat(fresh)) {
      if (queue.length && secs + secondsOf(q) > DAILY_SECONDS) continue;
      if (q.type === 'recite' && recites >= 1) continue;
      if (q.type === 'recite') recites += 1;
      queue.push(q);
      secs += secondsOf(q);
    }
    // 口述题放最后，先热身
    queue.sort((a, b) => (a.type === 'recite') - (b.type === 'recite'));
    const dueIn = queue.filter((q) => Store.card(q.id)).length;
    return { queue, dueIn, freshIn: queue.length - dueIn, dueAll: due.length, freshAll: fresh.length, all };
  }

  // ---------- 地图（首页） ----------
  function renderHome() {
    keyHandler = null;
    const lv = Store.level();
    const plan = dailyPlan();
    const parts = QuizBank.parts();
    let total = 0;
    let mastered = 0;
    QuizBank.chapters.forEach((c) => {
      const s = stats(c);
      total += s.total;
      mastered += s.mastered;
    });

    const greet = plan.dueAll
      ? `今天有 ${plan.dueAll} 道题到期，一起过一遍？`
      : plan.freshAll
        ? `还有 ${plan.freshAll} 道新题没见过，开始吧。`
        : '今天的复习都做完了，想再闯一关吗？';

    const dailyDesc = plan.queue.length
      ? `到期复习 ${plan.dueIn} 题 · 新题 ${plan.freshIn} 题 · 约 ${minutesOf(plan.queue)} 分钟`
      : '今天没有到期的题。可以随便练几题，或者明天再来。';

    app.innerHTML = `
      <div class="screen home">
        <header class="topbar">
          <h1 class="brand">简历闯关</h1>
          <span class="muted small">按简历讲 · 不讲太深</span>
        </header>
        ${banners()}
        <section class="card player">
          <div class="buddy" data-buddy></div>
          <div class="player-main">
            <div class="lv-row"><span class="lv">Lv.${lv.lv}</span><span class="lv-title">${esc(lv.title)}</span><span class="xp-total">${lv.xp} XP</span></div>
            ${bar(lv.pct, '升级进度')}
            <p class="muted small">距 Lv.${lv.lv + 1} 还差 ${lv.need - lv.into} XP · 连续打卡 ${Store.streak()} 天 · 已掌握 ${mastered}/${total} 题</p>
            <p class="say" data-say>${esc(greet)}</p>
            <button type="button" class="btn ghost small stats-link" data-act="stats">学习数据 →</button>
          </div>
        </section>

        <section class="card daily">
          <div>
            <h2>今日 10 分钟</h2>
            <p class="muted small">${esc(dailyDesc)}</p>
          </div>
          <button type="button" class="btn primary" data-act="daily">${plan.queue.length ? '开始' : '随便练练'}</button>
        </section>

        ${dirEntryHTML()}

        ${parts.map(partHTML).join('')}

        <section class="tools">
          <button type="button" class="btn ghost" data-act="export">导出进度</button>
          <button type="button" class="btn ghost" data-act="import">导入进度</button>
          <button type="button" class="btn ghost" data-act="pets" aria-pressed="${Pets.enabled()}">角色：${Pets.enabled() ? '开' : '关'}</button>
          <button type="button" class="btn ghost danger-text" data-act="reset">重置进度</button>
          <input type="file" accept=".json,application/json" hidden data-file>
        </section>
        <footer class="foot muted small">
          题目只来自你的面试材料，每题都能展开看出处。进度存在这个浏览器里，换设备或清缓存前记得导出。<br>
          角色素材：大肥鱼（<a href="https://github.com/PC2005-cloud/dsh-pet" target="_blank" rel="noopener">PC2005-cloud/dsh-pet</a>，CC BY-NC-SA 4.0，非商用）${Pets.hasClaude() ? '<span class="claude-credit">、Claude 小姐（<a href="https://github.com/zhoupengjie/Wakuwaku" target="_blank" rel="noopener">Wakuwaku</a> 像素二创）</span>' : ''}，仅供个人学习，署名详见 CREDITS.md。
        </footer>
      </div>`;

    const buddySlot = app.querySelector('[data-buddy]');
    const allDone = !plan.dueAll && !plan.freshAll;
    const fish = Pets.fish(allDone ? 'yawn' : 'wave', 'fish-md');
    if (fish) {
      fish.setAttribute('role', 'button');
      fish.setAttribute('tabindex', '0');
      fish.setAttribute('aria-label', '大肥鱼：点我听一句提醒');
      buddySlot.appendChild(fish);
      if (!allDone) Pets.setFish(fish, 'wave', 'idle', 3500);
      const poke = () => {
        Pets.setFish(fish, 'happy', 'idle', 3000);
        app.querySelector('[data-say]').textContent = Pets.tip();
      };
      fish.addEventListener('click', poke);
      fish.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          poke();
        }
      });
    }

    app.querySelector('.screen').addEventListener('click', onHomeClick);
    app.querySelector('[data-file]').addEventListener('change', onImportFile);
  }

  function dirEntryHTML() {
    const ps = lessonParts();
    if (!ps.length) return '';
    const all = ps.flatMap((p) => p.chapters.flatMap((c) => c.lessons || []));
    const seen = all.filter((l) => Store.lessonSeen(l.id)).length;
    return `
        <section class="card dir-entry">
          <div>
            <h2>互动讲解</h2>
            <p class="muted small">${ps.map((p) => `${esc(p.title.replace(/篇$/, ''))} ${p.chapters.reduce((n, c) => n + (c.lessons || []).length, 0)} 节`).join(' · ')} · 点开就能播放动画 · 已看 ${seen}/${all.length}</p>
          </div>
          <button type="button" class="btn" data-act="lessons">去看讲解 →</button>
        </section>`;
  }

  function banners() {
    let html = '';
    if (!Store.storageOK) {
      html += '<div class="banner warn">这个浏览器不让保存进度（可能是隐私模式）。玩完记得点“导出进度”。</div>';
    }
    if (QuizBank.errors.length) {
      html += `<div class="banner bad"><strong>题库有 ${QuizBank.errors.length} 处问题，相关题目已跳过：</strong><ul>${QuizBank.errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
    }
    if (!QuizBank.chapters.length) {
      html += '<div class="banner bad">没有加载到任何题库。检查 data/manifest.js 里的文件名。</div>';
    }
    return html;
  }

  const chartsOf = (chId) => QuizBank.charts.filter((c) => c.chapter === chId);
  const partHasCharts = (part) => part.chapters.some((c) => chartsOf(c.id).length);

  function partHTML(part) {
    return `
      <section class="part">
        <div class="part-head"><h2>${esc(part.title)}</h2>${part.desc ? `<span class="muted small">${esc(part.desc)}</span>` : ''}${partHasCharts(part) ? '<button type="button" class="btn ghost small part-link" data-act="numbers">项目数字图 →</button>' : ''}</div>
        <ol class="map">${part.chapters.map((ch, i) => nodeHTML(ch, i)).join('')}</ol>
      </section>`;
  }

  function nodeHTML(ch, i) {
    const open = isUnlocked(ch);
    const rec = Store.chapterRecord(ch.id);
    const s = stats(ch);
    const ls = ch.lessons || [];
    const seen = ls.filter((l) => Store.lessonSeen(l.id)).length;
    const preview = !open && ls.length > 0;
    const cls = ['node', open ? '' : 'locked', preview ? 'preview' : '', rec.stars ? 'cleared' : ''].join(' ');
    return `
      <li class="${cls}">
        <button type="button" class="node-btn" data-ch="${esc(ch.id)}" ${open || preview ? '' : 'aria-disabled="true"'}>
          <span class="node-dot">${open ? esc(ch.badge || String(i + 1)) : LOCK_SVG}</span>
          <span class="node-body">
            <span class="node-title">${esc(ch.title)}</span>
            ${ch.subtitle ? `<span class="node-sub">${esc(ch.subtitle)}</span>` : ''}
            <span class="node-meta">${stars(rec.stars)}${preview ? '<span class="preview-tag">讲解可先看</span>' : ''}${ls.length ? `<span>讲解 ${seen}/${ls.length}</span>` : ''}<span>已掌握 ${s.mastered}/${s.total}</span>${s.due ? `<span class="due">到期 ${s.due}</span>` : ''}</span>
            ${bar(s.total ? s.mastered / s.total : 0, ch.title + ' 掌握进度')}
          </span>
        </button>
      </li>`;
  }

  async function onHomeClick(e) {
    const node = e.target.closest('[data-ch]');
    if (node) {
      const ch = QuizBank.chapter(node.dataset.ch);
      if (!isUnlocked(ch) && !canPreview(ch)) return toast('先通关上一关（正确率 ≥ 70%）就能解锁');
      return renderLevel(ch.id);
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    switch (b.dataset.act) {
      case 'daily': {
        const plan = dailyPlan();
        if (plan.queue.length) return startSession({ kind: 'daily', title: '今日 10 分钟', questions: plan.queue });
        if (!plan.all.length) return toast('还没有可以练的题');
        return startSession({ kind: 'free', title: '随便练练', questions: shuffle(plan.all).slice(0, 8) });
      }
      case 'lessons':
        return renderLessons();
      case 'stats':
        return renderStats();
      case 'numbers':
        return renderNumbers();
      case 'export':
        return doExport();
      case 'import':
        return app.querySelector('[data-file]').click();
      case 'pets':
        Store.setSetting('pets', !Pets.enabled());
        return renderHome();
      case 'reset':
        if (await confirmModal('重置全部进度？', '经验值、星级和每道题的复习记录都会清空，不能撤销。建议先导出一份。', '重置', true)) {
          Store.reset();
          renderHome();
          toast('进度已清空');
        }
        return;
    }
  }

  // ---------- 导出 / 导入 ----------
  function doExport() {
    const blob = new Blob([Store.exportText()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `简历闯关进度-${Store.today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('已导出进度文件，在浏览器的下载文件夹里');
  }

  function onImportFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await confirmModal('导入这个进度文件？', `会用“${file.name}”覆盖当前进度（现在是 ${Store.xp} XP）。`, '导入');
      if (!ok) return;
      try {
        Store.importText(String(reader.result));
        renderHome();
        toast('进度已导入');
      } catch (err) {
        toast('导入失败：' + err.message);
      }
    };
    reader.onerror = () => toast('读取文件失败');
    reader.readAsText(file);
  }

  // ---------- 关卡页 ----------
  function renderLevel(id) {
    keyHandler = null;
    const ch = QuizBank.chapter(id);
    if (!ch) return renderHome();
    const qs = ch.questions.filter(playable);
    const s = stats(ch);
    const rec = Store.chapterRecord(id);
    const open = isUnlocked(ch);
    const types = [];
    qs.forEach((q) => {
      let t = types.find((x) => x.type === q.type);
      if (!t) types.push((t = { type: q.type, label: Modes[q.type].label, qs: [] }));
      t.qs.push(q);
    });

    app.innerHTML = `
      <div class="screen level">
        <header class="topbar"><button type="button" class="btn ghost back" data-act="home">← 地图</button></header>
        <section class="card level-hero">
          <span class="node-dot big">${esc(ch.badge || '')}</span>
          <div>
            <h1>${esc(ch.title)}</h1>
            ${ch.subtitle ? `<p class="muted">${esc(ch.subtitle)}</p>` : ''}
          </div>
        </section>
        ${ch.intro ? `<p class="intro">${fmt(ch.intro)}</p>` : ''}
        ${open ? '' : `<div class="banner warn">${esc(lockHint(ch))}。动画讲解现在就能看。</div>`}
        ${chartsOf(ch.id).length ? `<button type="button" class="btn block" data-act="numbers">看这个项目的数字图（${chartsOf(ch.id).length} 张）</button>` : ''}
        <section class="card level-stats">
          <div class="row">${stars(rec.stars)}<span class="muted small">${rec.runs ? `最好成绩 ${Math.round(rec.best * 100)}% · 闯过 ${rec.runs} 次` : '还没闯过'}</span></div>
          ${bar(s.total ? s.mastered / s.total : 0, '掌握进度')}
          <p class="muted small">已掌握 ${s.mastered}/${s.total} 题 · 今天到期 ${s.due} 题 · 没做过 ${s.fresh} 题</p>
        </section>
        ${ch.lessons && ch.lessons.length ? `
          <h3 class="sub-h">互动讲解 · ${open ? '先看动画再做题' : '现在就能看'}</h3>
          <div class="lesson-list">
            ${ch.lessons.map((l) => lessonBtnHTML(l, `${qs.filter((q) => q.lesson === l.id).length} 题`)).join('')}
          </div>` : ''}
        <button type="button" class="btn primary block" data-act="run" ${open ? '' : 'disabled'}>${open ? `开始闯关 · ${qs.length} 题 · 约 ${minutesOf(qs)} 分钟` : `开始闯关（还没解锁）· ${qs.length} 题`}</button>
        <p class="muted small center">${open ? PASS_HINT : esc(lockHint(ch))}</p>
        <h3 class="sub-h">单项练习</h3>
        <div class="mode-list">
          ${types.map((t) => `<button type="button" class="mode-btn" data-mode="${esc(t.type)}" ${open ? '' : 'disabled'}><span class="mode-name">${esc(t.label)}</span><span class="muted small">${t.qs.length} 题 · 约 ${minutesOf(t.qs)} 分钟</span></button>`).join('')}
        </div>
      </div>`;

    app.querySelector('.screen').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act],[data-mode],[data-lesson]');
      if (!b) return;
      if (b.dataset.lesson) return renderLesson(b.dataset.lesson);
      if (b.dataset.act === 'home') return renderHome();
      if (b.dataset.act === 'numbers') return renderNumbers(id, 'level');
      if (!open && (b.dataset.act === 'run' || b.dataset.mode)) return toast(lockHint(ch));
      if (b.dataset.act === 'run') return startSession({ kind: 'level', chapterId: id, title: ch.title, questions: qs });
      if (b.dataset.mode) {
        const t = types.find((x) => x.type === b.dataset.mode);
        return startSession({ kind: 'mode', chapterId: id, title: `${ch.title} · ${t.label}`, questions: t.qs });
      }
    });
    window.scrollTo(0, 0);
  }

  // ---------- 互动讲解 ----------
  // ---------- 项目数字图（图在 js/charts.js，数据在 data/charts_resume.js） ----------
  let numbersTab = null;
  function renderNumbers(chId, from) {
    keyHandler = null;
    const chs = QuizBank.chapters.filter((c) => chartsOf(c.id).length);
    if (!chs.length) return renderHome();
    const ch = chs.find((c) => c.id === chId) || chs.find((c) => c.id === numbersTab) || chs[0];
    numbersTab = ch.id;
    const quiz = Store.settings().hideNumbers === true;
    app.innerHTML = `
      <div class="screen wide numbers ${quiz ? 'quiz' : ''}">
        <header class="topbar">
          <button type="button" class="btn ghost back" data-act="back">← ${from === 'level' ? esc(ch.title) : '地图'}</button>
          <span class="muted small">${esc(ch.part.title)} · 项目数字图</span>
        </header>
        <section class="card dir-head">
          <h1>项目数字图</h1>
          <p class="muted small">面试要报的数字画成图，标题就是要说的那句话。打开“遮住数字”先自己说一遍，再点数字核对。数字都来自你的材料，每张图都能看出处。</p>
          <div class="seg dir-tabs" role="group">${chs.map((c) => `<button type="button" data-ch="${esc(c.id)}" aria-pressed="${c.id === ch.id}">${esc(c.title)}</button>`).join('')}</div>
          <label class="lab-check"><input type="checkbox" data-quiz ${quiz ? 'checked' : ''}><span>遮住数字，先自己说</span></label>
        </section>
        <div class="numbers-body"></div>
        <div class="actions center">
          ${isUnlocked(ch) ? `<button type="button" class="btn primary" data-act="practice">练这个项目的题</button>` : ''}
          <button type="button" class="btn" data-act="back">${from === 'level' ? '回到关卡' : '回到地图'}</button>
        </div>
      </div>`;
    const screen = app.querySelector('.screen');
    ProjectCharts.render(screen.querySelector('.numbers-body'), chartsOf(ch.id), screen);
    StatsPage.wireTips(screen);
    screen.querySelector('[data-quiz]').addEventListener('change', (e) => {
      Store.setSetting('hideNumbers', e.target.checked);
      screen.classList.toggle('quiz', e.target.checked);
      screen.querySelectorAll('.num.shown').forEach((n) => n.classList.remove('shown'));
      StatsPage.hideTip();
    });
    screen.addEventListener('click', (e) => {
      const t = e.target.closest('[data-ch],[data-act]');
      if (!t) return;
      StatsPage.hideTip();
      if (t.dataset.ch) return renderNumbers(t.dataset.ch, from);
      if (t.dataset.act === 'back') return from === 'level' ? renderLevel(ch.id) : renderHome();
      if (t.dataset.act === 'practice') return renderLevel(ch.id);
    });
    window.scrollTo(0, 0);
  }

  // ---------- 学习数据（图表在 js/stats.js） ----------
  function renderStats() {
    keyHandler = null;
    StatsPage.render(app, { renderHome, renderLevel, renderLesson, startSession, playable });
  }

  function lessonBtnHTML(l, meta) {
    const seen = Store.lessonSeen(l.id);
    const bits = [seen ? '已看' : '', l.tour && l.tour.length ? '▶ 可播放' : '', meta || ''].filter(Boolean);
    return `<button type="button" class="lesson-btn ${seen ? 'seen' : ''}" data-lesson="${esc(l.id)}">
      <span class="lstars">${l.stars ? '★'.repeat(l.stars) : '<span class="opt-tag">选学</span>'}</span>
      <span class="ltitle">${esc(l.title)}</span>
      <span class="lmeta">${bits.join(' · ')}</span>
    </button>`;
  }

  // ---------- 互动讲解目录：所有讲解按篇、按关卡列出来，不用先进关卡 ----------
  let dirTab = null;
  const lessonParts = () => QuizBank.parts().filter((p) => p.chapters.some((c) => c.lessons && c.lessons.length));

  function renderLessons(partId) {
    keyHandler = null;
    const parts = lessonParts();
    if (!parts.length) return renderHome();
    const part = parts.find((p) => p.id === partId) || parts.find((p) => p.id === dirTab) || parts[0];
    dirTab = part.id;
    const chs = part.chapters.filter((c) => c.lessons && c.lessons.length);
    const all = chs.flatMap((c) => c.lessons);
    const seen = all.filter((l) => Store.lessonSeen(l.id)).length;
    app.innerHTML = `
      <div class="screen wide lessons-dir">
        <header class="topbar">
          <button type="button" class="btn ghost back" data-act="home">← 地图</button>
          <span class="muted small">${esc(part.title)} · 已看 ${seen}/${all.length} 节</span>
        </header>
        <section class="card dir-head">
          <h1>互动讲解</h1>
          <p class="muted small">每节都是一个能动手的动画。点“▶ 播放讲解”，它会自己一步步演示：滑块自己滑、图自己变，每步配一句解说。播放中碰一下动画就暂停，可以自己接着拖。星星越多越常考。</p>
          ${parts.length > 1 ? `<div class="seg dir-tabs" role="group">${parts.map((p) => `<button type="button" data-part="${esc(p.id)}" aria-pressed="${p.id === part.id}">${esc(p.title)}</button>`).join('')}</div>` : ''}
        </section>
        ${chs.map((c) => `
          <section class="dir-ch">
            <h2 class="sub-h">${esc(c.title)} <span class="muted small">${esc(c.subtitle || '')}</span></h2>
            <div class="lesson-list">${c.lessons.map((l) => lessonBtnHTML(l, '')).join('')}</div>
          </section>`).join('')}
      </div>`;
    app.querySelector('.screen').addEventListener('click', (e) => {
      const t = e.target.closest('[data-part],[data-lesson],[data-act]');
      if (!t) return;
      if (t.dataset.part) return renderLessons(t.dataset.part);
      if (t.dataset.lesson) return renderLesson(t.dataset.lesson, 'dir');
      if (t.dataset.act === 'home') return renderHome();
    });
    window.scrollTo(0, 0);
  }

  function lessonHTML(l) {
    const st = l.stars || 0;
    return `
      <section class="card lesson-head">
        <div class="lesson-kicker">${st ? stars(st) + '<span class="muted small">重要度</span>' : '<span class="opt-tag">选学</span>'}</div>
        <h1>${esc(l.title)}</h1>
        ${l.oneLiner ? `<div class="one-liner"><span class="ref-label">一句话</span><p>${fmt(l.oneLiner)}</p></div>` : ''}
      </section>
      ${l.lab ? `<section class="card lab-card">${l.tour && l.tour.length ? '<div class="tour" data-tour></div>' : ''}<div class="lab-host" data-lab-host></div></section>` : ''}
      ${l.tryIt && l.tryIt.length ? `<section class="card"><h3 class="sub-h">试试看</h3><ol class="try-list">${l.tryIt.map((t) => `<li>${fmt(t)}</li>`).join('')}</ol></section>` : ''}
      <section class="card">
        <h3 class="sub-h">面试要点</h3>
        <ul class="point-list">${(l.points || []).map((p) => `<li>${fmt(p)}</li>`).join('')}</ul>
        ${l.project ? `<div class="project-tie"><span class="ref-label">联系你的项目</span><p>${fmt(l.project)}</p></div>` : ''}
        ${l.source && l.source.length ? `<details class="source"><summary>出处</summary><ul>${Util.sourceList(l.source).join('')}</ul></details>` : ''}
      </section>`;
  }

  // from = 'dir'：从“互动讲解”目录进来，返回目录，“下一节”可以跨关卡
  function renderLesson(id, from) {
    keyHandler = null;
    const l = QuizBank.lesson(id);
    if (!l) return renderHome();
    const ch = QuizBank.chapter(l.chapterId);
    const qs = ch.questions.filter((q) => q.lesson === id && playable(q));
    const fromDir = from === 'dir';
    const seq = fromDir ? partOf(ch).chapters.flatMap((c) => c.lessons || []) : ch.lessons;
    const idx = seq.indexOf(l);
    const next = seq[idx + 1];
    const open = isUnlocked(ch);
    const backAct = fromDir ? 'dir' : 'level';
    app.innerHTML = `
      <div class="screen wide lesson">
        <header class="topbar">
          <button type="button" class="btn ghost back" data-act="${backAct}">← ${fromDir ? '讲解目录' : esc(ch.title)}</button>
          <span class="muted small">${fromDir ? esc(partOf(ch).title) + ' · ' : ''}讲解 ${idx + 1}/${seq.length}</span>
        </header>
        ${lessonHTML(l)}
        <div class="actions center">
          ${qs.length && open ? `<button type="button" class="btn primary" data-act="practice">练这一节的题（${qs.length}）</button>` : ''}
          ${next ? `<button type="button" class="btn ${open ? '' : 'primary'}" data-act="next">下一节：${esc(next.title)} →</button>` : `<button type="button" class="btn" data-act="${backAct}">${fromDir ? '回到讲解目录' : '回到关卡'}</button>`}
        </div>
        ${qs.length && !open ? `<p class="muted small center">${esc(lockHint(ch))}后，就能练这一节的 ${qs.length} 道题。</p>` : ''}
      </div>`;
    if (l.lab) {
      const host = app.querySelector('[data-lab-host]');
      Labs.mount(l.lab, host);
      Tour.attach(app.querySelector('[data-tour]'), host, l);
    }
    if (Store.markLesson(id)) {
      Store.addXP(5);
      toast('第一次看这节讲解 +5 XP');
    }
    app.querySelector('.screen').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'level') renderLevel(ch.id);
      if (b.dataset.act === 'dir') renderLessons(partOf(ch).id);
      if (b.dataset.act === 'next') renderLesson(next.id, from);
      if (b.dataset.act === 'practice' && open) startSession({ kind: 'mode', chapterId: ch.id, title: `${ch.title} · ${l.title}`, questions: qs });
    });
    window.scrollTo(0, 0);
  }

  // 答题时点“回看动画讲解”：在当前页面上弹出，不打断这一轮
  function openLessonOverlay(id) {
    const l = QuizBank.lesson(id);
    if (!l) return;
    const wrap = el(`
      <div class="sheet-backdrop">
        <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(l.title)}">
          <div class="sheet-bar"><span class="muted small">动画讲解</span><button type="button" class="icon-btn" data-close aria-label="关闭讲解">✕</button></div>
          ${lessonHTML(l)}
          <div class="actions center"><button type="button" class="btn primary" data-close>看完了，回去答题</button></div>
        </div>
      </div>`);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    function close() {
      wrap.remove();
      modalOpen = false;
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKey, true);
    }
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    modalOpen = true;
    if (l.lab) {
      const host = wrap.querySelector('[data-lab-host]');
      Labs.mount(l.lab, host);
      Tour.attach(wrap.querySelector('[data-tour]'), host, l);
    }
    Store.markLesson(id);
    wrap.querySelector('[data-close]').focus();
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lesson-link]');
    if (b) openLessonOverlay(b.dataset.lessonLink);
  });

  // ---------- 答题 ----------
  function startSession(opts) {
    const S = Object.assign({}, opts, {
      queue: opts.questions.map((q) => ({ q, retry: false })),
      i: 0,
      results: [],
      xp: 0,
    });
    app.innerHTML = `
      <div class="screen play">
        <header class="playbar">
          <button type="button" class="icon-btn" data-act="quit" aria-label="退出这一轮">✕</button>
          <div class="play-title small muted">${esc(S.title)}</div>
          <div class="play-progress">${bar(0, '本轮进度')}<span class="count small"></span></div>
          <span class="xpchip" data-xp>+0 XP</span>
        </header>
        <main class="stage" data-stage></main>
      </div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', async () => {
      const ok = await confirmModal('退出这一轮？', '已经答过的题会保留复习记录，这一轮不计星。', '退出');
      if (ok) (S.chapterId && S.kind !== 'daily' ? renderLevel(S.chapterId) : renderHome());
    });
    showQuestion(S);
  }

  function updateProgress(S, answeredNow) {
    const done = S.i + (answeredNow ? 1 : 0);
    const p = app.querySelector('.play-progress .bar');
    const pct = Math.round((done / S.queue.length) * 100);
    p.querySelector('span').style.width = pct + '%';
    p.setAttribute('aria-valuenow', pct);
    app.querySelector('.play-progress .count').textContent = `${Math.min(S.i + 1, S.queue.length)}/${S.queue.length}`;
    app.querySelector('[data-xp]').textContent = `+${S.xp} XP`;
  }

  function flashXP(n) {
    const chip = app.querySelector('[data-xp]');
    if (!chip) return;
    const f = el(`<span class="xp-float">+${n}</span>`);
    chip.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }

  function showQuestion(S) {
    keyHandler = null;
    const item = S.queue[S.i];
    const stage = app.querySelector('[data-stage]');
    stage.innerHTML = '';
    const host = document.createElement('div');
    host.className = 'qwrap';
    stage.appendChild(host);
    if (item.retry) host.appendChild(el('<p class="retry-tag">错题回炉：再试一次（不重复计分）</p>'));
    updateProgress(S, false);

    let answered = false;
    const ctx = {
      host,
      // opts.xp：玩法自己算的经验值（口述题按完成度给）
      answer(correct, opts) {
        if (answered) return;
        answered = true;
        if (!item.retry) {
          Store.review(item.q.id, correct, { onlyIfDue: S.kind !== 'daily' });
          S.results.push({ q: item.q, correct });
          if (!correct && S.kind === 'daily' && item.q.type !== 'recite') S.queue.push({ q: item.q, retry: true });
        }
        let gain = correct ? (item.retry ? XP_RETRY : XP_RIGHT[item.q.type] || 10) : XP_WRONG;
        if (opts && typeof opts.xp === 'number' && !item.retry) gain = opts.xp;
        S.xp += gain;
        Store.addXP(gain);
        updateProgress(S, true);
        flashXP(gain);
      },
      react(correct, slot) {
        if (!slot) return;
        const f = Pets.fish(correct ? 'happy' : 'sigh', 'fish-sm');
        if (!f) return;
        slot.appendChild(f);
        if (correct) Pets.setFish(f, 'happy', 'idle', 4000);
      },
      next() {
        if (!answered) return;
        S.i += 1;
        if (S.i >= S.queue.length) return finishSession(S);
        window.scrollTo(0, 0);
        showQuestion(S);
      },
      setKeys(fn) {
        keyHandler = fn;
      },
    };
    Modes[item.q.type].render(item.q, ctx);
  }

  // ---------- 结算 ----------
  function finishSession(S) {
    keyHandler = null;
    const n = S.results.length;
    const right = S.results.filter((r) => r.correct).length;
    const acc = n ? right / n : 0;
    let headline = '这一轮练完了';
    let sub = '';
    let unlocked = null;
    let bonus = 0;
    let rec = null;
    let clip = acc >= 0.7 ? 'celebrate' : 'sigh';

    if (S.kind === 'level') {
      rec = Store.recordRun(S.chapterId, acc);
      headline = rec.newStars >= 1 ? '通关！' : '差一点就通关了';
      if (rec.firstClear) {
        bonus += LEVEL_BONUS;
        unlocked = nextChapter(S.chapterId);
      }
    } else if (S.kind === 'daily') {
      const streak = Store.finishDaily();
      bonus += DAILY_BONUS;
      headline = '今日复习完成';
      sub = `连续打卡 ${streak} 天`;
      clip = 'celebrate';
    }
    if (bonus) {
      Store.addXP(bonus);
      S.xp += bonus;
    }

    const wrong = [];
    S.results.forEach((r) => {
      if (!r.correct && !wrong.includes(r.q)) wrong.push(r.q);
    });
    const lv = Store.level();

    app.innerHTML = `
      <div class="screen result">
        <section class="card result-card">
          <div class="result-pet" data-pet></div>
          <h1>${esc(headline)}</h1>
          ${rec ? stars(rec.newStars) : ''}
          <p class="score">正确率 <strong>${Math.round(acc * 100)}%</strong>（${right}/${n}）</p>
          <p class="muted">本轮 +${S.xp} XP${bonus ? `（含奖励 ${bonus}）` : ''}${sub ? ' · ' + esc(sub) : ''} · 现在 Lv.${lv.lv}</p>
          ${rec && rec.firstClear && !unlocked ? '<p class="unlock">这一篇的关卡全部通关了</p>' : ''}
          ${unlocked ? `<p class="unlock">已解锁下一关：${esc(unlocked.title)}</p>` : ''}
          ${rec && rec.newStars < 1 ? `<p class="muted small">${PASS_HINT}</p>` : ''}
        </section>
        ${wrong.length ? `
          <section class="card">
            <h3>答错的题</h3>
            <p class="muted small">已经放回 1 号盒，“今日 10 分钟”里会优先出现。</p>
            <ul class="wrong-list">${wrong.map((q) => `<li>${fmt(q.prompt)}</li>`).join('')}</ul>
          </section>` : ''}
        <div class="actions center">
          ${S.kind === 'level' || S.kind === 'mode' ? '<button type="button" class="btn" data-act="again">再来一轮</button>' : ''}
          <button type="button" class="btn" data-act="stats">看学习数据</button>
          <button type="button" class="btn primary" data-act="home">回到地图</button>
        </div>
      </div>`;

    const f = Pets.fish(clip, 'fish-lg');
    if (f) app.querySelector('[data-pet]').appendChild(f);
    app.querySelector('.screen').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'home') renderHome();
      if (b.dataset.act === 'stats') renderStats();
      if (b.dataset.act === 'again') startSession({ kind: S.kind, chapterId: S.chapterId, title: S.title, questions: S.questions });
    });
    window.scrollTo(0, 0);
  }

  // ---------- 启动 ----------
  function boot() {
    Store.load();
    QuizBank.loadAll('data/', window.QUIZ_FILES || []).then(renderHome);
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.App = { renderHome, renderLevel, renderLesson, renderLessons, renderStats, renderNumbers, openLessonOverlay };
})();
