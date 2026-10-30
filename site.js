// Cloudflare Web Analytics is cookieless, so the site needs no cookie banner.
// The token comes from the Cloudflare dashboard (Web Analytics → the site → the
// JS snippet); automatic setup only works for a zone proxied by Cloudflare, and
// GitHub Pages is not.
const CLOUDFLARE_ANALYTICS_TOKEN = 'e05d303db4c549cbb0030143958008d8';
if (CLOUDFLARE_ANALYTICS_TOKEN) {
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token: CLOUDFLARE_ANALYTICS_TOKEN });
  document.head.append(beacon);
}

// Where the download buttons report a press (see countDownload below).
const DOWNLOAD_COUNTER = 'https://mkcplus-updates.mkcplus.workers.dev/v1/click/';

const root = document.documentElement;
// Windows gets the window's own type rules (styles.css), so the letters look as they do on a
// Mac. This script runs in the head, so the page never draws with the other rules first
if (/^Win/.test(navigator.userAgentData?.platform || navigator.platform || '')) root.dataset.platform = 'windows';
const systemAppearance = matchMedia('(prefers-color-scheme: dark)');
const themeColor = document.querySelector('meta[name="theme-color"]');
const THEME_KEY = 'mkcplus-theme';
let themeButton;

// A theme picked with the toggle lasts for the rest of the visit: session storage
// carries it across pages in this tab and forgets it when the tab closes. Where
// storage is blocked, the choice lasts only for the page.
function pickedTheme() {
  try {
    const theme = sessionStorage.getItem(THEME_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
}

function keepTheme(theme) {
  try {
    sessionStorage.setItem(THEME_KEY, theme);
  } catch {
    // Blocked storage: the page still shows the choice
  }
}

let manualTheme = pickedTheme();

function systemTheme() {
  return systemAppearance.matches ? 'dark' : 'light';
}

// What the page's scripts say, in the page's language (written by tools/i18n/build.mjs)
let siteWords;
function said(key, english) {
  try {
    siteWords ??= JSON.parse(document.getElementById('site-words')?.textContent || '{}');
  } catch {
    siteWords = {};
  }
  return siteWords[key] ?? english;
}

function themeLabel() {
  return root.dataset.theme === 'dark'
    ? said('theme.to_light', 'Switch to light theme')
    : said('theme.to_dark', 'Switch to dark theme');
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeColor.content = theme === 'dark' ? '#191e27' : '#ccd4d0';
  themeButton?.setAttribute('aria-label', themeLabel());
}

// Set the theme before the page paints: the one picked during this visit, else the system's
applyTheme(manualTheme ?? systemTheme());
systemAppearance.addEventListener('change', () => {
  if (!manualTheme) applyTheme(systemTheme());
});
// A page restored from the back/forward cache catches up with a theme picked on a later page
addEventListener('pageshow', event => {
  if (!event.persisted) return;
  manualTheme = pickedTheme() ?? manualTheme;
  applyTheme(manualTheme ?? systemTheme());
});

// A language picked in the toolbar is kept in this browser and nowhere else. The English
// home page, which every first visit lands on, then opens in that language, or else in
// the first of the browser's languages the site has (the window's rule: the whole tag
// before its language in the same script, English when none matches; Spanish other than
// Spain's reads the Latin American page). Only that page
// moves: a link to any other page, in any language, opens as it is.
const LANGUAGE_KEY = 'mkcplus-language';
const SAME_AS = { no: 'nb', nn: 'nb' };

function pickedLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

function keepLanguage(tag) {
  try {
    localStorage.setItem(LANGUAGE_KEY, tag);
  } catch {
    // Blocked storage: the link still opens the language
  }
}

function likely(tag) {
  try {
    const locale = new Intl.Locale(tag).maximize();
    const language = SAME_AS[locale.language];
    return language ? new Intl.Locale(language, { script: locale.script, region: locale.region }) : locale;
  } catch {
    return null;
  }
}

function chooseLanguage(preferred, available) {
  for (const tag of preferred) {
    const exact = available.find(a => a.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;
    const want = likely(tag);
    if (!want) continue;
    if (want.language === 'en') return 'en';
    // Spanish from anywhere but Spain reads the Latin American page
    if (want.language === 'es' && want.region !== 'ES' && available.includes('es-419')) return 'es-419';
    const near = available.find(a => {
      const have = likely(a);
      return have && have.language === want.language && have.script === want.script;
    });
    if (near) return near;
  }
  return 'en';
}

(() => {
  const home = document.querySelector('link[rel="canonical"]')?.href === 'https://mkcplus.com/';
  const available = (root.dataset.languages || 'en').split(' ');
  if (!home || root.lang !== 'en' || available.length < 2) return;
  const picked = pickedLanguage();
  const tag = available.includes(picked)
    ? picked
    : chooseLanguage(navigator.languages?.length ? navigator.languages : [navigator.language || 'en'], available);
  // A page opened from disk has no server to find a folder's index.html
  const page = location.protocol === 'file:' ? 'index.html' : '';
  if (tag !== 'en') location.replace(`./${tag.toLowerCase()}/${page}${location.hash}`);
})();

// A modal should answer the phone's back gesture by closing, not by leaving the page.
// Opening adds a history entry; back pops it and closes the modal instead of navigating,
// and closing any other way pops that entry so it never piles up. Closing through back
// empties the set first, so the pop here does not ask for another one.
const openModals = new Set();
function modalOpened(close) {
  openModals.add(close);
  history.pushState({ mkcplusModal: true }, '');
}
function modalClosed(close) {
  if (openModals.delete(close)) history.back();
}
addEventListener('popstate', () => {
  for (const close of [...openModals]) {
    openModals.delete(close);
    close();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // The language picker: choosing a language keeps it; Escape or a click elsewhere closes
  const picker = document.querySelector('.lang-picker');
  if (picker) {
    const closePicker = () => { picker.open = false; };
    // Focus goes back to the button only for a keyboard: after a click or a tap it would
    // leave the button looking pressed, as some browsers ring any focus a script moves
    const shutPicker = byKeyboard => {
      modalClosed(closePicker);
      closePicker();
      if (byKeyboard) picker.querySelector('summary')?.focus();
    };
    picker.addEventListener('toggle', () => {
      // Clicking the summary opens and closes the panel by itself, so the history entry
      // follows the panel from here rather than from each way of closing it
      if (picker.open) modalOpened(closePicker);
      else modalClosed(closePicker);
    });
    // A button pressed from the keyboard sends a click with no count of presses
    picker.querySelector('.lang-close')?.addEventListener('click', event => shutPicker(event.detail === 0));
    picker.querySelectorAll('a[data-language]').forEach(a => {
      a.addEventListener('click', () => keepLanguage(a.dataset.language));
    });
    document.addEventListener('click', event => {
      // The dimmed backdrop is the picker's own ::before, so a click on it reports the
      // picker itself as the target: that is a click outside the menu, and it closes.
      if (picker.open && (event.target === picker || !picker.contains(event.target))) {
        shutPicker(false);
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && picker.open) shutPicker(true);
    });
  }
  // Download buttons grow the logo's wings: while hovered, and for a moment when clicked or
  // tapped. Each wing is the logo's two bars, the lower one shorter
  document.querySelectorAll('.download-button:not(:disabled)').forEach(button => {
    for (const side of ['left', 'right']) {
      const wing = document.createElement('span');
      wing.className = `download-wings is-${side}`;
      wing.setAttribute('aria-hidden', 'true');
      wing.innerHTML = '<i></i><i></i>';
      button.append(wing);
    }
    let fold = 0;
    button.addEventListener('click', event => {
      button.classList.add('is-winged');
      clearTimeout(fold);
      fold = setTimeout(() => button.classList.remove('is-winged'), 900);
      // The Mac download opens the page on approving the installer once the wings have
      // shown, and that page starts the download: leaving this page while the download
      // was still being redirected would cancel it. A click meant for a new tab or a saved
      // link downloads as usual
      const then = button.dataset.then;
      if (then && event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
        event.preventDefault();
        setTimeout(() => location.assign(`${then}#download`), 700);
      }
    });
  });
  // Each press of a download button is counted by the update counter (updates/worker.mjs):
  // the button's name and the page's language, nothing else. The download itself still
  // goes straight to GitHub, so it never waits on the counter or fails with it. A press
  // with the middle button opens a new tab, which downloads too
  const countDownload = event => {
    const link = event.target.closest?.('a[data-count][href]');
    if (!link || (event.type === 'auxclick' && event.button !== 1)) return;
    const url = `${DOWNLOAD_COUNTER}${link.dataset.count}?lang=${encodeURIComponent(root.lang.toLowerCase())}`;
    try {
      if (!navigator.sendBeacon?.(url)) fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {});
    } catch {
      // Counting is never worth a broken download
    }
  };
  document.addEventListener('click', countDownload);
  document.addEventListener('auxclick', countDownload);
  // Arriving from a download button: start the download this page names once the page has
  // loaded. Safari drops the images still loading when a download starts, and they stay
  // broken. The hash goes first, so a reload or a return here does not download again
  const download = document.querySelector('[data-download]');
  if (download && location.hash === '#download') {
    history.replaceState(null, '', location.pathname + location.search);
    const start = () => location.assign(download.dataset.download);
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
  }
  themeButton = document.querySelector('.theme-toggle');
  themeButton.setAttribute('aria-label', themeLabel());
  themeButton.addEventListener('click', () => {
    manualTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    keepTheme(manualTheme);
    applyTheme(manualTheme);
  });
});

// On desktop the wheel eases the page: each turn of the wheel or swipe on a trackpad moves
// where the page is headed, and the page glides there instead of jumping. Keys, the scrollbar
// and links scroll as the browser does, and so does the phones' feed of cards
(() => {
  const desktop = matchMedia('(min-width: 761px)');
  const GLIDE = 100; // ms to cover 63% of the way; 95% takes three times as long
  let target = 0;
  let y = 0; // where the glide is, unrounded
  let placed = 0; // where the browser put the page, so a move by anything else shows
  let frame = 0;
  let last = 0;
  let gap = 1000 / 60; // the screen's frame interval, as last seen during a glide
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const step = now => {
    // Something else moved the page (the scrollbar, a key, a link, find in page): it takes over
    if (Math.abs(scrollY - placed) > 1) {
      frame = 0;
      return;
    }
    // A glide's first frame moves one frame's worth, later ones as far as the time since the last
    const dt = last ? Math.min(50, now - last) : gap;
    if (last && dt < 25) gap = dt;
    last = now;
    const left = target - y;
    const move = left * (1 - Math.exp(-dt / GLIDE));
    // Never less than a device pixel a frame: the curve's slow end would move the page a pixel
    // only every few frames, which on a fast screen looks like a low frame rate
    const pixel = 1 / devicePixelRatio;
    y = Math.abs(left) <= pixel ? target : y + Math.sign(left) * Math.max(pixel, Math.abs(move));
    scrollTo(0, y);
    placed = scrollY;
    frame = y === target ? 0 : requestAnimationFrame(step);
  };
  addEventListener('wheel', event => {
    // Zoom (Ctrl or a pinch), Shift's sideways scroll and sideways swipes (back and forward) stay
    // the browser's, as does a gesture the browser already scrolls
    if (!desktop.matches || !event.cancelable || event.defaultPrevented || event.ctrlKey || event.shiftKey) return;
    const dy = event.deltaY; // read before deltaMode, so Firefox reports pixels
    if (Math.abs(event.deltaX) >= Math.abs(dy)) return;
    const page = document.documentElement;
    const px = dy * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page.clientHeight : 1);
    const max = page.scrollHeight - page.clientHeight;
    if (!frame) y = target = placed = scrollY;
    // Pushing on past an end is the browser's too, so a trackpad still bounces there
    if (!frame && (px < 0 ? y <= 0 : y >= max)) return;
    event.preventDefault();
    target = Math.min(max, Math.max(0, target + px));
    if (!frame) {
      last = 0;
      frame = requestAnimationFrame(step);
    }
  }, { passive: false });
  desktop.addEventListener('change', stop);
})();

// The Linux download choice. Linux is the one platform this page cannot choose for the
// person: a browser never says which distribution it is running on, so the choice is
// theirs. The processor it does know, well enough to decide which set to show first:
// Firefox puts it in the user-agent and Chromium freezes that but tells the truth through
// userAgentData. Neither is certain, so the other set is always one press away, and there
// are three choices however many architectures MKC+ is built for.
document.addEventListener('DOMContentLoaded', () => {
  const linuxButton = document.getElementById('linux-button');
  const linuxLayer = document.getElementById('linux-layer');
  if (linuxButton && linuxLayer) {
    const rows = [...linuxLayer.querySelectorAll('.choice-row')];
    const arches = [...linuxLayer.querySelectorAll('.choice-arch button')];
    const arm = /aarch64|arm64/i.test(navigator.userAgent)
      || /arm/i.test(navigator.userAgentData?.platform || '');

    // There is no ARM build yet, so that set reads as the page reads anything unavailable.
    function show(onArm) {
      for (const row of rows) {
        if (onArm) {
          row.removeAttribute('href');
          row.setAttribute('aria-disabled', 'true');
          row.setAttribute('aria-label', row.dataset.soon);
        } else {
          row.href = row.dataset.href;
          row.removeAttribute('aria-disabled');
          row.setAttribute('aria-label', row.dataset.here);
        }
      }
      for (const one of arches) {
        one.setAttribute('aria-pressed', String((one.dataset.arch === 'arm') === onArm));
      }
    }

    function setChoice(open) {
      linuxLayer.dataset.open = String(open);
      linuxButton.setAttribute('aria-expanded', String(open));
      if (open) rows.find(row => row.href)?.focus();
      else linuxButton.focus();
    }
    const closeChoice = () => setChoice(false);
    function openChoice() {
      setChoice(true);
      modalOpened(closeChoice);
    }
    function shutChoice() {
      modalClosed(closeChoice);
      closeChoice();
    }

    for (const row of rows) row.dataset.href = row.href;
    show(arm);
    linuxButton.addEventListener('click', openChoice);
    linuxLayer.querySelector('.choice-close')?.addEventListener('click', shutChoice);
    linuxLayer.addEventListener('click', event => {
      if (event.target === linuxLayer) shutChoice();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && linuxLayer.dataset.open === 'true') shutChoice();
    });
    for (const one of arches) {
      one.addEventListener('click', () => show(one.dataset.arch === 'arm'));
    }
}
});
