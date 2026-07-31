/* LYRIC — a torn photograph across the top, a huge script headline
   filling the paper below, and the caption cut into little boxed lyric
   scraps pasted over the picture.
   Reference grammar: the "You'll Be In My Heart" lyric poster. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  /* Ragged tear line across the canvas at height `y`. */
  function tornEdge(ctx, w, y, rand, amp) {
    ctx.moveTo(-4, y);
    var steps = 42;
    for (var i = 1; i <= steps; i++) {
      var x = (i / steps) * (w + 8) - 4;
      ctx.lineTo(x, y + (rand() - 0.5) * amp * (rand() > 0.86 ? 2.2 : 1));
    }
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

    /* ---- paper ---- */
    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    /* ---- the photograph, torn off mid-page ---- */
    var tearY = h * (wide ? 0.58 : env.tier === 'tablet' || env.tier === 'square' ? 0.5 : 0.54);
    var photoTop = st.bleed ? 0 : 0;
    var plate = { x: 0, y: photoTop, w: w, h: tearY - photoTop + u(30) };

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, tearY + u(26));
    tornEdge(ctx, w, tearY, U.rng(env.seedNum + 7), u(22));
    /* clip: everything above the tear line */
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(w + 4, -4);
    ctx.lineTo(w + 4, tearY);
    var r1 = U.rng(env.seedNum + 7);
    var steps = 44;
    for (var i = steps; i >= 0; i--) {
      var x = (i / steps) * (w + 8) - 4;
      ctx.lineTo(x, tearY + (r1() - 0.5) * u(24) * (r1() > 0.86 ? 2.2 : 1));
    }
    ctx.closePath();
    ctx.clip();

    if (env.hasPhoto) {
      env.drawPhoto(plate);
    } else {
      ctx.fillStyle = U.mix(pal.duo[0], pal.base, 0.25);
      ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
      P.wash(ctx, w * 0.35, tearY * 0.45, env.S * 0.8, pal.soft[0], 0.5 * st.washStrength);
      P.wash(ctx, w * 0.78, tearY * 0.7, env.S * 0.6, pal.soft[1] || pal.soft[0], 0.4 * st.washStrength);
    }
    /* scrim so the pasted scraps sit on something calm */
    if (st.scrim > 0.01) {
      var g = ctx.createLinearGradient(0, 0, 0, tearY);
      var sc = U.luma(pal.duo[0]) < 0.5 ? '#101018' : '#ffffff';
      g.addColorStop(0, U.rgba(sc, st.scrim * 0.5));
      g.addColorStop(0.5, U.rgba(sc, 0));
      g.addColorStop(1, U.rgba(sc, st.scrim * 0.4));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, tearY);
    }
    ctx.restore();

    /* the tear's shadow — sells the collage */
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    var r2 = U.rng(env.seedNum + 7);
    ctx.moveTo(-4, tearY + u(10));
    for (var j = 0; j <= 44; j++) {
      var xx = (j / 44) * (w + 8) - 4;
      ctx.lineTo(xx, tearY + u(10) + (r2() - 0.5) * u(24) * (r2() > 0.86 ? 2.2 : 1));
    }
    ctx.lineTo(w + 4, tearY + u(26));
    ctx.lineTo(-4, tearY + u(26));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* ---- lyric scraps pasted on the photo ---- */
    var onPhoto = U.luma(pal.duo[0]) < 0.5 ? '#ffffff' : pal.base;
    var frags = scraps(c.caption, env.micro ? 0 : wide ? 5 : 4);
    /* spread across the corners of the photo, well clear of each other */
    var top = env.band.top / h;
    var spots = wide
      ? [[0.16, 0.16, -2], [0.84, 0.2, 2], [0.18, 0.72, 1.5], [0.84, 0.68, -1.5], [0.5, 0.44, 1]]
      : [[0.27, top + 0.02, -2], [0.74, top + 0.11, 2],
         [0.24, tearY / h - 0.14, 1.6], [0.75, tearY / h - 0.05, -1.6]];
    frags.forEach(function (f, i) {
      if (i >= spots.length) return;
      var sp = spots[i];
      chip(env, f, w * sp[0], h * sp[1], {
        size: mic * 1.18, font: st.bodyFont, rot: sp[2],
        paper: pal.base, ink: accent
      });
    });

    /* ---- the script headline owns the paper below ---- */
    var footRail = env.micro ? 0 : mic * 2.6;
    var hlBox = {
      x: u(44),
      y: tearY + u(60),
      w: w - u(88)
    };
    var hlMaxH = h - m0() - hlBox.y;
    function m0() { return footRail + u(50); }

    var txt = PO.headlineText(env);
    /* every line in script — the reference sets the whole phrase that way */
    var hl = PO.headline(env, hlBox, {
      style: 'capsScript', text: { lines: txt.lines, eyebrow: '' },
      align: 'center', color: accent, maxH: hlMaxH, measure: true
    });
    /* centre the lockup in the paper area */
    hlBox.y = tearY + u(30) + Math.max(0, (h - footRail - u(40) - (tearY + u(30)) - hl.h) * 0.44);
    PO.headline(env, hlBox, {
      style: 'capsScript', text: { lines: txt.lines, eyebrow: '' },
      align: 'center', color: accent, maxH: hlMaxH
    });

    /* small pasted chips punctuating the script, like "in" "my" */
    if (!env.micro && st.showNames && c.names) {
      chip(env, c.names, w * 0.27, hlBox.y + hl.h + mic * 2.2, {
        size: mic * 1.1, font: st.bodyFont, rot: -1.5, paper: pal.base, ink: accent
      });
    }
    if (!env.micro && c.footnote) {
      chip(env, c.footnote, w * 0.73, hlBox.y + hl.h + mic * 2.2, {
        size: mic * 1.1, font: st.bodyFont, rot: 1.5, paper: pal.base, ink: accent
      });
    }

    /* ---- foot rail ---- */
    if (!env.micro) {
      PO.tagRail(env, h - u(40), { size: mic * 0.86, alpha: 0.55 });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'lyric',
    label: 'Lyric',
    blurb: '찢어 붙인 사진 + 아래를 꽉 채우는 필기체 가사.',
    defaults: {
      titleFont: 'playfair', scriptFont: 'birthstone', bodyFont: 'spacegrotesk',
      headlineStyle: 'capsScript',
      photoShape: 'rect', tone: 'halftone', halftoneCells: 78,
      feather: 0, bleed: false, burst: false, scrim: 0.24,
      motifs: ['sparkle'], decoCount: 0, grain: 1.5, vignette: 0.04
    },
    draw: draw
  });
})(window.PT = window.PT || {});
