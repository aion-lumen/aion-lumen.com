/* Aion Lumen — native image lightbox. Zero external calls: one <dialog>,
 * vanilla JS/CSS, self-hosted assets only. Every content image opens at full
 * resolution; groups (story scenes, evidence) cycle with ‹ › and ←/→.
 * The veiled ingredients triptych (.trip-media) is intentionally excluded —
 * it keeps its own reveal interaction. */
(function () {
  'use strict';

  var SELECTOR = '.scene-media img, .shot img, .f-plate-frame img, .f-gal-frame img';
  var imgs = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  if (!imgs.length) return;

  var dlg = document.createElement('dialog');
  dlg.className = 'lb';
  dlg.setAttribute('aria-label', 'Image viewer');
  dlg.innerHTML =
    '<button class="lb-close" aria-label="Close">✕</button>' +
    '<button class="lb-nav lb-prev" aria-label="Previous">‹</button>' +
    '<figure class="lb-fig">' +
    '<img class="lb-img" alt="">' +
    '<figcaption class="lb-cap"><span class="lb-label"></span><span class="lb-text"></span></figcaption>' +
    '</figure>' +
    '<button class="lb-nav lb-next" aria-label="Next">›</button>' +
    '<p class="lb-hint">ESC · ‹ › · ← / →</p>';
  document.body.appendChild(dlg);

  var lbImg = dlg.querySelector('.lb-img');
  var lbLabel = dlg.querySelector('.lb-label');
  var lbText = dlg.querySelector('.lb-text');
  var prevBtn = dlg.querySelector('.lb-prev');
  var nextBtn = dlg.querySelector('.lb-next');
  var idx = 0;
  var trigger = null;

  function caption(img) {
    var label = img.getAttribute('data-label') || '';
    var text = '';
    var fig = img.closest('figure');
    if (fig) {
      var cap = fig.querySelector('figcaption');
      if (cap) text = cap.textContent.trim();
    }
    if (!text) text = img.getAttribute('alt') || '';
    return { label: label, text: text };
  }

  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    var img = imgs[idx];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    var c = caption(img);
    lbLabel.textContent = c.label;
    lbText.textContent = c.text;
  }

  function open(i, el) {
    trigger = el;
    show(i);
    document.body.style.overflow = 'hidden';
    dlg.showModal();
  }

  dlg.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (trigger) { trigger.focus(); trigger = null; }
  });

  var single = imgs.length < 2;
  if (single) { prevBtn.style.display = 'none'; nextBtn.style.display = 'none'; }

  imgs.forEach(function (img, i) {
    img.classList.add('lb-zoom');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('click', function () { open(i, img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, img); }
    });
  });

  dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });

  /* Click on the scrim / padding (the dialog itself, not its children) closes. */
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });

  document.addEventListener('keydown', function (e) {
    if (!dlg.open || single) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    /* Esc is handled natively by <dialog>, which fires 'close'. */
  });
})();
