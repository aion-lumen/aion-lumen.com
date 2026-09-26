/* Progressive screenshot stories. With JavaScript disabled, cards link to the images. */
(() => {
  "use strict";
  const en = document.documentElement.lang === "en";
  const t = (de, eng) => (en ? eng : de);
  const cases = {
    invoice: {
      label: t("Rechnung", "Invoice"),
      title: t(
        "Eine Abrechnung. Nachvollziehbar eingeordnet.",
        "A statement. A visible reason for its classification.",
      ),
      summary: t(
        "Folio zeigt die Einordnung zusammen mit der Nachricht. Die Gründe der einzelnen Stimmen lassen sich aufklappen.",
        "Folio shows the classification alongside the message. Each assessment can be inspected.",
      ),
      facts: [
        t("48 EUR Guthaben angekündigt", "EUR 48 credit announced"),
        t("62 EUR neuer Monatsabschlag", "EUR 62 new monthly instalment"),
        t(
          "Ein Zahlungseingang ist noch nicht belegt.",
          "Receipt of payment is not yet evidenced.",
        ),
      ],
      steps: [
        {
          label: t("Mail & Einordnung", "Message & classification"),
          image: "invoice.png",
          caption: t(
            "Die Originalnachricht bleibt neben der Einordnung lesbar.",
            "The original message remains available alongside its classification.",
          ),
        },
        {
          label: t("Modellstimmen", "Assessments"),
          image: "invoice-voices.png",
          caption: t(
            "Vier vorbereitete Beispielstimmen, einzeln aufgeklappt. Kein neuer Modelltest.",
            "Four prepared example assessments, expanded individually. Not a new model test.",
          ),
        },
      ],
    },
    appointment: {
      label: t("Termin", "Appointment"),
      title: t(
        "Aus der Mail wird ein Vorschlag.",
        "A message becomes a proposal.",
      ),
      summary: t(
        "Datum, Uhrzeit und Ort stehen in der Mail. Die nächste Ansicht zeigt den vorbereiteten Termin vor der Freigabe.",
        "The message contains the date, time and place. The next view shows the prepared calendar entry before approval.",
      ),
      facts: [
        t("30. September · 10–11 Uhr", "30 September · 10–11 a.m."),
        t("Beispielstraße 12", "Beispielstraße 12"),
        t(
          "Erst die Freigabe legt den Termin an.",
          "Approval is required to create the event.",
        ),
      ],
      steps: [
        {
          label: t("Mail & Einordnung", "Message & classification"),
          image: "appointment.png",
          caption: t(
            "Der Fall bleibt offen, solange die Terminfreigabe fehlt.",
            "The case remains open while calendar approval is pending.",
          ),
        },
        {
          label: t("Terminfreigabe", "Calendar approval"),
          image: "calendar-approval.png",
          caption: t(
            "Die echte Freigabekomponente. Diese Aufnahme ist nicht bedienbar und legt keinen Termin an.",
            "The actual approval component. This screenshot cannot be operated and creates no event.",
          ),
        },
      ],
    },
    contract: {
      label: t("Vertrag", "Contract"),
      title: t(
        "Neue Konditionen. Deine Entscheidung.",
        "New terms. Your decision.",
      ),
      summary: t(
        "Eine korrekt erkannte Vertragsmail ist noch keine Zustimmung. Der offene Fall hält Preis und Laufzeit zur Prüfung bereit.",
        "Recognising a contract message does not mean accepting it. The open case presents price and duration for review.",
      ),
      facts: [
        t("39 statt 29 EUR monatlich", "EUR 39 instead of EUR 29 per month"),
        t("Zwölf Monate ab November", "Twelve months from November"),
        t(
          "Keine automatische Verlängerung durch Folio.",
          "Folio does not automatically renew the contract.",
        ),
      ],
      steps: [
        {
          label: t("Mail & Entscheidung", "Message & decision"),
          image: "contract.png",
          caption: t(
            "Die neuen Bedingungen im Mailtext; die Entscheidung bleibt offen.",
            "The new terms in the message; the decision remains open.",
          ),
        },
      ],
    },
  };
  const triggers = document.querySelectorAll("[data-case]");
  if (triggers.length) {
    const dialog = document.createElement("dialog");
    dialog.id = "case-dialog";
    dialog.setAttribute("aria-labelledby", "case-title");
    // Only fixed template markup; content below is assigned through textContent.
    dialog.innerHTML = `<div class="case-toolbar"><span class="case-eyebrow"></span><button type="button" class="close case-close">✕</button></div>
      <div class="case-layout"><div class="case-context"><nav class="case-nav"></nav><h2 id="case-title"></h2><p class="case-summary"></p><ul class="case-facts"></ul><p class="case-provenance"></p></div>
      <div class="case-view"><div class="case-steps"></div><p class="case-caption" aria-live="polite"></p><div class="case-image-scroll" tabindex="0"><button class="case-image-button" data-zoom=""><picture><source media="(max-width: 760px)"/><img alt=""/></picture><span class="case-zoom">↗</span></button></div><div class="case-bottom"><span></span><button type="button" class="case-next"></button></div></div></div>`;
    document.body.append(dialog);
    const q = (s) => dialog.querySelector(s);
    q(".case-eyebrow").textContent = t(
      "FOLIO / EINEN FALL ERKUNDEN",
      "FOLIO / EXPLORE A CASE",
    );
    q(".case-close").setAttribute(
      "aria-label",
      t("Beispiel schließen", "Close example"),
    );
    q(".case-nav").setAttribute(
      "aria-label",
      t("Beispielfall wählen", "Choose example case"),
    );
    q(".case-steps").setAttribute(
      "aria-label",
      t("Ansicht wählen", "Choose view"),
    );
    q(".case-image-scroll").setAttribute(
      "aria-label",
      t("Screenshot, bei Bedarf scrollen", "Screenshot, scroll as needed"),
    );
    q(".case-provenance").textContent = t(
      "Echte Folio-Oberfläche. Erfundenes Beispiel mit vorbereiteten Bewertungen; kein Nachweis eines neuen Modelllaufs.",
      "Actual Folio UI. Fictional example with prepared assessments, not evidence of a new model run.",
    );
    q(".case-bottom span").textContent = t(
      "Im Bild scrollen · zum Vergrößern anklicken",
      "Scroll the image · click to enlarge",
    );
    let current = "invoice",
      step = 0,
      trigger = null;
    function renderStep(i) {
      step = i;
      const c = cases[current],
        s = c.steps[step],
        img = q(".case-image-button img");
      q(".case-caption").textContent = s.caption;
      img.src = "/assets/cases/" + s.image;
      q(".case-image-button source").srcset =
        "/assets/cases/" + s.image.replace(".png", "-mobile.png");
      img.alt =
        c.label +
        " · " +
        s.label +
        t(
          " · echte Oberfläche mit Beispieldaten",
          " · real UI with fictional data",
        );
      q(".case-image-button").dataset.zoom = img.getAttribute("src");
      q(".case-image-button").dataset.caption = img.alt;
      q(".case-image-button").setAttribute(
        "aria-label",
        t("Aufnahme vergrößern: ", "Enlarge screenshot: ") + s.label,
      );
      q(".case-image-scroll").scrollTop = 0;
      q(".case-image-scroll").classList.toggle(
        "is-wide",
        s.image === "calendar-approval.png",
      );
      q(".case-steps")
        .querySelectorAll("button")
        .forEach((b, n) => b.setAttribute("aria-pressed", String(n === step)));
      const next = q(".case-next");
      next.hidden = step === c.steps.length - 1;
      next.textContent = next.hidden ? "" : c.steps[step + 1].label + " →";
    }
    function renderCase(key) {
      current = key;
      const c = cases[key];
      q("#case-title").textContent = c.title;
      q(".case-summary").textContent = c.summary;
      q(".case-facts").replaceChildren(
        ...c.facts.map((f) => {
          const li = document.createElement("li");
          li.textContent = f;
          return li;
        }),
      );
      q(".case-context").classList.toggle("is-decision", key === "contract");
      q(".case-nav")
        .querySelectorAll("button")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.selectCase === key)),
        );
      q(".case-steps").replaceChildren(
        ...c.steps.map((s, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = String(i + 1).padStart(2, "0") + " / " + s.label;
          b.addEventListener("click", () => renderStep(i));
          return b;
        }),
      );
      renderStep(0);
    }
    Object.entries(cases).forEach(([key, c]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c.label;
      b.dataset.selectCase = key;
      b.addEventListener("click", () => renderCase(key));
      q(".case-nav").append(b);
    });
    triggers.forEach((a) =>
      a.addEventListener("click", (e) => {
        if (
          e.ctrlKey ||
          e.metaKey ||
          e.shiftKey ||
          e.altKey ||
          !dialog.showModal
        )
          return;
        e.preventDefault();
        trigger = a;
        renderCase(a.dataset.case);
        dialog.showModal();
        document.body.style.overflow = "hidden";
      }),
    );
    q(".case-close").addEventListener("click", () => dialog.close());
    q(".case-next").addEventListener("click", () => {
      renderStep(step + 1);
      q('.case-steps [aria-pressed="true"]').focus();
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = "";
      trigger?.focus();
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          dialog.close();
      }
    });
  }
  document.querySelectorAll("[data-evidence-switch]").forEach((group) => {
    group.querySelectorAll("[data-evidence]").forEach((button) =>
      button.addEventListener("click", () => {
        group
          .querySelectorAll("[data-evidence]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        group.querySelectorAll("[data-evidence-panel]").forEach((panel) => {
          panel.hidden =
            panel.dataset.evidencePanel !== button.dataset.evidence;
        });
      }),
    );
  });
})();
