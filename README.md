# Aion Lumen

Software that makes AI useful in everyday life. [aion-lumen.ch](https://aion-lumen.ch)

Folio starts with mail. The site shows how messages connect to appointments,
recurring costs and source-backed knowledge. The lab documents local model
experiments; the blog tells the story behind the tools.

## Pages

| Route                 | Content                                              |
| --------------------- | ---------------------------------------------------- |
| `/`                   | The AI wave, Folio and the workshop                  |
| `/folio/`             | Visual product tour, with mail first                 |
| `/multi-agent/`       | Model catalog and configured daily roles             |
| `/multi-agent/tests/` | Bounded report on recorded synthetic tests           |
| `/blog/`              | Workshop notes                                       |
| `/blog/surfbrett/`    | First article: building a tool for everyday life     |
| `/story/`             | Original illustrated history, retained as an archive |
| `/the-long-table/`    | Original session entries, unchanged                  |
| `/folio/import-spec/` | Rendered canonical import format                     |
| `/impressum/`         | Legal notice and privacy information                 |

Every page has an English version at `en.html` in the same directory. The header
links to the equivalent page. All routes share local fonts, blue design tokens,
light/dark display settings, keyboard navigation and a native image viewer.
The original Beacon is unchanged.

The home page opens with a scroll-led 3D surf scene: a breaking wave and a board
that separates into knowledge, local models, and rules/tools. The scene has a
pause control and a direct link to the mail examples. Reduced-motion settings
start with a static view; a poster remains available without WebGL or JavaScript.
Three.js is served locally; see [assets/surf/README.md](assets/surf/README.md).

## Run locally

No framework or build step is required. From the repository root:

```sh
python3 -m http.server 4200 --bind 127.0.0.1
```

Open `http://127.0.0.1:4200/`. Serve the root directory: page links are root-relative.
Do not open individual pages as `file://` URLs.

```sh
python3 scripts/check-site.py
```

This checks the published route set, local images/scripts/styles, internal links
and static anchors. Browser checks should also cover mobile navigation, the
image viewer, dark mode, the import reference and the Long Table reading pane.

## Content and evidence

- Mail remains the central product demonstration; Ledger is an addition.
- Product screenshots use fictional examples. Historical screenshots are dated.
- Memory's core is in `v0.6.0-preview.1`; the spatial graph shown on the site is
  a development preview and is labelled separately.
- The twelve-model catalog spans multiple experiments, not one shared benchmark.
- Public test figures use synthetic data only. The report distinguishes recorded
  model inference, re-scoring a corrected reference label, and deterministic tests.
- Machine-readable aggregates: `multi-agent/results-2026-09.json`.
- Asset descriptions: [assets/wave/README.md](assets/wave/README.md).

The public site contains no private mail, account statements or local runtime
configuration. Fonts and images are served from this site. See the legal notice
for server-side access-log handling.

## Deploy

The existing GitHub workflow deploys pushes to `main` (or a manual dispatch).
It first refreshes `folio/import-spec.md` from the canonical Folio repository,
then copies only the explicit public route/asset whitelist. It does not use
`--delete`. A local preview or a feature branch does not deploy the site.

## License

The code in this repository is released under the MIT License. Brand identity,
copy and visual design remain copyright of the author. Existing font licenses
and image credits continue to apply.
