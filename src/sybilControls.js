var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
var SUN  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"/></svg>';

function applyTheme(t) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  try { localStorage.setItem('sybil_theme', t); } catch (e) {}
  var b = document.getElementById('sc-theme');
  if (b) b.innerHTML = t === 'dark' ? SUN : MOON;
}

export function initControls() {
  if (document.getElementById('sybil-controls')) return;
  var wrap = document.createElement('div');
  wrap.id = 'sybil-controls';
  var theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  var tb = document.createElement('button');
  tb.id = 'sc-theme';
  tb.className = 'sc-btn';
  tb.title = 'Toggle light / dark';
  tb.setAttribute('aria-label', 'Toggle theme');
  tb.innerHTML = theme === 'dark' ? SUN : MOON;
  tb.onclick = function () {
    applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
  };
  wrap.appendChild(tb);
  document.body.appendChild(wrap);
  window.SybilControls = { wrap, MOON, SUN };
}
