/* AURA — blurred colour blooms, a soft photo window, twinkles.
   Reads as an abstract gradient wallpaper from arm's length. */
(function (W) {
  'use strict';
  var P = W.prim, U = W.util, D = W.deco, TS = W.textstack, C = W.compose;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, rand = env.rand;

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    var g = C.place(env, {
      margin: 96,
      widthFrac: { tall: 0.60, phone: 0.64, tablet: 0.52, square: 0.58, wide: 0.4 },
      gap: 104,
      bias: 0.40
    });

    /* --- background blooms --- */
    var spots = env.tier === 'wide'
      ? [[0.24, 0.30], [0.74, 0.30], [0.50, 0.84], [0.10, 0.70]]
      : [[0.30, 0.22], [0.76, 0.44], [0.36, 0.78], [0.68, 0.92]];
    var washColors = pal.soft.concat([pal.inks[3] || pal.soft[0]]);
    washColors.slice(0, 4).forEach(function (c, i) {
      var s = spots[i % spots.length];
      P.wash(ctx, w * s[0], h * s[1], env.S * U.range(rand, 0.62, 1.0), c,
        0.5 * st.washStrength);
    });

    /* --- hero aura behind the photo (or where the photo would be) --- */
    if (st.auraShape !== 'none') {
      var fn = P.motifs[st.auraShape] || P.motifs.heart;
      var hx = g.photo ? g.photo.x + g.photo.w / 2 : w / 2;
      var hy = g.photo ? g.photo.y + g.photo.h / 2
        : env.band.top + (env.band.bottom - env.band.top) * 0.34;
      var hr = g.photo ? Math.min(g.photo.w, g.photo.h) * 0.72 : env.S * 0.32;
      P.glow(ctx, function (c, x, y, r) { fn(c, x, y, r, rand); }, hx, hy, hr,
        pal.soft[0], { layers: 18, spread: 0.62, alpha: 0.6 * st.washStrength });
      /* a second, tighter bloom in the accent ink keeps it from going flat */
      P.glow(ctx, function (c, x, y, r) { fn(c, x, y, r, rand); }, hx, hy, hr * 0.62,
        pal.inks[1] || pal.soft[1], { layers: 12, spread: 0.4, alpha: 0.22 * st.washStrength });
    }

    /* --- photo --- */
    if (g.photo) env.drawPhoto(g.photo);

    /* soft halo ring — subtle, only when the frame is round */
    if (g.photo && st.photoRing && /circle|oval|arch|card/.test(st.photoShape)) {
      ctx.save();
      ctx.globalAlpha = 0.35 * env.decoAlpha;
      ctx.strokeStyle = pal.inks[0];
      ctx.lineWidth = Math.max(1, u(2.4));
      var pad = u(26);
      var shape = W.frames.make(st.photoShape, env.seedNum);
      ctx.translate(g.photo.x - pad, g.photo.y - pad);
      shape(ctx, g.photo.w + pad * 2, g.photo.h + pad * 2, 1);
      ctx.stroke();
      ctx.restore();
    }

    /* --- type --- */
    TS.drawStack(env, g.text, { captionItalic: true });

    /* --- twinkles + stars --- */
    D.twinkles(env, {
      count: 46, avoid: g.avoid, colors: pal.inks.concat(pal.soft),
      rMin: 5, rMax: 15
    });
    D.scatter(env, {
      count: 16, avoid: g.avoid, kinds: st.motifs, colors: pal.inks,
      rMin: 12, rMax: 26, bigRatio: 0.22, minDist: 96,
      alphaMin: 0.35, alphaMax: 0.9, outlineRatio: 0.4, lineW: 3,
      speckle: st.glitter
    });

    TS.drawTags(env, C.tagSpots(env, g.avoid), {});
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'aura',
    label: 'Aura',
    blurb: 'Soft blooms + twinkles. The most discreet of the four.',
    defaults: { photoShape: 'circle', tone: 'wash', feather: 0.35, auraShape: 'heart', paperStyle: 'none' },
    draw: draw
  });
})(window.PT = window.PT || {});
