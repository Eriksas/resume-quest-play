// 玩法：面试官追问三选一。选完显示每个选项的坑和参考答案。
(function () {
  'use strict';
  const { esc, fmt, shuffle, sourceHTML, reducedMotion } = Util;

  Modes.choice = {
    label: '追问三选一',
    seconds: 35,

    render(q, ctx) {
      const opts = shuffle(q.options);
      const best = q.options.find((o) => o.correct);

      const root = Util.el(`
        <div class="q q-choice">
          <span class="qtype">追问三选一</span>
          <div class="interviewer">
            <div class="iv-figure"></div>
            <div class="bubble"><span class="who">面试官追问</span><p>${fmt(q.prompt)}</p></div>
          </div>
          <p class="hint">选出最好的回答<span class="kbd-only">（键盘可按 ${opts.map((_, k) => k + 1).join(' / ')}）</span></p>
          <div class="options">
            ${opts.map((o, k) => `
              <button type="button" class="opt" data-k="${k}">
                <span class="opt-key">${k + 1}</span>
                <span class="opt-body"><span class="opt-text">${fmt(o.text)}</span><span class="opt-why" hidden></span></span>
              </button>`).join('')}
          </div>
          <div class="feedback" aria-live="polite" hidden></div>
          <div class="actions" hidden><button type="button" class="btn primary" data-next>下一题 →</button></div>
        </div>`);
      ctx.host.appendChild(root);

      const figure = Pets.claude('idle');
      root.querySelector('.iv-figure').appendChild(figure);
      const buttons = [...root.querySelectorAll('.opt')];
      const fb = root.querySelector('.feedback');
      const actions = root.querySelector('.actions');
      let answered = false;

      buttons.forEach((b) => b.addEventListener('click', () => pick(Number(b.dataset.k))));
      actions.querySelector('[data-next]').addEventListener('click', () => ctx.next());

      function pick(k) {
        if (answered || !opts[k]) return;
        answered = true;
        const chosen = opts[k];
        const correct = !!chosen.correct;
        ctx.answer(correct);

        buttons.forEach((b, i) => {
          const o = opts[i];
          b.disabled = true;
          b.classList.add(o.correct ? 'is-correct' : 'is-wrong');
          if (i === k) b.classList.add('picked');
          const why = b.querySelector('.opt-why');
          why.innerHTML = o.correct
            ? '<span class="tag ok">最佳回答</span>'
            : `<span class="tag trap">${esc(o.trap || '有坑')}</span> ${fmt(o.why || '')}`;
          why.hidden = false;
        });

        if (correct) Pets.playClaude(figure, 'jumping', 2, 'idle');
        else Pets.playClaude(figure, 'failed', 1, 'review');

        fb.innerHTML = `
          <div class="fb-head ${correct ? 'ok' : 'bad'}"><span class="fb-pet"></span><div>
            <strong>${correct ? '答对了！' : `踩坑了：${esc(chosen.trap || '不是最好的回答')}`}</strong>
            <p>${correct ? '面试时就这样一句话收住。' : '每个选项下面写了坑在哪。这题会更早再出现。'}</p>
          </div></div>
          <div class="ref"><span class="ref-label">参考答案</span><p>${fmt(q.answer || best.text)}</p></div>
          ${q.note ? `<p class="note">${fmt(q.note)}</p>` : ''}
          ${sourceHTML(q)}`;
        fb.hidden = false;
        ctx.react(correct, fb.querySelector('.fb-pet'));
        actions.hidden = false;
        const nextBtn = actions.querySelector('button');
        nextBtn.focus({ preventScroll: true });
        nextBtn.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }

      ctx.setKeys((e) => {
        if (!answered && /^[1-9]$/.test(e.key)) {
          pick(Number(e.key) - 1);
        } else if (answered && e.key === 'Enter' && !(e.target.closest && e.target.closest('button'))) {
          ctx.next();
        }
      });
    },
  };
})();
