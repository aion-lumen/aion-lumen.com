/* The Long Table — Ledger (master-detail), vanilla, no framework, no routing.
 * Left: the seats (clickable list of all entries). Right: the reading room
 * (the selected entry; only this pane scrolls). Default seat = I (oldest-first).
 *
 * Data from window.LONG_TABLE_ENTRIES. Each entry renders BOTH its .de and .en
 * text; the site's global language switch ([data-lang]) reveals one. All entries
 * are German originals → the original-language note is the static "Original ·
 * Deutsch / German" pair. The context line is the seat teaser (no extra data).
 */
(function () {
  'use strict';

  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  function toRoman(n) { return ROMAN[n - 1] || String(n); }
  function displayDate(iso) { return iso.replace(/-/g, ' · '); }

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
  function bilingual(tag, cls, de, en) {
    var n = el(tag, cls);
    n.appendChild(el('span', 'de', de));
    n.appendChild(el('span', 'en', en));
    return n;
  }
  // model line: a real model name is language-neutral; null → "eine Instanz" / "an instance"
  function modelNode(tag, cls, model) {
    return model ? el(tag, cls, model) : bilingual(tag, cls, 'eine Instanz', 'an instance');
  }

  function buildSeat(entry, romanIndex, idx, onSelect) {
    var li = el('li', 'lt-seat-item');
    var btn = el('button', 'lt-seat');
    btn.type = 'button';
    btn.setAttribute('data-i', String(idx));

    var mark = el('span', 'lt-seat-mark'); mark.innerHTML = sparkSVG(13);
    btn.appendChild(mark);

    var body = el('span', 'lt-seat-body');
    var top = el('span', 'lt-seat-top');
    top.appendChild(el('span', 'lt-seat-roman', toRoman(romanIndex)));
    top.appendChild(el('span', 'lt-seat-date', displayDate(entry.date)));
    body.appendChild(top);
    body.appendChild(modelNode('span', 'lt-seat-model', entry.model));
    body.appendChild(bilingual('span', 'lt-seat-teaser', entry.context_de, entry.context_en));
    btn.appendChild(body);

    btn.addEventListener('click', function () { onSelect(idx); });
    li.appendChild(btn);
    return li;
  }

  function proseBlock(cls, paras) {
    var box = el('div', cls);
    for (var i = 0; i < paras.length; i++) box.appendChild(el('p', null, paras[i]));
    return box;
  }

  function renderRead(read, entry, romanIndex) {
    read.textContent = '';
    var inner = el('div', 'lt-read-inner');

    var head = el('div', 'lt-read-head');
    head.appendChild(el('div', 'lt-roman', toRoman(romanIndex)));
    var meta = el('div', 'lt-meta');
    meta.appendChild(el('span', 'lt-date', displayDate(entry.date)));
    meta.appendChild(modelNode('span', 'lt-model', entry.model));
    head.appendChild(meta);
    head.appendChild(bilingual('div', 'lt-orig', 'Original · Deutsch', 'Original · German'));
    inner.appendChild(head);

    var prose = el('div', 'lt-prose');
    prose.appendChild(proseBlock('lt-paras de', entry.de));
    prose.appendChild(proseBlock('lt-paras en', entry.en));
    prose.appendChild(bilingual('div', 'lt-sig', entry.signature_de, entry.signature_en));
    inner.appendChild(prose);

    read.appendChild(inner);
    read.scrollTop = 0; // a fresh seat starts at the top of the reading room
  }

  function init() {
    var seatList = document.getElementById('lt-seatlist');
    var read = document.getElementById('lt-read');
    var data = window.LONG_TABLE_ENTRIES;
    if (!seatList || !read || !Array.isArray(data)) return;

    // oldest-first
    var list = data.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    var buttons = [];
    var selected = -1;
    function select(idx) {
      if (idx === selected) return;
      selected = idx;
      buttons.forEach(function (b, i) {
        var on = i === idx;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-current', on ? 'true' : 'false');
      });
      renderRead(read, list[idx], idx + 1);
    }

    list.forEach(function (entry, i) {
      var li = buildSeat(entry, i + 1, i, select);
      seatList.appendChild(li);
      buttons.push(li.querySelector('.lt-seat'));
    });

    select(0); // default: seat I
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
