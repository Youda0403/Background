/* AURA — the soft one. Wide colour blooms, a feathered photo window and
   a centred headline. Gentler than the poster layouts but built from the
   same type system, so the headline still carries the page. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, D = W.deco, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content, rand = env.rand;

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    var m = PO.margins(env);
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';

    /* ---- blooms ---- */
    var spots = wide
      ? [[0.22, 0.32], [0.74, 0.3], [0.5, 0.86]]
      : [[0.3, 0.24], [0.76, 0.46], [0.38, 0.8], [0.66, 0.94]];
    pal.soft.concat([pal.inks[3] || pal.soft[0]]).slice(0, 4).forEach(function (col, i) {
      var s = spots[i % spots.length];
      P.wash(ctx, w * s[0], h * s[1], env.S * U.range(rand, 0.66, 1.05), col,
        0.5 * st.washStrength);
    });

    /* ---- geometry ---- */
    /* Non-rectangular frames (heart, blob, star) ink far less of their
       plate than a circle does, so they get a larger plate to compensate —
       otherwise the photo looks lost inside its own glow. */
    var shapeBoost = /heart|star|blob/.test(st.photoShape) ? 1.22 : 1;
    var photoW = Math.min(m.inner, w * (wide ? 0.34
      : env.tier === 'tall' ? 0.6 : env.tier === 'phone' ? 0.62 : 0.5) * shapeBoost);
    var photoH = photoW;   /* the soft layout always frames a square */
    var hasPhoto = env.hasPhoto;

    var capH = (c.caption && !env.micro) ? mic * 3.4 : 0;
    /* the rails own the strip at the foot; the stack must not reach it */
    var railBand = env.micro ? 0 : mic * 3.2;
    var bandBottom = env.band.bottom - railBand;
    var avail = bandBottom - env.band.top;

    /* headline and photo share the band: the lockup may take at most a
       third of it, and whatever the stack still overflows comes out of
       the photo — type is never pushed into the rails */
    var hlBox = { x: m.left, y: 0, w: m.inner * (wide ? 0.46 : 0.9) };
    var hlMaxH = avail * (wide ? 0.5 : 0.34);
    var hl = PO.headline(env, hlBox, { align: 'center', measure: true, style: st.headlineStyle, maxH: hlMaxH });

    if (hasPhoto && !wide) {
      var maxPhotoH = avail - hl.h - capH - u(90);
      if (photoH > maxPhotoH) {
        photoH = Math.max(u(220), maxPhotoH);
        photoW = photoH;
      }
    }

    var total = (hasPhoto ? photoH + u(90) : 0) + hl.h + capH;
    var free = Math.max(0, avail - total);
    var y = env.band.top + free * 0.42;

    var plate = null;
    if (hasPhoto) {
      plate = wide
        ? { x: m.left + u(40), y: env.band.top + ((bandBottom - env.band.top) - photoH) / 2, w: photoW, h: photoH }
        : { x: (w - photoW) / 2, y: y, w: photoW, h: photoH };
    }

    /* ---- hero aura behind the window ---- */
    if (st.auraShape !== 'none') {
      var fn = P.motifs[st.auraShape] || P.motifs.heart;
      var hx = plate ? plate.x + plate.w / 2 : w / 2;
      var hy = plate ? plate.y + plate.h / 2 : env.band.top + (env.band.bottom - env.band.top) * 0.32;
      /* glow hugs the photo instead of dwarfing it */
      var hr = plate ? Math.min(plate.w, plate.h) * 0.58 : env.S * 0.32;
      P.glow(ctx, function (g2, x2, y2, r2) { fn(g2, x2, y2, r2, rand); }, hx, hy, hr,
        pal.soft[0], { layers: 18, spread: 0.5, alpha: 0.6 * st.washStrength });
      P.glow(ctx, function (g2, x2, y2, r2) { fn(g2, x2, y2, r2, rand); }, hx, hy, hr * 0.66,
        pal.inks[1] || pal.soft[1], { layers: 12, spread: 0.34, alpha: 0.22 * st.washStrength });
    }

    if (plate) env.drawPhoto(plate);

    /* ---- type ---- */
    if (wide) {
      var tx = w - m.right - hlBox.w;
      hlBox.x = tx;
      hlBox.y = env.band.top + ((bandBottom - env.band.top) - (hl.h + capH)) / 2;
      PO.headline(env, hlBox, { align: 'center', style: st.headlineStyle, maxH: hlMaxH });
      if (capH) {
        PO.block(env, hlBox.x, hlBox.y + hl.h + mic * 0.8, hlBox.w, [c.caption], {
          size: mic, lead: 1.5, align: 'center', alpha: 0.8, upper: false, font: st.bodyFont
        });
      }
    } else {
      hlBox.x = (w - hlBox.w) / 2;
      hlBox.y = (plate ? plate.y + plate.h + u(90) : y);
      PO.headline(env, hlBox, { align: 'center', style: st.headlineStyle, maxH: hlMaxH });
      if (capH) {
        PO.block(env, hlBox.x, hlBox.y + hl.h + mic * 0.9, hlBox.w, [c.caption], {
          size: mic, lead: 1.5, align: 'center', alpha: 0.8, upper: false, font: st.bodyFont
        });
      }
    }

    /* ---- twinkles, kept clear of the type and the foot rails ---- */
    var avoid = [
      { x: hlBox.x, y: hlBox.y - u(20), w: hlBox.w, h: hl.h + capH + u(40) },
      { x: 0, y: bandBottom - u(10), w: w, h: h - bandBottom + u(10) }
    ];
    if (plate) avoid.push(plate);
    D.twinkles(env, { avoid: avoid, colors: pal.inks.concat(pal.soft), rMin: 5, rMax: 15 });
    D.scatter(env, {
      avoid: avoid, kinds: st.motifs, colors: pal.inks,
      rMin: 14, rMax: 30, bigRatio: 0.24, minDist: 100,
      alphaMin: 0.4, alphaMax: 0.95, outlineRatio: 0.4, lineW: 2.6,
      speckle: st.glitter
    });

    /* ---- rails ---- */
    if (!env.micro) {
      PO.rail(env, h - m.bottom + mic * 0.1, [c.footnote, null, W.textstack.monogram(st)],
        { m: m, size: mic * 0.9, alpha: 0.6 });
      PO.tagRail(env, h - m.bottom - mic * 1.4, { m: m, size: mic * 0.9, alpha: 0.5 });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'aura',
    label: 'Aura',
    blurb: '뿌연 빛무리 + 부드러운 사진창. 제일 은은해요.',
    defaults: {
      photoShape: 'circle', tone: 'wash', toneAmount: 0.8,
      feather: 0.38, auraShape: 'heart', headlineStyle: 'stack',
      motifs: ['puff', 'sparkle', 'star'], vignette: 0.08, grain: 1
    },
    draw: draw
  });
})(window.PT = window.PT || {});
