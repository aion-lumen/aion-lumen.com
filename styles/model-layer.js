/* A prepared example, not live inference. All content is fictional release data. */
(() => {
  'use strict';
  const en = document.documentElement.lang === 'en';
  const t = (de, eng) => en ? eng : de;
  const shot = '/assets/cases/v0.6.0-preview.2/model-voices.png';
  document.querySelectorAll('[data-layer-demo]').forEach((demo, index) => {
    const id = `layer-example-${index}`;
    const labels = [t('Wissen', 'Knowledge'), t('Lokale Modelle', 'Local models'), t('Regeln', 'Rules')];
    demo.innerHTML = `
      <div class="layer-demo-tabs" role="group" aria-label="${t('Die drei Brettschichten', 'The three board layers')}">
        ${labels.map((label, i) => `<button type="button" data-example-layer="${i}" aria-pressed="${i === 1}" aria-controls="${id}"><span>0${i+1}</span>${label}</button>`).join('')}
      </div>
      <div class="layer-example" id="${id}">
        <section class="layer-pane" data-layer-pane="0" hidden>
          <p class="layer-kicker">${t('DIE QUELLE', 'THE SOURCE')}</p>
          <h3>${t('Jahresabrechnung · Strom', 'Annual electricity statement')}</h3>
          <blockquote>${t('„Ihre Jahresabrechnung ergibt ein Guthaben von 48 EUR. Ihr neuer Monatsabschlag beträgt ab Oktober 62 EUR.“', '“Your annual statement shows a credit of EUR 48. Your new monthly instalment is EUR 62 from October.”')}</blockquote>
          <p>${t('Die Originalmail liefert den Zusammenhang. Ein angekündigtes Guthaben ist noch kein bestätigter Zahlungseingang.', 'The original email provides context. An announced credit is not yet a confirmed payment.')}</p>
          <small>${t('Erfundene Nachricht aus den Folio-Testdaten.', 'Fictional message from the Folio sample data.')}</small>
        </section>
        <section class="layer-pane" data-layer-pane="1">
          <div class="layer-example-head"><div><p class="layer-kicker">${t('EINE MAIL · DREI BEWERTUNGEN', 'ONE EMAIL · THREE ASSESSMENTS')}</p><h3>${t('Jahresabrechnung · Strom', 'Annual electricity statement')}</h3></div>
            <button type="button" class="layer-proof" aria-expanded="false" aria-controls="${id}-proof" aria-label="${t('Echte Folio-Ansicht mit Beispieldaten anzeigen', 'Show the actual Folio view with sample data')}"><img src="${shot}" alt="" width="1024" height="341"/><span>${t('Folio-Ansicht', 'Folio view')} ↗</span></button>
          </div>
          <div class="layer-assessments">
            <div class="model-voice"><div><strong>GLM-4.7 Flash</strong><span>${t('Finanzen', 'Finance')}</span></div><p>${t('Jahresabrechnung mit 48 EUR angekündigtem Guthaben.', 'Annual statement announcing a EUR 48 credit.')}</p></div>
            <div class="model-voice"><div><strong>Qwen 3.6</strong><span>${t('Finanzen', 'Finance')}</span></div><p>${t('Neuer Abschlag: 62 EUR monatlich ab Oktober.', 'New instalment: EUR 62 a month from October.')}</p></div>
            <div class="model-voice"><div><strong>Qwen 3.8</strong><span>${t('Finanzen', 'Finance')}</span></div><p>${t('Belegt eine Abrechnung, noch keinen Zahlungseingang.', 'Evidence of a statement, not yet of a payment.')}</p></div>
          </div>
          <p class="layer-fixture">${t('Vorbereitete Bewertungen · nacheinander eingeblendet.', 'Prepared assessments · revealed in sequence.')}</p>
          <div class="layer-proof-view" id="${id}-proof" hidden>
            <button type="button" class="layer-proof-close">← ${t('Zurück zu den Stimmen', 'Back to the assessments')}</button>
            <img src="${shot}" alt="${t('Folio: feste Regeln und drei benannte lokale Modelle ordnen die Beispielabrechnung als Finanzen ein.', 'Folio: fixed rules and three named local models classify the sample statement as finance.')}" width="1024" height="341"/>
            <p>${t('Echte Oberfläche · erfundene Daten und vorbereitete Bewertungen. Die Modellnamen und Begründungen sind in Folio direkt aufklappbar.', 'Actual interface · fictional data and prepared assessments. Model names and reasons can be expanded directly in Folio.')}</p>
          </div>
        </section>
        <section class="layer-pane" data-layer-pane="2" hidden>
          <p class="layer-kicker">${t('FESTE REGELN · KEIN SPRACHMODELL', 'FIXED RULES · NOT A LANGUAGE MODEL')}</p>
          <h3>${t('Einordnen ist nicht ausführen.', 'Classifying is not acting.')}</h3>
          <div class="rule-example"><span>H</span><p>${t('Abrechnung, Guthaben und Abschlag sind Finanzsignale.', 'Statement, credit and instalment are finance signals.')}</p></div>
          <p>${t('Auch die feste Regel erkennt „Finanzen“. Die vier Stimmen bleiben getrennt nachvollziehbar; aus dieser Mail allein wird kein Zahlungseingang bestätigt.', 'The fixed rule also identifies “Finance”. All four assessments remain individually traceable; this email alone does not confirm receipt of payment.')}</p>
          <small>${t('Feste Regeln ergänzen die Modelle.', 'Fixed rules complement the models.')}</small>
        </section>
      </div>
      <p class="layer-hardware">${t('<strong>Lokal · MacBook · 48 GB RAM.</strong> Modelle bewerten Mailstapel nacheinander, damit der Speicher reicht.', '<strong>Local · MacBook · 48 GB RAM.</strong> Models assess email batches one after another to fit in memory.')}</p>
      <a class="layer-lab" href="/multi-agent/${en ? 'en.html' : ''}#roles">${t('Wie wir die Modelle auswählen', 'How we select the models')} →</a>`;

    const proof = demo.querySelector('.layer-proof');
    const proofView = demo.querySelector('.layer-proof-view');
    function showProof(open) {
      proofView.hidden = !open;
      proof.setAttribute('aria-expanded', String(open));
      demo.querySelector('.layer-example-head').hidden = open;
      demo.querySelector('.layer-assessments').hidden = open;
      demo.querySelector('.layer-fixture').hidden = open;
      if (open) demo.querySelector('.layer-proof-close').focus({preventScroll: true});
    }
    demo.querySelector('.layer-proof-close').addEventListener('click', () => {
      showProof(false); proof.focus({preventScroll: true});
    });
    proof.addEventListener('click', () => showProof(true));
    demo.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !proofView.hidden) {
        showProof(false); proof.focus({preventScroll: true});
      }
    });
    demo.querySelectorAll('[data-example-layer]').forEach(button => {
      button.addEventListener('click', () => {
        showProof(false);
        const layer = button.dataset.exampleLayer;
        demo.querySelectorAll('[data-example-layer]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        demo.querySelectorAll('[data-layer-pane]').forEach(pane => pane.hidden = pane.dataset.layerPane !== layer);
        demo.closest('.board-layout')?.querySelectorAll('[data-layer]').forEach(part => part.classList.toggle('is-active', part.dataset.layer === layer));
      });
    });
    // Start the illustrative sequence when this example becomes visible.
    if (demo.closest('.board-copy')) {
      const phase = demo.closest('.board-copy');
      new MutationObserver(() => demo.classList.toggle('example-visible', phase.getAttribute('aria-hidden') === 'false'))
        .observe(phase, {attributes: true, attributeFilter: ['aria-hidden']});
    } else {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          demo.classList.add('example-visible'); observer.disconnect();
        }
      }, {threshold: .25});
      observer.observe(demo);
    }
  });
})();
