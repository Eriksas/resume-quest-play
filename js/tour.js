// 播放讲解：按数据文件里每节讲解的 tour 步骤，自动拖滑块、点按钮、滚到对应的图，配一句解说。
// 播放中碰一下动画就暂停，可以自己接着拖；点“从头”会把动画恢复到初始状态再播。
//
// 一步的写法（都在 data/ 里的讲解 tour 数组中）：
//   { say: '解说', set: { '滑块标签': 目标值 }, click: '按钮文字' 或 ['按钮1', '按钮2'],
//     check: { '勾选框文字': true }, look: '图的名字', ms: 滑动用时, wait: 停留毫秒 }
// 控件按页面上看得到的文字找（包含即可）；look 找图的 aria-label 或小标题。
(function () {
  'use strict';

  const norm = (s) => String(s || '').replace(/\s+/g, '');
  const has = (text, key) => norm(text).indexOf(norm(key)) !== -1;

  const shown = (el) => !el.closest('[hidden]');
  // 先找文字完全一样的，再找包含的（比如“学习率”和“学习率 ν”）
  function pick(list, textOf, key) {
    return list.find((x) => norm(textOf(x)) === norm(key)) || list.find((x) => has(textOf(x), key)) || null;
  }
  function findSlider(host, label) {
    const w = pick([...host.querySelectorAll('.lab-slider')].filter(shown), (x) => x.querySelector('span').textContent, label);
    return w ? { wrap: w, input: w.querySelector('input') } : null;
  }
  function findButton(host, text) {
    return pick([...host.querySelectorAll('button')].filter(shown), (b) => b.textContent, text);
  }
  function findCheck(host, label) {
    const w = pick([...host.querySelectorAll('.lab-check')].filter(shown), (x) => x.textContent, label);
    return w ? { wrap: w, input: w.querySelector('input') } : null;
  }
  function findView(host, label) {
    const svg = [...host.querySelectorAll('svg[aria-label]')].find((s) => !s.closest('[hidden]') && has(s.getAttribute('aria-label'), label));
    if (svg) return svg;
    return [...host.querySelectorAll('h3, .lab-caption, table, .lab-readout, .lab-note')].find((e) => !e.closest('[hidden]') && has(e.textContent, label)) || null;
  }
  // 控件后面最近的一张图：动了这个控件，通常就是这张图在变
  function viewAfter(host, el) {
    return [...host.querySelectorAll('svg')].find((s) => !s.closest('[hidden]') && s.closest('.lab-legend') === null && (el.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING)) || null;
  }
  // 播放条吸在顶上，被它挡住的部分不算看得见
  let topEdge = () => 70;
  function visible(el) {
    const r = el.getBoundingClientRect();
    return r.top >= topEdge() && r.bottom <= innerHeight - 10;
  }
  function scrollToView(el) {
    if (!el || visible(el)) return;
    const r = el.getBoundingClientRect();
    const room = innerHeight - topEdge();
    // 放得下就让它整个露出来（顶部留出播放条的位置），放不下就对齐到播放条下面
    const scroller = el.closest('.sheet-backdrop');
    const dy = r.height <= room ? r.top - topEdge() - (room - r.height) / 2 : r.top - topEdge() - 8;
    const behavior = Util.reducedMotion() ? 'auto' : 'smooth';
    if (scroller) scroller.scrollBy({ top: dy, behavior });
    else window.scrollBy({ top: dy, behavior });
  }
  function flash(el) {
    if (!el) return;
    el.classList.remove('tour-focus');
    void el.offsetWidth;
    el.classList.add('tour-focus');
    setTimeout(() => el.classList.remove('tour-focus'), 1600);
  }
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

  function create(bar, host, lesson) {
    const steps = lesson.tour;
    const fast = { on: false };
    let state = 'idle'; // idle | playing | paused | done
    let i = 0;
    let token = 0; // 每次开始 / 暂停都换一个，旧的循环发现对不上就停
    let resumers = []; // 暂停时卡住的等待，继续时一起放行
    const missing = [];

    const total = Math.round(steps.reduce((s, st) => s + dwell(st) + (st.set ? st.ms || 1800 : 0), 0) / 1000);
    bar.innerHTML = `
      <div class="tour-row">
        <button type="button" class="btn primary small" data-t="play">▶ 播放讲解（约 ${total} 秒）</button>
        <button type="button" class="btn small" data-t="next" hidden>下一步 ⏭</button>
        <button type="button" class="btn ghost small" data-t="restart" hidden>↺ 从头</button>
        <span class="tour-dots" aria-hidden="true">${steps.map(() => '<i></i>').join('')}</span>
      </div>
      <div class="tour-say" hidden><span class="tour-fish" data-fish></span><div><p data-say></p><p class="tour-doing muted small" data-doing></p></div></div>`;
    const $ = (s) => bar.querySelector(s);
    topEdge = () => (bar.classList.contains('on') ? Math.max(70, bar.getBoundingClientRect().bottom + 8) : 70);
    const fishSlot = $('[data-fish]');
    const fish = Pets.fish('idle', 'fish-xs');
    if (fish) fishSlot.appendChild(fish);
    else fishSlot.remove();

    function dwell(st) {
      if (st.wait != null) return st.wait;
      return Math.max(2600, Math.min(7000, norm(st.say).length * 130));
    }
    function sleep(ms, t) {
      return new Promise((resolve) => {
        if (fast.on) return resolve();
        const end = Date.now() + ms;
        const tick = () => {
          if (t !== token || !host.isConnected) return resolve();
          if (state === 'paused') { resumers.push(tick); return; }
          if (Date.now() >= end) return resolve();
          setTimeout(tick, 60);
        };
        tick();
      });
    }
    async function tween(input, to, ms, t) {
      const min = Number(input.min);
      const max = Number(input.max);
      const target = Math.max(min, Math.min(max, Number(to)));
      const from = Number(input.value);
      if (fast.on || Util.reducedMotion() || from === target) {
        input.value = target;
        fire(input, 'input');
        return;
      }
      const frames = Math.max(4, Math.min(30, Math.round(ms / 90)));
      for (let f = 1; f <= frames; f++) {
        if (t !== token || !host.isConnected) return;
        const k = f / frames;
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const v = from + (target - from) * e;
        if (String(input.value) !== String(v)) {
          input.value = v;
          fire(input, 'input');
        }
        await sleep(ms / frames, t);
      }
      input.value = target;
      fire(input, 'input');
    }

    function paint() {
      $('[data-t="play"]').textContent = state === 'playing' ? '⏸ 暂停' : state === 'paused' ? '▶ 继续' : state === 'done' ? '↺ 再看一遍' : `▶ 播放讲解（约 ${total} 秒）`;
      $('[data-t="next"]').hidden = state !== 'playing' && state !== 'paused';
      $('[data-t="restart"]').hidden = state !== 'paused';
      $('.tour-say').hidden = state === 'idle';
      bar.classList.toggle('on', state === 'playing' || state === 'paused');
      bar.querySelectorAll('.tour-dots i').forEach((d, k) => {
        d.className = k < i ? 'done' : k === i && state !== 'done' && state !== 'idle' ? 'now' : '';
      });
    }
    function say(text, doing) {
      $('[data-say]').innerHTML = Util.fmt(text || '');
      $('[data-doing]').textContent = doing || '';
    }

    // 一步里的动作按写的先后顺序做：比如先切标签页再拖滑块，或者先拖滑块再按按钮
    async function runStep(st, t) {
      say(st.say, '');
      if (fish) Pets.setFish(fish, 'happy', 'idle', 1600);
      const doing = [];
      const n = i + 1;
      for (const key of Object.keys(st)) {
        if (t !== token) return;
        if (key === 'look') {
          const v = findView(host, st.look);
          if (v) scrollToView(v);
          else missing.push(`第 ${n} 步：图“${st.look}”`);
          await sleep(450, t);
        } else if (key === 'click') {
          for (const c of [].concat(st.click)) {
            if (t !== token) return;
            const btn = findButton(host, c);
            if (!btn) { missing.push(`第 ${n} 步：按钮“${c}”`); continue; }
            if (!visible(btn)) { scrollToView(btn); await sleep(450, t); }
            flash(btn);
            doing.push(`点了“${c}”`);
            say(st.say, doing.join('，'));
            await sleep(500, t);
            btn.click();
            await sleep(350, t);
            // 点完再找图：切换标签页之后，要看的是新出现的那张
            if (!('look' in st)) scrollToView(viewAfter(host, btn));
          }
        } else if (key === 'check') {
          for (const [k, v] of Object.entries(st.check)) {
            const c = findCheck(host, k);
            if (!c) { missing.push(`第 ${n} 步：勾选框“${k}”`); continue; }
            flash(c.wrap);
            if (c.input.checked !== !!v) {
              c.input.checked = !!v;
              fire(c.input, 'change');
            }
            doing.push(`${v ? '勾上' : '取消'}“${k}”`);
            say(st.say, doing.join('，'));
            await sleep(450, t);
          }
          if (!('look' in st)) {
            const first = findCheck(host, Object.keys(st.check)[0]);
            if (first) scrollToView(viewAfter(host, first.wrap));
          }
        } else if (key === 'set') {
          const found = Object.entries(st.set).map(([k, v]) => [k, v, findSlider(host, k)]);
          found.forEach(([k, , s]) => { if (!s) missing.push(`第 ${n} 步：滑块“${k}”`); });
          const ok = found.filter((x) => x[2]);
          if (!ok.length) continue;
          if (!('look' in st)) scrollToView(viewAfter(host, ok[0][2].wrap) || ok[0][2].wrap);
          ok.forEach(([, , s]) => s.wrap.classList.add('tour-active'));
          const show = () => ok.map(([k, , s]) => `${k} → ${s.wrap.querySelector('output').textContent}`).join('，');
          let live = true;
          const ticker = (async () => {
            while (live && t === token) {
              say(st.say, doing.concat(show()).join('，'));
              await sleep(120, t);
              if (fast.on) break;
            }
          })();
          await Promise.all(ok.map(([, v, s]) => tween(s.input, v, st.ms || 1800, t)));
          live = false;
          await ticker;
          ok.forEach(([, , s]) => s.wrap.classList.remove('tour-active'));
          doing.push(show());
        }
      }
      say(st.say, doing.join('，'));
      await sleep(dwell(st), t);
    }

    async function loop(t) {
      while (t === token && i < steps.length) {
        if (!host.isConnected) return;
        paint();
        await runStep(steps[i], t);
        if (t !== token) return;
        i += 1;
      }
      if (t === token && host.isConnected) {
        state = 'done';
        say(steps.length ? '演示完了。现在自己拖拖看，或者点“再看一遍”。' : '', '');
        if (fish) Pets.setFish(fish, 'celebrate', 'idle', 2600);
        paint();
      }
    }
    async function start() {
      token += 1;
      const t = token;
      i = 0;
      state = 'playing';
      flush();
      paint();
      say('准备一下……', '');
      bar.scrollIntoView({ behavior: Util.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      await Labs.mount(lesson.lab, host);
      if (t !== token) return;
      await sleep(500, t);
      loop(t);
    }
    function pause() {
      if (state !== 'playing') return;
      state = 'paused';
      paint();
      $('[data-doing]').textContent = '已暂停。可以自己拖，点“继续”接着播。';
    }
    function play() {
      if (state === 'idle' || state === 'done') return start();
      if (state === 'playing') return pause();
      state = 'playing';
      paint();
      flush();
    }
    // 放行所有卡住的等待（换了 token 的会直接结束）
    function flush() {
      const rs = resumers;
      resumers = [];
      rs.forEach((r) => r());
    }
    function next() {
      // 跳过当前步剩下的等待：换 token 让旧循环停下，从下一步接着播
      if (state !== 'playing' && state !== 'paused') return;
      token += 1;
      const t = token;
      state = 'playing';
      flush();
      i = Math.min(i + 1, steps.length);
      loop(t);
    }

    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      if (b.dataset.t === 'play') play();
      if (b.dataset.t === 'next') next();
      if (b.dataset.t === 'restart') start();
    });
    // 自己动手就暂停
    const userTouch = (e) => {
      if (e.isTrusted && state === 'playing') pause();
    };
    host.addEventListener('pointerdown', userTouch, true);
    host.addEventListener('keydown', userTouch, true);

    // 测试用：不等待，直接跑完所有步骤，返回找不到的控件
    async function selfTest(onStep) {
      fast.on = true;
      token += 1;
      const t = token;
      await Labs.mount(lesson.lab, host);
      missing.length = 0;
      for (i = 0; i < steps.length; i++) {
        await runStep(steps[i], t);
        if (onStep) await onStep(i, host);
      }
      fast.on = false;
      state = 'done';
      paint();
      return missing.slice();
    }

    paint();
    return { play, pause, next, start, selfTest, get state() { return state; } };
  }

  window.Tour = {
    // 在讲解卡片里放一条播放条；没有 tour 的讲解不显示
    attach(bar, host, lesson) {
      if (!bar || !host || !lesson || !lesson.lab || !lesson.tour || !lesson.tour.length) {
        if (bar) bar.remove();
        return null;
      }
      const p = create(bar, host, lesson);
      bar._tour = p;
      return p;
    },
  };
})();
