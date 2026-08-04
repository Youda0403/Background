/* ZINE — photocopied record sleeve. Heavy grain, halftone plate, barcode
   and numeral rails, a struck-through script title and a big rotated
   date up the right edge.
   Reference grammar: risograph song sleeves and department-store flyers. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  /* Own rng: the bar widths clamp to whole pixels, so driving this from
     the shared stream would desync the preview from the export.
     Vertical: horizontal bars stacked down a tall column, like the spine
     barcode on the reference sleeve. */
  function barcodeV(ctx, x, y, w, h, seedRand, color, alpha) {
    var rand = U.rng(Math.floor(seedRand() * 1e9));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    var cy = y;
    while (cy < y + h - 2) {
      var bh = Math.max(1, (0.15 + rand() * 0.5) * (h / 26));
      ctx.fillRect(x, cy, w, bh);
      cy += bh + Math.max(1, (0.2 + rand() * 0.45) * (h / 26));
    }
    ctx.restore();
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content, rand = env.rand;

    PO.paper(env, { tint: true });
    var m = PO.margins(env);
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';

    /* ---- headline, struck through like a rubber stamp ---- */
    var hlBox = { x: m.left, y: m.top + mic * 0.6, w: m.inner * (wide ? 0.52 : 0.94) };
    /* a sleeve is mostly artwork: the title takes a quarter, no more */
    var hlMaxH = (h - m.top - m.bottom) * (wide ? 0.4 : 0.26);
    var hl = PO.headline(env, hlBox, { align: 'left', style: 'scriptSans', l2Weight: 600, maxH: hlMaxH });

    if (st.strike && hl.h) {
      ctx.save();
      /* the second plate of a two-colour riso print: the strike, the
         bracket corners and the release line all run in the accent, which
         is the only colour a halftone photo cannot supply */
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = pal.accent || pal.text;
      ctx.lineWidth = Math.max(1, u(2.6));
      var sy = hl.y + hl.h * 0.24;
      ctx.beginPath();
      ctx.moveTo(m.left, sy);
      ctx.lineTo(m.left + hl.w * 0.98, sy);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- halftone plate, with a spine rail on its left ---- */
    var railW = wide || env.micro ? 0 : mic * 3.4;
    /* the release line runs up the right edge, so it gets a column of its
       own — printed over the plate it vanished on any palette whose text
       colour matched the ink the photo was screened in */
    var dateW = (c.footnote && !env.micro) ? mic * 2.2 : 0;
    var footH = mic * 6.4;
    var plate;
    if (wide) {
      /* Two columns. Stacking the plate under the headline is right on a
         page that is taller than it is wide; on a 3:1 header the headline
         takes half the measure and everything to the right of it is empty
         — a third of the page in one unbroken rectangle, which stops
         reading as air and starts reading as something that failed to
         draw. Putting the words in a column of their own leaves no hole to
         fill, whether or not there is a caption to fill it with. */
      var px = m.left + hlBox.w + u(60);
      plate = {
        x: px, y: m.top + mic * 0.6,
        w: w - m.right - dateW - px,
        h: h - m.bottom - footH - (m.top + mic * 0.6)
      };
    } else {
      var plateLeft = m.left + railW;
      var top = hl.bottom + u(46);
      plate = { x: plateLeft, y: top, w: w - m.right - dateW - plateLeft, h: h - m.bottom - footH - top };
      /* a sleeve plate is never taller than a 4:5 portrait */
      if (plate.h > plate.w * 1.25) plate.h = plate.w * 1.25;
    }

    /* the rail runs the plate's full height: barcode above, digits below,
       so the left edge is furniture rather than a gutter */
    if (railW) {
      var railX = m.left;
      var bcH = plate.h * 0.34;
      barcodeV(ctx, railX, plate.y, mic * 2.3, bcH, rand, pal.text, 0.85 * env.decoAlpha);
      var digits = '0123456789012345678901';
      var dSize = mic * 1.12;
      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.8;
      T.setFont(ctx, 'dmmono', dSize, {});
      ctx.translate(railX + dSize * 0.95, plate.y + bcH + mic * 1.4);
      ctx.rotate(Math.PI / 2);
      /* run the digit tape down to the plate's foot, clipped to fit */
      var tape = digits;
      while (T.measure(ctx, tape, dSize * 0.5) > plate.h - bcH - mic * 2 && tape.length > 4) {
        tape = tape.slice(0, -1);
      }
      T.draw(ctx, tape, 0, 0, { align: 'left', tracking: dSize * 0.5 });
      ctx.restore();
    }

    if (plate.h > u(140)) {
      if (env.hasPhoto) {
        env.drawPhoto(plate);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.45 * st.washStrength;
        ctx.fillStyle = pal.soft[0];
        ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
        ctx.restore();
      }
      /* bracket corners rather than a full box */
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = pal.accent || pal.text;
      ctx.lineWidth = Math.max(1, u(2.6));
      var L = u(56);
      ctx.beginPath();
      ctx.moveTo(plate.x, plate.y + L); ctx.lineTo(plate.x, plate.y); ctx.lineTo(plate.x + L, plate.y);
      ctx.moveTo(plate.x + plate.w - L, plate.y + plate.h); ctx.lineTo(plate.x + plate.w, plate.y + plate.h);
      ctx.lineTo(plate.x + plate.w, plate.y + plate.h - L);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- rotated release line up the right edge ---- */
    if (c.footnote && !env.micro) {
      var rSize = Math.min(u(58), plate.h * 0.1, dateW * 0.92);
      ctx.save();
      ctx.fillStyle = pal.accent || pal.text;
      ctx.globalAlpha = 0.95;
      T.setFont(ctx, st.titleFont, rSize, { weight: 600 });
      ctx.translate(w - m.right - dateW * 0.5 + rSize * 0.34, plate.y + plate.h * 0.5);
      ctx.rotate(Math.PI / 2);
      T.draw(ctx, c.footnote, 0, 0, { align: 'center', tracking: rSize * 0.01 });
      ctx.restore();
    }

    /* ---- outlined bursts over the print ---- */
    PO.accents(env, plate, {
      rMin: 22, rMax: 62, outline: true, kinds: st.motifs, speckle: st.glitter
    });

    /* ---- caption: at the foot on a tall page, beside the headline on a
       wide one. A sleeve headline takes only the left half of a wide
       canvas and the plate starts below it, which leaves the whole top
       right of a 3:1 header empty — a third of the page in one unbroken
       rectangle, which stops reading as air and starts reading as
       something that failed to draw. ---- */
    var ruleY = h - m.bottom - mic * 1.7;
    if (c.caption && !env.micro) {
      var capW = wide ? hlBox.w : m.inner * 0.72;
      var capH = PO.block(env, 0, 0, capW, [c.caption], {
        size: mic * 0.98, lead: 1.45, measure: true, font: st.bodyFont
      });
      var capX = m.left;
      var capY = wide ? hl.bottom + u(50) : ruleY - mic * 0.9 - capH;
      PO.block(env, capX, capY, capW, [c.caption], {
        size: mic * 0.98, lead: 1.45, alpha: 0.85, font: st.bodyFont, upper: false
      });
    }
    ctx.save();
    ctx.globalAlpha = 0.35 * env.decoAlpha;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = Math.max(1, u(1.4));
    ctx.beginPath();
    ctx.moveTo(m.left, ruleY);
    ctx.lineTo(w - m.right, ruleY);
    ctx.stroke();
    ctx.restore();

    /* A watch face has room for one rail, not two stacked on the same
       baseline: the credits and the tags used to print straight through
       each other into nonsense. */
    if (env.micro) {
      PO.microFoot(env, { m: m, y: h - m.bottom + mic * 0.1, alpha: 0.8 });
    } else {
      PO.rail(env, h - m.bottom + mic * 0.1, [
        (c.names || W.textstack.monogram(st)).toLowerCase(), null, 'pairtone'
      ], { m: m, size: mic * 0.92, alpha: 0.75 });
      PO.tagRail(env, h - m.bottom + mic * 0.1, { m: m, size: mic * 0.9, alpha: 0.55 });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'zine',
    label: 'Zine',
    blurb: '복사기 감성 레코드 슬리브. 망점 + 바코드.',
    deco: true,
    defaults: {
      titleFont: 'bricolage', scriptFont: 'parisienne', bodyFont: 'dmmono',
      headlineStyle: 'scriptSans',
      photoShape: 'rect', tone: 'halftone',
      halftoneCells: 58, feather: 0,
      strike: true, grain: 1.7, motifs: ['burst', 'burst4'], vignette: 0.08
    },
    draw: draw
  });
})(window.PT = window.PT || {});
