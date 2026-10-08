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

const root = document.documentElement;
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

function themeLabel() {
  return `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`;
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

document.addEventListener('DOMContentLoaded', () => {
  // Download buttons grow the logo's wings: while hovered, and for a moment when clicked or
  // tapped. Each wing is the logo's two bars, the lower one shorter
  document.querySelectorAll('a.download-button').forEach(button => {
    for (const side of ['left', 'right']) {
      const wing = document.createElement('span');
      wing.className = `download-wings is-${side}`;
      wing.setAttribute('aria-hidden', 'true');
      wing.innerHTML = '<i></i><i></i>';
      button.append(wing);
    }
    let fold = 0;
    button.addEventListener('click', () => {
      button.classList.add('is-winged');
      clearTimeout(fold);
      fold = setTimeout(() => button.classList.remove('is-winged'), 900);
    });
  });
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
