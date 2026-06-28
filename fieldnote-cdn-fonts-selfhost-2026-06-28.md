# Field-Note: Bestandsfonts self-hosten (CDN-Privacy-Blocker) — 2026-06-28

**Direktive:** `direktive-cdn-fonts-selfhost-2026-06-28.md`. Letzter Demo-
Distributions-Blocker. **Kein Push/Deploy** (rsync VPS = Afshin).

## Problem
Die vier Bestandsfonts luden per **Google-Fonts-CDN** (`@import` in
`styles/base.css`) → jede Besucher-IP ging an Google. Direkter Widerspruch zur
local-first-/Privacy-Positionierung; das Zielpublikum (Anwälte/Ärzte/Fiduziare)
sieht den Google-Call im Network-Tab sofort.

## Fix
Die vier Fonts **self-hosten** (analog zur bereits lokalen Spectral) — gleiche
Fonts, nur lokal, **0 externe Font-Calls**.
- `@import` von `fonts.googleapis.com` in `styles/base.css` entfernt; 8
  `@font-face`-Regeln (lokal, `font-display: swap`) ergänzt.
- woff2 in `styles/fonts/` (Quelle: **Fontsource**, latin-Subset, exakt die
  Namenskonvention der vorhandenen Spectral-Dateien).
- **Nur die tatsächlich genutzten Schnitte** (nicht die ganze Familie):

| Font | Rolle (`--var`) | Gewichte | bewusst weggelassen |
|---|---|---|---|
| Epilogue | display | 400, 500, 600 | **700** (keine `font-weight:700`-Regel; nur in den Konzept-Drafts, die `base.css` nicht laden) |
| DM Sans | body | 400, 500 | 600 (`strong` wird wie bisher synthetisiert — Parität) |
| JetBrains Mono | mono | 400, 500 | — |
| Caveat | hand | 400 | **500** (`.hand` nutzt nur 400) |

Keine Italics für die vier (heute lädt der @import keine; `em/i` synthetisieren →
Parität). Nur Spectral hat italic, unberührt. = **8 woff2**.

## Lizenzen (alle SIL Open Font License, self-hosting erlaubt)
- Epilogue — OFL
- DM Sans — OFL
- JetBrains Mono — OFL
- Caveat — OFL
(wie Spectral, ebenfalls OFL)

## Verifikation
- **Netzwerk (entscheidend):** Site lokal serviert, alle drei realen Seiten
  (index, the-long-table, folio) headless geladen (playwright, `networkidle`) →
  **0 externe Requests** (kein `fonts.googleapis.com` / `fonts.gstatic.com` /
  sonstiger Font-/CDN-Host). Die woff2 laden ausschließlich lokal.
- **Vollständiger Privacy-Scan:** `base.css:6` war der **einzige** auto-ladende
  externe Call der Site — kein gstatic/preconnect/zweiter CDN/Icon-Font. Übrige
  externe URLs sind nur `href`-Navigationslinks (github, mirhamed.ch).
- **Parität:** gleiche vier Fonts, gleiche genutzten Gewichte → visuell
  unverändert (hell + dunkel). Long-Table (Spectral) unberührt.

---

## EN (brief)
The four brand fonts loaded from the **Google Fonts CDN** (`@import` in
`styles/base.css`), leaking every visitor's IP to Google — at odds with the
local-first/privacy positioning. Fix: **self-host** them like the existing
Spectral — removed the `@import`, added 8 local `@font-face` rules
(`font-display: swap`), woff2 in `styles/fonts/` from **Fontsource** (latin
subset, same naming as Spectral). Only the weights actually used are embedded:
Epilogue 400/500/600 (700 dropped — unused, only in non-base.css concept drafts),
DM Sans 400/500, JetBrains Mono 400/500, Caveat 400 (500 dropped). No italics for
the four (parity with today's synthesis); Spectral italic untouched. All four are
SIL **OFL** (self-hosting permitted). Verified the decisive way: served locally,
loaded all three real pages headless (playwright) → **0 external requests** (no
googleapis/gstatic). `base.css` was the site's only auto-loading external call;
nothing else (no analytics/icon-CDN). Same fonts/weights → visually unchanged.
**No push/deploy** — the rsync-to-VPS deploy stays Afshin's step.
