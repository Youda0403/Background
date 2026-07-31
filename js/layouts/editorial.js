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

    /* two words cannot carry a poster; borrow the names for more lines */
    if (lines.length < 3 && c.names && st.showNames) {
      c.names.split(/\s+/).filter(Boolean).forEach(function (word) {
        if (lines.length < 5) lines.push(word);
      });
    }
    if (!lines.length && c.names) lines = c.names.split(/\s+/).filter(Boolean);

    /* A watch face fits two lines. Regroup the words into two rather than
       dropping the tail, so the phrase is never cut off mid-thought. */
    if (env.micro && lines.length > 2) {
      var half = Math.ceil(lines.length / 2);
      lines = [lines.slice(0, half).join(' '), lines.slice(half).join(' ')];
    }
    lines = lines.slice(0, 6);

    var stripH = env.hasPhoto || !env.micro ? h * (wide ? 0.24 : 0.2) : 0;
    var stackTop = m.top + mic * 1.6;
    var stackBottom = h - m.bottom - stripH - mic * 2;
    var stackH = stackBottom - stackTop;

    /* Alternating column: each line fills ~82% of the measure and is
       shoved to the opposite edge from its neighbour, so the stagger is
       structural rather than decorative. */
    var em = U.lerp(0.75, 1, env.emphasis) * (st.headlineScale || 1);
    var weight = 600;
    var sized = lines.map(function (text, i) {
      /* a lone symbol (×, &) stays a punctuation mark, not a headline */
      var isSep = text.length === 1 && !/[a-z0-9]/i.test(text);
      var frac = isSep ? 0.2 : (i % 2 === 0 ? 0.94 : 0.84);
      var size = T.fill(ctx, text.toUpperCase(), st.titleFont,
        m.inner * frac * em, -0.015, { weight: weight }, u(320));
      T.setFont(ctx, st.titleFont, size, { weight: weight });
      return {
        text: text.toUpperCase(), size: size, isSep: isSep,
        ink: T.inkBox(ctx, text.toUpperCase()),
        w: T.measure(ctx, text.toUpperCase(), size * -0.015)
      };
    });

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

    var y = stackTop + Math.max(0, stackH - total) * 0.25;
    var gaps = [];   /* the negative space each line leaves, for labels */
    ctx.save();
    ctx.fillStyle = pal.text;
    sized.forEach(function (l, i) {
      y += l.ink.asc;
      var left = i % 2 === 0;
      var x = left ? m.left : w - m.right - l.w;
      if (l.isSep) x = m.left + m.inner * 0.08;
      T.setFont(ctx, st.titleFont, l.size, { weight: weight });
      T.draw(ctx, l.text, x, y, { align: 'left', tracking: l.size * -0.015 });
      gaps.push({
        x: left ? x + l.w + u(30) : m.left,
        w: Math.max(0, m.inner - l.w - u(30)),
        y: y - l.ink.asc * 0.5,
        align: left ? 'right' : 'left'
      });
      y += l.ink.desc + l.size * 0.1;
    });
    ctx.restore();

    /* ---- tiny labels in the leftover gaps ---- */
    if (!env.micro) {
      var labels = [];
      if (c.names && st.showNames) labels.push(c.names.toUpperCase());
      if (c.footnote) labels.push(c.footnote.toUpperCase());
      c.tags.slice(0, 2).forEach(function (t) { labels.push(t.toUpperCase()); });
      var li = 0;
      ctx.save();
      ctx.fillStyle = pal.text;
      gaps.forEach(function (g2, i) {
        if (li >= labels.length || g2.w < u(140) || sized[i].isSep) return;
        var size = mic * 0.78;
        T.setFont(ctx, 'dmmono', size, {});
        var ax = g2.align === 'right' ? w - m.right : m.left;
        ctx.globalAlpha = 0.6;
        T.draw(ctx, labels[li], ax, g2.y, { align: g2.align, tracking: size * 0.14 });
        li++;
      });
      ctx.restore();
    }

    /* ---- photo strip along the foot ---- */
    if (stripH) {
      var stripY = h - m.bottom - stripH;
      ctx.save();
      ctx.globalAlpha = 0.4 * env.decoAlpha;
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = Math.max(1, u(1.4));
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

    /* ---- corner micro-rails ---- */
    if (!env.micro) {
      PO.rail(env, m.top + mic * 0.4, [
        (c.tags[0] || 'be stronger').toUpperCase(), null,
        W.textstack.monogram(st)
      ], { m: m, size: mic * 0.72, alpha: 0.5 });
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
      photoShape: 'rect', tone: 'mono', toneAmount: 1,
      feather: 0, motifs: ['sparkle'], decoCount: 0,
      sideLabel: false, grain: 1.1, vignette: 0.04
    },
    draw: draw
  });
})(window.PT = window.PT || {});
