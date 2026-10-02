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
