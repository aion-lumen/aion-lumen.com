# Surf scene

The German and English home pages share `styles/surf.js`, `styles/surf-wave.js`
and `styles/surf.css`. Water, board and birds are built in code. The character
is a locally served, rigged GLB with a baked balance animation. No external
model service, film clip or remote texture is requested at runtime.

The three board layers illustrate a principle, not a live model execution:
sources and knowledge, local models, and tools with defined limits. Native
scrolling opens and closes the same board. Pointer movement adds a small
perspective change. Pause, keyboard navigation, a direct content link and a
reduced-motion alternative are available. Rendering stops when the scene is
offscreen or the tab is hidden; pixel density is capped.

Below the hero, `continuum.svg` and three soft fragments of `wave-detail.webp`
carry the same water landscape through the content. The WebP is rendered from
the actual hero wave. `styles/journey.css` and `styles/journey.js` add restrained,
one-time reveals without another render loop. The animation control also
disables these transitions. Reduced-motion settings and keyboard focus are
respected; content remains visible without JavaScript.

## Character source and rebuild

`surfer.glb` uses MakeHuman's CC0 base topology, body morphs, rig and anatomical
weights, with custom wetsuit colouring, fitted hair, eye surfaces, surf pose
and balance animation. The generated concept image is a design reference,
not a texture projected onto a flat figure. Source revision and file hashes
are recorded in `character-sources.json`; see `MAKEHUMAN-CC0.txt`.

Download the manifest's source assets into a directory and verify their hashes.
With Blender 4.5 LTS, rebuild using:

```sh
blender --background --factory-startup --python scripts/build-surfer.py -- \
  --sources /path/to/source-assets --workdir /path/to/build-output \
  --output assets/surf/surfer.glb
```

The build directory receives the editable Blender file and a studio preview.
Only the figure is exported; studio lights, camera and IK controls are omitted.
Anatomical limbs are solved as two rigid segments. Split/twist bones follow
their segment instead of acting as extra knee or elbow joints. The build
checks forward knee flexion and reachable targets at each animation sample;
fixed ankle poses preserve foot contact. The Blender preview uses the same
linear skinning as the browser.

## Dependency

`three.module.min.js`, `three.core.min.js`, `GLTFLoader.js`,
`BufferGeometryUtils.js` and `SkeletonUtils.js` are Three.js 0.185.1 modules,
distributed under the MIT license in `THREE-LICENSE.txt`. They are loaded from
this site, with no CDN request. Add-on import paths point to these local files.
The scene requires a WebGL-capable browser for
animation; the rest of the site does not.

When rebuilding the candidate asset, the build script refreshes both the model
URL and the home-page scene-script URLs with their content hashes. This prevents
a browser from mixing a new page with a cached pose. Exports elsewhere leave
the website unchanged.
