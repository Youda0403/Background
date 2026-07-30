/* STICKER — a sheet of pastel doodles with one instant-photo card.
   The cutest of the four; still reads as generic stationery. */
(function (W) {
  'use strict';
  var P = W.prim, U = W.util, D = W.deco, TS = W.textstack, C = W.compose;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, rand = env.rand;

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    /* gentle corner tints so a flat sheet still has depth */
    P.wash(ctx, w * 0.12, h * 0.08, env.S * 0.7, pal.soft[0], 0.5 * st.washStrength);
    P.wash(ctx, w * 0.9, h * 0.92, env.S * 0.75, pal.soft[1] || pal.soft[0], 0.45 * st.washStrength);

    if (st.paperStyle === 'dots') {
      D.motifTile(env, { kind: 'six', step: 104, r: 10, color: pal.inks[1], alpha: 0.3 });
    } else if (st.paperStyle === 'grid') {
      P.gridPaper(ctx, w, h, u(56), Math.max(1, u(1.3)), pal.inks[1], 0.22 * env.decoAlpha);
    } else if (st.paperStyle === 'lines') {
      D.motifTile(env, { kind: 'flower', step: 130, r: 13, color: pal.soft[1] || pal.inks[3], alpha: 0.4 });
    }

    var g = C.place(env, {
      margin: 110,
      widthFrac: { tall: 0.56, phone: 0.58, tablet: 0.46, square: 0.52, wide: 0.38 },
      gap: 112,
      bias: 0.42
    });

    /* --- instant-photo card --- */
    if (g.photo && st.polaroid) {
      var pad = u(34);
      var lip = u(96);
      var cw = g.photo.w + pad * 2, ch = g.photo.h + pad + lip;
      var cx = g.photo.x + g.photo.w / 2, cy = g.photo.y + g.photo.h / 2;
      ctx.save();
      ctx.translate(cx, cy + (lip - pad) / 2);
      ctx.rotate((st.photoRotate * Math.PI) / 180);
      ctx.shadowColor = 'rgba(0,0,0,0.16)';
      ctx.shadowBlur = u(30);
      ctx.shadowOffsetY = u(10);
      ctx.fillStyle = U.luma(pal.base) > 0.5 ? '#ffffff' : '#f4f1ea';
      P.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, u(10));
      ctx.fill();
      ctx.restore();
    }

    if (g.photo) env.drawPhoto(g.photo);

    /* --- doodles --- */
    D.scatter(env, {
      count: 20, avoid: g.avoid, kinds: st.motifs,
      colors: pal.inks.concat(pal.soft),
      rMin: 16, rMax: 34, bigRatio: 0.2, minDist: 112,
      alphaMin: 0.65, alphaMax: 1, outlineRatio: 0.18, lineW: 3.2,
      inkOutline: st.doodleOutline ? U.rgba(pal.text, 0.55) : null
    });
    D.twinkles(env, { count: 26, avoid: g.avoid, colors: pal.inks, rMin: 4, rMax: 11 });

    /* --- type --- */
    TS.drawStack(env, g.text, {});
    TS.drawTags(env, C.tagSpots(env, g.avoid), {});

    /* --- wobbly sheet border --- */
    if (st.border) {
      var m = u(46);
      ctx.save();
      ctx.globalAlpha = 0.5 * env.decoAlpha;
      ctx.strokeStyle = pal.inks[0];
      ctx.lineWidth = Math.max(1, u(3));
      ctx.setLineDash([u(14), u(12)]);
      P.roundRect(ctx, m, m, w - m * 2, h - m * 2, u(26));
      ctx.stroke();
      ctx.restore();
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'sticker',
    label: 'Sticker',
    blurb: 'Pastel doodle sheet with an instant-photo card.',
    defaults: {
      photoShape: 'card', tone: 'wash', feather: 0, paperStyle: 'dots',
      auraShape: 'none', polaroid: true, photoRotate: -3,
      motifs: ['puff', 'heart', 'bow', 'cloud', 'flower', 'moon', 'clover', 'sparkle']
    },
    draw: draw
  });
})(window.PT = window.PT || {});
