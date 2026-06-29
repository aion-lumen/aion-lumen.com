# Field-Note: Brand-Site-Aufbau (Folio + Multi-Agent + Story + Long Table) — 2026-06-29

**Direktive:** `direktive-brand-site-aufbau-2026-06-28.md`. **Kein Push/Deploy**
(rsync VPS = Afshin).

## Struktur (Ziel erreicht)
```
aion-lumen (DE/EN, light/dark — global via controls.js / localStorage al.*)
├─ /index.html          philosophische Landing (unberührt)
├─ /folio/index.html    Folio-Auftritt + NEU: Multi-Agent-Sektion + Story-Link
│     └─ Lumen-Spark → /the-long-table/   (Eingang 2, unverändert)
├─ /story/  (NEU)        10-Szenen-Bildgeschichte + Video-Slot
└─ /the-long-table/      (unberührt, nur Anbindung geprüft)
```
Zielseite für Folio-Lead + Multi-Agent + Story-Link ist **`/folio/index.html`**
(dort liegen Folio-Hero, echte Screenshots und der Spark) — bestätigt mit Afshin.

## Was gebaut wurde
- **`/story/index.html` (neu):** erbt Site-Theme/Sprache (head-Muster wie
  the-long-table: `../styles/base.css?v=2` + `controls.js` + `tweaks.js` + Topbar mit
  `data-tb`-Toggles). Einleitung DE/EN (wörtlich). **10 Szenen** in Erzähl-Reihenfolge,
  groß/ruhig gestapelt (kein Thumbnail-Raster). An Szene 5 ein `<details>`-Aufklapp
  „Die Zutaten ansehen →" mit den drei Konzept-Karten (5a/b/c) — optionale Vertiefung,
  Erzählfluss bleibt.
- **`/folio/index.html`:** (a) Folio-Lead-Text (Hero) auf den Direktivtext gesetzt
  (privacy-forward); (b) neue **Multi-Agent-Sektion** nach „Status", vor „CTA", Text
  wörtlich (selbstbewusst, 200+ Mail-Durchläufe); (c) dezenter **Story-Link**
  „Die Geschichte hinter Folio →" in der CTA.
- **Bilder:** `~/Projects/folio/fotos/` → `story/img/` als **JPEG q85** (kein
  webp/Converter vorhanden; Szenen sind Illustrationen → JPEG ideal): je ~2 MB PNG →
  ~370–740 KB, gesamt 6,5 MB statt ~26 MB. Alle `loading="lazy"`. Finale Auswahl:
  1, 2b, 3, 4, 5, 6folio, 7, 8, 9folio, 10folio (+ 5a/b/c als Zutaten).

## Video-Slot-Mechanik (wie das Video später rein kommt)
In `/story/index.html` sitzt nach der Einleitung ein `.story-video`-Block mit
Platzhalter („Video folgt"/„Video coming", **kein** Fake-Player) und direkt darüber
ein HTML-Kommentar mit der genauen Einfüge-Anweisung. **Einfügen später = 1 Edit:**
den `.story-video`-Block ersetzen durch z.B.
`<div class="story-video"><video src="img/folio-explainer.mp4" controls playsinline preload="metadata"></video></div>`
(Video-Datei lokal nach `story/img/`, damit 0 externe Calls bleibt — kein YouTube/Vimeo-Embed).

## Verifikation (headless, lokal serviert)
- **0 externe Requests** über `/folio/`, `/story/`, `/the-long-table/` (kein
  googleapis/gstatic/CDN) — Privacy-Linie gehalten; 28 Bild-Requests alle lokal.
- DE/EN-Umschaltung + light/dark wirken auf der neuen Story-Seite (Toggle →
  `data-lang=de`, `data-theme=light`).
- Beide Eingänge vorhanden: Story-Link (`a[href="/story/"]`) + Spark
  (`a.lumen-spark[href="/the-long-table/"]`); Multi-Agent-Sektion present.
- Long Table unverändert erreichbar; self-hosted Fonts intakt.

## Offen / Anschluss
- Video später in den Slot (1 Edit, lokal).
- Deploy (rsync → /srv/aion-lumen) = Afshins Part.
- Eine Multi-Agent-„open to inspect"-Verlinkung (Repo-URL) wurde NICHT ergänzt
  (keine URL in der Direktive; Text wörtlich gehalten) — bei Bedarf nachrüsten.

---

## EN (brief)
Built the deployable brand site per directive. New `/story/` page: a 10-scene picture
story (narrative order) that inherits the site's DE/EN + light/dark via the shared
`controls.js`; scene 5 has an optional `<details>` "see the ingredients" with the three
concept cards; a video slot sits after the intro as a placeholder (no fake player) with
an HTML comment so dropping the real local video in later is a one-line edit. On
`/folio/index.html`: the Folio hero lead now uses the directive's privacy-forward copy, a
new **Multi-Agent** section (verbatim, confident, 200+ mail runs) sits before the CTA, and
a quiet **"The story behind Folio →"** link lives in the CTA. Scene images came from
`~/Projects/folio/fotos`, converted to JPEG q85 (no webp tool; illustrations suit JPEG):
~26 MB of PNG → 6.5 MB, all lazy-loaded, local. Verified headless: **0 external requests**
across folio/story/long-table, DE/EN + theme toggles work on the new page, both entrances
present, Long Table untouched. Remaining: drop the real video into the slot; deploy (rsync,
Afshin's part). No push/deploy.
