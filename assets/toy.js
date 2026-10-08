// The hero's desk toy. Little outline screens float above the heading and one person uses
// them: apart, they take turns, one at a time; joined by seams, the same person works across
// them, one pointer, keyboard and clipboard crossing the seams. Screens are dragged and joined
// by the app's arrangement rules, and a camera keeps them all inside the box. The toy opens by
// joining two screens, plays a scene on them, joins the third, and carries on by itself until
// someone takes over.
(() => {
  const area = document.querySelector('.toy');
  if (!area) return;

  const BEZEL = 0; // the screen is just its outline
  const GAP = 3; // the seam between two joined screens
  // As in the app: a dragged screen snaps within 12 pixels on screen, and the pull toward the
  // nearest facing edge shows from 52
  const SNAP = 12;
  const PULL = 52;
  const SPECS = [
    { os: 'mac', w: 186, h: 118, at: [0.02, 0.2] },
    { os: 'win', w: 206, h: 118, at: [0.4, 0.55] },
    { os: 'win', w: 160, h: 102, at: [0.74, 0.06] },
  ];
  const KEYS = { mac: { copy: ['⌘', 'C'], paste: ['⌘', 'V'] }, win: { copy: ['Ctrl', 'C'], paste: ['Ctrl', 'V'] } };
  // Window places as fractions of the screen: two side by side on a lone screen, one in the
  // middle of each joined screen. EDGE is the window's outline, in pixels
  const LEFT = [0.06, 0.1, 0.44, 0.56];
  const RIGHT = [0.52, 0.2, 0.42, 0.52];
  const MIDDLE = [0.2, 0.12, 0.56, 0.56];
  const EDGE = 1.4;
  // Android 14's arrow cursor (public domain, rw-designer 254107), traced from its 128 px image
  const POINTER = '<svg viewBox="0 0 64 73"><path d="M1.61 15.1C1.61 26.09 1.6 37.09 1.64 48.08C1.66 52.69 1.26 57.49 1.78 62.07C2.4 67.46 7.1 71.79 12.57 71.89C18.25 72 21.62 67.66 25.06 63.83C26.84 61.84 28.69 59.92 30.53 57.99C31.41 57.06 32.28 55.9 33.35 55.18C35.46 53.74 38.71 54.08 41.14 53.88C42.97 53.73 44.76 53.33 46.59 53.16C48.57 52.97 50.61 53.04 52.56 52.63C57.99 51.5 62.1 47.28 62.14 41.59C62.18 35.08 56.86 31.77 52.14 28.35C43.4 22.03 34.76 15.47 26.22 8.88C22.35 5.89 18.05 1.78 12.91 1.71C7.99 1.64 3.46 4.87 2.06 9.64C1.54 11.4 1.61 13.29 1.61 15.1Z"/><path fill-rule="evenodd" d="M1.61 15.1C1.61 26.09 1.6 37.09 1.64 48.08C1.66 52.69 1.26 57.49 1.78 62.07C2.4 67.46 7.1 71.79 12.57 71.89C18.25 72 21.62 67.66 25.06 63.83C26.84 61.84 28.69 59.92 30.53 57.99C31.41 57.06 32.28 55.9 33.35 55.18C35.46 53.74 38.71 54.08 41.14 53.88C42.97 53.73 44.76 53.33 46.59 53.16C48.57 52.97 50.61 53.04 52.56 52.63C57.99 51.5 62.1 47.28 62.14 41.59C62.18 35.08 56.86 31.77 52.14 28.35C43.4 22.03 34.76 15.47 26.22 8.88C22.35 5.89 18.05 1.78 12.91 1.71C7.99 1.64 3.46 4.87 2.06 9.64C1.54 11.4 1.61 13.29 1.61 15.1ZM5.66 55.51C5.66 59.6 5.02 64.31 9.1 66.75C10.23 67.43 11.56 67.88 12.88 67.88C19.54 67.89 26.34 53.87 32.12 51.23C34.2 50.28 43.61 49.41 46.43 49.15C51.71 48.66 58.15 48.56 58.14 41.45C58.13 36.57 53.03 33.82 49.49 31.28C40.98 25.16 32.75 18.66 24.27 12.5C21.06 10.17 17.03 5.79 12.9 5.76C5.8 5.7 5.66 11.68 5.66 16.98C5.66 29.82 5.66 42.67 5.66 55.51Z"/></svg>';
  const PICTURE = '<svg viewBox="0 0 30 22"><rect x="1" y="1" width="28" height="20" rx="2"/><path d="M3 18L11 10L16 15L20 11L27 18"/><circle cx="21.5" cy="6.5" r="2.2"/></svg>';
  const FILE = '<svg viewBox="0 0 14 17"><path d="M1.5 1.5H9L12.5 5V15.5H1.5Z"/><path d="M9 1.5V5H12.5"/></svg>';
  const SPEAKER = '<path d="M1.5 3.6H3.6L6.4 1.3V8.7L3.6 6.4H1.5Z"/><path d="M8.3 3.4Q9.4 5 8.3 6.6"/>';
  const LOUDER = `<svg viewBox="0 0 12 10">${SPEAKER}<path d="M9.9 1.9Q12 5 9.9 8.1"/></svg>`;
  const QUIETER = `<svg viewBox="0 0 12 10">${SPEAKER}</svg>`;
  const PLAY = '<svg viewBox="0 0 8 8"><path class="toy-icon-play" d="M2.2 1.3L6.6 4L2.2 6.7Z"/><path class="toy-icon-pause" d="M2.6 1.5V6.5M5.4 1.5V6.5"/></svg>';

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const ease = p => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
  const make = (cls, parent, html) => {
    const node = document.createElement('div');
    node.className = cls;
    if (html) node.innerHTML = html;
    parent.append(node);
    return node;
  };

  // Everything on the desk sits in one layer, so the camera can show it smaller
  const world = make('toy-world', area);

  // Screens
  const screens = SPECS.map((spec, index) => {
    const s = { index, spec, os: spec.os, dw: spec.w, dh: spec.h, w: spec.w + BEZEL * 2, h: spec.h + BEZEL * 2 };
    s.el = make(`toy-screen toy-${spec.os}`, world);
    s.el.style.width = `${s.w}px`;
    s.el.style.height = `${s.h}px`;
    const display = make('toy-display', s.el);
    s.display = display;
    make(spec.os === 'mac' ? 'toy-dock' : 'toy-taskbar', display);
    s.desk = make('toy-layer', display);
    s.wins = make('toy-layer', display);
    s.keys = make('toy-layer', display);
    s.pointer = make('toy-pointer', display, POINTER);
    s.made = []; // the windows and files of the current scene
    Object.assign(s, { x: 0, y: 0, tx: 0, ty: 0, lift: 0, tilt: 0, calm: 1, room: 1, hover: false, squashAt: -1e9 });
    s.phase = index * 2.1 + 0.4;
    return s;
  });

  // Screens never overlap. How far box a must move to clear box b by `gap`, cheapest first
  // (none when they are already clear)
  function exits(a, b, gap) {
    const left = a.x + a.w + gap - b.x;
    const right = b.x + b.w + gap - a.x;
    const up = a.y + a.h + gap - b.y;
    const down = b.y + b.h + gap - a.y;
    if (left <= 0.01 || right <= 0.01 || up <= 0.01 || down <= 0.01) return [];
    return [{ x: -left, y: 0 }, { x: right, y: 0 }, { x: 0, y: -up }, { x: 0, y: down }]
      .sort((p, q) => Math.abs(p.x + p.y) - Math.abs(q.x + q.y));
  }
  const onDesk = (box, W, H) => box.x >= 0 && box.y >= 0 && box.x + box.w <= W && box.y + box.h <= H;
  function place() {
    const W = area.clientWidth;
    const H = area.clientHeight;
    for (const s of screens) {
      s.x = clamp(s.spec.at[0] * W, 0, W - s.w);
      s.y = clamp(s.spec.at[1] * H, 0, H - s.h);
    }
    // A narrow desk (a phone) cannot hold the usual layout: push the pieces apart, with room to
    // float, staying on the desk where that works and leaving it where it does not; the camera
    // then shows them all, smaller. Kept on the desk by force, they would overlap
    for (let round = 0; round < 60; round++) {
      let moved = false;
      for (const a of screens) {
        for (const b of screens) {
          const options = a === b ? [] : exits(a, b, GAP + 14);
          if (!options.length) continue;
          // A move that stays on the desk only helps if it clears the others too; otherwise the
          // smallest move, off the desk if need be, or the pieces would bounce between overlaps
          const clear = p => screens.every(c => c === a || c === b || !exits({ x: a.x + p.x, y: a.y + p.y, w: a.w, h: a.h }, c, GAP + 14).length);
          const v = options.find(p => clear(p) && onDesk({ x: a.x + p.x, y: a.y + p.y, w: a.w, h: a.h }, W, H)) || options[0];
          a.x += v.x;
          a.y += v.y;
          moved = true;
        }
      }
      if (!moved) break;
    }
  }
  place();

  // Seams, and the groups of joined screens they make
  let seams = [];
  const neighbours = s => seams.filter(m => m.a === s || m.b === s).map(m => (m.a === s ? m.b : m.a));
  function components() {
    const seen = new Set();
    const out = [];
    for (const s of screens) {
      if (seen.has(s)) continue;
      const group = [];
      const stack = [s];
      seen.add(s);
      while (stack.length) {
        const n = stack.pop();
        group.push(n);
        for (const m of neighbours(n)) if (!seen.has(m)) { seen.add(m); stack.push(m); }
      }
      out.push(group);
    }
    return out;
  }
  const componentOf = s => components().find(c => c.includes(s));

  // Where a screen is drawn this frame, and points inside its display
  const offsets = new Map();
  const drawn = s => {
    const o = offsets.get(s) || { x: 0, y: 0 };
    return { x: s.x + o.x, y: s.y + o.y, w: s.w, h: s.h };
  };
  const origin = s => {
    const r = drawn(s);
    return { x: r.x + BEZEL, y: r.y + BEZEL };
  };
  const at = a => {
    const o = origin(a.s);
    return { x: o.x + a.fx * a.s.dw, y: o.y + a.fy * a.s.dh };
  };

  // Little effects
  function key(s, labels, slot) {
    const chord = make('toy-chord', s.keys);
    chord.style.left = slot
      ? `calc(50% + ${((slot[0] - (slot[1] - 1) / 2) * 19).toFixed(1)}px)`
      : `${50 + (Math.random() - 0.5) * 22}%`;
    for (const label of [].concat(labels)) {
      const cap = make('toy-key', chord);
      if (label.startsWith('<')) cap.innerHTML = label;
      else cap.textContent = label;
    }
    chord.addEventListener('animationend', () => chord.remove());
  }
  function ripple(s, p) {
    const o = origin(s);
    const ring = make('toy-click', s.keys);
    ring.style.left = `${(p.x - o.x).toFixed(1)}px`;
    ring.style.top = `${(p.y - o.y).toFixed(1)}px`;
    ring.addEventListener('animationend', () => ring.remove());
  }
  function sparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const d = 26 + Math.random() * 26;
      const node = make('toy-spark', world);
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.setProperty('--sx', `${Math.cos(a) * d}px`);
      node.style.setProperty('--sy', `${Math.sin(a) * d}px`);
      node.addEventListener('animationend', () => node.remove());
    }
  }
  const seamCentre = m => {
    const A = drawn(m.a);
    const B = drawn(m.b);
    return m.axis === 'x'
      ? { x: (A.x + A.w + B.x) / 2, y: (Math.max(A.y, B.y) + Math.min(A.y + A.h, B.y + B.h)) / 2 }
      : { x: (Math.max(A.x, B.x) + Math.min(A.x + A.w, B.x + B.w)) / 2, y: (A.y + A.h + B.y) / 2 };
  };

  // The app's arrangement rules (crates/mkcplus-app/src/canvas.rs), with a seam's gap between
  // joined screens. A screen's footprint is its display with half the gap all round, so
  // footprints that meet mean displays a seam apart
  const foot = (s, x = s.x, y = s.y) => ({ x: x - GAP / 2, y: y - GAP / 2, w: s.w + GAP, h: s.h + GAP });
  const overlaps = (a, b) =>
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.001 &&
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.001;
  const legal = (s, x, y) => screens.every(o => o === s || !overlaps(foot(s, x, y), foot(o)));
  // How far apart two footprints are, or how deep they overlap when negative
  const apart = (a, b) => Math.max(a.x - b.x - b.w, b.x - a.x - a.w, a.y - b.y - b.h, b.y - a.y - a.h);
  // Footprints that meet along an edge long enough to cross make a seam, a on the left or top
  function touching(p, q, px = p.x, py = p.y) {
    const P = foot(p, px, py);
    const Q = foot(q);
    const meet = v => Math.abs(v) < 0.5;
    if (Math.min(P.y + P.h, Q.y + Q.h) - Math.max(P.y, Q.y) > 24) {
      if (meet(P.x + P.w - Q.x)) return { axis: 'x', a: p, b: q };
      if (meet(Q.x + Q.w - P.x)) return { axis: 'x', a: q, b: p };
    }
    if (Math.min(P.x + P.w, Q.x + Q.w) - Math.max(P.x, Q.x) > 24) {
      if (meet(P.y + P.h - Q.y)) return { axis: 'y', a: p, b: q };
      if (meet(Q.y + Q.h - P.y)) return { axis: 'y', a: q, b: p };
    }
    return null;
  }
  const meets = (s, x = s.x, y = s.y) => screens.map(o => (o === s ? null : touching(s, o, x, y))).filter(Boolean);
  // Magnet: close to a spot where it would meet others (beside them, or lined up with their
  // edges or centres), a dragged screen snaps there. The spot joining the most screens wins,
  // then the one with the most lined-up joins, then the nearest
  function snapSpot(s, x, y, limit) {
    const xs = [x];
    const ys = [y];
    for (const o of screens) {
      if (o === s) continue;
      xs.push(o.x - GAP - s.w, o.x + o.w + GAP, o.x, o.x + o.w - s.w, o.x + (o.w - s.w) / 2);
      ys.push(o.y - GAP - s.h, o.y + o.h + GAP, o.y, o.y + o.h - s.h, o.y + (o.h - s.h) / 2);
    }
    let best = { x, y };
    let score = [0, 0, Infinity];
    for (const cx of xs.filter(v => Math.abs(v - x) < limit)) {
      for (const cy of ys.filter(v => Math.abs(v - y) < limit)) {
        if (!legal(s, cx, cy)) continue;
        const joins = meets(s, cx, cy);
        if (!joins.length) continue;
        const lined = joins.filter(j => {
          const o = j.a === s ? j.b : j.a;
          const [at, size, start, extent] = j.axis === 'x' ? [cy, s.h, o.y, o.h] : [cx, s.w, o.x, o.w];
          return [start, start + extent - size, start + (extent - size) / 2].some(v => Math.abs(v - at) < 0.5);
        }).length;
        const next = [joins.length, lined, Math.hypot(cx - x, cy - y)];
        if (next[0] > score[0] || (next[0] === score[0] && (next[1] > score[1] || (next[1] === score[1] && next[2] < score[2])))) {
          best = { x: cx, y: cy };
          score = next;
        }
      }
    }
    return best;
  }
  // Where a screen dropped on top of others lands: the nearest spot clear of them all
  function landingSpot(s, x, y) {
    if (legal(s, x, y)) return { x, y };
    const xs = [x];
    const ys = [y];
    for (const o of screens) {
      if (o === s) continue;
      xs.push(o.x - GAP - s.w, o.x + o.w + GAP);
      ys.push(o.y - GAP - s.h, o.y + o.h + GAP);
    }
    let best = { x, y };
    let distance = Infinity;
    for (const cx of xs) {
      for (const cy of ys) {
        const d = (cx - x) ** 2 + (cy - y) ** 2;
        if (d < distance && legal(s, cx, cy)) {
          best = { x: cx, y: cy };
          distance = d;
        }
      }
    }
    return best;
  }
  // The pull between a dragged screen and the nearest edge facing it, stronger as they near
  function magnetOf(s, limit) {
    let best = null;
    const P = foot(s);
    for (const o of screens) {
      if (o === s) continue;
      const Q = foot(o);
      const y = Math.max(P.y, Q.y);
      const h = Math.min(P.y + P.h, Q.y + Q.h) - y;
      const x = Math.max(P.x, Q.x);
      const w = Math.min(P.x + P.w, Q.x + Q.w) - x;
      const add = (axis, a, b, start, length) => {
        const gap = b - a;
        if (gap > 0.5 && gap < limit && (!best || gap < best.b - best.a)) best = { axis, a, b, start, length, strength: 1 - gap / limit };
      };
      if (h > 0) {
        add('v', P.x + P.w, Q.x, y, h);
        add('v', Q.x + Q.w, P.x, y, h);
      }
      if (w > 0) {
        add('h', P.y + P.h, Q.y, x, w);
        add('h', Q.y + Q.h, P.y, x, w);
      }
    }
    return best;
  }
  const seamed = (p, q) => seams.some(m => (m.a === p && m.b === q) || (m.a === q && m.b === p));
  // A screen coming to rest joins every screen it touches, taking on their group's float
  function joinTouching(s, now) {
    const joins = meets(s).filter(c => !seamed(c.a, c.b));
    if (!joins.length) return;
    const host = componentOf(joins[0].a === s ? joins[0].b : joins[0].a);
    s.phase = host[0].phase;
    s.calm = Math.min(...host.map(o => o.calm));
    joins.forEach(c => addSeam({ ...c, mover: s }, now));
  }
  function addSeam(c, now) {
    const seam = { a: c.a, b: c.b, axis: c.axis, mover: c.mover, el: make(`toy-seam toy-seam-${c.axis} is-born`, world) };
    seams.push(seam);
    lastJoin = now;
    joinedAt = now;
    opening = false;
    hadTurn.clear();
    c.a.squashAt = now;
    c.b.squashAt = now;
    placeSeam(seam);
    const p = seamCentre(seam);
    sparkle(p.x, p.y);
  }
  function unjoin(m) {
    seams = seams.filter(x => x !== m);
    hadTurn.clear();
    const p = seamCentre(m);
    m.el.classList.remove('is-born');
    m.el.classList.add('is-breaking');
    setTimeout(() => m.el.remove(), 380);
    sparkle(p.x, p.y);
  }
  function placeSeam(m) {
    const A = drawn(m.a);
    const B = drawn(m.b);
    if (m.axis === 'x') {
      const top = Math.max(A.y, B.y) + 10;
      m.el.style.left = `${(A.x + A.w + B.x) / 2 - GAP / 2}px`;
      m.el.style.top = `${top}px`;
      m.el.style.height = `${Math.max(0, Math.min(A.y + A.h, B.y + B.h) - 10 - top)}px`;
    } else {
      const left = Math.max(A.x, B.x) + 10;
      m.el.style.top = `${(A.y + A.h + B.y) / 2 - GAP / 2}px`;
      m.el.style.left = `${left}px`;
      m.el.style.width = `${Math.max(0, Math.min(A.x + A.w, B.x + B.w) - 10 - left)}px`;
    }
  }
  function pulse(a, b) {
    const m = seams.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    if (!m) return;
    m.el.classList.remove('is-pulse');
    void m.el.offsetWidth;
    m.el.classList.add('is-pulse');
  }

  // Activity: one person, so each lone screen or group of joined screens takes its turn with
  // one pointer. Every turn plays the next of six scenes, within one screen or across the
  // joined ones; windows and files exist only while their scene uses them
  let runners = new Map();
  const SCENES = ['text', 'file', 'media', 'picture', 'type', 'volume'];
  let scene = 0;
  function resetScreen(s) {
    s.hud = null;
    for (const el of s.made) {
      el.classList.remove('is-shown');
      setTimeout(() => el.remove(), 400);
    }
    s.made = [];
  }
  const show = el => {
    void el.offsetWidth; // let it enter from its hidden state
    el.classList.add('is-shown');
  };
  const putWindow = win => {
    win.el.style.setProperty('--wx', win.x.toFixed(4));
    win.el.style.setProperty('--wy', win.y.toFixed(4));
    win.el.style.setProperty('--ww', win.w.toFixed(4));
    win.el.style.setProperty('--wh', win.h.toFixed(4));
  };
  // A window's inside in pixels, and a point in it for the pointer, read when the beat starts
  // because a window may have moved by then
  const inside = win => ({ w: win.w * win.s.dw - EDGE * 2, h: win.h * win.s.dh - EDGE * 2 });
  const spot = (win, x, y) => () => ({ s: win.s, fx: win.x + (EDGE + x) / win.s.dw, fy: win.y + (EDGE + y) / win.s.dh });
  const nudge = (a, dx = 16, dy = 14) => ({ s: a.s, fx: a.fx + dx / a.s.dw, fy: a.fy + dy / a.s.dh });
  function open(s, [x, y, w, h], kind) {
    const win = { s, x, y, w, h, el: make(`toy-window toy-window-${kind}`, s.wins) };
    s.made.push(win.el);
    putWindow(win);
    make('toy-titlebar', win.el);
    if (kind === 'text') {
      [0.72, 0.92, 0.5].forEach((len, i) => {
        const line = make('toy-line', win.el);
        line.style.setProperty('--i', i);
        line.style.setProperty('--len', len);
      });
      win.selection = make('toy-select', win.el);
    } else if (kind === 'files') {
      win.files = [0.22, 0.58].map(u => {
        const file = make('toy-file is-shown', win.el, FILE);
        file.style.left = `${u * 100}%`;
        return file;
      });
    } else if (kind === 'picture') {
      win.picture = make('toy-picture', win.el, PICTURE);
    } else if (kind === 'player') {
      const bars = make('toy-eq', win.el);
      for (let i = 0; i < 5; i++) make('toy-bar', bars);
      const controls = make('toy-controls', win.el);
      make('toy-play', controls, PLAY);
      make('toy-progress', controls);
    }
    return win;
  }
  function caret(win, x) {
    win.caret = win.caret || make('toy-caret', win.el);
    win.caret.style.left = `${x.toFixed(1)}px`;
  }
  function pasteText(win, width) {
    const room = inside(win).w - 14;
    const line = make('toy-line is-pasted', win.el);
    line.style.setProperty('--i', 0);
    line.style.setProperty('--len', Math.min(1, width / room).toFixed(3));
    caret(win, 8 + Math.min(width, room));
  }
  function type(win, text) {
    if (!win.words) {
      win.words = make('toy-typed', win.el);
      win.words.append(document.createTextNode(''));
      make('toy-caret-after', win.words);
    }
    win.words.firstChild.data = text;
  }
  function volume(s, level) {
    if (!s.hud) {
      s.hud = make('toy-hud', s.keys, `<svg viewBox="0 0 12 10">${SPEAKER}</svg>`);
      make('toy-level', s.hud);
      s.made.push(s.hud);
      s.hud.style.setProperty('--level', level);
      show(s.hud);
    }
    s.hud.style.setProperty('--level', level);
    // Like the real ones, it goes away a moment after the last change
    const hud = s.hud;
    if (!hud.classList.contains('is-shown')) show(hud);
    clearTimeout(s.hudTimer);
    s.hudTimer = setTimeout(() => hud.classList.remove('is-shown'), 1400);
  }
  function pastePicture(win) {
    win.caret?.remove();
    show(make('toy-picture is-pasted', win.el, PICTURE));
  }
  function pasteFile(a) {
    const file = make('toy-file is-pasted', a.s.desk, FILE);
    file.style.left = `${(a.fx * a.s.dw - 6.5).toFixed(1)}px`;
    file.style.top = `${(a.fy * a.s.dh - 8).toFixed(1)}px`;
    a.s.made.push(file);
    show(file);
  }

  // A scene is a list of beats: the pointer moves to `to` (timed by distance unless `d` says
  // otherwise), dragging a selection or carrying a window on the way; `click`, `keys` and
  // `run` happen as the beat starts, and `reset` clears the screens at the end
  function script(r) {
    const order = [...r.members].sort((a, b) => a.x - b.x || a.y - b.y);
    const first = order[0];
    const last = order[order.length - 1];
    const solo = first === last;
    r.home = first; // the keyboard in use: every key of the scene is typed there
    const here = solo ? LEFT : MIDDLE;
    const there = solo ? RIGHT : MIDDLE;
    const away = { to: () => nudge(r.anchor), d: 380 };
    const close = {
      run: () => r.members.forEach(m => m.wins.querySelectorAll('.toy-window').forEach(el => el.classList.remove('is-shown'))),
      d: 450,
    };
    const end = { reset: true, d: 150 };
    const kind = SCENES[scene++ % SCENES.length];
    // Joined, a scene starts with the pointer on the screen whose keyboard is in use
    const start = solo ? [] : [{ to: () => ({ s: r.home, fx: 0.5, fy: 0.42 }) }];
    if (kind === 'type') {
      // Click into a window, on another screen when joined, and type a word on the keyboard
      const doc = open(last, there, 'doc');
      const word = 'Hello!';
      return [
        ...start,
        { run: () => show(doc.el), d: 300 },
        { to: spot(doc, 10, 14.5) },
        { click: true, run: () => type(doc, ''), d: 320 },
        away,
        ...[...word].map((letter, i) => ({
          keys: [letter.toUpperCase()],
          slot: [i, word.length],
          run: () => type(doc, word.slice(0, i + 1)),
          d: i < word.length - 1 ? 170 : 1000,
        })),
        close,
        end,
      ];
    }
    if (kind === 'volume') {
      // Volume keys act on the computer the pointer is on. Joined, the keyboard turns up its
      // own computer, then the pointer crosses and the same keys turn down the other one
      const other = last;
      return [
        ...start,
        { keys: [LOUDER], run: () => volume(r.home, 0.5), d: 420 },
        { keys: [LOUDER], run: () => volume(r.home, 0.62), d: solo ? 420 : 700 },
        ...(solo ? [] : [{ to: () => ({ s: other, fx: 0.5, fy: 0.42 }) }]),
        { keys: [QUIETER], run: () => volume(other, solo ? 0.5 : 0.62), d: 420 },
        { keys: [QUIETER], run: () => volume(other, solo ? 0.38 : 0.46), d: 1000 },
        { run: () => r.members.forEach(m => m.hud?.classList.remove('is-shown')), d: 400 },
        end,
      ];
    }
    if (kind === 'text') {
      // Select a line, copy it, paste it into another window
      const a = open(first, here, 'text');
      const b = open(last, there, 'doc');
      a.selected = (inside(a).w - 14) * 0.92;
      return [
        { run: () => show(a.el), d: 320 },
        { to: spot(a, 7, 22.5) },
        { to: spot(a, 7 + a.selected, 22.5), select: a, d: 650 },
        { keys: 'copy', run: () => a.selection.classList.add('is-copied'), d: 650 },
        { run: () => show(b.el), d: 260 },
        { to: spot(b, 10, 14.5) },
        { click: true, run: () => caret(b, 7), d: 320 },
        { keys: 'paste', run: () => pasteText(b, a.selected), d: 500 },
        away,
        { d: 450 },
        close,
        end,
      ];
    }
    if (kind === 'file') {
      // Copy a file out of a window, paste it on the desktop
      const a = open(first, here, 'files');
      const box = inside(a);
      const drop = solo ? { s: first, fx: 0.76, fy: 0.3 } : { s: last, fx: 0.5, fy: 0.3 };
      return [
        { run: () => show(a.el), d: 320 },
        { to: spot(a, box.w * 0.22 + 6.5, box.h / 2 + 4) },
        { click: true, run: () => a.files[0].classList.add('is-selected'), d: 320 },
        { keys: 'copy', d: 650 },
        { to: drop },
        { click: true, d: 260 },
        { keys: 'paste', run: () => pasteFile(drop), d: 500 },
        away,
        close,
        { d: 600 },
        end,
      ];
    }
    if (kind === 'media') {
      // Move a window by its title bar, then play the music and pause it again. Joined, the
      // window moves on the first screen and the music plays on the last: each window stays
      // on its own computer, only the pointer crosses
      const player = open(last, here, 'player');
      const moved = solo ? player : open(first, MIDDLE, 'text');
      const grab = inside(moved).w / 2;
      const nx = solo ? 0.5 : 0.08;
      const ny = Math.max(0.05, moved.y - 0.05);
      const button = () => spot(player, 11, inside(player).h - 10)();
      return [
        { run: () => show(moved.el), d: 320 },
        { to: spot(moved, grab, 3) },
        { to: () => ({ s: moved.s, fx: nx + (EDGE + grab) / moved.s.dw, fy: ny + (EDGE + 3) / moved.s.dh }), carry: { win: moved, x: nx, y: ny }, d: 900 },
        ...(solo ? [] : [{ run: () => show(player.el), d: 260 }]),
        { to: button },
        { click: true, run: () => player.el.classList.add('is-playing'), d: 300 },
        { to: () => nudge(r.anchor), d: 380 },
        { d: 1200 },
        { to: button, d: 420 },
        { click: true, run: () => player.el.classList.remove('is-playing'), d: 300 },
        { to: () => nudge(r.anchor), d: 380 },
        { d: 500 },
        close,
        end,
      ];
    }
    // Copy a picture from one window, paste it into another
    const a = open(first, here, 'picture');
    const b = open(last, there, 'doc');
    const box = inside(a);
    return [
      { run: () => show(a.el), d: 320 },
      { to: spot(a, box.w / 2, box.h / 2 + 4) },
      { click: true, run: () => a.picture.classList.add('is-selected'), d: 320 },
      { keys: 'copy', d: 650 },
      { run: () => show(b.el), d: 260 },
      { to: spot(b, 10, 14.5) },
      { click: true, run: () => caret(b, 7), d: 320 },
      { keys: 'paste', run: () => pastePicture(b), d: 500 },
      away,
      { d: 450 },
      close,
      end,
    ];
  }
  function screenAt(r, p) {
    for (const m of r.members) {
      const o = origin(m);
      if (p.x >= o.x && p.x <= o.x + m.dw && p.y >= o.y && p.y <= o.y + m.dh) return m;
    }
    return null;
  }
  function reconcile(now) {
    const next = new Map();
    for (const members of components()) {
      const id = members.map(m => m.index).sort().join(',');
      let r = runners.get(id);
      if (!r && members.length > 1 && joinedAt === now) preferred = id;
      if (!r) {
        const before = [...runners.values()].find(o => members.includes(o.anchor.s));
        r = { id, members, anchor: before ? before.anchor : { s: members[0], fx: 0.5, fy: 0.5 }, beats: [], beat: null, start: now, last: null, pos: null, held: false, hold: 0, clickAt: -1e9 };
        members.forEach(resetScreen);
      }
      r.members = members;
      next.set(id, r);
    }
    runners = next;
    if (active && !runners.has(active.id)) active = null;
    if (preferred && active && active.id !== preferred) interrupt(now);
  }

  // Taking turns: one person, so one screen or joined group is in use at a time
  let active = null;
  let preferred = null;
  let lastActive = null;
  let gapUntil = 0;
  let turnsDone = 0;
  let joinedAt = -1;
  // Every separate screen or group gets a turn before the demo joins or splits anything
  const hadTurn = new Set();
  const everyoneHadATurn = () => runners.size > 0 && [...runners.keys()].every(id => hadTurn.has(id));
  function endTurn(r, now) {
    if (active !== r) return;
    hadTurn.add(r.id);
    active = null;
    gapUntil = now + 550;
    turnsDone++;
  }
  function interrupt(now) {
    active.members.forEach(resetScreen);
    active = null;
    gapUntil = now;
  }
  function nextTurn(now) {
    const list = [...runners.values()].sort((a, b) => Math.min(...a.members.map(m => m.x)) - Math.min(...b.members.map(m => m.x)));
    let r = preferred && runners.get(preferred);
    if (!r) {
      const i = list.findIndex(x => x.id === lastActive);
      r = list[(i + 1) % list.length];
    }
    preferred = null;
    active = r;
    lastActive = r.id;
    r.beats = script(r);
    r.beat = null;
    r.start = now;
    r.pos = at(r.anchor);
  }
  const carryTo = (c, k) => {
    c.win.x = c.x0 + (c.x - c.x0) * k;
    c.win.y = c.y0 + (c.y - c.y0) * k;
    putWindow(c.win);
  };
  // The pointer goes from screen to screen only across seams, like the real one: through each
  // seam on the way, at the point nearest the straight line to where it is going
  function crossing(m, p, q) {
    const A = drawn(m.a);
    const B = drawn(m.b);
    if (m.axis === 'x') {
      const x = (A.x + A.w + B.x) / 2;
      const t = Math.abs(q.x - p.x) > 1e-6 ? clamp((x - p.x) / (q.x - p.x), 0, 1) : 0.5;
      return { x, y: clamp(p.y + (q.y - p.y) * t, Math.max(A.y, B.y) + 12, Math.min(A.y + A.h, B.y + B.h) - 12) };
    }
    const y = (A.y + A.h + B.y) / 2;
    const t = Math.abs(q.y - p.y) > 1e-6 ? clamp((y - p.y) / (q.y - p.y), 0, 1) : 0.5;
    return { x: clamp(p.x + (q.x - p.x) * t, Math.max(A.x, B.x) + 12, Math.min(A.x + A.w, B.x + B.w) - 12), y };
  }
  function route(from, to) {
    if (from.s === to.s) return [from, to];
    const via = new Map([[from.s, null]]);
    const queue = [from.s];
    while (queue.length && !via.has(to.s)) {
      const s = queue.shift();
      for (const m of seams) {
        const n = m.a === s ? m.b : m.b === s ? m.a : null;
        if (n && !via.has(n)) {
          via.set(n, { s, m });
          queue.push(n);
        }
      }
    }
    if (!via.has(to.s)) return [from, to];
    const hops = [];
    for (let s = to.s; via.get(s); s = via.get(s).s) hops.unshift(via.get(s));
    const path = [from];
    let p = at(from);
    const q = at(to);
    for (const { s, m } of hops) {
      p = crossing(m, p, q);
      const o = origin(s);
      path.push({ s, fx: (p.x - o.x) / s.dw, fy: (p.y - o.y) / s.dh });
    }
    path.push(to);
    return path;
  }
  const length = points => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
  function along(points, k) {
    let left = length(points) * k;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (left <= d || i === points.length - 1) {
        const t = d > 1e-6 ? Math.min(1, left / d) : 1;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      left -= d;
    }
    return points[points.length - 1];
  }
  function begin(r, b, now) {
    if (b.to) {
      if (typeof b.to === 'function') b.to = b.to();
      b.path = route(r.anchor, b.to);
      if (!b.d) b.d = clamp(300 + length(b.path.map(at)) * 3.2, 420, 1900);
    }
    if (b.carry) Object.assign(b.carry, { x0: b.carry.win.x, y0: b.carry.win.y });
    const s = screenAt(r, at(r.anchor)) || r.anchor.s;
    // Keys are typed on the keyboard of the screen the scene started on, whichever screen
    // they act on: paste there, and it lands where the pointer is
    const home = r.members.includes(r.home) ? r.home : s;
    if (b.keys) key(home, Array.isArray(b.keys) ? b.keys : KEYS[home.os][b.keys], b.slot);
    if (b.click) {
      r.clickAt = now;
      ripple(s, at(r.anchor));
    }
    if (b.run) b.run();
    if (b.reset) r.members.forEach(resetScreen);
  }
  function step(r, now) {
    if (!r.beat || now - r.start >= r.beat.d) {
      const done = r.beat;
      if (done?.to) r.anchor = done.to;
      if (done?.carry) carryTo(done.carry, 1);
      if (!r.beats.length) {
        endTurn(r, now);
        return;
      }
      r.beat = r.beats.shift();
      r.start = now;
      begin(r, r.beat, now);
    }
    const b = r.beat;
    const k = ease(Math.min(1, (now - r.start) / Math.max(1, b.d)));
    r.pos = b.path ? along(b.path.map(at), k) : at(r.anchor);
    if (b.select) b.select.selection.style.width = `${((b.select.selected + 4) * k).toFixed(1)}px`;
    if (b.carry) carryTo(b.carry, k);
    r.held = Boolean(b.select || b.carry);
    const here = screenAt(r, r.pos);
    if (here && r.last && here !== r.last) pulse(r.last, here);
    if (here) r.last = here;
  }
  function drawPointers(now) {
    for (const r of runners.values()) {
      if (!r.pos) r.pos = at(r.anchor);
      const inUse = r === active;
      // The pointer dips on a click and stays a little smaller while it holds something
      r.hold += ((inUse && r.held ? 1 : 0) - r.hold) * 0.3;
      const click = Math.min(1, (now - r.clickAt) / 240);
      const scale = 1 - 0.12 * r.hold - 0.2 * Math.sin(click * Math.PI);
      for (const m of r.members) {
        const o = origin(m);
        const x = r.pos.x - o.x;
        const y = r.pos.y - o.y;
        m.el.classList.toggle('is-idle', !inUse);
        m.pointer.style.opacity = inUse ? '1' : '0';
        m.pointer.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      }
    }
  }

  // Camera, as in the app's arrangement: the toy is a box over the heading that shows only what
  // is inside it, and the camera frames every screen in it, centred, growing them when they
  // gather and shrinking them when they spread (at most 1.3 times their size). It follows live,
  // the screen in hand included: pull one past the edge and the desk shrinks to keep it in view
  const view = { s: 1, x: 0, y: 0 };
  function framing(W, H) {
    // Room for floating, and more for a lifted screen, drawn larger and glowing
    const room = s => 14 + s.lift * 18;
    const boxes = screens.map(s => ({ x: s.x - room(s), y: s.y - room(s) - s.lift * 4, r: s.x + s.w + room(s), b: s.y + s.h + room(s) }));
    // While a dragged screen overlaps another, where it would land stays in view too
    const spot = drag && drag.spot;
    if (spot) boxes.push({ x: spot.x - 14, y: spot.y - 14, r: spot.x + drag.s.w + 14, b: spot.y + drag.s.h + 14 });
    const l = Math.min(...boxes.map(o => o.x));
    const t = Math.min(...boxes.map(o => o.y));
    const r = Math.max(...boxes.map(o => o.r));
    const b = Math.max(...boxes.map(o => o.b));
    const s = Math.min(1.3, W / (r - l), H / (b - t));
    return { s, x: (W - (l + r) * s) / 2, y: (H - (t + b) * s) / 2 };
  }
  let framed = false;
  let drawnEdges = '';
  function film(dt, W, H) {
    const target = framing(W, H);
    // The first frame starts framed, so the page never opens with a zoom
    if (!framed) {
      Object.assign(view, target);
      framed = true;
    }
    // Quick while a screen is in hand, so it never runs out of the box; gentle otherwise
    const k = 1 - Math.exp(-dt / (drag ? 0.1 : 0.3));
    view.s += (target.s - view.s) * k;
    view.x += (target.x - view.x) * k;
    view.y += (target.y - view.y) * k;
    world.style.transform = `translate(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px) scale(${view.s.toFixed(4)})`;
    // Outline widths that draw the same however large or small the camera shows the screens
    // (the light theme uses them). Browsers round a border down to whole device pixels before
    // the camera scales it, so each width is the next whole step that draws at least as thick
    const px = drawn => Math.ceil((drawn / view.s) * devicePixelRatio - 0.01) / devicePixelRatio;
    const edges = `${px(1.8)}px ${px(1.4)}px`;
    if (edges !== drawnEdges) {
      const [edge, soft] = edges.split(' ');
      area.style.setProperty('--edge', edge);
      area.style.setProperty('--edge-soft', soft);
      drawnEdges = edges;
    }
  }
  // The part of the desk the box shows right now
  const shown = (W, H) => ({ x: -view.x / view.s, y: -view.y / view.s, w: W / view.s, h: H / view.s });
  const within = (box, r) => box.x >= r.x && box.y >= r.y && box.x + box.w <= r.x + r.w && box.y + box.h <= r.y + r.h;

  // Dragging
  let drag = null;
  let touched = false;
  let lastTouch = -1e9;
  let lastJoin = -1e9;
  let demo = null;
  // The toy opens by joining two screens; turns start with that first seam, or as soon as
  // someone takes over
  let opening = true;
  let openAt = null;
  let demoJoins = 0;
  // What a drag shows, as in the app: faint seams where the screen would join, a dashed outline
  // where it would land when it overlaps another, and the pull toward the nearest facing edge
  const ghosts = [];
  function showGhosts(list) {
    while (ghosts.length < list.length) ghosts.push(make('toy-seam toy-ghost', world));
    ghosts.forEach((el, i) => {
      const c = list[i];
      if (!c) {
        el.classList.remove('is-shown');
        return;
      }
      el.className = `toy-seam toy-ghost toy-seam-${c.axis} is-shown`;
      placeSeam({ a: c.a, b: c.b, axis: c.axis, el });
    });
  }
  const landing = make('toy-landing', world);
  function showLanding(s, spot) {
    landing.classList.toggle('is-shown', Boolean(spot));
    if (!spot) return;
    Object.assign(landing.style, { left: `${spot.x}px`, top: `${spot.y}px`, width: `${s.w}px`, height: `${s.h}px` });
  }
  const pull = make('toy-pull', world);
  const pullEdges = [make('toy-pull-edge', world), make('toy-pull-edge', world)];
  function showPull(m) {
    [pull, ...pullEdges].forEach(el => { el.style.display = m ? 'block' : 'none'; });
    if (!m) return;
    const opacity = (0.35 + 0.65 * m.strength).toFixed(2);
    const edges = [m.a - GAP / 2, m.b + GAP / 2];
    if (m.axis === 'v') {
      Object.assign(pull.style, { left: `${edges[0]}px`, top: `${m.start}px`, width: `${edges[1] - edges[0]}px`, height: `${m.length}px`, opacity });
      pullEdges.forEach((el, i) => Object.assign(el.style, { left: `${edges[i] - 1.25}px`, top: `${m.start + 6}px`, width: '2.5px', height: `${Math.max(0, m.length - 12)}px`, opacity }));
    } else {
      Object.assign(pull.style, { top: `${edges[0]}px`, left: `${m.start}px`, height: `${edges[1] - edges[0]}px`, width: `${m.length}px`, opacity });
      pullEdges.forEach((el, i) => Object.assign(el.style, { top: `${edges[i] - 1.25}px`, left: `${m.start + 6}px`, height: '2.5px', width: `${Math.max(0, m.length - 12)}px`, opacity }));
    }
  }
  showPull(null);

  for (const s of screens) {
    s.el.addEventListener('pointerenter', () => { s.hover = true; });
    s.el.addEventListener('pointerleave', () => { s.hover = false; });
    s.el.addEventListener('pointerdown', event => {
      if (drag) return;
      event.preventDefault();
      s.el.setPointerCapture(event.pointerId);
      if (demo) finishDemo(true);
      touched = true;
      opening = false;
      lastTouch = performance.now();
      // Bake the float of its whole group into place, so the grab doesn't jump and the seams it
      // has stay touching until it moves
      for (const m of componentOf(s)) {
        const o = offsets.get(m) || { x: 0, y: 0 };
        m.x += o.x;
        m.y += o.y;
        m.calm = 0;
      }
      s.land = null;
      drag = { s, id: event.pointerId, px: event.clientX, py: event.clientY, free: event.altKey };
      s.tx = s.x;
      s.ty = s.y;
      s.el.classList.add('is-dragging');
    });
    s.el.addEventListener('pointermove', event => {
      if (!drag || drag.s !== s || event.pointerId !== drag.id) return;
      // Each move carries it as far as the pointer went on screen, at the zoom of the moment, so
      // it keeps up with the hand while the camera reframes around it
      s.tx += (event.clientX - drag.px) / view.s;
      s.ty += (event.clientY - drag.py) / view.s;
      drag.px = event.clientX;
      drag.py = event.clientY;
      drag.free = event.altKey; // as in the app, Alt turns the magnet off
    });
    const release = event => {
      if (!drag || drag.s !== s || event.pointerId !== drag.id) return;
      s.el.classList.remove('is-dragging');
      const now = performance.now();
      lastTouch = now;
      // As in the app: the drop is judged where the hand let go, magnet included, and a screen
      // left on top of another glides to the nearest clear spot
      const aim = drag.free ? { x: s.tx, y: s.ty } : snapSpot(s, s.tx, s.ty, SNAP / view.s);
      const spot = landingSpot(s, aim.x, aim.y);
      s.land = { fx: s.x, fy: s.y, tx: spot.x, ty: spot.y, t0: now };
      drag = null;
      showLanding(s, null);
      showPull(null);
    };
    s.el.addEventListener('pointerup', release);
    s.el.addEventListener('pointercancel', release);
  }

  // The screen in hand goes where the hand takes it, over other screens if need be, snapping
  // when close to a spot where it would join others; its seams part once it no longer touches
  function dragStep(s, dt) {
    const aim = drag.free ? { x: s.tx, y: s.ty } : snapSpot(s, s.tx, s.ty, SNAP / view.s);
    const k = 1 - Math.exp(-dt / 0.04);
    s.x += (aim.x - s.x) * k;
    s.y += (aim.y - s.y) * k;
    for (const m of seams.filter(x => (x.a === s || x.b === s) && !touching(x.a, x.b))) unjoin(m);
    drag.spot = legal(s, aim.x, aim.y) ? null : landingSpot(s, aim.x, aim.y);
    showLanding(s, drag.spot);
    // On top of another, the landing outline is the cue; the pull shows only in the clear
    showPull(drag.free || drag.spot ? null : magnetOf(s, PULL / view.s));
    return meets(s).filter(c => !seamed(c.a, c.b));
  }

  // Demo: join the loose pieces by themselves until someone plays; joined screens stay joined
  // The flight arcs up as it crosses, less the more it travels up or down. The screen grows a
  // little with its lift, which is gone before the last fifth, so it lands at its true size
  const liftAt = p => Math.sin(Math.min(1, p * 1.25) * Math.PI);
  function flight(d, p) {
    const across = Math.abs(d.tx - d.fx) / (Math.abs(d.tx - d.fx) + Math.abs(d.ty - d.fy) + 1e-6);
    return { x: d.fx + (d.tx - d.fx) * ease(p), y: d.fy + (d.ty - d.fy) * ease(p) - Math.sin(p * Math.PI) * d.arc * across };
  }
  // A flight arcs up by default; where that would brush another screen it flies flat, or dips
  const arcs = [26, 0, -26];
  function clearFlight(s, fx, fy, tx, ty, arc) {
    for (let i = 1; i < 20; i++) {
      const p = flight({ fx, fy, tx, ty, arc }, i / 20);
      const grow = 0.025 * liftAt(i / 20);
      const box = { x: p.x - s.w * grow, y: p.y - s.h * grow, w: s.w * (1 + grow * 2), h: s.h * (1 + grow * 2) };
      if (screens.some(o => o !== s && exits(box, o, 0.5).length)) return false;
    }
    return true;
  }
  function startDemo(now) {
    const groups = components();
    if (groups.length > 1) {
      groups.sort((a, b) => a.length - b.length);
      const mover = groups[0][0];
      const others = screens.filter(o => !groups[0].includes(o));
      others.sort((a, b) => Math.hypot(a.x - mover.x, a.y - mover.y) - Math.hypot(b.x - mover.x, b.y - mover.y));
      const W = area.clientWidth;
      const H = area.clientHeight;
      const o = offsets.get(mover) || { x: 0, y: 0 };
      const fx = mover.x + o.x;
      const fy = mover.y + o.y;
      for (const fits of [true, false]) for (const target of others) {
        const beside = target.y + (target.h - mover.h) / 2;
        const level = target.x + (target.w - mover.w) / 2;
        const left = [target.x - GAP - mover.w, beside, 'x', mover, target];
        const right = [target.x + target.w + GAP, beside, 'x', target, mover];
        const above = [level, target.y - GAP - mover.h, 'y', mover, target];
        const below = [level, target.y + target.h + GAP, 'y', target, mover];
        const sides = [
          ...(mover.x + mover.w / 2 < target.x + target.w / 2 ? [left, right] : [right, left]),
          ...(mover.y + mover.h / 2 < target.y + target.h / 2 ? [above, below] : [below, above]),
        ];
        for (const [x, y, axis, a, b] of sides) {
          if ((fits && !within({ x, y, w: mover.w, h: mover.h }, shown(W, H))) || !legal(mover, x, y)) continue;
          const arc = arcs.find(a => clearFlight(mover, fx, fy, x, y, a));
          if (arc === undefined) continue;
          mover.x = fx;
          mover.y = fy;
          mover.calm = 0;
          demo = { s: mover, fx, fy, tx: x, ty: y, arc, t0: now, d: 1700, c: { x, y, axis, a, b, mover } };
          mover.el.classList.add('is-dragging');
          return;
        }
      }
    }
  }
  function finishDemo(cancelled, now = performance.now()) {
    const s = demo.s;
    s.el.classList.remove('is-dragging');
    if (!cancelled && demo.c) {
      s.x = demo.tx;
      s.y = demo.ty;
      joinTouching(s, now);
      demoJoins++;
    }
    demo = null;
  }
  function demoStep(now) {
    const p = Math.min(1, (now - demo.t0) / demo.d);
    const s = demo.s;
    const px = s.x;
    Object.assign(s, flight(demo, p));
    s.tilt += (clamp((s.x - px) * 0.4, -4, 4) - s.tilt) * 0.2;
    s.lift = liftAt(p);
    if (p >= 1) finishDemo(false, now);
    return demo && demo.c && p > 0.7 ? [demo.c] : [];
  }

  // The frame loop
  let last = null;
  let frameId = 0;
  function frame(now) {
    const dt = last === null ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    // The toy opens by joining two screens; once the pair has played one scene, the third
    // screen joins them straight away, and the three carry on together. Any later demo waits
    // until every piece has had its turn, and none cuts into a turn
    if (openAt === null) openAt = now + 700;
    if (opening) {
      if (!drag && !demo && now >= openAt) {
        startDemo(now);
        if (!demo) opening = false; // no room to join them: start with the turns instead
      }
    } else if (!drag && !demo && !touched && !active && components().length > 1 &&
      (demoJoins === 1 ? turnsDone >= 1 : everyoneHadATurn() && now - lastJoin > 7000)) {
      startDemo(now);
    }

    let previews = [];
    for (const s of screens) {
      if (drag && drag.s === s) previews = dragStep(s, dt);
      else if (demo && demo.s === s) previews = demoStep(now);
      else s.tilt *= 1 - Math.min(1, dt * 6);
      if (s.land) {
        // A release settles as in the app: straight to its spot, easing out over 340 ms, and
        // joins whatever it comes to rest against
        const p = Math.min(1, (now - s.land.t0) / 340);
        const k = 1 - (1 - p) ** 3;
        s.x = s.land.fx + (s.land.tx - s.land.fx) * k;
        s.y = s.land.fy + (s.land.ty - s.land.fy) * k;
        if (p >= 1) {
          s.land = null;
          joinTouching(s, now);
        }
      }
      if (!(demo && demo.s === s)) {
        const lifted = drag && drag.s === s ? 1 : s.hover ? 0.35 : 0;
        s.lift += (lifted - s.lift) * Math.min(1, dt * 10);
      }
      s.calm = Math.min(1, s.calm + dt * 0.8);
    }

    const W = area.clientWidth;
    const H = area.clientHeight;

    // Float: loose screens bob and sway, joined ones move together and sit level. Close to
    // another group they float less, so floating never brings two together
    offsets.clear();
    for (const group of components()) {
      let gap = Infinity;
      for (const o of screens) if (!group.includes(o)) for (const g of group) gap = Math.min(gap, apart(foot(g), foot(o)));
      const room = clamp((gap - 1) / 14, 0, 1);
      for (const g of group) g.room += (room - g.room) * Math.min(1, dt * 4);
      const lead = group[0];
      const calm = Math.min(...group.map(s => s.calm)) * Math.min(...group.map(s => s.room));
      const fx = Math.sin(t * 0.45 + lead.phase) * 5 * calm;
      const fy = Math.cos(t * 0.37 + lead.phase * 1.3) * 4 * calm;
      for (const s of group) {
        const moving = (drag && drag.s === s) || (demo && demo.s === s) || s.land;
        offsets.set(s, { x: moving ? 0 : fx, y: moving ? 0 : fy, r: group.length === 1 && !moving ? Math.sin(t * 0.3 + lead.phase) * 1.4 * calm : 0 });
      }
    }
    film(dt, W, H);
    reconcile(now);
    if (!opening && !active && !demo && now >= gapUntil) nextTurn(now);
    for (const s of screens) {
      const o = offsets.get(s);
      const since = (now - s.squashAt) / 1000;
      const squash = since < 1 ? 1 - 0.05 * Math.exp(-since * 9) * Math.cos(since * 30) : 1;
      const scale = (1 + s.lift * 0.05) * squash;
      // A plain 2D transform, so the tilted screen is painted afresh each frame: a GPU layer
      // (translate3d, will-change) would rotate a bitmap and wash out the thin pointer
      s.el.style.transform = `translate(${(s.x + o.x).toFixed(1)}px, ${(s.y + o.y - s.lift * 4).toFixed(1)}px) rotate(${(o.r + s.tilt).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      s.el.style.setProperty('--lift', s.lift.toFixed(3));
    }
    seams.forEach(placeSeam);
    showGhosts(previews);
    if (active) step(active, now);
    drawPointers(now);
    frameId = requestAnimationFrame(frame);
  }

  // Run only while the toy is on screen in a visible tab
  let visible = false;
  const update = () => {
    const play = visible && !document.hidden;
    if (play && !frameId) {
      last = null;
      frameId = requestAnimationFrame(frame);
    } else if (!play && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(area);
  document.addEventListener('visibilitychange', update);
  new ResizeObserver(() => {
    if (!touched && !seams.length) place();
  }).observe(area);
})();
