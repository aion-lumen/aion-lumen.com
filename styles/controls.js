/* Aion Lumen — shared controls
 * Theme, accent, language, hand-script visibility, email reveal
 */
(function () {
  'use strict';

  const root = document.documentElement;

  // ── Init from system / localStorage ──────────────────────────────
  const stored = (k, fb) => {
    try { return localStorage.getItem('al.' + k) || fb; }
    catch (_) { return fb; }
  };
  const save = (k, v) => { try { localStorage.setItem('al.' + k, v); } catch (_) {} };

  const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  let theme  = stored('theme',  sysDark ? 'dark' : 'light');   // light | dark
  let lang   = stored('lang',   (navigator.language || 'en').slice(0, 2) === 'de' ? 'de' : 'en');
  let hand   = stored('hand',   'on');                         // on | muted | off

  function applyAll() {
    root.setAttribute('data-theme',  theme);
    root.setAttribute('data-lang',   lang);
    root.setAttribute('data-hand',   hand);
    syncButtons();
  }

  function syncButtons() {
    document.querySelectorAll('[data-tb]').forEach(btn => {
      const [group, val] = btn.getAttribute('data-tb').split(':');
      const current = { theme, lang, hand }[group];
      btn.classList.toggle('on', current === val);
    });
  }

  // ── Wire toolbar ─────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tb]');
    if (!btn) return;
    const [group, val] = btn.getAttribute('data-tb').split(':');
    if (group === 'theme')  { theme  = val; save('theme',  val); }
    if (group === 'lang')   { lang   = val; save('lang',   val); }
    if (group === 'hand')   { hand   = val; save('hand',   val); }
    applyAll();
  });

  // ── Email reveal (obfuscation) ───────────────────────────────────
  // Stored split so that simple harvesters that pull innerText / regex
  // for "x@y.z" don't trip on it.
  function buildEmail(parts) {
    return parts.join('').replace('[at]', '@').replace('[dot]', '.');
  }
  const emailParts = ['hi', '[at]', 'aion-lumen', '[dot]', 'ch'];

  function wireEmail() {
    document.querySelectorAll('[data-email]').forEach(el => {
      const mode = el.getAttribute('data-email'); // 'reveal' | 'inline'
      if (mode === 'inline') {
        el.textContent = buildEmail(emailParts);
        el.addEventListener('click', (e) => {
          e.preventDefault();
          location.href = 'mailto:' + buildEmail(emailParts);
        });
      } else {
        // reveal mode: shows "click to write" until clicked, then expands
        const labelEN = 'click to reveal';
        const labelDE = 'klick zum Anzeigen';
        const setLabel = () => {
          if (el.dataset.revealed === '1') return;
          el.innerHTML = `<span class="en">${labelEN}</span><span class="de">${labelDE}</span>`;
        };
        setLabel();
        el.addEventListener('click', (e) => {
          e.preventDefault();
          if (el.dataset.revealed === '1') {
            location.href = 'mailto:' + buildEmail(emailParts);
            return;
          }
          el.dataset.revealed = '1';
          el.textContent = buildEmail(emailParts);
          el.classList.add('revealed');
        });
      }
    });
  }

  // ── Reveal-on-scroll ─────────────────────────────────────────────
  function wireReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    // Belt-and-suspenders: anything already in the viewport gets shown immediately
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    });
  }

  // ── Boot ─────────────────────────────────────────────────────────
  applyAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { wireEmail(); wireReveal(); });
  } else {
    wireEmail(); wireReveal();
  }

  // Expose minimal API for page-specific tweaks
  window.AL = { applyAll, get state() { return { theme, lang, hand }; } };
})();
