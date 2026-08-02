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

**Nothing ticked by default.** The batch-export set starts empty: three
pre-selected devices meant the button offered to save a set nobody had asked
for.

**Many sizes.** 33 device presets across iPhone (SE → 17 Pro Max), Galaxy
(S / S Ultra / Z Flip main + cover / Z Fold main + cover), iPad and Galaxy Tab,
desktop and MacBook, plus story/square/profile crops and a custom
size box.

There is deliberately no Apple Watch preset. At 396 × 484 there is not enough
page for any of these layouts to be worth exporting, and every one of them had
to special-case itself into what was really a different design to fill the
face at all. Saved states and share links naming the old ids migrate to a
phone.

Landscape toggle on everything — and picking a device shows it the
way that device actually is, a desktop landscape and a phone portrait, without
having to also flip the toggle to match. That used to require the toggle: the
orientation flag meant "swap the raw pixels," so a preset that is natively
landscape (Desktop, MacBook, X header) needed 가로 to mean "rotate away from
landscape," which is backwards from what the label says. It now means the
shape you want the output to end up, resolved against whatever the preset's
own native shape is — true for the live preview, the single-file export and
the batch-export set alike.

**The preview *is* the file.** When you stop adjusting, the preview repaints at
the real output resolution, so it is pixel-identical to the PNG you save. While
you drag a slider it renders coarse for speed; the settled frame is exact. This
matters more than it sounds — integer canvas sizes mean a scaled preview has a
slightly different aspect ratio, which is enough to move a whole row of a grid.

**One design, genuinely responsive.** Every dimension is expressed in per-mille
of the canvas's short side, and composition is chosen by aspect-ratio tier —
`tall`, `phone`, `tablet`, `square`, `wide`. A wide canvas splits into two
columns instead of stacking; a very small canvas packs the names, date and tags
onto one fitted foot line rather than dropping them; a tablet gets a smaller
photo relative to its width so the type still breathes. All 6 × 33 presets ×
both orientations are audited automatically, across three content shapes and
both photo states — six passes, 2376 renders — for content that goes missing,
text drawn off the page, strings colliding, and dead regions. Content starts below the lock-screen clock band rather than halfway
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

Grid and Spine default to Duotone rather than Mono. Grey is not a palette
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
| **Spine** | The pair name broken into single letters laid in a **table** — every letter in an identical cell, centred in it — running down a full-bleed field, the rows growing from a hairline outline to a solid slab as they descend. A table is the one way to make letter spacing inarguably even when the layout cannot know the name in advance, and the weight ramp is what stops an even table from reading as a flat block. The photograph is the ground, not an object: there is no box to look out of place because there is no box. The table's last cell is always the **accent module**, never a letter — which settles two things at once, since the palette gets somewhere with real area to land and the row the name does not divide into ends on a deliberate block instead of trailing off into empty cells. Every gap is one spacing unit or a multiple of it, and the information at the foot is a ruled row of equal numbered cells rather than paragraphs pinned wherever there was room. The veil over the photograph is weighted to the two ends, where the rails and the cells are set and an uploaded picture is as likely to be sky as shadow, and left alone through the centre where the picture should still be a picture. With no photograph the ground becomes a deep duotone field, which is what the reference looks like anyway. |
| **Lyric** | A torn photograph, the caption cut into pasted paper scraps, and a script headline set big enough to carry the paper it is torn onto. Three rules make it, and it was rebuilt around them: the script **straddles the tear** (type that starts tidily below the edge divides the page into two rectangles; type that climbs over it makes one page); the scraps are a **column, not a scatter** (four little boxes thrown about a photograph read as litter, aligned they read as a paste-up); and **the tear moves** — the lockup is measured first and the tear placed so the paper is exactly as tall as the type and its rule, with the picture taking everything else. A fixed tear line is what left the old version with a void under the headline. A wide canvas tears down the side instead of across. |
| **Grid** | A crossword of highlighted cells spelling your words over the photo. The pair's own name gets the accent cells; everything else stays a quiet tint. The most deniable of the set. |
| **Zine** | Photocopied record sleeve: heavy grain, halftone plate, barcode and numeral rails, struck-through title, rotated date. |
| **Aura** | Colour blooms and a soft photo window. The gentle one — but the window keeps a hairline edge and only a light feather, because a faded photograph inside a wide soft aureole is the visual language of a memorial, not of a couple. A wide canvas gives the photograph and the whole type group one shared centreline — the glow itself is anchored there too, to the left column's centre, rather than to wherever a photo happened to be placed. Anchoring it to the plate meant that with no photo loaded the glow fell back to the full canvas centre, drifting into the gutter between the two columns and lining up with neither the empty photo slot nor the text. |
| **Column** | A full-bleed photo field with a paper card of dictionary-dense small type — headword, etymology, definition — pinned along one edge. The card is a *card*: on a dark palette it stays light, where painting it in the page colour put a navy box on a navy field and lost it entirely. |

