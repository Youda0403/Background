/* Photo pipeline: load → tone → place.
   The point of the tone stage is that an ordinary selca ends up
   printed in the wallpaper's own inks, so it reads as part of the
   artwork rather than a snapshot pasted on top. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim;

  var WORK_MAX = 1400;      // working resolution for pixel ops
  var state = { img: null, token: 0, name: '' };
  var cache = { key: '', canvas: null };

  function load(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) {
        reject(new Error('not an image'));
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        state.img = img;
        state.token++;
        state.name = file.name || 'photo';
        cache.key = '';
        resolve(img);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
      img.src = url;
    });
  }

  function clear() {
    state.img = null;
    state.token++;
    cache.key = '';
  }

  function has() { return !!state.img; }

  /* ---------- tone ---------- */

  function saturate(d, amt) {
    for (var i = 0; i < d.length; i += 4) {
      var l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      d[i] = l + (d[i] - l) * amt;
      d[i + 1] = l + (d[i + 1] - l) * amt;
      d[i + 2] = l + (d[i + 2] - l) * amt;
    }
  }

  function levels(d, brightness, contrast) {
    var c = contrast, b = brightness * 255;
    for (var i = 0; i < d.length; i += 4) {
      d[i] = (d[i] - 128) * c + 128 + b;
      d[i + 1] = (d[i + 1] - 128) * c + 128 + b;
      d[i + 2] = (d[i + 2] - 128) * c + 128 + b;
    }
  }

  /* Lifts the whole image toward one colour — a faded, printed-on-paper
     look that leaves the original hues recognisable. */
  function veil(d, light, amount) {
    var c = U.hex2rgb(light);
    for (var i = 0; i < d.length; i += 4) {
      d[i] += (c[0] - d[i]) * amount;
      d[i + 1] += (c[1] - d[i + 1]) * amount;
      d[i + 2] += (c[2] - d[i + 2]) * amount;
    }
  }

  function duotone(d, dark, light, amount) {
    var a = U.hex2rgb(dark), b = U.hex2rgb(light);
    for (var i = 0; i < d.length; i += 4) {
      var l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      l = U.clamp(l, 0, 1);
      for (var k = 0; k < 3; k++) {
        var mapped = a[k] + (b[k] - a[k]) * l;
        d[i + k] = d[i + k] + (mapped - d[i + k]) * amount;
      }
    }
  }

  /* Downscale/upscale blur — no ctx.filter needed, works in every browser. */
  function blurCanvas(src, amount) {
    if (amount <= 0.001) return src;
    var f = U.clamp(1 - amount * 0.9, 0.06, 1);
    var sw = Math.max(2, Math.round(src.width * f));
    var sh = Math.max(2, Math.round(src.height * f));
    var small = document.createElement('canvas');
    small.width = sw; small.height = sh;
    var sg = small.getContext('2d');
    sg.imageSmoothingQuality = 'high';
    sg.drawImage(src, 0, 0, sw, sh);
    var out = document.createElement('canvas');
    out.width = src.width; out.height = src.height;
    var og = out.getContext('2d');
    og.imageSmoothingQuality = 'high';
    og.drawImage(small, 0, 0, out.width, out.height);
    return out;
  }

  /* Returns a toned copy of the photo at working resolution. */
  function toned(o) {
    if (!state.img) return null;
    var key = [state.token, o.tone, o.brightness, o.contrast, o.saturation,
      o.blur, o.duoDark, o.duoLight, o.toneAmount].join('|');
    if (cache.key === key && cache.canvas) return cache.canvas;

    var img = state.img;
    var scale = Math.min(1, WORK_MAX / Math.max(img.width, img.height));
    var w = Math.max(2, Math.round(img.width * scale));
    var h = Math.max(2, Math.round(img.height * scale));

    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, w, h);

    var data = g.getImageData(0, 0, w, h);
    var d = data.data;

    levels(d, o.brightness, o.contrast);

    if (o.tone === 'duo') {
      saturate(d, 0);
      duotone(d, o.duoDark, o.duoLight, o.toneAmount);
    } else if (o.tone === 'mono' || o.tone === 'halftone') {
      saturate(d, 0);
    } else if (o.tone === 'wash') {
      /* Wash keeps the photo's own hues and fades them into the paper,
         like a sun-bleached print. Duotone replaces the hues outright.
         Making these two visibly different matters more than either
         being subtle — they used to be near-identical. */
      saturate(d, U.clamp(o.saturation * (1 - o.toneAmount * 0.3), 0, 2));
      veil(d, o.duoLight, o.toneAmount * 0.55);
      levels(d, 0, 1 + o.toneAmount * 0.18);
    } else {
      saturate(d, o.saturation);
    }
    g.putImageData(data, 0, 0);

    var out = blurCanvas(c, o.blur);
    cache.key = key;
    cache.canvas = out;
    return out;
  }

  /* ---------- halftone ---------- */

  /* `invert` flips which end of the tonal range gets ink. A halftone lays
     ink where the picture is dark — correct while the ink is darker than
     the stock. Print light ink on dark stock and that rule produces a
     negative: the sun comes out as a hole and the shadows as solid light.
     So when the ink is the lighter of the two, coverage follows brightness
     instead. */
  function halftone(src, outW, outH, cell, ink, angle, contrast, ox, oy, zoom, invert) {
    outW = Math.max(1, Math.round(outW));
    outH = Math.max(1, Math.round(outH));
    var out = document.createElement('canvas');
    out.width = outW; out.height = outH;
    var g = out.getContext('2d');

    /* sample buffer: one pixel per halftone cell, cover-cropped */
    var sw = U.clamp(Math.ceil(outW / cell), 8, 500);
    var sh = U.clamp(Math.ceil(outH / cell), 8, 500);
    var sc = document.createElement('canvas');
    sc.width = sw; sc.height = sh;
    var sg = sc.getContext('2d');
    drawCover(sg, src, 0, 0, sw, sh, ox == null ? 0.5 : ox, oy == null ? 0.5 : oy, zoom || 1);
    var sd = sg.getImageData(0, 0, sw, sh).data;

    function lumAt(x, y) {
      var ix = U.clamp(Math.floor((x / outW) * sw), 0, sw - 1);
      var iy = U.clamp(Math.floor((y / outH) * sh), 0, sh - 1);
      var i = (iy * sw + ix) * 4;
      var l = (0.2126 * sd[i] + 0.7152 * sd[i + 1] + 0.0722 * sd[i + 2]) / 255;
      return U.clamp((l - 0.5) * contrast + 0.5, 0, 1);
    }

    g.fillStyle = ink;
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var diag = Math.hypot(outW, outH);
    var n = Math.ceil(diag / cell) + 2;
    var cx = outW / 2, cy = outH / 2;
    for (var i = -n; i <= n; i++) {
      for (var j = -n; j <= n; j++) {
        var lx = i * cell, ly = j * cell;
        var x = cx + lx * cos - ly * sin;
        var y = cy + lx * sin + ly * cos;
        if (x < -cell || y < -cell || x > outW + cell || y > outH + cell) continue;
        var l = lumAt(x, y);
        var cov = invert ? l : 1 - l;
        var r = (cell * 0.72) * Math.sqrt(cov);
        if (r < cell * 0.05) continue;
        g.beginPath();
        g.arc(x, y, r, 0, P.TAU);
        g.fill();
      }
    }
    return out;
  }

  /* ---------- placement ---------- */

  /* Cover-fit `src` into a rect, honouring pan (ox/oy in 0..1) and zoom. */
  function drawCover(ctx, src, x, y, w, h, ox, oy, zoom) {
    var sw = src.width, sh = src.height;
    var s = Math.max(w / sw, h / sh) * (zoom || 1);
    var dw = sw * s, dh = sh * s;
    var dx = x + (w - dw) * U.clamp(ox == null ? 0.5 : ox, 0, 1);
    var dy = y + (h - dh) * U.clamp(oy == null ? 0.5 : oy, 0, 1);
    ctx.drawImage(src, dx, dy, dw, dh);
  }

  /* Draw the photo into `frame` under `shape`, feathered and blended. */
  function place(ctx, frame, shape, o, palette) {
    var src = toned(o);
    if (!src) return;

    var w = frame.w, h = frame.h;
    var body;

    if (o.tone === 'halftone') {
      var cell = Math.max(2, (Math.min(w, h) / U.clamp(o.halftoneCells, 12, 140)));
      body = halftone(src, w, h, cell, o.inkColor || palette.duo[0], -0.26,
        1.05 + o.contrast * 0.1, o.ox, o.oy, o.zoom, o.halftoneInvert);
    } else {
      body = P.masked(w, h, function (g, cw, ch) {
        drawCover(g, src, 0, 0, cw, ch, o.ox, o.oy, o.zoom);
      }, function (g, cw, ch) { g.fillStyle = '#000'; g.fillRect(0, 0, cw, ch); });
    }

    /* soft shape mask */
    var shaped = P.masked(w, h, function (g, cw, ch) {
      g.drawImage(body, 0, 0, cw, ch);
    }, function (g, cw, ch) {
      var r = Math.min(cw, ch) / 2;
      if (o.feather > 0.01) {
        P.featherMask(g, function (c2, x2, y2, r2) { shape(c2, cw, ch, r2 / r); }, cw / 2, ch / 2, r, o.feather);
      } else {
        g.fillStyle = '#000';
        shape(g, cw, ch, 1);
        g.fill();
      }
    });

    ctx.save();
    ctx.globalAlpha = o.opacity;
    if (o.blend && o.blend !== 'normal') ctx.globalCompositeOperation = o.blend;
    ctx.translate(frame.x + w / 2, frame.y + h / 2);
    if (o.rotate) ctx.rotate((o.rotate * Math.PI) / 180);
    ctx.drawImage(shaped, -w / 2, -h / 2);
    ctx.restore();

    /* riso-style overprint: a second ink offset a hair from the first */
    if (o.overprint > 0.01) {
      ctx.save();
      ctx.globalAlpha = o.overprint * 0.5;
      ctx.globalCompositeOperation = 'multiply';
      ctx.translate(frame.x + w / 2, frame.y + h / 2);
      if (o.rotate) ctx.rotate((o.rotate * Math.PI) / 180);
      ctx.drawImage(shaped, -w / 2 + w * 0.012, -h / 2 + h * 0.01);
      ctx.restore();
    }
  }

  W.photo = {
    load: load, clear: clear, has: has, place: place,
    drawCover: drawCover, toned: toned, halftone: halftone,
    state: state
  };
})(window.PT = window.PT || {});
