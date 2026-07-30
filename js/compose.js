/* Responsive composition. One implementation of "where does the photo
   go and where does the text go", driven by aspect-ratio tier — this is
   what makes the same design reflow from a Watch face to a Fold. */
(function (W) {
  'use strict';
  var U = W.util, TS = W.textstack;

  var RATIOS = [
    { id: 'square', label: '1 : 1', v: 1 },
    { id: 'portrait45', label: '4 : 5', v: 0.8 },
    { id: 'portrait34', label: '3 : 4', v: 0.75 },
    { id: 'portrait23', label: '2 : 3', v: 0.667 },
    { id: 'tall', label: '9 : 16', v: 0.5625 },
    { id: 'land43', label: '4 : 3', v: 1.333 },
    { id: 'wide169', label: '16 : 9', v: 1.778 }
  ];
  var RATIO_BY_ID = {};
  RATIOS.forEach(function (r) { RATIO_BY_ID[r.id] = r.v; });

  function tierOf(ar) {
    if (ar >= 1.95) return 'tall';
    if (ar >= 1.6) return 'phone';
    if (ar >= 1.15) return 'tablet';
    if (ar >= 0.92) return 'square';
    return 'wide';
  }

  function frac(map, tier, dflt) {
    return map && map[tier] != null ? map[tier] : dflt;
  }

  /* o: { margin, widthFrac:{tier→frac}, gap, bias, align, textFrac } */
  function place(env, o) {
    o = o || {};
    var u = env.u, w = env.w, h = env.h, st = env.st, tier = env.tier;
    var margin = u(o.margin == null ? 92 : o.margin);
    var band = env.band;
    var hasPhoto = env.hasPhoto;
    var gap = u(o.gap == null ? 116 : o.gap);
    var bias = o.bias == null ? 0.42 : o.bias;
    var ratio = RATIO_BY_ID[st.photoRatio] || 1;

    var textAlign = o.align || 'center';
    var out = { photo: null, text: null, avoid: [] };

    /* --- wide canvases: side-by-side, otherwise it all bunches up --- */
    if (tier === 'wide' && hasPhoto) {
      var colGap = u(o.wideGap == null ? 120 : o.wideGap);
      var usable = w - margin * 2 - colGap;
      var pw = usable * (o.wideSplit == null ? 0.44 : o.wideSplit);
      var ph = pw / ratio;
      var maxH = (band.bottom - band.top) * 0.92;
      if (ph > maxH) { ph = maxH; pw = ph * ratio; }
      var py = band.top + (band.bottom - band.top - ph) / 2;
      out.photo = { x: margin + (usable * 0.44 - pw) / 2 + u(20), y: py, w: pw, h: ph };

      var tx = out.photo.x + pw + colGap;
      var tw = w - margin - tx;
      var th = TS.drawStack(env, { x: tx, y: 0, w: tw, align: 'left' }, { measure: true });
      out.text = { x: tx, y: py + (ph - th) / 2, w: tw, align: 'left', anchor: 'top' };
      out.textH = th;
      out.avoid = [
        { x: out.photo.x, y: out.photo.y, w: pw, h: ph },
        { x: tx, y: out.text.y, w: tw, h: th }
      ];
      return out;
    }

    /* --- everything else: vertical stack --- */
    var contentW = w - margin * 2;
    var textW = Math.min(contentW, w * (o.textFrac == null ? 0.86 : o.textFrac));
    var textH = TS.drawStack(env, { x: 0, y: 0, w: textW, align: textAlign }, { measure: true });

    var photoH = 0, photoW = 0;
    if (hasPhoto) {
      photoW = Math.min(contentW, w * frac(o.widthFrac, tier, 0.6));
      photoH = photoW / ratio;
      var cap = (band.bottom - band.top) - textH - gap;
      if (photoH > cap && cap > u(120)) { photoH = cap; photoW = photoH * ratio; }
    }

    var total = photoH + (hasPhoto && textH ? gap : 0) + textH;
    var free = Math.max(0, band.bottom - band.top - total);
    var y0 = band.top + free * bias;

    if (hasPhoto) {
      var px = o.align === 'left' ? margin : (w - photoW) / 2;
      if (o.align === 'right') px = w - margin - photoW;
      out.photo = { x: px, y: y0, w: photoW, h: photoH };
      out.avoid.push({ x: px, y: y0, w: photoW, h: photoH });
      y0 += photoH + (textH ? gap : 0);
    }

    var txx = textAlign === 'left' ? margin : textAlign === 'right' ? w - margin - textW : (w - textW) / 2;
    out.text = { x: txx, y: y0, w: textW, align: textAlign, anchor: 'top' };
    if (textH) out.avoid.push({ x: txx, y: y0, w: textW, h: textH });
    out.textH = textH;
    return out;
  }

  /* Corner/edge slots for scattered tags, chosen per tier so they
     always land in genuine negative space. */
  function tagSpots(env, avoid) {
    var w = env.w, h = env.h, u = env.u, m = u(96);
    var cand = env.tier === 'wide'
      ? [[m, h * 0.18, 'left'], [w - m, h * 0.84, 'right'], [w * 0.5, h * 0.93, 'center'], [m, h * 0.8, 'left']]
      : [[m, h * 0.16, 'left'], [w - m, h * 0.24, 'right'], [m, h * 0.78, 'left'],
         [w - m, h * 0.86, 'right'], [w * 0.5, h * 0.94, 'center'], [w - m, h * 0.6, 'right']];
    return cand.filter(function (c) { return !W.deco.inAny(avoid, c[0], c[1], u(30)); });
  }

  W.compose = { ratios: RATIOS, ratioById: RATIO_BY_ID, tierOf: tierOf, place: place, tagSpots: tagSpots };
})(window.PT = window.PT || {});
