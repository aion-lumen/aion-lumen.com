# Remote-Setup für aion-lumen.com

## Auf GitHub (manuell)

1. Gehe zu https://github.com/organizations/aion-lumen/repositories/new
2. Repository name: `aion-lumen.com`
3. Description: `Brand site for Aion Lumen — local-first tools at human timescales.`
4. Privacy: Private (empfohlen für Brand-Site, kann später Public)
5. **Nicht** "Initialize with README" / "Add .gitignore" / "Choose license" anhaken
6. Create repository

## Lokal in WSL

```bash
cd ~/Projects/aion-lumen/aion-lumen.com

git remote add origin git@github.com:aion-lumen/aion-lumen.com.git
git remote -v

git push -u origin main
```

Falls SSH-Auth nicht konfiguriert ist, HTTPS verwenden:

```bash
git remote add origin https://github.com/aion-lumen/aion-lumen.com.git
```

## Nach dem Push

GitHub-Repo-Metadaten setzen (Settings → General):
- Description: `Brand site for Aion Lumen — local-first tools at human timescales.`
- Website: `https://aion-lumen.ch`
- Topics: `local-first`, `static-site`, `brand-site`, `caddy`
