/* LYRIC — a torn photograph across the top, a huge script headline
   filling the paper below, and the caption cut into little boxed lyric
   scraps pasted over the picture.
   Reference grammar: the "You'll Be In My Heart" lyric poster. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  /* One point on a ragged tear: `t` runs 0..1 along the edge. */
  function jag(rand, amp) {
    return (rand() - 0.5) * amp * (rand() > 0.86 ? 2.2 : 1);
  }

  /* The torn keep-region as a path: everything above a horizontal tear at
     `at`, or everything left of a vertical one. A wide canvas tears down
     the side — stacked, its script had a quarter of the page to fill and
     three quarters of empty paper under it. */
  function tornPath(ctx, w, h, at, vertical, rand, amp, add) {
    var steps = 44;
    if (!add) ctx.beginPath();
    if (vertical) {
      ctx.moveTo(-4, -4);
      ctx.lineTo(at, -4);
      for (var i = 0; i <= steps; i++) {
        ctx.lineTo(at + jag(rand, amp), (i / steps) * (h + 8) - 4);
      }
      ctx.lineTo(-4, h + 4);
    } else {
      ctx.moveTo(-4, -4);
      ctx.lineTo(w + 4, -4);
      ctx.lineTo(w + 4, at);
      for (var j = steps; j >= 0; j--) {
        ctx.lineTo((j / steps) * (w + 8) - 4, at + jag(rand, amp));
      }
    }
    ctx.closePath();
  }

  /* Split the caption into 2–4 word scraps for the pasted labels. */
  function scraps(text, maxScraps) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    var out = [];
    var i = 0;
    while (i < words.length && out.length < maxScraps) {
      var take = 2 + ((words[i].length + i) % 2);
      out.push(words.slice(i, i + take).join(' '));
      i += take;
    }
    return out;
  }

  function chip(env, text, x, y, opts) {
    var ctx = env.ctx, u = env.u;
    var size = opts.size;
    T.setFont(ctx, opts.font, size, { weight: 500 });
    var tw = T.measure(ctx, text, size * 0.03);
    var padX = size * 0.55, padY = size * 0.42;
    var bw = tw + padX * 2, bh = size + padY * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((opts.rot || 0) * Math.PI / 180);
    /* a pasted scrap casts a small shadow — that is what sells the collage */
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.fillRect(-bw / 2 + u(4), -bh / 2 + u(5), bw, bh);
    ctx.globalAlpha = 1;
    ctx.fillStyle = opts.paper;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    if (opts.rule !== false) {
      ctx.strokeStyle = opts.ink;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = Math.max(1, u(1.4));
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = opts.ink;
    T.setFont(ctx, opts.font, size, { weight: 500 });
    T.draw(ctx, text, 0, size * 0.36, { align: 'center', tracking: size * 0.03 });
    ctx.restore();
    return { w: bw, h: bh };
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content, rand = env.rand;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var accent = pal.inks[0];
    var hot = pal.accent || pal.inks[1] || accent;

    /* The photograph is a torn-off piece of *printed paper*, not a window
       cut into the page — so it carries its own stock. On a light palette
       that stock is the page itself and nothing changes. On a dark one it
       stays light, which is what makes the tear read at all: a dark
       picture printed onto a dark page is a black rectangle above black
       paper, and the whole top half of the wallpaper disappears. */
    var darkPage = U.luma(pal.base) < 0.42;
    var stock = darkPage
      ? (U.luma(pal.duo[1]) > 0.62 ? pal.duo[1] : U.mix(pal.base, '#f2efe6', 0.86))
      : pal.base;

    /* ---- paper ---- */
    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    /* ---- the photograph, torn off the page ---- */
    var vertical = wide;
    var tearAt = vertical
      ? w * 0.54
      : h * (env.micro ? 0.44
        : env.tier === 'tablet' || env.tier === 'square' ? 0.5 : 0.54);
    var amp = u(22);
    var plate = vertical
      ? { x: 0, y: 0, w: tearAt + u(30), h: h }
      : { x: 0, y: 0, w: w, h: tearAt + u(30) };

    ctx.save();
    tornPath(ctx, w, h, tearAt, vertical, U.rng(env.seedNum + 7), amp);
    ctx.clip();

    /* the sheet the picture is printed on */
    ctx.fillStyle = stock;
    ctx.fillRect(-4, -4, plate.w + 8, plate.h + 8);

    if (env.hasPhoto) {
      env.drawPhoto(plate, stock);
    } else {
      /* mostly stock, faintly inked — mixed the other way round the empty
         sheet came out nearly black, which is the very thing the stock is
         there to prevent */
      ctx.fillStyle = U.mix(stock, pal.duo[0], 0.16);
      ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
      P.wash(ctx, plate.w * 0.35, plate.h * 0.45, env.S * 0.8, pal.soft[0], 0.5 * st.washStrength);
      P.wash(ctx, plate.w * 0.78, plate.h * 0.7, env.S * 0.6, pal.soft[1] || pal.soft[0], 0.4 * st.washStrength);
    }
    /* scrim so the pasted scraps sit on something calm — pitched against
       the stock, not the page, or a dark palette lays black over a light
       photograph and pulls it back into the murk */
    if (st.scrim > 0.01) {
      var g = vertical
        ? ctx.createLinearGradient(0, 0, tearAt, 0)
        : ctx.createLinearGradient(0, 0, 0, tearAt);
      var sc = U.luma(stock) < 0.5 ? '#101018' : '#ffffff';
      g.addColorStop(0, U.rgba(sc, st.scrim * 0.5));
      g.addColorStop(0.5, U.rgba(sc, 0));
      g.addColorStop(1, U.rgba(sc, st.scrim * 0.4));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, plate.w, plate.h);
    }
    ctx.restore();

    /* the tear's shadow — sells the collage */
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    /* The band *between* the tear and a copy of it shifted along: two
       paths from the same seed jag identically, so an even-odd fill of
       both leaves a shadow of even thickness hugging the edge — and none
       of it lands on the photograph. */
    var off = u(16);
    tornPath(ctx, w, h, tearAt + off, vertical, U.rng(env.seedNum + 7), amp);
    tornPath(ctx, w, h, tearAt, vertical, U.rng(env.seedNum + 7), amp, true);
    ctx.fill('evenodd');
    ctx.restore();

    /* ---- lyric scraps pasted on the photo ---- */
    var frags = scraps(c.caption, env.micro ? 0 : wide ? 5 : 4);
    /* spread across the corners of the photo, well clear of each other */
    var top = env.band.top / h;
    /* spots are fractions of the photograph, never of the page — pinned to
       the page they slid off the picture onto the paper beside the tear */
    var spots = vertical
      ? [[0.3, 0.16, -2], [0.66, 0.34, 2], [0.26, 0.56, 1.6], [0.62, 0.76, -1.6], [0.34, 0.92, 1]]
          .map(function (s) { return [(tearAt / w) * s[0], s[1], s[2]]; })
      : [[0.27, top + 0.02, -2], [0.74, top + 0.11, 2],
         [0.24, tearAt / h - 0.14, 1.6], [0.75, tearAt / h - 0.05, -1.6]];
    /* every other scrap is torn off a strip of coloured tape — the page,
       the photograph and the script are all one hue by construction, so
       this is where the palette's accent gets to exist */
    frags.forEach(function (f, i) {
      if (i >= spots.length) return;
      var sp = spots[i];
      var tape = i % 2 === 1;
      chip(env, f, w * sp[0], h * sp[1], {
        size: mic * 1.18, font: st.bodyFont, rot: sp[2],
        paper: tape ? hot : pal.base, ink: tape ? U.onColor(hot) : accent
      });
    });

    /* ---- the script headline owns whatever paper the tear left ---- */
    var footRail = env.micro ? 0 : mic * 2.6;
    /* the paper: below a horizontal tear, beside a vertical one */
    var pap = vertical
      ? { x: tearAt + u(54), y: env.band.top, w: w - tearAt - u(108), h: env.band.bottom - env.band.top }
      : {
        x: u(44), y: tearAt + u(30), w: w - u(88),
        h: h - footRail - u(env.micro ? 40 : 70) - tearAt
      };
    var chipY = pap.y + pap.h + mic * 0.6;

    var hlBox = { x: pap.x, y: pap.y, w: pap.w };
    var hlMaxH = pap.h - (vertical ? mic * 3.4 : env.micro ? mic * 0.6 : mic * 2.6);

    var txt = PO.headlineText(env);
    /* every line in script — the reference sets the whole phrase that way */
    var hl = PO.headline(env, hlBox, {
      style: 'capsScript', text: { lines: txt.lines, eyebrow: '' },
      align: 'center', color: accent, maxH: hlMaxH, measure: true
    });
    /* centre the lockup in the paper area */
    hlBox.y = pap.y + Math.max(0, (hlMaxH - hl.h) * (vertical ? 0.4 : 0.44));
    PO.headline(env, hlBox, {
      style: 'capsScript', text: { lines: txt.lines, eyebrow: '' },
      align: 'center', color: accent, maxH: hlMaxH
    });

    /* small pasted chips punctuating the script, like "in" "my" */
    var chipRow = Math.min(hlBox.y + hl.h + mic * 2.2, chipY - mic * 1.4);
    var cxA = vertical ? pap.x + pap.w * 0.28 : w * 0.27;
    var cxB = vertical ? pap.x + pap.w * 0.74 : w * 0.73;
    if (!env.micro && st.showNames && c.names) {
      chip(env, c.names, cxA, chipRow, {
        size: mic * 1.1, font: st.bodyFont, rot: -1.5, paper: hot, ink: U.onColor(hot)
      });
    }
    if (!env.micro && c.footnote) {
      chip(env, c.footnote, cxB, chipRow, {
        size: mic * 1.1, font: st.bodyFont, rot: 1.5, paper: pal.base, ink: accent
      });
    }

    /* ---- foot rail ---- */
    if (!env.micro) {
      PO.tagRail(env, h - u(40), {
        size: mic * 0.86, alpha: 0.55,
        m: vertical ? { left: pap.x, right: w - pap.x - pap.w, inner: pap.w } : null
      });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'lyric',
    label: 'Lyric',
    blurb: '찢어 붙인 사진 + 아래를 꽉 채우는 필기체 가사.',
    defaults: {
      titleFont: 'birthstone', scriptFont: 'playball', bodyFont: 'spacegrotesk',
      headlineStyle: 'capsScript',
      photoShape: 'rect', tone: 'halftone', halftoneCells: 78,
      feather: 0, bleed: false, burst: false, scrim: 0.24,
      motifs: ['sparkle'], decoCount: 0, grain: 1.5, vignette: 0.04
    },
    draw: draw
  });
})(window.PT = window.PT || {});
