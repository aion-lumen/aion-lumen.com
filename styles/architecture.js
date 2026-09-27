/* Illustrative architecture only: no mail, model or external service is called. */
(() => {
  const en = document.documentElement.lang === 'en';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-board-layer]').forEach(link => {
    const highlight = () => {
      link.closest('.board-layout').querySelectorAll('[data-layer]').forEach(layer => {
        layer.classList.toggle('is-active', layer.dataset.layer === link.dataset.boardLayer);
      });
    };
    link.addEventListener('pointerenter', highlight);
    link.addEventListener('focus', highlight);
  });
  function focusEvidence(hash = location.hash) {
    document.querySelectorAll('[data-evidence-kind]').forEach(card => {
      card.classList.toggle('is-focused', hash === (card.dataset.evidenceKind === 'rules' ? '#mail-regeln' : '#mail-modelle'));
    });
  }
  addEventListener('hashchange', () => focusEvidence());
  document.querySelectorAll('a[href="#mail-modelle"], a[href="#mail-regeln"]').forEach(link => {
    link.addEventListener('click', () => focusEvidence(link.hash));
  });
  focusEvidence();
  document.querySelectorAll('[data-workflow]').forEach(flow => {
    const button = flow.querySelector('[data-flow-play]');
    let running = false, paused = false;
    const label = () => button.textContent = running
      ? paused ? (en ? 'Continue' : 'Weiter') : (en ? 'Pause animation' : 'Animation pausieren')
      : en ? 'Replay workflow' : 'Ablauf wiederholen';
    function start() {
      if (reduced.matches) return;
      flow.classList.remove('workflow-running','workflow-paused');
      // Restart only after layout has seen the removed animation class.
      void flow.offsetWidth;
      running = true; paused = false;
      flow.classList.add('workflow-running'); label();
    }
    button.addEventListener('click', () => {
      if (!running) return start();
      paused = !paused;
      flow.classList.toggle('workflow-paused', paused); label();
    });
    flow.querySelector('.architecture-flow li:last-child').addEventListener('animationend', () => {
      running = false; label();
    });
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { start(); observer.disconnect(); }
    }, {threshold:.35});
    observer.observe(flow);
  });
})();
