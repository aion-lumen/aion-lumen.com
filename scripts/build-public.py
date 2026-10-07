#!/usr/bin/env python3
"""Build only referenced public pages and their local dependencies."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
import hashlib,json,re,shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'site-dist'
ROUTES=['','folio','multi-agent','multi-agent/tests','blog','blog/surfbrett','blog/ai-surfen','blog/lokale-modelle-2026-10','story','the-long-table','impressum','folio/import-spec']
queue=[ROOT/route/name for route in ROUTES for name in ['index.html','en.html']]
queue += [ROOT/'favicon.svg',ROOT/'folio/import-spec.md']
# Licences and provenance belong to the assets they cover, not internal READMEs.
queue += [p for folder in ['assets','styles'] for p in (ROOT/folder).rglob('*') if p.is_file() and ('license' in p.name.lower() or 'cc0' in p.name.lower() or p.name=='character-sources.json')]
seen=set()
while queue:
 p=queue.pop().resolve()
 if p in seen:continue
 if not p.is_relative_to(ROOT) or not p.is_file():raise SystemExit('Missing public dependency: '+str(p))
 seen.add(p)
 if p.suffix not in ['.html','.css','.js','.mjs','.svg']:continue
 text=p.read_text()
 refs=re.findall(r'''(?:src|href|data-src|data-zoom)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^\s)'";]+)|["'`]((?:\.{1,2}/|/)(?:assets|styles|folio|multi-agent)[^"'`\s<>]*)["'`]|(?:from\s*|import\s*)["'](\.[^"']+)["']''',text)
 refs += [(ref,) for ref in re.findall(r'content=["\']((?:https://aion-lumen.ch)?/assets/[^"\']+)["\']',text)]
 for group in refs:
  ref=next(x for x in group if x).replace('https://aion-lumen.ch/','/').split('?')[0].split('#')[0]
  if not ref or ref.startswith(('data:','http:','https:','mailto:','//')) or '$' in ref:continue
  u=urlsplit(ref)
  if u.scheme:continue
  target=(ROOT/ref.lstrip('/')) if ref.startswith('/') else p.parent/ref
  if target.is_dir():
   if not (target/'index.html').is_file():continue
   target=target/'index.html'
  queue.append(target)
# Rebuild this generated output only; source assets are never removed.
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
manifest=[]
for p in sorted(seen):
 rel=p.relative_to(ROOT);dest=OUT/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
 manifest.append({'file':str(rel),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ROOT/'public-files.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'{len(manifest)} public files staged; '+str(sum(x['bytes'] for x in manifest))+' bytes')
