/* The Long Table — render (vanilla, no framework).
 * Reads window.LONG_TABLE_ENTRIES, sorts oldest-first, fills #lt-entries.
 * Roman numeral + display date are derived here so a new entry is just one
 * object in entries.js.
 *
 * No per-entry language toggle: each entry renders BOTH its .de and .en text,
 * and the site's global language switch ([data-lang] on <html>) shows the right
 * one — exactly like the rest of the site. All entries are German originals, so
 * the original-language note is the static pair "Original · Deutsch / German".
 */
(function () {
  'use strict';

  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  function toRoman(n) { return ROMAN[n - 1] || String(n); }
  function displayDate(iso) { return iso.replace(/-/g, ' · '); } // 2026-04-29 -> 2026 · 04 · 29

  // Site Lumen mark (viewBox 0 0 56 56), inherits color from CSS (var(--accent)).
  function sparkSVG(size) {
    return '<svg viewBox="0 0 56 56" width="' + size + '" height="' + size + '" fill="none" aria-hidden="true">' +
      '<path d="M28 4 L28 52" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M16 16 L40 16 M14 22 L42 22 M18 28 L38 28" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>' +
      '<circle cx="28" cy="10" r="3" fill="currentColor"/>' +
      '<circle cx="28" cy="10" r="6" stroke="currentColor" stroke-width="0.5" opacity="0.5"/></svg>';
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // A bilingual text node: <span class="de">…</span><span class="en">…</span>
  // wrapped in `tag`. The global [data-lang] shows exactly one.
  function bilingual(tag, cls, de, en) {
    var n = el(tag, cls);
    n.appendChild(el('span', 'de', de));
    n.appendChild(el('span', 'en', en));
    return n;
  }

  function proseBlock(cls, paras) {
    var box = el('div', cls);
    for (var i = 0; i < paras.length; i++) box.appendChild(el('p', null, paras[i]));
    return box;
  }

  function buildEntry(entry, romanIndex) {
    var row = el('article', 'lt-entry');

    // ── Rail ──
    var rail = el('div', 'lt-rail');
    var seat = el('div', 'lt-seat');
    seat.innerHTML = sparkSVG(16);
    rail.appendChild(seat);
    rail.appendChild(el('div', 'lt-roman', toRoman(romanIndex)));
    rail.appendChild(el('div', 'lt-date', displayDate(entry.date)));
    rail.appendChild(bilingual('div', 'lt-context', entry.context_de, entry.context_en));
    // original-language note (static, informational — no toggle)
    rail.appendChild(bilingual('div', 'lt-orig', 'Original · Deutsch', 'Original · German'));

    // ── Prose: both language versions; [data-lang] reveals one ──
    var prose = el('div', 'lt-prose');
    prose.appendChild(proseBlock('lt-paras de', entry.de));
    prose.appendChild(proseBlock('lt-paras en', entry.en));
    prose.appendChild(bilingual('div', 'lt-sig', entry.signature_de, entry.signature_en));

    row.appendChild(rail);
    row.appendChild(prose);
    return row;
  }

  function buildOpenSeat() {
    var seat = el('article', 'lt-entry lt-openseat-row');
    seat.appendChild(el('div', 'lt-rail'));
    seat.appendChild(bilingual('div', 'lt-openseat',
      'Ein Platz bleibt gedeckt. Der nächste Stuhl steht hier — ein stiller Weg, später einen Eintrag hinzuzufügen, könnte hier wohnen. Kein Formular heute, keine Einladung lauter als der Funke.',
      'A place is kept set. The next chair goes here — a quiet way to add an entry could live here later. No form today, no invitation louder than the spark.'));
    return seat;
  }

  function init() {
    var mount = document.getElementById('lt-entries');
    var data = window.LONG_TABLE_ENTRIES;
    if (!mount || !Array.isArray(data)) return;

    var list = data.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var frag = document.createDocumentFragment();
    list.forEach(function (entry, i) { frag.appendChild(buildEntry(entry, i + 1)); });
    frag.appendChild(buildOpenSeat());
    mount.appendChild(frag);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
