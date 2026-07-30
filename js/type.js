/* Typography. Letter-spacing is applied by hand so the output is
   identical in every browser, including older Safari. */
(function (W) {
  'use strict';
  var U = W.util;

  /* Roster picked for poster work: high-contrast display serifs,
     calligraphic scripts, editorial grotesques, typewriter monos and a
     couple of deliberately kitsch faces. */
  var FONTS = [
    { id: 'didone', label: 'Bodoni Moda', group: '디스플레이 세리프', stack: '"Bodoni Moda", "Didot", Georgia, serif', big: 1.0 },
    { id: 'playfair', label: 'Playfair Display', group: '디스플레이 세리프', stack: '"Playfair Display", Georgia, serif', big: 1.0 },
    { id: 'instrument', label: 'Instrument Serif', group: '디스플레이 세리프', stack: '"Instrument Serif", Georgia, serif', big: 1.05 },
    { id: 'cormorant', label: 'Cormorant', group: '디스플레이 세리프', stack: '"Cormorant Garamond", Georgia, serif', big: 1.12 },
    { id: 'fraunces', label: 'Fraunces', group: '디스플레이 세리프', stack: '"Fraunces", Georgia, serif', big: 0.98 },

    { id: 'pinyon', label: 'Pinyon Script', group: '필기체', stack: '"Pinyon Script", "Snell Roundhand", cursive', big: 1.5, scriptish: true },
    { id: 'italianno', label: 'Italianno', group: '필기체', stack: '"Italianno", "Snell Roundhand", cursive', big: 1.75, scriptish: true },

    { id: 'bricolage', label: 'Bricolage Grotesque', group: '산세리프', stack: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif', big: 0.92 },
    { id: 'archivo', label: 'Archivo', group: '산세리프', stack: '"Archivo", "Helvetica Neue", Arial, sans-serif', big: 0.9 },
    { id: 'syne', label: 'Syne', group: '산세리프', stack: '"Syne", "Helvetica Neue", Arial, sans-serif', big: 0.92 },
    { id: 'anton', label: 'Anton', group: '산세리프', stack: '"Anton", "Arial Narrow", Impact, sans-serif', big: 0.88 },

    { id: 'unbounded', label: 'Unbounded', group: '키치', stack: '"Unbounded", "Helvetica Neue", sans-serif', big: 0.86 },
    { id: 'bagel', label: 'Bagel Fat One', group: '키치', stack: '"Bagel Fat One", "Arial Black", sans-serif', big: 0.88 },

    { id: 'dmmono', label: 'DM Mono', group: '모노', stack: '"DM Mono", ui-monospace, "SF Mono", Menlo, monospace', big: 0.9 },
    { id: 'spacemono', label: 'Space Mono', group: '모노', stack: '"Space Mono", ui-monospace, Menlo, monospace', big: 0.9 }
  ];

  var BY_ID = {};
  FONTS.forEach(function (f) { BY_ID[f.id] = f; });

  /* Old ids from the first release, kept so saved links still open. */
  var ALIASES = {
    'serif-display': 'instrument', 'serif-fine': 'cormorant', 'deco': 'didone',
    'grotesk': 'archivo', 'mono': 'dmmono', 'hand': 'pinyon'
  };

  function resolve(id) { return BY_ID[id] || BY_ID[ALIASES[id]] || FONTS[0]; }
  function stack(id) { return resolve(id).stack; }
  /* Optical size nudge: a script at 100px reads far smaller than Anton. */
  function optical(id) { return resolve(id).big; }
  function isScript(id) { return !!resolve(id).scriptish; }

  function setFont(ctx, fontId, size, opts) {
    opts = opts || {};
    var parts = [];
    if (opts.italic) parts.push('italic');
    parts.push(opts.weight || 400);
    parts.push(Math.max(1, size) + 'px');
    parts.push(stack(fontId));
    ctx.font = parts.join(' ');
  }

  function applyCase(text, mode) {
    if (mode === 'upper') return text.toUpperCase();
    if (mode === 'lower') return text.toLowerCase();
    if (mode === 'title') {
      return text.replace(/\S+/g, function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      });
    }
    return text;
  }

  function measure(ctx, text, tracking) {
    var w = 0;
    for (var i = 0; i < text.length; i++) {
      w += ctx.measureText(text[i]).width;
      if (i < text.length - 1) w += tracking;
    }
    return w;
  }

  /* True ink box of a string — needed to seat display type tightly
     against a photo edge instead of guessing from the em box. */
  function inkBox(ctx, text) {
    var m = ctx.measureText(text || 'H');
    return {
      asc: m.actualBoundingBoxAscent || 0,
      desc: m.actualBoundingBoxDescent || 0,
      left: m.actualBoundingBoxLeft || 0,
      right: m.actualBoundingBoxRight || 0
    };
  }

  /* Draws text with manual tracking. Returns the drawn box. */
  function draw(ctx, text, x, y, opts) {
    opts = opts || {};
    var tracking = opts.tracking || 0;
    var w = measure(ctx, text, tracking);
    var sx = x;
    if (opts.align === 'center') sx = x - w / 2;
    else if (opts.align === 'right') sx = x - w;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    var cx = sx;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (opts.stroke) {
        ctx.lineWidth = opts.strokeWidth || 1;
        ctx.strokeStyle = opts.stroke;
        ctx.strokeText(ch, cx, y);
      }
      if (opts.fill !== false) ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + tracking;
    }
    ctx.restore();
    return { x: sx, y: y, w: w };
  }

  function wrap(ctx, text, maxWidth, tracking) {
    var words = String(text).split(/\s+/).filter(Boolean);
    var lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var next = cur ? cur + ' ' + words[i] : words[i];
      if (measure(ctx, next, tracking) > maxWidth && cur) {
        lines.push(cur);
        cur = words[i];
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /* Shrink until the string fits `maxWidth`. Returns the used size. */
  function fit(ctx, text, fontId, size, maxWidth, trackingRatio, opts) {
    var s = size;
    for (var i = 0; i < 60; i++) {
      setFont(ctx, fontId, s, opts);
      if (measure(ctx, text, s * trackingRatio) <= maxWidth) break;
      s *= 0.96;
    }
    setFont(ctx, fontId, s, opts);
    return s;
  }

  /* Grow *and* shrink so display type always fills its measure — the
     single biggest difference between a poster and a screenshot. */
  function fill(ctx, text, fontId, maxWidth, trackingRatio, opts, cap) {
    if (!text) return 0;
    var lo = 4, hi = cap || 4000;
    for (var i = 0; i < 26; i++) {
      var mid = (lo + hi) / 2;
      setFont(ctx, fontId, mid, opts);
      if (measure(ctx, text, mid * trackingRatio) <= maxWidth) lo = mid; else hi = mid;
    }
    setFont(ctx, fontId, lo, opts);
    return lo;
  }

  function rule(ctx, box, offset, weight, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + offset);
    ctx.lineTo(box.x + box.w, box.y + offset);
    ctx.stroke();
    ctx.restore();
  }

  /* Fonts must be resolved before we rasterise, or canvas silently
     falls back to a system face. */
  function ready() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var jobs = [];
    FONTS.forEach(function (f) {
      var fam = f.stack.split(',')[0];
      ['400 64px ', 'italic 400 64px ', '700 64px ', '900 64px '].forEach(function (p) {
        try { jobs.push(document.fonts.load(p + fam).catch(function () {})); } catch (e) { /* ignore */ }
      });
    });
    return Promise.all(jobs).then(function () { return document.fonts.ready; })
      .catch(function () {});
  }

  W.type = {
    fonts: FONTS, byId: BY_ID, aliases: ALIASES, resolve: resolve,
    stack: stack, optical: optical, isScript: isScript,
    setFont: setFont, applyCase: applyCase, measure: measure, inkBox: inkBox,
    draw: draw, wrap: wrap, fit: fit, fill: fill, rule: rule, ready: ready
  };
})(window.PT = window.PT || {});
