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

   The rest is the boards' furniture: tracked capitals set vertically down
   the margins outside the measure, diamonds at their ends, and a page tab
   at the foot. All of it is drawn on the page rather than in the picture,
   so a busy photograph never has to carry small text — and none of it
   crosses the page, because a hairline running the full width behind a
   display line is the one thing that made this composition look untidy.

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

  /* Capitals set one per step down a margin — the boards' side labels.
     They live outside the measure, so they can never meet the display
     line however long the name is.

     Both margins read downwards. The right one used to run bottom to top,
     which is the convention for type rotated on its side; these letters
     are upright, and a column of upright capitals read from the bottom is
     a column nobody reads. */
  function sideCaps(env, text, x, yTop, yBot, color, alpha, size) {
    var ctx = env.ctx;
    var chars = String(text).toUpperCase().replace(/\s+/g, ' ').split('');
    if (!chars.length) return;
    var step = (yBot - yTop) / Math.max(1, chars.length - 1);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    T.setFont(ctx, 'dmmono', size, {});
    chars.forEach(function (ch, i) {
      T.draw(ctx, ch, x, yTop + step * i, { align: 'center', tracking: 0 });
    });
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
      footBodyH = PO.block(env, 0, 0, m.inner * (wide ? 0.46 : 0.66), [c.caption], {
        size: mic * 0.78, lead: 1.55, upper: false, measure: true, font: st.bodyFont
      });
    }
    var footH = env.micro ? 0 : footBodyH + mic * 3.2;
    var footTop = h - m.bottom - footH;

    /* ---------- the arch ---------- */
    var headH = env.micro ? mic * 1.6 : mic * 3.0;
    var top = m.top + headH;
    var bottom = footTop - (env.micro ? mic * 0.6 : mic * 1.6);
    var ah = Math.max(u(220), bottom - top);
    var aw = Math.min(m.inner * (wide ? 0.46 : 0.82), ah * 1.15);
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
    var size = T.fill(ctx, word, st.titleFont, m.inner, -0.03, { weight: 500 }, r * 1.35);
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

    /* ---------- the vertical labels ----------
       INSIDE the measure, flush with the two ends of the display line.

       They used to sit half way into the margin, outside everything else
       on the page: the title ran to the measure and the columns hung past
       it on both sides, so the one element whose whole job is to be a
       symmetrical pair was the one element that lined up with nothing.
       The reference boards all put them inside — the display line sets the
       width of the composition and every other mark starts or stops on it.

       The gutter between the measure and the arch is at least 9% of the
       measure, which is several times the width of a capital, so there is
       always room for them there.

       They start under the display line rather than under the arch's
       shoulder: the shoulder is 62% of the way down a wide arch, which on
       a square canvas left the columns a couple of hundred pixels to live
       in. */
    /* ONE rhythm for the whole column: diamond, letters, diamond, evenly
       spaced between two fixed points — just below the display line, and
       the arch's foot.

       It was the other way round. The letters were placed first and the
       diamonds hung off them by a multiple of the letter size, which is
       wrong twice over. `sideCaps` positions by BASELINE, so the ascent
       sat inside the gap at the top and outside it at the bottom and the
       two ends did not match; and a clearance tied to the letter size
       ignores how far apart the letters themselves are, so on a tall page
       the letters stood a hundred pixels apart while the diamond crowded
       the first of them. Both ends are now one step of the same rhythm,
       and the step is whatever the column's own spacing is. */
    var dR = u(7);
    var topMark = base + mic * 1.1;
    var botMark = ay + ah - mic * 0.2;
    var gutter = (m.inner - aw) / 2;
    var probe = Math.min(mic * 1.15, gutter * 0.5);
    var span = botMark - topMark;
    if (span > mic * 7 && gutter > mic * 1.1) {
      /* One size for both margins. They share a span but not a length, so
         sizing each column to its own step made the shorter string
         visibly larger than the other and the page stopped being
         symmetrical — which is the whole point of setting them in pairs.
         The size is set by the denser of the two.

         A string too long for the span steps down to a shorter form of
         ITSELF — the names to their initials, a footnote to its last word
         — rather than being cut mid-word, which is how "AKI × REN" came
         out as "AKI × R". */
      var minCap = mic * 0.72;
      /* two of the positions belong to the diamonds */
      var maxN = Math.max(2, Math.floor(span / (minCap * 1.15)) - 1);
      function shortest(alts) {
        for (var i = 0; i < alts.length; i++) {
          var s = String(alts[i] || '').trim();
          if (s && s.length <= maxN) return s;
        }
        return String(alts[0] || '').slice(0, maxN);
      }
      var foot = c.footnote || 'pairtone';
      var capL = shortest([namesLine, initials, initials.replace(/\s+/g, '')]);
      var capR = shortest([foot, foot.replace(/\s+/g, ''),
        foot.split(/\s+/).pop(), 'pairtone']);
      var capN = Math.max(capL.length, capR.length, 2);
      /* Big enough to read, light enough not to shout. The medium weight
         at this size printed as a stack of black blocks down each side —
         these are labels, and the display line is the only thing on the
         page allowed to be heavy. */
      /* capN letters, and a diamond a step and a fifth beyond each end —
         the extra fifth is there because a diamond is a smaller mark than
         a capital, so an identical step reads as slightly tighter than the
         letters are to each other */
      var capStep = span / (capN - 1 + 2.4);
      var capSize = Math.max(minCap, Math.min(probe, capStep * 0.82));

      /* Seated by the CENTRE of a capital, not by its baseline, so the
         letters sit on the rhythm the diamonds set rather than half an
         ascent below it. */
      T.setFont(ctx, 'dmmono', capSize, {});
      var capH = T.inkBox(ctx, 'H').asc;
      var capTop = topMark + capStep * 1.2 + capH / 2;
      var capBot = capTop + capStep * (capN - 1);

      var capIn = capSize * 0.32;
      var capX = [m.left + capIn, w - m.right - capIn];
      sideCaps(env, capL, capX[0], capTop, capBot, pal.text, 0.78, capSize);
      sideCaps(env, capR, capX[1], capTop, capBot, pal.text, 0.78, capSize);
      capX.forEach(function (x) {
        diamond(ctx, x, topMark, dR, accent, 0.85);
        diamond(ctx, x, botMark, dR, accent, 0.85);
      });
    }

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

    if (c.caption) {
      PO.block(env, m.left, footTop + mic * 2.0, m.inner * (wide ? 0.46 : 0.66), [c.caption], {
        size: mic * 0.78, lead: 1.55, upper: false, alpha: 0.78, font: st.bodyFont
      });
    }
    if (st.showTags && c.tags.length) {
      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.62;
      T.setFont(ctx, st.bodyFont, mic * 0.74, { weight: 500 });
      T.draw(ctx, c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  '),
        w - m.right, footTop + mic * 1.5, { align: 'right', tracking: mic * 0.1 });
      ctx.restore();
    }
    PO.rail(env, h - m.bottom - mic * 0.2, [initials, null, c.footnote || 'pairtone'],
      { m: m, size: mic * 0.66, alpha: 0.5 });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'portal',
    label: 'Portal',
    blurb: '사진을 아치로 오리고 그 어깨를 글자가 가로질러요. 사진이 주인공인 쪽.',
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
