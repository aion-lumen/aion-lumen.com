/* Aion Lumen — Tweaks panel (vanilla, no React)
 * Adds: hero variant (1–4), caveat visibility, texture grade.
 * Reuses the existing CSS variables in base.css.
 * Speaks the host edit-mode protocol.
 */
(function () {
  'use strict';

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "hero":     1,
    "hand":     "on",
    "texture":  4,
    "accent":   "gold",
    "theme":    "auto"
  }/*EDITMODE-END*/;

  // ── State (merged with persisted localStorage values) ────────────
  const stored = (k, fb) => { try { return localStorage.getItem('al.tw.' + k) ?? fb; } catch (_) { return fb; } };
  const save   = (k, v)  => { try { localStorage.setItem('al.tw.' + k, v); } catch (_) {} };

  const state = {
    hero:    +stored('hero',    TWEAK_DEFAULTS.hero),
    hand:    stored('hand',     TWEAK_DEFAULTS.hand),     // on | muted | off
    texture: +stored('texture', TWEAK_DEFAULTS.texture)   // 0–10
  };

  function apply() {
    const root = document.documentElement;
    root.setAttribute('data-hand', state.hand);
    // Texture: map 0–10 → opacity 0–0.10
    root.style.setProperty('--tex-opacity', String(state.texture * 0.01));
    // Hero variant — only meaningful on the home pages
    document.body.dataset.heroVariant = String(state.hero);

    // Hero swap — adjust title rendering on Konzept A only
    const heroTitle = document.querySelector('.hero .hero-title');
    if (heroTitle && !heroTitle.dataset.original) {
      heroTitle.dataset.original = heroTitle.innerHTML;
    }
    if (heroTitle) {
      heroTitle.innerHTML = renderHero(state.hero, document.documentElement.dataset.lang || 'en');
    }
    syncControls();
  }

  function renderHero(variant, lang) {
    // Variant 1 — original centered (default)
    const v = {
      1: {
        en: `local-first tools<br/><span class="glow">at human</span><br/><span class="glow">timescales.</span>`,
        de: `Werkzeuge für<br/><span class="glow">menschliche</span><br/><span class="glow">Zeitskalen.</span>`
      },
      2: {
        en: `<span style="display:block; text-align:left;">Aion</span><span style="display:block; text-align:left; color:var(--accent);">Lumen</span><span style="display:block; font-family:var(--f-mono); font-size:0.18em; letter-spacing:0.16em; color:var(--ink-mute); text-transform:uppercase; margin-top:0.4em;">local-first · long horizons</span>`,
        de: `<span style="display:block; text-align:left;">Aion</span><span style="display:block; text-align:left; color:var(--accent);">Lumen</span><span style="display:block; font-family:var(--f-mono); font-size:0.18em; letter-spacing:0.16em; color:var(--ink-mute); text-transform:uppercase; margin-top:0.4em;">lokal-first · lange horizonte</span>`
      },
      3: {
        en: `<span style="font-size:0.42em; color:var(--ink-soft); display:block; font-style:italic; font-weight:400; margin-bottom:0.3em;">Aion Lumen</span><span class="glow">tools for the<br/>next decade.</span>`,
        de: `<span style="font-size:0.42em; color:var(--ink-soft); display:block; font-style:italic; font-weight:400; margin-bottom:0.3em;">Aion Lumen</span><span class="glow">Werkzeuge für<br/>die nächste Dekade.</span>`
      },
      4: {
        en: `<span style="font-family:var(--f-mono); font-size:0.16em; color:var(--ink-mute); letter-spacing:0.16em; display:block; margin-bottom:0.5em;">// MMXXVI</span>local-first tools<br/><span class="glow">at human</span><br/><span class="glow">timescales.</span>`,
        de: `<span style="font-family:var(--f-mono); font-size:0.16em; color:var(--ink-mute); letter-spacing:0.16em; display:block; margin-bottom:0.5em;">// MMXXVI</span>Werkzeuge für<br/><span class="glow">menschliche</span><br/><span class="glow">Zeitskalen.</span>`
      }
    };
    const opt = v[variant] || v[1];
    return `<span class="en">${opt.en}</span><span class="de">${opt.de}</span>`;
  }

  function syncControls() {
    document.querySelectorAll('[data-tw]').forEach(el => {
      const key = el.dataset.tw;
      if (el.tagName === 'INPUT' && el.type === 'range') el.value = state[key];
      else if (el.tagName === 'INPUT' && el.type === 'checkbox') el.checked = !!state[key];
      else el.classList.toggle('on', String(state[key]) === el.dataset.val);
    });
    // Update read-out values
    const txOut = document.getElementById('tw-tex-out');
    if (txOut) txOut.textContent = state.texture;
  }

  function buildPanel() {
    if (document.getElementById('al-tweaks')) return;

    const css = `
      #al-tweaks {
        position: fixed; right: 16px; bottom: 16px; z-index: 200;
        width: 280px;
        background: color-mix(in srgb, var(--bg) 92%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--rule);
        border-radius: 4px;
        font-family: var(--f-body);
        color: var(--ink);
        box-shadow: 0 24px 48px -16px rgba(0,0,0,0.4);
        display: none;
        overflow: hidden;
      }
      #al-tweaks.open { display: block; }
      #al-tweaks header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 14px; border-bottom: 1px solid var(--rule-soft);
      }
      #al-tweaks h4 {
        font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.18em;
        text-transform: uppercase; color: var(--ink); font-weight: 500;
      }
      #al-tweaks .tw-close {
        background: none; border: none; color: var(--ink-mute);
        cursor: pointer; padding: 2px 6px; font-size: 16px; line-height: 1;
      }
      #al-tweaks .tw-close:hover { color: var(--accent); }
      #al-tweaks .tw-body { padding: 14px; display: flex; flex-direction: column; gap: 16px; }
      #al-tweaks .tw-section { display: flex; flex-direction: column; gap: 8px; }
      #al-tweaks label {
        font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.14em;
        text-transform: uppercase; color: var(--ink-mute);
        display: flex; justify-content: space-between; align-items: baseline;
      }
      #al-tweaks label .val { color: var(--accent); font-family: var(--f-mono); letter-spacing: 0.06em; text-transform: none; }
      #al-tweaks .seg {
        display: grid; gap: 1px; background: var(--rule-soft); border-radius: 3px; overflow: hidden;
      }
      #al-tweaks .seg.cols-3 { grid-template-columns: repeat(3, 1fr); }
      #al-tweaks .seg.cols-4 { grid-template-columns: repeat(4, 1fr); }
      #al-tweaks .seg button {
        background: var(--bg); border: none; color: var(--ink-mute);
        padding: 7px 4px; font-family: var(--f-mono); font-size: 10.5px;
        letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
        transition: background 180ms ease, color 180ms ease;
      }
      #al-tweaks .seg button:hover { color: var(--ink); }
      #al-tweaks .seg button.on { background: var(--accent-glow); color: var(--ink); }
      #al-tweaks input[type=range] {
        width: 100%; -webkit-appearance: none; appearance: none;
        background: var(--rule); height: 2px; border-radius: 999px; outline: none;
      }
      #al-tweaks input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px; height: 14px; border-radius: 50%;
        background: var(--accent); border: 2px solid var(--bg); cursor: pointer;
      }
      #al-tweaks input[type=range]::-moz-range-thumb {
        width: 14px; height: 14px; border-radius: 50%;
        background: var(--accent); border: 2px solid var(--bg); cursor: pointer;
      }
      #al-tweaks .tw-foot {
        font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.14em;
        text-transform: uppercase; color: var(--ink-mute); padding: 8px 14px;
        border-top: 1px solid var(--rule-soft); display: flex; justify-content: space-between;
      }
      #al-tweaks .tw-foot button {
        background: none; border: none; color: var(--ink-mute);
        font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.14em;
        text-transform: uppercase; cursor: pointer;
      }
      #al-tweaks .tw-foot button:hover { color: var(--accent); }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'al-tweaks';
    panel.innerHTML = `
      <header>
        <h4>Tweaks</h4>
        <button class="tw-close" aria-label="Close">×</button>
      </header>
      <div class="tw-body">
        <div class="tw-section">
          <label>Hero variant <span class="val" id="tw-hero-out">${state.hero}</span></label>
          <div class="seg cols-4">
            <button data-tw="hero" data-val="1">I</button>
            <button data-tw="hero" data-val="2">II</button>
            <button data-tw="hero" data-val="3">III</button>
            <button data-tw="hero" data-val="4">IV</button>
          </div>
        </div>
        <div class="tw-section">
          <label>Hand-script <span class="val" id="tw-hand-out">${state.hand}</span></label>
          <div class="seg cols-3">
            <button data-tw="hand" data-val="on">On</button>
            <button data-tw="hand" data-val="muted">Muted</button>
            <button data-tw="hand" data-val="off">Off</button>
          </div>
        </div>
        <div class="tw-section">
          <label>Paper texture <span class="val" id="tw-tex-out">${state.texture}</span></label>
          <input type="range" min="0" max="10" step="1" data-tw="texture" />
        </div>
      </div>
      <div class="tw-foot">
        <span>Aion Lumen · v0.1</span>
        <button id="tw-reset">Reset</button>
      </div>
    `;
    document.body.appendChild(panel);

    // Wire interactions
    panel.querySelector('.tw-close').addEventListener('click', () => {
      panel.classList.remove('open');
      try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (_) {}
    });
    panel.querySelectorAll('[data-tw]').forEach(el => {
      if (el.tagName === 'BUTTON') {
        el.addEventListener('click', () => {
          const key = el.dataset.tw;
          let val = el.dataset.val;
          if (key === 'hero') val = +val;
          state[key] = val;
          save(key, val);
          apply();
          // also update read-out
          const out = document.getElementById('tw-' + (key === 'hero' ? 'hero' : key) + '-out');
          if (out) out.textContent = val;
          try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*'); } catch (_) {}
        });
      } else if (el.tagName === 'INPUT' && el.type === 'range') {
        el.addEventListener('input', () => {
          const key = el.dataset.tw;
          state[key] = +el.value;
          save(key, el.value);
          apply();
          try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: +el.value } }, '*'); } catch (_) {}
        });
      }
    });
    panel.querySelector('#tw-reset').addEventListener('click', () => {
      Object.assign(state, TWEAK_DEFAULTS);
      Object.entries(TWEAK_DEFAULTS).forEach(([k, v]) => save(k, v));
      apply();
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: TWEAK_DEFAULTS }, '*'); } catch (_) {}
    });
  }

  // ── Host protocol ─────────────────────────────────────────────
  window.addEventListener('message', (e) => {
    const data = e.data || {};
    if (data.type === '__activate_edit_mode') {
      buildPanel();
      const p = document.getElementById('al-tweaks');
      if (p) { p.classList.add('open'); apply(); }
    }
    if (data.type === '__deactivate_edit_mode') {
      const p = document.getElementById('al-tweaks');
      if (p) p.classList.remove('open');
    }
  });

  // Apply persisted state on load even when panel is closed
  document.addEventListener('DOMContentLoaded', apply);
  // Announce availability AFTER listener is registered
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (_) {}
})();

// ── Lumen spark: ignite once when closing line scrolls into view ──
(() => {
  const el = document.querySelector('.lumen-spark');
  if (!el) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => { el.classList.add('is-lit'); }, 800);
        observer.disconnect();
      }
    });
  }, { threshold: 1.0 });
  observer.observe(el);
})();
