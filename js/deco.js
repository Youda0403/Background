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

  /* Poisson-ish rejection sampling: tries hard, gives up gracefully. */
  function points(env, count, avoid, minDist, pad) {
    var rand = env.rand, w = env.w, h = env.h;
    var out = [];
    var tries = count * 40;
    pad = pad == null ? env.u(24) : pad;
    while (out.length < count && tries-- > 0) {
      var x = U.lerp(pad, w - pad, rand());
      var y = U.lerp(pad, h - pad, rand());
      if (inAny(avoid, x, y, pad * 0.5)) continue;
      var ok = true;
      for (var i = 0; i < out.length; i++) {
        if (Math.hypot(out[i][0] - x, out[i][1] - y) < minDist) { ok = false; break; }
      }
      if (ok) out.push([x, y]);
    }
    return out;
  }

  /* Mixed motif field. `kinds` are keys of prim.motifs. */
  function scatter(env, opts) {
    var ctx = env.ctx, rand = env.rand, u = env.u;
    var kinds = opts.kinds;
    var colors = opts.colors;
    var n = Math.max(0, Math.round(opts.count * env.decoDensity));
    if (!n) return;
    var pts = points(env, n, opts.avoid || [], u(opts.minDist || 70), opts.pad);
    var big = Math.max(1, Math.round(pts.length * (opts.bigRatio == null ? 0.18 : opts.bigRatio)));

    ctx.save();
    pts.forEach(function (p, i) {
      var isBig = i < big;
      var r = u(U.lerp(opts.rMin, opts.rMax, rand())) * (isBig ? U.range(rand, 1.9, 3.1) : 1);
      var kind = U.pick(rand, kinds);
      var color = U.pick(rand, colors);
      var fn = P.motifs[kind] || P.motifs.star;
      ctx.globalAlpha = U.range(rand, opts.alphaMin || 0.5, opts.alphaMax || 1) * env.decoAlpha;

      if (opts.speckle && isBig && rand() > 0.35) {
        P.speckle(ctx, fn, p[0], p[1], r, color, rand, u(1000));
        return;
      }
      var outline = opts.outlineRatio && rand() < opts.outlineRatio;
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
    var n = Math.round((opts.count || 40) * env.decoDensity);
    var pts = points(env, n, opts.avoid || [], u(30), u(10));
    ctx.save();
    pts.forEach(function (p) {
      var r = u(U.range(rand, opts.rMin || 5, opts.rMax || 13));
      ctx.globalAlpha = U.range(rand, 0.3, 0.9) * env.decoAlpha;
      ctx.fillStyle = U.pick(rand, opts.colors);
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
