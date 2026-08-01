/* EDITORIAL (Type) — the words ARE the poster: huge staggered grotesque
   lines pushed alternately left and right, tiny labels floating in the
   gaps they leave, and a photo strip pinned along the foot.
   Reference grammar: "Hold Your Vision & Trust The Process". */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var rand = env.rand;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';

    PO.paper(env, { tint: false });
    var m = PO.margins(env);

    /* ---- the word stack ---- */
    /* One word per line, always. Each word then fills the measure on its
       own, so a short word is set huge and a long one smaller — that
       size contrast is the whole idea, and it is also what makes a
       handful of words fill a page instead of floating at the top. */
    var raw = (c.title || '').replace(/[\r\n]+/g, ' ');
    var lines = raw.split(/\s+/).filter(Boolean);

    /* Two words cannot carry a poster; borrow the names for more lines.
       Borrowed words are marked, because they are not the pair name and
       must not be set at the same size as it — a name filling the measure
       exactly as hard as the title reads as two titles, and the hierarchy
       the whole layout depends on disappears. */
    var borrowedFrom = lines.length;
    if (lines.length < 3 && c.names && st.showNames) {
      c.names.split(/\s+/).filter(Boolean).forEach(function (word) {
        if (lines.length < 5) lines.push(word);
      });
    }
    if (!lines.length && c.names) {
      lines = c.names.split(/\s+/).filter(Boolean);
      borrowedFrom = lines.length;   /* nothing else to be subordinate to */
    }

    /* A watch face fits three lines, not two. Regrouping to two was what
       broke it: every line is fitted to the MEASURE, so folding three
       words onto two lines makes both lines longer and therefore
       *smaller*, and the stack then occupied barely a fifth of the face
       with the rest dead. One word per line is the layout's whole idea
       and it is also what fills a small square. Regroup only past three,
       so the phrase is still never cut off mid-thought. */
    if (env.micro && lines.length > 3) {
      var per = Math.ceil(lines.length / 3);
      var packed = [];
      for (var gi = 0; gi < lines.length; gi += per) {
        packed.push(lines.slice(gi, gi + per).join(' '));
      }
      lines = packed;
    }
    lines = lines.slice(0, 6);

    /* A wide canvas is two columns, not a tall one squashed. Stacked, the
       words ran the full width and the foot strip became a quarter of the
       page — a band so short and so wide that a photograph cropped inside
       it was two heads and nothing else. The words now take a left column
       and the photograph a tall column beside them. */
    var col = wide ? { x: m.left, w: m.inner * 0.6 } : { x: m.left, w: m.inner };
    var side = wide
      ? { x: m.left + m.inner * 0.66, y: m.top, w: m.inner * 0.34, h: h - m.top - m.bottom }
      : null;

    var stripH = wide ? 0 : (env.hasPhoto || !env.micro ? h * 0.2 : 0);
    var stackTop = m.top + mic * 1.6;
    var stackBottom = h - m.bottom - stripH - mic * (wide ? 3.4 : 2);
    var stackH = stackBottom - stackTop;

    /* Alternating column: each line fills ~82% of the measure and is
       shoved to the opposite edge from its neighbour, so the stagger is
       structural rather than decorative. */
    var em = U.lerp(0.75, 1, env.emphasis) * (st.headlineScale || 1);
    var weight = 600;
    var sized = lines.map(function (text, i) {
      /* a lone symbol (×, &) stays a punctuation mark, not a headline */
      var isSep = text.length === 1 && !/[a-z0-9]/i.test(text);
      var borrowed = i >= borrowedFrom;
      var frac = isSep ? 0.2
        : borrowed ? (i % 2 === 0 ? 0.52 : 0.46)
        : (i % 2 === 0 ? 0.94 : 0.84);
      var size = T.fill(ctx, text.toUpperCase(), st.titleFont,
        col.w * frac * em, -0.015, { weight: weight }, u(320));
      T.setFont(ctx, st.titleFont, size, { weight: weight });
      return {
        text: text.toUpperCase(), size: size, isSep: isSep, borrowed: borrowed,
        ink: T.inkBox(ctx, text.toUpperCase()),
        w: T.measure(ctx, text.toUpperCase(), size * -0.015)
      };
    });

    /* The two names are one unit and must read as one unit. Each word
       still fills its own line independently — that is the point of the
       layout — so a four-letter name and a three-letter name landed on
       different point sizes even though neither is more important than
       the other. The title is still allowed to dwarf the names group;
       only the names have to agree with each other, so pin them all to
       whichever of the two fit their slot hardest. */
    var borrowedSizes = sized
      .filter(function (l) { return l.borrowed && !l.isSep; })
      .map(function (l) { return l.size; });
    if (borrowedSizes.length > 1) {
      var common = Math.min.apply(null, borrowedSizes);
      sized.forEach(function (l) {
        if (!l.borrowed || l.isSep || l.size === common) return;
        l.size = common;
        T.setFont(ctx, st.titleFont, l.size, { weight: weight });
        l.ink = T.inkBox(ctx, l.text);
        l.w = T.measure(ctx, l.text, l.size * -0.015);
      });
    }

    /* tight leading, then scale the whole stack into its box */
    var total = 0;
    sized.forEach(function (l, i) {
      total += (l.ink.asc + l.ink.desc) + (i ? l.size * 0.1 : 0);
    });
    if (total > stackH) {
      var k = stackH / total;
      sized.forEach(function (l) {
        l.size *= k;
        T.setFont(ctx, st.titleFont, l.size, { weight: weight });
        l.ink = T.inkBox(ctx, l.text);
        l.w = T.measure(ctx, l.text, l.size * -0.015);
      });
      total = stackH;
    }

    /* The stack sits high on a poster — that is the editorial look, and
       the photo strip balances it. A watch face has no strip to balance
       against, so the same 0.25 left a third of the face dead under the
       type; there, centre it. */
    var y = stackTop + Math.max(0, stackH - total) * (env.micro ? 0.5 : 0.25);
    var gaps = [];   /* the negative space each line leaves, for labels */
    /* One word of the stack is set in the accent — the oldest trick in
       Swiss poster typography, and on this layout the only place a real
       area of colour can live: the page is flat, the photograph is toned
       into the palette, and everything else is one ink. Never the
       separator: a lone x set in red reads as a mistake, not a choice. */
    var hot = -1;
    sized.forEach(function (l, i) { if (!l.isSep && !l.borrowed) hot = i; });
    if (hot < 0) sized.forEach(function (l, i) { if (!l.isSep) hot = i; });
    ctx.save();
    sized.forEach(function (l, i) {
      y += l.ink.asc;
      var left = i % 2 === 0;
      var x = left ? col.x : col.x + col.w - l.w;
      if (l.isSep) x = col.x + col.w * 0.08;
      ctx.fillStyle = (i === hot && sized.length > 1) ? (pal.accent || pal.text) : pal.text;
      T.setFont(ctx, st.titleFont, l.size, { weight: weight });
      T.draw(ctx, l.text, x, y, { align: 'left', tracking: l.size * -0.015 });
      gaps.push({
        x: left ? x + l.w + u(30) : col.x,
        w: Math.max(0, col.w - l.w - u(30)),
        y: y - l.ink.asc * 0.5,
        align: left ? 'right' : 'left',
        edge: left ? col.x + col.w : col.x
      });
      y += l.ink.desc + l.size * 0.1;
    });
    ctx.restore();

    /* ---- tiny labels in the leftover gaps ---- */
    if (!env.micro) {
      /* the footnote has its own rail now — printing it here as well set
         the same date twice on one page */
      var labels = [];
      if (c.names && st.showNames) labels.push(c.names.toUpperCase());
      c.tags.slice(0, 2).forEach(function (t) { labels.push(t.toUpperCase()); });
      if (!labels.length && c.footnote) labels.push(c.footnote.toUpperCase());
      var li = 0;
      ctx.save();
      /* the labels carry the palette's accent — on a page whose photo is
         a grey strip and whose type is all one ink, they are the only
         chance the colour gets to appear at all */
      ctx.fillStyle = pal.accent || pal.text;
      gaps.forEach(function (g2, i) {
        /* a label belongs beside the word that left the gap; a gap wider
           than the word itself is not a gap, it is the middle of nowhere */
        if (li >= labels.length || g2.w < u(140) || g2.w > col.w * 0.72
          || sized[i].isSep) return;
        var size = mic * 0.78;
        T.setFont(ctx, 'dmmono', size, {});
        var ax = g2.edge;
        ctx.globalAlpha = 0.95;
        T.draw(ctx, labels[li], ax, g2.y, { align: g2.align, tracking: size * 0.14 });
        li++;
      });
      ctx.restore();
    }

    /* ---- the photograph: a tall column on wide, a foot strip otherwise ---- */
    if (side) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = pal.accent || pal.text;
      ctx.lineWidth = Math.max(1, u(2.2));
      ctx.beginPath();
      ctx.moveTo(side.x, side.y);
      ctx.lineTo(side.x + side.w, side.y);
      ctx.stroke();
      ctx.restore();

      var capH = c.caption && !env.micro ? PO.block(env, 0, 0, side.w, [c.caption], {
        size: mic * 0.82, lead: 1.45, measure: true, font: st.bodyFont
      }) : 0;
      var frame = {
        x: side.x, y: side.y + mic * 1.2,
        w: side.w, h: side.h - mic * 1.2 - (capH ? capH + mic * 1.2 : 0)
      };
      if (env.hasPhoto) {
        env.drawPhoto(frame);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.4 * st.washStrength;
        ctx.fillStyle = pal.soft[0];
        ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
        ctx.restore();
      }
      if (capH) {
        PO.block(env, side.x, frame.y + frame.h + mic * 0.6, side.w, [c.caption], {
          size: mic * 0.82, lead: 1.45, upper: false, alpha: 0.8, font: st.bodyFont
        });
      }
    }

    if (stripH) {
      var stripY = h - m.bottom - stripH;
      ctx.save();
      /* full strength: Discretion thins the motif scatter and shrinks the
         headline, but it must not bleach the palette's one colour out of
         the page — a hairline rule is not what makes a wallpaper loud */
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = pal.accent || pal.text;
      ctx.lineWidth = Math.max(1, u(2.2));
      ctx.beginPath();
      ctx.moveTo(m.left, stripY - mic * 1.1);
      ctx.lineTo(w - m.right, stripY - mic * 1.1);
      ctx.stroke();
      ctx.restore();

      var capW = m.inner * (wide ? 0.26 : 0.34);
      var photoX = m.left + capW + u(36);
      var photo = { x: photoX, y: stripY, w: w - m.right - photoX, h: stripH };

      if (env.hasPhoto) {
        env.drawPhoto(photo);
        /* a second, small offcut on the far left, like the reference */
        var cut = { x: m.left, y: stripY, w: capW * 0.44, h: stripH * 0.46 };
        env.drawPhoto(cut);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.4 * st.washStrength;
        ctx.fillStyle = pal.soft[0];
        ctx.fillRect(photo.x, photo.y, photo.w, photo.h);
        ctx.restore();
      }

      if (c.caption && !env.micro) {
        PO.block(env, m.left, stripY + stripH * (env.hasPhoto ? 0.5 : 0), capW,
          [c.caption], {
            size: mic * 0.8, lead: 1.45, upper: false, alpha: 0.75, font: st.bodyFont
          });
      }
    }

    /* ---- foot rail: the footnote has a guaranteed home ----
       It used to depend on a leftover gap being wide enough, which on most
       device shapes it was not, so the date simply never appeared. */
    if (!env.micro && c.footnote) {
      PO.rail(env, h - m.bottom + mic * (side ? 1.1 : 0.5), [c.footnote.toUpperCase(), null, null],
        { m: wide ? { left: col.x, right: w - col.x - col.w, inner: col.w } : m,
          size: mic * 0.72, alpha: 0.6 });
    }

    /* ---- corner micro-rails ---- */
    if (env.micro) PO.microFoot(env, { m: m });
    if (!env.micro) {
      /* on wide the rail belongs over the word column only — run full
         width it collided with the photograph's rule */
      PO.rail(env, m.top + mic * 0.4, [
        (c.tags[0] || 'be stronger').toUpperCase(), null,
        W.textstack.monogram(st)
      ], {
        m: wide ? { left: col.x, right: w - col.x - col.w, inner: col.w } : m,
        size: mic * 0.72, alpha: 0.5
      });
    }
    if (st.sideLabel) {
      PO.sideLabel(env, (c.title || '').replace(/\n/g, ' ').toUpperCase(),
        { m: m, size: mic * 0.85, y: h * 0.5 });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'editorial',
    label: 'Type',
    blurb: '글자가 곧 포스터. 거대한 단어들이 지그재그로 쌓여요.',
    defaults: {
      titleFont: 'spacegrotesk', scriptFont: 'delafield', bodyFont: 'spacegrotesk',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.92,
      feather: 0, motifs: ['sparkle'], decoCount: 0,
      sideLabel: false, grain: 1.1, vignette: 0.04
    },
    draw: draw
  });
})(window.PT = window.PT || {});
