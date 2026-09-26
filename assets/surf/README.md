# Surf scene

The German and English home pages share `styles/surf.js`, `styles/surf-wave.js`
and `styles/surf.css`. The geometry, water shaders, character and birds are built
in code. No third-party character model, film clip or remote texture is used.
The existing wave illustration provides the static fallback.

The three board layers illustrate a principle, not a live model execution:
sources and knowledge, local models, and tools with defined limits. Native
scrolling opens and closes the same board. Pointer movement adds a small
perspective change. Pause, keyboard navigation, a direct content link and a
reduced-motion alternative are available. Rendering stops when the scene is
offscreen or the tab is hidden; pixel density is capped.

Below the hero, `continuum.svg` carries the same blue water landscape through
the content. `styles/journey.css` and `styles/journey.js` add restrained,
one-time reveals without another render loop. The animation control also
disables these transitions. Reduced-motion settings and keyboard focus are
respected; content remains visible without JavaScript.

## Dependency

`three.module.min.js` and `three.core.min.js` are Three.js 0.185.1 ES modules,
distributed under the MIT license in `THREE-LICENSE.txt`. They are loaded from
this site, with no CDN request. The scene requires a WebGL-capable browser for
animation; the rest of the site does not.
