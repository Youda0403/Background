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

The pair-name field takes a line break: press Enter and the headline splits
there, setting the first line in one face and the second in another — the trick
that gives the reference posters their voice. A single-line name falls back to
splitting at the first space, so `Sunrise Duo` becomes **Sunrise** / **Duo**.

**Plain-language help.** Every piece of jargon — duotone, halftone, scrim,
overprint, bleed, vignette — has a `?` next to it that opens a short note in
Korean explaining what it does. Nothing in the panel is unexplained.

**Discretion.** The *Discretion* slider shrinks the headline, thins the motif
scatter and drops decoration opacity in one move — from "loud and proud" to
"nobody will know". Combined with the Grid or Zine layout it produces something
that reads as a typographic experiment or an exhibition flyer from arm's length.

**Photos that belong to the artwork.** Upload, drop or paste an image, then tone
it into the palette:

| Tone | What it does |
| --- | --- |
| Natural | brightness / contrast / saturation only |
| Wash | keeps the photo's own hues and fades them into the paper, like a sun-bleached print |
| Duotone | discards the hues and remaps luminance onto the palette's two inks |
| Mono | grayscale |
| Halftone | reprints the photo as a dot screen in the palette's ink |

Wash and Duotone are deliberately far apart: one keeps the photograph
recognisable, the other turns it into artwork.

Grid and Type default to Duotone rather than Mono. Grey is not a palette
colour: a grayscale plate sat on the page as a slab that belonged to no
design, most obviously on the saturated palettes. Mono is still one click
away when that is the effect you want.

Each layout decides where the photo goes and how big it is, so there is no frame
proportion to set — a photo slot that moved independently of the design was a
source of confusion, not control. Aura, the one layout built around a cut-out,
keeps its nine frame shapes. Everything else offers feathered edges, softness,
tilt, blend mode, riso overprint, and drag-to-reframe / scroll-to-zoom directly
on the preview.

**Two decisions, not three.** A design is a **layout** (where things sit, and
which fonts suit that structure) and a **palette** (colour, and only colour).
That is the whole model — there is no separate "look" concept, because
6 layouts × 21 palettes is already 126 finished combinations. A palette never
touches the typography, so changing colour cannot undo a font you chose. The
layouts own their own composition, so every remaining slider can nudge a design
but cannot break it.

**Export set.** Tick several devices and get matching wallpapers for all of
them in one go — the same artwork, recomposed for each size.

**Share links.** Every change is written to the URL hash as a diff against the
defaults. Copy the link and it rebuilds that exact wallpaper (minus the photo,
which stays local). State also persists in `localStorage`.

---

## Layouts

| | |
| --- | --- |
| **Type** | The words *are* the poster: one word per line, set huge and shoved alternately to each edge, tiny labels in the gaps, a photo strip at the foot. |
| **Lyric** | A torn photograph, the caption cut into pasted paper scraps, and a huge script headline filling the paper that is left. The photograph is a piece of *printed paper*, so it carries its own stock — on a dark palette that stock stays light, and the tear reads instead of vanishing into the page. A wide canvas tears down the side instead of across, because stacked, the script had a quarter of a desktop to fill and three quarters of empty paper under it. |
| **Grid** | A crossword of highlighted cells spelling your words over the photo. The pair's own name gets the accent cells; everything else stays a quiet tint. The most deniable of the set. |
| **Zine** | Photocopied record sleeve: heavy grain, halftone plate, barcode and numeral rails, struck-through title, rotated date. |
| **Aura** | Colour blooms and a feathered photo window. The soft one. |
| **Column** | A full-bleed photo field with a paper card of dictionary-dense small type — headword, etymology, definition — pinned along one edge. The card is a *card*: on a dark palette it stays light, where painting it in the page colour put a navy box on a navy field and lost it entirely. |

## Palettes

Star Milk · Green Wash · Sage Letter · Aura Heart · Dot Diary · Riso Blue ·
Apple Silver · Jelly Tide · Cream Doodle · Soft Sheet · Ink & Blush ·
Midnight Wish · Shampoo Blue · Crimson Letter · Terracotta · Lavender Haze ·
Matcha · Peach Fizz · Butter Note · Inkwell · Charcoal

Colour only: `base`, `soft`, `inks`, the `duo` ramp photos are toned into,
`text`, `accent`, and how much `grain` the stock carries.

