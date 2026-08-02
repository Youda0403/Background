/* LADDER — the pair name repeated down the page, once per weight, from a
   hairline outline to a solid slab; then a strip of boxed modules.

   Reference grammar: the CHROME MONO poster. What makes that page work is
   not the repetition, it is that everything sits on ONE spacing unit —
   the gap between ladder rungs, the gutter between boxes and the padding
   inside them are all the same number. Nothing is positioned; everything
   is a multiple.

   Two rules follow from the previous layout's failures:

   The name separator never gets its own line. A star fitted like a word
   ends up larger than the two names it joins. Names are one small line,
   set once, in a box.

   The picture is a MODULE, not an inset. A rectangle floating mid-page
   reads as something that fell on the design; the same rectangle reads as
   structure the moment other cells share its edges and its gutter. So the
   picture sits in a row of boxes and the row is ruled. With no photo the
   cell is not skipped — it takes the monogram set huge, which is what the
   reference does with its big C. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function box(ctx, x, y, w, h, color, alpha, lw) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, lw);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var accent = PO.accentOn(pal, pal.base);

    PO.paper(env, { tint: false });
    var m = PO.margins(env);

    /* THE spacing unit. Every gap on this page is g or a multiple. */
    var g = U.clamp(m.inner * 0.035, u(14), u(46));

    var word = (c.title || 'pairtone').replace(/\s+/g, ' ').trim().toUpperCase();
    var namesLine = (st.showNames && c.names) ? c.names.toUpperCase() : W.textstack.monogram(st);

    /* ---------- the module strip, measured from the foot up ---------- */
    var railH = mic * 1.5;
    var footY = h - m.bottom;
    var cellPad = g * 0.7;

    var capH = c.caption ? PO.block(env, 0, 0, m.inner * 0.5 - cellPad * 2, [c.caption], {
      size: mic * 0.8, lead: 1.5, measure: true, font: st.bodyFont
    }) : 0;
    var infoH = Math.max(capH + cellPad * 2, mic * 4.2);

    /* the picture row: as tall as it can be without starving the ladder */
    var top = m.top + railH + g;
    var infoTop = footY - railH - g - infoH;
    var avail = infoTop - top;

    var picH = env.micro ? 0 : U.clamp(avail * (wide ? 0.42 : 0.3), u(160), h * 0.3);
    var picTop = infoTop - g - picH;

    /* ---------- the ladder ---------- */
    var ladderH = picTop - g - top;
    var steps = [
      { mode: 'stroke', weight: 300, alpha: 0.32 },
      { mode: 'stroke', weight: 400, alpha: 0.55 },
      { mode: 'fill', weight: 400, alpha: 0.3 },
      { mode: 'fill', weight: 600, alpha: 0.62 },
      { mode: 'fill', weight: 800, alpha: 1, hot: true }
    ];
    var n = env.micro ? 3 : wide ? 4 : ladderH > h * 0.42 ? 5 : 4;
    /* the rungs are separated by the page unit, which does not shrink. On a
       short ladder band the gaps alone can eat the height, so drop rungs
       until they cannot. */
    while (n > 2 && g * (n - 1) > ladderH * 0.5) n--;
    steps = steps.slice(steps.length - n);

    /* One size for the whole ladder, fitted at the HEAVIEST weight so the
       widest rung still clears the measure. The lighter ones then run
       short of it, flush left — which is the ladder, and is also why the
       rhythm stays even instead of every rung being a different height. */
    var size = T.fill(ctx, word, st.titleFont, m.inner, -0.01,
      { weight: 800 }, u(300));
    T.setFont(ctx, st.titleFont, size, { weight: 800 });
    var ink = T.inkBox(ctx, word);
    var rungH = ink.asc + ink.desc;
    /* Only the glyphs may shrink. Scaling the whole stack, gaps included,
       leaves the total still over the band — which is how the accent rung
       ended up printing through the picture row on a landscape page. */
    var room = ladderH - g * (n - 1);
    if (rungH * n > room) {
      size *= room / (rungH * n);
      T.setFont(ctx, st.titleFont, size, { weight: 800 });
      ink = T.inkBox(ctx, word);
      rungH = ink.asc + ink.desc;
    }

    var y = top + Math.max(0, ladderH - (rungH * n + g * (n - 1))) * 0.5;
    steps.forEach(function (s, i) {
      T.setFont(ctx, st.titleFont, size, { weight: s.weight });
      ctx.save();
      ctx.globalAlpha = s.alpha;
      var col = s.hot ? accent : pal.text;
      if (s.mode === 'stroke') {
        ctx.lineWidth = Math.max(1, u(2));
        T.draw(ctx, word, m.left, y + ink.asc, {
          align: 'left', tracking: size * -0.01, stroke: col, strokeWidth: Math.max(1, u(2)), fill: false
        });
      } else {
        ctx.fillStyle = col;
        T.draw(ctx, word, m.left, y + ink.asc, { align: 'left', tracking: size * -0.01 });
      }
      ctx.restore();
      y += rungH + g;
      if (i === n - 1) y -= g;
    });

    /* ---------- the picture row ---------- */
    if (picH > 0) {
      var sideW = U.clamp(m.inner * 0.26, u(150), m.inner * 0.34);
      var picW = m.inner - sideW - g;
      var pic = { x: m.left, y: picTop, w: picW, h: picH };

      if (env.hasPhoto) {
        env.drawPhoto(pic);
      } else {
        /* Not a placeholder. An empty flat rectangle is exactly what reads
           as a missing image; a toned plate with the same washes the rest
           of the palette uses reads as a colour field that was always meant
           to be there. */
        ctx.save();
        ctx.beginPath();
        ctx.rect(pic.x, pic.y, pic.w, pic.h);
        ctx.clip();
        ctx.fillStyle = U.mix(pal.duo[0], pal.duo[1], 0.4);
        ctx.fillRect(pic.x, pic.y, pic.w, pic.h);
        P.wash(ctx, pic.x + pic.w * 0.24, pic.y + pic.h * 0.3, pic.h * 1.2,
          pal.soft[0], 0.6 * st.washStrength);
        P.wash(ctx, pic.x + pic.w * 0.82, pic.y + pic.h * 0.78, pic.h * 1.0,
          pal.soft[1] || pal.soft[0], 0.5 * st.washStrength);
        ctx.restore();
        /* the pair's own line, reversed out — the cell carries content
           either way, so the row never looks like it lost something */
        ctx.save();
        ctx.fillStyle = U.onColor(U.mix(pal.duo[0], pal.duo[1], 0.4));
        ctx.globalAlpha = 0.9;
        T.setFont(ctx, st.bodyFont, mic * 0.8, { weight: 500 });
        T.draw(ctx, namesLine.toUpperCase(), pic.x + cellPad, pic.y + pic.h - cellPad,
          { align: 'left', tracking: mic * 0.1 });
        ctx.restore();
      }
      box(ctx, pic.x, pic.y, pic.w, pic.h, pal.text, 0.5, u(1.4));

      /* the companion cell: a solid block with the monogram set large,
         so the row is two modules whatever the photo is doing */
      var mono = { x: m.left + picW + g, y: picTop, w: sideW, h: picH };
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.95;
      ctx.fillRect(mono.x, mono.y, mono.w, mono.h);
      ctx.restore();

      var initials = W.textstack.monogram(st) || word.charAt(0);
      var mSize = T.fit(ctx, initials, st.titleFont, mono.h * 0.62,
        mono.w - cellPad * 2, 0.02, { weight: 800 });
      T.setFont(ctx, st.titleFont, mSize, { weight: 800 });
      var mInk = T.inkBox(ctx, initials);
      ctx.save();
      ctx.fillStyle = U.onColor(accent);
      T.draw(ctx, initials, mono.x + mono.w / 2,
        mono.y + mono.h / 2 + (mInk.asc - mInk.desc) / 2,
        { align: 'center', tracking: mSize * 0.02 });
      ctx.restore();
    }

    /* ---------- the information row: equal cells, ruled ---------- */
    if (!env.micro) {
      var cells = [];
      if (c.caption) cells.push({ n: '01', body: c.caption, wide: true });
      if (c.footnote) cells.push({ n: '02', body: c.footnote, wide: false });
      if (st.showTags && c.tags.length) {
        cells.push({ n: '03', body: c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  '), wide: false });
      }
      if (!cells.length) cells.push({ n: '01', body: namesLine, wide: true });

      var units = cells.reduce(function (a, x) { return a + (x.wide ? 2 : 1); }, 0);
      var unitW = (m.inner - g * (cells.length - 1)) / units;
      var cx = m.left;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, u(2));
      ctx.beginPath();
      ctx.moveTo(m.left, infoTop);
      ctx.lineTo(w - m.right, infoTop);
      ctx.stroke();
      ctx.restore();

      cells.forEach(function (cell) {
        var cwid = unitW * (cell.wide ? 2 : 1);
        ctx.save();
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.9;
        T.setFont(ctx, 'dmmono', mic * 0.7, {});
        T.draw(ctx, cell.n, cx, infoTop + mic * 1.4, { align: 'left', tracking: mic * 0.08 });
        ctx.restore();
        PO.block(env, cx, infoTop + mic * 1.9, cwid - cellPad, [cell.body], {
          size: mic * 0.8, lead: 1.5, upper: false, alpha: 0.8, font: st.bodyFont
        });
        cx += cwid + g;
      });
    }

    /* ---------- rails ---------- */
    if (env.micro) {
      PO.microFoot(env, { m: m });
      return;
    }
    PO.rail(env, m.top + mic * 0.9, [namesLine, null, 'pairtone'],
      { m: m, size: mic * 0.72, alpha: 0.55 });
    PO.rail(env, footY - mic * 0.2, [word.toLowerCase(), null, W.textstack.monogram(st)],
      { m: m, size: mic * 0.72, alpha: 0.5 });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'ladder',
    label: 'Ladder',
    blurb: '페어명을 굵기별로 반복해 쌓고, 아래는 격자 모듈. 제일 정돈된 느낌.',
    defaults: {
      titleFont: 'spacegrotesk', scriptFont: 'delafield', bodyFont: 'dmmono',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.92,
      feather: 0, motifs: ['sparkle'], decoCount: 0,
      grain: 1.1, vignette: 0.03
    },
    draw: draw
  });
})(window.PT = window.PT || {});
