/* SPINE — the pair name broken into single letters on a strict table over
   a full-bleed field, the rows growing in weight as they descend, closing
   on a solid accent module; then a ruled strip of numbered cells.

   Two grammars, merged.

   From the letter table: every letter sits in an identical cell and is
   centred in it, so the spacing is inarguably even however many letters
   the name has — which is what a wallpaper maker needs, since it cannot
   know the name in advance. The photograph is the ground, not an object.
   There is no box to look out of place because there is no box: the
   picture fills the page and the letters sit on it.

   From the ladder: nothing is positioned, everything is a multiple of one
   spacing unit `g`; the rows run from a hairline outline to a solid slab,
   so the eye is walked down the page instead of being handed a flat block;
   and the information at the foot is a ruled row of equal numbered cells
   rather than paragraphs pinned wherever there was room.

   The table's last item is always the accent module, never a letter. That
   settles two things at once: the palette gets somewhere with real area to
   land, and the row the name does not divide into ends on a deliberate
   block instead of trailing off into empty cells. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';

    var m = PO.margins(env);
    /* THE spacing unit. Every gap on this page is g or a multiple. */
    var g = U.clamp(m.inner * 0.035, u(14), u(46));

    /* ---------- the ground ---------- */
    var deep = U.mix(pal.duo[0], pal.duo[1], 0.32);
    if (env.hasPhoto) {
      env.drawPhoto({ x: 0, y: 0, w: w, h: h });
    } else {
      ctx.fillStyle = U.mix(pal.duo[0], pal.base, 0.22);
      ctx.fillRect(0, 0, w, h);
      P.wash(ctx, w * 0.3, h * 0.28, env.S * 0.95, pal.soft[0], 0.5 * st.washStrength);
      P.wash(ctx, w * 0.78, h * 0.72, env.S * 0.85, pal.soft[1] || pal.soft[0], 0.42 * st.washStrength);
    }
    /* a veil so small type is legible over any photograph */
    ctx.save();
    ctx.globalAlpha = U.clamp(0.18 + st.scrim * 0.5, 0.18, 0.6);
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    /* An even veil is the wrong shape for this page. The rails and the
       information cells are set at the two ends, where an uploaded
       photograph is as likely to be sky as it is to be shadow, while the
       middle is where the picture should still be a picture. So the veil
       is weighted to the ends and left alone through the centre. */
    if (env.hasPhoto) {
      ctx.save();
      var top = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      top.addColorStop(0, U.rgba(deep, 0.42));
      top.addColorStop(1, U.rgba(deep, 0));
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, w, h * 0.3);
      var bot = ctx.createLinearGradient(0, h * 0.62, 0, h);
      bot.addColorStop(0, U.rgba(deep, 0));
      bot.addColorStop(1, U.rgba(deep, 0.55));
      ctx.fillStyle = bot;
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.restore();
    }

    var onField = U.onColor(deep);
    var accent = PO.accentOn(pal, deep);

    /* ---------- what goes in the table ---------- */
    var word = (c.title || 'pairtone').replace(/\s+/g, '').toUpperCase();
    var letters = word.split('').slice(0, 17);
    var initials = W.textstack.monogram(st) || word.charAt(0);
    var namesLine = (st.showNames && c.names) ? c.names : initials;

    var cols = env.micro ? 3 : wide ? 6 : env.tier === 'tablet' || env.tier === 'square' ? 4 : 3;
    var count = letters.length + 1;                 /* + the accent module */
    var rows = Math.ceil(count / cols);

    /* ---------- the foot, measured before the table is given its band --- */
    var cells = [];
    if (c.caption) cells.push(c.caption);
    if (c.footnote) cells.push(c.footnote);
    if (st.showTags && c.tags.length) {
      cells.push(c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  '));
    }
    if (!cells.length) cells.push(namesLine);
    cells = cells.slice(0, 3);

    var n = cells.length;
    var cellGut = g;
    var footCellW = (m.inner - cellGut * (n - 1)) / n;
    var footBodyH = 0;
    if (!env.micro) {
      cells.forEach(function (body) {
        footBodyH = Math.max(footBodyH, PO.block(env, 0, 0, footCellW, [body], {
          size: mic * 0.78, lead: 1.5, upper: false, measure: true, font: st.bodyFont
        }));
      });
    }

    var bottomRail = mic * 2.1;
    var footH = env.micro ? 0 : mic * 1.9 + footBodyH;
    var footTop = h - m.bottom - bottomRail - footH;

    var tableTop = m.top + (env.micro ? mic * 0.6 : mic * 1.6 + g);
    var tableBottom = env.micro ? h - m.bottom - mic * 1.8 : footTop - g;

    var cellH = (tableBottom - tableTop) / rows;
    var cellW = m.inner / cols;

    /* one size for every letter — a table where the cells match but the
       glyphs do not is not a table */
    var size = Math.min(cellW * 0.82, cellH * 0.86);
    letters.forEach(function (ch) {
      size = Math.min(size, T.fit(ctx, ch, st.titleFont, size, cellW * 0.82, 0, { weight: 500 }));
    });

    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    var lInk = T.inkBox(ctx, 'H');

    /* the centre of item i's cell, with the short final row centred so the
       shortfall falls on both sides rather than as a hole at the corner */
    function cellAt(i) {
      var r = Math.floor(i / cols), col = i % cols;
      var inRow = Math.min(cols, count - r * cols);
      return {
        r: r,
        cx: m.left + cellW * (col + 0.5) + cellW * (cols - inRow) / 2,
        cy: tableTop + cellH * (r + 0.5)
      };
    }

    /* ---------- the letters, walked from outline to solid ---------- */
    letters.forEach(function (ch, i) {
      var p = cellAt(i);
      var t = rows > 1 ? p.r / (rows - 1) : 1;
      /* the top rows are drawn as outlines and the bottom rows solid. Over
         a photograph an outline still has to carry, so it never thins past
         0.6 and never goes under two device pixels. */
      var stroke = rows >= 3 && t < 0.5;
      ctx.save();
      T.setFont(ctx, st.titleFont, size, { weight: Math.round(U.lerp(400, 800, t)) });
      if (stroke) {
        ctx.globalAlpha = U.lerp(0.78, 0.95, t * 2);
        T.draw(ctx, ch, p.cx, p.cy + (lInk.asc - lInk.desc) / 2, {
          align: 'center', tracking: 0,
          stroke: onField, strokeWidth: Math.max(2, u(2.4)), fill: false
        });
      } else {
        ctx.globalAlpha = rows >= 3 ? U.lerp(0.88, 1, (t - 0.5) * 2) : 0.95;
        ctx.fillStyle = onField;
        T.draw(ctx, ch, p.cx, p.cy + (lInk.asc - lInk.desc) / 2, { align: 'center', tracking: 0 });
      }
      ctx.restore();
    });

    /* ---------- the accent module, always the table's last cell -------- */
    var mp = cellAt(count - 1);
    var side = Math.min(cellW, cellH) * 0.8;
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.95;
    ctx.fillRect(mp.cx - side / 2, mp.cy - side / 2, side, side);
    ctx.restore();

    var iSize = T.fit(ctx, initials, st.titleFont, side * 0.42, side * 0.72, 0.04, { weight: 700 });
    T.setFont(ctx, st.titleFont, iSize, { weight: 700 });
    var iInk = T.inkBox(ctx, initials);
    ctx.save();
    ctx.fillStyle = U.onColor(accent);
    T.draw(ctx, initials, mp.cx, mp.cy + (iInk.asc - iInk.desc) / 2,
      { align: 'center', tracking: iSize * 0.04 });
    ctx.restore();

    if (env.micro) {
      PO.microFoot(env, { m: m, color: onField });
      return;
    }

    /* ---------- the head rail ---------- */
    PO.rail(env, m.top + mic * 0.9, [namesLine, null, (c.title || 'pairtone').replace(/\n/g, ' ')],
      { m: m, size: mic * 0.8, alpha: 0.8, color: onField, font: st.bodyFont });

    /* ---------- the information row: equal cells, ruled ---------- */
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2.5));
    ctx.beginPath();
    ctx.moveTo(m.left, footTop);
    ctx.lineTo(w - m.right, footTop);
    ctx.stroke();
    ctx.restore();

    cells.forEach(function (body, i) {
      var x = m.left + (footCellW + cellGut) * i;
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.95;
      T.setFont(ctx, 'dmmono', mic * 0.68, {});
      T.draw(ctx, '0' + (i + 1), x, footTop + mic * 1.3, { align: 'left', tracking: mic * 0.08 });
      ctx.restore();
      PO.block(env, x, footTop + mic * 1.9, footCellW, [body], {
        size: mic * 0.78, lead: 1.5, upper: false, alpha: 0.8,
        font: st.bodyFont, color: onField
      });
    });

    /* the title with its spaces back — `word` has them stripped so the
       table can treat the name as a run of letters */
    PO.rail(env, h - m.bottom - mic * 0.2,
      [(c.title || 'pairtone').replace(/\s+/g, ' ').trim().toLowerCase(), null, 'pairtone'],
      { m: m, size: mic * 0.72, alpha: 0.6, color: onField });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'spine',
    label: 'Spine',
    blurb: '이름을 한 글자씩 격자에 앉히고 사진을 배경으로 꽉 채워요. 아래로 갈수록 굵어지고, 끝은 강조색 블록.',
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
