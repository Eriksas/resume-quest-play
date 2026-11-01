// 互动讲解的工具箱：SVG 画图、控件、随机数、示例数据，以及各讲解共用的小算法。
// 每个讲解在 js/labs/<名字>.js 里用 Labs.register 注册，第一次打开时才加载。
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const K = {};

  // ---------- DOM ----------
  K.s = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  K.h = (html, parent) => {
    const e = Util.el(html);
    if (parent) parent.appendChild(e);
    return e;
  };
  K.clear = (g) => { while (g.firstChild) g.removeChild(g.firstChild); };
  K.alive = (host) => host.isConnected;

  // ---------- 数学 ----------
  K.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  K.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  K.gauss = (r) => {
    let u = 0;
    let v = 0;
    while (!u) u = r();
    while (!v) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  K.mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  K.fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  K.pct = (v, d = 0) => (Number.isFinite(v) ? (v * 100).toFixed(d) + '%' : '—');
  K.sigmoid = (z) => 1 / (1 + Math.exp(-z));

  // ---------- 颜色（类别色按固定顺序，超过 3 类时再加形状区分） ----------
  K.color = (i) => `var(--series-${(i % 6) + 1})`;
  K.SHAPES = ['circle', 'square', 'triangle', 'diamond', 'circle', 'square'];

  // ---------- 坐标图 ----------
  K.plot = (host, opt) => {
    const W = opt.w || 480;
    const H = opt.h || 320;
    const P = Object.assign({ l: 40, r: 12, t: 12, b: 32 }, opt.pad || {});
    const svg = K.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lab-svg', role: 'img', 'aria-label': opt.label || '图' });
    host.appendChild(svg);
    const [x0, x1] = opt.x;
    const [y0, y1] = opt.y;
    const sx = (v) => P.l + ((v - x0) / (x1 - x0)) * (W - P.l - P.r);
    const sy = (v) => H - P.b - ((v - y0) / (y1 - y0)) * (H - P.t - P.b);
    const ix = (px) => x0 + ((px - P.l) / (W - P.l - P.r)) * (x1 - x0);
    const iy = (py) => y0 + ((H - P.b - py) / (H - P.t - P.b)) * (y1 - y0);
    const clipId = 'clip' + Math.random().toString(36).slice(2, 9);
    const defs = K.s('defs', null, svg);
    const cp = K.s('clipPath', { id: clipId }, defs);
    K.s('rect', { x: P.l, y: P.t, width: W - P.l - P.r, height: H - P.t - P.b }, cp);
    const p = { svg, W, H, P, sx, sy, ix, iy, x: opt.x, y: opt.y, clip: `url(#${clipId})` };
    p.layer = (name, clipped) => K.s('g', { class: 'layer-' + name, 'clip-path': clipped ? p.clip : null }, svg);
    p.toData = (evt) => {
      const pt = svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      const q = pt.matrixTransform(svg.getScreenCTM().inverse());
      return { x: ix(q.x), y: iy(q.y), px: q.x, py: q.y };
    };
    p.inside = (d) => d.x >= x0 && d.x <= x1 && d.y >= y0 && d.y <= y1;
    if (opt.axes !== false) K.axes(p, opt);
    return p;
  };

  K.ticks = (a, b, n) => {
    const span = b - a;
    const step0 = span / Math.max(1, n);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || step0;
    const out = [];
    for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  };

  K.axes = (p, opt) => {
    const g = K.s('g', { class: 'axis' }, p.svg);
    const { P, W, H } = p;
    const xt = opt.xticks || K.ticks(p.x[0], p.x[1], opt.nx || 5);
    const yt = opt.yticks || K.ticks(p.y[0], p.y[1], opt.ny || 4);
    if (opt.grid !== false) {
      yt.forEach((v) => K.s('line', { x1: P.l, x2: W - P.r, y1: p.sy(v), y2: p.sy(v), class: 'gridline' }, g));
    }
    K.s('line', { x1: P.l, x2: W - P.r, y1: H - P.b, y2: H - P.b, class: 'axisline' }, g);
    K.s('line', { x1: P.l, x2: P.l, y1: P.t, y2: H - P.b, class: 'axisline' }, g);
    const fx = opt.fx || ((v) => String(v));
    const fy = opt.fy || ((v) => String(v));
    if (opt.xlabels !== false) xt.forEach((v) => K.s('text', { x: p.sx(v), y: H - P.b + 15, 'text-anchor': 'middle', class: 'tick' }, g).textContent = fx(v));
    if (opt.ylabels !== false) yt.forEach((v) => K.s('text', { x: P.l - 6, y: p.sy(v) + 4, 'text-anchor': 'end', class: 'tick' }, g).textContent = fy(v));
    if (opt.xlabel) K.s('text', { x: W - P.r, y: H - 4, 'text-anchor': 'end', class: 'axlabel' }, g).textContent = opt.xlabel;
    if (opt.ylabel) K.s('text', { x: P.l + 4, y: P.t + 10, class: 'axlabel' }, g).textContent = opt.ylabel;
    return g;
  };

  // 点：形状 + 颜色；返回元素
  K.marker = (g, shape, cx, cy, r, attrs) => {
    let e;
    if (shape === 'square') e = K.s('rect', { x: cx - r * 0.9, y: cy - r * 0.9, width: r * 1.8, height: r * 1.8, rx: 1.5 }, g);
    else if (shape === 'triangle') e = K.s('path', { d: `M${cx},${cy - r * 1.15}L${cx + r * 1.05},${cy + r * 0.8}L${cx - r * 1.05},${cy + r * 0.8}Z` }, g);
    else if (shape === 'diamond') e = K.s('path', { d: `M${cx},${cy - r * 1.2}L${cx + r * 1.2},${cy}L${cx},${cy + r * 1.2}L${cx - r * 1.2},${cy}Z` }, g);
    else if (shape === 'cross') e = K.s('path', { d: `M${cx - r},${cy - r}L${cx + r},${cy + r}M${cx + r},${cy - r}L${cx - r},${cy + r}`, 'stroke-width': 2.2, fill: 'none' }, g);
    else e = K.s('circle', { cx, cy, r }, g);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  };

  // 按类别画一组点。pts: [{x, y, c}]，c 为类别下标（-1 = 灰色）
  K.drawPoints = (g, p, pts, opt) => {
    K.clear(g);
    const o = Object.assign({ r: 5, shapes: false, hollow: null }, opt || {});
    return pts.map((d, i) => {
      const c = d.c == null ? 0 : d.c;
      const shape = o.shapes && c >= 0 ? K.SHAPES[c % 6] : 'circle';
      const col = c < 0 ? 'var(--muted)' : K.color(c);
      const hollow = o.hollow ? o.hollow(d, i) : false;
      return K.marker(g, shape, p.sx(d.x), p.sy(d.y), (o.size ? o.size(d, i) : o.r), {
        fill: hollow ? 'var(--surface)' : col,
        stroke: hollow ? col : 'var(--surface)',
        'stroke-width': hollow ? 2 : 1.5,
        class: 'pt',
        opacity: o.opacity ? o.opacity(d, i) : null,
      });
    });
  };

  // 决策区域：在 nx × ny 的网格上着色，fn(x, y) → { c, a }（类别和透明度）
  // 画在一张小画布上，再拉伸成一张图片，边界自然平滑，也没有格子缝
  const rgbCache = {};
  K.rgb = (c) => {
    const name = `--series-${(c % 6) + 1}`;
    const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!rgbCache[hex]) {
      const h = hex.replace('#', '');
      rgbCache[hex] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
    }
    return rgbCache[hex];
  };
  K.regions = (g, p, nx, ny) => {
    K.clear(g);
    const canvas = document.createElement('canvas');
    canvas.width = nx;
    canvas.height = ny;
    const ctx = canvas.getContext('2d');
    const img = K.s('image', { x: p.P.l, y: p.P.t, width: p.W - p.P.l - p.P.r, height: p.H - p.P.t - p.P.b, preserveAspectRatio: 'none' }, g);
    const cw = (p.W - p.P.l - p.P.r) / nx;
    const ch = (p.H - p.P.t - p.P.b) / ny;
    return {
      paint(fn) {
        const im = ctx.createImageData(nx, ny);
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            const v = fn(p.ix(p.P.l + (i + 0.5) * cw), p.iy(p.P.t + (j + 0.5) * ch));
            const o = (j * nx + i) * 4;
            if (!v || v.c == null || v.c < 0) continue;
            const [r, gg, b] = K.rgb(v.c);
            im.data[o] = r;
            im.data[o + 1] = gg;
            im.data[o + 2] = b;
            im.data[o + 3] = Math.round((v.a == null ? 0.16 : v.a) * 255);
          }
        }
        ctx.putImageData(im, 0, 0);
        img.setAttribute('href', canvas.toDataURL());
      },
    };
  };

  K.path = (g, pts, attrs) => K.s('path', Object.assign({ d: 'M' + pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L'), fill: 'none' }, attrs || {}), g);
  K.line = (g, x1, y1, x2, y2, attrs) => K.s('line', Object.assign({ x1, y1, x2, y2 }, attrs || {}), g);
  K.text = (g, x, y, str, attrs) => {
    const t = K.s('text', Object.assign({ x, y }, attrs || {}), g);
    t.textContent = str;
    return t;
  };

  // 拖动：el 是 SVG 元素，onMove 收到数据坐标
  K.drag = (el, p, onMove, onEnd) => {
    el.style.cursor = 'grab';
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const move = (ev) => onMove(p.toData(ev));
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        if (onEnd) onEnd();
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  };

  // ---------- 控件 ----------
  K.panel = (host) => K.h('<div class="lab"></div>', host);
  K.row = (host, cls) => K.h(`<div class="lab-controls ${cls || ''}"></div>`, host);

  K.slider = (parent, o) => {
    const show = (v) => (o.fmt ? o.fmt(v) : v);
    const w = K.h(`<label class="lab-slider"><span>${Util.esc(o.label)}</span><input type="range" min="${o.min}" max="${o.max}" step="${o.step || 1}" value="${o.value}"><output>${Util.esc(show(o.value))}</output></label>`, parent);
    const inp = w.querySelector('input');
    const out = w.querySelector('output');
    inp.addEventListener('input', () => {
      const v = Number(inp.value);
      out.textContent = show(v);
      if (o.onInput) o.onInput(v);
    });
    return {
      el: w,
      get value() { return Number(inp.value); },
      set(v, silent) {
        inp.value = v;
        out.textContent = show(Number(inp.value));
        if (!silent && o.onInput) o.onInput(Number(inp.value));
      },
    };
  };

  K.seg = (parent, options, value, onChange) => {
    const w = K.h(`<div class="seg" role="group">${options.map((op) => `<button type="button" data-v="${Util.esc(op.value)}" aria-pressed="${op.value === value}">${Util.esc(op.label)}</button>`).join('')}</div>`, parent);
    let cur = value;
    const api = {
      el: w,
      get value() { return cur; },
      set(v, silent) {
        cur = v;
        w.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
        if (!silent && onChange) onChange(v);
      },
    };
    w.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const op = options.find((x) => String(x.value) === b.dataset.v);
      api.set(op.value);
    });
    return api;
  };

  K.button = (parent, label, onClick, primary) => {
    const b = K.h(`<button type="button" class="btn small ${primary ? 'primary' : ''}">${Util.esc(label)}</button>`, parent);
    b.addEventListener('click', onClick);
    return b;
  };

  K.check = (parent, label, value, onChange) => {
    const w = K.h(`<label class="lab-check"><input type="checkbox" ${value ? 'checked' : ''}><span>${Util.esc(label)}</span></label>`, parent);
    const inp = w.querySelector('input');
    inp.addEventListener('change', () => onChange(inp.checked));
    return { el: w, get value() { return inp.checked; } };
  };

  // 读数：K.stats(host) → set([[标签, 值, 说明?], ...])
  K.stats = (parent) => {
    const w = K.h('<div class="lab-readout"></div>', parent);
    return {
      el: w,
      set(items) {
        w.innerHTML = items.map(([k, v, cls]) => `<div class="stat ${cls || ''}"><span>${Util.esc(k)}</span><b>${Util.esc(v)}</b></div>`).join('');
      },
    };
  };

  K.note = (parent, html, cls) => K.h(`<p class="lab-note ${cls || ''}">${html}</p>`, parent);
  K.caption = (parent, text) => K.h(`<p class="lab-caption">${Util.esc(text)}</p>`, parent);
  K.legend = (parent, items) => K.h(`<div class="lab-legend">${items.map(([label, c, shape]) => `<span><i class="sw ${shape || ''}" style="background:${typeof c === 'string' ? c : c < 0 ? 'var(--muted)' : K.color(c)}"></i>${Util.esc(label)}</span>`).join('')}</div>`, parent);

  // 动画循环：fn 返回 false 或页面离开时停止
  K.loop = (host, fn, ms) => {
    let t = null;
    const tick = () => {
      if (!host.isConnected || fn() === false) return clearInterval(t);
    };
    t = setInterval(tick, ms || 400);
    return { stop: () => clearInterval(t) };
  };

  // ---------- 示例数据 ----------
  K.data = {
    blobs(r, centers, n, sd) {
      const out = [];
      centers.forEach((c, k) => {
        for (let i = 0; i < n; i++) out.push({ x: c[0] + K.gauss(r) * (c[2] || sd), y: c[1] + K.gauss(r) * (c[2] || sd), t: k });
      });
      return out;
    },
    moons(r, n, noise) {
      const out = [];
      for (let i = 0; i < n; i++) {
        const a = Math.PI * r();
        if (i % 2 === 0) out.push({ x: Math.cos(a) + K.gauss(r) * noise, y: Math.sin(a) + K.gauss(r) * noise, t: 0 });
        else out.push({ x: 1 - Math.cos(a) + K.gauss(r) * noise, y: 0.5 - Math.sin(a) + K.gauss(r) * noise, t: 1 });
      }
      return out;
    },
  };

  // ---------- 算法 ----------
  const ml = (K.ml = {});

  // 解线性方程组（高斯消元，部分主元）
  ml.solve = (A, b) => {
    const n = b.length;
    const M = A.map((row, i) => row.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c] || 1e-12;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = M[r][c] / d;
        if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map((row, i) => row[n] / (row[i] || 1e-12));
  };

  // 最小二乘（可带 L2）：X 不含截距列，返回 [b0, b1, ...]；截距不加惩罚
  ml.ols = (X, y, lambda) => {
    const n = y.length;
    const d = X[0].length + 1;
    const A = Array.from({ length: d }, () => new Array(d).fill(0));
    const b = new Array(d).fill(0);
    for (let i = 0; i < n; i++) {
      const row = [1].concat(X[i]);
      for (let a = 0; a < d; a++) {
        b[a] += row[a] * y[i];
        for (let c = 0; c < d; c++) A[a][c] += row[a] * row[c];
      }
    }
    for (let a = 1; a < d; a++) A[a][a] += (lambda || 0) + 1e-9;
    return ml.solve(A, b);
  };

  ml.polyfit = (xs, ys, deg, lambda) => ml.ols(xs.map((x) => Array.from({ length: deg }, (_, k) => Math.pow(x, k + 1))), ys, lambda);
  ml.polyval = (c, x) => c.reduce((s, ck, k) => s + ck * Math.pow(x, k), 0);

  ml.standardize = (X) => {
    const d = X[0].length;
    const mu = Array.from({ length: d }, (_, j) => K.mean(X.map((r) => r[j])));
    const sd = Array.from({ length: d }, (_, j) => Math.sqrt(K.mean(X.map((r) => (r[j] - mu[j]) ** 2))) || 1);
    return { Z: X.map((r) => r.map((v, j) => (v - mu[j]) / sd[j])), mu, sd };
  };

  // 逻辑回归（梯度下降）。X: [[...]], y: 0/1, w: 样本权重
  ml.logreg = (X, y, o) => {
    const opt = Object.assign({ iters: 400, lr: 0.5, l2: 0, weights: null }, o || {});
    const d = X[0].length;
    let w = new Array(d).fill(0);
    let b = 0;
    const n = y.length;
    const sw = opt.weights || new Array(n).fill(1);
    const W = sw.reduce((s, v) => s + v, 0);
    for (let it = 0; it < opt.iters; it++) {
      const gw = new Array(d).fill(0);
      let gb = 0;
      for (let i = 0; i < n; i++) {
        const z = b + X[i].reduce((s, v, j) => s + v * w[j], 0);
        const e = (K.sigmoid(z) - y[i]) * sw[i];
        for (let j = 0; j < d; j++) gw[j] += e * X[i][j];
        gb += e;
      }
      w = w.map((wj, j) => wj - opt.lr * (gw[j] / W + opt.l2 * wj));
      b -= (opt.lr * gb) / W;
    }
    return { w, b, p: (x) => K.sigmoid(b + x.reduce((s, v, j) => s + v * w[j], 0)) };
  };

  // CART 分类树（两类）。pts: [{f: [..], y: 0/1, w?}]
  ml.impurity = (n0, n1, crit) => {
    const n = n0 + n1;
    if (!n) return 0;
    const p0 = n0 / n;
    const p1 = n1 / n;
    if (crit === 'entropy') return -[p0, p1].reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
    return 1 - p0 * p0 - p1 * p1;
  };

  // 在一个节点上，对某个特征算每个阈值的“不纯度下降”
  ml.splitScan = (pts, j, crit, minLeaf) => {
    const s = pts.slice().sort((a, b) => a.f[j] - b.f[j]);
    const wt = (q) => (q.w == null ? 1 : q.w);
    let L0 = 0;
    let L1 = 0;
    let T0 = 0;
    let T1 = 0;
    s.forEach((q) => (q.y ? (T1 += wt(q)) : (T0 += wt(q))));
    const T = T0 + T1;
    const parent = ml.impurity(T0, T1, crit);
    const out = [];
    let cnt = 0;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i].y) L1 += wt(s[i]);
      else L0 += wt(s[i]);
      cnt += 1;
      if (s[i].f[j] === s[i + 1].f[j]) continue;
      if (cnt < minLeaf || s.length - cnt < minLeaf) continue;
      const L = L0 + L1;
      const R = T - L;
      const imp = (L / T) * ml.impurity(L0, L1, crit) + (R / T) * ml.impurity(T0 - L0, T1 - L1, crit);
      out.push({ thr: (s[i].f[j] + s[i + 1].f[j]) / 2, gain: parent - imp });
    }
    return out;
  };

  let nodeId = 0;
  ml.cart = (pts, o, depth) => {
    const opt = Object.assign({ maxDepth: 3, minLeaf: 1, crit: 'gini', features: null }, o || {});
    depth = depth || 0;
    const wt = (q) => (q.w == null ? 1 : q.w);
    let n0 = 0;
    let n1 = 0;
    pts.forEach((q) => (q.y ? (n1 += wt(q)) : (n0 += wt(q))));
    const node = { id: nodeId++, depth, n: pts.length, n0, n1, p: n1 / (n0 + n1 || 1), imp: ml.impurity(n0, n1, opt.crit), pts };
    if (depth >= opt.maxDepth || n0 === 0 || n1 === 0 || pts.length < 2 * opt.minLeaf) return Object.assign(node, { leaf: true });
    const feats = opt.features ? opt.features(pts[0].f.length) : pts[0].f.map((_, j) => j);
    let best = null;
    feats.forEach((j) => ml.splitScan(pts, j, opt.crit, opt.minLeaf).forEach((c) => {
      if (!best || c.gain > best.gain + 1e-12) best = { j, thr: c.thr, gain: c.gain };
    }));
    if (!best || best.gain <= 1e-12) return Object.assign(node, { leaf: true });
    node.feat = best.j;
    node.thr = best.thr;
    node.gain = best.gain;
    node.left = ml.cart(pts.filter((q) => q.f[best.j] <= best.thr), opt, depth + 1);
    node.right = ml.cart(pts.filter((q) => q.f[best.j] > best.thr), opt, depth + 1);
    return node;
  };
  ml.treeProb = (node, f) => {
    while (!node.leaf) node = f[node.feat] <= node.thr ? node.left : node.right;
    return node.p;
  };
  ml.treeLeaf = (node, f) => {
    while (!node.leaf) node = f[node.feat] <= node.thr ? node.left : node.right;
    return node;
  };

  // K-means
  ml.dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  ml.kmeansInit = (pts, k, mode, r) => {
    if (mode === 'random') {
      const idx = [];
      while (idx.length < k) {
        const i = Math.floor(r() * pts.length);
        if (!idx.includes(i)) idx.push(i);
      }
      return idx.map((i) => ({ x: pts[i].x, y: pts[i].y }));
    }
    const cs = [pts[Math.floor(r() * pts.length)]];
    while (cs.length < k) {
      const d = pts.map((q) => Math.min(...cs.map((c) => ml.dist2(q, c))));
      const tot = d.reduce((s, v) => s + v, 0);
      let u = r() * tot;
      let i = 0;
      while (u > d[i] && i < d.length - 1) u -= d[i++];
      cs.push(pts[i]);
    }
    return cs.map((c) => ({ x: c.x, y: c.y }));
  };
  ml.assign = (pts, cs) => pts.map((q) => {
    let bi = 0;
    let bd = Infinity;
    cs.forEach((c, i) => {
      const d = ml.dist2(q, c);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    return bi;
  });
  ml.update = (pts, lab, cs) => cs.map((c, i) => {
    const m = pts.filter((_, j) => lab[j] === i);
    return m.length ? { x: K.mean(m.map((q) => q.x)), y: K.mean(m.map((q) => q.y)) } : { x: c.x, y: c.y };
  });
  ml.inertia = (pts, lab, cs) => pts.reduce((s, q, i) => s + ml.dist2(q, cs[lab[i]]), 0);
  ml.kmeans = (pts, k, r, mode, tries) => {
    let best = null;
    for (let t = 0; t < (tries || 3); t++) {
      let cs = ml.kmeansInit(pts, k, mode || 'plus', r);
      let lab = ml.assign(pts, cs);
      for (let it = 0; it < 50; it++) {
        cs = ml.update(pts, lab, cs);
        const nl = ml.assign(pts, cs);
        if (nl.every((v, i) => v === lab[i])) break;
        lab = nl;
      }
      const inertia = ml.inertia(pts, lab, cs);
      if (!best || inertia < best.inertia) best = { cs, lab, inertia };
    }
    return best;
  };

  // DBSCAN：返回 { lab（-1 = 噪声）, core }
  ml.dbscan = (pts, eps, minPts) => {
    const n = pts.length;
    const e2 = eps * eps;
    const nb = pts.map((q) => pts.map((o, j) => (ml.dist2(q, o) <= e2 ? j : -1)).filter((j) => j >= 0));
    const core = nb.map((l) => l.length >= minPts);
    const lab = new Array(n).fill(-1);
    const order = [];
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (lab[i] !== -1 || !core[i]) continue;
      const queue = [i];
      lab[i] = c;
      while (queue.length) {
        const j = queue.shift();
        order.push(j);
        if (!core[j]) continue;
        nb[j].forEach((k) => {
          if (lab[k] === -1) {
            lab[k] = c;
            queue.push(k);
          }
        });
      }
      c += 1;
    }
    return { lab, core, nb, order, clusters: c };
  };

  // 凝聚层次聚类：返回每一步合并 [{a, b, d, members}]
  ml.agglo = (pts, linkage) => {
    let clusters = pts.map((_, i) => ({ id: i, members: [i] }));
    const D = (A, B) => {
      const ds = [];
      A.members.forEach((i) => B.members.forEach((j) => ds.push(Math.sqrt(ml.dist2(pts[i], pts[j])))));
      if (linkage === 'single') return Math.min(...ds);
      if (linkage === 'complete') return Math.max(...ds);
      return K.mean(ds);
    };
    const merges = [];
    let next = pts.length;
    while (clusters.length > 1) {
      let best = null;
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const d = D(clusters[i], clusters[j]);
          if (!best || d < best.d) best = { i, j, d };
        }
      }
      const A = clusters[best.i];
      const B = clusters[best.j];
      const m = { id: next++, a: A.id, b: B.id, d: best.d, members: A.members.concat(B.members) };
      merges.push(m);
      clusters = clusters.filter((_, k) => k !== best.i && k !== best.j).concat([{ id: m.id, members: m.members }]);
    }
    return merges;
  };

  // 二维 PCA：返回均值和两个主方向（按方差从大到小）
  ml.pca2 = (pts) => {
    const mx = K.mean(pts.map((q) => q.x));
    const my = K.mean(pts.map((q) => q.y));
    let a = 0;
    let b = 0;
    let c = 0;
    pts.forEach((q) => {
      const dx = q.x - mx;
      const dy = q.y - my;
      a += dx * dx;
      b += dx * dy;
      c += dy * dy;
    });
    const n = pts.length;
    a /= n;
    b /= n;
    c /= n;
    const tr = a + c;
    const det = a * c - b * b;
    const l1 = tr / 2 + Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    const l2 = tr - l1;
    let v1 = Math.abs(b) > 1e-12 ? [l1 - c, b] : a >= c ? [1, 0] : [0, 1];
    const nv = Math.hypot(v1[0], v1[1]);
    v1 = [v1[0] / nv, v1[1] / nv];
    return { mx, my, l1, l2, v1, v2: [-v1[1], v1[0]] };
  };

  // ---------- 统计：分布函数、p 值、秩 ----------
  const st = (K.st = {});
  st.lgamma = (z) => {
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - st.lgamma(1 - z);
    z -= 1;
    let x = c[0];
    for (let i = 1; i < 9; i++) x += c[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  };
  // 正则化不完全 Gamma：P(a, x)、Q(a, x)
  st.gammaP = (a, x) => {
    if (x <= 0) return 0;
    if (x >= a + 1) return 1 - st.gammaQ(a, x);
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 0; n < 1000; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - st.lgamma(a));
  };
  st.gammaQ = (a, x) => {
    if (x <= 0) return 1;
    if (x < a + 1) return 1 - st.gammaP(a, x);
    let b = x + 1 - a;
    let c = 1e300;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c;
      if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.exp(-x + a * Math.log(x) - st.lgamma(a)) * h;
  };
  // 正则化不完全 Beta：I_x(a, b)
  st.betacf = (a, b, x) => {
    const FP = 1e-300;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FP) d = FP;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
      c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
      d = 1 / d;
      h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP;
      c = 1 + aa / c; if (Math.abs(c) < FP) c = FP;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-15) break;
    }
    return h;
  };
  st.ibeta = (x, a, b) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(st.lgamma(a + b) - st.lgamma(a) - st.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * st.betacf(a, b, x)) / a : 1 - (bt * st.betacf(b, a, 1 - x)) / b;
  };
  // 正态
  st.normPdf = (z, mu = 0, s = 1) => Math.exp(-0.5 * ((z - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  st.normSf = (z) => (z >= 0 ? 0.5 * st.gammaQ(0.5, (z * z) / 2) : 1 - 0.5 * st.gammaQ(0.5, (z * z) / 2)); // P(Z > z)
  st.normCdf = (z) => 1 - st.normSf(z);
  st.normInv = (p) => {
    // Acklam 近似
    const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
    const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
    const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
    const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
    const lo = 0.02425;
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p < lo) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - lo) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const q = p - 0.5;
    const r = q * q;
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  // t 分布
  st.tPdf = (t, df) => Math.exp(st.lgamma((df + 1) / 2) - st.lgamma(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + (t * t) / df, -(df + 1) / 2);
  st.tSf = (t, df) => {
    const tail = 0.5 * st.ibeta(df / (df + t * t), df / 2, 0.5);
    return t >= 0 ? tail : 1 - tail;
  };
  st.tInv = (p, df) => {
    let lo = -60;
    let hi = 60;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (1 - st.tSf(mid, df) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  // 卡方、F
  st.chi2Pdf = (x, k) => (x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - st.lgamma(k / 2)));
  st.chi2Sf = (x, k) => st.gammaQ(k / 2, Math.max(0, x) / 2);
  st.fPdf = (x, d1, d2) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (st.lgamma(d1 / 2) + st.lgamma(d2 / 2) - st.lgamma((d1 + d2) / 2))));
  st.fSf = (x, d1, d2) => (x <= 0 ? 1 : st.ibeta(d2 / (d2 + d1 * x), d2 / 2, d1 / 2));
  // 右尾临界值：找 x 使 sf(x) = alpha（sf 单调递减），二分法
  st.critical = (sf, alpha, hi) => {
    let a = 0;
    let b = hi || 1;
    while (sf(b) > alpha && b < 1e6) b *= 2;
    for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (sf(m) > alpha) a = m; else b = m; }
    return (a + b) / 2;
  };
  // 离散分布
  st.binomPmf = (k, n, p) => {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    return Math.exp(st.lgamma(n + 1) - st.lgamma(k + 1) - st.lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  };
  st.poisPmf = (k, lam) => (k < 0 ? 0 : Math.exp(k * Math.log(lam) - lam - st.lgamma(k + 1)));
  // 显示 p 值
  st.fmtP = (p) => (!Number.isFinite(p) ? '—' : p < 0.0001 ? '< 0.0001' : p.toFixed(4));
  st.pEq = (p) => (Number.isFinite(p) && p < 0.0001 ? 'p < 0.0001' : 'p = ' + st.fmtP(p));
  // 样本统计
  st.mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  st.var = (a) => { const m = st.mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1); };
  st.median = (a) => { const s = a.slice().sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  // 两样本 t 检验（equalVar=false 为 Welch）
  st.ttest = (a, b, equalVar) => {
    const n1 = a.length;
    const n2 = b.length;
    const v1 = st.var(a);
    const v2 = st.var(b);
    const diff = st.mean(b) - st.mean(a);
    let se;
    let df;
    if (equalVar) {
      const sp = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
      se = Math.sqrt(sp * (1 / n1 + 1 / n2));
      df = n1 + n2 - 2;
    } else {
      se = Math.sqrt(v1 / n1 + v2 / n2);
      df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
    }
    const t = diff / se;
    return { t, df, p: 2 * st.tSf(Math.abs(t), df), diff, se };
  };
  // 秩（并列取平均秩）
  st.ranks = (vals) => {
    const idx = vals.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
    const r = new Array(vals.length);
    for (let i = 0; i < idx.length;) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return r;
  };
  // 单因素方差分析：groups = [[...], [...], ...]
  st.anova = (groups) => {
    const all = [].concat(...groups);
    const N = all.length;
    const k = groups.length;
    const gm = st.mean(all);
    let ssb = 0;
    let ssw = 0;
    groups.forEach((g) => {
      const m = st.mean(g);
      ssb += g.length * (m - gm) ** 2;
      g.forEach((v) => (ssw += (v - m) ** 2));
    });
    const df1 = k - 1;
    const df2 = N - k;
    const F = ssw > 0 ? (ssb / df1) / (ssw / df2) : Infinity;
    return { F, df1, df2, ssb, ssw, msb: ssb / df1, msw: ssw / df2, p: Number.isFinite(F) ? st.fSf(F, df1, df2) : 0, gm };
  };
  // Levene 检验（Brown-Forsythe 版：用中位数，和 scipy.stats.levene 默认一致）
  st.levene = (groups) => st.anova(groups.map((g) => { const md = st.median(g); return g.map((v) => Math.abs(v - md)); }));
  // 两样本 KS 检验（渐近 p 值）
  st.ks2 = (a, b) => {
    const A = a.slice().sort((x, y) => x - y);
    const B = b.slice().sort((x, y) => x - y);
    const xs = A.concat(B).sort((x, y) => x - y);
    let D = 0;
    let at = xs[0];
    let i = 0;
    let j = 0;
    xs.forEach((x) => {
      while (i < A.length && A[i] <= x) i++;
      while (j < B.length && B[j] <= x) j++;
      const d = Math.abs(i / A.length - j / B.length);
      if (d > D) { D = d; at = x; }
    });
    const en = Math.sqrt((A.length * B.length) / (A.length + B.length));
    const lam = (en + 0.12 + 0.11 / en) * D;
    let q = 0;
    for (let k = 1; k <= 100; k++) q += 2 * (k % 2 ? 1 : -1) * Math.exp(-2 * k * k * lam * lam);
    return { D, at, p: lam < 0.2 ? 1 : Math.min(1, Math.max(0, q)) };
  };
  // 曼-惠特尼 U（正态近似，带连续性校正）
  st.mannWhitney = (a, b) => {
    const r = st.ranks(a.concat(b));
    const n1 = a.length;
    const n2 = b.length;
    const R1 = r.slice(0, n1).reduce((s, v) => s + v, 0);
    const U1 = R1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;
    const mu = (n1 * n2) / 2;
    const sd = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (Math.abs(U1 - mu) - 0.5) / sd;
    return { U1, U2, U: Math.min(U1, U2), z, p: Math.min(1, 2 * st.normSf(Math.max(0, z))), ranks: r, R1 };
  };

  window.LabKit = K;

  // ---------- 讲解注册表（按需加载 js/labs/<名字>.js） ----------
  const registry = {};
  const loading = {};
  window.Labs = {
    register(name, def) {
      registry[name] = def;
    },
    load(name) {
      if (registry[name]) return Promise.resolve(registry[name]);
      if (!loading[name]) {
        loading[name] = new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = `js/labs/${name}.js`;
          s.onload = () => (registry[name] ? resolve(registry[name]) : reject(new Error(`js/labs/${name}.js 里没有注册 “${name}”`)));
          s.onerror = () => {
            delete loading[name];
            reject(new Error(`没能加载 js/labs/${name}.js`));
          };
          document.head.appendChild(s);
        });
      }
      return loading[name];
    },
    async mount(name, host) {
      host.innerHTML = '<p class="muted small">正在加载动画……</p>';
      try {
        const def = await Labs.load(name);
        host.innerHTML = '';
        def.render(host, K);
      } catch (e) {
        host.innerHTML = `<p class="banner bad">${Util.esc(e.message)}</p>`;
        console.error(e);
      }
    },
  };
})();
