/* Scattered decoration with keep-out zones, so motifs never land on
   the clock, the dock, or the typography. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim;

  function inAny(rects, x, y, r) {
    for (var i = 0; i < rects.length; i++) {
      var b = rects[i];
      if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) return true;
    }
    return false;
  }

  /* Poisson-ish rejection sampling with a floor under the spacing.

     It used to relax the minimum distance by 0.7 per pass over five
     passes, on the principle that the count is a promise the UI makes.
     By the last pass the floor was a quarter of the intended spacing, so
     asking for twenty marks on a phone did not give twenty scattered
     marks — it gave a stipple, several of them touching. A count that is
     honoured by ruining the scatter is not worth honouring.

     So the spacing never drops below 62% of what was asked, and the count
     is capped first by what the canvas can actually hold: the free area
     divided by the disc each mark needs, times a slack factor for random
     rather than hexagonal packing. Both terms are in per-mille units, so
     the ceiling rises with the canvas on its own — a desktop page takes
     far more marks than a phone before it starts to crowd. */
  function capacity(env, avoid, radii, minDist, sep, pad) {
    var free = (env.w - pad * 2) * (env.h - pad * 2);
    (avoid || []).forEach(function (b) { free -= Math.max(0, b.w) * Math.max(0, b.h); });
    free = Math.max(0, free) / 3.2;          /* slack for random packing */
    if (!radii) {
      var disc = Math.PI * (minDist / 2) * (minDist / 2);
      return Math.max(1, Math.floor(free / disc));
    }
    /* biggest first, so the ones that get dropped are the small ones the
       eye would miss rather than the hero mark */
    var used = 0, n = 0;
    for (var i = 0; i < radii.length; i++) {
      used += Math.PI * Math.pow(radii[i] * sep, 2);
      if (used > free && n) break;
      n++;
    }
    return Math.max(1, n);
  }

  /* `strat` divides the page into as many horizontal bands as there are
     marks and fills them in order, so the field cannot pile into one half
     of the page. Uniform random over a tall canvas is uniform on average
     and lumpy in any single draw — on Aura, six marks all landed in the
     top half and the bottom third of the page had nothing on it at all.
     The bands overlap by half a band, so a mark whose own band is entirely
     under a keep-out zone still has somewhere to go. */
  function points(env, count, avoid, minDist, pad, radii, sep, strat) {
    var rand = env.rand, w = env.w, h = env.h;
    var out = [];
    pad = pad == null ? env.u(24) : pad;
    sep = sep || 0.85;

    /* The bands are handed out in a shuffled order. Filling them top to
       bottom would be a different bias for the same price: the first mark
       is the hero and the first mark is the biggest, so every page would
       have its largest mark at the top. */
    var band = null;
    if (strat && count > 1) {
      band = [];
      for (var b = 0; b < count; b++) band.push(b);
      for (var s2 = count - 1; s2 > 0; s2--) {
        var j2 = Math.floor(rand() * (s2 + 1));
        var tmp = band[s2]; band[s2] = band[j2]; band[j2] = tmp;
      }
    }

    /* How far apart mark i and mark j have to be. With radii known this is
       a property of the PAIR — one flat distance cannot serve a field
       whose big marks are three times its small ones, which is how twenty
       marks came out overlapping at half the sum of their radii. */
    function need(i, j, relax) {
      var d = radii ? (radii[i] + radii[j]) * sep : minDist;
      return d * relax;
    }

    count = Math.min(count, capacity(env, avoid, radii, minDist, sep, pad));
    for (var pass = 0; pass < 5 && out.length < count; pass++) {
      var relax = Math.max(0.62, Math.pow(0.85, pass));
      var tries = count * 60;
      while (out.length < count && tries-- > 0) {
        var x = U.lerp(pad, w - pad, rand());
        var t = rand();
        if (band) {
          var k = band[out.length % count];
          var lo = Math.max(0, k / count - 0.5 / count);
          var hi = Math.min(1, (k + 1) / count + 0.5 / count);
          t = U.lerp(lo, hi, t);
        }
        var y = U.lerp(pad, h - pad, t);
        if (pass < 4 && inAny(avoid, x, y, pad * 0.5)) continue;
        var ok = true;
        for (var i = 0; i < out.length; i++) {
          if (Math.hypot(out[i][0] - x, out[i][1] - y) < need(out.length, i, relax)) { ok = false; break; }
        }
        if (ok) out.push([x, y]);
      }
    }
    return out;
  }

  /* Mixed motif field. `kinds` are keys of prim.motifs. */
  function scatter(env, opts) {
    var ctx = env.ctx, rand = env.rand, u = env.u;
    var kinds = opts.kinds;
    var colors = opts.colors;
    var n = Math.max(0, Math.round(opts.count == null ? env.decoBudget : opts.count));
    if (!n) return;

    /* The radii are drawn BEFORE the positions, because the spacing has to
       know how big each mark is. It used to be one flat distance — 70
       per-mille whatever was being drawn — while a mark's radius runs to
       `rMax` and the big ones are multiplied by up to 3.1 on top. Twenty
       marks placed 70 apart could each be 200 across, and the field closed
       into a stipple however well the sampler behaved: measured, the
       closest pair sat at 0.47 of the sum of their two radii. Now each
       pair is kept apart in proportion to its own two radii. */
    var bigRatio = opts.bigRatio == null ? 0.18 : opts.bigRatio;
    var big = Math.max(1, Math.round(n * bigRatio));
    var radii = [];
    for (var q = 0; q < n; q++) {
      radii.push(u(U.lerp(opts.rMin, opts.rMax, rand())) * (q < big ? U.range(rand, 1.9, 3.1) : 1));
    }
    var pts = points(env, n, opts.avoid || [],
      u(opts.minDist || 70), opts.pad, radii, opts.sep, opts.stratify);

    ctx.save();
    pts.forEach(function (p, i) {
      var isBig = i < big;
      var r = radii[i];
      var kind = U.pick(rand, kinds);
      var color = U.pick(rand, colors);
      var fn = P.motifs[kind] || P.motifs.star;
      ctx.globalAlpha = U.range(rand, opts.alphaMin || 0.5, opts.alphaMax || 1) * env.decoAlpha;

      /* One deliberate hero mark: filled, big, in the accent. Left to the
         colour lottery the palette's own colour was a coin flip, and an
         outline drawn in it is a few hundred pixels of hairline. */
      var isHero = opts.hero && i === 0;
      if (isHero) { color = opts.hero; ctx.globalAlpha = 0.95 * env.decoAlpha; }

      if (!isHero && opts.speckle && isBig && rand() > 0.35) {
        P.speckle(ctx, fn, p[0], p[1], r, color, rand, u(1000));
        return;
      }
      var outline = !isHero && opts.outlineRatio && rand() < opts.outlineRatio;
      ctx.beginPath();
      fn(ctx, p[0], p[1], r, rand);
      if (outline) {
        ctx.lineWidth = Math.max(1, u(opts.lineW || 3));
        ctx.strokeStyle = color;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.fill();
        if (opts.inkOutline) {
          ctx.lineWidth = Math.max(1, u(opts.lineW || 3));
          ctx.strokeStyle = opts.inkOutline;
          ctx.stroke();
        }
      }
    });
    ctx.restore();
  }

  /* Tiny twinkles — cheap, dense, always flattering. */
  function twinkles(env, opts) {
    var ctx = env.ctx, rand = env.rand, u = env.u;
    var n = Math.round(opts.count == null ? env.decoBudget * 3 : opts.count);
    var pts = points(env, n, opts.avoid || [], u(30), u(10), null, null, opts.stratify);
    ctx.save();
    pts.forEach(function (p, i) {
      var r = u(U.range(rand, opts.rMin || 5, opts.rMax || 13));
      var a = U.range(rand, 0.3, 0.9) * env.decoAlpha;
      var col = U.pick(rand, opts.colors);
      /* `hero` lands on a fixed cadence at a firm alpha. Picking colours
         at random meant a palette's accent could sit in the list and
         still never be drawn — the draws are made either way, so the
         stream stays identical between the preview and the export. */
      if (opts.hero && i % 3 === 0) { col = opts.hero; a = Math.max(a, 0.9); r *= 1.5; }
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      P.sparkle(ctx, p[0], p[1], r, 0.14);
      ctx.fill();
    });
    ctx.restore();
  }

  /* A repeating micro-motif tile — sticker-sheet backgrounds. */
  function motifTile(env, opts) {
    var ctx = env.ctx, u = env.u;
    var step = u(opts.step || 110);
    var r = u(opts.r || 11);
    var fn = P.motifs[opts.kind] || P.motifs.star;
    var rand = U.rng('tile' + opts.kind);
    ctx.save();
    ctx.globalAlpha = (opts.alpha == null ? 0.5 : opts.alpha) * env.decoAlpha;
    ctx.fillStyle = opts.color;
    for (var y = step * 0.5, row = 0; y < env.h + step; y += step, row++) {
      for (var x = (row % 2 ? step : step * 0.5); x < env.w + step; x += step) {
        ctx.beginPath();
        fn(ctx, x, y, r, rand);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  W.deco = { scatter: scatter, twinkles: twinkles, motifTile: motifTile, points: points, inAny: inAny };
})(window.PT = window.PT || {});