## Palettes

Star Milk · Green Wash · Sage Letter · Aura Heart · Dot Diary · Riso Blue ·
Apple Silver · Jelly Tide · Cream Doodle · Soft Sheet · Ink & Blush ·
Midnight Wish · Shampoo Blue · Crimson Letter · Terracotta · Lavender Haze ·
Matcha · Peach Fizz · Butter Note · Inkwell · Charcoal

Colour only: `base`, `soft`, `inks`, the `duo` ramp photos are toned into,
`text`, `accent`, and how much `grain` the stock carries.

**Every palette has one loud colour, and every layout is obliged to show
it — and it is tuned to the palette rather than trusted as typed.** A
hand-picked "loud colour" looks pasted on: hot magenta at full chroma over
Jelly Tide's pale blues was not a palette, it was two palettes fighting.
Real palettes agree about how saturated they are and what light they are
lit by, so each accent is (1) capped near the palette's own chroma
ceiling — measured as chroma, not HSL saturation, because a pastel is 0.68
"saturated" and 0.18 chromatic — (2) given a 14% veil of the page colour,
the overlay that gives a set of colours a common cast, and (3) walked in
lightness until it clears 3:1 against the page. Palettes with no second
hue to spare (Shampoo Blue, Jelly Tide) take a deeper shade of their own
instead of a foreign one.

** This was not true before, and the swatch was lying: Apple Silver's card
showed red and yellow, and then rendered a page of blue. The reason is
structural — a duotone photo is monochrome by definition, and all the type
came from `text` — so no amount of picking prettier palettes would have fixed
it. Each layout now spends the accent somewhere with real area: Spine's accent module and foot
rule, Grid's title cells, Zine's strike and bracket corners,
Column's rules and cross-reference, Lyric's pasted tape, Aura's core glow and
twinkles. The swatch shows page / photo ink / accent / decorative ink, which
is what the wallpaper is actually made of.

The accent is checked two ways: it must clear 3:1 contrast against its own
page, and the rendered pixels of all 126 combinations are searched for its
hue. Layouts resolve it against whatever they are printing on — Column's card
is light even when the page is dark, so the same colour is deepened there
rather than swapped.

Halftone prints in a single ink, so it picks whichever end of the `duo` ramp
contrasts with the stock it is printing on — otherwise a dark palette printed a
dark photo onto dark paper and the picture disappeared. Choosing a light ink is
only the first of three things:

1. a halftone lays ink where the picture is *dark*, which reverses every tone
   the moment the ink is the lighter of the two, so coverage follows brightness
   instead when it is — get this wrong and the sun comes out as a hole;
2. dot radius is looked up from the **inverse of a square lattice's coverage
   function**, not from `sqrt(tone)`. Circles on a grid start overlapping at
   half a cell and go solid at `1/√2`, so treating ink area as `πr²` reached
   full coverage at barely 60% tone — most of a real photograph, whose
   luminance sits in the middle, printed as one flat slab;
3. tone is normalised to the photograph's own 2nd–98th percentiles before it
   is screened, the way a repro camera does. Measured at working resolution so
   it cannot vary with the canvas, or the preview and the export would screen
   differently.

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
  layouts/        spine · lyric · grid · zine · aura · column
  state.js        defaults, palette voices, migration, share links
  render.js       builds the draw context, runs a layout, exports PNG
  controls.js     declarative control panel with help popovers
  ui.js           wiring: state ↔ controls ↔ canvas, photo input, export
