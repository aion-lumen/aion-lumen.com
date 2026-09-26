#!/usr/bin/env python3
"""Dependency-free checks for the public static route set."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ['', 'folio', 'multi-agent', 'multi-agent/tests', 'blog',
          'blog/surfbrett', 'story', 'the-long-table', 'impressum', 'folio/import-spec']
PAGES = [ROOT / route / name for route in ROUTES for name in ['index.html', 'en.html']]

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs, self.ids, self.duplicates, self.h1, self.no_alt = [], set(), [], 0, []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids: self.duplicates.append(a['id'])
            self.ids.add(a['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'img' and 'alt' not in a: self.no_alt.append(a.get('src'))
        key = 'href' if tag in ('a', 'link') else 'src' if tag in ('img', 'script') else None
        if key and a.get(key): self.refs.append(a[key])

def resolve(current, ref):
    path = unquote(urlsplit(ref).path)
    file = (ROOT / path.lstrip('/')) if path.startswith('/') else current.parent / path
    if not path: file = current
    if file.is_dir(): file /= 'index.html'
    return file.resolve()

errors, parsed = [], {}
for p in PAGES:
    if not p.is_file(): errors.append(f'Missing page: {p.relative_to(ROOT)}'); continue
    parsed[p.resolve()] = Page(p.read_text())
for p, page in parsed.items():
    label = p.relative_to(ROOT)
    if page.h1 != 1: errors.append(f'{label}: expected one h1, got {page.h1}')
    if page.duplicates: errors.append(f'{label}: duplicate ids {page.duplicates}')
    if page.no_alt: errors.append(f'{label}: images without alt {page.no_alt}')
    for ref in page.refs:
        u = urlsplit(ref)
        if u.scheme or u.netloc: continue
        dest = resolve(p, ref)
        if not dest.is_relative_to(ROOT): errors.append(f'{label}: escaping root {ref}'); continue
        if not dest.is_file(): errors.append(f'{label}: missing {ref}'); continue
        if u.fragment and dest in parsed and unquote(u.fragment) not in parsed[dest].ids:
            errors.append(f'{label}: missing anchor {ref}')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print(f'PASS: {len(PAGES)} public pages, local references, static anchors, headings and image labels.')
