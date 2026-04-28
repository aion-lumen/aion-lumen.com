# Aion Lumen · Design-Reasoning

**Stand:** v0.1 · April 2026
**Lieferung:** zwei Hauptseiten-Konzepte (A zentriert, B asymmetrisch) + Folio-Subseite + Tweaks + DE/EN-Toggle

---

## Folder-Struktur

```
aion-lumen/
├── index.html              # Hauptseite, Konzept A — zentriert, klassisch
├── index-b.html            # Hauptseite, Konzept B — asymmetrisch, Editorial
├── folio/
│   └── index.html          # Folio-Subseite, atmosphärisch dunkel
├── styles/
│   ├── base.css            # Tokens, Typo, Topbar, Reveal, Paper-Texture
│   ├── controls.js         # Theme/Lang/Accent/Hand · Email-Reveal · Reveal-Observer
│   └── tweaks.js           # Tweaks-Panel (Hero-Variante, Caveat, Texturgrad)
└── assets/
    └── folio-01..05.png    # Screenshots aus aion-lumen/life-dashboard
```

Hosting auf Infomaniak-VPS: `aion-lumen.ch` → `index.html` (Default = Konzept A), `aion-lumen.ch/folio/` → Folio. Konzept B liegt als zweite Variante daneben (Link unten links jeder Seite); pick eines, lösch das andere — oder hosting beider unter `/v2`. Kein Build-Step nötig, alles statisch.

---

## Welche Entscheidungen — und warum

### 1. Zwei deutlich unterschiedliche Hauptseiten-Richtungen
Du wolltest *zwei* Konzepte, nicht zehn Mikro-Varianten. Beide tragen denselben Inhalt aber gehorchen unterschiedlicher Layout-DNA — damit du eine echte Wahl hast, kein "A oder A mit anderem Akzent".

- **Konzept A — *zentriert / klassisch*.** Beacon-Symbol oben mittig, große mehrzeilige Headline, alle Sections folgen einem ruhigen Mittelraster. Asymmetrie kommt nur über handgeschriebene Margin-Notes ins Bild. Wer zum ersten Mal landet liest *vertikal* nach unten wie ein Manifest.
- **Konzept B — *asymmetrisch / Editorial-Plate*.** Linksbündige Headline mit Treppenversatz, vertikale Mono-Schriftleiste am Bildrand ("Aion Lumen · Basel · MMXXVI"), 12-Spalten-Manifest mit lopsided § — eine Spalte trägt die §-Nummer, eine andere den Marginalien-Balken, eine dritte die Lesezeit. Folio kommt als breite "Plate I" mit Editorial-Beschriftung. Wer hier landet *blickt*, statt zu lesen — die Tafeln führen das Auge.

Beide sind echt fehlertolerant: kein zentrales Splash, kein Hero-Image rechts vom Text, keine animierte Roboterspirale.

### 2. Asymmetrie eingebaut — nicht aufgesetzt
Du hast explizit gesagt "*kein Bootstrap-Template-Gefühl*". Beide Seiten haben Stellen die *anders* gewichtet sind als die Nachbar-Sections:

- **Konzept A** — Beacon klebt knapp links der Mitte. Manifesto hat einen 180px-Rand mit Sticky-Label statt symmetrischem Container. Folio-Karte ist 1.1fr/1fr (nicht 1/1). Hand-Margin-Notes brechen die Achse pro Section an unterschiedlichen Stellen.
- **Konzept B** — Manifesto springt zwischen zwei und drei Spalten. Die Folio-Plate ist 8/12 Bild + 4/12 Text. Die Coda-Zeile ist 8/12 + 2/12-Marginalie. Nichts ist auf 6/6 oder 4/4/4.

### 3. Frostpunk/Walden-Vokabular *implizit*
Begriffe wie *Beacon · Hearth · Plate · Campaign · Acts · Quiet construction · The fire is already lit* tauchen genau dann auf wenn sie etwas tun — Hero-Symbol, Folio-Karte, Tool-II-Andeutung, Folio-CTA. Sie sind nirgends als Listen-Behauptung ("our values"). Kein Frostpunk-Logo, keine Schneeflocken, keine Generator-Visualisierung — die Sprache trägt das Modell.

