/* PAPER — dotted or graph stationery, a tinted card, halftone photo,
   line-art stars. Passes as a notebook page. */
(function (W) {
  'use strict';
  var P = W.prim, U = W.util, D = W.deco, TS = W.textstack, C = W.compose, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, rand = env.rand;

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    /* --- stationery --- */
    if (st.paperStyle === 'dots') {
      P.dotPaper(ctx, w, h, u(46), u(3.4), pal.inks[3] || pal.inks[1], 0.5 * env.decoAlpha);
    } else if (st.paperStyle === 'grid') {
      P.gridPaper(ctx, w, h, u(42), Math.max(1, u(1.4)), pal.inks[1], 0.3 * env.decoAlpha);
    } else if (st.paperStyle === 'lines') {
      ctx.save();
      ctx.globalAlpha = 0.28 * env.decoAlpha;
      ctx.strokeStyle = pal.inks[1];
      ctx.lineWidth = Math.max(1, u(1.4));
      ctx.beginPath();
      for (var ly = u(120); ly < h; ly += u(72)) { ctx.moveTo(0, ly); ctx.lineTo(w, ly); }
      ctx.stroke();
      ctx.restore();
    }

    var g = C.place(env, {
      margin: 108,
      widthFrac: { tall: 0.62, phone: 0.66, tablet: 0.54, square: 0.6, wide: 0.42 },
      gap: 96,
      bias: 0.44
    });

    /* --- tinted card behind the content --- */
    if (st.cardStyle !== 'none' && (g.photo || g.textH)) {
      var pad = u(72);
      var cx0 = Math.min(g.photo ? g.photo.x : Infinity, g.text.x) - pad;
      var cy0 = (g.photo ? g.photo.y : g.text.y) - pad * 1.1;
      var cx1 = Math.max(g.photo ? g.photo.x + g.photo.w : -Infinity, g.text.x + g.text.w) + pad;
      var cy1 = g.text.y + (g.textH || 0) + pad * 1.2;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = pal.soft[0];
      if (st.cardStyle === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse((cx0 + cx1) / 2, (cy0 + cy1) / 2, (cx1 - cx0) / 2 * 1.06,
          (cy1 - cy0) / 2 * 1.08, 0, 0, P.TAU);
        ctx.fill();
      } else {
        P.roundRect(ctx, cx0, cy0, cx1 - cx0, cy1 - cy0,
          st.cardStyle === 'square' ? u(4) : u(28));
        ctx.fill();
      }
      ctx.restore();
    }

    /* --- beaded swirl, upper-left negative space --- */
    if (st.swirl) {
      var sp = P.spiralPts(w * (env.tier === 'wide' ? 0.14 : 0.2),
        h * (env.tier === 'wide' ? 0.2 : 0.14),
        u(18), u(150), 2.2, 220, 0.62);
      P.dottedPath(ctx, sp, u(4.6), u(15), pal.inks[1], 0.5 * env.decoAlpha);
    }

    /* --- photo --- */
    if (g.photo) env.drawPhoto(g.photo);

    /* thin keyline around panel-ish frames — very stationery */
    if (g.photo && st.photoRing && /rect|card|full/.test(st.photoShape)) {
      ctx.save();
      ctx.globalAlpha = 0.55 * env.decoAlpha;
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = Math.max(1, u(2));
      P.roundRect(ctx, g.photo.x, g.photo.y, g.photo.w, g.photo.h,
        st.photoShape === 'card' ? Math.min(g.photo.w, g.photo.h) * 0.12 : u(3));
      ctx.stroke();
      ctx.restore();
    }

    /* --- type --- */
    TS.drawStack(env, g.text, { captionItalic: true });

    /* --- top label, borrowed from the first tag --- */
    if (st.showTags && env.content.tags.length) {
      var lab = '* ' + env.content.tags[0] + ' *';
      var size = u(st.bodySize) * 0.62 * U.lerp(0.85, 1, env.emphasis);
      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.8;
      T.setFont(ctx, 'serif-fine', size, { italic: true });
      var lx = env.tier === 'wide' ? u(120) : w - u(110);
      var box = T.draw(ctx, lab, lx, Math.max(env.band.top - u(30), u(120)),
        { align: env.tier === 'wide' ? 'left' : 'right', tracking: size * 0.04 });
      T.rule(ctx, box, size * 0.3, Math.max(1, size * 0.05), pal.text, 0.7);
      ctx.restore();
    }

    /* --- outlined stars, kept sparse --- */
    D.scatter(env, {
      count: 22, avoid: g.avoid, kinds: st.motifs, colors: [pal.inks[0], pal.inks[1]],
      rMin: 10, rMax: 22, bigRatio: 0.16, minDist: 92,
      alphaMin: 0.5, alphaMax: 1, outlineRatio: 0.55, lineW: 2.6
    });

    TS.drawTags(env, C.tagSpots(env, g.avoid).slice(1), {});
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'paper',
    label: 'Paper',
    blurb: '점노트 위에 망점 인쇄. 밖에서 봐도 그냥 문구류.',
    defaults: { photoShape: 'rect', tone: 'halftone', feather: 0, paperStyle: 'dots', cardStyle: 'round', auraShape: 'none' },
    draw: draw
  });
})(window.PT = window.PT || {});
