/* Poster furniture — the grammar the reference boards share:
   a paper substrate, a hairline frame, thin rails of small-caps text at
   the top and bottom, micro-text blocks in the corners, and one display
   headline big enough to carry the whole page.

   Layouts assemble these; they no longer place type by hand. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, T = W.type;

  /* ---------- substrate ---------- */

  function paper(env, opts) {
    opts = opts || {};
    var ctx = env.ctx, w = env.w, h = env.h, pal = env.pal;
    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    /* two very wide, very faint washes so the paper is never dead flat */
    if (opts.tint !== false) {
      P.wash(ctx, w * 0.18, h * 0.1, env.S * 1.1, pal.soft[0], 0.24 * env.st.washStrength);
      P.wash(ctx, w * 0.88, h * 0.92, env.S * 1.2, pal.soft[1] || pal.soft[0],
        0.2 * env.st.washStrength);
    }
  }

  /* A sheet of paper laid *on* the page — a torn photograph, a pasted
     card, a dictionary column. On a light palette it is the page colour
     and nothing looks different; on a dark one it stays light, because a
     dark panel on a dark page is not a piece of paper, it is a hole you
     cannot see. Returns the stock and an ink that reads on it. */
  function stock(pal) {
    var dark = U.luma(pal.base) < 0.42;
    if (!dark) return { paper: pal.base, ink: pal.text, sub: pal.text };
    var sheet = U.luma(pal.duo[1]) > 0.62 ? pal.duo[1] : U.mix(pal.base, '#f2efe6', 0.86);
    /* the darkest thing in the palette that is not the page itself */
    var ink = U.luma(pal.duo[0]) < 0.5 ? pal.duo[0] : pal.base;
    return { paper: sheet, ink: ink, sub: U.mix(ink, sheet, 0.35) };
  }

  /* The accent, guaranteed to read on a given background. A dark palette
     picks a light accent so it carries on the page — but Column prints it
     on a light card, where that same colour disappears. Deepen it and
     keep the hue rather than reaching for a different colour. */
  function accentOn(pal, bg) {
    var a = pal.accent || pal.inks[0];
    var lb = U.luma(bg);
    if (Math.abs(U.luma(a) - lb) >= 0.3) return a;
    return U.mix(a, lb > 0.5 ? '#141412' : '#ffffff', 0.5);
  }

  /* ---------- geometry ---------- */

  /* The classic poster margin. The top starts at the keep-out band rather
     than halfway into it: otherwise the lock-screen clock sits on top of
     the rail and the whole strip above it is wasted. */
  function margins(env) {
    var m = env.u(env.tier === 'wide' ? 62 : 74);
    return {
      left: m, right: m,
      top: Math.max(m, env.band.top),
      bottom: Math.max(m, env.h - env.band.bottom),
      inner: env.w - m * 2
    };
  }

  function frame(env, m, opts) {
    opts = opts || {};
    var ctx = env.ctx;
    ctx.save();
    ctx.globalAlpha = (opts.alpha == null ? 0.55 : opts.alpha) * env.decoAlpha;
    ctx.strokeStyle = opts.color || env.pal.text;
    ctx.lineWidth = Math.max(1, env.u(opts.weight || 1.6));
    ctx.strokeRect(m.left, m.top, env.w - m.left - m.right, env.h - m.top - m.bottom);
    ctx.restore();
  }

  /* Crop marks instead of a full frame — lighter, more editorial. */
  function corners(env, m, opts) {
    opts = opts || {};
    var ctx = env.ctx;
    var len = env.u(opts.len || 44);
    var x0 = m.left, y0 = m.top, x1 = env.w - m.right, y1 = env.h - m.bottom;
    ctx.save();
    ctx.globalAlpha = (opts.alpha == null ? 0.8 : opts.alpha) * env.decoAlpha;
    ctx.strokeStyle = opts.color || env.pal.text;
    ctx.lineWidth = Math.max(1, env.u(opts.weight || 2));
    ctx.beginPath();
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(function (c) {
      ctx.moveTo(c[0], c[1] + len * c[3]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(c[0] + len * c[2], c[1]);
    });
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- small type ---------- */

  function micro(env) {
    return env.u(env.tier === 'tall' ? 21 : 22) * (env.typeScale || 1)
      * (env.st.microScale || 1);
  }

  /* A rail of tiny tracked caps: left / centre / right. */
  function rail(env, y, parts, opts) {
    opts = opts || {};
    var ctx = env.ctx, m = opts.m || margins(env);
    var size = (opts.size || micro(env));
    ctx.save();
    ctx.fillStyle = opts.color || env.pal.text;
    ctx.globalAlpha = (opts.alpha == null ? 0.72 : opts.alpha);
    T.setFont(ctx, opts.font || 'dmmono', size, {});

    /* Left and right ends used to overlap when a name ran long. Shrink to
       fit, then truncate — a rail is furniture and must never collide. */
    var tr = size * 0.16;
    var gap = size * 1.2;
    var wL = parts[0] ? T.measure(ctx, parts[0], tr) : 0;
    var wC = parts[1] ? T.measure(ctx, parts[1], tr) : 0;
    var wR = parts[2] ? T.measure(ctx, parts[2], tr) : 0;
    var need = wL + wC + wR + (wC ? gap * 2 : gap);
    if (need > m.inner) {
      size *= Math.max(0.62, m.inner / need);
      T.setFont(ctx, opts.font || 'dmmono', size, {});
      tr = size * 0.16;
      gap = size * 1.2;
      wL = parts[0] ? T.measure(ctx, parts[0], tr) : 0;
      wC = parts[1] ? T.measure(ctx, parts[1], tr) : 0;
      wR = parts[2] ? T.measure(ctx, parts[2], tr) : 0;
    }
    var left = parts[0];
    var budget = m.inner - wC - wR - (wC ? gap * 2 : gap);
    if (left && T.measure(ctx, left, tr) > budget) {
      while (left.length > 2 && T.measure(ctx, left + '…', tr) > budget) left = left.slice(0, -1);
      left += '…';
    }

    if (left) T.draw(ctx, left, m.left, y, { align: 'left', tracking: tr });
    if (parts[1]) T.draw(ctx, parts[1], m.left + m.inner / 2, y, { align: 'center', tracking: tr });
    if (parts[2]) T.draw(ctx, parts[2], env.w - m.right, y, { align: 'right', tracking: tr });
    ctx.restore();
    return size;
  }

  /* Stacked tiny lines. `mark` prefixes the first line (※, ✦ …). */
  function block(env, x, y, maxW, lines, opts) {
    opts = opts || {};
    var ctx = env.ctx;
    var size = opts.size || micro(env);
    var lead = size * (opts.lead || 1.5);
    var align = opts.align || 'left';
    var ax = align === 'right' ? x + maxW : align === 'center' ? x + maxW / 2 : x;

    ctx.save();
    ctx.fillStyle = opts.color || env.pal.text;
    ctx.globalAlpha = opts.alpha == null ? 0.82 : opts.alpha;
    T.setFont(ctx, opts.font || 'archivo', size, { weight: opts.weight || 400, italic: opts.italic });

    var out = [];
    lines.forEach(function (raw) {
      T.wrap(ctx, raw, maxW, size * 0.02).forEach(function (l) { out.push(l); });
    });

    if (opts.measure) {
      ctx.restore();
      return out.length ? (out.length - 1) * lead + size * 1.3 : 0;
    }

    var yy = y + size;
    out.forEach(function (l, i) {
      var b = T.draw(ctx, opts.upper === false ? l : l.toUpperCase(), ax, yy,
        { align: align, tracking: size * (opts.tracking == null ? 0.06 : opts.tracking) });
      if (opts.underlineFirst && i === 0) {
        T.rule(ctx, b, size * 0.34, Math.max(1, size * 0.06), opts.color || env.pal.text, 0.6);
      }
      yy += lead;
    });
    ctx.restore();
    return yy - y - lead + size * 0.3;
  }

  /* Rotated edge label, as on gallery flyers. */
  function sideLabel(env, text, opts) {
    opts = opts || {};
    var ctx = env.ctx, m = opts.m || margins(env);
    var size = opts.size || micro(env);
    var right = opts.side !== 'left';
    ctx.save();
    ctx.fillStyle = opts.color || env.pal.text;
    ctx.globalAlpha = opts.alpha == null ? 0.7 : opts.alpha;
    T.setFont(ctx, opts.font || 'dmmono', size, {});
    ctx.translate(right ? env.w - m.right + size * 1.2 : m.left - size * 0.5,
      opts.y == null ? env.h * 0.5 : opts.y);
    ctx.rotate(right ? Math.PI / 2 : -Math.PI / 2);
    T.draw(ctx, text, 0, 0, { align: 'center', tracking: size * 0.22 });
    ctx.restore();
  }

  /* ---------- display headline ---------- */

  /* Splits the user's words into the lockup's lines.

     An explicit line break in the pair name always wins — that is the
     control the user reaches for first — and a single-line name falls
     back to splitting at the first space, which is what gives the
     reference posters their "Spirit / of nature." voice. */
  function headlineText(env) {
    var c = env.content;
    var title = (c.title || '').replace(/\r/g, '');

    if (title.indexOf('\n') >= 0) {
      var parts = title.split('\n').map(function (t) { return t.trim(); }).filter(Boolean);
      return { lines: parts.slice(0, 3), eyebrow: c.names };
    }

    var words = title.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      var cut = words[0].length >= 4 || words.length === 2 ? 1 : 2;
      return {
        lines: [words.slice(0, cut).join(' '), words.slice(cut).join(' ')],
        eyebrow: c.names
      };
    }
    if (words.length === 1) return { lines: [words[0]], eyebrow: c.names };
    return { lines: c.names ? [c.names] : [], eyebrow: '' };
  }

  /* Draws the lockup inside `box` {x, y, w} and returns its bounds.
     `anchor` — 'top' seats the ink top at box.y, 'bottom' the ink foot. */
  function headline(env, box, opts) {
    opts = opts || {};
    var ctx = env.ctx, st = env.st;
    var txt = opts.text || headlineText(env);
    var body = (txt.lines || []).filter(Boolean);
    if (!body.length) return { x: box.x, y: box.y, w: 0, h: 0, bottom: box.y };

    var style = opts.style || st.headlineStyle || 'scriptSans';
    var em = U.lerp(0.72, 1, env.emphasis) * (st.headlineScale || 1);

    /* The title font always sets the biggest line, in every style. It used
       to be bypassed by the script styles, so changing "제목 폰트" appeared
       to do nothing — the single most confusing thing in the panel. */
    var small = { font: st.bodyFont, weight: 500, kase: 'upper', track: 0.2, w: 0.42, small: true };
    var bigSpec = {
      font: st.titleFont, weight: 400, kase: 'none', track: 0,
      w: T.isScript(st.titleFont) ? 0.94 : 1, script: T.isScript(st.titleFont)
    };
    /* only the "first line differs" style reaches for a second face */
    var firstSpec = { font: st.scriptFont, weight: 400, kase: 'none', track: 0, w: 0.94, script: true };
    /* the sans line takes a little less measure so the script stays the
       hero of the pairing rather than the two fighting for the width */
    var sansSpec = { font: st.titleFont, weight: opts.l2Weight || 500, kase: 'none', track: 0, w: 0.84 };
    var serifSpec = { font: st.titleFont, weight: 400, kase: 'upper', track: 0.02, w: 1 };
    var plainSpec = { font: st.titleFont, weight: 400, kase: 'none', track: 0.01, w: 1 };

    var lines = [];
    if (style === 'capsScript') {
      if (txt.eyebrow && opts.eyebrow !== false) lines.push({ text: txt.eyebrow, s: small });
      body.forEach(function (t) { lines.push({ text: t, s: bigSpec }); });
    } else if (style === 'didone') {
      body.forEach(function (t) { lines.push({ text: t, s: serifSpec }); });
    } else if (style === 'stack') {
      body.forEach(function (t) { lines.push({ text: t, s: plainSpec }); });
    } else { /* scriptSans — the first line in a second face, then the title font */
      body.forEach(function (t, i) {
        lines.push({ text: t, s: i === 0 && body.length > 1 ? firstSpec : sansSpec });
      });
    }

    lines.forEach(function (ln) { ln.text = T.applyCase(ln.text, ln.s.kase); });

    var cap = env.u(420);
    lines.forEach(function (ln) {
      /* Scripts overhang their advance widths with swashes, so they get a
         little less measure. Nothing is scaled after the fit — doing that
         is what previously pushed headlines off the page. */
      var slack = ln.s.script || T.isScript(ln.s.font) ? 0.94 : 1;
      var target = box.w * ln.s.w * (ln.s.small ? 0.6 : 1) * em * slack;
      var size = T.fill(ctx, ln.text, ln.s.font, target, ln.s.track,
        { weight: ln.s.weight, italic: ln.s.italic }, cap);
      if (ln.s.small) size = Math.min(size, micro(env) * 2.1);
      T.setFont(ctx, ln.s.font, size, { weight: ln.s.weight, italic: ln.s.italic });
      ln.size = size;
      ln.ink = T.inkBox(ctx, ln.text);
      ln.w = T.measure(ctx, ln.text, size * ln.s.track);
    });

    /* Tight optical leading from real ink boxes, not the em box. */
    var gaps = [];
    for (var i = 1; i < lines.length; i++) {
      var prev = lines[i - 1], cur = lines[i];
      var overlap = (prev.s.script || cur.s.script) ? 0.26 : 0.1;
      gaps.push(prev.ink.desc + cur.ink.asc - Math.min(prev.ink.desc, cur.ink.asc) * overlap
        + (prev.s.small ? prev.size * 0.5 : 0));
    }
    var total = lines[0].ink.asc + lines[0].ink.desc;
    for (var j = 1; j < lines.length; j++) total += gaps[j - 1] + lines[j].ink.desc;

    /* On squarer canvases a tall lockup can swallow the page; pull the
       whole thing down proportionally rather than letting it collide. */
    var maxH = opts.maxH || env.h * 0.44;
    if (total > maxH) {
      var k = maxH / total;
      lines.forEach(function (ln) {
        ln.size *= k;
        T.setFont(ctx, ln.s.font, ln.size, { weight: ln.s.weight, italic: ln.s.italic });
        ln.ink = T.inkBox(ctx, ln.text);
        ln.w = T.measure(ctx, ln.text, ln.size * ln.s.track);
      });
      for (var gi = 0; gi < gaps.length; gi++) gaps[gi] *= k;
      total *= k;
    }

    var yTop = opts.anchor === 'bottom' ? box.y - total : box.y;
    var baseline = yTop + lines[0].ink.asc;

    var align = opts.align || 'left';
    var ax = align === 'right' ? box.x + box.w : align === 'center' ? box.x + box.w / 2 : box.x;

    var minX = Infinity, maxX = -Infinity;
    lines.forEach(function (ln) {
      var lx = align === 'right' ? ax - ln.w : align === 'center' ? ax - ln.w / 2 : ax;
      minX = Math.min(minX, lx);
      maxX = Math.max(maxX, lx + ln.w);
    });
    var bounds = { x: minX, y: yTop, w: maxX - minX, h: total, bottom: yTop + total };
    if (opts.measure) return bounds;

    /* Baselines first, then draw the plain lines and the script lines in
       two passes. A script's descender is meant to sweep across the line
       below it — drawing in reading order buried those tails under the
       next line's ink, which is what looked wrong. */
    var bl = [];
    lines.forEach(function (ln, k2) {
      bl.push(baseline);
      if (k2 < lines.length - 1) baseline += gaps[k2];
    });

    ctx.save();
    var order = [];
    lines.forEach(function (ln, k2) { if (!ln.s.script) order.push(k2); });
    lines.forEach(function (ln, k2) { if (ln.s.script) order.push(k2); });

    order.forEach(function (k2) {
      var ln = lines[k2];
      var lineBaseline = bl[k2];
      T.setFont(ctx, ln.s.font, ln.size, { weight: ln.s.weight, italic: ln.s.italic });
      ctx.fillStyle = (ln.s.script && opts.scriptColor) ? opts.scriptColor
        : (opts.color || env.pal.text);
      ctx.globalAlpha = ln.s.script && opts.scriptAlpha != null ? opts.scriptAlpha
        : (opts.alpha == null ? 1 : opts.alpha);
      var lx = ax + (ln.s.script && align === 'left' ? -ln.size * 0.04 : 0);
      var b = T.draw(ctx, ln.text, lx, lineBaseline, { align: align, tracking: ln.size * ln.s.track });
      if (ln.s.small && opts.ruleAfterSmall) {
        var rx = b.x + b.w + ln.size * 0.5;
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = opts.color || env.pal.text;
        ctx.lineWidth = Math.max(1, env.u(1.8));
        ctx.beginPath();
        ctx.moveTo(rx, lineBaseline - ln.size * 0.28);
        ctx.lineTo(box.x + box.w, lineBaseline - ln.size * 0.28);
        ctx.stroke();
      }
    });
    ctx.restore();

    return bounds;
  }

  /* ---------- accents ---------- */

  /* Bursts and sparkles placed relative to a rect's edges, so they always
     land on the composition instead of being sprinkled at random. */
  function accents(env, anchor, opts) {
    opts = opts || {};
    var ctx = env.ctx, rand = env.rand, u = env.u;
    var kinds = opts.kinds || env.st.motifs;
    var colors = opts.colors || env.pal.inks;
    var n = Math.max(0, Math.round(opts.count == null ? env.decoBudget : opts.count));
    if (!n) return;

    /* Candidate spots walk the anchor's perimeter, corners first, so the
       requested number of decorations can actually all be placed. */
    var corners = [
      [anchor.x, anchor.y, 1.0], [anchor.x + anchor.w, anchor.y + anchor.h, 1.0],
      [anchor.x + anchor.w, anchor.y, 0.8], [anchor.x, anchor.y + anchor.h, 0.75]
    ];
    var spots = corners.slice();
    var ring = Math.max(4, n);
    for (var q = 0; q < ring; q++) {
      var t = (q + 0.5) / ring;
      var per = t * 4;
      var side = Math.floor(per), f = per - side;
      var px, py;
      if (side === 0) { px = anchor.x + anchor.w * f; py = anchor.y; }
      else if (side === 1) { px = anchor.x + anchor.w; py = anchor.y + anchor.h * f; }
      else if (side === 2) { px = anchor.x + anchor.w * (1 - f); py = anchor.y + anchor.h; }
      else { px = anchor.x; py = anchor.y + anchor.h * (1 - f); }
      spots.push([px, py, 0.5 + (q % 3) * 0.18]);
    }

    ctx.save();
    for (var i = 0; i < n && i < spots.length; i++) {
      var sp = spots[i];
      var jx = (rand() - 0.5) * u(70), jy = (rand() - 0.5) * u(70);
      var r = u(U.lerp(opts.rMin || 22, opts.rMax || 56, rand())) * sp[2];
      var kind = U.pick(rand, kinds);
      var fn = P.motifs[kind] || P.motifs.burst;
      ctx.globalAlpha = U.range(rand, 0.6, 1) * env.decoAlpha;
      var col = U.pick(rand, colors);
      if (opts.speckle && rand() > 0.5) {
        P.speckle(ctx, fn, sp[0] + jx, sp[1] + jy, r, col, rand, env.u(1000));
      } else {
        ctx.beginPath();
        fn(ctx, sp[0] + jx, sp[1] + jy, r, rand);
        if (opts.outline && rand() < 0.45) {
          ctx.lineWidth = Math.max(1, u(2.4));
          ctx.strokeStyle = col;
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  /* Bracketed tags, laid along a rail rather than hunted into gaps —
     this is why they now always appear. */
  function tagRail(env, y, opts) {
    opts = opts || {};
    var tags = env.content.tags;
    if (!tags.length || !env.st.showTags) return;
    var ctx = env.ctx, m = opts.m || margins(env);
    var size = opts.size || micro(env);
    var joined = tags.map(function (t) { return '(' + t.toLowerCase() + ')'; })
      .join(opts.sep || '   ');
    ctx.save();
    ctx.fillStyle = opts.color || env.pal.text;
    ctx.globalAlpha = (opts.alpha == null ? 0.62 : opts.alpha);
    size = T.fit(ctx, joined, 'dmmono', size, m.inner, 0.12, {});
    /* centre on the measure, not on the canvas — they are the same thing
       for the default margins, but a layout that hands over half a page
       (Lyric on a wide canvas) needs the rail under that half */
    T.draw(ctx, joined, opts.align === 'left' ? m.left
      : opts.align === 'right' ? env.w - m.right : m.left + m.inner / 2, y,
      { align: opts.align || 'center', tracking: size * 0.12 });
    ctx.restore();
  }

  W.poster = {
    paper: paper, stock: stock, accentOn: accentOn, margins: margins, frame: frame, corners: corners,
    micro: micro, rail: rail, block: block, sideLabel: sideLabel,
    headlineText: headlineText, headline: headline,
    accents: accents, tagRail: tagRail
  };
})(window.PT = window.PT || {});
