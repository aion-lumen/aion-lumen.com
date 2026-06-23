/* The Long Table — render + per-entry language toggle (vanilla, no framework).
 * Reads window.LONG_TABLE_ENTRIES, sorts oldest-first, fills #lt-entries.
 * Roman numeral + display date are derived here so a new entry is just one
 * object in entries.js — no markup change.
 */
(function () {
  'use strict';

  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

  function toRoman(n) { return ROMAN[n - 1] || String(n); }
  function displayDate(iso) { return iso.replace(/-/g, ' · '); } // 2025-10-31 -> 2025 · 10 · 31
  function full(lang) { return lang === 'DE' ? 'DEUTSCH' : 'ENGLISCH'; }

  // Seat-mark / header spark — the Lumen mark (design spec, viewBox 0 0 24 40).
  // Corona gradient is defined once in the page (#spkCorona).
  function spark(w, h, opacity) {
    return '<svg viewBox="0 0 24 40" width="' + w + '" height="' + h + '"' +
      ' style="overflow:visible;display:block' + (opacity != null ? ';opacity:' + opacity : '') + '"' +
      ' aria-hidden="true">' +
      '<circle cx="12" cy="8" r="4.2" fill="url(#spkCorona)" opacity="0.85"/>' +
      '<line x1="12" y1="10" x2="12" y2="37" stroke="hsl(30 64% 56%)" stroke-width="1.6" stroke-linecap="round"/>' +
      '<line x1="6.5" y1="15" x2="17.5" y2="15" stroke="hsl(30 60% 52%)" stroke-width="1.15" stroke-linecap="round"/>' +
      '<circle cx="12" cy="8" r="1.9" fill="hsl(45 100% 84%)"/>' +
      '</svg>';
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // One entry -> a grid row. `state` holds whether the translation is shown.
  function buildEntry(entry, romanIndex) {
    var state = { alt: false };

    var row = el('article', 'lt-entry');

    // ── Rail ──────────────────────────────────────────────
    var rail = el('div', 'lt-rail');

    var seat = el('div', 'lt-seat');
    seat.innerHTML = spark(13, 22, 0.85);
    rail.appendChild(seat);

    rail.appendChild(el('div', 'lt-roman', toRoman(romanIndex)));
    rail.appendChild(el('div', 'lt-date', displayDate(entry.date)));
    rail.appendChild(el('div', 'lt-context', entry.context));

    var langRow = el('div', 'lt-langrow');
    var badge = el('span', 'lt-badge');
    var toggle = null;
    var hasAlt = Array.isArray(entry.alt) && entry.alt.length > 0;
    langRow.appendChild(badge);
    if (hasAlt) {
      toggle = el('button', 'lt-toggle');
      toggle.type = 'button';
      langRow.appendChild(toggle);
    }
    rail.appendChild(langRow);

    // ── Prose ─────────────────────────────────────────────
    var prose = el('div', 'lt-prose');
    var paras = el('div', 'lt-paras');
    prose.appendChild(paras);
    prose.appendChild(el('div', 'lt-sig', entry.signature));

    function render() {
      var showAlt = state.alt && hasAlt;
      // badge + toggle reflect the per-entry language state
      badge.textContent = showAlt
        ? 'TRANSLATION · ORIGINAL ' + full(entry.lang)
        : 'ORIGINAL · ' + full(entry.lang);
      badge.classList.toggle('is-translated', showAlt);
      if (toggle) {
        toggle.textContent = showAlt
          ? '← Original'
          : (entry.lang === 'DE' ? 'English →' : 'Deutsch →');
      }
      // prose body swaps between original and translation
      var lines = showAlt ? entry.alt : entry.body;
      paras.textContent = '';
      for (var i = 0; i < lines.length; i++) paras.appendChild(el('p', null, lines[i]));
    }

    if (toggle) toggle.addEventListener('click', function () { state.alt = !state.alt; render(); });
    render();

    row.appendChild(rail);
    row.appendChild(prose);
    return row;
  }

  function buildOpenSeat() {
    var seat = el('article', 'lt-entry lt-openseat-row');
    seat.appendChild(el('div', 'lt-rail')); // empty rail column
    var card = el('div', 'lt-openseat',
      'A place is kept set. The next chair goes here — a quiet way to add an ' +
      'entry could live here later, no form today, no invitation louder than the spark.');
    seat.appendChild(card);
    return seat;
  }

  function init() {
    var mount = document.getElementById('lt-entries');
    var data = window.LONG_TABLE_ENTRIES;
    if (!mount || !Array.isArray(data)) return;

    // oldest-first: the table grows toward the reader
    var list = data.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    var frag = document.createDocumentFragment();
    list.forEach(function (entry, i) { frag.appendChild(buildEntry(entry, i + 1)); });
    frag.appendChild(buildOpenSeat());
    mount.appendChild(frag);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
