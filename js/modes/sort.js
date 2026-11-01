// 玩法：骨架排序。把打乱的卡片排成正确顺序。
// 操作：鼠标拖整张卡；手机按住左边把手拖；或者先点一张、再点另一张互换；键盘上下键移动。
(function () {
  'use strict';
  const { fmt, shuffle, sourceHTML, reducedMotion } = Util;

  Modes.sort = {
    label: '骨架排序',
    seconds: 75,

    render(q, ctx) {
      const n = q.items.length;
      let order = shuffle([...Array(n).keys()]);
      for (let k = 0; k < 10 && order.every((v, i) => v === i); k++) order = shuffle(order);

      const root = Util.el(`
        <div class="q q-sort">
          <span class="qtype">骨架排序</span>
          <h2 class="prompt">${fmt(q.prompt)}</h2>
          <p class="hint">按住卡片左边的 <span class="grip-demo" aria-hidden="true"></span> 拖动；也可以先点一张、再点另一张，两张互换。</p>
          <ol class="sort-list" aria-label="可排序的卡片，用上下方向键移动"></ol>
          <div class="feedback" aria-live="polite" hidden></div>
          <div class="actions"></div>
        </div>`);
      ctx.host.appendChild(root);

      const list = root.querySelector('.sort-list');
      const fb = root.querySelector('.feedback');
      const actions = root.querySelector('.actions');
      let answered = false;
      let done = false;
      let selected = null;
      let drag = null;

      list.innerHTML = order
        .map((i) => `<li class="sort-card" tabindex="0" data-idx="${i}"><span class="grip" aria-hidden="true"></span><span class="pos"></span><span class="txt">${fmt(q.items[i])}</span></li>`)
        .join('');

      const cards = () => [...list.querySelectorAll('.sort-card')];
      const renumber = () => cards().forEach((c, i) => (c.querySelector('.pos').textContent = i + 1));
      renumber();

      // ---------- 按钮 ----------
      function setActions(stage) {
        if (stage === 'done') {
          actions.innerHTML = '<button type="button" class="btn primary" data-act="next">下一题 →</button>';
        } else if (stage === 'retry') {
          actions.innerHTML = '<button type="button" class="btn primary" data-act="check">再检查一次</button><button type="button" class="btn" data-act="reveal">看答案</button>';
        } else {
          actions.innerHTML = '<button type="button" class="btn primary" data-act="check">检查顺序</button>';
        }
      }
      setActions('sorting');
      actions.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.dataset.act === 'check') check();
        else if (b.dataset.act === 'reveal') reveal();
        else if (b.dataset.act === 'next') ctx.next();
      });

      // ---------- 检查 ----------
      function clearMarks() {
        cards().forEach((c) => c.classList.remove('ok', 'bad', 'shake'));
      }

      function check() {
        deselect();
        let wrong = 0;
        cards().forEach((c, i) => {
          const ok = Number(c.dataset.idx) === i;
          c.classList.toggle('ok', ok);
          c.classList.toggle('bad', !ok);
          c.classList.remove('shake');
          if (!ok) {
            wrong += 1;
            void c.offsetWidth; // 让抖动动画能重复播放
            c.classList.add('shake');
          }
        });
        const correct = wrong === 0;
        const first = !answered;
        if (first) {
          answered = true;
          ctx.answer(correct);
        }
        if (correct) {
          finish(first ? 'perfect' : 'fixed');
        } else {
          fb.innerHTML = `<div class="fb-head bad"><span class="fb-pet"></span><div><strong>有 ${wrong} 张位置不对</strong><p>标红的卡片需要挪一挪。调整后再检查，或者直接看答案。</p></div></div>`;
          fb.hidden = false;
          if (first) ctx.react(false, fb.querySelector('.fb-pet'));
          setActions('retry');
        }
      }

      function reveal() {
        if (!answered) {
          answered = true;
          ctx.answer(false);
        }
        flip(() => cards().sort((a, b) => a.dataset.idx - b.dataset.idx).forEach((c) => list.appendChild(c)));
        renumber();
        cards().forEach((c) => {
          c.classList.remove('bad', 'shake');
          c.classList.add('ok');
        });
        finish('revealed');
      }

      function finish(how) {
        done = true;
        deselect();
        list.classList.add('locked');
        cards().forEach((c) => c.removeAttribute('tabindex'));
        const head = {
          perfect: ['ok', '顺序全对！', '骨架已经顺了，过几天再考你一次。'],
          fixed: ['ok', '这次排对了', '第一次没排对，这题会更早再出现。'],
          revealed: ['bad', '正确顺序如上', '这题会更早再出现，下次再试。'],
        }[how];
        fb.innerHTML = `
          <div class="fb-head ${head[0]}"><span class="fb-pet"></span><div><strong>${head[1]}</strong><p>${head[2]}</p></div></div>
          <div class="ref"><span class="ref-label">骨架</span><p>${fmt(q.answer || q.items.join(' → '))}</p></div>
          ${q.note ? `<p class="note">${fmt(q.note)}</p>` : ''}
          ${sourceHTML(q)}`;
        fb.hidden = false;
        ctx.react(how !== 'revealed', fb.querySelector('.fb-pet'));
        setActions('done');
        const nextBtn = actions.querySelector('button');
        nextBtn.focus({ preventScroll: true });
        nextBtn.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }

      function changed() {
        renumber();
        clearMarks();
        if (answered && !done) fb.hidden = true;
      }

      // ---------- 动画：卡片换位时平滑移动 ----------
      function flip(mutate) {
        const moving = [...list.children].filter((c) => !(drag && c === drag.card));
        if (reducedMotion()) return mutate();
        const before = new Map(moving.map((c) => [c, c.getBoundingClientRect().top]));
        mutate();
        const listTop = list.getBoundingClientRect().top;
        moving.forEach((c) => {
          const dy = before.get(c) - (listTop + c.offsetTop);
          if (!dy) return;
          c.style.transition = 'none';
          c.style.transform = `translateY(${dy}px)`;
          void c.offsetWidth;
          c.style.transition = 'transform 160ms ease';
          c.style.transform = '';
        });
      }

      // ---------- 点选互换 ----------
      function deselect() {
        if (selected) selected.classList.remove('selected');
        selected = null;
      }

      function swap(a, b) {
        const an = a.nextSibling;
        const bn = b.nextSibling;
        if (an === b) list.insertBefore(b, a);
        else if (bn === a) list.insertBefore(a, b);
        else {
          list.insertBefore(a, bn);
          list.insertBefore(b, an);
        }
      }

      function tap(card) {
        if (done) return;
        if (!selected) {
          selected = card;
          card.classList.add('selected');
          return;
        }
        if (selected === card) return deselect();
        const a = selected;
        deselect();
        flip(() => swap(a, card));
        changed();
      }

      // ---------- 拖动 ----------
      list.addEventListener('pointerdown', (e) => {
        if (done || drag) return;
        const card = e.target.closest('.sort-card');
        if (!card) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const canDrag = e.pointerType === 'mouse' || !!e.target.closest('.grip');
        drag = { card, id: e.pointerId, x: e.clientX, y: e.clientY, lastY: e.clientY, canDrag, active: false };
        if (canDrag) {
          card.setPointerCapture(e.pointerId);
          e.preventDefault();
        }
      });

      list.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.active) {
          if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
          if (!drag.canDrag) {
            drag = null; // 手指在卡片正文上滑动：交给页面滚动
            return;
          }
          startDrag();
        }
        e.preventDefault();
        drag.lastY = e.clientY;
        place();
      });

      list.addEventListener('pointerup', (e) => {
        if (drag && e.pointerId === drag.id) endDrag(false);
      });
      list.addEventListener('pointercancel', (e) => {
        if (drag && e.pointerId === drag.id) endDrag(true);
      });

      function startDrag() {
        const { card } = drag;
        const r = card.getBoundingClientRect();
        deselect();
        clearMarks();
        const ph = document.createElement('li');
        ph.className = 'sort-ph';
        ph.style.height = r.height + 'px';
        list.insertBefore(ph, card);
        Object.assign(card.style, {
          position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', zIndex: 50, transition: 'none', transform: '',
        });
        card.classList.add('dragging');
        Object.assign(drag, { ph, top0: r.top, active: true });
        autoScroll();
      }

      // 根据手指 / 鼠标的位置，把占位块挪到对应位置
      function place() {
        const { card, ph, lastY } = drag;
        card.style.top = drag.top0 + (lastY - drag.y) + 'px';
        const listTop = list.getBoundingClientRect().top;
        let before = null;
        for (const c of list.children) {
          if (c === card || c === ph) continue;
          if (lastY < listTop + c.offsetTop + c.offsetHeight / 2) {
            before = c;
            break;
          }
        }
        let cur = ph.nextElementSibling;
        if (cur === card) cur = cur.nextElementSibling;
        if (before !== cur) flip(() => list.insertBefore(ph, before));
      }

      // 拖到屏幕上下边缘时自动滚动
      function autoScroll() {
        if (!drag || !drag.active) return;
        const edge = 70;
        const y = drag.lastY;
        let step = 0;
        if (y < edge) step = -Math.ceil((edge - y) / 6);
        else if (y > window.innerHeight - edge) step = Math.ceil((y - (window.innerHeight - edge)) / 6);
        if (step) {
          window.scrollBy(0, step);
          place();
        }
        requestAnimationFrame(autoScroll);
      }

      function endDrag(cancelled) {
        const d = drag;
        drag = null;
        if (!d.active) {
          if (!cancelled) tap(d.card);
          return;
        }
        const { card, ph } = d;
        const from = card.getBoundingClientRect().top;
        list.insertBefore(card, ph);
        ph.remove();
        card.classList.remove('dragging');
        card.removeAttribute('style');
        if (!reducedMotion()) {
          const to = card.getBoundingClientRect().top;
          card.style.transform = `translateY(${from - to}px)`;
          void card.offsetWidth;
          card.style.transition = 'transform 140ms ease';
          card.style.transform = '';
        }
        changed();
      }

      // ---------- 键盘 ----------
      list.addEventListener('keydown', (e) => {
        const card = e.target.closest('.sort-card');
        if (!card || done) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const up = e.key === 'ArrowUp';
          const sib = up ? card.previousElementSibling : card.nextElementSibling;
          if (!sib) return;
          deselect();
          flip(() => (up ? list.insertBefore(card, sib) : list.insertBefore(sib, card)));
          card.focus();
          changed();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tap(card);
        }
      });

      ctx.setKeys((e) => {
        if (e.key === 'Enter' && done && !(e.target.closest && e.target.closest('button'))) ctx.next();
      });
    },
  };
})();
