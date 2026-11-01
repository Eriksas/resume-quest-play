// 玩法：数字配对。点左边的数字，再点右边对应的意思（反过来点也行）。
(function () {
  'use strict';
  const { fmt, shuffle, sourceHTML, reducedMotion } = Util;

  Modes.match = {
    label: '数字配对',
    seconds: 50,

    render(q, ctx) {
      const n = q.pairs.length;
      const leftOrder = shuffle([...Array(n).keys()]);
      let rightOrder = shuffle([...Array(n).keys()]);
      for (let k = 0; k < 10 && rightOrder.every((v, i) => v === leftOrder[i]); k++) rightOrder = shuffle(rightOrder);

      const item = (side, i, text) =>
        `<button type="button" class="match-item ${side}" data-i="${i}"><span class="mbadge" aria-hidden="true"></span><span class="mtext">${fmt(text)}</span></button>`;

      const root = Util.el(`
        <div class="q q-match">
          <span class="qtype">数字配对</span>
          <h2 class="prompt">${fmt(q.prompt)}</h2>
          <p class="hint">先点左边的数字，再点右边对应的意思（反过来点也行）。配错可以接着配，但这题就不算全对。</p>
          <div class="match-grid">
            <div class="match-col" aria-label="数字">${leftOrder.map((i) => item('left', i, q.pairs[i].left)).join('')}</div>
            <div class="match-col" aria-label="含义">${rightOrder.map((i) => item('right', i, q.pairs[i].right)).join('')}</div>
          </div>
          <div class="feedback" aria-live="polite" hidden></div>
          <div class="actions" hidden><button type="button" class="btn primary" data-next>下一题 →</button></div>
        </div>`);
      ctx.host.appendChild(root);

      const fb = root.querySelector('.feedback');
      const actions = root.querySelector('.actions');
      let selL = null;
      let selR = null;
      let mistakes = 0;
      let matched = 0;
      let done = false;

      root.querySelector('.match-grid').addEventListener('click', (e) => {
        const b = e.target.closest('.match-item');
        if (!b || done || b.classList.contains('matched')) return;
        const isLeft = b.classList.contains('left');
        const current = isLeft ? selL : selR;
        if (current) current.classList.remove('selected');
        if (current === b) {
          if (isLeft) selL = null;
          else selR = null;
          return;
        }
        b.classList.add('selected');
        if (isLeft) selL = b;
        else selR = b;
        if (selL && selR) tryPair();
      });

      function tryPair() {
        const a = selL;
        const b = selR;
        selL = null;
        selR = null;
        a.classList.remove('selected');
        b.classList.remove('selected');
        if (a.dataset.i === b.dataset.i) {
          matched += 1;
          [a, b].forEach((x) => {
            x.classList.add('matched');
            x.setAttribute('aria-disabled', 'true');
            x.querySelector('.mbadge').textContent = matched;
          });
          if (matched === n) finish();
        } else {
          mistakes += 1;
          [a, b].forEach((x) => {
            x.classList.remove('wrong');
            void x.offsetWidth;
            x.classList.add('wrong');
            setTimeout(() => x.classList.remove('wrong'), 650);
          });
        }
      }

      function finish() {
        done = true;
        const correct = mistakes === 0;
        ctx.answer(correct);
        fb.innerHTML = `
          <div class="fb-head ${correct ? 'ok' : 'bad'}"><span class="fb-pet"></span><div>
            <strong>${correct ? '全部配对正确！' : `配错了 ${mistakes} 次`}</strong>
            <p>${correct ? '这几个数字记牢了。' : '这题会更早再出现，先对一遍下面的表。'}</p>
          </div></div>
          <div class="ref"><span class="ref-label">对照</span>
            <ul class="pair-list">${q.pairs.map((p) => `<li><span class="pl">${fmt(p.left)}</span><span class="pr">${fmt(p.right)}</span></li>`).join('')}</ul>
          </div>
          ${q.note ? `<p class="note">${fmt(q.note)}</p>` : ''}
          ${sourceHTML(q)}`;
        fb.hidden = false;
        ctx.react(correct, fb.querySelector('.fb-pet'));
        actions.hidden = false;
        const nextBtn = actions.querySelector('button');
        nextBtn.addEventListener('click', () => ctx.next());
        nextBtn.focus({ preventScroll: true });
        nextBtn.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }

      ctx.setKeys((e) => {
        if (e.key === 'Enter' && done && !(e.target.closest && e.target.closest('button'))) ctx.next();
      });
    },
  };
})();
