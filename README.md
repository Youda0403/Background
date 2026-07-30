# pairtone

A wallpaper maker for two. Pick a look, type your pair's names, drop in a photo,
and export a PNG at the exact pixel size of your phone, tablet or desktop.

No build step, no dependencies, no server: open `index.html` and it runs. The
photo never leaves the browser.

```
open index.html          # macOS
xdg-open index.html      # Linux
npx serve .              # or serve it, if you prefer localhost
```

---

## What it does

**Many sizes.** 36 device presets across iPhone (SE → 17 Pro Max), Galaxy
(S / S Ultra / Z Flip main + cover / Z Fold main + cover), iPad and Galaxy Tab,
desktop and MacBook, Apple Watch, plus story/square/profile crops and a custom
size box. Landscape toggle on everything.

**One design, genuinely responsive.** Every dimension is expressed in per-mille
of the canvas's short side, and composition is chosen by aspect-ratio tier —
`tall`, `phone`, `tablet`, `square`, `wide`. A wide canvas splits into two
columns instead of stacking; a Watch face drops the caption and enlarges the
headline; a tablet gets a smaller photo relative to its width so the type still
breathes. The preview and the export run the identical code path, only at
different pixel counts, so what you see is what you save.

**English-first words.** Pair name, both names with a choice of nine separators
(`×  ♡  &  ·  +  /  ✦  —  space`), initials-only monogram, caption, footnote,
and scattered bracket tags like `(love)`. Every field is optional and every one
can be switched off.

**Discretion.** The *Discretion* slider shrinks the headline, thins the motif
scatter and drops decoration opacity in one move — from "loud and proud" to
"nobody will know". Combined with the Riso and Paper layouts it produces
something that reads as an exhibition flyer or a notebook page from arm's
length.

**Photos that belong to the artwork.** Upload, drop or paste an image, then tone
it into the palette:

| Tone | What it does |
| --- | --- |
| Natural | brightness / contrast / saturation only |
| Wash | desaturates and pulls the image toward the palette's ink ramp |
| Duotone | maps luminance onto the palette's two inks |
| Mono | grayscale |
| Halftone | reprints the photo as dot screen in the palette's ink |

Plus nine frame shapes (circle, arch, panel, rounded, blob, heart, star, oval,
full bleed), seven frame proportions, feathered edges, softness, tilt, blend
mode, riso overprint, and drag-to-reframe / scroll-to-zoom directly on the
preview. Duotone and Halftone are the ones that matter: they print the photo in
the wallpaper's own ink, so a snapshot sits *inside* the design instead of on
top of it.

**Lots of choices over few layouts.** Four layouts, twelve palettes, twelve
one-click looks, fourteen motif kinds, six fonts. A look sets layout + palette +
fonts + texture at once but keeps your words, photo and canvas size.

**Export set.** Tick several devices and get matching wallpapers for all of
them in one go — the same artwork, recomposed for each size.

**Share links.** Every change is written to the URL hash as a diff against the
defaults. Copy the link and it rebuilds that exact wallpaper (minus the photo,
which stays local). State also persists in `localStorage`.

---

## Layouts

| | |
| --- | --- |
| **Aura** | Blurred colour blooms, a soft photo window, twinkles. The most discreet. |
| **Paper** | Dot-grid or graph stationery, tinted card, halftone print, beaded swirl. |
| **Riso** | Overprinted colour blocks with torn edges and poster furniture. |
| **Sticker** | Pastel doodle sheet with an instant-photo card. |

## Looks

Star Milk · Aura Heart · Green Wash · Midnight Wish · Sage Letter · Fairy Tale ·
Jelly Tide · Ink & Blush · Riso Blue · Apple Silver · Soft Sheet · Cream Doodle

---

## Code map

Plain ES5 in classic script tags — deliberately, so the file opens from disk
without a dev server. Everything hangs off a single `window.PT` namespace.

```
index.html
css/app.css
js/
  util.js         seeded RNG (mulberry32), colour maths, rAF coalescing
  presets.js      device sizes + lock-screen safe areas
  palettes.js     12 palettes: base / soft / inks / duotone ramp / text
  primitives.js   paths (star, puff star, sparkle, heart, blob, bow, key…),
                  soft glow, grain, halftone paper, dotted trails, masking
  type.js         font stacks, manual letter-spacing, fitting, wrapping
  frames.js       photo window shapes
  photo.js        load → levels → saturate → duotone → blur → halftone → place
  textstack.js    resolves the text fields into a stack and draws it
  deco.js         motif scatter with keep-out zones
  compose.js      responsive placement: where the photo and the words go
  layouts/        aura · paper · riso · sticker
  state.js        defaults, looks, share-link serialisation
  render.js       builds the draw context, runs a layout, exports PNG
  controls.js     declarative control panel
  ui.js           wiring: state ↔ controls ↔ canvas, photo input, export
```

### Two things worth knowing before you edit

**Per-mille units.** Layouts call `env.u(v)`, which is `v × min(w,h) / 1000`.
Never write raw pixel numbers in a layout — they will not survive a change of
device. Positions that should track the canvas edges use fractions of `w`/`h`
instead.

**`destination-in` multiplies alpha.** Masks are built in their own buffer and
applied in a single `drawImage` (see `prim.masked`). Applying a multi-pass mask
in place erases it, because each draw multiplies the destination alpha rather
than accumulating it. This is what `prim.featherMask` relies on for its soft
edge.

### Adding a layout

Drop a file in `js/layouts/`, add a `<script>` tag, and push onto the registry:

```js
W.layoutRegistry.push({
  id: 'mine',
  label: 'Mine',
  blurb: 'One short line for the card.',
  defaults: { photoShape: 'arch', tone: 'duo', paperStyle: 'none' },
  draw: function (env) { /* … */ }
});
```

`draw(env)` gets `ctx`, `w`, `h`, `u()`, `tier`, `pal`, `st`, `rand` (seeded, so
the scatter is reproducible), `content` (resolved text), `band` (the vertical
space left after the clock and dock), `emphasis` / `decoAlpha` / `decoDensity`
(the Discretion slider), and `drawPhoto(frame)`. Use `compose.place()` for
geometry and `textstack.drawStack()` for type and the layout is responsive for
free.

## Browser support

Chrome, Edge, Firefox and Safari 15+. Blur is done by downscale/upscale and soft
glows by layered fills rather than `ctx.filter`, so nothing depends on a filter
implementation. Letter-spacing is applied glyph by glyph rather than via
`ctx.letterSpacing`, so tracking is identical everywhere.

Fonts come from Google Fonts with system fallbacks; the canvas waits for
`document.fonts.ready` and redraws, so an export always matches the screen.
