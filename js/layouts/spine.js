/* SPINE — the pair name set as one justified block over a full-bleed
   field, closed by a solid accent square, with the two names tracked out
   beneath it to the same measure; then a ruled strip of numbered cells.

   The previous version laid the name out as a table of single letters —
   one letter per cell, a fixed number of columns per aspect tier. That
   guaranteed even spacing and nothing else. A four-letter name was broken
   across two rows for no reason, every letter floated alone in a cell far
   wider than itself, and the per-row weight ramp read as the second line
   being set in a different font. Even, but not a word.

   What replaces it takes the evenness from the edges instead of from the
   cells. Every line is **justified to the same measure**, so the block is
   a true rectangle: one left edge, one right edge, one size, one weight.
   The name is never broken inside a word — the lines are whole words,
   split by a balancer that minimises the widest line, so the tracking
   needed to justify stays small and the block reads as one mass.

   The number of lines is not fixed. It is the largest that still fits the
   band, which is what lets the same design carry a two-letter name and a
   four-word one: a short name comes out as one line at full width, a long
   one stacks until the block fills the page. A one-word name is always one
   line, however tall the band is — filling space is not a reason to cut a
   word in half.

   The block is anchored to the foot and the picture takes the rest — the
   whole band above it on a portrait page, the whole right column on a wide
   one. It is a defined region rather than the full bleed it used to be,
   but it still touches three trims, so it reads as one of the page's two
   fields and not as a rectangle set down on top of one. The type then sits
   on the palette's own paper instead of on the photograph, which is what
   lets the page colour be seen at all and takes small text off an
   unpredictable ground.

   The names line is set to the same measure underneath, which is what
   stops a short title from leaving the lockup stranded, and the accent
   square closes the last line as if it were the final glyph — the palette
   gets area to land on, and it lands inside the type rather than beside
   it. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  var REF = 200;              /* the size natural widths are measured at */
  var TITLE_WEIGHT = 500;


  /* What fills the paper above the picture band. A tall page leaves it
     open by construction — the lockup is seated at the foot and the band
     is capped so the picture cannot take the page — and open is not the
     same as empty.

     The monogram, set large in outline: the same two letters the accent
     square carries at the foot, at the other end of the page and at the
     other end of the scale. Justified to the measure like every other
     line, because one element short of an edge the rest of the page holds
     does not read as a different element, it reads as the page being out
     of true. */
  function drawHead(env, o) {
    var ctx = env.ctx, u = env.u;
    var st = env.st, pal = env.pal;
    var m = o.m, band = o.bottom - o.top;
    if (band < u(60)) return;

    /* Seated inside the band, not cropped by it. Letting the picture's
       edge cut the letters looked better but put the glyph's box over the
       rail below, and a clip only hides that — the two are the same two
       letters, so where they overlap they are illegible rather than
       layered. */
    var size = band * 1.15;
    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    var ink = T.inkBox(ctx, o.initials);
    if (ink.asc + ink.desc > band) size *= band / (ink.asc + ink.desc);
    /* never wider than the measure at zero tracking */
    size = T.fit(ctx, o.initials, st.titleFont, size, m.inner, 0, { weight: 500 });
    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    ink = T.inkBox(ctx, o.initials);
    var gaps = o.initials.length - 1;
    var track = gaps > 0 ? (m.inner - T.measure(ctx, o.initials, 0)) / gaps : 0;

    ctx.save();
    ctx.globalAlpha = 0.5;
    T.draw(ctx, o.initials, m.left, o.bottom - ink.desc, {
      align: 'left', tracking: Math.max(0, track),
      stroke: pal.text, strokeWidth: Math.max(1, u(2.2)), fill: false
    });
    ctx.restore();
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var m = PO.margins(env);

    /* THE spacing unit. Every gap on this page is g or a multiple. */
    var g = U.clamp(m.inner * 0.035, u(14), u(46));

    /* A wide page splits side to side and a tall one top to bottom, so the
       type has a column of its own either way and never has to share a
       measure with the picture. */
    var wide = env.tier === 'wide';
    var splitX = m.left + m.inner * 0.5;
    var colX = m.left;
    var colW = wide ? splitX - g * 1.6 - m.left : m.inner;
    var colM = { left: colX, right: w - colX - colW, inner: colW };

    /* ---------- the page ---------- */
    var deep = U.mix(pal.duo[0], pal.duo[1], 0.32);
    PO.paper(env, { tint: false });

    var onField = U.onColor(deep);      /* reads on the picture */
    var accent = PO.accentOn(pal, pal.base);

    var initials = W.textstack.monogram(st) || 'PT';
    var namesLine = (st.showNames && c.names) ? c.names.toUpperCase() : '';
    var titleRaw = (c.title || 'pairtone').replace(/\r/g, '');
    /* Enter in the main field is a hard break and overrides the balancer.
       Collapsing all white space, newlines included, meant the one piece
       of layout control the field offers did nothing. */
    var hardLines = titleRaw.indexOf('\n') >= 0
      ? titleRaw.split('\n').map(function (s) { return s.trim().toUpperCase(); })
        .filter(Boolean).slice(0, 4)
      : null;
    if (hardLines && hardLines.length < 2) hardLines = null;
    titleRaw = titleRaw.replace(/\s+/g, ' ').trim();
    var words = titleRaw.toUpperCase().split(' ').filter(Boolean);
    if (!words.length) words = ['PAIRTONE'];

    /* ---------- the foot, measured before the block is given its band --- */
    var cells = [];
    if (c.caption) cells.push(c.caption);
    if (c.footnote) cells.push(c.footnote);
    if (st.showTags && c.tags.length) {
      cells.push(c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  '));
    }
    if (!cells.length && namesLine) cells.push(namesLine);
    if (!cells.length) cells.push(titleRaw);
    cells = cells.slice(0, 3);

    var n = cells.length;
    var footCellW = (colW - g * (n - 1)) / n;
    var footBodyH = 0;
    if (!env.micro) {
      cells.forEach(function (body) {
        footBodyH = Math.max(footBodyH, PO.block(env, 0, 0, footCellW, [body], {
          size: mic * 0.78, lead: 1.5, upper: false, measure: true, font: st.bodyFont
        }));
      });
    }
    var footH = env.micro ? 0 : mic * 1.9 + footBodyH;
    var footTop = h - m.bottom - footH;

    var bandTop = m.top + (env.micro ? mic * 0.8 : mic * 1.9) + g;
    var bandBottom = env.micro ? h - m.bottom - mic * 1.8 : footTop - g * 1.6;

    /* ---------- the names line, set to the measure ---------- */
    var nameSize = mic * 1.05;
    var nameTrack = 0, nameCap = 0, namesH = 0;
    var showNamesLine = !!namesLine && !env.micro;
    if (showNamesLine) {
      T.setFont(ctx, st.bodyFont, nameSize, { weight: 500 });
      var natural = T.measure(ctx, namesLine, 0);
      nameTrack = namesLine.length > 1
        ? U.clamp((colW - natural) / (namesLine.length - 1), 0, nameSize * 4.6) : 0;
      nameCap = T.inkBox(ctx, namesLine).asc;
      namesH = nameCap + g * 1.3;
    }

    var titleBottom = bandBottom - namesH;
    /* On a tall page the picture takes the band above the lockup, so the
       lockup is not allowed to eat all of it — a four-word name would
       otherwise leave the photograph a sliver. */
    var titleBand = Math.max(
      wide ? titleBottom - bandTop : Math.min(titleBottom - bandTop, (bandBottom - bandTop) * 0.54),
      u(70));

    /* ---------- natural widths, measured once at a reference size ------- */
    T.setFont(ctx, st.titleFont, REF, { weight: TITLE_WEIGHT });
    var capAt1 = T.inkBox(ctx, 'H').asc / REF;
    var spaceAt1 = ctx.measureText(' ').width / REF;
    /* the accent square rides the last line with a gap of its own, so the
       final word never touches it */
    var sqGapAt1 = capAt1 * 0.34;
    var tailAt1 = sqGapAt1 + capAt1;
    var wordAt1 = words.map(function (s) { return T.measure(ctx, s, 0) / REF; });

    function segAt1(i, j) {
      var t = 0;
      for (var k = i; k < j; k++) { t += wordAt1[k]; if (k > i) t += spaceAt1; }
      return t;
    }
    function textAt1(line) {
      T.setFont(ctx, st.titleFont, REF, { weight: TITLE_WEIGHT });
      return T.measure(ctx, line, 0) / REF;
    }

    /* How hard a set of lines has to be stretched to reach the measure.
       A line of several words is justified on its WORD gaps, which leaves
       the letters at their natural fit — that is what keeps a line reading
       as words rather than as spaced-out capitals. Only a line that is one
       word has to open its letters, and that is the expensive kind of
       stretch, so the two are judged against different limits. */
    var LETTER_CAP = 1.1, WORD_CAP = 2.6;
    function stretchOf(lines, maxW1) {
      var bad = 0;
      lines.forEach(function (line, i) {
        var slack = maxW1 - textAt1(line) - (i === lines.length - 1 ? tailAt1 : 0);
        var parts = line.split(' ').filter(Boolean);
        if (parts.length > 1) {
          bad = Math.max(bad, (spaceAt1 + slack / (parts.length - 1)) / WORD_CAP);
        } else if (line.length > 1) {
          bad = Math.max(bad, (slack / (line.length - 1)) / LETTER_CAP);
        } else if (slack > 0.02) {
          bad = Infinity;
        }
      });
      return bad;
    }

    function measureSet(lines) {
      var maxW1 = 0;
      lines.forEach(function (line, i) {
        maxW1 = Math.max(maxW1, textAt1(line) + (i === lines.length - 1 ? tailAt1 : 0));
      });
      return { lines: lines, max: maxW1, stretch: stretchOf(lines, maxW1) };
    }

    /* Split the words into L lines so the WIDEST line is as narrow as it
       can be. Balanced lines are what keep the justification small, and
       small justification is what makes the block read as one mass. The
       final line carries the accent square, so it is measured wider. */
    function balance(L) {
      var memo = {};
      function best(i, k) {
        var key = i + '|' + k;
        if (memo[key]) return memo[key];
        if (k === 1) return (memo[key] = { max: segAt1(i, words.length) + tailAt1, cuts: [words.length] });
        var out = null;
        for (var j = i + 1; j <= words.length - (k - 1); j++) {
          var sub = best(j, k - 1);
          var mx = Math.max(segAt1(i, j), sub.max);
          if (!out || mx < out.max) out = { max: mx, cuts: [j].concat(sub.cuts) };
        }
        return (memo[key] = out);
      }
      var r = best(0, L);
      if (!r) return null;
      var lines = [], prev = 0;
      r.cuts.forEach(function (cut) { lines.push(words.slice(prev, cut).join(' ')); prev = cut; });
      return measureSet(lines);
    }

    /* More lines means shorter lines, which means a larger shared size and
       a taller block — both monotonic — so the best arrangement is simply
       the largest line count that still fits the band. A single word can
       only ever be one line: filling space is not a reason to cut a word
       in half, which is how a four-letter name ended up broken in two. */
    function seat(set) {
      var size = colW / set.max;
      var capH = capAt1 * size;
      var lineH = capH * 1.26;
      return {
        lines: set.lines, size: size, capH: capH, lineH: lineH,
        h: capH + (set.lines.length - 1) * lineH
      };
    }

    var pick;
    if (hardLines) {
      /* An explicit line break is the one instruction the layout must not
         second-guess. It used to be flattened away with the rest of the
         white space, so pressing Enter did nothing at all. */
      pick = seat(measureSet(hardLines));
    } else {
      var maxL = Math.min(words.length, env.micro ? 2 : 4);
      var oneLine = balance(1);
      pick = seat(oneLine);
      for (var L = 2; L <= maxL; L++) {
        var b = balance(L);
        if (!b) break;
        var cand = seat(b);
        if (cand.h > titleBand) break;
        /* Loose justification is a cost and a bigger setting is the
           payoff, so the two are weighed against each other rather than
           the cost being judged alone. "Aefi Syndrome" on one line is
           thirteen characters across the measure and comes out small; two
           lines set it half again as large, which is worth opening the
           four letters of the short line further than would otherwise be
           allowed. Three words giving a line of "of" earns nothing and is
           refused at any size. */
        var gain = oneLine.max / b.max;
        if (b.stretch <= 1 || (b.stretch <= 2 && gain >= 1.35)) pick = cand;
      }
    }

    /* only a single line can overflow the band — nothing shorter to fall
       back to, so it gives up width instead */
    if (pick.h > titleBand) {
      var k = titleBand / pick.h;
      pick.size *= k; pick.capH *= k; pick.lineH *= k; pick.h = titleBand;
    }

    /* Seating the lockup at the foot is right when the open half of the
       page is the top and a photograph is filling it. On a header the page
       is three times wider than it is tall, there is no top half to give
       away, and the same anchor just reads as the type sliding off the
       bottom edge. So a wide page centres the lockup in its band. */
    var lockH = pick.h + namesH;
    var anchor = env.tier === 'wide'
      ? bandTop + (bandBottom - bandTop + lockH) / 2
      : bandBottom;
    titleBottom = anchor - namesH;

    /* ---------- the picture's region ---------- */
    var last0 = pick.lines.length - 1;
    var blockTop = titleBottom - last0 * pick.lineH - pick.capH;
    /* A tall page gives the picture a BAND across the middle rather than
       everything above the lockup. Running it to the top trim made it most
       of the page — the wallpaper became a photograph with a caption. The
       band still touches both side trims, so it reads as a stratum and not
       as an inset rectangle, and paper closes the page above and below. */
    var bandFoot = blockTop - g * 1.8;
    var bandHead = m.top + mic * 2.4;
    var bandH = U.clamp(bandFoot - bandHead, h * 0.18, h * 0.42);
    var region = wide
      ? { x: splitX, y: 0, w: w - splitX, h: h }
      : { x: 0, y: bandFoot - bandH, w: w, h: bandH };

    ctx.save();
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.w, region.h);
    ctx.clip();
    if (env.hasPhoto) {
      env.drawPhoto(region);
    } else {
      ctx.fillStyle = U.mix(deep, pal.base, 0.12);
      ctx.fillRect(region.x, region.y, region.w, region.h);
      P.wash(ctx, region.x + region.w * 0.3, region.y + region.h * 0.3,
        Math.max(region.w, region.h) * 0.9, pal.soft[0], 0.6 * st.washStrength);
      P.wash(ctx, region.x + region.w * 0.8, region.y + region.h * 0.72,
        Math.max(region.w, region.h) * 0.75, pal.soft[1] || pal.soft[0], 0.5 * st.washStrength);
    }
    ctx.globalAlpha = U.clamp(0.06 + st.scrim * 0.2, 0.06, 0.26);
    ctx.fillStyle = deep;
    ctx.fillRect(region.x, region.y, region.w, region.h);
    ctx.restore();

    /* ---------- the head: what fills the paper above the band --------- */
    if (!wide && !env.micro) {
      /* The whole top of the page, not the sliver under the rail. On a
         phone `m.top` IS the lock-screen clock reserve, so measuring the
         head band from it left about nothing — which is why the area the
         eye reads as empty is exactly the area the layout thought it did
         not have. */
      var headTop = u(48);
      /* clear of the rail that now sits on the band's top edge — the big
         monogram and the rail's small one are the same two letters, and
         they were landing on each other */
      var headBot = region.y - mic * 2.0;
      drawHead(env, {
        m: m, top: headTop, bottom: headBot, initials: initials
      });
    }

    /* ---------- the block ---------- */
    var square = pick.capH;
    var last = pick.lines.length - 1;
    T.setFont(ctx, st.titleFont, pick.size, { weight: TITLE_WEIGHT });

    /* Justify one line to `target`. Several words open their word gaps and
       keep their letters at natural fit; a single word has no choice but
       to open its letters. Both are capped, so a line that cannot reach
       the measure runs short rather than falling apart. */
    function justify(line, x, base, target) {
      T.setFont(ctx, st.titleFont, pick.size, { weight: TITLE_WEIGHT });
      var parts = line.split(' ').filter(Boolean);
      var slack = target - T.measure(ctx, line, 0);
      if (parts.length > 1) {
        var sw = ctx.measureText(' ').width;
        var gap = sw + Math.max(0, Math.min(slack / (parts.length - 1), pick.size * WORD_CAP));
        var cx = x;
        parts.forEach(function (word) {
          T.draw(ctx, word, cx, base, { align: 'left', tracking: 0 });
          cx += T.measure(ctx, word, 0) + gap;
        });
        return;
      }
      var track = line.length > 1
        ? U.clamp(slack / (line.length - 1), 0, pick.size * LETTER_CAP) : 0;
      T.draw(ctx, line, x, base, { align: 'left', tracking: track });
    }

    pick.lines.forEach(function (line, i) {
      var isLast = i === last;
      var base = titleBottom - (last - i) * pick.lineH;
      var target = colW - (isLast ? square + pick.capH * 0.34 : 0);

      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.98;
      justify(line, colX, base, target);
      ctx.restore();

      if (!isLast) return;
      /* the accent square closes the last line, flush with the right edge
         the rest of the block is justified to */
      var sx = colX + colW - square;
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.95;
      ctx.fillRect(sx, base - square, square, square);
      ctx.restore();

      var iSize = T.fit(ctx, initials, st.titleFont, square * 0.4, square * 0.72, 0.04, { weight: 700 });
      T.setFont(ctx, st.titleFont, iSize, { weight: 700 });
      var iInk = T.inkBox(ctx, initials);
      ctx.save();
      ctx.fillStyle = U.onColor(accent);
      T.draw(ctx, initials, sx + square / 2, base - square / 2 + (iInk.asc - iInk.desc) / 2,
        { align: 'center', tracking: iSize * 0.04 });
      ctx.restore();
    });

    if (showNamesLine) {
      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.72;
      T.setFont(ctx, st.bodyFont, nameSize, { weight: 500 });
      T.draw(ctx, namesLine, colX, anchor, { align: 'left', tracking: nameTrack });
      ctx.restore();
    }

    if (env.micro) {
      PO.microFoot(env, { m: m });
      return;
    }

    /* ---------- furniture ---------- */
    /* The rail is on paper on both tiers now that the picture no longer
       reaches the top trim. It used to be drawn in the colour that reads
       on the photograph, which on a pale stock is invisible ink. */
    PO.rail(env, wide ? m.top + mic * 1.0 : region.y - mic * 0.85,
      [initials, null, 'pairtone'],
      { m: wide ? colM : m, size: mic * 0.76, alpha: 0.55 });

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2.5));
    ctx.beginPath();
    ctx.moveTo(colX, footTop);
    ctx.lineTo(colX + colW, footTop);
    ctx.stroke();
    ctx.restore();

    cells.forEach(function (body, i) {
      var x = colX + (footCellW + g) * i;
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.95;
      T.setFont(ctx, 'dmmono', mic * 0.68, {});
      T.draw(ctx, '0' + (i + 1), x, footTop + mic * 1.3, { align: 'left', tracking: mic * 0.08 });
      ctx.restore();
      PO.block(env, x, footTop + mic * 1.9, footCellW, [body], {
        size: mic * 0.78, lead: 1.5, upper: false, alpha: 0.78, font: st.bodyFont
      });
    });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'spine',
    label: 'Spine',
    blurb: '문구를 폭에 꽉 맞춘 한 덩어리로, 사진은 가로 띠로. 제일 정돈된 쪽.',
    defaults: {
      titleFont: 'didone', scriptFont: 'delafield', bodyFont: 'spacegrotesk',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.95,
      feather: 0, scrim: 0.3, motifs: ['sparkle'], decoCount: 0,
      grain: 1.5, vignette: 0.12
    },
    draw: draw
  });
})(window.PT = window.PT || {});