**Every palette has one loud colour, and every layout is obliged to show
it.** This was not true before, and the swatch was lying: Apple Silver's card
showed red and yellow, and then rendered a page of blue. The reason is
structural — a duotone photo is monochrome by definition, and all the type
came from `text` — so no amount of picking prettier palettes would have fixed
it. Each layout now spends the accent somewhere with real area: one word of
Type's headline, Grid's title cells, Zine's strike and bracket corners,
Column's rules and cross-reference, Lyric's pasted tape, Aura's core glow and
twinkles. The swatch shows page / photo ink / accent / decorative ink, which
is what the wallpaper is actually made of.

The accent is checked two ways: it must clear 2.6:1 contrast against its own
page, and the rendered pixels of all 126 combinations are searched for its
hue. Layouts resolve it against whatever they are printing on — Column's card
is light even when the page is dark, so the same colour is deepened there
rather than swapped.

Halftone prints in a single ink, so it picks whichever end of the `duo` ramp
contrasts with the stock it is printing on — otherwise a dark palette printed a
dark photo onto dark paper and the picture disappeared. Choosing a light ink is
only half of it: a halftone lays ink where the picture is *dark*, which reverses
every tone the moment the ink is the lighter of the two, so coverage follows
brightness instead when it is. Get that wrong and the sun comes out as a hole.

All 6 × 21 combinations are audited three ways: for flatness, for how much
loading a photo actually changes the pixels, and for **polarity** — the
rendered photo region is correlated against the source photograph's own
luminance, and negative correlation is a failure. The first two metrics both
passed the reversed halftone, because a negative is neither flat nor invisible.

## Fonts

Serifs (Bodoni Moda, Playfair Display, DM Serif Display, Instrument Serif,
Cormorant, Fraunces, Young Serif), scripts — upright (Playball, Petit Formal
Script, Gwendolyn) and slanted (Birthstone, Mrs Saint Delafield, Parisienne,
Italianno, Sacramento, Yellowtail), grotesques (Space Grotesk, Familjen
Grotesk, Bricolage Grotesque, Syne), one fat display (Bagel Fat One) and monos
(DM Mono, Space Mono) — from Google Fonts with system fallbacks.

**The title font always sets the biggest line**, in every headline style. It
used to be bypassed whenever the style called for a script, so changing it
appeared to do nothing. Only the "first line differs" style reaches for a
second face, and its control appears only then.

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
  compose.js      aspect-ratio tiers
  poster.js       poster furniture: paper, margins, frames, corner marks,
                  rails, micro-blocks, side labels, the headline lockup,
                  edge accents, tag rail
  layouts/        editorial · lyric · grid · zine · aura
  state.js        defaults, palette voices, migration, share links
  render.js       builds the draw context, runs a layout, exports PNG
  controls.js     declarative control panel with help popovers
  ui.js           wiring: state ↔ controls ↔ canvas, photo input, export
```

### Eight things worth knowing before you edit

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

**Ink is chosen against the stock, not against the page.** Most layouts print
the photo straight onto `pal.base`, but Lyric tears its photograph out of a
separate sheet, so it passes that colour as `env.drawPhoto(frame, paper)` and
the ink — and the halftone's polarity — are resolved against the sheet. Pitting
a decision against `pal.base` when the pixels behind it are something else is
how the top half of a dark-palette wallpaper went black.

**Round with care.** Anything passed through `floor`/`round` must be derived
from `env.nominalAr` (the target's true proportions) rather than the live canvas,
because a scaled preview's own aspect ratio differs slightly. `grid.js` computes
its row count this way.

**Never nest a button inside `<label for=…>`, and never let it take focus.**
Clicking it activates the label, which focuses the field and scrolls the panel;
focusing the button itself does the same when the page has scrolled past it. Help
chips are siblings of their labels and cancel their own `pointerdown`
(`controls.js`). Their bubbles are `position: fixed` and clamped to the viewport
in JS, because CSS alone cannot see where the screen edge is.

**A script's descender belongs on top.** The headline draws its plain lines
first and its script lines second, so a swash sweeps across the line below
instead of being buried under it (`poster.js`, `headline`).

**The exact preview repaints offscreen.** Rendering a full-resolution frame
straight into the visible canvas leaves it blank for the ~200 ms the layout
takes. `ui.js` draws into an offscreen canvas and swaps it in with one
`drawImage`. There is also no `resize` redraw: the artwork does not depend on the
viewport, and on phones the URL bar hiding fires `resize` on every scroll.

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
