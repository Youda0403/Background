/* LYRIC — a torn photograph, the caption cut into pasted paper scraps,
   and a script headline set big enough to carry the paper it is torn onto.

   Reference grammar: the "You'll Be In My Heart" lyric poster and the
   torn-collage record inserts. The previous version had the right parts
   and no density: a picture, one word of script, and two large empty
   fields. The rules here are the ones those references actually follow.

     1. The script STRADDLES the tear. Type that begins tidily below the
        edge divides the page into two rectangles; type that climbs over
        it makes one page.
     2. The scraps are a COLUMN, not a scatter — a shared left edge and a
        steady rhythm down the picture. Scattered, four little boxes read
        as litter; aligned, they read as a paste-up.
     3. The paper under the script carries a rule and two lines of small
        tracked caps. That is what stops it being a blank half.
     4. Nothing is ever simply dropped when the canvas gets small. A watch
        face gets fewer scraps and a packed foot line, not silence. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  /* One point on a ragged tear. */
  function jag(rand, amp) {
    return (rand() - 0.5) * amp * (rand() > 0.86 ? 2.2 : 1);
  }

  /* The torn keep-region: everything above a horizontal tear at `at`, or
     everything left of a vertical one. */
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

  /* Cut a phrase into 2–4 word scraps. */
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

  /* A pasted label: shadow, stock, hairline, text. */
  function chip(env, text, x, y, opts) {
    var ctx = env.ctx, u = env.u;
    var size = opts.size;
    T.setFont(ctx, opts.font, size, { weight: 500 });
    var maxW = opts.maxW || Infinity;
    /* a scrap of paper never runs off the sheet it is pasted to */
    while (size > opts.size * 0.55
      && T.measure(ctx, text, size * 0.03) + size * 1.1 > maxW) {
      size *= 0.94;
      T.setFont(ctx, opts.font, size, { weight: 500 });
    }
    var tw = T.measure(ctx, text, size * 0.03);
    var padX = size * 0.55, padY = size * 0.42;
    var bw = tw + padX * 2, bh = size + padY * 2;

    ctx.save();
    ctx.translate(x + bw / 2, y + bh / 2);
    ctx.rotate((opts.rot || 0) * Math.PI / 180);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.fillRect(-bw / 2 + u(4), -bh / 2 + u(5), bw, bh);
    ctx.globalAlpha = 1;
    ctx.fillStyle = opts.paper;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = opts.ink;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1, u(1.2));
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.globalAlpha = 1;
    ctx.fillStyle = opts.ink;
    T.setFont(ctx, opts.font, size, { weight: 500 });
    T.draw(ctx, text, 0, size * 0.36, { align: 'center', tracking: size * 0.03 });
    ctx.restore();
    return { w: bw, h: bh };
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var m = PO.margins(env);

    /* The photograph is a piece of printed paper torn off the page, so it
       carries its own stock — light even when the page is dark, or the
       whole top of the wallpaper is a black rectangle on a black page. */
    var sheet = PO.stock(pal);
    var stock = sheet.paper;
    var accent = PO.accentOn(pal, pal.base);
    var script = pal.inks[0];

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    /* ---------- how much paper the script actually needs ----------
       A fixed tear line is why the old version had a void: the script was
       whatever size its measure allowed, and the gap between it and the
       foot rail was whatever was left over. Measure the lockup first and
       put the tear where the paper ends up exactly as tall as the type
       and its furniture, so the picture takes everything else. */
    var vertical = wide;

    /* No eyebrow over the script: a line seated just above a lockup whose
       ascenders deliberately climb over the tear has nowhere to be. The
       names go on the rule instead, where they read cleanly. */
    var eyebrowH = 0;
    var railH = env.micro ? 0 : mic * 2.3;
    var tagH = (!env.micro && st.showTags && c.tags.length) ? mic * 2.0 : 0;
    var footH = railH + tagH;
    var straddle = vertical ? 0 : mic * (env.micro ? 1.0 : 1.9);

    var papW = vertical ? w * 0.5 - m.right - u(56) : m.inner;
    var txt = PO.headlineText(env);
    var probe = PO.headline(env, { x: 0, y: 0, w: papW - mic * 1.8 }, {
      style: 'capsScript', text: { lines: txt.lines, eyebrow: '' },
      align: 'center', maxH: h * 0.44, measure: true
    });

    /* Half the dock band, not all of it: the fine print at the foot is
       exactly the sort of thing that belongs behind a row of icons, and
       clearing the whole band left a sixth of the page visibly blank. */
    var papBottom = h - Math.max(u(52), (h - env.band.bottom) * 0.5);
    var need = eyebrowH + probe.h + mic * 1.1 + footH;
    var tearAt = vertical
      ? w * 0.5
      : U.clamp(papBottom - need + straddle,
        h * (env.micro ? 0.4 : 0.44), h * (env.micro ? 0.56 : 0.72));

    var amp = u(22);
    var plate = vertical
      ? { x: 0, y: 0, w: tearAt + u(30), h: h }
      : { x: 0, y: 0, w: w, h: tearAt + u(30) };

    ctx.save();
    tornPath(ctx, w, h, tearAt, vertical, U.rng(env.seedNum + 7), amp);
    ctx.clip();
    ctx.fillStyle = stock;
    ctx.fillRect(-4, -4, plate.w + 8, plate.h + 8);
    if (env.hasPhoto) {
      env.drawPhoto(plate, stock);
    } else {
      ctx.fillStyle = U.mix(stock, pal.duo[0], 0.16);
      ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
      P.wash(ctx, plate.w * 0.32, plate.h * 0.4, env.S * 0.85, pal.soft[0], 0.55 * st.washStrength);
      P.wash(ctx, plate.w * 0.8, plate.h * 0.75, env.S * 0.65, pal.soft[1] || pal.soft[0], 0.45 * st.washStrength);
    }
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

    /* the tear's shadow: the band between the edge and a copy of it shifted
       along, both jagged from the same seed so it is of even thickness */
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    tornPath(ctx, w, h, tearAt + u(16), vertical, U.rng(env.seedNum + 7), amp);
    tornPath(ctx, w, h, tearAt, vertical, U.rng(env.seedNum + 7), amp, true);
    ctx.fill('evenodd');
    ctx.restore();

    /* ---------- the paper the script is torn onto ---------- */
    var pap = vertical
      ? { x: tearAt + u(56), y: m.top, w: papW, h: env.band.bottom - m.top }
      : { x: m.left, y: tearAt, w: papW, h: papBottom - tearAt };

    /* ---------- the script, straddling the tear ---------- */
    var hlTop = pap.y - straddle + eyebrowH;
    /* A script's swashes overhang its advance width, so a lockup fitted
       exactly to the measure prints a few pixels off the page. Give it a
       margin of its own rather than trusting the fit. */
    var swash = mic * 0.9;
    var hlBox = { x: pap.x + swash, y: hlTop, w: pap.w - swash * 2 };
    var hlMaxH = Math.max(u(120), (pap.y + pap.h) - footH - mic * 0.8 - hlTop);

    var hl = PO.headline(env, hlBox, {
      style: 'capsScript', text: { lines: txt.lines, eyebrow: '' },
      align: 'center', color: script, maxH: hlMaxH, measure: true
    });
    /* seat the lockup in its share of the paper, biased up so its
       ascenders reach across the torn edge */
    var slack = Math.max(0, hlMaxH - hl.h);
    hlBox.y = hlTop + slack * 0.34;

    PO.headline(env, hlBox, {
      style: 'capsScript', text: { lines: txt.lines, eyebrow: '' },
      align: 'center', color: script, maxH: hlMaxH
    });

    /* ---------- the rule and the two lines of small caps ---------- */
    if (!env.micro) {
      var ruleY = pap.y + pap.h - footH + mic * 0.2;
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, u(2));
      ctx.beginPath();
      ctx.moveTo(pap.x, ruleY);
      ctx.lineTo(pap.x + pap.w, ruleY);
      ctx.stroke();
      ctx.restore();

      PO.rail(env, ruleY + mic * 1.35, [
        (st.showNames && c.names) || W.textstack.monogram(st) || null,
        null, c.footnote || null
      ], {
        m: { left: pap.x, right: w - pap.x - pap.w, inner: pap.w },
        size: mic * 0.8, alpha: 0.72
      });
      if (tagH) {
        PO.tagRail(env, ruleY + mic * (1.35 + 1.5), {
          m: { left: pap.x, right: w - pap.x - pap.w, inner: pap.w },
          size: mic * 0.8, alpha: 0.6
        });
      }
    }

    /* ---------- the caption, cut into scraps down the picture ---------- */
    /* A column, not a scatter: one left edge, one rhythm. Four little
       boxes thrown about a photograph read as litter. */
    var maxScraps = env.micro ? 2 : vertical ? 4 : 3;
    var frags = scraps(c.caption, maxScraps);
    if (!frags.length && c.footnote) frags = [c.footnote];

    if (frags.length) {
      var colX = vertical ? u(52) : m.left;
      var colW = vertical ? tearAt - u(104) : m.inner * 0.62;
      /* start below the clock band, finish clear of the tear */
      var runTop = Math.max(env.band.top, vertical ? h * 0.16 : h * 0.08) + mic * 0.6;
      /* stop short of the straddle zone: the script climbs back over the
         tear, and a scrap pasted there is underneath it */
      var runBottom = (vertical ? h * 0.9 : tearAt - straddle) - mic * 3.4;
      /* spread down the whole picture; bunched at the top they read as a
         caption that ran out of room */
      var step = frags.length > 1 ? (runBottom - runTop) / (frags.length - 1) : 0;
      var runY = runTop;

      frags.forEach(function (f, i) {
        var tape = i % 2 === 1;
        /* a slight, alternating indent keeps the column from looking
           mechanical without breaking its left edge */
        var indent = (i % 2) * mic * 1.6;
        chip(env, f, colX + indent, runY + step * i, {
          size: mic * 1.12, font: st.bodyFont, rot: i % 2 ? 1.2 : -1.2,
          maxW: colW - indent,
          paper: tape ? accent : stock,
          ink: tape ? U.onColor(accent) : sheet.ink
        });
      });
    }

    /* ---------- a watch face still says everything ---------- */
    if (env.micro) PO.microFoot(env, { m: m });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'lyric',
    label: 'Lyric',
    blurb: '찢어 붙인 사진 + 종이를 꽉 채우는 필기체 가사.',
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
