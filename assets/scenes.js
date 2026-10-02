// The feature sections' scenes, drawn like the hero's desk toy. Each tells its feature with the
// toy's outline screens, seams, keycaps, windows and pointer, each in its own kind of shot: a
// desk with a keyboard and mouse per computer, a desk the visitor arranges by hand, a wide band
// that fills with screens as the page scrolls, a close-up on a seam, and a network diagram. A
// story runs on its own clock, which moves only while its section is in view. On phones each
// section is a card of its own, and a story starts over whenever its card comes back.
(() => {
  const scenes = [...document.querySelectorAll('.scene')];
  if (!scenes.length) return;

  const POINTER = '<svg viewBox="0 0 64 73"><path d="M1.61 15.1C1.61 26.09 1.6 37.09 1.64 48.08C1.66 52.69 1.26 57.49 1.78 62.07C2.4 67.46 7.1 71.79 12.57 71.89C18.25 72 21.62 67.66 25.06 63.83C26.84 61.84 28.69 59.92 30.53 57.99C31.41 57.06 32.28 55.9 33.35 55.18C35.46 53.74 38.71 54.08 41.14 53.88C42.97 53.73 44.76 53.33 46.59 53.16C48.57 52.97 50.61 53.04 52.56 52.63C57.99 51.5 62.1 47.28 62.14 41.59C62.18 35.08 56.86 31.77 52.14 28.35C43.4 22.03 34.76 15.47 26.22 8.88C22.35 5.89 18.05 1.78 12.91 1.71C7.99 1.64 3.46 4.87 2.06 9.64C1.54 11.4 1.61 13.29 1.61 15.1Z"/><path fill-rule="evenodd" d="M1.61 15.1C1.61 26.09 1.6 37.09 1.64 48.08C1.66 52.69 1.26 57.49 1.78 62.07C2.4 67.46 7.1 71.79 12.57 71.89C18.25 72 21.62 67.66 25.06 63.83C26.84 61.84 28.69 59.92 30.53 57.99C31.41 57.06 32.28 55.9 33.35 55.18C35.46 53.74 38.71 54.08 41.14 53.88C42.97 53.73 44.76 53.33 46.59 53.16C48.57 52.97 50.61 53.04 52.56 52.63C57.99 51.5 62.1 47.28 62.14 41.59C62.18 35.08 56.86 31.77 52.14 28.35C43.4 22.03 34.76 15.47 26.22 8.88C22.35 5.89 18.05 1.78 12.91 1.71C7.99 1.64 3.46 4.87 2.06 9.64C1.54 11.4 1.61 13.29 1.61 15.1ZM5.66 55.51C5.66 59.6 5.02 64.31 9.1 66.75C10.23 67.43 11.56 67.88 12.88 67.88C19.54 67.89 26.34 53.87 32.12 51.23C34.2 50.28 43.61 49.41 46.43 49.15C51.71 48.66 58.15 48.56 58.14 41.45C58.13 36.57 53.03 33.82 49.49 31.28C40.98 25.16 32.75 18.66 24.27 12.5C21.06 10.17 17.03 5.79 12.9 5.76C5.8 5.7 5.66 11.68 5.66 16.98C5.66 29.82 5.66 42.67 5.66 55.51Z"/></svg>';
  const FILE = '<svg viewBox="0 0 14 17"><path d="M1.5 1.5H9L12.5 5V15.5H1.5Z"/><path d="M9 1.5V5H12.5"/></svg>';
  const WIFI = '<svg viewBox="0 0 16 12"><path d="M1.5 4.6a9.2 9.2 0 0 1 13 0"/><path d="M4 7.2a5.6 5.6 0 0 1 8 0"/><path d="M6.5 9.7a2 2 0 0 1 3 0"/></svg>';
  const WIRED = '<svg viewBox="0 0 16 14"><rect x="5.5" y="1" width="5" height="3.6" rx="1"/><rect x="1" y="9.4" width="5" height="3.6" rx="1"/><rect x="10" y="9.4" width="5" height="3.6" rx="1"/><path d="M8 4.6V7M3.5 9.4V7h9v2.4"/></svg>';
  const GAP = 3;
  const SIZE = { mac: [186, 118], win: [206, 118], small: [160, 102] };
  const KEYS = { mac: { copy: ['⌘', 'C'], paste: ['⌘', 'V'] }, win: { copy: ['Ctrl', 'C'], paste: ['Ctrl', 'V'] } };
  const EDGE = 1.4; // a window's outline
  // As in the app: a dragged screen snaps within 12 pixels on screen, and the pull toward the
  // nearest facing edge shows from 52
  const SNAP = 12;
  const PULL = 52;
  const SVG = 'http://www.w3.org/2000/svg';
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const ease = p => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
  const out = p => 1 - (1 - p) ** 3;
  const mix = (a, b, k) => a + (b - a) * k;
  const make = (cls, parent, html) => {
    const node = document.createElement('div');
    node.className = cls;
    if (html) node.innerHTML = html;
    parent.append(node);
    return node;
  };
  const show = el => {
    el.getBoundingClientRect(); // start from the hidden state, so the change animates
    el.classList.add('is-shown');
  };
  // Place something on the desk, in desk units; width and height only when given
  const put = (el, x, y, w, h) => {
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if (w !== undefined) {
      el.style.width = `${w.toFixed(1)}px`;
      el.style.height = `${h.toFixed(1)}px`;
    }
  };

  class Scene {
    constructor(el) {
      this.el = el;
      this.world = make('scene-world', el);
      this.time = 0;
      this.waits = [];
      this.tweens = [];
      this.screens = [];
      this.seams = [];
      this.view = null;
      this.box = null;
      this.pointer = make('toy-pointer scene-pointer', this.world, POINTER);
      this.p = { x: 0, y: 0, shown: false, clickAt: -1e9, held: 0, on: null };
      this.hooks = [];
      this.fit = null; // a function returning the box to frame, if not the screens
      this.zoom = 1.35; // the most the camera enlarges
      this.quick = false; // the camera keeps up faster while a screen is in hand
      this.carried = null; // what rides beside the pointer: the clipboard, on its way over
      this.cleanups = []; // what to undo when the scene is thrown away
    }
    dispose() {
      this.world.remove();
      for (const fn of this.cleanups) fn();
    }
    every(fn) {
      this.hooks.push(fn);
    }

    // The scene's own clock
    sleep(ms) {
      return new Promise(resolve => this.waits.push({ at: this.time + ms, resolve }));
    }
    tween(ms, fn, curve = ease) {
      return new Promise(resolve => this.tweens.push({ t0: this.time, ms, fn, curve, resolve }));
    }
    tick(dt) {
      this.time += dt;
      for (const fn of this.hooks) fn(this.time, dt);
      for (const t of [...this.tweens]) {
        const p = Math.min(1, (this.time - t.t0) / t.ms);
        t.fn(t.curve(p), p);
        if (p >= 1) {
          this.tweens.splice(this.tweens.indexOf(t), 1);
          t.resolve();
        }
      }
      for (const w of [...this.waits]) {
        if (this.time >= w.at) {
          this.waits.splice(this.waits.indexOf(w), 1);
          w.resolve();
        }
      }
      this.draw(dt);
    }

    // Screens, seams and what they show
    screen(kind, x, y, os = kind === 'mac' ? 'mac' : 'win') {
      const [w, h] = SIZE[kind];
      const s = { kind, os, x, y, w, h, lift: 0, fade: 1, el: make(`toy-screen toy-${os}`, this.world) };
      s.el.style.width = `${w}px`;
      s.el.style.height = `${h}px`;
      s.display = make('toy-display', s.el);
      make(os === 'mac' ? 'toy-dock' : 'toy-taskbar', s.display);
      s.desk = make('toy-layer', s.display);
      s.wins = make('toy-layer', s.display);
      s.keys = make('toy-layer', s.display);
      this.screens.push(s);
      return s;
    }
    drop(s) {
      this.seams.filter(m => m.a === s || m.b === s).forEach(m => this.part(m, true));
      if (this.screens.includes(s)) this.screens.splice(this.screens.indexOf(s), 1);
      s.el.remove();
    }
    seamBetween(a, b) {
      return this.seams.find(m => (m.a === a && m.b === b) || (m.a === b && m.b === a));
    }
    // A new seam draws itself in and sparkles; a quiet one is simply there
    join(a, b, quiet = false, spark = !quiet) {
      // a on the left or top
      const axis = Math.abs(a.x + a.w + GAP - b.x) < 1 || Math.abs(b.x + b.w + GAP - a.x) < 1 ? 'x' : 'y';
      if ((axis === 'x' && b.x < a.x) || (axis === 'y' && b.y < a.y)) [a, b] = [b, a];
      const m = { a, b, axis, el: make(`toy-seam toy-seam-${axis}${quiet ? '' : ' is-born'}`, this.world) };
      this.seams.push(m);
      this.placeSeam(m);
      if (spark) {
        const c = this.seamCentre(m);
        this.sparkle(c.x, c.y);
      }
      return m;
    }
    part(m, quiet = false) {
      this.seams.splice(this.seams.indexOf(m), 1);
      if (quiet) {
        m.el.remove();
        return;
      }
      m.el.classList.remove('is-born');
      m.el.classList.add('is-breaking');
      setTimeout(() => m.el.remove(), 380);
    }
    pulse(m) {
      // From bright back to the seam's own look, however dim that is
      m.el.animate([{ filter: 'brightness(2.6)', opacity: 1 }], { duration: 450, easing: 'ease-out' });
    }
    seamCentre(m) {
      const { a: A, b: B } = m;
      return m.axis === 'x'
        ? { x: (A.x + A.w + B.x) / 2, y: (Math.max(A.y, B.y) + Math.min(A.y + A.h, B.y + B.h)) / 2 }
        : { x: (Math.max(A.x, B.x) + Math.min(A.x + A.w, B.x + B.w)) / 2, y: (A.y + A.h + B.y) / 2 };
    }
    placeSeam(m) {
      const { a: A, b: B } = m;
      let left;
      let top;
      let size;
      if (m.axis === 'x') {
        left = (A.x + A.w + B.x) / 2 - GAP / 2;
        top = Math.max(A.y, B.y) + 10;
        size = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - 10 - top);
      } else {
        top = (A.y + A.h + B.y) / 2 - GAP / 2;
        left = Math.max(A.x, B.x) + 10;
        size = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - 10 - left);
      }
      const key = `${left.toFixed(1)} ${top.toFixed(1)} ${size.toFixed(1)}`;
      if (key === m.drawn) return;
      m.drawn = key;
      m.el.style.left = `${left.toFixed(1)}px`;
      m.el.style.top = `${top.toFixed(1)}px`;
      m.el.style[m.axis === 'x' ? 'height' : 'width'] = `${size.toFixed(1)}px`;
    }
    sparkle(x, y) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
        const d = 26 + Math.random() * 26;
        const node = make('toy-spark', this.world);
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.setProperty('--sx', `${Math.cos(a) * d}px`);
        node.style.setProperty('--sy', `${Math.sin(a) * d}px`);
        node.addEventListener('animationend', () => node.remove());
      }
    }
    // Keystrokes pop up on the screen whose keyboard typed them, at `at` across it
    key(s, labels, { slot, at = 0.5 } = {}) {
      const chord = make('toy-chord', s.keys);
      const shift = slot ? (slot[0] - (slot[1] - 1) / 2) * 19 : 0;
      chord.style.left = `calc(${(at * 100).toFixed(1)}% + ${shift.toFixed(1)}px)`;
      for (const label of [].concat(labels)) {
        const cap = make('toy-key', chord);
        if (label.startsWith('<')) cap.innerHTML = label;
        else cap.textContent = label;
      }
      chord.addEventListener('animationend', () => chord.remove());
    }

    // Windows, as in the toy
    open(s, [x, y, w, h], kind) {
      const win = { s, x, y, w, h, el: make(`toy-window toy-window-${kind}`, s.wins) };
      for (const [name, v] of [['--wx', x], ['--wy', y], ['--ww', w], ['--wh', h]]) win.el.style.setProperty(name, v);
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
      }
      return win;
    }
    inside(win) {
      return { w: win.w * win.s.w - EDGE * 2, h: win.h * win.s.h - EDGE * 2 };
    }
    spot(win, x, y) {
      return { x: win.s.x + win.x * win.s.w + EDGE + x, y: win.s.y + win.y * win.s.h + EDGE + y };
    }
    close(...wins) {
      for (const win of wins) {
        win.el.classList.remove('is-shown');
        setTimeout(() => win.el.remove(), 400);
      }
    }
    clear(s) {
      for (const el of [...s.wins.children, ...s.desk.children]) {
        el.classList.remove('is-shown');
        setTimeout(() => el.remove(), 400);
      }
    }

    // The pointer
    async point(x, y, ms) {
      if (!this.p.shown) {
        Object.assign(this.p, { x, y, shown: true, on: null });
        return this.sleep(ms || 200);
      }
      const fx = this.p.x;
      const fy = this.p.y;
      const d = Math.hypot(x - fx, y - fy);
      await this.tween(ms || clamp(300 + d * 2.6, 380, 1500), k => {
        this.p.x = fx + (x - fx) * k;
        this.p.y = fy + (y - fy) * k;
      });
    }
    under(x, y) {
      return this.screens.find(s => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
    }
    click() {
      this.p.clickAt = this.time;
      const s = this.under(this.p.x, this.p.y);
      if (!s) return;
      const ring = make('toy-click', s.keys);
      ring.style.left = `${(this.p.x - s.x).toFixed(1)}px`;
      ring.style.top = `${(this.p.y - s.y).toFixed(1)}px`;
      ring.addEventListener('animationend', () => ring.remove());
    }
    away(dx = 16, dy = 14) {
      return this.point(this.p.x + dx, this.p.y + dy, 380);
    }
    hide() {
      this.p.shown = false;
      this.p.on = null;
    }

    // Camera: frame a box, or every screen, and glide when that changes
    frame() {
      if (this.fit) return this.fit();
      if (this.box) return this.box;
      const room = 16;
      return {
        l: Math.min(...this.screens.map(s => s.x)) - room,
        t: Math.min(...this.screens.map(s => s.y - s.lift * 4)) - room,
        r: Math.max(...this.screens.map(s => s.x + s.w)) + room,
        b: Math.max(...this.screens.map(s => s.y + s.h)) + room,
      };
    }
    draw(dt) {
      const W = this.el.clientWidth;
      const H = this.el.clientHeight;
      if ((this.fit || this.box || this.screens.length) && W && H) {
        const f = this.frame();
        const s = Math.min(this.zoom, W / (f.r - f.l), H / (f.b - f.t));
        const target = { s, x: (W - (f.l + f.r) * s) / 2, y: (H - (f.t + f.b) * s) / 2 };
        if (!this.view) this.view = { ...target };
        const k = 1 - Math.exp(-dt / (this.quick ? 100 : 350));
        for (const key of ['s', 'x', 'y']) this.view[key] += (target[key] - this.view[key]) * k;
        const t = `translate(${this.view.x.toFixed(2)}px, ${this.view.y.toFixed(2)}px) scale(${this.view.s.toFixed(4)})`;
        if (t !== this.drawn) {
          this.world.style.transform = t;
          this.drawn = t;
        }
        edges(this.el, this.view.s, this);
      }
      // Only what changed is written, as the band holds dozens of screens
      for (const s of this.screens) {
        const t = `translate(${s.x.toFixed(1)}px, ${(s.y - s.lift * 4).toFixed(1)}px) scale(${(1 + s.lift * 0.05).toFixed(4)})`;
        if (t !== s.drawn) {
          s.el.style.transform = t;
          s.drawn = t;
        }
        const lift = s.lift.toFixed(3);
        if (lift !== s.drawnLift) {
          s.el.style.setProperty('--lift', lift);
          s.el.classList.toggle('is-dragging', s.lift > 0.5);
          s.drawnLift = lift;
        }
        const fade = s.fade.toFixed(3);
        if (fade !== s.drawnFade) {
          s.el.style.opacity = fade;
          s.drawnFade = fade;
        }
      }
      this.seams.forEach(m => this.placeSeam(m));
      const since = this.time - this.p.clickAt;
      const dip = since < 240 ? Math.sin((since / 240) * Math.PI) * 0.2 : 0;
      this.p.held += ((this.p.holding ? 1 : 0) - this.p.held) * Math.min(1, dt / 60);
      const scale = 1 - dip - 0.12 * this.p.held;
      this.pointer.style.opacity = this.p.shown ? '1' : '0';
      this.pointer.style.transform = `translate(${this.p.x.toFixed(1)}px, ${this.p.y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      // A seam the pointer crosses lights up
      const here = this.p.shown ? this.under(this.p.x, this.p.y) : null;
      if (here && this.p.on && here !== this.p.on) {
        const m = this.seamBetween(here, this.p.on);
        if (m) this.pulse(m);
      }
      if (here) this.p.on = here;
      if (this.carried) put(this.carried, this.p.x + this.carried.dx, this.p.y + this.carried.dy);
    }
    // Something that rides beside the pointer, below and to the right of its tip
    carry(el, dx, dy) {
      this.carried = Object.assign(el, { dx, dy });
    }

    // A badge on a network link: its icon and its latency
    badge(x, y, icon) {
      const el = make('scene-badge', this.world, icon);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      return el;
    }
  }

  // Outline widths that draw the same however large or small the camera shows the screens (the
  // light theme uses them). Browsers round a border down to whole device pixels before the
  // camera scales it, so each width is the next whole step that draws at least as thick
  function edges(el, scale, memo) {
    const px = drawn => Math.ceil((drawn / scale) * devicePixelRatio - 0.01) / devicePixelRatio;
    const key = `${px(1.8)}px ${px(1.4)}px`;
    if (key === memo.edges) return;
    memo.edges = key;
    const [edge, soft] = key.split(' ');
    el.style.setProperty('--edge', edge);
    el.style.setProperty('--edge-soft', soft);
  }

  // Helpers the stories share
  function pasteLine(sc, win, width) {
    const room = sc.inside(win).w - 14;
    const line = make('toy-line is-pasted', win.el);
    line.style.setProperty('--i', 0);
    line.style.setProperty('--len', Math.min(1, width / room).toFixed(3));
    caret(win, 8 + Math.min(width, room));
  }
  function caret(win, x) {
    win.caret = win.caret || make('toy-caret', win.el);
    win.caret.style.left = `${x.toFixed(1)}px`;
  }
  function type(win, text) {
    if (!win.words) {
      win.words = make('toy-typed', win.el);
      win.words.append(document.createTextNode(''));
      make('toy-caret-after', win.words);
    }
    win.words.firstChild.data = text;
  }

  // The app's arrangement rules (crates/mkcplus-app/src/canvas.rs), as the hero's toy has them,
  // over a scene's screens. A screen's footprint is its display with half a seam's gap all
  // round, so footprints that meet mean displays a seam apart
  function arrangement(screens) {
    const foot = (s, x = s.x, y = s.y) => ({ x: x - GAP / 2, y: y - GAP / 2, w: s.w + GAP, h: s.h + GAP });
    const overlaps = (a, b) =>
      Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.001 &&
      Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.001;
    const legal = (s, x, y) => screens.every(o => o === s || !overlaps(foot(s, x, y), foot(o)));
    // Footprints that meet along an edge long enough to cross make a seam
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
    return { legal, touching, meets, snapSpot, landingSpot, magnetOf };
  }

  // A keyboard and mouse on the desk in front of a screen, seen from above, drawn like the
  // screens. The pair in use lights up; its mouse moves with the pointer, wherever the pointer
  // is, and its keys light as they are typed
  function peripherals(sc, s) {
    const KW = 120;
    const KH = 36;
    const MW = 15;
    const MH = 22;
    const x = s.x + (s.w - (KW + 12 + MW)) / 2;
    const y = s.y + s.h + 26;
    const kb = document.createElementNS(SVG, 'svg');
    kb.setAttribute('class', 'scene-keyboard');
    kb.setAttribute('viewBox', `0 0 ${KW} ${KH}`);
    Object.assign(kb.style, { width: `${KW}px`, height: `${KH}px`, transform: `translate(${x}px, ${y}px)` });
    const pitch = (KW - 10) / 10;
    const keys = new Map();
    const cap = (letter, kx, ky, w) => {
      const r = document.createElementNS(SVG, 'rect');
      Object.entries({ class: 'scene-key', x: kx.toFixed(1), y: ky.toFixed(1), width: w.toFixed(1), height: 5.6, rx: 1.4 }).forEach(([k, v]) => r.setAttribute(k, v));
      kb.append(r);
      keys.set(letter, { r, x: x + kx + w / 2 });
    };
    const shell = document.createElementNS(SVG, 'rect');
    Object.entries({ x: 0.7, y: 0.7, width: KW - 1.4, height: KH - 1.4, rx: 4 }).forEach(([k, v]) => shell.setAttribute(k, v));
    kb.append(shell);
    ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach((row, r) => {
      [...row].forEach((letter, i) => cap(letter, 5 + ([0, 0.3, 0.8][r] + i) * pitch + 1.2, 4.6 + r * 7.4, pitch - 2.4));
    });
    cap(' ', 5 + 2.3 * pitch + 1.2, 4.6 + 3 * 7.4, 5.4 * pitch - 2.4);
    const mouse = document.createElementNS(SVG, 'svg');
    mouse.setAttribute('class', 'scene-mouse');
    mouse.setAttribute('viewBox', `0 0 ${MW} ${MH}`);
    mouse.innerHTML = '<path class="scene-mouse-button" d="M1 8.5V7.5C1 3.9 3.9 1 7.5 1V8.5Z"/><path d="M7.5 1C11.1 1 14 3.9 14 7.5V14.5C14 18.1 11.1 21 7.5 21C3.9 21 1 18.1 1 14.5V7.5C1 3.9 3.9 1 7.5 1Z"/><path d="M7.5 1V8.5M1 8.5H14"/>';
    Object.assign(mouse.style, { width: `${MW}px`, height: `${MH}px` });
    sc.world.append(kb, mouse);
    const home = { x: x + KW + 12, y: y + (KH - MH) / 2 };
    const set = {
      off: { x: 0, y: 0 },
      wake(on) {
        kb.classList.toggle('is-active', on);
        mouse.classList.toggle('is-active', on);
      },
      // A key lights, and its letter pops up above it
      press(letter) {
        const key = keys.get(letter.toUpperCase());
        if (!key) return;
        key.r.classList.add('is-pressed');
        setTimeout(() => key.r.classList.remove('is-pressed'), 170);
        const chord = make('toy-chord scene-chord', sc.world);
        make('toy-key', chord).textContent = letter.toUpperCase();
        chord.style.left = `${key.x.toFixed(1)}px`;
        chord.style.top = `${(y - 17).toFixed(1)}px`;
        chord.addEventListener('animationend', () => chord.remove());
      },
      click() {
        mouse.classList.add('is-click');
        setTimeout(() => mouse.classList.remove('is-click'), 200);
      },
      draw() {
        mouse.style.transform = `translate(${(home.x + set.off.x).toFixed(1)}px, ${(home.y + set.off.y).toFixed(1)}px)`;
      },
    };
    set.draw();
    return set;
  }

  // 1. Control any device from any device: each computer has its own keyboard and mouse, and
  // either pair works both. The PC's mouse takes the pointer over the seam and its keyboard
  // types on the Mac; then the Mac's do the same on the PC
  async function control(sc) {
    const pc = sc.screen('win', 0, 0);
    const mac = sc.screen('mac', 206 + GAP, 0);
    sc.join(pc, mac, true);
    const desk = new Map([[pc, peripherals(sc, pc)], [mac, peripherals(sc, mac)]]);
    sc.zoom = 1.6;
    sc.box = { l: -14, t: -14, r: 206 + GAP + 186 + 14, b: 118 + 26 + 36 + 14 };
    // The mouse in hand moves with the pointer, a little; put down, it settles back
    let hand = null;
    let from = null;
    sc.every((time, dt) => {
      for (const set of desk.values()) {
        if (set === hand) {
          set.off.x = clamp((sc.p.x - from.x) * 0.05, -8, 8);
          set.off.y = clamp((sc.p.y - from.y) * 0.05, -4, 4);
        } else {
          const k = Math.exp(-dt / 260);
          set.off.x *= k;
          set.off.y *= k;
        }
        set.draw();
      }
    });
    await sc.point(pc.x + 64, pc.y + 50, 300);
    for (;;) {
      for (const [own, other, word] of [[pc, mac, 'Hi'], [mac, pc, 'Hey']]) {
        const set = desk.get(own);
        set.wake(true);
        hand = set;
        from = { x: sc.p.x, y: sc.p.y };
        await sc.sleep(450);
        // Over the seam, into a window on the other computer
        const win = sc.open(other, [0.22, 0.14, 0.56, 0.52], 'doc');
        const into = sc.spot(win, sc.inside(win).w * 0.42, sc.inside(win).h * 0.56);
        await sc.point(into.x, into.y);
        set.click();
        sc.click();
        show(win.el);
        await sc.sleep(300);
        await sc.away();
        // And this computer's keyboard types there
        for (const letter of word) {
          set.press(letter);
          type(win, win.words ? win.words.firstChild.data + letter : letter);
          await sc.sleep(240);
        }
        await sc.sleep(1000);
        hand = null;
        set.wake(false);
        sc.close(win);
        await sc.sleep(650);
      }
    }
  }

  // 2. Arrange devices to match your desk, by hand: these screens follow the app's arrangement
  // rules, as the hero's do. Until the visitor takes one, a pointer shows the way
  async function arrange(sc) {
    // In a tall box, as on a phone, the PC and the Mac start side by side with the small screen
    // below the seam between them, joined to both; otherwise the three start in a row
    const tall = sc.el.clientHeight > sc.el.clientWidth;
    const under = 206 + GAP / 2 - 160 / 2; // the small screen centred under the PC and Mac's seam
    const mac = tall ? sc.screen('mac', 206 + GAP, 0) : sc.screen('mac', 0, 0);
    const pc = tall ? sc.screen('win', 0, 0) : sc.screen('win', 186 + GAP, 0);
    const small = tall ? sc.screen('small', under, 118 + GAP) : sc.screen('small', 186 + GAP + 206 + GAP, 8);
    sc.join(mac, pc, true);
    sc.join(pc, small, true);
    if (tall) sc.join(mac, small, true);
    sc.zoom = 1.25;
    const list = sc.screens;
    const rules = arrangement(list);
    let drag = null;
    let touched = false;

    // What a drag shows, as in the app: faint seams where the screen would join, a dashed
    // outline where it would land when it overlaps another, and the pull toward the nearest
    // facing edge
    const ghosts = [];
    const showGhosts = cs => {
      while (ghosts.length < cs.length) ghosts.push(make('toy-seam toy-ghost', sc.world));
      ghosts.forEach((el, i) => {
        const c = cs[i];
        if (!c) {
          el.classList.remove('is-shown');
          return;
        }
        el.className = `toy-seam toy-ghost toy-seam-${c.axis} is-shown`;
        sc.placeSeam({ a: c.a, b: c.b, axis: c.axis, el });
      });
    };
    const landing = make('toy-landing', sc.world);
    const showLanding = (s, spot) => {
      landing.classList.toggle('is-shown', Boolean(spot));
      if (spot) Object.assign(landing.style, { left: `${spot.x}px`, top: `${spot.y}px`, width: `${s.w}px`, height: `${s.h}px` });
    };
    const pull = make('toy-pull', sc.world);
    const pullEdges = [make('toy-pull-edge', sc.world), make('toy-pull-edge', sc.world)];
    const showPull = m => {
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
    };
    showPull(null);

    // Camera: every screen with room around it, and where a dragged one would land
    sc.fit = () => {
      const room = s => 14 + s.lift * 18;
      const boxes = list.map(s => ({ l: s.x - room(s), t: s.y - room(s) - s.lift * 4, r: s.x + s.w + room(s), b: s.y + s.h + room(s) }));
      const spot = drag && drag.spot;
      if (spot) boxes.push({ l: spot.x - 14, t: spot.y - 14, r: spot.x + drag.s.w + 14, b: spot.y + drag.s.h + 14 });
      return {
        l: Math.min(...boxes.map(b => b.l)),
        t: Math.min(...boxes.map(b => b.t)),
        r: Math.max(...boxes.map(b => b.r)),
        b: Math.max(...boxes.map(b => b.b)),
      };
    };

    const hold = (s, how) => {
      s.land = null;
      s.tx = s.x;
      s.ty = s.y;
      drag = { s, ...how };
      sc.quick = true;
    };
    // As in the app: the drop is judged where the hand let go, magnet included, and a screen
    // left on top of another glides to the nearest clear spot
    const letGo = () => {
      const s = drag.s;
      const aim = drag.free ? { x: s.tx, y: s.ty } : rules.snapSpot(s, s.tx, s.ty, SNAP / sc.view.s);
      const spot = rules.landingSpot(s, aim.x, aim.y);
      s.land = { fx: s.x, fy: s.y, tx: spot.x, ty: spot.y, t0: sc.time };
      drag = null;
      sc.quick = false;
      showLanding(s, null);
      showPull(null);
      showGhosts([]);
    };
    sc.every((time, dt) => {
      for (const s of list) {
        s.lift += ((drag && drag.s === s ? 1 : 0) - s.lift) * (1 - Math.exp(-dt / 70));
        if (!s.land) continue;
        const p = Math.min(1, (time - s.land.t0) / 340);
        s.x = mix(s.land.fx, s.land.tx, out(p));
        s.y = mix(s.land.fy, s.land.ty, out(p));
        if (p < 1) continue;
        s.land = null;
        // Come to rest, it joins every screen it touches
        for (const c of rules.meets(s)) if (!sc.seamBetween(c.a, c.b)) sc.join(c.a, c.b);
      }
      if (!drag) return;
      // The screen in hand goes where the hand takes it, over other screens if need be,
      // snapping when close to a spot where it would join others; its seams part once it no
      // longer touches
      const s = drag.s;
      const aim = drag.free ? { x: s.tx, y: s.ty } : rules.snapSpot(s, s.tx, s.ty, SNAP / sc.view.s);
      const k = 1 - Math.exp(-dt / 40);
      s.x += (aim.x - s.x) * k;
      s.y += (aim.y - s.y) * k;
      for (const m of sc.seams.filter(m => (m.a === s || m.b === s) && !rules.touching(m.a, m.b))) {
        const c = sc.seamCentre(m);
        sc.part(m);
        sc.sparkle(c.x, c.y);
      }
      drag.spot = rules.legal(s, aim.x, aim.y) ? null : rules.landingSpot(s, aim.x, aim.y);
      showLanding(s, drag.spot);
      // On top of another, the landing outline is the cue; the pull shows only in the clear
      showPull(drag.free || drag.spot ? null : rules.magnetOf(s, PULL / sc.view.s));
      showGhosts(rules.meets(s).filter(c => !sc.seamBetween(c.a, c.b)));
      if (drag.grab) {
        sc.p.x = s.x + drag.grab.x;
        sc.p.y = s.y - s.lift * 4 + drag.grab.y;
      }
    });

    // The visitor's hand: the first touch ends the demonstration for good
    for (const s of list) {
      s.el.addEventListener('pointerdown', event => {
        if (drag && !drag.grab) return;
        event.preventDefault();
        s.el.setPointerCapture(event.pointerId);
        if (!touched) {
          touched = true;
          sc.p.holding = false;
          sc.hide();
        }
        if (drag) letGo();
        hold(s, { id: event.pointerId, px: event.clientX, py: event.clientY, free: event.altKey });
      });
      s.el.addEventListener('pointermove', event => {
        if (!drag || drag.s !== s || drag.id !== event.pointerId) return;
        // Each move carries it as far as the pointer went on screen, at the zoom of the
        // moment, so it keeps up with the hand while the camera reframes around it
        s.tx += (event.clientX - drag.px) / sc.view.s;
        s.ty += (event.clientY - drag.py) / sc.view.s;
        drag.px = event.clientX;
        drag.py = event.clientY;
        drag.free = event.altKey; // as in the app, Alt turns the magnet off
      });
      const release = event => {
        if (drag && drag.s === s && drag.id === event.pointerId) letGo();
      };
      s.el.addEventListener('pointerup', release);
      s.el.addEventListener('pointercancel', release);
    }

    // The demonstration: the small screen onto the PC's top edge, the Mac beside it, level
    // with its foot, and both back to the row. In a tall box: the small screen onto the Mac's
    // top, then the PC's, and back under both; the Mac to the PC's other side, and back. The
    // magnet takes over near the end of each move
    const moves = tall
      ? [
        { s: small, x: 206 + GAP + (186 - 160) / 2, y: -102 - GAP },
        { s: small, x: (206 - 160) / 2, y: -102 - GAP },
        { s: small, x: under, y: 118 + GAP },
        { s: mac, x: -GAP - 186, y: 0 },
        { s: mac, x: 206 + GAP, y: 0 },
      ]
      : [
        { s: small, x: 186 + GAP + (206 - 160) / 2, y: -102 - GAP },
        { s: mac, x: 186 + GAP + (206 - 160) / 2 - GAP - 186, y: -118 - GAP },
        { s: small, x: 186 + GAP + 206 + GAP, y: 8 },
        { s: mac, x: 0, y: 0 },
      ];
    await sc.sleep(700);
    for (;;) {
      for (const m of moves) {
        if (touched) return;
        const s = m.s;
        const grab = { x: s.w * 0.5, y: 14 };
        await sc.point(s.x + grab.x, s.y + grab.y);
        if (touched) return;
        sc.p.holding = true;
        hold(s, { grab, free: true });
        const fx = s.x;
        const fy = s.y;
        await sc.tween(1100, k => {
          if (!drag || drag.s !== s || !drag.grab) return;
          s.tx = mix(fx, m.x, k);
          s.ty = mix(fy, m.y, k);
          drag.free = k < 0.8;
        });
        if (touched) return;
        await sc.sleep(150);
        if (touched) return;
        letGo();
        sc.p.holding = false;
        await sc.sleep(300);
        if (touched) return;
        await sc.away(18, 20);
        await sc.sleep(1000);
      }
    }
  }

  // 3. Unlimited devices, as a wide band behind its heading: screens join around the heading as
  // the page scrolls, the grid runs off both edges, and once it is full a wave runs through its
  // seams
  function unlimited(sc) {
    const band = sc.el.parentElement;
    const heading = band.querySelector('h2');
    const CW = 206 + GAP;
    const CH = 118 + GAP;
    sc.zoom = 99;
    let cells = [];
    let key = '';
    let shown = 0; // how many cells hold a screen, taken in order
    let lastChange = -1e9;
    let wave = null;
    let fullSince = null;
    let progress = 0;
    const at = new Map();

    function layout() {
      const W = sc.el.clientWidth;
      const H = sc.el.clientHeight;
      if (!W || !H) return;
      // Three and a bit rows tall, but never so large that fewer than two columns and a bit
      // show, as on a phone
      const scale = Math.min(H / (3.35 * CH), W / (2.2 * CW));
      sc.fit = () => ({ l: -W / 2 / scale, r: W / 2 / scale, t: -H / 2 / scale, b: H / 2 / scale });
      // No screens under the heading
      const e = sc.el.getBoundingClientRect();
      const h = heading.getBoundingClientRect();
      const pad = 12;
      const hole = {
        l: (h.left - e.left - W / 2) / scale - pad,
        r: (h.right - e.left - W / 2) / scale + pad,
        t: (h.top - e.top - H / 2) / scale - pad,
        b: (h.bottom - e.top - H / 2) / scale + pad,
      };
      // Every column and row that shows, the outermost ones cut by the edges
      const C = Math.floor((W / 2 / scale + 103) / CW);
      const R = Math.floor((H / 2 / scale + 59) / CH);
      const next = [];
      for (let j = -R; j <= R; j++) {
        for (let i = -C; i <= C; i++) {
          const x = i * CW - 103;
          const y = j * CH - 59;
          if (x < hole.r && x + 206 > hole.l && y < hole.b && y + 118 > hole.t) continue;
          // Nearest the heading first, above and below it before beside it
          next.push({ i, j, x, y, os: Math.abs(i + j) % 2 ? 'mac' : 'win', d: Math.hypot(i * CW, j * CH * 1.6) + (i < 0 ? 0.1 : 0) });
        }
      }
      next.sort((a, b) => a.d - b.d);
      const nextKey = next.map(c => `${c.i},${c.j}`).join(' ');
      if (nextKey === key) return;
      for (const c of cells) if (c.s) sc.drop(c.s);
      cells = next;
      key = nextKey;
      shown = 0;
      at.clear();
      wave = null;
      fullSince = null;
    }
    // How far the page has scrolled the band in: none as its top enters, all once it is centred
    function measure() {
      const r = sc.el.getBoundingClientRect();
      const vh = window.innerHeight;
      progress = clamp((vh * 0.92 - r.top) / (vh * 0.92 - (vh - r.height) / 2), 0, 1);
    }
    layout();
    measure();
    const resize = new ResizeObserver(() => {
      layout();
      measure();
    });
    resize.observe(sc.el);
    document.fonts?.ready.then(layout);
    // Whatever scrolls the page: the window, or on phones the feed of cards
    document.addEventListener('scroll', measure, { capture: true, passive: true });
    sc.cleanups.push(() => {
      resize.disconnect();
      document.removeEventListener('scroll', measure, { capture: true });
    });

    const neighbours = c => [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([di, dj]) => at.get(`${c.i + di},${c.j + dj}`)).filter(n => n && n.settled);
    sc.every(time => {
      const want = Math.round(progress * cells.length);
      if (want > shown && time - lastChange > 55) {
        lastChange = time;
        const c = cells[shown++];
        const s = sc.screen('win', c.x, c.y - 14, c.os);
        s.fade = 0;
        c.s = s;
        at.set(`${c.i},${c.j}`, c);
        sc.tween(360, k => {
          if (c.s !== s) return;
          s.fade = k;
          s.y = c.y - 14 * (1 - k);
        }, out).then(() => {
          if (c.s !== s) return;
          // It joins the screens already beside it; only its first seam sparkles
          neighbours(c).forEach((n, i) => sc.join(s, n.s, false, i === 0));
          c.settled = true;
        });
      } else if (want < shown && time - lastChange > 40) {
        lastChange = time;
        const c = cells[--shown];
        const s = c.s;
        c.s = null;
        c.settled = false;
        at.delete(`${c.i},${c.j}`);
        sc.seams.filter(m => m.a === s || m.b === s).forEach(m => sc.part(m, true));
        sc.tween(220, k => { s.fade = 1 - k; }).then(() => sc.drop(s));
      }
      // Full: every so often a wave runs out from the heading through all the seams
      if (cells.length && shown === cells.length && cells.every(c => c.settled)) {
        if (fullSince === null) fullSince = time;
        if (!wave && time - fullSince > 900) wave = { t0: time, done: new Set() };
      } else {
        fullSince = null;
        wave = null;
      }
      if (wave) {
        const reach = (time - wave.t0) * 0.9;
        for (const m of sc.seams) {
          if (wave.done.has(m)) continue;
          const c = sc.seamCentre(m);
          if (Math.hypot(c.x, c.y * 1.6) < reach) {
            wave.done.add(m);
            sc.pulse(m);
          }
        }
        if (wave.done.size >= sc.seams.length) {
          wave = null;
          fullSince = time + 2600;
        }
      }
    });
  }

  // 4. Copy & paste, shot on the two windows: what is copied rides beside the pointer across the
  // seam, as MKC+ carries the clipboard along when the pointer crosses, and lands where it is
  // pasted. A line of text goes from the PC to the Mac, then a file comes back, landing on the
  // PC's desktop inside a ring that fills as it copies
  async function copyPaste(sc) {
    // In a tall box, as on a phone, the Mac sits below the PC and the whole of both shows
    const tall = sc.el.clientHeight > sc.el.clientWidth;
    const pc = sc.screen('win', 0, 0);
    const mac = tall ? sc.screen('mac', 10, 118 + GAP) : sc.screen('mac', 206 + GAP, 0);
    sc.join(pc, mac, true);
    sc.zoom = 2.6;
    const slot = new Map(tall ? [[pc, [0.2, 0.12, 0.6, 0.44]], [mac, [0.2, 0.1, 0.6, 0.44]]] : [[pc, [0.36, 0.1, 0.58, 0.5]], [mac, [0.05, 0.1, 0.6, 0.5]]]);
    const near = new Map(tall ? [[pc, 0.5], [mac, 0.5]] : [[pc, 0.66], [mac, 0.34]]);
    // The screens' top edges stay in the shot, so the seam reads as the one between them
    sc.box = tall ? null : { l: 206 * 0.36 - 12, t: -6, r: 206 + GAP + 186 * 0.65 + 12, b: 118 - 16 };

    // A line of text: selected and copied in one window, pasted into the other
    const text = async (from, to) => {
      const a = sc.open(from, slot.get(from), 'text');
      const b = sc.open(to, slot.get(to), 'doc');
      show(a.el);
      show(b.el);
      await sc.sleep(450);
      const width = (sc.inside(a).w - 14) * 0.92;
      const start = sc.spot(a, 7, 22.5);
      await sc.point(start.x, start.y);
      sc.p.holding = true;
      await sc.tween(650, k => {
        sc.p.x = start.x + width * k;
        a.selection.style.width = `${((width + 4) * k).toFixed(1)}px`;
      });
      sc.p.holding = false;
      sc.key(from, KEYS[from.os].copy, { at: near.get(from) });
      a.selection.classList.add('is-copied');
      await sc.sleep(250);
      // The copy lifts off the selection and rides beside the pointer
      const chip = make('scene-chip', sc.world);
      const lift = sc.spot(a, 5, 19);
      await sc.tween(380, k => put(chip, mix(lift.x, sc.p.x + 9, k), mix(lift.y, sc.p.y + 12, k), mix(width + 4, 16, k), mix(7, 5, k)));
      sc.carry(chip, 9, 12);
      // Over the seam to the other window: click, paste
      const into = sc.spot(b, 10, 14.5);
      await sc.point(into.x, into.y);
      sc.click();
      caret(b, 7);
      await sc.sleep(300);
      sc.key(from, KEYS[from.os].paste, { at: near.get(from) });
      sc.carried = null;
      const land = sc.spot(b, 7, 13);
      const w1 = Math.min(width, sc.inside(b).w - 14);
      const c0 = { x: sc.p.x + 9, y: sc.p.y + 12 };
      sc.away();
      await sc.tween(300, k => put(chip, mix(c0.x, land.x, k), mix(c0.y, land.y, k), mix(16, w1, k), mix(5, 3, k)));
      chip.remove();
      pasteLine(sc, b, width);
      await sc.sleep(1500);
      sc.close(a, b);
      await sc.sleep(550);
    };

    // A file: picked in a window and copied, pasted onto the other desktop where that window
    // would be, landing faint inside a ring that fills as it copies
    const file = async (from, to) => {
      const a = sc.open(from, slot.get(from), 'files');
      show(a.el);
      await sc.sleep(400);
      const box = sc.inside(a);
      const at = sc.spot(a, box.w * 0.22 + 6.5, box.h / 2 + 4);
      await sc.point(at.x, at.y);
      sc.click();
      a.files[0].classList.add('is-selected');
      await sc.sleep(320);
      sc.key(from, KEYS[from.os].copy, { at: near.get(from) });
      await sc.sleep(300);
      // A copy of it rides beside the pointer
      const rider = make('scene-rider', sc.world, FILE);
      const f0 = { x: at.x - 6.5, y: at.y - 8 };
      await sc.tween(300, k => put(rider, mix(f0.x, sc.p.x + 8, k), mix(f0.y, sc.p.y + 10, k)));
      sc.carry(rider, 8, 10);
      const [x, y, w, h] = slot.get(to);
      const drop = { x: to.x + to.w * (x + w / 2), y: to.y + to.h * (y + h / 2) };
      await sc.point(drop.x, drop.y);
      sc.click();
      await sc.sleep(260);
      sc.key(from, KEYS[from.os].paste, { at: near.get(from) });
      sc.carried = null;
      const r0 = { x: sc.p.x + 8, y: sc.p.y + 10 };
      sc.away();
      await sc.tween(260, k => put(rider, mix(r0.x, drop.x - 6.5, k), mix(r0.y, drop.y - 8, k)));
      rider.remove();
      const pasted = make('toy-file is-shown is-arriving', to.desk, FILE);
      pasted.style.left = `${(drop.x - to.x - 6.5).toFixed(1)}px`;
      pasted.style.top = `${(drop.y - to.y - 8).toFixed(1)}px`;
      const ring = document.createElementNS(SVG, 'svg');
      ring.setAttribute('class', 'scene-ring');
      ring.setAttribute('viewBox', '0 0 36 36');
      ring.innerHTML = '<circle cx="18" cy="18" r="15"/><circle class="scene-ring-done" cx="18" cy="18" r="15" pathLength="100"/>';
      ring.style.left = `${(drop.x - to.x - 18).toFixed(1)}px`;
      ring.style.top = `${(drop.y - to.y - 18).toFixed(1)}px`;
      to.desk.append(ring);
      show(ring);
      const done = ring.lastChild;
      await sc.tween(1400, k => { done.style.strokeDashoffset = (100 - k * 100).toFixed(1); }, p => p);
      ring.classList.add('is-done');
      pasted.classList.remove('is-arriving');
      pasted.classList.add('is-pasted');
      await sc.sleep(1300);
      sc.close(a);
      await sc.sleep(700);
      sc.clear(to);
      await sc.sleep(500);
    };

    // The pointer starts on the PC, and each copy leaves it on the computer the next one starts
    // from
    await sc.point(pc.x + 206 * 0.5, pc.y + 62, 300);
    for (;;) {
      await text(pc, mac);
      await file(mac, pc);
    }
  }

  // 5. One-click pairing: two empty computers each put up the pairing dialog, already showing the
  // same six-digit code, and one click on Pair joins them
  async function pairing(sc) {
    // In a tall box, the Mac waits below the PC and slides up to join it
    const tall = sc.el.clientHeight > sc.el.clientWidth;
    const apart = tall ? { x: 10, y: 118 + 60 } : { x: 206 + 70, y: 0 };
    const joined = tall ? { x: 10, y: 118 + GAP } : { x: 206 + GAP, y: 0 };
    const pc = sc.screen('win', 0, 0);
    const mac = sc.screen('mac', apart.x, apart.y);
    const slot = [0.12, 0.12, 0.76, 0.64];
    sc.zoom = 1.9;
    // Close on the two dialogs, following the Mac as it slides over; pulled back once joined
    const close = () => (tall
      ? {
        l: pc.x + pc.w * slot[0] - 14,
        t: pc.y + pc.h * slot[1] - 14,
        r: pc.x + pc.w * (slot[0] + slot[2]) + 14,
        b: mac.y + mac.h * (slot[1] + slot[3]) + 16,
      }
      : {
        l: pc.x - 14,
        t: pc.y + pc.h * slot[1] - 14,
        r: mac.x + mac.w + 14,
        b: pc.y + pc.h * (slot[1] + slot[3]) + 16,
      });
    for (;;) {
      // Both computers apart and empty; a moment later each shows the pairing dialog, and the
      // camera closes in on the two. A tall box shows both screens whole all along: its width
      // already makes them large enough to read
      sc.fit = null;
      await sc.sleep(700);
      if (!tall) sc.fit = close;
      const code = String(Math.floor(100000 + Math.random() * 900000)).replace(/(\d{3})(\d{3})/, '$1 $2');
      const dialogs = [pc, mac].map(s => {
        const win = sc.open(s, slot, 'doc');
        win.code = make('scene-code', win.el);
        win.code.textContent = code;
        win.pair = make('scene-pair', win.el);
        win.pair.textContent = 'Pair';
        return win;
      });
      dialogs.forEach(d => show(d.el));
      await sc.sleep(900);
      // One click on Pair, on either computer
      const button = dialogs[1].pair;
      const at = sc.spot(dialogs[1], sc.inside(dialogs[1]).w - 22, sc.inside(dialogs[1]).h - 12);
      if (!sc.p.shown) await sc.point(mac.x + mac.w * 0.3, mac.y + mac.h * 0.85, 200);
      await sc.point(at.x, at.y);
      sc.click();
      button.classList.add('is-pressed');
      dialogs.forEach(d => d.code.classList.add('is-matched'));
      await sc.sleep(450);
      sc.close(...dialogs);
      await sc.away();
      const fx = mac.x;
      const fy = mac.y;
      await sc.tween(650, k => {
        mac.x = mix(fx, joined.x, k);
        mac.y = mix(fy, joined.y, k);
      });
      sc.join(pc, mac);
      sc.fit = null;
      await sc.sleep(2200);
      // Apart again, for the next pairing
      sc.part(sc.seamBetween(pc, mac));
      const jx = mac.x;
      const jy = mac.y;
      await sc.tween(650, k => {
        mac.x = mix(jx, apart.x, k);
        mac.y = mix(jy, apart.y, k);
      });
      await sc.sleep(300);
    }
  }

  // 6. Automatic reconnection, any kind of local network: the two computers stay joined and the
  // pointer never stops crossing the seam between them, while underneath every link that could
  // carry it is probed all the time and shows its latency. The fastest one carries the traffic;
  // when it dies the next takes over at once, and when it comes back the traffic returns to it.
  // The links run around the seam's two ends: above and below it when the computers stand side
  // by side, left and right of it when the Mac sits below the PC
  async function reconnection(sc) {
    const tall = sc.el.clientHeight > sc.el.clientWidth;
    const pc = sc.screen('win', 0, 0);
    const mac = tall ? sc.screen('mac', 10, 118 + GAP) : sc.screen('mac', 206 + GAP, 0);
    sc.join(pc, mac, true);
    sc.zoom = 1.9;
    const mid = sc.seamCentre(sc.seamBetween(pc, mac));
    // Each link leaves the PC beside one end of the seam and bows outward to the Mac
    const routes = tall
      ? [
        { from: { x: pc.x - 4, y: mid.y - 44 }, to: { x: mac.x - 4, y: mid.y + 44 }, bow: { x: -74, y: 0 } },
        { from: { x: pc.x + pc.w + 4, y: mid.y - 44 }, to: { x: mac.x + mac.w + 4, y: mid.y + 44 }, bow: { x: 74, y: 0 } },
      ]
      : [
        { from: { x: mid.x - 56, y: pc.y - 4 }, to: { x: mid.x + 56, y: mac.y - 4 }, bow: { x: 0, y: -74 } },
        { from: { x: mid.x - 56, y: pc.y + pc.h + 4 }, to: { x: mid.x + 56, y: mac.y + mac.h + 4 }, bow: { x: 0, y: 74 } },
      ];
    // The whole of both screens and both links, with their latency badges
    sc.box = tall
      ? { l: pc.x - 80, t: pc.y - 14, r: pc.x + pc.w + 80, b: mac.y + mac.h + 14 }
      : { l: pc.x - 14, t: pc.y - 64, r: mac.x + mac.w + 14, b: pc.y + pc.h + 64 };
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'scene-links');
    sc.world.prepend(svg);
    const link = ({ from, to, bow }, icon, fast, slow) => {
      const c = { x: (from.x + to.x) / 2 + bow.x, y: (from.y + to.y) / 2 + bow.y };
      const path = document.createElementNS(SVG, 'path');
      path.setAttribute('d', `M${from.x} ${from.y}Q${c.x} ${c.y} ${to.x} ${to.y}`);
      svg.append(path);
      const top = { x: 0.25 * from.x + 0.5 * c.x + 0.25 * to.x, y: 0.25 * from.y + 0.5 * c.y + 0.25 * to.y };
      const badge = sc.badge(top.x, top.y, icon);
      const ms = make('scene-ms', badge);
      return { path, badge, ms, fast, slow, alive: true, at: t => ({
        x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * c.x + t * t * to.x,
        y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * c.y + t * t * to.y,
      }) };
    };
    const links = [link(routes[0], WIRED, 1, 3), link(routes[1], WIFI, 6, 12)];
    let best = null;
    const choose = () => {
      const next = links.filter(l => l.alive).sort((a, b) => a.latency - b.latency)[0] || null;
      if (next === best) return;
      best = next;
      for (const l of links) {
        l.path.classList.toggle('is-active', l === best);
        l.badge.classList.toggle('is-on', l === best);
      }
      // The link taking over says so, and nothing else changes
      best?.badge.animate([{ transform: 'translateX(-50%) scale(1.18)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 380, easing: 'ease-out' });
    };
    // Latency readings, a little jitter each probe
    let probeAt = 0;
    const probe = () => {
      for (const l of links) {
        l.latency = l.alive ? l.fast + Math.round(Math.random() * (l.slow - l.fast)) : Infinity;
        l.ms.textContent = l.alive ? `${l.latency} ms` : '—';
        l.path.classList.toggle('is-dead', !l.alive);
        l.badge.classList.toggle('is-dead', !l.alive);
      }
      choose();
    };
    probe();
    // Traffic: dots along the link in use, toward the computer the pointer is on; probes: fainter
    // dots along every live link
    const dots = [];
    let sendAt = 0;
    sc.every(time => {
      if (time >= probeAt) {
        probeAt = time + 700;
        probe();
        for (const l of links) if (l.alive) dots.push({ l, t0: time, ms: 900, back: false, el: make('scene-dot is-probe', sc.world) });
      }
      if (best && time >= sendAt) {
        sendAt = time + 180;
        dots.push({ l: best, t0: time, ms: 520, back: sc.under(sc.p.x, sc.p.y) === pc, el: make('scene-dot', sc.world) });
      }
      for (const d of [...dots]) {
        const p = (time - d.t0) / d.ms;
        if (p >= 1 || !d.l.alive) {
          d.el.remove();
          dots.splice(dots.indexOf(d), 1);
          continue;
        }
        const q = d.l.at(d.back ? 1 - p : p);
        d.el.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;
      }
      // The pointer loops across the seam without a pause, whichever link carries it
      const u = time / 1000;
      Object.assign(sc.p, tall
        ? { shown: true, x: mid.x + 44 * Math.sin(u * 1.7), y: mid.y + 82 * Math.sin(u * 0.85) }
        : { shown: true, x: mid.x + 96 * Math.sin(u * 0.85), y: mid.y + 26 * Math.sin(u * 1.7) });
    });
    for (;;) {
      await sc.sleep(3200);
      // The fastest link dies; the other carries on at once
      links[0].alive = false;
      probe();
      await sc.sleep(3400);
      // It comes back, and being faster, it takes the traffic again
      links[0].alive = true;
      probe();
    }
  }

  const stories = { control, arrange, unlimited, copyPaste, pairing, reconnection };
  const play = el => {
    const sc = new Scene(el);
    const story = stories[el.dataset.story];
    if (story) story(sc);
    return sc;
  };
  const players = scenes.map(play);

  // One loop for all of them; a scene's clock runs only while it is on screen. On phones each
  // section is a card of its own, and a story starts over whenever its card comes back into
  // view, as in a feed
  const cards = matchMedia('(max-width: 760px)');
  const seen = new Set();
  const gone = new Set();
  const watch = new IntersectionObserver(entries => {
    for (const e of entries) {
      const i = scenes.indexOf(e.target);
      if (!e.isIntersecting) gone.add(i);
      if (e.intersectionRatio < 0.2) {
        seen.delete(players[i]);
        continue;
      }
      if (gone.has(i) && cards.matches && players[i].time > 0) {
        seen.delete(players[i]);
        players[i].dispose();
        players[i] = play(e.target);
      }
      gone.delete(i);
      seen.add(players[i]);
    }
  }, { threshold: [0, 0.2] });
  scenes.forEach(el => watch.observe(el));
  let last = null;
  const frame = now => {
    const dt = last === null ? 16 : Math.min(50, now - last);
    last = now;
    if (!document.hidden) for (const sc of seen) sc.tick(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
