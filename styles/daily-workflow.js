/* Presentation only: synthetic fixtures, no Folio API or account connection.
 * Shell, intake and model-card styling follow Folio v0.6.0-preview.5.
 * The embedded assessment image was captured from real Folio components.
 */
(() => {
  const en = document.documentElement.lang === 'en';
  const t = (de, eng) => en ? eng : de;
  const labels = [t('Einrichten','Set up'),t('Eingang','Receive'),t('Modelle','Models'),t('Einordnen','Sort'),t('Weiterarbeiten','Follow up'),t('Monatsabgleich','Month end')];
  const titles = [t('Maileingang einschalten.','Enable mail intake.'),t('Neue Mails kommen an.','New mail arrives.'),t('Ein Stapel. Mehrere Perspektiven.','One batch. Several perspectives.'),t('Die Einordnung wird nachvollziehbar.','See how a message was classified.'),t('Das Richtige wartet am richtigen Ort.','Each next step has its place.'),t('Erst abgleichen. Dann nachfragen.','Reconcile first. Ask next.')];
  const captions = [t('Einstellungen → Automatischer Maileingang.','Settings → Automatic mail intake.'),t('Die Leuchte in der Seitenleiste begleitet den Lauf.','The sidebar indicator follows the run.'),t('Nacheinander lokal · MacBook mit 48 GB RAM.','Sequentially, locally · MacBook with 48 GB RAM.'),t('Eine Mail, ihre Domäne und die Stimmen dahinter.','A message, its domain and the assessments behind it.'),t('Zahlungsbelege warten auf den passenden Kontoauszug.','Payment evidence waits for the matching bank statement.'),t('Ledger: Konten und Auszugsordner einrichten, Monatsabgleich aktivieren. Offenes kommt nach dem Abgleich zu dir.','Ledger: set up accounts and statement folders, then enable monthly reconciliation. Unresolved cases come to you after reconciliation.')];
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m3 0h2"/>',
    brain:'<path d="M12 5c-3-5-8 0-6 3-5 2-3 7-1 8-1 5 6 7 7 2 1 5 8 3 7-2 3-2 4-6-1-8 2-3-3-8-6-3v13M6 8l3 2m9-2-3 2M5 16l4-2m10 2-4-2"/>',
    pipeline:'<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v9h9M9 6h9v9"/>',
    ledger:'<path d="m3 8 9-5 9 5ZM3 21h18M5 10v8m7-8v8m7-8v8"/>',
    settings:'<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    file:'<path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8m-8 4h6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  const invoice=t('Jahresabrechnung · Strom','Annual statement · Electricity');
  const appointment=t('Terminbestätigung · Wartung','Appointment confirmation · Maintenance');
  const contract=t('Vertragsverlängerung · Mobilfunk','Contract renewal · Mobile plan');
  const small = (text) => `<span class="dw-muted">${text}</span>`;
  const tabs = (active) => `<div class="dw-memory-tabs">${[t('Deine Entscheidung','Your decision'),t('Vorbereitung & Warten','Preparing & waiting'),t('Automatisch erledigt','Automatically completed')].map((label,i)=>`<span class="${i===active?'selected':''}">${label}</span>`).join('')}</div>`;
  const mailRows = (classified=false) => [invoice,appointment,contract].map((name,i)=>`<div class="dw-mailrow" style="--i:${i}"><span class="dw-mail-dot"></span><div><small>${['rechnung@beispielwerk.example','service@hauspflege.example','team@mobilnetz.example'][i]}</small><strong>${name}</strong><p>${[t('Abrechnung, Guthaben und neuer Abschlag.','Statement, credit and new instalment.'),t('Ihr Wartungstermin ist bestätigt.','Your maintenance appointment is confirmed.'),t('Ihr Tarif läuft zum Monatsende aus.','Your plan expires at the end of the month.')][i]}</p></div><span class="dw-mail-end">${classified?`<b class="dw-domain ${i===1?'dw-system':''}">Finance</b>`:`<time>09:0${i}</time>${small(t('Neu','New'))}`}</span></div>`).join('');
  document.querySelectorAll('[data-daily-workflow]').forEach(root => {
    root.innerHTML = `<div class="dw-top"><span>${t('FOLIO · ANIMIERTE DEMO · BEISPIELDATEN','FOLIO · ANIMATED DEMO · SAMPLE DATA')}</span><button type="button" data-play></button></div>
      <div class="dw-story"><h3 data-title></h3><p data-caption></p></div>
      <div class="dw-app">
        <aside class="dw-sidebar" aria-label="${t('Folio-Navigation in der Demo','Folio navigation in the demo')}">${[['home',0,t('Heute','Today')],['calendar',4,t('Kalender','Calendar')],['brain',4,t('Gedächtnis','Memory')],['mail',3,'Mail'],['pipeline',2,'Pipeline'],['ledger',5,'Ledger']].map(([name,step,label])=>`<button type="button" data-nav="${name}" data-goto="${step}" title="${label}" aria-label="${label}">${icon(name)}</button>${name==='pipeline'?'<span class="dw-worker"><i></i><span data-worker>idle</span></span>':''}`).join('')}<button type="button" class="dw-settings-nav" data-nav="settings" data-goto="0" title="${t('Einstellungen','Settings')}" aria-label="${t('Einstellungen','Settings')}">${icon('settings')}</button></aside>
        <div class="dw-window"><div class="dw-appbar"><strong><span class="dw-pulsar">◉</span> Folio</strong><span class="dw-local">demo.local</span><span class="dw-avatar">DE</span></div>
        <div class="dw-screen">
          <section data-scene="0">
            <div class="dw-settings-page"><span class="dw-eyebrow">FOLIO</span><h4>${t('Einstellungen','Settings')}</h4><div class="dw-card"><h5>${t('Mail & Übergaben','Mail & handoffs')}</h5><div class="dw-setting-link">${t('Automatischer Maileingang','Automatic mail intake')} <span>→</span></div><div class="dw-setting-link">${t('Projektkontext und Übergaben','Project context and handoffs')} <span>→</span></div></div><div class="dw-card"><h5>${t('Werkzeuge','Tools')}</h5><div class="dw-setting-link">${t('Pipeline und Modelle','Pipeline and models')} <span>→</span></div></div></div>
            <div class="dw-intake-page"><span class="dw-eyebrow">${t('LOKAL VERBUNDEN','LOCALLY CONNECTED')}</span><h4>${t('Dein Maileingang.','Your mail intake.')}</h4><div class="dw-intake-control"><div><span class="dw-badge" data-intake-status></span><h5>${t('Raum für die nächsten Eingänge.','Ready for new messages.')}</h5><p>${t('Neue Eingänge stündlich · 1 Quelle','New mail hourly · 1 source')}</p></div><button type="button" data-activate></button></div><div class="dw-path"><span>1 · ${t('Eingang','Intake')}</span><span>2 · ${t('Modellbewertungen','Assessments')}</span><span>3 · ${t('Belegte Erinnerung','Verified memory')}</span></div></div>
          </section>
          <section data-scene="1"><span class="dw-eyebrow">MAIL</span><h4>${t('Posteingang','Inbox')} <small>3</small></h4><div class="dw-mailtable">${mailRows()}</div><div class="dw-run-note"><i></i>${t('Mails abgerufen · Modellbewertungen folgen','Messages retrieved · model assessments next')}</div></section>
          <section data-scene="2"><div class="dw-page-heading"><h4>Pipeline</h4><span class="dw-badge">${t('Läuft','Running')}</span></div><div class="dw-phase"><span>${t('Maileingang','Mail intake')} ✓</span><span class="active">${t('Modellprüfung','Model review')}</span><span>Memory</span></div><div class="dw-model-grid">${[['Kontrollmodell','Control model','zai-org/glm-4.7-flash'],['Kontrollmodell','Control model','qwen3.6-35b-a3b-ud-mlx'],['Primärmodell','Primary model','qwen3.8-27b-mlx'],['Bei Uneinigkeit · unabhängige Prüfung','If assessments differ · independent review','google/gemma-4-31b-qat']].map(([de,eng,id],i)=>`<div class="dw-model-card" data-model="${i}"><span class="dw-role"><i></i>${t(de,eng)}</span><strong>${id}</strong><span class="dw-model-status"></span><div class="dw-model-progress"><i></i></div></div>`).join('')}</div><div class="dw-console"><span data-console></span><span class="dw-console-caret">▍</span></div><a class="dw-lab-link" href="${en?'/multi-agent/en.html':'/multi-agent/'}">${t('Modellauswahl im Multi-Agent-Lab','Model selection in the Multi-Agent-Lab')} ↗</a></section>
          <section data-scene="3"><span class="dw-eyebrow">MAIL</span><h4>${t('Einordnung & Stimmen','Classification & assessments')}</h4><div class="dw-classified">${mailRows(true)}</div><div class="dw-assessment"><div class="dw-assessment-title">${invoice}<span>Finance</span></div><img src="/assets/cases/v0.6.0-preview.2/model-voices.png" alt="${t('Folio-Detailpanel: feste Regeln und drei lokale Modelle ordnen die Beispielrechnung Finance zu.','Folio detail panel: rules and three local models classify the sample invoice as Finance.')}" loading="lazy" width="1024" height="341"/><div class="dw-voices"><div class="dw-voices-head">${t('4 Stimmen · alle einig','4 assessments · in agreement')}</div>${[['H',t('Feste Regeln','Fixed rules'),t('Abrechnung, Guthaben und Abschlag sind Finanzsignale.','Statement, credit and instalment indicate finance.')],['1','GLM-4.7 Flash',t('48 EUR angekündigtes Guthaben.','EUR 48 credit announced.')],['2','Qwen 3.6',t('62 EUR monatlicher Abschlag ab Oktober.','EUR 62 monthly instalment from October.')],['3','Qwen 3.8',t('Abrechnung belegt, Zahlungseingang noch offen.','Statement evidenced; receipt of payment still open.')]].map(([n,model,reason])=>`<div class="dw-voice"><b>${n}</b><div><strong>${model}</strong><p>${reason}</p></div><small>Finance</small></div>`).join('')}</div></div></section>
          <section data-scene="4"><span class="dw-eyebrow">${t('FOLIO-GEDÄCHTNIS','FOLIO MEMORY')}</span><h4>${t('Was weiss Folio?','What does Folio know?')}</h4>${tabs(1)}<div class="dw-memory-card"><span class="dw-eyebrow">${t('WARTET AUF KONTOAUSZUG','WAITING FOR BANK STATEMENT')}</span><h5>${invoice}</h5><p>${t('Angekündigtes Guthaben · 48,00 EUR','Announced credit · EUR 48.00')}</p><div class="dw-source">${icon('mail')}${t('Originalmail & Abrechnung','Original message & statement')}${icon('clock')}</div></div><div class="dw-calendar-row">${icon('calendar')}<div><strong>${appointment}</strong><span>${t('Kalendervorschlag zur Freigabe','Calendar proposal for approval')}</span></div><b>→</b></div></section>
          <section data-scene="5"><span class="dw-eyebrow">${t('FOLIO-GEDÄCHTNIS','FOLIO MEMORY')}</span><h4>${t('Monatsabgleich','Monthly reconciliation')}</h4><div class="dw-statement">${icon('file')}<div><strong>${t('Kontoauszug · September · vollständig','Bank statement · September · complete')}</strong><span>demo.local · ${t('Konto EUR','EUR account')}</span></div><span class="dw-badge">${t('Eingegangen','Received')}</span></div><div class="dw-reconcile"><div>${invoice}<strong>48,00 EUR</strong></div><span class="dw-match-arrow">⇄</span><div>${t('Gutschrift · Beispielwerk','Credit · Example utilities')}<strong>48,00 EUR</strong></div></div><div class="dw-resolution"><div>${icon('check')}<strong>${t('Automatisch erledigt','Automatically completed')}</strong><span>${t('Gutschrift im Auszug belegt','Credit verified in statement')}</span></div><div>${icon('clock')}<strong>${t('Deine Entscheidung','Your decision')}</strong><span>${t('Weiterer Beleg · Zuordnung offen','Another receipt · match unresolved')}</span></div></div></section>
        </div><div class="dw-statusbar"><span><i></i>${t('Lokal auf deinem Mac','Local on your Mac')}</span><span data-screen-label></span></div></div>
      </div><nav class="dw-steps" aria-label="${t('Ablaufschritte','Workflow steps')}">${labels.map((label,i)=>`<button type="button" data-step="${i}"><span>${String(i+1).padStart(2,'0')}</span>${label}<i></i></button>`).join('')}</nav>`;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const duration=[8,6,10,8,8,8];
    let step=0, tick=0, playing=!reduced.matches, visible=false;
    const play=root.querySelector('[data-play]');
    function render() {
      root.dataset.step=step;
      root.dataset.running=playing && visible && !document.hidden;
      root.dataset.tick=tick;
      root.dataset.detail=step===3 && tick>=2;
      root.dataset.intake=tick>=4?'on':tick>=2?'open':'settings';
      root.style.setProperty('--dw-progress',`${Math.min(100,tick/duration[step]*100)}%`);
      root.querySelector('[data-title]').textContent=titles[step];
      root.querySelector('[data-caption]').textContent=captions[step];
      root.querySelectorAll('[data-scene]').forEach(s=>s.hidden=Number(s.dataset.scene)!==step);
      root.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.step)===step)));
      root.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('selected',b.dataset.nav===['settings','mail','pipeline','mail','brain','brain'][step]));
      root.querySelector('[data-worker]').textContent=step===1||step===2?'run':'idle';
      root.querySelector('[data-screen-label]').textContent=['/settings → /mail-intake','/mail-queue','/pipeline','/mail-queue','/memory · '+t('Warten','Waiting'),'/memory · '+t('Monatsabgleich','Month end')][step];
      root.querySelector('[data-intake-status]').textContent=tick>=4?t('Aktiv','Active'):t('Pausiert','Paused');
      root.querySelector('[data-activate]').textContent=tick>=4?t('Pausieren','Pause'):t('Aktivieren','Activate');
      play.textContent=playing?t('Ⅱ Pause','Ⅱ Pause'):t('▶ Abspielen','▶ Play');
      play.setAttribute('aria-label',playing?t('Animation pausieren','Pause animation'):t('Animation abspielen','Play animation'));
      const current=Math.min(3,Math.floor(tick/2));
      root.querySelectorAll('[data-model]').forEach((m,i)=>{
        m.dataset.status=i===3?'conditional':i<current?'done':i===current?'active':'waiting';
        m.querySelector('.dw-model-status').textContent=i===3?t('BEI BEDARF','IF NEEDED'):i<current?t('FERTIG · 3/3','DONE · 3/3'):i===current?t('LÄUFT','RUNNING')+` · ${tick%2+1}/3`:t('WARTET','WAITING');
      });
      root.querySelector('[data-console]').textContent=current===3?t('3 Mails · Bewertungen vollständig','3 messages · assessments complete'):t('Stapel 01 · lokale Bewertung · ','Batch 01 · local assessment · ')+['GLM-4.7 Flash','Qwen 3.6','Qwen 3.8'][current];
    }
    function select(i,manual=false) { step=i; tick=manual?(i===0?4:(i===2||i===3)?3:0):0; if(manual)playing=false; render(); }
    root.querySelectorAll('[data-step],[data-goto]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.step??b.dataset.goto),true)));
    document.querySelectorAll('[data-workflow-step]').forEach(link=>link.addEventListener('click',()=>select(Number(link.dataset.workflowStep),true)));
    play.addEventListener('click',()=>{playing=!playing;if(playing&&step===5){step=0;tick=0;}render();});
    root.querySelector('[data-activate]').addEventListener('click',()=>{playing=false;tick=tick>=4?2:4;render();});
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;render();},{threshold:.15}).observe(root);
    reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;if(step===0)tick=4;}render();});
    document.addEventListener('visibilitychange',render);
    const timer=setInterval(()=>{if(!playing||!visible||document.hidden)return;tick++;if(tick>=duration[step]){if(step===5)playing=false;else {step++;tick=0;}}render();},1000);
    window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
    if(reduced.matches)tick=4;
    render();
  });
})();
