/* COLUMN — a cyanotype-ish photo field with a paper column of dense
   little type pinned along one edge: title, an etymology line built from
   the two names, the caption set as a block, and a footnote at the foot.
   Reference grammar: the "overfeel" dictionary poster. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content, rand = env.rand;

    /* ---- the photo field fills everything ---- */
    var field = { x: 0, y: 0, w: w, h: h };
    if (env.hasPhoto) {
      env.drawPhoto(field);
    } else {
      ctx.fillStyle = U.mix(pal.duo[0], pal.base, 0.35);
      ctx.fillRect(0, 0, w, h);
      P.wash(ctx, w * 0.3, h * 0.3, env.S * 0.9, pal.soft[0], 0.5 * st.washStrength);
      P.wash(ctx, w * 0.8, h * 0.75, env.S * 0.8, pal.soft[1] || pal.soft[0], 0.4 * st.washStrength);
    }

    var m = PO.margins(env);
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var onField = U.onColor(U.mix(pal.duo[0], pal.duo[1], 0.4));
    /* the column is a card of paper, not a tinted panel — on a dark
       palette `pal.base` put a navy box on a navy field and the card
       vanished */
    var card = PO.stock(pal);
    /* the card is light even when the page is dark, so the accent has to
       be resolved against the card, not against the palette's page */
    var accent = PO.accentOn(pal, card.paper);

    if (env.micro) {
      /* a watch face gets the title alone, centred on the field */
      PO.headline(env, { x: m.left, y: env.band.top + (env.band.bottom - env.band.top) * 0.34, w: m.inner },
        { align: 'center', color: onField, maxH: h * 0.34 });
      PO.microFoot(env, { m: m, color: onField });
      return;
    }

    /* ---- the paper column, sized to its own contents ---- */
    var colW = w * (wide ? 0.34 : env.tier === 'tablet' || env.tier === 'square' ? 0.4 : 0.46);
    var pad = u(30);
    var inner = colW - pad * 2;
    var bandH = env.band.bottom - env.band.top;

    /* Build the parts first and measure them, so the column can be as tall
       as it needs to be. A full-height column with a short caption left a
       large empty panel, which read as a mistake rather than as space. */
    var title = (c.title || 'pairtone').replace(/\n/g, ' ').toLowerCase();
    var tSize = T.fit(ctx, title, st.titleFont, inner * 0.34, inner, 0.04, {});

    var etym = [];
    var a = st.nameA.trim(), b = st.nameB.trim();
    if (a || b) etym.push('etymology:  from ' + (a || '—').toLowerCase() + '  +  ' + (b || '—').toLowerCase());
    if (c.footnote) etym.push('together:  ' + c.footnote.toLowerCase());

    var etymH = etym.length ? PO.block(env, 0, 0, inner, etym, {
      size: mic * 0.9, lead: 1.6, measure: true, font: 'dmmono'
    }) : 0;
    var capH = c.caption ? PO.block(env, 0, 0, inner, [c.caption], {
      size: mic * 0.92, lead: 1.55, measure: true, font: st.bodyFont
    }) : 0;
    var simLine = c.tags[0] ? 'similar to ' + c.tags[0].toLowerCase() : '';
    var simH = simLine ? mic * 1.9 : 0;
    var divH = mic * 2.1;
    var namesH = (st.showNames && c.names) ? mic * 2.6 : 0;

    var contentH = pad + tSize * 1.5 + (etymH ? etymH + mic * 0.9 : 0)
      + divH + (capH ? capH + mic : 0) + simH + namesH + pad;
    var colH = Math.min(bandH, Math.max(contentH, bandH * 0.5));

    var col = {
      x: w - colW - m.right * 0.5,
      y: env.band.top + (bandH - colH) * 0.42,
      w: colW, h: colH
    };

    /* ---- silhouettes floating on the field ----
       Scattered across the open half with the card as a keep-out zone.
       They used to be placed on the PERIMETER of an invisible box two
       thirds of the page wide, which is a ring the eye can see even
       though the box cannot be: the marks lined up along the trim and
       again down an empty vertical near the card's edge, and read as
       something aligned to nothing. */
    W.deco.scatter(env, {
      kinds: st.motifs,
      colors: [onField],
      hero: accent,
      avoid: [{ x: col.x - u(26), y: col.y - u(26), w: col.w + u(52), h: col.h + u(52) }],
      rMin: 18, rMax: 46, bigRatio: 0.24,
      alphaMin: 0.3, alphaMax: 0.62,
      pad: u(70)
    });

    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = card.paper;
    ctx.fillRect(col.x, col.y, col.w, col.h);
    ctx.restore();

    var cx = col.x + pad;
    var y = col.y + pad;

    /* title, tracked wide like a dictionary headword */
    T.setFont(ctx, st.titleFont, tSize, {});
    ctx.save();
    ctx.fillStyle = card.ink;
    var tb = T.draw(ctx, title, cx, y + tSize * 0.82, { align: 'left', tracking: tSize * 0.04 });
    T.rule(ctx, tb, tSize * 0.34, Math.max(1, u(1.8)), accent, 0.95);
    ctx.restore();
    y += tSize * 1.5;

    if (etymH) {
      PO.block(env, cx, y, inner, etym, {
        size: mic * 0.9, lead: 1.6, upper: false, alpha: 0.85, font: 'dmmono', tracking: 0.02,
        color: card.sub
      });
      y += etymH + mic * 0.9;
    }

    /* a quiet divider: hairline, three small sparkles at its centre */
    ctx.save();
    ctx.strokeStyle = card.ink;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(1, u(1.2));
    var dy = y + mic * 0.9;
    var sw = mic * 2.6;
    ctx.beginPath();
    ctx.moveTo(cx, dy);
    ctx.lineTo(cx + inner / 2 - sw, dy);
    ctx.moveTo(cx + inner / 2 + sw, dy);
    ctx.lineTo(cx + inner, dy);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = accent;
    [-1, 0, 1].forEach(function (k) {
      P.sparkle(ctx, cx + inner / 2 + k * mic * 1.5, dy, mic * (k ? 0.42 : 0.6), 0.16);
      ctx.fill();
    });
    ctx.restore();
    y += divH;

    if (capH) {
      PO.block(env, cx, y, inner, [c.caption], {
        size: mic * 0.92, lead: 1.55, upper: false, alpha: 0.88, font: st.bodyFont,
        color: card.ink
      });
      y += capH + mic;
    }

    if (simH) {
      ctx.save();
      ctx.fillStyle = card.sub;
      ctx.globalAlpha = 0.85;
      T.setFont(ctx, 'dmmono', mic * 0.85, {});
      var sb = T.draw(ctx, simLine, cx, y + mic * 0.85, { align: 'left', tracking: mic * 0.06 });
      /* underline only the borrowed word, like a cross-reference */
      var lead = T.measure(ctx, 'similar to ', mic * 0.06);
      T.rule(ctx, { x: sb.x + lead, y: sb.y, w: sb.w - lead }, mic * 0.3,
        Math.max(1, u(1.6)), accent, 1);
      ctx.restore();
      y += simH;
    }

    if (namesH) {
      PO.block(env, cx, col.y + col.h - pad - mic * 1.6, inner, [c.names], {
        size: mic * 0.95, lead: 1.4, alpha: 0.9, font: 'dmmono', tracking: 0.14,
        color: accent
      });
    }

    /* ---- field-side furniture ---- */
    var fieldW = col.x - m.left - u(56);
    if (fieldW > u(200)) {
      PO.block(env, m.left, col.y + col.h - mic * 2.4, fieldW,
        ['please note, this poster is about: ' + (c.tags[0] || 'us')], {
          size: mic * 0.88, lead: 1.4, upper: false, alpha: 0.85,
          color: onField, font: 'dmmono', tracking: 0.1
        });
    }
    PO.tagRail(env, col.y - mic * 0.6, { m: m, size: mic * 0.86, alpha: 0.7, color: onField, align: 'left' });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'column',
    label: 'Column',
    blurb: '사전 같은 종이 칼럼 + 꽉 찬 사진. 차분하고 지적인 무드.',
    deco: true,
    defaults: {
      titleFont: 'dmserif', scriptFont: 'petitformal', bodyFont: 'spacemono',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.95,
      feather: 0, motifs: ['sparkle'], decoCount: 4,
      grain: 1.3, vignette: 0.05
    },
    draw: draw
  });
})(window.PT = window.PT || {});
