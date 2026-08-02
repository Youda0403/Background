/* SPINE — the pair name broken into single letters on a strict grid,
   running down a full-bleed field, with small text pinned at fixed
   anchors.

   Reference grammar: the "Stelis Osmia" poster. Its order comes from one
   thing: the letters are a TABLE. Every letter sits in an identical cell
   and is centred in it, so the spacing is inarguably even however many
   letters the name has — which is exactly what a wallpaper maker needs,
   since it cannot know the name in advance.

   The photograph is the ground, not an object. There is no box to look
   out of place, because there is no box: the picture fills the page and
   the letters sit on it. With no photo the ground becomes a deep duotone
   field, which is what the reference looks like anyway. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';

    /* ---------- the ground ---------- */
    var field = { x: 0, y: 0, w: w, h: h };
    if (env.hasPhoto) {
      env.drawPhoto(field);
    } else {
      ctx.fillStyle = U.mix(pal.duo[0], pal.base, 0.22);
      ctx.fillRect(0, 0, w, h);
      P.wash(ctx, w * 0.3, h * 0.28, env.S * 0.95, pal.soft[0], 0.5 * st.washStrength);
      P.wash(ctx, w * 0.78, h * 0.72, env.S * 0.85, pal.soft[1] || pal.soft[0], 0.42 * st.washStrength);
    }
    /* a veil so small type is legible over any photograph */
    var deep = U.mix(pal.duo[0], pal.duo[1], 0.32);
    ctx.save();
    ctx.globalAlpha = U.clamp(0.18 + st.scrim * 0.5, 0.18, 0.6);
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    var onField = U.onColor(deep);
    var accent = PO.accentOn(pal, deep);
    var m = PO.margins(env);

    /* ---------- the letter table ---------- */
    var word = (c.title || 'pairtone').replace(/\s+/g, '').toUpperCase();
    var letters = word.split('').slice(0, 18);

    var cols = env.micro ? 3 : wide ? 6 : env.tier === 'tablet' || env.tier === 'square' ? 4 : 3;
    var rows = Math.ceil(letters.length / cols);

    /* The band the table may occupy is whatever the text anchors leave,
       MEASURED — reserving a guessed constant is how the letters ended up
       printed through the caption. */
    var blockW = U.clamp(m.inner * (wide ? 0.26 : 0.44), u(220), m.inner * 0.5);
    function anchorH(lead, body) {
      var t = lead ? mic * 1.9 : 0;
      if (body) {
        t += PO.block(env, 0, 0, blockW, [body], {
          size: mic * 0.78, lead: 1.5, measure: true, font: st.bodyFont
        });
      }
      return t;
    }
    var headAnchor = env.micro ? 0
      : anchorH((st.showNames && c.names) || W.textstack.monogram(st), c.caption);
    var footAnchor = env.micro || !c.footnote ? 0
      : anchorH(c.footnote, st.showTags && c.tags.length
        ? c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  ') : '');

    var tableTop = m.top + (env.micro ? mic * 1.4 : mic * 0.2 + headAnchor + mic * 1.4);
    var tableBottom = h - m.bottom - (env.micro ? mic * 1.6 : mic * 2.6 + footAnchor);
    var cellH = (tableBottom - tableTop) / rows;
    var cellW = m.inner / cols;

    /* one size for every letter — a table where the cells match but the
       glyphs do not is not a table */
    var size = Math.min(cellW * 0.82, cellH * 0.9);
    letters.forEach(function (ch) {
      size = Math.min(size, T.fit(ctx, ch, st.titleFont, size, cellW * 0.82, 0, { weight: 500 }));
    });

    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    var lInk = T.inkBox(ctx, 'H');

    ctx.save();
    ctx.fillStyle = onField;
    ctx.globalAlpha = 0.92;
    letters.forEach(function (ch, i) {
      var r = Math.floor(i / cols), col = i % cols;
      /* the final row is short by whatever the name does not divide into.
         Left-aligning it leaves a hole the size of the missing cells at the
         page corner; centring it keeps the letter-to-letter pitch exactly
         the same and puts the shortfall on both sides, which reads as a
         last line rather than as a gap. */
      var inRow = Math.min(cols, letters.length - r * cols);
      var cx = m.left + cellW * (col + 0.5) + cellW * (cols - inRow) / 2;
      var cy = tableTop + cellH * (r + 0.5) + (lInk.asc - lInk.desc) / 2;
      T.setFont(ctx, st.titleFont, size, { weight: 500 });
      T.draw(ctx, ch, cx, cy, { align: 'center', tracking: 0 });
    });
    ctx.restore();

    if (env.micro) {
      PO.microFoot(env, { m: m, color: onField });
      return;
    }

    /* ---------- text pinned at fixed anchors ----------
       Always in the same places, each a bold lead-in over a small block.
       Fixed anchors are what keeps a page of scattered text from looking
       scattered. */
    function anchor(x, y, lead, body, align) {
      var yy = y;
      if (lead) {
        ctx.save();
        ctx.fillStyle = onField;
        ctx.globalAlpha = 0.95;
        T.setFont(ctx, st.bodyFont, mic * 1.05, { weight: 700 });
        T.draw(ctx, lead, align === 'right' ? x + blockW : x, yy + mic, {
          align: align || 'left', tracking: mic * 0.01
        });
        ctx.restore();
        yy += mic * 1.9;
      }
      if (body) {
        PO.block(env, x, yy, blockW, [body], {
          size: mic * 0.78, lead: 1.5, upper: false, alpha: 0.78,
          font: st.bodyFont, color: onField, align: align || 'left'
        });
      }
    }

    anchor(m.left, m.top + mic * 0.2,
      (st.showNames && c.names) ? c.names : W.textstack.monogram(st),
      c.caption, 'left');

    if (c.footnote) {
      anchor(w - m.right - blockW, tableBottom + mic * 1.0, c.footnote,
        st.showTags && c.tags.length
          ? c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  ')
          : '', 'right');
    }

    /* the species-label rail the reference runs across its head */
    PO.rail(env, m.top + mic * 0.2, [null, null, (c.title || 'pairtone').replace(/\n/g, ' ')],
      { m: m, size: mic * 0.9, alpha: 0.9, color: onField, font: st.bodyFont });

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2));
    ctx.beginPath();
    ctx.moveTo(m.left, h - m.bottom - mic * 1.2);
    ctx.lineTo(w - m.right, h - m.bottom - mic * 1.2);
    ctx.stroke();
    ctx.restore();

    PO.rail(env, h - m.bottom + mic * 0.1,
      [W.textstack.monogram(st), null, 'pairtone'],
      { m: m, size: mic * 0.72, alpha: 0.7, color: onField });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'spine',
    label: 'Spine',
    blurb: '이름을 한 글자씩 격자에 앉히고 사진을 배경으로 꽉 채워요. 무드 있는 쪽.',
    defaults: {
      titleFont: 'bodoni', scriptFont: 'delafield', bodyFont: 'spacegrotesk',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.95,
      feather: 0, scrim: 0.3, motifs: ['sparkle'], decoCount: 0,
      grain: 1.5, vignette: 0.12
    },
    draw: draw
  });
})(window.PT = window.PT || {});