### 4. Tool-II-Andeutung (deine Frage)
Statt "Coming soon: X, Y, Z" gibt es genau **eine** dezente Zeile *unter* der Folio-Karte:
- Konzept A: gestricheltes Rechteck, "02 · Tool II — In quiet construction. The hearth keeps more than one fire."
- Konzept B: gestrichelter Footer der Plate, "Plate II · in quiet construction" rechts.
Plus die Folio-Karte selbst trägt "01" / "Plate I" / "Volume I, Index 00" — der Index-Charakter signalisiert dass mehr kommen wird, ohne es vorlaut anzukündigen.

### 5. Folio-Subseite — "abends mit Kamin"
Forciert dunkel via `data-folio-locked="dark"` (auch wenn du die Hauptseite auf Light hast). Hintergrund hat zwei radiale Glanzlichter (Gold oben, Brown unten links) — der "Hearth"-Effekt ohne plumpes Feuer-SVG. Folio-Wortmarke ist 16vw groß (text-shadow als Gold-Glow), darunter eine handschriftliche Caption "*a desk lit late.*" am Plattenrand. Die fünf Akte als Ledger-Tabelle mit aktivem Akt I = Goldgradient. Drei Galerie-Tafeln (Timeline, Kanban, Hermes-Chat) mit "Pl. II/III/IV"-Bildunterschriften. CTA-Section hat einen radialen Gold-Glow im Hintergrund.

### 6. Sprache — DE/EN gleichberechtigt mit Toggle
Beide Sprachen sind als parallele `.en`/`.de` Spans hinterlegt; CSS schaltet via `[data-lang]`-Attribut. Default = Browser-Locale, persistiert in localStorage. Englisch ist die "Marketing"-Sprache (Tagline, Manifesto), Deutsch ist die "Werkstatt"-Sprache mit etwas mehr Erdung. Beide sind native, keine Maschinenübersetzung. Im Topbar-Switcher: `EN · DE`.

### 7. Caveat-Schrift — *2-3 dezente Anker*
Genau so dosiert wie du gesagt hast. Pro Seite ~3 Stellen:
- Hauptseite: Margin-Note neben dem Hero, vier kleine Glyphen (∗ ⁂ ⌘ †) in der Principles-Grid, Signature im Footer ("— afm.")
- Folio: Caption unter der Plate, Hearth-Mark im Footer
Sichtbarkeit über Tweaks-Panel umstellbar: **on / muted (40%) / off**.

### 8. Texturgrad — Slider 0–10
`base.css` hat eine Fixed-Position-SVG-Noise-Schicht; `--tex-opacity` regelt sie 0–0.10. Default 4 (entspricht deiner Slider-Antwort). 0 = clean Schweizer Druck, 10 = altes Papier. Im Light-Mode `multiply`, im Dark `screen`.

### 9. Akzentfarbe — Gold ↔ Olive
Globaler Toggle in der Topbar. Gold = Wärme/Hoffnung (Default), Olive = Wachstum/Ruhe. Wechsel ist live in 200ms überall (Beacon, Folio-Karte, Pulse-Dot, Selection, Footer-Links).

### 10. Email-Schutz
`hi@aion-lumen.ch` ist im DOM **nirgends** als Klartext. `controls.js` baut die Adresse client-seitig aus einem Array (`['hi','[at]','aion-lumen','[dot]','ch']`), öffnet `mailto:` erst beim Klick. UI: zuerst "click to reveal" / "klick zum Anzeigen", nach dem ersten Klick die echte Adresse, zweiter Klick öffnet das Mail-Programm. Kein Plaintext-Mailto, keine Direkt-Email-Pattern, die ein Regex-Scraper findet.

### 11. Tweaks-Panel
Erscheint wenn der Host-Toggle "Tweaks" gedrückt wird (Bottom-right). Enthält die drei Knobs die nicht in die feste Topbar passten: **Hero-Variante I-IV** (Konzept A), **Hand-Script** (on/muted/off), **Paper-Texture** (Slider 0-10). Die in der Topbar erreichbaren Toggles (Theme/Accent/Lang) sind bewusst dort und nicht doppelt — Topbar = jederzeit, Tweaks = nur wenn du ausdrücklich tweakst.

---

## Wo ich Risiken sehe

