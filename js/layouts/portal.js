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

   The rest is the boards' furniture: rules that run to both trims broken
   by a diamond at each end, tracked capitals set vertically down the
   margins outside the measure, and a few sparkles. All of it is drawn on
   the page rather than in the picture, so a busy photograph never has to
   carry small text.

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

  /* A rule to both trims, stopped by a diamond at each end. */
  function trimRule(env, y, color, alpha) {
    var ctx = env.ctx, u = env.u;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, u(1.4));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(env.w, y);
    ctx.stroke();
    ctx.restore();
    diamond(ctx, u(58), y, u(7), color, Math.min(1, alpha + 0.25));
    diamond(ctx, env.w - u(58), y, u(7), color, Math.min(1, alpha + 0.25));
  }

  /* Capitals set one per step down a margin — the boards' side labels.
     They live outside the measure, so they can never meet the display
     line however long the name is. */
  function sideCaps(env, text, x, yTop, yBot, color, alpha, size, up) {
    var ctx = env.ctx;
    var chars = String(text).toUpperCase().replace(/\s+/g, ' ').split('');
    if (!chars.length) return;
    var step = (yBot - yTop) / Math.max(1, chars.length - 1);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    T.setFont(ctx, 'dmmono', size, {});
    chars.forEach(function (ch, i) {
      var y = up ? yBot - step * i : yTop + step * i;
      T.draw(ctx, ch, x, y, { align: 'center', tracking: 0 });
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

    var deep = U.mix(pal.duo[0], pal.duo[1], 0.3);
    ctx.save();
    var r = archPath(ctx, ax, ay, aw, ah);
    ctx.clip();
    if (env.hasPhoto) {
      env.drawPhoto({ x: ax, y: ay, w: aw, h: ah });
    } else {
      /* The mid point of the duotone ramp — what a photograph toned into
         this palette actually averages to, so the empty arch is the same
         weight on the page as a full one. Tinting the page colour instead
         left the arch a shade off its own background on any palette whose
         page is already deep. */
      ctx.fillStyle = U.mix(pal.duo[0], pal.duo[1], 0.55);
      ctx.fillRect(ax, ay, aw, ah);
      P.wash(ctx, ax + aw * 0.3, ay + ah * 0.28, Math.max(aw, ah) * 0.95,
        pal.soft[0], 0.62 * st.washStrength);
      P.wash(ctx, ax + aw * 0.82, ay + ah * 0.74, Math.max(aw, ah) * 0.8,
        pal.soft[1] || pal.soft[0], 0.5 * st.washStrength);
    }
    ctx.restore();

    /* ---------- the two rules that cross the page ---------- */
    trimRule(env, ay + r, pal.text, 0.3);
    trimRule(env, ay + ah, pal.text, 0.3);

    /* ---------- the name, across the arch's shoulder ---------- */
    var size = T.fill(ctx, word, st.titleFont, m.inner, -0.03, { weight: 500 }, u(300));
    T.setFont(ctx, st.titleFont, size, { weight: 500 });
    var ink = T.inkBox(ctx, word);
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

    /* ---------- the margins ---------- */
    var capTop = ay + r + mic * 2.2;
    var capBot = ay + ah - mic * 1.6;
    if (capBot - capTop > mic * 4) {
      sideCaps(env, namesLine, m.left * 0.52, capTop, capBot, pal.text, 0.6, mic * 0.7);
      sideCaps(env, c.footnote || 'pairtone', w - m.left * 0.52, capTop, capBot,
        pal.text, 0.6, mic * 0.7, true);
      [[m.left * 0.52, capTop - mic * 1.3], [w - m.left * 0.52, capTop - mic * 1.3],
        [m.left * 0.52, capBot + mic * 1.3], [w - m.left * 0.52, capBot + mic * 1.3]]
        .forEach(function (pt) { diamond(ctx, pt[0], pt[1], u(6), pal.text, 0.45); });
    }

    ctx.save();
    [[ax - u(34), ay + ah * 0.24, 17], [ax + aw + u(30), ay + ah * 0.66, 13]]
      .forEach(function (s, i) {
        ctx.globalAlpha = (i ? 0.5 : 0.62) * env.decoAlpha;
        ctx.fillStyle = accent;
        P.sparkle(ctx, s[0], s[1], u(s[2]), 0.12);
        ctx.fill();
      });
    ctx.restore();

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

    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.95;
    T.setFont(ctx, 'dmmono', mic * 0.66, {});
    T.draw(ctx, '01', m.left, footTop + mic * 1.3, { align: 'left', tracking: mic * 0.08 });
    ctx.restore();

    if (c.caption) {
      PO.block(env, m.left, footTop + mic * 1.8, m.inner * (wide ? 0.46 : 0.66), [c.caption], {
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
