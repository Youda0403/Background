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

  /* Four-leaf clover: teardrop lobes on beziers, not four circles. */
  function clover(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var a = (i / 4) * TAU + Math.PI / 4;
      var ca = Math.cos(a), sa = Math.sin(a);
      var px = cx + ca * r * 0.62, py = cy + sa * r * 0.62;
      var nx = -sa, ny = ca;
      ctx.moveTo(cx + ca * r * 0.06, cy + sa * r * 0.06);
      ctx.bezierCurveTo(
        px + nx * r * 0.5 - ca * r * 0.1, py + ny * r * 0.5 - sa * r * 0.1,
        px + nx * r * 0.34 + ca * r * 0.42, py + ny * r * 0.34 + sa * r * 0.42,
        cx + ca * r * 0.96, cy + sa * r * 0.96);
      ctx.bezierCurveTo(
        px - nx * r * 0.34 + ca * r * 0.42, py - ny * r * 0.34 + sa * r * 0.42,
        px - nx * r * 0.5 - ca * r * 0.1, py - ny * r * 0.5 - sa * r * 0.1,
        cx + ca * r * 0.06, cy + sa * r * 0.06);
    }
    ctx.closePath();
  }

  /* Single continuous cloud outline. */
  function cloud(ctx, cx, cy, r) {
    var x = cx - r, y = cy + r * 0.46, w = r * 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y);
    ctx.bezierCurveTo(x - w * 0.06, y, x - w * 0.06, y - r * 0.52, x + w * 0.12, y - r * 0.56);
    ctx.bezierCurveTo(x + w * 0.14, y - r * 1.16, x + w * 0.46, y - r * 1.28, x + w * 0.56, y - r * 0.86);
    ctx.bezierCurveTo(x + w * 0.68, y - r * 1.34, x + w * 1.02, y - r * 1.1, x + w * 0.94, y - r * 0.54);
    ctx.bezierCurveTo(x + w * 1.08, y - r * 0.46, x + w * 1.06, y, x + w * 0.9, y);
    ctx.closePath();
  }

  /* Five petals with a soft notch — reads as a flower, not a daisy chain. */
  function flower(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * TAU - Math.PI / 2;
      var ca = Math.cos(a), sa = Math.sin(a);
      var nx = -sa, ny = ca;
      var tipX = cx + ca * r, tipY = cy + sa * r;
      ctx.moveTo(cx + ca * r * 0.12, cy + sa * r * 0.12);
      ctx.bezierCurveTo(
        cx + ca * r * 0.4 + nx * r * 0.44, cy + sa * r * 0.4 + ny * r * 0.44,
        tipX + nx * r * 0.3, tipY + ny * r * 0.3,
        tipX, tipY);
      ctx.bezierCurveTo(
        tipX - nx * r * 0.3, tipY - ny * r * 0.3,
        cx + ca * r * 0.4 - nx * r * 0.44, cy + sa * r * 0.4 - ny * r * 0.44,
        cx + ca * r * 0.12, cy + sa * r * 0.12);
    }
    ctx.closePath();
  }

  /* Crescent from two arcs, so the inner edge is a true curve. */
  function moon(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.42, Math.PI * 1.58, false);
    ctx.arc(cx - r * 0.42, cy, r * 0.92, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.closePath();
  }

  /* Heart padlock, one outline: shackle, body, keyhole. */
  function lock(ctx, cx, cy, r) {
    var bw = r * 1.5, bh = r * 1.36;
    var bx = cx - bw / 2, by = cy - bh * 0.18;
    ctx.beginPath();
    /* shackle */
    ctx.moveTo(cx - r * 0.44, by + bh * 0.12);
    ctx.bezierCurveTo(cx - r * 0.44, cy - r * 1.1, cx + r * 0.44, cy - r * 1.1, cx + r * 0.44, by + bh * 0.12);
    /* body as a heart */
    var hr = r * 0.86, hcy = by + bh * 0.5;
    ctx.moveTo(cx, hcy + hr * 0.92);
    ctx.bezierCurveTo(cx - hr * 1.62, hcy - hr * 0.3, cx - hr * 0.66, hcy - hr * 1.2, cx, hcy - hr * 0.5);
    ctx.bezierCurveTo(cx + hr * 0.66, hcy - hr * 1.2, cx + hr * 1.62, hcy - hr * 0.3, cx, hcy + hr * 0.92);
    /* keyhole */
    ctx.moveTo(cx + r * 0.13, hcy + r * 0.02);
    ctx.arc(cx, hcy + r * 0.02, r * 0.13, 0, TAU);
    ctx.moveTo(cx - r * 0.06, hcy + r * 0.1);
    ctx.lineTo(cx - r * 0.09, hcy + r * 0.44);
    ctx.lineTo(cx + r * 0.09, hcy + r * 0.44);
    ctx.lineTo(cx + r * 0.06, hcy + r * 0.1);
    ctx.closePath();
  }

  /* Ornate key: round bow, tapered shank, two cut teeth. */
  function key(ctx, cx, cy, r) {
    var top = cy - r;
    ctx.beginPath();
    /* bow */
    ctx.arc(cx, top + r * 0.34, r * 0.34, 0, TAU);
    ctx.moveTo(cx - r * 0.14, top + r * 0.34);
    ctx.arc(cx, top + r * 0.34, r * 0.14, Math.PI, Math.PI * 3);
    /* shank + teeth, single outline */
    ctx.moveTo(cx - r * 0.075, top + r * 0.66);
    ctx.lineTo(cx - r * 0.075, cy + r * 0.52);
    ctx.lineTo(cx - r * 0.26, cy + r * 0.52);
    ctx.lineTo(cx - r * 0.26, cy + r * 0.68);
    ctx.lineTo(cx - r * 0.075, cy + r * 0.68);
    ctx.lineTo(cx - r * 0.075, cy + r * 0.82);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.82);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.98);
    ctx.lineTo(cx - r * 0.075, cy + r * 0.98);
    ctx.lineTo(cx - r * 0.05, cy + r * 1.12);
    ctx.lineTo(cx + r * 0.05, cy + r * 1.12);
    ctx.lineTo(cx + r * 0.075, top + r * 0.66);
    ctx.closePath();
  }

  /* Ribbon bow: two loops and two tails on continuous curves. */
  function bow(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx - r * 0.46, cy - r * 0.86, cx - r * 1.22, cy - r * 0.46, cx - r * 0.98, cy + r * 0.08);
    ctx.bezierCurveTo(cx - r * 0.8, cy + r * 0.54, cx - r * 0.26, cy + r * 0.28, cx, cy);
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx + r * 0.46, cy - r * 0.86, cx + r * 1.22, cy - r * 0.46, cx + r * 0.98, cy + r * 0.08);
    ctx.bezierCurveTo(cx + r * 0.8, cy + r * 0.54, cx + r * 0.26, cy + r * 0.28, cx, cy);
    /* knot */
    ctx.moveTo(cx + r * 0.16, cy);
    ctx.arc(cx, cy, r * 0.16, 0, TAU);
    /* tails */
    ctx.moveTo(cx - r * 0.1, cy + r * 0.14);
    ctx.bezierCurveTo(cx - r * 0.34, cy + r * 0.66, cx - r * 0.5, cy + r * 1.0, cx - r * 0.36, cy + r * 1.42);
    ctx.bezierCurveTo(cx - r * 0.18, cy + r * 1.06, cx - r * 0.06, cy + r * 0.62, cx, cy + r * 0.2);
    ctx.bezierCurveTo(cx + r * 0.06, cy + r * 0.62, cx + r * 0.18, cy + r * 1.06, cx + r * 0.36, cy + r * 1.42);
    ctx.bezierCurveTo(cx + r * 0.5, cy + r * 1.0, cx + r * 0.34, cy + r * 0.66, cx + r * 0.1, cy + r * 0.14);
    ctx.closePath();
  }

  /* Thin many-pointed burst — the accent all over the reference posters. */
  function burst(ctx, cx, cy, r, points, waist) {
    points = points || 8;
    waist = waist == null ? 0.07 : waist;
    ctx.beginPath();
    for (var i = 0; i < points; i++) {
      var a = (i / points) * TAU - Math.PI / 2;
      var half = Math.PI / points;
      var tipX = cx + Math.cos(a) * r, tipY = cy + Math.sin(a) * r;
      var i1 = a - half, i2 = a + half;
      var ir = r * waist;
      if (i === 0) ctx.moveTo(cx + Math.cos(i1) * ir, cy + Math.sin(i1) * ir);
      else ctx.lineTo(cx + Math.cos(i1) * ir, cy + Math.sin(i1) * ir);
      ctx.quadraticCurveTo(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, tipX, tipY);
      ctx.quadraticCurveTo(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42,
        cx + Math.cos(i2) * ir, cy + Math.sin(i2) * ir);
    }
    ctx.closePath();
  }

  /* Chunky asymmetric flash star, the pink one from the 404 poster. */
  function flash(ctx, cx, cy, r, rand) {
    var n = 7;
    var jitter = [1, 0.62, 0.94, 0.5, 1.06, 0.58, 0.86];
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU - Math.PI / 2;
      var half = Math.PI / n;
      var rr = r * jitter[i % jitter.length];
      var ir = r * 0.3;
      var p1 = [cx + Math.cos(a - half) * ir, cy + Math.sin(a - half) * ir];
      var tip = [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
      var p2 = [cx + Math.cos(a + half) * ir, cy + Math.sin(a + half) * ir];
      if (i === 0) ctx.moveTo(p1[0], p1[1]); else ctx.lineTo(p1[0], p1[1]);
      ctx.lineTo(tip[0], tip[1]);
      ctx.lineTo(p2[0], p2[1]);
    }
    ctx.closePath();
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
    burst: function (c, x, y, r) { burst(c, x, y, r, 8, 0.07); },
    burst4: function (c, x, y, r) { burst(c, x, y, r, 4, 0.1); },
    flash: flash,
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

  /* `unit` is the canvas short side / 1000, so the noise keeps the same
     apparent coarseness in the preview and in the full-resolution file. */
  function applyGrain(ctx, w, h, strength, unit) {
    if (strength <= 0.001) return;
    var tile = grainTile(128, U.clamp(strength * 1.4, 0, 1));
    var pat = ctx.createPattern(tile, 'repeat');
    var scale = U.clamp((unit || 1) * 1.15, 0.25, 6);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.scale(scale, scale);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w / scale, h / scale);
    ctx.restore();
  }

  /* Silver-glitter fill for star shapes (Apple Silver board). */
  function speckle(ctx, pathFn, cx, cy, r, base, rand, unit) {
    /* Its own rng, drawn from one value of the caller's stream: the
       particle loop must never advance the shared sequence, or the
       preview and the export scatter differently. */
    var local = U.rng(Math.floor((rand ? rand() : Math.random()) * 1e9));
    /* Count from the shape's size relative to the canvas, not from
       pixels, so both resolutions get the same number of flecks. */
    var rel = unit ? r / unit : r / 40;
    var n = U.clamp(Math.round(rel * rel * 90), 26, 320);
    ctx.save();
    pathFn(ctx, cx, cy, r, local);
    ctx.clip();
    ctx.fillStyle = base;
    ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
    for (var i = 0; i < n; i++) {
      var a = local() * TAU, d = Math.sqrt(local()) * r * 1.1;
      var px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
      var s = r * (0.02 + local() * 0.06);
      ctx.globalAlpha = 0.25 + local() * 0.6;
      ctx.fillStyle = local() > 0.45 ? '#ffffff' : '#6f7684';
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
  /* A soft edge, ramped rather than stacked.

     This used to lay between three and twenty-six copies of the shape on
     top of each other, every one at an alpha of 0.32. Two problems, and
     both of them were visible: the outermost ring started at 32% opacity,
     so the edge began with a step rather than from nothing, and at a
     couple of dozen fills the rings are far enough apart to be read
     individually. It looked like contour lines on a map.

     The step count now comes from how many pixels the fade actually
     spans, so the rings land under a pixel apart whatever the canvas
     size, and the per-step alpha is solved from the step count rather
     than fixed — `1 - (1-a)^steps` is the coverage a stack of `steps`
     fills reaches, so `a` is chosen to make that land just under one. */
  function featherMask(ctx, pathFn, cx, cy, r, feather) {
    feather = U.clamp(feather, 0, 0.95);
    var band = r * feather;
    if (band < 1) {
      ctx.save();
      ctx.fillStyle = '#000';
      pathFn(ctx, cx, cy, r);
      ctx.fill();
      ctx.restore();
      return;
    }
    var steps = U.clamp(Math.round(band), 12, 96);
    var a = 1 - Math.pow(0.03, 1 / steps);
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.globalAlpha = a;
    for (var i = 0; i < steps; i++) {
      pathFn(ctx, cx, cy, r - band * (1 - (i + 1) / steps));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    pathFn(ctx, cx, cy, r - band);
    ctx.fill();
    ctx.restore();
  }

  W.prim = {
    TAU: TAU,
    roundRect: roundRect, arch: arch, circle: circle, star: star,
    puffStar: puffStar, sparkle: sparkle, heart: heart, blob: blob,
    clover: clover, cloud: cloud, bow: bow, flower: flower, moon: moon,
    lock: lock, key: key, burst: burst, flash: flash, motifs: MOTIFS,
    glow: glow, wash: wash,
    grainTile: grainTile, applyGrain: applyGrain, speckle: speckle,
    dotPaper: dotPaper, gridPaper: gridPaper, dottedPath: dottedPath,
    spiralPts: spiralPts, masked: masked, featherMask: featherMask
  };
})(window.PT = window.PT || {});
