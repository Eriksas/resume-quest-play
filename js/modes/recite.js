// 玩法：口述挑战。计时出声讲一遍，讲完对照关键点自己勾选，算完成度。
(function () {
  'use strict';
  const { fmt, sourceHTML, reducedMotion } = Util;

  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  Modes.recite = {
    label: '口述挑战',
    seconds: 150,

    render(q, ctx) {
      const target = q.targetSeconds || 120;
      const pass = q.pass || 0.8;

      const root = Util.el(`
        <div class="q q-recite">
          <span class="qtype">口述挑战</span>
          <div class="interviewer">
            <div class="iv-figure"></div>
            <div class="bubble"><span class="who">面试官</span><p>${fmt(q.prompt)}</p></div>
          </div>
          <p class="hint">出声讲一遍，目标约 ${clock(target)}。讲完对照关键点，勾选你讲到的。</p>
          <div class="recite-panel">
            <div class="timer-row"><span class="timer">0:00</span><span class="muted small">目标 ${clock(target)}</span></div>
            <div class="bar timer-bar"><span style="width:0%"></span></div>
          </div>
          ${q.answer ? `<details class="peek"><summary>卡住了？看一眼骨架</summary><p>${fmt(q.answer)}</p></details>` : ''}
          <div class="actions stage-actions">
            <button type="button" class="btn primary" data-act="start">开始计时</button>
            <button type="button" class="btn" data-act="skip">不计时，直接自查</button>
          </div>
          <div class="checklist" hidden></div>
          <div class="feedback" aria-live="polite" hidden></div>
          <div class="actions next-actions" hidden><button type="button" class="btn primary" data-next>下一题 →</button></div>
        </div>`);
      ctx.host.appendChild(root);

      const figure = Pets.claude('idle');
      root.querySelector('.iv-figure').appendChild(figure);
      const timerEl = root.querySelector('.timer');
      const barEl = root.querySelector('.timer-bar');
      const stageActions = root.querySelector('.stage-actions');
      const checklist = root.querySelector('.checklist');
      const fb = root.querySelector('.feedback');
      const nextActions = root.querySelector('.next-actions');
      const peek = root.querySelector('.peek');

      let startedAt = 0;
      let elapsed = null;
      let tick = null;
      let peeked = false;
      let stage = 'ready'; // ready → running → checking → done

      if (peek) peek.addEventListener('toggle', () => { if (peek.open && stage === 'running') peeked = true; });

      stageActions.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'start') start();
        else if (b.dataset.act === 'stop') stop(true);
        else if (b.dataset.act === 'skip') stop(false);
      });

      function start() {
        stage = 'running';
        startedAt = Date.now();
        root.classList.add('running');
        stageActions.innerHTML = '<button type="button" class="btn primary" data-act="stop">讲完了</button>';
        stageActions.querySelector('button').focus({ preventScroll: true });
        Pets.playClaude(figure, 'waiting');
        tick = setInterval(() => {
          if (!root.isConnected) return clearInterval(tick);
          const s = (Date.now() - startedAt) / 1000;
          timerEl.textContent = clock(s);
          barEl.querySelector('span').style.width = Math.min(100, (s / target) * 100) + '%';
          barEl.classList.toggle('over', s > target);
        }, 250);
      }

      function stop(timed) {
        clearInterval(tick);
        if (timed) elapsed = (Date.now() - startedAt) / 1000;
        stage = 'checking';
        root.classList.remove('running');
        stageActions.hidden = true;
        if (peek) peek.open = false;
        Pets.playClaude(figure, 'idle');
        checklist.innerHTML = `
          <h3 class="sub-h">勾选你讲到的关键点</h3>
          <ul class="check-items">
            ${q.points.map((p, i) => `<li><label class="check"><input type="checkbox" data-i="${i}"><span>${fmt(p)}</span></label></li>`).join('')}
          </ul>
          ${q.script ? `<details class="script"><summary>对照原文</summary>${q.script.map((p) => `<p>${fmt(p)}</p>`).join('')}</details>` : ''}
          <div class="actions"><button type="button" class="btn primary" data-act="submit">算完成度</button></div>`;
        checklist.hidden = false;
        checklist.querySelector('[data-act="submit"]').addEventListener('click', submit);
        checklist.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }

      function submit() {
        stage = 'done';
        const boxes = [...checklist.querySelectorAll('input[type="checkbox"]')];
        const got = boxes.filter((b) => b.checked).length;
        const pct = got / boxes.length;
        const correct = pct >= pass;
        boxes.forEach((b) => (b.disabled = true));
        checklist.querySelector('[data-act="submit"]').parentElement.remove();
        ctx.answer(correct, { xp: Math.max(2, Math.round(30 * pct)) });
        Pets.playClaude(figure, correct ? 'jumping' : 'review', correct ? 2 : 0, 'idle');

        const missing = q.points.filter((_, i) => !boxes[i].checked);
        let timeLine = '没有计时';
        if (elapsed != null) {
          timeLine = `用时 ${clock(elapsed)}，目标约 ${clock(target)}`;
          if (elapsed > target * 1.5) timeLine += '。超时比较多，下次挑骨架讲，细节留给追问。';
          else if (elapsed < target * 0.5) timeLine += '。偏短，可能有几点只是一带而过。';
        }
        fb.innerHTML = `
          <div class="fb-head ${correct ? 'ok' : 'bad'}"><span class="fb-pet"></span><div>
            <strong>完成度 ${got}/${boxes.length}（${Math.round(pct * 100)}%）</strong>
            <p>${correct ? '讲得很完整。' : `${Math.round(pass * 100)}% 算过关，这题会更早再出现。`}${peeked ? '这次中途看过骨架。' : ''}</p>
          </div></div>
          <p class="time-line">${timeLine}</p>
          ${missing.length ? `<div class="ref"><span class="ref-label">这几点没讲到</span><ul class="miss-list">${missing.map((p) => `<li>${fmt(p)}</li>`).join('')}</ul></div>` : ''}
          ${q.note ? `<p class="note">${fmt(q.note)}</p>` : ''}
          ${sourceHTML(q)}`;
        fb.hidden = false;
        ctx.react(correct, fb.querySelector('.fb-pet'));
        nextActions.hidden = false;
        const nextBtn = nextActions.querySelector('button');
        nextBtn.addEventListener('click', () => ctx.next());
        nextBtn.focus({ preventScroll: true });
        nextBtn.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }

      ctx.setKeys((e) => {
        if (e.key === 'Enter' && stage === 'done' && !(e.target.closest && e.target.closest('button'))) ctx.next();
      });
    },
  };
})();
