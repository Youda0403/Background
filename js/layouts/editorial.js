/* EDITORIAL (Type) — the words ARE the poster.

   Rebuilt around two things the reference posters do that the old
   zigzag-and-foot-strip version did not:

   OVERLAP. The picture and the type occupy the same space rather than
   taking turns. The photograph is a band *inside* the word stack, and it
   bites into the line above and the line below it, so the stack reads as
   one object with a picture threaded through it instead of two blocks
   stacked. The last word is drawn AFTER the photograph, so its ascenders
   climb over the picture's bottom edge — that single crossing is what
   makes the page look layered. Only the tips cross, so the word is always
   read against paper, never against an unpredictable photo.

   INDEX. A numbered left gutter (01 02 03…) tied to each line's baseline,
   a numbered caption block, and a rotated label up the right edge. That
   furniture is what makes a page of huge type look composed rather than
   merely large, and it fills the margins that the old version left dead.

   The words are flush left on one axis now. Alternating them to opposite
   edges made every gap a different width and read as noise at small
   sizes; a single left edge with the size contrast doing the work is both
   calmer and more modern. */
(function (W) {
  'use strict';
  var U = W.util, PO = W.poster, T = W.type;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var accent = PO.accentOn(pal, pal.base);

    PO.paper(env, { tint: false });
    var m = PO.margins(env);

    /* ---------- the words ---------- */
    var raw = (c.title || '').replace(/[\r\n]+/g, ' ');
    var lines = raw.split(/\s+/).filter(Boolean);

    /* Two words cannot carry a poster; borrow the names for more lines.
       Borrowed words are marked, because they are not the pair name and
       must not be set at the same size as it. */
    var borrowedFrom = lines.length;
    if (lines.length < 3 && c.names && st.showNames) {
      c.names.split(/\s+/).filter(Boolean).forEach(function (word) {
        if (lines.length < 5) lines.push(word);
      });
    }
    if (!lines.length && c.names) {
      lines = c.names.split(/\s+/).filter(Boolean);
      borrowedFrom = lines.length;
    }
    if (!lines.length) lines = ['pairtone'];
    if (env.micro && lines.length > 3) {
      var per = Math.ceil(lines.length / 3);
      var packed = [];
      for (var gi = 0; gi < lines.length; gi += per) {
        packed.push(lines.slice(gi, gi + per).join(' '));
      }
      lines = packed;
      borrowedFrom = Math.min(borrowedFrom, lines.length);
    }
    lines = lines.slice(0, 5);

    /* ---------- the grid ---------- */
    /* A narrow numbered gutter on the left, the words in the rest. On a
       wide canvas the words take a column and the picture stands beside
       them instead of inside them. */
    var idxW = env.micro ? 0 : mic * 2.4;
    var col = {
      x: m.left + idxW,
      w: m.inner - idxW - (wide ? m.inner * 0.34 : 0)
    };
    var side = wide
      ? { x: w - m.right - m.inner * 0.3, w: m.inner * 0.3 }
      : null;

    var em = U.lerp(0.75, 1, env.emphasis) * (st.headlineScale || 1);
    var weight = 600;

    function fit(text, borrowed) {
      var isSep = text.length === 1 && !/[a-z0-9]/i.test(text);
      var frac = isSep ? 0.18 : borrowed ? 0.5 : 0.96;
      var size = T.fill(ctx, text.toUpperCase(), st.titleFont,
        col.w * frac * em, -0.015, { weight: weight }, u(340));
      T.setFont(ctx, st.titleFont, size, { weight: weight });
      return {
        text: text.toUpperCase(), size: size, isSep: isSep, borrowed: borrowed,
        ink: T.inkBox(ctx, text.toUpperCase()),
        w: T.measure(ctx, text.toUpperCase(), size * -0.015)
      };
    }
    var sized = lines.map(function (t, i) { return fit(t, i >= borrowedFrom); });

    /* The two borrowed names are one unit and must read as one unit:
       fitted independently, a four-letter and a three-letter name land on
       different point sizes for no reason a reader could name. */
    var bSizes = sized.filter(function (l) { return l.borrowed && !l.isSep; })
      .map(function (l) { return l.size; });
    if (bSizes.length > 1) {
      var common = Math.min.apply(null, bSizes);
      sized.forEach(function (l) {
        if (!l.borrowed || l.isSep || l.size === common) return;
        l.size = common;
        T.setFont(ctx, st.titleFont, l.size, { weight: weight });
        l.ink = T.inkBox(ctx, l.text);
        l.w = T.measure(ctx, l.text, l.size * -0.015);
      });
    }

    /* ---------- where the picture goes ---------- */
    /* Between the last two lines, so the band bites the line above and
       the line below and the final word can be drawn over its edge. With
       one line there is nothing to thread through, so it becomes a band
       under the stack instead. */
    var wantBand = !wide && !env.micro;
    var gapAt = wantBand ? Math.max(0, sized.length - 2) : -1;

    var capW = env.micro ? 0 : (wide ? side.w : col.w * 0.72);
    var capH = (c.caption && !env.micro) ? PO.block(env, 0, 0, capW, [c.caption], {
      size: mic * 0.86, lead: 1.5, measure: true, font: st.bodyFont
    }) : 0;

    var footH = env.micro ? mic * 2.2 : mic * 3.4;
    var stackTop = m.top + (env.micro ? mic * 1.2 : mic * 2.6);
    var stackBottom = h - m.bottom - footH - (capH ? capH + mic * 1.4 : 0);
    var stackH = stackBottom - stackTop;

    var bandH = gapAt >= 0 ? U.clamp(stackH * 0.34, u(200), h * 0.3) : 0;
    var bandPad = gapAt >= 0 ? mic * 1.1 : 0;

    function bandBox() { return gapAt >= 0 && bandH > 0 ? bandH + bandPad * 2 : 0; }
    function typeTotal() {
      var t = 0;
      sized.forEach(function (l, i) {
        t += (l.ink.asc + l.ink.desc) + (i ? l.size * 0.08 : 0);
      });
      return t;
    }
    function rescale(k) {
      sized.forEach(function (l) {
        l.size *= k;
        T.setFont(ctx, st.titleFont, l.size, { weight: weight });
        l.ink = T.inkBox(ctx, l.text);
        l.w = T.measure(ctx, l.text, l.size * -0.015);
      });
    }

    /* Fit exactly, in that order: narrow the band first because the type
       is the point, then scale the type into whatever is left. Two rules
       here were each learned from a failure. Bailing out at a fixed size
       floor let the stack run past its box and print through the caption
       on square canvases — a "minimum size" is not a fit, it is a refusal
       to fit. And the band shrinks but never closes: collapsing it to
       zero when the page got tight meant the photograph was simply not
       drawn, which is the one thing a layout may never do. */
    var minBand = u(150);
    if (typeTotal() + bandBox() > stackH && bandH > minBand) {
      bandH = Math.max(minBand, bandH - (typeTotal() + bandBox() - stackH));
    }
    if (typeTotal() + bandBox() > stackH) {
      rescale(Math.max(0.22, (stackH - bandBox()) / typeTotal()));
    }
    var total = typeTotal() + bandBox();

    /* ---------- lay the stack out ---------- */
    var y = stackTop + Math.max(0, stackH - total) * (env.micro ? 0.5 : 0.3);
    var band = null;
    sized.forEach(function (l, i) {
      y += l.ink.asc;
      l.y = y;
      l.x = col.x;
      y += l.ink.desc + l.size * 0.08;
      if (i === gapAt) {
        band = { x: col.x, y: y + bandPad, w: col.w, h: bandH };
        y += bandH + bandPad * 2;
      }
    });
    if (wide) {
      var top0 = sized[0].y - sized[0].ink.asc;
      var bot0 = sized[sized.length - 1].y + sized[sized.length - 1].ink.desc;
      band = { x: side.x, y: top0, w: side.w, h: Math.max(u(220), bot0 - top0) };
    }

    /* the last real word crosses the picture, so it is drawn after it */
    var hot = -1;
    sized.forEach(function (l, i) { if (!l.isSep && !l.borrowed) hot = i; });
    if (hot < 0) sized.forEach(function (l, i) { if (!l.isSep) hot = i; });
    var crosses = band && hot === sized.length - 1 && gapAt === sized.length - 2;

    function drawLine(l, i) {
      ctx.save();
      ctx.fillStyle = (i === hot && sized.length > 1) ? accent : pal.text;
      T.setFont(ctx, st.titleFont, l.size, { weight: weight });
      T.draw(ctx, l.text, l.x, l.y, { align: 'left', tracking: l.size * -0.015 });
      ctx.restore();
    }

    sized.forEach(function (l, i) { if (!crosses || i !== hot) drawLine(l, i); });

    /* ---------- the picture ---------- */
    if (band) {
      /* bleed it into the neighbouring lines: an image that stops exactly
         at the type's edge is a third block, not a layer */
      var bleed = crosses ? mic * 0.85 : 0;
      var plate = {
        x: band.x, y: band.y - bleed,
        w: band.w, h: band.h + bleed * 2
      };
      if (env.hasPhoto) {
        env.drawPhoto(plate);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.42 * st.washStrength;
        ctx.fillStyle = pal.soft[0];
        ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
        ctx.restore();
      }
      /* a hairline on the two long edges — the reference's crop marks */
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, u(2));
      ctx.beginPath();
      ctx.moveTo(plate.x, plate.y);
      ctx.lineTo(plate.x + plate.w, plate.y);
      ctx.stroke();
      ctx.restore();
    }

    if (crosses) drawLine(sized[hot], hot);

    /* ---------- the numbered gutter ---------- */
    if (idxW) {
      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.5;
      var nSize = mic * 0.72;
      T.setFont(ctx, 'dmmono', nSize, {});
      sized.forEach(function (l, i) {
        if (l.isSep) return;
        T.draw(ctx, pad2(i + 1), m.left, l.y - l.ink.asc + nSize, {
          align: 'left', tracking: nSize * 0.12
        });
      });
      ctx.restore();
    }

    /* ---------- the numbered caption ---------- */
    if (capH) {
      var capX = wide ? side.x : col.x;
      var capY = (wide ? band.y + band.h + mic * 1.4
        : stackBottom + mic * 1.4) - (wide ? 0 : capH + mic * 1.4) + mic * 0.2;
      if (!wide) capY = stackBottom + mic * 0.2;
      if (idxW && !wide) {
        ctx.save();
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.85;
        var cSize = mic * 0.72;
        T.setFont(ctx, 'dmmono', cSize, {});
        T.draw(ctx, pad2(sized.length + 1), m.left, capY + cSize, {
          align: 'left', tracking: cSize * 0.12
        });
        ctx.restore();
      }
      PO.block(env, capX, capY, capW, [c.caption], {
        size: mic * 0.86, lead: 1.5, upper: false, alpha: 0.78, font: st.bodyFont
      });
    }

    /* ---------- edges ---------- */
    if (env.micro) {
      PO.microFoot(env, { m: m });
      return;
    }

    /* a rotated label up the right edge, like a gallery flyer */
    if (c.tags.length && st.showTags && !wide) {
      PO.sideLabel(env, c.tags.map(function (t) { return t.toUpperCase(); }).join('   ·   '), {
        m: m, size: mic * 0.7, y: h * 0.42, alpha: 0.55, color: pal.text
      });
    }

    /* top rail: the pair, and the monogram */
    PO.rail(env, m.top + mic * 0.6, [
      (st.showNames && c.names ? c.names : W.textstack.monogram(st)).toUpperCase(),
      null,
      'pairtone'
    ], { m: m, size: mic * 0.7, alpha: 0.5 });

    /* foot: a rule, then the date and the tags */
    var ruleY = h - m.bottom - mic * 1.5;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2));
    ctx.beginPath();
    ctx.moveTo(m.left, ruleY);
    ctx.lineTo(w - m.right, ruleY);
    ctx.stroke();
    ctx.restore();

    PO.rail(env, ruleY + mic * 1.3, [
      c.footnote ? c.footnote.toUpperCase() : null,
      null,
      (wide && c.tags.length && st.showTags)
        ? c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  ')
        : W.textstack.monogram(st)
    ], { m: m, size: mic * 0.74, alpha: 0.65 });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'editorial',
    label: 'Type',
    blurb: '글자가 곧 포스터. 번호가 매겨진 거대한 단어들 사이로 사진이 지나가요.',
    defaults: {
      titleFont: 'spacegrotesk', scriptFont: 'delafield', bodyFont: 'spacegrotesk',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.92,
      feather: 0, motifs: ['sparkle'], decoCount: 0,
      sideLabel: false, grain: 1.1, vignette: 0.04
    },
    draw: draw
  });
})(window.PT = window.PT || {});
