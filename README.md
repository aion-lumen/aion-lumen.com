# aion-lumen.ch

The brand site for [Aion Lumen](https://aion-lumen.ch) — local-first tools
at human timescales.

A static site, hand-built. Two pages:

- `/` — the manifesto
- `/folio/` — the first tool, [Folio](https://github.com/aion-lumen/folio)

## Stack

Plain HTML, CSS, vanilla JavaScript. No build step, no framework.
Served statically by Caddy on a small VPS.

## Deploy

```bash
rsync -avz --delete \
  ./ aion-lumen-vps:/srv/aion-lumen/ \
  --exclude '.git' --exclude 'notes' --exclude '.DS_Store' \
  --exclude 'deploy-report-*.md' --exclude 'CLAUDE.md' --exclude '.cursor'
```

TLS via Caddy + Let's Encrypt. No CDN, no analytics, no tracking.

## License

The code in this repository is released under the MIT License.
The brand identity, copy, and visual design (Aion Lumen) remain
copyright of the author.

— afm.
