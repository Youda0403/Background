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

**The preview *is* the file.** When you stop adjusting, the preview repaints at
the real output resolution, so it is pixel-identical to the PNG you save. While
you drag a slider it renders coarse for speed; the settled frame is exact. This
matters more than it sounds — integer canvas sizes mean a scaled preview has a
slightly different aspect ratio, which is enough to move a whole row of a grid.

**One design, genuinely responsive.** Every dimension is expressed in per-mille
of the canvas's short side, and composition is chosen by aspect-ratio tier —
`tall`, `phone`, `tablet`, `square`, `wide`. A wide canvas splits into two
columns instead of stacking; a Watch face drops the caption and enlarges the
headline; a tablet gets a smaller photo relative to its width so the type still
breathes. Content starts below the lock-screen clock band rather than halfway
into it, so nothing important ends up under the time.

**Type that fills its measure.** Headlines are sized by binary search against
the available width and seated using real ink boxes (`actualBoundingBoxAscent`),
not em-box guesses — which is why a headline can graze the top edge of a photo
without colliding with it. Nothing is scaled after being fitted.

**English-first words.** Pair name, both names with a choice of nine separators
(`×  ♡  &  ·  +  /  ✦  —  space`), initials-only monogram, caption, footnote,
and bracket tags like `(love)` set along the foot rail. Every field is optional.

A pair name containing a space is split across the two lines of the headline
lockup — `Spirit of Nature` becomes **Spirit** / **of Nature.**, the trick that
gives the reference posters their voice.

**Plain-language help.** Every piece of jargon — duotone, halftone, scrim,
overprint, bleed, vignette — has a `?` next to it that opens a short note in
Korean explaining what it does. Nothing in the panel is unexplained.

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

Plus nine frame shapes, thirteen frame proportions (`자동` plus five portrait,
square and six landscape ratios up to 21:9), feathered edges, softness, tilt,
blend mode, riso overprint, and drag-to-reframe / scroll-to-zoom directly on the
preview. Duotone and Halftone are the ones that matter: they print the photo in
the wallpaper's own ink, so a snapshot sits *inside* the design instead of on
top of it.

**Curated over configurable.** Five layouts, twelve palettes, sixteen one-click
looks, sixteen motif kinds, fifteen fonts. A look sets layout + palette + fonts
+ texture at once but keeps your words, photo and canvas size. The layouts own
their own composition, so the remaining sliders can nudge a design but cannot
break it — the panel shows four sections by default and folds the rest away.

**Export set.** Tick several devices and get matching wallpapers for all of
them in one go — the same artwork, recomposed for each size.

**Share links.** Every change is written to the URL hash as a diff against the
defaults. Copy the link and it rebuilds that exact wallpaper (minus the photo,
which stays local). State also persists in `localStorage`.

---

## Layouts

| | |
| --- | --- |
| **Editorial** | Art-book plate: big treated photo in a paper margin, display headline crossing its top edge, caption band, rails top and foot. |
| **Lyric** | Full-bleed photo, crop marks, small-caps lyric blocks up top, huge script headline at the foot over a spiked burst. |
| **Grid** | A crossword of highlighted cells spelling your words over a monochrome photo. The most deniable of the set. |
| **Zine** | Photocopied record sleeve: heavy grain, halftone plate, barcode and numeral rails, struck-through title, rotated date. |
| **Aura** | Colour blooms and a feathered photo window. The soft one. |

## Looks

Spirit · Sage Letter · Anthurium · Overfeel · Summer Child · Be New · Fireworks ·
Hiding Spot · Crossword · Chrome · Hatachi · Riso Blue · Apple Silver ·
Star Milk · Aura Heart · Soft Sheet

## Fonts

Display serifs (Bodoni Moda, Playfair Display, Instrument Serif, Cormorant,
Fraunces), scripts (Pinyon Script, Italianno), grotesques (Bricolage Grotesque,
Archivo, Syne, Anton), kitsch (Unbounded, Bagel Fat One) and monos (DM Mono,
Space Mono) — served from Google Fonts with system fallbacks.

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
  primitives.js   paths (stars, bursts, sparkle, heart, blob, bow, key, lock,
                  flower, cloud, moon — all on beziers), soft glow, grain,
                  halftone paper, dotted trails, masking
  type.js         font roster, manual letter-spacing, fit/fill, ink boxes
  frames.js       photo window shapes
  photo.js        load → levels → saturate → duotone → blur → halftone → place
  textstack.js    resolves the text fields into strings
  deco.js         motif scatter with keep-out zones
  compose.js      aspect-ratio tiers and photo proportions
  poster.js       poster furniture: paper, margins, frames, corner marks,
                  rails, micro-blocks, side labels, the headline lockup,
                  edge accents, tag rail
  layouts/        editorial · lyric · grid · zine · aura
  state.js        defaults, looks, migration, share-link serialisation
  render.js       builds the draw context, runs a layout, exports PNG
  controls.js     declarative control panel with help popovers
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

**Nothing may consume the shared rng in a pixel-dependent way.** Every layout
draws from one seeded stream (`env.rand`) so the scatter is reproducible. If a
routine's *number* of random draws depends on the canvas's pixel size, every
later motif shifts and the export stops matching the preview. `prim.speckle` and
the zine barcode therefore derive a private rng from a single shared value, and
particle counts come from size relative to the canvas, never from pixels.

**Round with care.** Anything passed through `floor`/`round` must be derived
from `env.nominalAr` (the target's true proportions) rather than the live canvas,
because a scaled preview's own aspect ratio differs slightly. `grid.js` computes
its row count this way.

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

`draw(env)` gets `ctx`, `w`, `h`, `u()`, `tier`, `nominalAr`, `pal`, `st`,
`rand` (seeded), `content` (resolved text), `band` (the space left after the
clock and dock), `micro` / `typeScale` (tiny canvases), `emphasis` /
`decoAlpha` / `decoDensity` (the Discretion slider), and `drawPhoto(frame)`.
Build it out of `poster.*` — `margins`, `rail`, `block`, `headline`, `accents`,
`tagRail` — and it is responsive, discreet and type-consistent for free.

## Browser support

Chrome, Edge, Firefox and Safari 15+. Blur is done by downscale/upscale and soft
glows by layered fills rather than `ctx.filter`, so nothing depends on a filter
implementation. Letter-spacing is applied glyph by glyph rather than via
`ctx.letterSpacing`, so tracking is identical everywhere.

Fonts come from Google Fonts with system fallbacks; the canvas waits for
`document.fonts.ready` and redraws, so an export always matches the screen.
