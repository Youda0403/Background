/* Resolves the user's fields into a stack of lines, then draws that
   stack. Every layout reuses this so typography stays consistent. */
(function (W) {
  'use strict';
  var T = W.type, U = W.util;

  var SEPARATORS = [
    { id: 'x', label: '×', glyph: ' × ' },
    { id: 'heart', label: '♡', glyph: ' ♡ ' },
    { id: 'amp', label: '&', glyph: ' & ' },
    { id: 'dot', label: '·', glyph: ' · ' },
    { id: 'plus', label: '+', glyph: ' + ' },
    { id: 'slash', label: '/', glyph: ' / ' },
    { id: 'star', label: '✦', glyph: ' ✦ ' },
    { id: 'dash', label: '—', glyph: ' — ' },
    { id: 'space', label: 'space', glyph: '   ' }
  ];
  var SEP_BY_ID = {};
  SEPARATORS.forEach(function (s) { SEP_BY_ID[s.id] = s; });

  function initials(s) {
    return String(s).split(/[\s._-]+/).filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  }

  function joinNames(st) {
    var a = st.nameA.trim(), b = st.nameB.trim();
    var glyph = (SEP_BY_ID[st.sep] || SEP_BY_ID.x).glyph;
    if (a && b) return a + glyph + b;
    return a || b;
  }

  function monogram(st) {
    var a = st.nameA.trim(), b = st.nameB.trim();
    var glyph = (SEP_BY_ID[st.sep] || SEP_BY_ID.x).glyph;
    if (a && b) return initials(a) + glyph + initials(b);
    return initials(a || b || st.pairName);
  }

  /* What actually gets drawn, in order. */
  function build(st) {
    var out = { title: '', names: '', caption: '', footnote: '', tags: [] };
    var joined = joinNames(st);

    if (st.titleMode === 'pair') out.title = st.pairName.trim();
    else if (st.titleMode === 'names') out.title = joined;
    else if (st.titleMode === 'monogram') out.title = monogram(st);

    if (st.showNames && st.titleMode !== 'names' && joined) out.names = joined;
    if (st.titleMode === 'names' && st.pairName.trim() && st.showNames) out.names = st.pairName.trim();

    out.caption = st.caption.trim();
    out.footnote = st.footnote.trim();
    out.tags = String(st.tags || '').split(',').map(function (s) { return s.trim(); })
      .filter(Boolean).slice(0, 8);
    return out;
  }

  /* Draws title / names / caption / footnote inside `box`.
     box: { x, y, w, align: 'left'|'center'|'right', anchor: 'top'|'bottom' }
     Returns total height consumed. */
  function drawStack(env, box, opts) {
    opts = opts || {};
    var ctx = env.ctx, st = env.st, u = env.u, c = env.content;
    var color = opts.color || env.pal.text;
    var em = env.emphasis;
    var ts = env.typeScale || 1;
    var align = box.align || 'center';
    var ax = align === 'left' ? box.x : align === 'right' ? box.x + box.w : box.x + box.w / 2;

    var lines = [];

    if (c.title) {
      var tSize = u(st.titleSize) * ts * (opts.titleScale || 1) * U.lerp(0.62, 1, em);
      var tTrack = st.titleTrack / 1000;
      T.setFont(ctx, st.titleFont, tSize, { italic: st.titleItalic, weight: st.titleWeight });
      var txt = T.applyCase(c.title, st.titleCase);
      tSize = T.fit(ctx, txt, st.titleFont, tSize, box.w, tTrack,
        { italic: st.titleItalic, weight: st.titleWeight });
      lines.push({ kind: 'title', text: txt, size: tSize, track: tSize * tTrack,
        font: st.titleFont, italic: st.titleItalic, weight: st.titleWeight,
        gapAfter: tSize * 0.42, alpha: 1 });
    }

    if (c.names) {
      var nSize = u(st.bodySize) * ts * U.lerp(0.82, 1, em);
      T.setFont(ctx, st.bodyFont, nSize, {});
      var ntxt = T.applyCase(c.names, st.bodyCase);
      nSize = T.fit(ctx, ntxt, st.bodyFont, nSize, box.w, st.bodyTrack / 1000, {});
      lines.push({ kind: 'names', text: ntxt, size: nSize, track: nSize * st.bodyTrack / 1000,
        font: st.bodyFont, gapAfter: nSize * 0.9, alpha: 0.92 });
    }

    if (c.caption && !env.micro) {
      var cSize = u(st.bodySize) * 0.86 * U.lerp(0.85, 1, em);
      T.setFont(ctx, st.bodyFont, cSize, { italic: opts.captionItalic });
      var track = cSize * (st.bodyTrack / 1000) * 0.6;
      var wrapped = T.wrap(ctx, c.caption, box.w, track);
      wrapped.forEach(function (ln, i) {
        lines.push({ kind: 'caption', text: ln, size: cSize, track: track,
          font: st.bodyFont, italic: opts.captionItalic,
          gapAfter: i === wrapped.length - 1 ? cSize * 1.05 : cSize * 0.42,
          alpha: 0.86, underline: st.captionRule });
      });
    }

    if (c.footnote && !env.micro) {
      var fSize = u(st.bodySize) * 0.62 * U.lerp(0.88, 1, em);
      T.setFont(ctx, 'mono', fSize, {});
      var ftxt = T.applyCase(c.footnote, 'upper');
      lines.push({ kind: 'footnote', text: ftxt, size: fSize,
        track: fSize * 0.18, font: 'mono', gapAfter: 0, alpha: 0.7 });
    }

    if (!lines.length) return 0;

    var total = lines.reduce(function (acc, l) { return acc + l.size * 1.02 + l.gapAfter; }, 0);
    if (opts.measure) return total;

    var y = box.anchor === 'bottom' ? box.y - total : box.y;
    y += lines[0].size * 0.86;

    ctx.save();
    lines.forEach(function (l) {
      T.setFont(ctx, l.font, l.size, { italic: l.italic, weight: l.weight });
      ctx.globalAlpha = l.alpha * (opts.alpha == null ? 1 : opts.alpha);
      ctx.fillStyle = color;
      var boxOut = T.draw(ctx, l.text, ax, y, { align: align, tracking: l.track });
      if (l.underline) {
        T.rule(ctx, boxOut, l.size * 0.26, Math.max(1, l.size * 0.045), color, 0.55);
      }
      y += l.size * 1.02 + l.gapAfter;
    });
    ctx.restore();

    return total;
  }

  /* Small parenthesised words scattered in the negative space —
     the "(love)  (times)" trick from the jellyfish board. */
  function drawTags(env, spots, opts) {
    opts = opts || {};
    var ctx = env.ctx, st = env.st, u = env.u;
    var tags = env.content.tags;
    if (!tags.length || !st.showTags || env.micro) return;
    var size = u(st.bodySize) * 0.5 * U.lerp(0.85, 1, env.emphasis);
    ctx.save();
    ctx.fillStyle = opts.color || env.pal.text;
    for (var i = 0; i < spots.length && i < tags.length; i++) {
      T.setFont(ctx, 'mono', size, {});
      ctx.globalAlpha = (opts.alpha == null ? 0.55 : opts.alpha) * env.decoAlpha;
      T.draw(ctx, '(' + tags[i].toLowerCase() + ')', spots[i][0], spots[i][1],
        { align: spots[i][2] || 'center', tracking: size * 0.06 });
    }
    ctx.restore();
  }

  W.textstack = {
    separators: SEPARATORS, build: build, drawStack: drawStack,
    drawTags: drawTags, joinNames: joinNames, monogram: monogram
  };
})(window.PT = window.PT || {});
