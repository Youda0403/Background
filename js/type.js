/* Typography helpers. Letter-spacing is applied by hand so the
   output is identical in every browser, including older Safari. */
(function (W) {
  'use strict';
  var U = W.util;

  var FONTS = [
    { id: 'serif-display', label: 'Instrument Serif', stack: '"Instrument Serif", "Times New Roman", Georgia, serif', case: 'none' },
    { id: 'serif-fine', label: 'Cormorant', stack: '"Cormorant Garamond", Georgia, "Times New Roman", serif', case: 'none' },
    { id: 'deco', label: 'Italiana', stack: '"Italiana", "Didot", Georgia, serif', case: 'upper' },
    { id: 'grotesk', label: 'Inter', stack: '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif', case: 'none' },
    { id: 'mono', label: 'DM Mono', stack: '"DM Mono", ui-monospace, "SF Mono", Menlo, monospace', case: 'none' },
    { id: 'hand', label: 'Caveat', stack: '"Caveat", "Segoe Script", cursive', case: 'none' }
  ];
  var BY_ID = {};
  FONTS.forEach(function (f) { BY_ID[f.id] = f; });

  function stack(id) { return (BY_ID[id] || FONTS[0]).stack; }

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

  /* Draws text with manual tracking. `align` is left | center | right.
     Returns { x, y, w } of the drawn box. */
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

  /* Word-wrap to a pixel width; honours tracking. */
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
    for (var i = 0; i < 40; i++) {
      setFont(ctx, fontId, s, opts);
      if (measure(ctx, text, s * trackingRatio) <= maxWidth) break;
      s *= 0.94;
    }
    setFont(ctx, fontId, s, opts);
    return s;
  }

  /* Thin rule under a text box — the underlined captions in the refs. */
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
      ['400 64px ', 'italic 400 64px ', '500 64px '].forEach(function (p) {
        jobs.push(document.fonts.load(p + f.stack.split(',')[0]).catch(function () {}));
      });
    });
    return Promise.all(jobs).then(function () { return document.fonts.ready; })
      .catch(function () {});
  }

  W.type = {
    fonts: FONTS, byId: BY_ID, stack: stack, setFont: setFont,
    applyCase: applyCase, measure: measure, draw: draw, wrap: wrap,
    fit: fit, rule: rule, ready: ready
  };
})(window.PT = window.PT || {});
