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
          image: "v0.6.0-preview.2/invoice.png",
          caption: t(
            "Die Originalnachricht bleibt neben der Einordnung lesbar.",
            "The original message remains available alongside its classification.",
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
        "Datum, Uhrzeit und Ort stehen in der Mail. Ein Termin wird erst nach Freigabe angelegt.",
        "The message contains the date, time and place. An event is created only after approval.",
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
          image: "v0.6.0-preview.2/appointment.png",
          caption: t(
            "Der Fall bleibt offen, solange die Terminfreigabe fehlt.",
            "The case remains open while calendar approval is pending.",
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
          image: "v0.6.0-preview.2/contract.png",
          caption: t(
            "Die neuen Bedingungen im Mailtext; die Entscheidung bleibt offen.",
            "The new terms in the message; the decision remains open.",
          ),
        },
      ],
    },
  };
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let openCase = null;
  document.querySelectorAll("[data-case]").forEach((link, index) => {
    const data = cases[link.dataset.case];
    if (!data) return;
    const card = document.createElement("article");
    card.className = link.className;
    link.className = "case-trigger";
    link.before(card);
    card.append(link);
    link.setAttribute("role", "button");
    link.setAttribute("aria-expanded", "false");
    const thumb = link.querySelector(".case-thumb");
    const img = thumb.querySelector("img");
    const panel = document.createElement("div");
    panel.className = "case-inline";
    panel.id = `case-inline-${index}`;
    panel.hidden = true;
    link.setAttribute("aria-controls", panel.id);
    panel.innerHTML = `<button type="button" class="case-inline-image"></button><p class="case-caption"></p>`;
    card.append(panel);
    const imageButton = panel.querySelector(".case-inline-image");
    imageButton.setAttribute(
      "aria-label",
      t("Bild wieder verkleinern", "Return image to thumbnail"),
    );
    let expanded = false;
    let animation;
    const originalSrc = img.getAttribute("src");
    function selectStep(i) {
      const step = data.steps[i];
      img.src = "/assets/cases/" + step.image;
      img.alt = data.label + " · " + step.label;
      panel.querySelector(".case-caption").textContent = step.caption;
    }
    function toggle(next = !expanded) {
      if (next === expanded) return;
      if (next && openCase) openCase(false);
      const from = img.getBoundingClientRect();
      animation?.cancel();
      thumb.style.overflow = "visible";
      expanded = next;
      card.classList.toggle("is-open", expanded);
      panel.hidden = !expanded;
      link.setAttribute("aria-expanded", String(expanded));
      thumb.setAttribute("aria-hidden", "true");
      if (expanded) {
        imageButton.append(img);
        selectStep(0);
        openCase = toggle;
      } else {
        thumb.append(img);
        img.src = originalSrc;
        img.alt = "";
        openCase = null;
      }
      const to = img.getBoundingClientRect();
      if (!motion.matches && to.width && to.height) {
        animation = img.animate(
          [
            {
              transformOrigin: "top left",
              transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
            },
            { transformOrigin: "top left", transform: "none" },
          ],
          { duration: 500, easing: "cubic-bezier(.22,.7,.2,1)" },
        );
        animation.onfinish = () => {
          thumb.style.overflow = "";
        };
      } else thumb.style.overflow = "";
    }
    link.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      toggle();
    });
    link.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
    imageButton.addEventListener("click", () => {
      toggle(false);
      link.focus({ preventScroll: true });
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && expanded) {
        toggle(false);
        link.focus({ preventScroll: true });
      }
    });
  });
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
