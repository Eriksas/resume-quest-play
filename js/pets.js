// 两个角色：大肥鱼（学习搭子，动图）和 Claude 小姐（追问环节的面试官，精灵图）。
// 素材缺失或在设置里关掉时，游戏照常能玩，只是不显示角色。署名见 CREDITS.md。
(function () {
  'use strict';

  const FISH_DIR = 'assets/pets/dafeiyu/';
  const SHEET = 'assets/pets/claude-chan/spritesheet.webp';

  // Claude 小姐的精灵图：8 列 × 11 行，每格 192×208。用百分比定位，显示多大都对得上。
  const COLS = 8;
  const ROWS = 11;
  const CLIPS = {
    idle: { row: 0, frames: 6, ms: 260 },
    waving: { row: 3, frames: 4, ms: 180 },
    jumping: { row: 4, frames: 5, ms: 130 },
    failed: { row: 5, frames: 8, ms: 160 },
    waiting: { row: 6, frames: 6, ms: 200 },
    review: { row: 8, frames: 6, ms: 180 },
  };

  let fishOK = true;
  let claudeOK = null; // null = 还在加载

  const enabled = () => Store.settings().pets !== false;

  const sheet = new Image();
  sheet.onload = () => { claudeOK = true; };
  sheet.onerror = () => {
    claudeOK = false;
    document.querySelectorAll('.claude').forEach((e) => e.replaceWith(avatar()));
    document.querySelectorAll('.claude-credit').forEach((e) => e.remove());
  };
  sheet.src = SHEET;

  // ---------- 大肥鱼 ----------
  const fishSrc = (clip) => FISH_DIR + clip + (Util.reducedMotion() ? '-still' : '') + '.webp';

  function fish(clip, cls) {
    if (!enabled() || !fishOK) return null;
    const wrap = document.createElement('span');
    wrap.className = 'pet-fish' + (cls ? ' ' + cls : '');
    wrap.dataset.clip = clip || 'idle';
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    img.src = fishSrc(clip || 'idle');
    img.onerror = () => {
      fishOK = false;
      wrap.remove();
    };
    wrap.appendChild(img);
    return wrap;
  }

  // 换动作；给了 back 就在 ms 毫秒后切回 back
  function setFish(wrap, clip, back, ms) {
    if (!wrap) return;
    const img = wrap.querySelector('img');
    if (!img) return;
    clearTimeout(wrap._back);
    if (wrap.dataset.clip !== clip) {
      img.src = fishSrc(clip);
      wrap.dataset.clip = clip;
    }
    if (back) wrap._back = setTimeout(() => wrap.isConnected && setFish(wrap, back), ms || 3000);
  }

  // ---------- Claude 小姐 ----------
  function avatar() {
    const d = document.createElement('div');
    d.className = 'avatar';
    d.setAttribute('aria-hidden', 'true');
    d.textContent = '问';
    return d;
  }

  function claude(clip) {
    if (!enabled() || claudeOK === false) return avatar();
    const el = document.createElement('div');
    el.className = 'claude';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', '面试官 Claude 小姐');
    playClaude(el, clip || 'idle');
    return el;
  }

  function showFrame(el, row, col) {
    el.style.backgroundPosition = `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
  }

  // 播放一段动作；times 次后切到 then（默认 idle 循环）
  function playClaude(el, clip, times, then) {
    if (!el || !el.classList || !el.classList.contains('claude')) return;
    const c = CLIPS[clip] || CLIPS.idle;
    clearInterval(el._timer);
    let frame = 0;
    let loops = 0;
    showFrame(el, c.row, 0);
    if (Util.reducedMotion()) return;
    el._timer = setInterval(() => {
      if (el.isConnected) el._seen = true;
      else if (el._seen) return clearInterval(el._timer); // 已经离开页面
      frame += 1;
      if (frame >= c.frames) {
        frame = 0;
        loops += 1;
        if (times && loops >= times) return playClaude(el, then || 'idle');
      }
      showFrame(el, c.row, frame);
    }, c.ms);
  }

  // 大肥鱼的碎碎念：都是材料里的答题原则
  const TIPS = [
    '先背骨架，再背全文。',
    '被打断时，答完追问直接跳到“结果”收尾。',
    '讲不清的词，就别主动说。',
    '别的数字记不准，就说“我讲一下思路”。',
    '追问一句话收住，不往深处挖。',
    '“按假设的成本和毛利”这句不要省。',
  ];
  const tip = () => TIPS[Math.floor(Math.random() * TIPS.length)];

  // 精灵图没加载成功（比如在线版没带这张图）时，署名里也不提 Claude 小姐
  const hasClaude = () => claudeOK !== false;

  window.Pets = { fish, setFish, claude, playClaude, avatar, tip, enabled, hasClaude };
})();