```

### Twenty things worth knowing before you edit

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

**Decisions come from the target, drawing comes from the canvas.** `env.u()`
scales with the pixels being painted — that is the point of per-mille. But
anything that *chooses a composition* must read the target's dimensions:
`nominalAr`, and `micro`. Deciding `micro` from the canvas meant the coarse
interactive preview drew a tall phone at 415px wide, concluded it was a watch
face, and dropped the caption, the rails and the tags — then the settled
full-resolution pass put them back.

`micro` also looks at *both* dimensions. An X header is 1500 × 500: not a
small screen, a wide one. Judged on its short side alone it came out as a
watch face, which is why that preset was the most broken of the 36.

**Nothing is ever silently dropped.** A layout may re-arrange its furniture
when the canvas changes shape; it may not stop carrying it. `PO.microFoot`
packs the names, the date and the tags onto one fitted line so a Watch export
still says everything a phone one does. This is enforced, not remembered:
`resp.js` renders all 6 layouts × 36 presets × both orientations, instruments
`type.draw` and `photo.place`, and fails on any content field that appears at
one size and vanishes at another — as well as on text drawn outside the canvas
or crashing into other text. 432 renders, with and without a photo.

Two things that audit taught the hard way: read boxes through
`ctx.getTransform()`, because rails and spine labels are drawn inside
`translate`+`rotate`; and take the ink height from
`measureText().actualBoundingBoxAscent`, not from a fraction of the em, or
every correctly seated script reads as hanging off the top of the page.

**An audit nobody believes is an audit nobody reads.** The dead-region check
counts the photograph's own rect as inked when no photo is loaded, taking the
rect from the same combination rendered *with* one. Without that it reported
every layout's empty picture area as a defect — dozens of findings, all
benign, which is how a check stops being read.

**A dead region is a defect, and it is invisible to the obvious checks.**
"A third of the page is empty" is neither missing content, nor text off the
canvas, nor a collision, so all three of the original audit's questions passed
while a wallpaper plainly looked broken. `resp.js` now also finds the largest
all-empty rectangle over a 24 × 24 grid of the render and fails past 35% of the
page. A poster is allowed air and a no-photo placeholder is legitimately flat,
which is why the bar is one *unbroken* third rather than "some empty space".

**A minimum size is not a fit.** Scaling a stack by
`max(0.4, needed / available)` and hoping is a refusal to fit: on square
canvases the old Type layout's stack ran straight past its box and printed through the
caption. Give space back from the flexible element first (the picture band),
then scale the type to what is actually left. And the band shrinks but never
closes — collapsing it to zero when the page got tight meant the photograph
was silently not drawn.

**Whatever measures the fit must count the same gaps the layout draws.**
Leading sits *between* lines, so n lines have n−1 of them. That layout's fit counted
`i ? leading : 0` while its layout added one after every line, so the stack
consumed 0.08 of the largest line more than had been budgeted — invisible on a
tall phone where slack absorbs it, and a collision with the caption on
anything near square where there is none.

**Place from what was measured, not from what was planned.** Its picture
column started at the notional split between words and picture. But a short
canvas caps the type by height, and there is a hard maximum point size on top
of that, so the words routinely end far narrower than the column they were
fitted against — leaving a dead strip no adjustment of the nominal split could
close. Measure where the words actually end, then place the picture there.

**One content shape is one test case.** The audit ran only the default text —
a three-word title — for a long time. A *one-word* title makes the layout
borrow both names and the separator as extra lines, a completely different
line structure, and that is the one a real user hit. `resp.js` now sweeps
three content shapes (default / short title / every optional field empty)
against both photo states: six passes, 2376 renders.

**The top bar is sticky, so its height is permanent.** It used to wrap onto
two rows on a phone — a brand line and a full-width row of buttons — costing
about a sixth of the screen for the whole session. One row, smaller type,
50px.

**A flag that means "swap" needs to know what it's swapping from.**
`orientation` used to be interpreted literally — `'landscape'` swapped the
preset's raw `w`/`h`, full stop. That is correct only for presets that are
natively portrait, which is most of them, so nobody noticed until a preset
that is natively landscape (Desktop, MacBook, X header) got the same
treatment: picking 가로 rotated it *out of* landscape, and the default
(`'portrait'`, meaning "don't swap") happened to leave it landscape by
accident. `render.dims()` now compares the desired shape against the
preset's own native shape and swaps only on disagreement, and `ui.js`
snaps `orientation` to a newly picked preset's native shape the same way
the dropdown always implicitly promised it would — including inside
`downloadSet()`'s batch loop, which sets `presetId` directly and would
otherwise export a landscape device rotated onto its side any time the
panel itself was still framed as portrait.

**A word that fills its own line still has to agree with its neighbour.**
That layout sized every line independently — a short word set huge, a long one
smaller, that contrast is the point. It is not the point for the two
borrowed name words, which are one unit split across two lines only
because the layout is one-word-per-line by construction; fit
independently, a four-letter name and a three-letter name landed on
different point sizes for no reason a reader could name. They are pinned
to whichever of the two needed the smaller size to fill its slot, after
the fact, rather than never being fit independently in the first place —
cheaper than restructuring the two-pass fit/scale pipeline for one
special case.

**Anchor decoration to where content belongs, not to whether it loaded.**
Aura's hero glow used to centre on the photo's own frame, which does not
exist when no photo is loaded — the fallback was the *canvas* centre, which
on a wide two-column layout is the gutter between the columns, aligned
with neither the empty photo slot nor the text. The anchor is now the left
column's centre unconditionally, matching where a photo would sit if there
were one.

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
