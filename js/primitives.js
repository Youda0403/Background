/* Drawing primitives shared by every layout.
   All geometry is passed in device pixels; layouts convert from
   per-mille units so a composition scales identically at any size. */
(function (W) {
  'use strict';
  var U = W.util;
  var TAU = Math.PI * 2;

  /* ---------- paths ---------- */

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }

  /* Arch — a rect with a fully rounded top. Museum-card photo frames. */
  function arch(ctx, x, y, w, h) {
    var r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function circle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.closePath();
  }

  function star(ctx, cx, cy, r, points, innerRatio, rot) {
    points = points || 5;
    innerRatio = innerRatio == null ? 0.4 : innerRatio;
    rot = rot || 0;
    ctx.beginPath();
    for (var i = 0; i < points * 2; i++) {
      var rad = i % 2 ? r * innerRatio : r;
      var a = rot - Math.PI / 2 + (i * Math.PI) / points;
      var x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  /* Puffy hand-drawn star: same lattice, curved limbs. */
  function puffStar(ctx, cx, cy, r, points, innerRatio, rot) {
    points = points || 5;
    innerRatio = innerRatio == null ? 0.46 : innerRatio;
    rot = rot || 0;
    var pts = [];
    for (var i = 0; i < points * 2; i++) {
      var rad = i % 2 ? r * innerRatio : r;
      var a = rot - Math.PI / 2 + (i * Math.PI) / points;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var j = 1; j <= pts.length; j++) {
      var p = pts[j % pts.length], prev = pts[j - 1];
      var mx = (prev[0] + p[0]) / 2, my = (prev[1] + p[1]) / 2;
      ctx.quadraticCurveTo(mx + (mx - cx) * 0.06, my + (my - cy) * 0.06, p[0], p[1]);
    }
    ctx.closePath();
  }

  /* Four-point sparkle — the little twinkles all over the references. */
  function sparkle(ctx, cx, cy, r, waist) {
    waist = waist == null ? 0.16 : waist;
    var w = r * waist;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + w * 0.5, cy - w * 0.5, cx + r, cy);
    ctx.quadraticCurveTo(cx + w * 0.5, cy + w * 0.5, cx, cy + r);
    ctx.quadraticCurveTo(cx - w * 0.5, cy + w * 0.5, cx - r, cy);
    ctx.quadraticCurveTo(cx - w * 0.5, cy - w * 0.5, cx, cy - r);
    ctx.closePath();
  }

  function heart(ctx, cx, cy, r) {
    ctx.beginPath();
    var top = cy - r * 0.62;
    ctx.moveTo(cx, cy + r * 0.85);
    ctx.bezierCurveTo(cx - r * 1.5, cy - r * 0.35, cx - r * 0.62, top - r * 0.55, cx, top);
    ctx.bezierCurveTo(cx + r * 0.62, top - r * 0.55, cx + r * 1.5, cy - r * 0.35, cx, cy + r * 0.85);
    ctx.closePath();
  }

  /* Wobbly organic blob — aura shapes, watercolour pools, torn panels. */
  function blob(ctx, cx, cy, r, rand, wobble, lobes) {
    wobble = wobble == null ? 0.16 : wobble;
    lobes = lobes || 7;
    var pts = [];
    for (var i = 0; i < lobes; i++) {
      var a = (i / lobes) * TAU;
      var rad = r * (1 - wobble + rand() * wobble * 2);
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    ctx.beginPath();
    var m0 = [(pts[lobes - 1][0] + pts[0][0]) / 2, (pts[lobes - 1][1] + pts[0][1]) / 2];
    ctx.moveTo(m0[0], m0[1]);
    for (var j = 0; j < lobes; j++) {
      var cur = pts[j], next = pts[(j + 1) % lobes];
      ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2);
    }
    ctx.closePath();
  }

  function clover(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var a = (i / 4) * TAU + Math.PI / 4;
      var lx = cx + Math.cos(a) * r * 0.52, ly = cy + Math.sin(a) * r * 0.52;
      ctx.moveTo(cx, cy);
      ctx.arc(lx, ly, r * 0.5, 0, TAU);
    }
    ctx.closePath();
  }

  function cloud(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx - r * 0.7, cy + r * 0.15, r * 0.5, 0, TAU);
    ctx.arc(cx - r * 0.1, cy - r * 0.22, r * 0.62, 0, TAU);
    ctx.arc(cx + r * 0.65, cy + r * 0.05, r * 0.48, 0, TAU);
    ctx.arc(cx + r * 0.1, cy + r * 0.32, r * 0.46, 0, TAU);
    ctx.closePath();
  }

  function bow(ctx, cx, cy, r) {
    ctx.beginPath();
    /* left loop */
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx - r * 0.5, cy - r * 0.85, cx - r * 1.25, cy - r * 0.4, cx - r * 0.95, cy + r * 0.12);
    ctx.bezierCurveTo(cx - r * 0.72, cy + r * 0.6, cx - r * 0.22, cy + r * 0.3, cx, cy);
    /* right loop */
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx + r * 0.5, cy - r * 0.85, cx + r * 1.25, cy - r * 0.4, cx + r * 0.95, cy + r * 0.12);
    ctx.bezierCurveTo(cx + r * 0.72, cy + r * 0.6, cx + r * 0.22, cy + r * 0.3, cx, cy);
    /* tails */
    ctx.moveTo(cx - r * 0.12, cy + r * 0.1);
    ctx.bezierCurveTo(cx - r * 0.5, cy + r * 0.8, cx - r * 0.6, cy + r * 1.2, cx - r * 0.3, cy + r * 1.5);
    ctx.moveTo(cx + r * 0.12, cy + r * 0.1);
    ctx.bezierCurveTo(cx + r * 0.5, cy + r * 0.8, cx + r * 0.6, cy + r * 1.2, cx + r * 0.3, cy + r * 1.5);
  }

  function flower(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * TAU - Math.PI / 2;
      var px = cx + Math.cos(a) * r * 0.55, py = cy + Math.sin(a) * r * 0.55;
      ctx.moveTo(cx, cy);
      ctx.arc(px, py, r * 0.46, 0, TAU);
    }
    ctx.closePath();
  }

  function moon(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.35, Math.PI * 1.65);
    ctx.quadraticCurveTo(cx - r * 0.15, cy, cx + Math.cos(Math.PI * 0.35) * r, cy + Math.sin(Math.PI * 0.35) * r);
    ctx.closePath();
  }

  /* Heart padlock + key — from the "reality dissolves" board. */
  function lock(ctx, cx, cy, r) {
    heart(ctx, cx, cy + r * 0.18, r * 0.9);
    ctx.moveTo(cx - r * 0.34, cy - r * 0.42);
    ctx.arc(cx, cy - r * 0.52, r * 0.34, Math.PI, 0);
    ctx.moveTo(cx - r * 0.09, cy + r * 0.12);
    ctx.rect(cx - r * 0.09, cy + r * 0.12, r * 0.18, r * 0.3);
  }

  function key(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.6, r * 0.38, 0, TAU);
    ctx.moveTo(cx - r * 0.07, cy - r * 0.25);
    ctx.lineTo(cx - r * 0.07, cy + r);
    ctx.lineTo(cx + r * 0.07, cy + r);
    ctx.lineTo(cx + r * 0.07, cy - r * 0.25);
    ctx.moveTo(cx + r * 0.07, cy + r * 0.35);
    ctx.lineTo(cx + r * 0.4, cy + r * 0.35);
    ctx.moveTo(cx + r * 0.07, cy + r * 0.62);
    ctx.lineTo(cx + r * 0.32, cy + r * 0.62);
  }

  var MOTIFS = {
    star: function (c, x, y, r, rand) { star(c, x, y, r, 5, 0.4, rand ? rand() * 1.2 : 0); },
    puff: function (c, x, y, r, rand) { puffStar(c, x, y, r, 5, 0.46, rand ? rand() * 1.2 : 0); },
    six: function (c, x, y, r, rand) { star(c, x, y, r, 6, 0.5, rand ? rand() * 1.2 : 0); },
    sparkle: function (c, x, y, r) { sparkle(c, x, y, r); },
    heart: heart,
    circle: circle,
    clover: clover,
    cloud: cloud,
    flower: flower,
    moon: moon,
    bow: bow,
    key: key,
    lock: lock,
    blob: function (c, x, y, r, rand) { blob(c, x, y, r, rand || Math.random, 0.2, 7); }
  };

  /* ---------- soft aura (blur-free, works everywhere) ---------- */

  function glow(ctx, pathFn, cx, cy, r, color, opts) {
    opts = opts || {};
    var layers = opts.layers || 16;
    var spread = opts.spread == null ? 0.55 : opts.spread;
    var alpha = opts.alpha == null ? 0.5 : opts.alpha;
    var per = alpha / layers * 1.9;
    ctx.save();
    ctx.fillStyle = color;
    for (var i = layers - 1; i >= 0; i--) {
      var t = i / (layers - 1);
      ctx.globalAlpha = per * (1 - t * 0.55);
      pathFn(ctx, cx, cy, r * (1 + spread * t));
      ctx.fill();
    }
    ctx.restore();
  }

  /* Radial wash — the cheapest, softest background bloom. */
  function wash(ctx, cx, cy, r, color, alpha) {
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, U.rgba(color, alpha));
    g.addColorStop(0.55, U.rgba(color, alpha * 0.45));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  /* ---------- textures ---------- */

  var grainCache = {};
  function grainTile(size, strength) {
    var k = size + ':' + strength;
    if (grainCache[k]) return grainCache[k];
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var data = g.createImageData(size, size);
    var d = data.data;
    var rand = U.rng(1337);
    for (var i = 0; i < d.length; i += 4) {
      var v = 128 + (rand() - 0.5) * 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = Math.round(255 * strength);
    }
    g.putImageData(data, 0, 0);
    grainCache[k] = c;
    return c;
  }

  function applyGrain(ctx, w, h, strength, scale) {
    if (strength <= 0.001) return;
    var tile = grainTile(128, U.clamp(strength * 1.4, 0, 1));
    var pat = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    if (scale && scale !== 1) ctx.scale(scale, scale);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w / (scale || 1), h / (scale || 1));
    ctx.restore();
  }

  /* Silver-glitter fill for star shapes (Apple Silver board). */
  function speckle(ctx, pathFn, cx, cy, r, base, rand) {
    ctx.save();
    pathFn(ctx, cx, cy, r, rand);
    ctx.clip();
    ctx.fillStyle = base;
    ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
    var n = Math.max(24, Math.round(r * r * 0.06));
    for (var i = 0; i < n; i++) {
      var a = rand() * TAU, d = Math.sqrt(rand()) * r * 1.1;
      var px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
      var s = r * (0.02 + rand() * 0.06);
      ctx.globalAlpha = 0.25 + rand() * 0.6;
      ctx.fillStyle = rand() > 0.45 ? '#ffffff' : '#6f7684';
      ctx.beginPath();
      ctx.arc(px, py, s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* Dotted / graph paper. Drawn directly so it stays crisp at any size. */
  function dotPaper(ctx, w, h, spacing, radius, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (var y = spacing / 2; y < h + spacing; y += spacing) {
      for (var x = spacing / 2; x < w + spacing; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function gridPaper(ctx, w, h, spacing, lineW, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.beginPath();
    for (var x = 0; x <= w + spacing; x += spacing) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (var y = 0; y <= h + spacing; y += spacing) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    ctx.restore();
  }

  /* Dotted trail — the beaded swirls in the diary boards. */
  function dottedPath(ctx, pts, dotR, gap, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var len = Math.hypot(dx, dy);
      var steps = Math.max(1, Math.floor(len / gap));
      for (var s = 0; s < steps; s++) {
        var t = s / steps;
        ctx.beginPath();
        ctx.arc(a[0] + dx * t, a[1] + dy * t, dotR, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function spiralPts(cx, cy, r0, r1, turns, steps, squash) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = t * TAU * turns;
      var r = U.lerp(r0, r1, t);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * (squash || 1)]);
    }
    return pts;
  }

  /* ---------- masked composition ---------- */

  /* Draw `content` then keep only what `mask` covers. The mask is built
     in its own buffer first: `destination-in` multiplies alpha on every
     draw, so a multi-pass mask applied in place would erase itself. */
  function masked(w, h, content, mask) {
    var cw = Math.max(1, Math.round(w) || 1);
    var ch = Math.max(1, Math.round(h) || 1);
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var g = c.getContext('2d');
    content(g, cw, ch);

    var mc = document.createElement('canvas');
    mc.width = cw; mc.height = ch;
    mask(mc.getContext('2d'), cw, ch);

    g.globalCompositeOperation = 'destination-in';
    g.drawImage(mc, 0, 0);
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  /* Feathered edge: concentric fills that accumulate into a soft ramp,
     with an opaque core so the middle of the photo stays solid. */
  function featherMask(ctx, pathFn, cx, cy, r, feather) {
    var steps = U.clamp(Math.round(feather * 22), 3, 26);
    ctx.save();
    ctx.fillStyle = '#000';
    for (var i = 0; i < steps; i++) {
      ctx.globalAlpha = 0.32;
      pathFn(ctx, cx, cy, r * (1 - feather * (i / steps)));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    pathFn(ctx, cx, cy, r * (1 - feather));
    ctx.fill();
    ctx.restore();
  }

  W.prim = {
    TAU: TAU,
    roundRect: roundRect, arch: arch, circle: circle, star: star,
    puffStar: puffStar, sparkle: sparkle, heart: heart, blob: blob,
    clover: clover, cloud: cloud, bow: bow, flower: flower, moon: moon,
    lock: lock, key: key, motifs: MOTIFS,
    glow: glow, wash: wash,
    grainTile: grainTile, applyGrain: applyGrain, speckle: speckle,
    dotPaper: dotPaper, gridPaper: gridPaper, dottedPath: dottedPath,
    spiralPts: spiralPts, masked: masked, featherMask: featherMask
  };
})(window.PT = window.PT || {});