1. **Konzept B kann zu "magazinig" wirken** wenn man kein Auge für Editorial hat. Die §-Nummern und römischen Ziffern sind schick, aber sie funktionieren nur wenn der Inhalt *liest* wie ein Heft. Falls dir das zu prätentiös ist: Konzept A ist die sichere Wahl.
2. **Folio-Hero-Wortmarke ist 16vw groß** — auf einem 27"-Monitor ist das ein Statement. Auf einem 13"-Laptop skaliert es nach unten, aber wenn dir das zu schreierisch ist, sag Bescheid; reduzierter Range wäre `clamp(72px, 12vw, 180px)`.
3. **Frostpunk-Vokabular ist sparsam** — ich habe an genau 4 Stellen "hearth/fire/quiet construction" reingestreut. Du könntest finden das ist *zu* sparsam ("warum nennt sich das eigentlich Aion Lumen") oder *gerade richtig* (Substanz, nicht Pose). Sag mir ob du an 1-2 Stellen mehr willst.
4. **DE-Übersetzung ist mein Vorschlag**, nicht dein Original. Lies dir die Manifesto-Absätze auf DE durch — wenn ein Satz schief klingt, sag Bescheid, das wechseln wir.
5. **Hand-Margin-Notes auf Konzept A** sind absichtlich am rechten Rand des Heros — auf sehr breiten Screens (>1600px) hängen sie weit weg von der Headline. Falls dich das stört, lassen sie sich an die Container-Kante koppeln.

---

## Mobile (<600px)

- **Topbar** wraped: Mark-Logo bleibt links, Toggle-Pills rutschen in zweite Zeile. Akzent-Switcher kann optional weg, falls zu eng.
- **Konzept A Hero** — Beacon schrumpft auf 44px, Margin-Notes verschwinden komplett (display: none), Title bleibt zentriert, Tagline volle Breite.
- **Konzept B Hero** — Treppen-Headline wird linksbündig mit `padding-left: 0`, Mono-Rail (vertikale Schriftleiste) verschwindet ab 880px.
- **Manifesto** — Sticky-Label wird inline-Header über dem Body, kein 2-Spalten-Grid mehr.
- **Folio-Karte (Hauptseite)** — Bild stapelt unter Text. Folio-Subseite-Plate behält ihr 16:9.5 (das Bild zeigt sich gut auf Mobile), Caption umbricht.
- **Principles-Grid** — von 2×2 zu 1-Spalten-Liste.
- **Footer** — von 4 Spalten zu 2 (B) / 1 (A).
- **Tweaks-Panel** — bleibt 280px breit, klebt an bottom-right; auf <340px Geräten würde ich ihn auf `width: calc(100vw - 32px)` setzen.

Alle Hand-Notes verschwinden auf <720px — die werden auf kleinen Screens schnell zu Lärm.

---

## Was du tun solltest, falls die erste Iteration nicht trifft

| Wenn dir... | Sag... |
|---|---|
| Konzept A zu zahm wirkt | "B als Default" |
| Konzept B zu artsy wirkt | "A als Default, B löschen" |
| Folio zu dunkel wirkt | "Folio Hintergrund auf bg-warm statt #08070B" |
| Caveat zu viel ist | "Hand off als Default" (oder Tweak nutzen) |
| Tagline anders klingen soll | mir die exakte Zeile geben — ich tausche sie an einer Stelle (`hero-title` oder `hero-tagline`) |
| Mehr Frostpunk-Sprache | "Wo soll ich noch *hearth/fire/beacon* einbauen — gib 2-3 Stellen vor" |
| DE-Satz schief | mir den Absatz nennen — ich nehme deine Formulierung 1:1 |

---

## Was als nächstes Sinn ergibt

1. **Du wählst A oder B** als Default. Lösch das andere oder behalt es als `/alt`.
2. **OG-Image bauen** — eine 1200×630 Tafel mit Wortmarke + Tagline für Twitter/LinkedIn-Preview.
3. **Favicon-Set** — das Beacon-Symbol als 32/180/512px PNG + ICO.
4. **`og:` und `twitter:` Meta-Tags** — gerne, sobald wir wissen welches OG-Image gilt.
5. **Folio-Subseite-Screenshot ersetzen** sobald v0.2 (Frostpunk-View) live ist — der Mood passt dann noch besser.

— afm.
