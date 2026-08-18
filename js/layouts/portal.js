/* PORTAL — the photograph cut into an arch, with the name written across
   its shoulder so the letters change colour where they cross onto it.

   This is the photo-first layout: the other five compose around a picture
   and stay standing without one, but this one is built for a picture and
   the picture is the middle of the page.

   The reference boards agree about two things and they are the whole
   design.

     1. The photograph is not a rectangle. Every one of them cuts it into
        a shape — an arch, a heart, a four-pointed star, an ellipse — and
        the shape is what the eye reads first.
     2. The type crosses the picture rather than sitting beside it. That
        is the difference between a page with a photograph on it and one
        scene: a band of picture with a headline underneath reads as two
        blocks however carefully they are aligned.

   So the name is drawn twice, at the same size, in the same place: once
   in the page's ink and once more clipped to the arch, in the colour that
   reads on the toned photograph. One line of type, two materials. There
   is no seam because there is no second element.

   Everything else is horizontal. There were two columns of capitals set
   one letter per step down the sides, and however they were sized, spaced
   or aligned they read as clutter around the one shape the page is about.
   A column of single letters is also the slowest thing on a page to read,
   which is a strange thing to make of a couple's names. So the furniture
   is four rows now — a rail at the head, an index line under the arch, the
   foot rule with its numeral tab, and the caption — each spanning the
   measure and each aligned to the same two ends as the display line.

   With no photograph the arch fills with the palette's own duotone field
   and its washes — the same substitution every other layout makes, so the
   composition is identical either way. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  /* An arch: a rectangle with a rounded top. The radius is capped against
     the height as well as the width, so a wide canvas gets a shallow arch
     rather than a semicircle taller than the band it has to fit in. */
  function archPath(ctx, x, y, w, h) {
    var r = Math.min(w / 2, h * 0.62);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    return r;
  }

  function diamond(ctx, x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var accent = PO.accentOn(pal, pal.base);

    PO.paper(env, { tint: true });
    var m = PO.margins(env);

    var initials = W.textstack.monogram(st) || 'PT';
    var namesLine = (st.showNames && c.names) ? c.names : initials;
    var word = (c.title || namesLine || 'pairtone').replace(/\s+/g, ' ').trim().toUpperCase();

    /* ---------- the foot, measured before the arch is given its band --- */
    var footBodyH = 0;
    if (c.caption && !env.micro) {
      footBodyH = PO.block(env, 0, 0, m.inner * (wide ? 0.44 : 0.58), [c.caption], {
        size: mic * 0.78, lead: 1.55, upper: false, measure: true, font: st.bodyFont
      });
    }
    var footH = env.micro ? 0 : footBodyH + mic * 3.0;
    var footTop = h - m.bottom - footH;

    /* ---------- the arch ----------
       The index row gets its own band between the arch's foot and the
       rule, so the two never negotiate for the same pixels. */
    var headH = env.micro ? mic * 1.6 : mic * 3.0;
    var indexH = env.micro ? 0 : mic * 2.6;
    var top = m.top + headH;
    var bottom = footTop - indexH - (env.micro ? mic * 0.6 : mic * 0.9);
    var ah = Math.max(u(220), bottom - top);
    /* A little wider than it was, now that nothing lives beside it — but
       never so wide that the display line stops overhanging it, because
       that overhang is where the two inks meet and it IS the design. */
    /* An arch is a portrait shape and the height cap keeps it one — except
       on a 3:1 header, where the band is 300px tall and holding the arch to
       1.15 of that left a keyhole in the middle of a very wide page. There
       it may spread into a tunnel. */
    var aw = Math.min(m.inner * (wide ? 0.46 : 0.86),
      ah * (wide && w / h > 2.2 ? 1.95 : 1.15));
    var ax = m.left + (m.inner - aw) / 2;
    var ay = top;

    /* ---------- the arch's surface ----------
       The field is painted whether or not there is a photograph, and the
       photograph is then laid over it and its COLOUR taken back off. A
       picture toned straight into the palette came out the same two inks
       as everything around it and the arch stopped being a thing on the
       page — the empty arch, with its washes, was the better looking of
       the two. So the picture supplies the light and the field supplies
       the hue: `color` composites the field's hue and chroma over the
       photograph's luminance, which keeps the gradient and keeps the
       photograph. */
    function field() {
      ctx.fillStyle = U.mix(pal.duo[0], pal.duo[1], 0.55);
      ctx.fillRect(ax, ay, aw, ah);
      P.wash(ctx, ax + aw * 0.3, ay + ah * 0.28, Math.max(aw, ah) * 0.95,
        pal.soft[0], 0.62 * st.washStrength);
      P.wash(ctx, ax + aw * 0.82, ay + ah * 0.74, Math.max(aw, ah) * 0.8,
        pal.soft[1] || pal.soft[0], 0.5 * st.washStrength);
    }

    ctx.save();
    var r = archPath(ctx, ax, ay, aw, ah);
    ctx.clip();
    field();
    if (env.hasPhoto) {
      env.drawPhoto({ x: ax, y: ay, w: aw, h: ah });
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.88;
      field();
      ctx.restore();
    }
    ctx.restore();

    /* ---------- the name, across the arch's shoulder ----------
       It has to reach the measure, because the measure is wider than the
       arch and that overhang IS the design. A flat cap on the point size
       meant a short name — four letters — stopped well inside the arch's
       own width, so every letter landed on the picture, none of them
       changed colour, and what came out was one big black word sitting on
       a coloured shape. The cap is the arch's shoulder instead: the line
       may grow until it fills the measure or until its capitals reach the
       curve, whichever comes first. */
    /* The height cap is the arch's shoulder OR a third of the page,
       whichever is smaller. On a 3:1 header the shoulder alone let the
       display line grow until its capitals were half the height of the
       canvas and the arch behind it read as a keyhole. */
    var size = T.fill(ctx, word, st.titleFont, m.inner, -0.03, { weight: 500 },
      Math.min(r * 1.35, h * 0.32));
    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    var ink = T.inkBox(ctx, word);
    if (ink.asc > r * 0.92) {
      size *= (r * 0.92) / ink.asc;
      T.setFont(ctx, st.titleFont, size, { weight: 500 });
      ink = T.inkBox(ctx, word);
    }
    /* seated so the line sits on the shoulder — high enough that the
       curve of the arch is still reading behind it */
    var base = ay + r * 0.62 + (ink.asc - ink.desc) / 2;
    var wordW = T.measure(ctx, word, size * -0.03);
    var wx = m.left + (m.inner - wordW) / 2;

    ctx.save();
    ctx.fillStyle = pal.text;
    ctx.globalAlpha = 0.96;
    T.draw(ctx, word, wx, base, { align: 'left', tracking: size * -0.03 });
    ctx.restore();

    /* the same line again, clipped to the arch, in the ink that reads on
       the picture — this is the whole design and it costs one extra draw */
    ctx.save();
    archPath(ctx, ax, ay, aw, ah);
    ctx.clip();
    ctx.fillStyle = U.onColor(pal.duo[1]);
    ctx.globalAlpha = 0.96;
    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    T.draw(ctx, word, wx, base, { align: 'left', tracking: size * -0.03 });
    ctx.restore();

    if (env.micro) {
      PO.microFoot(env, { m: m });
      return;
    }

    /* ---------- the index row, under the arch ----------
       The two vertical columns said the date on one side and the names on
       the other, one letter per step. This says the same things on one
       line, at a size somebody can read, aligned to the same two ends as
       everything else on the page. */
    var idxY = ay + ah + mic * 1.85;
    var tagLine = (st.showTags && c.tags.length)
      ? c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  ')
      : '';
    PO.rail(env, idxY, [c.footnote || '', null, initials],
      { m: m, size: mic * 0.9, alpha: 0.82 });

    /* ---------- head and foot ---------- */
    PO.rail(env, m.top + mic * 1.1, [namesLine, null, 'pairtone'],
      { m: m, size: mic * 0.7, alpha: 0.6 });

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2.2));
    ctx.beginPath();
    ctx.moveTo(m.left, footTop);
    ctx.lineTo(w - m.right, footTop);
    ctx.stroke();
    ctx.restore();

    /* The set numeral as a solid tab hung on the foot rule.
       With the two trim rules gone the palette's colour had nowhere left
       to land but a few hairlines and two sparkles, and on a deep page
       that adds up to nothing the eye can find. A small filled block is
       worth more colour than a rule the width of the page, and it does
       not cross anything. */
    ctx.save();
    T.setFont(ctx, 'dmmono', mic * 0.7, {});
    var tabW = T.measure(ctx, '01', mic * 0.09) + mic * 1.0;
    var tabH = mic * 1.5;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.95;
    ctx.fillRect(m.left, footTop, tabW, tabH);
    ctx.fillStyle = U.onColor(accent);
    T.draw(ctx, '01', m.left + tabW / 2, footTop + tabH * 0.68,
      { align: 'center', tracking: mic * 0.09 });
    ctx.restore();

    /* The caption and the tags share one baseline under the rule. They
       used to be on two, a fifth of a line apart, which is close enough to
       look like a mistake and far enough not to look like a row. */
    var footBase = footTop + mic * 2.0;
    if (c.caption) {
      PO.block(env, m.left, footBase, m.inner * (wide ? 0.44 : 0.58), [c.caption], {
        size: mic * 0.78, lead: 1.55, upper: false, alpha: 0.78, font: st.bodyFont
      });
    }
    if (tagLine) {
      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.62;
      T.setFont(ctx, st.bodyFont, mic * 0.78, { weight: 500 });
      T.draw(ctx, tagLine, w - m.right, footBase + mic * 0.78,
        { align: 'right', tracking: mic * 0.1 });
      ctx.restore();
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'portal',
    label: 'Portal',
    blurb: '사진을 아치로 오리고 그 어깨를 글자가 가로질러요. 사진이 주인공인 쪽.',
    /* which type controls actually reach this layout's drawing code */
    type: ['titleFont', 'bodyFont', 'microScale'],
    defaults: {
      titleFont: 'didone', scriptFont: 'delafield', bodyFont: 'dmmono',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.95,
      feather: 0, scrim: 0.2, motifs: ['sparkle'], decoCount: 0,
      grain: 1.5, vignette: 0.06
    },
    draw: draw
  });
})(window.PT = window.PT || {});
