/* BAND — the page cut into horizontal strata on one row unit, with the
   picture as a full-bleed stripe rather than an inset box.

   This layout exists to answer one complaint directly: a rectangle set
   inside the margins mid-page always reads as something that fell onto the
   design. The fix is not to shrink it or move it — it is to run it edge to
   edge. A stripe that touches both trims is structure; the eye files it
   with the page, not with the objects on the page.

   Everything vertical is a multiple of ONE row unit `rh`:

       rail   1 row     names, year
       title  4 rows    one grid row per line, so the leading IS the unit
       band   5 rows    full bleed — photograph, or a toned field
       info   2 rows    equal cells, numbered, split by hairlines
       foot   1 row

   Because the title's leading and every region boundary are the same
   number times an integer, the spacing cannot drift — there is no place
   left to put an arbitrary gap.

   With no photograph the band does not disappear and does not turn into a
   placeholder: it becomes a duotone field carrying the same monogram in
   the same place. The composition is identical either way, which is the
   whole point of putting the picture in a stripe. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var accent = PO.accentOn(pal, pal.base);

    PO.paper(env, { tint: false });
    var m = PO.margins(env);

    /* ---------- the row grid ---------- */
    var spans = env.micro
      ? { rail: 0, title: 4, band: 4, info: 0, foot: 0 }
      : wide
        ? { rail: 1, title: 3, band: 6, info: 2, foot: 1 }
        : { rail: 1, title: 4, band: 5, info: 2, foot: 1 };

    var total = spans.rail + spans.title + spans.band + spans.info + spans.foot;
    var gridTop = m.top;
    var rh = (h - m.top - m.bottom) / total;

    var yRail = gridTop;
    var yTitle = yRail + rh * spans.rail;
    var yBand = yTitle + rh * spans.title;
    var yInfo = yBand + rh * spans.band;
    var yFoot = yInfo + rh * spans.info;

    var namesLine = (st.showNames && c.names) ? c.names : W.textstack.monogram(st);
    var initials = W.textstack.monogram(st) || (c.title || 'P').charAt(0).toUpperCase();

    /* ---------- the title: one grid row per line ---------- */
    var txt = PO.headlineText(env);
    var lines = (txt.lines || []).filter(Boolean);
    if (!lines.length) lines = [namesLine || 'pairtone'];
    lines = lines.slice(0, spans.title);

    /* the title zone is divided exactly by its line count, so the leading
       is one constant for the whole block however many lines there are */
    var lineH = rh * spans.title / lines.length;

    /* ONE size for every line — the widest line sets it, so the block is a
       column of equal capitals rather than a ragged fan */
    var size = lineH * 0.78;
    lines.forEach(function (l) {
      size = Math.min(size, T.fit(ctx, l.toUpperCase(), st.titleFont, size, m.inner, -0.015, { weight: 500 }));
    });
    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    var ink = T.inkBox(ctx, 'H');

    ctx.save();
    ctx.fillStyle = pal.text;
    lines.forEach(function (l, i) {
      /* seated on the row's optical centre — identical offset every line */
      var cy = yTitle + lineH * (i + 0.5) + (ink.asc - ink.desc) / 2;
      T.setFont(ctx, st.titleFont, size, { weight: 500 });
      ctx.globalAlpha = i === lines.length - 1 && lines.length > 1 ? 1 : 0.92;
      T.draw(ctx, l.toUpperCase(), m.left, cy, { align: 'left', tracking: size * -0.015 });
    });
    ctx.restore();

    /* ---------- the band: full bleed, always the same shape ---------- */
    var band = { x: 0, y: yBand, w: w, h: rh * spans.band };
    if (env.hasPhoto) {
      env.drawPhoto(band);
    } else {
      ctx.save();
      ctx.fillStyle = U.mix(pal.duo[0], pal.duo[1], 0.35);
      ctx.fillRect(band.x, band.y, band.w, band.h);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(band.x, band.y, band.w, band.h);
      ctx.clip();
      P.wash(ctx, w * 0.22, band.y + band.h * 0.3, band.h * 1.1, pal.soft[0], 0.55 * st.washStrength);
      P.wash(ctx, w * 0.8, band.y + band.h * 0.75, band.h * 0.95,
        pal.soft[1] || pal.soft[0], 0.45 * st.washStrength);
      ctx.restore();
    }

    var bandInk = U.onColor(U.mix(pal.duo[0], pal.duo[1], 0.35));

    /* a scrim under the monogram only — a photograph can be any brightness
       on the right, a flat field never needs the help */
    if (env.hasPhoto) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(band.x, band.y, band.w, band.h);
      ctx.clip();
      var gr = ctx.createLinearGradient(w * 0.42, 0, w, 0);
      var deep = U.mix(pal.duo[0], pal.duo[1], 0.35);
      gr.addColorStop(0, U.rgba(deep, 0));
      gr.addColorStop(1, U.rgba(deep, 0.72));
      ctx.fillStyle = gr;
      ctx.fillRect(band.x, band.y, band.w, band.h);
      ctx.restore();
    }

    /* the monogram, same place whatever the band is carrying */
    var mSize = T.fit(ctx, initials, st.titleFont, band.h * 0.56,
      m.inner * 0.42, 0.04, { weight: 700 });
    T.setFont(ctx, st.titleFont, mSize, { weight: 700 });
    var mInk = T.inkBox(ctx, initials);
    ctx.save();
    ctx.fillStyle = bandInk;
    ctx.globalAlpha = 0.95;
    T.draw(ctx, initials, w - m.right, band.y + band.h / 2 + (mInk.asc - mInk.desc) / 2,
      { align: 'right', tracking: mSize * 0.04 });
    ctx.restore();

    /* hairlines on both trims of the stripe, full width — these are what
       make it read as a stratum rather than a picture */
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2.5));
    ctx.beginPath();
    ctx.moveTo(0, band.y); ctx.lineTo(w, band.y);
    ctx.moveTo(0, band.y + band.h); ctx.lineTo(w, band.y + band.h);
    ctx.stroke();
    ctx.restore();

    if (env.micro) {
      PO.microFoot(env, { m: m });
      return;
    }

    /* ---------- the head rail ---------- */
    PO.rail(env, yRail + rh * 0.68, [namesLine, null, c.footnote || 'pairtone'],
      { m: m, size: mic * 0.76, alpha: 0.6 });

    /* ---------- the information row: equal cells, hairline splits ------- */
    var cells = [];
    if (c.caption) cells.push(c.caption);
    if (c.footnote) cells.push(c.footnote);
    if (st.showTags && c.tags.length) {
      cells.push(c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  '));
    }
    if (!cells.length) cells.push(namesLine);
    cells = cells.slice(0, 3);

    /* the horizontal gutter is measured off the measure, not off the row
       height — on a landscape page the row is short and a row-derived
       gutter closes up until the cells touch */
    var n = cells.length;
    var gut = U.clamp(m.inner * 0.035, u(16), u(52));
    var cellW = (m.inner - gut * (n - 1)) / n;

    cells.forEach(function (body, i) {
      var x = m.left + (cellW + gut) * i;
      if (i) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = pal.text;
        ctx.lineWidth = Math.max(1, u(1.2));
        ctx.beginPath();
        ctx.moveTo(x - gut / 2, yInfo + rh * 0.34);
        ctx.lineTo(x - gut / 2, yFoot - rh * 0.24);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.9;
      T.setFont(ctx, 'dmmono', mic * 0.68, {});
      T.draw(ctx, '0' + (i + 1), x, yInfo + rh * 0.34 + mic * 0.68,
        { align: 'left', tracking: mic * 0.08 });
      ctx.restore();
      PO.block(env, x, yInfo + rh * 0.34 + mic * 1.15, cellW, [body], {
        size: mic * 0.78, lead: 1.5, upper: false, alpha: 0.78, font: st.bodyFont
      });
    });

    /* ---------- the foot ---------- */
    PO.rail(env, yFoot + rh * 0.72,
      [(c.title || 'pairtone').replace(/\n/g, ' ').toLowerCase(), null, initials],
      { m: m, size: mic * 0.72, alpha: 0.5 });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'band',
    label: 'Band',
    blurb: '사진이 화면을 가로질러 통째로 지나가는 띠가 돼요. 여백 리듬이 제일 규칙적인 쪽.',
    defaults: {
      titleFont: 'bodoni', scriptFont: 'delafield', bodyFont: 'dmmono',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.9,
      feather: 0, motifs: ['sparkle'], decoCount: 0,
      grain: 1.1, vignette: 0.04
    },
    draw: draw
  });
})(window.PT = window.PT || {});
