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

    /* Measured, not assumed. A fixed two-line allowance let a caption that
       wrapped to three print straight through the tag rail on every
       landscape tablet. */
    var capW = m.inner * (wide ? 0.46 : 0.9);
    var capH = (c.caption && !env.micro)
      ? PO.block(env, 0, 0, capW, [c.caption], {
        size: mic, lead: 1.5, measure: true, font: st.bodyFont
      }) + mic * 1.1
      : 0;
    /* The rails own the strip at the foot and the stack must not reach it.
       Two lines of rail plus the tag rail is 4.6 micro-units, not 3.2 —
       under-reserving it let a wrapped caption print through the tags on
       every landscape tablet. */
    var railBand = env.micro ? 0 : mic * 4.8;
    var bandBottom = env.band.bottom - railBand;
    var avail = bandBottom - env.band.top;

    /* headline and photo share the band: the lockup may take at most a
       third of it, and whatever the stack still overflows comes out of
       the photo — type is never pushed into the rails */
    var hlBox = { x: m.left, y: 0, w: capW };
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

    /* On a wide canvas the halves get a shared centreline: the photograph
       centred in the left column, the whole type group centred in the
       right one, at the same height. Placed independently they drifted,
       which is what made the desktop version look like three things
       floating on a page rather than one composition. */
    var midY = env.band.top + (bandBottom - env.band.top) / 2;
    var left = { x: m.left, w: m.inner * 0.46 };
    var right = { x: w - m.right - m.inner * 0.46, w: m.inner * 0.46 };

    var plate = null;
    if (hasPhoto) {
      plate = wide
        ? { x: left.x + (left.w - photoW) / 2, y: midY - photoH / 2, w: photoW, h: photoH }
        : { x: (w - photoW) / 2, y: y, w: photoW, h: photoH };
    }

    /* ---- hero aura behind the window ---- */
    if (st.auraShape !== 'none') {
      var fn = P.motifs[st.auraShape] || P.motifs.heart;
      /* Anchored to where the picture belongs, not to whether one happens
         to be loaded. On a wide canvas that is the left column's centre —
         falling back to the full canvas centre with no photo pulled the
         glow out from under the left column into the gutter between the
         two halves, so it lined up with neither the empty photo slot nor
         the text sitting in the right column. */
      var hx = wide ? left.x + left.w / 2 : (plate ? plate.x + plate.w / 2 : w / 2);
      var hy = wide ? midY
        : (plate ? plate.y + plate.h / 2 : env.band.top + (env.band.bottom - env.band.top) * 0.32);
      /* A bloom behind the window, not a halo around a memory. The old
         spread put a wide soft aureole around a faded photograph, which
         is the visual language of a memorial, not of a couple. */
      var hr = wide ? Math.min(photoW, photoH) * 0.52
        : (plate ? Math.min(plate.w, plate.h) * 0.52 : env.S * 0.3);
      P.glow(ctx, function (g2, x2, y2, r2) { fn(g2, x2, y2, r2, rand); }, hx, hy, hr,
        pal.soft[0], { layers: 18, spread: 0.34, alpha: 0.5 * st.washStrength });
      /* the inner core carries the accent, so the softest layout still
         shows the palette's loudest colour somewhere */
      P.glow(ctx, function (g2, x2, y2, r2) { fn(g2, x2, y2, r2, rand); }, hx, hy, hr * 0.66,
        pal.accent || pal.inks[1] || pal.soft[1],
        { layers: 12, spread: 0.34, alpha: 0.3 * st.washStrength });
    }

    if (plate) {
      env.drawPhoto(plate);
      /* a hairline round the window: an edge is the difference between a
         photograph placed on the page and one dissolving into it */
      if (st.feather < 0.5) {
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - st.feather * 1.6);
        ctx.strokeStyle = pal.text;
        ctx.lineWidth = Math.max(1, u(1.8));
        var shape = W.frames.make(st.photoShape, env.seedNum);
        ctx.translate(plate.x, plate.y);
        shape(ctx, plate.w, plate.h, 1);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* ---- type ---- */
    if (wide) {
      var tagH = (!env.micro && c.tags.length && st.showTags) ? mic * 2.2 : 0;
      hlBox.x = right.x;
      hlBox.w = right.w;
      hlBox.y = midY - (hl.h + capH + tagH) / 2;
      PO.headline(env, hlBox, { align: 'center', style: st.headlineStyle, maxH: hlMaxH });
      if (capH) {
        PO.block(env, hlBox.x, hlBox.y + hl.h + mic * 0.8, hlBox.w, [c.caption], {
          size: mic, lead: 1.5, align: 'center', alpha: 0.8, upper: false, font: st.bodyFont
        });
      }
      if (tagH) {
        PO.tagRail(env, hlBox.y + hl.h + capH + tagH * 0.7, {
          m: { left: right.x, right: w - right.x - right.w, inner: right.w },
          size: mic * 0.9, alpha: 0.5
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
    /* the gutter between the two columns is structure, not empty space —
       a big motif parked in it reads as something dropped on the page */
    if (wide) avoid.push({ x: left.x + left.w, y: 0, w: right.x - (left.x + left.w), h: h });
    /* one budget, split — so "8개" really puts eight things on the page */
    var twinkleN = Math.round(env.decoBudget * 0.6);
    /* the accent rides along with the inks — the blooms are made of `soft`,
       which is deliberately pale, so without this the loudest colour in
       the palette never appears on the softest layout */
    var inks = [pal.accent].concat(pal.inks).filter(Boolean);
    D.twinkles(env, {
      count: twinkleN, avoid: avoid, colors: inks.concat(pal.soft),
      hero: pal.accent, rMin: 5, rMax: 15
    });
    D.scatter(env, {
      count: env.decoBudget - twinkleN,
      avoid: avoid, kinds: st.motifs, colors: inks, hero: pal.accent,
      rMin: 14, rMax: 30, bigRatio: 0.24, minDist: 100,
      alphaMin: 0.4, alphaMax: 0.95, outlineRatio: 0.4, lineW: 2.6,
      speckle: st.glitter
    });

    /* ---- rails ---- */
    if (env.micro) {
      PO.microFoot(env, { m: m });
    } else {
      PO.rail(env, h - m.bottom + mic * 0.1, [c.footnote, null, W.textstack.monogram(st)],
        { m: m, size: mic * 0.9, alpha: 0.6 });
      if (!wide) PO.tagRail(env, h - m.bottom - mic * 1.4, { m: m, size: mic * 0.9, alpha: 0.5 });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'aura',
    label: 'Aura',
    blurb: '뿌연 빛무리 + 부드러운 사진창. 제일 은은해요.',
    defaults: {
      titleFont: 'instrument', scriptFont: 'gwendolyn', bodyFont: 'dmmono',
      headlineStyle: 'stack',
      photoShape: 'circle', tone: 'wash', toneAmount: 0.3,
      feather: 0.12, auraShape: 'heart',
      motifs: ['puff', 'sparkle', 'star'], vignette: 0.08, grain: 1
    },
    draw: draw
  });
})(window.PT = window.PT || {});
